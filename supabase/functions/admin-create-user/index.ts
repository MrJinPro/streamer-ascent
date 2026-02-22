import {
  adminClient,
  corsHeaders,
  enforceAdminRateLimit,
  json,
  normalizeRoleSlugs,
  resolveRequester,
  userCanManageUsers,
} from '../_shared/auth.ts';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

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

  const rateLimit = await enforceAdminRateLimit(requester.id, 'admin.create_user');
  if (!rateLimit.ok) {
    return json(429, { error: rateLimit.error });
  }

  const payload = await request.json().catch(() => null);
  const email = String(payload?.email ?? '').trim().toLowerCase();
  const password = String(payload?.password ?? '');
  const displayName = String(payload?.displayName ?? '').trim();
  const roleSlugs = normalizeRoleSlugs(payload?.roleSlugs);
  const referralCode = String(payload?.referralCode ?? '').trim().toUpperCase() || null;

  if (!EMAIL_REGEX.test(email)) {
    return json(400, { error: 'Invalid email format' });
  }

  if (password.length < 8) {
    return json(400, { error: 'Password must be at least 8 characters long' });
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName || email.split('@')[0],
    },
  });

  if (createError || !created.user) {
    return json(500, { error: createError?.message ?? 'Failed to create user' });
  }

  const createdUserId = created.user.id;

  await adminClient.from('profiles').upsert(
    {
      user_id: createdUserId,
      email,
      display_name: displayName || email.split('@')[0],
      onboarding_completed: false,
      onboarding_completed_at: null,
      onboarding_referral_code: referralCode,
      onboarding_source: 'admin_create_user',
    },
    { onConflict: 'user_id' },
  );

  await adminClient.from('admin_invites').insert({
    email,
    role_slugs: roleSlugs,
    referral_code: referralCode,
    status: 'provisioned',
    inviter_user_id: requester.id,
    metadata: {
      source: 'admin-create-user',
      created_user_id: createdUserId,
    },
  });

  await adminClient.from('audit_log').insert({
    actor_user_id: requester.id,
    action: 'admin.create_user',
    entity: 'auth.users',
    entity_id: createdUserId,
    after_data: {
      email,
      roleSlugs,
      referralCode,
    },
  });

  return json(200, {
    ok: true,
    userId: createdUserId,
    email,
  });
});
