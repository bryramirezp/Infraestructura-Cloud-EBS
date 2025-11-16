/**
 * Schemas Zod para validación de entidades de Módulo
 */

import { z } from 'zod';

/**
 * Schema para crear un módulo
 */
export const moduloSchema = z.object({
  titulo: z
    .string()
    .min(1, 'El título es requerido')
    .max(200, 'El título no puede exceder 200 caracteres'),
  fecha_inicio: z.string().date('La fecha de inicio debe ser una fecha válida'),
  fecha_fin: z.string().date('La fecha de fin debe ser una fecha válida'),
  publicado: z.boolean(),
}).refine(
  (data) => new Date(data.fecha_fin) >= new Date(data.fecha_inicio),
  {
    message: 'La fecha de fin debe ser posterior o igual a la fecha de inicio',
    path: ['fecha_fin'],
  }
);

/**
 * Schema para actualizar un módulo
 */
export const actualizarModuloSchema = moduloSchema.partial();

