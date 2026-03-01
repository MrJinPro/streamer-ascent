/// <reference path="../esm-shims.d.ts" />
/// <reference path="../deno-globals.d.ts" />
import { adminClient, corsHeaders, json, resolveRequester } from '../_shared/auth.ts';

declare const Deno: any;

type Payload = {
  targetUserId?: string;
};

const ROLE_PRIORITY: Record<string, number> = {
  owner: 1,
  admin: 2,
  developer: 3,
  senior_curator: 4,
  manager: 5,
  curator: 6,
  moderator: 7,
  support: 8,
  investor: 9,
  streamer: 10,
};

const normalizeRole = (value: unknown): string => {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return 'streamer';
  if (raw === 'system_owner') return 'owner';
  if (raw === 'architect') return 'admin';
  if (raw === 'engineer') return 'developer';
  if (raw === 'head_mentor') return 'senior_curator';
  if (raw === 'mentor') return 'curator';
  if (raw === 'agency_manager') return 'manager';
  if (raw === 'investor_viewer' || raw === 'investor_pro' || raw === 'board') return 'investor';
  return raw;
};

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const resolveRole = async (userId: string) => {
  const [{ data: roleRows }, { data: usersRows }] = await Promise.all([
    adminClient
      .from('user_roles')
      .select('role,roles:role_id(slug)')
      .eq('user_id', userId),
    adminClient
      .from('users')
      .select('role,supabase_uid,id')
      .or(`supabase_uid.eq.${userId},id.eq.${userId}`)
      .limit(1),
  ]);

  const safeRoleRows = (roleRows ?? []) as any[];
  const fromUserRoles = safeRoleRows.reduce<string | null>((acc: string | null, row: any) => {
    const candidate = normalizeRole(row?.roles?.slug ?? row?.role);
    if (!acc) return candidate;
    return (ROLE_PRIORITY[candidate] ?? 99) < (ROLE_PRIORITY[acc] ?? 99) ? candidate : acc;
  }, null);

  if (fromUserRoles) return fromUserRoles;
  return normalizeRole(usersRows?.[0]?.role ?? 'streamer');
};

const canDm = async (senderId: string, targetId: string) => {
  if (senderId === targetId) return false;

  const [senderRole, targetRole] = await Promise.all([resolveRole(senderId), resolveRole(targetId)]);

  if (senderRole === 'support' || targetRole === 'support') return true;
  if (senderRole === 'streamer' && targetRole === 'streamer') return true;

  if (
    (senderRole === 'curator' && targetRole === 'streamer')
    || (senderRole === 'streamer' && targetRole === 'curator')
  ) {
    const { data: assignments, error } = await adminClient
      .from('curator_streamer_assignments')
      .select('id')
      .eq('active', true)
      .or(`and(curator_user_id.eq.${senderId},streamer_user_id.eq.${targetId}),and(curator_user_id.eq.${targetId},streamer_user_id.eq.${senderId})`)
      .limit(1);

    if (error) return false;
    return (assignments?.length ?? 0) > 0;
  }

  return true;
};

const resolveProfileUserId = async (inputId: string) => {
  const { data: profile } = await adminClient
    .from('profiles')
    .select('user_id')
    .eq('user_id', inputId)
    .maybeSingle();

  if (profile?.user_id) return profile.user_id as string;

  const { data: usersRows } = await adminClient
    .from('users')
    .select('id,supabase_uid')
    .or(`id.eq.${inputId},supabase_uid.eq.${inputId}`)
    .limit(1);

  const resolved = usersRows?.[0]?.supabase_uid ?? usersRows?.[0]?.id;
  if (!resolved) return null;

  const { data: resolvedProfile } = await adminClient
    .from('profiles')
    .select('user_id')
    .eq('user_id', resolved)
    .maybeSingle();

  return (resolvedProfile?.user_id as string | null) ?? null;
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const requesterResult = await resolveRequester(request);
  if (requesterResult.error) return requesterResult.error;
  const requester = requesterResult.user;

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const rawTargetId = String(payload.targetUserId ?? '').trim();
  if (!rawTargetId || !isUuid(rawTargetId)) {
    return json(400, { error: 'targetUserId must be uuid' });
  }

  const requesterProfileId = await resolveProfileUserId(requester.id);
  const targetProfileId = await resolveProfileUserId(rawTargetId);

  if (!requesterProfileId || !targetProfileId) {
    return json(400, { error: 'target_user_not_found' });
  }

  const allowed = await canDm(requesterProfileId, targetProfileId);
  if (!allowed) {
    return json(403, { error: 'direct_chat_not_allowed' });
  }

  const directUsers = [requesterProfileId, targetProfileId].sort();
  const directKey = `${directUsers[0]}:${directUsers[1]}`;

  const { data: existingThread } = await adminClient
    .from('chat_threads')
    .select('id')
    .eq('direct_key', directKey)
    .maybeSingle();

  let threadId = existingThread?.id as string | undefined;

  if (!threadId) {
    const { data: createdThread, error: createThreadError } = await adminClient
      .from('chat_threads')
      .insert({
        kind: 'direct',
        direct_key: directKey,
        created_by: requesterProfileId,
      })
      .select('id')
      .single();

    if (createThreadError) {
      return json(500, { error: createThreadError.message });
    }

    threadId = createdThread.id;
  }

  const { error: membersError } = await adminClient
    .from('chat_thread_members')
    .upsert(
      [
        { thread_id: threadId, user_id: requesterProfileId, member_role: 'member', is_active: true },
        { thread_id: threadId, user_id: targetProfileId, member_role: 'member', is_active: true },
      ],
      { onConflict: 'thread_id,user_id' },
    );

  if (membersError) {
    return json(500, { error: membersError.message });
  }

  return json(200, { ok: true, threadId });
});
