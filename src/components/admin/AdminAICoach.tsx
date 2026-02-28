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

type SettingRow = {
  key: string;
  value_json: unknown;
  description: string | null;
  updated_at?: string;
};

const managedSettings: Array<{ key: string; label: string; description: string }> = [
  { key: 'promising.min_streams_30d', label: 'Эфиров за 30 дней (мин)', description: 'Порог для признания стримера перспективным.' },
  { key: 'promising.min_coins_30d', label: 'Монет за 30 дней (мин)', description: 'Если достигнут, стример считается перспективным.' },
  { key: 'promising.min_completed_tasks', label: 'Завершённых задач (мин)', description: 'Минимум выполненных задач в текущем месяце.' },
  { key: 'promising.min_completion_ratio', label: 'Доля выполнения задач (мин)', description: 'Например 0.35 = 35%.' },
  { key: 'alerts.min_streamer_coins', label: 'Порог доната для стримера', description: 'Минимум монет от донатера конкретному стримеру.' },
  { key: 'alerts.min_global_coins', label: 'Порог доната глобально', description: 'Минимум монет от донатера по всей базе.' },
  { key: 'alerts.min_support_days', label: 'Дней поддержки (мин)', description: 'Минимум дней активности донатера.' },
  { key: 'alerts.max_per_5m', label: 'Лимит алертов за 5 мин', description: 'Антиспам по короткому окну.' },
  { key: 'alerts.max_per_30m', label: 'Лимит алертов за 30 мин', description: 'Антиспам по среднему окну.' },
  { key: 'alerts.max_per_stream', label: 'Лимит алертов за эфир', description: 'Максимум live-сигналов в одном эфире.' },
  { key: 'alerts.same_donor_cooldown_hours', label: 'Кулдаун по донатеру (ч)', description: 'Повторный сигнал по тому же донатеру.' },
];

const modeTitles: Record<string, string> = {
  progress_report: 'Анализ прогресса',
  live_plan: 'План эфира',
  live_review: 'Разбор эфира',
  daily_missions: 'Задачи на сегодня',
  content_factory: 'Контент',
  tiktok_qa: 'TikTok правила',
  universal_chat: 'Свободный диалог',
};

const modePromptTemplates: Record<string, string> = {
  progress_report:
    'Ты AI Coach NovaBoost. Режим: progress_report. Сначала короткий итог (3-5 строк), затем блоки: Сильные стороны, Слабые зоны, План на 7 дней, Быстрые задачи на 24 часа. Используй только данные из user_data. Если данных мало — явно укажи, каких метрик не хватает.',
  live_plan:
    'Ты AI Coach NovaBoost. Режим: live_plan. Построй сценарий эфира по тайм-блокам: старт, разогрев, ядро, интерактив, удержание, финал. Для каждого блока добавь: цель, пример фраз, триггер активности, реакцию на подарки.',
  live_review:
    'Ты AI Coach NovaBoost. Режим: live_review. Разбери эфир структурно: что сработало, что просело, почему, и как исправить в следующем эфире. Верни 5 приоритетных действий с метриками контроля.',
  daily_missions:
    'Ты AI Coach NovaBoost. Режим: daily_missions. Верни строго формат: 3 обязательных, 2 дополнительных, 1 усиление. Каждая миссия должна быть измеримой, с дедлайном и ожидаемым результатом.',
  content_factory:
    'Ты AI Coach NovaBoost. Режим: content_factory. Сгенерируй идеи контента для TikTok Live: хук, сценарий, CTA, интерактив, варианты на разные уровни активности чата. Избегай общих фраз, давай конкретные формулировки.',
  tiktok_qa:
    'Ты AI Policy Helpdesk NovaBoost. Отвечай ТОЛЬКО на основе policy_context. Если в данных нет точного правила — прямо скажи об этом и запроси уточнение. Всегда добавляй раздел "Источники".',
  universal_chat:
    'Ты универсальный AI Coach NovaBoost. Определи намерение пользователя, выбери практичную структуру ответа и дай конкретные шаги. Если запрос размытый — задай один уточняющий вопрос.',
};

const modeStyleTemplates: Record<string, string> = {
  progress_report: 'Аналитично, конкретно, по пунктам.',
  live_plan: 'Динамично, с таймингом и готовыми репликами.',
  live_review: 'Конструктивно и без воды, с приоритетами.',
  daily_missions: 'Формат чек-листа: коротко и измеримо.',
  content_factory: 'Креативно, но применимо сразу на эфире.',
  tiktok_qa: 'Строго по правилам и со ссылкой на источники.',
  universal_chat: 'Дружелюбно и по делу.',
};

const AdminAICoach: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [setupWarning, setSetupWarning] = useState<string | null>(null);
  const [savingModeId, setSavingModeId] = useState<string | null>(null);
  const [modes, setModes] = useState<AiMode[]>([]);
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  const [newKeyAlias, setNewKeyAlias] = useState('');
  const [newKeyProvider, setNewKeyProvider] = useState('openai');
  const [newKeySecret, setNewKeySecret] = useState('');
  const [newKeyActive, setNewKeyActive] = useState(true);

  const [testModeId, setTestModeId] = useState('progress_report');
  const [testPrompt, setTestPrompt] = useState('Сделай анализ моего прогресса стримов за 7 дней: сильные стороны, слабые зоны и план на неделю.');
  const [testResult, setTestResult] = useState('');
  const [runningTest, setRunningTest] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setSetupWarning(null);

    const [modesRes, keysRes, logsRes, settingsRes] = await Promise.all([
      supabasePublic.functions.invoke('admin-ai-coach', { body: { action: 'get_modes' } }),
      supabasePublic.functions.invoke('admin-ai-coach', { body: { action: 'list_keys' } }),
      supabasePublic.functions.invoke('admin-ai-coach', { body: { action: 'list_logs', limit: 60 } }),
      supabasePublic.functions.invoke('admin-ai-coach', { body: { action: 'get_settings' } }),
    ]);

    if (!modesRes.error && modesRes.data?.ok) {
      setModes(modesRes.data.modes as AiMode[]);
      if (modesRes.data.setupRequired) {
        setSetupWarning(String(modesRes.data.setupMessage ?? 'AI Coach schema is not ready yet.'));
      }
    }

    if (!keysRes.error && keysRes.data?.ok) {
      setKeys(keysRes.data.keys as ApiKeyRow[]);
      if (keysRes.data.setupRequired) {
        setSetupWarning(String(keysRes.data.setupMessage ?? 'AI Coach schema is not ready yet.'));
      }
    }

    if (!logsRes.error && logsRes.data?.ok) {
      setLogs(logsRes.data.logs as LogRow[]);
      if (logsRes.data.setupRequired) {
        setSetupWarning(String(logsRes.data.setupMessage ?? 'AI Coach schema is not ready yet.'));
      }
    }

    if (!settingsRes.error && settingsRes.data?.ok) {
      const rows = (settingsRes.data.settings ?? []) as SettingRow[];
      const nextMap = rows.reduce<Record<string, string>>((acc, row) => {
        if (typeof row.value_json === 'number' || typeof row.value_json === 'boolean') {
          acc[row.key] = String(row.value_json);
        } else if (typeof row.value_json === 'string') {
          acc[row.key] = row.value_json;
        } else {
          acc[row.key] = '';
        }
        return acc;
      }, {});

      setSettingsMap(nextMap);

      if (settingsRes.data.setupRequired) {
        setSetupWarning(String(settingsRes.data.setupMessage ?? 'AI Coach schema is not ready yet.'));
      }
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

  const saveSettings = async () => {
    setSavingSettings(true);

    const payload = managedSettings.map((entry) => {
      const raw = String(settingsMap[entry.key] ?? '').trim();
      const numeric = Number(raw);
      return {
        key: entry.key,
        value_json: Number.isFinite(numeric) && raw !== '' ? numeric : raw,
        description: entry.description,
      };
    });

    const { data, error } = await supabasePublic.functions.invoke('admin-ai-coach', {
      body: {
        action: 'save_settings',
        settings: payload,
      },
    });

    if (error || !data?.ok) {
      toast({ title: 'Не удалось сохранить настройки', description: error?.message ?? data?.error, variant: 'destructive' });
      setSavingSettings(false);
      return;
    }

    toast({ title: 'Настройки AI сохранены', description: 'Новые пороги anti-spam и перспективности применены.' });
    setSavingSettings(false);
    await loadAll();
  };

  if (loading) {
    return <div className="rounded-xl glass border border-border p-6 text-sm text-muted-foreground">Загрузка AI Coach настроек...</div>;
  }

  return (
    <div className="space-y-6">
      {setupWarning && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          {setupWarning}
        </div>
      )}

      <div className="rounded-xl glass border border-border p-4 flex items-center gap-3">
        <Bot className="w-5 h-5 text-primary" />
        <div>
          <p className="font-semibold">Настройки AI Coach</p>
          <p className="text-sm text-muted-foreground">Режимы, API-ключи, логи и тестирование</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-secondary/20 p-4 text-sm space-y-1">
        <p><span className="font-semibold">model</span> — строковый ID модели провайдера (например, gpt-4o-mini).</p>
        <p><span className="font-semibold">key_alias</span> — фиксирует режим на конкретный ключ; если пусто, используется автопул активных ключей провайдера.</p>
        <p><span className="font-semibold">temperature</span> — креативность: 0.2 строже, 0.7 креативнее.</p>
        <p><span className="font-semibold">max_tokens</span> — максимальная длина ответа.</p>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><Bot className="w-4 h-4" /> Автоматизация и anti-spam</h3>
        <div className="rounded-xl border border-border p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Здесь настраиваются пороги перспективности и лимиты live-уведомлений. Изменения применяются без новой миграции.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {managedSettings.map((setting) => (
              <div key={setting.key} className="space-y-1">
                <label className="text-sm font-medium">{setting.label}</label>
                <input
                  value={settingsMap[setting.key] ?? ''}
                  onChange={(event) => setSettingsMap((prev) => ({ ...prev, [setting.key]: event.target.value }))}
                  className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm"
                  placeholder={setting.key}
                />
                <p className="text-xs text-muted-foreground">{setting.description}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => void saveSettings()}
              disabled={savingSettings}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              Сохранить пороги
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Bot className="w-4 h-4" /> Настройки режимов</h3>
        {sortedModes.map((mode) => (
          <div key={mode.id} className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <p className="font-medium">{modeTitles[mode.id] ?? mode.id}</p>
              <label className="ml-auto text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={mode.enabled}
                  onChange={(event) => updateModeField(mode.id, 'enabled', event.target.checked)}
                />
                включён
              </label>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                value={mode.provider}
                onChange={(event) => updateModeField(mode.id, 'provider', event.target.value)}
                className="px-3 py-2 rounded-md bg-background border border-border text-sm"
                placeholder="Провайдер"
              />
              <input
                value={mode.model}
                onChange={(event) => updateModeField(mode.id, 'model', event.target.value)}
                className="px-3 py-2 rounded-md bg-background border border-border text-sm"
                placeholder="Модель"
              />
              <input
                type="number"
                step="0.1"
                value={mode.temperature}
                onChange={(event) => updateModeField(mode.id, 'temperature', Number(event.target.value))}
                className="px-3 py-2 rounded-md bg-background border border-border text-sm"
                placeholder="Креативность"
              />
              <input
                type="number"
                value={mode.max_tokens}
                onChange={(event) => updateModeField(mode.id, 'max_tokens', Number(event.target.value))}
                className="px-3 py-2 rounded-md bg-background border border-border text-sm"
                placeholder="Длина ответа"
              />
              <input
                type="number"
                step="0.01"
                value={mode.cost_limit_daily_usd}
                onChange={(event) => updateModeField(mode.id, 'cost_limit_daily_usd', Number(event.target.value))}
                className="px-3 py-2 rounded-md bg-background border border-border text-sm"
                placeholder="Лимит затрат / день"
              />
              <input
                type="number"
                value={mode.rate_limit_per_minute}
                onChange={(event) => updateModeField(mode.id, 'rate_limit_per_minute', Number(event.target.value))}
                className="px-3 py-2 rounded-md bg-background border border-border text-sm"
                placeholder="Лимит запросов / мин"
              />
              <input
                value={mode.key_alias ?? ''}
                onChange={(event) => updateModeField(mode.id, 'key_alias', event.target.value || null)}
                className="px-3 py-2 rounded-md bg-background border border-border text-sm"
                placeholder="Название ключа"
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
              placeholder="Инструкция для режима"
            />

            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <p>Подсказка: используй расширенную инструкцию режима, чтобы ответы были стабильнее.</p>
              <button
                onClick={() => {
                  updateModeField(mode.id, 'system_prompt', modePromptTemplates[mode.id] ?? mode.system_prompt);
                  updateModeField(mode.id, 'style_guide', modeStyleTemplates[mode.id] ?? mode.style_guide);
                }}
                className="px-2 py-1 rounded border border-border hover:bg-secondary text-xs"
              >
                Подставить рекомендуемую инструкцию
              </button>
            </div>

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
        <h3 className="font-semibold flex items-center gap-2"><KeyRound className="w-4 h-4" /> API-ключи</h3>
        <div className="rounded-xl border border-border bg-secondary/20 p-3 text-sm text-muted-foreground">
          Рекомендуемо создать 2-3 ключа одного провайдера (например OpenAI): система автоматически переключится на другой, если один упрётся в лимит/ошибку.
        </div>
        <div className="rounded-xl border border-border p-4 grid grid-cols-1 lg:grid-cols-5 gap-3">
          <input
            value={newKeyAlias}
            onChange={(event) => setNewKeyAlias(event.target.value)}
            placeholder="Название ключа"
            className="px-3 py-2 rounded-md bg-background border border-border text-sm"
          />
          <input
            value={newKeyProvider}
            onChange={(event) => setNewKeyProvider(event.target.value)}
            placeholder="Провайдер"
            className="px-3 py-2 rounded-md bg-background border border-border text-sm"
          />
          <input
            value={newKeySecret}
            onChange={(event) => setNewKeySecret(event.target.value)}
            placeholder="Секретный ключ"
            className="px-3 py-2 rounded-md bg-background border border-border text-sm"
          />
          <label className="text-sm flex items-center gap-2 px-2">
            <input type="checkbox" checked={newKeyActive} onChange={(event) => setNewKeyActive(event.target.checked)} />
            активен
          </label>
          <button
            onClick={() => void saveApiKey()}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm"
          >
            <Save className="w-4 h-4" /> Добавить ключ
          </button>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left px-3 py-2">Название</th>
                <th className="text-left px-3 py-2">Провайдер</th>
                <th className="text-left px-3 py-2">Ключ</th>
                <th className="text-left px-3 py-2">Статус</th>
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
        <h3 className="font-semibold flex items-center gap-2"><TestTube2 className="w-4 h-4" /> Проверка ответа</h3>
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <select
              value={testModeId}
              onChange={(event) => setTestModeId(event.target.value)}
              className="px-3 py-2 rounded-md bg-background border border-border text-sm"
            >
              {sortedModes.map((mode) => (
                <option key={mode.id} value={mode.id}>{modeTitles[mode.id] ?? mode.id}</option>
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
            Запустить проверку
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
                <th className="text-left px-3 py-2">Режим</th>
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
                  <td className="px-3 py-2">{modeTitles[log.mode_id] ?? log.mode_id}</td>
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
