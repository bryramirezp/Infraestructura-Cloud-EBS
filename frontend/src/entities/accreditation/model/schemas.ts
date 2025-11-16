/**
 * Schemas Zod para validación de entidades de Regla de Acreditación
 */

import { z } from 'zod';

/**
 * Schema para crear una regla de acreditación
 */
export const reglaAcreditacionSchema = z
  .object({
    curso_id: z.string().uuid('El curso_id debe ser un UUID válido'),
    quiz_id: z.string().uuid().nullable().optional(),
    examen_final_id: z.string().uuid().nullable().optional(),
    min_score_aprobatorio: z
      .number()
      .min(0, 'El score mínimo debe ser mayor o igual a 0')
      .max(100, 'El score mínimo debe ser menor o igual a 100'),
    max_intentos_quiz: z
      .number()
      .int()
      .positive('El máximo de intentos debe ser un número positivo'),
    bloquea_curso_por_reprobacion_quiz: z.boolean(),
    activa: z.boolean(),
  })
  .refine(
    (data) => {
      const tieneQuiz = data.quiz_id !== null;
      const tieneExamen = data.examen_final_id !== null;
      const sinEspecificar = data.quiz_id === null && data.examen_final_id === null;
      
      return (tieneQuiz && !tieneExamen) || (!tieneQuiz && tieneExamen) || sinEspecificar;
    },
    {
      message: 'No se puede especificar tanto quiz_id como examen_final_id al mismo tiempo',
    }
  );

