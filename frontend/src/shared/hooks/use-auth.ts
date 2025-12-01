import { useState, useEffect } from 'react';
import { apiClient } from '../api/api-client';
import { API_ENDPOINTS } from '../api/endpoints';
import { cognitoService } from '../services/cognito-service';

interface User {
  user_id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'ADMIN' | 'UNKNOWN';
  groups: string[];
  exp: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  login: (email: string, password: string, redirectPath?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  /**
   * Verificar si el usuario está autenticado al cargar la app
   */
  const checkAuth = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Llamar al endpoint /auth/profile del backend
      // Este endpoint lee las cookies y devuelve el perfil del usuario
      const userProfile = await apiClient.getAuthProfile();
      
      // Verificar si el token no ha expirado
      const now = Math.floor(Date.now() / 1000);
      if (userProfile.exp && userProfile.exp < now) {
        // Token expirado, intentar refresh
        await refreshAuth();
        return;
      }

      setAuthState({
        user: userProfile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // No hay sesión válida o el token expiró
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  };

  /**
   * Iniciar sesión con email y contraseña usando Cognito directamente
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

      // Enviar tokens al backend para establecer cookies
      const userProfile = await apiClient.setAuthTokens(
        authResult.tokens.accessToken,
        authResult.tokens.refreshToken,
        authResult.tokens.idToken
      );

      // Actualizar estado con perfil del usuario
      setAuthState({
        user: userProfile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Determinar ruta de redirección
      let targetPath = redirectPath;
      if (!targetPath) {
        // Redirigir según rol del usuario
        if (userProfile.role === 'STUDENT') {
          targetPath = '/dashboard';
        } else if (userProfile.role === 'COORDINATOR' || userProfile.role === 'ADMIN') {
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
      setAuthState(prev => ({
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
    try {
      // Cerrar sesión en Cognito
      await cognitoService.signOut();
      
      // Llamar al endpoint /auth/logout del backend para limpiar cookies
      try {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
      } catch (error) {
        // Si falla el logout del backend, continuar de todas formas
        console.warn('Error al cerrar sesión en backend:', error);
      }
      
      // Limpiar estado local
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
      // Incluso si hay error, limpiar estado local
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  };

  /**
   * Refrescar tokens de autenticación
   */
  const refreshAuth = async (): Promise<void> => {
    try {
      await apiClient.refreshAuthTokens();
      // Después de refresh, verificar auth nuevamente
      await checkAuth();
    } catch (error) {
      // Si el refresh falla, cerrar sesión
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  };

  // Verificar autenticación al montar el componente
  useEffect(() => {
    checkAuth();
  }, []);

  return {
    ...authState,
    login,
    logout,
    checkAuth,
    refreshAuth,
  };
};