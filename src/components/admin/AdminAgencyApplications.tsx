import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { CheckCircle2, XCircle, Clock, RefreshCw, Mail, ShieldAlert } from 'lucide-react';

type Status = 'pending' | 'approved' | 'rejected';

interface Application {
  id: string;
  full_name: string;
  username: string;
  email: string;
  telegram: string;
  tiktok_username: string;
  age: number | null;
  heard_about: string | null;
  inviter_referral_code: string | null;
  status: Status;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
  offer_version: string | null;
  offer_published_at: string | null;
  accepted_terms_at: string | null;
  accepted_privacy_at: string | null;
  accepted_offer_at: string | null;
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_user_id: string | null;
  assigned_referral_code: string | null;
  email_sent_at: string | null;
  email_error: string | null;
}

const STATUS_LABELS: Record<Status, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: 'Ожидает', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Clock },
  approved: { label: 'Одобрена', className: 'bg-green-500/15 text-green-400 border-green-500/30', icon: CheckCircle2 },
  rejected: { label: 'Отклонена', className: 'bg-red-500/15 text-red-400 border-red-500/30', icon: XCircle },
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const AdminAgencyApplications: React.FC = () => {
  const [items, setItems] = useState<Application[]>([]);
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Application | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabasePublic as any)
      .from('agency_join_applications')
      .select(
        'id, full_name, username, email, telegram, tiktok_username, age, heard_about, inviter_referral_code, status, created_at, ip_address, user_agent, offer_version, offer_published_at, accepted_terms_at, accepted_privacy_at, accepted_offer_at, decided_by, decided_at, decision_note, created_user_id, assigned_referral_code, email_sent_at, email_error',
      )
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      toast({ title: 'Не удалось загрузить заявки', description: error.message, variant: 'destructive' });
    } else {
      setItems((data ?? []) as Application[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((a) => {
      if (filter !== 'all' && a.status !== filter) return false;
      if (!term) return true;
      return (
        a.full_name?.toLowerCase().includes(term) ||
        a.email?.toLowerCase().includes(term) ||
        a.username?.toLowerCase().includes(term) ||
        a.telegram?.toLowerCase().includes(term) ||
        a.tiktok_username?.toLowerCase().includes(term)
      );
    });
  }, [items, filter, search]);

  const counts = useMemo(
    () => ({
      pending: items.filter((i) => i.status === 'pending').length,
      approved: items.filter((i) => i.status === 'approved').length,
      rejected: items.filter((i) => i.status === 'rejected').length,
    }),
    [items],
  );

  const approve = async (app: Application) => {
    setBusyId(app.id);
    const { data, error } = await supabasePublic.functions.invoke('agency-application-decide', {
      body: { applicationId: app.id, action: 'approve' },
    });
    setBusyId(null);

    if (error || !(data as any)?.ok) {
      toast({
        title: 'Ошибка одобрения',
        description: error?.message ?? (data as any)?.error ?? 'Не удалось одобрить заявку',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Заявка одобрена',
      description: (data as any)?.emailSent
        ? 'Пользователю отправлено письмо для входа'
        : `Письмо не отправлено: ${(data as any)?.emailError ?? 'неизвестная ошибка'}`,
    });
    setSelected(null);
    await load();
  };

  const reject = async (app: Application) => {
    if (!rejectNote.trim()) {
      toast({ title: 'Укажите причину отказа', variant: 'destructive' });
      return;
    }
    setRejecting(true);
    const { data, error } = await supabasePublic.functions.invoke('agency-application-decide', {
      body: { applicationId: app.id, action: 'reject', decisionNote: rejectNote.trim() },
    });
    setRejecting(false);

    if (error || !(data as any)?.ok) {
      toast({
        title: 'Ошибка отказа',
        description: error?.message ?? (data as any)?.error ?? 'Не удалось отклонить заявку',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Заявка отклонена' });
    setSelected(null);
    setRejectNote('');
    await load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Заявки в Agency</CardTitle>
          <CardDescription>
            Ожидает: <b className="text-amber-400">{counts.pending}</b> · Одобрено:{' '}
            <b className="text-green-400">{counts.approved}</b> · Отклонено:{' '}
            <b className="text-red-400">{counts.rejected}</b>
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Все' : STATUS_LABELS[f].label}
            </Button>
          ))}
          <Input
            placeholder="Поиск по имени, email, username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ml-auto max-w-sm"
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Дата</th>
                <th className="px-3 py-2 font-medium">Имя / Email</th>
                <th className="px-3 py-2 font-medium">TikTok</th>
                <th className="px-3 py-2 font-medium">Реф. код</th>
                <th className="px-3 py-2 font-medium">Статус</th>
                <th className="px-3 py-2 font-medium text-right">Действие</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    {loading ? 'Загрузка…' : 'Заявок нет'}
                  </td>
                </tr>
              )}
              {filtered.map((a) => {
                const meta = STATUS_LABELS[a.status];
                const Icon = meta.icon;
                return (
                  <tr key={a.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                      {formatDate(a.created_at)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{a.full_name}</div>
                      <div className="text-xs text-muted-foreground">{a.email}</div>
                    </td>
                    <td className="px-3 py-2">@{a.tiktok_username}</td>
                    <td className="px-3 py-2 font-mono text-xs">{a.inviter_referral_code}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className={meta.className}>
                        <Icon className="w-3 h-3 mr-1" />
                        {meta.label}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelected(a)}>
                        Открыть
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && (setSelected(null), setRejectNote(''))}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.full_name}
                  {(() => {
                    const m = STATUS_LABELS[selected.status];
                    const Icon = m.icon;
                    return (
                      <Badge variant="outline" className={m.className}>
                        <Icon className="w-3 h-3 mr-1" />
                        {m.label}
                      </Badge>
                    );
                  })()}
                </DialogTitle>
                <DialogDescription>Заявка от {formatDate(selected.created_at)}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Email" value={selected.email} mono />
                <Field label="Username" value={selected.username} mono />
                <Field label="Telegram" value={selected.telegram} mono />
                <Field label="TikTok" value={`@${selected.tiktok_username}`} mono />
                <Field label="Возраст" value={selected.age?.toString() ?? '—'} />
                <Field label="Откуда узнал" value={selected.heard_about ?? '—'} />
                <Field
                  label="Реф. код пригласившего"
                  value={selected.inviter_referral_code ?? '—'}
                  mono
                />
                {selected.assigned_referral_code && (
                  <Field
                    label="Выдан реф. код"
                    value={selected.assigned_referral_code}
                    mono
                  />
                )}
                <Field label="IP" value={selected.ip_address ?? '—'} mono />
                <Field label="Оферта" value={`v${selected.offer_version} · ${selected.offer_published_at ?? ''}`} />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">User-Agent</div>
                <div className="text-xs font-mono break-all bg-muted/30 p-2 rounded">
                  {selected.user_agent ?? '—'}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>Принял условия: {formatDate(selected.accepted_terms_at)}</div>
                <div>Принял privacy: {formatDate(selected.accepted_privacy_at)}</div>
                <div>Принял оферту: {formatDate(selected.accepted_offer_at)}</div>
              </div>

              {selected.status !== 'pending' && (
                <div className="rounded-lg border border-border p-3 space-y-2 text-sm bg-muted/20">
                  <div className="flex items-center gap-2 font-medium">
                    <ShieldAlert className="w-4 h-4" />
                    История решения
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Решение: <b>{STATUS_LABELS[selected.status].label}</b></div>
                    <div>Когда: {formatDate(selected.decided_at)}</div>
                    <div className="col-span-2">
                      Кем (uid): <span className="font-mono">{selected.decided_by ?? '—'}</span>
                    </div>
                    {selected.created_user_id && (
                      <div className="col-span-2">
                        Создан пользователь: <span className="font-mono">{selected.created_user_id}</span>
                      </div>
                    )}
                    <div className="col-span-2 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Письмо: {selected.email_sent_at ? `отправлено ${formatDate(selected.email_sent_at)}` : selected.email_error ? `ошибка: ${selected.email_error}` : '—'}
                    </div>
                    {selected.decision_note && (
                      <div className="col-span-2">Заметка: {selected.decision_note}</div>
                    )}
                  </div>
                </div>
              )}

              {selected.status === 'pending' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Причина отказа (только для «Отклонить»)</label>
                  <Textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Например: возраст не соответствует требованиям"
                    rows={2}
                  />
                </div>
              )}

              <DialogFooter className="flex-wrap gap-2">
                {selected.status === 'pending' && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => void reject(selected)}
                      disabled={rejecting || busyId === selected.id || !rejectNote.trim()}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Отклонить
                    </Button>
                    <Button
                      onClick={() => void approve(selected)}
                      disabled={rejecting || busyId === selected.id}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Одобрить и создать аккаунт
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Закрыть
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const Field: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <div className="text-xs font-medium text-muted-foreground">{label}</div>
    <div className={mono ? 'font-mono text-sm' : 'text-sm'}>{value}</div>
  </div>
);

export default AdminAgencyApplications;
