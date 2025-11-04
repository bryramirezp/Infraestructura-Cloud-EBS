import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{email?: string, password?: string}>({});
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Validación en tiempo real
    validateField(name, value);
  };

  const validateField = (name: string, value: string) => {
    const newErrors = {...errors};

    if (name === 'email') {
      if (!value) {
        newErrors.email = 'El email es requerido';
      } else if (!value.includes('@')) {
        newErrors.email = 'Email inválido';
      } else {
        delete newErrors.email;
      }
    }

    if (name === 'password') {
      if (!value) {
        newErrors.password = 'La contraseña es requerida';
      } else if (value.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      } else {
        delete newErrors.password;
      }
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validación final antes del envío
    const finalErrors: {email?: string, password?: string} = {};
    if (!formData.email) finalErrors.email = 'El email es requerido';
    if (!formData.password) finalErrors.password = 'La contraseña es requerida';

    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      return;
    }

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Error desconocido');
      }
    } catch (error) {
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 relative">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => navigate('/')}
          className="bg-white shadow-sm border border-gray-200 px-3 py-2 rounded-lg text-gray-700 hover:text-gray-900 transition-colors flex items-center"
          aria-label="Volver al inicio"
        >
          <span>&larr;</span> Volver al inicio
        </button>
      </div>
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <img src="/logo.png" alt="Escuela Bíblica Salem" className="h-12 w-12" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Iniciar Sesión
          </h2>

          {/* Credenciales de Prueba - Solo en desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-primary-900 mb-2">Credenciales de Prueba:</h3>
              <div className="text-sm text-primary-800 space-y-2">
                <div>
                  <p><strong>Administrador:</strong></p>
                  <p>Email: admin@ebsalem.com</p>
                  <p>Contraseña: admin123</p>
                </div>
                <div>
                  <p><strong>Estudiante:</strong></p>
                  <p>Email: ivan@ebsalem.com</p>
                  <p>Contraseña: ivan123</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p id="email-error" className="text-red-600 text-sm mt-1" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  aria-invalid={!!errors.password}
                />
                {errors.password && (
                  <p id="password-error" className="text-red-600 text-sm mt-1" role="alert">
                    {errors.password}
                  </p>
                )}
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Recordarme
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>

        </form>
        </div>
      </div>
    </div>
  );
};