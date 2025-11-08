/**
 * Entidad: Calificación
 */

export type GradeType = 'tarea' | 'examen' | 'proyecto' | 'participación' | 'final';
export type EvaluationStatus = 'pendiente' | 'calificado';

/**
 * Calificación base
 */
export interface Grade {
  id: number;
  studentId: number;
  studentName?: string;
  
  // Relaciones
  courseId: number;
  courseName?: string;
  moduleId?: number;
  moduleName?: string;
  assignmentId?: number;
  assignmentName?: string;
  
  // Evaluación
  type: GradeType;
  grade: number; // Calificación obtenida
  maxGrade: number; // Calificación máxima
  percentage: number; // Porcentaje (grade / maxGrade * 100)
  weight: number; // Ponderación en el curso/módulo
  
  // Metadatos
  evaluatedBy?: number; // ID del coordinador/profesor
  evaluatedByName?: string;
  evaluationDate: string;
  feedback?: string;
  
  // Estado
  status: EvaluationStatus;
}

/**
 * Resumen de calificaciones por curso
 */
export interface CourseGrades {
  courseId: number;
  courseName: string;
  studentId: number;
  grades: Grade[];
  average: number;
  weightedAverage: number;
  totalWeight: number;
  isPassed: boolean; // Si supera la nota mínima
  minGradeToPass: number;
}

/**
 * Resumen de calificaciones por módulo
 */
export interface ModuleGrades {
  moduleId: number;
  moduleName: string;
  studentId: number;
  courseGrades: CourseGrades[];
  average: number;
  weightedAverage: number;
  isPassed: boolean;
  minGradeToPass: number;
}