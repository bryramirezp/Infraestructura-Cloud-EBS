/**
 * Entidad: Notificación
 * Sistema de notificaciones para usuarios
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

/**
 * Notificación individual
 */
export interface Notificacion {
  id: string; // UUID
  usuario_id: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  titulo: string;
  mensaje: string;
  leida: boolean;
  link?: string | null;
  creado_en: string;
}
