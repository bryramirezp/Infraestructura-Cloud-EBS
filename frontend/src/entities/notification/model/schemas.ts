/**
 * Schemas Zod para validación de entidades de Notificación
 */

import { z } from 'zod';

/**
 * Schema para crear o actualizar preferencias de notificación
 */
export const preferenciaNotificacionSchema = z.object({
  usuario_id: z.string().uuid('El usuario_id debe ser un UUID válido'),
  email_recordatorios: z.boolean().nullable().optional(),
  email_motivacion: z.boolean().nullable().optional(),
  email_resultados: z.boolean().nullable().optional(),
});

