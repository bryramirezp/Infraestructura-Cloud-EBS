import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/api-client';
import { API_ENDPOINTS } from '../api/endpoints';
import { cognitoService } from '../auth/cognito-service';
import { extractUserInfoFromIdToken, APP_ROLES, type AppRole } from '../auth/cognito-roles';

interface User {
  user_id: string;
  email: string;
  name: string;
  role: AppRole;
  groups: string[];
  exp: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Extrae información del usuario desde el ID token como fallback
 * cuando el backend no devuelve grupos o rol.
 */
const extractRoleFromIdToken = async (idToken: string | null): Promise<Partial<User> | null> => {
  if (!idToken) {
    return null;
  }

  try {
    const userInfo = extractUserInfoFromIdToken(idToken);

    return {
      role: userInfo.primaryRole,
      groups: userInfo.cognitoGroups,
      email: userInfo.email,
      name: userInfo.name,
      user_id: userInfo.userId || '',
    };
  } catch (error) {
    console.warn('Error extracting role from ID token:', error);
    return null;
  }
};

/**
 * Verificar si el backend está disponible
 */
const checkBackendHealth = async (): Promise<boolean> => {
  try {
    await apiClient.healthCheck();
    return true;
  } catch (error: any) {
    // Backend no disponible - esto es esperado si el backend no está corriendo
    // No loggear como error, solo retornar false silenciosamente
    return false;
  }
};

/**
 * Hook de autenticación
 */
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const checkingAuthRef = useRef(false);
  const loggingOutRef = useRef(false);
  const refreshingRef = useRef(false);

  /**
   * Verificar si el usuario está autenticado al cargar la app
   */
  const checkAuth = async (): Promise<void> => {
    // Prevenir múltiples verificaciones simultáneas o si se está cerrando sesión
    if (checkingAuthRef.current || loggingOutRef.current) {
      return;
    }

    try {
      checkingAuthRef.current = true;
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: true, error: null }));

    // Verificar que el backend esté disponible antes de intentar autenticación
    const backendAvailable = await checkBackendHealth();
    if (!backendAvailable) {
      // Backend no disponible - establecer estado sin error (es un problema de infraestructura, no de autenticación)
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Llamar al endpoint /api/usuarios/me del backend
    // Este endpoint lee las cookies y devuelve el perfil del usuario
    const userProfile = await apiClient.getAuthProfile();

    // Si estamos cerrando sesión, ignorar el resultado
    if (loggingOutRef.current) return;

    // Normalizar el rol a minúsculas para consistencia (backend devuelve en minúsculas)
    if (userProfile.role) {
      userProfile.role = userProfile.role.toLowerCase();
    }

    // Verificar si el token no ha expirado (con margen de 60 segundos para evitar refreshes innecesarios)
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = userProfile.exp || 0;
    const timeUntilExpiry = expiresAt - now;

    // Solo refrescar si el token está a menos de 60 segundos de expirar
    if (expiresAt > 0 && timeUntilExpiry < 60 && !refreshingRef.current) {
      // Token cerca de expirar o expirado, intentar refresh
      await refreshAuth();
      return;
    }

    // Si el backend no devuelve grupos o rol, intentar leer del ID token
    let finalProfile = userProfile;
    if ((!userProfile.groups || userProfile.groups.length === 0 || !userProfile.role || userProfile.role === 'unknown')) {
      try {
        // Intentar obtener ID token desde el endpoint /auth/tokens
        const tokens = await apiClient.getAuthTokens();
        // El backend devuelve id_token (con guión bajo) según auth_routes.py
        const idToken = tokens.id_token || (tokens as any).idToken;
        if (idToken) {
          const idTokenInfo = await extractRoleFromIdToken(idToken);
          if (idTokenInfo) {
            // Normalizar rol del ID token también
            const normalizedRole = idTokenInfo.role ? idTokenInfo.role.toLowerCase() : null;
            // Complementar información del backend con información del ID token
            finalProfile = {
              ...userProfile,
              role: normalizedRole || userProfile.role,
              groups: idTokenInfo.groups || userProfile.groups,
            };
          }
        }
      } catch (tokenError) {
        // Si falla obtener tokens, usar solo la información del backend
        console.warn('Could not get ID token to extract groups:', tokenError);
      }
    }

    setAuthState({
      user: finalProfile,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  } catch (error: any) {
    // Si estamos cerrando sesión, ignorar el error
    if (loggingOutRef.current) return;

    // Distinguir entre errores esperados (usuario no autenticado) y errores reales
    const errorMessage = error?.message || '';
    const statusCode = errorMessage.match(/\b(401|403|404)\b/)?.[1];
    const isExpectedError =
      statusCode === '401' || // No autenticado - esperado
      statusCode === '403' || // No autorizado - esperado
      errorMessage.includes('401') ||
      errorMessage.includes('403') ||
      errorMessage.includes('Unauthorized') ||
      errorMessage.includes('Forbidden') ||
      errorMessage.includes('No access token') ||
      errorMessage.includes('Connection failed') ||
      errorMessage === 'Failed to fetch' || // Failed to fetch es esperado cuando no hay backend o no hay sesión
      errorMessage.includes('Backend unavailable'); // Backend no disponible

    // Solo loggear errores inesperados (no 401/403 que son esperados cuando no hay sesión)
    if (!isExpectedError) {
      console.error('[Auth] Error inesperado al verificar autenticación:', error);
    } else if (statusCode === '401') {
      // 401 es completamente esperado cuando el usuario no está autenticado
      // No loggear nada, solo establecer estado como no autenticado
    }

    // No hay sesión válida o el token expiró - esto es esperado cuando el usuario no está autenticado
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  } finally {
    checkingAuthRef.current = false;
  }
};

  /**
   * Iniciar sesión con email y contraseña usando Cognito directamente
   * 
   * NOTA: Este método ya no se usa con Cognito Hosted UI (PKCE flow).
   * Se mantiene por compatibilidad, pero el flujo recomendado es usar
   * Cognito Hosted UI a través de /api/auth/login
   * 
   * @deprecated Use Cognito Hosted UI instead (redirect to /api/auth/login)
   */
  const login = async (
  email: string,
  password: string,
  redirectPath?: string
): Promise<void> => {
  try {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    // Autenticar con Cognito
    const authResult = await cognitoService.authenticateUser(email, password);

    // Si se requiere nueva contraseña, Cognito Hosted UI lo maneja automáticamente
    // Este flujo solo aplica si se usa login directo (no recomendado)
    if (authResult.challengeName === 'NEW_PASSWORD_REQUIRED') {
      throw new Error(
        'Se requiere cambio de contraseña. Por favor usa Cognito Hosted UI para completar este proceso.'
      );
    }

    // Si no hay tokens, lanzar error
    if (!authResult.tokens) {
      throw new Error('No se recibieron tokens de autenticación');
    }

    // Almacenar ID token temporalmente en sessionStorage para lectura posterior
    // (solo para lectura de grupos, no para autenticación)
    try {
      sessionStorage.setItem('id_token_temp', authResult.tokens.idToken);
    } catch (storageError) {
      console.warn('Could not store ID token temporarily:', storageError);
    }

    // Enviar tokens al backend para establecer cookies
    const userProfile = await apiClient.setAuthTokens(
      authResult.tokens.accessToken,
      authResult.tokens.refreshToken,
      authResult.tokens.idToken
    );

    // Normalizar el rol a minúsculas para consistencia
    if (userProfile.role) {
      userProfile.role = userProfile.role.toLowerCase();
    }

    // Si el backend no devuelve grupos o rol, extraer del ID token
    let finalProfile = userProfile;
    if ((!userProfile.groups || userProfile.groups.length === 0 || !userProfile.role || userProfile.role === 'unknown')) {
      const idTokenInfo = await extractRoleFromIdToken(authResult.tokens.idToken);
      if (idTokenInfo) {
        // Normalizar rol del ID token también
        const normalizedRole = idTokenInfo.role ? idTokenInfo.role.toLowerCase() : null;
        finalProfile = {
          ...userProfile,
          role: normalizedRole || userProfile.role,
          groups: idTokenInfo.groups || userProfile.groups,
        };
      }
    }

    // Limpiar ID token temporal después de usarlo
    try {
      sessionStorage.removeItem('id_token_temp');
    } catch (storageError) {
      // Ignorar errores al limpiar
    }

    // Actualizar estado con perfil del usuario
    setAuthState({
      user: finalProfile,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    // Determinar ruta de redirección (comparar con valores en minúsculas)
    let targetPath = redirectPath;
    if (!targetPath) {
      // Redirigir según rol del usuario
      const normalizedRole = finalProfile.role?.toLowerCase();
      if (normalizedRole === APP_ROLES.STUDENT) {
        targetPath = '/dashboard';
      } else if (normalizedRole === APP_ROLES.COORDINATOR || normalizedRole === APP_ROLES.ADMIN) {
        targetPath = '/admin';
      } else {
        targetPath = '/dashboard';
      }
    }

    // Redirigir a la ruta determinada
    window.location.href = targetPath;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error al iniciar sesión';
    setAuthState((prev: AuthState) => ({
      ...prev,
      isLoading: false,
      error: errorMessage,
      isAuthenticated: false,
    }));
    throw error;
  }
};

  /**
   * Cerrar sesión
   */
  const logout = async (): Promise<void> => {
  // Prevenir múltiples llamadas a logout
  if (loggingOutRef.current) return;

  try {
    loggingOutRef.current = true;

    // Llamar al endpoint /api/auth/logout del backend para limpiar cookies
    // El endpoint está bajo /api/auth según el router del backend
    // useBaseUrl: false (default) construye: {API_URL}/auth/logout = http://localhost:8000/api/auth/logout
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Si falla el logout del backend, continuar de todas formas
      console.warn('Error al cerrar sesión en backend:', error);
    }

    // Limpiar estado local y almacenamiento temporal
    try {
      sessionStorage.removeItem('id_token_temp');
      localStorage.removeItem('ebsalem_user'); // Limpiar cualquier rastro antiguo
    } catch (storageError) {
      // Ignorar errores al limpiar
    }

    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    // Redirigir a la página de login
    window.location.href = '/';
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    // Incluso si hay error, limpiar estado local y redirigir
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    window.location.href = '/';
  } finally {
    // No reseteamos loggingOutRef a false porque vamos a redirigir
    // y queremos bloquear cualquier otra operación hasta que la página se recargue
  }
};

  /**
   * Refrescar tokens de autenticación
   */
  const refreshAuth = async (): Promise<void> => {
    // Prevenir múltiples refreshes simultáneos o si se está cerrando sesión
    if (refreshingRef.current || loggingOutRef.current) {
      return;
    }

    try {
      refreshingRef.current = true;
      await apiClient.refreshAuthTokens();

      // Pequeño delay para asegurar que las cookies se establezcan
      await new Promise(resolve => setTimeout(resolve, 100));

      // Si estamos cerrando sesión, abortar
      if (loggingOutRef.current) return;

      // Después de refresh, verificar auth nuevamente (solo una vez)
      // No llamar checkAuth() aquí para evitar bucles - solo actualizar el estado
      try {
        const userProfile = await apiClient.getAuthProfile();

        // Si estamos cerrando sesión, abortar
        if (loggingOutRef.current) return;

        if (userProfile.role) {
          userProfile.role = userProfile.role.toLowerCase();
        }

        setAuthState({
          user: userProfile,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (profileError) {
        // Si obtener el perfil falla después del refresh, cerrar sesión
        if (!loggingOutRef.current) {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      }
    } catch (error) {
      // Si el refresh falla, cerrar sesión
      if (!loggingOutRef.current) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } finally {
      refreshingRef.current = false;
    }
  };

  // Verificar autenticación al montar el componente
  useEffect(() => {
    // Lista de rutas públicas donde no necesitamos verificar autenticación
    const publicRoutes = ['/', '/about', '/contact', '/auth/callback', '/certificados/verificar'];
    const currentPath = window.location.pathname;

    // Solo verificar autenticación si NO estamos en una ruta pública
    if (!publicRoutes.includes(currentPath)) {
      checkAuth();
    } else {
      // Si estamos en ruta pública, simplemente establecer estado como no autenticado sin llamar al backend
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...authState,
    login,
    logout,
    checkAuth,
    refreshAuth,
  };
};
