import React from 'react';
import { growthPaths } from '@/data/mockData';
import { Lock, CheckCircle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

const GrowthPathCard: React.FC = () => {
  const currentPath = growthPaths.find(p => p.progress > 0 && p.progress < 100) || growthPaths[1];

  return (
    <div className="p-6 rounded-xl glass border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg">Текущий путь</h3>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary">
          {currentPath.progress}% завершено
        </span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 flex items-center justify-center text-2xl rounded-xl bg-gradient-cosmic">
          {currentPath.icon}
        </div>
        <div>
          <h4 className="font-medium">{currentPath.title}</h4>
          <p className="text-sm text-muted-foreground">{currentPath.description}</p>
        </div>
      </div>

      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-border" />
        
        <div className="space-y-4">
          {currentPath.steps.map((step, index) => (
            <div 
              key={step.id}
              className={cn(
                "relative flex items-start gap-4 p-3 rounded-lg transition-all",
                step.status === 'in_progress' && "bg-primary/10 border border-primary/30",
                step.status === 'completed' && "opacity-60",
                step.status === 'locked' && "opacity-40"
              )}
            >
              <div className={cn(
                "relative z-10 w-9 h-9 flex items-center justify-center rounded-full shrink-0",
                step.status === 'completed' && "bg-success text-success-foreground",
                step.status === 'in_progress' && "bg-primary text-primary-foreground animate-pulse-glow",
                step.status === 'locked' && "bg-muted text-muted-foreground"
              )}>
                {step.status === 'completed' && <CheckCircle className="w-5 h-5" />}
                {step.status === 'in_progress' && <Play className="w-5 h-5" />}
                {step.status === 'locked' && <Lock className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={cn(
                    "font-medium text-sm",
                    step.status === 'locked' && "text-muted-foreground"
                  )}>
                    {step.title}
                  </p>
                  <span className="text-xs text-accent font-medium">+{step.xpReward} XP</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="w-full mt-4 py-2.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
        Все пути развития →
      </button>
    </div>
  );
};

export default GrowthPathCard;
