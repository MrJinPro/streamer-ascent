import React from 'react';
import { tasks } from '@/data/mockData';
import { CheckCircle2, Circle, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const QuickTasks: React.FC = () => {
  const activeTasks = tasks.filter(t => !t.completed).slice(0, 4);

  return (
    <div className="p-6 rounded-xl glass border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg">Активные задания</h3>
        <span className="text-sm text-muted-foreground">{activeTasks.length} активных</span>
      </div>

      <div className="space-y-3">
        {activeTasks.map((task) => {
          const progress = (task.progress / task.maxProgress) * 100;
          
          return (
            <div 
              key={task.id}
              className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 transition-all duration-200 group"
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "mt-0.5 p-1 rounded-full transition-colors",
                  task.completed ? "text-success" : "text-muted-foreground group-hover:text-primary"
                )}>
                  {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{task.title}</p>
                    <div className="flex items-center gap-1 text-accent">
                      <Zap className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">+{task.xpReward} XP</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                  
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        {task.progress} / {task.maxProgress}
                      </span>
                      {task.deadline && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(task.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          task.type === 'daily' ? 'bg-gradient-cosmic' :
                          task.type === 'weekly' ? 'bg-gradient-gold' :
                          'bg-gradient-success'
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="w-full mt-4 py-2.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
        Смотреть все задания →
      </button>
    </div>
  );
};

export default QuickTasks;
