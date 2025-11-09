-- =====================================================
-- Funciones y Triggers
-- =====================================================
-- Este archivo contiene todas las funciones y triggers
-- del sistema. Debe ejecutarse después de init.sql
-- =====================================================

-- =====================================================
-- Función: validar_max_intentos
-- =====================================================
-- Valida que un usuario no exceda el máximo de intentos
-- permitidos para un quiz según las reglas de acreditación activas.
-- =====================================================

CREATE OR REPLACE FUNCTION validar_max_intentos()
RETURNS TRIGGER AS $$
DECLARE
  max_intentos INT;
  intentos_actuales INT;
  curso_id_param UUID;
BEGIN
  SELECT q.curso_id INTO curso_id_param
  FROM quiz q
  WHERE q.id = NEW.quiz_id;
  
  SELECT ra.max_intentos_quiz INTO max_intentos
  FROM regla_acreditacion ra
  WHERE ra.activa = TRUE
    AND (
      (ra.quiz_id = NEW.quiz_id AND ra.curso_id = curso_id_param) OR
      (ra.quiz_id IS NULL AND ra.curso_id = curso_id_param)
    )
  ORDER BY CASE WHEN ra.quiz_id IS NOT NULL THEN 1 ELSE 2 END
  LIMIT 1;
  
  IF max_intentos IS NULL THEN
    max_intentos := 3;
  END IF;
  
  SELECT COUNT(*) INTO intentos_actuales
  FROM intento
  WHERE usuario_id = NEW.usuario_id
    AND quiz_id = NEW.quiz_id
    AND inscripcion_curso_id = NEW.inscripcion_curso_id;
  
  IF intentos_actuales >= max_intentos THEN
    RAISE EXCEPTION 'Máximo de intentos alcanzado para este quiz. Máximo permitido: %', max_intentos;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger: trg_validar_max_intentos
-- =====================================================
-- Se ejecuta antes de insertar un nuevo intento para
-- validar que no se exceda el máximo permitido.
-- =====================================================

CREATE TRIGGER trg_validar_max_intentos
BEFORE INSERT ON intento
FOR EACH ROW
EXECUTE FUNCTION validar_max_intentos();

-- =====================================================
-- Función: validar_intento_inscripcion
-- =====================================================
-- Valida que el usuario_id coincida con la inscripción
-- y que el quiz pertenezca al curso de la inscripción.
-- =====================================================

CREATE OR REPLACE FUNCTION validar_intento_inscripcion()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM inscripcion_curso
    WHERE id = NEW.inscripcion_curso_id
      AND usuario_id = NEW.usuario_id
  ) THEN
    RAISE EXCEPTION 'El usuario no coincide con la inscripción';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM inscripcion_curso ic
    JOIN quiz q ON q.curso_id = ic.curso_id
    WHERE ic.id = NEW.inscripcion_curso_id
      AND q.id = NEW.quiz_id
  ) THEN
    RAISE EXCEPTION 'El quiz no pertenece al curso de la inscripción';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger: trg_validar_intento_inscripcion
-- =====================================================
-- Valida las relaciones circulares en intento.
-- =====================================================

CREATE TRIGGER trg_validar_intento_inscripcion
BEFORE INSERT OR UPDATE ON intento
FOR EACH ROW
EXECUTE FUNCTION validar_intento_inscripcion();

-- =====================================================
-- Función: validar_respuesta_tipo
-- =====================================================
-- Valida que la respuesta coincida con el tipo de pregunta.
-- =====================================================

CREATE OR REPLACE FUNCTION validar_respuesta_tipo()
RETURNS TRIGGER AS $$
DECLARE
  tipo_preg tipo_pregunta;
BEGIN
  SELECT pc.tipo INTO tipo_preg
  FROM pregunta_config pc
  JOIN pregunta p ON p.id = pc.pregunta_id
  JOIN intento_pregunta ip ON ip.pregunta_id = p.id
  WHERE ip.id = NEW.intento_pregunta_id;
  
  IF tipo_preg IS NULL THEN
    RAISE EXCEPTION 'No se encontró la configuración de la pregunta';
  END IF;
  
  IF tipo_preg = 'ABIERTA' AND NEW.respuesta_texto IS NULL THEN
    RAISE EXCEPTION 'Pregunta abierta requiere respuesta_texto';
  END IF;
  
  IF tipo_preg = 'OPCION_MULTIPLE' AND NEW.opcion_id IS NULL THEN
    RAISE EXCEPTION 'Pregunta de opción múltiple requiere opcion_id';
  END IF;
  
  IF tipo_preg = 'VERDADERO_FALSO' AND NEW.respuesta_bool IS NULL THEN
    RAISE EXCEPTION 'Pregunta verdadero/falso requiere respuesta_bool';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger: trg_validar_respuesta_tipo
-- =====================================================
-- Valida que el tipo de respuesta coincida con el tipo de pregunta.
-- =====================================================

CREATE TRIGGER trg_validar_respuesta_tipo
BEFORE INSERT OR UPDATE ON respuesta
FOR EACH ROW
EXECUTE FUNCTION validar_respuesta_tipo();

-- =====================================================
-- Función: validar_feedback_entidad
-- =====================================================
-- Valida que el entidad_id corresponda a una entidad válida
-- según el tipo_entidad.
-- =====================================================

CREATE OR REPLACE FUNCTION validar_feedback_entidad()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo_entidad = 'CURSO' AND NOT EXISTS (SELECT 1 FROM curso WHERE id = NEW.entidad_id) THEN
    RAISE EXCEPTION 'El entidad_id no corresponde a un curso válido';
  END IF;
  
  IF NEW.tipo_entidad = 'MODULO' AND NOT EXISTS (SELECT 1 FROM modulo WHERE id = NEW.entidad_id) THEN
    RAISE EXCEPTION 'El entidad_id no corresponde a un módulo válido';
  END IF;
  
  IF NEW.tipo_entidad = 'TAREA' AND NOT EXISTS (SELECT 1 FROM tarea WHERE id = NEW.entidad_id) THEN
    RAISE EXCEPTION 'El entidad_id no corresponde a una tarea válida';
  END IF;
  
  IF NEW.tipo_entidad = 'QUIZ' AND NOT EXISTS (SELECT 1 FROM quiz WHERE id = NEW.entidad_id) THEN
    RAISE EXCEPTION 'El entidad_id no corresponde a un quiz válido';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger: trg_validar_feedback_entidad
-- =====================================================
-- Valida que el entidad_id corresponda a una entidad válida.
-- =====================================================

CREATE TRIGGER trg_validar_feedback_entidad
BEFORE INSERT OR UPDATE ON feedback
FOR EACH ROW
EXECUTE FUNCTION validar_feedback_entidad();

-- =====================================================
-- Función: limpiar_feedback_huerfano
-- =====================================================
-- Limpia automáticamente el feedback asociado a una entidad
-- cuando se elimina la entidad. Evita datos huérfanos.
-- =====================================================

CREATE OR REPLACE FUNCTION limpiar_feedback_huerfano()
RETURNS TRIGGER AS $$
BEGIN
  -- Eliminar el feedback que coincide con la entidad que se está borrando
  -- El tipo de entidad se pasa como argumento del trigger (TG_ARGV[0])
  -- SECURITY DEFINER permite que la función se ejecute con los privilegios
  -- del propietario, evitando restricciones de RLS al eliminar feedback
  DELETE FROM feedback 
  WHERE tipo_entidad = TG_ARGV[0]::tipo_feedback 
    AND entidad_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers para limpiar feedback huérfano
-- =====================================================
-- Estos triggers se ejecutan ANTES de eliminar una entidad
-- y limpian automáticamente el feedback asociado.
-- =====================================================

-- Trigger para limpiar feedback cuando se elimina un curso
CREATE TRIGGER trigger_limpiar_feedback_en_curso
BEFORE DELETE ON curso
FOR EACH ROW
EXECUTE FUNCTION limpiar_feedback_huerfano('CURSO');

-- Trigger para limpiar feedback cuando se elimina un módulo
CREATE TRIGGER trigger_limpiar_feedback_en_modulo
BEFORE DELETE ON modulo
FOR EACH ROW
EXECUTE FUNCTION limpiar_feedback_huerfano('MODULO');

-- Trigger para limpiar feedback cuando se elimina una tarea
CREATE TRIGGER trigger_limpiar_feedback_en_tarea
BEFORE DELETE ON tarea
FOR EACH ROW
EXECUTE FUNCTION limpiar_feedback_huerfano('TAREA');

-- Trigger para limpiar feedback cuando se elimina un quiz
CREATE TRIGGER trigger_limpiar_feedback_en_quiz
BEFORE DELETE ON quiz
FOR EACH ROW
EXECUTE FUNCTION limpiar_feedback_huerfano('QUIZ');

-- =====================================================
-- Función: validar_transicion_estado_inscripcion
-- =====================================================
-- Valida que las transiciones de estado en inscripciones
-- sean válidas según la lógica de negocio.
-- =====================================================

CREATE OR REPLACE FUNCTION validar_transicion_estado_inscripcion()
RETURNS TRIGGER AS $$
BEGIN
  -- Una inscripción concluida no puede cambiar de estado
  IF OLD.estado = 'CONCLUIDA' AND NEW.estado != 'CONCLUIDA' THEN
    RAISE EXCEPTION 'Una inscripción concluida no puede cambiar de estado. Estado actual: %, intentado: %', OLD.estado, NEW.estado;
  END IF;
  
  -- Una inscripción reprobada solo puede mantenerse o concluirse
  IF OLD.estado = 'REPROBADA' AND NEW.estado NOT IN ('REPROBADA', 'CONCLUIDA') THEN
    RAISE EXCEPTION 'Una inscripción reprobada solo puede mantenerse o concluirse. Estado intentado: %', NEW.estado;
  END IF;
  
  -- Si se concluye una inscripción, actualizar fecha_conclusion si es NULL
  IF NEW.estado = 'CONCLUIDA' AND NEW.fecha_conclusion IS NULL THEN
    NEW.fecha_conclusion := CURRENT_DATE;
  END IF;
  
  -- Si se reproba una inscripción, actualizar fecha_conclusion si es NULL
  IF NEW.estado = 'REPROBADA' AND NEW.fecha_conclusion IS NULL THEN
    NEW.fecha_conclusion := CURRENT_DATE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger: trg_validar_transicion_estado_inscripcion_curso
-- =====================================================
-- Valida las transiciones de estado en inscripcion_curso.
-- =====================================================

CREATE TRIGGER trg_validar_transicion_estado_inscripcion_curso
BEFORE UPDATE ON inscripcion_curso
FOR EACH ROW
WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
EXECUTE FUNCTION validar_transicion_estado_inscripcion();


-- =====================================================
-- Función: validar_acreditacion_curso
-- =====================================================
-- Valida que una inscripción solo se pueda acreditar si
-- existe al menos un intento aprobado que cumpla el score
-- mínimo según las reglas de acreditación activas.
-- =====================================================

CREATE OR REPLACE FUNCTION validar_acreditacion_curso()
RETURNS TRIGGER AS $$
DECLARE
  min_score NUMERIC(5,2);
  intento_aprobado BOOLEAN := FALSE;
BEGIN
  -- Solo validar si se está marcando como acreditado
  IF NEW.acreditado = TRUE AND (TG_OP = 'INSERT' OR OLD.acreditado = FALSE) THEN
    -- Obtener min_score de regla de acreditación activa
    SELECT ra.min_score_aprobatorio INTO min_score
    FROM regla_acreditacion ra
    WHERE ra.curso_id = NEW.curso_id
      AND ra.activa = TRUE
    ORDER BY CASE WHEN ra.quiz_id IS NOT NULL THEN 1 ELSE 2 END
    LIMIT 1;
    
    -- Si no hay regla, usar default
    IF min_score IS NULL THEN
      min_score := 80.00;
    END IF;
    
    -- Verificar que existe al menos un intento aprobado que cumpla el score mínimo
    SELECT EXISTS (
      SELECT 1 
      FROM intento i
      JOIN quiz q ON q.id = i.quiz_id
      WHERE i.inscripcion_curso_id = NEW.id
        AND i.resultado = 'APROBADO'
        AND i.puntaje >= min_score
      LIMIT 1
    ) INTO intento_aprobado;
    
    IF NOT intento_aprobado THEN
      RAISE EXCEPTION 'No se puede acreditar la inscripción. No existe un intento aprobado que cumpla el score mínimo de %. Score mínimo requerido: %', min_score, min_score;
    END IF;
    
    -- Si se acredita y acreditado_en es NULL, establecer la fecha
    IF NEW.acreditado_en IS NULL THEN
      NEW.acreditado_en := CURRENT_TIMESTAMP;
    END IF;
    
    -- Si se acredita, el estado debería ser CONCLUIDA
    IF NEW.estado != 'CONCLUIDA' THEN
      NEW.estado := 'CONCLUIDA';
      IF NEW.fecha_conclusion IS NULL THEN
        NEW.fecha_conclusion := CURRENT_DATE;
      END IF;
    END IF;
  END IF;
  
  -- Si se desacredita, limpiar acreditado_en
  IF NEW.acreditado = FALSE AND TG_OP = 'UPDATE' AND OLD.acreditado = TRUE THEN
    NEW.acreditado_en := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger: trg_validar_acreditacion_curso
-- =====================================================
-- Valida que la acreditación solo se permita cuando se
-- cumplan los requisitos de intentos aprobados.
-- =====================================================

CREATE TRIGGER trg_validar_acreditacion_curso
BEFORE INSERT OR UPDATE ON inscripcion_curso
FOR EACH ROW
EXECUTE FUNCTION validar_acreditacion_curso();


-- =====================================================
-- Función: validar_foro_comentario_curso
-- =====================================================
-- Valida que el curso_id en foro_comentario coincida
-- con el curso del módulo de la lección.
-- =====================================================

CREATE OR REPLACE FUNCTION validar_foro_comentario_curso()
RETURNS TRIGGER AS $$
DECLARE
  curso_valido BOOLEAN;
BEGIN
  -- Validar que el curso_id esté en la lista de cursos del módulo de la lección
  SELECT EXISTS (
    SELECT 1
    FROM leccion l
    JOIN modulo_curso mc ON mc.modulo_id = l.modulo_id
    WHERE l.id = NEW.leccion_id
    AND mc.curso_id = NEW.curso_id
  ) INTO curso_valido;
  
  -- Validar que el curso_id coincida con uno de los cursos del módulo
  IF NOT curso_valido THEN
    RAISE EXCEPTION 'El curso_id del comentario (%) no coincide con ninguno de los cursos del módulo de la lección', NEW.curso_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger: trg_validar_foro_comentario_curso
-- =====================================================
-- Valida que el curso_id en foro_comentario coincida
-- con el curso del módulo de la lección.
-- =====================================================

CREATE TRIGGER trg_validar_foro_comentario_curso
BEFORE INSERT OR UPDATE ON foro_comentario
FOR EACH ROW
EXECUTE FUNCTION validar_foro_comentario_curso();

