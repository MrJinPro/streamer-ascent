import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  currentUser,
  allUsers,
  checkpoints,
  dailyTasks,
  achievements,
  tasks,
  growthPaths,
  lessons,
  articles,
  chatMessages,
  streamEvents,
  type User,
  type Checkpoint,
  type DailyTask,
  type Achievement,
  type Task,
  type GrowthPath,
  type Lesson,
  type Article,
  type ChatMessage,
  type StreamEvent,
} from '@/data/mockData';
import { supabasePublic } from '@/integrations/supabase/publicClient';

export type AppContentKey =
  | 'currentUser'
  | 'allUsers'
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

const defaultData: AppDataShape = {
  currentUser,
  allUsers,
  checkpoints,
  dailyTasks,
  achievements,
  tasks,
  growthPaths,
  lessons,
  articles,
  chatMessages,
  streamEvents,
};

const appKeys = Object.keys(defaultData) as AppContentKey[];

interface AppDataContextValue extends AppDataShape {
  loading: boolean;
  refresh: () => Promise<void>;
  updateContent: <K extends AppContentKey>(key: K, payload: AppDataShape[K]) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

const toRows = (data: Partial<AppDataShape>) =>
  Object.entries(data).map(([key, payload]) => ({ key, payload }));

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [dbData, setDbData] = useState<Partial<AppDataShape>>({});

  const hydrate = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabasePublic
      .from('app_content')
      .select('key,payload')
      .in('key', appKeys);

    if (error) {
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      await supabasePublic.from('app_content').upsert(toRows(defaultData), { onConflict: 'key' });

      setDbData(defaultData);
      setLoading(false);
      return;
    }

    const mapped = data.reduce<Partial<AppDataShape>>((acc, row) => {
      acc[row.key as AppContentKey] = row.payload as never;
      return acc;
    }, {});

    setDbData(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const updateContent = useCallback(
    async <K extends AppContentKey>(key: K, payload: AppDataShape[K]) => {
      const { error } = await supabasePublic
        .from('app_content')
        .upsert({ key, payload }, { onConflict: 'key' });

      if (error) {
        throw error;
      }

      setDbData(prev => ({ ...prev, [key]: payload }));
    },
    [],
  );

  const value = useMemo<AppDataContextValue>(() => {
    const merged = { ...defaultData, ...dbData } as AppDataShape;
    return {
      ...merged,
      loading,
      refresh: hydrate,
      updateContent,
    };
  }, [dbData, hydrate, loading, updateContent]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used inside AppDataProvider');
  }
  return ctx;
};
