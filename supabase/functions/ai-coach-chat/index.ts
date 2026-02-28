/// <reference path="../esm-shims.d.ts" />
import { adminClient, corsHeaders, json, resolveRequester } from '../_shared/auth.ts';

type AiModeRow = {
  id: string;
  enabled: boolean;
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  cost_limit_daily_usd: number;
  rate_limit_per_minute: number;
  key_alias: string | null;
  system_prompt: string;
  allowed_tools: unknown;
  data_requirements: unknown;
  style_guide: string | null;
};

type RouteResult = {
  mode_id: string;
  confidence: number;
  reason: string;
  clarification_question: string | null;
};

type PolicyResult = {
  chunk_id: string;
  doc_title: string;
  excerpt: string;
  source_url: string | null;
  score: number;
};

type RequestPayload = {
  message?: string;
  modeId?: string | null;
  language?: string;
  region?: string | null;
  testMode?: boolean;
};

const OPENAI_ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
};

const estimateTokens = (text: string) => Math.max(1, Math.ceil(text.length / 4));

const estimateCostUsd = (totalTokens: number, provider: string, model: string) => {
  const p = provider.toLowerCase();
  const m = model.toLowerCase();

  let per1k = 0.002;
  if (p === 'openai' && m.includes('gpt-4o')) per1k = 0.007;
  if (m.includes('mini')) per1k = 0.0018;
  if (p === 'openrouter') per1k = 0.003;

  return Number(((totalTokens / 1000) * per1k).toFixed(6));
};

const formatByMode = (modeId: string, answer: string, policySources: PolicyResult[]) => {
  const trimmed = answer.trim();

  if (modeId === 'daily_missions') {
    return trimmed.includes('Обязательные')
      ? trimmed
      : `Обязательные:\n1) ...\n2) ...\n3) ...\n\nДополнительные:\n1) ...\n2) ...\n\nУсиление:\n1) ...\n\n${trimmed}`;
  }

  if (modeId === 'progress_report') {
    if (trimmed.includes('Итог') && trimmed.includes('Сильные стороны')) return trimmed;
    return `Итог\n${trimmed}\n\nСильные стороны\n- ...\n\nСлабые\n- ...\n\nПлан\n1) ...\n2) ...\n\nБыстрые задачи\n- ...`;
  }

  if (modeId === 'tiktok_qa') {
    const withSources =
      policySources.length > 0
        ? `\n\nИсточники:\n${policySources
            .map((item, index) => {
              const src = item.source_url ? ` (${item.source_url})` : '';
              return `${index + 1}. ${item.doc_title}${src}`;
            })
            .join('\n')}`
        : '\n\nИсточники: нет релевантных фрагментов во внутренней базе.';
    return `${trimmed}${withSources}`;
  }

  return trimmed;
};

const callModel = async (
  mode: AiModeRow,
  apiKey: string,
  userMessage: string,
  userContext: unknown,
  policyContext: PolicyResult[],
  routerReason: string,
) => {
  const endpoint = OPENAI_ENDPOINTS[mode.provider.toLowerCase()];

  const contextPayload = {
    user_data: userContext,
    router_reason: routerReason,
    policy_context:
      mode.id === 'tiktok_qa'
        ? policyContext.map((item) => ({
            title: item.doc_title,
            excerpt: item.excerpt,
            source_url: item.source_url,
          }))
        : [],
  };

  if (!endpoint || !apiKey) {
    return {
      text:
        'Режим запущен в fallback-ответе, потому что API-ключ или endpoint модели не настроен. ' +
        'Открой админку AI Coach и добавь активный ключ для выбранного провайдера.',
      promptTokens: estimateTokens(JSON.stringify(contextPayload)) + estimateTokens(userMessage),
      completionTokens: 64,
      model: mode.model,
      provider: mode.provider,
    };
  }

  const system = `${mode.system_prompt}\n\nСтиль: ${mode.style_guide ?? 'по делу'}\n\nКонтекст JSON:\n${JSON.stringify(contextPayload)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: mode.model,
      temperature: mode.temperature,
      max_tokens: mode.max_tokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM request failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const text = String(data?.choices?.[0]?.message?.content ?? '').trim();

  return {
    text: text || 'Пустой ответ модели. Повтори запрос.',
    promptTokens: Number(data?.usage?.prompt_tokens ?? estimateTokens(system) + estimateTokens(userMessage)),
    completionTokens: Number(data?.usage?.completion_tokens ?? estimateTokens(text)),
    model: String(data?.model ?? mode.model),
    provider: mode.provider,
  };
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

  let payload: RequestPayload;
  try {
    payload = (await request.json()) as RequestPayload;
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const message = String(payload.message ?? '').trim();
  if (!message) {
    return json(400, { error: 'Message is required' });
  }

  const startedAt = Date.now();

  const { data: routeRows, error: routeError } = await adminClient.rpc('ai_route_intent', {
    p_text: message,
    p_forced_mode: payload.modeId ?? null,
  });

  if (routeError) {
    return json(500, { error: routeError.message });
  }

  const route = ((routeRows ?? [])[0] ?? null) as RouteResult | null;
  if (!route) {
    return json(500, { error: 'Router did not return mode' });
  }

  if (route.confidence < 0.5 && route.mode_id === 'universal_chat' && route.clarification_question) {
    return json(200, {
      ok: true,
      modeId: route.mode_id,
      confidence: route.confidence,
      reason: route.reason,
      needsClarification: true,
      answer: route.clarification_question,
      logId: null,
      sources: [],
    });
  }

  const { data: modeRow, error: modeError } = await adminClient
    .from('ai_modes')
    .select('id,enabled,provider,model,temperature,max_tokens,cost_limit_daily_usd,rate_limit_per_minute,key_alias,system_prompt,allowed_tools,data_requirements,style_guide')
    .eq('id', route.mode_id)
    .maybeSingle();

  if (modeError || !modeRow || !modeRow.enabled) {
    return json(400, { error: 'Mode unavailable or disabled' });
  }

  const mode = modeRow as AiModeRow;

  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count: minuteCount } = await adminClient
    .from('ai_chat_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', requester.id)
    .eq('mode_id', mode.id)
    .gte('created_at', oneMinuteAgo);

  if ((minuteCount ?? 0) >= mode.rate_limit_per_minute) {
    return json(429, { error: 'Rate limit exceeded for this mode' });
  }

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);

  const { data: costRows } = await adminClient
    .from('ai_chat_logs')
    .select('cost_usd')
    .eq('user_id', requester.id)
    .eq('mode_id', mode.id)
    .gte('created_at', dayStart.toISOString());

  const todayCost = (costRows ?? []).reduce((sum: number, row: any) => sum + Number(row.cost_usd ?? 0), 0);
  if (todayCost >= Number(mode.cost_limit_daily_usd ?? 0)) {
    return json(429, { error: 'Daily cost limit reached for this mode' });
  }

  const [{ data: userContextRows, error: contextError }, { data: keyRow }] = await Promise.all([
    adminClient.rpc('ai_build_user_context', { p_user_id: requester.id, p_mode_id: mode.id }),
    adminClient
      .from('ai_api_keys')
      .select('alias,provider,secret_value,is_active')
      .eq('is_active', true)
      .or(mode.key_alias ? `alias.eq.${mode.key_alias},provider.eq.${mode.provider}` : `provider.eq.${mode.provider}`)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (contextError) {
    return json(500, { error: contextError.message });
  }

  const userContext = userContextRows ?? {};
  const apiKey = String((keyRow as any)?.secret_value ?? '');

  let policySources: PolicyResult[] = [];
  if (mode.id === 'tiktok_qa') {
    const { data: policyRows, error: policyError } = await adminClient.rpc('ai_policy_retrieve', {
      p_query: message,
      p_language: payload.language ?? 'ru',
      p_region: payload.region ?? null,
      p_limit: 6,
    });

    if (policyError) {
      return json(500, { error: policyError.message });
    }

    policySources = (policyRows ?? []) as PolicyResult[];
  }

  try {
    const llmResult = await callModel(mode, apiKey, message, userContext, policySources, route.reason);
    const totalTokens = llmResult.promptTokens + llmResult.completionTokens;
    const costUsd = estimateCostUsd(totalTokens, llmResult.provider, llmResult.model);
    const latencyMs = Date.now() - startedAt;

    const finalText =
      mode.id === 'tiktok_qa' && policySources.length === 0
        ? 'Не нашёл точного правила во внутренней базе по этому вопросу. Уточни контекст: регион, тип нарушения и сценарий эфира.'
        : formatByMode(mode.id, llmResult.text, policySources);

    const { data: logRow, error: logError } = await adminClient
      .from('ai_chat_logs')
      .insert({
        user_id: requester.id,
        mode_id: mode.id,
        provider: llmResult.provider,
        model: llmResult.model,
        router_confidence: route.confidence,
        router_reason: route.reason,
        prompt_text: message,
        response_text: finalText,
        prompt_tokens: llmResult.promptTokens,
        completion_tokens: llmResult.completionTokens,
        total_tokens: totalTokens,
        cost_usd: costUsd,
        latency_ms: latencyMs,
      })
      .select('id')
      .maybeSingle();

    if (logError) {
      return json(500, { error: logError.message });
    }

    return json(200, {
      ok: true,
      answer: finalText,
      modeId: mode.id,
      confidence: route.confidence,
      reason: route.reason,
      needsClarification: false,
      sources: policySources.map((item) => ({
        id: item.chunk_id,
        title: item.doc_title,
        sourceUrl: item.source_url,
        excerpt: item.excerpt,
        score: item.score,
      })),
      usage: {
        promptTokens: llmResult.promptTokens,
        completionTokens: llmResult.completionTokens,
        totalTokens,
        costUsd,
        latencyMs,
      },
      logId: logRow?.id ?? null,
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown model error';
    return json(500, { error: messageText });
  }
});
