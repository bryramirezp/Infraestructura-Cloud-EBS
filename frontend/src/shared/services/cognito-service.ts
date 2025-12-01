import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  ICognitoUserAttributeData,
} from 'amazon-cognito-identity-js';

/**
 * Configuración de Cognito desde variables de entorno
 */
const getUserPool = (): CognitoUserPool => {
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
  const region = import.meta.env.VITE_AWS_REGION || 'us-east-1';

  if (!userPoolId || !clientId) {
    throw new Error(
      'Cognito configuration missing. Please set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID'
    );
  }

  return new CognitoUserPool({
    UserPoolId: userPoolId,
    ClientId: clientId,
  });
};

/**
 * Interfaz para tokens de autenticación
 */
export interface CognitoTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
}

/**
 * Interfaz para resultado de autenticación
 */
export interface AuthenticationResult {
  tokens: CognitoTokens;
  user: CognitoUser;
}

/**
 * Servicio para interactuar con Amazon Cognito
 */
class CognitoService {
  private userPool: CognitoUserPool;

  constructor() {
    this.userPool = getUserPool();
  }

  /**
   * Autenticar usuario con email y contraseña
   */
  async authenticateUser(
    email: string,
    password: string
  ): Promise<AuthenticationResult> {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: this.userPool,
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          const tokens: CognitoTokens = {
            accessToken: result.getAccessToken().getJwtToken(),
            refreshToken: result.getRefreshToken().getToken(),
            idToken: result.getIdToken().getJwtToken(),
          };

          resolve({
            tokens,
            user: cognitoUser,
          });
        },
        onFailure: (err) => {
          // Mapear errores de Cognito a mensajes más amigables
          let errorMessage = 'Error de autenticación';
          
          if (err.code === 'NotAuthorizedException') {
            errorMessage = 'Credenciales inválidas. Verifica tu email y contraseña.';
          } else if (err.code === 'UserNotConfirmedException') {
            errorMessage = 'Tu cuenta no ha sido confirmada. Por favor verifica tu email.';
          } else if (err.code === 'PasswordResetRequiredException') {
            errorMessage = 'Debes cambiar tu contraseña. Por favor restablece tu contraseña.';
          } else if (err.code === 'UserNotFoundException') {
            errorMessage = 'Usuario no encontrado. Verifica tu email.';
          } else if (err.message) {
            errorMessage = err.message;
          }

          reject(new Error(errorMessage));
        },
        newPasswordRequired: (userAttributes, requiredAttributes) => {
          // Si se requiere nueva contraseña, rechazar con mensaje específico
          reject(
            new Error(
              'Se requiere establecer una nueva contraseña. Por favor restablece tu contraseña.'
            )
          );
        },
      });
    });
  }

  /**
   * Obtener usuario actual desde Cognito
   */
  async getCurrentUser(): Promise<CognitoUser | null> {
    return new Promise((resolve) => {
      const cognitoUser = this.userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.getSession((err: Error | null, session: any) => {
          if (err || !session.isValid()) {
            resolve(null);
          } else {
            resolve(cognitoUser);
          }
        });
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Obtener tokens del usuario actual
   */
  async getCurrentUserTokens(): Promise<CognitoTokens | null> {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.userPool.getCurrentUser();
      if (!cognitoUser) {
        resolve(null);
        return;
      }

      cognitoUser.getSession((err: Error | null, session: any) => {
        if (err || !session.isValid()) {
          resolve(null);
          return;
        }

        const tokens: CognitoTokens = {
          accessToken: session.getAccessToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken(),
          idToken: session.getIdToken().getJwtToken(),
        };

        resolve(tokens);
      });
    });
  }

  /**
   * Refrescar tokens usando refresh token
   */
  async refreshTokens(refreshToken: string): Promise<CognitoTokens> {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.userPool.getCurrentUser();
      if (!cognitoUser) {
        reject(new Error('No hay usuario autenticado'));
        return;
      }

      cognitoUser.refreshSession(refreshToken, (err: Error | null, session: any) => {
        if (err || !session.isValid()) {
          reject(new Error('Error al refrescar tokens'));
          return;
        }

        const tokens: CognitoTokens = {
          accessToken: session.getAccessToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken(),
          idToken: session.getIdToken().getJwtToken(),
        };

        resolve(tokens);
      });
    });
  }

  /**
   * Cerrar sesión del usuario actual
   */
  async signOut(): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.signOut(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Verificar si hay un usuario autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}

/**
 * Instancia singleton del servicio de Cognito
 */
export const cognitoService = new CognitoService();

export default cognitoService;

