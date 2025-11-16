/**
 * Entidad: Usuario
 * Usuarios del sistema con roles y autenticación Cognito
 */

/**
 * Usuario base
 */
export interface Usuario {
  id: string; // UUID
  nombre: string;
  apellido: string;
  email: string; // UNIQUE
  avatar_url: string | null;
  cognito_user_id: string | null; // UNIQUE
  creado_en: string;
  actualizado_en: string;
}

/**
 * Rol del sistema
 */
export interface Rol {
  id: string; // UUID
  nombre: string; // UNIQUE (ej: 'ADMIN', 'ESTUDIANTE', 'INSTRUCTOR')
  creado_en: string;
  actualizado_en: string;
}

/**
 * Relación entre usuario y rol
 */
export interface UsuarioRol {
  id: string; // UUID
  usuario_id: string;
  rol_id: string;
  asignado_en: string;
}
