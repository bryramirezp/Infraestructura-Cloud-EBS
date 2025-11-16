/**
 * Entidad: Foro
 * Comentarios en foros de lecciones
 */

/**
 * Comentario en el foro
 */
export interface ForoComentario {
  id: string; // UUID
  usuario_id: string;
  curso_id: string;
  leccion_id: string;
  contenido: string;
  creado_en: string;
  actualizado_en: string;
}

