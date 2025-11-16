/**
 * Entidad: Notificación
 * Preferencias de notificación de usuarios
 */

/**
 * Preferencias de notificación de un usuario
 */
export interface PreferenciaNotificacion {
  id: string; // UUID
  usuario_id: string; // UNIQUE
  email_recordatorios: boolean | null;
  email_motivacion: boolean | null;
  email_resultados: boolean | null;
  actualizado_en: string;
}

