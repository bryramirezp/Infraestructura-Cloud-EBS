import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useModulo, useCursosByModulo } from '@/entities/module/api/use-module';
import { useInscribirEnCurso } from '@/entities/course/api/use-course';
import { ModuloHeader, ModuloCursosList } from '@/widgets/module';
import { Skeleton } from '@/shared/ui/skeleton';
import { Alert, AlertDescription } from '@/shared/ui/Alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers/AuthProvider';

export const ModuloDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: modulo, isLoading: isLoadingModulo, error: errorModulo } = useModulo(id);
  const { data: cursos, isLoading: isLoadingCursos, error: errorCursos } = useCursosByModulo(id);
  const inscribirMutation = useInscribirEnCurso();

  const handleViewCurso = (cursoId: string) => {
    navigate(`/cursos/${cursoId}`);
  };

  const handleInscribir = async (cursoId: string) => {
    try {
      await inscribirMutation.mutateAsync(cursoId);
      toast.success('Te has inscrito exitosamente en el curso');
    } catch (error: any) {
      toast.error(error?.message || 'Error al inscribirse en el curso');
    }
  };

  if (isLoadingModulo) {
    return (
      <div className="space-y-6 md:space-y-8">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (errorModulo || !modulo) {
    return (
      <div className="space-y-6 md:space-y-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorModulo?.message || 'Error al cargar el módulo. Por favor, intenta nuevamente.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const cursosConDatos = cursos?.map((moduloCurso) => {
    return {
      ...moduloCurso,
      curso: undefined, // El backend debería incluir el curso completo
    };
  }) || [];

  return (
    <div className="space-y-6 md:space-y-8">
      <ModuloHeader modulo={modulo} />

      {errorCursos ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar los cursos del módulo.
          </AlertDescription>
        </Alert>
      ) : (
        <ModuloCursosList
          cursos={cursosConDatos}
          isLoading={isLoadingCursos}
          onViewCurso={handleViewCurso}
          onInscribir={user ? handleInscribir : undefined}
        />
      )}
    </div>
  );
};

