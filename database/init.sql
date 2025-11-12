-- =====================================================
-- Extensiones
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- Tipos ENUM
-- =====================================================

CREATE TYPE estado_publicacion AS ENUM ('PUBLICADO', 'NO_PUBLICADO');
CREATE TYPE tipo_contenido AS ENUM ('TEXTO', 'PDF', 'VIDEO', 'LINK');
CREATE TYPE estado_inscripcion AS ENUM ('ACTIVA', 'PAUSADA', 'CONCLUIDA', 'REPROBADA');
CREATE TYPE resultado_intento AS ENUM ('APROBADO', 'NO_APROBADO');
CREATE TYPE tipo_pregunta AS ENUM ('ABIERTA', 'OPCION_MULTIPLE', 'VERDADERO_FALSO');
CREATE TYPE estado_entrega AS ENUM ('PENDIENTE', 'ENTREGADA', 'CALIFICADA');

-- =====================================================
-- Tablas de Usuarios y Acceso
-- =====================================================

CREATE TABLE usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(120) NOT NULL,
  apellido VARCHAR(120) NOT NULL,
  email VARCHAR(190) UNIQUE NOT NULL,
  avatar_url VARCHAR(500),
  cognito_user_id VARCHAR(255) UNIQUE,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rol (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(50) NOT NULL UNIQUE,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuario_rol (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE ON UPDATE CASCADE,
  rol_id UUID NOT NULL REFERENCES rol(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  asignado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (usuario_id, rol_id)
);

-- =====================================================
-- Tablas de Contenido: Módulo y Materias
-- =====================================================

CREATE TABLE curso (
  id UUID PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  publicado BOOLEAN,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE modulo (
  id UUID PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  publicado BOOLEAN,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_fechas_modulo CHECK (fecha_fin >= fecha_inicio)
);

CREATE TABLE modulo_curso (
  id UUID PRIMARY KEY,
  modulo_id UUID NOT NULL REFERENCES modulo(id) ON DELETE CASCADE ON UPDATE CASCADE,
  curso_id UUID NOT NULL REFERENCES curso(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  slot INT NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (modulo_id, slot),
  UNIQUE (modulo_id, curso_id)
);

CREATE TABLE guia_estudio (
  id UUID PRIMARY KEY,
  curso_id UUID NOT NULL REFERENCES curso(id) ON DELETE CASCADE ON UPDATE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  url VARCHAR(500),
  activo BOOLEAN,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leccion (
  id UUID PRIMARY KEY,
  modulo_id UUID NOT NULL REFERENCES modulo(id) ON DELETE CASCADE ON UPDATE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  orden INT,
  publicado BOOLEAN,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leccion_contenido (
  id UUID PRIMARY KEY,
  leccion_id UUID NOT NULL REFERENCES leccion(id) ON DELETE CASCADE ON UPDATE CASCADE,
  tipo tipo_contenido NOT NULL,
  titulo VARCHAR(200),
  descripcion TEXT,
  url VARCHAR(500),
  orden INT,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Tablas de Evaluaciones
-- =====================================================

CREATE TABLE quiz (
  id UUID PRIMARY KEY,
  leccion_id UUID NOT NULL REFERENCES leccion(id) ON DELETE CASCADE ON UPDATE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  publicado BOOLEAN,
  aleatorio BOOLEAN,
  guarda_calificacion BOOLEAN,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE examen_final (
  id UUID PRIMARY KEY,
  curso_id UUID NOT NULL REFERENCES curso(id) ON DELETE CASCADE ON UPDATE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  publicado BOOLEAN,
  aleatorio BOOLEAN,
  guarda_calificacion BOOLEAN,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pregunta (
  id UUID PRIMARY KEY,
  quiz_id UUID REFERENCES quiz(id) ON DELETE CASCADE ON UPDATE CASCADE,
  examen_final_id UUID REFERENCES examen_final(id) ON DELETE CASCADE ON UPDATE CASCADE,
  enunciado TEXT NOT NULL,
  puntos INT,
  orden INT,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_pregunta_quiz_o_examen CHECK (
    (quiz_id IS NOT NULL AND examen_final_id IS NULL) OR
    (quiz_id IS NULL AND examen_final_id IS NOT NULL)
  )
);

CREATE TABLE pregunta_config (
  pregunta_id UUID PRIMARY KEY REFERENCES pregunta(id) ON DELETE CASCADE ON UPDATE CASCADE,
  tipo tipo_pregunta NOT NULL,
  abierta_modelo_respuesta TEXT,
  om_seleccion_multiple BOOLEAN,
  om_min_selecciones INT,
  om_max_selecciones INT,
  vf_respuesta_correcta BOOLEAN,
  penaliza_error BOOLEAN,
  puntos_por_opcion INT,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_abierta_config CHECK (
    (tipo = 'ABIERTA' AND abierta_modelo_respuesta IS NOT NULL) OR
    (tipo != 'ABIERTA')
  ),
  CONSTRAINT chk_vf_config CHECK (
    (tipo = 'VERDADERO_FALSO' AND vf_respuesta_correcta IS NOT NULL) OR
    (tipo != 'VERDADERO_FALSO')
  ),
  CONSTRAINT chk_om_config CHECK (
    (tipo = 'OPCION_MULTIPLE' AND om_min_selecciones IS NOT NULL AND om_max_selecciones IS NOT NULL) OR
    (tipo != 'OPCION_MULTIPLE')
  ),
  CONSTRAINT chk_om_min_max CHECK (
    om_min_selecciones IS NULL OR om_max_selecciones IS NULL OR om_min_selecciones <= om_max_selecciones
  )
);

CREATE TABLE opcion (
  id UUID PRIMARY KEY,
  pregunta_id UUID NOT NULL REFERENCES pregunta(id) ON DELETE CASCADE ON UPDATE CASCADE,
  texto VARCHAR(500) NOT NULL,
  es_correcta BOOLEAN,
  orden INT,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tarea (
  id UUID PRIMARY KEY,
  curso_id UUID NOT NULL REFERENCES curso(id) ON DELETE CASCADE ON UPDATE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  fecha_limite TIMESTAMPTZ,
  publicado BOOLEAN,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE entrega (
  id UUID PRIMARY KEY,
  tarea_id UUID NOT NULL REFERENCES tarea(id) ON DELETE CASCADE ON UPDATE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE ON UPDATE CASCADE,
  estado estado_entrega NOT NULL DEFAULT 'PENDIENTE',
  calificacion NUMERIC(5,2),
  entregado_en TIMESTAMPTZ,
  calificado_en TIMESTAMPTZ,
  permitir_nuevo_intento BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Tablas de Inscripción y Progreso
-- =====================================================

CREATE TABLE inscripcion_curso (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE ON UPDATE CASCADE,
  curso_id UUID NOT NULL REFERENCES curso(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  estado estado_inscripcion NOT NULL DEFAULT 'ACTIVA',
  acreditado BOOLEAN NOT NULL DEFAULT FALSE,
  acreditado_en TIMESTAMPTZ,
  fecha_inscripcion DATE NOT NULL,
  fecha_conclusion DATE,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (usuario_id, curso_id),
  CONSTRAINT chk_fechas_inscripcion CHECK (fecha_conclusion IS NULL OR fecha_conclusion >= fecha_inscripcion)
);

CREATE TABLE intento (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE NO ACTION ON UPDATE CASCADE,
  quiz_id UUID REFERENCES quiz(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  examen_final_id UUID REFERENCES examen_final(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  inscripcion_curso_id UUID NOT NULL REFERENCES inscripcion_curso(id) ON DELETE CASCADE ON UPDATE CASCADE,
  numero_intento INT NOT NULL,
  puntaje NUMERIC(5,2),
  resultado resultado_intento,
  iniciado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  finalizado_en TIMESTAMPTZ,
  permitir_nuevo_intento BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_intento_quiz_o_examen CHECK (
    (quiz_id IS NOT NULL AND examen_final_id IS NULL) OR
    (quiz_id IS NULL AND examen_final_id IS NOT NULL)
  )
);

CREATE TABLE intento_pregunta (
  id UUID PRIMARY KEY,
  intento_id UUID NOT NULL REFERENCES intento(id) ON DELETE CASCADE ON UPDATE CASCADE,
  pregunta_id UUID NOT NULL REFERENCES pregunta(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  puntos_maximos INT,
  orden INT,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (intento_id, pregunta_id)
);

CREATE TABLE respuesta (
  id UUID PRIMARY KEY,
  intento_pregunta_id UUID NOT NULL REFERENCES intento_pregunta(id) ON DELETE CASCADE ON UPDATE CASCADE,
  respuesta_texto TEXT,
  opcion_id UUID REFERENCES opcion(id) ON DELETE SET NULL ON UPDATE CASCADE,
  respuesta_bool BOOLEAN,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE regla_acreditacion (
  id UUID PRIMARY KEY,
  curso_id UUID NOT NULL REFERENCES curso(id) ON DELETE CASCADE ON UPDATE CASCADE,
  quiz_id UUID REFERENCES quiz(id) ON DELETE CASCADE ON UPDATE CASCADE,
  examen_final_id UUID REFERENCES examen_final(id) ON DELETE CASCADE ON UPDATE CASCADE,
  min_score_aprobatorio NUMERIC(5,2) NOT NULL DEFAULT 80.00,
  max_intentos_quiz INT NOT NULL DEFAULT 3,
  bloquea_curso_por_reprobacion_quiz BOOLEAN NOT NULL DEFAULT TRUE,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_regla_quiz_o_examen CHECK (
    (quiz_id IS NOT NULL AND examen_final_id IS NULL) OR
    (quiz_id IS NULL AND examen_final_id IS NOT NULL) OR
    (quiz_id IS NULL AND examen_final_id IS NULL)
  )
);

CREATE TABLE certificado (
  id UUID PRIMARY KEY,
  inscripcion_curso_id UUID NOT NULL REFERENCES inscripcion_curso(id) ON DELETE CASCADE ON UPDATE CASCADE,
  quiz_id UUID REFERENCES quiz(id) ON DELETE SET NULL ON UPDATE CASCADE,
  examen_final_id UUID REFERENCES examen_final(id) ON DELETE SET NULL ON UPDATE CASCADE,
  intento_id UUID REFERENCES intento(id) ON DELETE SET NULL ON UPDATE CASCADE,
  folio VARCHAR(50),
  hash_verificacion VARCHAR(128) UNIQUE,
  s3_key VARCHAR(500),
  emitido_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  valido BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Tablas de Interacción
-- =====================================================

CREATE TABLE foro_comentario (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE ON UPDATE CASCADE,
  curso_id UUID NOT NULL REFERENCES curso(id) ON DELETE CASCADE ON UPDATE CASCADE,
  leccion_id UUID NOT NULL REFERENCES leccion(id) ON DELETE CASCADE ON UPDATE CASCADE,
  contenido TEXT NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE preferencia_notificacion (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL UNIQUE REFERENCES usuario(id) ON DELETE CASCADE ON UPDATE CASCADE,
  email_recordatorios BOOLEAN,
  email_motivacion BOOLEAN,
  email_resultados BOOLEAN,
  actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Índices en claves foráneas
-- =====================================================

CREATE INDEX idx_usuario_rol_usuario_id ON usuario_rol(usuario_id);
CREATE INDEX idx_usuario_rol_rol_id ON usuario_rol(rol_id);
CREATE INDEX idx_modulo_curso_modulo_id ON modulo_curso(modulo_id);
CREATE INDEX idx_modulo_curso_curso_id ON modulo_curso(curso_id);
CREATE INDEX idx_guia_estudio_curso_id ON guia_estudio(curso_id);
CREATE INDEX idx_leccion_modulo_id ON leccion(modulo_id);
CREATE INDEX idx_leccion_contenido_leccion_id ON leccion_contenido(leccion_id);
CREATE INDEX idx_quiz_leccion_id ON quiz(leccion_id);
CREATE INDEX idx_examen_final_curso_id ON examen_final(curso_id);
CREATE INDEX idx_pregunta_quiz_id ON pregunta(quiz_id);
CREATE INDEX idx_pregunta_examen_final_id ON pregunta(examen_final_id);
CREATE INDEX idx_opcion_pregunta_id ON opcion(pregunta_id);
CREATE INDEX idx_tarea_curso_id ON tarea(curso_id);
CREATE INDEX idx_entrega_tarea_id ON entrega(tarea_id);
CREATE INDEX idx_entrega_usuario_id ON entrega(usuario_id);
CREATE INDEX idx_inscripcion_curso_usuario_id ON inscripcion_curso(usuario_id);
CREATE INDEX idx_inscripcion_curso_curso_id ON inscripcion_curso(curso_id);
CREATE INDEX idx_intento_usuario_id ON intento(usuario_id);
CREATE INDEX idx_intento_quiz_id ON intento(quiz_id);
CREATE INDEX idx_intento_examen_final_id ON intento(examen_final_id);
CREATE INDEX idx_intento_inscripcion_curso_id ON intento(inscripcion_curso_id);
CREATE INDEX idx_intento_pregunta_intento_id ON intento_pregunta(intento_id);
CREATE INDEX idx_intento_pregunta_pregunta_id ON intento_pregunta(pregunta_id);
CREATE INDEX idx_respuesta_intento_pregunta_id ON respuesta(intento_pregunta_id);
CREATE INDEX idx_respuesta_opcion_id ON respuesta(opcion_id);
CREATE INDEX idx_regla_acreditacion_curso_id ON regla_acreditacion(curso_id);
CREATE INDEX idx_regla_acreditacion_quiz_id ON regla_acreditacion(quiz_id);
CREATE INDEX idx_regla_acreditacion_examen_final_id ON regla_acreditacion(examen_final_id);
CREATE INDEX idx_certificado_inscripcion_curso_id ON certificado(inscripcion_curso_id);
CREATE INDEX idx_certificado_quiz_id ON certificado(quiz_id);
CREATE INDEX idx_certificado_examen_final_id ON certificado(examen_final_id);
CREATE INDEX idx_certificado_intento_id ON certificado(intento_id);
CREATE INDEX idx_foro_comentario_usuario_id ON foro_comentario(usuario_id);
CREATE INDEX idx_foro_comentario_curso_id ON foro_comentario(curso_id);
CREATE INDEX idx_foro_comentario_leccion_id ON foro_comentario(leccion_id);

-- =====================================================
-- Índices en columnas de filtrado
-- =====================================================

CREATE INDEX idx_curso_publicado ON curso(publicado) WHERE publicado = TRUE;
CREATE INDEX idx_modulo_publicado ON modulo(publicado) WHERE publicado = TRUE;
CREATE INDEX idx_quiz_publicado ON quiz(publicado) WHERE publicado = TRUE;
CREATE INDEX idx_examen_final_publicado ON examen_final(publicado) WHERE publicado = TRUE;
CREATE INDEX idx_leccion_publicado ON leccion(publicado) WHERE publicado = TRUE;
CREATE INDEX idx_tarea_publicado ON tarea(publicado) WHERE publicado = TRUE;
CREATE INDEX idx_guia_estudio_activo ON guia_estudio(activo) WHERE activo = TRUE;
CREATE INDEX idx_inscripcion_curso_estado ON inscripcion_curso(estado);
CREATE INDEX idx_inscripcion_curso_acreditado ON inscripcion_curso(acreditado) WHERE acreditado = TRUE;
CREATE INDEX idx_intento_resultado ON intento(resultado);

-- =====================================================
-- Índices compuestos para consultas comunes
-- =====================================================

CREATE INDEX idx_inscripcion_curso_usuario_estado ON inscripcion_curso(usuario_id, estado);
CREATE INDEX idx_inscripcion_curso_curso_estado ON inscripcion_curso(curso_id, estado);
CREATE INDEX idx_intento_usuario_quiz ON intento(usuario_id, quiz_id);
CREATE INDEX idx_intento_usuario_examen_final ON intento(usuario_id, examen_final_id);
CREATE INDEX idx_intento_inscripcion_resultado ON intento(inscripcion_curso_id, resultado);
CREATE INDEX idx_foro_comentario_curso_leccion ON foro_comentario(curso_id, leccion_id);

-- =====================================================
-- Índices en columnas de ordenamiento
-- =====================================================

CREATE INDEX idx_leccion_modulo_orden ON leccion(modulo_id, orden);
CREATE INDEX idx_leccion_contenido_leccion_orden ON leccion_contenido(leccion_id, orden);
CREATE INDEX idx_pregunta_quiz_orden ON pregunta(quiz_id, orden);
CREATE INDEX idx_pregunta_examen_final_orden ON pregunta(examen_final_id, orden);
CREATE INDEX idx_opcion_pregunta_orden ON opcion(pregunta_id, orden);
CREATE INDEX idx_foro_comentario_leccion_creado ON foro_comentario(leccion_id, creado_en DESC);
CREATE INDEX idx_intento_inscripcion_finalizado ON intento(inscripcion_curso_id, finalizado_en DESC);

-- =====================================================
-- Restricciones UNIQUE parciales
-- =====================================================

CREATE UNIQUE INDEX idx_regla_curso_sin_quiz_activa
ON regla_acreditacion (curso_id)
WHERE quiz_id IS NULL AND examen_final_id IS NULL AND activa = TRUE;

CREATE UNIQUE INDEX idx_regla_curso_quiz_activa
ON regla_acreditacion (curso_id, quiz_id)
WHERE quiz_id IS NOT NULL AND activa = TRUE;

CREATE UNIQUE INDEX idx_regla_curso_examen_final_activa
ON regla_acreditacion (curso_id, examen_final_id)
WHERE examen_final_id IS NOT NULL AND activa = TRUE;

CREATE UNIQUE INDEX idx_certificado_valido_unico
ON certificado (inscripcion_curso_id)
WHERE valido = TRUE;

-- =====================================================
-- Vistas para datos calculados
-- =====================================================

CREATE VIEW quiz_con_preguntas AS
SELECT 
  q.*,
  COUNT(p.id) as numero_preguntas
FROM quiz q
LEFT JOIN pregunta p ON p.quiz_id = q.id
GROUP BY q.id;

CREATE VIEW examen_final_con_preguntas AS
SELECT 
  ef.*,
  COUNT(p.id) as numero_preguntas
FROM examen_final ef
LEFT JOIN pregunta p ON p.examen_final_id = ef.id
GROUP BY ef.id;

-- =====================================================
-- Vista: inscripcion_modulo_calculada
-- =====================================================
-- Calcula el progreso del módulo basándose en las
-- inscripciones de curso. El progreso se deriva de
-- las inscripciones de curso del usuario en los cursos
-- que pertenecen al módulo.
-- =====================================================

CREATE VIEW inscripcion_modulo_calculada AS
WITH cursos_por_modulo AS (
  SELECT 
    mc.modulo_id,
    COUNT(*) as total_cursos
  FROM modulo_curso mc
  GROUP BY mc.modulo_id
),
inscripciones_agregadas AS (
  SELECT 
    ic.usuario_id,
    mc.modulo_id,
    COUNT(*) as cursos_inscritos,
    BOOL_OR(ic.estado = 'REPROBADA') as tiene_reprobada,
    BOOL_AND(ic.estado = 'CONCLUIDA') as todas_concluidas,
    BOOL_OR(ic.estado = 'PAUSADA') as tiene_pausada,
    BOOL_AND(ic.acreditado = TRUE) as todas_acreditadas,
    MAX(ic.acreditado_en) as acreditado_en,
    MIN(ic.fecha_inscripcion) as fecha_inscripcion,
    MAX(ic.fecha_conclusion) as fecha_conclusion
  FROM modulo_curso mc
  JOIN inscripcion_curso ic ON ic.curso_id = mc.curso_id
  GROUP BY ic.usuario_id, mc.modulo_id
)
SELECT 
  ia.usuario_id,
  ia.modulo_id,
  -- Estado: prioridad REPROBADA > CONCLUIDA > PAUSADA > ACTIVA
  CASE
    WHEN ia.tiene_reprobada THEN 'REPROBADA'::estado_inscripcion
    WHEN ia.todas_concluidas AND ia.cursos_inscritos = cpm.total_cursos THEN 'CONCLUIDA'::estado_inscripcion
    WHEN ia.tiene_pausada THEN 'PAUSADA'::estado_inscripcion
    ELSE 'ACTIVA'::estado_inscripcion
  END as estado,
  -- Acreditado: todos los cursos del módulo deben estar acreditados y el usuario debe estar inscrito en todos
  (ia.todas_acreditadas AND ia.cursos_inscritos = cpm.total_cursos) as acreditado,
  ia.acreditado_en,
  ia.fecha_inscripcion,
  ia.fecha_conclusion
FROM inscripciones_agregadas ia
JOIN cursos_por_modulo cpm ON cpm.modulo_id = ia.modulo_id;

-- =====================================================
-- Vista: respuesta_con_evaluacion
-- =====================================================
-- Calcula dinámicamente es_correcta y puntos_otorgados
-- basándose en el tipo de pregunta y la configuración
-- =====================================================

CREATE VIEW respuesta_con_evaluacion AS
SELECT 
  r.*,
  -- Calcular es_correcta según el tipo de pregunta
  CASE 
    -- Para opción múltiple: verificar si la opción seleccionada es correcta
    WHEN pc.tipo = 'OPCION_MULTIPLE' AND r.opcion_id IS NOT NULL THEN 
      COALESCE(o.es_correcta, FALSE)
    -- Para verdadero/falso: comparar respuesta_bool con respuesta correcta
    WHEN pc.tipo = 'VERDADERO_FALSO' AND r.respuesta_bool IS NOT NULL THEN 
      (r.respuesta_bool = COALESCE(pc.vf_respuesta_correcta, FALSE))
    -- Para preguntas abiertas: NULL (requiere evaluación manual)
    WHEN pc.tipo = 'ABIERTA' THEN NULL
    ELSE NULL
  END as es_correcta,
  -- Calcular puntos_otorgados
  CASE 
    -- Para opción múltiple: puntos según si es correcta y configuración
    WHEN pc.tipo = 'OPCION_MULTIPLE' AND r.opcion_id IS NOT NULL THEN 
      CASE 
        WHEN COALESCE(o.es_correcta, FALSE) = TRUE THEN 
          COALESCE(pc.puntos_por_opcion, p.puntos, 0)
        WHEN COALESCE(pc.penaliza_error, FALSE) = TRUE THEN 
          -COALESCE(pc.puntos_por_opcion, p.puntos, 0)
        ELSE 0
      END
    -- Para verdadero/falso: puntos si es correcta
    WHEN pc.tipo = 'VERDADERO_FALSO' AND r.respuesta_bool IS NOT NULL THEN 
      CASE 
        WHEN r.respuesta_bool = COALESCE(pc.vf_respuesta_correcta, FALSE) THEN 
          COALESCE(p.puntos, 0)
        WHEN COALESCE(pc.penaliza_error, FALSE) = TRUE THEN 
          -COALESCE(p.puntos, 0)
        ELSE 0
      END
    -- Para preguntas abiertas: NULL (requiere evaluación manual)
    WHEN pc.tipo = 'ABIERTA' THEN NULL
    ELSE NULL
  END as puntos_otorgados
FROM respuesta r
JOIN intento_pregunta ip ON ip.id = r.intento_pregunta_id
JOIN pregunta p ON p.id = ip.pregunta_id
LEFT JOIN pregunta_config pc ON pc.pregunta_id = p.id
LEFT JOIN opcion o ON o.id = r.opcion_id;

-- =====================================================
-- Índices GIN para búsqueda de texto completo
-- =====================================================

CREATE INDEX idx_curso_titulo_gin ON curso USING GIN (titulo gin_trgm_ops);
CREATE INDEX idx_curso_descripcion_gin ON curso USING GIN (descripcion gin_trgm_ops);
CREATE INDEX idx_modulo_titulo_gin ON modulo USING GIN (titulo gin_trgm_ops);
CREATE INDEX idx_usuario_nombre_gin ON usuario USING GIN (nombre gin_trgm_ops);
CREATE INDEX idx_usuario_apellido_gin ON usuario USING GIN (apellido gin_trgm_ops);
CREATE INDEX idx_foro_comentario_contenido_gin ON foro_comentario USING GIN (contenido gin_trgm_ops);
CREATE INDEX idx_leccion_titulo_gin ON leccion USING GIN (titulo gin_trgm_ops);
CREATE INDEX idx_tarea_titulo_gin ON tarea USING GIN (titulo gin_trgm_ops);
CREATE INDEX idx_tarea_descripcion_gin ON tarea USING GIN (descripcion gin_trgm_ops);
CREATE INDEX idx_quiz_titulo_gin ON quiz USING GIN (titulo gin_trgm_ops);
CREATE INDEX idx_examen_final_titulo_gin ON examen_final USING GIN (titulo gin_trgm_ops);
CREATE INDEX idx_pregunta_enunciado_gin ON pregunta USING GIN (enunciado gin_trgm_ops);
