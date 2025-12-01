import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * Component to handle Cognito OAuth2 callback
 * The backend already has the PKCE verifier in cookies, so we just need to
 * forward the callback to the backend which will exchange the code for tokens
 */
export const CognitoCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract code and state from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for errors from Cognito
        if (errorParam) {
          const errorMsg = errorDescription || errorParam || 'Error de autenticación';
          setError(errorMsg);
          setTimeout(() => {
            navigate('/login?error=auth_failed');
          }, 3000);
          return;
        }

        if (!code || !state) {
          setError('Faltan parámetros en el callback de autenticación');
          setTimeout(() => {
            navigate('/login?error=invalid_callback');
          }, 3000);
          return;
        }

        // Get backend URL
        const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';
        const BASE_URL = API_URL.endsWith('/api') 
          ? API_URL.slice(0, -4) // Remove '/api'
          : API_URL.replace(/\/api$/, '');

        // Forward the callback to backend
        // Backend has the code_verifier in cookies, so it can exchange the code
        // Backend will set JWT cookies and redirect us to the dashboard
        window.location.href = `${BASE_URL}/api/auth/callback?code=${code}&state=${state}`;
      } catch (err: any) {
        console.error('Error en callback de Cognito:', err);
        setError(err.message || 'Error al procesar autenticación');
        setTimeout(() => {
          navigate('/login?error=callback_failed');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Error de Autenticación</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-foreground">Completando autenticación...</p>
      </div>
    </div>
  );
};

