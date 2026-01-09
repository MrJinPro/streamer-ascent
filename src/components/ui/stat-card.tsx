import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: 'default' | 'primary' | 'gold' | 'success' | 'accent';
  className?: string;
}

const variantStyles = {
  default: { icon: 'bg-secondary text-foreground', iconGlow: '' },
  primary: { icon: 'bg-gradient-primary text-white', iconGlow: 'glow-sm' },
  gold: { icon: 'bg-gradient-gold text-white', iconGlow: '' },
  success: { icon: 'bg-gradient-success text-white', iconGlow: '' },
  accent: { icon: 'bg-gradient-accent text-white', iconGlow: 'glow-pink' },
};

export const StatCard: React.FC<StatCardProps> = ({
  title, value, subtitle, icon: Icon, trend, variant = 'default', className,
}) => {
  const styles = variantStyles[variant];
  return (
    <div className={cn("glass-card p-5 group hover-lift cursor-default", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div>
            <p className={cn("text-3xl font-bold tracking-tight",
              variant === 'primary' && "text-gradient",
              variant === 'gold' && "text-gradient-gold",
              variant === 'success' && "text-gradient-cyan",
              variant === 'accent' && "text-gradient-accent"
            )}>{value}</p>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {trend && (
            <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold",
              trend.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}>
              {trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend.positive ? '+' : ''}{trend.value}%
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110", styles.icon, styles.iconGlow)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
