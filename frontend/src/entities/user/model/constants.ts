/**
 * Constantes relacionadas con usuarios
 */

import { UserRole, UserStatus } from './types';

export const USER_ROLES: Record<UserRole, { label: string; description: string }> = {
  alumno: {
    label: 'Alumno',
    description: 'Estudiante inscrito en cursos y módulos'
  },
  administrador: {
    label: 'Administrador',
    description: 'Acceso completo al sistema'
  },
  coordinador: {
    label: 'Coordinador',
    description: 'Gestiona cursos, módulos y alumnos'
  }
};

export const USER_STATUSES: Record<UserStatus, { label: string; color: string }> = {
  Activo: { label: 'Activo', color: 'green' },
  Inactivo: { label: 'Inactivo', color: 'gray' },
  Suspendido: { label: 'Suspendido', color: 'red' }
};