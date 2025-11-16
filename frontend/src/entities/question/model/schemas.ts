/**
 * Schemas Zod para validación de entidades de Pregunta
 */

import { z } from 'zod';

/**
 * Schema para crear una pregunta
 */
export const preguntaSchema = z
  .object({
    quiz_id: z.string().uuid().nullable().optional(),
    examen_final_id: z.string().uuid().nullable().optional(),
    enunciado: z
      .string()
      .min(1, 'El enunciado es requerido'),
    puntos: z.number().int().positive('Los puntos deben ser un número positivo').nullable().optional(),
    orden: z.number().int().positive('El orden debe ser un número positivo').nullable().optional(),
  })
  .refine(
    (data) => (data.quiz_id !== null && data.examen_final_id === null) || 
              (data.quiz_id === null && data.examen_final_id !== null),
    {
      message: 'Debe proporcionar quiz_id o examen_final_id, pero no ambos',
    }
  );

/**
 * Schema para crear configuración de pregunta
 */
export const preguntaConfigSchema = z
  .object({
    pregunta_id: z.string().uuid('El pregunta_id debe ser un UUID válido'),
    tipo: z.enum(['ABIERTA', 'OPCION_MULTIPLE', 'VERDADERO_FALSO'], {
      errorMap: () => ({ message: 'El tipo debe ser uno de: ABIERTA, OPCION_MULTIPLE, VERDADERO_FALSO' }),
    }),
    abierta_modelo_respuesta: z.string().nullable().optional(),
    om_seleccion_multiple: z.boolean(),
    om_min_selecciones: z.number().int().positive().nullable().optional(),
    om_max_selecciones: z.number().int().positive().nullable().optional(),
    vf_respuesta_correcta: z.boolean().nullable().optional(),
    penaliza_error: z.boolean(),
    puntos_por_opcion: z.number().int().positive().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.tipo === 'ABIERTA') {
        return data.abierta_modelo_respuesta !== null;
      }
      return true;
    },
    {
      message: 'Las preguntas abiertas requieren un modelo de respuesta',
      path: ['abierta_modelo_respuesta'],
    }
  )
  .refine(
    (data) => {
      if (data.tipo === 'VERDADERO_FALSO') {
        return data.vf_respuesta_correcta !== null;
      }
      return true;
    },
    {
      message: 'Las preguntas verdadero/falso requieren una respuesta correcta',
      path: ['vf_respuesta_correcta'],
    }
  )
  .refine(
    (data) => {
      if (data.tipo === 'OPCION_MULTIPLE') {
        return data.om_min_selecciones !== null && 
               data.om_max_selecciones !== null &&
               data.om_min_selecciones <= data.om_max_selecciones;
      }
      return true;
    },
    {
      message: 'Para opción múltiple, min_selecciones debe ser <= max_selecciones',
      path: ['om_min_selecciones'],
    }
  );

/**
 * Schema para crear una opción
 */
export const opcionSchema = z.object({
  pregunta_id: z.string().uuid('El pregunta_id debe ser un UUID válido'),
  texto: z
    .string()
    .min(1, 'El texto es requerido')
    .max(500, 'El texto no puede exceder 500 caracteres'),
  es_correcta: z.boolean().nullable().optional(),
  orden: z.number().int().positive('El orden debe ser un número positivo').nullable().optional(),
});

