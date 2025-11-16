/**
 * Entidad: Intento
 * Intentos de usuarios en quizzes y exámenes finales
 */

import type { ResultadoIntento } from '@/entities/question';

/**
 * Intento de quiz o examen final
 */
export interface Intento {
  id: string; // UUID
  usuario_id: string;
  quiz_id: string | null;
  examen_final_id: string | null;
  inscripcion_curso_id: string;
  numero_intento: number;
  puntaje: number | null; // NUMERIC(5,2)
  resultado: ResultadoIntento | null;
  iniciado_en: string;
  finalizado_en: string | null;
  permitir_nuevo_intento: boolean;
  creado_en: string;
  actualizado_en: string;
}

/**
 * Pregunta dentro de un intento
 */
export interface IntentoPregunta {
  id: string; // UUID
  intento_id: string;
  pregunta_id: string;
  puntos_maximos: number | null;
  orden: number | null;
  creado_en: string;
  actualizado_en: string;
}

/**
 * Respuesta a una pregunta en un intento
 */
export interface Respuesta {
  id: string; // UUID
  intento_pregunta_id: string;
  respuesta_texto: string | null;
  opcion_id: string | null;
  respuesta_bool: boolean | null;
  creado_en: string;
  actualizado_en: string;
}

