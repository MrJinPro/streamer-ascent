import React from 'react';
import { CheckCircle2, Circle, Timer, Zap, Flame } from 'lucide-react';
import { dailyTasks } from '@/data/mockData';
import { cn } from '@/lib/utils';

const DailyTasksCard: React.FC = () => {
  const completedCount = dailyTasks.filter(t => t.completed).length;
  const totalTasks = dailyTasks.length;

  return (
    <div className="glass-card p-4 md:p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative space-y-4 md:space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-accent flex items-center justify-center glow-pink">
              <Timer className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold">Ежедневные задания</h3>
              <p className="text-xs md:text-sm text-muted-foreground">{completedCount} из {totalTasks} выполнено</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <Flame className="w-3 h-3 md:w-4 md:h-4 text-accent" />
            <span className="text-muted-foreground">Обновление через 14ч</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-accent rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / totalTasks) * 100}%` }}
            />
          </div>
        </div>

        {/* Tasks list */}
        <div className="space-y-2 md:space-y-3">
          {dailyTasks.map((task) => {
            const progressPercent = (task.progress / task.maxProgress) * 100;
            
            return (
              <div
                key={task.id}
                className={cn(
                  "group relative p-3 md:p-4 rounded-xl border transition-all duration-200 cursor-pointer",
                  task.completed 
                    ? "bg-success/10 border-success/30" 
                    : "bg-secondary/30 border-border/50 hover:bg-secondary/50 hover:border-primary/30"
                )}
              >
                <div className="flex items-start gap-3 md:gap-4">
                  {/* Icon */}
                  <div className={cn(
                    "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xl md:text-2xl flex-shrink-0",
                    task.completed ? "bg-success/20" : "bg-muted/50"
                  )}>
                    {task.icon}
                  </div>

                  {/* Task info */}
                  <div className="flex-1 min-w-0 space-y-1.5 md:space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <p className={cn(
                        "font-semibold text-sm md:text-base",
                        task.completed && "text-success"
                      )}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs md:text-sm">
                        <Zap className="w-3 h-3 md:w-4 md:h-4 text-nova-gold" />
                        <span className="font-medium text-nova-gold">+{task.xpReward} XP</span>
                      </div>
                    </div>
                    
                    <p className="text-[10px] md:text-xs text-muted-foreground">{task.description}</p>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] md:text-xs">
                        <span className="text-muted-foreground">
                          {task.progress} / {task.maxProgress} {task.type === 'activity' ? 'взаим.' : 'мин'}
                        </span>
                        <span className={cn(
                          "font-medium",
                          task.completed ? "text-success" : "text-primary"
                        )}>
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                      <div className="h-1 md:h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            task.completed ? "bg-success" : "bg-gradient-primary"
                          )}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0">
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-success" />
                    ) : (
                      <Circle className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                </div>

                {/* Hover indicator */}
                <div className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-r-full transition-all duration-200 group-hover:h-10",
                  task.completed ? "bg-success" : "bg-gradient-primary"
                )} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DailyTasksCard;
