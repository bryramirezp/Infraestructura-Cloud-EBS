# Colección de Postman - EBS API

Colección completa de endpoints para probar el backend FastAPI de Escuela Bíblica Salem.

## 🚀 Inicio Rápido

**¿Primera vez usando esta colección?** → Ve a [GUIA_EJECUCION.md](GUIA_EJECUCION.md) para una guía paso a paso detallada.

**Resumen rápido:**
1. Importa la colección y el entorno en Postman
2. Obtén tokens de Cognito (ver guía)
3. Ejecuta **Auth > Set Tokens** para autenticarte
4. ¡Comienza a probar endpoints!

## Importación

### 1. Importar Colección

1. Abre Postman
2. Click en **Import** (botón superior izquierdo)
3. Selecciona el archivo `EBS_API_Collection.json`
4. Click en **Import**

### 2. Importar Entorno

1. Click en el ícono de **Environments** (ojo) en la barra superior
2. Click en **Import**
3. Selecciona el archivo `EBS_API_Environment.json`
4. Click en **Import**
5. Selecciona el entorno **EBS API - Development** en el dropdown

## Configuración Inicial

### Variables de Entorno

El entorno incluye las siguientes variables:

- `base_url`: URL base del backend (por defecto: `http://localhost:5000`)
- `api_base`: URL base de la API (`{{base_url}}/api`)
- Variables para IDs dinámicos (usuario_id, curso_id, modulo_id, etc.)
- Variables para tokens (access_token, refresh_token, id_token)

### Actualizar Variables

Puedes actualizar las variables directamente en el entorno o desde scripts de Postman:

```javascript
pm.environment.set("base_url", "http://localhost:5000");
pm.environment.set("curso_id", "tu-uuid-aqui");
```

## Autenticación

El backend usa AWS Cognito con autenticación mediante cookies HTTP-only. Para pruebas en Postman, hay dos métodos:

### Método 1: Usar `/api/auth/set-tokens` (Recomendado para desarrollo)

Este método permite establecer tokens manualmente:

1. **Obtener tokens de Cognito**:
   - Usa las credenciales de prueba: `email: user@example.com ; password: Usuario123`
   - Autentícate en Cognito Hosted UI o usa AWS CLI/SDK para obtener tokens
   - Los tokens necesarios son: `access_token`, `refresh_token`, `id_token`

2. **Establecer tokens en Postman**:
   - Abre el request **Auth > Set Tokens**
   - Actualiza las variables de entorno con tus tokens:
     ```json
     {
       "access_token": "tu-access-token",
       "refresh_token": "tu-refresh-token",
       "id_token": "tu-id-token"
     }
     ```
   - Ejecuta el request
   - Los tokens se establecerán como cookies HTTP-only automáticamente

3. **Verificar autenticación**:
   - Ejecuta **Auth > Get Tokens** para verificar que las cookies están configuradas
   - Ejecuta **Usuarios > Get Profile** para verificar que la autenticación funciona

### Método 2: Flujo OAuth2 Completo (Avanzado)

1. Ejecuta **Auth > Login** (esto redirige a Cognito)
2. Autentícate en Cognito Hosted UI
3. Cognito redirige a `/api/auth/callback` con `code` y `state`
4. El backend establece las cookies automáticamente

**Nota**: Este método es más complejo en Postman porque requiere manejar redirecciones.

## Uso de Variables

### IDs Dinámicos

Muchos endpoints requieren IDs (UUIDs) de recursos. Puedes:

1. **Usar variables de entorno**: Actualiza `curso_id`, `modulo_id`, etc. en el entorno
2. **Extraer IDs de respuestas**: Usa scripts de test para guardar IDs automáticamente:

```javascript
// En el test script de "Create Curso"
var jsonData = pm.response.json();
pm.environment.set("curso_id", jsonData.id);
```

### Ejemplo de Flujo

1. **Crear un módulo**:
   - Ejecuta `Modulos > Create Modulo`
   - El test script guarda el `modulo_id` en la variable de entorno

2. **Crear un curso**:
   - Ejecuta `Cursos > Create Curso`
   - El test script guarda el `curso_id`

3. **Asociar curso al módulo**:
   - Usa los IDs guardados en requests posteriores

## Estructura de la Colección

La colección está organizada en las siguientes carpetas:

- **Auth**: Endpoints de autenticación
- **Health & Root**: Endpoints básicos del servidor
- **Usuarios**: Gestión de usuarios y perfiles
- **Modulos**: Gestión de módulos
- **Cursos**: Gestión de cursos
- **Lecciones**: Gestión de lecciones
- **Quizzes**: Gestión de quizzes e intentos
- **Examenes Finales**: Gestión de exámenes finales
- **Inscripciones**: Gestión de inscripciones a cursos
- **Progreso**: Consulta de progreso y métricas
- **Foro**: Gestión de comentarios en foros
- **Preferencias**: Gestión de preferencias de notificación
- **Certificados**: Gestión de certificados
- **Administración**: Endpoints de administración (requieren rol ADMIN)

## Scripts de Prueba

Muchos endpoints incluyen scripts de prueba que validan:

- Status codes esperados
- Estructura de respuestas JSON
- Presencia de campos requeridos
- Tipos de datos

### Ver Resultados de Tests

1. Ejecuta un request
2. Ve a la pestaña **Test Results**
3. Revisa los resultados de las validaciones

### Agregar Tests Personalizados

Puedes agregar tests personalizados en la pestaña **Tests** de cualquier request:

```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response contains expected field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("id");
});
```

## Permisos y Roles

Algunos endpoints requieren roles específicos:

- **STUDENT**: Usuario estudiante (por defecto)
- **COORDINATOR**: Coordinador
- **ADMIN**: Administrador

### Endpoints que Requieren ADMIN:

- Crear/Actualizar módulos, cursos, lecciones
- Endpoints de administración (`/api/admin/*`)
- Listar todos los usuarios

### Endpoints que Requieren Autenticación:

- La mayoría de endpoints requieren autenticación
- Algunos endpoints públicos: Health, Root, Verificar Certificado

## Troubleshooting

### Error 401 (Unauthorized)

- Verifica que hayas ejecutado **Set Tokens** correctamente
- Verifica que las cookies estén configuradas (usa **Get Tokens**)
- Los tokens pueden haber expirado, ejecuta **Refresh** o **Set Tokens** nuevamente

### Error 403 (Forbidden)

- Verifica que tu usuario tenga el rol necesario
- Algunos endpoints requieren rol ADMIN o COORDINATOR

### Error 422 (Validation Error)

- Revisa el body del request
- Verifica que los campos requeridos estén presentes
- Revisa los tipos de datos (UUIDs, fechas, etc.)

### Cookies No Se Establecen

- Verifica que `base_url` esté configurado correctamente
- En desarrollo, las cookies funcionan en `localhost`
- Postman maneja cookies automáticamente, pero verifica en **Cookies** (botón en la barra de herramientas)

## Credenciales de Prueba

```
Email: user@example.com
Password: Usuario123
```

**Nota**: Estas credenciales son solo para desarrollo. Asegúrate de tener un usuario creado en Cognito con estas credenciales.

## Recursos Adicionales

- Documentación de la API: `http://localhost:5000/docs` (solo en desarrollo)
- ReDoc: `http://localhost:5000/redoc` (solo en desarrollo)

## Notas Importantes

1. **Cookies HTTP-only**: Postman maneja cookies automáticamente, pero no puedes verlas directamente (son HTTP-only)
2. **Variables de entorno**: Actualiza las variables según necesites para tus pruebas
3. **IDs dinámicos**: Usa los scripts de test para guardar IDs automáticamente
4. **Ambiente de desarrollo**: Esta colección está configurada para `localhost:5000`. Ajusta `base_url` para otros ambientes

