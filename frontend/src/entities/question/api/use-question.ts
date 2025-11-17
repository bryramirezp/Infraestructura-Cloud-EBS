/**
 * Hooks React Query para la entidad Pregunta
 * 
 * Proporciona hooks para obtener preguntas y sus configuraciones usando React Query
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import type { Pregunta, PreguntaConfig, Opcion } from '../model/types';

/**
 * Hook para obtener una pregunta por ID
 * Nota: Las preguntas generalmente se obtienen junto con quiz/examen
 */
export const usePregunta = (preguntaId: string | null | undefined) => {
  return useQuery<Pregunta>({
    queryKey: ['pregunta', preguntaId],
    queryFn: () => apiClient.get(`/preguntas/${preguntaId}`),
    enabled: !!preguntaId,
    staleTime: 5 * 60 * 1000, // Cache válido por 5 minutos
  });
};

/**
 * Hook para obtener una pregunta con sus opciones
 * Útil para preguntas de opción múltiple
 */
export const usePreguntaConOpciones = (preguntaId: string | null | undefined) => {
  return useQuery<{
    pregunta: Pregunta;
    config: PreguntaConfig;
    opciones: Opcion[];
  }>({
    queryKey: ['pregunta', preguntaId, 'completa'],
    queryFn: () => apiClient.get(`/preguntas/${preguntaId}/completa`),
    enabled: !!preguntaId,
    staleTime: 5 * 60 * 1000,
  });
};

