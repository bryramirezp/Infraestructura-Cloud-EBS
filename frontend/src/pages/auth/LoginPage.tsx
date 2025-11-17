import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { useTheme } from '@/app/styles/theme';
// Temporarily remove logo imports until paths are fixed
// import logoLight from '../../assets/images/Logo Modo Claro.png';
// import logoDark from '../../assets/images/Logo Modo Oscuro.png';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, login, error } = useAuthContext();
  const { isDark, mounted } = useTheme();
  
  // Logo según el tema - temporarily use placeholder
  // const logo = isDark ? logoDark : logoLight;
  const logo = null; // Will show text placeholder instead
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  // Verificar si hay parámetros en la URL (ej: después de logout, error, etc.)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const logoutParam = searchParams.get('logout');
    const registeredParam = searchParams.get('registered');

    if (errorParam) {
      setMessage('Error de autenticación. Por favor intenta nuevamente.');
    } else if (logoutParam) {
      setMessage('Has cerrado sesión correctamente.');
    } else if (registeredParam) {
      setMessage('Registro exitoso. Por favor inicia sesión.');
    }

    // Limpiar parámetros de la URL
    if (errorParam || logoutParam || registeredParam) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('error');
      newSearchParams.delete('logout');
      newSearchParams.delete('registered');
      const newUrl = `${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Mostrar loading mientras se verifica autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  const handleLogin = () => {
    // Redirigir al endpoint de login del backend (Cognito Hosted UI)
    login();
  };

  return (
    <div className="min-h-screen bg-background theme-transition-all relative">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => navigate('/')}
          className="bg-card shadow-sm border border-border px-3 py-2 rounded-lg text-foreground hover:text-foreground transition-colors flex items-center"
          aria-label="Volver al inicio"
        >
          <span>&larr;</span> Volver al inicio
        </button>
      </div>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-xl shadow-sm border border-border">
          <div>
            <div className="flex justify-center">
              {mounted ? (
                logo ? (
                  <img
                    src={logo}
                    alt="Escuela Bíblica Salem"
                    className="h-12 w-12 object-contain transition-opacity duration-200"
                  />
                ) : (
                  <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-xl">EBS</span>
                  </div>
                )
              ) : (
                <div className="h-12 w-12 bg-muted rounded-lg animate-pulse"></div>
              )}
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-foreground">
              Iniciar Sesión
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder a la plataforma
            </p>
          </div>
          
          {/* Mensajes informativos */}
          {message && (
            <div className={`rounded-lg p-4 flex items-start space-x-2 ${
              message.includes('Error') 
                ? 'bg-destructive/10 border border-destructive/20' 
                : 'bg-primary/10 border border-primary/20'
            }`}>
              <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                message.includes('Error') ? 'text-destructive' : 'text-primary'
              }`} />
              <p className={`text-sm ${
                message.includes('Error') ? 'text-destructive' : 'text-primary'
              }`}>
                {message}
              </p>
            </div>
          )}

          {/* Error de autenticación */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          <div className="space-y-6">
            {/* Información de autenticación */}
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-foreground mb-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-primary" />
                Autenticación Segura
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Utilizamos Amazon Cognito para proteger tu cuenta. Al hacer clic en "Iniciar Sesión", 
                serás redirigido a la página de inicio de sesión segura de Amazon.
              </p>
            </div>

            <div>
              <button
                onClick={handleLogin}
                className="theme-button w-full py-3 px-4 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring flex items-center justify-center space-x-2"
              >
                <BookOpen className="h-5 w-5" />
                <span>Iniciar Sesión con Amazon Cognito</span>
              </button>
            </div>

            <div className="text-center space-y-4">
              <div className="text-sm text-muted-foreground">
                ¿No tienes una cuenta?{' '}
                <Link to="/register" className="font-medium text-primary hover:text-primary/80">
                  Regístrate aquí
                </Link>
              </div>
              
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary hover:text-primary/80">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};