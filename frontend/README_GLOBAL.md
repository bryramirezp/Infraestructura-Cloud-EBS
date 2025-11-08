# 🎓 EBS Online - Plataforma de Escuela Bíblica en Línea

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Estado Actual del Proyecto](#estado-actual-del-proyecto)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Stack Tecnológico](#stack-tecnológico)
5. [Estado por Módulo](#estado-por-módulo)
6. [Próximos Pasos](#próximos-pasos)
7. [Roadmap de Implementación](#roadmap-de-implementación)
8. [Configuración y Despliegue](#configuración-y-despliegue)

---

## 🎯 Visión General

**EBS Online** es una plataforma completa de aprendizaje en línea para la Escuela Bíblica Salem, desarrollada con React y TypeScript en el frontend, y una arquitectura serverless 100% nativa en AWS para el backend.

### Objetivo Principal
Crear una plataforma escalable y moderna que permita:
- Gestión completa de cursos bíblicos
- Sistema de inscripciones y seguimiento de estudiantes
- Calificaciones y certificaciones
- Panel administrativo completo
- Panel de coordinadores/profesores
- Panel de estudiantes

---

## 📊 Estado Actual del Proyecto

### ✅ **Frontend - Completado (~85%)**

#### **Arquitectura y Estructura**
- ✅ **Feature-Sliced Design (FSD)** completamente implementado
- ✅ Path aliases configurados (`@/app`, `@/shared`, `@/widgets`, `@/pages`, etc.)
- ✅ TypeScript configurado con tipos estrictos
- ✅ Vite con React SWC para compilación rápida
- ✅ Tailwind CSS con tema personalizado (light/dark mode)
- ✅ Fuentes personalizadas integradas (Sans, Trajan Pro)

#### **Autenticación y Routing**
- ✅ Sistema de autenticación con AWS Cognito (configuración lista)
- ✅ Rutas protegidas implementadas (`ProtectedRoute`)
- ✅ Navegación dinámica basada en roles
- ✅ AuthProvider con contexto global
- ✅ Mock auth para desarrollo (sin AWS)

#### **Componentes y UI**
- ✅ **Layout Components**: Header, Sidebar, Footer, Layout
- ✅ **Shared UI Components**: 36+ componentes Shadcn/Radix UI
  - Dialog, Card, Button, Input, Select, Textarea, Checkbox
  - Table, Badge, Avatar, Progress, Alert, etc.
- ✅ **Widgets Reutilizables**:
  - `StatsGrid`: Tarjetas de estadísticas
  - `DataTable`: Tabla de datos con búsqueda, ordenamiento y paginación
  - `CourseCard` / `CourseList`: Listado de cursos
  - `UserCard`: Tarjeta de usuario
  - `AssignmentCard`: Tarjeta de tareas
  - `GradeCard`: Tarjeta de calificaciones
  - `ReportCard` / `ReportCardContainer`: Reportes
  - `ReportChart` / `ActivityChart`: Gráficos y visualizaciones
  - `CourseForm` / `UserForm` / `ModuleForm`: Formularios
- ✅ Sistema de notificaciones (Sonner)
- ✅ Tema claro/oscuro funcional
- ✅ Diseño responsive completo

#### **Páginas Implementadas**

##### **Páginas Públicas**
- ✅ Landing Page (`/`)
- ✅ About Page (`/about`)
- ✅ Contact Page (`/contact`)
- ✅ Login Page (`/login`)
- ✅ Register Page (`/register`)
- ✅ Forgot Password (`/forgot-password`)

##### **Páginas de Estudiante**
- ✅ Student Dashboard (`/dashboard`)
- ✅ Courses (`/cursos`)
- ✅ Assignments (`/tareas`)
- ✅ Grades (`/calificaciones`)
- ✅ Calendar (`/calendario`)

##### **Páginas de Administrador**
- ✅ Admin Dashboard (`/admin`)
- ✅ Admin Users (`/admin/usuarios`)
- ✅ Admin Courses (`/admin/cursos`)
- ✅ Admin Reports (`/admin/reportes`)
- ✅ Admin Settings (`/admin/configuracion`)

##### **Páginas de Coordinador**
- ⚠️ Coordinator Dashboard (`/coordinator`) - Estructura básica

#### **Entidades y Tipos**
- ✅ Estructura FSD completa para entidades:
  - `User` (student, teacher, admin)
  - `Course` / `CourseWithProgress`
  - `Module`
  - `Assignment`
  - `Grade` / `CourseGrades`
  - `Progress`
  - `Certificate`

#### **Estado de Integración**
- ✅ Configuración AWS Amplify lista
- ✅ API Client configurado (`api-client.ts`)
- ⚠️ Endpoints definidos pero no conectados
- ⚠️ Datos mock en todas las páginas
- ⚠️ Sin conexión real a backend

---

### ⚠️ **Backend - Pendiente (~20%)**

#### **AWS Services - Configuración**
- ⚠️ **Amazon Cognito**: Configuración lista en frontend, falta crear recursos en AWS
- ⚠️ **AWS Lambda**: Sin funciones creadas
- ⚠️ **Amazon API Gateway**: Sin API creada
- ⚠️ **Amazon RDS**: Sin base de datos creada
- ⚠️ **Amazon S3**: Sin buckets configurados
- ⚠️ **AWS Amplify**: Sin proyecto Amplify inicializado
- ⚠️ **Amazon CloudFront**: Sin distribución configurada

#### **Funcionalidades Backend Pendientes**
- ❌ Autenticación real con Cognito
- ❌ CRUD de usuarios
- ❌ CRUD de cursos
- ❌ CRUD de módulos y lecciones
- ❌ CRUD de tareas (assignments)
- ❌ Sistema de calificaciones
- ❌ Sistema de progreso
- ❌ Sistema de certificados
- ❌ Upload de archivos (S3)
- ❌ Notificaciones (SNS)
- ❌ Email (SES)

---

## 🏗️ Arquitectura del Sistema

### **Diagrama de Arquitectura**

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Pages   │  │ Widgets  │  │ Features │  │  Shared  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         AWS Amplify Hosting (S3 + CloudFront)        │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS API GATEWAY                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   /users     │  │  /courses    │  │ /assignments │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   /grades    │  │  /progress   │  │ /certificates│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Invoke
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS LAMBDA FUNCTIONS                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  UserService │  │ CourseService│  │ GradeService │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ProgressService│ │CertService   │  │ FileService  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ IAM Role
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    AMAZON RDS (MySQL)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  users   │  │ courses  │  │modules   │  │assignments│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  grades  │  │ progress │  │certificates│ │  files  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    AMAZON COGNITO                            │
│  - User Pool (Autenticación)                                │
│  - User Groups (Roles: student, teacher, admin)             │
│  - JWT Tokens                                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    AMAZON S3                                 │
│  - Frontend hosting (Amplify)                                │
│  - Course files (videos, PDFs, imágenes)                    │
│  - User avatars                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    OTROS SERVICIOS AWS                       │
│  - Amazon SNS (Notificaciones)                               │
│  - Amazon SES (Emails)                                       │
│  - CloudWatch (Logs y monitoreo)                            │
└─────────────────────────────────────────────────────────────┘
```

### **Flujo de Datos**

1. **Autenticación**:
   - Usuario inicia sesión → Cognito valida → JWT token → Frontend almacena token
   - Cada request → Token en header → API Gateway valida → Lambda procesa

2. **Operaciones CRUD**:
   - Frontend → API Gateway → Lambda → RDS → Lambda → API Gateway → Frontend

3. **Archivos**:
   - Frontend → S3 (presigned URL) → Lambda valida → S3 almacena → URL en RDS

---

## 🛠️ Stack Tecnológico

### **Frontend**

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 18.3.1 | Framework principal |
| TypeScript | 5.5.3 | Tipado estático |
| Vite | 7.1.9 | Build tool |
| Tailwind CSS | 3.4.1 | Estilos |
| Radix UI | Latest | Componentes accesibles |
| React Router | 6.30.1 | Routing |
| TanStack Query | 5.83.0 | Estado del servidor |
| React Hook Form | 7.53.0 | Formularios |
| Zod | 3.23.8 | Validación |
| Recharts | 2.15.4 | Gráficos |
| Sonner | 1.7.4 | Notificaciones |
| AWS Amplify | 6.15.7 | SDK AWS |

### **Backend (AWS)**

| Servicio | Estado | Uso |
|----------|--------|-----|
| AWS Amplify | ⚠️ Pendiente | CI/CD y hosting |
| Amazon Cognito | ⚠️ Pendiente | Autenticación |
| AWS Lambda | ❌ No creado | Lógica de negocio |
| API Gateway | ❌ No creado | API REST |
| Amazon RDS (MySQL) | ❌ No creado | Base de datos |
| Amazon S3 | ❌ No creado | Archivos |
| CloudFront | ❌ No creado | CDN |
| Amazon SNS | ❌ No creado | Notificaciones |
| Amazon SES | ❌ No creado | Emails |

---

## 📦 Estado por Módulo

### **1. Autenticación y Usuarios**

#### Frontend
- ✅ Login/Register/Forgot Password pages
- ✅ AuthProvider con contexto
- ✅ ProtectedRoute
- ✅ Mock authentication
- ✅ Role-based navigation

#### Backend
- ❌ Cognito User Pool
- ❌ Cognito User Groups (student, teacher, admin)
- ❌ Lambda: CreateUser, UpdateUser, DeleteUser, GetUser
- ❌ API Gateway: `/users` endpoints

### **2. Cursos**

#### Frontend
- ✅ CourseCard, CourseList widgets
- ✅ CourseForm widget
- ✅ Admin Courses page
- ✅ Student Courses page
- ✅ Course entities y tipos

#### Backend
- ❌ RDS: Tabla `courses`
- ❌ Lambda: CRUD de cursos
- ❌ API Gateway: `/courses` endpoints
- ❌ S3: Almacenamiento de archivos de curso

### **3. Módulos y Lecciones**

#### Frontend
- ✅ ModuleForm widget
- ✅ Module entities y tipos
- ⚠️ Páginas de módulos (pendiente)

#### Backend
- ❌ RDS: Tabla `modules`, `lessons`
- ❌ Lambda: CRUD de módulos/lecciones
- ❌ API Gateway: `/modules`, `/lessons` endpoints

### **4. Tareas (Assignments)**

#### Frontend
- ✅ AssignmentCard widget
- ✅ AssignmentsPage (estudiante)
- ✅ Assignment entities y tipos

#### Backend
- ❌ RDS: Tabla `assignments`
- ❌ Lambda: CRUD de tareas
- ❌ API Gateway: `/assignments` endpoints
- ❌ S3: Almacenamiento de entregas

### **5. Calificaciones**

#### Frontend
- ✅ GradeCard widget
- ✅ Grades page (estudiante)
- ✅ Grade entities y tipos

#### Backend
- ❌ RDS: Tabla `grades`
- ❌ Lambda: CRUD de calificaciones
- ❌ API Gateway: `/grades` endpoints

### **6. Progreso**

#### Frontend
- ✅ Progress component
- ✅ Progress tracking en cursos
- ✅ Progress entities y tipos

#### Backend
- ❌ RDS: Tabla `progress`
- ❌ Lambda: UpdateProgress, GetProgress
- ❌ API Gateway: `/progress` endpoints

### **7. Certificados**

#### Frontend
- ✅ Certificate entities y tipos
- ⚠️ Página de certificados (pendiente)

#### Backend
- ❌ RDS: Tabla `certificates`
- ❌ Lambda: GenerateCertificate, GetCertificates
- ❌ API Gateway: `/certificates` endpoints
- ❌ S3: Almacenamiento de PDFs de certificados

### **8. Reportes y Analíticas**

#### Frontend
- ✅ ReportCard, ReportChart widgets
- ✅ ActivityChart widget
- ✅ Admin Reports page

#### Backend
- ❌ Lambda: GenerateReports
- ❌ API Gateway: `/reports` endpoints
- ❌ CloudWatch: Métricas y logs

---

## 🚀 Próximos Pasos

### **Fase 1: Infraestructura AWS (Prioridad Alta)**

#### 1.1 Configurar AWS Amplify
```bash
# Instalar Amplify CLI
npm install -g @aws-amplify/cli

# Configurar credenciales
amplify configure

# Inicializar proyecto
amplify init

# Agregar hosting
amplify add hosting
```

**Tareas**:
- [ ] Inicializar proyecto Amplify
- [ ] Configurar hosting (S3 + CloudFront)
- [ ] Configurar CI/CD con GitHub/GitLab
- [ ] Desplegar frontend a producción

#### 1.2 Configurar Amazon Cognito
```bash
# Agregar autenticación
amplify add auth
```

**Tareas**:
- [ ] Crear User Pool
- [ ] Configurar User Pool Client
- [ ] Crear User Groups (student, teacher, admin)
- [ ] Configurar políticas de contraseña
- [ ] Configurar MFA (opcional)
- [ ] Actualizar variables de entorno en frontend
- [ ] Probar autenticación real

#### 1.3 Crear Base de Datos RDS (MySQL)

**Tareas**:
- [ ] Crear RDS MySQL instance (t2.micro para desarrollo)
- [ ] Configurar Security Group (permitir Lambda)
- [ ] Crear base de datos `ebs_online`
- [ ] Ejecutar scripts de migración (ver sección de Base de Datos)

**Schema Principal**:
```sql
-- Tablas principales
CREATE TABLE users (...);
CREATE TABLE courses (...);
CREATE TABLE modules (...);
CREATE TABLE lessons (...);
CREATE TABLE assignments (...);
CREATE TABLE grades (...);
CREATE TABLE progress (...);
CREATE TABLE certificates (...);
```

#### 1.4 Configurar Amazon S3

**Tareas**:
- [ ] Crear bucket para archivos de curso
- [ ] Crear bucket para avatares de usuario
- [ ] Crear bucket para certificados
- [ ] Configurar CORS
- [ ] Configurar políticas de acceso (IAM)
- [ ] Implementar presigned URLs en Lambda

### **Fase 2: Backend - Lambda Functions (Prioridad Alta)**

#### 2.1 Setup Lambda con Serverless Framework o AWS SAM

**Opción A: Serverless Framework (Recomendado)**
```bash
npm install -g serverless
serverless create --template aws-nodejs-typescript
```

**Opción B: AWS SAM**
```bash
sam init
```

#### 2.2 Crear Lambda Functions

**Estructura de funciones**:
```
lambda/
├── users/
│   ├── createUser.ts
│   ├── updateUser.ts
│   ├── deleteUser.ts
│   ├── getUser.ts
│   └── listUsers.ts
├── courses/
│   ├── createCourse.ts
│   ├── updateCourse.ts
│   ├── deleteCourse.ts
│   ├── getCourse.ts
│   └── listCourses.ts
├── modules/
│   └── ...
├── assignments/
│   └── ...
├── grades/
│   └── ...
├── progress/
│   └── ...
└── certificates/
    └── ...
```

**Tareas por función**:
- [ ] Crear estructura de proyecto Lambda
- [ ] Configurar conexión a RDS
- [ ] Implementar handlers
- [ ] Agregar validación de entrada
- [ ] Agregar manejo de errores
- [ ] Configurar IAM roles
- [ ] Agregar logs (CloudWatch)

#### 2.3 Configurar API Gateway

**Tareas**:
- [ ] Crear API REST
- [ ] Configurar recursos y métodos
- [ ] Configurar CORS
- [ ] Configurar autorización (Cognito Authorizer)
- [ ] Conectar endpoints a Lambda
- [ ] Configurar rate limiting
- [ ] Configurar API keys (opcional)

**Endpoints necesarios**:
```
POST   /users
GET    /users/:id
PUT    /users/:id
DELETE /users/:id
GET    /users

POST   /courses
GET    /courses/:id
PUT    /courses/:id
DELETE /courses/:id
GET    /courses

POST   /assignments
GET    /assignments/:id
PUT    /assignments/:id
DELETE /assignments/:id
GET    /assignments

POST   /grades
GET    /grades/:id
PUT    /grades/:id
GET    /grades/user/:userId

GET    /progress/user/:userId
PUT    /progress

POST   /certificates
GET    /certificates/user/:userId
```

### **Fase 3: Integración Frontend-Backend (Prioridad Alta)**

#### 3.1 Actualizar API Client

**Tareas**:
- [ ] Reemplazar datos mock con llamadas reales
- [ ] Implementar todos los endpoints
- [ ] Agregar manejo de errores
- [ ] Agregar loading states
- [ ] Implementar React Query para caché

#### 3.2 Actualizar Páginas

**Páginas prioritarias**:
- [ ] Admin Dashboard (conectar estadísticas reales)
- [ ] Admin Users (CRUD completo)
- [ ] Admin Courses (CRUD completo)
- [ ] Student Dashboard (datos reales)
- [ ] Student Courses (inscripción real)
- [ ] Student Assignments (subir entregas)
- [ ] Student Grades (ver calificaciones reales)

#### 3.3 Manejo de Archivos

**Tareas**:
- [ ] Implementar upload de archivos a S3
- [ ] Implementar presigned URLs
- [ ] Agregar preview de archivos
- [ ] Validar tipos y tamaños de archivo

### **Fase 4: Funcionalidades Avanzadas (Prioridad Media)**

#### 4.1 Sistema de Notificaciones

**Tareas**:
- [ ] Configurar Amazon SNS
- [ ] Crear topics (email, SMS, push)
- [ ] Implementar notificaciones en Lambda
- [ ] Agregar notificaciones en tiempo real (WebSocket)

#### 4.2 Sistema de Emails

**Tareas**:
- [ ] Configurar Amazon SES
- [ ] Verificar dominio
- [ ] Crear templates de email
- [ ] Implementar envío de emails (bienvenida, recordatorios, certificados)

#### 4.3 Sistema de Certificados

**Tareas**:
- [ ] Implementar generación de PDFs
- [ ] Almacenar en S3
- [ ] Agregar firma digital (opcional)
- [ ] Página de descarga de certificados

### **Fase 5: Optimización y Producción (Prioridad Baja)**

#### 5.1 Performance

**Tareas**:
- [ ] Optimizar imágenes (CloudFront)
- [ ] Implementar lazy loading
- [ ] Optimizar queries a RDS
- [ ] Implementar caché (ElastiCache opcional)

#### 5.2 Seguridad

**Tareas**:
- [ ] Configurar WAF
- [ ] Configurar Shield (DDoS)
- [ ] Auditar IAM roles
- [ ] Implementar rate limiting
- [ ] Agregar encriptación de datos

#### 5.3 Monitoreo

**Tareas**:
- [ ] Configurar CloudWatch alarms
- [ ] Implementar logging estructurado
- [ ] Agregar métricas personalizadas
- [ ] Configurar alertas por email

---

## 📅 Roadmap de Implementación

### **Sprint 1 (2 semanas) - Infraestructura Base**
- [ ] Configurar AWS Amplify
- [ ] Configurar Cognito
- [ ] Crear RDS instance
- [ ] Ejecutar migraciones de base de datos
- [ ] Configurar S3 buckets

### **Sprint 2 (2 semanas) - Lambda y API Gateway**
- [ ] Crear estructura Lambda
- [ ] Implementar funciones de usuarios
- [ ] Implementar funciones de cursos
- [ ] Configurar API Gateway
- [ ] Probar endpoints

### **Sprint 3 (2 semanas) - Integración Frontend**
- [ ] Conectar Admin Users
- [ ] Conectar Admin Courses
- [ ] Conectar Student Dashboard
- [ ] Implementar upload de archivos

### **Sprint 4 (2 semanas) - Funcionalidades Completas**
- [ ] Implementar assignments
- [ ] Implementar grades
- [ ] Implementar progress
- [ ] Implementar certificados

### **Sprint 5 (1 semana) - Optimización**
- [ ] Testing end-to-end
- [ ] Optimización de performance
- [ ] Configuración de seguridad
- [ ] Documentación final

---

## 🔧 Configuración y Despliegue

### **Requisitos Previos**

```bash
# Node.js 18+
node --version

# AWS CLI
aws --version

# AWS Amplify CLI
npm install -g @aws-amplify/cli
amplify --version

# Serverless Framework (opcional)
npm install -g serverless
serverless --version
```

### **Variables de Entorno**

Crear archivo `.env`:
```env
# Cognito
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# API Gateway
VITE_API_GATEWAY_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod

# S3
VITE_S3_BUCKET_NAME=ebs-online-files
VITE_S3_REGION=us-east-1
```

### **Scripts de Base de Datos**

#### Estructura de Tablas Recomendada

```sql
-- Base de datos
CREATE DATABASE ebs_online CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ebs_online;

-- Tabla de usuarios
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cognito_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('student', 'teacher', 'admin') NOT NULL,
  phone VARCHAR(20),
  status ENUM('Activo', 'Inactivo', 'Suspendido') DEFAULT 'Activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Tabla de cursos
CREATE TABLE courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  code VARCHAR(50) UNIQUE NOT NULL,
  level ENUM('Básico', 'Intermedio', 'Avanzado') NOT NULL,
  status ENUM('Publicado', 'Borrador') DEFAULT 'Borrador',
  coordinator_id INT NOT NULL,
  lessons_count INT DEFAULT 0,
  assignments_count INT DEFAULT 0,
  exams_count INT DEFAULT 0,
  estimated_duration VARCHAR(50),
  category VARCHAR(100),
  has_certificate BOOLEAN DEFAULT FALSE,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (coordinator_id) REFERENCES users(id),
  INDEX idx_coordinator (coordinator_id),
  INDEX idx_status (status)
);

-- Tabla de módulos
CREATE TABLE modules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_course (course_id)
);

-- Tabla de lecciones
CREATE TABLE lessons (
  id INT PRIMARY KEY AUTO_INCREMENT,
  module_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  video_url VARCHAR(500),
  duration_minutes INT,
  order_index INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  INDEX idx_module (module_id)
);

-- Tabla de tareas
CREATE TABLE assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('Ensayo', 'Proyecto', 'Laboratorio', 'Examen') NOT NULL,
  due_date DATETIME NOT NULL,
  max_grade DECIMAL(5,2) DEFAULT 100.00,
  weight DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_course (course_id),
  INDEX idx_due_date (due_date)
);

-- Tabla de calificaciones
CREATE TABLE grades (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  assignment_id INT NOT NULL,
  grade DECIMAL(5,2),
  feedback TEXT,
  submitted_at TIMESTAMP,
  graded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_assignment (user_id, assignment_id),
  INDEX idx_user (user_id),
  INDEX idx_assignment (assignment_id)
);

-- Tabla de progreso
CREATE TABLE progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  lessons_completed INT DEFAULT 0,
  assignments_completed INT DEFAULT 0,
  assignments_pending INT DEFAULT 0,
  exams_completed INT DEFAULT 0,
  current_lesson_id INT,
  percentage DECIMAL(5,2) DEFAULT 0.00,
  last_accessed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (current_lesson_id) REFERENCES lessons(id),
  UNIQUE KEY unique_user_course (user_id, course_id),
  INDEX idx_user (user_id),
  INDEX idx_course (course_id)
);

-- Tabla de certificados
CREATE TABLE certificates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  certificate_url VARCHAR(500),
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_course (user_id, course_id),
  INDEX idx_user (user_id),
  INDEX idx_course (course_id)
);

-- Tabla de inscripciones
CREATE TABLE enrollments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Activo', 'Completado', 'Abandonado') DEFAULT 'Activo',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_course (user_id, course_id),
  INDEX idx_user (user_id),
  INDEX idx_course (course_id)
);
```

**Nota**: Estos scripts deben ejecutarse en la instancia RDS después de crearla.

### **Despliegue**

#### Frontend
```bash
# Desarrollo
npm run dev

# Build
npm run build

# Deploy (via Amplify)
amplify publish
```

#### Backend
```bash
# Deploy Lambda functions
serverless deploy

# O con SAM
sam build
sam deploy
```

---

## 📝 Notas Importantes

### **Seguridad**
- ✅ Nunca commitear credenciales AWS
- ✅ Usar IAM roles en lugar de access keys cuando sea posible
- ✅ Configurar CORS correctamente
- ✅ Validar inputs en Lambda
- ✅ Usar HTTPS siempre

### **Costos AWS**
- **Desarrollo**: ~$50-100/mes
- **Producción (pequeña)**: ~$100-200/mes
- **Producción (media)**: ~$200-500/mes

### **Mejores Prácticas**
- Usar Infrastructure as Code (Terraform, CloudFormation, SAM)
- Implementar CI/CD completo
- Agregar tests unitarios y de integración
- Documentar APIs
- Monitorear costos regularmente

---

## 🤝 Contribución

1. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Commit cambios: `git commit -m 'Agregar nueva funcionalidad'`
3. Push a rama: `git push origin feature/nueva-funcionalidad`
4. Crear Pull Request

---

## 📞 Contacto y Soporte

- **Repositorio**: [GitHub URL]
- **Documentación**: Ver carpeta `docs/`
- **Issues**: [GitHub Issues URL]

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

**Última actualización**: Enero 2025
**Versión**: 1.0.0
**Estado**: Desarrollo Activo 🚧

