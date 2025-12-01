/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth2
 * Used to generate code verifier and challenge for Cognito Hosted UI
 */

/**
 * Generate a random code verifier for PKCE
 * @param length Length of the verifier (default: 64, recommended: 43-128)
 * @returns URL-safe base64 encoded random string
 */
export function generateCodeVerifier(length: number = 64): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  // Convert to base64url (RFC 4648 §5)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, 128); // Max length per RFC 7636
}

/**
 * Generate code challenge from verifier using SHA256
 * @param verifier The code verifier
 * @returns Base64url encoded SHA256 hash
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to base64url
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate a random state parameter for OAuth2
 * @returns URL-safe random string
 */
export function generateState(): string {
  return generateCodeVerifier(32);
}

