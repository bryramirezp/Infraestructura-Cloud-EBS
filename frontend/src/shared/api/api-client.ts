import { getAccessToken } from '../aws/cognito';
import { API_ENDPOINTS } from './endpoints';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * API Client Service
 * 
 * Cliente base para todas las llamadas a la API usando Fetch API nativo.
 * Utiliza los endpoints definidos en endpoints.ts y maneja la autenticación automáticamente.
 */
class APIClient {
  /**
   * Obtiene el token de autenticación del usuario actual
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      return await getAccessToken();
    } catch (error) {
      console.warn('No se pudo obtener el token de autenticación:', error);
      return null;
    }
  }

  /**
   * Realiza una petición HTTP genérica
   */
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = await this.getAuthToken();
    const url = `${API_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Si la respuesta no es JSON, usar el texto
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      }
      throw new Error(errorMessage);
    }

    return response;
  }

  /**
   * Realiza una petición GET
   */
  async get(endpoint: string, queryParams?: Record<string, any>) {
    let fullEndpoint = endpoint;
    if (queryParams) {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      const queryString = params.toString();
      if (queryString) {
        fullEndpoint = `${endpoint}?${queryString}`;
      }
    }

    const response = await this.request(fullEndpoint, {
      method: 'GET',
    });

    return response.json();
  }

  /**
   * Realiza una petición POST
   */
  async post(endpoint: string, data?: any) {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });

    return response.json();
  }

  /**
   * Realiza una petición PUT
   */
  async put(endpoint: string, data?: any) {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });

    return response.json();
  }

  /**
   * Realiza una petición DELETE
   */
  async delete(endpoint: string) {
    const response = await this.request(endpoint, {
      method: 'DELETE',
    });

    // Algunos endpoints DELETE pueden retornar contenido, otros no
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return null;
  }

  // ===== Métodos específicos de dominio =====

  // Courses API
  async getCourses(filters?: any) {
    return this.get(API_ENDPOINTS.COURSES.BASE, filters);
  }

  async getCourseById(courseId: string | number) {
    return this.get(API_ENDPOINTS.COURSES.BY_ID(courseId));
  }

  async createCourse(courseData: any) {
    return this.post(API_ENDPOINTS.COURSES.BASE, courseData);
  }

  async updateCourse(courseId: string | number, courseData: any) {
    return this.put(API_ENDPOINTS.COURSES.BY_ID(courseId), courseData);
  }

  async deleteCourse(courseId: string | number) {
    return this.delete(API_ENDPOINTS.COURSES.BY_ID(courseId));
  }

  // Users API
  async getUsers(filters?: any) {
    return this.get(API_ENDPOINTS.USERS.BASE, filters);
  }

  async getUserById(userId: string | number) {
    return this.get(API_ENDPOINTS.USERS.BY_ID(userId));
  }

  async createUser(userData: any) {
    return this.post(API_ENDPOINTS.USERS.BASE, userData);
  }

  async updateUser(userId: string | number, userData: any) {
    return this.put(API_ENDPOINTS.USERS.BY_ID(userId), userData);
  }

  // Exams API
  async submitExam(examId: string | number, examData: any) {
    return this.post(API_ENDPOINTS.EXAMS.SUBMIT(examId), examData);
  }
}

/**
 * Instancia singleton del cliente API
 */
export const apiClient = new APIClient();

/**
 * Exportación por defecto para compatibilidad
 */
export default apiClient;
