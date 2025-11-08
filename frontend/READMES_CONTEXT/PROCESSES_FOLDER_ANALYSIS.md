# 📁 Análisis de la Carpeta `processes/` - Feature-Sliced Design

## 🎯 Resumen Ejecutivo

La carpeta `processes/` está **VACÍA**, pero según Feature-Sliced Design debería contener **procesos de negocio complejos** que involucran múltiples features. En tu aplicación hay varios procesos que deberían estar aquí.

---

## 📋 ¿Qué es `processes/` según FSD?

La carpeta `processes/` es una **capa especial** de FSD que contiene:

### Características:
- ✅ **Procesos de negocio complejos** que cruzan múltiples features
- ✅ **Orquestación** de múltiples features/entities
- ✅ **Lógica de negocio** que no pertenece a un solo feature
- ✅ **Workflows** que involucran varios pasos y features

### Diferencia con `features/`:
- `features/` → Funcionalidad específica e independiente (auth, courses)
- `processes/` → Flujos complejos que usan múltiples features (enrollment, completion)

---

## 🔍 Procesos Identificados en tu Aplicación

Basándome en tu código, estos son los procesos de negocio complejos que deberían estar en `processes/`:

### 1. **Course Enrollment Process** (Inscripción en Cursos)
**Involucra**: `users`, `courses`, `progress`

**Pasos del proceso**:
1. Validar que el estudiante puede inscribirse (prerequisitos, cupos)
2. Crear registro de progreso inicial
3. Actualizar estadísticas del curso
4. Enviar notificación al estudiante
5. Actualizar dashboard del estudiante

**Archivos sugeridos**:
```
src/processes/
└── course-enrollment/
    ├── model/
    │   ├── types.ts          # Tipos del proceso
    │   └── validation.ts     # Validaciones del proceso
    ├── api/
    │   └── enrollment-api.ts # API calls para enrollment
    ├── ui/
    │   ├── EnrollmentForm.tsx
    │   └── EnrollmentConfirmation.tsx
    └── index.ts
```

### 2. **Course Completion Process** (Completar Curso)
**Involucra**: `courses`, `assignments`, `exams`, `grades`, `progress`, `certificates`

**Pasos del proceso**:
1. Verificar que todas las lecciones están completadas
2. Verificar que todas las tareas están entregadas y calificadas
3. Verificar que todos los exámenes están aprobados
4. Calcular calificación final
5. Determinar si pasó el curso (minGradeToPass)
6. Si pasó y tiene certificado: generar certificado
7. Actualizar progreso del módulo (si pertenece a uno)
8. Enviar notificación al estudiante
9. Actualizar estadísticas del curso

**Archivos sugeridos**:
```
src/processes/
└── course-completion/
    ├── model/
    │   ├── types.ts
    │   └── completion-rules.ts  # Reglas de completitud
    ├── api/
    │   └── completion-api.ts
    ├── ui/
    │   ├── CompletionChecklist.tsx
    │   └── CompletionCertificate.tsx
    └── index.ts
```

### 3. **Certificate Generation Process** (Generación de Certificados)
**Involucra**: `certificates`, `courses`, `modules`, `grades`, `progress`, `users`

**Pasos del proceso**:
1. Validar que el estudiante completó el curso/módulo
2. Validar que cumplió con la calificación mínima
3. Generar número único de certificado
4. Seleccionar plantilla de certificado
5. Generar PDF del certificado (backend)
6. Subir PDF a S3
7. Crear registro de certificado en BD
8. Enviar notificación al estudiante
9. Actualizar perfil del estudiante

**Archivos sugeridos**:
```
src/processes/
└── certificate-generation/
    ├── model/
    │   ├── types.ts
    │   └── certificate-rules.ts
    ├── api/
    │   └── certificate-api.ts
    ├── ui/
    │   ├── CertificatePreview.tsx
    │   └── CertificateDownload.tsx
    └── index.ts
```

### 4. **Module Completion Process** (Completar Módulo)
**Involucra**: `modules`, `courses`, `progress`, `certificates`

**Pasos del proceso**:
1. Verificar que todos los cursos del módulo están completados
2. Calcular calificación promedio del módulo
3. Si cumple requisitos: generar certificado de módulo
4. Actualizar progreso general del estudiante
5. Enviar notificación

**Archivos sugeridos**:
```
src/processes/
└── module-completion/
    ├── model/
    │   ├── types.ts
    │   └── module-rules.ts
    ├── api/
    │   └── module-api.ts
    └── index.ts
```

### 5. **Grade Calculation Process** (Cálculo de Calificaciones)
**Involucra**: `assignments`, `exams`, `grades`, `progress`

**Pasos del proceso**:
1. Recolectar todas las calificaciones (tareas, exámenes)
2. Aplicar pesos según configuración del curso
3. Calcular calificación final
4. Determinar si pasó o no
5. Actualizar progreso del curso
6. Si pasó: trigger completion process

**Archivos sugeridos**:
```
src/processes/
└── grade-calculation/
    ├── model/
    │   ├── types.ts
    │   └── calculation-rules.ts
    ├── lib/
    │   └── grade-calculator.ts
    └── index.ts
```

---

## 📂 Estructura Recomendada para `processes/`

```
src/processes/
├── course-enrollment/          # Proceso de inscripción
│   ├── model/
│   │   ├── types.ts
│   │   └── validation.ts
│   ├── api/
│   │   └── enrollment-api.ts
│   ├── ui/
│   │   ├── EnrollmentForm.tsx
│   │   └── EnrollmentConfirmation.tsx
│   └── index.ts
│
├── course-completion/          # Proceso de completar curso
│   ├── model/
│   │   ├── types.ts
│   │   └── completion-rules.ts
│   ├── api/
│   │   └── completion-api.ts
│   ├── ui/
│   │   ├── CompletionChecklist.tsx
│   │   └── CompletionCertificate.tsx
│   └── index.ts
│
├── certificate-generation/     # Proceso de generar certificados
│   ├── model/
│   │   ├── types.ts
│   │   └── certificate-rules.ts
│   ├── api/
│   │   └── certificate-api.ts
│   ├── ui/
│   │   ├── CertificatePreview.tsx
│   │   └── CertificateDownload.tsx
│   └── index.ts
│
├── module-completion/          # Proceso de completar módulo
│   ├── model/
│   │   ├── types.ts
│   │   └── module-rules.ts
│   ├── api/
│   │   └── module-api.ts
│   └── index.ts
│
└── grade-calculation/          # Proceso de calcular calificaciones
    ├── model/
    │   ├── types.ts
    │   └── calculation-rules.ts
    ├── lib/
    │   └── grade-calculator.ts
    └── index.ts
```

---

## ✅ ¿Por qué estos procesos NO están en `features/`?

### ❌ Si estuvieran en `features/`:
- `features/courses/` → Solo manejaría CRUD de cursos
- `features/grades/` → Solo manejaría calificaciones individuales
- `features/certificates/` → Solo manejaría certificados

### ✅ Al estar en `processes/`:
- `processes/course-completion/` → **Orquesta** courses + grades + progress + certificates
- Permite reutilizar lógica de múltiples features
- Separación clara de responsabilidades
- Más fácil de testear y mantener

---

## 🎯 Recomendaciones

### Opción 1: Crear procesos gradualmente (Recomendado) ✅

**Prioridad Alta**:
1. `course-enrollment/` - Proceso más usado
2. `course-completion/` - Proceso crítico para certificados

**Prioridad Media**:
3. `certificate-generation/` - Depende de completion
4. `grade-calculation/` - Base para completion

**Prioridad Baja**:
5. `module-completion/` - Similar a course-completion

### Opción 2: Dejar vacío por ahora ⚠️

Si los procesos aún están implementados directamente en `features/` o `pages/`, puedes:
- Dejar `processes/` vacío temporalmente
- Refactorizar gradualmente cuando los procesos se complejicen
- No es crítico tenerlo desde el inicio

---

## 📝 Ejemplo de Implementación

### `processes/course-enrollment/model/types.ts`

```typescript
/**
 * Tipos para el proceso de inscripción en cursos
 */
export interface EnrollmentRequest {
  studentId: number;
  courseId: number;
}

export interface EnrollmentValidationResult {
  isValid: boolean;
  canEnroll: boolean;
  errors: string[];
  warnings: string[];
  prerequisites?: number[]; // Cursos que faltan completar
  capacityAvailable?: boolean;
}

export interface EnrollmentResult {
  success: boolean;
  enrollmentId?: number;
  progressId?: number;
  message: string;
  errors?: string[];
}
```

### `processes/course-enrollment/api/enrollment-api.ts`

```typescript
import { apiClient } from '@/shared/api/api-client';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import type { EnrollmentRequest, EnrollmentResult } from '../model/types';

/**
 * API para el proceso de inscripción en cursos
 */
export const enrollmentApi = {
  /**
   * Validar si un estudiante puede inscribirse en un curso
   */
  async validateEnrollment(request: EnrollmentRequest) {
    return apiClient.post(
      `${API_ENDPOINTS.COURSES.BY_ID(request.courseId)}/enroll/validate`,
      request
    );
  },

  /**
   * Inscribir estudiante en un curso
   */
  async enroll(request: EnrollmentRequest): Promise<EnrollmentResult> {
    return apiClient.post(
      API_ENDPOINTS.COURSES.ENROLL(request.courseId),
      { studentId: request.studentId }
    );
  },

  /**
   * Desinscribir estudiante de un curso
   */
  async unenroll(courseId: number, studentId: number) {
    return apiClient.delete(
      `${API_ENDPOINTS.COURSES.ENROLL(courseId)}?studentId=${studentId}`
    );
  },
};
```

---

## 🎯 Conclusión

### Estado Actual: ✅ Correcto (vacío por ahora)

La carpeta `processes/` está vacía, lo cual es **aceptable** si:
- Los procesos aún están en desarrollo
- Los procesos están implementados directamente en features/pages
- No hay procesos complejos que crucen múltiples features todavía

### Recomendación:

1. **Corto plazo**: Dejar vacío, no es crítico
2. **Mediano plazo**: Crear `course-enrollment/` cuando se implemente la inscripción real
3. **Largo plazo**: Refactorizar procesos complejos a `processes/` cuando crezcan

### Cuándo crear procesos:

✅ **Crear en `processes/` cuando**:
- Un flujo involucra 3+ features diferentes
- Hay lógica de negocio compleja que orquesta múltiples features
- El proceso tiene múltiples pasos y validaciones
- Necesitas reutilizar el proceso en diferentes partes

❌ **NO crear en `processes/` cuando**:
- Es una funcionalidad simple de un solo feature
- Solo involucra una entidad
- Es una operación CRUD básica

---

*Análisis realizado según Feature-Sliced Design v4*

