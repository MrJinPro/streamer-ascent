import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: 'default' | 'primary' | 'gold' | 'success';
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}) => {
  const variantStyles = {
    default: 'bg-card border-border',
    primary: 'bg-gradient-cosmic border-primary/30 shadow-glow',
    gold: 'bg-gradient-gold border-accent/30 shadow-gold',
    success: 'bg-gradient-success border-success/30',
  };

  const iconStyles = {
    default: 'bg-secondary text-foreground',
    primary: 'bg-primary-foreground/20 text-primary-foreground',
    gold: 'bg-accent-foreground/20 text-accent-foreground',
    success: 'bg-success-foreground/20 text-success-foreground',
  };

  const textStyles = {
    default: 'text-foreground',
    primary: 'text-primary-foreground',
    gold: 'text-accent-foreground',
    success: 'text-success-foreground',
  };

  return (
    <div className={cn(
      "relative p-5 rounded-xl border transition-all duration-300 hover:scale-[1.02]",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            "text-sm font-medium opacity-80",
            variant === 'default' ? 'text-muted-foreground' : textStyles[variant]
          )}>
            {title}
          </p>
          <p className={cn(
            "text-3xl font-display font-bold mt-1",
            textStyles[variant]
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              "text-xs mt-1 opacity-70",
              variant === 'default' ? 'text-muted-foreground' : textStyles[variant]
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs font-medium",
              trend.positive ? 'text-success' : 'text-destructive'
            )}>
              <span>{trend.positive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="opacity-70">vs last week</span>
            </div>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-lg",
          iconStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export { StatCard };
