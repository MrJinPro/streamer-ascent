import React, { useEffect, useMemo, useState } from 'react';
import { Bot, KeyRound, ScrollText, TestTube2, Save, Trash2 } from 'lucide-react';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { toast } from '@/hooks/use-toast';

type AiMode = {
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
  updated_at?: string;
};

type ApiKeyRow = {
  id: string;
  alias: string;
  provider: string;
  is_active: boolean;
  secret_masked: string;
  updated_at: string;
};

type LogRow = {
  id: string;
  user_id: string | null;
  mode_id: string;
  model: string | null;
  total_tokens: number | null;
  cost_usd: number | null;
  latency_ms: number | null;
  feedback: number | null;
  created_at: string;
};

const modeTitles: Record<string, string> = {
  progress_report: 'Анализ прогресса',
  live_plan: 'План эфира',
  live_review: 'Разбор эфира',
  daily_missions: 'Миссии дня',
  content_factory: 'Контент-фабрика',
  tiktok_qa: 'TikTok правила',
  universal_chat: 'Универсальный чат',
};

const AdminAICoach: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [savingModeId, setSavingModeId] = useState<string | null>(null);
  const [modes, setModes] = useState<AiMode[]>([]);
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);

  const [newKeyAlias, setNewKeyAlias] = useState('');
  const [newKeyProvider, setNewKeyProvider] = useState('openai');
  const [newKeySecret, setNewKeySecret] = useState('');
  const [newKeyActive, setNewKeyActive] = useState(true);

  const [testModeId, setTestModeId] = useState('universal_chat');
  const [testPrompt, setTestPrompt] = useState('Сделай короткий анализ моего прогресса за неделю.');
  const [testResult, setTestResult] = useState('');
  const [runningTest, setRunningTest] = useState(false);

  const loadAll = async () => {
    setLoading(true);

    const [modesRes, keysRes, logsRes] = await Promise.all([
      supabasePublic.functions.invoke('admin-ai-coach', { body: { action: 'get_modes' } }),
      supabasePublic.functions.invoke('admin-ai-coach', { body: { action: 'list_keys' } }),
      supabasePublic.functions.invoke('admin-ai-coach', { body: { action: 'list_logs', limit: 60 } }),
    ]);

    if (!modesRes.error && modesRes.data?.ok) {
      setModes(modesRes.data.modes as AiMode[]);
    }

    if (!keysRes.error && keysRes.data?.ok) {
      setKeys(keysRes.data.keys as ApiKeyRow[]);
    }

    if (!logsRes.error && logsRes.data?.ok) {
      setLogs(logsRes.data.logs as LogRow[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const sortedModes = useMemo(
    () => [...modes].sort((a, b) => a.id.localeCompare(b.id, 'ru')),
    [modes],
  );

  const updateModeField = <K extends keyof AiMode>(modeId: string, key: K, value: AiMode[K]) => {
    setModes((prev) => prev.map((item) => (item.id === modeId ? { ...item, [key]: value } : item)));
  };

  const saveMode = async (mode: AiMode) => {
    setSavingModeId(mode.id);
    const { data, error } = await supabasePublic.functions.invoke('admin-ai-coach', {
      body: {
        action: 'save_mode',
        mode,
      },
    });

    if (error || !data?.ok) {
      toast({ title: 'Не удалось сохранить режим', description: error?.message ?? data?.error, variant: 'destructive' });
      setSavingModeId(null);
      return;
    }

    toast({ title: 'Режим сохранён', description: modeTitles[mode.id] ?? mode.id });
    setSavingModeId(null);
  };

  const saveApiKey = async () => {
    if (!newKeyAlias.trim() || !newKeyProvider.trim() || !newKeySecret.trim()) {
      toast({ title: 'Заполни alias/provider/secret', variant: 'destructive' });
      return;
    }

    const { data, error } = await supabasePublic.functions.invoke('admin-ai-coach', {
      body: {
        action: 'save_key',
        key: {
          alias: newKeyAlias.trim(),
          provider: newKeyProvider.trim(),
          secret_value: newKeySecret.trim(),
          is_active: newKeyActive,
        },
      },
    });

    if (error || !data?.ok) {
      toast({ title: 'Не удалось сохранить ключ', description: error?.message ?? data?.error, variant: 'destructive' });
      return;
    }

    setNewKeySecret('');
    toast({ title: 'API-ключ сохранён', description: newKeyAlias.trim() });
    await loadAll();
  };

  const deleteApiKey = async (id: string) => {
    const { data, error } = await supabasePublic.functions.invoke('admin-ai-coach', {
      body: { action: 'delete_key', keyId: id },
    });

    if (error || !data?.ok) {
      toast({ title: 'Не удалось удалить ключ', description: error?.message ?? data?.error, variant: 'destructive' });
      return;
    }

    toast({ title: 'Ключ удалён' });
    await loadAll();
  };

  const runTest = async () => {
    if (!testPrompt.trim()) {
      toast({ title: 'Введите test prompt', variant: 'destructive' });
      return;
    }

    setRunningTest(true);
    const { data, error } = await supabasePublic.functions.invoke('admin-ai-coach', {
      body: {
        action: 'run_test',
        modeId: testModeId,
        message: testPrompt.trim(),
      },
    });

    if (error || !data?.ok) {
      toast({ title: 'Тест не выполнен', description: error?.message ?? data?.error, variant: 'destructive' });
      setRunningTest(false);
      return;
    }

    setTestResult(String(data.result?.answer ?? 'Пустой ответ'));
    setRunningTest(false);
  };

  if (loading) {
    return <div className="rounded-xl glass border border-border p-6 text-sm text-muted-foreground">Загрузка AI Coach настроек...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl glass border border-border p-4 flex items-center gap-3">
        <Bot className="w-5 h-5 text-primary" />
        <div>
          <p className="font-semibold">AI Coach Settings</p>
          <p className="text-sm text-muted-foreground">Modes, API Keys, Logs и Test Mode</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Bot className="w-4 h-4" /> Modes Settings</h3>
        {sortedModes.map((mode) => (
          <div key={mode.id} className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <p className="font-medium">{modeTitles[mode.id] ?? mode.id}</p>
              <span className="text-xs px-2 py-0.5 rounded bg-secondary">{mode.id}</span>
              <label className="ml-auto text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={mode.enabled}
                  onChange={(event) => updateModeField(mode.id, 'enabled', event.target.checked)}
                />
                enabled
              </label>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                value={mode.provider}
                onChange={(event) => updateModeField(mode.id, 'provider', event.target.value)}
                className="px-3 py-2 rounded-md bg-background border border-border text-sm"
                placeholder="provider"
              />
              <input
                value={mode.model}
                onChange={(event) => updateModeField(mode.id, 'model', event.target.value)}
                className="px-3 py-2 rounded-md bg-background border border-border text-sm"
                placeholder="model"
              />
              <input
                type="number"
                step="0.1"
                value={mode.temperature}
                onChange={(event) => updateModeField(mode.id, 'temperature', Number(event.target.value))}
                className="px-3 py-2 rounded-md bg-background border border-border text-sm"
                placeholder="temperature"
              />
              <input
                type="number"
                value={mode.max_tokens}
                onChange={(event) => updateModeField(mode.id, 'max_tokens', Number(event.target.value))}
                className="px-3 py-2 rounded-md bg-background border border-border text-sm"
                placeholder="max_tokens"
              />
              <input
                type="number"
                step="0.01"
                value={mode.cost_limit_daily_usd}
                onChange={(event) => updateModeField(mode.id, 'cost_limit_daily_usd', Number(event.target.value))}
                className="px-3 py-2 rounded-md bg-background border border-border text-sm"
                placeholder="cost_limit_daily_usd"
              />
              <input
                type="number"
                value={mode.rate_limit_per_minute}
                onChange={(event) => updateModeField(mode.id, 'rate_limit_per_minute', Number(event.target.value))}
                className="px-3 py-2 rounded-md bg-background border border-border text-sm"
                placeholder="rate_limit_per_minute"
              />
              <input
                value={mode.key_alias ?? ''}
                onChange={(event) => updateModeField(mode.id, 'key_alias', event.target.value || null)}
                className="px-3 py-2 rounded-md bg-background border border-border text-sm"
                placeholder="key_alias"
              />
              <input
                value={mode.style_guide ?? ''}
                onChange={(event) => updateModeField(mode.id, 'style_guide', event.target.value || null)}
                className="px-3 py-2 rounded-md bg-background border border-border text-sm"
                placeholder="стиль общения"
              />
            </div>

            <textarea
              value={mode.system_prompt}
              onChange={(event) => updateModeField(mode.id, 'system_prompt', event.target.value)}
              className="w-full px-3 py-2 rounded-md bg-background border border-border min-h-24 text-sm"
              placeholder="system prompt"
            />

            <div className="flex justify-end">
              <button
                onClick={() => void saveMode(mode)}
                disabled={savingModeId === mode.id}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                Сохранить режим
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><KeyRound className="w-4 h-4" /> API Keys</h3>
        <div className="rounded-xl border border-border p-4 grid grid-cols-1 lg:grid-cols-5 gap-3">
          <input
            value={newKeyAlias}
            onChange={(event) => setNewKeyAlias(event.target.value)}
            placeholder="alias"
            className="px-3 py-2 rounded-md bg-background border border-border text-sm"
          />
          <input
            value={newKeyProvider}
            onChange={(event) => setNewKeyProvider(event.target.value)}
            placeholder="provider"
            className="px-3 py-2 rounded-md bg-background border border-border text-sm"
          />
          <input
            value={newKeySecret}
            onChange={(event) => setNewKeySecret(event.target.value)}
            placeholder="secret"
            className="px-3 py-2 rounded-md bg-background border border-border text-sm"
          />
          <label className="text-sm flex items-center gap-2 px-2">
            <input type="checkbox" checked={newKeyActive} onChange={(event) => setNewKeyActive(event.target.checked)} />
            active
          </label>
          <button
            onClick={() => void saveApiKey()}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm"
          >
            <Save className="w-4 h-4" /> Сохранить ключ
          </button>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left px-3 py-2">Alias</th>
                <th className="text-left px-3 py-2">Provider</th>
                <th className="text-left px-3 py-2">Secret</th>
                <th className="text-left px-3 py-2">Active</th>
                <th className="text-left px-3 py-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id} className="border-t border-border">
                  <td className="px-3 py-2">{key.alias}</td>
                  <td className="px-3 py-2">{key.provider}</td>
                  <td className="px-3 py-2 font-mono text-xs">{key.secret_masked}</td>
                  <td className="px-3 py-2">{key.is_active ? 'Да' : 'Нет'}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => void deleteApiKey(key.id)}
                      className="inline-flex items-center gap-1 text-destructive hover:underline"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><TestTube2 className="w-4 h-4" /> Test Mode</h3>
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <select
              value={testModeId}
              onChange={(event) => setTestModeId(event.target.value)}
              className="px-3 py-2 rounded-md bg-background border border-border text-sm"
            >
              {sortedModes.map((mode) => (
                <option key={mode.id} value={mode.id}>{mode.id}</option>
              ))}
            </select>
            <input
              value={testPrompt}
              onChange={(event) => setTestPrompt(event.target.value)}
              className="px-3 py-2 rounded-md bg-background border border-border text-sm lg:col-span-2"
              placeholder="Тестовый запрос"
            />
          </div>

          <button
            onClick={() => void runTest()}
            disabled={runningTest}
            className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-60"
          >
            Run test
          </button>

          {testResult && (
            <div className="rounded-md border border-border bg-secondary/30 p-3 text-sm whitespace-pre-wrap">
              {testResult}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><ScrollText className="w-4 h-4" /> Logs</h3>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left px-3 py-2">Время</th>
                <th className="text-left px-3 py-2">Mode</th>
                <th className="text-left px-3 py-2">Tokens</th>
                <th className="text-left px-3 py-2">Cost</th>
                <th className="text-left px-3 py-2">Latency</th>
                <th className="text-left px-3 py-2">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-border">
                  <td className="px-3 py-2">{new Date(log.created_at).toLocaleString('ru-RU')}</td>
                  <td className="px-3 py-2">{log.mode_id}</td>
                  <td className="px-3 py-2">{log.total_tokens ?? 0}</td>
                  <td className="px-3 py-2">${Number(log.cost_usd ?? 0).toFixed(4)}</td>
                  <td className="px-3 py-2">{log.latency_ms ?? 0} ms</td>
                  <td className="px-3 py-2">{log.feedback === 1 ? '👍' : log.feedback === -1 ? '👎' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAICoach;
