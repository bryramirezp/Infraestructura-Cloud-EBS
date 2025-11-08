/**
 * Entidad: Tarea/Asignación
 */

export type AssignmentStatus = 'pendiente' | 'en_progreso' | 'entregado' | 'calificado';
export type AssignmentPriority = 'alta' | 'media' | 'baja';
export type AssignmentType = 'tarea' | 'proyecto' | 'ensayo' | 'práctica';

/**
 * Tarea base
 */
export interface Assignment {
  id: number;
  title: string;
  description: string;
  type: AssignmentType;
  priority: AssignmentPriority;
  
  // Relaciones
  courseId: number;
  courseName?: string;
  moduleId?: number;
  moduleName?: string;
  studentId?: number;
  studentName?: string;
  
  // Fechas
  assignedDate: string;
  dueDate: string;
  submissionDate?: string;
  
  // Estado
  status: AssignmentStatus;
  
  // Evaluación
  maxGrade: number; // Calificación máxima (ej: 100)
  weight: number; // Ponderación (ej: 30%)
  grade?: number; // Calificación obtenida
  feedback?: string;
  
  // Archivos
  attachments?: string[]; // URLs de archivos adjuntos
  submittedFiles?: string[]; // Archivos entregados por el alumno
}

/**
 * Tarea procesada (con datos calculados)
 */
export interface ProcessedAssignment extends Assignment {
  daysUntil: number;
  isOverdue: boolean;
  formattedDueDate: string;
  progressPercentage: number;
}

/**
 * Tarea para formularios
 */
export interface AssignmentFormData {
  title: string;
  description: string;
  type: AssignmentType;
  priority: AssignmentPriority;
  courseId: number;
  studentId?: number; // Si es null, se asigna a todos los alumnos del curso
  dueDate: string;
  maxGrade: number;
  weight: number;
  attachments?: string[];
}