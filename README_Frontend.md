# Guía de Desarrollo - Frontend (React + Vite)

## Arquitectura

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Estilizado**: Tailwind CSS
- **Estado**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Autenticación**: Amazon Cognito (Flujo Hosted UI + Cookies HTTP-only)
- **API Client**: Fetch (nativo, sin tokens en headers)
- **Validación**: Zod
- **Mocking**: MSW (desarrollo)
- **Notificaciones**: Sonner
- **Backend**: FastAPI con PostgreSQL + RLS
- **Despliegue Frontend**: S3 + CloudFront (estático)
- **Despliegue Backend**: ECS Fargate (Docker)

## System Prompt: Ingeniero Frontend Senior

Eres un **ingeniero frontend senior experto** especializado en el siguiente stack tecnológico:

### Stack Tecnológico

- **Framework**: React 18 + TypeScript
- **Build**: Vite 7.1.9 (con SWC)
- **Estilos**: Tailwind CSS 3.4.1
- **Estado**: TanStack React Query 5.83.0
- **Routing**: React Router DOM 6.30.1
- **Auth**: Amazon Cognito Hosted UI + Cookies HTTP-only (seguro)
- **HTTP**: Fetch API nativo
- **Validación**: Zod 3.23.8
- **Formularios**: React Hook Form 7.53.0
- **UI**: Radix UI primitives
- **Notificaciones**: Sonner 1.7.4
- **Mocking**: MSW (opcional)

### Principios de Desarrollo

1. **Type Safety First**
   - Usar TypeScript estricto con tipos explícitos
   - Tipos alineados con la estructura de la base de datos (UUIDs, enums, relaciones)
   - Validación con Zod para runtime type checking
   - Evitar `any` y `unknown` sin justificación

2. **Arquitectura Feature-Sliced Design (FSD)**
   - Estructura por entidades: `src/entities/{entity}/`
   - Separación clara: `model/`, `api/`, `ui/`, `lib/`
   - Shared layer para código reutilizable
   - Widgets para componentes compuestos

3. **React Query Best Practices**
   - Usar `useQuery` para datos de lectura
   - Usar `useMutation` para operaciones de escritura
   - Invalidar queries relacionadas después de mutaciones
   - Implementar optimistic updates cuando sea apropiado
   - Manejar estados de loading, error y success

4. **Fetch API Nativo con Cookies**
   - No usar librerías HTTP adicionales (Axios, etc.)
   - Centralizar lógica de requests en `api-client.ts`
   - Configurar `credentials: 'include'` para cookies HTTP-only
   - Backend maneja autenticación vía cookies seguras (no tokens en headers)

5. **Cognito Hosted UI (Seguro)**
   - Redirección a `/auth/login` del backend para iniciar flujo OAuth2 PKCE
   - Backend maneja tokens en cookies HTTP-only seguras
   - Frontend usa cookies para autenticación (sin tokens en localStorage)
   - No manejo directo de tokens en el frontend (seguridad máxima)

6. **Formularios con React Hook Form + Zod**
   - Validación con Zod schemas
   - Integración con `@hookform/resolvers`
   - Manejo de errores de validación
   - Optimización de re-renders

7. **UI Components con Radix UI**
   - Usar primitives de Radix UI
   - Composición sobre configuración
   - Accesibilidad built-in
   - Customización con Tailwind CSS

8. **Tailwind CSS**
   - Utility-first approach
   - Componentes reutilizables con `@apply` cuando sea necesario
   - Responsive design mobile-first
   - Dark mode support cuando aplique

9. **Código Limpio**
   - Componentes pequeños y enfocados
   - Hooks personalizados para lógica reutilizable
   - Separación de concerns (UI, lógica, datos)
   - Nombres descriptivos y consistentes

10. **Performance**
    - Lazy loading de rutas y componentes pesados
    - Code splitting por feature
    - Memoización cuando sea necesario (`useMemo`, `useCallback`)
    - Optimistic updates para mejor UX

11. **Testing (cuando aplique)**
    - Unit tests para hooks y utilidades
    - Integration tests para flujos críticos
    - E2E tests para flujos completos

12. **Alineación con Base de Datos**
    - Tipos TypeScript reflejan exactamente la estructura de la DB
    - Respetar reglas de negocio definidas en triggers
    - Validar prerrequisitos antes de operaciones
    - Manejar estados de entidades correctamente

### Convenciones de Código

- **Nombres de archivos**: kebab-case (`use-module.ts`, `module-card.tsx`)
- **Nombres de componentes**: PascalCase (`ModuleCard`, `QuizPage`)
- **Nombres de hooks**: camelCase con prefijo `use` (`useModulo`, `useInscribirEnCurso`)
- **Nombres de tipos/interfaces**: PascalCase (`Modulo`, `InscripcionCurso`)
- **Nombres de constantes**: UPPER_SNAKE_CASE (`API_ENDPOINTS`, `ESTADO_INSCRIPCION`)

### Estructura de Archivos Recomendada

```
src/
├── entities/           # Entidades de dominio
│   └── {entity}/
│       ├── model/     # Types, schemas, interfaces
│       ├── api/       # Hooks de React Query
│       ├── ui/        # Componentes de la entidad
│       └── lib/        # Utilidades específicas
├── features/          # Features complejas
├── widgets/           # Componentes compuestos
├── pages/             # Páginas/rutas
├── shared/            # Código compartido
│   ├── api/          # API client, endpoints
│   ├── aws/           # Cognito integration
│   ├── ui/            # Componentes UI base
│   ├── hooks/         # Hooks reutilizables
│   └── lib/           # Utilidades generales
└── app/               # Configuración de la app
```

### Prioridades

1. **Type Safety**: Nunca comprometer la seguridad de tipos
2. **User Experience**: UX fluida y responsiva
3. **Performance**: Carga rápida y operaciones eficientes
4. **Mantenibilidad**: Código claro y bien organizado
5. **Alineación con DB**: Respetar estructura y reglas de la base de datos

---

## Estado Actual de la Implementación

### ✅ Migración a Cognito Hosted UI - COMPLETADO

La migración a Cognito Hosted UI (sin manejo directo de tokens en frontend) ha sido completada exitosamente.

#### Cambios Implementados

1. **✅ Dependencias actualizadas**
   - Eliminado: `amazon-cognito-identity-js` (ya no se usa)
   - Eliminado: `aws-amplify`, `@aws-amplify/ui-react`
   - Reducción de 259+ paquetes en node_modules

2. **✅ Archivo `cognito.ts` eliminado**
   - Ya no se usa autenticación directa con Cognito Identity JS
   - El frontend ahora usa redirecciones a `/auth/login` del backend
   - El backend maneja todo el flujo OAuth2 PKCE con Cognito Hosted UI

3. **✅ API Client refactorizado**
   - Archivo: `frontend/src/shared/api/api-client.ts`
   - Migrado de Amplify API a Fetch API nativo
   - Métodos HTTP (GET, POST, PUT, DELETE) funcionando con Fetch
   - NO envía tokens en headers (backend lee cookies HTTP-only)
   - `credentials: 'include'` configurado para cookies
   - Manejo de errores mejorado
   - Query parameters correctamente manejados

4. **✅ Configuración limpiada**
   - Eliminado: `frontend/src/shared/aws/cognito.ts` (no necesario para Hosted UI)
   - Eliminado: `frontend/src/shared/config/aws.ts` (configuración de Amplify)
   - Actualizado: `frontend/src/main.tsx` (sin imports de aws.ts)
   - Actualizado: `frontend/src/app/providers/AuthProvider.tsx` (exporta `useAuth`)

5. **✅ Verificación completada**
   - Sin referencias a `aws-amplify` en el código fuente
   - Sin referencias a `amazon-cognito-identity-js` en el código fuente
   - Sin errores de TypeScript
   - Sin errores de linter
   - Código listo para producción

#### Beneficios de la Migración

- **Bundle más pequeño**: Eliminación de 259 paquetes reduce significativamente el tamaño del bundle
- **Mejor rendimiento**: Fetch API nativo es más rápido que Amplify API
- **Menos dependencias**: Menos puntos de fallo y actualizaciones
- **Más control**: Uso directo de Cognito permite mayor flexibilidad
- **Compatibilidad**: La API pública de `apiClient` no cambió, los componentes existentes no requieren modificación

#### Estado Actual

- ✅ **Cognito Hosted UI implementado**: Frontend redirige a `/auth/login` del backend
- ✅ **API Client sin tokens**: No envía `Authorization` headers, usa cookies
- ✅ **AuthProvider funcionando**: Exporta `useAuth` correctamente
- ⏳ **Integración pendiente**: Probar autenticación end-to-end con backend

---

## ✅ Sincronización con Backend (FastAPI) - IMPLEMENTADO

### Arquitectura del Backend

El backend es una **API RESTful completa** construida con FastAPI que incluye:

- **Endpoints completos**: `/api/usuarios`, `/api/modulos`, `/api/cursos`, `/api/lecciones`, `/api/quizzes`, `/api/inscripciones`, `/api/certificados`, etc.
- **Autenticación Cognito**: Flujo OAuth2 PKCE con hosted UI + cookies HTTP-only
- **Base de datos**: PostgreSQL con Row Level Security (RLS)
- **Seguridad**: JWT verification, RLS automático, triggers de negocio

### ✅ Flujo de Autenticación Sincronizado - IMPLEMENTADO

```
Frontend → /auth/login (redirect) → Cognito Hosted UI → /auth/callback → Cookies HTTP-only
Frontend → /api/* (requests sin tokens) → Backend lee cookies automáticamente → Respuestas
```

**Implementación verificada:**
- ✅ **`use-auth.ts`**: Función `login()` redirige a `/auth/login` del backend (línea 78-79)
- ✅ **`api-client.ts`**: NO envía tokens en headers `Authorization: Bearer` (línea 31-32)
- ✅ **`api-client.ts`**: Configurado `credentials: 'include'` para cookies (línea 37)
- ✅ **`endpoints.ts`**: Endpoints AUTH configurados (`/auth/login`, `/auth/logout`, `/auth/callback`, `/auth/profile`, `/auth/refresh`)
- ✅ **`use-auth.ts`**: `checkAuth()` llama a `/auth/profile` para verificar sesión (línea 45)
- ✅ **`use-auth.ts`**: `logout()` llama a `/auth/logout` del backend (línea 87)
- ✅ **`use-auth.ts`**: `refreshAuth()` llama a `/auth/refresh` para refrescar tokens (línea 116)

**Beneficios:**
- ✅ **Seguridad máxima**: Cookies HTTP-only, servidor controla autenticación
- ✅ **Backend completo**: El backend maneja TODA la lógica de negocio
- ✅ **RLS automático**: Filtros de seguridad a nivel de base de datos
- ✅ **Arquitectura limpia**: Frontend solo consume API, no maneja auth

### ✅ Cambios Implementados en Frontend

1. **✅ Remover Cognito Identity JS completamente** - Eliminado `amazon-cognito-identity-js` y `cognito.ts`
2. **✅ Cambiar AuthProvider**: Usa redirecciones a `/auth/login` del backend (implementado en `use-auth.ts`)
3. **✅ Modificar api-client.ts**: NO envía `Authorization: Bearer <token>` (backend lee cookies HTTP-only)
4. **⏳ Configurar VITE_API_URL** apuntando al backend (pendiente configuración de variables de entorno)
5. **✅ Manejar estados de autenticación** basados en responses del backend (implementado en `use-auth.ts`)

### Variables de Entorno

```env
# Desarrollo
VITE_API_URL=http://localhost:8000/api
VITE_APP_URL=http://localhost:5173

# Producción
VITE_API_URL=https://api.ebs.edu/api
VITE_APP_URL=https://app.ebs.edu
```

---

## 🚀 Despliegue: S3 + CloudFront (Ultra Económico)

### Arquitectura de Despliegue

```
Usuario → CloudFront (CDN) → S3 (Frontend estático)
                    ↓
              API Gateway → ECS Fargate (Backend)
```

**Costo aproximado:** $0.50-2/mes

### Pipeline de Despliegue

**1. Build del Frontend:**
```bash
npm run build  # Genera carpeta 'dist/' con archivos estáticos
```

**2. Upload a S3:**
```bash
aws s3 sync dist/ s3://ebs-frontend-bucket --delete
```

**3. Invalidate CloudFront:**
```bash
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

### Configuración CloudFront

- **Origin**: S3 bucket
- **Default Root Object**: `index.html`
- **Error Pages**: Redirigir 404 a `index.html` (SPA routing)
- **CORS**: Configurado para dominio del backend

### Configuración CORS en Backend

```python
# FastAPI main.py
CORS_ORIGINS = [
    "http://localhost:5173",  # Desarrollo
    "https://app.ebs.edu",    # Producción
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,  # Para cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Cookies Cross-Domain

Para cookies HTTP-only entre dominios:
- `app.ebs.edu` (Frontend en S3/CloudFront)
- `api.ebs.edu` (Backend en ECS)

```python
# Configuración cookies en backend
response.set_cookie(
    "access_token",
    access_token,
    httponly=True,
    secure=True,
    samesite="none",  # Cross-domain
    domain=".ebs.edu",  # Dominio base
)
```

---

## 🎯 Implementación: Adaptar Frontend al Backend

### 🚀 Implementación
¿Quieres que proceda con la implementación? Los cambios serían:

**Backend:**
- Verificar configuración CORS para frontend
- Endpoint `/auth/tokens` opcional si frontend necesita tokens

**Frontend:**
- Remover `amazon-cognito-identity-js`
- Cambiar `AuthProvider` para usar redirecciones
- Modificar `api-client.ts` para no enviar tokens
- Configurar variables de entorno

### 📋 Checklist de Sincronización

- [ ] Configurar CORS en backend para dominio del frontend
- [ ] Actualizar variables de entorno (`VITE_API_URL`)
- [ ] Remover Cognito Identity JS del frontend
- [ ] Cambiar AuthProvider para usar `/auth/login` del backend
- [ ] Modificar api-client para no enviar tokens en headers
- [ ] Configurar despliegue S3 + CloudFront
- [ ] Probar integración completa: Login → API calls → Logout

---

## Plan de Desarrollo Frontend - Alineado con Base de Datos

### Análisis de la Estructura de Base de Datos

**Nota Importante:** La tabla `curso` en la base de datos representa conceptualmente una "Materia" en el modelo de negocio. La jerarquía es: Módulo → Materia (curso) → Lección → Quiz.

**Jerarquía de Contenido:**
```
Módulo (fecha_inicio DATE, fecha_fin DATE, publicado BOOLEAN)
  └── modulo_curso (relación muchos a muchos con slot INT)
      └── Curso/Materia (titulo, descripcion TEXT, publicado BOOLEAN)
          ├── Examen_Final (aleatorio BOOLEAN, guarda_calificacion BOOLEAN)
          ├── Guia_Estudio (titulo, url VARCHAR(500), activo BOOLEAN)
          └── (a través de módulo)
              └── Lección (titulo, orden INT, publicado BOOLEAN)
                  ├── Lección_Contenido (tipo tipo_contenido ENUM: TEXTO, PDF, VIDEO, LINK)
                  └── Quiz (aleatorio BOOLEAN, guarda_calificacion BOOLEAN)
                      └── Pregunta
                          ├── Pregunta_Config (tipo tipo_pregunta ENUM: ABIERTA, OPCION_MULTIPLE, VERDADERO_FALSO)
                          └── Opción (texto VARCHAR(500), es_correcta BOOLEAN, orden INT)
```

**Entidades de Usuario y Acceso:**
- `usuario` (id UUID, nombre VARCHAR(120), apellido VARCHAR(120), email VARCHAR(190) UNIQUE, avatar_url VARCHAR(500), cognito_user_id VARCHAR(255) UNIQUE)
- `rol` (id UUID, nombre VARCHAR(50) UNIQUE)
- `usuario_rol` (id UUID, usuario_id UUID, rol_id UUID, asignado_en TIMESTAMPTZ)

**Entidades de Inscripción y Progreso:**
- `inscripcion_curso` (id UUID, usuario_id UUID, curso_id UUID, estado estado_inscripcion ENUM: ACTIVA, PAUSADA, CONCLUIDA, REPROBADA, acreditado BOOLEAN, acreditado_en TIMESTAMPTZ, fecha_inscripcion DATE, fecha_conclusion DATE)
- `intento` (id UUID, usuario_id UUID, quiz_id UUID | examen_final_id UUID, inscripcion_curso_id UUID, numero_intento INT, puntaje NUMERIC(5,2), resultado resultado_intento ENUM: APROBADO, NO_APROBADO, iniciado_en TIMESTAMPTZ, finalizado_en TIMESTAMPTZ, permitir_nuevo_intento BOOLEAN)
- `intento_pregunta` (id UUID, intento_id UUID, pregunta_id UUID, puntos_maximos INT, orden INT)
- `respuesta` (id UUID, intento_pregunta_id UUID, respuesta_texto TEXT, opcion_id UUID, respuesta_bool BOOLEAN)

**Entidades de Acreditación y Certificación:**
- `regla_acreditacion` (id UUID, curso_id UUID, quiz_id UUID | examen_final_id UUID | NULL, min_score_aprobatorio NUMERIC(5,2) DEFAULT 80.00, max_intentos_quiz INT DEFAULT 3, bloquea_curso_por_reprobacion_quiz BOOLEAN DEFAULT TRUE, activa BOOLEAN DEFAULT TRUE)
- `certificado` (id UUID, inscripcion_curso_id UUID, quiz_id UUID | examen_final_id UUID | NULL, intento_id UUID | NULL, folio VARCHAR(50), hash_verificacion VARCHAR(128) UNIQUE, s3_key VARCHAR(500), emitido_en TIMESTAMPTZ, valido BOOLEAN DEFAULT TRUE)

**Entidades de Interacción:**
- `foro_comentario` (id UUID, usuario_id UUID, curso_id UUID, leccion_id UUID, contenido TEXT)
- `preferencia_notificacion` (id UUID, usuario_id UUID UNIQUE, email_recordatorios BOOLEAN, email_motivacion BOOLEAN, email_resultados BOOLEAN)

**Vistas de Base de Datos:**
- `inscripcion_modulo_calculada`: Calcula el progreso del módulo basándose en las inscripciones de materias (cursos). El estado se deriva de las inscripciones: REPROBADA > CONCLUIDA > PAUSADA > ACTIVA.
- `respuesta_con_evaluacion`: Calcula dinámicamente `es_correcta` y `puntos_otorgados` basándose en el tipo de pregunta y la configuración.
- `quiz_con_preguntas`: Vista que incluye el número de preguntas por quiz.
- `examen_final_con_preguntas`: Vista que incluye el número de preguntas por examen final.

**Tipos ENUM de Base de Datos:**
- `estado_publicacion`: 'PUBLICADO', 'NO_PUBLICADO' (definido pero no usado directamente en tablas, se usa BOOLEAN)
- `tipo_contenido`: 'TEXTO', 'PDF', 'VIDEO', 'LINK'
- `estado_inscripcion`: 'ACTIVA', 'PAUSADA', 'CONCLUIDA', 'REPROBADA'
- `resultado_intento`: 'APROBADO', 'NO_APROBADO'
- `tipo_pregunta`: 'ABIERTA', 'OPCION_MULTIPLE', 'VERDADERO_FALSO'

**Reglas de Negocio (Triggers):**

1. **Validación de Máximo de Intentos** (`trg_validar_max_intentos`):
   - Valida que un usuario no exceda el máximo de intentos permitidos (default: 3, configurable por `regla_acreditacion`)
   - Se ejecuta antes de INSERT en `intento`
   - Prioridad: regla específica (quiz_id o examen_final_id) > regla general (curso_id)

2. **Validación de Intento-Inscripción** (`trg_validar_intento_inscripcion`):
   - Valida que el `usuario_id` coincida con la inscripción
   - Valida que el quiz pertenezca a una lección de la materia (curso) de la inscripción
   - Valida que el examen final pertenezca a la materia de la inscripción

3. **Validación de Prerrequisitos de Examen Final** (`trg_validar_examen_final_prerequisitos`):
   - Valida que todos los quizzes de las lecciones de la materia estén completados y aprobados
   - Se ejecuta antes de INSERT en `intento` cuando `examen_final_id IS NOT NULL`
   - Bloquea el examen final si hay quizzes pendientes

4. **Validación de Nuevo Intento Permitido** (`trg_validar_nuevo_intento_permitido`):
   - Valida que `permitir_nuevo_intento = TRUE` en el último intento antes de crear uno nuevo
   - No aplica para el primer intento
   - El instructor controla nuevos intentos mediante `permitir_nuevo_intento`

5. **Validación de Tipo de Respuesta** (`trg_validar_respuesta_tipo`):
   - Valida que la respuesta coincida con el tipo de pregunta:
     - `ABIERTA`: requiere `respuesta_texto`
     - `OPCION_MULTIPLE`: requiere `opcion_id`
     - `VERDADERO_FALSO`: requiere `respuesta_bool`

6. **Validación de Transición de Estado de Inscripción** (`trg_validar_transicion_estado_inscripcion_curso`):
   - Una inscripción `CONCLUIDA` no puede cambiar de estado
   - Una inscripción `REPROBADA` solo puede mantenerse o concluirse
   - Si se concluye o reproba, actualiza `fecha_conclusion` si es NULL

7. **Validación de Acreditación** (`trg_validar_acreditacion_curso`):
   - Valida que existe al menos un intento aprobado del examen final que cumpla el score mínimo (default: 80.00, configurable por `regla_acreditacion`)
   - Si se acredita, establece `acreditado_en` y cambia el estado a `CONCLUIDA`
   - Prioridad de reglas: examen final específico > quiz específico > general

8. **Validación de Foro Comentario** (`trg_validar_foro_comentario_curso`):
   - Valida que el `curso_id` (materia) coincida con una de las materias del módulo de la lección

---

## ✅ Fase 1: Definición de Tipos TypeScript (Alineados con DB)

### 1.1 Tipos Base de Entidades

**Objetivo:** Crear tipos TypeScript que reflejen exactamente la estructura de la base de datos.

#### `src/entities/module/model/types.ts` - Actualizar

```typescript
export interface Modulo {
  id: string; // UUID PRIMARY KEY
  titulo: string; // VARCHAR(200) NOT NULL
  fecha_inicio: string; // DATE NOT NULL (formato: YYYY-MM-DD)
  fecha_fin: string; // DATE NOT NULL (formato: YYYY-MM-DD)
  publicado: boolean; // BOOLEAN
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP (formato ISO 8601)
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP (formato ISO 8601)
}

export interface ModuloCurso {
  id: string; // UUID PRIMARY KEY
  modulo_id: string; // UUID NOT NULL REFERENCES modulo(id)
  curso_id: string; // UUID NOT NULL REFERENCES curso(id)
  slot: number; // INT NOT NULL (UNIQUE con modulo_id)
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}
```

#### `src/entities/course/model/types.ts` - Actualizar

```typescript
/**
 * Nota: La tabla se llama "curso" pero conceptualmente representa una "Materia"
 * en el modelo de negocio. La jerarquía es: Módulo → Materia (curso) → Lección → Quiz
 */
export interface Curso {
  id: string; // UUID PRIMARY KEY
  titulo: string; // VARCHAR(200) NOT NULL
  descripcion: string | null; // TEXT
  publicado: boolean; // BOOLEAN
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}

export interface GuiaEstudio {
  id: string; // UUID PRIMARY KEY
  curso_id: string; // UUID NOT NULL REFERENCES curso(id)
  titulo: string; // VARCHAR(200) NOT NULL
  url: string | null; // VARCHAR(500)
  activo: boolean; // BOOLEAN
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}
```

#### `src/entities/lesson/model/types.ts` - Crear

```typescript
/**
 * Tipo de contenido de lección (ENUM en DB: tipo_contenido)
 * Nota: Las lecciones NO tienen fechas propias. Las fechas del módulo
 * controlan cuándo el contenido está disponible.
 */
export type TipoContenido = 'TEXTO' | 'PDF' | 'VIDEO' | 'LINK';

export interface Leccion {
  id: string; // UUID PRIMARY KEY
  modulo_id: string; // UUID NOT NULL REFERENCES modulo(id)
  titulo: string; // VARCHAR(200) NOT NULL
  orden: number | null; // INT
  publicado: boolean; // BOOLEAN
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}

export interface LeccionContenido {
  id: string; // UUID PRIMARY KEY
  leccion_id: string; // UUID NOT NULL REFERENCES leccion(id)
  tipo: TipoContenido; // tipo_contenido NOT NULL (ENUM)
  titulo: string | null; // VARCHAR(200)
  descripcion: string | null; // TEXT
  url: string | null; // VARCHAR(500)
  orden: number | null; // INT
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}
```

#### `src/entities/quiz/model/types.ts` - Crear

```typescript
/**
 * Quiz vinculado a una lección específica.
 * Los quizzes son las tareas evaluables del sistema.
 * Jerarquía: Módulo → Materia (curso) → Lección → Quiz
 */
export interface Quiz {
  id: string; // UUID PRIMARY KEY
  leccion_id: string; // UUID NOT NULL REFERENCES leccion(id)
  titulo: string; // VARCHAR(200) NOT NULL
  publicado: boolean; // BOOLEAN
  aleatorio: boolean; // BOOLEAN
  guarda_calificacion: boolean; // BOOLEAN
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}
```

#### `src/entities/exam/model/types.ts` - Crear

```typescript
/**
 * Examen final de la materia (curso).
 * Solo accesible después de completar todos los quizzes de las lecciones.
 * Jerarquía: Módulo → Materia (curso) → Examen Final
 */
export interface ExamenFinal {
  id: string; // UUID PRIMARY KEY
  curso_id: string; // UUID NOT NULL REFERENCES curso(id)
  titulo: string; // VARCHAR(200) NOT NULL
  publicado: boolean; // BOOLEAN
  aleatorio: boolean; // BOOLEAN
  guarda_calificacion: boolean; // BOOLEAN
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}
```

#### `src/entities/question/model/types.ts` - Crear

```typescript
/**
 * Tipos ENUM de la base de datos
 */
export type TipoPregunta = 'ABIERTA' | 'OPCION_MULTIPLE' | 'VERDADERO_FALSO';
export type ResultadoIntento = 'APROBADO' | 'NO_APROBADO';

/**
 * Pregunta puede pertenecer a un quiz o a un examen final (no ambos)
 * CONSTRAINT: (quiz_id IS NOT NULL AND examen_final_id IS NULL) OR
 *             (quiz_id IS NULL AND examen_final_id IS NOT NULL)
 */
export interface Pregunta {
  id: string; // UUID PRIMARY KEY
  quiz_id: string | null; // UUID REFERENCES quiz(id) | NULL
  examen_final_id: string | null; // UUID REFERENCES examen_final(id) | NULL
  enunciado: string; // TEXT NOT NULL
  puntos: number | null; // INT
  orden: number | null; // INT
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}

/**
 * Configuración de pregunta según su tipo.
 * Constraints en DB:
 * - ABIERTA: requiere abierta_modelo_respuesta IS NOT NULL
 * - VERDADERO_FALSO: requiere vf_respuesta_correcta IS NOT NULL
 * - OPCION_MULTIPLE: requiere om_min_selecciones y om_max_selecciones IS NOT NULL
 * - om_min_selecciones <= om_max_selecciones
 */
export interface PreguntaConfig {
  pregunta_id: string; // UUID PRIMARY KEY REFERENCES pregunta(id)
  tipo: TipoPregunta; // tipo_pregunta NOT NULL (ENUM)
  abierta_modelo_respuesta: string | null; // TEXT (requerido si tipo = ABIERTA)
  om_seleccion_multiple: boolean; // BOOLEAN
  om_min_selecciones: number | null; // INT (requerido si tipo = OPCION_MULTIPLE)
  om_max_selecciones: number | null; // INT (requerido si tipo = OPCION_MULTIPLE)
  vf_respuesta_correcta: boolean | null; // BOOLEAN (requerido si tipo = VERDADERO_FALSO)
  penaliza_error: boolean; // BOOLEAN
  puntos_por_opcion: number | null; // INT
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}

export interface Opcion {
  id: string; // UUID PRIMARY KEY
  pregunta_id: string; // UUID NOT NULL REFERENCES pregunta(id)
  texto: string; // VARCHAR(500) NOT NULL
  es_correcta: boolean | null; // BOOLEAN
  orden: number | null; // INT
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}
```

#### `src/entities/enrollment/model/types.ts` - Crear

```typescript
/**
 * Nota: inscripcion_curso representa inscripción a una "Materia" (curso).
 * Estado ENUM en DB: estado_inscripcion
 */
export type EstadoInscripcion = 'ACTIVA' | 'PAUSADA' | 'CONCLUIDA' | 'REPROBADA';

export interface InscripcionCurso {
  id: string; // UUID PRIMARY KEY
  usuario_id: string; // UUID NOT NULL REFERENCES usuario(id) (UNIQUE con curso_id)
  curso_id: string; // UUID NOT NULL REFERENCES curso(id)
  estado: EstadoInscripcion; // estado_inscripcion NOT NULL DEFAULT 'ACTIVA'
  acreditado: boolean; // BOOLEAN NOT NULL DEFAULT FALSE
  acreditado_en: string | null; // TIMESTAMPTZ
  fecha_inscripcion: string; // DATE NOT NULL (formato: YYYY-MM-DD)
  fecha_conclusion: string | null; // DATE (formato: YYYY-MM-DD)
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}
```

#### `src/entities/attempt/model/types.ts` - Crear

```typescript
/**
 * Intento puede ser de un quiz o de un examen final (no ambos)
 * CONSTRAINT: (quiz_id IS NOT NULL AND examen_final_id IS NULL) OR
 *             (quiz_id IS NULL AND examen_final_id IS NOT NULL)
 * 
 * Triggers que validan:
 * - trg_validar_max_intentos: valida máximo de intentos según regla_acreditacion
 * - trg_validar_intento_inscripcion: valida relaciones usuario-inscripción-quiz/examen
 * - trg_validar_examen_final_prerequisitos: valida que todos los quizzes estén aprobados
 * - trg_validar_nuevo_intento_permitido: valida permitir_nuevo_intento = TRUE
 */
export interface Intento {
  id: string; // UUID PRIMARY KEY
  usuario_id: string; // UUID NOT NULL REFERENCES usuario(id) (NO ACTION on delete)
  quiz_id: string | null; // UUID REFERENCES quiz(id) | NULL
  examen_final_id: string | null; // UUID REFERENCES examen_final(id) | NULL
  inscripcion_curso_id: string; // UUID NOT NULL REFERENCES inscripcion_curso(id)
  numero_intento: number; // INT NOT NULL
  puntaje: number | null; // NUMERIC(5,2)
  resultado: ResultadoIntento | null; // resultado_intento ENUM: APROBADO, NO_APROBADO
  iniciado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  finalizado_en: string | null; // TIMESTAMPTZ
  permitir_nuevo_intento: boolean; // BOOLEAN NOT NULL DEFAULT FALSE
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}

export interface IntentoPregunta {
  id: string; // UUID PRIMARY KEY
  intento_id: string; // UUID NOT NULL REFERENCES intento(id) (UNIQUE con pregunta_id)
  pregunta_id: string; // UUID NOT NULL REFERENCES pregunta(id)
  puntos_maximos: number | null; // INT
  orden: number | null; // INT
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}

/**
 * Respuesta debe coincidir con el tipo de pregunta (validado por trigger):
 * - ABIERTA: requiere respuesta_texto
 * - OPCION_MULTIPLE: requiere opcion_id
 * - VERDADERO_FALSO: requiere respuesta_bool
 */
export interface Respuesta {
  id: string; // UUID PRIMARY KEY
  intento_pregunta_id: string; // UUID NOT NULL REFERENCES intento_pregunta(id)
  respuesta_texto: string | null; // TEXT (requerido si tipo = ABIERTA)
  opcion_id: string | null; // UUID REFERENCES opcion(id) (requerido si tipo = OPCION_MULTIPLE)
  respuesta_bool: boolean | null; // BOOLEAN (requerido si tipo = VERDADERO_FALSO)
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}
```

#### `src/entities/certificate/model/types.ts` - Actualizar

```typescript
/**
 * Certificado generado automáticamente cuando se acredita una inscripción.
 * UNIQUE constraint: solo un certificado válido por inscripción_curso_id
 */
export interface Certificado {
  id: string; // UUID PRIMARY KEY
  inscripcion_curso_id: string; // UUID NOT NULL REFERENCES inscripcion_curso(id)
  quiz_id: string | null; // UUID REFERENCES quiz(id) (SET NULL on delete)
  examen_final_id: string | null; // UUID REFERENCES examen_final(id) (SET NULL on delete)
  intento_id: string | null; // UUID REFERENCES intento(id) (SET NULL on delete)
  folio: string | null; // VARCHAR(50)
  hash_verificacion: string | null; // VARCHAR(128) UNIQUE
  s3_key: string | null; // VARCHAR(500)
  emitido_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  valido: boolean; // BOOLEAN NOT NULL DEFAULT TRUE
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}
```

#### `src/entities/user/model/types.ts` - Actualizar

```typescript
export interface Usuario {
  id: string; // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  nombre: string; // VARCHAR(120) NOT NULL
  apellido: string; // VARCHAR(120) NOT NULL
  email: string; // VARCHAR(190) UNIQUE NOT NULL
  avatar_url: string | null; // VARCHAR(500)
  cognito_user_id: string | null; // VARCHAR(255) UNIQUE
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}

export interface Rol {
  id: string; // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  nombre: string; // VARCHAR(50) NOT NULL UNIQUE (ej: 'ADMIN', 'ESTUDIANTE', 'INSTRUCTOR')
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}

export interface UsuarioRol {
  id: string; // UUID PRIMARY KEY
  usuario_id: string; // UUID NOT NULL REFERENCES usuario(id) (UNIQUE con rol_id)
  rol_id: string; // UUID NOT NULL REFERENCES rol(id)
  asignado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}
```

#### `src/entities/forum/model/types.ts` - Crear

```typescript
/**
 * Comentario del foro asociado a una lección de una materia (curso).
 * Trigger valida que curso_id coincida con una materia del módulo de la lección.
 */
export interface ForoComentario {
  id: string; // UUID PRIMARY KEY
  usuario_id: string; // UUID NOT NULL REFERENCES usuario(id)
  curso_id: string; // UUID NOT NULL REFERENCES curso(id) (validado por trigger)
  leccion_id: string; // UUID NOT NULL REFERENCES leccion(id)
  contenido: string; // TEXT NOT NULL
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}
```

#### `src/entities/notification/model/types.ts` - Crear

```typescript
export interface PreferenciaNotificacion {
  id: string; // UUID PRIMARY KEY
  usuario_id: string; // UUID NOT NULL UNIQUE REFERENCES usuario(id)
  email_recordatorios: boolean | null; // BOOLEAN
  email_motivacion: boolean | null; // BOOLEAN
  email_resultados: boolean | null; // BOOLEAN
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}
```

#### `src/entities/accreditation/model/types.ts` - Crear

```typescript
/**
 * Regla de acreditación para un curso, quiz específico o examen final específico.
 * CONSTRAINT: (quiz_id IS NOT NULL AND examen_final_id IS NULL) OR
 *             (quiz_id IS NULL AND examen_final_id IS NOT NULL) OR
 *             (quiz_id IS NULL AND examen_final_id IS NULL)
 * 
 * Prioridad de reglas (usada por triggers):
 * 1. Regla específica de examen_final_id
 * 2. Regla específica de quiz_id
 * 3. Regla general (solo curso_id)
 * 
 * UNIQUE constraints parciales:
 * - Una regla activa general por curso (sin quiz_id ni examen_final_id)
 * - Una regla activa específica por curso-quiz
 * - Una regla activa específica por curso-examen_final
 */
export interface ReglaAcreditacion {
  id: string; // UUID PRIMARY KEY
  curso_id: string; // UUID NOT NULL REFERENCES curso(id)
  quiz_id: string | null; // UUID REFERENCES quiz(id) | NULL
  examen_final_id: string | null; // UUID REFERENCES examen_final(id) | NULL
  min_score_aprobatorio: number; // NUMERIC(5,2) NOT NULL DEFAULT 80.00
  max_intentos_quiz: number; // INT NOT NULL DEFAULT 3
  bloquea_curso_por_reprobacion_quiz: boolean; // BOOLEAN NOT NULL DEFAULT TRUE
  activa: boolean; // BOOLEAN NOT NULL DEFAULT TRUE
  creado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  actualizado_en: string; // TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
}
```

### 1.2 Tipos de Vistas (Views de DB)

#### `src/entities/progress/model/types.ts` - Actualizar

```typescript
/**
 * Vista: inscripcion_modulo_calculada
 * Calcula el progreso del módulo basándose en las inscripciones de materias (cursos).
 * El estado se deriva de las inscripciones con prioridad: REPROBADA > CONCLUIDA > PAUSADA > ACTIVA.
 * El módulo está acreditado solo si todas las materias están acreditadas y el usuario
 * está inscrito en todas las materias del módulo.
 */
export interface InscripcionModuloCalculada {
  usuario_id: string; // UUID
  modulo_id: string; // UUID
  estado: EstadoInscripcion; // estado_inscripcion (calculado)
  acreditado: boolean; // BOOLEAN (calculado: todas acreditadas y todas inscritas)
  acreditado_en: string | null; // TIMESTAMPTZ (MAX de acreditado_en de inscripciones)
  fecha_inscripcion: string; // DATE (MIN de fecha_inscripcion)
  fecha_conclusion: string | null; // DATE (MAX de fecha_conclusion)
}

/**
 * Vista: respuesta_con_evaluacion
 * Calcula dinámicamente es_correcta y puntos_otorgados basándose en el tipo de pregunta:
 * - OPCION_MULTIPLE: es_correcta = opcion.es_correcta, puntos según configuración
 * - VERDADERO_FALSO: es_correcta = (respuesta_bool = vf_respuesta_correcta), puntos según configuración
 * - ABIERTA: es_correcta = NULL (requiere evaluación manual), puntos = NULL
 */
export interface RespuestaConEvaluacion extends Respuesta {
  es_correcta: boolean | null; // BOOLEAN (calculado, NULL para ABIERTA)
  puntos_otorgados: number | null; // NUMERIC (calculado, NULL para ABIERTA)
}

/**
 * Vista: quiz_con_preguntas
 * Incluye el número de preguntas por quiz
 */
export interface QuizConPreguntas extends Quiz {
  numero_preguntas: number; // COUNT de preguntas
}

/**
 * Vista: examen_final_con_preguntas
 * Incluye el número de preguntas por examen final
 */
export interface ExamenFinalConPreguntas extends ExamenFinal {
  numero_preguntas: number; // COUNT de preguntas
}
```

### 1.3 Validación con Zod

#### `src/entities/*/model/schemas.ts` - Crear schemas Zod para cada entidad

```typescript
import { z } from 'zod';

export const inscripcionCursoSchema = z.object({
  usuario_id: z.string().uuid(),
  curso_id: z.string().uuid(),
  estado: z.enum(['ACTIVA', 'PAUSADA', 'CONCLUIDA', 'REPROBADA']),
  fecha_inscripcion: z.string().date(),
});

export const respuestaSchema = z.object({
  intento_pregunta_id: z.string().uuid(),
  respuesta_texto: z.string().nullable().optional(),
  opcion_id: z.string().uuid().nullable().optional(),
  respuesta_bool: z.boolean().nullable().optional(),
}).refine(
  (data) => data.respuesta_texto !== null || data.opcion_id !== null || data.respuesta_bool !== null,
  { message: 'Debe proporcionar al menos una respuesta' }
);
```

---

## ✅ Fase 2: Endpoints API y Servicios - COMPLETADO

### 2.1 ✅ Actualizar `src/shared/api/endpoints.ts` - COMPLETADO

```typescript
export const API_ENDPOINTS = {
  // Módulos
  MODULOS: {
    BASE: '/modulos',
    BY_ID: (id: string) => `/modulos/${id}`,
    CURSOS: (id: string) => `/modulos/${id}/cursos`,
  },

  // Cursos (Materias)
  CURSOS: {
    BASE: '/cursos',
    BY_ID: (id: string) => `/cursos/${id}`,
    INSCRIBIR: (id: string) => `/cursos/${id}/inscribir`,
    DESINSCRIBIR: (id: string) => `/cursos/${id}/desinscribir`,
    PROGRESO: (id: string) => `/cursos/${id}/progreso`,
    GUIAS_ESTUDIO: (id: string) => `/cursos/${id}/guias-estudio`,
  },

  // Lecciones
  LECCIONES: {
    BASE: '/lecciones',
    BY_ID: (id: string) => `/lecciones/${id}`,
    CONTENIDO: (id: string) => `/lecciones/${id}/contenido`,
    BY_MODULO: (moduloId: string) => `/lecciones?modulo_id=${moduloId}`,
  },

  // Quizzes
  QUIZZES: {
    BASE: '/quizzes',
    BY_ID: (id: string) => `/quizzes/${id}`,
    PREGUNTAS: (id: string) => `/quizzes/${id}/preguntas`,
    INICIAR: (id: string) => `/quizzes/${id}/iniciar`,
    ENVIAR: (id: string) => `/quizzes/${id}/enviar`,
  },

  // Exámenes Finales
  EXAMENES_FINALES: {
    BASE: '/examenes-finales',
    BY_ID: (id: string) => `/examenes-finales/${id}`,
    BY_CURSO: (cursoId: string) => `/examenes-finales?curso_id=${cursoId}`,
    PREGUNTAS: (id: string) => `/examenes-finales/${id}/preguntas`,
    INICIAR: (id: string) => `/examenes-finales/${id}/iniciar`,
    ENVIAR: (id: string) => `/examenes-finales/${id}/enviar`,
  },

  // Intentos
  INTENTOS: {
    BASE: '/intentos',
    BY_ID: (id: string) => `/intentos/${id}`,
    BY_QUIZ: (quizId: string) => `/intentos?quiz_id=${quizId}`,
    BY_EXAMEN: (examenId: string) => `/intentos?examen_final_id=${examenId}`,
    RESULTADO: (id: string) => `/intentos/${id}/resultado`,
  },

  // Inscripciones
  INSCRIPCIONES: {
    BASE: '/inscripciones',
    BY_ID: (id: string) => `/inscripciones/${id}`,
    BY_USUARIO: (usuarioId: string) => `/inscripciones?usuario_id=${usuarioId}`,
    BY_CURSO: (cursoId: string) => `/inscripciones?curso_id=${cursoId}`,
    ACTUALIZAR_ESTADO: (id: string) => `/inscripciones/${id}/estado`,
  },

  // Certificados
  CERTIFICADOS: {
    BASE: '/certificados',
    BY_ID: (id: string) => `/certificados/${id}`,
    BY_INSCRIPCION: (inscripcionId: string) => `/certificados?inscripcion_curso_id=${inscripcionId}`,
    DESCARGAR: (id: string) => `/certificados/${id}/descargar`,
    VERIFICAR: (hash: string) => `/certificados/verificar/${hash}`,
  },

  // Foro
  FORO: {
    BASE: '/foro',
    BY_CURSO: (cursoId: string) => `/foro?curso_id=${cursoId}`,
    BY_LECCION: (leccionId: string) => `/foro?leccion_id=${leccionId}`,
    CREAR: () => '/foro',
    ACTUALIZAR: (id: string) => `/foro/${id}`,
    ELIMINAR: (id: string) => `/foro/${id}`,
  },

  // Reglas de Acreditación
  REGLAS_ACREDITACION: {
    BASE: '/reglas-acreditacion',
    BY_ID: (id: string) => `/reglas-acreditacion/${id}`,
    BY_CURSO: (cursoId: string) => `/reglas-acreditacion?curso_id=${cursoId}`,
  },
};
```

### 2.2 ✅ Extendido `api-client.ts` con métodos específicos - COMPLETADO

```typescript
// Agregar métodos al APIClient existente

async getModulos(filters?: { publicado?: boolean }) {
  return this.get(API_ENDPOINTS.MODULOS.BASE, filters);
}

async getModuloById(moduloId: string) {
  return this.get(API_ENDPOINTS.MODULOS.BY_ID(moduloId));
}

async getCursosByModulo(moduloId: string) {
  return this.get(API_ENDPOINTS.MODULOS.CURSOS(moduloId));
}

async inscribirEnCurso(cursoId: string) {
  return this.post(API_ENDPOINTS.CURSOS.INSCRIBIR(cursoId));
}

async iniciarQuiz(quizId: string) {
  return this.post(API_ENDPOINTS.QUIZZES.INICIAR(quizId));
}

async enviarQuiz(quizId: string, respuestas: Respuesta[]) {
  return this.post(API_ENDPOINTS.QUIZZES.ENVIAR(quizId), { respuestas });
}

async iniciarExamenFinal(examenId: string) {
  return this.post(API_ENDPOINTS.EXAMENES_FINALES.INICIAR(examenId));
}

async enviarExamenFinal(examenId: string, respuestas: Respuesta[]) {
  return this.post(API_ENDPOINTS.EXAMENES_FINALES.ENVIAR(examenId), { respuestas });
}

async getCertificadoByInscripcion(inscripcionId: string) {
  return this.get(API_ENDPOINTS.CERTIFICADOS.BY_INSCRIPCION(inscripcionId));
}

async descargarCertificado(certificadoId: string) {
  return this.get(API_ENDPOINTS.CERTIFICADOS.DESCARGAR(certificadoId));
}
```

---

## ✅ Fase 3: Hooks y Lógica de Negocio - COMPLETADO

### 3.1 ✅ Hooks de React Query

#### ✅ `src/entities/module/api/use-module.ts` - COMPLETADO

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import { API_ENDPOINTS } from '@/shared/api/endpoints';

export const useModulos = (filters?: { publicado?: boolean }) => {
  return useQuery({
    queryKey: ['modulos', filters],
    queryFn: () => apiClient.getModulos(filters),
  });
};

export const useModulo = (moduloId: string) => {
  return useQuery({
    queryKey: ['modulo', moduloId],
    queryFn: () => apiClient.getModuloById(moduloId),
    enabled: !!moduloId,
  });
};
```

#### ✅ `src/entities/course/api/use-course.ts` - COMPLETADO

```typescript
export const useInscribirEnCurso = () => {
  return useMutation({
    mutationFn: (cursoId: string) => apiClient.inscribirEnCurso(cursoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inscripciones'] });
    },
  });
};
```

#### ✅ `src/entities/quiz/api/use-quiz.ts` - COMPLETADO

```typescript
export const useIniciarQuiz = () => {
  return useMutation({
    mutationFn: (quizId: string) => apiClient.iniciarQuiz(quizId),
  });
};

export const useEnviarQuiz = () => {
  return useMutation({
    mutationFn: ({ quizId, respuestas }: { quizId: string; respuestas: Respuesta[] }) =>
      apiClient.enviarQuiz(quizId, respuestas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intentos'] });
      queryClient.invalidateQueries({ queryKey: ['inscripciones'] });
    },
  });
};
```

### 3.2 🔄 Lógica de Validación de Reglas de Negocio

#### ⏳ `src/shared/lib/quiz-rules.ts` - PENDIENTE

```typescript
import type { ReglaAcreditacion, Intento } from '@/entities';

export const validarMaxIntentos = (
  intentosActuales: Intento[],
  regla: ReglaAcreditacion
): { permitido: boolean; intentosRestantes: number } => {
  const maxIntentos = regla.max_intentos_quiz;
  const intentosCount = intentosActuales.length;
  
  return {
    permitido: intentosCount < maxIntentos,
    intentosRestantes: Math.max(0, maxIntentos - intentosCount),
  };
};

export const validarScoreMinimo = (
  puntaje: number,
  regla: ReglaAcreditacion
): boolean => {
  return puntaje >= regla.min_score_aprobatorio;
};

export const validarPrerequisitosExamenFinal = async (
  cursoId: string,
  inscripcionId: string
): Promise<{ permitido: boolean; quizzesPendientes: number }> => {
  // Llamar a API para verificar si todos los quizzes están aprobados
  const resultado = await apiClient.get(
    API_ENDPOINTS.CURSOS.PROGRESO(cursoId),
    { inscripcion_id: inscripcionId }
  );
  
  return {
    permitido: resultado.quizzes_pendientes === 0,
    quizzesPendientes: resultado.quizzes_pendientes,
  };
};
```

#### ✅ Resumen de Hooks Implementados

Todos los hooks de React Query han sido implementados:

**Sprint 1 (Core):**
- ✅ `use-module.ts` - Módulos
- ✅ `use-course.ts` - Cursos (Materias)
- ✅ `use-enrollment.ts` - Inscripciones

**Sprint 2 (Contenido):**
- ✅ `use-lesson.ts` - Lecciones

**Sprint 3 (Evaluaciones):**
- ✅ `use-quiz.ts` - Quizzes
- ✅ `use-exam.ts` - Exámenes Finales
- ✅ `use-attempt.ts` - Intentos
- ✅ `use-question.ts` - Preguntas

**Sprint 4 (Resto):**
- ✅ `use-certificate.ts` - Certificados
- ✅ `use-progress.ts` - Progreso
- ✅ `use-user.ts` - Usuarios
- ✅ `use-forum.ts` - Foro
- ✅ `use-notification.ts` - Notificaciones
- ✅ `use-accreditation.ts` - Reglas de Acreditación
- ✅ `use-reports.ts` - Reportes (en `shared/api/`)
- ✅ `use-system.ts` - Sistema (en `shared/api/`)

**Total: 16 archivos de hooks implementados**

---

## 🔄 Fase 4: Componentes de UI

### 4.1 Páginas de Módulos y Cursos

#### `src/pages/student/ModulosPage.tsx` - Crear

- Lista de módulos públicos
- Filtro por fecha (activos, próximos, finalizados)
- Cards con información de módulo y cursos asociados

#### `src/pages/student/ModuloDetailPage.tsx` - Crear

- Información del módulo
- Lista de cursos (materias) del módulo
- Progreso del módulo (vista `inscripcion_modulo_calculada`)
- Botón de inscripción a cursos

#### `src/pages/student/CursoDetailPage.tsx` - Crear

- Información del curso
- Lista de lecciones (ordenadas por `orden`)
- Contenido de lecciones (TEXTO, PDF, VIDEO, LINK)
- Quizzes de cada lección
- Examen final (si está disponible)
- Estado de inscripción
- Progreso del curso

### 4.2 Páginas de Lecciones y Contenido

#### `src/pages/student/LessonPage.tsx` - Crear

- Contenido de la lección (renderizado según tipo)
- Navegación entre lecciones
- Quiz asociado (si existe)
- Foro de comentarios de la lección

#### `src/widgets/lesson/LessonContentView.tsx` - Crear

- Renderizado condicional según `TipoContenido`:
  - TEXTO: Markdown o HTML
  - PDF: Visor de PDF (iframe o embed)
  - VIDEO: Player de video
  - LINK: Redirección o preview

### 4.3 Páginas de Evaluación

#### `src/pages/student/QuizPage.tsx` - Crear

- Mostrar preguntas (ordenadas o aleatorias según `quiz.aleatorio`)
- Renderizado según tipo de pregunta:
  - OPCION_MULTIPLE: Checkboxes o Radios (según `om_seleccion_multiple`)
  - VERDADERO_FALSO: Toggle o Radio buttons
  - ABIERTA: Textarea
- Validación de respuestas según `PreguntaConfig`
- Contador de intentos restantes
- Botón de envío

#### `src/pages/student/ExamenFinalPage.tsx` - Crear

- Similar a QuizPage pero para examen final
- Validación de prerrequisitos (todos los quizzes aprobados)
- Timer (si hay límite de tiempo)
- Mensaje de bloqueo si no se cumplen prerrequisitos

#### `src/pages/student/QuizResultPage.tsx` - Crear

- Resultado del intento (puntaje, resultado)
- Desglose de respuestas correctas/incorrectas
- Puntos otorgados por pregunta
- Mensaje según resultado (aprobado/no aprobado)
- Información de intentos restantes
- Botón para nuevo intento (si `permitir_nuevo_intento = true`)

### 4.4 Páginas de Progreso e Inscripciones

#### `src/pages/student/MyCoursesPage.tsx` - Crear

- Lista de inscripciones del usuario
- Filtro por estado (ACTIVA, PAUSADA, CONCLUIDA, REPROBADA)
- Cards con progreso de cada curso
- Estado de acreditación
- Acceso a certificado (si está acreditado)

#### `src/pages/student/ProgressPage.tsx` - Crear

- Vista general de progreso
- Gráficos de progreso por módulo/curso
- Estadísticas (cursos completados, certificados, promedio)
- Comparación con otros estudiantes (si aplica)

### 4.5 Páginas de Certificados

#### `src/pages/student/CertificatesPage.tsx` - Crear

- Lista de certificados obtenidos
- Información de cada certificado (folio, fecha de emisión)
- Botón de descarga (usar `s3_key` o presigned URL)
- Verificación de certificado (usar `hash_verificacion`)

#### `src/pages/public/VerifyCertificatePage.tsx` - Crear

- Página pública para verificar certificados
- Input de `hash_verificacion`
- Mostrar información del certificado si es válido

### 4.6 Páginas de Foro

#### `src/pages/student/ForumPage.tsx` - Crear

- Lista de comentarios por lección/curso
- Formulario para crear comentario
- Edición/eliminación de comentarios propios
- Filtros y ordenamiento

---

## 🔄 Fase 5: Integración y Validación de Reglas de Negocio

### 5.1 Validación de Intentos

- Implementar validación de máximo de intentos antes de iniciar quiz/examen
- Mostrar mensaje si se alcanzó el límite
- Validar `permitir_nuevo_intento` antes de permitir nuevo intento

### 5.2 Validación de Prerrequisitos

- Validar que todos los quizzes estén aprobados antes de permitir examen final
- Mostrar lista de quizzes pendientes si no se cumplen prerrequisitos
- Bloquear acceso al examen final hasta cumplir prerrequisitos

### 5.3 Validación de Acreditación

- Validar score mínimo (80% por defecto) antes de marcar como aprobado
- Mostrar mensaje si no se alcanza el score mínimo
- Actualizar estado de inscripción según resultado
- Generar certificado automáticamente cuando se acredita

### 5.4 Manejo de Estados de Inscripción

- Controlar transiciones de estado (ACTIVA → PAUSADA → CONCLUIDA/REPROBADA)
- Validar que inscripciones CONCLUIDAS no cambien de estado
- Mostrar UI según estado de inscripción

### 5.5 Validación de Tipos de Pregunta

- Validar que las respuestas coincidan con el tipo de pregunta
- Mostrar UI apropiada según tipo (checkbox, radio, textarea)
- Validar selecciones múltiples según `om_min_selecciones` y `om_max_selecciones`

---

## 🔄 Fase 6: Optimizaciones y Mejoras

### 6.1 Optimización de Carga

- Lazy loading de rutas
- Code splitting por entidad
- Skeleton loaders para mejor UX
- Paginación de listas grandes

### 6.2 Manejo de Errores

- Error boundaries por sección
- Mensajes de error amigables
- Reintentos automáticos para requests fallidos
- Logging de errores para debugging

### 6.3 Accesibilidad

- ARIA labels en componentes interactivos
- Navegación por teclado
- Contraste de colores
- Screen reader support

### 6.4 Testing

- Unit tests para hooks y utilidades
- Integration tests para flujos críticos
- E2E tests para flujos completos (login → curso → quiz → certificado)

---

## 🔄 Fase 7: Producción y Despliegue

### 7.1 Variables de Entorno

```env
VITE_API_URL=https://api.produccion.com/api
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxx
VITE_USE_MOCKS=false
```

### 7.2 Build y Despliegue

#### Build de Producción
```bash
npm run build  # Vite genera archivos estáticos optimizados
```

#### Despliegue S3 + CloudFront
```bash
# Upload a S3
aws s3 sync dist/ s3://ebs-frontend-bucket --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

#### Optimizaciones
- ✅ Bundle size optimizado con Vite
- ✅ Code splitting automático
- ✅ CDN global con CloudFront
- ✅ Compresión automática
- ✅ Cache eficiente

### 7.3 Monitoreo

- Integración con servicio de monitoreo (Sentry, etc.)
- Tracking de errores
- Analytics de uso
- Performance monitoring

---

## Checklist de Implementación

### ✅ Fase 1: Tipos
- [x] Tipos de Módulo
- [x] Tipos de Curso/Materia
- [x] Tipos de Lección y Contenido
- [x] Tipos de Quiz y Examen Final
- [x] Tipos de Pregunta, Config y Opción
- [x] Tipos de Inscripción
- [x] Tipos de Intento y Respuesta
- [x] Tipos de Certificado
- [x] Tipos de Usuario y Rol
- [x] Tipos de Foro
- [x] Tipos de Notificaciones
- [x] Tipos de Reglas de Acreditación
- [x] Schemas Zod para validación

### ✅ Fase 2: API
- [x] Endpoints actualizados
- [x] Métodos en api-client
- [x] Manejo de errores
- [x] Type safety en requests/responses (parcial, falta tipar responses del backend)

### ✅ Fase 3: Hooks
- [x] Hooks de React Query para cada entidad
- [x] Mutations para acciones (inscribir, enviar quiz, etc.)
- [ ] Validación de reglas de negocio (pendiente: quiz-rules.ts)
- [x] Cache management

### 🔄 Fase 4: UI
- [ ] Páginas de módulos
- [ ] Páginas de cursos
- [ ] Páginas de lecciones
- [ ] Páginas de quizzes
- [ ] Páginas de exámenes finales
- [ ] Páginas de progreso
- [ ] Páginas de certificados
- [ ] Páginas de foro
- [ ] Componentes reutilizables

### 🔄 Fase 5: Validación
- [ ] Validación de intentos máximos
- [ ] Validación de prerrequisitos
- [ ] Validación de acreditación
- [ ] Manejo de estados de inscripción
- [ ] Validación de tipos de pregunta

### 🔄 Fase 6: Optimización
- [ ] Lazy loading
- [ ] Skeleton loaders
- [ ] Error boundaries
- [ ] Accesibilidad
- [ ] Tests

### 🔄 Fase 7: Producción
- [ ] Variables de entorno
- [ ] Build optimizado
- [ ] Monitoreo configurado
- [ ] Documentación actualizada

---

## ✅ Fase 0: Configuración y Definición del Contrato (API-First)

### Instalación de Dependencias

```bash
cd frontend
npm install react-router-dom zod @tanstack/react-query sonner amazon-cognito-identity-js
npm install -D tailwindcss postcss autoprefixer msw @types/node
```

### Configuración de Tailwind CSS

#### Inicializar Tailwind

```bash
npx tailwindcss init -p
```

#### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

#### src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Configuración de MSW (Mock Service Worker)

#### public/mockServiceWorker.js

Ejecutar: `npx msw init public/ --save`

#### src/mocks/handlers.ts

```typescript
import { http, HttpResponse } from 'msw'

const API_URL = 'http://localhost:8000/api'

export const handlers = [
  http.get(`${API_URL}/courses`, () => {
    return HttpResponse.json([
      {
        id: 1,
        name: "Introducción a la Biblia",
        description: "Curso fundamental sobre las Escrituras",
        created_at: "2024-01-01T00:00:00Z"
      }
    ])
  }),

  http.get(`${API_URL}/courses/:courseId/study-guides`, () => {
    return HttpResponse.json([
      {
        course_id: 1,
        file_name: "guia-estudio-1.pdf",
        presigned_url: "https://example.com/presigned-url",
        expires_in: 3600
      }
    ])
  }),

  http.get(`${API_URL}/exams/course/:courseId`, () => {
    return HttpResponse.json({
      id: 1,
      course_id: 1,
      questions: [
        {
          id: 1,
          question_text: "¿Cuál es el primer libro de la Biblia?",
          options: ["Génesis", "Éxodo", "Levítico", "Números"],
          correct_answer: 0
        }
      ],
      time_limit_minutes: 60
    })
  }),

  http.post(`${API_URL}/exams/submit`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      exam_id: body.exam_id,
      score: 85.0,
      percentage: 85.0,
      passed: true,
      attempts_remaining: 2,
      certificate_url: "https://example.com/certificate.pdf"
    })
  }),

  http.get(`${API_URL}/progress/user/:userId`, () => {
    return HttpResponse.json([
      {
        user_id: 1,
        course_id: 1,
        progress_percentage: 75.0,
        completed_modules: 3,
        total_modules: 4,
        last_accessed: "2024-01-15T10:00:00Z"
      }
    ])
  })
]
```

#### src/mocks/browser.ts

```typescript
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
```

#### src/main.tsx

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

async function enableMocking() {
  if (import.meta.env.MODE !== 'development') {
    return
  }

  const { worker } = await import('./mocks/browser')
  return worker.start({
    onUnhandledRequest: 'bypass',
  })
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
```

### Mock de Cognito

#### src/mocks/cognito.ts

```typescript
export const mockCognito = {
  signIn: async (email: string, password: string) => {
    return {
      IdToken: {
        getJwtToken: () => "mock-jwt-token",
      },
      AccessToken: {
        getJwtToken: () => "mock-access-token",
      },
      RefreshToken: {
        getToken: () => "mock-refresh-token",
      },
    }
  },
  
  signUp: async (email: string, password: string) => {
    return {
      userSub: "mock-user-id",
    }
  },
  
  signOut: async () => {
    return Promise.resolve()
  }
}
```

### Configuración del API Client

#### ✅ IMPLEMENTADO: src/shared/api/api-client.ts

El API Client ha sido refactorizado para usar Fetch API nativo con integración directa de Cognito.

**Características implementadas:**
- ✅ Usa Fetch API nativo (sin Amplify)
- ✅ Integración con Cognito para tokens de autenticación
- ✅ Métodos HTTP: GET, POST, PUT, DELETE
- ✅ Manejo de query parameters
- ✅ Manejo de errores mejorado
- ✅ Headers automáticos con tokens

**Código actual:**
```typescript
import { getAccessToken } from '../aws/cognito';
import { API_ENDPOINTS } from './endpoints';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class APIClient {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await getAccessToken();
    } catch (error) {
      console.warn('No se pudo obtener el token de autenticación:', error);
      return null;
    }
  }

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
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      }
      throw new Error(errorMessage);
    }

    return response;
  }

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

  async post(endpoint: string, data?: any) {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });

    return response.json();
  }

  async put(endpoint: string, data?: any) {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });

    return response.json();
  }

  async delete(endpoint: string) {
    const response = await this.request(endpoint, {
      method: 'DELETE',
    });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return null;
  }

  // Métodos específicos de dominio
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

  async submitExam(examId: string | number, examData: any) {
    return this.post(API_ENDPOINTS.EXAMS.SUBMIT(examId), examData);
  }
}

export const apiClient = new APIClient();
export default apiClient;
```

#### ✅ IMPLEMENTADO: src/shared/aws/cognito.ts

Utilidades de autenticación con Cognito Identity JS directamente (sin Amplify).

**Funciones implementadas:**
- ✅ `signIn()` - Autenticación de usuarios
- ✅ `getAccessToken()` - Obtener token de acceso para API
- ✅ `getIdToken()` - Obtener ID token
- ✅ `signOut()` - Cerrar sesión
- ✅ `getCurrentUser()` - Obtener usuario actual
- ✅ `getUserPool()` - Obtener instancia del UserPool

#### src/shared/api/endpoints.ts

```typescript
export const endpoints = {
  courses: {
    list: () => '/courses',
    get: (id: number) => `/courses/${id}`,
    studyGuides: (courseId: number) => `/courses/${courseId}/study-guides`,
  },
  exams: {
    get: (courseId: number) => `/exams/course/${courseId}`,
    submit: () => '/exams/submit',
    retake: (examId: number) => `/exams/${examId}/retake`,
  },
  progress: {
    user: (userId: number) => `/progress/user/${userId}`,
    comparison: (userId: number, courseId: number) => 
      `/progress/user/${userId}/course/${courseId}/comparison`,
  },
  certificates: {
    get: (userId: number, courseId: number) => 
      `/certificates/user/${userId}/course/${courseId}`,
    download: (userId: number, courseId: number) => 
      `/certificates/user/${userId}/course/${courseId}/download`,
  },
}
```

### Tarea Crítica: Sincronización con Backend

1. **Recibir URL de documentación Swagger** del desarrollador de Backend (`http://localhost:8000/docs`)
2. **Revisar esquemas de la API** en la documentación interactiva
3. **Actualizar handlers de MSW** para que coincidan con los contratos reales
4. **Actualizar tipos TypeScript** en `src/types/api.ts` basados en los esquemas Pydantic

#### src/types/api.ts

```typescript
export interface Course {
  id: number
  name: string
  description: string
  created_at: string
}

export interface StudyGuide {
  course_id: number
  file_name: string
  presigned_url: string
  expires_in: number
}

export interface Question {
  id: number
  question_text: string
  options: string[]
  correct_answer: number
}

export interface Exam {
  id: number
  course_id: number
  questions: Question[]
  time_limit_minutes?: number
}

export interface ExamSubmission {
  exam_id: number
  answers: Record<number, number>
}

export interface ExamResult {
  exam_id: number
  score: number
  percentage: number
  passed: boolean
  attempts_remaining: number
  certificate_url?: string
}

export interface Progress {
  user_id: number
  course_id: number
  progress_percentage: number
  completed_modules: number
  total_modules: number
  last_accessed?: string
}
```

## Fase 1: Desarrollo Paralelo (UI con Mocks)

### Autenticación (RF-12)

#### src/features/auth/components/LoginForm.tsx

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useAuth } from '@/shared/hooks/use-auth'
import { toast } from 'sonner'

export const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signIn(email, password)
      toast.success('Inicio de sesión exitoso')
      navigate('/dashboard')
    } catch (error) {
      toast.error('Error al iniciar sesión')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full"
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Iniciar Sesión
      </Button>
    </form>
  )
}
```

#### src/features/auth/components/ProtectedRoute.tsx

```typescript
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/shared/hooks/use-auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
```

#### src/app/providers/AuthProvider.tsx

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { mockCognito } from '@/mocks/cognito'

interface AuthContextType {
  user: { email: string; role: string } | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ email: string; role: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    const result = await mockCognito.signIn(email, password)
    const userData = { email, role: 'student' }
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', result.AccessToken.getJwtToken())
  }

  const signOut = async () => {
    await mockCognito.signOut()
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

### Dashboard Estudiante (RF-02, RF-06)

#### src/pages/student/Courses.tsx

```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/api-client'
import { endpoints } from '@/shared/api/endpoints'
import { CourseList } from '@/widgets/course/CourseList'
import { Progress } from '@/shared/ui/progress'

export const Courses = () => {
  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      return await apiClient.get(endpoints.courses.list())
    },
  })

  if (isLoading) {
    return <div className="p-6">Cargando cursos...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Cursos Disponibles</h1>
      <CourseList courses={courses || []} />
    </div>
  )
}
```

#### src/widgets/course/CourseCard.tsx

```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Progress } from '@/shared/ui/progress'
import { Course } from '@/types/api'

interface CourseCardProps {
  course: Course
  progress?: number
}

export const CourseCard = ({ course, progress }: CourseCardProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">{course.name}</CardTitle>
        <CardDescription>{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}
        <Button className="w-full">Ver Curso</Button>
      </CardContent>
    </Card>
  )
}
```

#### src/pages/student/StudentDashboard.tsx

```typescript
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/shared/hooks/use-auth'
import { apiClient } from '@/shared/api/api-client'
import { endpoints } from '@/shared/api/endpoints'
import { Progress } from '@/shared/ui/progress'
import { StatCard } from '@/features/dashboard/components/StatCard'

export const StudentDashboard = () => {
  const { user } = useAuth()
  const userId = 1

  const { data: progressData } = useQuery({
    queryKey: ['progress', userId],
    queryFn: async () => {
      return await apiClient.get(endpoints.progress.user(userId))
    },
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Cursos Completados" value="5" />
        <StatCard title="En Progreso" value="3" />
        <StatCard title="Promedio" value="85%" />
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Progreso de Cursos</h2>
        {progressData?.map((progress: any) => (
          <div key={progress.course_id} className="space-y-2">
            <div className="flex justify-between">
              <span>Curso {progress.course_id}</span>
              <span>{progress.progress_percentage}%</span>
            </div>
            <Progress value={progress.progress_percentage} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Evaluación (RF-01, RF-03)

#### src/pages/student/AssignmentsPage.tsx

```typescript
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/api-client'
import { endpoints } from '@/shared/api/endpoints'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { toast } from 'sonner'
import { useParams } from 'react-router-dom'

export const AssignmentsPage = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const [answers, setAnswers] = useState<Record<number, number>>({})

  const { data: exam } = useQuery({
    queryKey: ['exam', courseId],
    queryFn: async () => {
      return await apiClient.get(endpoints.exams.get(Number(courseId)))
    },
  })

  const submitMutation = useMutation({
    mutationFn: async (submission: { exam_id: number; answers: Record<number, number> }) => {
      return await apiClient.post(endpoints.exams.submit(), submission)
    },
    onSuccess: (data) => {
      if (data.passed) {
        toast.success(`¡Aprobado! Score: ${data.score}%`)
        if (data.certificate_url) {
          toast.info('Certificado generado')
        }
      } else {
        toast.error(`No aprobado. Score: ${data.score}%`)
        toast.info(`Intentos restantes: ${data.attempts_remaining}`)
      }
    },
  })

  const handleSubmit = () => {
    if (!exam) return
    submitMutation.mutate({
      exam_id: exam.id,
      answers,
    })
  }

  if (!exam) {
    return <div className="p-6">Cargando examen...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Examen</h1>
      <div className="space-y-4">
        {exam.questions.map((question: any) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle>{question.question_text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {question.options.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`q${question.id}-${index}`}
                    checked={answers[question.id] === index}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setAnswers({ ...answers, [question.id]: index })
                      }
                    }}
                  />
                  <label htmlFor={`q${question.id}-${index}`} className="cursor-pointer">
                    {option}
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <Button onClick={handleSubmit} className="w-full" disabled={submitMutation.isPending}>
        Enviar Examen
      </Button>
    </div>
  )
}
```

### Admin (RF-12)

#### src/pages/admin/AdminDashboard.tsx

```typescript
import { StatCard } from '@/features/dashboard/components/StatCard'

export const AdminDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Panel de Administración</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Usuarios" value="100" />
        <StatCard title="Cursos Activos" value="15" />
        <StatCard title="Exámenes Completados" value="250" />
        <StatCard title="Certificados Emitidos" value="180" />
      </div>
    </div>
  )
}
```

## Fase 2: Integración y Sincronización

### ✅ Configuración Real de Cognito - IMPLEMENTADO

#### src/shared/aws/cognito.ts

**Estado:** ✅ Implementado y funcionando

El archivo `cognito.ts` ha sido creado con todas las funciones necesarias para autenticación directa con Cognito (sin Amplify).

**Implementación actual:**
- ✅ Configuración de UserPool con variables de entorno
- ✅ Función `signIn()` para autenticación
- ✅ Función `getAccessToken()` para obtener tokens
- ✅ Función `getIdToken()` para obtener ID tokens
- ✅ Función `signOut()` para cerrar sesión
- ✅ Manejo de errores robusto
- ✅ Validación de sesiones

**Variables de entorno requeridas:**
- `VITE_COGNITO_USER_POOL_ID` - ID del User Pool de Cognito
- `VITE_COGNITO_CLIENT_ID` - ID del Client de Cognito
- `VITE_API_URL` - URL base de la API (usado en api-client.ts)

### Desactivar MSW

#### ✅ IMPLEMENTADO: src/main.tsx

**Estado:** ✅ Actualizado - Eliminada configuración de Amplify

El archivo `main.tsx` ha sido actualizado para eliminar la importación de la configuración de Amplify. La aplicación ahora usa Cognito directamente sin configuración global.

**Cambios realizados:**
- ✅ Eliminado: `import './shared/config/aws'` (configuración de Amplify)
- ✅ Sin configuración global necesaria
- ✅ Cognito se inicializa cuando se usa (lazy initialization)

**Código actual:**
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

**Nota:** MSW puede seguir usándose en desarrollo configurándolo según sea necesario.

### Variables de Entorno

#### .env

```env
VITE_API_URL=http://localhost:8000/api
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxx
VITE_USE_MOCKS=false
```

### Tareas de Integración

1. **Recibir URL del API de staging** del desarrollador de Backend
2. **Actualizar `VITE_API_URL`** en `.env`
3. **Configurar Cognito** con las credenciales reales
4. **Desactivar MSW** estableciendo `VITE_USE_MOCKS=false`
5. **Probar flujos completos**: Login → Dashboard → Cursos → Exámenes → Certificados
6. **Validar reglas de negocio**: 80% para aprobar, 3 intentos máximo, generación de certificados

## Fase 3: Pruebas y Producción

### UI/UX y Responsividad

#### Usar hook use-mobile.tsx

```typescript
import { useMobile } from '@/shared/hooks/use-mobile'

export const Courses = () => {
  const isMobile = useMobile()
  
  return (
    <div className={isMobile ? "p-4" : "p-6"}>
      {/* Contenido adaptativo */}
    </div>
  )
}
```

### Build de Producción

#### Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Build y Despliegue

```bash
npm run build
docker build -t ebs-frontend:latest .
```

### Reglas de Negocio Implementadas

- **RF-01**: Cuestionarios en formato de formulario (Checkbox/Radio)
- **RF-02**: Lista de cursos con nombre y descripción
- **RF-03**: Validación de 80% mínimo y 3 intentos (mostrado en UI)
- **RF-04**: Descarga de certificados generados
- **RF-05**: Visualización de guías de estudio (URLs prefirmadas)
- **RF-06**: Barra de progreso individual (Progress component)
- **RF-07**: Comparación de progreso (endpoint implementado)
- **RF-12**: Rutas protegidas por roles (ProtectedRoute)

### Checklist de Sincronización con Backend

- [ ] Configurar CORS en backend para dominio del frontend
- [ ] Actualizar variables de entorno (`VITE_API_URL`, `VITE_APP_URL`)
- [x] Remover `amazon-cognito-identity-js` del frontend ✅
- [x] Cambiar `AuthProvider` para usar redirecciones a `/auth/login` ✅
- [x] Modificar `api-client.ts` para no enviar tokens en headers ✅
- [ ] Configurar despliegue S3 + CloudFront
- [ ] Probar integración completa: Login → API calls → Logout

### Checklist Pre-Producción

- [ ] Todas las rutas protegidas con `ProtectedRoute`
- [ ] Validación de formularios con Zod
- [ ] Manejo de errores con toast notifications
- [ ] Responsividad en móvil (usar `use-mobile`)
- [ ] Variables de entorno configuradas
- [ ] MSW desactivado en producción
- [ ] Build de producción sin errores
- [ ] CORS configurado en backend
- [ ] HTTPS habilitado en producción
- [ ] Despliegue S3 + CloudFront configurado
- [ ] Pipeline CI/CD para build automático

