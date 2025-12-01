import React from 'react';
import { Button } from '@/shared/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Leccion } from '@/entities/lesson/model/types';

export interface LessonNavigationProps {
  leccionActual: Leccion;
  lecciones: Leccion[];
  onNavigate: (leccionId: string) => void;
  className?: string;
}

export const LessonNavigation: React.FC<LessonNavigationProps> = ({
  leccionActual,
  lecciones,
  onNavigate,
  className
}) => {
  const leccionesOrdenadas = React.useMemo(() => {
    return [...lecciones].sort((a, b) => {
      const ordenA = a.orden ?? 999;
      const ordenB = b.orden ?? 999;
      return ordenA - ordenB;
    });
  }, [lecciones]);

  const indiceActual = leccionesOrdenadas.findIndex(l => l.id === leccionActual.id);
  const leccionAnterior = indiceActual > 0 ? leccionesOrdenadas[indiceActual - 1] : null;
  const leccionSiguiente = indiceActual < leccionesOrdenadas.length - 1 
    ? leccionesOrdenadas[indiceActual + 1] 
    : null;

  if (!leccionAnterior && !leccionSiguiente) {
    return null;
  }

  return (
    <div className={cn('flex items-center justify-between border-t pt-4', className)}>
      <div>
        {leccionAnterior ? (
          <Button
            variant="outline"
            onClick={() => onNavigate(leccionAnterior.id)}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Lección anterior
          </Button>
        ) : (
          <div />
        )}
      </div>
      <div>
        {leccionSiguiente ? (
          <Button
            variant="outline"
            onClick={() => onNavigate(leccionSiguiente.id)}
            className="gap-2"
          >
            Lección siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};

