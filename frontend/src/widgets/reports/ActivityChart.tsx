import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { cn } from '@/shared/lib/utils';

export interface ActivityDataPoint {
  /**
   * Día de la semana (Lun, Mar, etc.)
   */
  day: string;
  
  /**
   * Número de inscripciones
   */
  enrollments: number;
  
  /**
   * Número de finalizaciones
   */
  completions: number;
}

export interface ActivityChartProps {
  /**
   * Título del gráfico
   */
  title: string;
  
  /**
   * Descripción opcional
   */
  description?: string;
  
  /**
   * Datos de actividad
   */
  data: ActivityDataPoint[];
  
  /**
   * Valor máximo para normalizar las barras (opcional)
   */
  maxValue?: number;
  
  /**
   * Acciones del header (botones, etc.)
   */
  actions?: React.ReactNode;
  
  /**
   * Clase CSS adicional
   */
  className?: string;
}

/**
 * Widget de gráfico de actividad
 * 
 * Muestra gráfico de barras verticales manual para actividad diaria
 * 
 * @example
 * ```tsx
 * <ActivityChart
 *   title="Actividad Reciente"
 *   description="Últimos 7 días"
 *   data={[
 *     { day: 'Lun', enrollments: 12, completions: 8 },
 *     { day: 'Mar', enrollments: 15, completions: 6 }
 *   ]}
 * />
 * ```
 */
export const ActivityChart: React.FC<ActivityChartProps> = ({
  title,
  description,
  data,
  maxValue,
  actions,
  className
}) => {
  // Calcular valor máximo si no se proporciona
  const calculatedMax = maxValue || Math.max(
    ...data.flatMap(d => [d.enrollments, d.completions]),
    25 // Valor por defecto
  );

  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-4">
          {data.map((dayData, index) => {
            const enrollmentHeight = Math.min((dayData.enrollments / calculatedMax) * 100, 100);
            const completionHeight = Math.min((dayData.completions / calculatedMax) * 100, 100);

            return (
              <div key={index} className="text-center">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  {dayData.day}
                </div>
                <div className="space-y-2">
                  {/* Inscripciones */}
                  <div className="flex flex-col items-center">
                    <div className="text-xs text-primary mb-1">Inscripciones</div>
                    <div className="w-8 bg-primary/10 rounded-full h-12 flex items-end justify-center">
                      <div
                        className="bg-primary rounded-full w-6 transition-all"
                        style={{ height: `${enrollmentHeight}%` }}
                      />
                    </div>
                    <div className="text-xs font-medium text-foreground mt-1">
                      {dayData.enrollments}
                    </div>
                  </div>
                  
                  {/* Finalizaciones */}
                  <div className="flex flex-col items-center">
                    <div className="text-xs text-success mb-1">Finalizaciones</div>
                    <div className="w-8 bg-success/10 rounded-full h-12 flex items-end justify-center">
                      <div
                        className="bg-success rounded-full w-6 transition-all"
                        style={{ height: `${completionHeight}%` }}
                      />
                    </div>
                    <div className="text-xs font-medium text-foreground mt-1">
                      {dayData.completions}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

