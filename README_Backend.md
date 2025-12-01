# Guía de Desarrollo - Backend (FastAPI)

## Contexto del Proyecto

**Perfil del Equipo de Desarrollo:**
- **Rol**: Ingeniero Senior Backend
- **Experiencia**: Experto en Python y FastAPI
- **Enfoque**: Desarrollo de API RESTful robusta, escalable y mantenible
- **Estándares**: Código limpio, arquitectura modular, buenas prácticas de Python

**Stack Tecnológico:**
- **Framework**: FastAPI (Python 3.11+)
- **Lenguaje**: Python (tipado con type hints, Pydantic)
- **Base de Datos**: PostgreSQL 15+ con SQLAlchemy ORM
- **Autenticación**: Amazon Cognito (JWT)
- **Almacenamiento**: AWS S3
- **Contenedorización**: Docker
- **Despliegue**: AWS ECS Fargate

**Principios de Desarrollo:**
- Type safety: Uso extensivo de type hints y Pydantic
- Dependency Injection: FastAPI Depends para inyección de dependencias
- Separation of Concerns: Routes → Services → Database
- Error Handling: Excepciones personalizadas y manejo centralizado
- Security First: Validación de entrada, autenticación, autorización y RLS
- Database Integrity: Triggers y constraints en BD, validaciones en aplicación
- Testing: Tests unitarios y de integración
- Documentation: Docstrings, type hints y documentación automática de API

## Arquitectura

- **Framework**: FastAPI (Python)
- **Estructura**: Monolito modular
- **Base de datos**: PostgreSQL con RLS (Row Level Security)
- **Autenticación**: Amazon Cognito (validación de JWT)
- **Almacenamiento**: S3 (URLs prefirmadas)
- **Contenedorización**: Docker
- **Despliegue**: AWS ECS Fargate

## Estructura de la Base de Datos

### Jerarquía de Contenido
```
Módulo (con fechas inicio/fin, controla disponibilidad de contenido)
  └── Materia (curso) [múltiples por módulo, tabla: modulo_curso]
      ├── Guía de Estudio (múltiples por materia)
      ├── Lección (pertenece al módulo, NO al curso directamente)
      │   └── Contenido (texto, PDF, video, link) [múltiples por lección]
      ├── Quiz (evaluación asociada a una lección)
      │   └── Pregunta
      │       ├── Configuración (tipo: ABIERTA, OPCION_MULTIPLE, VERDADERO_FALSO)
      │       └── Opción (para opción múltiple)
      └── Examen Final (evaluación final de la materia/curso)
          └── Pregunta (comparte estructura con quiz)
```

**Notas importantes:**
- La tabla se llama `curso` pero conceptualmente representa una **"Materia"** en el modelo de negocio
- Las lecciones pertenecen directamente al **módulo**, no al curso/materia
- Las lecciones se asocian a materias a través de la relación módulo-materia (`modulo_curso`)
- Las fechas del módulo controlan cuándo todo el contenido está disponible (lecciones NO tienen fechas propias)
- Una inscripción es a una **materia (curso)**, no a un módulo completo

### Entidades Principales

**Usuarios y Acceso:**
- **Usuario**: Integrado con Cognito (`cognito_user_id`), email único
- **Rol**: Sistema de roles (estudiante, coordinador, admin)
- **UsuarioRol**: Relación usuario-rol (tabla pivote)

**Contenido:**
- **Módulo**: Contenedor temporal con fechas de inicio/fin (`fecha_inicio`, `fecha_fin`), controla disponibilidad de contenido
- **Curso (Materia)**: Materia específica, puede estar en múltiples módulos
- **ModuloCurso**: Tabla pivote que vincula módulos con materias, incluye `slot` para orden
- **GuiaEstudio**: Guías de estudio asociadas a una materia (`url`, `activo`)
- **Lección**: Contenido educativo perteneciente a un módulo (orden, publicado)
- **LeccionContenido**: Contenido específico de una lección (texto, PDF, video, link), múltiples por lección

**Evaluaciones:**
- **Quiz**: Evaluación asociada a una lección (`aleatorio`, `guarda_calificacion`)
- **ExamenFinal**: Evaluación final de una materia/curso
- **Pregunta**: Pregunta asociada a un quiz O examen final (exclusivo: solo uno de los dos)
- **PreguntaConfig**: Configuración de pregunta según tipo (ABIERTA, OPCION_MULTIPLE, VERDADERO_FALSO)
- **Opcion**: Opciones para preguntas de opción múltiple (`es_correcta`, `orden`)

**Inscripción y Progreso:**
- **InscripcionCurso**: Inscripción a una materia/curso (estado: ACTIVA, PAUSADA, CONCLUIDA, REPROBADA), `acreditado`, fechas de inscripción/conclusión
- **Intento**: Registro de intento de quiz o examen final (`numero_intento`, `puntaje`, `resultado`, `permitir_nuevo_intento`)
- **IntentoPregunta**: Relación intento-pregunta (puntos_maximos)
- **Respuesta**: Respuesta del usuario (según tipo: `respuesta_texto`, `opcion_id`, `respuesta_bool`)

**Acreditación:**
- **ReglaAcreditacion**: Reglas configurables por curso/quiz/examen (`min_score_aprobatorio`, `max_intentos_quiz`, `bloquea_curso_por_reprobacion_quiz`, `activa`)
- **Certificado**: Certificado generado al acreditar (`folio`, `hash_verificacion`, `s3_key`, `valido`)

**Interacción:**
- **ForoComentario**: Comentarios en foro de lecciones (`curso_id`, `leccion_id`, `usuario_id`)
- **PreferenciaNotificacion**: Preferencias de notificaciones por usuario (email_recordatorios, email_motivacion, email_resultados)

### Vistas Calculadas

- **quiz_con_preguntas**: Quiz con conteo de preguntas
- **examen_final_con_preguntas**: Examen final con conteo de preguntas
- **inscripcion_modulo_calculada**: Progreso calculado a nivel de módulo basado en inscripciones de materias
  - Estado: prioridad REPROBADA > CONCLUIDA > PAUSADA > ACTIVA
  - Acreditado: todos los cursos del módulo deben estar acreditados
- **respuesta_con_evaluacion**: Calcula dinámicamente `es_correcta` y `puntos_otorgados` basado en tipo de pregunta

### Reglas de Negocio (Triggers)

**Validación de Intentos:**
- `validar_max_intentos()`: Valida que no se exceda el máximo de intentos según `regla_acreditacion` (default: 3)
- `validar_nuevo_intento_permitido()`: Valida que `permitir_nuevo_intento = TRUE` en el último intento para crear uno nuevo
- `validar_intento_inscripcion()`: Valida que el usuario coincida con la inscripción y que el quiz/examen pertenezca a la materia

**Validación de Evaluaciones:**
- `validar_examen_final_prerequisitos()`: Valida que todos los quizzes de lecciones de la materia estén aprobados antes del examen final
- `validar_respuesta_tipo()`: Valida que el tipo de respuesta coincida con el tipo de pregunta (ABIERTA → texto, OPCION_MULTIPLE → opcion_id, VERDADERO_FALSO → respuesta_bool)

**Validación de Inscripciones:**
- `validar_transicion_estado_inscripcion()`: 
  - Una inscripción CONCLUIDA no puede cambiar de estado
  - Una inscripción REPROBADA solo puede mantenerse o concluirse
  - Actualiza `fecha_conclusion` automáticamente al concluir/reprobar
- `validar_acreditacion_curso()`: 
  - Valida que existe un intento aprobado del examen final con score >= `min_score_aprobatorio`
  - Actualiza estado a CONCLUIDA al acreditar
  - Establece `acreditado_en` automáticamente

**Validación de Foro:**
- `validar_foro_comentario_curso()`: Valida que el `curso_id` del comentario coincida con una de las materias del módulo de la lección

### Seguridad (RLS - Row Level Security)

**Funciones Helper:**
- `get_current_user_id()`: Obtiene `usuario_id` desde `app.current_cognito_user_id` (variable de sesión)
- `is_admin()`: Verifica si el usuario actual tiene rol ADMIN

**Políticas por Tabla:**
- **Usuario**: Usuarios ven/actualizan sus propios datos; admins acceso completo
- **Curso/Módulo/Lección/Quiz/ExamenFinal**: Contenido público visible si `publicado = TRUE`; admins acceso completo
- **InscripcionCurso**: Usuarios ven/actualizan sus propias inscripciones; admins acceso completo
- **Intento**: Usuarios ven/actualizan sus propios intentos; admins acceso completo
- **Certificado**: Usuarios ven sus propios certificados (a través de inscripción); admins acceso completo
- **ForoComentario**: Usuarios ven comentarios de materias donde están inscritos; pueden crear/editar sus propios comentarios
- **PreferenciaNotificacion**: Usuarios gestionan sus propias preferencias
- **Tablas de Administración** (rol, usuario_rol, regla_acreditacion, pregunta, opcion, etc.): Solo admins

**Integración con Cognito:**
- RLS usa variable de sesión `app.current_cognito_user_id` para identificar usuario
- El backend debe establecer esta variable antes de queries (ver Fase 10)

---

## Plan de Desarrollo por Fases

### ✅ Fase 0: Configuración e Infraestructura Base

**Estado**: Completado

**Objetivos**:
- Configuración de Docker y docker-compose
- Configuración de variables de entorno
- FastAPI app básica con CORS y manejo de errores
- Health check endpoint

**Archivos creados**:
- `docker-compose.yml`
- `backend/app/config.py` (Pydantic Settings)
- `backend/app/main.py` (FastAPI app)
- `.env` (variables de entorno)

---

### ✅ Fase 1: Autenticación y Servicios Externos (Sin BD)

**Estado**: Completado

**Objetivos**:
- Autenticación con Cognito JWT
- Validación de roles desde grupos Cognito
- Servicios S3 para URLs prefirmadas
- Servicio de generación de certificados PDF

**Archivos creados**:
- ✅ `backend/app/routes/auth_routes.py` (endpoints OAuth2/PKCE: `/auth/login`, `/auth/callback`, `/auth/refresh`, `/auth/logout`; manejo de cookies PKCE/access/refresh/id-token)
- ✅ `backend/app/utils/jwt_auth.py` (verificación JWT asíncrona, cache JWKS, helpers `verify_token` / `get_current_user`)
- ✅ `backend/app/utils/roles.py` (mapeo de grupos Cognito a roles y dependencias `require_role`)
- ✅ `backend/app/utils/exceptions.py` (excepciones personalizadas)
- ✅ `backend/app/services/s3_service.py` (URLs prefirmadas, upload/download)
- ✅ `backend/app/services/certificate_service.py` (generación PDF, hash verificación)

---

### ✅ Fase 2: Modelos de Base de Datos y Conexión

**Estado**: Completado

**Objetivos**:
- Crear modelos SQLAlchemy para todas las tablas
- Configurar conexión a PostgreSQL
- Configurar sesión de base de datos
- Mapear ENUMs de PostgreSQL a Python

**Tareas completadas**:
1. ✅ Crear `backend/app/database/session.py`
   - Engine de SQLAlchemy configurado
   - Función `get_db()` dependency creada
   - Pool de conexiones configurado (development/production)
   - Timezone UTC configurado automáticamente

2. ✅ Crear `backend/app/database/models.py`
   - 23 modelos SQLAlchemy creados:
     - `Usuario`, `Rol`, `UsuarioRol`
     - `Curso`, `Modulo`, `ModuloCurso`, `GuiaEstudio`
     - `Leccion`, `LeccionContenido`
     - `Quiz`, `ExamenFinal`, `Pregunta`, `PreguntaConfig`, `Opcion`
     - `InscripcionCurso`, `Intento`, `IntentoPregunta`, `Respuesta`
     - `ReglaAcreditacion`, `Certificado`
     - `ForoComentario`, `PreferenciaNotificacion`
   - Relaciones bidireccionales configuradas
   - Constraints y validaciones implementadas
   - Type hints con `Mapped[]` (SQLAlchemy 2.0)

3. ✅ Crear `backend/app/database/enums.py`
   - `EstadoPublicacion` mapeado
   - `TipoContenido` mapeado
   - `EstadoInscripcion` mapeado
   - `ResultadoIntento` mapeado
   - `TipoPregunta` mapeado

4. ⏭️ Alembic (No requerido)
   - Se usa `init.sql` directamente para inicializar la BD
   - No hay producción ni migraciones previas

**Archivos creados**:
- ✅ `backend/app/database/__init__.py`
- ✅ `backend/app/database/session.py`
- ✅ `backend/app/database/models.py`
- ✅ `backend/app/database/enums.py`

**Notas de validación**:
- Discrepancia en conteo: el README mencionaba 23 modelos, pero la implementación actual tiene 22 modelos. Los 22 modelos implementados cubren completamente la estructura de BD según el diseño.
- Archivos adicionales: existen `cursos.py`, `modulos.py`, `usuarios.py` en `routes/` y servicios correspondientes en `services/`, pero no están documentados como completados en el README (probablemente parciales o en desarrollo). Estos archivos corresponden a la Fase 4 que está marcada como pendiente.



### ✅ Fase 3: Schemas Pydantic (Contrato API)

**Estado**: Completado

**Objetivos**:
- Crear schemas Pydantic basados en modelos SQLAlchemy
- Definir request/response models para todos los endpoints
- Validaciones de negocio en schemas

**Tareas completadas**:

1. ✅ `backend/app/schemas/usuario.py` - Completado
   - `UsuarioBase`, `UsuarioCreate`, `UsuarioUpdate`, `UsuarioResponse`

2. ✅ `backend/app/schemas/curso.py` - Completado
   - `CursoBase`, `CursoCreate`, `CursoUpdate`, `CursoResponse`, `CursoDetailResponse`
   - `GuiaEstudioResponse` (con URL prefirmada)

3. ✅ `backend/app/schemas/modulo.py` - Completado
   - `ModuloBase`, `ModuloCreate`, `ModuloUpdate`, `ModuloResponse`, `ModuloDetailResponse`
   - `ModuloCursoItem` (con lista de cursos)

4. ✅ `backend/app/schemas/leccion.py` - Completado
   - `LeccionBase`, `LeccionResponse`
   - `LeccionContenidoBase`, `LeccionContenidoResponse`

5. ✅ `backend/app/schemas/quiz.py` - Completado
   - `QuizBase`, `QuizCreate`, `QuizUpdate`, `QuizResponse`, `QuizDetailResponse`
   - `PreguntaBase`, `PreguntaCreate`, `PreguntaUpdate`, `PreguntaResponse`
   - `PreguntaConfigBase`, `PreguntaConfigCreate`, `PreguntaConfigUpdate`, `PreguntaConfigResponse`
   - `OpcionBase`, `OpcionCreate`, `OpcionUpdate`, `OpcionResponse`
   - `PreguntaConOpciones` (pregunta con sus opciones y configuración)
   - `QuizConPreguntas` (quiz con todas sus preguntas)

6. ✅ `backend/app/schemas/examen_final.py` - Completado
   - `ExamenFinalBase`, `ExamenFinalCreate`, `ExamenFinalUpdate`, `ExamenFinalResponse`
   - `ExamenFinalDetailResponse` (con número de preguntas)
   - `ExamenFinalConPreguntas` (examen con todas sus preguntas)

7. ✅ `backend/app/schemas/inscripcion.py` - Completado
   - `InscripcionBase`, `InscripcionResponse`
   - `EstadoInscripcion` enum (en `database/enums.py`)

8. ✅ `backend/app/schemas/intento.py` - Completado
   - `IntentoBase`, `IntentoResponse`
   - `IntentoPreguntaBase`, `RespuestaBase`

9. ✅ `backend/app/schemas/certificado.py` - Completado
   - `CertificadoBase`, `CertificadoResponse`

10. ✅ `backend/app/schemas/progress.py` - Completado
    - `ProgressResponse` (progreso en curso específico)
    - `ProgressModuloResponse` (progreso en módulo completo)
    - `ProgressGeneralResponse` (resumen general del usuario)
    - `ProgressComparisonItem` (item individual en comparación)
    - `ProgressComparisonResponse` (comparación con otros estudiantes)

11. ✅ `backend/app/schemas/foro.py` - Completado
    - `ForoComentarioBase`, `ForoComentarioResponse`

**Archivos creados**:
- ✅ `backend/app/schemas/__init__.py` (actualizado con todas las exportaciones)
- ✅ `backend/app/schemas/usuario.py`
- ✅ `backend/app/schemas/curso.py`
- ✅ `backend/app/schemas/modulo.py`
- ✅ `backend/app/schemas/leccion.py`
- ✅ `backend/app/schemas/quiz.py`
- ✅ `backend/app/schemas/examen_final.py`
- ✅ `backend/app/schemas/inscripcion.py`
- ✅ `backend/app/schemas/intento.py`
- ✅ `backend/app/schemas/certificado.py`
- ✅ `backend/app/schemas/progress.py`
- ✅ `backend/app/schemas/foro.py`
- ✅ `backend/app/schemas/preferencia.py`
- ✅ `backend/app/schemas/regla_acreditacion.py`
- ✅ `backend/app/schemas/rol.py`
- ✅ `backend/app/schemas/guia_estudio.py`
- ✅ `backend/app/schemas/evaluacion.py` (schemas básicos existentes)

**Notas de implementación**:
- Todos los schemas siguen el patrón Base → Create/Update → Response
- Se incluyen forward references para evitar dependencias circulares
- Los schemas de progreso están listos para calcular estadísticas y comparaciones
- `PreguntaConOpciones` incluye el campo `es_correcta` en opciones para identificar respuestas correctas
- Los schemas están exportados correctamente en `__init__.py`

---

### ✅ Fase 4: Endpoints Core - Usuarios, Módulos y Cursos

**Estado**: Completado

**Objetivos**:
- Endpoints para gestión de usuarios
- Endpoints para listar y obtener módulos
- Endpoints para listar y obtener cursos (materias)
- Endpoints para guías de estudio

**Tareas completadas**:

1. ✅ Crear `backend/app/routes/usuarios.py`
   - `GET /api/usuarios/me` - Obtener perfil del usuario autenticado
   - `GET /api/usuarios/perfil` - Obtener perfil (alias para compatibilidad con frontend)
   - `GET /api/usuarios/{usuario_id}` - Obtener usuario (admin/coordinador)
   - `PUT /api/usuarios/me` - Actualizar perfil propio
   - `PUT /api/usuarios/perfil` - Actualizar perfil (alias para compatibilidad con frontend)
   - `GET /api/usuarios` - Listar usuarios (admin)

2. ✅ Crear `backend/app/routes/modulos.py`
   - `GET /api/modulos` - Listar módulos públicos (con filtro opcional por publicado)
   - `GET /api/modulos/{modulo_id}` - Obtener módulo con sus cursos
   - `GET /api/modulos/{modulo_id}/cursos` - Listar cursos del módulo
   - `POST /api/modulos` - Crear módulo (admin)
   - `PUT /api/modulos/{modulo_id}` - Actualizar módulo (admin)

3. ✅ Crear `backend/app/routes/cursos.py`
   - `GET /api/cursos` - Listar cursos (materias) públicos (con filtros opcionales)
   - `GET /api/cursos/{curso_id}` - Obtener curso con detalles (guías de estudio, examen final)
   - `GET /api/cursos/{curso_id}/guias-estudio` - Obtener guías de estudio (con URLs prefirmadas S3)
   - `POST /api/cursos` - Crear curso (admin)
   - `PUT /api/cursos/{curso_id}` - Actualizar curso (admin)

4. ✅ Crear servicios:
   - `backend/app/services/usuario_service.py` - Operaciones CRUD de usuarios
   - `backend/app/services/modulo_service.py` - Operaciones CRUD de módulos y relación con cursos
   - `backend/app/services/curso_service.py` - Operaciones CRUD de cursos y guías de estudio

**Archivos creados**:
- ✅ `backend/app/routes/usuarios.py`
- ✅ `backend/app/routes/modulos.py`
- ✅ `backend/app/routes/cursos.py`
- ✅ `backend/app/services/usuario_service.py`
- ✅ `backend/app/services/modulo_service.py`
- ✅ `backend/app/services/curso_service.py`

**Notas de implementación**:
- Todos los routers están registrados en `main.py` con prefijo `/api`
- El endpoint de guías de estudio genera URLs prefirmadas de S3 automáticamente cuando la URL es una clave S3
- Se agregaron endpoints `/usuarios/perfil` como alias de `/usuarios/me` para compatibilidad con el frontend
- Los servicios implementan filtrado a nivel de base de datos para mejor rendimiento

---

### ✅ Fase 5: Endpoints de Contenido - Lecciones

**Estado**: Completado

**Objetivos**:
- Endpoints para listar y obtener lecciones
- Endpoints para contenido de lecciones
- Validación de acceso según inscripción

**Tareas completadas**:

1. ✅ Crear `backend/app/routes/lecciones.py`
   - ✅ `GET /api/modulos/{modulo_id}/lecciones` - Listar lecciones del módulo (implementado en `modulos.py`)
   - ✅ `GET /api/lecciones/{leccion_id}` - Obtener lección con contenido
   - ✅ `GET /api/lecciones/{leccion_id}/contenido` - Obtener contenido de lección
   - ✅ `POST /api/lecciones` - Crear lección (admin)
   - ✅ `PUT /api/lecciones/{leccion_id}` - Actualizar lección (admin)

2. ✅ Crear servicio:
   - ✅ `backend/app/services/leccion_service.py`
   - ✅ Validar que usuario esté inscrito en curso del módulo (`validate_usuario_inscrito_en_modulo`)
   - ✅ Validar fechas del módulo (contenido disponible) (`validate_modulo_fechas`)
   - ✅ Validación completa de acceso (`validate_acceso_leccion`)

**Archivos creados**:
- ✅ `backend/app/routes/lecciones.py`
- ✅ `backend/app/services/leccion_service.py`
- ✅ `backend/app/schemas/leccion.py` (actualizado con `LeccionCreate`, `LeccionUpdate`, `LeccionDetailResponse`)

**Notas de implementación**:
- El endpoint `GET /api/modulos/{modulo_id}/lecciones` está implementado en `modulos.py` para mantener la coherencia con la estructura de rutas
- Las validaciones incluyen: verificación de inscripción, fechas del módulo, y estado de publicación
- Los administradores tienen acceso completo sin restricciones
- Los usuarios no inscritos solo ven lecciones publicadas
- El router está registrado en `main.py` con prefijo `/api`

---

### ✅ Fase 6: Endpoints de Evaluación - Quizzes y Exámenes Finales

**Estado**: Completado

**Objetivos**:
- Endpoints para obtener quizzes
- Endpoints para obtener exámenes finales
- Endpoints para iniciar y enviar intentos
- Cálculo de puntajes y resultados

**Tareas completadas**:

1. ✅ Crear `backend/app/routes/quizzes.py`
   - ✅ `GET /api/lecciones/{leccion_id}/quiz` - Obtener quiz de lección (implementado en `lecciones.py`)
   - ✅ `GET /api/quizzes/{quiz_id}` - Obtener quiz con preguntas y opciones
   - ✅ `POST /api/quizzes/{quiz_id}/iniciar` - Iniciar intento de quiz
   - ✅ `POST /api/quizzes/{quiz_id}/enviar` - Enviar respuestas del quiz
   - ✅ `GET /api/quizzes/{quiz_id}/intentos` - Obtener historial de intentos

2. ✅ Crear `backend/app/routes/examenes_finales.py`
   - ✅ `GET /api/cursos/{curso_id}/examen-final` - Obtener examen final del curso (implementado en `cursos.py`)
   - ✅ `GET /api/examenes-finales/{examen_final_id}` - Obtener examen con preguntas y opciones
   - ✅ `POST /api/examenes-finales/{examen_final_id}/iniciar` - Iniciar intento
   - ✅ `POST /api/examenes-finales/{examen_final_id}/enviar` - Enviar respuestas
   - ✅ `GET /api/examenes-finales/{examen_final_id}/intentos` - Historial de intentos

3. ✅ Crear servicios:
   - ✅ `backend/app/services/quiz_service.py`
     - ✅ Validar máximo intentos (usar `regla_acreditacion.max_intentos_quiz`)
     - ✅ Calcular puntaje según tipo de pregunta (usando vista `respuesta_con_evaluacion`)
     - ✅ Determinar si aprobó (usar `min_score_aprobatorio` de regla)
     - ✅ Crear `IntentoPregunta` para cada pregunta al iniciar intento
   - ✅ `backend/app/services/examen_final_service.py`
     - ✅ Validar que todos los quizzes estén aprobados (`validate_quizzes_aprobados`)
     - ✅ Validar máximo intentos (usar `regla_acreditacion`)
     - ✅ Calcular puntaje según tipo de pregunta
     - ✅ Determinar si aprobó (usar `min_score_aprobatorio`)

4. ✅ Lógica de cálculo implementada:
   - ✅ Opción múltiple: puntos si es correcta, penalización si `penaliza_error = TRUE` (calculado en vista `respuesta_con_evaluacion`)
   - ✅ Verdadero/Falso: comparar con `vf_respuesta_correcta`, penalización si está configurada (calculado en vista)
   - ✅ Pregunta abierta: requiere evaluación manual (puntos = NULL en vista)

**Archivos creados**:
- ✅ `backend/app/routes/quizzes.py`
- ✅ `backend/app/routes/examenes_finales.py`
- ✅ `backend/app/services/quiz_service.py`
- ✅ `backend/app/services/examen_final_service.py`
- ✅ `backend/app/schemas/intento.py` (actualizado con `IntentoSubmission`, `IntentoResult`, `RespuestaCreate`, `RespuestaResponse`)

**Notas de implementación**:
- El cálculo de puntajes usa la vista `respuesta_con_evaluacion` que calcula automáticamente `es_correcta` y `puntos_otorgados` según el tipo de pregunta
- La validación de máximo intentos se hace tanto en el servicio (para feedback temprano) como en el trigger de BD (garantía de integridad)
- La validación de prerrequisitos para examen final verifica que todos los quizzes de las lecciones del curso estén aprobados
- Los servicios crean automáticamente `IntentoPregunta` para cada pregunta al iniciar un intento
- El endpoint `GET /api/cursos/{curso_id}/examen-final` está implementado en `cursos.py` para mantener coherencia con la estructura de rutas
- Los routers están registrados en `main.py` con prefijo `/api`

---

### ✅ Fase 7: Endpoints de Inscripción y Progreso

**Estado**: Completado

**Objetivos**:
- ✅ Endpoints para inscribirse a cursos
- ✅ Endpoints para consultar progreso
- ✅ Endpoints para comparar progreso con otros estudiantes

**Tareas**:

1. ✅ Crear `backend/app/routes/inscripciones.py`
   - ✅ `POST /api/inscripciones` - Inscribirse a un curso
   - ✅ `GET /api/inscripciones` - Listar inscripciones del usuario
   - ✅ `GET /api/inscripciones/{inscripcion_id}` - Obtener detalles de inscripción
   - ✅ `PUT /api/inscripciones/{inscripcion_id}/pausar` - Pausar inscripción
   - ✅ `PUT /api/inscripciones/{inscripcion_id}/reanudar` - Reanudar inscripción

2. ✅ Crear `backend/app/routes/progreso.py`
   - ✅ `GET /api/progreso` - Progreso general del usuario
   - ✅ `GET /api/progreso/cursos/{curso_id}` - Progreso en curso específico
   - ✅ `GET /api/progreso/modulos/{modulo_id}` - Progreso en módulo
   - ✅ `GET /api/progreso/cursos/{curso_id}/comparacion` - Comparar con otros estudiantes

3. ✅ Crear servicios:
   - ✅ `backend/app/services/inscripcion_service.py`
     - ✅ Validar que curso esté disponible
     - ✅ Crear inscripción con estado ACTIVA
     - ✅ Validar transiciones de estado (usar triggers de BD)
   - ✅ `backend/app/services/progreso_service.py`
     - ✅ Calcular progreso basado en lecciones completadas
     - ✅ Calcular progreso basado en quizzes aprobados
     - ✅ Usar vista `inscripcion_modulo_calculada` para módulos

**Archivos creados**:
- ✅ `backend/app/routes/inscripciones.py`
- ✅ `backend/app/routes/progreso.py`
- ✅ `backend/app/services/inscripcion_service.py`
- ✅ `backend/app/services/progreso_service.py`

**Archivos modificados**:
- ✅ `backend/app/schemas/inscripcion.py` - Agregados schemas `InscripcionCreate` y `InscripcionUpdate`
- ✅ `backend/app/main.py` - Registrados routers de inscripciones y progreso

**Notas de implementación**:
- Los servicios de inscripción validan disponibilidad del curso y evitan duplicados
- Las transiciones de estado se validan mediante triggers de BD (validar_transicion_estado_inscripcion)
- El cálculo de progreso considera lecciones completadas (basado en quizzes aprobados), quizzes aprobados, y examen final
- La vista `inscripcion_modulo_calculada` se utiliza para calcular el progreso a nivel de módulo
- El servicio de progreso incluye comparación con otros estudiantes del mismo curso
- Todos los endpoints requieren autenticación JWT

---

### 🔄 Fase 8: Endpoints de Certificados

**Estado**: Pendiente

**Objetivos**:
- Endpoints para obtener certificados
- Endpoints para descargar certificados
- Generación automática de certificados al acreditar

**Tareas**:

1. Crear `backend/app/routes/certificados.py`
   - `GET /api/certificados` - Listar certificados del usuario
   - `GET /api/certificados/inscripciones/{inscripcion_id}` - Obtener certificado de inscripción
   - `GET /api/certificados/{certificado_id}/descargar` - Descargar certificado (PDF desde S3)
   - `GET /api/certificados/{certificado_id}/verificar` - Verificar certificado por hash

2. Integrar con servicio de certificados:
   - Generar certificado cuando `inscripcion_curso.acreditado = TRUE`
   - Usar trigger de BD o lógica en servicio
   - Subir PDF a S3
   - Guardar registro en tabla `certificado`

3. Mejorar `backend/app/services/certificate_service.py`:
   - Generar PDF con datos del usuario y curso
   - Incluir folio y hash de verificación
   - Template profesional del certificado

**Archivos a crear**:
- `backend/app/routes/certificados.py`
- Actualizar `backend/app/services/certificate_service.py`

---

### ✅ Fase 9: Endpoints de Interacción - Foro y Preferencias

**Estado**: Completado

**Objetivos**:
- ✅ Endpoints para comentarios en foro
- ✅ Endpoints para preferencias de notificaciones

**Tareas**:

1. ✅ Crear `backend/app/routes/foro.py`
   - ✅ `GET /api/foro/cursos/{curso_id}/lecciones/{leccion_id}/comentarios` - Listar comentarios
   - ✅ `POST /api/foro/cursos/{curso_id}/lecciones/{leccion_id}/comentarios` - Crear comentario
   - ✅ `PUT /api/foro/comentarios/{comentario_id}` - Actualizar comentario propio
   - ✅ `DELETE /api/foro/comentarios/{comentario_id}` - Eliminar comentario propio

2. ✅ Crear `backend/app/routes/preferencias.py`
   - ✅ `GET /api/preferencias` - Obtener preferencias del usuario
   - ✅ `PUT /api/preferencias` - Actualizar preferencias

3. ✅ Crear servicios:
   - ✅ `backend/app/services/foro_service.py`
     - ✅ Validar que usuario esté inscrito en curso
     - ✅ Validar que lección pertenezca al curso
     - ✅ Validar autorización para editar/eliminar comentarios
   - ✅ `backend/app/services/preferencia_service.py`
     - ✅ Crear preferencias automáticamente si no existen

**Archivos creados**:
- ✅ `backend/app/routes/foro.py`
- ✅ `backend/app/routes/preferencias.py`
- ✅ `backend/app/services/foro_service.py`
- ✅ `backend/app/services/preferencia_service.py`

**Archivos modificados**:
- ✅ `backend/app/schemas/foro.py` - Agregados schemas `ForoComentarioCreate` y `ForoComentarioUpdate`
- ✅ `backend/app/schemas/preferencia.py` - Agregados schemas `PreferenciaNotificacionCreate` y `PreferenciaNotificacionUpdate`
- ✅ `backend/app/main.py` - Registrados routers de foro y preferencias

**Notas de implementación**:
- El servicio de foro valida que el usuario esté inscrito en el curso antes de permitir comentarios
- Se valida que la lección pertenezca al curso especificado
- Los usuarios solo pueden editar/eliminar sus propios comentarios (admins pueden eliminar cualquier comentario)
- El servicio de preferencias crea automáticamente el registro si no existe al obtener o actualizar
- Todos los endpoints requieren autenticación JWT

---

### 🔄 Fase 10: Integración RLS y Seguridad

**Estado**: Pendiente

**Objetivos**:
- Integrar RLS con autenticación Cognito
- Configurar contexto de usuario en sesiones de BD
- Validar políticas RLS en aplicación

**Tareas**:

1. Crear `backend/app/database/rls.py`
   - Función `set_current_cognito_user_id(db: Session, cognito_user_id: str)` para establecer variable de sesión
   - Función `clear_current_cognito_user_id(db: Session)` para limpiar variable de sesión
   - Integrar con `get_current_user()` de auth para obtener `cognito_user_id` del JWT

2. Actualizar `backend/app/database/session.py`
   - Modificar `get_db()` dependency para establecer `app.current_cognito_user_id` automáticamente
   - Ejecutar `SET app.current_cognito_user_id = 'cognito_user_id'` al crear sesión
   - Obtener `cognito_user_id` del token JWT en el contexto de la request
   - Limpiar variable de sesión al cerrar (evento `on_exit` del dependency)

3. Actualizar endpoints para usar RLS:
   - Remover filtros manuales de `usuario_id` donde RLS ya los aplica automáticamente
   - Los queries automáticamente filtrarán según políticas RLS
   - Para contenido público, RLS permite acceso si `publicado = TRUE`
   - Los admins tienen acceso completo automáticamente

4. Validar políticas RLS:
   - Usuarios solo ven sus propios datos (inscripciones, intentos, certificados, preferencias)
   - Contenido público visible para todos si `publicado = TRUE` (curso, modulo, leccion, quiz, examen_final)
   - Administradores tienen acceso completo (función `is_admin()`)
   - Foro: usuarios ven comentarios de materias donde están inscritos

5. Testing de seguridad:
   - Verificar que usuarios no pueden acceder a datos de otros
   - Verificar que RLS funciona correctamente en queries SQLAlchemy
   - Probar acceso a contenido público vs privado
   - Verificar que admins tienen acceso completo

**Archivos a crear**:
- `backend/app/database/rls.py`
- Actualizar `backend/app/database/session.py`

**Notas de implementación**:
- Variable de sesión: `SET app.current_cognito_user_id = 'cognito_user_id_from_jwt'`
- La función `get_current_user_id()` de BD obtiene `usuario_id` desde esta variable
- La función `is_admin()` verifica rol ADMIN del usuario actual
- RLS se aplica automáticamente a nivel de base de datos, no requiere código adicional en queries

---

### 🔄 Fase 11: Endpoints de Administración

**Estado**: Pendiente

**Objetivos**:
- Endpoints para gestión administrativa
- Endpoints para reglas de acreditación
- Endpoints para permitir nuevos intentos

**Tareas**:

1. Crear `backend/app/routes/admin.py`
   - `GET /api/admin/usuarios` - Listar todos los usuarios
   - `PUT /api/admin/usuarios/{usuario_id}/roles` - Asignar roles
   - `GET /api/admin/inscripciones` - Listar todas las inscripciones
   - `PUT /api/admin/inscripciones/{inscripcion_id}/estado` - Cambiar estado
   - `GET /api/admin/intentos` - Listar intentos
   - `PUT /api/admin/intentos/{intento_id}/permitir-nuevo` - Permitir nuevo intento
   - `GET /api/admin/reglas-acreditacion` - Listar reglas
   - `POST /api/admin/reglas-acreditacion` - Crear regla
   - `PUT /api/admin/reglas-acreditacion/{regla_id}` - Actualizar regla

2. Crear servicios:
   - `backend/app/services/admin_service.py`
   - `backend/app/services/regla_acreditacion_service.py`

**Archivos a crear**:
- `backend/app/routes/admin.py`
- `backend/app/services/admin_service.py`
- `backend/app/services/regla_acreditacion_service.py`

---

### 🔄 Fase 12: Tests y Optimización

**Estado**: Pendiente

**Objetivos**:
- Tests unitarios de servicios
- Tests de integración de endpoints
- Optimización de queries
- Documentación de API

**Tareas**:

1. Tests unitarios:
   - `tests/test_services/test_quiz_service.py`
   - `tests/test_services/test_examen_final_service.py`
   - `tests/test_services/test_certificate_service.py`
   - `tests/test_utils/test_auth.py`
   - `tests/test_utils/test_roles.py`

2. Tests de integración:
   - `tests/test_routes/test_quizzes.py`
   - `tests/test_routes/test_inscripciones.py`
   - `tests/test_routes/test_certificados.py`

3. Optimización:
   - Revisar queries N+1
   - Agregar eager loading donde sea necesario
   - Optimizar índices si es necesario

4. Documentación:
   - Completar docstrings en todos los endpoints
   - Agregar ejemplos en schemas
   - Documentar reglas de negocio

**Archivos a crear**:
- `tests/__init__.py`
- `tests/conftest.py` (fixtures)
- `tests/test_services/`
- `tests/test_routes/`
- `tests/test_utils/`

---

## Reglas de Negocio Críticas

### Evaluaciones
- **RF-01**: Quizzes asociados a lecciones, exámenes finales asociados a materias (curso)
- **RF-03**: Calificación mínima del 80% para aprobar (default, configurable en `regla_acreditacion.min_score_aprobatorio`)
- **RF-03**: Máximo de 3 intentos por quiz/examen (default, configurable en `regla_acreditacion.max_intentos_quiz`)
  - Validado por trigger `validar_max_intentos()` antes de INSERT
- **RF-11**: Permitir recursamiento solo si `permitir_nuevo_intento = TRUE` en último intento
  - Validado por trigger `validar_nuevo_intento_permitido()` antes de INSERT
- Validación de tipos de respuesta según tipo de pregunta (trigger `validar_respuesta_tipo()`)
  - ABIERTA → requiere `respuesta_texto`
  - OPCION_MULTIPLE → requiere `opcion_id`
  - VERDADERO_FALSO → requiere `respuesta_bool`

### Acreditación
- **RF-04**: Generación automática de certificado al acreditar (implementar en aplicación)
- Acreditación requiere examen final aprobado con score >= `min_score_aprobatorio`
  - Validado por trigger `validar_acreditacion_curso()` antes de INSERT/UPDATE
  - Al marcar `acreditado = TRUE`, el trigger:
    - Verifica que existe intento aprobado del examen final con puntaje suficiente
    - Actualiza estado a CONCLUIDA automáticamente
    - Establece `acreditado_en` si es NULL
- Todos los quizzes de lecciones de la materia deben estar aprobados antes del examen final
  - Validado por trigger `validar_examen_final_prerequisitos()` antes de INSERT en intento

### Inscripciones
- Un usuario solo puede tener una inscripción por materia/curso (UNIQUE `usuario_id, curso_id`)
- Estados válidos: ACTIVA → PAUSADA → CONCLUIDA/REPROBADA
  - Validado por trigger `validar_transicion_estado_inscripcion()` en UPDATE
- Una inscripción CONCLUIDA no puede cambiar de estado
- Una inscripción REPROBADA solo puede mantenerse o concluirse
- El trigger actualiza `fecha_conclusion` automáticamente al concluir/reprobar
- Validación de que quiz/examen pertenezca a la materia de la inscripción (trigger `validar_intento_inscripcion()`)

### Estructura de Contenido
- Las lecciones pertenecen al **módulo**, no directamente al curso/materia
- Las lecciones se asocian a materias a través de `modulo_curso` (relación módulo → materia)
- Las fechas del módulo (`fecha_inicio`, `fecha_fin`) controlan cuándo el contenido está disponible
- Las lecciones NO tienen fechas propias
- Una inscripción es a una **materia (curso)**, no a un módulo completo
- El progreso a nivel de módulo se calcula en la vista `inscripcion_modulo_calculada`

### Seguridad
- **RF-12**: Validar roles (estudiante, coordinador, admin) en endpoints protegidos
- RLS aplicado a nivel de base de datos en todas las tablas
- Usuarios solo ven sus propios datos (excepto contenido público con `publicado = TRUE`)
- RLS usa variable de sesión `app.current_cognito_user_id` para identificar usuario
- Función `get_current_user_id()` obtiene `usuario_id` desde `cognito_user_id`
- Función `is_admin()` verifica si el usuario tiene rol ADMIN

---

## Estructura Final del Proyecto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── database/
│   │   ├── __init__.py
│   │   ├── session.py
│   │   ├── models.py
│   │   ├── enums.py
│   │   └── rls.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth_routes.py
│   │   ├── usuarios.py
│   │   ├── modulos.py
│   │   ├── cursos.py
│   │   ├── lecciones.py
│   │   ├── quizzes.py
│   │   ├── examenes_finales.py
│   │   ├── inscripciones.py
│   │   ├── progreso.py
│   │   ├── certificados.py
│   │   ├── foro.py
│   │   ├── preferencias.py
│   │   └── admin.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── usuario.py
│   │   ├── curso.py
│   │   ├── modulo.py
│   │   ├── leccion.py
│   │   ├── quiz.py
│   │   ├── examen_final.py
│   │   ├── inscripcion.py
│   │   ├── intento.py
│   │   ├── certificado.py
│   │   ├── progress.py
│   │   └── foro.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── s3_service.py
│   │   ├── certificate_service.py
│   │   ├── usuario_service.py
│   │   ├── modulo_service.py
│   │   ├── curso_service.py
│   │   ├── leccion_service.py
│   │   ├── quiz_service.py
│   │   ├── examen_final_service.py
│   │   ├── inscripcion_service.py
│   │   ├── progreso_service.py
│   │   ├── foro_service.py
│   │   ├── preferencia_service.py
│   │   ├── admin_service.py
│   │   └── regla_acreditacion_service.py
│   └── utils/
│       ├── __init__.py
│       ├── jwt_auth.py
│       ├── roles.py
│       ├── exceptions.py
│       ├── validators.py
│       └── helpers.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_services/
│   ├── test_routes/
│   └── test_utils/
├── alembic/
│   ├── versions/
│   ├── env.py
│   └── script.py.mako
├── Dockerfile
├── requirements.txt
└── alembic.ini
```

---

## Próximos Pasos Inmediatos

1. ✅ **Fase 1**: Autenticación y Servicios Externos - **COMPLETADO**
2. ✅ **Fase 2**: Modelos SQLAlchemy y conexión a BD - **COMPLETADO**
3. ✅ **Fase 3**: Crear schemas Pydantic basados en modelos - **COMPLETADO**
4. ✅ **Fase 4**: Implementar endpoints core (usuarios, módulos, cursos) - **COMPLETADO**
5. ✅ **Fase 5**: Implementar endpoints de contenido (lecciones) - **COMPLETADO**
6. ✅ **Fase 6**: Implementar endpoints de evaluación (quizzes y exámenes finales) - **COMPLETADO**
7. ✅ **Fase 7**: Implementar endpoints de inscripción y progreso - **COMPLETADO**
8. ✅ **Fase 9**: Implementar endpoints de interacción (foro y preferencias) - **COMPLETADO**

---

## Notas de Implementación

### Integración con Triggers de BD
- Los triggers de BD validan reglas de negocio automáticamente en el servidor
- La aplicación debe manejar errores de triggers (excepciones de PostgreSQL)
  - Errores comunes: máximo intentos alcanzado, prerrequisitos no cumplidos, transiciones de estado inválidas
- No duplicar validaciones en aplicación si ya están en triggers
  - Los triggers validan: máximo intentos, prerrequisitos examen final, transiciones estado, acreditación, tipos de respuesta
- Algunos triggers actualizan campos automáticamente:
  - `validar_transicion_estado_inscripcion()`: actualiza `fecha_conclusion` al concluir/reprobar
  - `validar_acreditacion_curso()`: actualiza `estado` a CONCLUIDA y establece `acreditado_en` al acreditar

### Integración con RLS
- RLS se aplica automáticamente en queries de SQLAlchemy
- **CRÍTICO**: Establecer `app.current_cognito_user_id` antes de cada query
  - Variable de sesión: `SET app.current_cognito_user_id = 'cognito_user_id_from_jwt'`
  - Establecer en middleware o dependency antes de operaciones de BD
  - Ver Fase 10 para implementación completa
- Las políticas RLS están definidas en `rls.init.sql`
- Funciones helper disponibles:
  - `get_current_user_id()`: Obtiene `usuario_id` desde `app.current_cognito_user_id`
  - `is_admin()`: Verifica si usuario tiene rol ADMIN
- Tablas con políticas públicas: curso, modulo, leccion, quiz, examen_final (si `publicado = TRUE`)
- Tablas con políticas propias: usuario, inscripcion_curso, intento, certificado, foro_comentario, preferencia_notificacion
- Tablas solo admin: rol, usuario_rol, regla_acreditacion, pregunta, opcion, pregunta_config, etc.

### Estructura de Datos
- **Curso = Materia**: La tabla `curso` representa una "Materia" en el modelo de negocio
- **Lecciones**: Pertenecen al **módulo**, no directamente al curso/materia
- **Asociación Lección-Materia**: A través de `modulo_curso` (módulo contiene materias, lección pertenece a módulo)
- **Inscripciones**: Se hacen a una materia (curso), no a un módulo completo
- **Progreso Módulo**: Se calcula en vista `inscripcion_modulo_calculada` basado en inscripciones de materias

### Vistas y Cálculos
- Usar vista `inscripcion_modulo_calculada` para progreso a nivel de módulo
- Usar vista `respuesta_con_evaluacion` para obtener `es_correcta` y `puntos_otorgados` calculados
- Las vistas `quiz_con_preguntas` y `examen_final_con_preguntas` incluyen conteo de preguntas

### Manejo de UUIDs
- Todos los IDs son UUID (excepto algunos campos calculados)
- Usar `uuid.UUID` en Python, `UUID` en SQLAlchemy
- Validar formato UUID en schemas Pydantic

### Fechas y Zonas Horarias
- Todas las fechas en BD son `TIMESTAMPTZ` (timestamp with timezone)
- Fechas de módulo son `DATE` (solo fecha, sin hora)
- Usar `datetime` con timezone en Python
- Convertir a UTC antes de guardar en BD
- Las fechas del módulo controlan disponibilidad del contenido

### Índices y Optimización
- Índices creados en claves foráneas, columnas de filtrado (`publicado`, `estado`, `resultado`)
- Índices compuestos para consultas comunes (usuario+estado, curso+estado, etc.)
- Índices GIN para búsqueda de texto completo (usando `pg_trgm`)
- Índices parciales en columnas booleanas (`WHERE publicado = TRUE`)
- Restricciones UNIQUE parciales (ej: solo un certificado válido por inscripción)
