import { useState, useEffect } from 'react';
import { apiClient } from '../api/api-client';
import { API_ENDPOINTS } from '../api/endpoints';

interface User {
  user_id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'COORDINATOR' | 'ADMIN' | 'UNKNOWN';
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
  login: () => void;
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
   * Iniciar sesión redirigiendo a Cognito Hosted UI
   */
  const login = (): void => {
    // Redirigir al endpoint /auth/login del backend
    // Esto iniciará el flujo OAuth2 con Cognito Hosted UI
    const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api';
    window.location.href = `${apiUrl}${API_ENDPOINTS.AUTH.LOGIN}`;
  };

  /**
   * Cerrar sesión
   */
  const logout = async (): Promise<void> => {
    try {
      // Llamar al endpoint /auth/logout del backend
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
      
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