/**
 * API Endpoints Configuration
 * 
 * Centraliza todas las URLs de endpoints de la API.
 * En producción, estas URLs vendrán de variables de entorno.
 */

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'https://api.example.com';

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: string | number) => `/users/${id}`,
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
  },

  // Courses
  COURSES: {
    BASE: '/courses',
    BY_ID: (id: string | number) => `/courses/${id}`,
    ENROLL: (id: string | number) => `/courses/${id}/enroll`,
    UNENROLL: (id: string | number) => `/courses/${id}/unenroll`,
    PROGRESS: (id: string | number) => `/courses/${id}/progress`,
    CONTENT: (id: string | number) => `/courses/${id}/content`,
  },

  // Assignments
  ASSIGNMENTS: {
    BASE: '/assignments',
    BY_ID: (id: string | number) => `/assignments/${id}`,
    SUBMIT: (id: string | number) => `/assignments/${id}/submit`,
    BY_COURSE: (courseId: string | number) => `/assignments?courseId=${courseId}`,
  },

  // Exams
  EXAMS: {
    BASE: '/exams',
    BY_ID: (id: string | number) => `/exams/${id}`,
    SUBMIT: (id: string | number) => `/exams/${id}/submit`,
    RESULTS: (id: string | number) => `/exams/${id}/results`,
  },

  // Grades
  GRADES: {
    BASE: '/grades',
    BY_ID: (id: string | number) => `/grades/${id}`,
    BY_COURSE: (courseId: string | number) => `/grades?courseId=${courseId}`,
    BY_STUDENT: (studentId: string | number) => `/grades?studentId=${studentId}`,
  },

  // Reports
  REPORTS: {
    BASE: '/reports',
    DASHBOARD: '/reports/dashboard',
    STUDENT_PROGRESS: (studentId: string | number) => `/reports/students/${studentId}/progress`,
    COURSE_ANALYTICS: (courseId: string | number) => `/reports/courses/${courseId}/analytics`,
  },

  // Admin
  ADMIN: {
    USERS: '/admin/users',
    COURSES: '/admin/courses',
    SETTINGS: '/admin/settings',
    STATS: '/admin/stats',
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

