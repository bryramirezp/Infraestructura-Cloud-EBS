/**
 * Schemas Zod para validación de entidades de Quiz
 */

import { z } from 'zod';

/**
 * Schema para crear un quiz
 */
export const quizSchema = z.object({
  leccion_id: z.string().uuid('El leccion_id debe ser un UUID válido'),
  titulo: z
    .string()
    .min(1, 'El título es requerido')
    .max(200, 'El título no puede exceder 200 caracteres'),
  publicado: z.boolean(),
  aleatorio: z.boolean(),
  guarda_calificacion: z.boolean(),
});

