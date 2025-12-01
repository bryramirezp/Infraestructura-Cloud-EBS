import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz, useQuizIntentos } from '@/entities/quiz/api/use-quiz';
import { useIntentoResultado } from '@/entities/attempt/api/use-attempt';
import { QuizQuestionCard } from '@/widgets/quiz';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { AlertCircle, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export const QuizResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: quiz } = useQuiz(id);
  const { data: intentos } = useQuizIntentos(id);
  const ultimoIntento = intentos && Array.isArray(intentos) && intentos.length > 0 
    ? intentos[intentos.length - 1] 
    : null;
  const { data: resultado } = useIntentoResultado(ultimoIntento?.id);

  if (!ultimoIntento) {
    return (
      <div className="space-y-6 md:space-y-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No se encontró información del intento.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isAprobado = ultimoIntento.resultado === 'APROBADO';
  const puntaje = ultimoIntento.puntaje || 0;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className={cn(
        'bg-gradient-to-r rounded-xl p-6 md:p-8 shadow-soft text-white',
        isAprobado 
          ? 'from-green-600 to-green-700' 
          : 'from-red-600 to-red-700'
      )}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isAprobado ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <XCircle className="h-6 w-6" />
              )}
              <h1 className="text-2xl md:text-3xl font-bold">
                {isAprobado ? '¡Aprobado!' : 'No Aprobado'}
              </h1>
            </div>
            <p className="text-white/90 text-sm md:text-base">
              Puntaje obtenido: <span className="font-bold text-xl">{puntaje.toFixed(2)}%</span>
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen del Intento</CardTitle>
          <CardDescription>
            Intento #{ultimoIntento.numero_intento} - {new Date(ultimoIntento.finalizado_en || ultimoIntento.creado_en).toLocaleDateString('es-ES')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Puntaje</p>
              <p className="text-2xl font-bold">{puntaje.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resultado</p>
              <Badge variant={isAprobado ? 'default' : 'destructive'}>
                {ultimoIntento.resultado || 'Pendiente'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Intento</p>
              <p className="text-2xl font-bold">#{ultimoIntento.numero_intento}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha</p>
              <p className="text-sm">{new Date(ultimoIntento.finalizado_en || ultimoIntento.creado_en).toLocaleDateString('es-ES')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {respuestas && respuestas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revisión de Respuestas</CardTitle>
            <CardDescription>
              Revisa tus respuestas y las respuestas correctas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {respuestas.map((respuesta: any, index: number) => (
                <div key={respuesta.id || index}>
                  {/* Aquí se mostraría la pregunta con la respuesta */}
                  {/* Necesitaríamos obtener las preguntas completas */}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {ultimoIntento.permitir_nuevo_intento && (
        <div className="flex justify-center">
          <Button
            onClick={() => navigate(`/quizzes/${id}`)}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Nuevo Intento
          </Button>
        </div>
      )}
    </div>
  );
};

