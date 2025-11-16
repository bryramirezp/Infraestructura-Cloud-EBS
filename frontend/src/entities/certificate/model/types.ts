/**
 * Entidad: Certificado
 * Certificados emitidos para inscripciones acreditadas
 */

/**
 * Certificado base
 */
export interface Certificado {
  id: string; // UUID
  inscripcion_curso_id: string;
  quiz_id: string | null;
  examen_final_id: string | null;
  intento_id: string | null;
  folio: string | null;
  hash_verificacion: string | null; // UNIQUE
  s3_key: string | null;
  emitido_en: string;
  valido: boolean;
  creado_en: string;
  actualizado_en: string;
}
