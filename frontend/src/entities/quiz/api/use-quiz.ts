/**
 * Hooks React Query para la entidad Quiz
 * 
 * Proporciona hooks para obtener y gestionar quizzes usando React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import type { Quiz } from '../model/types';
import type { Respuesta } from '@/entities/attempt';

/**
 * Hook para obtener un quiz por ID
 */
export const useQuiz = (quizId: string | null | undefined) => {
  return useQuery<Quiz>({
    queryKey: ['quiz', quizId],
    queryFn: () => apiClient.getQuizById(quizId!),
    enabled: !!quizId,
    staleTime: 5 * 60 * 1000, // Cache válido por 5 minutos
  });
};

/**
 * Hook para obtener las preguntas de un quiz
 */
export const useQuizPreguntas = (quizId: string | null | undefined) => {
  return useQuery({
    queryKey: ['quiz', quizId, 'preguntas'],
    queryFn: () => apiClient.getQuizPreguntas(quizId!),
    enabled: !!quizId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener los intentos de un quiz
 */
export const useQuizIntentos = (quizId: string | null | undefined) => {
  return useQuery({
    queryKey: ['quiz', quizId, 'intentos'],
    queryFn: () => apiClient.getQuizIntentos(quizId!),
    enabled: !!quizId,
    staleTime: 2 * 60 * 1000, // Cache más corto (datos cambian frecuentemente)
  });
};

/**
 * Hook para obtener los resultados de un quiz
 */
export const useQuizResultados = (quizId: string | null | undefined) => {
  return useQuery({
    queryKey: ['quiz', quizId, 'resultados'],
    queryFn: () => apiClient.getQuizResultados(quizId!),
    enabled: !!quizId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook para crear un intento de quiz
 * Crea un nuevo intento en el backend
 */
export const useCrearIntentoQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quizId: string) =>
      apiClient.crearIntentoQuiz(quizId),
    onSuccess: (_, quizId) => {
      // Invalidar intentos del quiz para refrescar
      queryClient.invalidateQueries({ queryKey: ['quiz', quizId, 'intentos'] });
      queryClient.invalidateQueries({ queryKey: ['intentos'] });
    },
  });
};

/**
 * Hook para enviar las respuestas de un intento de quiz
 */
export const useEnviarIntentoQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quizId, intentoId, respuestas }: { quizId: string; intentoId: string; respuestas: Respuesta[] }) =>
      apiClient.enviarIntentoQuiz(quizId, intentoId, respuestas),
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['quiz', variables.quizId] });
      queryClient.invalidateQueries({ queryKey: ['quiz', variables.quizId, 'intentos'] });
      queryClient.invalidateQueries({ queryKey: ['quiz', variables.quizId, 'resultados'] });
      queryClient.invalidateQueries({ queryKey: ['intentos'] });
      queryClient.invalidateQueries({ queryKey: ['inscripciones'] });
      queryClient.invalidateQueries({ queryKey: ['curso', 'progreso'] });
    },
  });
};

