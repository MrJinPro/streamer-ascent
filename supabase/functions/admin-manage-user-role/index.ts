import {
  adminClient,
  corsHeaders,
  enforceAdminRateLimit,
  json,
  resolveRequester,
  userCanManageUsers,
} from '../_shared/auth.ts';

type ActionType = 'assign' | 'remove';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const toLegacyAppRole = (slug: string):
  | 'owner'
  | 'admin'
  | 'developer'
  | 'senior_curator'
  | 'manager'
  | 'curator'
  | 'moderator'
  | 'support'
  | 'investor'
  | 'streamer' => {
  const normalized = slug.trim().toLowerCase();

  switch (normalized) {
    case 'system_owner':
      return 'owner';
    case 'owner':
      return 'owner';
    case 'architect':
    case 'admin':
      return 'admin';
    case 'engineer':
    case 'developer':
      return 'developer';
    case 'head_mentor':
    case 'senior_curator':
      return 'senior_curator';
    case 'mentor':
    case 'curator':
      return 'curator';
    case 'agency_manager':
    case 'manager':
      return 'manager';
    case 'moderator':
      return 'moderator';
    case 'support':
      return 'support';
    case 'investor_viewer':
    case 'investor_pro':
    case 'board':
    case 'investor':
      return 'investor';
    default:
      return 'streamer';
  }
};

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

  const authz = await userCanManageUsers(requester.id, ['users.update', 'users.create', 'users.delete']);
  if (!authz.allowed) {
    return json(403, { error: 'Insufficient permissions' });
  }

  const rateLimit = await enforceAdminRateLimit(requester.id, 'admin.manage_user_role', 30);
  if (!rateLimit.ok) {
    return json(429, { error: rateLimit.error });
  }

  const payload = await request.json().catch(() => null);
  const userId = String(payload?.userId ?? '').trim();
  const roleId = String(payload?.roleId ?? '').trim();
  const action = String(payload?.action ?? '').trim() as ActionType;

  if (!userId || !roleId || (action !== 'assign' && action !== 'remove')) {
    return json(400, { error: 'Invalid payload' });
  }

  const { data: roleRow, error: roleError } = await adminClient
    .from('roles')
    .select('id,slug,name')
    .eq('id', roleId)
    .maybeSingle();

  if (roleError || !roleRow) {
    return json(404, { error: roleError?.message ?? 'Role not found' });
  }

  if (action === 'remove') {
    const { error: removeError } = await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (removeError) {
      return json(500, { error: removeError.message });
    }

    await adminClient.from('audit_log').insert({
      actor_user_id: requester.id,
      action: 'admin.role.removed',
      entity: 'user_roles',
      entity_id: userId,
      after_data: {
        role_id: roleId,
        role_slug: roleRow.slug,
      },
    });

    return json(200, { ok: true, action: 'removed' });
  }

  const legacyRole = toLegacyAppRole(roleRow.slug);

  const { data: profileRow } = await adminClient
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profileRow) {
    const { data: authUserData, error: authUserError } = await adminClient.auth.admin.getUserById(userId);
    if (authUserError || !authUserData.user) {
      return json(404, { error: authUserError?.message ?? 'User not found in auth' });
    }

    const authUser = authUserData.user;
    const email = authUser.email?.toLowerCase() ?? null;
    const displayName =
      String(authUser.user_metadata?.display_name ?? '').trim() ||
      String(authUser.user_metadata?.full_name ?? '').trim() ||
      String(authUser.user_metadata?.name ?? '').trim() ||
      (email && EMAIL_REGEX.test(email) ? email.split('@')[0] : 'Пользователь');

    const { error: profileUpsertError } = await adminClient.from('profiles').upsert(
      {
        user_id: userId,
        email,
        display_name: displayName,
        onboarding_completed: false,
      },
      { onConflict: 'user_id' },
    );

    if (profileUpsertError) {
      return json(500, { error: profileUpsertError.message });
    }
  }

  const { data: existingLink, error: existingError } = await adminClient
    .from('user_roles')
    .select('id,role')
    .eq('user_id', userId)
    .eq('role_id', roleId)
    .maybeSingle();

  if (existingError) {
    return json(500, { error: existingError.message });
  }

  if (!existingLink) {
    const { error: assignError } = await adminClient.from('user_roles').insert({
      user_id: userId,
      role_id: roleId,
      role: legacyRole,
      assigned_by: requester.id,
    });

    if (assignError) {
      return json(500, { error: assignError.message });
    }
  } else if (existingLink.role !== legacyRole) {
    const { error: updateRoleError } = await adminClient
      .from('user_roles')
      .update({ role: legacyRole, assigned_by: requester.id })
      .eq('id', existingLink.id);

    if (updateRoleError) {
      return json(500, { error: updateRoleError.message });
    }
  }

  await adminClient.from('audit_log').insert({
    actor_user_id: requester.id,
    action: 'admin.role.assigned',
    entity: 'user_roles',
    entity_id: userId,
    after_data: {
      role_id: roleId,
      role_slug: roleRow.slug,
    },
  });

  return json(200, { ok: true, action: existingLink ? 'already_assigned' : 'assigned' });
});
