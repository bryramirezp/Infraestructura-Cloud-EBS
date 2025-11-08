/**
 * Widget: CourseCard
 * Tarjeta de curso reutilizable con información y progreso
 * 
 * @module widgets/course/CourseCard
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { Button } from '@/shared/ui/button';
import { BookOpen, Clock, Users, ArrowRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Course, CourseWithProgress } from '@/entities/course';

/**
 * Variantes de visualización de la tarjeta
 */
export type CourseCardVariant = 'default' | 'compact' | 'detailed';

/**
 * Props del componente CourseCard
 */
export interface CourseCardProps {
  /**
   * Datos del curso
   */
  course: Course | CourseWithProgress;
  
  /**
   * Variante de visualización
   * @default 'default'
   */
  variant?: CourseCardVariant;
  
  /**
   * Si mostrar la barra de progreso
   * @default true
   */
  showProgress?: boolean;
  
  /**
   * Si mostrar acciones (botones)
   * @default false
   */
  showActions?: boolean;
  
  /**
   * Callback cuando se hace clic en "Ver curso"
   */
  onView?: (courseId: number) => void;
  
  /**
   * Callback cuando se hace clic en "Inscribirse"
   */
  onEnroll?: (courseId: number) => void;
  
  /**
   * Clase CSS adicional
   */
  className?: string;
}

/**
 * Widget de tarjeta de curso
 * 
 * Tarjeta reutilizable para mostrar información de un curso con opciones de progreso y acciones
 * 
 * @example
 * ```tsx
 * <CourseCard
 *   course={course}
 *   variant="default"
 *   showProgress={true}
 *   showActions={true}
 *   onView={(id) => navigate(`/courses/${id}`)}
 *   onEnroll={(id) => handleEnroll(id)}
 * />
 * ```
 */
export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  variant = 'default',
  showProgress = true,
  showActions = false,
  onView,
  onEnroll,
  className
}) => {
  // Determinar si el curso tiene progreso
  const hasProgress = 'progress' in course;
  const progress = hasProgress ? (course as CourseWithProgress).progress : null;
  
  // Determinar variante de progreso para la barra
  const getProgressVariant = (progressValue: number): 'default' | 'success' | 'warning' => {
    if (progressValue >= 75) return 'success';
    if (progressValue >= 50) return 'default';
    return 'warning';
  };

  // Renderizado compacto
  if (variant === 'compact') {
    return (
      <Card className={cn("hover:shadow-lg transition-shadow flex flex-col", className)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold leading-tight">
              {course.name}
            </CardTitle>
            {hasProgress && progress && (
              <Badge variant="outline" className="flex-shrink-0">
                {progress.percentage}%
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow justify-end">
          <CardDescription className="mb-4">{course.coordinatorName || 'Sin instructor'}</CardDescription>
          {showProgress && hasProgress && progress && (
            <Progress 
              value={progress.percentage} 
              variant={getProgressVariant(progress.percentage)}
              className="w-full"
            />
          )}
        </CardContent>
      </Card>
    );
  }

  // Renderizado detallado
  if (variant === 'detailed') {
    return (
      <Card className={cn("hover:shadow-lg transition-all duration-300 flex flex-col", className)}>
        {course.imageUrl && (
          <div className="w-full h-48 bg-muted rounded-t-lg overflow-hidden">
            <img 
              src={course.imageUrl} 
              alt={course.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-xl">{course.name}</CardTitle>
              <CardDescription>{course.coordinatorName || course.coordinatorId}</CardDescription>
            </div>
            <Badge 
              variant={course.status === 'Publicado' ? 'default' : 'secondary'}
              className="flex-shrink-0"
            >
              {course.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow justify-between space-y-4">
          {/* Descripción */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
          
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{course.lessons} lecciones</span>
            </div>
            {course.studentsEnrolled !== undefined && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{course.studentsEnrolled} estudiantes</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{course.estimatedDuration}</span>
            </div>
          </div>

          {/* Progreso */}
          {showProgress && hasProgress && progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progreso del curso</span>
                <span className="font-semibold text-foreground">{progress.percentage}%</span>
              </div>
              <Progress 
                value={progress.percentage} 
                variant={getProgressVariant(progress.percentage)}
                className="h-2"
              />
              {progress.lessonsCompleted !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {progress.lessonsCompleted} de {course.lessons} lecciones completadas
                </p>
              )}
            </div>
          )}

          {/* Acciones */}
          {showActions && (
            <div className="flex gap-2 pt-2">
              {onView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(course.id)}
                  className="flex-1"
                >
                  Ver curso
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {onEnroll && !hasProgress && (
                <Button
                  size="sm"
                  onClick={() => onEnroll(course.id)}
                  className="flex-1"
                >
                  Inscribirse
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Renderizado por defecto (default)
  return (
    <Card className={cn("hover:shadow-lg transition-all duration-300 flex flex-col", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-xl">{course.name}</CardTitle>
            <CardDescription>{course.coordinatorName || `Coordinador ID: ${course.coordinatorId}`}</CardDescription>
          </div>
          <Badge 
            variant={course.status === 'Publicado' ? 'default' : 'secondary'}
            className="flex-shrink-0"
          >
            {course.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow justify-between">
        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>{course.lessons} lecciones</span>
          </div>
          {course.studentsEnrolled !== undefined && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{course.studentsEnrolled} estudiantes</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{course.estimatedDuration}</span>
          </div>
        </div>

        {/* Progreso */}
        {showProgress && hasProgress && progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progreso del curso</span>
              <span className="font-semibold text-foreground">{progress.percentage}%</span>
            </div>
            <Progress 
              value={progress.percentage} 
              variant={getProgressVariant(progress.percentage)}
              className="h-2"
            />
          </div>
        )}

        {/* Acciones */}
        {showActions && (
          <div className="flex gap-2 pt-4">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(course.id)}
                className="flex-1"
              >
                Ver curso
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {onEnroll && !hasProgress && (
              <Button
                size="sm"
                onClick={() => onEnroll(course.id)}
                className="flex-1"
              >
                Inscribirse
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

