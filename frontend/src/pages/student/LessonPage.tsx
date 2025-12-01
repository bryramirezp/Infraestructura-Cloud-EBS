import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLeccion, useLeccionContenido } from '@/entities/lesson/api/use-lesson';
import { useLeccionesByModulo } from '@/entities/lesson/api/use-lesson';
import { useLeccionQuiz } from '@/entities/lesson/api/use-lesson';
import { useForoByLeccion } from '@/entities/forum/api/use-forum';
import { LessonContentView, LessonNavigation } from '@/widgets/lesson';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { AlertCircle, MessageSquare, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export const LessonPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: leccion, isLoading: isLoadingLeccion, error: errorLeccion } = useLeccion(id);
  const { data: contenido, isLoading: isLoadingContenido } = useLeccionContenido(id);
  const { data: lecciones } = useLeccionesByModulo(leccion?.modulo_id);
  const { data: quiz } = useLeccionQuiz(id);
  const { data: comentarios } = useForoByLeccion(id);

  const handleNavigate = (leccionId: string) => {
    navigate(`/lecciones/${leccionId}`);
  };

  const handleViewQuiz = (quizId: string) => {
    navigate(`/quizzes/${quizId}`);
  };

  if (isLoadingLeccion) {
    return (
      <div className="space-y-6 md:space-y-8">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (errorLeccion || !leccion) {
    return (
      <div className="space-y-6 md:space-y-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorLeccion?.message || 'Error al cargar la lección. Por favor, intenta nuevamente.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const contenidoOrdenado = React.useMemo(() => {
    if (!contenido) return [];
    return [...contenido].sort((a, b) => {
      const ordenA = a.orden ?? 999;
      const ordenB = b.orden ?? 999;
      return ordenA - ordenB;
    });
  }, [contenido]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl p-6 md:p-8 shadow-soft">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5" />
              <Badge variant="secondary" className="bg-primary-400/20 text-white">
                Lección
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{leccion.titulo}</h1>
          </div>
        </div>
      </div>

      {isLoadingContenido ? (
        <Skeleton className="h-96 w-full" />
      ) : contenidoOrdenado.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No hay contenido disponible para esta lección.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {contenidoOrdenado.map((item) => (
            <LessonContentView
              key={item.id}
              contenido={item}
            />
          ))}
        </div>
      )}

      {lecciones && lecciones.length > 0 && (
        <LessonNavigation
          leccionActual={leccion}
          lecciones={lecciones}
          onNavigate={handleNavigate}
        />
      )}

      {quiz && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Quiz de la Lección
            </CardTitle>
            <CardDescription>
              Completa el quiz para evaluar tu comprensión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{quiz.titulo}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Realiza el quiz para continuar
                </p>
              </div>
              <Button onClick={() => handleViewQuiz(quiz.id)}>
                Realizar Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Foro de Discusión
          </CardTitle>
          <CardDescription>
            Comentarios y discusiones sobre esta lección
          </CardDescription>
        </CardHeader>
        <CardContent>
          {comentarios && comentarios.length > 0 ? (
            <div className="space-y-4">
              {comentarios.map((comentario) => (
                <div key={comentario.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{comentario.usuario_id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(comentario.creado_en).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <p className="text-foreground">{comentario.contenido}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay comentarios aún. Sé el primero en comentar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

