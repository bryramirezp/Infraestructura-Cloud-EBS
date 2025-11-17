/**
 * Hooks React Query para la entidad Notificación
 * 
 * Proporciona hooks para gestionar preferencias de notificación usando React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import type { PreferenciaNotificacion } from '../model/types';

/**
 * Hook para obtener preferencias de notificación del usuario autenticado
 */
export const usePreferenciasNotificacion = () => {
  return useQuery<PreferenciaNotificacion>({
    queryKey: ['preferencias', 'notificacion'],
    queryFn: () => apiClient.get('/preferencias/notificacion'),
    staleTime: 5 * 60 * 1000, // Cache válido por 5 minutos
  });
};

/**
 * Hook para actualizar preferencias de notificación del usuario autenticado
 */
export const useActualizarPreferenciasNotificacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferenciasData: Partial<PreferenciaNotificacion>) =>
      apiClient.put('/preferencias/notificacion', preferenciasData),
    onSuccess: () => {
      // Invalidar preferencias para refrescar
      queryClient.invalidateQueries({ queryKey: ['preferencias', 'notificacion'] });
    },
  });
};
