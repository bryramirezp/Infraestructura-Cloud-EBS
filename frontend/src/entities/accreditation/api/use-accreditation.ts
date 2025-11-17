/**
 * Hooks React Query para la entidad Regla de Acreditación
 * 
 * Proporciona hooks para obtener y gestionar reglas de acreditación usando React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import type { ReglaAcreditacion } from '../model/types';

/**
 * Filtros para listar reglas de acreditación
 */
export interface ReglasAcreditacionFilters {
  curso_id?: string;
  quiz_id?: string;
  examen_final_id?: string;
  activa?: boolean;
}

/**
 * Hook para obtener lista de reglas de acreditación (Admin)
 */
export const useReglasAcreditacion = (filters?: ReglasAcreditacionFilters) => {
  return useQuery<ReglaAcreditacion[]>({
    queryKey: ['reglas-acreditacion', filters],
    queryFn: () => apiClient.getReglasAcreditacion(filters),
    staleTime: 5 * 60 * 1000, // Cache válido por 5 minutos
  });
};

/**
 * Hook para obtener reglas de acreditación de un curso
 */
export const useReglasByCurso = (cursoId: string | null | undefined) => {
  return useQuery<ReglaAcreditacion[]>({
    queryKey: ['reglas-acreditacion', { curso_id: cursoId }],
    queryFn: () => apiClient.getReglasByCurso(cursoId!),
    enabled: !!cursoId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para crear una regla de acreditación (Admin)
 */
export const useCreateReglaAcreditacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reglaData: Partial<ReglaAcreditacion>) =>
      apiClient.post('/reglas-acreditacion', reglaData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reglas-acreditacion'] });
    },
  });
};

/**
 * Hook para actualizar una regla de acreditación (Admin)
 */
export const useUpdateReglaAcreditacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reglaId, reglaData }: { reglaId: string; reglaData: Partial<ReglaAcreditacion> }) =>
      apiClient.put(`/reglas-acreditacion/${reglaId}`, reglaData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reglas-acreditacion'] });
      queryClient.invalidateQueries({ queryKey: ['reglas-acreditacion', { curso_id: variables.reglaData.curso_id }] });
    },
  });
};

/**
 * Hook para eliminar una regla de acreditación (Admin)
 */
export const useDeleteReglaAcreditacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reglaId: string) =>
      apiClient.delete(`/reglas-acreditacion/${reglaId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reglas-acreditacion'] });
    },
  });
};

