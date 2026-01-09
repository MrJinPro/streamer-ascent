import React from 'react';
import { Clock, TrendingUp, Users, Zap } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import LevelProgress from '@/components/dashboard/LevelProgress';
import QuickTasks from '@/components/dashboard/QuickTasks';
import GrowthPathCard from '@/components/dashboard/GrowthPathCard';
import RecentAchievements from '@/components/dashboard/RecentAchievements';
import { currentUser } from '@/data/mockData';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">
            Привет, <span className="text-gradient-cosmic">{currentUser.name.split(' ')[0]}</span>! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Твой путь к успеху продолжается. Сегодня отличный день для роста!
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-lg font-bold text-accent">{currentUser.streakDays} дней</p>
            <p className="text-xs text-muted-foreground">подряд</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Часов в эфире"
          value={currentUser.totalHours}
          subtitle="за всё время"
          icon={Clock}
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title="Текущий уровень"
          value={currentUser.level}
          subtitle={`${currentUser.xpToNextLevel - currentUser.xp} XP до следующего`}
          icon={TrendingUp}
          variant="primary"
        />
        <StatCard
          title="Достижения"
          value={currentUser.achievements}
          subtitle="из 25 возможных"
          icon={Users}
          variant="gold"
        />
        <StatCard
          title="XP за неделю"
          value="+850"
          subtitle="отличный прогресс!"
          icon={Zap}
          variant="success"
          trend={{ value: 23, positive: true }}
        />
      </div>

      {/* Level Progress */}
      <LevelProgress />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <QuickTasks />
        </div>
        <div className="space-y-6">
          <GrowthPathCard />
          <RecentAchievements />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
