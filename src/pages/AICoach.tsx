import React, { useEffect, useMemo, useState } from 'react';
import { Bot, Send, Sparkles, Lightbulb, TrendingUp, MessageSquare, CalendarCheck2, Mic2, ClipboardList, ScrollText, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { toast } from '@/hooks/use-toast';

type ModeId =
  | 'progress_report'
  | 'live_plan'
  | 'live_review'
  | 'daily_missions'
  | 'content_factory'
  | 'tiktok_qa'
  | 'universal_chat';

interface AIMessage {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  modeId?: ModeId;
  logId?: string | null;
  sources?: Array<{
    id: string;
    title: string;
    sourceUrl?: string | null;
  }>;
}

type ModeConfig = {
  id: ModeId;
  title: string;
  icon: React.ElementType;
};

const modeTabs: ModeConfig[] = [
  { id: 'progress_report', title: 'Анализ', icon: TrendingUp },
  { id: 'live_plan', title: 'План эфира', icon: Mic2 },
  { id: 'live_review', title: 'Разбор', icon: ClipboardList },
  { id: 'daily_missions', title: 'Миссии', icon: CalendarCheck2 },
  { id: 'content_factory', title: 'Контент', icon: Lightbulb },
  { id: 'tiktok_qa', title: 'TikTok правила', icon: ScrollText },
  { id: 'universal_chat', title: 'Диалог', icon: MessageSquare },
];

const modeLabels: Record<ModeId, string> = {
  progress_report: 'progress_report',
  live_plan: 'live_plan',
  live_review: 'live_review',
  daily_missions: 'daily_missions',
  content_factory: 'content_factory',
  tiktok_qa: 'tiktok_qa',
  universal_chat: 'universal_chat',
};

const AICoach: React.FC = () => {
  const [activeMode, setActiveMode] = useState<ModeId>('universal_chat');
  const [enabledModes, setEnabledModes] = useState<Set<string>>(new Set(modeTabs.map((item) => item.id)));
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      content:
        'AI Coach в боевом режиме. Выбери вкладку режима или используй «Диалог» для автоподбора через Router.\n\nОтветы формируются с учётом данных профиля и настроек режима из админки.',
      isAI: true,
      timestamp: new Date(),
    },
  ]);

  const quickActions = useMemo(
    () => [
      { icon: TrendingUp, label: 'Отчёт 7 дней', prompt: 'Сделай анализ прогресса за 7 дней и дай план на неделю' },
      { icon: Mic2, label: 'Сценарий эфира', prompt: 'Собери сценарий эфира на 90 минут с пиками активности' },
      { icon: CalendarCheck2, label: 'Миссии на сегодня', prompt: 'Составь миссии на сегодня в формате 3+2+1' },
      { icon: Sparkles, label: 'Идеи контента', prompt: 'Дай 10 идей контента с хуками для TikTok Live' },
    ],
    [],
  );

  useEffect(() => {
    const loadModes = async () => {
      const { data, error } = await (supabasePublic as any).rpc('ai_modes_public');
      if (error) return;

      const ids = new Set<string>((data ?? []).map((item: any) => String(item.id)));
      if (ids.size > 0) {
        setEnabledModes(ids);
        if (!ids.has(activeMode)) {
          setActiveMode('universal_chat');
        }
      }
    };

    void loadModes();
  }, [activeMode]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    const input = message.trim();
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      content: input,
      isAI: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setSending(true);

    const selectedMode = activeMode === 'universal_chat' ? null : activeMode;

    const { data, error } = await supabasePublic.functions.invoke('ai-coach-chat', {
      body: {
        message: input,
        modeId: selectedMode,
        language: 'ru',
      },
    });

    if (error || !data?.ok) {
      toast({
        title: 'AI Coach недоступен',
        description: error?.message ?? data?.error ?? 'Не удалось получить ответ',
        variant: 'destructive',
      });
      setSending(false);
      return;
    }

    const aiResponse: AIMessage = {
      id: (Date.now() + 1).toString(),
      content: String(data.answer ?? 'Пустой ответ'),
      isAI: true,
      timestamp: new Date(),
      modeId: data.modeId as ModeId,
      logId: data.logId ?? null,
      sources: (data.sources ?? []).map((item: any) => ({
        id: String(item.id),
        title: String(item.title ?? 'Источник'),
        sourceUrl: item.sourceUrl ? String(item.sourceUrl) : null,
      })),
    };

    setMessages(prev => [...prev, aiResponse]);
    setSending(false);
  };

  const sendFeedback = async (logId: string, value: 1 | -1) => {
    const { error } = await (supabasePublic as any).rpc('ai_save_feedback', {
      p_log_id: logId,
      p_feedback: value,
    });

    if (error) {
      toast({ title: 'Не удалось сохранить feedback', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Feedback сохранён', description: value > 0 ? 'Спасибо за оценку 👍' : 'Принято, улучшим ответ 👌' });
  };

  const handleQuickAction = (prompt: string) => {
    setMessage(prompt);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-cosmic shadow-glow">
          <Bot className="w-7 h-7 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">AI Coach</h1>
          <p className="text-muted-foreground">Центральное интеллектуальное ядро NovaBoost Tools</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/20 text-success text-sm">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Онлайн
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {modeTabs.map((tab) => {
          const isActive = activeMode === tab.id;
          const isDisabled = !enabledModes.has(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && setActiveMode(tab.id)}
              disabled={isDisabled}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm',
                isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border',
                isDisabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.title}
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleQuickAction(action.prompt)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border hover:border-primary/50 hover:bg-primary/10 transition-all text-sm"
          >
            <action.icon className="w-4 h-4 text-primary" />
            {action.label}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col rounded-xl glass border border-border overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-4",
                !msg.isAI && "flex-row-reverse"
              )}
            >
              {msg.isAI && (
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-cosmic shrink-0">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
              <div className={cn(
                "max-w-[75%] p-4 rounded-2xl",
                msg.isAI 
                  ? "bg-secondary/80 text-foreground rounded-tl-sm" 
                  : "bg-primary text-primary-foreground rounded-tr-sm"
              )}>
                <p className="text-sm whitespace-pre-line">{msg.content}</p>
                {msg.isAI && msg.modeId && (
                  <p className="text-[11px] mt-2 text-primary">Режим: {modeLabels[msg.modeId]}</p>
                )}

                {msg.isAI && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/60 space-y-1">
                    <p className="text-[11px] text-muted-foreground">Источники:</p>
                    {msg.sources.slice(0, 3).map((src) => (
                      <p key={src.id} className="text-[11px] text-muted-foreground truncate">
                        • {src.title}
                      </p>
                    ))}
                  </div>
                )}

                {msg.isAI && msg.logId && (
                  <div className="mt-2 pt-2 border-t border-border/60 flex items-center gap-2">
                    <button
                      onClick={() => void sendFeedback(msg.logId!, 1)}
                      className="p-1 rounded hover:bg-success/20 text-success"
                      title="Полезно"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => void sendFeedback(msg.logId!, -1)}
                      className="p-1 rounded hover:bg-destructive/20 text-destructive"
                      title="Не полезно"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <p className={cn(
                  "text-[10px] mt-2",
                  msg.isAI ? "text-muted-foreground" : "text-primary-foreground/70"
                )}>
                  {msg.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
              placeholder="Спроси что-нибудь..."
              className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
            />
            <button 
              onClick={() => void handleSend()}
              disabled={sending}
              className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-glow disabled:opacity-60"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Текущий режим: {modeLabels[activeMode]} • Router и Gateway работают через Supabase Edge Functions
          </p>
        </div>
      </div>
    </div>
  );
};

export default AICoach;
