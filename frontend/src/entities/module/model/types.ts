/**
 * Entidad: Módulo
 * Módulos que contienen cursos (materias) relacionados
 */

export type EstadoPublicacion = 'PUBLICADO' | 'NO_PUBLICADO';

/**
 * Módulo base
 */
export interface Modulo {
  id: string; // UUID
  titulo: string;
  fecha_inicio: string; // DATE
  fecha_fin: string; // DATE
  publicado: boolean;
  creado_en: string;
  actualizado_en: string;
}

/**
 * Relación entre módulo y curso (materia)
 */
export interface ModuloCurso {
  id: string; // UUID
  modulo_id: string;
  curso_id: string;
  slot: number;
  creado_en: string;
  actualizado_en: string;
}
