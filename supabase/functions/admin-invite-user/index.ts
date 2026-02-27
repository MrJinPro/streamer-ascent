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
const DEFAULT_ADMIN_REFERRAL_CODE = 'NOVA-2026';

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

  const authz = await userCanManageUsers(requester.id, ['users.create']);
  if (!authz.allowed) {
    return json(403, { error: 'Insufficient permissions' });
  }

  const rateLimit = await enforceAdminRateLimit(requester.id, 'admin.invite_user');
  if (!rateLimit.ok) {
    return json(429, { error: rateLimit.error });
  }

  const payload = await request.json().catch(() => null);
  const email = String(payload?.email ?? '').trim().toLowerCase();
  const roleSlugs = normalizeRoleSlugs(payload?.roleSlugs);
  const referralCode = String(payload?.referralCode ?? '').trim().toUpperCase() || DEFAULT_ADMIN_REFERRAL_CODE;
  const expiresInHours = Math.min(Math.max(Number(payload?.expiresInHours ?? 72), 1), 168);

  if (!EMAIL_REGEX.test(email)) {
    return json(400, { error: 'Invalid email format' });
  }

  const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '').slice(0, 16);
  const expiresAt = new Date(Date.now() + expiresInHours * 3600_000).toISOString();
  const appUrl = Deno.env.get('APP_URL') ?? Deno.env.get('SITE_URL') ?? 'http://localhost:5173';
  const inviteUrl = new URL('/onboarding', appUrl);
  inviteUrl.searchParams.set('token', token);
  if (referralCode) {
    inviteUrl.searchParams.set('ref', referralCode);
  }

  const { error: inviteError } = await adminClient.from('admin_invites').insert({
    email,
    invite_token: token,
    referral_code: referralCode,
    role_slugs: roleSlugs,
    status: 'sent',
    invite_link: inviteUrl.toString(),
    expires_at: expiresAt,
    inviter_user_id: requester.id,
    metadata: {
      source: 'admin-invite-user',
      requester_tier: authz.tier,
    },
  });

  if (inviteError) {
    return json(500, { error: inviteError.message });
  }

  const { error: inviteMailError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: inviteUrl.toString(),
    data: {
      invite_token: token,
      invite_ref: referralCode,
      invite_roles: roleSlugs,
    },
  });

  await adminClient.from('audit_log').insert({
    actor_user_id: requester.id,
    action: 'admin.invite_user',
    entity: 'admin_invites',
    entity_id: email,
    after_data: {
      email,
      roleSlugs,
      referralCode,
      expiresAt,
      inviteMailError: inviteMailError?.message ?? null,
    },
  });

  return json(200, {
    ok: true,
    email,
    inviteLink: inviteUrl.toString(),
    expiresAt,
    inviteMailError: inviteMailError?.message ?? null,
  });
});
