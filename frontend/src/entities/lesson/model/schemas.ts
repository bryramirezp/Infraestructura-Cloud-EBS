/**
 * Schemas Zod para validación de entidades de Lección
 */

import { z } from 'zod';

/**
 * Schema para crear una lección
 */
export const leccionSchema = z.object({
  modulo_id: z.string().uuid('El modulo_id debe ser un UUID válido'),
  titulo: z
    .string()
    .min(1, 'El título es requerido')
    .max(200, 'El título no puede exceder 200 caracteres'),
  orden: z.number().int().positive('El orden debe ser un número positivo').nullable().optional(),
  publicado: z.boolean(),
});

/**
 * Schema para crear contenido de lección
 */
export const leccionContenidoSchema = z.object({
  leccion_id: z.string().uuid('El leccion_id debe ser un UUID válido'),
  tipo: z.enum(['TEXTO', 'PDF', 'VIDEO', 'LINK'], {
    errorMap: () => ({ message: 'El tipo debe ser uno de: TEXTO, PDF, VIDEO, LINK' }),
  }),
  titulo: z.string().max(200, 'El título no puede exceder 200 caracteres').nullable().optional(),
  descripcion: z.string().nullable().optional(),
  url: z.string().url('La URL debe ser válida').nullable().optional(),
  orden: z.number().int().positive('El orden debe ser un número positivo').nullable().optional(),
});

