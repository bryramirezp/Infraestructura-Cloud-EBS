/**
 * Entidad: Pregunta
 * Preguntas de quizzes y exámenes finales
 */

export type TipoPregunta = 'ABIERTA' | 'OPCION_MULTIPLE' | 'VERDADERO_FALSO';
export type ResultadoIntento = 'APROBADO' | 'NO_APROBADO';

/**
 * Pregunta base
 */
export interface Pregunta {
  id: string; // UUID
  quiz_id: string | null;
  examen_final_id: string | null;
  enunciado: string;
  puntos: number | null;
  orden: number | null;
  creado_en: string;
  actualizado_en: string;
}

/**
 * Configuración de pregunta según su tipo
 */
export interface PreguntaConfig {
  pregunta_id: string;
  tipo: TipoPregunta;
  abierta_modelo_respuesta: string | null;
  om_seleccion_multiple: boolean;
  om_min_selecciones: number | null;
  om_max_selecciones: number | null;
  vf_respuesta_correcta: boolean | null;
  penaliza_error: boolean;
  puntos_por_opcion: number | null;
  creado_en: string;
  actualizado_en: string;
}

/**
 * Opción para preguntas de opción múltiple
 */
export interface Opcion {
  id: string; // UUID
  pregunta_id: string;
  texto: string;
  es_correcta: boolean | null;
  orden: number | null;
  creado_en: string;
  actualizado_en: string;
}

