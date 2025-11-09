import { 
  CognitoUserPool, 
  CognitoUser, 
  AuthenticationDetails,
  CognitoUserSession 
} from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
};

const userPool = new CognitoUserPool(poolData);

/**
 * Inicia sesión con Cognito
 * @param email - Email del usuario
 * @param password - Contraseña del usuario
 * @returns Promise con la sesión de Cognito
 */
export const signIn = (
  email: string, 
  password: string
): Promise<CognitoUserSession> => {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        resolve(session);
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
};

/**
 * Obtiene el token de acceso del usuario actual
 * @returns Promise con el token de acceso o null si no hay sesión
 */
export const getAccessToken = async (): Promise<string | null> => {
  const cognitoUser = userPool.getCurrentUser();
  if (!cognitoUser) {
    return null;
  }

  return new Promise((resolve) => {
    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session) {
        resolve(null);
        return;
      }
      if (session.isValid()) {
        resolve(session.getAccessToken().getJwtToken());
      } else {
        resolve(null);
      }
    });
  });
};

/**
 * Obtiene el ID token del usuario actual
 * @returns Promise con el ID token o null si no hay sesión
 */
export const getIdToken = async (): Promise<string | null> => {
  const cognitoUser = userPool.getCurrentUser();
  if (!cognitoUser) {
    return null;
  }

  return new Promise((resolve) => {
    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session) {
        resolve(null);
        return;
      }
      if (session.isValid()) {
        resolve(session.getIdToken().getJwtToken());
      } else {
        resolve(null);
      }
    });
  });
};

/**
 * Cierra la sesión del usuario actual
 */
export const signOut = (): Promise<void> => {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
  return Promise.resolve();
};

/**
 * Obtiene el usuario actual de Cognito
 * @returns El objeto CognitoUser o null
 */
export const getCurrentUser = () => {
  return userPool.getCurrentUser();
};

/**
 * Obtiene el UserPool de Cognito (útil para otros casos de uso)
 */
export const getUserPool = () => {
  return userPool;
};

