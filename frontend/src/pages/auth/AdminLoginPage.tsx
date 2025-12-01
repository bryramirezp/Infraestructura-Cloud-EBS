import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, Shield } from 'lucide-react';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Esquema de validación para el formulario de login
const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'El email es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, login, error } = useAuthContext();
  
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configurar react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Verificar si hay parámetros en la URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const logoutParam = searchParams.get('logout');

    if (errorParam) {
      setMessage('Error de autenticación. Por favor intenta nuevamente.');
    } else if (logoutParam) {
      setMessage('Has cerrado sesión correctamente.');
    }

    // Limpiar parámetros de la URL
    if (errorParam || logoutParam) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('error');
      newSearchParams.delete('logout');
      const newUrl = `${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  // Redirigir si ya está autenticado y es administrador
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/admin/dashboard');
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

  const handleLogin = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      setMessage('');
      
      // Intentar login con redirección a dashboard de administrador
      await login(data.email, data.password);
      
      // Después del login, verificar si el usuario tiene permisos de administrador
      // Esto se manejará en el hook useAuth, pero podemos agregar validación adicional aquí
    } catch (err: any) {
      // Verificar si el error es por falta de permisos
      if (err?.message?.includes('permisos') || err?.message?.includes('administrador')) {
        setMessage('No tienes permisos de administrador. Por favor inicia sesión como estudiante.');
      } else {
        // El error ya está manejado en el hook useAuth
        console.error('Error en login:', err);
      }
    } finally {
      setIsSubmitting(false);
    }
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
              <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-foreground">
              Acceso Administrador
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Ingresa tus credenciales de administrador para acceder al panel
            </p>
          </div>
          
          {/* Mensajes informativos */}
          {message && (
            <div className={`rounded-lg p-4 flex items-start space-x-2 ${
              message.includes('Error') || message.includes('permisos')
                ? 'bg-destructive/10 border border-destructive/20' 
                : 'bg-primary/10 border border-primary/20'
            }`}>
              <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                message.includes('Error') || message.includes('permisos') ? 'text-destructive' : 'text-primary'
              }`} />
              <p className={`text-sm ${
                message.includes('Error') || message.includes('permisos') ? 'text-destructive' : 'text-primary'
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
          
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
            {/* Campo de Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.email ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="admin@email.com"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Campo de Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className={`block w-full pl-10 pr-10 py-2 border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.password ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Botón de Submit */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="theme-button w-full py-3 px-4 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  <span>Iniciar Sesión como Administrador</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center space-y-4">
            <div className="text-sm text-muted-foreground">
              ¿Eres estudiante?{' '}
              <Link to="/login" className="font-medium text-primary hover:text-primary/80">
                Inicia sesión aquí
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
  );
};

