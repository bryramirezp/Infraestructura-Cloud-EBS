import { API_ENDPOINTS } from './endpoints';

// Get API URL from environment, default to port 8000 (FastAPI default)
const API_URL = (import.meta as any).env.VITE_API_URL || '';

// Log API URL in development for debugging
if ((import.meta as any).env.DEV) {
  console.log('[API Client] Using API URL:', API_URL);
}
// Remove /api suffix for auth endpoints (they're under /auth, not /api/auth)
const BASE_URL = API_URL.endsWith('/api') 
  ? API_URL.slice(0, -4) // Remove '/api'
  : API_URL.replace(/\/api$/, ''); // Fallback: remove trailing /api

/**
 * API Client Service
 *
 * Cliente base para todas las llamadas a la API usando Fetch API nativo.
 *
 * Cambio importante: Ya no envía tokens en headers (Authorization: Bearer).
 * El backend FastAPI maneja la autenticación mediante cookies HTTP seguras
 * establecidas por Cognito Hosted UI a través del endpoint /auth/callback.
 */
class APIClient {
  /**
   * Realiza una petición HTTP genérica
   * Nota: No incluye tokens en headers, el backend lee cookies directamente
   */
  private async request(
    endpoint: string,
    options: RequestInit = {},
    useBaseUrl: boolean = false
  ): Promise<Response> {
    const baseUrl = useBaseUrl ? BASE_URL : API_URL;
    const url = `${baseUrl}${endpoint}`;

    // Lista de endpoints donde un 401 es esperado (usuario no autenticado)
    const endpointsWhere401IsExpected = ['/usuarios/me', '/api/usuarios/me'];
    const is401Expected = endpointsWhere401IsExpected.some(ep => endpoint.includes(ep));

    // Log URL in development for debugging (pero no para endpoints donde 401 es esperado)
    if ((import.meta as any).env.DEV && !is401Expected) {
      console.log(`[API Client] ${options.method || 'GET'} ${url}`);
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    // Importante: No enviar Authorization header
    // El backend maneja autenticación via cookies HTTP seguras

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Incluir cookies en todas las peticiones
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorData.error || errorMessage;
        } catch {
          // Si la respuesta no es JSON, usar el texto
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        // Para 401/403 en endpoints de autenticación, incluir el status en el mensaje
        // para que use-auth.ts pueda detectarlo como error esperado
        if (response.status === 401 || response.status === 403) {
          errorMessage = `${response.status} ${errorMessage}`;
          
          // Si el 401 es esperado (usuario no autenticado en endpoint público), no loggear error
          if (response.status === 401 && is401Expected) {
            // No loggear nada - esto es un comportamiento esperado
            // El error se lanzará silenciosamente para ser manejado por use-auth.ts
          }
        }
        
        throw new Error(errorMessage);
      }

      return response;
    } catch (error: any) {
      // Si el 401 es esperado, no loggear nada y lanzar el error silenciosamente
      if (is401Expected && (error.message?.includes('401') || error.message?.includes('Unauthorized'))) {
        throw error; // Lanzar silenciosamente - será manejado por use-auth.ts
      }
      
      // Mejorar mensaje de error para "Failed to fetch"
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        const isAuthEndpoint = endpoint.includes('/auth/');
        const isHealthEndpoint = endpoint.includes('/health');
        
        // Para health check, solo loggear en modo desarrollo y no como error crítico
        if (isHealthEndpoint) {
          // No loggear como error, solo como información en desarrollo
          // En Vite, import.meta.env.MODE === 'development' para desarrollo
          const isDev = (import.meta as any).env?.MODE === 'development' || (import.meta as any).env?.DEV;
          if (isDev) {
            console.info(`[API Client] Backend no disponible en ${baseUrl}${endpoint}`);
          }
          throw new Error('Backend unavailable');
        }
        
        // Para endpoints de auth, lanzar error silencioso (será manejado por checkAuth)
        if (isAuthEndpoint) {
          throw new Error('Connection failed');
        }
        
        // Para otros endpoints, mostrar error completo
        const errorMsg = `No se pudo conectar con el servidor. Verifica que el backend esté corriendo en ${baseUrl}`;
        console.error(`[API Client] Error de conexión a ${url}:`, error);
        throw new Error(errorMsg);
      }
      throw error;
    }
  }

  /**
   * Realiza una petición GET
   */
  async get(endpoint: string, queryParams?: Record<string, any>, useBaseUrl: boolean = false) {
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

    const response = await this.request(
      fullEndpoint,
      {
        method: 'GET',
      },
      useBaseUrl
    );

    return response.json();
  }

  /**
   * Realiza una petición POST
   */
  async post(endpoint: string, data?: any, useBaseUrl: boolean = false) {
    const response = await this.request(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      useBaseUrl
    );

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

  // Authentication (Cognito Hosted UI)
  async getAuthProfile() {
    // Usar /api/usuarios/me en lugar de /auth/profile (eliminado)
    // Este endpoint puede retornar 401 si no hay cookies de autenticación (esperado)
    try {
      return await this.get(API_ENDPOINTS.USUARIOS.ME);
    } catch (error: any) {
      // Si es 401, es esperado cuando el usuario no está autenticado
      // Re-lanzar el error para que use-auth.ts lo maneje
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        throw error; // Re-lanzar para que use-auth.ts lo maneje como error esperado
      }
      throw error;
    }
  }

  async getAuthTokens() {
    return this.get(API_ENDPOINTS.AUTH.TOKENS, undefined, true);
  }

  async refreshAuthTokens() {
    return this.post(API_ENDPOINTS.AUTH.REFRESH, undefined, true);
  }

  async setAuthTokens(accessToken: string, refreshToken: string, idToken: string) {
    // Auth endpoints are under /auth, not /api/auth
    return this.post(API_ENDPOINTS.AUTH.SET_TOKENS, {
      access_token: accessToken,
      refresh_token: refreshToken,
      id_token: idToken,
    }, true);
  }

  async setAuthTokens(accessToken: string, refreshToken: string, idToken: string) {
    return this.post(API_ENDPOINTS.AUTH.SET_TOKENS, {
      access_token: accessToken,
      refresh_token: refreshToken,
      id_token: idToken,
    });
  }

  // Certificados API
  async getCertificadoById(certificadoId: string) {
    return this.get(API_ENDPOINTS.CERTIFICADOS.BY_ID(certificadoId));
  }

  async getCertificadosByUsuario(usuarioId: string) {
    return this.get(API_ENDPOINTS.CERTIFICADOS.BY_USUARIO(usuarioId));
  }

  async getCertificadoByInscripcion(inscripcionId: string) {
    return this.get(API_ENDPOINTS.CERTIFICADOS.BY_INSCRIPCION(inscripcionId));
  }

  async verificarCertificado(hash: string) {
    return this.get(API_ENDPOINTS.CERTIFICADOS.VERIFICAR(hash));
  }

  async descargarCertificado(certificadoId: string) {
    // Retorna la URL prefirmada o el blob directamente, depende del backend implementation plan
    // Asumiremos que retorna un objeto con la URL por ahora para mantener consistencia JSON
    return this.get(API_ENDPOINTS.CERTIFICADOS.DESCARGAR(certificadoId));
  }

  async generarCertificado(inscripcionId: string) {
    return this.post(API_ENDPOINTS.CERTIFICADOS.GENERAR(inscripcionId), {});
  }

  // Notificaciones API
  async getNotificacionesByUsuario(usuarioId: string) {
    return this.get(API_ENDPOINTS.NOTIFICACIONES.BY_USUARIO(usuarioId));
  }

  async marcarNotificacionLeida(notificacionId: string) {
    return this.patch(API_ENDPOINTS.NOTIFICACIONES.MARCAR_LEIDA(notificacionId), {});
  }

  async marcarTodasNotificacionesLeidas() {
    return this.post(API_ENDPOINTS.NOTIFICACIONES.MARCAR_TODAS_LEIDAS, {});
  }

  // Módulos API
  async getModulos(filters?: { publicado?: boolean }) {
    return this.get(API_ENDPOINTS.MODULOS.BASE, filters);
  }

  async getModuloById(moduloId: string) {
    return this.get(API_ENDPOINTS.MODULOS.BY_ID(moduloId));
  }

  async getCursosByModulo(moduloId: string) {
    return this.get(API_ENDPOINTS.MODULOS.CURSOS(moduloId));
  }

  // Cursos (Materias) API
  async getCursos(filters?: any) {
    return this.get(API_ENDPOINTS.CURSOS.BASE, filters);
  }

  async getCursoById(cursoId: string) {
    return this.get(API_ENDPOINTS.CURSOS.BY_ID(cursoId));
  }

  async inscribirEnCurso(cursoId: string) {
    return this.post(API_ENDPOINTS.CURSOS.INSCRIBIR(cursoId));
  }

  async desinscribirDeCurso(cursoId: string) {
    return this.post(API_ENDPOINTS.CURSOS.DESINSCRIBIR(cursoId));
  }

  async getCursoProgreso(cursoId: string) {
    return this.get(API_ENDPOINTS.CURSOS.PROGRESO(cursoId));
  }

  async getGuiasEstudio(cursoId: string) {
    return this.get(API_ENDPOINTS.CURSOS.GUIAS_ESTUDIO(cursoId));
  }

  async getExamenFinal(cursoId: string) {
    return this.get(API_ENDPOINTS.CURSOS.EXAMEN_FINAL(cursoId));
  }

  // Lecciones API
  async getLecciones(filters?: any) {
    return this.get(API_ENDPOINTS.LECCIONES.BASE, filters);
  }

  async getLeccionById(leccionId: string) {
    return this.get(API_ENDPOINTS.LECCIONES.BY_ID(leccionId));
  }

  async getLeccionContenido(leccionId: string) {
    return this.get(API_ENDPOINTS.LECCIONES.CONTENIDO(leccionId));
  }

  async getLeccionesByCurso(cursoId: string) {
    return this.get(API_ENDPOINTS.LECCIONES.BY_CURSO(cursoId));
  }

  async getLeccionQuiz(leccionId: string) {
    return this.get(API_ENDPOINTS.LECCIONES.QUIZ(leccionId));
  }

  // Quizzes API
  async getQuizById(quizId: string) {
    return this.get(API_ENDPOINTS.QUIZZES.BY_ID(quizId));
  }

  async getQuizPreguntas(quizId: string) {
    return this.get(API_ENDPOINTS.QUIZZES.PREGUNTAS(quizId));
  }

  async crearIntentoQuiz(quizId: string) {
    return this.post(API_ENDPOINTS.QUIZZES.INTENTOS(quizId));
  }

  async enviarIntentoQuiz(quizId: string, intentoId: string, respuestas: any) {
    return this.put(API_ENDPOINTS.QUIZZES.INTENTO_BY_ID(quizId, intentoId), { respuestas });
  }

  async getQuizResultados(quizId: string) {
    return this.get(API_ENDPOINTS.QUIZZES.RESULTADOS(quizId));
  }

  async getQuizIntentos(quizId: string) {
    return this.get(API_ENDPOINTS.QUIZZES.INTENTOS(quizId));
  }

  // Exámenes Finales API
  async getExamenFinalById(examenId: string) {
    return this.get(API_ENDPOINTS.EXAMENES_FINALES.BY_ID(examenId));
  }

  async getExamenFinalPreguntas(examenId: string) {
    return this.get(API_ENDPOINTS.EXAMENES_FINALES.PREGUNTAS(examenId));
  }

  async crearIntentoExamenFinal(examenId: string) {
    return this.post(API_ENDPOINTS.EXAMENES_FINALES.INTENTOS(examenId));
  }

  async enviarIntentoExamenFinal(examenId: string, intentoId: string, respuestas: any) {
    return this.put(API_ENDPOINTS.EXAMENES_FINALES.INTENTO_BY_ID(examenId, intentoId), { respuestas });
  }

  async getExamenFinalResultados(examenId: string) {
    return this.get(API_ENDPOINTS.EXAMENES_FINALES.RESULTADOS(examenId));
  }

  // Intentos API
  async getIntentoById(intentoId: string) {
    return this.get(API_ENDPOINTS.INTENTOS.BY_ID(intentoId));
  }

  async getIntentosByQuiz(quizId: string) {
    return this.get(API_ENDPOINTS.INTENTOS.BY_QUIZ(quizId));
  }

  async getIntentosByExamen(examenId: string) {
    return this.get(API_ENDPOINTS.INTENTOS.BY_EXAMEN(examenId));
  }

  async getIntentoResultado(intentoId: string) {
    return this.get(API_ENDPOINTS.INTENTOS.RESULTADO(intentoId));
  }

  async permitirNuevoIntento(intentoId: string) {
    return this.post(API_ENDPOINTS.INTENTOS.PERMITIR_NUEVO(intentoId));
  }

  // Inscripciones API
  async getInscripciones(filters?: any) {
    return this.get(API_ENDPOINTS.INSCRIPCIONES.BASE, filters);
  }

  async getInscripcionById(inscripcionId: string) {
    return this.get(API_ENDPOINTS.INSCRIPCIONES.BY_ID(inscripcionId));
  }

  async getInscripcionesByUsuario(usuarioId: string) {
    return this.get(API_ENDPOINTS.INSCRIPCIONES.BY_USUARIO(usuarioId));
  }

  async getInscripcionesByCurso(cursoId: string) {
    return this.get(API_ENDPOINTS.INSCRIPCIONES.BY_CURSO(cursoId));
  }

  async actualizarEstadoInscripcion(inscripcionId: string, estado: string) {
    return this.put(API_ENDPOINTS.INSCRIPCIONES.ACTUALIZAR_ESTADO(inscripcionId), { estado });
  }

  async patchInscripcion(inscripcionId: string, estado: string) {
    // Usar PATCH en lugar de PUT para actualizar estado
    const response = await this.request(
      API_ENDPOINTS.INSCRIPCIONES.ACTUALIZAR_ESTADO(inscripcionId),
      {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
      }
    );
    return response.json();
  }

  async getCertificadoByInscripcion(inscripcionId: string) {
    return this.get(API_ENDPOINTS.INSCRIPCIONES.CERTIFICADO(inscripcionId));
  }

  // Certificados API
  async getCertificadoById(certificadoId: string) {
    return this.get(API_ENDPOINTS.CERTIFICADOS.BY_ID(certificadoId));
  }

  async getCertificadosByUsuario(usuarioId: string) {
    return this.get(API_ENDPOINTS.CERTIFICADOS.BY_USUARIO(usuarioId));
  }

  async obtenerCertificado(certificadoId: string) {
    return this.get(API_ENDPOINTS.CERTIFICADOS.BY_ID(certificadoId));
  }

  async verificarCertificado(certificadoId: string, hash: string) {
    return this.get(API_ENDPOINTS.CERTIFICADOS.VERIFICAR(certificadoId, hash));
  }

  async crearCertificado(inscripcionId: string) {
    return this.post(API_ENDPOINTS.CERTIFICADOS.BASE, { inscripcion_curso_id: inscripcionId });
  }

  // Usuarios API
  async getUsuarios(filters?: any) {
    return this.get(API_ENDPOINTS.USUARIOS.BASE, filters);
  }

  async getUsuarioById(usuarioId: string) {
    return this.get(API_ENDPOINTS.USUARIOS.BY_ID(usuarioId));
  }

  async getUsuarioPerfil() {
    return this.get(API_ENDPOINTS.USUARIOS.ME);
  }

  async actualizarUsuarioPerfil(perfilData: any) {
    return this.put(API_ENDPOINTS.USUARIOS.ACTUALIZAR_PERFIL, perfilData);
  }

  async getUsuarioRoles(usuarioId: string) {
    return this.get(API_ENDPOINTS.USUARIOS.ROLES(usuarioId));
  }

  async asignarRolUsuario(usuarioId: string, rolId: string) {
    return this.post(API_ENDPOINTS.USUARIOS.ASIGNAR_ROL(usuarioId), { rol_id: rolId });
  }

  async eliminarRolUsuario(usuarioId: string, rolId: string) {
    return this.delete(API_ENDPOINTS.USUARIOS.ELIMINAR_ROL(usuarioId, rolId));
  }

  // Foro API
  async getForoComentarios(filters?: any) {
    return this.get(API_ENDPOINTS.FORO.BASE, filters);
  }

  async getForoByCurso(cursoId: string) {
    return this.get(API_ENDPOINTS.FORO.BY_CURSO(cursoId));
  }

  async getForoByLeccion(leccionId: string) {
    return this.get(API_ENDPOINTS.FORO.BY_LECCION(leccionId));
  }

  async crearForoComentario(comentarioData: any) {
    return this.post(API_ENDPOINTS.FORO.CREAR(), comentarioData);
  }

  async actualizarForoComentario(comentarioId: string, comentarioData: any) {
    return this.put(API_ENDPOINTS.FORO.ACTUALIZAR(comentarioId), comentarioData);
  }

  async eliminarForoComentario(comentarioId: string) {
    return this.delete(API_ENDPOINTS.FORO.ELIMINAR(comentarioId));
  }

  // Reglas de Acreditación API
  async getReglasAcreditacion(filters?: any) {
    return this.get(API_ENDPOINTS.REGLAS_ACREDITACION.BASE, filters);
  }

  async getReglasByCurso(cursoId: string) {
    return this.get(API_ENDPOINTS.REGLAS_ACREDITACION.BY_CURSO(cursoId));
  }

  // Reportes API
  async getDashboardStats() {
    return this.get(API_ENDPOINTS.REPORTES.DASHBOARD);
  }

  async getProgresoUsuario(usuarioId: string) {
    return this.get(API_ENDPOINTS.REPORTES.PROGRESO_USUARIO(usuarioId));
  }

  async getEstadisticasCurso(cursoId: string) {
    return this.get(API_ENDPOINTS.REPORTES.ESTADISTICAS_CURSO(cursoId));
  }

  async getComparacionGrupo(cursoId: string) {
    return this.get(API_ENDPOINTS.REPORTES.COMPARACION_GRUPO(cursoId));
  }

  // Sistema API
  async healthCheck() {
    // Health check está en /health, no en /api/health
    return this.get(API_ENDPOINTS.SISTEMA.HEALTH, undefined, true);
  }

  async getVersion() {
    return this.get(API_ENDPOINTS.SISTEMA.VERSION);
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
