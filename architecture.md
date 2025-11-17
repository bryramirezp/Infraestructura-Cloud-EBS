🧩 Arquitectura general (resumen técnico)

Tipo de app: Plataforma educativa pequeña (≈100 usuarios) Estilo: SPA + API REST Despliegue: Docker → AWS App Runner

⚙️ Backend (Core)

- Runtime: Python 3.11+ (optimizado para asyncio).
- Framework: FastAPI 0.115+ (modo 100% async).

Servidor de Aplicaciones:

- Gestor de Procesos: `gunicorn` (gestión de workers, reinicios y señales).
- Worker Class: `uvicorn.workers.UvicornWorker` (habilita el event loop asíncrono; se recomienda `uvloop`).
- Configuración Prod recomendada: `workers = 2-4` (ajustado a vCPU de App Runner) y `threads = 1`.

Patrones de Diseño:

- Service Layer Pattern: Lógica de negocio desacoplada de las rutas HTTP (routes → services → database).
- Dependency Injection: Gestión de sesiones de BD y usuario actual vía FastAPI `Depends`.
- Repository Pattern (implícito): Consultas abstractas mediante SQLAlchemy `select`/`execute`.

Estructura: Monolito modular

app/
 ├── main.py
 ├── routes/
 ├── services/
 ├── database/
 ├── schemas/
 └── utils/
Autenticación: Amazon Cognito como Proveedor de Identidad (IdP).

Cognito gestiona todo: Registro de usuarios, login, verificación de email y flujo de "olvidé mi contraseña".

FastAPI solo valida: El backend no genera ni almacena contraseñas. Solo recibe los JWTs de Cognito (enviados por el frontend) y los valida contra Cognito en cada petición protegida.

Tokens: El frontend obtiene access_token y refresh_token directamente de Cognito y los gestiona (idealmente en cookies seguras: HttpOnly, Secure, SameSite=Strict).


🗄️ Capa de Persistencia (Data Layer)

- Motor: PostgreSQL 13+ (RDS `db.t3.micro` con Storage Auto-scaling recomendado).

ORM & Driver:

- SQLAlchemy 2.0+: Uso estricto de `AsyncEngine` y `AsyncSession`.
- Driver: `asyncpg` (alto rendimiento, evita bloqueos por I/O y se integra con asyncio).

Estrategia de Conexión:

- Pooling: elegir `NullPool` si App Runner gestiona muchas instancias; en caso contrario `QueuePool` con `pool_size=20` y `max_overflow=10` para evitar "connection storms".
- Integridad: `pool_pre_ping=True` para recuperar conexiones "zombies".

Migraciones: `alembic` para versionado del esquema de BD.

Integraciones: S3 (mediante URLs prefirmadas para subida/descarga de archivos)

Contenedor: Docker (imagen individual para backend)

💻 Frontend (Cliente)

- Stack: React 18+ (Functional Components) + Vite.
- Estado/Fetch: TanStack Query (React Query) para caché, revalidación y manejo de estados de carga.
- Tipo: Single Page Application (SPA) comunicándose con la API REST del backend.

Despliegue y Hosting:

- Despliegue: archivos estáticos servidos desde S3 + CloudFront (recomendado) para invalidación y caching global.
- Alternativa: contenedor Nginx Alpine en App Runner para servir estáticos si se necesita lógica adicional en el borde.

☁️ Infraestructura

Orquestación: Docker Compose (local)

Producción: AWS App Runner (dos servicios: frontend y backend)

Identidad: Amazon Cognito (User Pools)

Almacenamiento persistente: RDS (Postgres)

Archivos: S3 (usando presigned URLs)

Seguridad básica: HTTPS + cookies seguras + CORS configurado

✅ Resumen corto: SPA (React/Vite) + API REST (FastAPI 100% async) + Amazon Cognito + RDS Postgres (`db.t3.micro`) con pool de conexiones (usando `asyncpg` + SQLAlchemy Async) + S3/CloudFront. Desplegado con Docker → AWS App Runner. En producción ejecutar con `gunicorn` + `uvicorn.workers.UvicornWorker`.