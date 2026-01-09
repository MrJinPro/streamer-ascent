import React from 'react';
import { Clock, TrendingUp, Trophy, Zap, Flame, Target, ArrowUpRight } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import LevelProgress from '@/components/dashboard/LevelProgress';
import QuickTasks from '@/components/dashboard/QuickTasks';
import GrowthPathCard from '@/components/dashboard/GrowthPathCard';
import RecentAchievements from '@/components/dashboard/RecentAchievements';
import { currentUser } from '@/data/mockData';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
              Привет, <span className="text-gradient">{currentUser.name.split(' ')[0]}</span>
            </h1>
            <span className="text-3xl animate-float">👋</span>
          </div>
          <p className="text-muted-foreground text-lg">
            Твой путь к успеху продолжается. Сегодня отличный день для роста!
          </p>
        </div>
        
        {/* Streak badge */}
        <div className="flex items-center gap-4">
          <div className="glass-card px-5 py-3 flex items-center gap-3 hover-lift cursor-pointer">
            <div className="relative">
              <Flame className="w-8 h-8 text-accent animate-pulse-glow" />
              <div className="absolute inset-0 bg-accent/30 blur-xl" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gradient-accent">{currentUser.streakDays}</p>
              <p className="text-xs text-muted-foreground font-medium">дней подряд</p>
            </div>
          </div>
          
          <button className="glass-card p-3 hover-lift group">
            <Target className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          icon={Trophy}
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
        <div className="lg:col-span-2">
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
