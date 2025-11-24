# EBS Online Platform

Plataforma de educación en línea.

## Instalación

### Frontend

To install and run the frontend, navigate to the `frontend` directory and execute:

```bash
cd frontend
npm install
npm run dev
```

### Backend

Para ejecutar el backend y la base de datos con Docker Compose, ejecuta desde el directorio raíz:

```bash
docker-compose up --build
```

Para ejecutar en segundo plano:

```bash
docker-compose up -d --build
```

## Troubleshooting

# 1. Eliminar node_modules y package-lock.json
git rm -r --cached node_modules
git rm --cached package-lock.json

## Frontend

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

## Backend

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)

## Base de Datos

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

## Backend y Servicios en la Nube (AWS)

![Amazon S3](https://img.shields.io/badge/Amazon%20S3-569A31?style=for-the-badge&logo=amazon-s3&logoColor=white) ![Amazon CloudFront](https://img.shields.io/badge/Amazon%20CloudFront-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white) ![AWS App Runner](https://img.shields.io/badge/AWS%20App%20Runner-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white) ![Amazon RDS](https://img.shields.io/badge/Amazon%20RDS-527FFF?style=for-the-badge&logo=amazon-rds&logoColor=white) ![Amazon Cognito](https://img.shields.io/badge/Amazon%20Cognito-DD344C?style=for-the-badge&logo=amazon-cognito&logoColor=white) ![Amazon SES](https://img.shields.io/badge/Amazon%20SES-3E8D91?style=for-the-badge&logo=amazon-ses&logoColor=white) ![Amazon Route 53](https://img.shields.io/badge/Amazon%20Route%2053-8C4FFF?style=for-the-badge&logo=amazon-route-53&logoColor=white) ![AWS WAF](https://img.shields.io/badge/AWS%20WAF-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white) ![AWS Shield](https://img.shields.io/badge/AWS%20Shield-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)

## Arquitectura Cloud en AWS

La solución se basa íntegramente en servicios de AWS, siguiendo un enfoque de "Monolito Modular Asíncrono" optimizado para 100 usuarios activos, priorizando simplicidad de mantenimiento y bajo costo.

### Componentes Principales

*   **Seguridad y Entrega de Contenido**:
    *   **Amazon Route 53**: Sistema de DNS y punto de entrada.
    *   **AWS WAF**: Protege la aplicación contra ataques web comunes (SQLi, XSS).
    *   **AWS Shield Standard**: Protección contra ataques DDoS.
    *   **Amazon S3 + CloudFront**: Almacenamiento del frontend React y entrega mediante CDN global para carga instantánea.

*   **Backend y Lógica de Negocio**:
    *   **AWS App Runner**: Contenedor Docker que ejecuta FastAPI (Python) con escalado automático a cero y HTTPS integrado.
    *   **FastAPI BackgroundTasks**: Gestiona tareas asíncronas en segundo plano (generación de certificados, envío de correos) sin necesidad de servicios adicionales.

*   **Datos, Identidad y Soporte**:
    *   **Amazon Cognito**: Gestiona la autenticación de usuarios, incluyendo soporte para MFA. Tokens almacenados en cookies HttpOnly para mayor seguridad.
    *   **Amazon RDS (PostgreSQL)**: Base de datos relacional para almacenar datos estructurados como perfiles de alumnos, cursos y calificaciones.
    *   **Amazon S3**: Almacenamiento de objetos para materiales de estudio (PDFs, videos) y certificados digitales.
    *   **Amazon SES**: Servicio de envío de correos electrónicos transaccionales (notificaciones, recordatorios, etc.).

## Flujos de Interacción

1.  **Acceso y Carga de la Aplicación**:
    *   El usuario accede a `cursos.escuelasalem.com`.
    *   Route 53 resuelve el DNS.
    *   AWS WAF inspecciona y filtra la solicitud.
    *   CloudFront sirve la aplicación React desde S3 al navegador con distribución global.

2.  **Autenticación Segura**:
    *   El usuario introduce sus credenciales.
    *   La aplicación se comunica con Amazon Cognito para validar al usuario y generar tokens de seguridad (JWT).
    *   El backend intercambia el código de autorización por tokens y los establece como cookies HttpOnly con flags de seguridad (SameSite, Secure).
    *   Las cookies se envían automáticamente en cada petición subsecuente.

3.  **Interacción con el Backend (Síncrona y Asíncrona)**:
    *   **Síncrona**: Al enviar un examen, la app React realiza una llamada POST directamente al backend en App Runner. El backend valida el token JWT desde las cookies, procesa el examen, calcula la calificación, guarda en RDS y devuelve una respuesta inmediata con el resultado.
    *   **Asíncrona**: Si el estudiante aprueba (80%+), el backend responde inmediatamente y programa una tarea en segundo plano usando FastAPI BackgroundTasks. Esta tarea genera el certificado PDF, lo sube a S3 y envía notificaciones por correo mediante SES, todo sin bloquear la respuesta al usuario.

## Plan de Desarrollo - Sprints

### Sprint 1A: Infraestructura Cloud Base (02-oct → 15-oct 2025)

| Objetivo | Responsable(s) | Inicio | Entrega | Dependencia | Prioridad | Entregable |
|----------|---------------|--------|---------|-------------|-----------|------------|
| Configurar AWS Amplify Hosting | Víctor + Charly | 02-oct | 05-oct | Ninguna | 🔴 Alta | URL con app dummy desplegada |
| API Gateway + Lambda dummy (/ping) | Bryan + Luis | 02-oct | 07-oct | Ninguna | 🔴 Alta | Endpoint /ping probado en Postman |
| Instancia RDS + Secrets Manager | Bryan + Luis | 06-oct | 10-oct | Independiente | 🔴 Alta | Captura de conexión RDS desde Lambda |
| Configurar User Pool Cognito básico | Bryan + Luis | 11-oct | 15-oct | Depende de Amplify/API | 🔴 Alta | Captura de usuarios en Cognito |

### Sprint 1B – Seguridad y Roles (16-oct → 29-oct 2025)

| Objetivo | Responsable(s) | Inicio | Entrega | Dependencia | Prioridad | Entregable |
|----------|---------------|--------|---------|-------------|-----------|------------|
| UI de login en React (con mocks) | Víctor + Charly | 16-oct | 20-oct | Independiente | 🔴 Alta | Pantalla de login en React |
| Configurar MFA en Cognito | Bryan + Luis | 16-oct | 20-oct | Cognito básico | 🔴 Alta | MFA activado en consola Cognito |
| Definir roles Alumno/Admin/Coordinador | Bryan + Luis | 21-oct | 25-oct | Cognito | 🟠 Media | Tabla de roles documentada |
| Validar roles con JWT en frontend | Víctor + Charly | 26-oct | 29-oct | Roles en Cognito | 🟠 Media | Demo de login diferenciado por rol |

### Sprint 2 – Evaluaciones Core (30-oct → 13-nov 2025)

| Objetivo | Responsable(s) | Inicio | Entrega | Dependencia | Prioridad | Entregable |
|----------|---------------|--------|---------|-------------|-----------|------------|
| Tabla Exams en RDS | Bryan + Luis | 30-oct | 02-nov | RDS (Sprint 1) | 🔴 Alta | Script SQL en repositorio |
| Lambda ExamService (guardar respuestas) | Charly | 03-nov | 06-nov | Tabla Exams | 🔴 Alta | Endpoint POST /exam funcionando |
| UI de cuestionarios (con mocks) | Víctor | 30-oct | 06-nov | Independiente | 🔴 Alta | Captura cuestionario React |
| Lógica de score (80%, 3 intentos) | Bryan | 07-nov | 09-nov | ExamService | 🔴 Alta | Logs en CloudWatch con score |
| Integración UI ↔ Backend (mostrar score) | Víctor + Charly | 10-nov | 13-nov | Score listo | 🔴 Alta | Calificación mostrada en pantalla |

### Sprint 3 – Certificados y Progreso (14-nov → 28-nov 2025)

| Objetivo | Responsable(s) | Inicio | Entrega | Dependencia | Prioridad | Entregable |
|----------|---------------|--------|---------|-------------|-----------|------------|
| Lambda Certificados (PDF en S3) | Bryan + Luis | 14-nov | 18-nov | Exámenes aprobados | 🔴 Alta | Certificado PDF en bucket S3 |
| UI descarga certificado | Víctor | 19-nov | 20-nov | Certificados | 🔴 Alta | Botón de descarga funcionando |
| Barra de progreso en frontend | Víctor | 14-nov | 22-nov | Independiente | 🟠 Media | Captura de barra en UI |
| Backend de cálculo de progreso | Charly | 20-nov | 24-nov | RDS + Score | 🟠 Media | JSON con % completado |
| Comparación de progreso entre alumnos | Charly | 25-nov | 28-nov | Backend de progreso | 🟢 Baja | Demo comparativa en UI |

### Sprint 4 – Notificaciones & Interactividad (29-nov → 13-dic 2025)

| Objetivo | Responsable(s) | Inicio | Entrega | Dependencia | Prioridad | Entregable |
|----------|---------------|--------|---------|-------------|-----------|------------|
| Lambda Notificaciones (SES) | Bryan | 29-nov | 04-dic | Independiente | 🔴 Alta | Correo de prueba recibido |
| UI preferencias de notificación | Víctor | 01-dic | 06-dic | Lambda Notificaciones | 🟠 Media | Pantalla configuraciones |
| Foro de comentarios (backend) | Bryan | 05-dic | 08-dic | Independiente | 🟠 Media | Logs en CloudWatch con comentarios |
| Foro de comentarios (UI) | Víctor | 07-dic | 10-dic | Backend del foro | 🟠 Media | Foro visible en UI |
| Modo concentración UI | Luis | 07-dic | 12-dic | Independiente | 🟢 Baja | Toggle de "apagar luces" |

### Sprint 5 – Integración y Beta (14-dic → 05-ene 2026)

| Objetivo | Responsable(s) | Inicio | Entrega | Dependencia | Prioridad | Entregable |
|----------|---------------|--------|---------|-------------|-----------|------------|
| CI/CD pipeline (GitHub Actions / CodePipeline) | Charly | 14-dic | 20-dic | Infraestructura lista | 🔴 Alta | Pipeline corriendo en repo |
| Pruebas backend integradas | Bryan | 21-dic | 24-dic | CI/CD listo | 🔴 Alta | Reporte QA backend |
| Pruebas frontend end-to-end | Víctor | 26-dic | 29-dic | CI/CD listo | 🔴 Alta | Reporte QA UI |
| Deploy en Staging (Amplify) | Víctor + Charly | 02-ene | 03-ene | CI/CD listo | 🔴 Alta | URL Staging accesible |
| Demo Beta con stakeholders | Todos | 04-ene | 05-ene | Staging desplegado | 🔴 Alta | Acta de feedback firmada |

### Sprint 6 – Producción y Cierre (06-ene → 31-ene 2026)

| Objetivo | Responsable(s) | Inicio | Entrega | Dependencia | Prioridad | Entregable |
|----------|---------------|--------|---------|-------------|-----------|------------|
| Deploy a Producción (Amplify, Gateway, RDS, Lambdas) | Charly + Víctor | 06-ene | 10-ene | Beta validada | 🔴 Alta | URL oficial en producción |
| CloudWatch métricas + alarmas | Bryan + Luis | 11-ene | 15-ene | Producción activa | 🔴 Alta | Dashboard con alarmas |
| Capacitación a usuarios | Charly + Iván | 16-ene | 20-ene | Plataforma estable | 🟠 Media | Evidencia de capacitación |
| Hotfixes / iteraciones rápidas | Todos | 21-ene | 31-ene | Feedback usuarios | 🔴 Alta | Versión final estable |
