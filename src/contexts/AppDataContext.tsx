import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  User,
  Checkpoint,
  DailyTask,
  Achievement,
  Task,
  GrowthPath,
  Lesson,
  Article,
  ChatMessage,
  StreamEvent,
  UserAppStats,
} from '@/types/app-data';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { useAuth } from '@/contexts/AuthContext';
import { getSeasonKey, getTaskPeriod, getTaskPeriodKey } from '@/lib/progressionEconomy';

export type AppContentKey =
  | 'checkpoints'
  | 'dailyTasks'
  | 'achievements'
  | 'tasks'
  | 'growthPaths'
  | 'lessons'
  | 'articles'
  | 'chatMessages'
  | 'streamEvents';

export type PersistedContentKey = AppContentKey | 'userStats';

export interface AppDataShape {
  currentUser: User;
  allUsers: User[];
  checkpoints: Checkpoint[];
  dailyTasks: DailyTask[];
  achievements: Achievement[];
  tasks: Task[];
  growthPaths: GrowthPath[];
  lessons: Lesson[];
  articles: Article[];
  chatMessages: ChatMessage[];
  streamEvents: StreamEvent[];
}

type ContentOnlyShape = Omit<AppDataShape, 'currentUser' | 'allUsers'>;
type PersistedContentShape = ContentOnlyShape & {
  userStats: Record<string, UserAppStats>;
};

const defaultContent: PersistedContentShape = {
  checkpoints: [],
  dailyTasks: [],
  achievements: [],
  tasks: [],
  growthPaths: [],
  lessons: [],
  articles: [],
  chatMessages: [],
  streamEvents: [],
  userStats: {},
};

const appKeys = Object.keys(defaultContent) as PersistedContentKey[];

const rolePriority: Record<string, number> = {
  owner: 1,
  admin: 2,
  developer: 3,
  senior_curator: 4,
  manager: 5,
  curator: 6,
  moderator: 7,
  support: 8,
  investor: 9,
  streamer: 10,
};

const mapRoleToLegacy = (role: string | null | undefined): string => {
  const normalized = String(role ?? '').trim().toLowerCase();

  switch (normalized) {
    case 'system_owner':
      return 'owner';
    case 'owner':
      return 'owner';
    case 'architect':
    case 'admin':
      return 'admin';
    case 'engineer':
    case 'developer':
      return 'developer';
    case 'head_mentor':
    case 'senior_curator':
      return 'senior_curator';
    case 'mentor':
    case 'curator':
      return 'curator';
    case 'agency_manager':
    case 'manager':
      return 'manager';
    case 'moderator':
      return 'moderator';
    case 'support':
      return 'support';
    case 'investor_viewer':
    case 'investor_pro':
    case 'board':
    case 'investor':
      return 'investor';
    default:
      return 'streamer';
  }
};

const defaultStats = {
  diamondsTotal: 0,
  diamonds30Days: 0,
  diamondsToday: 0,
  currentLevel: 1,
  maxLevel: 50,
  checkpoint1: false,
  checkpoint2: false,
  checkpoint3: false,
  checkpoint1Claimed: null,
  checkpoint2Claimed: null,
  checkpoint3Claimed: null,
  monthlyDiamonds: 0,
  rank: 0,
} as const;

const createUserFromProfile = (
  profile: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    created_at: string;
    is_online?: boolean | null;
  },
  role?: string | null,
  rank?: number,
): User => ({
  id: profile.user_id,
  name: profile.display_name ?? profile.username ?? 'Пользователь',
  avatar: profile.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`,
  role: (role ?? 'streamer') as User['role'],
  level: 1,
  xp: 0,
  xpToNextLevel: 1000,
  streakDays: 0,
  joinedDate: profile.created_at,
  totalHours: 0,
  completedTasks: 0,
  achievements: 0,
  isOnline: profile.is_online ?? false,
  stats: {
    ...defaultStats,
    rank: rank ?? 0,
  },
});

const createFallbackUserFromAuth = (authUser: NonNullable<ReturnType<typeof useAuth>['user']>): User => ({
  id: authUser.id,
  name:
    (authUser.user_metadata?.display_name as string | undefined) ??
    (authUser.user_metadata?.full_name as string | undefined) ??
    (authUser.user_metadata?.name as string | undefined) ??
    authUser.email?.split('@')[0] ??
    'Пользователь',
  avatar:
    (authUser.user_metadata?.avatar_url as string | undefined) ??
    (authUser.user_metadata?.picture as string | undefined) ??
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.id}`,
  role: 'streamer',
  level: 1,
  xp: 0,
  xpToNextLevel: 1000,
  streakDays: 0,
  joinedDate: new Date().toISOString(),
  totalHours: 0,
  completedTasks: 0,
  achievements: 0,
  isOnline: true,
  stats: {
    ...defaultStats,
    rank: 1,
  },
});

const createUserFromMobileRow = (
  row: {
    id: string;
    supabase_uid?: string | null;
    username?: string | null;
    tiktok_username?: string | null;
    email?: string | null;
    role?: string | null;
    created_at?: string | null;
    last_ws_at?: string | null;
  },
  roleFromUserRoles?: string | null,
  rank?: number,
): User => {
  const userId = row.supabase_uid ?? row.id;
  const displayName = row.username ?? row.tiktok_username ?? row.email?.split('@')[0] ?? 'Пользователь';
  const fallbackDate = row.created_at ?? new Date().toISOString();

  return {
    id: userId,
    name: displayName,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
    role: (roleFromUserRoles ?? row.role ?? 'streamer') as User['role'],
    level: 1,
    xp: 0,
    xpToNextLevel: 1000,
    streakDays: 0,
    joinedDate: fallbackDate,
    totalHours: 0,
    completedTasks: 0,
    achievements: 0,
    isOnline: Boolean(row.last_ws_at),
    stats: {
      ...defaultStats,
      rank: rank ?? 0,
    },
  };
};

const isSchemaMismatchError = (error: { code?: string; message?: string; details?: string } | null | undefined) => {
  if (!error) {
    return false;
  }

  const text = `${error.code ?? ''} ${error.message ?? ''} ${error.details ?? ''}`;
  return /PGRST20\d|42703|column .* does not exist|schema cache|Could not find the .* column/i.test(text);
};

const applyUserStats = (user: User, stats?: UserAppStats): User => {
  if (!stats) {
    return user;
  }

  const level = stats.level ?? user.level;

  return {
    ...user,
    level,
    xp: stats.xp ?? user.xp,
    xpToNextLevel: stats.xpToNextLevel ?? user.xpToNextLevel,
    streakDays: stats.streakDays ?? user.streakDays,
    totalHours: stats.totalHours ?? user.totalHours,
    completedTasks: stats.completedTasks ?? user.completedTasks,
    achievements: stats.achievements ?? user.achievements,
    stats: {
      ...user.stats,
      currentLevel: level,
      diamondsTotal: stats.diamondsTotal ?? user.stats.diamondsTotal,
      diamonds30Days: stats.diamonds30Days ?? user.stats.diamonds30Days,
      diamondsToday: stats.diamondsToday ?? user.stats.diamondsToday,
      monthlyDiamonds: stats.monthlyDiamonds ?? user.stats.monthlyDiamonds,
    },
  };
};

interface AppDataContextValue extends AppDataShape {
  loading: boolean;
  refresh: () => Promise<void>;
  updateContent: <K extends keyof ContentOnlyShape>(key: K, payload: ContentOnlyShape[K]) => Promise<void>;
}

type UserAchievementRow = {
  achievement_id: string;
  progress_value: number;
  target_value: number;
  status: 'in_progress' | 'unlocked' | 'revoked';
  unlocked_at: string | null;
};

type UserTaskProgressRow = {
  task_id: string;
  period: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  period_key: string;
  season_key: string;
  progress: number;
  max_progress: number;
  completed: boolean;
  completed_at: string | null;
  xp_awarded: number;
  updated_at: string;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

const toRows = (data: Partial<PersistedContentShape>) =>
  Object.entries(data).map(([key, payload]) => ({ key, payload }));

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dbData, setDbData] = useState<Partial<PersistedContentShape>>({});
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [userAchievementRows, setUserAchievementRows] = useState<UserAchievementRow[]>([]);
  const [userTaskProgressRows, setUserTaskProgressRows] = useState<UserTaskProgressRow[]>([]);

  const hydrate = useCallback(async () => {
    setLoading(true);

    const [{ data, error }, { data: profiles }, { data: roleRows }, { data: mobileUsers, error: mobileUsersError }] = await Promise.all([
      supabasePublic.from('app_content').select('key,payload').in('key', appKeys),
      supabasePublic
        .from('profiles')
        .select('user_id,display_name,username,avatar_url,created_at,is_online')
        .order('created_at', { ascending: true }),
      supabasePublic.from('user_roles').select('user_id,role,role_id,roles:role_id(slug)'),
      supabasePublic
        .from('users' as any)
        .select('id,supabase_uid,username,tiktok_username,email,role,created_at,last_ws_at')
        .order('created_at', { ascending: true }),
    ]);

    if (error) {
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      await supabasePublic.from('app_content').upsert(toRows(defaultContent), { onConflict: 'key' });
      setDbData(defaultContent);
    } else {
      const mapped = data.reduce<Partial<PersistedContentShape>>((acc, row) => {
        acc[row.key as AppContentKey] = row.payload as never;
        return acc;
      }, {});

      setDbData(mapped);
    }

    const roleByUserId = (roleRows ?? []).reduce<Record<string, string>>((acc, row: any) => {
      const currentRole = acc[row.user_id];
      const roleSlug = row?.roles?.slug as string | undefined;
      const nextRole = mapRoleToLegacy(roleSlug ?? row.role);

      if (!currentRole || (rolePriority[nextRole] ?? 99) < (rolePriority[currentRole] ?? 99)) {
        acc[row.user_id] = nextRole;
      }

      return acc;
    }, {});

    let mappedMobileUsers: User[] = [];

    if (mobileUsersError && isSchemaMismatchError(mobileUsersError)) {
      const mobileUsersFallback = await supabasePublic
        .from('users' as any)
        .select('id,username,tiktok_username,email,role,created_at')
        .order('created_at', { ascending: true });

      if (!mobileUsersFallback.error) {
        mappedMobileUsers = (mobileUsersFallback.data ?? []).map((row: any, index: number) =>
          createUserFromMobileRow(row, roleByUserId[row.id], index + 1),
        );
      }
    } else if (!mobileUsersError) {
      mappedMobileUsers = ((mobileUsers as any[]) ?? []).map((row: any, index: number) => {
        const userId = row.supabase_uid ?? row.id;
        return createUserFromMobileRow(row, roleByUserId[userId], index + 1);
      });
    }

    const profileUsers = (profiles ?? []).map((profile: any, index: number) =>
      createUserFromProfile(profile, roleByUserId[profile.user_id], index + 1),
    );

    const mergedUsersById = new Map<string, User>();
    profileUsers.forEach((item) => mergedUsersById.set(item.id, item));
    mappedMobileUsers.forEach((item) => {
      if (!mergedUsersById.has(item.id)) {
        mergedUsersById.set(item.id, item);
      }
    });

    const mappedUsers = Array.from(mergedUsersById.values());

    if (mappedUsers.length > 0) {
      setDbUsers(mappedUsers);
    } else if (user) {
      setDbUsers([createFallbackUserFromAuth(user)]);
    } else {
      setDbUsers([]);
    }

    if (user?.id) {
      const currentSeasonKey = getSeasonKey();

      await (supabasePublic as any).rpc('sync_user_task_stats', { p_user_id: user.id, p_season_key: currentSeasonKey });

      const { data: taskProgressRows, error: taskProgressError } = await (supabasePublic as any)
        .from('user_task_progress')
        .select('task_id,period,period_key,season_key,progress,max_progress,completed,completed_at,xp_awarded,updated_at')
        .eq('user_id', user.id)
        .eq('season_key', currentSeasonKey);

      if (!taskProgressError) {
        setUserTaskProgressRows((taskProgressRows ?? []) as UserTaskProgressRow[]);
      } else if (isSchemaMismatchError(taskProgressError)) {
        setUserTaskProgressRows([]);
      }

      await (supabasePublic as any).rpc('refresh_user_achievements', { p_user_id: user.id });

      const { data: achievementRows, error: achievementRowsError } = await (supabasePublic as any)
        .from('achievement_progress')
        .select('achievement_id,progress_value,target_value,status,unlocked_at')
        .eq('user_id', user.id);

      if (!achievementRowsError) {
        setUserAchievementRows((achievementRows ?? []) as UserAchievementRow[]);
      }
    } else {
      setUserTaskProgressRows([]);
      setUserAchievementRows([]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const updateContent = useCallback(
    async <K extends keyof ContentOnlyShape>(key: K, payload: ContentOnlyShape[K]) => {
      const { error } = await supabasePublic
        .from('app_content')
        .upsert({ key, payload }, { onConflict: 'key' });

      if (error) {
        if (error.code === '42P01') {
          throw new Error('Таблица app_content не найдена. Примените миграции Supabase (supabase db push).');
        }

        if (error.code === '42501') {
          throw new Error('Недостаточно прав для записи в app_content. Проверьте RLS/роль пользователя.');
        }

        throw new Error(error.message || 'Ошибка записи в базу данных.');
      }

      setDbData(prev => ({ ...prev, [key]: payload }));
    },
    [],
  );

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const run = async () => {
      const achievements = (dbData.achievements ?? defaultContent.achievements) as Achievement[];
      const userStatsMap = (dbData.userStats ?? defaultContent.userStats) as Record<string, UserAppStats>;

      const pendingXpRewards = achievements.filter((achievement) => {
        if (!achievement.unlocked || !achievement.reward || typeof achievement.reward === 'string') {
          return false;
        }

        if (achievement.reward.type !== 'xp' || achievement.reward.xpAmount <= 0) {
          return false;
        }

        return !(achievement.rewardClaimedBy ?? []).includes(user.id);
      });

      if (pendingXpRewards.length === 0) {
        return;
      }

      const totalXpGain = pendingXpRewards.reduce((sum, achievement) => {
        if (!achievement.reward || typeof achievement.reward === 'string' || achievement.reward.type !== 'xp') {
          return sum;
        }
        return sum + achievement.reward.xpAmount;
      }, 0);

      const baseUser = dbUsers.find(item => item.id === user.id);
      const currentStats = userStatsMap[user.id] ?? {};

      let nextLevel = currentStats.level ?? baseUser?.level ?? 1;
      let nextXpToNext = currentStats.xpToNextLevel ?? baseUser?.xpToNextLevel ?? 1000;
      let nextXp = (currentStats.xp ?? baseUser?.xp ?? 0) + totalXpGain;

      while (nextXp >= nextXpToNext) {
        nextXp -= nextXpToNext;
        nextLevel += 1;
        nextXpToNext = Math.min(100000, Math.round(nextXpToNext * 1.15));
      }

      const updatedStatsMap: Record<string, UserAppStats> = {
        ...userStatsMap,
        [user.id]: {
          ...currentStats,
          level: nextLevel,
          xp: nextXp,
          xpToNextLevel: nextXpToNext,
        },
      };

      const updatedAchievements = achievements.map((achievement) => {
        if (!pendingXpRewards.some(item => item.id === achievement.id)) {
          return achievement;
        }

        return {
          ...achievement,
          rewardClaimedBy: [...new Set([...(achievement.rewardClaimedBy ?? []), user.id])],
        };
      });

      const { error } = await supabasePublic
        .from('app_content')
        .upsert(
          [
            { key: 'achievements', payload: updatedAchievements },
            { key: 'userStats', payload: updatedStatsMap },
          ],
          { onConflict: 'key' },
        );

      if (error) {
        console.error('Failed to apply achievement XP rewards:', error.message);
        return;
      }

      setDbData(prev => ({
        ...prev,
        achievements: updatedAchievements,
        userStats: updatedStatsMap,
      }));
    };

    void run();
  }, [dbData.achievements, dbData.userStats, dbUsers, user?.id]);

  const value = useMemo<AppDataContextValue>(() => {
    const mergedAll = { ...defaultContent, ...dbData } as PersistedContentShape;
    const { userStats, ...mergedContent } = mergedAll;

    const progressByAchievementId = userAchievementRows.reduce<Record<string, UserAchievementRow>>((acc, row) => {
      acc[row.achievement_id] = row;
      return acc;
    }, {});

    const taskProgressByCompositeKey = userTaskProgressRows.reduce<Record<string, UserTaskProgressRow>>((acc, row) => {
      const compositeKey = `${row.task_id}:${row.period}:${row.period_key}:${row.season_key}`;
      acc[compositeKey] = row;
      return acc;
    }, {});

    const mergedAchievements = (mergedContent.achievements as Achievement[]).map((achievement) => {
      const row = progressByAchievementId[achievement.id];
      if (!row) {
        return achievement;
      }

      return {
        ...achievement,
        progress: Math.floor(Number(row.progress_value ?? 0)),
        targetValue: Math.floor(Number(row.target_value ?? achievement.targetValue ?? achievement.maxProgress ?? 1)),
        maxProgress: Math.floor(Number(row.target_value ?? achievement.maxProgress ?? 1)),
        unlocked: row.status === 'unlocked',
        unlockedAt: row.unlocked_at ?? achievement.unlockedAt,
      };
    });

    const normalizedAchievements = mergedAchievements.map((achievement) => {
      const row = progressByAchievementId[achievement.id];
      if (row) {
        return achievement;
      }

      return {
        ...achievement,
        unlocked: false,
        unlockedAt: undefined,
        progress: 0,
      };
    });

    const now = new Date();
    const currentSeasonKey = getSeasonKey(now);
    const mergedTasks = (mergedContent.tasks as Task[]).map((task) => {
      const period = getTaskPeriod(task);
      const periodKey = getTaskPeriodKey(period, now);
      const compositeKey = `${task.id}:${period}:${periodKey}:${currentSeasonKey}`;
      const row = taskProgressByCompositeKey[compositeKey];

      if (!row) {
        const status: Task['status'] = task.completed ? 'completed' : task.progress > 0 ? 'in_progress' : 'pending';

        return {
          ...task,
          resetPeriod: task.resetPeriod ?? period,
          status,
        };
      }

      const safeMaxProgress = Math.max(1, Number(row.max_progress ?? task.maxProgress ?? 1));
      const safeProgress = Math.min(safeMaxProgress, Math.max(0, Number(row.progress ?? 0)));
      const isCompleted = Boolean(row.completed);
      const status: Task['status'] = isCompleted ? 'completed' : safeProgress > 0 ? 'in_progress' : 'pending';

      return {
        ...task,
        resetPeriod: task.resetPeriod ?? period,
        maxProgress: safeMaxProgress,
        progress: safeProgress,
        completed: isCompleted,
        status,
      };
    });

    const usersWithStats = dbUsers.map(item => applyUserStats(item, userStats[item.id]));

    const computedCurrentUser =
      (user ? usersWithStats.find(item => item.id === user.id) : undefined) ??
      usersWithStats[0] ??
      (user ? applyUserStats(createFallbackUserFromAuth(user), userStats[user.id]) : undefined);

    const computedAllUsers = usersWithStats.length > 0 ? usersWithStats : (computedCurrentUser ? [computedCurrentUser] : []);

    const currentUserUnlockedAchievements = normalizedAchievements.filter((item) => item.unlocked).length;
    const currentUserCompletedTasks = mergedTasks.filter((item) => item.completed).length;

    const normalizedCurrentUser = computedCurrentUser
      ? {
          ...computedCurrentUser,
          completedTasks: userStats[computedCurrentUser.id]?.completedTasks ?? currentUserCompletedTasks,
          achievements: currentUserUnlockedAchievements,
        }
      : computedCurrentUser;

    const normalizedUsers = computedAllUsers.map((entry) =>
      normalizedCurrentUser && entry.id === normalizedCurrentUser.id
        ? { ...entry, achievements: normalizedCurrentUser.achievements }
        : entry,
    );

    const merged: AppDataShape = {
      currentUser: normalizedCurrentUser as User,
      allUsers: normalizedUsers,
      ...mergedContent,
      achievements: normalizedAchievements,
      tasks: mergedTasks,
    };

    return {
      ...merged,
      loading,
      refresh: hydrate,
      updateContent,
    };
  }, [dbData, dbUsers, hydrate, loading, updateContent, user, userAchievementRows, userTaskProgressRows]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used inside AppDataProvider');
  }
  return ctx;
};
