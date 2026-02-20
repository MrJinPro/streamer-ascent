import React from 'react';
import { Flame, Target, Sparkles, TrendingUp, Users, Play } from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import DiamondStats from '@/components/dashboard/DiamondStats';
import Leaderboard from '@/components/dashboard/Leaderboard';
import DailyTasksCard from '@/components/dashboard/DailyTasksCard';
import RecentAchievements from '@/components/dashboard/RecentAchievements';
import AnimatedBackground from '@/components/dashboard/AnimatedBackground';
import LevelProgress from '@/components/dashboard/LevelProgress';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { currentUser, allUsers, tasks } = useAppData();
  const streamerLeaderboard = [...allUsers]
    .filter(user => user.role === 'streamer')
    .sort((a, b) => b.stats.monthlyDiamonds - a.stats.monthlyDiamonds);
  const currentRank = streamerLeaderboard.findIndex(user => user.id === currentUser.id) + 1;
  const completedTasksCount = tasks.filter(task => task.completed).length;

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
              Твой путь к успеху продолжается!
            </p>
          </div>
          
          {/* Quick Stats Row */}
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
            
            <Link to="/progress" className="glass-card px-3 md:px-5 py-2 md:py-3 flex items-center gap-2 md:gap-3 hover-lift cursor-pointer group flex-shrink-0">
              <div className="relative">
                <Sparkles className="w-6 md:w-8 h-6 md:h-8 text-nova-gold animate-float" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-gradient-gold">{currentUser.stats.currentLevel}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium">уровень</p>
              </div>
            </Link>
            
            <div className="glass-card px-3 md:px-5 py-2 md:py-3 flex items-center gap-2 md:gap-3 hover-lift cursor-pointer group flex-shrink-0">
              <TrendingUp className="w-5 md:w-6 h-5 md:h-6 text-nova-cyan" />
              <div>
                <p className="text-xl md:text-2xl font-bold text-gradient-cyan">#{currentRank > 0 ? currentRank : '—'}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium">в рейтинге</p>
              </div>
            </div>
          </div>
        </div>

        {/* Diamond Stats */}
        <DiamondStats />

        {/* Level Progress + CTA to Progress page */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <LevelProgress />
          <Link to="/progress" className="glass-card p-6 flex flex-col justify-between hover-lift group relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-accent opacity-20 rounded-full blur-3xl group-hover:opacity-30 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Play className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-accent">Путь к легенде</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2">Открой полную карту прогресса</h3>
              <p className="text-muted-foreground text-sm mb-4">
                50 уровней, 3 чекпоинта алмазов и уникальные награды ждут тебя
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-xl">🏆</span>
                  <span>{completedTasksCount}/{tasks.length} заданий</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xl">💎</span>
                  <span>{Math.round(currentUser.stats.monthlyDiamonds / 1000)}k алмазов</span>
                </div>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-accent font-semibold group-hover:gap-3 transition-all">
              <span>Перейти к прогрессу</span>
              <TrendingUp className="w-4 h-4" />
            </div>
          </Link>
        </div>

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
