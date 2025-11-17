/**
 * Hooks React Query para la entidad Curso (Materia)
 * 
 * Proporciona hooks para obtener y gestionar cursos usando React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import type { Curso, GuiaEstudio } from '../model/types';

/**
 * Filtros para listar cursos
 */
export interface CursosFilters {
  publicado?: boolean;
  modulo_id?: string;
}

/**
 * Hook para obtener lista de cursos
 */
export const useCursos = (filters?: CursosFilters) => {
  return useQuery<Curso[]>({
    queryKey: ['cursos', filters],
    queryFn: () => apiClient.getCursos(filters),
    staleTime: 5 * 60 * 1000, // Cache válido por 5 minutos
  });
};

/**
 * Hook para obtener un curso por ID
 */
export const useCurso = (cursoId: string | null | undefined) => {
  return useQuery<Curso>({
    queryKey: ['curso', cursoId],
    queryFn: () => apiClient.getCursoById(cursoId!),
    enabled: !!cursoId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener guías de estudio de un curso
 */
export const useGuiasEstudio = (cursoId: string | null | undefined, activo?: boolean) => {
  return useQuery<GuiaEstudio[]>({
    queryKey: ['curso', cursoId, 'guias-estudio', activo],
    queryFn: () => apiClient.getGuiasEstudio(cursoId!),
    enabled: !!cursoId,
    staleTime: 10 * 60 * 1000, // Cache más largo para guías
  });
};

/**
 * Hook para obtener el examen final de un curso
 */
export const useExamenFinalByCurso = (cursoId: string | null | undefined) => {
  return useQuery({
    queryKey: ['curso', cursoId, 'examen-final'],
    queryFn: () => apiClient.getExamenFinal(cursoId!),
    enabled: !!cursoId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener progreso de un curso
 */
export const useCursoProgreso = (cursoId: string | null | undefined) => {
  return useQuery({
    queryKey: ['curso', cursoId, 'progreso'],
    queryFn: () => apiClient.getCursoProgreso(cursoId!),
    enabled: !!cursoId,
    staleTime: 2 * 60 * 1000, // Cache más corto para progreso (cambia frecuentemente)
  });
};

/**
 * Hook para obtener estadísticas de un curso (Admin)
 */
export const useEstadisticasCurso = (cursoId: string | null | undefined) => {
  return useQuery({
    queryKey: ['curso', cursoId, 'estadisticas'],
    queryFn: () => apiClient.getEstadisticasCurso(cursoId!),
    enabled: !!cursoId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para inscribirse en un curso
 */
export const useInscribirEnCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cursoId: string) =>
      apiClient.inscribirEnCurso(cursoId),
    onSuccess: (_, cursoId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['inscripciones'] });
      queryClient.invalidateQueries({ queryKey: ['curso', cursoId] });
      queryClient.invalidateQueries({ queryKey: ['curso', cursoId, 'progreso'] });
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
    },
  });
};

/**
 * Hook para desinscribirse de un curso
 */
export const useDesinscribirDeCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cursoId: string) =>
      apiClient.desinscribirDeCurso(cursoId),
    onSuccess: (_, cursoId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['inscripciones'] });
      queryClient.invalidateQueries({ queryKey: ['curso', cursoId] });
      queryClient.invalidateQueries({ queryKey: ['curso', cursoId, 'progreso'] });
    },
  });
};

/**
 * Hook para crear un curso (Admin)
 */
export const useCreateCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cursoData: Partial<Curso>) =>
      apiClient.post('/cursos', cursoData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
    },
  });
};

/**
 * Hook para actualizar un curso (Admin)
 */
export const useUpdateCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cursoId, cursoData }: { cursoId: string; cursoData: Partial<Curso> }) =>
      apiClient.put(`/cursos/${cursoId}`, cursoData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['curso', variables.cursoId] });
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
    },
  });
};

/**
 * Hook para eliminar un curso (Admin)
 */
export const useDeleteCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cursoId: string) =>
      apiClient.delete(`/cursos/${cursoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
    },
  });
};

