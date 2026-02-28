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

type ApiKeyCandidate = {
  alias: string;
  provider: string;
  secret_value: string;
  is_active: boolean;
};

const OPENAI_ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
};

const GLOBAL_DOMAIN_SYSTEM_PROMPT = [
  'Ты AI Coach платформы NovaBoost Tools для TikTok Live стримеров.',
  'Отвечай ТОЛЬКО в контексте стриминга, эфиров, аудитории, удержания, контента, задач и метрик стримера.',
  'Не подменяй домен на учебу, карьерный коучинг, фитнес или общую психологию, если пользователь явно об этом не попросил.',
  'Если данных недостаточно, скажи это прямо и предложи, какие именно стримерские метрики нужно добавить.',
].join(' ');

const getModeOutputRequirements = (modeId: string) => {
  if (modeId === 'daily_missions') {
    return [
      'Формат обязателен и без отклонений:',
      '1) Обязательные задачи (3 пункта)',
      '2) Дополнительные задачи (2 пункта)',
      '3) Усиление (1 пункт)',
      'Каждый пункт: действие + измеримый результат + дедлайн на сегодня.',
      'Не используй общие фразы, не повторяйся.',
    ].join(' ');
  }

  if (modeId === 'content_factory') {
    return [
      'Сформируй РОВНО 10 идей для TikTok Live.',
      'Для каждой идеи дай: Хук, Сценарий (3 шага), Интерактив с чатом, CTA.',
      'Идеи должны быть реалистичны для стрима и не нарушать правила платформы.',
      'Запрещено предлагать просмотр фильмов/чужого контента с потенциальным нарушением авторских прав.',
      'Избегай обезличенных формулировок типа "вашу аудиторию" — обращайся к стримеру на "ты".',
      'Не пиши вступление/воду, сразу к списку идей.',
    ].join(' ');
  }

  if (modeId === 'progress_report') {
    return 'Формат обязателен: Итог, Сильные стороны, Слабые зоны, План на 7 дней, Быстрые задачи на 24ч.';
  }

  return 'Ответ должен быть практичным, конкретным и ориентированным на действия стримера.';
};

const isSchemaCacheError = (error: { code?: string; message?: string; details?: string } | null | undefined) => {
  if (!error) return false;
  const text = `${error.code ?? ''} ${error.message ?? ''} ${error.details ?? ''}`;
  return /PGRST20\d|42P01|schema cache|Could not find the table|function .* does not exist|does not exist/i.test(text);
};

const fallbackRoute = (inputRaw: string, forcedMode: string | null | undefined): RouteResult => {
  const forced = String(forcedMode ?? '').trim().toLowerCase();
  if (forced) {
    return { mode_id: forced, confidence: 1, reason: 'forced_mode_fallback', clarification_question: null };
  }

  const input = inputRaw.toLowerCase();
  if (/(правил|policy|бан|ограничени|нарушен|tiktok)/i.test(input)) {
    return { mode_id: 'tiktok_qa', confidence: 0.92, reason: 'policy_keywords_fallback', clarification_question: null };
  }
  if (/(мисси|задач(и|а)|чеклист|сегодня)/i.test(input)) {
    return { mode_id: 'daily_missions', confidence: 0.9, reason: 'daily_keywords_fallback', clarification_question: null };
  }
  if (/(разбор|review|после эфира|прошл(ый|ого) эфир)/i.test(input)) {
    return { mode_id: 'live_review', confidence: 0.88, reason: 'review_keywords_fallback', clarification_question: null };
  }
  if (/(сценарий|план эфира|блоки эфира)/i.test(input)) {
    return { mode_id: 'live_plan', confidence: 0.9, reason: 'plan_keywords_fallback', clarification_question: null };
  }
  if (/(контент|иде(и|я)|хук|сценари|текст)/i.test(input)) {
    return { mode_id: 'content_factory', confidence: 0.86, reason: 'content_keywords_fallback', clarification_question: null };
  }
  if (/(прогресс|отч[её]т|аналит|метрик|рост|падени)/i.test(input)) {
    return { mode_id: 'progress_report', confidence: 0.9, reason: 'progress_keywords_fallback', clarification_question: null };
  }

  return {
    mode_id: 'universal_chat',
    confidence: 0.44,
    reason: 'low_confidence_fallback',
    clarification_question: 'Уточни, что нужно: анализ прогресса, план эфира, разбор, миссии, контент или TikTok-правила?',
  };
};

const fallbackModeById = (modeId: string): AiModeRow => ({
  id: modeId,
  enabled: true,
  provider: 'openai',
  model: 'gpt-4o-mini',
  temperature: modeId === 'tiktok_qa' ? 0.2 : 0.5,
  max_tokens: modeId === 'daily_missions' ? 900 : 1200,
  cost_limit_daily_usd: 5,
  rate_limit_per_minute: 20,
  key_alias: null,
  system_prompt:
    modeId === 'tiktok_qa'
      ? 'Отвечай только по переданному policy context. Если контекста нет — сообщи, что нет точного правила.'
      : `Ты AI Coach NovaBoost. Режим: ${modeId}. Дай практичный и структурированный ответ.`,
  allowed_tools: [],
  data_requirements: [],
  style_guide: 'по делу',
});

const isRetryableModelError = (message: string) => {
  const text = message.toLowerCase();
  return /(429|rate limit|quota|overloaded|temporar|timeout|connection|service unavailable)/i.test(text);
};

const orderKeysForMode = (keys: ApiKeyCandidate[], preferredAlias: string | null) => {
  const activeKeys = keys.filter((item) => item.is_active && item.secret_value);
  if (!preferredAlias) {
    const shuffled = [...activeKeys];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    return shuffled;
  }

  const preferred = activeKeys.filter((item) => item.alias === preferredAlias);
  const others = activeKeys.filter((item) => item.alias !== preferredAlias);
  return [...preferred, ...others];
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

const sanitizeOutOfDomainAnswer = (modeId: string, answer: string, userContext: unknown) => {
  const text = answer.trim();
  const lower = text.toLowerCase();

  const hasWrongDomainWords = /(уч[её]б|школ|универ|домашн|экзамен|карьер|офис|корпоратив|собесед)/i.test(lower);
  const hasStreamingWords = /(стрим|эфир|аудитор|чат|удержан|тик ?ток|tiktok|донат|подарк|контент)/i.test(lower);

  if (!hasWrongDomainWords || hasStreamingWords) {
    return text;
  }

  const ctx = JSON.stringify(userContext ?? {});
  const hasAnyStats = ctx.length > 4;

  if (modeId === 'progress_report') {
    return hasAnyStats
      ? 'Итог\nНедостаточно чистых данных для точного анализа, но фокус должен быть на стримерских метриках.\n\nСильные стороны\n- Есть базовый контекст профиля и активности.\n\nСлабые\n- Не хватает стабильных данных по удержанию, пикам и источникам подарков.\n\nПлан\n1) Зафиксируй расписание эфиров на 7 дней.\n2) Для каждого эфира добавляй цель по удержанию и интерактиву.\n3) После эфира фиксируй 3 вывода: что подняло активность, где был спад, какие CTA сработали.\n\nБыстрые задачи\n- Сегодня: 1 эфир с чётким сценарием блоков и интерактивом каждые 10–15 минут.'
      : 'Итог\nДля анализа прогресса не хватает стримерских данных.\n\nСильные стороны\n- Запрос сформулирован по делу.\n\nСлабые\n- Нет данных по метрикам эфиров.\n\nПлан\n1) Подключить данные последних 7/30 дней по эфирам.\n2) Добавить задания и выполнение.\n3) Собирать пики активности чата и подарков.\n\nБыстрые задачи\n- Отправь запрос повторно после появления метрик.';
  }

  return 'Переформулирую в домене NovaBoost: фокус на стриминге, метриках эфиров, активности чата, контент-плане и выполнении задач. Уточни период анализа (24ч / 7д / 30д), и я дам точный план действий.';
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

  const system = `${GLOBAL_DOMAIN_SYSTEM_PROMPT}\n\n${mode.system_prompt}\n\nТребования к формату: ${getModeOutputRequirements(mode.id)}\n\nСтиль: ${mode.style_guide ?? 'по делу'}\n\nКонтекст JSON:\n${JSON.stringify(contextPayload)}`;

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

  const route = routeError
    ? fallbackRoute(message, payload.modeId)
    : (((routeRows ?? [])[0] ?? null) as RouteResult | null) ?? fallbackRoute(message, payload.modeId);

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

  const mode = modeError || !modeRow || !modeRow.enabled ? fallbackModeById(route.mode_id) : (modeRow as AiModeRow);

  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count: minuteCount, error: minuteCountError } = await adminClient
    .from('ai_chat_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', requester.id)
    .eq('mode_id', mode.id)
    .gte('created_at', oneMinuteAgo);

  if (!minuteCountError && (minuteCount ?? 0) >= mode.rate_limit_per_minute) {
    return json(429, { error: 'Rate limit exceeded for this mode' });
  }

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);

  const { data: costRows, error: costRowsError } = await adminClient
    .from('ai_chat_logs')
    .select('cost_usd')
    .eq('user_id', requester.id)
    .eq('mode_id', mode.id)
    .gte('created_at', dayStart.toISOString());

  const todayCost = (costRows ?? []).reduce((sum: number, row: any) => sum + Number(row.cost_usd ?? 0), 0);
  if (!costRowsError && todayCost >= Number(mode.cost_limit_daily_usd ?? 0)) {
    return json(429, { error: 'Daily cost limit reached for this mode' });
  }

  const [{ data: userContextRows, error: contextError }, { data: keyRows, error: keyError }] = await Promise.all([
    adminClient.rpc('ai_build_user_context', { p_user_id: requester.id, p_mode_id: mode.id }),
    adminClient
      .from('ai_api_keys')
      .select('alias,provider,secret_value,is_active')
      .eq('is_active', true)
      .eq('provider', mode.provider)
      .order('updated_at', { ascending: false })
      .limit(20),
  ]);

  if (contextError && !isSchemaCacheError(contextError)) {
    return json(500, { error: contextError.message });
  }

  const userContext = contextError ? {} : (userContextRows ?? {});
  const keyCandidates = keyError ? [] : orderKeysForMode((keyRows ?? []) as ApiKeyCandidate[], mode.key_alias ?? null);

  let policySources: PolicyResult[] = [];
  if (mode.id === 'tiktok_qa') {
    const { data: policyRows, error: policyError } = await adminClient.rpc('ai_policy_retrieve', {
      p_query: message,
      p_language: payload.language ?? 'ru',
      p_region: payload.region ?? null,
      p_limit: 6,
    });

    if (policyError && !isSchemaCacheError(policyError)) {
      return json(500, { error: policyError.message });
    }

    policySources = policyError ? [] : ((policyRows ?? []) as PolicyResult[]);
  }

  try {
    let llmResult: Awaited<ReturnType<typeof callModel>> | null = null;
    let lastModelError: string | null = null;

    if (keyCandidates.length === 0) {
      llmResult = await callModel(mode, '', message, userContext, policySources, route.reason);
    } else {
      for (const candidate of keyCandidates) {
        try {
          llmResult = await callModel(mode, candidate.secret_value, message, userContext, policySources, route.reason);
          break;
        } catch (error) {
          const errText = error instanceof Error ? error.message : 'Unknown model error';
          lastModelError = errText;
          if (!isRetryableModelError(errText)) {
            break;
          }
        }
      }
    }

    if (!llmResult) {
      return json(502, { error: lastModelError ?? 'All model keys failed' });
    }

    const totalTokens = llmResult.promptTokens + llmResult.completionTokens;
    const costUsd = estimateCostUsd(totalTokens, llmResult.provider, llmResult.model);
    const latencyMs = Date.now() - startedAt;

    const modeFormattedText =
      mode.id === 'tiktok_qa' && policySources.length === 0
        ? 'Не нашёл точного правила во внутренней базе по этому вопросу. Уточни контекст: регион, тип нарушения и сценарий эфира.'
        : formatByMode(mode.id, llmResult.text, policySources);

    const finalText = sanitizeOutOfDomainAnswer(mode.id, modeFormattedText, userContext);

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

    if (logError && !isSchemaCacheError(logError)) {
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
      logId: logError ? null : (logRow?.id ?? null),
      setupRequired: Boolean(modeError || routeError || contextError || keyError || minuteCountError || costRowsError),
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown model error';
    return json(500, { error: messageText });
  }
});
