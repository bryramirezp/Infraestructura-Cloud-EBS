/**
 * Hooks React Query para la entidad Lección
 * 
 * Proporciona hooks para obtener y gestionar lecciones usando React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import type { Leccion, LeccionContenido } from '../model/types';

/**
 * Filtros para listar lecciones
 */
export interface LeccionesFilters {
  modulo_id?: string;
  curso_id?: string;
  publicado?: boolean;
}

/**
 * Hook para obtener lista de lecciones
 */
export const useLecciones = (filters?: LeccionesFilters) => {
  return useQuery<Leccion[]>({
    queryKey: ['lecciones', filters],
    queryFn: () => apiClient.getLecciones(filters),
    staleTime: 5 * 60 * 1000, // Cache válido por 5 minutos
  });
};

/**
 * Hook para obtener una lección por ID
 */
export const useLeccion = (leccionId: string | null | undefined) => {
  return useQuery<Leccion>({
    queryKey: ['leccion', leccionId],
    queryFn: () => apiClient.getLeccionById(leccionId!),
    enabled: !!leccionId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener el contenido de una lección
 */
export const useLeccionContenido = (leccionId: string | null | undefined) => {
  return useQuery<LeccionContenido[]>({
    queryKey: ['leccion', leccionId, 'contenido'],
    queryFn: () => apiClient.getLeccionContenido(leccionId!),
    enabled: !!leccionId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener lecciones de un módulo
 */
export const useLeccionesByModulo = (moduloId: string | null | undefined) => {
  return useQuery<Leccion[]>({
    queryKey: ['lecciones', { modulo_id: moduloId }],
    queryFn: () => apiClient.getLecciones({ modulo_id: moduloId }),
    enabled: !!moduloId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener lecciones de un curso
 */
export const useLeccionesByCurso = (cursoId: string | null | undefined) => {
  return useQuery<Leccion[]>({
    queryKey: ['lecciones', { curso_id: cursoId }],
    queryFn: () => apiClient.getLeccionesByCurso(cursoId!),
    enabled: !!cursoId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener el quiz de una lección
 */
export const useLeccionQuiz = (leccionId: string | null | undefined) => {
  return useQuery({
    queryKey: ['leccion', leccionId, 'quiz'],
    queryFn: () => apiClient.getLeccionQuiz(leccionId!),
    enabled: !!leccionId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para crear una lección (Admin)
 */
export const useCreateLeccion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leccionData: Partial<Leccion>) =>
      apiClient.post('/lecciones', leccionData),
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['lecciones'] });
      if (variables.modulo_id) {
        queryClient.invalidateQueries({ queryKey: ['lecciones', { modulo_id: variables.modulo_id }] });
      }
    },
  });
};

/**
 * Hook para actualizar una lección (Admin)
 */
export const useUpdateLeccion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leccionId, leccionData }: { leccionId: string; leccionData: Partial<Leccion> }) =>
      apiClient.put(`/lecciones/${leccionId}`, leccionData),
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['leccion', variables.leccionId] });
      queryClient.invalidateQueries({ queryKey: ['lecciones'] });
      queryClient.invalidateQueries({ queryKey: ['leccion', variables.leccionId, 'contenido'] });
    },
  });
};

/**
 * Hook para eliminar una lección (Admin)
 */
export const useDeleteLeccion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leccionId: string) =>
      apiClient.delete(`/lecciones/${leccionId}`),
    onSuccess: () => {
      // Invalidar lista de lecciones
      queryClient.invalidateQueries({ queryKey: ['lecciones'] });
    },
  });
};

