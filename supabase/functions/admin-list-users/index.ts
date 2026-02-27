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
  phone: string | null;
  name: string;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
  is_online: boolean;
  source: string[];
};

const mergeSource = (value: string[], source: string) => (value.includes(source) ? value : [...value, source]);

const loadMobileUsers = async () => {
  const selectVariants = [
    'id,supabase_uid,email,username,created_at,last_login_at,last_sign_in_at,last_ws_at',
    'id,supabase_uid,email,username,created_at,last_login_at,last_ws_at',
    'id,supabase_uid,email,username,created_at,last_ws_at',
  ];

  for (const select of selectVariants) {
    const result = await adminClient
      .schema('mobile')
      .from('users')
      .select(select)
      .order('created_at', { ascending: false });

    if (!result.error) {
      return result.data ?? [];
    }
  }

  return [];
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

  const authz = await userCanManageUsers(requester.id, ['users.read']);
  if (!authz.allowed) {
    return json(403, { error: 'Insufficient permissions' });
  }

  const rateLimit = await enforceAdminRateLimit(requester.id, 'admin.list_users', 30);
  if (!rateLimit.ok) {
    return json(429, { error: rateLimit.error });
  }

  const [authUsersRes, profilesRes, usersRes, mobileUsers] = await Promise.all([
    adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    adminClient
      .from('profiles')
      .select('user_id,email,display_name,username,avatar_url,created_at,is_online')
      .order('created_at', { ascending: false }),
    adminClient
      .from('users')
      .select('id,supabase_uid,email,username,tiktok_username,created_at,last_ws_at')
      .order('created_at', { ascending: false }),
    loadMobileUsers(),
  ]);

  if (authUsersRes.error) {
    return json(500, { error: authUsersRes.error.message });
  }

  const registry = new Map<string, AdminUserRow>();

  for (const item of authUsersRes.data?.users ?? []) {
    const createdAt = item.created_at ?? null;
    const email = item.email?.toLowerCase() ?? null;
    const name =
      String(item.user_metadata?.display_name ?? '').trim() ||
      String(item.user_metadata?.full_name ?? '').trim() ||
      String(item.user_metadata?.name ?? '').trim() ||
      (email ? email.split('@')[0] : `user_${item.id.slice(0, 8)}`);

    registry.set(item.id, {
      id: item.id,
      email,
      phone: item.phone ?? null,
      name,
      avatar_url:
        (item.user_metadata?.avatar_url as string | undefined) ??
        (item.user_metadata?.picture as string | undefined) ??
        null,
      created_at: createdAt,
      updated_at: item.updated_at ?? null,
      last_sign_in_at: item.last_sign_in_at ?? null,
      email_confirmed_at: item.email_confirmed_at ?? null,
      banned_until: item.banned_until ?? null,
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
        phone: null,
        name: profile.display_name ?? profile.username ?? profile.email?.split('@')[0] ?? 'Пользователь',
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: null,
        last_sign_in_at: null,
        email_confirmed_at: null,
        banned_until: null,
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
        phone: null,
        name: fallbackName,
        avatar_url: null,
        created_at: userRow.created_at ?? null,
        updated_at: null,
        last_sign_in_at: userRow.last_ws_at ?? null,
        email_confirmed_at: null,
        banned_until: null,
        is_online: Boolean(userRow.last_ws_at),
        source: ['public.users'],
      });
      continue;
    }

    existing.email = existing.email ?? userRow.email;
    existing.name = existing.name || fallbackName;
    existing.created_at = existing.created_at ?? userRow.created_at ?? null;
    existing.last_sign_in_at = existing.last_sign_in_at ?? userRow.last_ws_at ?? null;
    existing.is_online = existing.is_online || Boolean(userRow.last_ws_at);
    existing.source = mergeSource(existing.source, 'public.users');
  }

  for (const mobileUser of mobileUsers ?? []) {
    const id = mobileUser.supabase_uid ?? mobileUser.id;
    const existing = registry.get(id);
    const fallbackName = mobileUser.username ?? mobileUser.email?.split('@')[0] ?? 'Пользователь';
    const mobileLastSignIn = mobileUser.last_sign_in_at ?? mobileUser.last_login_at ?? mobileUser.last_ws_at ?? null;

    if (!existing) {
      registry.set(id, {
        id,
        email: mobileUser.email ?? null,
        phone: null,
        name: fallbackName,
        avatar_url: null,
        created_at: mobileUser.created_at ?? null,
        updated_at: null,
        last_sign_in_at: mobileLastSignIn,
        email_confirmed_at: null,
        banned_until: null,
        is_online: Boolean(mobileUser.last_ws_at),
        source: ['mobile.users'],
      });
      continue;
    }

    existing.email = existing.email ?? mobileUser.email ?? null;
    existing.name = existing.name || fallbackName;
    existing.created_at = existing.created_at ?? mobileUser.created_at ?? null;
    existing.last_sign_in_at = existing.last_sign_in_at ?? mobileLastSignIn;
    existing.is_online = existing.is_online || Boolean(mobileUser.last_ws_at);
    existing.source = mergeSource(existing.source, 'mobile.users');
  }

  const users = Array.from(registry.values()).sort((left, right) => {
    const leftTs = Date.parse(left.created_at ?? '') || 0;
    const rightTs = Date.parse(right.created_at ?? '') || 0;
    return rightTs - leftTs;
  });

  return json(200, { ok: true, users });
});
