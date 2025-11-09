🧩 Arquitectura general (resumen técnico)

Tipo de app: Plataforma educativa pequeña (≈100 usuarios) Estilo: SPA + API REST Despliegue: Docker → AWS ECS Fargate

⚙️ Backend

Lenguaje: Python

Framework: FastAPI

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

Almacenamiento: Postgres

Integraciones: S3 (mediante URLs prefirmadas para subida/descarga de archivos)

Contenedor: Docker (imagen individual para backend)

💻 Frontend

Framework: React + Vite

Tipo: Single Page Application (SPA)

Comunicación: REST API (con el backend)

Despliegue: Docker (imagen separada para frontend)

Hosting posible: ECS, Amplify o Nginx en contenedor

☁️ Infraestructura

Orquestación: Docker Compose (local)

Producción: ECS Fargate (dos servicios: frontend y backend)

Identidad: Amazon Cognito (User Pools)

Almacenamiento persistente: RDS (Postgres)

Archivos: S3 (usando presigned URLs)

Seguridad básica: HTTPS + cookies seguras + CORS configurado

✅ Resumen corto: SPA (React/Vite) + API REST (FastAPI monolito) + Amazon Cognito + Postgres + S3 (presigned URLs). Desplegado con Docker → ECS Fargate.