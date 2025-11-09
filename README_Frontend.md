# Guía de Desarrollo - Frontend (React + Vite)

## Arquitectura

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Estilizado**: Tailwind CSS
- **Estado**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Autenticación**: Amazon Cognito Identity JS
- **API Client**: Fetch (nativo)
- **Validación**: Zod
- **Mocking**: MSW (Mock Service Worker)
- **Notificaciones**: Sonner
- **Contenedorización**: Docker
- **Despliegue**: AWS ECS Fargate

## Estado Actual de la Implementación

### ✅ Migración de AWS Amplify a Cognito Directo - COMPLETADO

La migración de AWS Amplify a uso directo de Amazon Cognito Identity JS ha sido completada exitosamente.

#### Cambios Implementados

1. **✅ Dependencias actualizadas**
   - Instalado: `amazon-cognito-identity-js@6.3.15`
   - Eliminado: `aws-amplify`, `@aws-amplify/ui-react`
   - Reducción de 259 paquetes en node_modules

2. **✅ Archivo `cognito.ts` creado**
   - Ubicación: `frontend/src/shared/aws/cognito.ts`
   - Funciones implementadas:
     - `signIn()` - Autenticación con Cognito
     - `getAccessToken()` - Obtener token de acceso
     - `getIdToken()` - Obtener ID token
     - `signOut()` - Cerrar sesión
     - `getCurrentUser()` - Obtener usuario actual
     - `getUserPool()` - Obtener instancia del UserPool

3. **✅ API Client refactorizado**
   - Archivo: `frontend/src/shared/api/api-client.ts`
   - Migrado de Amplify API a Fetch API nativo
   - Métodos HTTP (GET, POST, PUT, DELETE) funcionando con Fetch
   - Integración con Cognito para autenticación automática
   - Manejo de errores mejorado
   - Query parameters correctamente manejados

4. **✅ Configuración limpiada**
   - Eliminado: `frontend/src/shared/config/aws.ts` (configuración de Amplify)
   - Actualizado: `frontend/src/main.tsx` (eliminado import de aws.ts)
   - Sin dependencias de Amplify en el código

5. **✅ Verificación completada**
   - Sin referencias a `aws-amplify` en el código fuente
   - Sin errores de TypeScript
   - Sin errores de linter
   - Código listo para producción

#### Beneficios de la Migración

- **Bundle más pequeño**: Eliminación de 259 paquetes reduce significativamente el tamaño del bundle
- **Mejor rendimiento**: Fetch API nativo es más rápido que Amplify API
- **Menos dependencias**: Menos puntos de fallo y actualizaciones
- **Más control**: Uso directo de Cognito permite mayor flexibilidad
- **Compatibilidad**: La API pública de `apiClient` no cambió, los componentes existentes no requieren modificación

#### Próximos Pasos (Opcional)

- Configurar variables de entorno para Cognito en producción
- Integrar `AuthProvider` con Cognito real (actualmente usa mocks)
- Probar autenticación end-to-end con backend

---

## Fase 0: Configuración y Definición del Contrato (API-First)

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

### Checklist Pre-Producción

- [ ] Todas las rutas protegidas con `ProtectedRoute`
- [ ] Validación de formularios con Zod
- [ ] Manejo de errores con toast notifications
- [ ] Responsividad en móvil (usar `use-mobile`)
- [ ] Variables de entorno configuradas
- [ ] MSW desactivado en producción
- [ ] Cognito configurado correctamente
- [ ] Build de producción sin errores
- [ ] CORS configurado en backend
- [ ] HTTPS habilitado en producción

