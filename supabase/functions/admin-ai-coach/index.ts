/// <reference path="../esm-shims.d.ts" />
import {
  adminClient,
  corsHeaders,
  enforceAdminRateLimit,
  json,
  resolveRequester,
  userCanManageUsers,
} from '../_shared/auth.ts';

type Action =
  | 'get_modes'
  | 'save_mode'
  | 'get_settings'
  | 'save_settings'
  | 'list_keys'
  | 'save_key'
  | 'delete_key'
  | 'list_logs'
  | 'run_test';

type Payload = {
  action?: Action;
  mode?: Record<string, unknown>;
  key?: Record<string, unknown>;
  keyId?: string;
  settings?: Array<{ key?: string; value_json?: unknown; description?: string | null }>;
  settingKey?: string;
  settingValue?: unknown;
  settingDescription?: string | null;
  limit?: number;
  message?: string;
  modeId?: string;
};

const isSchemaCacheError = (error: { code?: string; message?: string; details?: string } | null | undefined) => {
  if (!error) return false;
  const text = `${error.code ?? ''} ${error.message ?? ''} ${error.details ?? ''}`;
  return /PGRST20\d|42P01|schema cache|Could not find the table|does not exist/i.test(text);
};

const setupRequiredResponse = (defaults: Record<string, unknown> = {}) =>
  json(200, {
    ok: true,
    setupRequired: true,
    setupMessage: 'AI Coach schema is not ready yet. Wait for migrations to finish and retry.',
    ...defaults,
  });

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

  const authz = await userCanManageUsers(requester.id, ['users.update']);
  if (!authz.allowed) {
    return json(403, { error: 'Insufficient permissions' });
  }

  const rateLimit = await enforceAdminRateLimit(requester.id, 'admin.ai_coach', 40);
  if (!rateLimit.ok) {
    return json(429, { error: rateLimit.error });
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const action = payload.action;
  if (!action) {
    return json(400, { error: 'action is required' });
  }

  if (action === 'get_modes') {
    const { data, error } = await adminClient
      .from('ai_modes')
      .select('id,enabled,provider,model,temperature,max_tokens,cost_limit_daily_usd,rate_limit_per_minute,key_alias,system_prompt,allowed_tools,data_requirements,style_guide,updated_at')
      .order('id', { ascending: true });

    if (error) {
      if (isSchemaCacheError(error)) {
        return setupRequiredResponse({ modes: [] });
      }
      return json(500, { error: error.message });
    }
    return json(200, { ok: true, modes: data ?? [] });
  }

  if (action === 'save_mode') {
    const mode = payload.mode ?? {};
    const id = String(mode.id ?? '').trim();
    if (!id) return json(400, { error: 'mode.id is required' });

    const upsertPayload = {
      id,
      enabled: Boolean(mode.enabled ?? true),
      provider: String(mode.provider ?? 'openai'),
      model: String(mode.model ?? 'gpt-4o-mini'),
      temperature: Number(mode.temperature ?? 0.4),
      max_tokens: Number(mode.max_tokens ?? 1200),
      cost_limit_daily_usd: Number(mode.cost_limit_daily_usd ?? 5),
      rate_limit_per_minute: Number(mode.rate_limit_per_minute ?? 20),
      key_alias: mode.key_alias ? String(mode.key_alias) : null,
      system_prompt: String(mode.system_prompt ?? ''),
      allowed_tools: Array.isArray(mode.allowed_tools) ? mode.allowed_tools : [],
      data_requirements: Array.isArray(mode.data_requirements) ? mode.data_requirements : [],
      style_guide: mode.style_guide ? String(mode.style_guide) : null,
    };

    const { error } = await adminClient.from('ai_modes').upsert(upsertPayload, { onConflict: 'id' });
    if (error) {
      if (isSchemaCacheError(error)) {
        return setupRequiredResponse();
      }
      return json(500, { error: error.message });
    }

    return json(200, { ok: true });
  }

  if (action === 'get_settings') {
    const { data, error } = await adminClient
      .from('ai_coach_settings')
      .select('key,value_json,description,updated_at')
      .order('key', { ascending: true });

    if (error) {
      if (isSchemaCacheError(error)) {
        return setupRequiredResponse({ settings: [] });
      }
      return json(500, { error: error.message });
    }

    return json(200, { ok: true, settings: data ?? [] });
  }

  if (action === 'save_settings') {
    const incoming = Array.isArray(payload.settings) ? payload.settings : [];
    const fallbackKey = String(payload.settingKey ?? '').trim();

    const normalized = (
      incoming.length > 0
        ? incoming
        : fallbackKey
          ? [{ key: fallbackKey, value_json: payload.settingValue, description: payload.settingDescription ?? null }]
          : []
    )
      .map((item) => ({
        key: String(item.key ?? '').trim(),
        value_json: item.value_json,
        description: item.description ?? null,
      }))
      .filter((item) => item.key.length > 0);

    if (normalized.length === 0) {
      return json(400, { error: 'settings are required' });
    }

    const rows = normalized.map((item) => ({
      key: item.key,
      value_json: item.value_json,
      description: item.description,
      updated_by: requester.id,
    }));

    const { error } = await adminClient.from('ai_coach_settings').upsert(rows, { onConflict: 'key' });
    if (error) {
      if (isSchemaCacheError(error)) {
        return setupRequiredResponse();
      }
      return json(500, { error: error.message });
    }

    return json(200, { ok: true });
  }

  if (action === 'list_keys') {
    const { data, error } = await adminClient
      .from('ai_api_keys_public')
      .select('id,alias,provider,is_active,created_by,created_at,updated_at,secret_masked')
      .order('updated_at', { ascending: false });

    if (error) {
      if (isSchemaCacheError(error)) {
        return setupRequiredResponse({ keys: [] });
      }
      return json(500, { error: error.message });
    }
    return json(200, { ok: true, keys: data ?? [] });
  }

  if (action === 'save_key') {
    const key = payload.key ?? {};
    const alias = String(key.alias ?? '').trim();
    const provider = String(key.provider ?? '').trim();
    const secret = String(key.secret_value ?? '').trim();

    if (!alias || !provider || !secret) {
      return json(400, { error: 'alias, provider, secret_value are required' });
    }

    const record = {
      alias,
      provider,
      secret_value: secret,
      is_active: Boolean(key.is_active ?? true),
      created_by: requester.id,
    };

    const { error } = await adminClient.from('ai_api_keys').upsert(record, { onConflict: 'alias' });
    if (error) {
      if (isSchemaCacheError(error)) {
        return setupRequiredResponse();
      }
      return json(500, { error: error.message });
    }

    return json(200, { ok: true });
  }

  if (action === 'delete_key') {
    const keyId = String(payload.keyId ?? '').trim();
    if (!keyId) return json(400, { error: 'keyId is required' });

    const { error } = await adminClient.from('ai_api_keys').delete().eq('id', keyId);
    if (error) {
      if (isSchemaCacheError(error)) {
        return setupRequiredResponse();
      }
      return json(500, { error: error.message });
    }

    return json(200, { ok: true });
  }

  if (action === 'list_logs') {
    const limit = Math.min(200, Math.max(10, Number(payload.limit ?? 60)));

    const { data, error } = await adminClient
      .from('ai_chat_logs')
      .select('id,user_id,mode_id,provider,model,router_confidence,router_reason,prompt_tokens,completion_tokens,total_tokens,cost_usd,latency_ms,feedback,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (isSchemaCacheError(error)) {
        return setupRequiredResponse({ logs: [] });
      }
      return json(500, { error: error.message });
    }
    return json(200, { ok: true, logs: data ?? [] });
  }

  if (action === 'run_test') {
    const message = String(payload.message ?? '').trim();
    if (!message) return json(400, { error: 'message is required for run_test' });

    const modeId = payload.modeId ? String(payload.modeId) : null;
    const authHeader = request.headers.get('Authorization') ?? request.headers.get('authorization');

    const baseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    if (!baseUrl || !authHeader) {
      return json(500, { error: 'Missing runtime configuration' });
    }

    const response = await fetch(`${baseUrl}/functions/v1/ai-coach-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        message,
        modeId,
        testMode: true,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return json(response.status, { error: data?.error ?? 'run_test failed' });
    }

    return json(200, { ok: true, result: data });
  }

  return json(400, { error: `Unknown action: ${action}` });
});
