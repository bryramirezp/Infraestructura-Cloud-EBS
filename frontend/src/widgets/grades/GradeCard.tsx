import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { cn } from '@/shared/lib/utils';
import type { CourseGrades, Grade } from '@/entities/grade';
import { TrendingUp, CheckCircle, XCircle } from 'lucide-react';

export interface GradeCardProps {
  /**
   * Datos de calificaciones del curso
   */
  courseGrades: CourseGrades;
  
  /**
   * Variante de visualización
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed';
  
  /**
   * Si se debe mostrar el detalle de evaluaciones
   * @default true
   */
  showDetails?: boolean;
  
  /**
   * Si se debe mostrar como acordeón (colapsable)
   * @default false
   */
  collapsible?: boolean;
  
  /**
   * Índice del curso (para numeración)
   */
  index?: number;
  
  /**
   * Clase CSS adicional
   */
  className?: string;
}

/**
 * Widget de tarjeta de calificaciones
 * 
 * Muestra calificaciones de un curso de forma reutilizable
 * 
 * @example
 * ```tsx
 * <GradeCard
 *   courseGrades={courseGrades}
 *   variant="default"
 *   showDetails={true}
 *   collapsible={true}
 * />
 * ```
 */
export const GradeCard: React.FC<GradeCardProps> = ({
  courseGrades,
  variant = 'default',
  showDetails = true,
  collapsible = false,
  index,
  className
}) => {
  const [isOpen, setIsOpen] = React.useState(!collapsible);

  // Obtener variante del badge según la calificación
  const getGradeVariant = (grade: number | null): "default" | "destructive" | "secondary" | "outline" => {
    if (grade === null) return "secondary";
    if (grade >= 9.0) return "default"; // Verde para excelente
    if (grade >= 7.5) return "outline"; // Azul para bueno
    if (grade >= 6.0) return "secondary"; // Amarillo para regular
    return "destructive"; // Rojo para insuficiente
  };

  // Obtener clase de color según la calificación
  const getGradeColorClass = (grade: number | null): string => {
    if (grade === null) return "text-muted-foreground";
    if (grade >= 9.0) return "text-success";
    if (grade >= 7.5) return "text-primary";
    if (grade >= 6.0) return "text-warning";
    return "text-destructive";
  };

  // Formatear fecha
  const formatDate = (dateString: string): string => {
    if (dateString === 'Pendiente') return dateString;
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const content = (
    <Card className={cn("hover:shadow-lg transition-all duration-300", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {index !== undefined && (
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                {index + 1}
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{courseGrades.courseName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Promedio: <span className={cn("font-semibold", getGradeColorClass(courseGrades.average))}>
                  {courseGrades.average.toFixed(2)}
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={getGradeVariant(courseGrades.average)}>
              {courseGrades.average.toFixed(2)}
            </Badge>
            {courseGrades.isPassed ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <XCircle className="w-5 h-5 text-destructive" />
            )}
          </div>
        </div>
      </CardHeader>

      {showDetails && (
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evaluación</TableHead>
                {variant === 'detailed' && (
                  <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                )}
                <TableHead className="text-center">Ponderación</TableHead>
                <TableHead className="text-right">Calificación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseGrades.grades.map((grade, idx) => (
                <TableRow key={grade.id || idx}>
                  <TableCell className="font-medium">
                    {grade.assignmentName || `Evaluación ${idx + 1}`}
                  </TableCell>
                  {variant === 'detailed' && (
                    <TableCell className="text-muted-foreground hidden sm:table-cell">
                      {formatDate(grade.evaluationDate)}
                    </TableCell>
                  )}
                  <TableCell className="text-center">
                    {grade.weight}%
                  </TableCell>
                  <TableCell className="text-right">
                    {grade.grade !== null ? (
                      <Badge variant={getGradeVariant(grade.grade)}>
                        {grade.grade.toFixed(1)}/{grade.maxGrade}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pendiente</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Información adicional */}
          {variant === 'detailed' && (
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Promedio Ponderado:</span>
                <span className={cn("font-semibold", getGradeColorClass(courseGrades.weightedAverage))}>
                  {courseGrades.weightedAverage.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Nota Mínima para Aprobar:</span>
                <span className="font-semibold text-foreground">
                  {courseGrades.minGradeToPass.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estado:</span>
                <Badge variant={courseGrades.isPassed ? "default" : "destructive"}>
                  {courseGrades.isPassed ? "Aprobado" : "Reprobado"}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );

  if (collapsible) {
    return (
      <details
        open={isOpen}
        onToggle={(e) => setIsOpen(e.currentTarget.open)}
        className="group"
      >
        <summary className="cursor-pointer list-none">
          <div className="p-4 bg-card rounded-lg border border-border hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {index !== undefined && (
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-foreground">
                    {courseGrades.courseName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Promedio: {courseGrades.average.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getGradeVariant(courseGrades.average)}>
                  {courseGrades.average.toFixed(2)}
                </Badge>
                <svg
                  className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </summary>
        <div className="mt-2">
          {content}
        </div>
      </details>
    );
  }

  return content;
};

