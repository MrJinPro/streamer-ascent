import type { User } from '@/data/mockData';

export const formatDiamonds = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};

export const getLeaderboard = (users: User[]): User[] => {
  return [...users]
    .filter(user => user.role === 'streamer')
    .sort((a, b) => b.stats.monthlyDiamonds - a.stats.monthlyDiamonds)
    .map((user, index) => ({
      ...user,
      stats: {
        ...user.stats,
        rank: index + 1,
      },
    }));
};
