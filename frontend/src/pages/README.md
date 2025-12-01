# Documentación de Páginas del Frontend

## Índice
1. [Colores de la Marca](#colores-de-la-marca)
2. [Estructura de Páginas](#estructura-de-páginas)
3. [Mapeo Frontend-Backend](#mapeo-frontend-backend)
4. [Lógica de Usuario y Permisos](#lógica-de-usuario-y-permisos)
5. [Flujos de Navegación](#flujos-de-navegación)

---

## Colores de la Marca

### Paleta Principal

**Azul (Principal)**
- HEX: `#0404E4`
- RGB: `4, 4, 228`
- HSL: `240 97% 45%`
- Uso: Color principal, botones, títulos, enlaces principales
- Variable CSS: `var(--primary)` o `hsl(var(--primary))`

**Gris (Secundario)**
- HEX: `#cfd1d1`
- RGB: `207, 209, 209`
- HSL: `180 2% 82%`
- Uso: Texto secundario, bordes, elementos secundarios
- Variable CSS: `var(--secondary)` o `hsl(var(--secondary))`

**Negro (Base)**
- HEX: `#000000`
- RGB: `0, 0, 0`
- HSL: `0 0% 0%`
- Uso: Texto principal en modo claro, fondo en modo oscuro
- Variable CSS: `var(--foreground)` o `hsl(var(--foreground))`

**Blanco (Implícito)**
- HEX: `#FFFFFF`
- RGB: `255, 255, 255`
- HSL: `0 0% 100%`
- Uso: Fondo en modo claro, texto en modo oscuro
- Variable CSS: `var(--background)` o `hsl(var(--background))`

### Tipografía Oficial

**Títulos (Serif)**
- Fuente: Trajan Pro 3
- Variable: `var(--font-serif)`
- Uso: Títulos principales, encabezados (`h1`, `h2`, `h3`)

**Párrafos (Sans-Serif)**
- Fuente: Sans
- Variable: `var(--font-sans)`
- Uso: Texto de párrafos, etiquetas, elementos de UI

### Variables CSS Aplicadas

```css
:root {
  /* Tipografía */
  --font-sans: "Sans", sans-serif;
  --font-serif: "Trajan Pro 3", serif;

  /* Colores */
  --background: 0 0% 100%;   /* Blanco */
  --foreground: 0 0% 0%;     /* Negro */
  --primary: 240 97% 45%;    /* Azul #0404E4 */
  --secondary: 180 2% 82%;   /* Gris #cfd1d1 */
  --border: 180 2% 90%;      /* Gris claro */
  --ring: 240 97% 45%;       /* Azul #0404E4 */
}
```

---

## Estructura de Páginas

### Páginas Públicas (`/pages/public/`)

#### `LandingPage.tsx` (HomePage)
- **Ruta**: `/`
- **Permisos**: Público
- **Descripción**: Página de inicio con información general, características y testimonios
- **Componentes**: Header, secciones de características, testimonios, CTA
- **Backend**: No requiere autenticación

#### `AboutPage.tsx`
- **Ruta**: `/about`
- **Permisos**: Público
- **Descripción**: Información sobre la plataforma
- **Backend**: No requiere autenticación

#### `ContactPage.tsx`
- **Ruta**: `/contact`
- **Permisos**: Público
- **Descripción**: Formulario de contacto
- **Backend**: No requiere autenticación

#### `VerifyCertificatePage.tsx`
- **Ruta**: `/verificar-certificado`
- **Permisos**: Público
- **Descripción**: Verificación de certificados mediante hash
- **Backend**: `GET /api/certificados/{certificado_id}/verificar?hash={hash}`
- **Lógica**: 
  - Formulario para ingresar ID de certificado y hash
  - Validación pública sin autenticación
  - Muestra estado de validez del certificado

#### `NotFound.tsx`
- **Ruta**: `*` (catch-all)
- **Permisos**: Público
- **Descripción**: Página 404

---

### Páginas de Autenticación (`/pages/auth/`)

#### `CognitoCallback.tsx`
- **Ruta**: `/auth/callback`
- **Permisos**: Público (procesa callback de Cognito)
- **Descripción**: Maneja el callback de OAuth2 desde Cognito Hosted UI
- **Backend**: `POST /api/auth/callback` (con code y code_verifier)
- **Lógica**:
  - Extrae `code` y `state` de query params
  - Obtiene `code_verifier` del almacenamiento local (PKCE)
  - Envía POST a backend con `code` y `code_verifier`
  - Backend establece cookies HTTP-only y redirige según rol
  - Roles: `student` → `/dashboard`, `coordinator` → `/dashboard`, `admin` → `/admin`

---

### Páginas de Estudiante (`/pages/student/`)

#### `StudentDashboard.tsx`
- **Ruta**: `/dashboard`
- **Permisos**: Autenticado (student, coordinator)
- **Descripción**: Dashboard principal con resumen de progreso y cursos
- **Backend**:
  - `GET /api/usuarios/me` - Perfil del usuario
  - `GET /api/progreso` - Progreso general
  - `GET /api/inscripciones?estado=ACTIVA` - Cursos activos
- **Lógica**:
  - Muestra estadísticas generales (cursos activos, progreso, calificaciones)
  - Lista de cursos recientes con progreso
  - Accesos rápidos a módulos y lecciones

#### `Courses.tsx` (CoursesPage)
- **Ruta**: `/cursos`
- **Permisos**: Autenticado
- **Descripción**: Catálogo de cursos disponibles
- **Backend**:
  - `GET /api/cursos?publicado=true` - Lista de cursos publicados
  - `GET /api/modulos?publicado=true` - Lista de módulos
- **Lógica**:
  - Muestra cursos y módulos disponibles
  - Filtros por categoría, nivel, estado
  - Botón de inscripción para cada curso

#### `MyCoursesPage.tsx`
- **Ruta**: `/mis-cursos`
- **Permisos**: Autenticado
- **Descripción**: Cursos en los que el estudiante está inscrito
- **Backend**:
  - `GET /api/inscripciones?estado=ACTIVA` - Inscripciones activas
  - `GET /api/inscripciones?estado=PAUSADA` - Inscripciones pausadas
  - `GET /api/inscripciones?estado=CONCLUIDA` - Inscripciones concluidas
- **Lógica**:
  - Tabs por estado (Activos, Pausados, Concluidos)
  - Muestra progreso por curso
  - Acceso directo a continuar estudiando

#### `ModulosPage.tsx`
- **Ruta**: `/modulos`
- **Permisos**: Autenticado
- **Descripción**: Lista de módulos disponibles
- **Backend**: `GET /api/modulos?publicado=true`
- **Lógica**: Lista de módulos con fechas y cursos asociados

#### `ModuloDetailPage.tsx`
- **Ruta**: `/modulos/:moduloId`
- **Permisos**: Autenticado (validar inscripción)
- **Descripción**: Detalle de módulo con cursos y lecciones
- **Backend**:
  - `GET /api/modulos/{modulo_id}` - Detalle del módulo
  - `GET /api/modulos/{modulo_id}/lecciones` - Lecciones del módulo
  - `GET /api/modulos/{modulo_id}/cursos` - Cursos del módulo
  - `GET /api/progreso/modulos/{modulo_id}` - Progreso en el módulo
- **Lógica**:
  - Valida que el usuario esté inscrito en al menos un curso del módulo
  - Muestra lecciones ordenadas por `orden`
  - Solo muestra lecciones publicadas si no está inscrito
  - Botón de inscripción si no está inscrito

#### `CursoDetailPage.tsx`
- **Ruta**: `/cursos/:cursoId`
- **Permisos**: Autenticado (validar inscripción)
- **Descripción**: Detalle de curso con módulos, lecciones y examen final
- **Backend**:
  - `GET /api/cursos/{curso_id}` - Detalle del curso
  - `GET /api/cursos/{curso_id}/modulos` - Módulos del curso
  - `GET /api/cursos/{curso_id}/guias-estudio` - Guías de estudio
  - `GET /api/cursos/{curso_id}/examen-final` - Examen final
  - `GET /api/inscripciones?curso_id={curso_id}` - Verificar inscripción
  - `GET /api/progreso/cursos/{curso_id}` - Progreso en el curso
- **Lógica**:
  - Si no está inscrito, muestra botón de inscripción
  - Si está inscrito, muestra contenido completo
  - Muestra guías de estudio con URLs prefirmadas de S3
  - Muestra estado del examen final (disponible/completado)

#### `LessonPage.tsx`
- **Ruta**: `/lecciones/:leccionId`
- **Permisos**: Autenticado (validar acceso a lección)
- **Descripción**: Contenido completo de una lección
- **Backend**:
  - `GET /api/lecciones/{leccion_id}` - Contenido de la lección
  - `GET /api/lecciones/{leccion_id}/contenido` - Contenido detallado
  - `GET /api/lecciones/{leccion_id}/quiz` - Quiz asociado (si existe)
- **Lógica**:
  - Valida que el usuario esté inscrito en el curso del módulo de la lección
  - Muestra contenido multimedia (videos, documentos, imágenes)
  - URLs prefirmadas para contenido en S3
  - Botón para acceder al quiz si existe
  - Navegación a siguiente/anterior lección

#### `QuizPage.tsx`
- **Ruta**: `/quizzes/:quizId`
- **Permisos**: Autenticado (validar acceso a lección)
- **Descripción**: Interfaz para responder un quiz
- **Backend**:
  - `GET /api/quizzes/{quiz_id}` - Quiz con preguntas y opciones
  - `POST /api/quizzes/{quiz_id}/intentos` - Crear intento
  - `PUT /api/quizzes/{quiz_id}/intentos/{intento_id}` - Enviar respuestas
- **Lógica**:
  - Valida acceso a la lección asociada
  - Crea intento al iniciar
  - Muestra preguntas (aleatorias si `aleatorio=true`)
  - Timer si está configurado
  - Envía respuestas al finalizar
  - Redirige a `QuizResultPage` con resultado

#### `QuizResultPage.tsx`
- **Ruta**: `/quizzes/:quizId/resultado`
- **Permisos**: Autenticado
- **Descripción**: Resultado del quiz con respuestas correctas/incorrectas
- **Backend**: Usa resultado del `PUT /api/quizzes/{quiz_id}/intentos/{intento_id}`
- **Lógica**:
  - Muestra puntuación y porcentaje
  - Indica si aprobó (según `guarda_calificacion`)
  - Lista de preguntas con respuestas correctas/incorrectas
  - Opción de revisar intentos anteriores
  - Botón para continuar a siguiente lección

#### `ExamenFinalPage.tsx`
- **Ruta**: `/examenes-finales/:examenFinalId`
- **Permisos**: Autenticado (validar inscripción en curso)
- **Descripción**: Interfaz para responder examen final
- **Backend**:
  - `GET /api/examenes-finales/{examen_final_id}` - Examen con preguntas
  - `POST /api/examenes-finales/{examen_final_id}/intentos` - Crear intento
  - `PUT /api/examenes-finales/{examen_final_id}/intentos/{intento_id}` - Enviar respuestas
  - `GET /api/examenes-finales/{examen_final_id}/intentos` - Historial de intentos
- **Lógica**:
  - Valida inscripción en el curso asociado
  - Verifica límite de intentos (según reglas de acreditación)
  - Crea intento al iniciar
  - Muestra preguntas (aleatorias si `aleatorio=true`)
  - Timer obligatorio
  - Envía respuestas al finalizar
  - Muestra resultado inmediato
  - Si aprueba, habilita generación de certificado

#### `ProgressPage.tsx`
- **Ruta**: `/progreso`
- **Permisos**: Autenticado
- **Descripción**: Vista detallada de progreso general y por curso
- **Backend**:
  - `GET /api/progreso` - Progreso general
  - `GET /api/progreso/cursos/{curso_id}` - Progreso por curso
  - `GET /api/progreso/modulos/{modulo_id}` - Progreso por módulo
  - `GET /api/progreso/cursos/{curso_id}/comparacion` - Comparación con otros estudiantes
  - `GET /api/progreso/cursos/{curso_id}/metricas` - Métricas comparativas
  - `GET /api/progreso/metricas-generales` - Métricas generales
- **Lógica**:
  - Gráficos de progreso general
  - Progreso por curso con porcentajes
  - Comparación con promedio del curso
  - Ranking y percentiles
  - Métricas de tiempo de estudio

#### `CertificatesPage.tsx`
- **Ruta**: `/certificados`
- **Permisos**: Autenticado
- **Descripción**: Lista de certificados obtenidos
- **Backend**:
  - `GET /api/certificados` - Lista de certificados del usuario
  - `GET /api/certificados/{certificado_id}` - Detalle con URL de descarga
  - `GET /api/certificados/{certificado_id}/estado` - Estado de generación
  - `POST /api/certificados` - Generar certificado (si está acreditado)
- **Lógica**:
  - Lista certificados con estado (PROCESSING, COMPLETED)
  - Si está PROCESSING, polling cada 5 segundos
  - Si está COMPLETED, muestra botón de descarga
  - Muestra folio y hash de verificación
  - Botón para generar certificado si la inscripción está acreditada

#### `Calendar.tsx` (CalendarPage)
- **Ruta**: `/calendario`
- **Permisos**: Autenticado
- **Descripción**: Calendario de actividades y fechas importantes
- **Backend**: No hay endpoint específico (puede usar datos de inscripciones y módulos)
- **Lógica**:
  - Muestra fechas de inicio/fin de módulos
  - Fechas límite de tareas y exámenes
  - Eventos personalizados del usuario

#### `AssignmentsPage.tsx`
- **Ruta**: `/tareas`
- **Permisos**: Autenticado
- **Descripción**: Lista de tareas y asignaciones
- **Backend**: No hay endpoint específico (puede derivarse de lecciones y quizzes)
- **Lógica**:
  - Lista de quizzes pendientes por lección
  - Exámenes finales disponibles
  - Estado de completitud

#### `Grades.tsx` (GradesPage)
- **Ruta**: `/calificaciones`
- **Permisos**: Autenticado
- **Descripción**: Calificaciones y resultados de evaluaciones
- **Backend**:
  - `GET /api/quizzes/{quiz_id}/intentos` - Intentos de quizzes
  - `GET /api/examenes-finales/{examen_final_id}/intentos` - Intentos de exámenes
- **Lógica**:
  - Lista de intentos con puntuaciones
  - Filtros por curso, tipo de evaluación
  - Gráficos de rendimiento

#### `ForumPage.tsx`
- **Ruta**: `/foro`
- **Permisos**: Autenticado
- **Descripción**: Foro de discusión por lección
- **Backend**:
  - `GET /api/foro/cursos/{curso_id}/lecciones/{leccion_id}/comentarios` - Lista de comentarios
  - `POST /api/foro/cursos/{curso_id}/lecciones/{leccion_id}/comentarios` - Crear comentario
  - `PUT /api/foro/comentarios/{comentario_id}` - Actualizar comentario
  - `DELETE /api/foro/comentarios/{comentario_id}` - Eliminar comentario
- **Lógica**:
  - Lista comentarios con paginación
  - Formulario para crear comentario
  - Edición/eliminación solo del propio comentario
  - Administradores pueden eliminar cualquier comentario

---

### Páginas de Coordinador (`/pages/coordinator/`)

#### `CoordinatorDashboard.tsx`
- **Ruta**: `/dashboard` (cuando role=coordinator)
- **Permisos**: Autenticado (coordinator)
- **Descripción**: Dashboard para coordinadores
- **Backend**: Similar a StudentDashboard pero con datos agregados
- **Lógica**: Vista de estudiantes y cursos asignados

---

### Páginas de Administrador (`/pages/admin/`)

#### `AdminDashboard.tsx`
- **Ruta**: `/admin`
- **Permisos**: Autenticado (admin)
- **Descripción**: Dashboard principal de administración
- **Backend**:
  - `GET /api/admin/usuarios` - Estadísticas de usuarios
  - `GET /api/admin/inscripciones` - Estadísticas de inscripciones
  - `GET /api/admin/intentos` - Estadísticas de intentos
- **Lógica**:
  - Métricas generales (usuarios, cursos, inscripciones)
  - Gráficos de actividad
  - Accesos rápidos a gestión

#### `AdminUsersPage.tsx`
- **Ruta**: `/admin/usuarios`
- **Permisos**: Autenticado (admin)
- **Descripción**: Gestión de usuarios
- **Backend**:
  - `GET /api/admin/usuarios?skip={skip}&limit={limit}` - Lista de usuarios
  - `GET /api/usuarios/{usuario_id}` - Detalle de usuario
  - `PUT /api/admin/usuarios/{usuario_id}/roles` - Actualizar roles
- **Lógica**:
  - Tabla de usuarios con paginación
  - Filtros por rol, estado
  - Edición de roles (student, coordinator, admin)
  - Búsqueda por nombre, email

#### `AdminCoursesPage.tsx`
- **Ruta**: `/admin/cursos`
- **Permisos**: Autenticado (admin)
- **Descripción**: Gestión de cursos, módulos y lecciones
- **Backend**:
  - `GET /api/cursos` - Lista de cursos
  - `POST /api/cursos` - Crear curso
  - `PUT /api/cursos/{curso_id}` - Actualizar curso
  - `POST /api/modulos` - Crear módulo
  - `PUT /api/modulos/{modulo_id}` - Actualizar módulo
  - `POST /api/lecciones` - Crear lección
  - `PUT /api/lecciones/{leccion_id}` - Actualizar lección
- **Lógica**:
  - CRUD completo de cursos
  - Gestión de módulos y su relación con cursos
  - Gestión de lecciones dentro de módulos
  - Publicación/despublicación de contenido

#### `AdminReportsPage.tsx`
- **Ruta**: `/admin/reportes`
- **Permisos**: Autenticado (admin)
- **Descripción**: Reportes y análisis
- **Backend**:
  - `GET /api/admin/inscripciones` - Inscripciones con filtros
  - `GET /api/admin/intentos` - Intentos con filtros
  - `GET /api/admin/usuarios` - Usuarios con filtros
- **Lógica**:
  - Reportes de inscripciones por curso
  - Reportes de rendimiento de estudiantes
  - Exportación a CSV/PDF
  - Filtros por fecha, curso, usuario

#### `AdminSettingsPage.tsx`
- **Ruta**: `/admin/configuracion`
- **Permisos**: Autenticado (admin)
- **Descripción**: Configuración del sistema
- **Backend**:
  - `GET /api/admin/reglas-acreditacion` - Lista de reglas
  - `POST /api/admin/reglas-acreditacion` - Crear regla
  - `PUT /api/admin/reglas-acreditacion/{regla_id}` - Actualizar regla
  - `DELETE /api/admin/reglas-acreditacion/{regla_id}` - Eliminar regla
  - `PUT /api/admin/inscripciones/{inscripcion_id}/estado` - Actualizar estado de inscripción
  - `PUT /api/admin/intentos/{intento_id}/permitir-nuevo` - Permitir nuevo intento
- **Lógica**:
  - Gestión de reglas de acreditación
  - Configuración de límites de intentos
  - Gestión de estados de inscripciones
  - Permisos para recursamiento

---

## Mapeo Frontend-Backend

### Autenticación

| Frontend | Backend | Método | Descripción |
|----------|---------|--------|-------------|
| `/login` | `/api/auth/login` | GET | Inicia flujo PKCE, redirige a Cognito |
| `/auth/callback` | `/api/auth/callback` | POST | Intercambia code por tokens |
| Logout | `/api/auth/logout` | POST | Cierra sesión y limpia cookies |
| Refresh | `/api/auth/refresh` | POST | Renueva access token |
| - | `/api/auth/tokens` | GET | Obtiene tokens actuales |

### Usuarios

| Frontend | Backend | Método | Permisos |
|----------|---------|--------|----------|
| Perfil | `/api/usuarios/me` | GET | Autenticado |
| Actualizar perfil | `/api/usuarios/me` | PUT | Autenticado |
| Detalle usuario | `/api/usuarios/{id}` | GET | Admin/Coordinator |
| Lista usuarios | `/api/admin/usuarios` | GET | Admin |
| Actualizar roles | `/api/admin/usuarios/{id}/roles` | PUT | Admin |

### Cursos

| Frontend | Backend | Método | Permisos |
|----------|---------|--------|----------|
| Lista cursos | `/api/cursos?publicado=true` | GET | Público |
| Detalle curso | `/api/cursos/{id}` | GET | Público |
| Guías de estudio | `/api/cursos/{id}/guias-estudio` | GET | Público |
| Examen final | `/api/cursos/{id}/examen-final` | GET | Público |
| Módulos del curso | `/api/cursos/{id}/modulos` | GET | Público |
| Crear curso | `/api/cursos` | POST | Admin |
| Actualizar curso | `/api/cursos/{id}` | PUT | Admin |

### Módulos

| Frontend | Backend | Método | Permisos |
|----------|---------|--------|----------|
| Lista módulos | `/api/modulos?publicado=true` | GET | Público |
| Detalle módulo | `/api/modulos/{id}` | GET | Público |
| Cursos del módulo | `/api/modulos/{id}/cursos` | GET | Público |
| Lecciones del módulo | `/api/modulos/{id}/lecciones` | GET | Público (filtra si no inscrito) |
| Crear módulo | `/api/modulos` | POST | Admin |
| Actualizar módulo | `/api/modulos/{id}` | PUT | Admin |

### Lecciones

| Frontend | Backend | Método | Permisos |
|----------|---------|--------|----------|
| Detalle lección | `/api/lecciones/{id}` | GET | Autenticado (valida inscripción) |
| Contenido lección | `/api/lecciones/{id}/contenido` | GET | Autenticado (valida inscripción) |
| Quiz de lección | `/api/lecciones/{id}/quiz` | GET | Autenticado (valida inscripción) |
| Crear lección | `/api/lecciones` | POST | Admin |
| Actualizar lección | `/api/lecciones/{id}` | PUT | Admin |

### Quizzes

| Frontend | Backend | Método | Permisos |
|----------|---------|--------|----------|
| Detalle quiz | `/api/quizzes/{id}` | GET | Autenticado (valida acceso a lección) |
| Crear intento | `/api/quizzes/{id}/intentos` | POST | Autenticado |
| Enviar respuestas | `/api/quizzes/{id}/intentos/{intento_id}` | PUT | Autenticado (propietario) |
| Historial intentos | `/api/quizzes/{id}/intentos` | GET | Autenticado |

### Exámenes Finales

| Frontend | Backend | Método | Permisos |
|----------|---------|--------|----------|
| Detalle examen | `/api/examenes-finales/{id}` | GET | Autenticado (valida inscripción) |
| Crear intento | `/api/examenes-finales/{id}/intentos` | POST | Autenticado |
| Enviar respuestas | `/api/examenes-finales/{id}/intentos/{intento_id}` | PUT | Autenticado (propietario) |
| Historial intentos | `/api/examenes-finales/{id}/intentos` | GET | Autenticado |

### Inscripciones

| Frontend | Backend | Método | Permisos |
|----------|---------|--------|----------|
| Crear inscripción | `/api/inscripciones` | POST | Autenticado |
| Lista inscripciones | `/api/inscripciones?estado={estado}` | GET | Autenticado |
| Detalle inscripción | `/api/inscripciones/{id}` | GET | Autenticado (propietario/admin) |
| Actualizar estado | `/api/inscripciones/{id}` | PATCH | Autenticado (propietario/admin) |
| Lista admin | `/api/admin/inscripciones` | GET | Admin |
| Actualizar estado admin | `/api/admin/inscripciones/{id}/estado` | PUT | Admin |

### Progreso

| Frontend | Backend | Método | Permisos |
|----------|---------|--------|----------|
| Progreso general | `/api/progreso` | GET | Autenticado |
| Progreso curso | `/api/progreso/cursos/{id}` | GET | Autenticado |
| Progreso módulo | `/api/progreso/modulos/{id}` | GET | Autenticado |
| Comparación | `/api/progreso/cursos/{id}/comparacion` | GET | Autenticado |
| Métricas curso | `/api/progreso/cursos/{id}/metricas` | GET | Autenticado |
| Métricas generales | `/api/progreso/metricas-generales` | GET | Autenticado |

### Certificados

| Frontend | Backend | Método | Permisos |
|----------|---------|--------|----------|
| Lista certificados | `/api/certificados` | GET | Autenticado |
| Detalle certificado | `/api/certificados/{id}` | GET | Autenticado (propietario/admin) |
| Estado certificado | `/api/certificados/{id}/estado` | GET | Autenticado (propietario/admin) |
| Generar certificado | `/api/certificados` | POST | Autenticado (inscripción acreditada) |
| Verificar certificado | `/api/certificados/{id}/verificar?hash={hash}` | GET | Público |

### Foro

| Frontend | Backend | Método | Permisos |
|----------|---------|--------|----------|
| Lista comentarios | `/api/foro/cursos/{curso_id}/lecciones/{leccion_id}/comentarios` | GET | Autenticado |
| Crear comentario | `/api/foro/cursos/{curso_id}/lecciones/{leccion_id}/comentarios` | POST | Autenticado |
| Actualizar comentario | `/api/foro/comentarios/{id}` | PUT | Autenticado (autor) |
| Eliminar comentario | `/api/foro/comentarios/{id}` | DELETE | Autenticado (autor/admin) |

### Preferencias

| Frontend | Backend | Método | Permisos |
|----------|---------|--------|----------|
| Obtener preferencias | `/api/preferencias` | GET | Autenticado |
| Actualizar preferencias | `/api/preferencias` | PUT | Autenticado |

### Administración

| Frontend | Backend | Método | Permisos |
|----------|---------|--------|----------|
| Lista intentos | `/api/admin/intentos` | GET | Admin |
| Permitir nuevo intento | `/api/admin/intentos/{id}/permitir-nuevo` | PUT | Admin |
| Lista reglas | `/api/admin/reglas-acreditacion` | GET | Admin |
| Crear regla | `/api/admin/reglas-acreditacion` | POST | Admin |
| Actualizar regla | `/api/admin/reglas-acreditacion/{id}` | PUT | Admin |
| Eliminar regla | `/api/admin/reglas-acreditacion/{id}` | DELETE | Admin |

---

## Lógica de Usuario y Permisos

### Roles del Sistema

1. **Student** (`student`)
   - Acceso a cursos, lecciones, quizzes, exámenes
   - Ver su propio progreso y certificados
   - Participar en foros
   - Inscribirse a cursos

2. **Coordinator** (`coordinator`)
   - Mismo acceso que student
   - Vista agregada de estudiantes asignados
   - Puede ver detalles de usuarios (endpoint específico)

3. **Admin** (`admin`)
   - Acceso completo al sistema
   - Gestión de usuarios, cursos, módulos, lecciones
   - Gestión de reglas de acreditación
   - Reportes y estadísticas
   - Puede modificar estados de inscripciones e intentos

### Flujo de Autenticación

1. Usuario accede a `/login`
2. Frontend redirige a `/api/auth/login` (backend)
3. Backend genera PKCE y redirige a Cognito Hosted UI
4. Usuario se autentica en Cognito
5. Cognito redirige a `/auth/callback` con `code` y `state`
6. Frontend extrae `code_verifier` del almacenamiento local
7. Frontend envía POST a `/api/auth/callback` con `code` y `code_verifier`
8. Backend intercambia code por tokens y establece cookies HTTP-only
9. Backend redirige según rol:
   - `student` → `/dashboard`
   - `coordinator` → `/dashboard`
   - `admin` → `/admin`

### Validación de Acceso

#### Acceso a Lecciones
- Backend valida que el usuario esté inscrito en el curso del módulo de la lección
- Si no está inscrito y la lección no está publicada, retorna 403
- Si no está inscrito pero la lección está publicada, permite acceso limitado

#### Acceso a Quizzes
- Valida acceso a la lección asociada
- Verifica límite de intentos según reglas de acreditación
- Solo el propietario puede modificar su intento

#### Acceso a Exámenes Finales
- Valida inscripción en el curso asociado
- Verifica límite de intentos
- Si `permitir_nuevo_intento=true` en un intento fallido, permite recursamiento

#### Acceso a Certificados
- Usuario solo puede ver sus propios certificados
- Admin puede ver todos los certificados
- Generación requiere inscripción acreditada

### Estados de Inscripción

- **ACTIVA**: Usuario puede acceder a contenido y realizar evaluaciones
- **PAUSADA**: Acceso suspendido temporalmente
- **CONCLUIDA**: Curso completado
- **REPROBADA**: No aprobó el curso
- **ACREDITADA**: Aprobó el curso y puede generar certificado

### Reglas de Acreditación

- Define porcentaje mínimo para aprobar
- Define límite de intentos para exámenes finales
- Aplicadas automáticamente al evaluar intentos
- Administradores pueden crear/editar/eliminar reglas

---

## Flujos de Navegación

### Flujo de Estudiante

1. **Inicio**: Landing Page (`/`)
2. **Login**: `/login` → Cognito → `/auth/callback` → `/dashboard`
3. **Explorar Cursos**: `/cursos` → Ver catálogo → `/cursos/:id` (detalle)
4. **Inscribirse**: Botón en detalle de curso → POST `/api/inscripciones` → Estado ACTIVA
5. **Estudiar**:
   - `/mis-cursos` → Seleccionar curso → `/cursos/:id`
   - Ver módulos → `/modulos/:id`
   - Ver lecciones → `/lecciones/:id`
   - Responder quiz → `/quizzes/:id` → `/quizzes/:id/resultado`
6. **Examen Final**: `/cursos/:id` → Botón examen → `/examenes-finales/:id`
7. **Certificado**: Si acreditado → `/certificados` → Generar → Descargar

### Flujo de Administrador

1. **Login**: `/login` → Cognito → `/auth/callback` → `/admin`
2. **Gestión de Cursos**: `/admin/cursos` → CRUD de cursos, módulos, lecciones
3. **Gestión de Usuarios**: `/admin/usuarios` → Lista, edición de roles
4. **Reportes**: `/admin/reportes` → Análisis y exportación
5. **Configuración**: `/admin/configuracion` → Reglas de acreditación, permisos

### Flujo de Verificación de Certificado

1. Usuario accede a `/verificar-certificado`
2. Ingresa ID de certificado y hash
3. Frontend llama a `GET /api/certificados/{id}/verificar?hash={hash}`
4. Backend valida hash y estado
5. Muestra resultado (válido/inválido) con folio y fecha

---

## Consideraciones de Implementación

### Manejo de Tokens

- Tokens almacenados en cookies HTTP-only (seguridad)
- Frontend no accede directamente a tokens
- Refresh automático cuando expira access token
- Logout limpia todas las cookies

### Validación de Acceso en Frontend

- `ProtectedRoute` valida autenticación y rol
- Verificación adicional en cada página antes de cargar datos
- Manejo de errores 403 (Forbidden) y 401 (Unauthorized)
- Redirección a `/unauthorized` si no tiene permisos

### Estados de Carga

- Loading states mientras se validan permisos
- Skeleton loaders para contenido
- Manejo de errores con mensajes claros

### Polling y Actualización

- Certificados en PROCESSING: polling cada 5 segundos
- Progreso: actualización en tiempo real con WebSockets (opcional)
- Notificaciones: sistema de preferencias de usuario

### URLs Prefirmadas

- Contenido en S3 (videos, documentos, imágenes) usa URLs prefirmadas
- Expiración configurada (típicamente 1 hora)
- Regeneración automática si expira

---

## Notas Adicionales

- Todas las rutas del backend usan prefijo `/api`
- Autenticación basada en JWT con Cognito
- Cookies HTTP-only para seguridad
- Paginación estándar: `skip` y `limit`
- Filtros opcionales en query params
- Respuestas en formato JSON
- Manejo de errores estructurado con códigos de error

