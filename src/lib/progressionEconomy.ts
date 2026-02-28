import type { Task } from '@/types/app-data';

export type TaskPeriod = 'daily' | 'weekly' | 'monthly' | 'seasonal';

const LEVEL_BASE_XP = 1000;
const LEVEL_GROWTH = 1.15;

export const getTaskPeriod = (task: Task): TaskPeriod => {
  if (task.resetPeriod) {
    return task.resetPeriod;
  }

  if (task.type === 'daily') return 'daily';
  if (task.type === 'weekly') return 'weekly';
  return 'monthly';
};

export const getSeasonKey = (date = new Date()): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const getTaskPeriodKey = (period: TaskPeriod, date = new Date()): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  if (period === 'daily') {
    return `${year}-${month}-${day}`;
  }

  if (period === 'monthly' || period === 'seasonal') {
    return `${year}-${month}`;
  }

  const utcDate = new Date(Date.UTC(year, date.getUTCMonth(), date.getUTCDate()));
  const dayOfWeek = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayOfWeek);
  const weekYear = utcDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${weekYear}-W${String(week).padStart(2, '0')}`;
};

export const getTotalXpFromLevel = (level: number, xpInCurrentLevel: number): number => {
  const normalizedLevel = Math.max(1, Math.floor(level));
  let threshold = LEVEL_BASE_XP;
  let total = 0;

  for (let currentLevel = 1; currentLevel < normalizedLevel; currentLevel += 1) {
    total += threshold;
    threshold = Math.min(100000, Math.round(threshold * LEVEL_GROWTH));
  }

  return total + Math.max(0, Math.floor(xpInCurrentLevel));
};

export const formatSeasonLabel = (date = new Date()): string =>
  date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
