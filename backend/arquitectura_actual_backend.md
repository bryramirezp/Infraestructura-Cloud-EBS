# Arquitectura del Backend - Plataforma Digital Escuela Bíblica Salem (EBS)

## Descripción General

Backend REST API desarrollado con FastAPI que gestiona una plataforma de aprendizaje en línea (LMS) para la Escuela Bíblica Salem. El sistema permite la administración de cursos, módulos, lecciones, evaluaciones, inscripciones de estudiantes, generación de certificados y foros de discusión. Integra autenticación mediante AWS Cognito y almacenamiento de archivos en AWS S3.

## 🛠 Tech Stack

### Lenguaje y Framework
- **Python 3.11** - Lenguaje de programación principal
- **FastAPI 0.115.13** - Framework web asíncrono para APIs REST
- **Uvicorn 0.32.1** - Servidor ASGI de alto rendimiento
- **Gunicorn 20.1.0** - Servidor WSGI para producción

### Base de Datos
- **PostgreSQL** - Base de datos relacional
- **SQLAlchemy 2.0.36** - ORM para gestión de modelos y consultas
- **Alembic 1.14.0** - Herramienta de migraciones de base de datos
- **asyncpg 0.27.0** - Driver asíncrono para PostgreSQL

### Autenticación y Seguridad
- **AWS Cognito** - Servicio de autenticación y autorización (OAuth2 PKCE)
- **PyJWT 2.9.0** - Verificación de tokens JWT
- **cryptography 43.0.3** - Operaciones criptográficas para validación de tokens

### Almacenamiento en la Nube
- **AWS S3** - Almacenamiento de archivos (guías de estudio, certificados)
- **boto3 1.35.50** - SDK de AWS para Python

### Validación y Configuración
- **Pydantic 2.9.2** - Validación de datos y serialización
- **pydantic-settings 2.6.1** - Gestión de configuración desde variables de entorno
- **email-validator 2.2.0** - Validación de direcciones de correo

### Generación de Documentos
- **reportlab 4.2.5** - Generación de certificados PDF

### Testing
- **pytest 8.3.4** - Framework de testing
- **pytest-asyncio 0.24.0** - Soporte para testing asíncrono
- **httpx 0.27.2** - Cliente HTTP para testing
- **respx 0.22.0** - Mocking de peticiones HTTP

### OAuth y Autenticación Externa
- **authlib 1.3.1** - Librería para OAuth2 y OpenID Connect

### Contenedorización
- **Docker** - Contenedorización de la aplicación
- **Python 3.11-slim** - Imagen base del contenedor

## 🏛 Arquitectura y Flujo

### Estructura de Carpetas

```
backend/
├── app/
│   ├── main.py                 # Punto de entrada de la aplicación FastAPI
│   ├── config.py               # Configuración centralizada (Settings)
│   ├── database/
│   │   ├── models.py           # Modelos SQLAlchemy (entidades de BD)
│   │   ├── session.py          # Configuración de conexión y sesiones DB
│   │   └── enums.py            # Enumeraciones para tipos de datos
│   ├── routes/                 # Endpoints de la API (controladores)
│   │   ├── auth_routes.py      # Rutas de autenticación (Cognito)
│   │   ├── usuarios.py         # CRUD de usuarios
│   │   ├── cursos.py           # CRUD de cursos
│   │   └── modulos.py          # CRUD de módulos
│   ├── services/               # Lógica de negocio (capa de servicio)
│   │   ├── cognito_service.py  # Integración con AWS Cognito
│   │   ├── curso_service.py    # Lógica de negocio para cursos
│   │   ├── usuario_service.py  # Lógica de negocio para usuarios
│   │   ├── modulo_service.py  # Lógica de negocio para módulos
│   │   ├── s3_service.py      # Operaciones con AWS S3
│   │   └── certificate_service.py # Generación de certificados
│   ├── schemas/                # Modelos Pydantic (validación y serialización)
│   │   ├── usuario.py
│   │   ├── curso.py
│   │   ├── modulo.py
│   │   └── ...
│   ├── utils/                  # Utilidades y helpers
│   │   ├── jwt_auth.py         # Verificación de tokens JWT
│   │   ├── roles.py            # Gestión de roles y permisos
│   │   └── exceptions.py       # Excepciones personalizadas
│   └── tests/                  # Tests unitarios e integración
├── Dockerfile                  # Configuración del contenedor Docker
├── requirements.txt           # Dependencias del proyecto
└── .dockerignore              # Archivos excluidos del build Docker
```

### Patrón Arquitectónico

El backend sigue una **arquitectura en capas** con separación clara de responsabilidades:

1. **Capa de Presentación (Routes)**
   - Define los endpoints HTTP
   - Valida permisos mediante decoradores de roles
   - Recibe requests y retorna responses
   - Depende de la capa de servicios

2. **Capa de Lógica de Negocio (Services)**
   - Contiene la lógica de negocio
   - Realiza operaciones sobre los modelos de base de datos
   - Maneja reglas de negocio y validaciones complejas
   - Independiente de la capa de presentación

3. **Capa de Acceso a Datos (Database/Models)**
   - Define los modelos SQLAlchemy (ORM)
   - Mapea tablas de PostgreSQL a objetos Python
   - Gestiona relaciones entre entidades
   - Define constraints y validaciones a nivel de BD

4. **Capa de Validación (Schemas)**
   - Modelos Pydantic para validación de entrada/salida
   - Serialización de datos para respuestas JSON
   - Validación de tipos y formatos

### Flujo de Datos

```
Cliente HTTP
    ↓
[FastAPI Router] → Validación de autenticación (JWT)
    ↓
[Route Handler] → Validación de permisos (roles)
    ↓
[Pydantic Schema] → Validación de datos de entrada
    ↓
[Service Layer] → Lógica de negocio
    ↓
[SQLAlchemy Session] → Consultas a PostgreSQL
    ↓
[Database Models] → Mapeo ORM
    ↓
[PostgreSQL] → Persistencia
    ↓
[Service Layer] → Transformación de datos
    ↓
[Pydantic Schema] → Serialización de respuesta
    ↓
[FastAPI Response] → JSON al cliente
```

### Autenticación y Autorización

**Flujo OAuth2 PKCE con AWS Cognito:**

1. Usuario accede a `/auth/login` → Redirección a Cognito Hosted UI
2. Usuario se autentica en Cognito
3. Cognito redirige a `/auth/callback` con código de autorización
4. Backend intercambia código por tokens (access_token, refresh_token, id_token)
5. Tokens se almacenan en cookies HTTP-only
6. Requests subsecuentes incluyen `access_token` en header `Authorization: Bearer <token>`
7. Middleware verifica token JWT usando JWKS de Cognito
8. Sistema de roles determina permisos basado en grupos de Cognito

**Roles del Sistema:**
- `ADMIN` - Acceso completo al sistema
- `COORDINATOR` - Gestión de cursos y estudiantes
- `STUDENT` - Acceso a contenido y evaluaciones

### Modelo de Datos Principal

**Entidades Core:**
- `Usuario` - Usuarios del sistema (vinculados a Cognito)
- `Rol` / `UsuarioRol` - Sistema de roles y permisos
- `Modulo` - Módulos académicos con fechas de inicio/fin
- `Curso` - Materias/cursos disponibles
- `ModuloCurso` - Relación muchos-a-muchos entre módulos y cursos
- `Leccion` - Lecciones dentro de módulos
- `LeccionContenido` - Contenido multimedia de lecciones (texto, PDF, video, links)
- `InscripcionCurso` - Inscripciones de estudiantes a cursos
- `Quiz` / `ExamenFinal` - Evaluaciones (por lección o final de curso)
- `Pregunta` / `Opcion` - Sistema de preguntas y respuestas
- `Intento` / `IntentoPregunta` / `Respuesta` - Registro de intentos de evaluación
- `ReglaAcreditacion` - Reglas para acreditación de cursos
- `Certificado` - Certificados generados para estudiantes
- `ForoComentario` - Comentarios en foros de lecciones
- `PreferenciaNotificacion` - Preferencias de notificación de usuarios

## 🚀 Cómo Ejecutarlo

### Prerrequisitos

- Docker y Docker Compose instalados
- Variables de entorno configuradas (ver sección de configuración)

### Opción 1: Docker (Recomendado)

```bash
# Construir la imagen
docker build -t ebs-backend ./backend

# Ejecutar el contenedor
docker run -p 5000:5000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e COGNITO_USER_POOL_ID=your-pool-id \
  -e COGNITO_CLIENT_ID=your-client-id \
  -e S3_BUCKET_NAME=your-bucket \
  ebs-backend
```

### Opción 2: Desarrollo Local

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual (Windows)
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno en archivo .env
# Ver sección de configuración

# Ejecutar servidor de desarrollo
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

### Opción 3: Producción con Gunicorn

```bash
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:5000
```

### Configuración de Variables de Entorno

Crear archivo `.env` en el directorio `backend/`:

```env
# Base de Datos
DATABASE_URL=postgresql://ebs_user:ebs_password@db:5432/ebs_db
POSTGRES_USER=ebs_user
POSTGRES_PASSWORD=ebs_password
POSTGRES_DB=ebs_db
POSTGRES_PORT=5432

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# S3
S3_BUCKET_NAME=your-bucket-name

# Cognito
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id
COGNITO_CLIENT_SECRET=your-client-secret  # Opcional
COGNITO_DOMAIN=your-domain.auth.us-east-1.amazoncognito.com  # Opcional
COGNITO_REDIRECT_URI=http://localhost:5173/auth/callback
COGNITO_SCOPES=openid profile email
COGNITO_USE_PKCE=true

# Aplicación
ENVIRONMENT=development  # development | staging | production
LOG_LEVEL=INFO
BACKEND_PORT=5000

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Cookies
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false  # true en producción con HTTPS
COOKIE_SAMESITE=Lax
COOKIE_ACCESS_MAX_AGE=300
COOKIE_REFRESH_MAX_AGE=1209600
```

### Endpoints Principales

- `GET /` - Información de la API
- `GET /health` - Health check
- `GET /docs` - Documentación interactiva (Swagger) - Solo en desarrollo

**Autenticación:**
- `GET /auth/login` - Iniciar flujo OAuth2
- `GET /auth/callback` - Callback de OAuth2
- `POST /auth/refresh` - Refrescar access token
- `POST /auth/logout` - Cerrar sesión
- `GET /auth/profile` - Perfil del usuario autenticado

**API de Cursos:**
- `GET /api/cursos` - Listar cursos
- `GET /api/cursos/{id}` - Obtener curso por ID
- `POST /api/cursos` - Crear curso (Admin)
- `PUT /api/cursos/{id}` - Actualizar curso (Admin)

**API de Módulos:**
- `GET /api/modulos` - Listar módulos
- `GET /api/modulos/{id}` - Obtener módulo por ID
- `POST /api/modulos` - Crear módulo (Admin)
- `PUT /api/modulos/{id}` - Actualizar módulo (Admin)

**API de Usuarios:**
- `GET /api/usuarios` - Listar usuarios
- `GET /api/usuarios/{id}` - Obtener usuario por ID
- `POST /api/usuarios` - Crear usuario (Admin)
- `PUT /api/usuarios/{id}` - Actualizar usuario (Admin)

### Migraciones de Base de Datos

```bash
# Crear nueva migración
alembic revision --autogenerate -m "descripción del cambio"

# Aplicar migraciones
alembic upgrade head

# Revertir última migración
alembic downgrade -1
```

### Testing

```bash
# Ejecutar todos los tests
pytest

# Ejecutar tests con cobertura
pytest --cov=app --cov-report=html

# Ejecutar tests específicos
pytest app/tests/test_main.py
```

## Características Técnicas Destacadas

- **Arquitectura asíncrona** - Uso de `async/await` para operaciones I/O
- **Validación robusta** - Pydantic para validación de datos en tiempo de ejecución
- **Seguridad** - Tokens JWT verificados con claves públicas de Cognito (JWKS)
- **Pool de conexiones** - Configuración optimizada de conexiones a PostgreSQL
- **Manejo de errores centralizado** - Exception handlers globales en FastAPI
- **CORS configurable** - Soporte para múltiples orígenes frontend
- **Logging estructurado** - Sistema de logging configurable por ambiente
- **Health checks** - Endpoint para monitoreo de salud de la aplicación
- **Documentación automática** - Swagger UI generado automáticamente (solo en desarrollo)

