/**
 * Hooks React Query para la entidad Módulo
 * 
 * Proporciona hooks para obtener y gestionar módulos usando React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import type { Modulo, ModuloCurso } from '../model/types';

/**
 * Filtros para listar módulos
 */
export interface ModulosFilters {
  publicado?: boolean;
}

/**
 * Hook para obtener lista de módulos
 */
export const useModulos = (filters?: ModulosFilters) => {
  return useQuery<Modulo[]>({
    queryKey: ['modulos', filters],
    queryFn: () => apiClient.getModulos(filters),
    staleTime: 5 * 60 * 1000, // Cache válido por 5 minutos
  });
};

/**
 * Hook para obtener un módulo por ID
 */
export const useModulo = (moduloId: string | null | undefined) => {
  return useQuery<Modulo>({
    queryKey: ['modulo', moduloId],
    queryFn: () => apiClient.getModuloById(moduloId!),
    enabled: !!moduloId, // Solo ejecutar si hay moduloId
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener los cursos de un módulo
 */
export const useCursosByModulo = (moduloId: string | null | undefined) => {
  return useQuery<ModuloCurso[]>({
    queryKey: ['modulo', moduloId, 'cursos'],
    queryFn: () => apiClient.getCursosByModulo(moduloId!),
    enabled: !!moduloId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para crear un módulo (Admin)
 */
export const useCreateModulo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (moduloData: Partial<Modulo>) =>
      apiClient.post('/modulos', moduloData),
    onSuccess: () => {
      // Invalidar lista de módulos para refrescar
      queryClient.invalidateQueries({ queryKey: ['modulos'] });
    },
  });
};

/**
 * Hook para actualizar un módulo (Admin)
 */
export const useUpdateModulo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ moduloId, moduloData }: { moduloId: string; moduloData: Partial<Modulo> }) =>
      apiClient.put(`/modulos/${moduloId}`, moduloData),
    onSuccess: (_, variables) => {
      // Invalidar módulo específico y lista
      queryClient.invalidateQueries({ queryKey: ['modulo', variables.moduloId] });
      queryClient.invalidateQueries({ queryKey: ['modulos'] });
      queryClient.invalidateQueries({ queryKey: ['modulo', variables.moduloId, 'cursos'] });
    },
  });
};

/**
 * Hook para eliminar un módulo (Admin)
 */
export const useDeleteModulo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (moduloId: string) =>
      apiClient.delete(`/modulos/${moduloId}`),
    onSuccess: () => {
      // Invalidar lista de módulos
      queryClient.invalidateQueries({ queryKey: ['modulos'] });
    },
  });
};

