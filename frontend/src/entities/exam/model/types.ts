/**
 * Entidad: Examen Final
 * Exámenes finales asociados a cursos (materias)
 */

/**
 * Examen Final base
 */
export interface ExamenFinal {
  id: string; // UUID
  curso_id: string;
  titulo: string;
  publicado: boolean;
  aleatorio: boolean;
  guarda_calificacion: boolean;
  creado_en: string;
  actualizado_en: string;
}

