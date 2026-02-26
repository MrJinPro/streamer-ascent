import {
  adminClient,
  corsHeaders,
  enforceAdminRateLimit,
  json,
  resolveRequester,
  userCanManageUsers,
} from '../_shared/auth.ts';

type AdminUserRow = {
  id: string;
  email: string | null;
  name: string;
  avatar_url: string | null;
  created_at: string;
  is_online: boolean;
  source: string[];
};

const mergeSource = (value: string[], source: string) => (value.includes(source) ? value : [...value, source]);

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const requesterResult = await resolveRequester(request);
  if (requesterResult.error) return requesterResult.error;
  const requester = requesterResult.user;

  const authz = await userCanManageUsers(requester.id);
  if (!authz.allowed) {
    return json(403, { error: 'Insufficient permissions' });
  }

  const rateLimit = await enforceAdminRateLimit(requester.id, 'admin.list_users', 30);
  if (!rateLimit.ok) {
    return json(429, { error: rateLimit.error });
  }

  const [authUsersRes, profilesRes, usersRes] = await Promise.all([
    adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    adminClient
      .from('profiles')
      .select('user_id,email,display_name,username,avatar_url,created_at,is_online')
      .order('created_at', { ascending: false }),
    adminClient
      .from('users')
      .select('id,supabase_uid,email,username,tiktok_username,created_at,last_ws_at')
      .order('created_at', { ascending: false }),
  ]);

  if (authUsersRes.error) {
    return json(500, { error: authUsersRes.error.message });
  }

  const registry = new Map<string, AdminUserRow>();

  for (const item of authUsersRes.data?.users ?? []) {
    const createdAt = item.created_at ?? new Date().toISOString();
    const email = item.email?.toLowerCase() ?? null;
    const name =
      String(item.user_metadata?.display_name ?? '').trim() ||
      String(item.user_metadata?.full_name ?? '').trim() ||
      String(item.user_metadata?.name ?? '').trim() ||
      (email ? email.split('@')[0] : `user_${item.id.slice(0, 8)}`);

    registry.set(item.id, {
      id: item.id,
      email,
      name,
      avatar_url:
        (item.user_metadata?.avatar_url as string | undefined) ??
        (item.user_metadata?.picture as string | undefined) ??
        null,
      created_at: createdAt,
      is_online: false,
      source: ['auth.users'],
    });
  }

  for (const profile of profilesRes.data ?? []) {
    const existing = registry.get(profile.user_id);
    if (!existing) {
      registry.set(profile.user_id, {
        id: profile.user_id,
        email: profile.email,
        name: profile.display_name ?? profile.username ?? profile.email?.split('@')[0] ?? 'Пользователь',
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        is_online: profile.is_online ?? false,
        source: ['public.profiles'],
      });
      continue;
    }

    existing.email = existing.email ?? profile.email;
    existing.name = profile.display_name ?? profile.username ?? existing.name;
    existing.avatar_url = profile.avatar_url ?? existing.avatar_url;
    existing.created_at = profile.created_at ?? existing.created_at;
    existing.is_online = Boolean(profile.is_online) || existing.is_online;
    existing.source = mergeSource(existing.source, 'public.profiles');
  }

  for (const userRow of usersRes.data ?? []) {
    const id = userRow.supabase_uid ?? userRow.id;
    const existing = registry.get(id);
    const fallbackName = userRow.username ?? userRow.tiktok_username ?? userRow.email?.split('@')[0] ?? 'Пользователь';

    if (!existing) {
      registry.set(id, {
        id,
        email: userRow.email,
        name: fallbackName,
        avatar_url: null,
        created_at: userRow.created_at ?? new Date().toISOString(),
        is_online: Boolean(userRow.last_ws_at),
        source: ['public.users'],
      });
      continue;
    }

    existing.email = existing.email ?? userRow.email;
    existing.name = existing.name || fallbackName;
    existing.created_at = existing.created_at || userRow.created_at || new Date().toISOString();
    existing.is_online = existing.is_online || Boolean(userRow.last_ws_at);
    existing.source = mergeSource(existing.source, 'public.users');
  }

  const users = Array.from(registry.values()).sort((left, right) =>
    right.created_at.localeCompare(left.created_at),
  );

  return json(200, { ok: true, users });
});
