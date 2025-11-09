# Plan Detallado: Eliminación de AWS Amplify y Migración a Cognito Directo

## Objetivo
Eliminar dependencias de AWS Amplify y migrar a uso directo de Cognito Identity JS con Fetch API nativo.

---

## PASO 1: Instalar Amazon Cognito Identity JS

### Acción
Instalar el paquete necesario para autenticación con Cognito (sin Amplify).

### Comando
```bash
cd frontend
npm install amazon-cognito-identity-js
```

### Verificación
- Verificar que `package.json` incluya `amazon-cognito-identity-js` en `dependencies`
- Versión esperada: `^6.x.x` (más reciente compatible)

### Notas
- Este paquete es ligero y solo maneja autenticación
- No requiere configuración global como Amplify
- Se usará directamente en el código

---

## PASO 2: Crear archivo `cognito.ts`

### Archivo a crear
`frontend/src/shared/aws/cognito.ts`

### Contenido del archivo
```typescript
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
```

### Verificación
- Archivo creado en la ruta correcta
- Todas las funciones exportadas
- Tipos TypeScript correctos
- Manejo de errores implementado

### Notas
- Las funciones retornan `null` en lugar de lanzar errores cuando no hay sesión
- Esto permite que el código maneje graciosamente usuarios no autenticados
- `getAccessToken` se usará en `api-client.ts` para agregar tokens a las peticiones

---

## PASO 3: Refactorizar `api-client.ts`

### Archivo a modificar
`frontend/src/shared/api/api-client.ts`

### Cambios a realizar

#### 3.1 Eliminar imports de Amplify
- Eliminar: `import { API, Auth } from 'aws-amplify';`
- Agregar: `import { getAccessToken } from '../aws/cognito';`

#### 3.2 Agregar constante para API_URL
- Agregar: `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';`
- Usar esta constante en lugar de `apiName`

#### 3.3 Refactorizar método `getAuthToken()`
- Cambiar para usar `getAccessToken()` de `cognito.ts`
- Retornar `string | null` en lugar de lanzar error
- Manejar el caso cuando no hay token

#### 3.4 Crear método privado `request()`
- Método helper para realizar peticiones con `fetch`
- Manejar headers, tokens, y errores HTTP
- Retornar `Response` para procesamiento

#### 3.5 Refactorizar métodos HTTP (GET, POST, PUT, DELETE)
- Reemplazar `API.get/post/put/del` por llamadas a `fetch`
- Usar el método `request()` helper
- Retornar `.json()` directamente en lugar de `response.data`
- Manejar query parameters en GET correctamente

#### 3.6 Mantener métodos específicos de dominio
- Los métodos como `getCourses()`, `createUser()`, etc. se mantienen
- Solo cambian internamente para usar fetch en lugar de Amplify API

### Código completo del archivo refactorizado
```typescript
import { getAccessToken } from '../aws/cognito';
import { API_ENDPOINTS } from './endpoints';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * API Client Service
 * 
 * Cliente base para todas las llamadas a la API usando Fetch API nativo.
 * Utiliza los endpoints definidos en endpoints.ts y maneja la autenticación automáticamente.
 */
class APIClient {
  /**
   * Obtiene el token de autenticación del usuario actual
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      return await getAccessToken();
    } catch (error) {
      console.warn('No se pudo obtener el token de autenticación:', error);
      return null;
    }
  }

  /**
   * Realiza una petición HTTP genérica
   */
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = await this.getAuthToken();
    const url = `${API_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Si la respuesta no es JSON, usar el texto
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      }
      throw new Error(errorMessage);
    }

    return response;
  }

  /**
   * Realiza una petición GET
   */
  async get(endpoint: string, queryParams?: Record<string, any>) {
    let fullEndpoint = endpoint;
    if (queryParams) {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      const queryString = params.toString();
      if (queryString) {
        fullEndpoint = `${endpoint}?${queryString}`;
      }
    }

    const response = await this.request(fullEndpoint, {
      method: 'GET',
    });

    return response.json();
  }

  /**
   * Realiza una petición POST
   */
  async post(endpoint: string, data?: any) {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });

    return response.json();
  }

  /**
   * Realiza una petición PUT
   */
  async put(endpoint: string, data?: any) {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });

    return response.json();
  }

  /**
   * Realiza una petición DELETE
   */
  async delete(endpoint: string) {
    const response = await this.request(endpoint, {
      method: 'DELETE',
    });

    // Algunos endpoints DELETE pueden retornar contenido, otros no
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return null;
  }

  // ===== Métodos específicos de dominio =====

  // Courses API
  async getCourses(filters?: any) {
    return this.get(API_ENDPOINTS.COURSES.BASE, filters);
  }

  async getCourseById(courseId: string | number) {
    return this.get(API_ENDPOINTS.COURSES.BY_ID(courseId));
  }

  async createCourse(courseData: any) {
    return this.post(API_ENDPOINTS.COURSES.BASE, courseData);
  }

  async updateCourse(courseId: string | number, courseData: any) {
    return this.put(API_ENDPOINTS.COURSES.BY_ID(courseId), courseData);
  }

  async deleteCourse(courseId: string | number) {
    return this.delete(API_ENDPOINTS.COURSES.BY_ID(courseId));
  }

  // Users API
  async getUsers(filters?: any) {
    return this.get(API_ENDPOINTS.USERS.BASE, filters);
  }

  async getUserById(userId: string | number) {
    return this.get(API_ENDPOINTS.USERS.BY_ID(userId));
  }

  async createUser(userData: any) {
    return this.post(API_ENDPOINTS.USERS.BASE, userData);
  }

  async updateUser(userId: string | number, userData: any) {
    return this.put(API_ENDPOINTS.USERS.BY_ID(userId), userData);
  }

  // Exams API
  async submitExam(examId: string | number, examData: any) {
    return this.post(API_ENDPOINTS.EXAMS.SUBMIT(examId), examData);
  }
}

/**
 * Instancia singleton del cliente API
 */
export const apiClient = new APIClient();

/**
 * Exportación por defecto para compatibilidad
 */
export default apiClient;
```

### Verificación
- No hay imports de `aws-amplify`
- Todos los métodos HTTP usan `fetch`
- El token se obtiene de `cognito.ts`
- Los métodos específicos de dominio funcionan igual
- Manejo de errores mejorado

### Notas
- La API pública de `apiClient` no cambia (mismo comportamiento externo)
- Los componentes que usan `apiClient` no necesitan cambios
- Las respuestas ahora son JSON directo (no `response.data`)
- Query parameters se manejan correctamente en GET

---

## PASO 4: Eliminar archivo `aws.ts`

### Archivo a eliminar
`frontend/src/shared/config/aws.ts`

### Acción
Eliminar completamente el archivo ya que solo configuraba Amplify.

### Verificación
- Archivo eliminado
- No hay referencias a este archivo en otros lugares (excepto `main.tsx` que se actualizará)

### Notas
- Este archivo solo contenía configuración de Amplify
- No se necesita para Cognito directo
- La configuración de Cognito está en `cognito.ts`

---

## PASO 5: Actualizar `main.tsx`

### Archivo a modificar
`frontend/src/main.tsx`

### Cambios a realizar

#### 5.1 Eliminar import de aws.ts
- Eliminar la línea: `import './shared/config/aws';`

### Código actualizado
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initTheme } from './app/styles/theme';

// Inicializar tema antes de renderizar
initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### Verificación
- No hay imports de `aws.ts`
- La aplicación se inicializa correctamente
- No hay errores en consola relacionados con Amplify

### Notas
- Ya no se necesita inicializar Amplify globalmente
- Cognito se inicializa cuando se usa (lazy initialization)
- No hay configuración global necesaria

---

## PASO 6: Desinstalar paquetes de Amplify

### Paquetes a desinstalar
- `aws-amplify`
- `@aws-amplify/ui-react`

### Comando
```bash
cd frontend
npm uninstall aws-amplify @aws-amplify/ui-react
```

### Verificación
- Verificar que `package.json` no contenga estos paquetes
- Verificar que `package-lock.json` se actualice
- Verificar que `node_modules` no contenga estos paquetes

### Notas
- Estos paquetes ya no se necesitan
- Reducirán el tamaño del bundle significativamente
- No hay dependencias rotas (ya reemplazadas)

---

## PASO 7: Verificar que no haya referencias a Amplify

### Búsqueda de referencias
```bash
# Buscar en el código fuente
grep -r "aws-amplify" frontend/src
grep -r "Amplify" frontend/src
grep -r "@aws-amplify" frontend/src
```

### Archivos a verificar
- `frontend/src/**/*.ts`
- `frontend/src/**/*.tsx`
- `frontend/src/**/*.js`
- `frontend/src/**/*.jsx`

### Acciones si se encuentran referencias
- Identificar el archivo
- Determinar si es necesario
- Refactorizar o eliminar según corresponda

### Verificación esperada
- No hay referencias a `aws-amplify` en el código
- No hay referencias a `Amplify` (excepto comentarios si los hay)
- No hay imports de `@aws-amplify/ui-react`

---

## PASO 8: Actualizar variables de entorno (opcional)

### Archivo a crear/modificar
`frontend/.env` o `frontend/.env.example`

### Variables necesarias
```env
VITE_API_URL=http://localhost:8000/api
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxx
```

### Notas
- Estas variables ya se usaban, solo verificar que existan
- `VITE_API_URL` es nueva y se usa en `api-client.ts`
- Las variables de Cognito se usan en `cognito.ts`

---

## PASO 9: Compilar y verificar

### Comandos de verificación
```bash
cd frontend
npm run build
npm run lint
```

### Verificaciones
- ✅ La compilación termina sin errores
- ✅ No hay errores de TypeScript
- ✅ No hay errores de linter
- ✅ No hay warnings relacionados con Amplify
- ✅ El bundle se genera correctamente

### Pruebas manuales (si es posible)
- ✅ La aplicación inicia sin errores
- ✅ No hay errores en consola del navegador
- ✅ Las peticiones API funcionan (si el backend está disponible)
- ✅ La autenticación funciona (si Cognito está configurado)

---

## PASO 10: Actualizar documentación (si es necesario)

### Archivos a revisar
- `README.md` en frontend
- `README_Frontend.md` (ya actualizado)
- Cualquier otro documento que mencione Amplify

### Cambios a realizar
- Eliminar referencias a Amplify
- Actualizar instrucciones de instalación
- Actualizar ejemplos de código si los hay

---

## Resumen de Cambios

### Archivos creados
1. `frontend/src/shared/aws/cognito.ts` - Utilidades de Cognito

### Archivos modificados
1. `frontend/src/shared/api/api-client.ts` - Refactorizado para usar Fetch
2. `frontend/src/main.tsx` - Eliminado import de aws.ts
3. `frontend/package.json` - Eliminados paquetes de Amplify, agregado Cognito Identity JS

### Archivos eliminados
1. `frontend/src/shared/config/aws.ts` - Ya no necesario

### Dependencias
- ❌ Eliminadas: `aws-amplify`, `@aws-amplify/ui-react`
- ✅ Agregadas: `amazon-cognito-identity-js`

---

## Orden de Ejecución Recomendado

1. **PASO 1**: Instalar `amazon-cognito-identity-js`
2. **PASO 2**: Crear `cognito.ts`
3. **PASO 3**: Refactorizar `api-client.ts`
4. **PASO 4**: Eliminar `aws.ts`
5. **PASO 5**: Actualizar `main.tsx`
6. **PASO 6**: Desinstalar paquetes de Amplify
7. **PASO 7**: Verificar referencias
8. **PASO 8**: Actualizar variables de entorno
9. **PASO 9**: Compilar y verificar
10. **PASO 10**: Actualizar documentación

---

## Notas Finales

- La migración es **backward compatible** en términos de API pública
- Los componentes que usan `apiClient` **no necesitan cambios**
- El `AuthProvider` actual usa mock, pero puede integrarse con Cognito después
- La aplicación seguirá funcionando con mocks hasta que se configure Cognito
- El tamaño del bundle se reducirá significativamente

---

## Rollback (en caso de problemas)

Si algo sale mal, se puede revertir:
1. Reinstalar Amplify: `npm install aws-amplify @aws-amplify/ui-react`
2. Restaurar `api-client.ts` desde git
3. Restaurar `aws.ts` desde git
4. Restaurar `main.tsx` desde git

Pero con este plan detallado, no debería ser necesario.

