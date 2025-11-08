/**
 * Entidad: Módulo
 * Un módulo contiene múltiples cursos relacionados
 */

import type { Course } from '@/entities/course';

export type ModuleStatus = 'Borrador' | 'Publicado' | 'Archivado';
export type ModuleLevel = 'Básico' | 'Intermedio' | 'Avanzado';

/**
 * Módulo base
 */
export interface Module {
  id: number;
  name: string;
  description: string;
  code: string; // Código único del módulo (ej: "MOD-001")
  level: ModuleLevel;
  status: ModuleStatus;
  imageUrl?: string;
  
  // Relaciones
  coordinatorId: number; // ID del coordinador
  coordinatorName?: string;
  courses: Course[]; // Cursos que contiene el módulo
  courseIds: number[]; // IDs de los cursos
  
  // Metadatos
  totalCourses: number;
  totalLessons: number;
  estimatedDuration: string; // Duración estimada (ej: "12 semanas")
  category: string;
  
  // Fechas
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  
  // Requisitos
  prerequisites?: number[]; // IDs de módulos previos requeridos
  minGradeToPass?: number; // Nota mínima para aprobar (ej: 7.0)
  
  // Estadísticas
  studentsEnrolled?: number;
  studentsCompleted?: number;
}

/**
 * Módulo con progreso del alumno
 */
export interface ModuleWithProgress extends Module {
  progress: {
    percentage: number;
    coursesCompleted: number;
    coursesInProgress: number;
    currentCourseId?: number;
    startDate?: string;
    completionDate?: string;
  };
}

/**
 * Módulo para formularios
 */
export interface ModuleFormData {
  name: string;
  description: string;
  code: string;
  level: ModuleLevel;
  status: ModuleStatus;
  imageUrl?: string;
  coordinatorId: number;
  courseIds: number[];
  estimatedDuration: string;
  category: string;
  prerequisites?: number[];
  minGradeToPass?: number;
}