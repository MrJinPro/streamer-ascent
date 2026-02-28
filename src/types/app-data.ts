export type UserRole =
  | 'owner'
  | 'admin'
  | 'developer'
  | 'senior_curator'
  | 'curator'
  | 'manager'
  | 'moderator'
  | 'support'
  | 'investor'
  | 'streamer';

export interface StreamerStats {
  diamondsTotal: number;
  diamonds30Days: number;
  diamondsToday: number;
  currentLevel: number;
  maxLevel: number;
  checkpoint1: boolean;
  checkpoint2: boolean;
  checkpoint3: boolean;
  checkpoint1Claimed: boolean | null;
  checkpoint2Claimed: boolean | null;
  checkpoint3Claimed: boolean | null;
  monthlyDiamonds: number;
  rank: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streakDays: number;
  joinedDate: string;
  totalHours: number;
  completedTasks: number;
  achievements: number;
  stats: StreamerStats;
  isOnline?: boolean;
  lastStreamDate?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'secret';
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  targetValue?: number;
  progressType?:
    | 'counter_total'
    | 'sum_total'
    | 'duration_total'
    | 'max_in_single_session'
    | 'sum_in_single_session'
    | 'streak_days'
    | 'time_window_sum'
    | 'time_window_count'
    | 'hidden_combo'
    | 'manual_only'
    | 'verified_by_admin';
  grantMode?: 'auto' | 'verified_by_admin' | 'manual_only';
  rule?: Record<string, unknown>;
  reward?:
    | string
    | {
        type: 'xp';
        xpAmount: number;
      }
    | {
        type: 'gift';
        giftId: string;
        giftName: string;
      }
    | {
        type: 'custom';
        label: string;
      };
  rewardClaimedBy?: string[];
  category: 'diamonds' | 'stream' | 'community' | 'special';
}

export interface UserAppStats {
  level?: number;
  xp?: number;
  xpToNextLevel?: number;
  streakDays?: number;
  totalHours?: number;
  completedTasks?: number;
  taskSeasonXp?: number;
  taskSeasonKey?: string;
  taskSyncedAt?: string;
  achievements?: number;
  diamondsTotal?: number;
  diamonds30Days?: number;
  diamondsToday?: number;
  monthlyDiamonds?: number;
}

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  type: 'live_minimum' | 'live_extended' | 'activity';
  xpReward: number;
  progress: number;
  maxProgress: number;
  completed: boolean;
  icon: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'challenge';
  resetPeriod?: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  difficulty?: 1 | 2 | 3 | 4 | 5;
  xpReward: number;
  progress: number;
  maxProgress: number;
  completed: boolean;
  deadline?: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
}

export interface Checkpoint {
  id: string;
  diamondsRequired: number;
  rewardName: string;
  rewardValue: number;
  rewardIcon: string;
  alternativeRewardName?: string;
  alternativeRewardValue?: number;
  reached: boolean;
  claimed: boolean | null;
}

export interface PathStep {
  id: string;
  title: string;
  description: string;
  status: 'locked' | 'in_progress' | 'completed';
  xpReward: number;
  order: number;
}

export interface GrowthPath {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  status: 'locked' | 'in_progress' | 'completed';
  steps: PathStep[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  contentType?: 'text' | 'video' | 'image' | 'mixed';
  contentText?: string;
  videoUrl?: string;
  imageUrl?: string;
  completed: boolean;
  locked: boolean;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  featured: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

export interface StreamEvent {
  id: string;
  streamerId: string;
  streamerName: string;
  type: 'stream_start' | 'stream_end' | 'milestone' | 'achievement';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
