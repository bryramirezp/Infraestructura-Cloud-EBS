import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamenFinal, useExamenFinalPreguntas, useCrearIntentoExamenFinal, useEnviarIntentoExamenFinal } from '@/entities/exam/api/use-exam';
import { useCursoProgreso } from '@/entities/course/api/use-course';
import { QuizQuestionCard } from '@/widgets/quiz';
import { QuizTimer } from '@/widgets/quiz';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { AlertCircle, Loader2, Send, Lock } from 'lucide-react';
import { toast } from 'sonner';
import type { PreguntaCompleta } from '@/widgets/quiz';
import type { Respuesta } from '@/entities/attempt/model/types';

export const ExamenFinalPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: examen, isLoading: isLoadingExamen, error: errorExamen } = useExamenFinal(id);
  const { data: preguntas, isLoading: isLoadingPreguntas } = useExamenFinalPreguntas(id);
  const { data: progreso } = useCursoProgreso(examen?.curso_id);
  const crearIntentoMutation = useCrearIntentoExamenFinal();
  const enviarIntentoMutation = useEnviarIntentoExamenFinal();

  const [intentoId, setIntentoId] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<Record<string, {
    respuesta_texto?: string | null;
    opcion_id?: string | null;
    respuesta_bool?: boolean | null;
  }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prerrequisitosCumplidos, setPrerrequisitosCumplidos] = useState<boolean | null>(null);

  useEffect(() => {
    if (progreso) {
      const todosQuizzesAprobados = progreso.quizzes_pendientes === 0;
      setPrerrequisitosCumplidos(todosQuizzesAprobados);
    }
  }, [progreso]);

  useEffect(() => {
    const iniciarIntento = async () => {
      if (!id || intentoId || prerrequisitosCumplidos === false) return;
      
      try {
        const resultado = await crearIntentoMutation.mutateAsync(id);
        if (resultado?.id) {
          setIntentoId(resultado.id);
        }
      } catch (error: any) {
        toast.error(error?.message || 'Error al iniciar el examen final');
      }
    };

    if (prerrequisitosCumplidos === true && id) {
      iniciarIntento();
    }
  }, [id, intentoId, prerrequisitosCumplidos, crearIntentoMutation]);

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
          intento_pregunta_id: '',
          respuesta_texto: respuesta.respuesta_texto || null,
          opcion_id: respuesta.opcion_id || null,
          respuesta_bool: respuesta.respuesta_bool ?? null,
        } as Respuesta;
      });

      if (!intentoId) {
        toast.error('Error: No se pudo obtener el ID del intento');
        return;
      }

      await enviarIntentoMutation.mutateAsync({
        examenId: id,
        intentoId: intentoId,
        respuestas: respuestasArray
      });

      toast.success('Examen final enviado exitosamente');
      navigate(`/examenes-finales/${id}/resultado`);
    } catch (error: any) {
      toast.error(error?.message || 'Error al enviar el examen final');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = () => {
    toast.warning('El tiempo se ha agotado. Enviando examen...');
    handleSubmit();
  };

  if (isLoadingExamen || isLoadingPreguntas) {
    return (
      <div className="space-y-6 md:space-y-8">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (errorExamen || !examen) {
    return (
      <div className="space-y-6 md:space-y-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorExamen?.message || 'Error al cargar el examen final. Por favor, intenta nuevamente.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (prerrequisitosCumplidos === false) {
    return (
      <div className="space-y-6 md:space-y-8">
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl p-6 md:p-8 shadow-soft">
          <div className="flex items-start gap-4">
            <Lock className="h-8 w-8 flex-shrink-0" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Examen Final Bloqueado</h1>
              <p className="text-white/90 text-sm md:text-base">
                Debes completar y aprobar todos los quizzes antes de realizar el examen final.
              </p>
            </div>
          </div>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {progreso?.quizzes_pendientes 
              ? `Tienes ${progreso.quizzes_pendientes} quiz(es) pendiente(s) por completar.`
              : 'Completa todos los quizzes de las lecciones para desbloquear el examen final.'}
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
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{examen.titulo}</h1>
            <p className="text-primary-100 text-sm md:text-base">
              Examen final del curso. Responde todas las preguntas antes de enviar.
            </p>
          </div>
        </div>
      </div>

      {examen.aleatorio && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Las preguntas se muestran en orden aleatorio.
          </AlertDescription>
        </Alert>
      )}

      {preguntasOrdenadas.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No hay preguntas disponibles en este examen final.
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

          <div className="flex justify-between items-center gap-4 pt-6 border-t">
            <div className="flex-1" />
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
                  Enviar Examen Final
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

