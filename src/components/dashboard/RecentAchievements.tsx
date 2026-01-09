import React from 'react';
import { Trophy, ChevronRight, Sparkles } from 'lucide-react';
import { achievements } from '@/data/mockData';
import { cn } from '@/lib/utils';

const rarityStyles = {
  common: { bg: 'bg-secondary', border: 'border-border', text: 'text-foreground' },
  rare: { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary' },
  epic: { bg: 'bg-accent/10', border: 'border-accent/30', text: 'text-accent' },
  legendary: { bg: 'bg-gradient-to-br from-nova-gold/20 to-nova-gold/5', border: 'border-nova-gold/40', text: 'text-nova-gold' },
};

const RecentAchievements: React.FC = () => {
  const unlockedAchievements = achievements.filter(a => a.unlockedAt).sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime()).slice(0, 3);

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-nova-gold/10 rounded-full blur-3xl" />
      <div className="relative space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center"><Trophy className="w-5 h-5 text-white" /></div>
            <h3 className="text-lg font-bold">Достижения</h3>
          </div>
          <button className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">Все<ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          {unlockedAchievements.map((achievement) => {
            const rarity = rarityStyles[achievement.rarity];
            return (
              <div key={achievement.id} className={cn("group flex items-center gap-4 p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-[1.02]", rarity.bg, rarity.border)}>
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl">{achievement.icon}</div>
                  {achievement.rarity === 'legendary' && <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-nova-gold animate-float" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-semibold truncate", rarity.text)}>{achievement.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RecentAchievements;
