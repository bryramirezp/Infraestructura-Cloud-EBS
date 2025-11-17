/**
 * Hooks React Query para la entidad Intento
 * 
 * Proporciona hooks para obtener y gestionar intentos usando React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import type { Intento } from '../model/types';

/**
 * Filtros para listar intentos
 */
export interface IntentosFilters {
  quiz_id?: string;
  examen_final_id?: string;
  usuario_id?: string;
}

/**
 * Hook para obtener un intento por ID
 */
export const useIntento = (intentoId: string | null | undefined) => {
  return useQuery<Intento>({
    queryKey: ['intento', intentoId],
    queryFn: () => apiClient.getIntentoById(intentoId!),
    enabled: !!intentoId,
    staleTime: 2 * 60 * 1000, // Cache más corto (datos cambian frecuentemente)
  });
};

/**
 * Hook para obtener los intentos de un quiz
 */
export const useIntentosByQuiz = (quizId: string | null | undefined) => {
  return useQuery<Intento[]>({
    queryKey: ['intentos', { quiz_id: quizId }],
    queryFn: () => apiClient.getIntentosByQuiz(quizId!),
    enabled: !!quizId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook para obtener los intentos de un examen final
 */
export const useIntentosByExamen = (examenId: string | null | undefined) => {
  return useQuery<Intento[]>({
    queryKey: ['intentos', { examen_final_id: examenId }],
    queryFn: () => apiClient.getIntentosByExamen(examenId!),
    enabled: !!examenId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook para obtener los intentos de un usuario
 */
export const useIntentosByUsuario = (usuarioId: string | null | undefined) => {
  return useQuery<Intento[]>({
    queryKey: ['intentos', { usuario_id: usuarioId }],
    queryFn: () => apiClient.get(API_ENDPOINTS.INTENTOS.BY_USUARIO(usuarioId!)),
    enabled: !!usuarioId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook para obtener el resultado detallado de un intento
 */
export const useIntentoResultado = (intentoId: string | null | undefined) => {
  return useQuery({
    queryKey: ['intento', intentoId, 'resultado'],
    queryFn: () => apiClient.getIntentoResultado(intentoId!),
    enabled: !!intentoId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook para permitir un nuevo intento (Admin/Instructor)
 * Permite que un usuario pueda realizar otro intento después de alcanzar el límite
 */
export const usePermitirNuevoIntento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (intentoId: string) =>
      apiClient.permitirNuevoIntento(intentoId),
    onSuccess: (_, intentoId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['intento', intentoId] });
      queryClient.invalidateQueries({ queryKey: ['intentos'] });
    },
  });
};

