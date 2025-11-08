import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { cn } from '@/shared/lib/utils';
import { Users, TrendingUp, Clock, Award } from 'lucide-react';

export interface CourseReportData {
  /**
   * ID del curso
   */
  id?: number;
  
  /**
   * Nombre del curso
   */
  name: string;
  
  /**
   * Tasa de finalización (0-100)
   */
  completionRate: number;
  
  /**
   * Calificación promedio (0-100)
   */
  averageGrade: number;
  
  /**
   * Total de estudiantes
   */
  totalStudents: number;
  
  /**
   * Tiempo promedio de finalización
   */
  averageTime?: string;
}

export interface StudentReportData {
  /**
   * ID del estudiante
   */
  id?: number;
  
  /**
   * Nombre del estudiante
   */
  name: string;
  
  /**
   * Progreso general (0-100)
   */
  progress: number;
  
  /**
   * Cursos completados
   */
  coursesCompleted: number;
  
  /**
   * Calificación promedio (0-100)
   */
  averageGrade: number;
  
  /**
   * Última actividad (fecha ISO)
   */
  lastActivity: string;
}

export type ReportCardProps = 
  | {
      type: 'course';
      data: CourseReportData;
      variant?: 'default' | 'compact';
      showProgress?: boolean;
      onClick?: () => void;
      className?: string;
    }
  | {
      type: 'student';
      data: StudentReportData;
      variant?: 'default' | 'compact';
      showProgress?: boolean;
      onClick?: () => void;
      className?: string;
    };

/**
 * Widget de tarjeta de reporte
 * 
 * Muestra información de reportes de cursos o estudiantes de forma reutilizable
 * 
 * @example
 * ```tsx
 * // Reporte de curso
 * <ReportCard
 *   type="course"
 *   data={{
 *     name: "Génesis - Creación",
 *     completionRate: 85,
 *     averageGrade: 88,
 *     totalStudents: 45,
 *     averageTime: "3.2 semanas"
 *   }}
 * />
 * 
 * // Reporte de estudiante
 * <ReportCard
 *   type="student"
 *   data={{
 *     name: "María González",
 *     progress: 95,
 *     coursesCompleted: 3,
 *     averageGrade: 92,
 *     lastActivity: "2025-01-15"
 *   }}
 * />
 * ```
 */
export const ReportCard: React.FC<ReportCardProps> = ({
  type,
  data,
  variant = 'default',
  showProgress = true,
  onClick,
  className
}) => {
  if (type === 'course') {
    const courseData = data as CourseReportData;
    
    return (
      <div
        className={cn(
          "border-b border-border pb-4 last:border-b-0 last:pb-0",
          variant === 'compact' && "pb-3",
          onClick && "cursor-pointer hover:bg-accent/50 rounded-lg p-2 -m-2 transition-colors",
          className
        )}
        onClick={onClick}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-foreground">{courseData.name}</h4>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{courseData.totalStudents} alumnos</span>
          </div>
        </div>
        
        <div className={cn(
          "grid gap-4 text-sm",
          variant === 'compact' ? "grid-cols-2" : "grid-cols-3"
        )}>
          <div>
            <div className="text-muted-foreground text-xs">Finalización</div>
            <div className="font-medium text-foreground">{courseData.completionRate}%</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Calificación</div>
            <div className="font-medium text-foreground">{courseData.averageGrade}%</div>
          </div>
          {variant !== 'compact' && courseData.averageTime && (
            <div>
              <div className="text-muted-foreground text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Tiempo Promedio
              </div>
              <div className="font-medium text-foreground">{courseData.averageTime}</div>
            </div>
          )}
        </div>
        
        {showProgress && (
          <div className="mt-3">
            <Progress value={courseData.completionRate} className="h-2" />
          </div>
        )}
      </div>
    );
  }

  // Student report
  const studentData = data as StudentReportData;
  
  return (
    <div
      className={cn(
        "border-b border-border pb-4 last:border-b-0 last:pb-0",
        variant === 'compact' && "pb-3",
        onClick && "cursor-pointer hover:bg-accent/50 rounded-lg p-2 -m-2 transition-colors",
        className
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-foreground">{studentData.name}</h4>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Award className="h-4 w-4" />
          <span>
            {studentData.coursesCompleted} curso{studentData.coursesCompleted !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      <div className={cn(
        "grid gap-4 text-sm mb-2",
        variant === 'compact' ? "grid-cols-2" : "grid-cols-2"
      )}>
        <div>
          <div className="text-muted-foreground text-xs">Progreso General</div>
          <div className="font-medium text-foreground">{studentData.progress}%</div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">Calificación Promedio</div>
          <div className="font-medium text-foreground">{studentData.averageGrade}%</div>
        </div>
      </div>
      
      <div className="flex justify-between items-center gap-2">
        {showProgress && (
          <Progress value={studentData.progress} className="flex-1 max-w-[75%] h-2" />
        )}
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Última actividad: {new Date(studentData.lastActivity).toLocaleDateString('es-ES')}
        </span>
      </div>
    </div>
  );
};

/**
 * Widget de contenedor de reportes
 * 
 * Contenedor para múltiples ReportCard con título y acciones
 */
export interface ReportCardContainerProps {
  /**
   * Título del contenedor
   */
  title: string;
  
  /**
   * Descripción opcional
   */
  description?: string;
  
  /**
   * Reportes de cursos
   */
  courseReports?: CourseReportData[];
  
  /**
   * Reportes de estudiantes
   */
  studentReports?: StudentReportData[];
  
  /**
   * Variante de visualización
   */
  variant?: 'default' | 'compact';
  
  /**
   * Si se debe mostrar el progreso
   */
  showProgress?: boolean;
  
  /**
   * Acciones del header (botones, etc.)
   */
  actions?: React.ReactNode;
  
  /**
   * Callback cuando se hace click en un reporte
   */
  onReportClick?: (type: 'course' | 'student', id?: number) => void;
  
  /**
   * Clase CSS adicional
   */
  className?: string;
}

export const ReportCardContainer: React.FC<ReportCardContainerProps> = ({
  title,
  description,
  courseReports,
  studentReports,
  variant = 'default',
  showProgress = true,
  actions,
  onReportClick,
  className
}) => {
  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {courseReports && courseReports.map((report, index) => (
            <ReportCard
              key={report.id || index}
              type="course"
              data={report}
              variant={variant}
              showProgress={showProgress}
              onClick={() => onReportClick?.('course', report.id)}
            />
          ))}
          
          {studentReports && studentReports.map((report, index) => (
            <ReportCard
              key={report.id || index}
              type="student"
              data={report}
              variant={variant}
              showProgress={showProgress}
              onClick={() => onReportClick?.('student', report.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

