/**
 * Entidad: Progreso
 * Seguimiento del avance del alumno en cursos y módulos
 */

export type ProgressStatus = 'no_iniciado' | 'en_progreso' | 'completado' | 'abandonado';

/**
 * Progreso en un curso
 */
export interface CourseProgress {
  id: number;
  studentId: number;
  courseId: number;
  courseName?: string;
  
  // Estado
  status: ProgressStatus;
  
  // Progreso
  percentage: number; // Porcentaje de completitud (0-100)
  lessonsCompleted: number;
  totalLessons: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  examsCompleted: number;
  totalExams: number;
  
  // Fechas
  startDate?: string;
  lastActivityDate?: string;
  completionDate?: string;
  
  // Calificación
  currentGrade?: number;
  isPassed?: boolean;
  
  // Ubicación actual
  currentLessonId?: number;
  currentLessonName?: string;
}

/**
 * Progreso en un módulo
 */
export interface ModuleProgress {
  id: number;
  studentId: number;
  moduleId: number;
  moduleName?: string;
  
  // Estado
  status: ProgressStatus;
  
  // Progreso
  percentage: number; // Porcentaje de completitud del módulo
  coursesCompleted: number;
  totalCourses: number;
  coursesInProgress: number;
  
  // Fechas
  startDate?: string;
  lastActivityDate?: string;
  completionDate?: string;
  
  // Calificación
  currentGrade?: number;
  isPassed?: boolean;
  
  // Cursos del módulo con progreso
  courseProgresses: CourseProgress[];
  
  // Curso actual
  currentCourseId?: number;
  currentCourseName?: string;
}

/**
 * Resumen general de progreso del alumno
 */
export interface StudentProgressSummary {
  studentId: number;
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  totalModulesEnrolled: number;
  totalModulesCompleted: number;
  overallProgress: number; // Progreso general
  averageGrade: number;
  certificatesEarned: number;
  lastActivityDate?: string;
}