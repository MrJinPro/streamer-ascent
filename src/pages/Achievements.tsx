import React, { useEffect, useMemo, useState } from 'react';
import { useAppData } from '@/contexts/AppDataContext';
import { cn } from '@/lib/utils';
import { Filter, Trophy, Sparkles, Lock, Share2, EyeOff, Flame, Clock3, Users, Star } from 'lucide-react';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

type PublicSecretStatsRow = {
  achievement_id: string;
  unlock_count: number;
  last_unlocked_at: string | null;
  last_user_name: string | null;
};

type UnlockRow = {
  achievement_id: string;
  unlocked_at: string;
  snapshot: Record<string, unknown>;
};

const SHARED_SECRET_STORAGE_KEY = 'nb_shared_secret_achievements';
const SEEN_SECRET_UNLOCKS_STORAGE_KEY = 'nb_seen_secret_unlocks';

const playSecretUnlockSound = () => {
  if (typeof window === 'undefined') return;

  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const now = ctx.currentTime;

  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now + index * 0.09);
    gain.gain.exponentialRampToValueAtTime(0.08, now + index * 0.09 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.09 + 0.2);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now + index * 0.09);
    oscillator.stop(now + index * 0.09 + 0.22);
  });
};

const safeReadLocalArray = (key: string): string[] => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const upsertLocalArray = (key: string, values: string[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify([...new Set(values)]));
};

const describeSnapshot = (snapshot: Record<string, unknown> | undefined) => {
  if (!snapshot) {
    return {
      how: 'Секрет раскрыт автоматически по внутренним условиям NovaBoost.',
      trigger: 'Комбинация выполнена',
    };
  }

  const trigger = typeof snapshot.trigger === 'string' ? snapshot.trigger : 'Комбинация выполнена';
  const giftId = typeof snapshot.gift_id === 'string' ? snapshot.gift_id : undefined;
  const durationMinutes = typeof snapshot.duration_minutes === 'number' ? Math.round(snapshot.duration_minutes) : undefined;

  const details = [
    giftId ? `подарок ${giftId}` : null,
    durationMinutes ? `длительность эфира ${durationMinutes} мин` : null,
  ].filter(Boolean);

  return {
    how: details.length > 0 ? `Условия были выполнены: ${details.join(', ')}.` : 'Условия были выполнены в эфире и система зафиксировала триггер.',
    trigger,
  };
};

const Achievements: React.FC = () => {
  const { achievements, currentUser, streamEvents, updateContent } = useAppData();
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(null);
  const [secretUnlockOverlayId, setSecretUnlockOverlayId] = useState<string | null>(null);
  const [secretStats, setSecretStats] = useState<Record<string, PublicSecretStatsRow>>({});
  const [unlockDetails, setUnlockDetails] = useState<Record<string, UnlockRow>>({});
  const [sharedSecretIds, setSharedSecretIds] = useState<string[]>(() =>
    typeof window === 'undefined' ? [] : safeReadLocalArray(SHARED_SECRET_STORAGE_KEY),
  );

  const selectedAchievement = achievements.find((item) => item.id === selectedAchievementId) ?? null;

  const secretAchievements = achievements.filter((achievement) => achievement.rarity === 'secret');
  const regularAchievements = achievements.filter((achievement) => achievement.rarity !== 'secret');

  const filteredRegularAchievements = regularAchievements.filter((achievement) => {
    if (filter === 'unlocked') return achievement.unlocked;
    if (filter === 'locked') return !achievement.unlocked;
    return true;
  });

  useEffect(() => {
    if (secretAchievements.length === 0) {
      setSecretStats({});
      return;
    }

    const loadPublicStats = async () => {
      const { data, error } = await (supabasePublic as any).rpc('get_achievement_public_stats', {
        p_achievement_ids: secretAchievements.map((item) => item.id),
      });

      if (error) {
        return;
      }

      const mapped = ((data ?? []) as PublicSecretStatsRow[]).reduce<Record<string, PublicSecretStatsRow>>((acc, row) => {
        acc[row.achievement_id] = row;
        return acc;
      }, {});

      setSecretStats(mapped);
    };

    void loadPublicStats();
  }, [secretAchievements]);

  useEffect(() => {
    const unlockedSecretIds = secretAchievements.filter((item) => item.unlocked).map((item) => item.id);
    if (unlockedSecretIds.length === 0 || typeof window === 'undefined') {
      return;
    }

    const seen = new Set(safeReadLocalArray(SEEN_SECRET_UNLOCKS_STORAGE_KEY));
    const unseenSecret = unlockedSecretIds.find((id) => !seen.has(id));

    if (!unseenSecret) {
      return;
    }

    setSecretUnlockOverlayId(unseenSecret);
    seen.add(unseenSecret);
    upsertLocalArray(SEEN_SECRET_UNLOCKS_STORAGE_KEY, Array.from(seen));
    playSecretUnlockSound();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([120, 60, 120, 60, 180]);
    }
  }, [secretAchievements]);

  useEffect(() => {
    if (!currentUser?.id || secretAchievements.length === 0) return;

    const loadUnlockDetails = async () => {
      const { data, error } = await (supabasePublic as any)
        .from('achievement_unlocks')
        .select('achievement_id,unlocked_at,snapshot')
        .eq('user_id', currentUser.id)
        .in('achievement_id', secretAchievements.map((item) => item.id))
        .order('unlocked_at', { ascending: false });

      if (error) {
        return;
      }

      const mapped = ((data ?? []) as UnlockRow[]).reduce<Record<string, UnlockRow>>((acc, row) => {
        if (!acc[row.achievement_id]) {
          acc[row.achievement_id] = row;
        }
        return acc;
      }, {});

      setUnlockDetails(mapped);
    };

    void loadUnlockDetails();
  }, [currentUser?.id, secretAchievements]);

  const handleShareSecret = async (achievementId: string) => {
    const achievement = secretAchievements.find((item) => item.id === achievementId);
    if (!achievement || !achievement.unlocked) {
      return;
    }

    const nextShared = [...new Set([...sharedSecretIds, achievementId])];
    setSharedSecretIds(nextShared);
    upsertLocalArray(SHARED_SECRET_STORAGE_KEY, nextShared);

    const nextFeedItem = {
      id: `secret-${achievement.id}-${Date.now()}`,
      streamerId: currentUser.id,
      streamerName: currentUser.name,
      type: 'achievement' as const,
      description: `Раскрыл секретное достижение «${achievement.title}»`,
      timestamp: new Date().toISOString(),
      metadata: {
        rarity: 'secret',
        achievementId: achievement.id,
      },
    };

    try {
      await updateContent('streamEvents', [nextFeedItem, ...streamEvents].slice(0, 200));
      toast({ title: 'Секрет опубликован в ленте', description: 'Комьюнити увидит твоё достижение.' });
    } catch {
      toast({ title: 'Секрет отмечен как раскрытый', description: 'Не удалось сразу отправить в ленту.', variant: 'destructive' });
    }
  };

  const handleHideSecret = (achievementId: string) => {
    const nextShared = sharedSecretIds.filter((id) => id !== achievementId);
    setSharedSecretIds(nextShared);
    upsertLocalArray(SHARED_SECRET_STORAGE_KEY, nextShared);
    toast({ title: 'Секрет сохранён в тайне' });
  };

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter((a) => a.unlocked).length,
    common: achievements.filter((a) => a.rarity === 'common' && a.unlocked).length,
    rare: achievements.filter((a) => a.rarity === 'rare' && a.unlocked).length,
    epic: achievements.filter((a) => a.rarity === 'epic' && a.unlocked).length,
    legendary: achievements.filter((a) => a.rarity === 'legendary' && a.unlocked).length,
    secret: achievements.filter((a) => a.rarity === 'secret' && a.unlocked).length,
  };

  const rarityStyles = {
    common: 'border-muted-foreground/30 bg-muted/20 hover:border-muted-foreground/50',
    rare: 'border-primary/40 bg-primary/5 hover:border-primary/60',
    epic: 'border-nova-purple/40 bg-nova-purple/5 hover:border-nova-purple/60',
    legendary: 'border-accent/40 bg-accent/5 hover:border-accent/60 shadow-gold',
    secret: 'border-nova-cyan/40 bg-nova-cyan/5 hover:border-nova-cyan/60',
  };

  const rarityBadge = {
    common: 'bg-muted-foreground/20 text-muted-foreground',
    rare: 'bg-primary/20 text-primary',
    epic: 'bg-nova-purple/20 text-nova-purple',
    legendary: 'bg-accent/20 text-accent',
    secret: 'bg-nova-cyan/20 text-nova-cyan',
  };

  const rarityLabels = {
    common: 'Обычное',
    rare: 'Редкое',
    epic: 'Эпическое',
    legendary: 'Легендарное',
    secret: 'Секретное',
  };

  const secretSeriesTotal = Math.max(secretAchievements.length, 1);
  const secretSeriesOpened = secretAchievements.filter((item) => item.unlocked).length;
  const overlayAchievement = achievements.find((item) => item.id === secretUnlockOverlayId) ?? null;

  const overlayParticles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        id: index,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 2.4}s`,
        duration: `${1.5 + Math.random() * 2.5}s`,
        size: `${4 + Math.floor(Math.random() * 8)}px`,
      })),
    [secretUnlockOverlayId],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Достижения</h1>
          <p className="text-muted-foreground mt-1">
            Коллекционируй награды, повышай статус и отслеживай свой прогресс
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30">
          <Trophy className="w-5 h-5 text-accent" />
          <span className="font-bold text-accent">{stats.unlocked}</span>
          <span className="text-muted-foreground">/ {stats.total}</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-secondary/20 p-4 md:p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-accent mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Что такое достижения и как их получать</p>
            <p className="text-muted-foreground">
              Достижения — это долгосрочные цели за активность: стримы, стабильность, вклад в комьюнити и специальные события.
              Выполняй условия, следи за прогрессом в карточках и забирай награды после разблокировки.
            </p>
            <p className="text-muted-foreground">
              В системе есть <span className="font-medium text-foreground">секретные</span> достижения: они видны всем, но условия скрыты до раскрытия секрета.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-nova-cyan/40 bg-gradient-to-br from-nova-cyan/15 via-nova-purple/10 to-card p-5 md:p-6 shadow-glow relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-nova-cyan/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-20 -left-16 w-56 h-56 bg-nova-purple/20 rounded-full blur-3xl animate-pulse-glow" />

        <div className="relative space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-nova-cyan animate-pulse" />
              <h2 className="text-xl font-bold text-gradient-cyan">Секретные достижения</h2>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-card/60 border border-nova-cyan/30 text-sm">
              Ты открыл {secretSeriesOpened} из {secretSeriesTotal} секретов
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {secretAchievements.length === 0 ? (
              <p className="text-sm text-muted-foreground">Секретные достижения будут добавлены позже.</p>
            ) : (
              secretAchievements.map((achievement) => {
                const publicStats = secretStats[achievement.id];
                const unlockedDetails = unlockDetails[achievement.id];

                return (
                  <button
                    key={achievement.id}
                    className={cn(
                      'text-left rounded-xl border p-4 transition-all duration-300 relative overflow-hidden secret-hover-vibe',
                      'bg-gradient-to-br from-nova-cyan/10 via-nova-purple/10 to-card border-nova-cyan/50 hover:shadow-glow hover:scale-[1.02]',
                      achievement.unlocked && 'ring-2 ring-nova-cyan/40',
                    )}
                    onClick={() => setSelectedAchievementId(achievement.id)}
                  >
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                    <div className="relative flex items-start gap-3">
                      <div className={cn(
                        'w-14 h-14 rounded-xl flex items-center justify-center text-3xl border border-nova-cyan/40',
                        achievement.unlocked ? 'bg-gradient-cyan' : 'bg-card/70',
                      )}>
                        {achievement.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{achievement.title}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider bg-nova-cyan/20 text-nova-cyan">
                            Секретное
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground mt-1">
                          {achievement.unlocked
                            ? achievement.description
                            : 'Условия неизвестны. Открой секрет.'}
                        </p>

                        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                          <div className="inline-flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Получили: {publicStats?.unlock_count ?? 0}
                          </div>
                          <div>
                            {publicStats?.last_user_name
                              ? `Последний: ${publicStats.last_user_name}`
                              : 'Некоторые уже получили это достижение…'}
                          </div>
                          {achievement.unlocked && unlockedDetails?.unlocked_at && (
                            <div className="text-success">
                              ✓ Открыто {new Date(unlockedDetails.unlocked_at).toLocaleString('ru-RU')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(rarityLabels).map(([key, label]) => (
          <div 
            key={key}
            className={cn(
              "p-4 rounded-xl border text-center",
              rarityStyles[key as keyof typeof rarityStyles]
            )}
          >
            <p className="text-2xl font-bold">{stats[key as keyof typeof stats]}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1">
          {(['all', 'unlocked', 'locked'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
                filter === f 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {f === 'all' ? 'Все' : f === 'unlocked' ? 'Разблокировано' : 'Заблокировано'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRegularAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className={cn(
              "relative p-5 rounded-xl border transition-all duration-300",
              rarityStyles[achievement.rarity],
              !achievement.unlocked && "opacity-60"
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-14 h-14 flex items-center justify-center text-3xl rounded-xl",
                achievement.unlocked 
                  ? "bg-gradient-cosmic" 
                  : "bg-muted grayscale"
              )}>
                {achievement.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{achievement.title}</h3>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                    rarityBadge[achievement.rarity]
                  )}>
                    {rarityLabels[achievement.rarity]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>

                {achievement.unlocked ? (
                  <p className="text-xs text-success mt-2">
                    ✓ Разблокировано {achievement.unlockedAt && new Date(achievement.unlockedAt).toLocaleDateString('ru-RU')}
                  </p>
                ) : achievement.progress !== undefined ? (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Прогресс</span>
                      <span>{achievement.progress}/{achievement.maxProgress}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-gold rounded-full transition-all duration-500"
                        style={{ width: `${((achievement.progress || 0) / (achievement.maxProgress || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Заблокировано
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={Boolean(selectedAchievement)} onOpenChange={(open) => !open && setSelectedAchievementId(null)}>
        <DialogContent className="sm:max-w-2xl">
          {selectedAchievement && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{selectedAchievement.icon}</span>
                  <span>{selectedAchievement.title}</span>
                </DialogTitle>
              </DialogHeader>

              {(() => {
                const unlock = unlockDetails[selectedAchievement.id];
                const snapshot = unlock?.snapshot;
                const snapshotInfo = describeSnapshot(snapshot as Record<string, unknown> | undefined);
                const isSecret = selectedAchievement.rarity === 'secret';
                const isUnlocked = selectedAchievement.unlocked;

                return (
                  <div className="space-y-4 text-sm">
                    <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-2">
                      <p><span className="font-semibold">Описание:</span> {isUnlocked ? selectedAchievement.description : 'Условия неизвестны. Открой секрет.'}</p>
                      <p><span className="font-semibold">Как получено:</span> {isUnlocked ? snapshotInfo.how : 'Пока скрыто.'}</p>
                      <p><span className="font-semibold">Когда получено:</span> {unlock?.unlocked_at ? new Date(unlock.unlocked_at).toLocaleString('ru-RU') : '—'}</p>
                      <p><span className="font-semibold">Конкретный триггер:</span> {isUnlocked ? snapshotInfo.trigger : 'Секретный триггер скрыт.'}</p>
                    </div>

                    {isSecret && isUnlocked && (
                      <div className="p-4 rounded-xl border border-nova-cyan/40 bg-nova-cyan/10 space-y-3">
                        <p className="font-semibold">Поделиться секретом</p>
                        <p className="text-muted-foreground">
                          Ты можешь рассказать об этом в ленте NovaBoost или оставить секрет при себе.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={() => void handleShareSecret(selectedAchievement.id)} className="gap-2">
                            <Share2 className="w-4 h-4" /> Рассказать
                          </Button>
                          <Button variant="outline" onClick={() => handleHideSecret(selectedAchievement.id)} className="gap-2">
                            <EyeOff className="w-4 h-4" /> Скрыть
                          </Button>
                          {sharedSecretIds.includes(selectedAchievement.id) && (
                            <span className="text-xs text-success self-center">Секрет опубликован</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </DialogContent>
      </Dialog>

      {overlayAchievement && (
        <div className="fixed inset-0 z-[120] bg-background/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {overlayParticles.map((particle) => (
              <span
                key={particle.id}
                className="absolute rounded-full bg-gradient-cyan animate-float opacity-80"
                style={{
                  left: particle.left,
                  top: particle.top,
                  width: particle.size,
                  height: particle.size,
                  animationDelay: particle.delay,
                  animationDuration: particle.duration,
                }}
              />
            ))}
          </div>

          <div className="relative w-full max-w-2xl rounded-3xl border border-nova-cyan/50 bg-gradient-to-br from-nova-cyan/20 via-nova-purple/15 to-card p-8 md:p-10 text-center shadow-glow">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-nova-cyan/40 bg-card/70 mb-5">
              <Flame className="w-4 h-4 text-nova-cyan" />
              <span className="font-semibold">Секрет NovaBoost раскрыт</span>
            </div>

            <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-cyan flex items-center justify-center text-5xl mb-4 animate-pulse-glow">
              {overlayAchievement.icon}
            </div>

            <h3 className="text-3xl font-display font-bold text-gradient-cyan">Ты открыл секрет NovaBoost!</h3>
            <p className="mt-3 text-lg font-semibold">{overlayAchievement.title}</p>
            <p className="mt-2 text-muted-foreground">Поздравляем! Это достижение открыли только самые внимательные стримеры.</p>

            <div className="mt-6 flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <Clock3 className="w-4 h-4" />
              {new Date().toLocaleString('ru-RU')}
            </div>

            <div className="mt-8 flex justify-center">
              <Button onClick={() => setSecretUnlockOverlayId(null)} size="lg">
                Продолжить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Achievements;
