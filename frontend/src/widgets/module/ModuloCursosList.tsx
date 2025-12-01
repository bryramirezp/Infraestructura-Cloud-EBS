import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import { cn } from '@/shared/lib/utils';
import type { ModuloCurso } from '@/entities/module/model/types';
import type { Curso } from '@/entities/course/model/types';

export interface ModuloCursosListProps {
  cursos: Array<ModuloCurso & { curso?: Curso }>;
  isLoading?: boolean;
  onViewCurso?: (cursoId: string) => void;
  onInscribir?: (cursoId: string) => void;
  className?: string;
}

export const ModuloCursosList: React.FC<ModuloCursosListProps> = ({
  cursos,
  isLoading = false,
  onViewCurso,
  onInscribir,
  className
}) => {
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <h2 className="text-xl font-bold">Cursos del Módulo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (cursos.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <h2 className="text-xl font-bold">Cursos del Módulo</h2>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay cursos disponibles en este módulo.
          </CardContent>
        </Card>
      </div>
    );
  }

  const cursosOrdenados = [...cursos].sort((a, b) => a.slot - b.slot);

  return (
    <div className={cn('space-y-4', className)}>
      <h2 className="text-xl font-bold">Cursos del Módulo</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cursosOrdenados.map((moduloCurso) => {
          const curso = moduloCurso.curso;
          if (!curso) return null;

          return (
            <Card key={moduloCurso.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Slot {moduloCurso.slot}</Badge>
                    </div>
                    <CardTitle className="text-lg">{curso.titulo}</CardTitle>
                    {curso.descripcion && (
                      <CardDescription className="mt-2 line-clamp-2">
                        {curso.descripcion}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>Curso disponible</span>
                  </div>
                  <div className="flex gap-2">
                    {onViewCurso && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewCurso(curso.id)}
                        className="gap-2"
                      >
                        Ver
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                    {onInscribir && (
                      <Button
                        size="sm"
                        onClick={() => onInscribir(curso.id)}
                      >
                        Inscribirse
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

