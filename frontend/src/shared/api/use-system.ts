/**
 * Hooks React Query para Sistema
 * 
 * Proporciona hooks para endpoints del sistema (health check, versión, etc.)
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from './api-client';

/**
 * Hook para verificar el estado de salud del sistema
 */
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['sistema', 'health'],
    queryFn: () => apiClient.healthCheck(),
    staleTime: 1 * 60 * 1000, // Cache válido por 1 minuto
    refetchInterval: 30 * 1000, // Refrescar cada 30 segundos en producción
  });
};

/**
 * Hook para obtener la versión del sistema
 */
export const useVersion = () => {
  return useQuery({
    queryKey: ['sistema', 'version'],
    queryFn: () => apiClient.getVersion(),
    staleTime: 30 * 60 * 1000, // Cache largo (versión cambia raramente)
  });
};

