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
} from '@/types/app-data';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { useAuth } from '@/contexts/AuthContext';

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

const defaultContent: ContentOnlyShape = {
  checkpoints: [],
  dailyTasks: [],
  achievements: [],
  tasks: [],
  growthPaths: [],
  lessons: [],
  articles: [],
  chatMessages: [],
  streamEvents: [],
};

const appKeys = Object.keys(defaultContent) as AppContentKey[];

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

interface AppDataContextValue extends AppDataShape {
  loading: boolean;
  refresh: () => Promise<void>;
  updateContent: <K extends AppContentKey>(key: K, payload: AppDataShape[K]) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

const toRows = (data: Partial<ContentOnlyShape>) =>
  Object.entries(data).map(([key, payload]) => ({ key, payload }));

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dbData, setDbData] = useState<Partial<ContentOnlyShape>>({});
  const [dbUsers, setDbUsers] = useState<User[]>([]);

  const hydrate = useCallback(async () => {
    setLoading(true);

    const [{ data, error }, { data: profiles }, { data: roleRows }] = await Promise.all([
      supabasePublic.from('app_content').select('key,payload').in('key', appKeys),
      supabasePublic
        .from('profiles')
        .select('user_id,display_name,username,avatar_url,created_at,is_online')
        .order('created_at', { ascending: true }),
      supabasePublic.from('user_roles').select('user_id,role'),
    ]);

    if (error) {
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      await supabasePublic.from('app_content').upsert(toRows(defaultContent), { onConflict: 'key' });
      setDbData(defaultContent);
    } else {
      const mapped = data.reduce<Partial<ContentOnlyShape>>((acc, row) => {
        acc[row.key as AppContentKey] = row.payload as never;
        return acc;
      }, {});

      setDbData(mapped);
    }

    const roleByUserId = (roleRows ?? []).reduce<Record<string, string>>((acc, row: any) => {
      const currentRole = acc[row.user_id];
      const nextRole = row.role as string;

      if (!currentRole || (rolePriority[nextRole] ?? 99) < (rolePriority[currentRole] ?? 99)) {
        acc[row.user_id] = nextRole;
      }

      return acc;
    }, {});

    const mappedUsers = (profiles ?? []).map((profile: any, index: number) =>
      createUserFromProfile(profile, roleByUserId[profile.user_id], index + 1),
    );

    if (mappedUsers.length > 0) {
      setDbUsers(mappedUsers);
    } else if (user) {
      setDbUsers([createFallbackUserFromAuth(user)]);
    } else {
      setDbUsers([]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const updateContent = useCallback(
    async <K extends AppContentKey>(key: K, payload: AppDataShape[K]) => {
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

  const value = useMemo<AppDataContextValue>(() => {
    const mergedContent = { ...defaultContent, ...dbData } as ContentOnlyShape;
    const computedCurrentUser =
      (user ? dbUsers.find(item => item.id === user.id) : undefined) ??
      dbUsers[0] ??
      (user ? createFallbackUserFromAuth(user) : undefined);

    const computedAllUsers = dbUsers.length > 0 ? dbUsers : (computedCurrentUser ? [computedCurrentUser] : []);

    const merged: AppDataShape = {
      currentUser: computedCurrentUser as User,
      allUsers: computedAllUsers,
      ...mergedContent,
    };

    return {
      ...merged,
      loading,
      refresh: hydrate,
      updateContent,
    };
  }, [dbData, dbUsers, hydrate, loading, updateContent, user]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used inside AppDataProvider');
  }
  return ctx;
};
