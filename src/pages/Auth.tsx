import React, { useState } from 'react';
import { Eye, EyeOff, FileText, LogIn, Send, ShieldCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { trackEvent } from '@/lib/analytics';
import {
  OFFER_DOWNLOAD_URL,
  OFFER_PUBLISHED_AT,
  OFFER_PUBLISHED_LABEL,
  OFFER_VERSION,
} from '@/data/agencyOffer';

const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAppPassword, setShowAppPassword] = useState(false);

  const [applicationName, setApplicationName] = useState('');
  const [applicationUsername, setApplicationUsername] = useState('');
  const [applicationTiktok, setApplicationTiktok] = useState('');
  const [applicationEmail, setApplicationEmail] = useState('');
  const [applicationTelegram, setApplicationTelegram] = useState('');
  const [applicationAge, setApplicationAge] = useState('');
  const [applicationSource, setApplicationSource] = useState('');
  const [applicationInviterCode, setApplicationInviterCode] = useState('');
  const [applicationPassword, setApplicationPassword] = useState('');
  const [applicationPasswordConfirm, setApplicationPasswordConfirm] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptOffer, setAcceptOffer] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [lastLoginAttemptAt, setLastLoginAttemptAt] = useState(0);
  const [lastApplicationAttemptAt, setLastApplicationAttemptAt] = useState(0);

  const defaultTab = searchParams.get('tab') === 'application' ? 'application' : 'login';

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const now = Date.now();
    if (now - lastLoginAttemptAt < 5000) {
      toast({ title: 'Слишком часто', description: 'Подождите несколько секунд перед новой попыткой входа.', variant: 'destructive' });
      return;
    }
    setLastLoginAttemptAt(now);
    setIsLoading(true);
    const { error } = await supabasePublic.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setIsLoading(false);
    if (error) {
      trackEvent('auth_login_failed', { reason: error.message });
      toast({ title: 'Ошибка входа', description: error.message, variant: 'destructive' });
      return;
    }
    trackEvent('auth_login_success');
    toast({ title: 'Вход выполнен', description: 'Добро пожаловать в NovaBoost Tools' });
  };

  const handleAgencyApplication = async (event: React.FormEvent) => {
    event.preventDefault();

    const now = Date.now();
    if (now - lastApplicationAttemptAt < 15000) {
      toast({ title: 'Слишком часто', description: 'Подождите 15 секунд перед повторной отправкой заявки.', variant: 'destructive' });
      return;
    }
    setLastApplicationAttemptAt(now);

    // Client-side validation (server re-validates)
    const fields = [applicationName, applicationUsername, applicationTiktok, applicationEmail, applicationTelegram, applicationSource, applicationInviterCode];
    if (fields.some((v) => !v.trim())) {
      toast({ title: 'Заполните все поля', description: 'Все поля заявки обязательны для заполнения.', variant: 'destructive' });
      return;
    }
    const age = Number(applicationAge);
    if (!Number.isFinite(age) || age < 16 || age > 99) {
      toast({ title: 'Некорректный возраст', description: 'Возраст должен быть от 16 до 99.', variant: 'destructive' });
      return;
    }
    if (applicationPassword.length < 8) {
      toast({ title: 'Слабый пароль', description: 'Пароль должен содержать минимум 8 символов.', variant: 'destructive' });
      return;
    }
    if (applicationPassword !== applicationPasswordConfirm) {
      toast({ title: 'Пароли не совпадают', description: 'Повторите пароль ещё раз.', variant: 'destructive' });
      return;
    }
    if (!acceptTerms || !acceptPrivacy || !acceptOffer) {
      toast({
        title: 'Необходимо принять документы',
        description: 'Подтвердите Условия, Политику конфиденциальности и Договор-оферту.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabasePublic.functions.invoke('agency-application-submit', {
      body: {
        full_name: applicationName.trim(),
        username: applicationUsername.trim(),
        tiktok_username: applicationTiktok.trim(),
        email: applicationEmail.trim().toLowerCase(),
        telegram: applicationTelegram.trim(),
        age,
        heard_about: applicationSource,
        inviter_referral_code: applicationInviterCode.trim().toUpperCase(),
        password: applicationPassword,
        accepted_terms: acceptTerms,
        accepted_privacy: acceptPrivacy,
        accepted_offer: acceptOffer,
        offer_version: OFFER_VERSION,
        offer_published_at: OFFER_PUBLISHED_AT,
      },
    });

    setIsLoading(false);

    if (error || (data && (data as { error?: string }).error)) {
      const message = (data as { error?: string } | null)?.error || error?.message || 'Не удалось отправить заявку. Попробуйте снова через минуту.';
      trackEvent('agency_application_failed', { reason: message });
      toast({ title: 'Ошибка отправки заявки', description: message, variant: 'destructive' });
      return;
    }

    setApplicationName('');
    setApplicationUsername('');
    setApplicationTiktok('');
    setApplicationEmail('');
    setApplicationTelegram('');
    setApplicationAge('');
    setApplicationSource('');
    setApplicationInviterCode('');
    setApplicationPassword('');
    setApplicationPasswordConfirm('');
    setAcceptTerms(false);
    setAcceptPrivacy(false);
    setAcceptOffer(false);

    trackEvent('agency_application_submitted');
    toast({
      title: 'Заявка отправлена',
      description: 'Договор-оферта подписан и сохранён. Менеджер свяжется с вами после проверки.',
    });
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-mesh opacity-60 pointer-events-none" />
      <div className="absolute -top-40 -right-32 w-96 h-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />

      <Card className="w-full max-w-3xl relative z-10 glass-card border-border/60">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary" /> NovaBoost Tools
          </CardTitle>
          <CardDescription>
            Приложение закрытого комьюнити NovaBoost Agency. Обычная регистрация отключена — доступ только после заявки и одобрения.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue={defaultTab} className="space-y-4">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="application">Заявка в Agency</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <Label htmlFor="loginEmail">Email</Label>
                  <Input id="loginEmail" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginPassword">Пароль</Label>
                  <div className="relative">
                    <Input
                      id="loginPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-2 flex items-center justify-center px-2 text-sm text-muted-foreground transition hover:text-foreground"
                      aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button className="w-full" type="submit" disabled={isLoading}>
                  <LogIn className="w-4 h-4 mr-2" /> Войти
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="application">
              <form className="space-y-4" onSubmit={handleAgencyApplication}>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appName">ФИО *</Label>
                    <Input id="appName" value={applicationName} onChange={(e) => setApplicationName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appUsername">Никнейм *</Label>
                    <Input id="appUsername" value={applicationUsername} onChange={(e) => setApplicationUsername(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appAge">Возраст *</Label>
                    <Input
                      id="appAge"
                      type="number"
                      min={16}
                      max={99}
                      value={applicationAge}
                      onChange={(e) => setApplicationAge(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appTiktok">TikTok username *</Label>
                    <Input
                      id="appTiktok"
                      value={applicationTiktok}
                      onChange={(e) => setApplicationTiktok(e.target.value)}
                      placeholder="@username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appEmail">Email *</Label>
                    <Input
                      id="appEmail"
                      type="email"
                      value={applicationEmail}
                      onChange={(e) => setApplicationEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appTelegram">Telegram *</Label>
                    <Input
                      id="appTelegram"
                      value={applicationTelegram}
                      onChange={(e) => setApplicationTelegram(e.target.value)}
                      placeholder="@telegram"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Как узнали о нас *</Label>
                    <Select value={applicationSource} onValueChange={setApplicationSource}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите вариант" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friend_streamer">Друг/стример подсказал</SelectItem>
                        <SelectItem value="curator_manager">Куратор/менеджер пригласил</SelectItem>
                        <SelectItem value="social_media">Соцсети</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="other">Другое</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appInviterCode">Реферальный код пригласившего *</Label>
                  <Input
                    id="appInviterCode"
                    value={applicationInviterCode}
                    onChange={(e) => setApplicationInviterCode(e.target.value.toUpperCase())}
                    placeholder="NOVA-XXXXXX"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appPassword">Пароль *</Label>
                    <div className="relative">
                      <Input
                        id="appPassword"
                        type={showAppPassword ? 'text' : 'password'}
                        value={applicationPassword}
                        onChange={(e) => setApplicationPassword(e.target.value)}
                        minLength={8}
                        maxLength={128}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowAppPassword((p) => !p)}
                        className="absolute inset-y-0 right-2 flex items-center justify-center px-2 text-sm text-muted-foreground hover:text-foreground"
                        aria-label={showAppPassword ? 'Скрыть пароль' : 'Показать пароль'}
                      >
                        {showAppPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Минимум 8 символов. Будет использоваться при входе после одобрения.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appPasswordConfirm">Повторите пароль *</Label>
                    <Input
                      id="appPasswordConfirm"
                      type={showAppPassword ? 'text' : 'password'}
                      value={applicationPasswordConfirm}
                      onChange={(e) => setApplicationPasswordConfirm(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                {/* Offer block */}
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Договор-оферта о сотрудничестве</p>
                      <p className="text-xs text-muted-foreground">
                        Редакция №{OFFER_VERSION} · Дата публикации: {OFFER_PUBLISHED_LABEL}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to="/documents/agency-offer"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-background/60 hover:bg-secondary transition-colors"
                    >
                      Прочитать оферту на сайте
                    </Link>
                    <a
                      href={OFFER_DOWNLOAD_URL}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-background/60 hover:bg-secondary transition-colors"
                    >
                      Скачать .docx
                    </a>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-border p-4 bg-secondary/20">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(v === true)} className="mt-0.5" />
                    <span className="text-sm leading-snug">
                      Я принимаю{' '}
                      <Link to="/documents/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Условия использования
                      </Link>
                      .
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={acceptPrivacy} onCheckedChange={(v) => setAcceptPrivacy(v === true)} className="mt-0.5" />
                    <span className="text-sm leading-snug">
                      Я согласен(на) с{' '}
                      <Link to="/documents/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Политикой конфиденциальности
                      </Link>
                      .
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={acceptOffer} onCheckedChange={(v) => setAcceptOffer(v === true)} className="mt-0.5" />
                    <span className="text-sm leading-snug">
                      Я ознакомлен(а) и принимаю условия{' '}
                      <Link to="/documents/agency-offer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Договора-оферты (ред. №{OFFER_VERSION} от {OFFER_PUBLISHED_LABEL})
                      </Link>
                      . Договор считается подписанным с момента отправки заявки. IP-адрес, устройство и время будут сохранены как доказательство подписания.
                    </span>
                  </label>
                </div>

                <Button className="w-full" type="submit" disabled={isLoading}>
                  <Send className="w-4 h-4 mr-2" /> Подать заявку и подписать оферту
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
