import React from 'react';
import { achievements } from '@/data/mockData';
import { cn } from '@/lib/utils';

const RecentAchievements: React.FC = () => {
  const recentUnlocked = achievements.filter(a => a.unlocked).slice(0, 3);
  const inProgress = achievements.filter(a => !a.unlocked && a.progress).slice(0, 2);

  const rarityStyles = {
    common: 'border-muted-foreground/30 bg-muted/30',
    rare: 'border-primary/50 bg-primary/10',
    epic: 'border-nova-purple/50 bg-nova-purple/10',
    legendary: 'border-accent/50 bg-accent/10 shadow-gold',
  };

  const rarityBadge = {
    common: 'bg-muted-foreground/20 text-muted-foreground',
    rare: 'bg-primary/20 text-primary',
    epic: 'bg-nova-purple/20 text-nova-purple',
    legendary: 'bg-accent/20 text-accent',
  };

  return (
    <div className="p-6 rounded-xl glass border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg">Достижения</h3>
        <span className="text-sm text-muted-foreground">
          {achievements.filter(a => a.unlocked).length}/{achievements.length}
        </span>
      </div>

      {/* Recent unlocked */}
      <div className="space-y-3 mb-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Разблокировано</p>
        <div className="grid grid-cols-3 gap-2">
          {recentUnlocked.map((achievement) => (
            <div
              key={achievement.id}
              className={cn(
                "flex flex-col items-center p-3 rounded-lg border transition-transform hover:scale-105",
                rarityStyles[achievement.rarity]
              )}
            >
              <span className="text-2xl mb-1">{achievement.icon}</span>
              <p className="text-xs font-medium text-center line-clamp-1">{achievement.title}</p>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full mt-1",
                rarityBadge[achievement.rarity]
              )}>
                {achievement.rarity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* In progress */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">В прогрессе</p>
        {inProgress.map((achievement) => (
          <div
            key={achievement.id}
            className="p-3 rounded-lg bg-secondary/50 border border-border"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl opacity-50">{achievement.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{achievement.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {achievement.progress}/{achievement.maxProgress}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-gold rounded-full transition-all duration-500"
                    style={{ width: `${((achievement.progress || 0) / (achievement.maxProgress || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 py-2.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
        Все достижения →
      </button>
    </div>
  );
};

export default RecentAchievements;
