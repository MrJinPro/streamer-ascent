import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, AlertCircle } from 'lucide-react';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type NotificationItem = {
  item_id: string;
  item_kind: 'post_stream_advice' | 'live_alert' | string;
  title: string;
  body: string;
  priority: 'low' | 'medium' | 'high' | string;
  is_read: boolean;
  created_at: string;
};

const priorityLabel: Record<string, string> = {
  low: 'Низкий приоритет',
  medium: 'Средний приоритет',
  high: 'Высокий приоритет',
};

const Notifications: React.FC = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const unreadCount = useMemo(() => items.filter((item) => !item.is_read).length, [items]);

  const loadNotifications = async (onlyUnread: boolean) => {
    setLoading(true);
    const { data, error } = await (supabasePublic as any).rpc('ai_notifications_feed', {
      p_only_unread: onlyUnread,
      p_limit: 100,
    });

    if (error) {
      setLoading(false);
      toast({ title: 'Не удалось загрузить уведомления', description: error.message, variant: 'destructive' });
      return;
    }

    setItems((data ?? []) as NotificationItem[]);
    setLoading(false);
  };

  useEffect(() => {
    void loadNotifications(showOnlyUnread);

    const channel = supabasePublic
      .channel('notifications-feed-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_coach_auto_advices' }, () => {
        void loadNotifications(showOnlyUnread);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_coach_live_alerts' }, () => {
        void loadNotifications(showOnlyUnread);
      })
      .subscribe();

    return () => {
      void supabasePublic.removeChannel(channel);
    };
  }, [showOnlyUnread]);

  const markRead = async (item: NotificationItem) => {
    const { error } = await (supabasePublic as any).rpc('ai_notifications_mark_read', {
      p_item_kind: item.item_kind,
      p_item_id: item.item_id,
    });

    if (error) {
      toast({ title: 'Не удалось обновить уведомление', description: error.message, variant: 'destructive' });
      return;
    }

    setItems((prev) => prev.map((entry) => (entry.item_id === item.item_id ? { ...entry, is_read: true } : entry)));
  };

  const markAllAsRead = async () => {
    const unread = items.filter((item) => !item.is_read);
    if (unread.length === 0) {
      return;
    }

    for (const item of unread) {
      const { error } = await (supabasePublic as any).rpc('ai_notifications_mark_read', {
        p_item_kind: item.item_kind,
        p_item_id: item.item_id,
      });

      if (error) {
        toast({ title: 'Часть уведомлений не обновилась', description: error.message, variant: 'destructive' });
        break;
      }
    }

    setItems((prev) => prev.map((entry) => ({ ...entry, is_read: true })));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-cosmic flex items-center justify-center shadow-glow">
            <Bell className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Уведомления</h1>
            <p className="text-sm text-muted-foreground">Все сигналы от AI Coach в одном месте.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOnlyUnread((prev) => !prev)}
            className={cn(
              'px-3 py-2 text-xs rounded-lg border border-border transition-colors',
              showOnlyUnread ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary hover:bg-secondary/80',
            )}
          >
            {showOnlyUnread ? 'Показываю только непрочитанные' : 'Показать только непрочитанные'}
          </button>
          <button
            onClick={() => void markAllAsRead()}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-lg border border-border bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Отметить всё прочитанным
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Непрочитанных: <span className="text-foreground font-semibold">{unreadCount}</span>
        </p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">Загрузка уведомлений…</div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">Пока уведомлений нет.</div>
        ) : (
          items.map((item) => (
            <div key={`${item.item_kind}:${item.item_id}`} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle
                    className={cn(
                      'w-4 h-4 shrink-0',
                      item.priority === 'high' ? 'text-destructive' : item.priority === 'medium' ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                  <h2 className="text-sm font-semibold truncate">{item.title}</h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!item.is_read && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary">Новое</span>}
                  {!item.is_read && (
                    <button
                      onClick={() => void markRead(item)}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-border hover:bg-secondary transition-colors"
                    >
                      Прочитано
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm whitespace-pre-line text-foreground/90">{item.body}</p>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{priorityLabel[item.priority] ?? 'Сигнал'}</span>
                <span>{new Date(item.created_at).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
