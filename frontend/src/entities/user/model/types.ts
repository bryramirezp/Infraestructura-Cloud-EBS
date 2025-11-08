/**
 * Entidad: Usuario
 * Roles: Alumno, Administrador, Coordinador
 */

export type UserRole = 'alumno' | 'administrador' | 'coordinador';
export type UserStatus = 'Activo' | 'Inactivo' | 'Suspendido';

/**
 * Usuario base
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  registrationDate: string;
  lastLogin?: string;
  
  // Estadísticas (para alumnos)
  coursesEnrolled?: number;
  modulesCompleted?: number;
  certificatesEarned?: number;
  averageGrade?: number;
}

/**
 * Usuario para autenticación (versión simplificada)
 */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

/**
 * Usuario para formularios
 */
export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
}

/**
 * Perfil de usuario (extendido)
 */
export interface UserProfile extends User {
  bio?: string;
  address?: string;
  birthDate?: string;
  enrolledCourses?: number[];
  enrolledModules?: number[];
}