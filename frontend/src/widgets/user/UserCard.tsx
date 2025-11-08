import React from 'react';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { cn } from '@/shared/lib/utils';
import type { User, UserRole, UserStatus } from '@/entities/user';
import { USER_ROLES, USER_STATUSES } from '@/entities/user';
import { Mail, Phone, Calendar, TrendingUp, BookOpen, Award } from 'lucide-react';

export interface UserCardProps {
  /**
   * Datos del usuario
   */
  user: User;
  
  /**
   * Variante de visualización
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'detailed';
  
  /**
   * Si se debe mostrar el avatar
   * @default true
   */
  showAvatar?: boolean;
  
  /**
   * Si se debe mostrar el progreso (solo para alumnos)
   * @default true
   */
  showProgress?: boolean;
  
  /**
   * Si se debe mostrar estadísticas adicionales
   * @default false
   */
  showStats?: boolean;
  
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
 * Widget de tarjeta de usuario
 * 
 * Muestra información de un usuario de forma reutilizable
 * 
 * @example
 * ```tsx
 * <UserCard
 *   user={user}
 *   variant="default"
 *   showProgress={true}
 *   actions={<Button>Ver Perfil</Button>}
 * />
 * ```
 */
export const UserCard: React.FC<UserCardProps> = ({
  user,
  variant = 'default',
  showAvatar = true,
  showProgress = true,
  showStats = false,
  actions,
  onClick,
  className
}) => {
  // Obtener iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Mapear roles internos a roles de la entidad
  const roleMap: Record<string, UserRole> = {
    'student': 'alumno',
    'teacher': 'coordinador',
    'admin': 'administrador',
    'alumno': 'alumno',
    'coordinador': 'coordinador',
    'administrador': 'administrador'
  };

  const mappedRole = roleMap[user.role] || user.role;
  const roleInfo = USER_ROLES[mappedRole] || { label: user.role, description: '' };
  
  // Determinar color del badge de rol
  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'administrador':
        return 'bg-primary/10 text-primary';
      case 'coordinador':
        return 'bg-primary/10 text-primary';
      case 'alumno':
      default:
        return 'bg-success/10 text-success';
    }
  };

  // Determinar color del badge de estado
  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'Activo':
        return 'bg-success/10 text-success';
      case 'Inactivo':
        return 'bg-muted text-muted-foreground';
      case 'Suspendido':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const isStudent = mappedRole === 'alumno';
  const isTeacher = mappedRole === 'coordinador';

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-300",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className={cn(
        variant === 'compact' && "pb-3",
        variant === 'detailed' && "pb-4"
      )}>
        <div className="flex items-start justify-between gap-3">
          {/* Avatar y nombre */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {showAvatar && (
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {user.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                <Mail className="h-3 w-3 flex-shrink-0" />
                {user.email}
              </p>
              
              {/* Badges de rol y estado */}
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={cn("text-xs", getRoleColor(mappedRole))}
                >
                  {roleInfo.label}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-xs", getStatusColor(user.status))}
                >
                  {user.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Acciones */}
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn(
        variant === 'compact' && "pt-0",
        variant === 'detailed' && "pt-0 space-y-4"
      )}>
        {/* Progreso (solo para alumnos) */}
        {isStudent && showProgress && user.coursesEnrolled !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso General</span>
              {user.averageGrade !== undefined && (
                <span className="font-medium text-foreground">
                  {user.averageGrade.toFixed(1)}%
                </span>
              )}
            </div>
            {user.averageGrade !== undefined && (
              <Progress value={user.averageGrade} className="h-2" />
            )}
          </div>
        )}

        {/* Cursos (solo para coordinadores) */}
        {isTeacher && user.coursesEnrolled !== undefined && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{user.coursesEnrolled} cursos asignados</span>
          </div>
        )}

        {/* Estadísticas adicionales */}
        {showStats && isStudent && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Cursos</p>
                <p className="text-sm font-semibold text-foreground">
                  {user.coursesEnrolled || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Certificados</p>
                <p className="text-sm font-semibold text-foreground">
                  {user.certificatesEarned || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Información detallada */}
        {variant === 'detailed' && (
          <div className="space-y-2 pt-2 border-t border-border">
            {user.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.registrationDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>
                  Registrado: {new Date(user.registrationDate).toLocaleDateString('es-ES')}
                </span>
              </div>
            )}
            {user.lastLogin && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 flex-shrink-0" />
                <span>
                  Último acceso: {new Date(user.lastLogin).toLocaleDateString('es-ES')}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

