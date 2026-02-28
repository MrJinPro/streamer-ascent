import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import UserRoleBadges from '@/components/UserRoleBadges';
import { 
  ArrowLeft, 
  Diamond, 
  Flame, 
  Clock, 
  Trophy, 
  Target,
  TrendingUp,
  Calendar,
  Award,
  Star,
  Zap,
  Gift,
  FileSignature,
  Save,
  UserCog
} from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import AnimatedBackground from '@/components/dashboard/AnimatedBackground';
import { getRoleLabel } from '@/lib/roles';
import { getTotalXpFromLevel } from '@/lib/progressionEconomy';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { toast } from '@/hooks/use-toast';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--nova-gold))', 'hsl(var(--nova-cyan))'];
const LEGAL_VERSION = '2026-02-21';
const MAX_PINNED_ACHIEVEMENTS = 6;

type EditableProfile = {
  displayName: string;
  username: string;
  bio: string;
  telegram: string;
  country: string;
  region: string;
  language: string;
  tiktokUsername: string;
};

type LegalStatus = {
  agencyOfferAcceptedAt: string | null;
  termsAcceptedAt: string | null;
  privacyAcceptedAt: string | null;
};

const emptyEditableProfile: EditableProfile = {
  displayName: '',
  username: '',
  bio: '',
  telegram: '',
  country: '',
  region: '',
  language: '',
  tiktokUsername: '',
};

const Profile: React.FC = () => {
  const { currentUser, allUsers, checkpoints, achievements: allAchievements, refresh } = useAppData();
  const { role, referralCode, user: authUser, refreshProfile } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const [profileForm, setProfileForm] = useState<EditableProfile>(emptyEditableProfile);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [agreeAgencyOffer, setAgreeAgencyOffer] = useState(false);
  const [signingOffer, setSigningOffer] = useState(false);
  const [pinnedAchievementIds, setPinnedAchievementIds] = useState<string[]>([]);
  const [legalStatus, setLegalStatus] = useState<LegalStatus>({
    agencyOfferAcceptedAt: null,
    termsAcceptedAt: null,
    privacyAcceptedAt: null,
  });
  
  // Get user by ID or show current user
  const user = userId 
    ? allUsers.find(u => u.id === userId) || currentUser 
    : currentUser;
  const isOwnProfile = !userId || user.id === currentUser.id;
  const effectiveRole = userId ? user.role : (role ?? user.role);
  const authDisplayName =
    (authUser?.user_metadata?.display_name as string | undefined) ??
    (authUser?.user_metadata?.full_name as string | undefined) ??
    (authUser?.user_metadata?.name as string | undefined) ??
    authUser?.email?.split('@')[0];
  const authAvatar =
    (authUser?.user_metadata?.avatar_url as string | undefined) ??
    (authUser?.user_metadata?.picture as string | undefined);
  const displayName = !userId && authDisplayName ? authDisplayName : user.name;
  const displayAvatar = !userId && authAvatar ? authAvatar : user.avatar;

  const levelProgress = (user.stats.currentLevel / user.stats.maxLevel) * 100;
  const xpProgress = (user.xp / user.xpToNextLevel) * 100;
  const totalXpEarned = useMemo(() => getTotalXpFromLevel(user.level, user.xp), [user.level, user.xp]);
  const xpPerCompletedTask = user.completedTasks > 0 ? Math.floor(totalXpEarned / user.completedTasks) : 0;
  const xpDeficit = Math.max(0, user.xpToNextLevel - user.xp);
  const estimatedTasksToLevel = Math.ceil(xpDeficit / Math.max(50, xpPerCompletedTask || 50));

  const diamondHistory = useMemo(() => {
    const points = 31;
    const monthlyTotal = Math.max(user.stats.diamonds30Days, 0);
    const base = Math.floor(monthlyTotal / 30);
    const hash = user.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

    const history = [] as Array<{ date: string; diamonds: number; total: number }>;
    let cumulative = Math.max(user.stats.diamondsTotal - monthlyTotal, 0);

    for (let i = points - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const modifier = ((hash + i * 17) % 21) - 10;
      const spread = Math.max(1, Math.floor(base * 0.2));
      const daily = i === 0 ? Math.max(user.stats.diamondsToday, 0) : Math.max(0, base + Math.floor((modifier / 10) * spread));
      cumulative += daily;

      history.push({
        date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        diamonds: daily,
        total: cumulative,
      });
    }

    return history;
  }, [user.id, user.stats.diamonds30Days, user.stats.diamondsToday, user.stats.diamondsTotal]);

  const streamHistory = useMemo(() => {
    const points = 8;
    const weeklyHours = Math.max(1, Math.floor(user.totalHours / 4));
    const base = Math.max(0, Math.floor(weeklyHours / 7));
    const hash = user.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

    const history = [] as Array<{ date: string; hours: number; viewers: number }>;

    for (let i = points - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const wave = ((hash + i * 13) % 5) - 2;
      const hours = Math.max(0, base + wave);
      const viewers = Math.max(0, 20 + user.level * 5 + hours * 12 + ((hash + i * 19) % 35));

      history.push({
        date: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
        hours,
        viewers,
      });
    }

    return history;
  }, [user.id, user.level, user.totalHours]);

  // Stats for pie chart
  const activityData = [
    { name: 'Стримы', value: user.totalHours },
    { name: 'Задачи', value: user.completedTasks },
    { name: 'Достижения', value: user.achievements * 5 }
  ];

  const userAchievements = useMemo(
    () =>
      allAchievements
        .filter((item) => item.unlocked)
        .sort((left, right) => {
          const leftTime = left.unlockedAt ? new Date(left.unlockedAt).getTime() : 0;
          const rightTime = right.unlockedAt ? new Date(right.unlockedAt).getTime() : 0;

          if (leftTime !== rightTime) {
            return rightTime - leftTime;
          }

          return left.title.localeCompare(right.title, 'ru');
        }),
    [allAchievements],
  );
  const pinnedAchievements = userAchievements.filter((item) => pinnedAchievementIds.includes(item.id));

  useEffect(() => {
    const loadPins = async () => {
      const { data, error } = await (supabasePublic as any)
        .from('user_achievement_pins')
        .select('achievement_id,position')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (error) {
        return;
      }

      setPinnedAchievementIds((data ?? []).map((row: { achievement_id: string }) => row.achievement_id));
    };

    void loadPins();
  }, [user.id]);

  const togglePinAchievement = async (achievementId: string) => {
    if (!isOwnProfile) return;

    const alreadyPinned = pinnedAchievementIds.includes(achievementId);

    if (alreadyPinned) {
      const { error } = await (supabasePublic as any)
        .from('user_achievement_pins')
        .delete()
        .eq('user_id', user.id)
        .eq('achievement_id', achievementId);

      if (error) {
        toast({ title: 'Не удалось открепить достижение', description: error.message, variant: 'destructive' });
        return;
      }

      setPinnedAchievementIds((prev) => prev.filter((id) => id !== achievementId));
      return;
    }

    if (pinnedAchievementIds.length >= MAX_PINNED_ACHIEVEMENTS) {
      toast({
        title: 'Лимит закреплений',
        description: `Можно закрепить максимум ${MAX_PINNED_ACHIEVEMENTS} достижений`,
        variant: 'destructive',
      });
      return;
    }

    const position = pinnedAchievementIds.length + 1;
    const { error } = await (supabasePublic as any)
      .from('user_achievement_pins')
      .upsert({ user_id: user.id, achievement_id: achievementId, position }, { onConflict: 'user_id,achievement_id' });

    if (error) {
      toast({ title: 'Не удалось закрепить достижение', description: error.message, variant: 'destructive' });
      return;
    }

    setPinnedAchievementIds((prev) => [...prev, achievementId]);
  };

  useEffect(() => {
    if (!authUser?.id || !isOwnProfile) return;

    const loadProfileSettings = async () => {
      const [{ data: profileData, error: profileError }, { data: legalRows, error: legalError }] = await Promise.all([
        supabasePublic
          .from('profiles')
          .select('display_name,username,bio,telegram_username,country,region,language,tiktok_username')
          .eq('user_id', authUser.id)
          .maybeSingle(),
        supabasePublic
          .from('user_legal_acceptances')
          .select('document_type,accepted_at,accepted')
          .eq('user_id', authUser.id)
          .eq('document_version', LEGAL_VERSION)
          .eq('accepted', true),
      ]);

      if (profileError) {
        toast({ title: 'Не удалось загрузить профиль', description: profileError.message, variant: 'destructive' });
      } else {
        setProfileForm({
          displayName: profileData?.display_name ?? displayName,
          username: profileData?.username ?? '',
          bio: profileData?.bio ?? '',
          telegram: profileData?.telegram_username ?? '',
          country: profileData?.country ?? '',
          region: profileData?.region ?? '',
          language: profileData?.language ?? '',
          tiktokUsername: profileData?.tiktok_username ?? '',
        });
      }

      if (legalError) {
        toast({ title: 'Не удалось загрузить статусы документов', description: legalError.message, variant: 'destructive' });
      } else {
        const nextStatus: LegalStatus = {
          agencyOfferAcceptedAt: null,
          termsAcceptedAt: null,
          privacyAcceptedAt: null,
        };

        for (const row of legalRows ?? []) {
          if (row.document_type === 'agency_offer') nextStatus.agencyOfferAcceptedAt = row.accepted_at;
          if (row.document_type === 'terms') nextStatus.termsAcceptedAt = row.accepted_at;
          if (row.document_type === 'privacy') nextStatus.privacyAcceptedAt = row.accepted_at;
        }

        setLegalStatus(nextStatus);
      }

      setProfileLoaded(true);
    };

    void loadProfileSettings();
  }, [authUser?.id, isOwnProfile, displayName]);

  const handleProfileSave = async () => {
    if (!authUser?.id) return;

    if (!profileForm.displayName.trim()) {
      toast({ title: 'Имя обязательно', description: 'Укажите отображаемое имя', variant: 'destructive' });
      return;
    }

    setSavingProfile(true);

    const { error } = await supabasePublic
      .from('profiles')
      .upsert(
        {
          user_id: authUser.id,
          display_name: profileForm.displayName.trim(),
          username: profileForm.username.trim() || null,
          bio: profileForm.bio.trim() || null,
          telegram_username: profileForm.telegram.trim() || null,
          country: profileForm.country.trim() || null,
          region: profileForm.region.trim() || null,
          language: profileForm.language.trim() || null,
          tiktok_username: profileForm.tiktokUsername.trim() || null,
          email: authUser.email ?? null,
        },
        { onConflict: 'user_id' },
      );

    setSavingProfile(false);

    if (error) {
      toast({ title: 'Не удалось сохранить профиль', description: error.message, variant: 'destructive' });
      return;
    }

    await Promise.all([refresh(), refreshProfile()]);
    toast({ title: 'Профиль сохранён', description: 'Изменения применены' });
  };

  const handleSignAgencyOffer = async () => {
    if (!authUser?.id) return;

    if (!agreeAgencyOffer) {
      toast({ title: 'Подтверждение обязательно', description: 'Поставьте галочку согласия с офертой', variant: 'destructive' });
      return;
    }

    setSigningOffer(true);
    const acceptedAt = new Date().toISOString();

    const { error } = await supabasePublic
      .from('user_legal_acceptances')
      .upsert(
        {
          user_id: authUser.id,
          document_type: 'agency_offer',
          document_version: LEGAL_VERSION,
          accepted: true,
          accepted_at: acceptedAt,
        },
        { onConflict: 'user_id,document_type,document_version' },
      );

    setSigningOffer(false);

    if (error) {
      toast({ title: 'Не удалось подписать оферту', description: error.message, variant: 'destructive' });
      return;
    }

    setLegalStatus(prev => ({ ...prev, agencyOfferAcceptedAt: acceptedAt }));
    setAgreeAgencyOffer(false);
    toast({ title: 'Оферта подписана', description: 'Статус соглашения обновлён' });
  };

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 space-y-6 animate-fade-in">
        {/* Back button */}
        <Link 
          to="/ranking" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад к рейтингу</span>
        </Link>

        {/* Profile Header */}
        <div className="glass-card p-6 md:p-8 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-primary opacity-20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-accent opacity-15 rounded-full blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-50 animate-pulse-glow" />
              <img 
                src={displayAvatar} 
                alt={displayName}
                className="relative w-24 h-24 md:w-32 md:h-32 rounded-full ring-4 ring-primary/30 object-cover"
              />
              {user.isOnline && (
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-success rounded-full border-4 border-background" />
              )}
              <div className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-primary rounded-full text-xs font-bold text-white">
                #{user.stats.rank}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
                  {user.isOnline && (
                    <Badge variant="outline" className="border-success text-success">
                      <span className="w-2 h-2 rounded-full bg-success mr-2 animate-pulse" />
                      В сети
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">
                  {getRoleLabel(effectiveRole)} • 
                  Присоединился {new Date(user.joinedDate).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                </p>
                <UserRoleBadges userId={user.id} className="mt-1" />
                {!userId && referralCode && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-1.5">
                    <span className="text-xs text-muted-foreground">Ваш реферальный код:</span>
                    <span className="text-sm font-semibold tracking-wide">{referralCode}</span>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Diamond className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{user.stats.diamondsTotal.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Всего алмазов</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{user.streakDays}</p>
                    <p className="text-xs text-muted-foreground">Дней подряд</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-nova-gold/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-nova-gold" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{user.achievements}</p>
                    <p className="text-xs text-muted-foreground">Достижений</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-nova-cyan/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-nova-cyan" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{user.totalHours}ч</p>
                    <p className="text-xs text-muted-foreground">В эфире</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Level Badge */}
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
              <div className="text-4xl font-bold text-gradient">{user.stats.currentLevel}</div>
              <div className="text-xs text-muted-foreground font-medium">УРОВЕНЬ</div>
              <Progress value={levelProgress} className="w-24 h-2" />
              <div className="text-xs text-muted-foreground">{user.stats.currentLevel}/{user.stats.maxLevel}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-card p-1 w-full md:w-auto grid grid-cols-4 md:inline-flex">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Обзор</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Статистика</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Достижения</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <UserCog className="w-4 h-4" />
              <span className="hidden sm:inline">Профиль</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Diamond Progress & Checkpoints */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Diamond Chart */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Diamond className="w-5 h-5 text-primary" />
                    Накопление алмазов
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={diamondHistory}>
                        <defs>
                          <linearGradient id="diamondGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickLine={false}
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                          }}
                          formatter={(value: number) => [`${value.toLocaleString()} 💎`, 'Алмазы']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="diamonds" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          fill="url(#diamondGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Checkpoints Progress */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-accent" />
                    Чекпоинты подарков
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {checkpoints.map((checkpoint, index) => {
                    const isReached = user.stats.diamondsTotal >= checkpoint.diamondsRequired;
                    const progress = Math.min(100, (user.stats.diamondsTotal / checkpoint.diamondsRequired) * 100);
                    
                    return (
                      <div 
                        key={checkpoint.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isReached 
                            ? 'bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30' 
                            : 'bg-secondary/30 border-border/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{checkpoint.rewardIcon}</span>
                            <div>
                              <p className="font-semibold">{checkpoint.rewardName}</p>
                              <p className="text-xs text-muted-foreground">
                                {checkpoint.diamondsRequired.toLocaleString()} алмазов
                              </p>
                            </div>
                          </div>
                          {isReached ? (
                            <Badge className="bg-gradient-primary text-white">
                              <Star className="w-3 h-3 mr-1" /> Достигнуто
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {Math.floor(progress)}%
                            </span>
                          )}
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Stream History */}
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-nova-cyan" />
                  Активность за неделю
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={streamHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px'
                        }}
                        formatter={(value: number, name: string) => [
                          name === 'hours' ? `${value} ч` : `${value} зрителей`,
                          name === 'hours' ? 'Часы стрима' : 'Пик зрителей'
                        ]}
                      />
                      <Bar 
                        dataKey="hours" 
                        fill="hsl(var(--primary))" 
                        radius={[8, 8, 0, 0]}
                        name="hours"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat Cards */}
              <Card className="glass-card border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Diamond className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{user.stats.diamondsToday.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Сегодня</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                      <TrendingUp className="w-7 h-7 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{user.stats.diamonds30Days.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">За 30 дней</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-nova-gold/10 flex items-center justify-center">
                      <Target className="w-7 h-7 text-nova-gold" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{user.completedTasks}</p>
                      <p className="text-sm text-muted-foreground">Заданий</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-nova-cyan/10 flex items-center justify-center">
                      <Zap className="w-7 h-7 text-nova-cyan" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalXpEarned.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Всего XP</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle>Распределение активности</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={activityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {activityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    {activityData.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index] }}
                        />
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* XP Progress */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle>Прогресс уровня</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10">
                    <div className="text-5xl font-bold text-gradient mb-2">{user.level}</div>
                    <div className="text-muted-foreground">Текущий уровень</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">До следующего уровня</span>
                      <span className="font-semibold">{user.xp} / {user.xpToNextLevel} XP</span>
                    </div>
                    <Progress value={xpProgress} className="h-3" />
                    <p className="text-xs text-muted-foreground text-center">
                      Осталось {(user.xpToNextLevel - user.xp).toLocaleString()} XP
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-secondary/50 text-center">
                      <p className="text-lg font-bold">{xpPerCompletedTask.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">XP за задачу</p>
                    </div>
                    <div className="p-3 rounded-xl bg-secondary/50 text-center">
                      <p className="text-lg font-bold">{estimatedTasksToLevel}</p>
                      <p className="text-xs text-muted-foreground">Заданий до уровня</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Достижения</h2>
                <p className="text-muted-foreground">
                  Разблокировано {user.achievements} из {allAchievements.length}
                </p>
              </div>
              <Link 
                to="/achievements" 
                className="text-primary hover:underline text-sm font-medium"
              >
                Все достижения →
              </Link>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Витрина профиля</h3>
              {pinnedAchievements.length === 0 ? (
                <p className="text-sm text-muted-foreground">Закреплённых достижений пока нет.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {pinnedAchievements.map((achievement) => (
                    <Badge key={achievement.id} variant="outline" className="gap-2">
                      <span>{achievement.icon}</span>
                      <span>{achievement.title}</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userAchievements.map((achievement) => (
                <Card 
                  key={achievement.id} 
                  className={`glass-card border-0 hover-lift ${
                    achievement.rarity === 'legendary' ? 'ring-2 ring-nova-gold/50' :
                    achievement.rarity === 'secret' ? 'ring-2 ring-nova-cyan/50' :
                    achievement.rarity === 'epic' ? 'ring-2 ring-primary/50' : ''
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`text-4xl p-3 rounded-xl ${
                        achievement.rarity === 'legendary' ? 'bg-nova-gold/20' :
                        achievement.rarity === 'secret' ? 'bg-nova-cyan/20' :
                        achievement.rarity === 'epic' ? 'bg-primary/20' :
                        achievement.rarity === 'rare' ? 'bg-nova-cyan/20' :
                        'bg-secondary/50'
                      }`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{achievement.title}</h3>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              achievement.rarity === 'legendary' ? 'border-nova-gold text-nova-gold' :
                              achievement.rarity === 'secret' ? 'border-nova-cyan text-nova-cyan' :
                              achievement.rarity === 'epic' ? 'border-primary text-primary' :
                              achievement.rarity === 'rare' ? 'border-nova-cyan text-nova-cyan' :
                              'border-muted-foreground'
                            }`}
                          >
                            {achievement.rarity === 'legendary' ? 'Легендарное' :
                             achievement.rarity === 'secret' ? 'Секретное' :
                             achievement.rarity === 'epic' ? 'Эпическое' :
                             achievement.rarity === 'rare' ? 'Редкое' : 'Обычное'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        {achievement.unlockedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Получено: {new Date(achievement.unlockedAt).toLocaleDateString('ru-RU')}
                          </p>
                        )}
                        {isOwnProfile && (
                          <button
                            className="mt-2 text-xs text-primary hover:underline"
                            onClick={() => void togglePinAchievement(achievement.id)}
                          >
                            {pinnedAchievementIds.includes(achievement.id) ? 'Убрать из витрины' : 'Закрепить в витрине'}
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            {!isOwnProfile ? (
              <Card className="glass-card border-0">
                <CardContent className="pt-6 text-muted-foreground text-sm">
                  Редактирование доступно только владельцу профиля.
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCog className="w-5 h-5 text-primary" />
                      Настройки профиля
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!profileLoaded ? (
                      <div className="text-sm text-muted-foreground">Загрузка данных профиля...</div>
                    ) : (
                      <>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="profileDisplayName">Отображаемое имя</Label>
                            <Input
                              id="profileDisplayName"
                              value={profileForm.displayName}
                              onChange={(event) => setProfileForm(prev => ({ ...prev, displayName: event.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="profileUsername">Username</Label>
                            <Input
                              id="profileUsername"
                              value={profileForm.username}
                              onChange={(event) => setProfileForm(prev => ({ ...prev, username: event.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="profileBio">О себе</Label>
                          <Textarea
                            id="profileBio"
                            rows={4}
                            value={profileForm.bio}
                            onChange={(event) => setProfileForm(prev => ({ ...prev, bio: event.target.value }))}
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="profileTelegram">Telegram</Label>
                            <Input
                              id="profileTelegram"
                              value={profileForm.telegram}
                              onChange={(event) => setProfileForm(prev => ({ ...prev, telegram: event.target.value }))}
                              placeholder="@username"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="profileTikTok">TikTok username</Label>
                            <Input
                              id="profileTikTok"
                              value={profileForm.tiktokUsername}
                              onChange={(event) => setProfileForm(prev => ({ ...prev, tiktokUsername: event.target.value }))}
                              placeholder="@tiktok"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="profileCountry">Страна</Label>
                            <Input
                              id="profileCountry"
                              value={profileForm.country}
                              onChange={(event) => setProfileForm(prev => ({ ...prev, country: event.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="profileRegion">Регион</Label>
                            <Input
                              id="profileRegion"
                              value={profileForm.region}
                              onChange={(event) => setProfileForm(prev => ({ ...prev, region: event.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="profileLanguage">Язык</Label>
                            <Input
                              id="profileLanguage"
                              value={profileForm.language}
                              onChange={(event) => setProfileForm(prev => ({ ...prev, language: event.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button onClick={() => void handleProfileSave()} disabled={savingProfile}>
                            <Save className="w-4 h-4 mr-2" />
                            {savingProfile ? 'Сохранение...' : 'Сохранить изменения'}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileSignature className="w-5 h-5 text-primary" />
                      Договоры и оферта
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl border border-border bg-secondary/30 p-4">
                      <p className="font-medium">Партнёрская оферта NovaBoost</p>
                      <p className="text-xs text-muted-foreground mt-1">Версия: {LEGAL_VERSION}</p>
                      <p className="text-sm mt-2">
                        Статус:{' '}
                        {legalStatus.agencyOfferAcceptedAt ? (
                          <span className="text-success font-medium">
                            Подписана {new Date(legalStatus.agencyOfferAcceptedAt).toLocaleString('ru-RU')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Не подписана</span>
                        )}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <input
                          id="acceptAgencyOffer"
                          type="checkbox"
                          className="w-4 h-4"
                          checked={agreeAgencyOffer}
                          onChange={(event) => setAgreeAgencyOffer(event.target.checked)}
                          disabled={Boolean(legalStatus.agencyOfferAcceptedAt)}
                        />
                        <Label htmlFor="acceptAgencyOffer" className="text-sm font-normal">
                          Подтверждаю, что ознакомился(ась) и согласен(на) с условиями оферты
                        </Label>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link to="/documents/agency-offer" className="text-sm text-primary hover:underline">
                          Открыть текст оферты
                        </Link>
                        <Button
                          type="button"
                          onClick={() => void handleSignAgencyOffer()}
                          disabled={signingOffer || Boolean(legalStatus.agencyOfferAcceptedAt)}
                        >
                          <FileSignature className="w-4 h-4 mr-2" />
                          {legalStatus.agencyOfferAcceptedAt ? 'Уже подписано' : signingOffer ? 'Подписание...' : 'Подписать оферту'}
                        </Button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="rounded-xl border border-border p-4 bg-secondary/20">
                        <p className="font-medium">Условия использования</p>
                        <p className="text-muted-foreground mt-1">
                          {legalStatus.termsAcceptedAt ? `Приняты: ${new Date(legalStatus.termsAcceptedAt).toLocaleString('ru-RU')}` : 'Статус не подтверждён'}
                        </p>
                        <Link to="/documents/terms" className="inline-block mt-2 text-primary hover:underline">Открыть документ</Link>
                      </div>
                      <div className="rounded-xl border border-border p-4 bg-secondary/20">
                        <p className="font-medium">Политика конфиденциальности</p>
                        <p className="text-muted-foreground mt-1">
                          {legalStatus.privacyAcceptedAt ? `Принята: ${new Date(legalStatus.privacyAcceptedAt).toLocaleString('ru-RU')}` : 'Статус не подтверждён'}
                        </p>
                        <Link to="/documents/privacy" className="inline-block mt-2 text-primary hover:underline">Открыть документ</Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
