/**
 * Schemas Zod para validación de entidades de Inscripción
 */

import { z } from 'zod';

/**
 * Schema para crear una inscripción a un curso
 */
export const inscripcionCursoSchema = z.object({
  usuario_id: z.string().uuid('El usuario_id debe ser un UUID válido'),
  curso_id: z.string().uuid('El curso_id debe ser un UUID válido'),
  estado: z.enum(['ACTIVA', 'PAUSADA', 'CONCLUIDA', 'REPROBADA'], {
    errorMap: () => ({ message: 'El estado debe ser uno de: ACTIVA, PAUSADA, CONCLUIDA, REPROBADA' }),
  }),
  fecha_inscripcion: z.string().date('La fecha de inscripción debe ser una fecha válida'),
});

/**
 * Schema para actualizar el estado de una inscripción
 */
export const actualizarEstadoInscripcionSchema = z.object({
  estado: z.enum(['ACTIVA', 'PAUSADA', 'CONCLUIDA', 'REPROBADA'], {
    errorMap: () => ({ message: 'El estado debe ser uno de: ACTIVA, PAUSADA, CONCLUIDA, REPROBADA' }),
  }),
});

/**
 * Schema para validar una inscripción completa (con campos opcionales)
 */
export const inscripcionCursoCompletaSchema = inscripcionCursoSchema.extend({
  id: z.string().uuid().optional(),
  acreditado: z.boolean().optional(),
  acreditado_en: z.string().nullable().optional(),
  fecha_conclusion: z.string().date().nullable().optional(),
  creado_en: z.string().optional(),
  actualizado_en: z.string().optional(),
});

