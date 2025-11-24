# Auditoría de `shared/` - Frontend

## Resumen Ejecutivo

- **Total archivos analizados**: 74
- **Archivos utilizados**: 45
- **Archivos no utilizados**: 18
- **Archivos duplicados**: 3
- **Directorios vacíos**: 2
- **Problemas de uso incorrecto**: 4

---

## 1. ARCHIVOS NO UTILIZADOS

### 1.1 Archivos completamente vacíos
- `shared/lib/cn.ts` - Vacío (función `cn` está en `utils.ts`)
- `shared/lib/validation.ts` - Vacío
- `shared/lib/date.ts` - Vacío
- `shared/lib/constants/routes.ts` - Vacío
- `shared/aws/clients.ts` - Vacío
- `shared/aws/config.ts` - Vacío
- `shared/ui/index.ts` - Vacío (debería exportar componentes)

### 1.2 Archivos con contenido pero no utilizados
- `shared/lib/jwt-utils.ts` - Funciones para decodificar JWT, no se importa en ningún lugar
- `shared/lib/schemas.ts` - Contiene `userFormSchema` pero no se usa (hay schemas en entities)
- `shared/api/use-reports.ts` - Hooks para reportes, no se importan
- `shared/api/use-system.ts` - Hooks para sistema (health check, versión), no se importan
- `shared/ui/DataTable.tsx` - Componente DataTable no usado (se usa el de `widgets/data-table`)
- `shared/ui/Spinner.tsx` - Componente Spinner no usado
- `shared/ui/toaster.tsx` - Wrapper de toast no usado (se usa `sonner` directamente)
- `shared/ui/sonner.tsx` - Wrapper de sonner no usado directamente

### 1.3 Directorios vacíos
- `shared/config/` - Vacío
- `shared/providers/` - Vacío

---

## 2. ARCHIVOS DUPLICADOS

### 2.1 Duplicación de `use-toast`
- `shared/ui/use-toast.ts` - Re-exporta desde hooks
- `shared/hooks/use-toast.ts` - Implementación real
- **Problema**: `shared/ui/use-toast.ts` es un wrapper innecesario
- **Recomendación**: Eliminar `shared/ui/use-toast.ts`

### 2.2 Duplicación de `AlertDialog`
- `shared/ui/AlertDialog.tsx` - Versión con estilos hardcodeados
- `shared/ui/alert-dialog.tsx` - Versión usando `buttonVariants` (más consistente)
- **Problema**: Dos implementaciones del mismo componente
- **Uso actual**: Solo se usa `alert-dialog.tsx` (minúsculas) en imports
- **Recomendación**: Eliminar `shared/ui/AlertDialog.tsx` (mayúsculas)

### 2.3 Duplicación funcional `Modal` vs `Dialog`
- `shared/ui/Modal.tsx` - Wrapper sobre Dialog
- `shared/ui/Dialog.tsx` - Componente base de Radix UI
- **Problema**: `Modal` es un wrapper innecesario, `Dialog` ya hace lo mismo
- **Uso actual**: Se usa `Dialog` directamente, `Modal` solo se importa pero no se usa
- **Recomendación**: Eliminar `shared/ui/Modal.tsx`

---

## 3. USO INCORRECTO

### 3.1 Sistema de Toast inconsistente
- **Problema**: Se usa `toast` de `'sonner'` directamente en lugar del sistema de `shared/hooks/use-toast`
- **Archivos afectados**: 
  - `pages/student/QuizPage.tsx`
  - `pages/student/ExamenFinalPage.tsx`
  - `pages/student/CertificatesPage.tsx`
  - `pages/student/LessonPage.tsx`
  - `pages/student/ModuloDetailPage.tsx`
  - `pages/student/ForumPage.tsx`
  - `pages/admin/*.tsx`
  - Y más...
- **Recomendación**: Estandarizar usando `shared/hooks/use-toast` o migrar completamente a `sonner` y eliminar el sistema de toast de shared

### 3.2 DataTable duplicado
- **Problema**: Existe `shared/ui/DataTable.tsx` pero se usa `widgets/data-table/DataTable.tsx`
- **Recomendación**: Eliminar `shared/ui/DataTable.tsx` o mover el de widgets a shared si es reutilizable

### 3.3 Importación inconsistente de Dialog
- **Problema**: Algunos archivos importan `Dialog` con mayúscula, otros con minúscula
  - `widgets/forms/*.tsx` usan `@/shared/ui/Dialog` (mayúscula)
  - `pages/admin/*.tsx` usan `@/shared/ui/dialog` (minúscula)
- **Recomendación**: Estandarizar a minúscula (`dialog.tsx`)

### 3.4 AlertDialog con importación incorrecta
- **Problema**: `shared/ui/AlertDialog.tsx` importa `cn` con ruta relativa incorrecta:
  ```typescript
  import { cn } from "../../lib/utils";  // ❌ Incorrecto
  ```
  Debería ser:
  ```typescript
  import { cn } from "@/shared/lib/utils";  // ✅ Correcto
  ```

---

## 4. ARCHIVOS UTILIZADOS CORRECTAMENTE

### 4.1 API y Endpoints
- ✅ `shared/api/api-client.ts` - Usado en todas las entidades
- ✅ `shared/api/endpoints.ts` - Usado correctamente

### 4.2 Autenticación y Cognito
- ✅ `shared/services/cognito-service.ts` - Usado en `use-auth`
- ✅ `shared/utils/cognito-auth.ts` - Usado correctamente
- ✅ `shared/utils/pkce.ts` - Usado en `cognito-auth`
- ✅ `shared/lib/cognito-roles.ts` - Usado en `use-auth` y `AuthProvider`
- ✅ `shared/hooks/use-auth.ts` - Usado en `AuthProvider`

### 4.3 Hooks
- ✅ `shared/hooks/use-mobile.tsx` - Usado en `Sidebar`

### 4.4 Utilidades
- ✅ `shared/lib/utils.ts` - Usado extensivamente (función `cn`)

### 4.5 Componentes UI (Shadcn/Radix)
- ✅ `shared/ui/Alert.tsx` - Usado extensivamente
- ✅ `shared/ui/alert-dialog.tsx` - Usado correctamente
- ✅ `shared/ui/dialog.tsx` - Usado en admin pages y forms
- ✅ `shared/ui/card.tsx` - Usado extensivamente
- ✅ `shared/ui/button.tsx` - Usado extensivamente
- ✅ `shared/ui/badge.tsx` - Usado extensivamente
- ✅ `shared/ui/skeleton.tsx` - Usado extensivamente
- ✅ `shared/ui/input.tsx` - Usado en forms
- ✅ `shared/ui/label.tsx` - Usado en forms
- ✅ `shared/ui/textarea.tsx` - Usado en forms
- ✅ `shared/ui/checkbox.tsx` - Usado en quiz
- ✅ `shared/ui/radio-group.tsx` - Usado en quiz
- ✅ `shared/ui/select.tsx` - Usado en forms
- ✅ `shared/ui/progress.tsx` - Usado en progress pages
- ✅ `shared/ui/tabs.tsx` - Usado en varias páginas
- ✅ `shared/ui/table.tsx` - Usado en grades
- ✅ Y otros componentes shadcn estándar

---

## 5. PROBLEMAS DE ORGANIZACIÓN

### 5.1 Estructura de carpetas
- ✅ **Bien organizado**: Separación clara entre `api/`, `hooks/`, `lib/`, `services/`, `ui/`, `utils/`
- ⚠️ **Mejorable**: Directorios vacíos (`config/`, `providers/`) deberían eliminarse o usarse

### 5.2 Naming conventions
- ⚠️ **Inconsistente**: Mezcla de PascalCase y kebab-case en nombres de archivos UI
  - `Alert.tsx` vs `alert-dialog.tsx`
  - `Dialog.tsx` vs `dialog.tsx` (ambos existen)
  - `Modal.tsx` vs `modal.tsx`
- **Recomendación**: Estandarizar a kebab-case para archivos UI (convención shadcn)

### 5.3 Exportaciones
- ⚠️ **Problema**: `shared/ui/index.ts` está vacío
- **Recomendación**: Crear barrel exports para facilitar imports:
  ```typescript
  export * from './button';
  export * from './card';
  // etc...
  ```

### 5.4 Separación de responsabilidades
- ✅ **Bien**: Separación entre `services/` (lógica de negocio) y `utils/` (utilidades puras)
- ✅ **Bien**: Hooks en `hooks/`, componentes UI en `ui/`

---

## 6. RECOMENDACIONES PRIORITARIAS

### Prioridad Alta
1. **Eliminar archivos duplicados**:
   - `shared/ui/use-toast.ts`
   - `shared/ui/AlertDialog.tsx`
   - `shared/ui/Modal.tsx`

2. **Eliminar archivos vacíos**:
   - `shared/lib/cn.ts`
   - `shared/lib/validation.ts`
   - `shared/lib/date.ts`
   - `shared/lib/constants/routes.ts`
   - `shared/aws/clients.ts`
   - `shared/aws/config.ts`
   - `shared/ui/index.ts` (o llenarlo con exports)

3. **Eliminar archivos no utilizados**:
   - `shared/lib/jwt-utils.ts`
   - `shared/lib/schemas.ts`
   - `shared/api/use-reports.ts`
   - `shared/api/use-system.ts`
   - `shared/ui/DataTable.tsx`
   - `shared/ui/Spinner.tsx`
   - `shared/ui/toaster.tsx`
   - `shared/ui/sonner.tsx`

4. **Estandarizar sistema de toast**: usar `shared/hooks/use-toast` y migrar todo

### Prioridad Media
5. **Eliminar directorios vacíos**: `shared/config/`, `shared/providers/`

6. **Estandarizar naming**: Usar kebab-case para todos los archivos UI

7. **Crear barrel exports**: Llenar `shared/ui/index.ts` con exports

8. **Corregir imports inconsistentes**: Estandarizar uso de `Dialog` vs `dialog`

### Prioridad Baja
9. **Documentar**: Agregar comentarios sobre el propósito de cada módulo

10. **Revisar AWS**: Si `aws/` no se usa, considerar eliminarlo completamente

---

## 7. ESTADÍSTICAS

### Archivos por categoría
- **UI Components**: 58 archivos (45 usados, 13 no usados/duplicados)
- **Hooks**: 3 archivos (2 usados, 1 duplicado)
- **API**: 4 archivos (2 usados, 2 no usados)
- **Services**: 1 archivo (usado)
- **Utils**: 2 archivos (usados)
- **Lib**: 6 archivos (2 usados, 4 no usados/vacíos)
- **AWS**: 2 archivos (vacíos)

### Tasa de uso
- **Tasa de uso general**: 60.8% (45/74)
- **Tasa de uso UI**: 77.6% (45/58)
- **Tasa de uso no-UI**: 100% (16/16) - excluyendo vacíos

---

## 8. CONCLUSIÓN

El directorio `shared/` tiene una estructura sólida pero contiene:
- **18 archivos** que deberían eliminarse (vacíos o no usados)
- **3 archivos** duplicados que causan confusión
- **4 problemas** de uso inconsistente que deberían corregirse

La limpieza propuesta reduciría el tamaño del directorio en ~28% y eliminaría confusión sobre qué archivos usar.

