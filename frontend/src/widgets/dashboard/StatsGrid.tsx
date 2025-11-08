/**
 * Widget: StatsGrid
 * Grid reutilizable de tarjetas de estadísticas
 * 
 * @module widgets/dashboard/StatsGrid
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { StatCard } from '@/features/dashboard/components/StatCard';
import { cn } from '@/shared/lib/utils';

/**
 * Datos para una tarjeta de estadística
 */
export interface StatCardData {
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

/**
 * Props del componente StatsGrid
 */
export interface StatsGridProps {
  /**
   * Array de datos para las tarjetas de estadísticas
   */
  stats: StatCardData[];
  
  /**
   * Número de columnas en el grid
   * @default 4
   */
  columns?: 2 | 3 | 4;
  
  /**
   * Clase CSS adicional para el contenedor
   */
  className?: string;
  
  /**
   * Gap entre las tarjetas
   * @default 'gap-6'
   */
  gap?: 'gap-4' | 'gap-6' | 'gap-8';
}

/**
 * Widget de grid de estadísticas
 * 
 * Composicion reutilizable de múltiples StatCard en un grid responsive
 * 
 * @example
 * ```tsx
 * const stats = [
 *   { title: 'Total Alumnos', value: 156, icon: Users, color: 'blue' },
 *   { title: 'Cursos Activos', value: 12, icon: BookOpen, color: 'green' },
 * ];
 * 
 * <StatsGrid stats={stats} columns={4} />
 * ```
 */
export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  columns = 4,
  className,
  gap = 'gap-6'
}) => {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div
      className={cn(
        'grid',
        gridClasses[columns],
        gap,
        className
      )}
      role="region"
      aria-label="Estadísticas"
    >
      {stats.map((stat, index) => (
        <StatCard
          key={`stat-${index}-${stat.title}`}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          trend={stat.trend}
        />
      ))}
    </div>
  );
};

