import React, { useState } from 'react';
import { tasks } from '@/data/mockData';
import { CheckCircle2, Circle, Clock, Zap, Calendar, Target, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const Tasks: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly' | 'challenge'>('all');

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const typeStyles = {
    daily: { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary', icon: Calendar },
    weekly: { bg: 'bg-accent/10', border: 'border-accent/30', text: 'text-accent', icon: Target },
    challenge: { bg: 'bg-nova-purple/10', border: 'border-nova-purple/30', text: 'text-nova-purple', icon: Zap },
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    daily: tasks.filter(t => t.type === 'daily' && !t.completed).length,
    weekly: tasks.filter(t => t.type === 'weekly' && !t.completed).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Задания</h1>
          <p className="text-muted-foreground mt-1">
            Выполняй задания и получай опыт
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-success">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">выполнено</p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-right">
            <p className="text-2xl font-bold">{stats.total - stats.completed}</p>
            <p className="text-xs text-muted-foreground">осталось</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ежедневные</p>
              <p className="text-2xl font-bold text-primary">{stats.daily}</p>
            </div>
            <Calendar className="w-8 h-8 text-primary/50" />
          </div>
        </div>
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Недельные</p>
              <p className="text-2xl font-bold text-accent">{stats.weekly}</p>
            </div>
            <Target className="w-8 h-8 text-accent/50" />
          </div>
        </div>
        <div className="p-4 rounded-xl bg-success/10 border border-success/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">XP за выполнение</p>
              <p className="text-2xl font-bold text-success">
                +{tasks.filter(t => !t.completed).reduce((acc, t) => acc + t.xpReward, 0)}
              </p>
            </div>
            <Zap className="w-8 h-8 text-success/50" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1">
          {(['all', 'daily', 'weekly', 'challenge'] as const).map((f) => (
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
              {f === 'all' ? 'Все' : f === 'daily' ? 'Ежедневные' : f === 'weekly' ? 'Недельные' : 'Челленджи'}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const progress = (task.progress / task.maxProgress) * 100;
          const style = typeStyles[task.type];
          const TypeIcon = style.icon;

          return (
            <div 
              key={task.id}
              className={cn(
                "p-5 rounded-xl border transition-all duration-200 hover:scale-[1.01]",
                task.completed ? "bg-success/5 border-success/30" : "glass border-border hover:border-primary/30"
              )}
            >
              <div className="flex items-start gap-4">
                <button className={cn(
                  "mt-0.5 p-1.5 rounded-full transition-all",
                  task.completed 
                    ? "text-success bg-success/20" 
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                )}>
                  {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={cn(
                      "font-medium",
                      task.completed && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </h3>
                    <span className={cn(
                      "flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full",
                      style.bg, style.border, style.text
                    )}>
                      <TypeIcon className="w-3 h-3" />
                      {task.type === 'daily' ? 'Ежедневное' : task.type === 'weekly' ? 'Недельное' : 'Челлендж'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{task.description}</p>

                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">
                          {task.progress} / {task.maxProgress}
                        </span>
                        <span className="text-muted-foreground">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            task.completed ? "bg-success" :
                            task.type === 'daily' ? 'bg-gradient-cosmic' :
                            task.type === 'weekly' ? 'bg-gradient-gold' :
                            'bg-nova-purple'
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {task.deadline && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(task.deadline).toLocaleDateString('ru-RU', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-accent font-medium">
                      <Zap className="w-4 h-4" />
                      <span>+{task.xpReward} XP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tasks;
