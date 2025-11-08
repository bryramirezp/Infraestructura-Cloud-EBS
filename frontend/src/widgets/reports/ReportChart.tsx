import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { cn } from '@/shared/lib/utils';

export interface ChartDataPoint {
  /**
   * Etiqueta del punto de datos (eje X)
   */
  label: string;
  
  /**
   * Valor o valores del punto de datos
   */
  value: number | Record<string, number>;
  
  /**
   * Color opcional para este punto
   */
  color?: string;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'area';

export interface ReportChartProps {
  /**
   * Título del gráfico
   */
  title: string;
  
  /**
   * Descripción opcional
   */
  description?: string;
  
  /**
   * Tipo de gráfico
   */
  type: ChartType;
  
  /**
   * Datos del gráfico
   */
  data: ChartDataPoint[];
  
  /**
   * Nombres de las series (para gráficos con múltiples series)
   */
  seriesNames?: string[];
  
  /**
   * Colores de las series
   */
  colors?: string[];
  
  /**
   * Si se debe mostrar la leyenda
   * @default true
   */
  showLegend?: boolean;
  
  /**
   * Si se debe mostrar la cuadrícula
   * @default true
   */
  showGrid?: boolean;
  
  /**
   * Si se debe mostrar el tooltip
   * @default true
   */
  showTooltip?: boolean;
  
  /**
   * Altura del gráfico en píxeles
   * @default 300
   */
  height?: number;
  
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
 * Widget de gráfico de reporte
 * 
 * Muestra gráficos usando Recharts de forma reutilizable
 * 
 * @example
 * ```tsx
 * <ReportChart
 *   title="Actividad Reciente"
 *   description="Últimos 7 días"
 *   type="bar"
 *   data={[
 *     { label: 'Lun', value: { inscripciones: 12, finalizaciones: 8 } },
 *     { label: 'Mar', value: { inscripciones: 15, finalizaciones: 6 } }
 *   ]}
 *   seriesNames={['inscripciones', 'finalizaciones']}
 *   colors={['hsl(var(--primary))', 'hsl(var(--success))']}
 * />
 * ```
 */
export const ReportChart: React.FC<ReportChartProps> = ({
  title,
  description,
  type,
  data,
  seriesNames = [],
  colors = ['#0404E4', '#22c55e', '#f59e0b', '#ef4444'], // primary, success, warning, destructive
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  height = 300,
  actions,
  className
}) => {
  // Transformar datos para Recharts
  const chartData = data.map((point) => {
    if (typeof point.value === 'number') {
      return {
        name: point.label,
        value: point.value
      };
    }
    
    // Múltiples series
    return {
      name: point.label,
      ...point.value
    };
  });

  // Colores para gráfico de pie
  const pieColors = colors.slice(0, Math.max(seriesNames.length || 1, data.length));

  // Renderizar gráfico según el tipo
  const renderChart = () => {
    switch (type) {
      case 'bar':
        if (seriesNames.length > 0) {
          // Gráfico de barras agrupadas
          return (
            <ResponsiveContainer width="100%" height={height}>
              <BarChart data={chartData}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                {showTooltip && (
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                )}
                {showLegend && <Legend />}
                {seriesNames.map((name, index) => (
                  <Bar
                    key={name}
                    dataKey={name}
                    fill={colors[index % colors.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          );
        }
        
        // Gráfico de barras simple
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              {showTooltip && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
              )}
              {showLegend && <Legend />}
              <Bar
                dataKey="value"
                fill={colors[0]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        if (seriesNames.length > 0) {
          // Gráfico de líneas múltiples
          return (
            <ResponsiveContainer width="100%" height={height}>
              <LineChart data={chartData}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                {showTooltip && (
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                )}
                {showLegend && <Legend />}
                {seriesNames.map((name, index) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          );
        }
        
        // Gráfico de línea simple
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              {showTooltip && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
              )}
              {showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              {showTooltip && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
              )}
              {showLegend && <Legend />}
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        // Similar a line pero con área rellena
        if (seriesNames.length > 0) {
          return (
            <ResponsiveContainer width="100%" height={height}>
              <LineChart data={chartData}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                {showTooltip && (
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                )}
                {showLegend && <Legend />}
                {seriesNames.map((name, index) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    fill={colors[index % colors.length]}
                    fillOpacity={0.3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          );
        }
        
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              {showTooltip && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
              )}
              {showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                strokeWidth={2}
                fill={colors[0]}
                fillOpacity={0.3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

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
        {renderChart()}
      </CardContent>
    </Card>
  );
};

