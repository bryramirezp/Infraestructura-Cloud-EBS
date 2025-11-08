import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'blue',
  trend
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-primary/10',
      text: 'text-primary',
      border: 'border-primary/20'
    },
    green: {
      bg: 'bg-success/10',
      text: 'text-success',
      border: 'border-success/20'
    },
    purple: {
      bg: 'bg-primary/5',
      text: 'text-primary',
      border: 'border-primary/20'
    },
    orange: {
      bg: 'bg-warning/10',
      text: 'text-warning',
      border: 'border-warning/20'
    },
    red: {
      bg: 'bg-destructive/10',
      text: 'text-destructive',
      border: 'border-destructive/20'
    }
  };

  const classes = colorClasses[color];

  return (
    <div className="bg-card p-4 sm:p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow min-h-[120px] sm:min-h-[140px]">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs font-medium ${
                trend.isPositive ? 'text-success' : 'text-destructive'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg ${classes.bg} border ${classes.border} ml-3 flex-shrink-0`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-current" />
        </div>
      </div>
    </div>
  );
};