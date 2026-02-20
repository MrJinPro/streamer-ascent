import React, { useState } from 'react';
import { useAppData } from '@/contexts/AppDataContext';
import { cn } from '@/lib/utils';
import { Filter, Trophy } from 'lucide-react';

const Achievements: React.FC = () => {
  const { achievements } = useAppData();
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const filteredAchievements = achievements.filter(a => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  });

  const rarityStyles = {
    common: 'border-muted-foreground/30 bg-muted/20 hover:border-muted-foreground/50',
    rare: 'border-primary/40 bg-primary/5 hover:border-primary/60',
    epic: 'border-nova-purple/40 bg-nova-purple/5 hover:border-nova-purple/60',
    legendary: 'border-accent/40 bg-accent/5 hover:border-accent/60 shadow-gold',
  };

  const rarityBadge = {
    common: 'bg-muted-foreground/20 text-muted-foreground',
    rare: 'bg-primary/20 text-primary',
    epic: 'bg-nova-purple/20 text-nova-purple',
    legendary: 'bg-accent/20 text-accent',
  };

  const rarityLabels = {
    common: 'Обычное',
    rare: 'Редкое',
    epic: 'Эпическое',
    legendary: 'Легендарное',
  };

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter(a => a.unlocked).length,
    common: achievements.filter(a => a.rarity === 'common' && a.unlocked).length,
    rare: achievements.filter(a => a.rarity === 'rare' && a.unlocked).length,
    epic: achievements.filter(a => a.rarity === 'epic' && a.unlocked).length,
    legendary: achievements.filter(a => a.rarity === 'legendary' && a.unlocked).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Достижения</h1>
          <p className="text-muted-foreground mt-1">
            Коллекционируй награды и отслеживай свой прогресс
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30">
          <Trophy className="w-5 h-5 text-accent" />
          <span className="font-bold text-accent">{stats.unlocked}</span>
          <span className="text-muted-foreground">/ {stats.total}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(rarityLabels).map(([key, label]) => (
          <div 
            key={key}
            className={cn(
              "p-4 rounded-xl border text-center",
              rarityStyles[key as keyof typeof rarityStyles]
            )}
          >
            <p className="text-2xl font-bold">{stats[key as keyof typeof stats]}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1">
          {(['all', 'unlocked', 'locked'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
                filter === f 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {f === 'all' ? 'Все' : f === 'unlocked' ? 'Разблокировано' : 'Заблокировано'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className={cn(
              "relative p-5 rounded-xl border transition-all duration-300",
              rarityStyles[achievement.rarity],
              !achievement.unlocked && "opacity-60"
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-14 h-14 flex items-center justify-center text-3xl rounded-xl",
                achievement.unlocked 
                  ? "bg-gradient-cosmic" 
                  : "bg-muted grayscale"
              )}>
                {achievement.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{achievement.title}</h3>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                    rarityBadge[achievement.rarity]
                  )}>
                    {achievement.rarity}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>

                {achievement.unlocked ? (
                  <p className="text-xs text-success mt-2">
                    ✓ Разблокировано {achievement.unlockedAt && new Date(achievement.unlockedAt).toLocaleDateString('ru-RU')}
                  </p>
                ) : achievement.progress !== undefined ? (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Прогресс</span>
                      <span>{achievement.progress}/{achievement.maxProgress}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-gold rounded-full transition-all duration-500"
                        style={{ width: `${((achievement.progress || 0) / (achievement.maxProgress || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">🔒 Заблокировано</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;
