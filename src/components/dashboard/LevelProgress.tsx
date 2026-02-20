import React from 'react';
import { Zap, Star, Trophy, Target } from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';

const LevelProgress: React.FC = () => {
  const { currentUser } = useAppData();
  const progress = (currentUser.xp / currentUser.xpToNextLevel) * 100;
  const xpNeeded = currentUser.xpToNextLevel - currentUser.xp;

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
      <div className="relative space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-md opacity-50" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{currentUser.level}</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold">Уровень {currentUser.level}</h3>
              <p className="text-sm text-muted-foreground">
                Ещё <span className="text-primary font-semibold">{xpNeeded} XP</span> до уровня {currentUser.level + 1}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full glass">
            <Zap className="w-5 h-5 text-nova-gold" />
            <span className="font-bold text-gradient-gold">{currentUser.xp}</span>
            <span className="text-muted-foreground text-sm">/ {currentUser.xpToNextLevel}</span>
          </div>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-primary rounded-full transition-all duration-1000 ease-out progress-glow" style={{ width: `${progress}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-xl bg-secondary/50">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1"><Target className="w-4 h-4" /><span className="text-xs">Сегодня</span></div>
            <p className="text-xl font-bold text-gradient">+125</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-secondary/50">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1"><Zap className="w-4 h-4" /><span className="text-xs">Неделя</span></div>
            <p className="text-xl font-bold text-gradient-gold">+850</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-secondary/50">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1"><Star className="w-4 h-4" /><span className="text-xs">Месяц</span></div>
            <p className="text-xl font-bold text-gradient-cyan">+3,240</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelProgress;
