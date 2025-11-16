/**
 * Schemas Zod para validación de entidades de Curso
 */

import { z } from 'zod';

/**
 * Schema para crear un curso (materia)
 */
export const cursoSchema = z.object({
  titulo: z
    .string()
    .min(1, 'El título es requerido')
    .max(200, 'El título no puede exceder 200 caracteres'),
  descripcion: z.string().nullable().optional(),
  publicado: z.boolean(),
});

/**
 * Schema para actualizar un curso
 */
export const actualizarCursoSchema = cursoSchema.partial();

/**
 * Schema para crear una guía de estudio
 */
export const guiaEstudioSchema = z.object({
  curso_id: z.string().uuid('El curso_id debe ser un UUID válido'),
  titulo: z
    .string()
    .min(1, 'El título es requerido')
    .max(200, 'El título no puede exceder 200 caracteres'),
  url: z.string().url('La URL debe ser válida').nullable().optional(),
  activo: z.boolean(),
});

