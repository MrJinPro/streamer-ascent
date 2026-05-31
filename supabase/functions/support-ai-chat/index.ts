/// <reference path="../esm-shims.d.ts" />
import { adminClient, corsHeaders, json, resolveRequester } from '../_shared/auth.ts';

type Payload = {
  ticketId?: string | null;
  message?: string;
  action?: 'chat' | 'escalate';
  categoryId?: string | null;
  subject?: string | null;
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') ?? '';
const MODEL = 'google/gemini-3-flash-preview';
const ENDPOINT = 'https://ai.gateway.lovable.dev/v1/chat/completions';

const SYSTEM_PROMPT = [
  'Ты — AI Тех-поддержка платформы NovaBoost Tools для TikTok Live стримеров.',
  'Помогаешь по темам: доступ к платформе, эфиры, начисления алмазов, прогресс, обучение (academy), задания, кабинет и роли.',
  'Отвечай кратко, структурно, на русском. Если вопрос вне домена — мягко перенаправь.',
  'Если пользователь явно просит человека или вопрос требует расчётов, доступа к счетам, разблокировок — сообщи, что можно нажать кнопку «Связаться с человеком».',
  'Используй переданный контекст академии для точных ответов по обучению.',
].join(' ');

const fetchAcademyContext = async (query: string) => {
  const needle = query.toLowerCase();
  const { data: lessons } = await adminClient
    .from('academy_lessons')
    .select('id,title,summary,course_id,xp_base')
    .eq('is_published', true)
    .limit(80);

  const scored = (lessons ?? [])
    .map((l: any) => {
      const text = `${l.title ?? ''} ${l.summary ?? ''}`.toLowerCase();
      const tokens = needle.split(/\s+/).filter((t) => t.length >= 3);
      const score = tokens.reduce((acc, t) => acc + (text.includes(t) ? 1 : 0), 0);
      return { ...l, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return scored.map((l: any) => `- ${l.title}: ${l.summary ?? ''}`).join('\n');
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const requesterResult = await resolveRequester(request);
  if (requesterResult.error) return requesterResult.error;
  const user = requesterResult.user;

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const action = payload.action ?? 'chat';

  // Get or create ticket
  let ticketId = payload.ticketId ?? null;
  if (!ticketId) {
    const { data: created, error: createErr } = await adminClient
      .from('support_tickets')
      .insert({
        user_id: user.id,
        status: 'ai_chat',
        source: 'ai_chat',
        subject: (payload.message ?? '').slice(0, 80) || 'AI-чат',
      })
      .select('id')
      .single();

    if (createErr || !created) {
      return json(500, { error: createErr?.message ?? 'Failed to create ticket' });
    }
    ticketId = created.id;
  }

  // ESCALATE → set category, status open, source escalated, system message
  if (action === 'escalate') {
    if (!payload.categoryId) return json(400, { error: 'categoryId required' });
    await adminClient
      .from('support_tickets')
      .update({
        category_id: payload.categoryId,
        status: 'open',
        source: 'escalated',
        subject: payload.subject ?? undefined,
      })
      .eq('id', ticketId);

    await adminClient.from('support_messages').insert({
      ticket_id: ticketId,
      sender_kind: 'system',
      body: 'Обращение передано менеджеру. Ответ поступит в этот чат.',
    });

    return json(200, { ok: true, ticketId, escalated: true });
  }

  // CHAT: save user msg, call AI, save AI reply
  const userMessage = String(payload.message ?? '').trim();
  if (!userMessage) return json(400, { error: 'message required' });

  await adminClient.from('support_messages').insert({
    ticket_id: ticketId,
    sender_user_id: user.id,
    sender_kind: 'user',
    body: userMessage,
  });

  // Load recent history
  const { data: history } = await adminClient
    .from('support_messages')
    .select('sender_kind,body')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
    .limit(20);

  const academyContext = await fetchAcademyContext(userMessage);

  const messages = [
    {
      role: 'system',
      content: `${SYSTEM_PROMPT}\n\nКонтекст академии (опубликованные уроки):\n${academyContext || '— нет релевантных уроков —'}`,
    },
    ...(history ?? []).map((m: any) => ({
      role:
        m.sender_kind === 'user'
          ? 'user'
          : m.sender_kind === 'ai'
            ? 'assistant'
            : 'system',
      content: m.body,
    })),
  ];

  if (!LOVABLE_API_KEY) {
    const fallback = 'AI временно недоступен. Нажмите «Связаться с человеком», чтобы получить помощь от менеджера.';
    await adminClient.from('support_messages').insert({
      ticket_id: ticketId,
      sender_kind: 'ai',
      body: fallback,
    });
    return json(200, { ok: true, ticketId, reply: fallback });
  }

  const aiResp = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      max_tokens: 800,
      messages,
    }),
  });

  if (aiResp.status === 429) return json(429, { error: 'Слишком много запросов. Попробуйте позже.' });
  if (aiResp.status === 402) return json(402, { error: 'Закончились AI-кредиты рабочего пространства.' });

  if (!aiResp.ok) {
    const text = await aiResp.text();
    return json(500, { error: `AI gateway: ${aiResp.status} ${text.slice(0, 200)}` });
  }

  const data = await aiResp.json();
  const reply = String(data?.choices?.[0]?.message?.content ?? '').trim()
    || 'Не удалось сформировать ответ. Нажмите «Связаться с человеком».';

  await adminClient.from('support_messages').insert({
    ticket_id: ticketId,
    sender_kind: 'ai',
    body: reply,
  });

  return json(200, { ok: true, ticketId, reply });
});
