import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Calendar, BookOpen, ArrowRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Modulo } from '@/entities/module/model/types';

export interface ModuloCardProps {
  modulo: Modulo;
  onView?: (moduloId: string) => void;
  className?: string;
}

const getModuloEstado = (fechaInicio: string, fechaFin: string): 'activo' | 'proximo' | 'finalizado' => {
  const hoy = new Date();
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  if (hoy < inicio) return 'proximo';
  if (hoy > fin) return 'finalizado';
  return 'activo';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const ModuloCard: React.FC<ModuloCardProps> = ({
  modulo,
  onView,
  className
}) => {
  const estado = getModuloEstado(modulo.fecha_inicio, modulo.fecha_fin);
  
  const estadoConfig = {
    activo: { label: 'Activo', variant: 'default' as const, color: 'bg-green-500/10 text-green-700 dark:text-green-400' },
    proximo: { label: 'Próximo', variant: 'secondary' as const, color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
    finalizado: { label: 'Finalizado', variant: 'outline' as const, color: 'bg-gray-500/10 text-gray-700 dark:text-gray-400' },
  };

  const config = estadoConfig[estado];

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{modulo.titulo}</CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  {formatDate(modulo.fecha_inicio)} - {formatDate(modulo.fecha_fin)}
                </span>
              </span>
            </CardDescription>
          </div>
          <Badge className={config.color} variant={config.variant}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>Módulo disponible</span>
          </div>
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(modulo.id)}
              className="gap-2"
            >
              Ver detalles
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

