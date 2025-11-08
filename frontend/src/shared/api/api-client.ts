import { API, Auth } from 'aws-amplify';
import { API_ENDPOINTS } from './endpoints';

/**
 * API Client Service
 * 
 * Cliente base para todas las llamadas a la API usando AWS Amplify.
 * Utiliza los endpoints definidos en endpoints.ts y maneja la autenticación automáticamente.
 */
class APIClient {
  private readonly apiName = 'EBSAPI';

  /**
   * Obtiene el token de autenticación del usuario actual
   */
  private async getAuthToken(): Promise<string> {
    try {
      const session = await Auth.currentSession();
      return session.getIdToken().getJwtToken();
    } catch (error) {
      throw new Error('No authenticated user');
    }
  }

  /**
   * Realiza una petición GET
   */
  async get(endpoint: string, queryParams?: Record<string, any>) {
    const token = await this.getAuthToken();
    return API.get(this.apiName, endpoint, {
      headers: {
        Authorization: token,
      },
      queryStringParameters: queryParams,
    });
  }

  /**
   * Realiza una petición POST
   */
  async post(endpoint: string, data?: any) {
    const token = await this.getAuthToken();
    return API.post(this.apiName, endpoint, {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: data,
    });
  }

  /**
   * Realiza una petición PUT
   */
  async put(endpoint: string, data?: any) {
    const token = await this.getAuthToken();
    return API.put(this.apiName, endpoint, {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: data,
    });
  }

  /**
   * Realiza una petición DELETE
   */
  async delete(endpoint: string) {
    const token = await this.getAuthToken();
    return API.del(this.apiName, endpoint, {
      headers: {
        Authorization: token,
      },
    });
  }

  // ===== Métodos específicos de dominio (pueden moverse a features/*/api/ más adelante) =====

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
