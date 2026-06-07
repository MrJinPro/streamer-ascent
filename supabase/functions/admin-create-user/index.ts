/// <reference path="../esm-shims.d.ts" />
/// <reference path="../deno-globals.d.ts" />
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

  const rateLimit = await enforceAdminRateLimit(requester.id, 'admin.create_user');
  if (!rateLimit.ok) {
    return json(429, { error: rateLimit.error });
  }

  const payload = await request.json().catch(() => null);
  const email = String(payload?.email ?? '').trim().toLowerCase();
  const password = String(payload?.password ?? '');
  const displayName = String(payload?.displayName ?? '').trim();
  const roleSlugs = normalizeRoleSlugs(payload?.roleSlugs);
  const referralCode = String(payload?.referralCode ?? '').trim().toUpperCase() || DEFAULT_ADMIN_REFERRAL_CODE;
  const appUrl = Deno.env.get('APP_URL') ?? Deno.env.get('SITE_URL') ?? 'http://localhost:5173';
  const inviteUrl = new URL('/auth', appUrl);
  inviteUrl.searchParams.set('from', 'admin_create_user');
  if (referralCode) {
    inviteUrl.searchParams.set('ref', referralCode);
  }

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
    const isDuplicate = createError?.message?.toLowerCase().includes('already') ||
                        createError?.message?.toLowerCase().includes('duplicate') ||
                        createError?.status === 422;
    return json(isDuplicate ? 409 : 500, { error: createError?.message ?? 'Failed to create user' });
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
    invite_link: inviteUrl.toString(),
    inviter_user_id: requester.id,
    metadata: {
      source: 'admin-create-user',
      created_user_id: createdUserId,
      role_slugs: roleSlugs,
    },
  });

  // Immediately grant roles in user_roles so the user has access right after
  // accepting the invite, even before completing onboarding.
  if (roleSlugs.length > 0) {
    const SLUG_TO_LEGACY: Record<string, string> = {
      system_owner: 'admin', architect: 'admin', admin: 'admin', owner: 'admin',
      board: 'admin', engineer: 'admin', developer: 'admin',
      agency_manager: 'manager', manager: 'manager',
      head_mentor: 'curator', senior_curator: 'curator', mentor: 'curator', curator: 'curator',
      moderator: 'moderator', support: 'support', analyst: 'support',
      investor_pro: 'investor', investor_viewer: 'investor', investor: 'investor',
      agency_streamer: 'agency_streamer',
      nova_creator: 'streamer', rising_star: 'streamer', verified: 'streamer', streamer: 'streamer',
    };

    const { data: roleRows } = await adminClient
      .from('roles')
      .select('id, slug')
      .in('slug', roleSlugs);

    const rows = (roleRows ?? []) as { id: string; slug: string }[];
    if (rows.length > 0) {
      await adminClient.from('user_roles').insert(
        rows.map((r) => ({
          user_id: createdUserId,
          role: SLUG_TO_LEGACY[r.slug] ?? 'streamer',
          role_id: r.id,
          scope: 'global',
          assigned_by: requester.id,
        })),
      );
    }
  }


  const roleSummary = roleSlugs.length > 0 ? roleSlugs.join(', ') : 'streamer';
  const { error: inviteMailError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: inviteUrl.toString(),
    data: {
      source: 'admin-create-user',
      invite_ref: referralCode,
      invite_roles: roleSlugs,
      invite_roles_text: roleSummary,
      created_user_id: createdUserId,
    },
  });

  if (!inviteMailError) {
    await adminClient
      .from('admin_invites')
      .update({ status: 'sent' })
      .eq('email', email)
      .eq('status', 'provisioned');
  }

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
    inviteLink: inviteUrl.toString(),
    inviteMailError: inviteMailError?.message ?? null,
    roleSummary,
  });
});
