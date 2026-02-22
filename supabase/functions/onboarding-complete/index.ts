import {
  adminClient,
  corsHeaders,
  json,
  normalizeRoleSlugs,
  resolveRequester,
  userCanManageUsers,
} from '../_shared/auth.ts';

const LEGAL_VERSION = '2026-02-21';

const toIsoNow = () => new Date().toISOString();

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

  const payload = await request.json().catch(() => null);
  const skip = Boolean(payload?.skip);

  if (skip) {
    const authz = await userCanManageUsers(requester.id);
    if (!authz.allowed || (authz.tier !== 'tier_3' && authz.tier !== 'tier_4')) {
      return json(403, { error: 'Skip is available only for internal staff tier_3+' });
    }

    const now = toIsoNow();
    await adminClient.from('profiles').upsert(
      {
        user_id: requester.id,
        email: requester.email,
        onboarding_completed: true,
        onboarding_completed_at: now,
        onboarding_source: 'staff_skip',
      },
      { onConflict: 'user_id' },
    );

    await adminClient.from('audit_log').insert({
      actor_user_id: requester.id,
      action: 'onboarding.skip',
      entity: 'profiles',
      entity_id: requester.id,
      after_data: { source: 'staff_skip' },
    });

    return json(200, { ok: true, skipped: true });
  }

  const displayName = String(payload?.displayName ?? '').trim();
  const country = String(payload?.country ?? '').trim() || null;
  const language = String(payload?.language ?? '').trim() || null;
  const telegramUsername = String(payload?.telegramUsername ?? '').trim() || null;
  const source = String(payload?.source ?? '').trim() || 'onboarding';
  const token = String(payload?.token ?? '').trim() || null;
  const referralCodeInput = String(payload?.referralCode ?? '').trim().toUpperCase() || null;
  const acceptTerms = Boolean(payload?.acceptTerms);
  const acceptPrivacy = Boolean(payload?.acceptPrivacy);

  if (!displayName) {
    return json(400, { error: 'Display name is required' });
  }

  if (!acceptTerms || !acceptPrivacy) {
    return json(400, { error: 'Terms and privacy acceptance are required' });
  }

  const now = toIsoNow();

  const { data: latestInvite } = await adminClient
    .from('admin_invites')
    .select('id, role_slugs, referral_code, status')
    .eq('email', requester.email ?? '')
    .or(token ? `invite_token.eq.${token},invite_token.is.null` : 'invite_token.is.null')
    .in('status', ['pending', 'sent', 'provisioned'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const referralCode = referralCodeInput ?? latestInvite?.referral_code ?? null;
  const invitedRoles = normalizeRoleSlugs(latestInvite?.role_slugs ?? []);

  if (referralCode) {
    const { data: referralConsumed, error: consumeError } = await adminClient.rpc('consume_referral_code', {
      p_code: referralCode,
      p_user_id: requester.id,
      p_email: requester.email ?? '',
    });

    if (consumeError) {
      return json(400, { error: consumeError.message });
    }

    if (!referralConsumed) {
      return json(400, { error: 'Referral code is invalid or exhausted' });
    }
  }

  const { error: profileError } = await adminClient.from('profiles').upsert(
    {
      user_id: requester.id,
      email: requester.email,
      display_name: displayName,
      telegram_username: telegramUsername,
      country,
      language,
      onboarding_completed: true,
      onboarding_completed_at: now,
      onboarding_referral_code: referralCode,
      onboarding_source: source,
      updated_at: now,
    },
    { onConflict: 'user_id' },
  );

  if (profileError) {
    return json(500, { error: profileError.message });
  }

  if (latestInvite?.id) {
    await adminClient
      .from('admin_invites')
      .update({
        status: 'accepted',
        accepted_at: now,
      })
      .eq('id', latestInvite.id);
  }

  if (invitedRoles.length > 0) {
    const { data: roleRows } = await adminClient.from('roles').select('id, slug').in('slug', invitedRoles);

    const roleIds = (roleRows ?? []).map((row) => row.id);

    if (roleIds.length > 0) {
      const { data: existingRows } = await adminClient
        .from('user_roles')
        .select('role_id')
        .eq('user_id', requester.id)
        .in('role_id', roleIds);

      const existingRoleIds = new Set((existingRows ?? []).map((row) => row.role_id));
      const missing = roleIds.filter((roleId) => !existingRoleIds.has(roleId));

      if (missing.length > 0) {
        await adminClient.from('user_roles').insert(
          missing.map((roleId) => ({
            user_id: requester.id,
            role: 'streamer',
            role_id: roleId,
            scope: 'global',
          })),
        );
      }
    }
  }

  await adminClient.from('user_legal_acceptances').upsert(
    [
      {
        user_id: requester.id,
        document_type: 'terms',
        document_version: LEGAL_VERSION,
        accepted_at: now,
      },
      {
        user_id: requester.id,
        document_type: 'privacy',
        document_version: LEGAL_VERSION,
        accepted_at: now,
      },
    ],
    { onConflict: 'user_id,document_type,document_version' },
  );

  await adminClient.from('audit_log').insert({
    actor_user_id: requester.id,
    action: 'onboarding.complete',
    entity: 'profiles',
    entity_id: requester.id,
    after_data: {
      referralCode,
      source,
      invitedRoles,
    },
  });

  return json(200, {
    ok: true,
    referralCode,
    invitedRoles,
  });
});
