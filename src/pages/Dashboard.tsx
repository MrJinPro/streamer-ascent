import React from 'react';
import { Flame, Target, Sparkles } from 'lucide-react';
import { currentUser } from '@/data/mockData';
import DiamondStats from '@/components/dashboard/DiamondStats';
import CheckpointProgress from '@/components/dashboard/CheckpointProgress';
import Leaderboard from '@/components/dashboard/Leaderboard';
import DailyTasksCard from '@/components/dashboard/DailyTasksCard';
import RecentAchievements from '@/components/dashboard/RecentAchievements';
import AnimatedBackground from '@/components/dashboard/AnimatedBackground';

const Dashboard: React.FC = () => {
  return (
    <div className="relative min-h-screen">
      {/* Animated Background */}
      <AnimatedBackground />
      
      <div className="relative z-10 space-y-6 md:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
                Привет, <span className="text-gradient">{currentUser.name.split(' ')[0]}</span>
              </h1>
              <span className="text-2xl md:text-3xl animate-float">👋</span>
            </div>
            <p className="text-muted-foreground text-sm md:text-lg">
              Твой путь к успеху продолжается. Собирай алмазы и открывай награды!
            </p>
          </div>
          
          {/* Streak & Status */}
          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-2 -mb-2">
            <div className="glass-card px-3 md:px-5 py-2 md:py-3 flex items-center gap-2 md:gap-3 hover-lift cursor-pointer group flex-shrink-0">
              <div className="relative">
                <Flame className="w-6 md:w-8 h-6 md:h-8 text-accent animate-pulse-glow" />
                <div className="absolute inset-0 bg-accent/30 blur-xl group-hover:blur-2xl transition-all" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-gradient-accent">{currentUser.streakDays}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium">дней подряд</p>
              </div>
            </div>
            
            <div className="glass-card px-3 md:px-5 py-2 md:py-3 flex items-center gap-2 md:gap-3 hover-lift cursor-pointer group flex-shrink-0">
              <div className="relative">
                <Sparkles className="w-6 md:w-8 h-6 md:h-8 text-nova-gold animate-float" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-gradient-gold">{currentUser.stats.currentLevel}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium">уровень</p>
              </div>
            </div>
            
            <button className="glass-card p-2 md:p-3 hover-lift group flex-shrink-0">
              <Target className="w-5 md:w-6 h-5 md:h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </div>
        </div>

        {/* Diamond Stats */}
        <DiamondStats />

        {/* Checkpoint Progress Road */}
        <CheckpointProgress />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left column - Daily Tasks */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <DailyTasksCard />
          </div>
          
          {/* Right column - Leaderboard & Achievements */}
          <div className="space-y-4 md:space-y-6 order-1 lg:order-2">
            <Leaderboard />
            <RecentAchievements />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
