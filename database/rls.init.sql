-- =====================================================
-- Políticas de Seguridad a Nivel de Fila (RLS)
-- =====================================================
-- Este archivo contiene las políticas RLS para controlar
-- el acceso a nivel de fila. Debe ejecutarse después de
-- init.sql y trigger.init.sql
-- =====================================================

-- =====================================================
-- Función Helper: Obtener usuario_id desde Cognito
-- =====================================================
-- Esta función obtiene el usuario_id desde el cognito_user_id
-- que se pasa como parámetro. En producción, esto se podría
-- integrar con el JWT token de Cognito.
-- =====================================================

CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
DECLARE
  current_cognito_user_id TEXT;
  user_id UUID;
BEGIN
  -- En producción, esto obtendría el cognito_user_id del JWT token
  -- Por ahora, usamos una variable de sesión o parámetro
  -- Ejemplo: current_cognito_user_id := current_setting('app.current_user_id', true);
  
  -- Para desarrollo/testing, se puede pasar como parámetro
  -- En producción, se obtendría del contexto de autenticación
  current_cognito_user_id := current_setting('app.current_cognito_user_id', true);
  
  IF current_cognito_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT id INTO user_id
  FROM usuario
  WHERE cognito_user_id = current_cognito_user_id;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Función Helper: Verificar si es administrador
-- =====================================================
-- Verifica si el usuario actual tiene rol de administrador
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := get_current_user_id();
  
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM usuario_rol ur
    JOIN rol r ON r.id = ur.rol_id
    WHERE ur.usuario_id = current_user_id
      AND r.nombre = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Habilitar RLS en tablas
-- =====================================================

ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_rol ENABLE ROW LEVEL SECURITY;
ALTER TABLE curso ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulo ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulo_curso ENABLE ROW LEVEL SECURITY;
ALTER TABLE guia_estudio ENABLE ROW LEVEL SECURITY;
ALTER TABLE leccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE leccion_contenido ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregunta ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregunta_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE opcion ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarea ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrega ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscripcion_curso ENABLE ROW LEVEL SECURITY;
ALTER TABLE intento ENABLE ROW LEVEL SECURITY;
ALTER TABLE intento_pregunta ENABLE ROW LEVEL SECURITY;
ALTER TABLE respuesta ENABLE ROW LEVEL SECURITY;
ALTER TABLE regla_acreditacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificado ENABLE ROW LEVEL SECURITY;
ALTER TABLE foro_comentario ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferencia_notificacion ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Políticas para tabla usuario
-- =====================================================

-- Los usuarios pueden ver sus propios datos
CREATE POLICY usuario_select_own ON usuario
FOR SELECT
USING (id = get_current_user_id());

-- Los usuarios pueden actualizar sus propios datos (excepto roles y acreditaciones)
CREATE POLICY usuario_update_own ON usuario
FOR UPDATE
USING (id = get_current_user_id())
WITH CHECK (id = get_current_user_id());

-- Los administradores pueden ver todos los usuarios
CREATE POLICY usuario_select_admin ON usuario
FOR SELECT
USING (is_admin());

-- Los administradores pueden insertar usuarios
CREATE POLICY usuario_insert_admin ON usuario
FOR INSERT
WITH CHECK (is_admin());

-- Los administradores pueden actualizar todos los usuarios
CREATE POLICY usuario_update_admin ON usuario
FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- Políticas para tabla curso
-- =====================================================

-- Todos pueden ver cursos públicos
CREATE POLICY curso_select_public ON curso
FOR SELECT
USING (publicado = TRUE OR is_admin());

-- Los administradores pueden hacer todo en cursos
CREATE POLICY curso_all_admin ON curso
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- Políticas para tabla modulo
-- =====================================================

-- Todos pueden ver módulos públicos
CREATE POLICY modulo_select_public ON modulo
FOR SELECT
USING (publicado = TRUE OR is_admin());

-- Los administradores pueden hacer todo en módulos
CREATE POLICY modulo_all_admin ON modulo
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- Políticas para tabla leccion
-- =====================================================

-- Todos pueden ver lecciones públicas de cursos públicos
CREATE POLICY leccion_select_public ON leccion
FOR SELECT
USING (
  publicado = TRUE 
  AND EXISTS (
    SELECT 1 
    FROM modulo m
    JOIN modulo_curso mc ON mc.modulo_id = m.id
    JOIN curso c ON c.id = mc.curso_id
    WHERE m.id = leccion.modulo_id 
    AND c.publicado = TRUE
    AND m.publicado = TRUE
  )
  OR is_admin()
);

-- Los administradores pueden hacer todo en lecciones
CREATE POLICY leccion_all_admin ON leccion
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- Políticas para tabla quiz
-- =====================================================

-- Todos pueden ver quizzes públicos de cursos públicos
CREATE POLICY quiz_select_public ON quiz
FOR SELECT
USING (
  publicado = TRUE 
  AND EXISTS (
    SELECT 1 FROM curso c 
    WHERE c.id = quiz.curso_id 
    AND c.publicado = TRUE
  )
  OR is_admin()
);

-- Los administradores pueden hacer todo en quizzes
CREATE POLICY quiz_all_admin ON quiz
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- Políticas para tabla tarea
-- =====================================================

-- Todos pueden ver tareas públicas de cursos públicos
CREATE POLICY tarea_select_public ON tarea
FOR SELECT
USING (
  publicado = TRUE 
  AND EXISTS (
    SELECT 1 FROM curso c 
    WHERE c.id = tarea.curso_id 
    AND c.publicado = TRUE
  )
  OR is_admin()
);

-- Los administradores pueden hacer todo en tareas
CREATE POLICY tarea_all_admin ON tarea
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- Políticas para tabla inscripcion_curso
-- =====================================================

-- Los usuarios pueden ver sus propias inscripciones
CREATE POLICY inscripcion_curso_select_own ON inscripcion_curso
FOR SELECT
USING (usuario_id = get_current_user_id() OR is_admin());

-- Los usuarios pueden insertar sus propias inscripciones
CREATE POLICY inscripcion_curso_insert_own ON inscripcion_curso
FOR INSERT
WITH CHECK (usuario_id = get_current_user_id() OR is_admin());

-- Los usuarios pueden actualizar sus propias inscripciones (con restricciones)
CREATE POLICY inscripcion_curso_update_own ON inscripcion_curso
FOR UPDATE
USING (usuario_id = get_current_user_id() OR is_admin())
WITH CHECK (usuario_id = get_current_user_id() OR is_admin());

-- Los administradores pueden hacer todo en inscripciones
CREATE POLICY inscripcion_curso_all_admin ON inscripcion_curso
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- Políticas para tabla intento
-- =====================================================

-- Los usuarios pueden ver sus propios intentos
CREATE POLICY intento_select_own ON intento
FOR SELECT
USING (usuario_id = get_current_user_id() OR is_admin());

-- Los usuarios pueden insertar sus propios intentos
CREATE POLICY intento_insert_own ON intento
FOR INSERT
WITH CHECK (usuario_id = get_current_user_id() OR is_admin());

-- Los usuarios pueden actualizar sus propios intentos
CREATE POLICY intento_update_own ON intento
FOR UPDATE
USING (usuario_id = get_current_user_id() OR is_admin())
WITH CHECK (usuario_id = get_current_user_id() OR is_admin());

-- Los administradores pueden hacer todo en intentos
CREATE POLICY intento_all_admin ON intento
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- Políticas para tabla entrega
-- =====================================================

-- Los usuarios pueden ver sus propias entregas
CREATE POLICY entrega_select_own ON entrega
FOR SELECT
USING (usuario_id = get_current_user_id() OR is_admin());

-- Los usuarios pueden insertar sus propias entregas
CREATE POLICY entrega_insert_own ON entrega
FOR INSERT
WITH CHECK (usuario_id = get_current_user_id() OR is_admin());

-- Los usuarios pueden actualizar sus propias entregas
CREATE POLICY entrega_update_own ON entrega
FOR UPDATE
USING (usuario_id = get_current_user_id() OR is_admin())
WITH CHECK (usuario_id = get_current_user_id() OR is_admin());

-- Los administradores pueden hacer todo en entregas
CREATE POLICY entrega_all_admin ON entrega
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- Políticas para tabla feedback
-- =====================================================

-- Los usuarios pueden ver feedback público y su propio feedback
CREATE POLICY feedback_select_own_public ON feedback
FOR SELECT
USING (
  usuario_id = get_current_user_id() 
  OR autor_id = get_current_user_id()
  OR visibilidad = 'PUBLICO'
  OR (
    visibilidad = 'CURSO' 
    AND tipo_entidad = 'CURSO'
    AND EXISTS (
      SELECT 1 FROM inscripcion_curso ic
      WHERE ic.curso_id = feedback.entidad_id
      AND ic.usuario_id = get_current_user_id()
    )
  )
  OR is_admin()
);

-- Los usuarios pueden insertar su propio feedback
CREATE POLICY feedback_insert_own ON feedback
FOR INSERT
WITH CHECK (usuario_id = get_current_user_id() OR is_admin());

-- Los usuarios pueden actualizar su propio feedback
CREATE POLICY feedback_update_own ON feedback
FOR UPDATE
USING (usuario_id = get_current_user_id() OR is_admin())
WITH CHECK (usuario_id = get_current_user_id() OR is_admin());

-- Los administradores pueden hacer todo en feedback
CREATE POLICY feedback_all_admin ON feedback
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- Políticas para tabla foro_comentario
-- =====================================================

-- Los usuarios pueden ver comentarios de cursos donde están inscritos
CREATE POLICY foro_comentario_select_inscribed ON foro_comentario
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM inscripcion_curso ic
    WHERE ic.curso_id = foro_comentario.curso_id
    AND ic.usuario_id = get_current_user_id()
  )
  OR is_admin()
);

-- Los usuarios pueden insertar comentarios en cursos donde están inscritos
CREATE POLICY foro_comentario_insert_inscribed ON foro_comentario
FOR INSERT
WITH CHECK (
  usuario_id = get_current_user_id()
  AND EXISTS (
    SELECT 1 FROM inscripcion_curso ic
    WHERE ic.curso_id = foro_comentario.curso_id
    AND ic.usuario_id = get_current_user_id()
  )
  OR is_admin()
);

-- Los usuarios pueden actualizar sus propios comentarios
CREATE POLICY foro_comentario_update_own ON foro_comentario
FOR UPDATE
USING (usuario_id = get_current_user_id() OR is_admin())
WITH CHECK (usuario_id = get_current_user_id() OR is_admin());

-- Los usuarios pueden eliminar sus propios comentarios
CREATE POLICY foro_comentario_delete_own ON foro_comentario
FOR DELETE
USING (usuario_id = get_current_user_id() OR is_admin());

-- Los administradores pueden hacer todo en comentarios
CREATE POLICY foro_comentario_all_admin ON foro_comentario
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- Políticas para tabla certificado
-- =====================================================

-- Los usuarios pueden ver sus propios certificados
CREATE POLICY certificado_select_own ON certificado
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM inscripcion_curso ic
    WHERE ic.id = certificado.inscripcion_curso_id
    AND ic.usuario_id = get_current_user_id()
  )
  OR is_admin()
);

-- Los administradores pueden hacer todo en certificados
CREATE POLICY certificado_all_admin ON certificado
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- Políticas para tabla preferencia_notificacion
-- =====================================================

-- Los usuarios pueden ver sus propias preferencias
CREATE POLICY preferencia_notificacion_select_own ON preferencia_notificacion
FOR SELECT
USING (usuario_id = get_current_user_id() OR is_admin());

-- Los usuarios pueden insertar sus propias preferencias
CREATE POLICY preferencia_notificacion_insert_own ON preferencia_notificacion
FOR INSERT
WITH CHECK (usuario_id = get_current_user_id() OR is_admin());

-- Los usuarios pueden actualizar sus propias preferencias
CREATE POLICY preferencia_notificacion_update_own ON preferencia_notificacion
FOR UPDATE
USING (usuario_id = get_current_user_id() OR is_admin())
WITH CHECK (usuario_id = get_current_user_id() OR is_admin());

-- Los administradores pueden hacer todo en preferencias
CREATE POLICY preferencia_notificacion_all_admin ON preferencia_notificacion
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- Políticas para tablas de administración
-- =====================================================
-- Estas tablas solo son accesibles por administradores

-- regla_acreditacion
CREATE POLICY regla_acreditacion_admin ON regla_acreditacion
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- usuario_rol
CREATE POLICY usuario_rol_admin ON usuario_rol
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- rol
CREATE POLICY rol_admin ON rol
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- modulo_curso
CREATE POLICY modulo_curso_admin ON modulo_curso
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- guia_estudio
CREATE POLICY guia_estudio_admin ON guia_estudio
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- leccion_contenido
CREATE POLICY leccion_contenido_admin ON leccion_contenido
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- pregunta
CREATE POLICY pregunta_admin ON pregunta
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- pregunta_config
CREATE POLICY pregunta_config_admin ON pregunta_config
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- opcion
CREATE POLICY opcion_admin ON opcion
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- intento_pregunta
CREATE POLICY intento_pregunta_admin ON intento_pregunta
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- respuesta
CREATE POLICY respuesta_admin ON respuesta
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());
