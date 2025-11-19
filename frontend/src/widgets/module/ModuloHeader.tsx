import React from 'react';
import { Badge } from '@/shared/ui/badge';
import { Calendar, BookOpen } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Modulo } from '@/entities/module/model/types';

export interface ModuloHeaderProps {
  modulo: Modulo;
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
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const ModuloHeader: React.FC<ModuloHeaderProps> = ({
  modulo,
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
    <div className={cn('space-y-4', className)}>
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl p-6 md:p-8 shadow-soft">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{modulo.titulo}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-primary-100">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span className="text-sm md:text-base">
                  <span className="font-semibold">Inicio:</span> {formatDate(modulo.fecha_inicio)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span className="text-sm md:text-base">
                  <span className="font-semibold">Fin:</span> {formatDate(modulo.fecha_fin)}
                </span>
              </div>
            </div>
          </div>
          <Badge className={config.color} variant={config.variant}>
            {config.label}
          </Badge>
        </div>
      </div>
    </div>
  );
};

