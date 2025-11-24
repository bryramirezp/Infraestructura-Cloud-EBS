/**
 * Hooks React Query para la entidad Examen Final
 * 
 * Proporciona hooks para obtener y gestionar exámenes finales usando React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import type { ExamenFinal } from '../model/types';
import type { Respuesta } from '@/entities/attempt';

/**
 * Hook para obtener un examen final por ID
 */
export const useExamenFinal = (examenId: string | null | undefined) => {
  return useQuery<ExamenFinal>({
    queryKey: ['examen-final', examenId],
    queryFn: () => apiClient.getExamenFinalById(examenId!),
    enabled: !!examenId,
    staleTime: 5 * 60 * 1000, // Cache válido por 5 minutos
  });
};

/**
 * Hook para obtener las preguntas de un examen final
 */
export const useExamenFinalPreguntas = (examenId: string | null | undefined) => {
  return useQuery({
    queryKey: ['examen-final', examenId, 'preguntas'],
    queryFn: () => apiClient.getExamenFinalPreguntas(examenId!),
    enabled: !!examenId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener los resultados de un examen final
 */
export const useExamenFinalResultados = (examenId: string | null | undefined) => {
  return useQuery({
    queryKey: ['examen-final', examenId, 'resultados'],
    queryFn: () => apiClient.getExamenFinalResultados(examenId!),
    enabled: !!examenId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook para crear un intento de examen final
 * Valida prerrequisitos (todos los quizzes aprobados) antes de crear intento
 */
export const useCrearIntentoExamenFinal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (examenId: string) =>
      apiClient.crearIntentoExamenFinal(examenId),
    onSuccess: (_, examenId) => {
      // Invalidar intentos del examen para refrescar
      queryClient.invalidateQueries({ queryKey: ['intentos', { examen_final_id: examenId }] });
      queryClient.invalidateQueries({ queryKey: ['intentos'] });
    },
  });
};

/**
 * Hook para enviar las respuestas de un intento de examen final
 */
export const useEnviarIntentoExamenFinal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ examenId, intentoId, respuestas }: { examenId: string; intentoId: string; respuestas: Respuesta[] }) =>
      apiClient.enviarIntentoExamenFinal(examenId, intentoId, respuestas),
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['examen-final', variables.examenId] });
      queryClient.invalidateQueries({ queryKey: ['examen-final', variables.examenId, 'resultados'] });
      queryClient.invalidateQueries({ queryKey: ['intentos'] });
      queryClient.invalidateQueries({ queryKey: ['inscripciones'] });
      queryClient.invalidateQueries({ queryKey: ['certificados'] });
      queryClient.invalidateQueries({ queryKey: ['curso', 'progreso'] });
    },
  });
};

