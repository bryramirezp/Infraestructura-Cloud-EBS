/**
 * Hooks React Query para la entidad Progreso
 * 
 * Proporciona hooks para obtener y consultar progreso usando React Query
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import type { 
  CourseProgress, 
  ModuleProgress, 
  StudentProgressSummary,
  InscripcionModuloCalculada 
} from '../model/types';

/**
 * Hook para obtener progreso general de un usuario
 */
export const useProgresoUsuario = (usuarioId: string | null | undefined) => {
  return useQuery<StudentProgressSummary>({
    queryKey: ['progreso', 'usuario', usuarioId],
    queryFn: () => apiClient.getProgresoUsuario(usuarioId!),
    enabled: !!usuarioId,
    staleTime: 2 * 60 * 1000, // Cache corto (progreso cambia frecuentemente)
  });
};

/**
 * Hook para obtener progreso en un curso específico
 */
export const useProgresoCurso = (
  cursoId: string | null | undefined,
  usuarioId?: string | null | undefined
) => {
  return useQuery<CourseProgress>({
    queryKey: ['progreso', 'curso', cursoId, usuarioId],
    queryFn: () => apiClient.getCursoProgreso(cursoId!),
    enabled: !!cursoId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook para obtener progreso en un módulo
 * Usa la vista inscripcion_modulo_calculada
 */
export const useProgresoModulo = (
  moduloId: string | null | undefined,
  usuarioId?: string | null | undefined
) => {
  return useQuery<InscripcionModuloCalculada>({
    queryKey: ['progreso', 'modulo', moduloId, usuarioId],
    queryFn: () => apiClient.get(`/modulos/${moduloId}/progreso`, { usuario_id: usuarioId }),
    enabled: !!moduloId,
    staleTime: 2 * 60 * 1000,
  });
};

