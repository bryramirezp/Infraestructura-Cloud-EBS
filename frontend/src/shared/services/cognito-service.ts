import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  GetUserCommand,
  GlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider';

/**
 * Configuración de Cognito desde variables de entorno
 */
const getClientId = (): string => {
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
  if (!clientId) {
    throw new Error('Cognito configuration missing. Please set VITE_COGNITO_CLIENT_ID');
  }
  return clientId;
};

const getRegion = (): string => {
  return import.meta.env.VITE_AWS_REGION || import.meta.env.VITE_COGNITO_REGION || 'us-east-1';
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
}

/**
 * Interfaz para respuesta de autenticación con challenge
 */
export interface AuthChallengeResponse {
  challengeName?: string;
  session?: string;
  tokens?: CognitoTokens;
}

/**
 * Servicio para interactuar con Amazon Cognito usando AWS SDK v3
 */
class CognitoService {
  private client: CognitoIdentityProviderClient;
  private clientId: string;

  constructor() {
    const region = getRegion();
    this.client = new CognitoIdentityProviderClient({ region });
    this.clientId = getClientId();
  }

  /**
   * Autenticar usuario con email y contraseña
   * Retorna tokens si es exitoso, o información del challenge si se requiere nueva contraseña
   */
  async authenticateUser(
    email: string,
    password: string
  ): Promise<AuthChallengeResponse> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const response = await this.client.send(command);

      // Si hay un challenge (ej: NEW_PASSWORD_REQUIRED)
      if (response.ChallengeName) {
        return {
          challengeName: response.ChallengeName,
          session: response.Session,
        };
      }

      // Autenticación exitosa
      if (response.AuthenticationResult) {
        const tokens: CognitoTokens = {
          accessToken: response.AuthenticationResult.AccessToken || '',
          refreshToken: response.AuthenticationResult.RefreshToken || '',
          idToken: response.AuthenticationResult.IdToken || '',
        };

        return {
          tokens,
        };
      }

      throw new Error('Respuesta de autenticación inválida');
    } catch (error: any) {
      // Mapear errores de Cognito a mensajes más amigables
      let errorMessage = 'Error de autenticación';

      if (error.name === 'NotAuthorizedException') {
        errorMessage = 'Credenciales inválidas. Verifica tu email y contraseña.';
      } else if (error.name === 'UserNotConfirmedException') {
        errorMessage = 'Tu cuenta no ha sido confirmada. Por favor verifica tu email.';
      } else if (error.name === 'PasswordResetRequiredException') {
        errorMessage = 'Debes cambiar tu contraseña. Por favor restablece tu contraseña.';
      } else if (error.name === 'UserNotFoundException') {
        errorMessage = 'Usuario no encontrado. Verifica tu email.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Completar el flujo de cambio de contraseña forzado
   */
  async completeForceChangePassword(
    username: string,
    temporaryPassword: string,
    newPassword: string
  ): Promise<AuthenticationResult> {
    try {
      // Paso 1: Iniciar autenticación con contraseña temporal
      const initiateCommand = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: temporaryPassword,
        },
      });

      const initiateResponse = await this.client.send(initiateCommand);

      // Verificar si se requiere cambio de contraseña
      if (initiateResponse.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        if (!initiateResponse.Session) {
          throw new Error('Session no disponible para el challenge');
        }

        // Paso 2: Responder al challenge con la nueva contraseña
        const respondCommand = new RespondToAuthChallengeCommand({
          ChallengeName: 'NEW_PASSWORD_REQUIRED',
          ClientId: this.clientId,
          ChallengeResponses: {
            USERNAME: username,
            NEW_PASSWORD: newPassword,
          },
          Session: initiateResponse.Session,
        });

        const respondResponse = await this.client.send(respondCommand);

        if (!respondResponse.AuthenticationResult) {
          throw new Error('No se recibieron tokens después del cambio de contraseña');
        }

        const tokens: CognitoTokens = {
          accessToken: respondResponse.AuthenticationResult.AccessToken || '',
          refreshToken: respondResponse.AuthenticationResult.RefreshToken || '',
          idToken: respondResponse.AuthenticationResult.IdToken || '',
        };

        return { tokens };
      }

      // Si no hay challenge, la autenticación fue directa
      if (initiateResponse.AuthenticationResult) {
        const tokens: CognitoTokens = {
          accessToken: initiateResponse.AuthenticationResult.AccessToken || '',
          refreshToken: initiateResponse.AuthenticationResult.RefreshToken || '',
          idToken: initiateResponse.AuthenticationResult.IdToken || '',
        };

        return { tokens };
      }

      throw new Error('Respuesta de autenticación inválida');
    } catch (error: any) {
      let errorMessage = 'Error al establecer nueva contraseña';

      if (error.name === 'InvalidPasswordException') {
        errorMessage = 'La contraseña no cumple con los requisitos de seguridad.';
      } else if (error.name === 'InvalidParameterException') {
        errorMessage = 'Parámetros inválidos. Verifica los datos ingresados.';
      } else if (error.name === 'NotAuthorizedException') {
        errorMessage = 'Credenciales inválidas. Verifica tu contraseña temporal.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Obtener información del usuario actual usando access token
   */
  async getCurrentUser(accessToken: string): Promise<any> {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const response = await this.client.send(command);
      return response;
    } catch (error: any) {
      console.error('Error al obtener usuario:', error);
      return null;
    }
  }

  /**
   * Obtener tokens del usuario actual (requiere access token almacenado)
   * Nota: En SDK v3, necesitamos almacenar los tokens explícitamente
   */
  async getCurrentUserTokens(accessToken?: string): Promise<CognitoTokens | null> {
    // En SDK v3, los tokens deben ser almacenados por la aplicación
    // Este método ahora requiere que se pasen los tokens almacenados
    // o se puede implementar un sistema de almacenamiento
    if (!accessToken) {
      return null;
    }

    // Verificar que el token es válido obteniendo el usuario
    const user = await this.getCurrentUser(accessToken);
    if (!user) {
      return null;
    }

    // Los tokens deben ser recuperados del almacenamiento de la aplicación
    // Este es un placeholder - la implementación real dependerá de cómo se almacenen
    return null;
  }

  /**
   * Refrescar tokens usando refresh token
   */
  async refreshTokens(refreshToken: string): Promise<CognitoTokens> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: this.clientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });

      const response = await this.client.send(command);

      if (!response.AuthenticationResult) {
        throw new Error('No se recibieron tokens al refrescar');
      }

      const tokens: CognitoTokens = {
        accessToken: response.AuthenticationResult.AccessToken || '',
        refreshToken: refreshToken, // El refresh token no cambia
        idToken: response.AuthenticationResult.IdToken || '',
      };

      return tokens;
    } catch (error: any) {
      throw new Error('Error al refrescar tokens: ' + (error.message || 'Error desconocido'));
    }
  }

  /**
   * Cerrar sesión del usuario actual
   */
  async signOut(accessToken: string): Promise<void> {
    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken,
      });

      await this.client.send(command);
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      // No lanzar error, solo registrar
    }
  }

  /**
   * Verificar si hay un usuario autenticado (requiere access token)
   */
  async isAuthenticated(accessToken?: string): Promise<boolean> {
    if (!accessToken) {
      return false;
    }

    const user = await this.getCurrentUser(accessToken);
    return user !== null;
  }
}

/**
 * Instancia singleton del servicio de Cognito
 */
export const cognitoService = new CognitoService();

export default cognitoService;
