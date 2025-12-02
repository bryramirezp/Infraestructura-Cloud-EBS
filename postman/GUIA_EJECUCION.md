# Guía de Ejecución - Pruebas Postman

Guía paso a paso para ejecutar las pruebas de la API EBS con Postman.

## 📋 Requisitos Previos

1. **Postman instalado** ([Descargar](https://www.postman.com/downloads/))
2. **Backend ejecutándose** en `http://localhost:5000`
3. **Usuario creado en Cognito** con las credenciales:
   - Email: `user@example.com`
   - Password: `Usuario123`

## 🚀 Paso 1: Importar Colección y Entorno

### 1.1 Importar Colección

1. Abre Postman
2. Click en **Import** (esquina superior izquierda)
3. Selecciona `EBS_API_Collection.json`
4. Click en **Import**

### 1.2 Importar Entorno

1. Click en el ícono de **Environments** (👁️) en la barra superior
2. Click en **Import**
3. Selecciona `EBS_API_Environment.json`
4. Click en **Import**
5. Selecciona **EBS API - Development** en el dropdown de entornos (arriba a la derecha)

## 🔐 Paso 2: Configurar Autenticación

### Opción A: Usar Script de Python (Recomendado)

**Script incluido**: Ya existe un script `get_tokens.py` en esta carpeta.

1. **Instalar dependencias**:
   ```bash
   pip install boto3
   ```

2. **Configurar variables** (edita `get_tokens.py` o usa variables de entorno):
   ```bash
   export COGNITO_USER_POOL_ID=us-east-1_XXXXX
   export COGNITO_CLIENT_ID=XXXXX
   export COGNITO_USERNAME=user@example.com
   export COGNITO_PASSWORD=Usuario123
   ```

3. **Ejecutar el script**:
   ```bash
   python get_tokens.py
   ```

4. **Copiar tokens**: El script mostrará los tokens y los guardará en `tokens.json`

5. **Usar en Postman**: Copia los tokens a las variables de entorno en Postman

### Opción B: Usar AWS CLI

```bash
aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-1_XXXXX \
  --client-id XXXXX \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=user@example.com,PASSWORD=Usuario123 \
  --region us-east-1
```

### Opción C: Usar Postman directamente (más complejo)

1. Ejecuta **Auth > Login** (esto abrirá Cognito en el navegador)
2. Autentícate manualmente
3. Copia el `code` de la URL de redirección
4. Usa **Auth > Callback GET** con el `code` y `state`

## 🔧 Paso 3: Establecer Tokens en Postman

### 3.1 Actualizar Variables de Entorno

1. Click en el ícono de **Environments** (👁️)
2. Selecciona **EBS API - Development**
3. Actualiza las variables:
   - `access_token`: Pega tu access token
   - `refresh_token`: Pega tu refresh token
   - `id_token`: Pega tu id token

### 3.2 Ejecutar Set Tokens

1. En la colección, ve a **Auth > Set Tokens**
2. Verifica que el body tenga los tokens correctos:
   ```json
   {
     "access_token": "{{access_token}}",
     "refresh_token": "{{refresh_token}}",
     "id_token": "{{id_token}}"
   }
   ```
3. Click en **Send**
4. Deberías ver status `200` y respuesta con información del usuario

### 3.3 Verificar Autenticación

1. Ejecuta **Auth > Get Tokens**
2. Deberías ver los tokens en la respuesta
3. Ejecuta **Usuarios > Get Profile**
4. Deberías ver tu perfil de usuario

✅ **Si estos pasos funcionan, estás autenticado correctamente.**

## 🧪 Paso 4: Ejecutar Pruebas

### 4.1 Pruebas Básicas (Sin Autenticación)

1. **Health Check**: `Health & Root > Health Check`
   - Debería retornar `{"status": "ok"}`

2. **Root**: `Health & Root > Root`
   - Debería retornar información de la API

### 4.2 Pruebas de Usuario

1. **Get Profile**: `Usuarios > Get Profile`
   - Requiere autenticación
   - Retorna tu perfil de usuario

2. **Update Profile**: `Usuarios > Update Profile`
   - Actualiza tu nombre, apellido o avatar
   - Body de ejemplo:
     ```json
     {
       "nombre": "Juan",
       "apellido": "Pérez",
       "avatar_url": "https://example.com/avatar.jpg"
     }
     ```

### 4.3 Pruebas de Contenido

1. **List Modulos**: `Modulos > List Modulos`
   - Lista todos los módulos disponibles

2. **List Cursos**: `Cursos > List Cursos`
   - Lista todos los cursos

3. **Get Curso**: `Cursos > Get Curso`
   - Necesitas un `curso_id` válido
   - Actualiza la variable `curso_id` en el entorno

### 4.4 Flujo Completo de Ejemplo

**Crear un Módulo:**
1. Ve a `Modulos > Create Modulo`
2. Body:
   ```json
   {
     "titulo": "Módulo de Prueba",
     "fecha_inicio": "2025-01-01",
     "fecha_fin": "2025-12-31",
     "publicado": true
   }
   ```
3. Ejecuta el request
4. **Importante**: El test script guarda el `modulo_id` automáticamente

**Crear un Curso:**
1. Ve a `Cursos > Create Curso`
2. Body:
   ```json
   {
     "titulo": "Curso de Prueba",
     "descripcion": "Descripción del curso",
     "publicado": true
   }
   ```
3. Ejecuta el request
4. El `curso_id` se guarda automáticamente

**Inscribirse al Curso:**
1. Ve a `Inscripciones > Create Inscripcion`
2. Body (usa el `curso_id` guardado):
   ```json
   {
     "curso_id": "{{curso_id}}"
   }
   ```
3. Ejecuta el request

## 📊 Paso 5: Ver Resultados de Tests

Cada request con tests muestra resultados en la pestaña **Test Results**:

1. Ejecuta cualquier request
2. Ve a la pestaña **Test Results** (debajo del response)
3. Verás checkmarks verdes (✅) para tests que pasaron
4. Verás X rojas (❌) para tests que fallaron

### Ejemplo de Tests Exitosos:

```
✓ Status code is 200
✓ Response contains user profile
✓ Response contains id field
```

## 🔄 Paso 6: Refrescar Tokens

Los tokens expiran después de un tiempo. Para refrescarlos:

1. Ejecuta **Auth > Refresh**
2. Esto actualiza el `access_token` usando el `refresh_token`
3. Las cookies se actualizan automáticamente

**Nota**: Si el `refresh_token` también expiró, necesitas ejecutar **Set Tokens** nuevamente.

## 🐛 Troubleshooting

### Error 401 (Unauthorized)

**Problema**: No estás autenticado o los tokens expiraron.

**Solución**:
1. Verifica que hayas ejecutado **Set Tokens** correctamente
2. Ejecuta **Get Tokens** para verificar que las cookies estén configuradas
3. Si los tokens expiraron, ejecuta **Refresh** o **Set Tokens** nuevamente

### Error 403 (Forbidden)

**Problema**: Tu usuario no tiene el rol necesario.

**Solución**:
- Algunos endpoints requieren rol `ADMIN` o `COORDINATOR`
- Verifica los roles de tu usuario en Cognito
- Usa un usuario con los roles apropiados

### Error 422 (Validation Error)

**Problema**: El body del request tiene datos inválidos.

**Solución**:
1. Revisa el body del request
2. Verifica que los campos requeridos estén presentes
3. Verifica los tipos de datos:
   - UUIDs deben ser válidos
   - Fechas en formato `YYYY-MM-DD`
   - Booleanos como `true`/`false` (no strings)

### Cookies No Se Establecen

**Problema**: Las cookies HTTP-only no se están guardando.

**Solución**:
1. Verifica que `base_url` sea `http://localhost:5000`
2. En Postman, ve a **Cookies** (botón en la barra de herramientas)
3. Verifica que las cookies estén presentes para `localhost:5000`
4. Si no están, ejecuta **Set Tokens** nuevamente

### Backend No Responde

**Problema**: No puedes conectar al backend.

**Solución**:
1. Verifica que el backend esté ejecutándose:
   ```bash
   # En el directorio backend
   uvicorn app.main:app --reload --port 5000
   ```
2. Verifica la URL en el entorno: `base_url` debe ser `http://localhost:5000`
3. Prueba acceder a `http://localhost:5000/health` en el navegador

## 📝 Ejemplos de Uso Común

### Obtener Progreso de un Curso

1. Asegúrate de tener un `curso_id` válido
2. Ejecuta `Progreso > Get Progreso Curso`
3. Verás el progreso detallado del curso

### Crear un Comentario en el Foro

1. Necesitas `curso_id` y `leccion_id` válidos
2. Ve a `Foro > Create Comentario`
3. Body:
   ```json
   {
     "leccion_id": "{{leccion_id}}",
     "contenido": "Este es un comentario de prueba"
   }
   ```
4. Ejecuta el request

### Listar Inscripciones

1. Ejecuta `Inscripciones > List Inscripciones`
2. Verás todas tus inscripciones (o todas si eres admin)

## 💡 Tips y Mejores Prácticas

1. **Usa Variables**: Actualiza las variables de entorno con IDs reales para facilitar las pruebas
2. **Guarda IDs Automáticamente**: Los test scripts guardan IDs en variables automáticamente
3. **Revisa Tests**: Siempre revisa la pestaña **Test Results** para validar respuestas
4. **Organiza por Carpetas**: Usa las carpetas para organizar tus pruebas
5. **Documenta Cambios**: Agrega notas en los requests si haces cambios personalizados

## 🎯 Próximos Pasos

Una vez que tengas las pruebas básicas funcionando:

1. **Explora todos los endpoints**: Prueba cada endpoint de la colección
2. **Crea flujos completos**: Prueba flujos de usuario completos (inscripción → progreso → certificado)
3. **Prueba casos de error**: Intenta requests inválidos para ver cómo responde la API
4. **Automatiza pruebas**: Usa Postman Runner para ejecutar múltiples requests en secuencia

## 📚 Recursos Adicionales

- **Documentación de la API**: `http://localhost:5000/docs` (Swagger UI)
- **ReDoc**: `http://localhost:5000/redoc` (Documentación alternativa)
- **README Principal**: Ver `README.md` para más detalles

