import { adminClient, corsHeaders, json } from '../_shared/auth.ts';

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const payload = await request.json().catch(() => null);
  if (!payload) return json(400, { error: 'Invalid payload' });

  const str = (v: unknown, max = 255) => String(v ?? '').trim().slice(0, max);
  const full_name = str(payload.full_name, 120);
  const username = str(payload.username, 60);
  const tiktok_username = str(payload.tiktok_username, 60);
  const email = str(payload.email, 255).toLowerCase();
  const telegram = str(payload.telegram, 60);
  const heard_about = str(payload.heard_about, 40);
  const inviter_referral_code = str(payload.inviter_referral_code, 32).toUpperCase();
  const password = String(payload.password ?? '');
  const age = Number(payload.age);
  const accepted_terms = Boolean(payload.accepted_terms);
  const accepted_privacy = Boolean(payload.accepted_privacy);
  const accepted_offer = Boolean(payload.accepted_offer);
  const offer_version = str(payload.offer_version, 16) || '1';
  const offer_published_at = str(payload.offer_published_at, 16) || '2026-06-01';

  if (!full_name || !username || !tiktok_username || !email || !telegram || !heard_about || !inviter_referral_code) {
    return json(400, { error: 'Все поля обязательны для заполнения' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(400, { error: 'Некорректный email' });
  if (!Number.isFinite(age) || age < 16 || age > 99) return json(400, { error: 'Возраст должен быть от 16 до 99' });
  if (password.length < 8 || password.length > 128) return json(400, { error: 'Пароль должен содержать от 8 до 128 символов' });
  if (!accepted_terms || !accepted_privacy || !accepted_offer) {
    return json(400, { error: 'Необходимо принять условия, политику конфиденциальности и оферту' });
  }

  // Hash password via DB security-definer function
  const { data: hashRow, error: hashErr } = await adminClient.rpc('hash_password', { p_password: password });
  if (hashErr || !hashRow) return json(500, { error: 'Ошибка обработки пароля' });
  const password_hash = String(hashRow);

  // Capture client IP and UA server-side
  const xff = request.headers.get('x-forwarded-for') ?? '';
  const ip_address = (xff.split(',')[0] ?? '').trim() || request.headers.get('cf-connecting-ip') || null;
  const user_agent = request.headers.get('user-agent')?.slice(0, 500) ?? null;
  const now = new Date().toISOString();

  const insertPayload = {
    full_name,
    username,
    tiktok_username,
    email,
    telegram,
    age,
    heard_about,
    inviter_referral_code,
    password_hash,
    accepted_terms_at: accepted_terms ? now : null,
    accepted_privacy_at: accepted_privacy ? now : null,
    accepted_offer_at: accepted_offer ? now : null,
    offer_version,
    offer_published_at,
    ip_address,
    user_agent,
    signed_payload: {
      offer_version,
      offer_published_at,
      ip: ip_address,
      user_agent,
      signed_at: now,
      accepted: { terms: accepted_terms, privacy: accepted_privacy, offer: accepted_offer },
    },
    status: 'pending',
  };

  const { error: insertErr } = await adminClient
    .from('agency_join_applications')
    .insert(insertPayload);

  if (insertErr) {
    console.error('agency-application-submit insert error', insertErr);
    return json(500, { error: insertErr.message || 'Не удалось сохранить заявку' });
  }

  return json(200, { ok: true });
});
