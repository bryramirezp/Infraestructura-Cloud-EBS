/**
 * Schemas Zod para validación de entidades de Intento
 */

import { z } from 'zod';

/**
 * Schema para crear una respuesta
 * Valida que al menos uno de los campos de respuesta esté presente
 */
export const respuestaSchema = z
  .object({
    intento_pregunta_id: z.string().uuid('El intento_pregunta_id debe ser un UUID válido'),
    respuesta_texto: z.string().nullable().optional(),
    opcion_id: z.string().uuid().nullable().optional(),
    respuesta_bool: z.boolean().nullable().optional(),
  })
  .refine(
    (data) => data.respuesta_texto !== null || data.opcion_id !== null || data.respuesta_bool !== null,
    {
      message: 'Debe proporcionar al menos una respuesta (texto, opción o booleano)',
    }
  );

/**
 * Schema para crear un intento
 */
export const intentoSchema = z.object({
  usuario_id: z.string().uuid('El usuario_id debe ser un UUID válido'),
  quiz_id: z.string().uuid().nullable().optional(),
  examen_final_id: z.string().uuid().nullable().optional(),
  inscripcion_curso_id: z.string().uuid('El inscripcion_curso_id debe ser un UUID válido'),
}).refine(
  (data) => (data.quiz_id !== null && data.examen_final_id === null) || 
            (data.quiz_id === null && data.examen_final_id !== null),
  {
    message: 'Debe proporcionar quiz_id o examen_final_id, pero no ambos',
  }
);

/**
 * Schema para enviar un quiz o examen (con respuestas)
 */
export const enviarQuizSchema = z.object({
  respuestas: z.array(respuestaSchema).min(1, 'Debe proporcionar al menos una respuesta'),
});

