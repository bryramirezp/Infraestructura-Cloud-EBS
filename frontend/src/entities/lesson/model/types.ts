/**
 * Entidad: Lección
 * Lecciones pertenecientes a módulos con contenido variado
 */

export type TipoContenido = 'TEXTO' | 'PDF' | 'VIDEO' | 'LINK';

/**
 * Lección base
 */
export interface Leccion {
  id: string; // UUID
  modulo_id: string;
  titulo: string;
  orden: number | null;
  publicado: boolean;
  creado_en: string;
  actualizado_en: string;
}

/**
 * Contenido de una lección
 */
export interface LeccionContenido {
  id: string; // UUID
  leccion_id: string;
  tipo: TipoContenido;
  titulo: string | null;
  descripcion: string | null;
  url: string | null;
  orden: number | null;
  creado_en: string;
  actualizado_en: string;
}

