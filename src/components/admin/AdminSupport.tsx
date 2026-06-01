import React, { useEffect, useMemo, useState } from 'react';
import { LifeBuoy, Send } from 'lucide-react';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Ticket = {
  id: string;
  user_id: string;
  subject: string | null;
  status: string;
  priority: string | null;
  source: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

type Message = {
  id: string;
  ticket_id: string;
  sender_user_id: string | null;
  sender_kind: 'user' | 'ai' | 'staff' | 'system';
  body: string;
  created_at: string;
};

const STATUS_FILTERS = ['all', 'open', 'in_progress', 'resolved', 'closed'] as const;

const AdminSupport: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>('open');
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);

  const filtered = useMemo(
    () => (filter === 'all' ? tickets : tickets.filter(t => t.status === filter)),
    [tickets, filter],
  );

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabasePublic
      .from('support_tickets')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(200);
    if (error) toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    setTickets((data ?? []) as Ticket[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (!selected) { setMessages([]); return; }
    void (async () => {
      const { data } = await supabasePublic
        .from('support_messages')
        .select('*')
        .eq('ticket_id', selected)
        .order('created_at');
      setMessages((data ?? []) as Message[]);
    })();

    const channel = supabasePublic
      .channel(`support_admin_${selected}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${selected}` },
        (payload) => setMessages(prev => [...prev, payload.new as Message]))
      .subscribe();
    return () => { void supabasePublic.removeChannel(channel); };
  }, [selected]);

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    const { data: { user } } = await supabasePublic.auth.getUser();
    if (!user) return;
    const { error } = await supabasePublic.from('support_messages').insert({
      ticket_id: selected,
      sender_user_id: user.id,
      sender_kind: 'staff',
      body: reply.trim(),
    });
    if (error) { toast({ title: 'Ошибка', description: error.message, variant: 'destructive' }); return; }
    setReply('');
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabasePublic.from('support_tickets').update({ status }).eq('id', id);
    if (error) { toast({ title: 'Ошибка', description: error.message, variant: 'destructive' }); return; }
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  if (loading) return <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">Загрузка тикетов...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <LifeBuoy className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Тикеты поддержки</h3>
        <div className="ml-auto flex gap-1 p-1 rounded-md bg-secondary text-xs">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn('px-3 py-1 rounded', filter === s ? 'bg-background shadow' : 'text-muted-foreground')}
            >
              {s === 'all' ? 'Все' : s === 'open' ? 'Открытые' : s === 'in_progress' ? 'В работе' : s === 'resolved' ? 'Решены' : 'Закрыты'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-[320px_1fr] gap-4">
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground p-3">Нет тикетов</p>}
          {filtered.map(t => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={cn(
                'w-full text-left rounded-lg border p-3 transition-colors',
                selected === t.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/40',
              )}
            >
              <p className="font-medium text-sm truncate">{t.subject || 'Без темы'}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="px-2 py-0.5 rounded bg-secondary">{t.status}</span>
                <span className="px-2 py-0.5 rounded bg-secondary">{t.source || '—'}</span>
                <span className="ml-auto">{new Date(t.updated_at).toLocaleDateString('ru-RU')}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border flex flex-col min-h-[400px]">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Выберите тикет</div>
          ) : (
            <>
              <div className="p-3 border-b border-border flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Статус:</span>
                {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                  <Button key={s} size="sm" variant="outline" onClick={() => void setStatus(selected, s)}>{s}</Button>
                ))}
              </div>
              <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[420px]">
                {messages.map(m => (
                  <div key={m.id} className={cn('rounded-lg p-2 text-sm', m.sender_kind === 'user' ? 'bg-secondary' : m.sender_kind === 'ai' ? 'bg-accent/10 border border-accent/30' : m.sender_kind === 'staff' ? 'bg-primary/10 border border-primary/30' : 'bg-muted')}>
                    <p className="text-xs text-muted-foreground mb-1">{m.sender_kind} • {new Date(m.created_at).toLocaleString('ru-RU')}</p>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Ответ от поддержки..." className="min-h-[60px]" />
                <Button onClick={() => void sendReply()}><Send className="w-4 h-4" /></Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;
