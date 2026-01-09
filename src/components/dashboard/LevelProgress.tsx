import React from 'react';
import { ProgressRing } from '@/components/ui/progress-ring';
import { currentUser } from '@/data/mockData';
import { Flame, Zap, Star } from 'lucide-react';

const LevelProgress: React.FC = () => {
  const xpProgress = (currentUser.xp / currentUser.xpToNextLevel) * 100;

  return (
    <div className="p-6 rounded-xl glass border border-border">
      <div className="flex items-center gap-6">
        <ProgressRing progress={xpProgress} size={140} strokeWidth={10}>
          <div className="text-center">
            <p className="text-3xl font-display font-bold text-foreground">{currentUser.level}</p>
            <p className="text-xs text-muted-foreground">Level</p>
          </div>
        </ProgressRing>

        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Experience</span>
              <span className="text-sm text-muted-foreground">
                {currentUser.xp.toLocaleString()} / {currentUser.xpToNextLevel.toLocaleString()} XP
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-cosmic rounded-full transition-all duration-700 animate-pulse-glow"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(currentUser.xpToNextLevel - currentUser.xp).toLocaleString()} XP до уровня {currentUser.level + 1}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/30">
              <Flame className="w-5 h-5 text-accent" />
              <div>
                <p className="text-lg font-bold text-accent">{currentUser.streakDays}</p>
                <p className="text-xs text-muted-foreground">дней streak</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30">
              <Zap className="w-5 h-5 text-primary" />
              <div>
                <p className="text-lg font-bold text-primary">{currentUser.completedTasks}</p>
                <p className="text-xs text-muted-foreground">заданий</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-nova-purple/10 border border-nova-purple/30">
              <Star className="w-5 h-5 text-nova-purple" />
              <div>
                <p className="text-lg font-bold text-nova-purple">{currentUser.achievements}</p>
                <p className="text-xs text-muted-foreground">достижений</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelProgress;
