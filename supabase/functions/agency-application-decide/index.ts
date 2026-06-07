/// <reference path="../esm-shims.d.ts" />
/// <reference path="../deno-globals.d.ts" />
import {
  adminClient,
  corsHeaders,
  enforceAdminRateLimit,
  json,
  resolveRequester,
  userCanManageUsers,
} from '../_shared/auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const APP_URL = Deno.env.get('APP_URL') ?? Deno.env.get('SITE_URL') ?? 'https://novaboost.club';

/**
 * Create an auth.users row using the pre-hashed password from the application.
 * Supabase admin REST API supports `password_hash` field (the JS client does not).
 */
const createAuthUserWithHash = async (
  email: string,
  passwordHash: string,
  userMetadata: Record<string, unknown>,
) => {
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      email,
      password_hash: passwordHash,
      email_confirm: true,
      user_metadata: userMetadata,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    return { error: `${resp.status} ${body}` };
  }

  const body = await resp.json();
  return { user: body as { id: string; email: string } };
};

const generateReferralCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'NOVA-';
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const requesterResult = await resolveRequester(request);
  if (requesterResult.error) return requesterResult.error;
  const requester = requesterResult.user;

  const authz = await userCanManageUsers(requester.id, ['users.create', 'users.update']);
  if (!authz.allowed) {
    return json(403, { error: 'Недостаточно прав для решения по заявкам' });
  }

  const rate = await enforceAdminRateLimit(requester.id, 'agency.application_decide', 30);
  if (!rate.ok) return json(429, { error: rate.error });

  const payload = await request.json().catch(() => null);
  const applicationId = String(payload?.applicationId ?? '').trim();
  const action = String(payload?.action ?? '').trim() as 'approve' | 'reject';
  const decisionNote = String(payload?.decisionNote ?? '').trim().slice(0, 2000) || null;

  if (!applicationId || (action !== 'approve' && action !== 'reject')) {
    return json(400, { error: 'applicationId и action (approve|reject) обязательны' });
  }

  if (action === 'reject' && !decisionNote) {
    return json(400, { error: 'Для отклонения нужна причина (decisionNote)' });
  }

  const { data: app, error: appErr } = await adminClient
    .from('agency_join_applications')
    .select('*')
    .eq('id', applicationId)
    .maybeSingle();

  if (appErr || !app) {
    return json(404, { error: appErr?.message ?? 'Заявка не найдена' });
  }

  if (app.status !== 'pending') {
    return json(409, { error: `Заявка уже обработана (статус: ${app.status})` });
  }

  const now = new Date().toISOString();

  // ────── REJECT ──────
  if (action === 'reject') {
    await adminClient
      .from('agency_join_applications')
      .update({
        status: 'rejected',
        decided_by: requester.id,
        decided_at: now,
        decision_note: decisionNote,
      })
      .eq('id', applicationId);

    await adminClient.from('audit_log').insert({
      actor_user_id: requester.id,
      action: 'agency.application.reject',
      entity: 'agency_join_applications',
      entity_id: applicationId,
      after_data: { decision_note: decisionNote },
    });

    return json(200, { ok: true, status: 'rejected' });
  }

  // ────── APPROVE ──────
  if (!app.password_hash) {
    return json(400, { error: 'У заявки отсутствует password_hash — обработать вручную' });
  }

  // 1. Create auth.users via REST (password_hash support)
  let userId: string | null = null;
  let createNote: string | null = null;

  const created = await createAuthUserWithHash(app.email, app.password_hash, {
    display_name: app.full_name,
    full_name: app.full_name,
    source: 'agency-application-decide',
    application_id: applicationId,
  });

  if ('error' in created) {
    // If user already exists (422), try to find them and continue
    const lookup = await adminClient.auth.admin.listUsers();
    const existing = lookup.data?.users?.find((u) => u.email?.toLowerCase() === app.email.toLowerCase());
    if (existing) {
      userId = existing.id;
      createNote = 'auth.users already existed — reused account';
    } else {
      return json(500, { error: `Не удалось создать пользователя: ${created.error}` });
    }
  } else {
    userId = created.user.id;
  }

  if (!userId) {
    return json(500, { error: 'Не удалось определить id созданного пользователя' });
  }

  // 2. Upsert profile
  await adminClient.from('profiles').upsert(
    {
      user_id: userId,
      email: app.email,
      display_name: app.full_name,
      username: app.username,
      telegram_username: app.telegram,
      tiktok_username: app.tiktok_username,
      onboarding_completed: true,
      onboarding_completed_at: now,
      onboarding_referral_code: app.inviter_referral_code,
      onboarding_source: 'agency_application_approved',
      updated_at: now,
    },
    { onConflict: 'user_id' },
  );

  // 3. Consume the inviter referral code (track usage)
  if (app.inviter_referral_code) {
    await adminClient
      .rpc('consume_referral_code', {
        p_code: app.inviter_referral_code,
        p_user_id: userId,
        p_email: app.email,
      })
      .catch(() => null);
  }

  // 4. Assign agency_streamer role
  const { data: roleRow } = await adminClient
    .from('roles')
    .select('id, slug')
    .eq('slug', 'agency_streamer')
    .maybeSingle();

  if (roleRow) {
    await adminClient.from('user_roles').upsert(
      {
        user_id: userId,
        role_id: roleRow.id,
        role: 'agency_streamer',
        scope: 'global',
        assigned_by: requester.id,
      },
      { onConflict: 'user_id,role_id' },
    );
  }

  // 5. Generate a personal referral code for the new streamer (best effort)
  const newCode = generateReferralCode();
  await adminClient
    .from('agency_referral_codes')
    .insert({
      code: newCode,
      owner_user_id: userId,
      max_uses: 5,
      used_count: 0,
      is_active: true,
      created_by: requester.id,
    })
    .catch(() => null);

  // 6. Send a Supabase magic-link sign-in email (uses built-in Supabase Auth template, no Resend needed)
  let emailSentAt: string | null = null;
  let emailError: string | null = null;
  const redirectTo = `${APP_URL.replace(/\/$/, '')}/dashboard`;

  const { error: otpErr } = await adminClient.auth.signInWithOtp({
    email: app.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: redirectTo,
    },
  });

  if (otpErr) {
    emailError = otpErr.message;
  } else {
    emailSentAt = new Date().toISOString();
  }

  // 7. Update application status
  await adminClient
    .from('agency_join_applications')
    .update({
      status: 'approved',
      decided_by: requester.id,
      decided_at: now,
      decision_note: decisionNote ?? createNote,
      created_user_id: userId,
      assigned_referral_code: newCode,
      email_sent_at: emailSentAt,
      email_error: emailError,
    })
    .eq('id', applicationId);

  await adminClient.from('audit_log').insert({
    actor_user_id: requester.id,
    action: 'agency.application.approve',
    entity: 'agency_join_applications',
    entity_id: applicationId,
    after_data: {
      created_user_id: userId,
      assigned_referral_code: newCode,
      email_sent: Boolean(emailSentAt),
      email_error: emailError,
    },
  });

  return json(200, {
    ok: true,
    status: 'approved',
    userId,
    referralCode: newCode,
    emailSent: Boolean(emailSentAt),
    emailError,
  });
});
