# Lógica de Base de Datos - Plataforma Digital Escuela Bíblica Salem

Este documento explica la estructura y lógica de negocio de la base de datos para desarrolladores backend y frontend.

## 📐 Modelo de Negocio

La estructura jerárquica del sistema es:

- **Módulo:** Contenedor principal que agrupa materias. Define el período académico (puede durar lo que determine la escuela).
  - Tiene `fecha_inicio` y `fecha_fin` que controlan cuándo el contenido está disponible
  - Cuando el coordinador activa/publica el módulo, **todas las lecciones** se muestran automáticamente
- **Materia:** Cada módulo tiene N materias (ej. "Jesús 1", "Biblia 1"). Cada materia tiene:
  - N lecciones (ej. "Introducción a Jesús", "Muerte y resurrección de Jesús")
  - Cada lección tiene un quiz (tarea evaluable)
  - Un examen final (solo accesible después de completar todos los quizzes de las lecciones)

**Jerarquía:** Módulo → Materia → Lección → Quiz
**Examen Final:** Módulo → Materia → Examen Final (requiere completar todos los quizzes)

**Control de Disponibilidad:**
- Las lecciones **NO tienen fechas propias** (`fecha_inicio`/`fecha_fin`)
- Las fechas del módulo controlan cuándo todo el contenido está disponible
- Al activar el módulo, todas las lecciones se liberan simultáneamente (no hay liberación gradual)

---

## 🔐 1. Usuarios y Acceso

Este grupo gestiona la identidad, autenticación y permisos del sistema.

### **usuario**

**Descripción:** Tabla maestra de identidad. Almacena el perfil de cada usuario.

**Función en el sistema:**
- Guarda información básica: nombre, apellido, email
- `cognito_user_id`: Vincula el usuario con Amazon Cognito (autenticación externa)
- `avatar_url`: URL del avatar del usuario

**Lógica Clave:**
- **RLS:** Los usuarios solo pueden ver y actualizar su propio perfil. Los administradores tienen acceso completo.
- **Integración Cognito:** El backend debe establecer la variable de sesión `app.current_cognito_user_id` antes de cada query para que RLS funcione correctamente.

### **rol**

**Descripción:** Catálogo de roles disponibles (ej. 'ADMIN', 'INSTRUCTOR', 'ESTUDIANTE').

**Función en el sistema:**
- Define los niveles de permiso del sistema
- `nombre` es único y se usa para identificar roles (ej. `is_admin()` busca `nombre = 'ADMIN'`)

**Lógica Clave:**
- **RLS:** Solo administradores pueden ver y gestionar roles
- **UUID:** Usa UUID como PK, pero `nombre` es único para búsquedas humanas

### **usuario_rol**

**Descripción:** Tabla pivote (muchos a muchos) que asigna roles a usuarios.

**Función en el sistema:**
- Determina qué puede hacer un usuario en el sistema
- La función `is_admin()` consulta esta tabla para otorgar permisos elevados

**Lógica Clave:**
- **RLS:** Solo administradores pueden gestionar asignaciones de roles
- **UNIQUE:** Un usuario no puede tener el mismo rol duplicado

---

## 📚 2. Contenido del Módulo y Materias

Este grupo define la estructura jerárquica y los materiales de aprendizaje.

### **modulo**

**Descripción:** Entidad principal. Contenedor de más alto nivel que agrupa materias. Define el período académico (puede durar lo que determine la escuela).

**Función en el sistema:**
- Agrupa materias relacionadas (ej. "Jesús 1" y "Biblia 1")
- `fecha_inicio` y `fecha_fin`: Define el período del módulo y controla cuándo todo el contenido está disponible
- `publicado`: Controla visibilidad (cuando el coordinador activa el módulo)

**Lógica Clave:**
- **CHECK:** `fecha_fin >= fecha_inicio` (validación automática)
- **RLS:** Módulos publicados son visibles para todos. Solo administradores pueden crear/editar.
- **Jerarquía:** Módulo → Materia → Lección
- **Control de disponibilidad:** Cuando el módulo está activo/publicado, **todas las lecciones** de todas las materias del módulo se muestran automáticamente
- **Sin liberación gradual:** Las lecciones no tienen fechas individuales; se liberan todas al activar el módulo

### **curso**

**Descripción:** Materia dentro de un módulo (ej. "Jesús 1", "Biblia 1"). Cada módulo puede tener múltiples materias.

**Función en el sistema:**
- Agrupa lecciones y quizzes de una materia específica
- `publicado`: Controla la visibilidad pública de la materia
- Vinculada a módulo a través de `modulo_curso`

**Lógica Clave:**
- **RLS:** Materias publicadas son visibles si el módulo también está publicado
- **Jerarquía:** Módulo → Materia → Lección
- **Nota:** La tabla se llama `curso` pero conceptualmente representa una "Materia"

### **modulo_curso**

**Descripción:** Tabla pivote (muchos a muchos) que vincula módulos con materias.

**Función en el sistema:**
- Permite que un módulo tenga múltiples materias (ej. un módulo puede tener "Jesús 1" y "Biblia 1")
- `slot`: Define el orden de la materia dentro del módulo
- Un módulo puede tener múltiples materias, y una materia puede estar en múltiples módulos

**Lógica Clave:**
- **UNIQUE:** `(modulo_id, slot)` garantiza orden único por módulo
- **UNIQUE:** `(modulo_id, curso_id)` evita duplicados
- **RLS:** Solo administradores pueden gestionar esta tabla

### **leccion**

**Descripción:** Página de contenido específica dentro de una materia (ej. "Introducción a Jesús", "Muerte y resurrección de Jesús").

**Función en el sistema:**
- Contenido educativo individual de una materia
- Vinculada a `modulo_id`, creando la jerarquía: Módulo → Materia → Lección
- `orden`: Define el orden dentro del módulo
- **NO tiene fechas propias:** Las lecciones no tienen `fecha_inicio` ni `fecha_fin`

**Lógica Clave:**
- **RLS:** Lecciones publicadas son visibles si el módulo y la materia también están publicados
- **Jerarquía:** Las lecciones pertenecen a un módulo, y se asocian a materias a través de la relación módulo-materia
- **Disponibilidad:** Cuando el coordinador activa/publica un módulo, **todas las lecciones** del módulo se muestran automáticamente
- **Control temporal:** Las fechas `fecha_inicio` y `fecha_fin` del módulo controlan cuándo el contenido está disponible, no las lecciones individuales

### **leccion_contenido**

**Descripción:** Bloques de contenido reales (texto, video, PDF, link) dentro de una lección.

**Función en el sistema:**
- Permite construir una lección a partir de múltiples piezas de contenido
- `tipo`: TEXTO, PDF, VIDEO, LINK
- `orden`: Define el orden de los bloques dentro de la lección

**Lógica Clave:**
- **RLS:** Solo administradores pueden gestionar contenido
- **CASCADE:** Si se elimina una lección, se eliminan todos sus contenidos

### **guia_estudio**

**Descripción:** Recursos a nivel de materia (ej. "Programa de la Materia" o "Bibliografía").

**Función en el sistema:**
- Proporciona materiales de apoyo que aplican a toda la materia
- `activo`: Controla si el recurso está disponible

**Lógica Clave:**
- **RLS:** Solo administradores pueden gestionar guías de estudio
- **CASCADE:** Si se elimina una materia (curso), se eliminan sus guías

---

## 📝 3. Evaluaciones y Calificaciones

Este grupo maneja cómo se evalúa a los estudiantes.

### **quiz**

**Descripción:** Tarea evaluable (quiz) vinculada a una lección específica. Cada lección tiene un quiz asociado.

**Función en el sistema:**
- Agrupa un conjunto de preguntas para evaluar el contenido de una lección
- Es la "tarea" evaluable de cada lección
- Cada lección tiene un quiz asociado
- `publicado`: Controla visibilidad
- `aleatorio`: Indica si las preguntas se muestran en orden aleatorio
- `guarda_calificacion`: Define si se guarda la calificación

**Lógica Clave:**
- **RLS:** Quizzes publicados son visibles si la lección, materia y módulo también están publicados
- **Vista:** `quiz_con_preguntas` calcula dinámicamente el número de preguntas
- **Jerarquía:** Módulo → Materia → Lección → Quiz
- **Vinculación:** Vinculado a `leccion_id` (no a `curso_id`)
- **Nota:** Los quizzes son las tareas evaluables del sistema; cada lección tiene su quiz

### **pregunta**

**Descripción:** Enunciado de una pregunta dentro de un quiz.

**Función en el sistema:**
- Almacena el texto de la pregunta
- `puntos`: Puntos que vale la pregunta
- `orden`: Orden dentro del quiz

**Lógica Clave:**
- **RLS:** Solo administradores pueden gestionar preguntas
- **RESTRICT:** No se puede eliminar una pregunta si tiene intentos asociados

### **pregunta_config**

**Descripción:** Configuración específica según el tipo de pregunta.

**Función en el sistema:**
- Define el tipo: ABIERTA, OPCION_MULTIPLE, VERDADERO_FALSO
- Almacena configuración específica según el tipo:
  - **ABIERTA:** `abierta_modelo_respuesta` (texto de referencia)
  - **OPCION_MULTIPLE:** `om_min_selecciones`, `om_max_selecciones`, `puntos_por_opcion`
  - **VERDADERO_FALSO:** `vf_respuesta_correcta`
- `penaliza_error`: Define si se penaliza por respuesta incorrecta

**Lógica Clave:**
- **CHECK:** Restricciones que validan que los campos requeridos estén presentes según el tipo
- **CHECK:** `om_min_selecciones <= om_max_selecciones`
- **Trigger:** `validar_respuesta_tipo` asegura que las respuestas coincidan con el tipo

### **opcion**

**Descripción:** Opciones de respuesta para preguntas de opción múltiple.

**Función en el sistema:**
- Almacena las opciones disponibles
- `es_correcta`: Indica si la opción es correcta
- `orden`: Orden de presentación

**Lógica Clave:**
- **RLS:** Solo administradores pueden gestionar opciones
- **SET NULL:** Si se elimina una opción, las respuestas que la usaban quedan con `opcion_id = NULL`

### **examen_final**

**Descripción:** Examen final de la materia. Solo se puede realizar después de completar todos los quizzes de las lecciones.

**Función en el sistema:**
- Evaluación final que determina la acreditación de la materia
- Vinculado directamente a una materia (curso)
- `publicado`: Controla visibilidad
- `aleatorio`: Indica si las preguntas se muestran en orden aleatorio
- `guarda_calificacion`: Define si se guarda la calificación

**Lógica Clave:**
- **RLS:** Exámenes publicados son visibles si la materia también está publicada
- **Prerequisito:** El alumno solo puede acceder al examen final si completó todos los quizzes de todas las lecciones de la materia
- **Validación:** El sistema debe validar que todos los quizzes de las lecciones de la materia estén completados antes de permitir el intento
- **Jerarquía:** Módulo → Materia → Examen Final
- **Vinculación:** Vinculado a `curso_id` (materia)

---

## 🎓 4. Inscripción y Progreso

Este grupo rastrea el viaje y los logros del estudiante.

### **inscripcion_curso**

**Descripción:** La "matrícula". Vincula un usuario a una materia (curso).

**Función en el sistema:**
- Tabla central de progreso del estudiante en una materia
- Almacena estado: ACTIVA, PAUSADA, CONCLUIDA, REPROBADA
- `acreditado`: Indica si la materia fue completada exitosamente
- `acreditado_en`: Timestamp de acreditación
- `fecha_inscripcion`, `fecha_conclusion`: Fechas importantes

**Lógica Clave:**
- **RLS:** Usuarios solo pueden ver y gestionar sus propias inscripciones
- **UNIQUE:** Un usuario solo puede estar inscrito una vez por materia
- **CHECK:** `fecha_conclusion >= fecha_inscripcion`
- **Triggers:**
  - `validar_transicion_estado_inscripcion`: Previene transiciones inválidas (ej. CONCLUIDA no puede cambiar)
  - `validar_acreditacion_curso`: Valida que exista un intento aprobado con score mínimo antes de acreditar
- **DEFAULT:** Estado inicial es 'ACTIVA'
- **Nota:** La tabla se llama `inscripcion_curso` pero conceptualmente representa inscripción a una "Materia"

### **inscripcion_modulo_calculada** (Vista)

**Descripción:** Vista que calcula el progreso del módulo basándose en las inscripciones de materias (cursos).

**Función en el sistema:**
- Reemplaza la antigua tabla `inscripcion_modulo` (eliminada por redundancia)
- Calcula dinámicamente: estado, acreditado, fechas
- El progreso del módulo se deriva del progreso en las materias que lo componen

**Lógica Clave:**
- **Estado:** Prioridad REPROBADA > CONCLUIDA > PAUSADA > ACTIVA
- **Acreditado:** TRUE solo si todas las materias del módulo están acreditadas Y el usuario está inscrito en todas
- **Uso:** Consultar esta vista en lugar de una tabla para obtener el progreso del módulo

### **intento**

**Descripción:** Un intento de un usuario para resolver un quiz o examen final.

**Función en el sistema:**
- Registra cada intento con su puntaje y resultado (APROBADO, NO_APROBADO)
- Puede ser para un quiz de lección o para un examen final de materia
- `numero_intento`: Número secuencial del intento
- `puntaje`: Calificación numérica (NUMERIC(5,2))
- `iniciado_en`, `finalizado_en`: Timestamps del intento
- `permitir_nuevo_intento`: Campo booleano controlado por el instructor para permitir un nuevo intento

**Lógica Clave:**
- **RLS:** Usuarios solo ven sus propios intentos
- **Múltiples intentos:** Un usuario puede tener múltiples intentos por quiz (se eliminó la restricción UNIQUE que limitaba intentos)
- **Control manual:** El instructor debe establecer `permitir_nuevo_intento = TRUE` para que el usuario pueda crear un nuevo intento
- **Cada intento es independiente:** Cada intento tiene su propio registro completo
- **Triggers:**
  - `validar_max_intentos`: Valida que no se exceda el máximo según `regla_acreditacion` (si está configurado)
  - `validar_intento_inscripcion`: Asegura que el usuario esté inscrito y el quiz pertenezca a la lección/materia
  - `validar_examen_final_prerequisitos`: Valida que todos los quizzes de las lecciones estén completados antes de permitir el examen final
  - `validar_nuevo_intento_permitido`: Valida que `permitir_nuevo_intento = TRUE` antes de crear un nuevo intento
- **NO ACTION:** `usuario_id` no se elimina si se borra el usuario (preserva historial)
- **Reapertura:** El instructor controla manualmente cuándo permitir nuevos intentos estableciendo `permitir_nuevo_intento = TRUE`

### **intento_pregunta**

**Descripción:** "Snapshot" de las preguntas en un intento específico.

**Función en el sistema:**
- Captura el estado de las preguntas al momento del intento
- `puntos_maximos`: Puntos máximos que valía la pregunta en ese momento
- Preserva el historial incluso si las preguntas cambian después

**Lógica Clave:**
- **RLS:** Solo administradores pueden ver estas respuestas (protege integridad del banco)
- **UNIQUE:** `(intento_id, pregunta_id)` previene duplicados
- **RESTRICT:** No se puede eliminar una pregunta si tiene intentos asociados

### **respuesta**

**Descripción:** Respuesta específica del usuario a una pregunta.

**Función en el sistema:**
- Almacena la respuesta según el tipo:
  - **ABIERTA:** `respuesta_texto`
  - **OPCION_MULTIPLE:** `opcion_id`
  - **VERDADERO_FALSO:** `respuesta_bool`

**Lógica Clave:**
- **RLS:** Solo administradores pueden ver respuestas
- **Trigger:** `validar_respuesta_tipo` asegura que el tipo de respuesta coincida con el tipo de pregunta
- **Vista:** `respuesta_con_evaluacion` calcula dinámicamente `es_correcta` y `puntos_otorgados`

### **regla_acreditacion**

**Descripción:** Define las reglas de negocio para aprobar una materia (curso).

**Función en el sistema:**
- Configuración de evaluación: score mínimo, máximo de intentos
- `quiz_id`: NULL para reglas generales de la materia, o específico para un quiz/examen final
- `activa`: Permite desactivar reglas sin eliminarlas
- Puede aplicarse a quizzes de lecciones o al examen final

**Lógica Clave:**
- **RLS:** Solo administradores pueden gestionar reglas
- **UNIQUE parcial:** Solo una regla activa por materia (o por materia+quiz/examen)
- **Prioridad:** Reglas específicas por quiz/examen tienen prioridad sobre reglas generales
- **Default:** Si no hay regla, se usa 80% de score mínimo y 3 intentos máximo
- **Examen final:** Las reglas del examen final determinan la acreditación de la materia

### **certificado**

**Descripción:** Registro de un certificado emitido.

**Función en el sistema:**
- Se vincula a una `inscripcion_curso` exitosa
- `folio`: Número de folio del certificado
- `hash_verificacion`: Hash único para verificación
- `s3_key`: Ubicación del archivo en S3
- `quiz_id`, `intento_id`: Referencias para auditoría

**Lógica Clave:**
- **RLS:** Usuarios solo pueden ver sus propios certificados
- **UNIQUE parcial:** Solo un certificado válido por inscripción
- **SET NULL:** Si se elimina el quiz/intento, se mantiene el certificado pero se pierden las referencias

---

## 💬 5. Interacción

Este grupo maneja la comunicación entre usuarios.

### **foro_comentario**

**Descripción:** Comentarios públicos para una lección.

**Función en el sistema:**
- Permite discusión pública sobre lecciones
- Vinculado a `curso_id` (materia) y `leccion_id`

**Lógica Clave:**
- **RLS:** Solo puedes ver/publicar comentarios si estás inscrito en la materia
- **Trigger:** `validar_foro_comentario_curso` asegura que `curso_id` coincida con la materia del módulo de la lección
- **CASCADE:** Si se elimina materia/lección/usuario, se eliminan sus comentarios

### **preferencia_notificacion**

**Descripción:** Configuración de notificaciones por email (1-a-1 con usuario).

**Función en el sistema:**
- Controla qué notificaciones desea recibir el usuario
- `email_recordatorios`, `email_motivacion`, `email_resultados`: Flags booleanos

**Lógica Clave:**
- **RLS:** Usuarios solo pueden ver y editar sus propias preferencias
- **UNIQUE:** Un usuario solo puede tener un registro de preferencias

---

## ⚙️ 6. Vistas e Índices

Este grupo no almacena datos, sino que los calcula o acelera.

### **Vistas (Views)**

#### **inscripcion_modulo_calculada**

**Descripción:** Calcula el progreso del módulo basándose en inscripciones de materias (cursos).

**Función:**
- Reemplaza la tabla `inscripcion_modulo` (eliminada)
- Calcula dinámicamente: estado, acreditado, fechas
- El progreso se deriva del progreso en las materias que componen el módulo

**Uso:**
```sql
SELECT * FROM inscripcion_modulo_calculada 
WHERE usuario_id = '...' AND modulo_id = '...';
```

#### **respuesta_con_evaluacion**

**Descripción:** Autocalifica respuestas comparándolas con la configuración de la pregunta.

**Función:**
- Calcula `es_correcta` y `puntos_otorgados` dinámicamente
- Maneja los tres tipos de pregunta (ABIERTA, OPCION_MULTIPLE, VERDADERO_FALSO)
- Considera penalizaciones por error

**Uso:**
```sql
SELECT * FROM respuesta_con_evaluacion 
WHERE intento_pregunta_id = '...';
```

#### **quiz_con_preguntas**

**Descripción:** Agrega el conteo de preguntas a cada quiz.

**Función:**
- Calcula dinámicamente `numero_preguntas`
- Evita almacenar datos redundantes

**Uso:**
```sql
SELECT * FROM quiz_con_preguntas WHERE id = '...';
```

### **Índices (Indexes)**

**Función en el sistema:** Aceleran las búsquedas y mejoran el rendimiento.

**Tipos de índices:**

1. **Índices B-Tree (FKs):** En todas las claves foráneas (30+ índices)
   - Mejoran JOINs y búsquedas por FK

2. **Índices parciales:** Para valores booleanos frecuentes
   - Ej: `WHERE publicado = TRUE`, `WHERE acreditado = TRUE`
   - Más eficientes que índices completos

3. **Índices compuestos:** Para consultas comunes
   - Ej: `(usuario_id, estado)`, `(curso_id, leccion_id)`
   - Optimizan filtros múltiples

4. **Índices de ordenamiento:** Para ORDER BY frecuentes
   - Ej: `(modulo_id, orden)`, `(leccion_id, creado_en DESC)`

5. **Índices GIN (pg_trgm):** Para búsqueda de texto completo
   - 12 índices en títulos, descripciones y contenidos
   - Permiten búsquedas tipo "LIKE" optimizadas
   - Uso: `WHERE titulo % 'palabra clave'`

---

## 🔒 7. Seguridad y Autenticación

### **Row-Level Security (RLS)**

**Función:** Controla el acceso a nivel de fila basándose en el usuario actual.

**Implementación:**
- RLS habilitado en 22 tablas
- Funciones helper:
  - `get_current_user_id()`: Obtiene el UUID del usuario desde `cognito_user_id` (variable de sesión)
  - `is_admin()`: Verifica si el usuario tiene rol 'ADMIN'

**Integración con Cognito:**
- El backend debe establecer `app.current_cognito_user_id` antes de cada query
- Ejemplo (SQLAlchemy):
  ```python
  session.execute(text("SET app.current_cognito_user_id = :cognito_id"), 
                  {"cognito_id": cognito_user_id})
  ```

**Políticas comunes:**
- Usuarios solo ven/editan sus propios datos
- Contenido público es visible para todos
- Administradores tienen acceso completo
- Contenido de materia requiere inscripción

### **Triggers de Validación**

**Función:** Aplican reglas de negocio a nivel de base de datos.

**Triggers principales:**
- `validar_max_intentos`: Limita intentos según reglas de acreditación
- `validar_intento_inscripcion`: Valida que el usuario esté inscrito y el quiz pertenezca a la lección/materia
- `validar_examen_final_prerequisitos`: Valida que todos los quizzes de las lecciones estén completados antes de permitir el examen final
- `validar_nuevo_intento_permitido`: Valida que `permitir_nuevo_intento = TRUE` antes de crear un nuevo intento
- `validar_respuesta_tipo`: Asegura que el tipo de respuesta coincida con el tipo de pregunta
- `validar_transicion_estado_inscripcion`: Previene transiciones inválidas de estado
- `validar_acreditacion_curso`: Valida requisitos antes de acreditar
- `validar_foro_comentario_curso`: Valida consistencia entre materia y lección

---

## 📋 8. Convenciones y Tipos

### **Tipos ENUM**

- `estado_publicacion`: PUBLICADO, NO_PUBLICADO
- `tipo_contenido`: TEXTO, PDF, VIDEO, LINK
- `estado_inscripcion`: ACTIVA, PAUSADA, CONCLUIDA, REPROBADA
- `resultado_intento`: APROBADO, NO_APROBADO
- `tipo_pregunta`: ABIERTA, OPCION_MULTIPLE, VERDADERO_FALSO

### **Convenciones de Nomenclatura**

- **Tablas:** Singular, español (usuario, curso/materia, modulo, leccion)
- **Columnas:** Español (creado_en, actualizado_en, titulo)
- **Timestamps:** `creado_en`, `actualizado_en` (TIMESTAMPTZ)
- **IDs:** UUID para todas las claves primarias
- **Foreign Keys:** `tabla_id` (ej. `curso_id`, `usuario_id`)

### **Políticas ON DELETE/UPDATE**

- **CASCADE:** Relaciones de dependencia (ej. usuario_rol, modulo_curso)
- **RESTRICT:** Entidades principales (ej. curso/materia, modulo, quiz)
- **SET NULL:** Referencias opcionales
- **NO ACTION:** Datos históricos (ej. usuario_id en intento)

---

## 🚀 9. Consideraciones para Desarrollo

### **Backend**

1. **Autenticación:**
   - Validar JWT de Cognito
   - Extraer `sub` claim (cognito_user_id)
   - Establecer `app.current_cognito_user_id` antes de cada query

2. **Consultas:**
   - Usar vistas calculadas cuando sea apropiado (`inscripcion_modulo_calculada`, `respuesta_con_evaluacion`)
   - Los triggers validan reglas de negocio automáticamente
   - Manejar excepciones de triggers (ej. nuevo intento no permitido)

3. **Múltiples intentos:**
   - Los usuarios pueden tener múltiples intentos por quiz
   - El instructor debe establecer `permitir_nuevo_intento = TRUE` para permitir un nuevo intento
   - Cada intento tiene su propio registro independiente

4. **Búsquedas de texto:**
   - Usar operador `%` con índices GIN: `WHERE titulo % 'palabra clave'`
   - Usar `similarity()` para ranking: `ORDER BY similarity(titulo, 'palabra') DESC`

### **Frontend**

1. **Estados de inscripción:**
   - ACTIVA: Usuario puede continuar
   - PAUSADA: Usuario pausó la materia
   - CONCLUIDA: Materia completada exitosamente
   - REPROBADA: Materia no completada

2. **Progreso de módulo:**
   - Consultar `inscripcion_modulo_calculada` en lugar de tabla
   - El progreso se calcula dinámicamente basándose en las materias del módulo

3. **Jerarquía del contenido:**
   - Módulo → Materia → Lección → Quiz (tarea evaluable)
   - Módulo → Materia → Examen Final
   - Cada lección tiene un quiz (tarea evaluable)
   - Cada materia tiene un examen final

4. **Múltiples intentos:**
   - Los usuarios pueden tener múltiples intentos en quizzes
   - El instructor controla manualmente cuándo permitir nuevos intentos estableciendo `permitir_nuevo_intento = TRUE`
   - Cada intento es un registro independiente con su propia calificación

5. **Acceso al examen final:**
   - El alumno solo puede acceder al examen final si completó todos los quizzes de todas las lecciones de la materia
   - El sistema valida automáticamente este prerequisito antes de permitir el intento

6. **Disponibilidad de lecciones:**
   - Las lecciones NO tienen fechas individuales
   - Cuando el coordinador activa/publica un módulo, todas las lecciones se muestran automáticamente
   - Las fechas `fecha_inicio` y `fecha_fin` del módulo controlan el período de disponibilidad

---

## 📝 Notas Finales

- **Sin datos redundantes:** El progreso se calcula dinámicamente (vistas)
- **Sin datos huérfanos:** Triggers limpian referencias automáticamente
- **Seguridad a nivel de fila:** RLS protege datos sensibles
- **Validación automática:** Triggers aplican reglas de negocio
- **Rendimiento optimizado:** 60+ índices para consultas rápidas

Para más detalles técnicos, consultar `AUDITORIA_BASE_DATOS.md`.

