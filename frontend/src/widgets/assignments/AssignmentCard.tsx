import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import type { Assignment, AssignmentStatus, AssignmentPriority } from '@/entities/assignment';
import { Calendar, Clock, AlertCircle, CheckCircle, FileText } from 'lucide-react';

export interface AssignmentCardProps {
  /**
   * Datos de la tarea
   */
  assignment: Assignment;
  
  /**
   * Días hasta la fecha de entrega (calculado)
   */
  daysUntil?: number;
  
  /**
   * Fecha formateada
   */
  formattedDueDate?: string;
  
  /**
   * Variante de visualización
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed';
  
  /**
   * Si se debe mostrar la descripción
   * @default true
   */
  showDescription?: boolean;
  
  /**
   * Acciones personalizadas (botones, etc.)
   */
  actions?: React.ReactNode;
  
  /**
   * Callback cuando se hace click en la tarjeta
   */
  onClick?: () => void;
  
  /**
   * Clase CSS adicional
   */
  className?: string;
}

/**
 * Widget de tarjeta de tarea
 * 
 * Muestra información de una tarea de forma reutilizable
 * 
 * @example
 * ```tsx
 * <AssignmentCard
 *   assignment={assignment}
 *   daysUntil={5}
 *   formattedDueDate="25 de octubre de 2025"
 *   variant="default"
 *   showDescription={true}
 * />
 * ```
 */
export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  daysUntil,
  formattedDueDate,
  variant = 'default',
  showDescription = true,
  actions,
  onClick,
  className
}) => {
  // Calcular días hasta la entrega si no se proporciona
  const calculateDaysUntil = (dueDate: string): number => {
    if (daysUntil !== undefined) return daysUntil;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Formatear fecha si no se proporciona
  const formatDate = (dateString: string): string => {
    if (formattedDueDate) return formattedDueDate;
    
    const date = new Date(dateString);
    const utcDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60000);
    return utcDate.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const days = calculateDaysUntil(assignment.dueDate);
  const formattedDate = formatDate(assignment.dueDate);
  const isOverdue = days < 0;
  const isDueToday = days === 0;
  const isDueTomorrow = days === 1;

  // Obtener texto de días
  const getDaysText = (): string => {
    if (isOverdue) return "Vencida";
    if (isDueToday) return "Vence Hoy";
    if (isDueTomorrow) return "Vence Mañana";
    return `Vence en ${days} días`;
  };

  // Obtener variante del badge de estado
  const getStatusVariant = (status: AssignmentStatus): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'calificado':
        return "default"; // Verde para calificado
      case 'entregado':
        return "secondary"; // Gris para entregado
      case 'en_progreso':
        return "outline"; // Azul para en progreso
      case 'pendiente':
      default:
        return isOverdue ? "destructive" : "secondary"; // Rojo si está vencida
    }
  };

  // Obtener texto de estado
  const getStatusText = (status: AssignmentStatus): string => {
    switch (status) {
      case 'calificado':
        return "Calificada";
      case 'entregado':
        return "Entregada";
      case 'en_progreso':
        return "En Progreso";
      case 'pendiente':
      default:
        return "Pendiente";
    }
  };

  // Obtener variante del badge de prioridad
  const getPriorityVariant = (priority: AssignmentPriority): "default" | "destructive" | "secondary" | "outline" => {
    switch (priority) {
      case 'alta':
        return "destructive";
      case 'media':
        return "outline";
      case 'baja':
      default:
        return "secondary";
    }
  };

  // Obtener texto de prioridad
  const getPriorityText = (priority: AssignmentPriority): string => {
    switch (priority) {
      case 'alta':
        return "Alta";
      case 'media':
        return "Media";
      case 'baja':
      default:
        return "Baja";
    }
  };

  // Obtener icono de estado
  const getStatusIcon = () => {
    switch (assignment.status) {
      case 'calificado':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'entregado':
        return <CheckCircle className="w-5 h-5 text-primary" />;
      case 'en_progreso':
        return <Clock className="w-5 h-5 text-warning" />;
      case 'pendiente':
      default:
        return <AlertCircle className="w-5 h-5 text-destructive" />;
    }
  };

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-300 flex flex-col",
        onClick && "cursor-pointer",
        variant === 'compact' && "h-full",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className={variant === 'compact' ? "pb-3" : undefined}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {variant !== 'compact' && getStatusIcon()}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl truncate">
                {assignment.title}
              </CardTitle>
              <CardDescription className="mt-1">
                {assignment.courseName || `Curso #${assignment.courseId}`}
              </CardDescription>
            </div>
          </div>
          
          {/* Badges */}
          <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
            <Badge 
              variant={getPriorityVariant(assignment.priority)} 
              className="justify-center whitespace-nowrap"
            >
              {getPriorityText(assignment.priority)}
            </Badge>
            {assignment.status !== 'calificado' && (
              <Badge 
                variant={getStatusVariant(assignment.status)} 
                className="justify-center whitespace-nowrap"
              >
                {getStatusText(assignment.status)}
              </Badge>
            )}
            {assignment.status === 'calificado' && assignment.grade !== undefined && (
              <Badge variant="default" className="justify-center whitespace-nowrap">
                {assignment.grade}/{assignment.maxGrade}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-grow flex flex-col justify-between">
        {showDescription && assignment.description && (
          <p className="text-muted-foreground mb-4 line-clamp-3">
            {assignment.description}
          </p>
        )}

        <div className="space-y-2">
          {/* Fecha y días restantes */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{formattedDate}</span>
            </div>
            
            {/* Días restantes (solo si no está calificada) */}
            {assignment.status !== 'calificado' && (
              <div className={cn(
                "flex items-center gap-1 font-medium",
                isOverdue ? "text-destructive" : isDueToday ? "text-warning" : "text-foreground"
              )}>
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>{getDaysText()}</span>
              </div>
            )}
          </div>

          {/* Información adicional */}
          {variant === 'detailed' && (
            <div className="space-y-1 pt-2 border-t border-border">
              {assignment.type && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span className="capitalize">{assignment.type}</span>
                </div>
              )}
              {assignment.weight && (
                <div className="text-sm text-muted-foreground">
                  Ponderación: {assignment.weight}%
                </div>
              )}
              {assignment.feedback && (
                <div className="text-sm text-muted-foreground pt-2 border-t border-border">
                  <p className="font-medium text-foreground mb-1">Retroalimentación:</p>
                  <p>{assignment.feedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Acciones */}
          {actions && (
            <div className="pt-2 border-t border-border">
              {actions}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

