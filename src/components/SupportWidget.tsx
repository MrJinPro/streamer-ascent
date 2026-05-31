import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, UserCog, Bot, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Category = { id: string; title: string; slug: string; description: string | null };
type Message = {
  id: string;
  ticket_id: string;
  sender_kind: 'user' | 'ai' | 'staff' | 'system';
  body: string;
  created_at: string;
};

interface Props {
  initialTicketId?: string | null;
  onClose?: () => void;
}

const SupportWidget: React.FC<Props> = ({ initialTicketId = null, onClose }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [ticketId, setTicketId] = useState<string | null>(initialTicketId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalateCategory, setEscalateCategory] = useState<string>('');
  const [escalateSubject, setEscalateSubject] = useState('');
  const [escalating, setEscalating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await supabasePublic.from('support_categories').select('*').eq('is_active', true).order('sort_order');
      setCategories((data ?? []) as Category[]);
    })();
  }, []);

  // Preload messages for existing ticket
  useEffect(() => {
    if (!initialTicketId) {
      setMessages([]);
      return;
    }
    void (async () => {
      const { data } = await supabasePublic
        .from('support_messages')
        .select('*')
        .eq('ticket_id', initialTicketId)
        .order('created_at');
      setMessages((data ?? []) as Message[]);
    })();
  }, [initialTicketId]);

  // Realtime subscription
  useEffect(() => {
    if (!ticketId) return;
    const channel = supabasePublic
      .channel(`support-ticket-${ticketId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${ticketId}` }, (payload) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === (payload.new as any).id)) return prev;
          return [...prev, payload.new as Message];
        });
      })
      .subscribe();
    return () => { void supabasePublic.removeChannel(channel); };
  }, [ticketId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const reloadMessages = async (tId: string) => {
    const { data } = await supabasePublic.from('support_messages').select('*').eq('ticket_id', tId).order('created_at');
    setMessages((data ?? []) as Message[]);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);
    setInput('');

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, ticket_id: ticketId ?? '', sender_kind: 'user', body: text, created_at: new Date().toISOString() }]);

    const { data, error } = await supabasePublic.functions.invoke('support-ai-chat', {
      body: { ticketId, message: text, action: 'chat' },
    });

    setLoading(false);

    if (error || !data?.ok) {
      toast({ title: 'Ошибка', description: error?.message ?? data?.error ?? 'Не удалось отправить', variant: 'destructive' });
      return;
    }

    const tId = data.ticketId ?? ticketId;
    if (!ticketId && data.ticketId) setTicketId(data.ticketId);
    if (tId) await reloadMessages(tId);
  };

  const escalate = async () => {
    if (!escalateCategory) {
      toast({ title: 'Выберите категорию', variant: 'destructive' });
      return;
    }
    setEscalating(true);
    const { data, error } = await supabasePublic.functions.invoke('support-ai-chat', {
      body: { ticketId, action: 'escalate', categoryId: escalateCategory, subject: escalateSubject || undefined },
    });
    setEscalating(false);
    if (error || !data?.ok) {
      toast({ title: 'Не удалось передать', description: error?.message ?? data?.error, variant: 'destructive' });
      return;
    }
    const tId = data.ticketId ?? ticketId;
    if (data.ticketId && !ticketId) setTicketId(data.ticketId);
    setEscalateOpen(false);
    toast({ title: 'Обращение передано менеджеру', description: 'Ответ придёт в этот чат.' });
    if (tId) await reloadMessages(tId);
  };

  const displayMessages = useMemo(() => {
    if (messages.length === 0) {
      return [{
        id: 'welcome',
        ticket_id: '',
        sender_kind: 'ai' as const,
        body: 'Здравствуйте! Я AI-поддержка NovaBoost. Опишите проблему — постараюсь помочь сразу. Если нужен живой менеджер — нажмите «Связаться с человеком».',
        created_at: new Date().toISOString(),
      }];
    }
    return messages;
  }, [messages]);

  return (
    <div className="flex flex-col h-[600px] max-h-[80vh] bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <h3 className="font-semibold">Обращение в службу поддержки</h3>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
        )}
      </div>

      {!escalateOpen && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {displayMessages.map((m) => (
              <div key={m.id} className={cn('flex gap-2 max-w-[85%]', m.sender_kind === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                  m.sender_kind === 'user' ? 'bg-primary/20 text-primary' :
                  m.sender_kind === 'staff' ? 'bg-accent/20 text-accent' :
                  m.sender_kind === 'system' ? 'bg-muted text-muted-foreground' :
                  'bg-success/20 text-success'
                )}>
                  {m.sender_kind === 'user' ? <UserCog className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={cn(
                  'rounded-xl px-3 py-2 text-sm whitespace-pre-wrap',
                  m.sender_kind === 'user' ? 'bg-primary text-primary-foreground' :
                  m.sender_kind === 'system' ? 'bg-muted text-muted-foreground italic text-xs' :
                  'bg-secondary'
                )}>{m.body}</div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> AI печатает...
              </div>
            )}
          </div>

          <div className="border-t border-border p-3 space-y-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Опишите вашу проблему..."
              maxLength={2000}
              className="min-h-[70px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); }
              }}
            />
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={() => setEscalateOpen(true)} disabled={loading}>
                <UserCog className="w-4 h-4 mr-1" /> Связаться с человеком
              </Button>
              <Button size="sm" onClick={() => void send()} disabled={!input.trim() || loading}>
                <Send className="w-4 h-4 mr-1" /> Отправить
              </Button>
            </div>
            <div className="text-xs text-muted-foreground text-right">{input.length}/2000</div>
          </div>
        </>
      )}

      {escalateOpen && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <Label>Категория обращения *</Label>
            <Select value={escalateCategory} onValueChange={setEscalateCategory}>
              <SelectTrigger><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Кратко (необязательно)</Label>
            <Input value={escalateSubject} onChange={(e) => setEscalateSubject(e.target.value)} placeholder="Тема обращения" maxLength={120} />
          </div>
          <div className="rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground">
            История чата с AI будет передана менеджеру вместе с вашим обращением.
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setEscalateOpen(false)} disabled={escalating}>Отмена</Button>
            <Button onClick={() => void escalate()} disabled={escalating || !escalateCategory}>
              {escalating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Передать менеджеру'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportWidget;
