import React from 'react';
import { TrendingUp, ChevronRight, Lock, CheckCircle2, Play } from 'lucide-react';
import { growthPaths } from '@/data/mockData';
import { cn } from '@/lib/utils';

const GrowthPathCard: React.FC = () => {
  const currentPath = growthPaths.find(p => p.status === 'in_progress') || growthPaths[0];

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-nova-cyan/10 rounded-full blur-3xl" />
      <div className="relative space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-cyan flex items-center justify-center"><TrendingUp className="w-5 h-5 text-white" /></div>
            <h3 className="text-lg font-bold">Путь роста</h3>
          </div>
          <button className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">Все пути<ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-2xl glow-sm">{currentPath.icon}</div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gradient">{currentPath.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{currentPath.description}</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Прогресс</span><span className="font-semibold text-primary">{currentPath.progress}%</span></div>
                <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-gradient-primary rounded-full progress-glow" style={{ width: `${currentPath.progress}%` }} /></div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {currentPath.steps.slice(0, 4).map((step, index) => (
            <div key={index} className={cn("flex items-center gap-3 p-3 rounded-lg transition-all duration-200", step.completed ? "bg-success/5 text-success" : step.current ? "bg-primary/5 text-primary" : "text-muted-foreground")}>
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0", step.completed ? "bg-success text-white" : step.current ? "bg-gradient-primary text-white animate-pulse-glow" : "bg-muted")}>
                {step.completed ? <CheckCircle2 className="w-4 h-4" /> : step.current ? <Play className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              </div>
              <span className={cn("text-sm font-medium flex-1", step.completed && "line-through opacity-70")}>{step.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GrowthPathCard;
