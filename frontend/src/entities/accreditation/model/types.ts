/**
 * Entidad: Regla de Acreditación
 * Reglas que definen los criterios de acreditación para cursos
 */

/**
 * Regla de acreditación
 */
export interface ReglaAcreditacion {
  id: string; // UUID
  curso_id: string;
  quiz_id: string | null;
  examen_final_id: string | null;
  min_score_aprobatorio: number; // NUMERIC(5,2), default 80.00
  max_intentos_quiz: number; // default 3
  bloquea_curso_por_reprobacion_quiz: boolean; // default TRUE
  activa: boolean; // default TRUE
  creado_en: string;
  actualizado_en: string;
}

