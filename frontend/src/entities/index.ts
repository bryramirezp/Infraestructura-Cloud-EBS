/**
 * Exports centralizados de todas las entidades
 * 
 * Este archivo re-exporta todos los tipos, interfaces y constantes
 * de las entidades del dominio de la aplicación.
 */

// User - Usuarios del sistema (Alumno, Administrador, Coordinador)
export * from './user';

// Course - Cursos individuales
export * from './course';

// Module - Módulos que contienen cursos
export * from './module';

// Assignment - Tareas/Asignaciones
export * from './assignment';

// Grade - Calificaciones
export * from './grade';

// Progress - Progreso de alumnos en cursos y módulos
export * from './progress';

// Certificate - Certificados de cursos y módulos
export * from './certificate';