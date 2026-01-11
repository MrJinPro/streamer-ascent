import React from 'react';
import { Diamond, Gift, Lock, Check, ChevronRight, Sparkles } from 'lucide-react';
import { currentUser, checkpoints, formatDiamonds } from '@/data/mockData';
import { cn } from '@/lib/utils';

const CheckpointProgress: React.FC = () => {
  const monthlyDiamonds = currentUser.stats.monthlyDiamonds;
  const maxCheckpoint = 300000;
  const progressPercent = Math.min((monthlyDiamonds / maxCheckpoint) * 100, 100);

  return (
    <div className="glass-card p-4 md:p-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 -top-48 -right-48 bg-gradient-to-br from-nova-gold/10 to-transparent rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute w-64 h-64 -bottom-32 -left-32 bg-gradient-to-tr from-nova-cyan/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-gold flex items-center justify-center relative flex-shrink-0">
              <Diamond className="w-5 h-5 md:w-6 md:h-6 text-white" />
              <Sparkles className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 text-nova-gold animate-pulse" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold">Путь к наградам</h3>
              <p className="text-xs md:text-sm text-muted-foreground">Месячный прогресс</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xl md:text-2xl font-bold text-gradient-gold">{formatDiamonds(monthlyDiamonds)}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">алмазов в этом месяце</p>
          </div>
        </div>

        {/* Progress Road - Horizontal on desktop, vertical cards on mobile */}
        <div className="hidden md:block relative pt-4 pb-2">
          {/* Road background */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-3 bg-muted/50 rounded-full overflow-hidden">
            {/* Road markings */}
            <div className="absolute inset-0 flex items-center justify-around">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-4 h-0.5 bg-muted-foreground/20 rounded-full" />
              ))}
            </div>
            {/* Progress fill */}
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-nova-cyan via-nova-gold to-nova-pink rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 animate-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
            </div>
          </div>

          {/* Checkpoints */}
          <div className="relative flex justify-between items-center">
            {checkpoints.map((checkpoint, index) => {
              const position = (checkpoint.diamondsRequired / maxCheckpoint) * 100;
              const isReached = monthlyDiamonds >= checkpoint.diamondsRequired;
              const isClaimed = checkpoint.claimed === true;
              const isSkipped = checkpoint.claimed === false;
              const isNext = !isReached && (index === 0 || monthlyDiamonds >= checkpoints[index - 1].diamondsRequired);

              return (
                <div 
                  key={checkpoint.id} 
                  className="flex flex-col items-center gap-2"
                  style={{ position: 'absolute', left: `${position}%`, transform: 'translateX(-50%)' }}
                >
                  {/* Checkpoint marker */}
                  <div className={cn(
                    "relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer",
                    isReached 
                      ? isClaimed 
                        ? "bg-gradient-to-br from-success to-success/80 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                        : isSkipped
                          ? "bg-gradient-to-br from-muted to-muted/80 text-muted-foreground border-2 border-dashed border-muted-foreground/50"
                          : "bg-gradient-gold text-white shadow-[0_0_20px_rgba(255,215,0,0.5)] animate-pulse-glow"
                      : isNext
                        ? "bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/50 text-primary"
                        : "bg-muted/50 text-muted-foreground border border-border"
                  )}>
                    {isReached ? (
                      isClaimed ? <Check className="w-6 h-6" /> : 
                      isSkipped ? <ChevronRight className="w-6 h-6" /> :
                      <Gift className="w-6 h-6 animate-bounce" />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                    
                    {/* Glow ring for available reward */}
                    {isReached && !isClaimed && !isSkipped && (
                      <div className="absolute inset-0 rounded-2xl border-2 border-nova-gold animate-ping opacity-50" />
                    )}
                  </div>

                  {/* Checkpoint info */}
                  <div className="text-center space-y-0.5">
                    <p className={cn(
                      "text-xs font-bold",
                      isReached ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {formatDiamonds(checkpoint.diamondsRequired)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{checkpoint.rewardIcon}</p>
                  </div>
                </div>
              );
            })}

            {/* Current position indicator */}
            <div 
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${progressPercent}%`, transform: 'translateX(-50%)' }}
            >
              <div className="relative -mt-2">
                <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.6)]">
                  <Diamond className="w-3 h-3 text-white" />
                </div>
                <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Vertical checkpoint cards */}
        <div className="md:hidden space-y-3">
          {/* Overall progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Общий прогресс</span>
              <span className="text-primary font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-nova-cyan via-nova-gold to-nova-pink rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Checkpoint cards */}
          {checkpoints.map((checkpoint, index) => {
            const isReached = monthlyDiamonds >= checkpoint.diamondsRequired;
            const isClaimed = checkpoint.claimed === true;
            const isSkipped = checkpoint.claimed === false;
            const isNext = !isReached && (index === 0 || monthlyDiamonds >= checkpoints[index - 1].diamondsRequired);
            const checkpointProgress = Math.min((monthlyDiamonds / checkpoint.diamondsRequired) * 100, 100);

            return (
              <div
                key={checkpoint.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all",
                  isReached 
                    ? isClaimed 
                      ? "bg-success/10 border-success/30"
                      : isSkipped
                        ? "bg-muted/30 border-muted"
                        : "bg-nova-gold/10 border-nova-gold/30"
                    : isNext
                      ? "bg-primary/5 border-primary/30"
                      : "bg-muted/20 border-border/50"
                )}
              >
                {/* Checkpoint icon */}
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                  isReached 
                    ? isClaimed 
                      ? "bg-success text-white"
                      : isSkipped
                        ? "bg-muted text-muted-foreground"
                        : "bg-gradient-gold text-white animate-pulse-glow"
                    : isNext
                      ? "bg-primary/20 text-primary"
                      : "bg-muted/50 text-muted-foreground"
                )}>
                  {isReached ? (
                    isClaimed ? <Check className="w-5 h-5" /> : 
                    isSkipped ? <ChevronRight className="w-5 h-5" /> :
                    <Gift className="w-5 h-5" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>

                {/* Checkpoint info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{formatDiamonds(checkpoint.diamondsRequired)} 💎</p>
                    <span className="text-xs text-muted-foreground">{checkpoint.rewardIcon} {checkpoint.rewardName}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        isReached ? "bg-success" : "bg-gradient-primary"
                      )}
                      style={{ width: `${checkpointProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Level progress */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold text-sm md:text-base">
              {currentUser.stats.currentLevel}
            </div>
            <div>
              <p className="text-sm font-medium">Уровень {currentUser.stats.currentLevel} из {currentUser.stats.maxLevel}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">До конца месяца: 20 дней</p>
            </div>
          </div>
          <div className="w-full sm:w-32">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Прогресс уровней</span>
              <span className="text-primary font-medium">{Math.round((currentUser.stats.currentLevel / currentUser.stats.maxLevel) * 100)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                style={{ width: `${(currentUser.stats.currentLevel / currentUser.stats.maxLevel) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckpointProgress;
