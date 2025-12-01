import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurso, useExamenFinalByCurso, useGuiasEstudio, useCursoProgreso } from '@/entities/course/api/use-course';
import { useLeccionesByCurso, useLeccionQuiz } from '@/entities/lesson/api/use-lesson';
import { useInscripcionesByUsuario } from '@/entities/enrollment/api/use-enrollment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { AlertCircle, BookOpen, FileText, PlayCircle, Link as LinkIcon, CheckCircle2, Clock, Award } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { cn } from '@/shared/lib/utils';
import type { Leccion } from '@/entities/lesson/model/types';

export const CursoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: curso, isLoading: isLoadingCurso, error: errorCurso } = useCurso(id);
  const { data: lecciones, isLoading: isLoadingLecciones } = useLeccionesByCurso(id);
  const { data: examenFinal } = useExamenFinalByCurso(id);
  const { data: guiasEstudio } = useGuiasEstudio(id, true);
  const { data: progreso } = useCursoProgreso(id);
  const { data: inscripciones } = useInscripcionesByUsuario(user?.id);

  const inscripcion = inscripciones?.find(ins => ins.curso_id === id);

  const leccionesOrdenadas = React.useMemo(() => {
    if (!lecciones) return [];
    return [...lecciones].sort((a, b) => {
      const ordenA = a.orden ?? 999;
      const ordenB = b.orden ?? 999;
      return ordenA - ordenB;
    });
  }, [lecciones]);

  const handleViewLeccion = (leccionId: string) => {
    navigate(`/lecciones/${leccionId}`);
  };

  const handleViewQuiz = (quizId: string) => {
    navigate(`/quizzes/${quizId}`);
  };

  const handleViewExamen = (examenId: string) => {
    navigate(`/examenes-finales/${examenId}`);
  };

  if (isLoadingCurso) {
    return (
      <div className="space-y-6 md:space-y-8">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (errorCurso || !curso) {
    return (
      <div className="space-y-6 md:space-y-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorCurso?.message || 'Error al cargar el curso. Por favor, intenta nuevamente.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl p-6 md:p-8 shadow-soft">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{curso.titulo}</h1>
            {curso.descripcion && (
              <p className="text-primary-100 text-sm md:text-base mt-4">{curso.descripcion}</p>
            )}
          </div>
          {inscripcion && (
            <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400">
              {inscripcion.estado}
            </Badge>
          )}
        </div>
      </div>

      {progreso && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Progreso del Curso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso general</span>
                <span className="font-semibold">{progreso.porcentaje_completado || 0}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progreso.porcentaje_completado || 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {guiasEstudio && guiasEstudio.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Guías de Estudio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {guiasEstudio.map((guia) => (
                <div key={guia.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{guia.titulo}</p>
                  </div>
                  {guia.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(guia.url!, '_blank')}
                    >
                      Ver guía
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Lecciones
          </CardTitle>
          <CardDescription>
            {leccionesOrdenadas.length} lecciones disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLecciones ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : leccionesOrdenadas.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay lecciones disponibles en este curso.
            </p>
          ) : (
            <div className="space-y-4">
              {leccionesOrdenadas.map((leccion, index) => (
                <LeccionCard
                  key={leccion.id}
                  leccion={leccion}
                  index={index + 1}
                  onView={handleViewLeccion}
                  onViewQuiz={handleViewQuiz}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {examenFinal && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Examen Final
            </CardTitle>
            <CardDescription>
              Examen final del curso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{examenFinal.titulo}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Completa todas las lecciones y quizzes antes de realizar el examen final
                </p>
              </div>
              <Button onClick={() => navigate(`/examenes-finales/${examenFinal.id}`)}>
                Realizar Examen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface LeccionCardProps {
  leccion: Leccion;
  index: number;
  onView: (leccionId: string) => void;
  onViewQuiz: (quizId: string) => void;
}

const LeccionCard: React.FC<LeccionCardProps> = ({ leccion, index, onView, onViewQuiz }) => {
  const { data: quiz } = useLeccionQuiz(leccion.id);

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline">Lección {index}</Badge>
            <h3 className="font-semibold text-lg">{leccion.titulo}</h3>
          </div>
          {quiz && (
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary">Quiz disponible</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewQuiz(quiz.id)}
              >
                Realizar Quiz
              </Button>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => onView(leccion.id)}
        >
          Ver Lección
        </Button>
      </div>
    </div>
  );
};

