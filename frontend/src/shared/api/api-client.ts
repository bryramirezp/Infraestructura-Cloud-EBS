import { API_ENDPOINTS } from './endpoints';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api';

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
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${API_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    // Importante: No enviar Authorization header
    // El backend maneja autenticación via cookies HTTP seguras

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

  // Authentication (Cognito Hosted UI)
  async getAuthProfile() {
    return this.get(API_ENDPOINTS.AUTH.PROFILE);
  }

  async getAuthTokens() {
    return this.get(API_ENDPOINTS.AUTH.TOKENS);
  }

  async refreshAuthTokens() {
    return this.post(API_ENDPOINTS.AUTH.REFRESH);
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

  async iniciarQuiz(quizId: string) {
    return this.post(API_ENDPOINTS.QUIZZES.INICIAR(quizId));
  }

  async enviarQuiz(quizId: string, respuestas: any) {
    return this.post(API_ENDPOINTS.QUIZZES.ENVIAR(quizId), { respuestas });
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

  async iniciarExamenFinal(examenId: string) {
    return this.post(API_ENDPOINTS.EXAMENES_FINALES.INICIAR(examenId));
  }

  async enviarExamenFinal(examenId: string, respuestas: any) {
    return this.post(API_ENDPOINTS.EXAMENES_FINALES.ENVIAR(examenId), { respuestas });
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

  async descargarCertificado(certificadoId: string) {
    return this.get(API_ENDPOINTS.CERTIFICADOS.DESCARGAR(certificadoId));
  }

  async verificarCertificado(hash: string) {
    return this.get(API_ENDPOINTS.CERTIFICADOS.VERIFICAR(hash));
  }

  async generarCertificado(inscripcionId: string) {
    return this.post(API_ENDPOINTS.CERTIFICADOS.GENERAR(inscripcionId));
  }

  // Usuarios API
  async getUsuarios(filters?: any) {
    return this.get(API_ENDPOINTS.USUARIOS.BASE, filters);
  }

  async getUsuarioById(usuarioId: string) {
    return this.get(API_ENDPOINTS.USUARIOS.BY_ID(usuarioId));
  }

  async getUsuarioPerfil() {
    return this.get(API_ENDPOINTS.USUARIOS.PERFIL);
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
    return this.get(API_ENDPOINTS.SISTEMA.HEALTH);
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
