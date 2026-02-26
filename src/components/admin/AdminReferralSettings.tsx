import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Plus, CheckCircle2, XCircle, Ticket, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { supabasePublic } from '@/integrations/supabase/publicClient';

type Application = {
  id: string;
  full_name: string;
  username: string;
  tiktok_username: string;
  email: string;
  telegram: string;
  age: number;
  heard_about: string;
  inviter_referral_code: string;
  assigned_referral_code: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

type ReferralCode = {
  id: string;
  code: string;
  is_active: boolean;
  used_count: number;
  max_uses: number;
  expires_at: string | null;
  note: string | null;
};

const sourceLabel: Record<string, string> = {
  friend_streamer: 'Друг/стример подсказал',
  curator_manager: 'Куратор/менеджер пригласил',
  social_media: 'Соцсети',
  tiktok: 'TikTok',
  other: 'Другое',
};

const isSchemaMismatchError = (error: { code?: string; message?: string; details?: string } | null) => {
  if (!error) return false;

  const errorText = `${error.code ?? ''} ${error.message ?? ''} ${error.details ?? ''}`;
  return /PGRST20\d|42703|column .* does not exist|schema cache|Could not find the .* column/i.test(errorText);
};

const parseMetaValue = (raw: string | null | undefined, key: string) => {
  if (!raw) return null;

  const pair = raw
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${key}:`));

  if (!pair) return null;
  const [, value] = pair.split(':', 2);
  return value?.trim() || null;
};

const AdminReferralSettings: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [rewardsEnabled, setRewardsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newCode, setNewCode] = useState('');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState(5);
  const [newCodeNote, setNewCodeNote] = useState('manual');
  const [newCodeExpires, setNewCodeExpires] = useState('');

  const pendingApplications = useMemo(
    () => applications.filter((item) => item.status === 'pending'),
    [applications],
  );

  const loadData = async () => {
    setLoading(true);

    const [applicationsRes, codesRes, rewardsRes] = await Promise.all([
      supabasePublic
        .from('agency_join_applications')
        .select('id,full_name,username,tiktok_username,email,telegram,age,heard_about,inviter_referral_code,assigned_referral_code,status,created_at')
        .order('created_at', { ascending: false }),
      supabasePublic
        .from('agency_referral_codes')
        .select('id,code,is_active,used_count,max_uses,expires_at,note')
        .order('created_at', { ascending: false }),
      supabasePublic.from('referral_reward_settings').select('rewards_enabled').eq('id', 1).maybeSingle(),
    ]);

    if (!applicationsRes.error) {
      setApplications((applicationsRes.data ?? []) as Application[]);
    } else if (isSchemaMismatchError(applicationsRes.error)) {
      const legacyRes = await supabasePublic
        .from('agency_join_applications')
        .select('id,full_name,tiktok_username,email,telegram,stream_experience,motivation,status,created_at')
        .order('created_at', { ascending: false });

      if (!legacyRes.error) {
        const legacyMapped: Application[] = (legacyRes.data ?? []).map((item) => {
          const username = parseMetaValue(item.stream_experience, 'username') ?? item.email.split('@')[0] ?? 'unknown';
          const parsedAge = Number(parseMetaValue(item.stream_experience, 'age'));
          const heardAbout = parseMetaValue(item.stream_experience, 'source') ?? 'other';
          const inviterCode = parseMetaValue(item.motivation, 'inviter_code') ?? 'NO-CODE';

          return {
            id: item.id,
            full_name: item.full_name,
            username,
            tiktok_username: item.tiktok_username,
            email: item.email,
            telegram: item.telegram ?? '@unknown',
            age: Number.isFinite(parsedAge) ? parsedAge : 18,
            heard_about: heardAbout,
            inviter_referral_code: inviterCode,
            assigned_referral_code: null,
            status: (item.status as Application['status']) ?? 'pending',
            created_at: item.created_at,
          };
        });

        setApplications(legacyMapped);
      } else {
        console.error('Failed to load legacy agency applications', legacyRes.error);
        toast({ title: 'Ошибка загрузки заявок', description: legacyRes.error.message, variant: 'destructive' });
      }
    } else {
      console.error('Failed to load agency applications', applicationsRes.error);
      toast({ title: 'Ошибка загрузки заявок', description: applicationsRes.error.message, variant: 'destructive' });
    }

    if (!codesRes.error) setCodes((codesRes.data ?? []) as ReferralCode[]);
    if (!rewardsRes.error) setRewardsEnabled(Boolean(rewardsRes.data?.rewards_enabled));

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const createCode = async () => {
    if (!newCode.trim()) {
      toast({ title: 'Введите код', variant: 'destructive' });
      return;
    }

    const { error } = await supabasePublic.from('agency_referral_codes').insert({
      code: newCode.trim().toUpperCase(),
      max_uses: Math.max(1, newCodeMaxUses),
      note: newCodeNote || null,
      expires_at: newCodeExpires ? new Date(newCodeExpires).toISOString() : null,
    });

    if (error) {
      toast({ title: 'Ошибка создания кода', description: error.message, variant: 'destructive' });
      return;
    }

    setNewCode('');
    setNewCodeMaxUses(5);
    setNewCodeNote('manual');
    setNewCodeExpires('');
    toast({ title: 'Реферальный код создан' });
    await loadData();
  };

  const deactivateCode = async (id: string) => {
    const { error } = await supabasePublic.from('agency_referral_codes').update({ is_active: false }).eq('id', id);
    if (error) {
      toast({ title: 'Ошибка деактивации', description: error.message, variant: 'destructive' });
      return;
    }
    await loadData();
  };

  const approveApplication = async (id: string) => {
    const { data, error } = await supabasePublic.rpc('approve_agency_application', {
      p_application_id: id,
      p_max_uses: 5,
    });

    if (error) {
      toast({ title: 'Ошибка одобрения', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Заявка одобрена', description: `Новый реферальный код: ${data}` });
    await loadData();
  };

  const rejectApplication = async (id: string) => {
    const { error } = await supabasePublic.rpc('reject_agency_application', { p_application_id: id });
    if (error) {
      toast({ title: 'Ошибка отклонения', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Заявка отклонена' });
    await loadData();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border p-5 bg-secondary/20">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Закрытое комьюнити NovaBoost Agency</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Самостоятельная регистрация отключена. Доступ возможен только после заявки и одобрения менеджером.
        </p>
      </div>

      <div className="rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Реферальные коды</h3>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <div className="space-y-2 md:col-span-2">
            <Label>Код</Label>
            <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="NOVA-ABC123" />
          </div>
          <div className="space-y-2">
            <Label>Лимит использований</Label>
            <Input type="number" min={1} value={newCodeMaxUses} onChange={(e) => setNewCodeMaxUses(Number(e.target.value) || 1)} />
          </div>
          <div className="space-y-2">
            <Label>Срок (опционально)</Label>
            <Input type="date" value={newCodeExpires} onChange={(e) => setNewCodeExpires(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Комментарий</Label>
          <Input value={newCodeNote} onChange={(e) => setNewCodeNote(e.target.value)} placeholder="для конкретного стримера" />
        </div>

        <Button onClick={() => void createCode()}>
          <Plus className="w-4 h-4 mr-2" /> Создать код
        </Button>

        <div className="space-y-2">
          {codes.map((code) => (
            <div key={code.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50">
              <div>
                <p className="font-medium">{code.code}</p>
                <p className="text-xs text-muted-foreground">
                  Использовано: {code.used_count}/{code.max_uses}
                  {code.note ? ` • ${code.note}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${code.is_active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                  {code.is_active ? 'Активен' : 'Отключен'}
                </span>
                {code.is_active && (
                  <Button variant="outline" size="sm" onClick={() => void deactivateCode(code.id)}>
                    Отключить
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border p-5 space-y-4">
        <h3 className="font-semibold">Заявки на вступление ({pendingApplications.length} ожидают)</h3>
        {pendingApplications.map((application) => (
          <div key={application.id} className="p-4 rounded-lg border border-border bg-background/50 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium">{application.full_name} • @{application.username}</p>
              <p className="text-xs text-muted-foreground">{new Date(application.created_at).toLocaleString('ru-RU')}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              TikTok: {application.tiktok_username} • Telegram: {application.telegram} • Возраст: {application.age}
            </p>
            <p className="text-sm text-muted-foreground">
              Откуда узнал: {sourceLabel[application.heard_about] || application.heard_about} • Код пригласившего: {application.inviter_referral_code}
            </p>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => void approveApplication(application.id)}>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Одобрить
              </Button>
              <Button size="sm" variant="outline" onClick={() => void rejectApplication(application.id)}>
                <XCircle className="w-4 h-4 mr-2" /> Отклонить
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-accent" />
          <h3 className="font-semibold">Система наград за рефералы</h3>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50">
          <div>
            <p className="font-medium">Награды отключены</p>
            <p className="text-xs text-muted-foreground">Логика заложена в БД, включение будет позже.</p>
          </div>
          <Switch checked={rewardsEnabled} disabled />
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Загрузка данных настроек...</p>}
    </div>
  );
};

export default AdminReferralSettings;
