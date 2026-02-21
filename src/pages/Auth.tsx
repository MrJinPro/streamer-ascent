import React, { useState } from 'react';
import { LogIn, Send, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { trackEvent } from '@/lib/analytics';

const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [applicationName, setApplicationName] = useState('');
  const [applicationUsername, setApplicationUsername] = useState('');
  const [applicationTiktok, setApplicationTiktok] = useState('');
  const [applicationEmail, setApplicationEmail] = useState('');
  const [applicationTelegram, setApplicationTelegram] = useState('');
  const [applicationAge, setApplicationAge] = useState('');
  const [applicationSource, setApplicationSource] = useState('');
  const [applicationInviterCode, setApplicationInviterCode] = useState('');

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

    const { error } = await supabasePublic.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

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

    if (!applicationSource) {
      toast({ title: 'Выберите источник', description: 'Укажите, как вы узнали о нас', variant: 'destructive' });
      return;
    }

    const age = Number(applicationAge);
    if (Number.isNaN(age) || age < 16 || age > 99) {
      toast({ title: 'Некорректный возраст', description: 'Возраст должен быть от 16 до 99', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    const { error } = await supabasePublic.from('agency_join_applications').insert({
      full_name: applicationName,
      username: applicationUsername,
      tiktok_username: applicationTiktok,
      email: applicationEmail,
      telegram: applicationTelegram,
      age,
      heard_about: applicationSource,
      inviter_referral_code: applicationInviterCode.trim().toUpperCase(),
    });

    setIsLoading(false);

    if (error) {
      trackEvent('agency_application_failed', { reason: error.message });
      toast({ title: 'Ошибка отправки заявки', description: error.message, variant: 'destructive' });
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

    trackEvent('agency_application_submitted');
    toast({ title: 'Заявка отправлена', description: 'Менеджер NovaBoost Agency свяжется с вами после проверки.' });
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
                  <Input
                    id="loginEmail"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginPassword">Пароль</Label>
                  <Input
                    id="loginPassword"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
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
                    <Label htmlFor="appName">ФИО</Label>
                    <Input id="appName" value={applicationName} onChange={(e) => setApplicationName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appUsername">Никнейм</Label>
                    <Input id="appUsername" value={applicationUsername} onChange={(e) => setApplicationUsername(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appAge">Возраст</Label>
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
                    <Label htmlFor="appTiktok">TikTok username</Label>
                    <Input
                      id="appTiktok"
                      value={applicationTiktok}
                      onChange={(e) => setApplicationTiktok(e.target.value)}
                      placeholder="@username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appEmail">Email</Label>
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
                    <Label htmlFor="appTelegram">Telegram</Label>
                    <Input
                      id="appTelegram"
                      value={applicationTelegram}
                      onChange={(e) => setApplicationTelegram(e.target.value)}
                      placeholder="@telegram"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Как узнали о нас</Label>
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
                  <Label htmlFor="appInviterCode">Реферальный код пригласившего</Label>
                  <Input
                    id="appInviterCode"
                    value={applicationInviterCode}
                    onChange={(e) => setApplicationInviterCode(e.target.value.toUpperCase())}
                    placeholder="NOVA-XXXXXX"
                    required
                  />
                </div>

                <Button className="w-full" type="submit" disabled={isLoading}>
                  <Send className="w-4 h-4 mr-2" /> Подать заявку на вступление
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
