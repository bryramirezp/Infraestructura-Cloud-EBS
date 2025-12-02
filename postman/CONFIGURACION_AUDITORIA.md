# Configuración para Auditoría Completa

Guía para configurar autenticación y ejecutar auditoría completa de endpoints.

## 🔧 Configuración de Cognito

### Opción 1: Variables de Entorno (Recomendado)

```bash
# Windows PowerShell
$env:COGNITO_USER_POOL_ID="us-east-1_XXXXX"
$env:COGNITO_CLIENT_ID="XXXXX"
$env:COGNITO_USERNAME="user@example.com"
$env:COGNITO_PASSWORD="Usuario123"
$env:AWS_REGION="us-east-1"

# Linux/Mac
export COGNITO_USER_POOL_ID=us-east-1_XXXXX
export COGNITO_CLIENT_ID=XXXXX
export COGNITO_USERNAME=user@example.com
export COGNITO_PASSWORD=Usuario123
export AWS_REGION=us-east-1
```

### Opción 2: Archivo .env

Crear archivo `.env` en el directorio raíz del proyecto:

```env
COGNITO_USER_POOL_ID=us-east-1_XXXXX
COGNITO_CLIENT_ID=XXXXX
COGNITO_USERNAME=user@example.com
COGNITO_PASSWORD=Usuario123
AWS_REGION=us-east-1
```

### Opción 3: Editar Script Directamente

Editar `get_tokens.py` o `run_audit.py` y actualizar las constantes:

```python
USER_POOL_ID = 'us-east-1_XXXXX'
CLIENT_ID = 'XXXXX'
USERNAME = 'user@example.com'
PASSWORD = 'Usuario123'
```

## 🚀 Ejecutar Auditoría Completa

### Paso 1: Verificar Backend

```bash
# Verificar que el backend esté corriendo
curl http://localhost:5000/health
```

### Paso 2: Instalar Dependencias

```bash
pip install boto3 requests
```

### Paso 3: Configurar Cognito

Usar una de las opciones de configuración anteriores.

### Paso 4: Ejecutar Auditoría

```bash
cd postman
python run_audit.py
```

## 📊 Resultados Esperados

Con autenticación configurada, deberías ver:

- ✅ **Total de Pruebas**: ~30+ (incluyendo flujos CRUD)
- ✅ **Exitosas**: 80-100% (dependiendo de permisos)
- ✅ **Flujos CRUD**: Ejecutados completamente
- ✅ **Cobertura**: 100% de endpoints probados

## 🔍 Verificar Autenticación

El script mostrará:

```
🔐 Obteniendo tokens de Cognito...
✅ Tokens obtenidos. Estableciendo cookies...
✅ Autenticación exitosa. Cookies establecidas.
   Usuario: user@example.com
   Rol: STUDENT
```

Si ves esto, la autenticación está funcionando correctamente.

## 🐛 Troubleshooting

### Error: "boto3 no instalado"
```bash
pip install boto3
```

### Error: "Cognito no configurado"
- Verifica que las variables de entorno estén configuradas
- O edita el script directamente con tus valores

### Error: "Invalid credentials"
- Verifica que el usuario exista en Cognito
- Verifica que la contraseña sea correcta
- Verifica que el User Pool ID y Client ID sean correctos

### Error: "Backend no disponible"
- Verifica que el backend esté corriendo en `http://localhost:5000`
- Verifica la URL en el script si usas otro puerto

## 📝 Notas

- Los tokens se obtienen automáticamente usando boto3
- Las cookies se establecen automáticamente usando `/api/auth/set-tokens`
- Los IDs de recursos creados se guardan automáticamente para pruebas posteriores
- Los flujos CRUD se ejecutan solo si la autenticación es exitosa

