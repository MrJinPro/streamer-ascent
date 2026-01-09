import React from 'react';
import { growthPaths } from '@/data/mockData';
import { Lock, CheckCircle, Play, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProgressRing } from '@/components/ui/progress-ring';

const Progress: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">Пути развития</h1>
        <p className="text-muted-foreground mt-1">
          Следуй структурированным путям для системного роста
        </p>
      </div>

      <div className="grid gap-6">
        {growthPaths.map((path, pathIndex) => (
          <div 
            key={path.id}
            className="p-6 rounded-xl glass border border-border"
          >
            {/* Path Header */}
            <div className="flex items-center gap-4 mb-6">
              <ProgressRing 
                progress={path.progress} 
                size={80} 
                strokeWidth={6}
                variant={path.progress === 100 ? 'success' : path.progress > 0 ? 'default' : 'gold'}
              >
                <span className="text-2xl">{path.icon}</span>
              </ProgressRing>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-semibold">{path.title}</h2>
                  <span className={cn(
                    "px-3 py-1 text-sm font-medium rounded-full",
                    path.progress === 100 
                      ? "bg-success/20 text-success" 
                      : path.progress > 0 
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {path.progress}% завершено
                  </span>
                </div>
                <p className="text-muted-foreground mt-1">{path.description}</p>
              </div>
            </div>

            {/* Steps Timeline */}
            <div className="relative">
              {/* Progress bar background */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-muted rounded-full" />
              {/* Progress bar fill */}
              <div 
                className="absolute top-5 left-0 h-1 bg-gradient-cosmic rounded-full transition-all duration-700"
                style={{ width: `${path.progress}%` }}
              />

              <div className="relative flex justify-between">
                {path.steps.map((step, index) => (
                  <div 
                    key={step.id}
                    className="flex flex-col items-center"
                    style={{ width: `${100 / path.steps.length}%` }}
                  >
                    <div className={cn(
                      "relative z-10 w-10 h-10 flex items-center justify-center rounded-full mb-3 transition-all",
                      step.status === 'completed' && "bg-success text-success-foreground",
                      step.status === 'in_progress' && "bg-primary text-primary-foreground ring-4 ring-primary/30 animate-pulse-glow",
                      step.status === 'locked' && "bg-muted text-muted-foreground"
                    )}>
                      {step.status === 'completed' && <CheckCircle className="w-5 h-5" />}
                      {step.status === 'in_progress' && <Play className="w-5 h-5" />}
                      {step.status === 'locked' && <Lock className="w-4 h-4" />}
                    </div>

                    <div className={cn(
                      "text-center px-2 transition-opacity",
                      step.status === 'locked' && "opacity-50"
                    )}>
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs text-accent mt-1">+{step.xpReward} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current step details */}
            {path.steps.find(s => s.status === 'in_progress') && (
              <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Текущий этап</p>
                    <p className="font-medium">
                      {path.steps.find(s => s.status === 'in_progress')?.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {path.steps.find(s => s.status === 'in_progress')?.description}
                    </p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors">
                    Продолжить
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Progress;
