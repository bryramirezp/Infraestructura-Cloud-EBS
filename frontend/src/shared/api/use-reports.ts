/**
 * Hooks React Query para Reportes y Estadísticas
 * 
 * Proporciona hooks para obtener reportes y estadísticas usando React Query
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from './api-client';

/**
 * Hook para obtener estadísticas del dashboard (Admin/Dashboard)
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['reportes', 'dashboard'],
    queryFn: () => apiClient.getDashboardStats(),
    staleTime: 5 * 60 * 1000, // Cache válido por 5 minutos
  });
};

/**
 * Hook para obtener estadísticas de un curso (Admin)
 */
export const useEstadisticasCurso = (cursoId: string | null | undefined) => {
  return useQuery({
    queryKey: ['reportes', 'estadisticas', 'curso', cursoId],
    queryFn: () => apiClient.getEstadisticasCurso(cursoId!),
    enabled: !!cursoId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener comparación de grupo en un curso
 * Compara el progreso del usuario con otros estudiantes del curso
 */
export const useComparacionGrupo = (cursoId: string | null | undefined) => {
  return useQuery({
    queryKey: ['reportes', 'comparacion', 'grupo', 'curso', cursoId],
    queryFn: () => apiClient.getComparacionGrupo(cursoId!),
    enabled: !!cursoId,
    staleTime: 5 * 60 * 1000, // Cache más largo (comparación cambia menos)
  });
};

