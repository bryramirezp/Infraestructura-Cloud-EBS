/**
 * Widget: CourseList
 * Lista de tarjetas de cursos con filtros
 * 
 * @module widgets/course/CourseList
 */

import React, { useMemo, useState } from 'react';
import { CourseCard, CourseCardProps } from './CourseCard';
import { Input } from '@/shared/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Course, CourseWithProgress } from '@/entities/course';

/**
 * Props del componente CourseList
 */
export interface CourseListProps {
  /**
   * Array de cursos a mostrar
   */
  courses: (Course | CourseWithProgress)[];
  
  /**
   * Variante de las tarjetas
   * @default 'default'
   */
  variant?: CourseCardProps['variant'];
  
  /**
   * Si mostrar progreso en las tarjetas
   * @default true
   */
  showProgress?: boolean;
  
  /**
   * Si mostrar acciones en las tarjetas
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
   * Si mostrar barra de búsqueda
   * @default true
   */
  searchable?: boolean;
  
  /**
   * Placeholder para el campo de búsqueda
   * @default "Buscar cursos..."
   */
  searchPlaceholder?: string;
  
  /**
   * Número de columnas en el grid
   * @default 3
   */
  columns?: 1 | 2 | 3 | 4;
  
  /**
   * Clase CSS adicional
   */
  className?: string;
}

/**
 * Widget de lista de cursos
 * 
 * Lista de tarjetas de cursos con búsqueda y grid responsive
 * 
 * @example
 * ```tsx
 * <CourseList
 *   courses={courses}
 *   variant="default"
 *   showProgress={true}
 *   showActions={true}
 *   onView={(id) => navigate(`/courses/${id}`)}
 *   columns={3}
 * />
 * ```
 */
export const CourseList: React.FC<CourseListProps> = ({
  courses,
  variant = 'default',
  showProgress = true,
  showActions = false,
  onView,
  onEnroll,
  searchable = true,
  searchPlaceholder = "Buscar cursos...",
  columns = 3,
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar cursos
  const filteredCourses = useMemo(() => {
    if (!searchTerm) return courses;
    
    return courses.filter(course =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.coordinatorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [courses, searchTerm]);

  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Barra de búsqueda */}
      {searchable && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Grid de cursos */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm ? 'No se encontraron cursos que coincidan con tu búsqueda' : 'No hay cursos disponibles'}
          </p>
        </div>
      ) : (
        <div className={cn("grid gap-4 md:gap-6", gridClasses[columns])}>
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              variant={variant}
              showProgress={showProgress}
              showActions={showActions}
              onView={onView}
              onEnroll={onEnroll}
            />
          ))}
        </div>
      )}
    </div>
  );
};

