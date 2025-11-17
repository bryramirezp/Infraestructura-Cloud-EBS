/**
 * Hooks React Query para la entidad Inscripción
 * 
 * Proporciona hooks para obtener y gestionar inscripciones usando React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import type { InscripcionCurso, EstadoInscripcion } from '../model/types';

/**
 * Filtros para listar inscripciones
 */
export interface InscripcionesFilters {
  usuario_id?: string;
  curso_id?: string;
  estado?: EstadoInscripcion;
}

/**
 * Hook para obtener lista de inscripciones
 */
export const useInscripciones = (filters?: InscripcionesFilters) => {
  return useQuery<InscripcionCurso[]>({
    queryKey: ['inscripciones', filters],
    queryFn: () => apiClient.getInscripciones(filters),
    staleTime: 2 * 60 * 1000, // Cache más corto (datos cambian frecuentemente)
  });
};

/**
 * Hook para obtener una inscripción por ID
 */
export const useInscripcion = (inscripcionId: string | null | undefined) => {
  return useQuery<InscripcionCurso>({
    queryKey: ['inscripcion', inscripcionId],
    queryFn: () => apiClient.getInscripcionById(inscripcionId!),
    enabled: !!inscripcionId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook para obtener inscripciones de un usuario
 */
export const useInscripcionesByUsuario = (usuarioId: string | null | undefined) => {
  return useQuery<InscripcionCurso[]>({
    queryKey: ['inscripciones', { usuario_id: usuarioId }],
    queryFn: () => apiClient.getInscripcionesByUsuario(usuarioId!),
    enabled: !!usuarioId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook para obtener inscripciones de un curso
 */
export const useInscripcionesByCurso = (cursoId: string | null | undefined) => {
  return useQuery<InscripcionCurso[]>({
    queryKey: ['inscripciones', { curso_id: cursoId }],
    queryFn: () => apiClient.getInscripcionesByCurso(cursoId!),
    enabled: !!cursoId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook para actualizar el estado de una inscripción
 * Permite pausar, reanudar, concluir o reprobar
 */
export const useActualizarEstadoInscripcion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ inscripcionId, estado }: { inscripcionId: string; estado: EstadoInscripcion }) =>
      apiClient.actualizarEstadoInscripcion(inscripcionId, estado),
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['inscripcion', variables.inscripcionId] });
      queryClient.invalidateQueries({ queryKey: ['inscripciones'] });
      // Invalidar progreso del curso relacionado
      queryClient.invalidateQueries({ queryKey: ['curso'] });
      queryClient.invalidateQueries({ queryKey: ['curso', 'progreso'] });
    },
  });
};

/**
 * Hook para pausar una inscripción
 */
export const usePausarInscripcion = () => {
  const actualizarEstado = useActualizarEstadoInscripcion();

  return {
    ...actualizarEstado,
    mutate: (inscripcionId: string) => {
      actualizarEstado.mutate({ inscripcionId, estado: 'PAUSADA' });
    },
    mutateAsync: (inscripcionId: string) => {
      return actualizarEstado.mutateAsync({ inscripcionId, estado: 'PAUSADA' });
    },
  };
};

/**
 * Hook para reanudar una inscripción (cambiar de PAUSADA a ACTIVA)
 */
export const useReanudarInscripcion = () => {
  const actualizarEstado = useActualizarEstadoInscripcion();

  return {
    ...actualizarEstado,
    mutate: (inscripcionId: string) => {
      actualizarEstado.mutate({ inscripcionId, estado: 'ACTIVA' });
    },
    mutateAsync: (inscripcionId: string) => {
      return actualizarEstado.mutateAsync({ inscripcionId, estado: 'ACTIVA' });
    },
  };
};

