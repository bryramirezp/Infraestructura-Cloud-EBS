/**
 * Schemas Zod para validación de entidades de Usuario
 */

import { z } from 'zod';

/**
 * Schema para crear un usuario
 */
export const usuarioSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(120, 'El nombre no puede exceder 120 caracteres'),
  apellido: z
    .string()
    .min(1, 'El apellido es requerido')
    .max(120, 'El apellido no puede exceder 120 caracteres'),
  email: z
    .string()
    .email('El email debe ser válido')
    .max(190, 'El email no puede exceder 190 caracteres'),
  avatar_url: z.string().url('El avatar_url debe ser una URL válida').nullable().optional(),
  cognito_user_id: z.string().max(255, 'El cognito_user_id no puede exceder 255 caracteres').nullable().optional(),
});

/**
 * Schema para actualizar un usuario
 */
export const actualizarUsuarioSchema = usuarioSchema.partial();

