/**
 * Hooks React Query para la entidad Usuario
 * 
 * Proporciona hooks para obtener y gestionar usuarios usando React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import type { Usuario, Rol, UsuarioRol } from '../model/types';

/**
 * Filtros para listar usuarios (Admin)
 */
export interface UsuariosFilters {
  role?: string;
  email?: string;
}

/**
 * Hook para obtener lista de usuarios (Admin)
 */
export const useUsuarios = (filters?: UsuariosFilters) => {
  return useQuery<Usuario[]>({
    queryKey: ['usuarios', filters],
    queryFn: () => apiClient.getUsuarios(filters),
    staleTime: 5 * 60 * 1000, // Cache válido por 5 minutos
  });
};

/**
 * Hook para obtener un usuario por ID
 */
export const useUsuario = (usuarioId: string | null | undefined) => {
  return useQuery<Usuario>({
    queryKey: ['usuario', usuarioId],
    queryFn: () => apiClient.getUsuarioById(usuarioId!),
    enabled: !!usuarioId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener el perfil del usuario autenticado
 */
export const useUsuarioPerfil = () => {
  return useQuery<Usuario>({
    queryKey: ['usuario', 'perfil'],
    queryFn: () => apiClient.getUsuarioPerfil(),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para actualizar el perfil del usuario autenticado
 */
export const useActualizarUsuarioPerfil = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (perfilData: Partial<Usuario>) =>
      apiClient.actualizarUsuarioPerfil(perfilData),
    onSuccess: () => {
      // Invalidar perfil y lista de usuarios
      queryClient.invalidateQueries({ queryKey: ['usuario', 'perfil'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};

/**
 * Hook para obtener roles de un usuario (Admin)
 */
export const useUsuarioRoles = (usuarioId: string | null | undefined) => {
  return useQuery<UsuarioRol[]>({
    queryKey: ['usuario', usuarioId, 'roles'],
    queryFn: () => apiClient.getUsuarioRoles(usuarioId!),
    enabled: !!usuarioId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para asignar un rol a un usuario (Admin)
 */
export const useAsignarRolUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ usuarioId, rolId }: { usuarioId: string; rolId: string }) =>
      apiClient.asignarRolUsuario(usuarioId, rolId),
    onSuccess: (_, variables) => {
      // Invalidar roles del usuario y lista de usuarios
      queryClient.invalidateQueries({ queryKey: ['usuario', variables.usuarioId, 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};

/**
 * Hook para eliminar un rol de un usuario (Admin)
 */
export const useEliminarRolUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ usuarioId, rolId }: { usuarioId: string; rolId: string }) =>
      apiClient.eliminarRolUsuario(usuarioId, rolId),
    onSuccess: (_, variables) => {
      // Invalidar roles del usuario y lista de usuarios
      queryClient.invalidateQueries({ queryKey: ['usuario', variables.usuarioId, 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};
