/**
 * Entidad: Quiz
 * Cuestionarios asociados a lecciones
 */

/**
 * Quiz base
 */
export interface Quiz {
  id: string; // UUID
  leccion_id: string;
  titulo: string;
  publicado: boolean;
  aleatorio: boolean;
  guarda_calificacion: boolean;
  creado_en: string;
  actualizado_en: string;
}

