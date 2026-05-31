import React, { useEffect, useState } from 'react';
import { LifeBuoy, MessageCircle, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SupportWidget from '@/components/SupportWidget';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type Ticket = {
  id: string;
  subject: string | null;
  status: string;
  source: string;
  created_at: string;
  last_message_at: string | null;
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  ai_chat: { label: 'AI-чат', color: 'bg-primary/20 text-primary' },
  open: { label: 'Передано менеджеру', color: 'bg-accent/20 text-accent' },
  in_progress: { label: 'В работе', color: 'bg-accent/20 text-accent' },
  resolved: { label: 'Решено', color: 'bg-success/20 text-success' },
  closed: { label: 'Закрыто', color: 'bg-muted text-muted-foreground' },
};

const Support: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [mode, setMode] = useState<'idle' | 'new' | 'open'>('idle');

  const load = async () => {
    if (!user?.id) return;
    const { data } = await supabasePublic
      .from('support_tickets')
      .select('id,subject,status,source,created_at,last_message_at,updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    setTickets((data ?? []) as Ticket[]);
  };

  useEffect(() => { void load(); }, [user?.id]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary/20">
            <LifeBuoy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Поддержка</h1>
            <p className="text-muted-foreground">AI-помощь и связь с менеджером</p>
          </div>
        </div>
        <Button onClick={() => { setActiveTicketId(null); setMode('new'); }}>
          <Plus className="w-4 h-4 mr-2" /> Новое обращение
        </Button>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground px-2">Мои обращения</h3>
          {tickets.length === 0 && (
            <p className="text-sm text-muted-foreground p-4 rounded-lg border border-dashed border-border">Пока нет обращений</p>
          )}
          {tickets.map((t) => {
            const s = STATUS_LABEL[t.status] ?? STATUS_LABEL.ai_chat;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTicketId(t.id); setMode('open'); }}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-colors',
                  activeTicketId === t.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/40'
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-medium text-sm truncate">{t.subject || 'Без темы'}</p>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap', s.color)}>{s.label}</span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(t.last_message_at ?? t.created_at).toLocaleString('ru-RU')}
                </p>
              </button>
            );
          })}
        </div>

        <div>
          {mode === 'idle' && (
            <div className="flex flex-col items-center justify-center h-[600px] rounded-xl border border-dashed border-border text-center p-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-lg font-medium mb-1">Нужна помощь?</p>
              <p className="text-sm text-muted-foreground mb-4">Создайте новое обращение — AI ответит мгновенно</p>
              <Button onClick={() => setMode('new')}><Plus className="w-4 h-4 mr-2" /> Начать чат</Button>
            </div>
          )}
          {mode === 'new' && <SupportWidget key="new" initialTicketId={null} onClose={() => { setMode('idle'); void load(); }} />}
          {mode === 'open' && activeTicketId && (
            <SupportWidget key={activeTicketId} initialTicketId={activeTicketId} onClose={() => { setMode('idle'); void load(); }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Support;
