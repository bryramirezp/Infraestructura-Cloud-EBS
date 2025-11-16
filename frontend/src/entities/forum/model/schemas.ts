/**
 * Schemas Zod para validación de entidades de Foro
 */

import { z } from 'zod';

/**
 * Schema para crear un comentario en el foro
 */
export const foroComentarioSchema = z.object({
  usuario_id: z.string().uuid('El usuario_id debe ser un UUID válido'),
  curso_id: z.string().uuid('El curso_id debe ser un UUID válido'),
  leccion_id: z.string().uuid('El leccion_id debe ser un UUID válido'),
  contenido: z
    .string()
    .min(1, 'El contenido no puede estar vacío')
    .max(5000, 'El contenido no puede exceder 5000 caracteres'),
});

/**
 * Schema para actualizar un comentario
 */
export const actualizarForoComentarioSchema = z.object({
  contenido: z
    .string()
    .min(1, 'El contenido no puede estar vacío')
    .max(5000, 'El contenido no puede exceder 5000 caracteres'),
});

