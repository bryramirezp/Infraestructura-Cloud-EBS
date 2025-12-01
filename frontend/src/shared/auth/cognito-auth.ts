/**
 * Cognito Hosted UI authentication utilities
 * Handles PKCE flow and redirects to Cognito Hosted UI
 */

import { generateCodeVerifier, generateCodeChallenge, generateState } from './pkce';

/**
 * Get Cognito domain from environment variables
 */
function getCognitoDomain(): string {
  const domain = (import.meta as any).env.VITE_COGNITO_DOMAIN;
  if (!domain) {
    throw new Error('VITE_COGNITO_DOMAIN is not set in environment variables');
  }
  // Ensure domain has https:// prefix
  if (domain.startsWith('https://')) {
    return domain;
  }
  return `https://${domain}`;
}

/**
 * Get Cognito client ID from environment variables
 */
function getCognitoClientId(): string {
  const clientId = (import.meta as any).env.VITE_COGNITO_CLIENT_ID;
  if (!clientId) {
    throw new Error('VITE_COGNITO_CLIENT_ID is not set in environment variables');
  }
  return clientId;
}

/**
 * Get redirect URI from environment variables or use default
 * IMPORTANT: This must match EXACTLY with the redirect URIs configured in Cognito App Client
 * 
 * The redirect URI must be:
 * - A full URL (http:// or https://)
 * - Match exactly (including protocol, domain, port, and path)
 * - Be configured in Cognito App Client > Allowed callback URLs
 */
function getRedirectUri(): string {
  const redirectUri = (import.meta as any).env.VITE_COGNITO_REDIRECT_URI;
  if (redirectUri) {
    // Validate it's a full URL
    if (!redirectUri.startsWith('http://') && !redirectUri.startsWith('https://')) {
      console.warn('[Cognito Auth] VITE_COGNITO_REDIRECT_URI should be a full URL. Got:', redirectUri);
    }
    return redirectUri;
  }
  
  // Default to current origin + /auth/callback
  // Ensure it includes the protocol and port if in development
  const origin = window.location.origin;
  const callbackPath = '/auth/callback';
  const fullRedirectUri = `${origin}${callbackPath}`;
  
  // Log warning if using default (should be explicitly configured)
  console.warn('[Cognito Auth] VITE_COGNITO_REDIRECT_URI not set, using default:', fullRedirectUri);
  console.warn('[Cognito Auth] Please set VITE_COGNITO_REDIRECT_URI in your .env file to avoid redirect_mismatch errors');
  
  return fullRedirectUri;
}

/**
 * Get OAuth scopes from environment variables or use default
 */
function getScopes(): string {
  return (import.meta as any).env.VITE_COGNITO_SCOPES || 'openid profile email';
}

/**
 * Build Cognito Hosted UI authorization URL with PKCE
 * @returns Object with authorization URL and code verifier (to be stored)
 */
export async function buildCognitoAuthUrl(): Promise<{ url: string; codeVerifier: string; state: string }> {
  const domain = getCognitoDomain();
  const clientId = getCognitoClientId();
  const redirectUri = getRedirectUri();
  const scopes = getScopes();
  
  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();
  
  // Build authorization URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    state: state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });
  
  const authUrl = `${domain}/oauth2/authorize?${params.toString()}`;
  
  // Log for debugging (remove in production)
  if ((import.meta as any).env.DEV) {
    console.log('[Cognito Auth] Authorization URL:', authUrl);
    console.log('[Cognito Auth] Redirect URI:', redirectUri);
    console.log('[Cognito Auth] Client ID:', clientId);
  }
  
  return {
    url: authUrl,
    codeVerifier,
    state,
  };
}

/**
 * Redirect to Cognito Hosted UI for authentication
 * Stores PKCE parameters in sessionStorage for callback verification
 */
export async function redirectToCognito(): Promise<void> {
  try {
    const redirectUri = getRedirectUri();
    
    // Validate redirect URI is properly configured
    if (!redirectUri || !redirectUri.startsWith('http')) {
      const errorMsg = 'VITE_COGNITO_REDIRECT_URI must be a full URL (e.g., http://localhost:5173/auth/callback)';
      console.error(`[Cognito Auth] ${errorMsg}`);
      console.error('[Cognito Auth] Current value:', redirectUri);
      console.error('[Cognito Auth] Please set VITE_COGNITO_REDIRECT_URI in your .env file');
      throw new Error(errorMsg);
    }
    
    const { url, codeVerifier, state } = await buildCognitoAuthUrl();
    
    // Store PKCE parameters in sessionStorage for callback
    // Note: In a production app, you might want to use more secure storage
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    sessionStorage.setItem('pkce_state', state);
    
    // Log for debugging - IMPORTANT: This redirect URI must match EXACTLY with Cognito App Client settings
    console.log('[Cognito Auth] Redirect URI being used:', redirectUri);
    console.log('[Cognito Auth] ⚠️  Make sure this EXACT redirect URI is configured in your Cognito App Client:');
    console.log('[Cognito Auth]   1. Go to AWS Cognito Console');
    console.log('[Cognito Auth]   2. Select your User Pool');
    console.log('[Cognito Auth]   3. Go to App integration > App clients');
    console.log('[Cognito Auth]   4. Edit your app client');
    console.log('[Cognito Auth]   5. Add this EXACT URL to "Allowed callback URLs":', redirectUri);
    console.log('[Cognito Auth] Redirecting to Cognito Hosted UI...');
    
    // Redirect to Cognito Hosted UI
    window.location.href = url;
  } catch (error) {
    console.error('[Cognito Auth] Error building Cognito auth URL:', error);
    throw error;
  }
}

/**
 * Get stored PKCE code verifier (used in callback)
 */
export function getStoredCodeVerifier(): string | null {
  return sessionStorage.getItem('pkce_code_verifier');
}

/**
 * Get stored PKCE state (used in callback)
 */
export function getStoredState(): string | null {
  return sessionStorage.getItem('pkce_state');
}

/**
 * Clear stored PKCE parameters (after successful authentication)
 */
export function clearStoredPkceParams(): void {
  sessionStorage.removeItem('pkce_code_verifier');
  sessionStorage.removeItem('pkce_state');
}

