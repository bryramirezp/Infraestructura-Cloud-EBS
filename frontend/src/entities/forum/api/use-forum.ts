/**
 * Hooks React Query para la entidad Foro
 * 
 * Proporciona hooks para obtener y gestionar comentarios del foro usando React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import type { ForoComentario } from '../model/types';

/**
 * Filtros para listar comentarios del foro
 */
export interface ForoFilters {
  curso_id?: string;
  leccion_id?: string;
  usuario_id?: string;
}

/**
 * Hook para obtener comentarios del foro
 */
export const useForoComentarios = (filters?: ForoFilters) => {
  return useQuery<ForoComentario[]>({
    queryKey: ['foro', 'comentarios', filters],
    queryFn: () => apiClient.getForoComentarios(filters),
    staleTime: 1 * 60 * 1000, // Cache corto (comentarios cambian frecuentemente)
  });
};

/**
 * Hook para obtener comentarios de un curso
 */
export const useForoByCurso = (cursoId: string | null | undefined) => {
  return useQuery<ForoComentario[]>({
    queryKey: ['foro', 'curso', cursoId],
    queryFn: () => apiClient.getForoByCurso(cursoId!),
    enabled: !!cursoId,
    staleTime: 1 * 60 * 1000,
  });
};

/**
 * Hook para obtener comentarios de una lección
 */
export const useForoByLeccion = (leccionId: string | null | undefined) => {
  return useQuery<ForoComentario[]>({
    queryKey: ['foro', 'leccion', leccionId],
    queryFn: () => apiClient.getForoByLeccion(leccionId!),
    enabled: !!leccionId,
    staleTime: 1 * 60 * 1000,
  });
};

/**
 * Hook para crear un comentario en el foro
 */
export const useCrearForoComentario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (comentarioData: Partial<ForoComentario>) =>
      apiClient.crearForoComentario(comentarioData),
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['foro', 'comentarios'] });
      if (variables.curso_id) {
        queryClient.invalidateQueries({ queryKey: ['foro', 'curso', variables.curso_id] });
      }
      if (variables.leccion_id) {
        queryClient.invalidateQueries({ queryKey: ['foro', 'leccion', variables.leccion_id] });
      }
    },
  });
};

/**
 * Hook para actualizar un comentario del foro
 */
export const useActualizarForoComentario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ comentarioId, comentarioData }: { comentarioId: string; comentarioData: Partial<ForoComentario> }) =>
      apiClient.actualizarForoComentario(comentarioId, comentarioData),
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['foro', 'comentarios'] });
      if (variables.comentarioData.curso_id) {
        queryClient.invalidateQueries({ queryKey: ['foro', 'curso', variables.comentarioData.curso_id] });
      }
      if (variables.comentarioData.leccion_id) {
        queryClient.invalidateQueries({ queryKey: ['foro', 'leccion', variables.comentarioData.leccion_id] });
      }
    },
  });
};

/**
 * Hook para eliminar un comentario del foro
 */
export const useEliminarForoComentario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (comentarioId: string) =>
      apiClient.eliminarForoComentario(comentarioId),
    onSuccess: () => {
      // Invalidar lista de comentarios
      queryClient.invalidateQueries({ queryKey: ['foro', 'comentarios'] });
      queryClient.invalidateQueries({ queryKey: ['foro', 'curso'] });
      queryClient.invalidateQueries({ queryKey: ['foro', 'leccion'] });
    },
  });
};
