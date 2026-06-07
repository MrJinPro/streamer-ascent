import React, { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { useAuth } from '@/contexts/AuthContext';

const Onboarding: React.FC = () => {
  const { user, loading, onboardingCompleted, refreshProfile, role } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const inviteToken = searchParams.get('token') ?? '';
  const referralFromQuery = searchParams.get('ref') ?? '';

  const defaultDisplayName = useMemo(() => {
    return (
      (user?.user_metadata?.display_name as string | undefined) ??
      (user?.user_metadata?.full_name as string | undefined) ??
      (user?.email?.split('@')[0] ?? '')
    );
  }, [user?.email, user?.user_metadata]);

  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [telegramUsername, setTelegramUsername] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('ru');
  const [source, setSource] = useState('onboarding');
  const [referralCode, setReferralCode] = useState(referralFromQuery.toUpperCase());
  const [roleSlug, setRoleSlug] = useState<string>('streamer');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSkip = ['owner', 'admin', 'architect', 'system_owner'].includes((role ?? '').toLowerCase());

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Проверка сессии...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Нужен вход в аккаунт</CardTitle>
            <CardDescription>Сначала войдите, затем завершите onboarding.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/auth" className="text-primary hover:underline">Перейти на страницу входа</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  const completeOnboarding = async (skip = false) => {
    setSubmitting(true);

    const { data, error } = await supabasePublic.functions.invoke('onboarding-complete', {
      body: skip
        ? { skip: true }
        : {
            displayName,
            telegramUsername,
            country,
            language,
            source,
            referralCode: referralCode.trim().toUpperCase(),
            roleSlug,
            token: inviteToken,
            acceptTerms,
            acceptPrivacy,
          },
    });

    setSubmitting(false);

    if (error) {
      toast({ title: 'Ошибка onboarding', description: error.message, variant: 'destructive' });
      return;
    }

    if (!data?.ok) {
      toast({
        title: 'Ошибка onboarding',
        description: data?.error ?? 'Не удалось завершить onboarding',
        variant: 'destructive',
      });
      return;
    }

    await refreshProfile();
    toast({ title: 'Готово', description: 'Onboarding завершён' });
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Завершение onboarding</CardTitle>
          <CardDescription>Заполните профиль и подтвердите документы для доступа к внутренним разделам.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Имя</Label>
              <Input id="displayName" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram</Label>
              <Input id="telegram" value={telegramUsername} onChange={(event) => setTelegramUsername(event.target.value)} placeholder="@username" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Страна</Label>
              <Input id="country" value={country} onChange={(event) => setCountry(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Язык</Label>
              <Input id="language" value={language} onChange={(event) => setLanguage(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Источник</Label>
              <Input id="source" value={source} onChange={(event) => setSource(event.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referral">Реферальный код</Label>
            <Input
              id="referral"
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
              placeholder="NOVA-XXXXXX"
            />
            <p className="text-xs text-muted-foreground">
              Если есть код агентства — введите его, чтобы получить доступ к продукту Agency.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Ваша роль</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {[
                { slug: 'streamer', label: 'Стример', desc: 'Без агентства' },
                { slug: 'agency_streamer', label: 'Стример Agency', desc: 'Нужен код агентства' },
                { slug: 'agency_manager', label: 'Менеджер агентства', desc: 'По приглашению админа' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.slug}
                  onClick={() => setRoleSlug(opt.slug)}
                  className={`text-left rounded-lg border p-3 transition ${
                    roleSlug === opt.slug ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/30'
                  }`}
                >
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>


          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} />
              <span>
                Принимаю <Link className="text-primary hover:underline" to="/documents/terms" target="_blank">условия использования</Link>
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={acceptPrivacy} onChange={(event) => setAcceptPrivacy(event.target.checked)} />
              <span>
                Принимаю <Link className="text-primary hover:underline" to="/documents/privacy" target="_blank">политику конфиденциальности</Link>
              </span>
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {canSkip && (
              <Button variant="outline" onClick={() => void completeOnboarding(true)} disabled={submitting}>
                Пропустить (staff)
              </Button>
            )}
            <Button onClick={() => void completeOnboarding(false)} disabled={submitting || !acceptTerms || !acceptPrivacy || !displayName.trim()}>
              Завершить onboarding
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
