/**
 * Entidad: Curso (Materia)
 * Nota: En la base de datos se llama "curso" pero conceptualmente representa una "Materia"
 */

/**
 * Curso (Materia) base
 */
export interface Curso {
  id: string; // UUID
  titulo: string;
  descripcion: string | null;
  publicado: boolean;
  creado_en: string;
  actualizado_en: string;
}

/**
 * Guía de estudio asociada a un curso
 */
export interface GuiaEstudio {
  id: string; // UUID
  curso_id: string;
  titulo: string;
  url: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}
