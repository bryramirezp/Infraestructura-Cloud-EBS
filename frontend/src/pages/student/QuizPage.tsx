import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz, useQuizPreguntas, useQuizIntentos, useIniciarQuiz, useEnviarQuiz } from '@/entities/quiz/api/use-quiz';
import { QuizQuestionCard } from '@/widgets/quiz';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Alert, AlertDescription } from '@/shared/ui/Alert';
import { AlertCircle, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { PreguntaCompleta } from '@/widgets/quiz';
import type { Respuesta } from '@/entities/attempt/model/types';

export const QuizPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: quiz, isLoading: isLoadingQuiz, error: errorQuiz } = useQuiz(id);
  const { data: preguntas, isLoading: isLoadingPreguntas } = useQuizPreguntas(id);
  const { data: intentos } = useQuizIntentos(id);
  const iniciarMutation = useIniciarQuiz();
  const enviarMutation = useEnviarQuiz();

  const [intentoId, setIntentoId] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<Record<string, {
    respuesta_texto?: string | null;
    opcion_id?: string | null;
    respuesta_bool?: boolean | null;
  }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const iniciarIntento = async () => {
      if (!id || intentoId) return;
      
      try {
        const resultado = await iniciarMutation.mutateAsync(id);
        if (resultado?.intento_id) {
          setIntentoId(resultado.intento_id);
        }
      } catch (error: any) {
        toast.error(error?.message || 'Error al iniciar el quiz');
      }
    };

    iniciarIntento();
  }, [id, intentoId, iniciarMutation]);

  const preguntasOrdenadas = React.useMemo(() => {
    if (!preguntas) return [];
    const preguntasArray = Array.isArray(preguntas) ? preguntas : [];
    return [...preguntasArray].sort((a: any, b: any) => {
      const ordenA = a.orden ?? 999;
      const ordenB = b.orden ?? 999;
      return ordenA - ordenB;
    });
  }, [preguntas]);

  const handleRespuestaChange = (preguntaId: string, respuesta: {
    respuesta_texto?: string | null;
    opcion_id?: string | null;
    respuesta_bool?: boolean | null;
  }) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: respuesta
    }));
  };

  const handleSubmit = async () => {
    if (!id || !intentoId || !preguntas) {
      toast.error('Error: datos incompletos');
      return;
    }

    setIsSubmitting(true);
    try {
      const respuestasArray: Respuesta[] = preguntasOrdenadas.map((pregunta: any) => {
        const respuesta = respuestas[pregunta.id];
        if (!respuesta) {
          throw new Error(`Debes responder la pregunta: ${pregunta.enunciado}`);
        }

        return {
          intento_pregunta_id: '', // Se asignará en el backend
          respuesta_texto: respuesta.respuesta_texto || null,
          opcion_id: respuesta.opcion_id || null,
          respuesta_bool: respuesta.respuesta_bool ?? null,
        } as Respuesta;
      });

      await enviarMutation.mutateAsync({
        quizId: id,
        respuestas: respuestasArray
      });

      toast.success('Quiz enviado exitosamente');
      navigate(`/quizzes/${id}/resultado`);
    } catch (error: any) {
      toast.error(error?.message || 'Error al enviar el quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const intentosRestantes = React.useMemo(() => {
    if (!intentos) return 0;
    const maxIntentos = 3; // Esto debería venir de regla_acreditacion
    return Math.max(0, maxIntentos - intentos.length);
  }, [intentos]);

  if (isLoadingQuiz || isLoadingPreguntas) {
    return (
      <div className="space-y-6 md:space-y-8">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (errorQuiz || !quiz) {
    return (
      <div className="space-y-6 md:space-y-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorQuiz?.message || 'Error al cargar el quiz. Por favor, intenta nuevamente.'}
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
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{quiz.titulo}</h1>
            <p className="text-primary-100 text-sm md:text-base">
              Responde todas las preguntas antes de enviar
            </p>
          </div>
          {intentosRestantes > 0 && (
            <div className="text-right">
              <p className="text-primary-100 text-sm">Intentos restantes</p>
              <p className="text-2xl font-bold">{intentosRestantes}</p>
            </div>
          )}
        </div>
      </div>

      {preguntasOrdenadas.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No hay preguntas disponibles en este quiz.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="space-y-6">
            {preguntasOrdenadas.map((pregunta: PreguntaCompleta, index: number) => (
              <QuizQuestionCard
                key={pregunta.id}
                pregunta={pregunta}
                respuesta={respuestas[pregunta.id]}
                onChange={(respuesta) => handleRespuestaChange(pregunta.id, respuesta)}
              />
            ))}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !intentoId}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar Quiz
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

