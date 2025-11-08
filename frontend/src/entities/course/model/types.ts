/**
 * Entidad: Curso
 * Un curso individual que puede pertenecer a un módulo
 */

export type CourseStatus = 'Borrador' | 'Publicado' | 'Archivado';
export type CourseLevel = 'Básico' | 'Intermedio' | 'Avanzado';

/**
 * Curso base
 */
export interface Course {
  id: number;
  name: string;
  description: string;
  code: string; // Código único (ej: "CUR-001")
  level: CourseLevel;
  status: CourseStatus;
  imageUrl?: string;
  
  // Relaciones
  moduleId?: number; // ID del módulo al que pertenece (opcional)
  moduleName?: string;
  coordinatorId: number; // Coordinador responsable
  coordinatorName?: string;
  
  // Contenido
  lessons: number;
  assignments: number;
  exams: number;
  estimatedDuration: string; // Duración estimada (ej: "4 semanas")
  category: string;
  
  // Fechas
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  startDate?: string;
  endDate?: string;
  
  // Requisitos
  prerequisites?: number[]; // IDs de cursos previos
  minGradeToPass?: number; // Nota mínima para aprobar
  
  // Estadísticas
  studentsEnrolled?: number;
  studentsCompleted?: number;
  averageGrade?: number;
  
  // Certificación
  hasCertificate: boolean; // Si otorga certificado al completarlo
  certificateTemplateId?: number;
}

/**
 * Curso con progreso del alumno
 */
export interface CourseWithProgress extends Course {
  progress: {
    percentage: number;
    lessonsCompleted: number;
    assignmentsCompleted: number;
    assignmentsPending: number;
    examsCompleted: number;
    currentLessonId?: number;
    startDate?: string;
    completionDate?: string;
    grade?: number;
  };
}

/**
 * Curso para formularios
 */
export interface CourseFormData {
  name: string;
  description: string;
  code: string;
  level: CourseLevel;
  status: CourseStatus;
  imageUrl?: string;
  moduleId?: number;
  coordinatorId: number;
  lessons: number;
  estimatedDuration: string;
  category: string;
  prerequisites?: number[];
  minGradeToPass?: number;
  hasCertificate: boolean;
}