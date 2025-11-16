/**
 * Entidad: Inscripción
 * Inscripciones de usuarios a cursos (materias)
 */

export type EstadoInscripcion = 'ACTIVA' | 'PAUSADA' | 'CONCLUIDA' | 'REPROBADA';

/**
 * Inscripción a un curso
 */
export interface InscripcionCurso {
  id: string; // UUID
  usuario_id: string;
  curso_id: string;
  estado: EstadoInscripcion;
  acreditado: boolean;
  acreditado_en: string | null;
  fecha_inscripcion: string; // DATE
  fecha_conclusion: string | null; // DATE
  creado_en: string;
  actualizado_en: string;
}

