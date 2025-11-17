/**
 * Hooks React Query para la entidad Certificado
 * 
 * Proporciona hooks para obtener y gestionar certificados usando React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import type { Certificado } from '../model/types';

/**
 * Hook para obtener un certificado por ID
 */
export const useCertificado = (certificadoId: string | null | undefined) => {
  return useQuery<Certificado>({
    queryKey: ['certificado', certificadoId],
    queryFn: () => apiClient.getCertificadoById(certificadoId!),
    enabled: !!certificadoId,
    staleTime: 10 * 60 * 1000, // Cache largo (certificados no cambian frecuentemente)
  });
};

/**
 * Hook para obtener certificados de un usuario
 */
export const useCertificadosByUsuario = (usuarioId: string | null | undefined) => {
  return useQuery<Certificado[]>({
    queryKey: ['certificados', { usuario_id: usuarioId }],
    queryFn: () => apiClient.getCertificadosByUsuario(usuarioId!),
    enabled: !!usuarioId,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Hook para obtener certificado de una inscripción
 */
export const useCertificadoByInscripcion = (inscripcionId: string | null | undefined) => {
  return useQuery<Certificado>({
    queryKey: ['certificado', { inscripcion_curso_id: inscripcionId }],
    queryFn: () => apiClient.getCertificadoByInscripcion(inscripcionId!),
    enabled: !!inscripcionId,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Hook para descargar un certificado (obtiene URL prefirmada de S3)
 */
export const useDescargarCertificado = () => {
  return useMutation({
    mutationFn: (certificadoId: string) =>
      apiClient.descargarCertificado(certificadoId),
  });
};

/**
 * Hook para verificar un certificado por hash (público)
 */
export const useVerificarCertificado = (hash: string | null | undefined) => {
  return useQuery<Certificado>({
    queryKey: ['certificado', 'verificar', hash],
    queryFn: () => apiClient.verificarCertificado(hash!),
    enabled: !!hash,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Hook para generar un certificado (Admin/Backend automático)
 */
export const useGenerarCertificado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inscripcionId: string) =>
      apiClient.generarCertificado(inscripcionId),
    onSuccess: (_, inscripcionId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['certificados'] });
      queryClient.invalidateQueries({ queryKey: ['certificado', { inscripcion_curso_id: inscripcionId }] });
      queryClient.invalidateQueries({ queryKey: ['inscripcion', inscripcionId] });
    },
  });
};
