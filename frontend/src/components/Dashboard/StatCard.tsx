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
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-success/10',
      text: 'text-success',
      border: 'border-green-200'
    },
    purple: {
      bg: 'bg-primary/5',
      text: 'text-primary',
      border: 'border-purple-200'
    },
    orange: {
      bg: 'bg-warning/10',
      text: 'text-warning',
      border: 'border-orange-200'
    },
    red: {
      bg: 'bg-destructive/10',
      text: 'text-destructive',
      border: 'border-red-200'
    }
  };

  const classes = colorClasses[color];

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow min-h-[120px] sm:min-h-[140px]">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg ${classes.bg} ${classes.border} ml-3 flex-shrink-0`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-current" />
        </div>
      </div>
    </div>
  );
};