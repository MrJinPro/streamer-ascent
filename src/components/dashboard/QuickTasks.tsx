import React from 'react';
import { CheckCircle2, Circle, Clock, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const QuickTasks: React.FC = () => {
  const { tasks } = useAppData();
  const activeTasks = tasks.filter(t => t.status !== 'completed').slice(0, 4);

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
      <div className="relative space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center glow-pink">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Активные задачи</h3>
              <p className="text-sm text-muted-foreground">{activeTasks.length} задач ожидают</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1">Все задачи<ArrowRight className="w-4 h-4" /></Button>
        </div>
        <div className="space-y-3">
          {activeTasks.map((task) => (
            <div key={task.id} className="group relative p-4 rounded-xl border border-border/50 bg-secondary/30 hover:bg-secondary/60 transition-all duration-200 cursor-pointer hover:border-primary/30">
              <div className="flex items-start gap-4">
                <button className="mt-0.5 flex-shrink-0">
                  {task.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />}
                </button>
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="font-medium leading-tight group-hover:text-primary transition-colors">{task.title}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-nova-gold" /><span className="font-medium">+{task.xpReward} XP</span></div>
                    {task.dueDate && <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /><span>{new Date(task.dueDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span></div>}
                  </div>
                </div>
              </div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-r-full bg-gradient-primary transition-all duration-200 group-hover:h-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickTasks;
