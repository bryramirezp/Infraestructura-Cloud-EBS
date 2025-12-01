/**
 * API Endpoints Configuration
 *
 * Centraliza todas las URLs de endpoints de la API.
 * Alineado con la estructura del backend FastAPI y la base de datos PostgreSQL.
 */

const API_BASE_URL = (import.meta as any).env.VITE_API_GATEWAY_URL || 'https://api.example.com';

export const API_ENDPOINTS = {
  // Authentication (Cognito Hosted UI + Backend)
  AUTH: {
    LOGIN: '/auth/login',       // Iniciar flujo PKCE - redirige a Cognito Hosted UI
    LOGOUT: '/auth/logout',     // Redirección a Cognito logout
    CALLBACK: '/auth/callback',  // Callback de Cognito con tokens
    REFRESH: '/auth/refresh',   // Refresh tokens
    TOKENS: '/auth/tokens',     // Obtener tokens del usuario actual (opcional)
    SET_TOKENS: '/auth/set-tokens', // Enviar tokens al backend para establecer cookies (solo desarrollo)
  },

  // Certificados
  CERTIFICADOS: {
    BASE: '/certificados',
    BY_ID: (id: string) => `/certificados/${id}`,
    BY_USUARIO: (usuarioId: string) => `/certificados/usuario/${usuarioId}`,
    BY_INSCRIPCION: (inscripcionId: string) => `/certificados/inscripcion/${inscripcionId}`,
    VERIFICAR: (hash: string) => `/certificados/verificar/${hash}`,
    DESCARGAR: (id: string) => `/certificados/${id}/download`,
    GENERAR: (inscripcionId: string) => `/certificados/generar/${inscripcionId}`,
  },

  // Notificaciones
  NOTIFICACIONES: {
    BASE: '/notificaciones',
    BY_ID: (id: string) => `/notificaciones/${id}`,
    BY_USUARIO: (usuarioId: string) => `/notificaciones/usuario/${usuarioId}`,
    MARCAR_LEIDA: (id: string) => `/notificaciones/${id}/leida`,
    MARCAR_TODAS_LEIDAS: '/notificaciones/marcar-todas-leidas',
  },

  // Módulos
  MODULOS: {
    BASE: '/modulos',
    BY_ID: (id: string) => `/modulos/${id}`,
    CURSOS: (id: string) => `/modulos/${id}/cursos`,
    INSCRIPCIONES: (id: string) => `/modulos/${id}/inscripciones`,
  },

  // Cursos (Materias)
  CURSOS: {
    BASE: '/cursos',
    BY_ID: (id: string) => `/cursos/${id}`,
    INSCRIBIR: (id: string) => `/cursos/${id}/inscribir`,
    DESINSCRIBIR: (id: string) => `/cursos/${id}/desinscribir`,
    PROGRESO: (id: string) => `/cursos/${id}/progreso`,
    GUIAS_ESTUDIO: (id: string) => `/cursos/${id}/guias-estudio`,
    EXAMEN_FINAL: (id: string) => `/cursos/${id}/examen-final`,
    ESTADISTICAS: (id: string) => `/cursos/${id}/estadisticas`,
  },

  // Lecciones
  LECCIONES: {
    BASE: '/lecciones',
    BY_ID: (id: string) => `/lecciones/${id}`,
    CONTENIDO: (id: string) => `/lecciones/${id}/contenido`,
    BY_MODULO: (moduloId: string) => `/lecciones?modulo_id=${moduloId}`,
    BY_CURSO: (cursoId: string) => `/lecciones?curso_id=${cursoId}`,
    QUIZ: (id: string) => `/lecciones/${id}/quiz`,
  },

  // Quizzes
  QUIZZES: {
    BASE: '/quizzes',
    BY_ID: (id: string) => `/quizzes/${id}`,
    PREGUNTAS: (id: string) => `/quizzes/${id}/preguntas`,
    INTENTOS: (id: string) => `/quizzes/${id}/intentos`,
    INTENTO_BY_ID: (quizId: string, intentoId: string) => `/quizzes/${quizId}/intentos/${intentoId}`,
    RESULTADOS: (id: string) => `/quizzes/${id}/resultados`,
  },

  // Exámenes Finales
  EXAMENES_FINALES: {
    BASE: '/examenes-finales',
    BY_ID: (id: string) => `/examenes-finales/${id}`,
    PREGUNTAS: (id: string) => `/examenes-finales/${id}/preguntas`,
    INTENTOS: (id: string) => `/examenes-finales/${id}/intentos`,
    INTENTO_BY_ID: (examenId: string, intentoId: string) => `/examenes-finales/${examenId}/intentos/${intentoId}`,
    RESULTADOS: (id: string) => `/examenes-finales/${id}/resultados`,
  },

  // Intentos
  INTENTOS: {
    BASE: '/intentos',
    BY_ID: (id: string) => `/intentos/${id}`,
    BY_QUIZ: (quizId: string) => `/intentos?quiz_id=${quizId}`,
    BY_EXAMEN: (examenId: string) => `/intentos?examen_final_id=${examenId}`,
    BY_USUARIO: (usuarioId: string) => `/intentos?usuario_id=${usuarioId}`,
    RESULTADO: (id: string) => `/intentos/${id}/resultado`,
    PERMITIR_NUEVO: (id: string) => `/intentos/${id}/permitir-nuevo`,
  },

  // Inscripciones
  INSCRIPCIONES: {
    BASE: '/inscripciones',
    BY_ID: (id: string) => `/inscripciones/${id}`,
    BY_USUARIO: (usuarioId: string) => `/inscripciones?usuario_id=${usuarioId}`,
    BY_CURSO: (cursoId: string) => `/inscripciones?curso_id=${cursoId}`,
    ACTUALIZAR_ESTADO: (id: string) => `/inscripciones/${id}`,
    CERTIFICADO: (id: string) => `/certificados/inscripciones/${id}`,
  },

  // Certificados
  CERTIFICADOS: {
    BASE: '/certificados',
    BY_ID: (id: string) => `/certificados/${id}`,
    BY_INSCRIPCION: (inscripcionId: string) => `/certificados/inscripciones/${inscripcionId}`,
    BY_USUARIO: (usuarioId: string) => `/certificados?usuario_id=${usuarioId}`,
    VERIFICAR: (id: string, hash: string) => `/certificados/${id}/verificar?hash=${hash}`,
  },

  // Usuarios
  USUARIOS: {
    BASE: '/usuarios',
    BY_ID: (id: string) => `/usuarios/${id}`,
    ME: '/usuarios/me',
    ACTUALIZAR_PERFIL: '/usuarios/me',
    ROLES: (id: string) => `/usuarios/${id}/roles`,
    ASIGNAR_ROL: (id: string) => `/usuarios/${id}/roles`,
    ELIMINAR_ROL: (id: string, rolId: string) => `/usuarios/${id}/roles/${rolId}`,
  },

  // Foro
  FORO: {
    BASE: '/foro',
    BY_CURSO: (cursoId: string) => `/foro?curso_id=${cursoId}`,
    BY_LECCION: (leccionId: string) => `/foro?leccion_id=${leccionId}`,
    BY_USUARIO: (usuarioId: string) => `/foro?usuario_id=${usuarioId}`,
    CREAR: () => '/foro',
    ACTUALIZAR: (id: string) => `/foro/${id}`,
    ELIMINAR: (id: string) => `/foro/${id}`,
  },

  // Reglas de Acreditación
  REGLAS_ACREDITACION: {
    BASE: '/reglas-acreditacion',
    BY_ID: (id: string) => `/reglas-acreditacion/${id}`,
    BY_CURSO: (cursoId: string) => `/reglas-acreditacion?curso_id=${cursoId}`,
    BY_QUIZ: (quizId: string) => `/reglas-acreditacion?quiz_id=${quizId}`,
    BY_EXAMEN: (examenId: string) => `/reglas-acreditacion?examen_final_id=${examenId}`,
  },

  // Reportes y Estadísticas
  REPORTES: {
    BASE: '/reportes',
    DASHBOARD: '/reportes/dashboard',
    PROGRESO_USUARIO: (usuarioId: string) => `/reportes/usuarios/${usuarioId}/progreso`,
    ESTADISTICAS_CURSO: (cursoId: string) => `/reportes/cursos/${cursoId}/estadisticas`,
    COMPARACION_GRUPO: (cursoId: string) => `/reportes/cursos/${cursoId}/comparacion`,
    CERTIFICADOS_EMITIDOS: '/reportes/certificados-emitidos',
    ACTIVIDAD_USUARIOS: '/reportes/actividad-usuarios',
  },

  // Admin
  ADMIN: {
    USUARIOS: '/admin/usuarios',
    CURSOS: '/admin/cursos',
    MODULOS: '/admin/modulos',
    INSCRIPCIONES: '/admin/inscripciones',
    CONFIGURACION: '/admin/configuracion',
    ESTADISTICAS: '/admin/estadisticas',
    ROLES: '/admin/roles',
    PERMISOS: '/admin/permisos',
  },

  // Sistema (Endpoints de mantenimiento y salud)
  SISTEMA: {
    HEALTH: '/health',
    VERSION: '/version',
    METRICS: '/metrics',
  },
} as const;

/**
 * Helper para construir URLs completas
 */
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Helper para obtener endpoints específicos
 */
export const getEndpoint = (path: string): string => {
  return buildApiUrl(path);
};

