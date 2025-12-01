/**
 * Constantes para grupos de Cognito User Pool
 * Estos nombres deben coincidir con los grupos configurados en Cognito
 */
export const COGNITO_GROUPS = {
  ADMIN: 'administradores',
  STUDENT: 'estudiantes',
  COORDINATOR: 'coordinadores',
} as const;

/**
 * Constantes para roles de la aplicación
 * Estos son los roles que se usan en el frontend
 */
export const APP_ROLES = {
  ADMIN: 'ADMIN',
  STUDENT: 'STUDENT',
  COORDINATOR: 'COORDINATOR',
  UNKNOWN: 'UNKNOWN',
} as const;

export type AppRole = typeof APP_ROLES[keyof typeof APP_ROLES];

/**
 * Mapeo de grupos de Cognito a roles de la aplicación
 * Debe coincidir con el mapeo del backend (backend/app/utils/roles.py)
 */
const COGNITO_GROUP_TO_ROLE: Record<string, AppRole> = {
  [COGNITO_GROUPS.ADMIN]: APP_ROLES.ADMIN,
  [COGNITO_GROUPS.STUDENT]: APP_ROLES.STUDENT,
  [COGNITO_GROUPS.COORDINATOR]: APP_ROLES.COORDINATOR,
};

/**
 * Decodifica el payload de un JWT token sin verificar la firma.
 * 
 * @param token - Token JWT en formato string
 * @returns Payload decodificado como objeto
 * @throws Error si el token tiene formato inválido
 */
function decodeJwtPayload(token: string): Record<string, any> {
  try {
    // JWT tiene formato: header.payload.signature
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format: token must have 3 parts separated by dots');
    }
    
    // Decodificar el payload (segunda parte)
    const payload = parts[1];
    
    // Base64 URL decode
    // Reemplazar caracteres URL-safe y agregar padding si es necesario
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    
    // Decodificar base64
    const decoded = atob(padded);
    
    // Parsear JSON
    return JSON.parse(decoded);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to decode JWT payload: ${error.message}`);
    }
    throw new Error('Failed to decode JWT payload: unknown error');
  }
}

/**
 * Mapea un grupo de Cognito a su rol correspondiente en la aplicación.
 * 
 * @param cognitoGroup - Nombre del grupo de Cognito
 * @returns Rol de la aplicación o null si no hay mapeo
 */
export function getRoleFromCognitoGroup(cognitoGroup: string): AppRole | null {
  return COGNITO_GROUP_TO_ROLE[cognitoGroup] || null;
}

/**
 * Extrae los grupos de Cognito del payload del ID token.
 * 
 * @param idTokenPayload - Payload decodificado del ID token
 * @returns Array de nombres de grupos de Cognito
 */
export function extractCognitoGroups(idTokenPayload: Record<string, any>): string[] {
  const groups = idTokenPayload['cognito:groups'];
  
  if (!groups) {
    return [];
  }
  
  // Cognito puede devolver grupos como string o array
  if (typeof groups === 'string') {
    return [groups];
  }
  
  if (Array.isArray(groups)) {
    return groups;
  }
  
  return [];
}

/**
 * Extrae los roles de la aplicación desde un ID token de Cognito.
 * 
 * @param idToken - ID token JWT de Cognito
 * @returns Array de roles de la aplicación
 */
export function getRolesFromIdToken(idToken: string): AppRole[] {
  try {
    const payload = decodeJwtPayload(idToken);
    const cognitoGroups = extractCognitoGroups(payload);
    
    const roles: AppRole[] = [];
    for (const group of cognitoGroups) {
      const role = getRoleFromCognitoGroup(group);
      if (role) {
        roles.push(role);
      }
    }
    
    return roles;
  } catch (error) {
    console.error('Error extracting roles from ID token:', error);
    return [];
  }
}

/**
 * Determina el rol primario del usuario basado en sus grupos de Cognito.
 * Prioridad: ADMIN > COORDINATOR > STUDENT
 * 
 * @param idToken - ID token JWT de Cognito
 * @returns Rol primario o UNKNOWN si no se encuentra
 */
export function getPrimaryRoleFromIdToken(idToken: string): AppRole {
  const roles = getRolesFromIdToken(idToken);
  
  if (roles.length === 0) {
    return APP_ROLES.UNKNOWN;
  }
  
  // Prioridad: ADMIN > COORDINATOR > STUDENT
  if (roles.includes(APP_ROLES.ADMIN)) {
    return APP_ROLES.ADMIN;
  }
  
  if (roles.includes(APP_ROLES.COORDINATOR)) {
    return APP_ROLES.COORDINATOR;
  }
  
  if (roles.includes(APP_ROLES.STUDENT)) {
    return APP_ROLES.STUDENT;
  }
  
  // Si hay roles pero no son los conocidos, retornar el primero
  return roles[0];
}

/**
 * Extrae información completa del usuario desde el ID token.
 * 
 * @param idToken - ID token JWT de Cognito
 * @returns Objeto con rol primario, todos los roles, y grupos de Cognito
 */
export function extractUserInfoFromIdToken(idToken: string): {
  primaryRole: AppRole;
  roles: AppRole[];
  cognitoGroups: string[];
  userId?: string;
  email?: string;
  name?: string;
} {
  try {
    const payload = decodeJwtPayload(idToken);
    const cognitoGroups = extractCognitoGroups(payload);
    const roles = cognitoGroups
      .map(group => getRoleFromCognitoGroup(group))
      .filter((role): role is AppRole => role !== null);
    
    const primaryRole = roles.length > 0
      ? (roles.includes(APP_ROLES.ADMIN) ? APP_ROLES.ADMIN :
         roles.includes(APP_ROLES.COORDINATOR) ? APP_ROLES.COORDINATOR :
         roles.includes(APP_ROLES.STUDENT) ? APP_ROLES.STUDENT :
         roles[0])
      : APP_ROLES.UNKNOWN;
    
    return {
      primaryRole,
      roles,
      cognitoGroups,
      userId: payload.sub,
      email: payload.email,
      name: payload.name || payload['cognito:username'],
    };
  } catch (error) {
    console.error('Error extracting user info from ID token:', error);
    return {
      primaryRole: APP_ROLES.UNKNOWN,
      roles: [],
      cognitoGroups: [],
    };
  }
}

