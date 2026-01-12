import React, { useState } from 'react';
import { 
  Diamond, Lock, CheckCircle, Play, Star, Gift, Crown, Zap, 
  Trophy, Sparkles, ChevronUp, Flame, Target, Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { currentUser } from '@/data/mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Генерация 50 уровней
const generateLevels = () => {
  const levels = [];
  const milestones = [10, 20, 30, 40, 50];
  
  for (let i = 1; i <= 50; i++) {
    const isMilestone = milestones.includes(i);
    const isCompleted = i <= currentUser.stats.currentLevel;
    const isCurrent = i === currentUser.stats.currentLevel + 1;
    
    levels.push({
      id: i,
      level: i,
      xpRequired: i * 500,
      reward: isMilestone ? {
        type: 'special' as const,
        name: i === 10 ? 'Бронзовый значок' : 
              i === 20 ? 'Серебряный значок' : 
              i === 30 ? 'Золотой значок' : 
              i === 40 ? 'Платиновый значок' : 'Легендарный значок',
        icon: i === 10 ? '🥉' : i === 20 ? '🥈' : i === 30 ? '🥇' : i === 40 ? '💎' : '👑',
      } : {
        type: 'xp' as const,
        amount: i * 25,
      },
      status: isCompleted ? 'completed' : isCurrent ? 'current' : 'locked',
      isMilestone,
    });
  }
  
  return levels.reverse(); // Снизу вверх
};

// Чекпоинты алмазов
const diamondCheckpoints = [
  { 
    diamonds: 50000, 
    reward: { name: 'Львёнок', coins: 4888, icon: '🦁' },
    alternativeReward: null,
    status: 'completed' as const,
    collected: true,
  },
  { 
    diamonds: 100000, 
    reward: { name: 'Космос', coins: 10000, icon: '🌌' },
    alternativeReward: { name: 'Космическая роза', coins: 15000, icon: '🌹' },
    status: 'current' as const,
    collected: false,
  },
  { 
    diamonds: 300000, 
    reward: { name: 'Лев', coins: 29999, icon: '🦁' },
    alternativeReward: { name: 'TikTok Universe', coins: 44999, icon: '🌍' },
    status: 'locked' as const,
    collected: false,
  },
];

const levels = generateLevels();

const Progress: React.FC = () => {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<typeof diamondCheckpoints[0] | null>(null);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  
  const currentDiamonds = currentUser.stats.diamondsTotal;
  const currentLevelData = levels.find(l => l.status === 'current');
  
  // Позиция на пути (%)
  const progressToNextCheckpoint = () => {
    if (currentDiamonds < 50000) return (currentDiamonds / 50000) * 33;
    if (currentDiamonds < 100000) return 33 + ((currentDiamonds - 50000) / 50000) * 33;
    if (currentDiamonds < 300000) return 66 + ((currentDiamonds - 100000) / 200000) * 34;
    return 100;
  };

  const handleCheckpointClick = (checkpoint: typeof diamondCheckpoints[0]) => {
    if (checkpoint.status !== 'locked') {
      setSelectedCheckpoint(checkpoint);
      setShowRewardDialog(true);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Stars */}
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-nova-cyan/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <Sparkles className="w-4 h-4 text-nova-gold animate-pulse" />
            <span className="text-sm font-medium">Сезон 1 • Январь 2026</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-3">
            <span className="text-gradient">Путь к Легенде</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            50 уровней • 3 чекпоинта • Бесконечные возможности
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left side - Stats & Checkpoints */}
          <div className="lg:col-span-4 space-y-6">
            {/* Current Progress Card */}
            <div className="glass-card p-6 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-md opacity-60 animate-pulse-glow" />
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">{currentUser.stats.currentLevel}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Текущий уровень</p>
                    <h3 className="text-2xl font-bold">Уровень {currentUser.stats.currentLevel}</h3>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">До уровня {currentUser.stats.currentLevel + 1}</span>
                      <span className="font-semibold text-gradient">2,450 / 5,000 XP</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-primary rounded-full progress-glow transition-all duration-1000" style={{ width: '49%' }} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-secondary/50 text-center">
                      <Flame className="w-5 h-5 text-accent mx-auto mb-1" />
                      <p className="text-xl font-bold text-gradient-accent">{currentUser.streakDays}</p>
                      <p className="text-xs text-muted-foreground">дней подряд</p>
                    </div>
                    <div className="p-3 rounded-xl bg-secondary/50 text-center">
                      <Zap className="w-5 h-5 text-nova-gold mx-auto mb-1" />
                      <p className="text-xl font-bold text-gradient-gold">+850</p>
                      <p className="text-xs text-muted-foreground">XP за неделю</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Diamond Checkpoints */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <Diamond className="w-5 h-5 text-nova-cyan" />
                <h3 className="text-lg font-bold">Чекпоинты алмазов</h3>
              </div>
              
              {/* Progress bar */}
              <div className="relative mb-6">
                <div className="h-2 bg-muted rounded-full">
                  <div 
                    className="h-full bg-gradient-cyan rounded-full transition-all duration-1000"
                    style={{ width: `${progressToNextCheckpoint()}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-muted-foreground">0</span>
                  <span className="text-xs font-semibold text-gradient-cyan">{currentDiamonds.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">300k</span>
                </div>
              </div>

              {/* Checkpoints list */}
              <div className="space-y-3">
                {diamondCheckpoints.map((checkpoint, index) => (
                  <button
                    key={index}
                    onClick={() => handleCheckpointClick(checkpoint)}
                    disabled={checkpoint.status === 'locked'}
                    className={cn(
                      "w-full p-4 rounded-xl border transition-all text-left",
                      checkpoint.status === 'completed' && "bg-success/10 border-success/30",
                      checkpoint.status === 'current' && "bg-primary/10 border-primary/30 animate-pulse-glow",
                      checkpoint.status === 'locked' && "bg-muted/50 border-border opacity-60 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                        checkpoint.status === 'completed' && "bg-success/20",
                        checkpoint.status === 'current' && "bg-primary/20",
                        checkpoint.status === 'locked' && "bg-muted"
                      )}>
                        {checkpoint.status === 'locked' ? <Lock className="w-5 h-5" /> : checkpoint.reward.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{(checkpoint.diamonds / 1000).toFixed(0)}k 💎</span>
                          {checkpoint.status === 'completed' && checkpoint.collected && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success">Получено</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{checkpoint.reward.name}</p>
                      </div>
                      {checkpoint.status === 'current' && (
                        <ChevronUp className="w-5 h-5 text-primary" />
                      )}
                      {checkpoint.status === 'completed' && !checkpoint.collected && (
                        <Gift className="w-5 h-5 text-success animate-bounce" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-nova-gold" />
                Статистика сезона
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                  <span className="text-sm text-muted-foreground">Заданий выполнено</span>
                  <span className="font-bold">47 / 90</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                  <span className="text-sm text-muted-foreground">Часов стримов</span>
                  <span className="font-bold text-gradient-accent">128ч</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                  <span className="text-sm text-muted-foreground">Место в рейтинге</span>
                  <span className="font-bold text-gradient-gold">#3</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Level Path */}
          <div className="lg:col-span-8">
            <div className="glass-card p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold">Путь прогресса</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10">
                  <span className="text-sm font-medium">{currentUser.stats.currentLevel} / 50 уровней</span>
                </div>
              </div>

              {/* Vertical Path */}
              <div className="relative max-h-[600px] overflow-y-auto custom-scrollbar pr-4">
                {/* Center line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-accent to-muted transform -translate-x-1/2" />
                
                <div className="space-y-4 py-4">
                  {levels.map((level, index) => {
                    const isLeft = index % 2 === 0;
                    
                    return (
                      <div
                        key={level.id}
                        className={cn(
                          "relative flex items-center gap-4",
                          isLeft ? "flex-row" : "flex-row-reverse"
                        )}
                      >
                        {/* Content card */}
                        <div className={cn(
                          "flex-1 max-w-[45%]",
                          isLeft ? "text-right" : "text-left"
                        )}>
                          <div className={cn(
                            "inline-block p-3 md:p-4 rounded-xl transition-all",
                            level.status === 'completed' && "bg-success/10 border border-success/20",
                            level.status === 'current' && "bg-primary/20 border border-primary/40 animate-pulse-glow",
                            level.status === 'locked' && "bg-muted/30 border border-border opacity-60",
                            level.isMilestone && level.status !== 'locked' && "ring-2 ring-nova-gold/50"
                          )}>
                            <div className={cn(
                              "flex items-center gap-2",
                              isLeft ? "justify-end" : "justify-start"
                            )}>
                              {level.isMilestone && <span className="text-lg">{level.reward.type === 'special' ? level.reward.icon : '⭐'}</span>}
                              <span className={cn(
                                "font-bold",
                                level.status === 'completed' && "text-success",
                                level.status === 'current' && "text-gradient",
                                level.isMilestone && "text-lg"
                              )}>
                                Уровень {level.level}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {level.reward.type === 'special' 
                                ? level.reward.name 
                                : `+${level.reward.amount} XP`}
                            </p>
                          </div>
                        </div>

                        {/* Center node */}
                        <div className="relative z-10 flex-shrink-0">
                          <div className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all",
                            level.status === 'completed' && "bg-success text-white",
                            level.status === 'current' && "bg-gradient-primary text-white ring-4 ring-primary/30 animate-pulse-glow",
                            level.status === 'locked' && "bg-muted text-muted-foreground",
                            level.isMilestone && "w-14 h-14 md:w-16 md:h-16"
                          )}>
                            {level.status === 'completed' && <CheckCircle className="w-5 h-5" />}
                            {level.status === 'current' && <Play className="w-5 h-5" />}
                            {level.status === 'locked' && <Lock className="w-4 h-4" />}
                            {level.isMilestone && level.status !== 'locked' && (
                              <span className="text-xl">{level.reward.type === 'special' ? level.reward.icon : ''}</span>
                            )}
                          </div>
                          {level.isMilestone && (
                            <div className="absolute -inset-2 rounded-full border-2 border-dashed border-nova-gold/50 animate-spin" style={{ animationDuration: '10s' }} />
                          )}
                        </div>

                        {/* Empty space for alignment */}
                        <div className="flex-1 max-w-[45%]" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom gradient fade */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Reward Dialog */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              {selectedCheckpoint?.status === 'completed' && selectedCheckpoint?.collected 
                ? '🎉 Награда получена!' 
                : '🎁 Выберите награду'}
            </DialogTitle>
            <DialogDescription className="text-center">
              Чекпоинт {selectedCheckpoint?.diamonds.toLocaleString()} алмазов
            </DialogDescription>
          </DialogHeader>
          
          {selectedCheckpoint && !selectedCheckpoint.collected && (
            <div className="space-y-4 mt-4">
              <button className="w-full p-4 rounded-xl border-2 border-primary/50 bg-primary/10 hover:bg-primary/20 transition-all group">
                <div className="text-4xl mb-2">{selectedCheckpoint.reward.icon}</div>
                <h4 className="font-bold text-lg">{selectedCheckpoint.reward.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedCheckpoint.reward.coins.toLocaleString()} монет</p>
              </button>
              
              {selectedCheckpoint.alternativeReward && (
                <>
                  <div className="text-center text-sm text-muted-foreground">или</div>
                  <button className="w-full p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-all">
                    <div className="text-4xl mb-2">{selectedCheckpoint.alternativeReward.icon}</div>
                    <h4 className="font-bold text-lg">{selectedCheckpoint.alternativeReward.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedCheckpoint.alternativeReward.coins.toLocaleString()} монет</p>
                    <p className="text-xs text-accent mt-1">Доступно при пропуске предыдущих наград</p>
                  </button>
                </>
              )}
              
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowRewardDialog(false)}>
                  Пропустить
                </Button>
                <Button className="flex-1 bg-gradient-primary">
                  Получить
                </Button>
              </div>
            </div>
          )}
          
          {selectedCheckpoint?.collected && (
            <div className="text-center py-6">
              <div className="text-6xl mb-4">{selectedCheckpoint.reward.icon}</div>
              <h4 className="font-bold text-xl">{selectedCheckpoint.reward.name}</h4>
              <p className="text-muted-foreground">Вы уже получили эту награду</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Progress;
