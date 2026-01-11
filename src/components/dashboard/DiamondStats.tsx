import React from 'react';
import { Diamond, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import { currentUser, formatDiamonds } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface DiamondCardProps {
  title: string;
  value: number;
  subtitle: string;
  variant: 'total' | 'monthly' | 'today';
  trend?: number;
}

const DiamondCard: React.FC<DiamondCardProps> = ({ title, value, subtitle, variant, trend }) => {
  const variants = {
    total: {
      bg: 'from-nova-cyan/20 via-nova-cyan/10 to-transparent',
      border: 'border-nova-cyan/30',
      icon: 'bg-gradient-to-br from-nova-cyan to-nova-cyan/60',
      glow: 'shadow-[0_0_30px_rgba(0,212,255,0.3)]',
      text: 'text-nova-cyan',
    },
    monthly: {
      bg: 'from-nova-gold/20 via-nova-gold/10 to-transparent',
      border: 'border-nova-gold/30',
      icon: 'bg-gradient-to-br from-nova-gold to-nova-gold/60',
      glow: 'shadow-[0_0_30px_rgba(255,215,0,0.3)]',
      text: 'text-nova-gold',
    },
    today: {
      bg: 'from-nova-pink/20 via-nova-pink/10 to-transparent',
      border: 'border-nova-pink/30',
      icon: 'bg-gradient-to-br from-nova-pink to-nova-pink/60',
      glow: 'shadow-[0_0_30px_rgba(255,0,128,0.3)]',
      text: 'text-nova-pink',
    },
  };

  const v = variants[variant];

  return (
    <div className={cn(
      "relative group p-5 rounded-2xl border bg-gradient-to-br transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden",
      v.bg, v.border, "hover:" + v.glow
    )}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={cn("absolute w-2 h-2 rounded-full animate-float", v.text, "opacity-40")} style={{ top: '20%', left: '80%', animationDelay: '0s' }} />
        <div className={cn("absolute w-1.5 h-1.5 rounded-full animate-float", v.text, "opacity-30")} style={{ top: '60%', left: '10%', animationDelay: '0.5s' }} />
        <div className={cn("absolute w-1 h-1 rounded-full animate-float", v.text, "opacity-20")} style={{ top: '80%', left: '70%', animationDelay: '1s' }} />
      </div>

      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-3xl lg:text-4xl font-bold tracking-tight", v.text)}>
              {formatDiamonds(value)}
            </span>
            <Diamond className={cn("w-6 h-6", v.text)} />
          </div>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {trend !== undefined && trend > 0 && (
            <div className="flex items-center gap-1 text-success text-sm">
              <TrendingUp className="w-3 h-3" />
              <span>+{trend}%</span>
            </div>
          )}
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", v.icon)}>
          {variant === 'total' && <Diamond className="w-6 h-6" />}
          {variant === 'monthly' && <Calendar className="w-6 h-6" />}
          {variant === 'today' && <Sparkles className="w-6 h-6" />}
        </div>
      </div>
    </div>
  );
};

const DiamondStats: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DiamondCard
        title="Алмазов всего"
        value={currentUser.stats.diamondsTotal}
        subtitle="за всё время"
        variant="total"
        trend={8}
      />
      <DiamondCard
        title="За 30 дней"
        value={currentUser.stats.diamonds30Days}
        subtitle="текущий месяц"
        variant="monthly"
        trend={15}
      />
      <DiamondCard
        title="Сегодня"
        value={currentUser.stats.diamondsToday}
        subtitle="продолжай в том же духе!"
        variant="today"
      />
    </div>
  );
};

export default DiamondStats;
