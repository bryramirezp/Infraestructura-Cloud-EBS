import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { cognitoService } from '@/shared/services/cognito-service';
import { apiClient } from '@/shared/api/api-client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '@/app/styles/theme';
import logoLight from '@/assets/images/Logo Modo Claro.png';
import logoDark from '@/assets/images/Logo Modo Oscuro.png';

const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
      .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
      .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
      .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

export const SetNewPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDark, mounted } = useTheme();
  const logo = mounted ? (isDark ? logoDark : logoLight) : logoLight;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
  });

  const password = watch('password');

  useEffect(() => {
    // Verificar si hay datos de nueva contraseña requerida en sessionStorage
    const newPasswordData = sessionStorage.getItem('newPasswordRequired');
    if (!newPasswordData) {
      // Si no hay datos, redirigir al login
      navigate('/login?error=session_expired');
    }
  }, [navigate]);

  const handleSetPassword = async (data: SetPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Obtener datos del challenge desde sessionStorage
      const newPasswordData = sessionStorage.getItem('newPasswordRequired');
      if (!newPasswordData) {
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }

      let parsedData;
      try {
        parsedData = JSON.parse(newPasswordData);
      } catch (parseError) {
        console.error('Error al parsear datos de sessionStorage:', parseError);
        sessionStorage.removeItem('newPasswordRequired');
        throw new Error('Error al leer datos de sesión. Por favor inicia sesión nuevamente.');
      }

      const { email, temporaryPassword } = parsedData;

      // Validar que los datos requeridos estén presentes
      if (!email || !temporaryPassword) {
        sessionStorage.removeItem('newPasswordRequired');
        throw new Error('Datos de sesión incompletos. Por favor inicia sesión nuevamente.');
      }

      // Completar el flujo de cambio de contraseña forzado usando AWS SDK v3
      const authResult = await cognitoService.completeForceChangePassword(
        email,
        temporaryPassword,
        data.password
      );

      // Enviar tokens al backend para establecer cookies
      const userProfile = await apiClient.setAuthTokens(
        authResult.tokens.accessToken,
        authResult.tokens.refreshToken,
        authResult.tokens.idToken
      );

      // Limpiar sessionStorage
      sessionStorage.removeItem('newPasswordRequired');

      setSuccess(true);

      // Redirigir después de un breve delay
      setTimeout(() => {
        if (userProfile.role === 'STUDENT') {
          navigate('/dashboard');
        } else if (userProfile.role === 'COORDINATOR' || userProfile.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error al establecer nueva contraseña';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background theme-transition-all flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-xl shadow-sm border border-border text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Contraseña establecida</h2>
          <p className="text-muted-foreground">
            Tu contraseña ha sido establecida correctamente. Redirigiendo...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background theme-transition-all relative">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => navigate('/login')}
          className="bg-card shadow-sm border border-border px-3 py-2 rounded-lg text-foreground hover:text-foreground transition-colors flex items-center"
          aria-label="Volver al login"
        >
          <span>&larr;</span> Volver al login
        </button>
      </div>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-xl shadow-sm border border-border">
          <div>
            <div className="flex justify-center">
              {mounted ? (
                <img
                  src={logo}
                  alt="Escuela Bíblica Salem"
                  className="h-12 w-12 object-contain transition-opacity duration-200"
                />
              ) : (
                <div className="h-12 w-12 bg-muted rounded-lg animate-pulse"></div>
              )}
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-foreground">
              Establecer Nueva Contraseña
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Por favor establece una nueva contraseña para tu cuenta
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(handleSetPassword)} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password')}
                  className={`block w-full pl-10 pr-10 py-2 border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.password ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="Ingresa tu nueva contraseña"
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
              {password && (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p>La contraseña debe contener:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li className={password.length >= 8 ? 'text-green-500' : ''}>
                      Al menos 8 caracteres
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-green-500' : ''}>
                      Una letra mayúscula
                    </li>
                    <li className={/[a-z]/.test(password) ? 'text-green-500' : ''}>
                      Una letra minúscula
                    </li>
                    <li className={/[0-9]/.test(password) ? 'text-green-500' : ''}>
                      Un número
                    </li>
                    <li className={/[^A-Za-z0-9]/.test(password) ? 'text-green-500' : ''}>
                      Un carácter especial
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Confirmar Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className={`block w-full pl-10 pr-10 py-2 border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.confirmPassword ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="Confirma tu nueva contraseña"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="theme-button w-full py-3 px-4 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Estableciendo contraseña...</span>
                </>
              ) : (
                <span>Establecer Contraseña</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

