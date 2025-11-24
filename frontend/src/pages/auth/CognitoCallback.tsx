import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * Component to handle Cognito OAuth2 callback
 * Extracts authorization code and sends it to backend with PKCE verifier
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

        // Get stored PKCE parameters
        const storedState = sessionStorage.getItem('pkce_state');
        const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

        // Validate state
        if (storedState !== state) {
          setError('Estado de seguridad no coincide');
          setTimeout(() => {
            navigate('/login?error=state_mismatch');
          }, 3000);
          return;
        }

        if (!codeVerifier) {
          setError('No se encontró el verificador PKCE');
          setTimeout(() => {
            navigate('/login?error=missing_verifier');
          }, 3000);
          return;
        }

        // Get backend URL
        const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api';
        const BASE_URL = API_URL.endsWith('/api') 
          ? API_URL.slice(0, -4)
          : API_URL.replace(/\/api$/, '');

        // Send code and verifier to backend for token exchange
        const response = await fetch(`${BASE_URL}/auth/callback?code=${code}&state=${state}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important for cookies
          body: JSON.stringify({
            code_verifier: codeVerifier,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
          throw new Error(errorData.detail || 'Error al intercambiar código por tokens');
        }

        // Clear stored PKCE parameters
        sessionStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('pkce_state');

        // Backend will set cookies and redirect, but if it doesn't, redirect manually
        const data = await response.json().catch(() => ({}));
        
        // If backend returns a redirect URL, use it
        if (data.redirect_url) {
          window.location.href = data.redirect_url;
        } else {
          // Otherwise redirect to dashboard
          navigate('/dashboard');
        }
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

