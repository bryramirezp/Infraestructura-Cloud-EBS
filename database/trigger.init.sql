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
-- permitidos para un quiz o examen final según las reglas
-- de acreditación activas.
-- =====================================================

CREATE OR REPLACE FUNCTION validar_max_intentos()
RETURNS TRIGGER AS $$
DECLARE
  max_intentos INT;
  intentos_actuales INT;
  curso_id_param UUID;
BEGIN
  -- Obtener curso_id según si es quiz o examen final
  IF NEW.quiz_id IS NOT NULL THEN
    SELECT c.id INTO curso_id_param
    FROM quiz q
    JOIN leccion l ON l.id = q.leccion_id
    JOIN modulo_curso mc ON mc.modulo_id = l.modulo_id
    JOIN curso c ON c.id = mc.curso_id
    WHERE q.id = NEW.quiz_id
    LIMIT 1;
  ELSIF NEW.examen_final_id IS NOT NULL THEN
    SELECT curso_id INTO curso_id_param
    FROM examen_final
    WHERE id = NEW.examen_final_id;
  ELSE
    RAISE EXCEPTION 'El intento debe tener quiz_id o examen_final_id';
  END IF;
  
  -- Obtener max_intentos de regla de acreditación activa
  SELECT ra.max_intentos_quiz INTO max_intentos
  FROM regla_acreditacion ra
  WHERE ra.activa = TRUE
    AND ra.curso_id = curso_id_param
    AND (
      (NEW.quiz_id IS NOT NULL AND ra.quiz_id = NEW.quiz_id) OR
      (NEW.examen_final_id IS NOT NULL AND ra.examen_final_id = NEW.examen_final_id) OR
      (ra.quiz_id IS NULL AND ra.examen_final_id IS NULL)
    )
  ORDER BY 
    CASE WHEN ra.quiz_id IS NOT NULL OR ra.examen_final_id IS NOT NULL THEN 1 ELSE 2 END
  LIMIT 1;
  
  -- Si no hay regla, usar default
  IF max_intentos IS NULL THEN
    max_intentos := 3;
  END IF;
  
  -- Contar intentos actuales
  IF NEW.quiz_id IS NOT NULL THEN
    SELECT COUNT(*) INTO intentos_actuales
    FROM intento
    WHERE usuario_id = NEW.usuario_id
      AND quiz_id = NEW.quiz_id
      AND inscripcion_curso_id = NEW.inscripcion_curso_id;
  ELSIF NEW.examen_final_id IS NOT NULL THEN
    SELECT COUNT(*) INTO intentos_actuales
    FROM intento
    WHERE usuario_id = NEW.usuario_id
      AND examen_final_id = NEW.examen_final_id
      AND inscripcion_curso_id = NEW.inscripcion_curso_id;
  END IF;
  
  IF intentos_actuales >= max_intentos THEN
    RAISE EXCEPTION 'Máximo de intentos alcanzado. Máximo permitido: %', max_intentos;
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
-- y que el quiz pertenezca a la lección del curso de la
-- inscripción, o que el examen final pertenezca al curso.
-- =====================================================

CREATE OR REPLACE FUNCTION validar_intento_inscripcion()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que el usuario coincide con la inscripción
  IF NOT EXISTS (
    SELECT 1 FROM inscripcion_curso
    WHERE id = NEW.inscripcion_curso_id
      AND usuario_id = NEW.usuario_id
  ) THEN
    RAISE EXCEPTION 'El usuario no coincide con la inscripción';
  END IF;
  
  -- Validar quiz: debe pertenecer a una lección del curso de la inscripción
  IF NEW.quiz_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM inscripcion_curso ic
      JOIN curso c ON c.id = ic.curso_id
      JOIN modulo_curso mc ON mc.curso_id = c.id
      JOIN modulo m ON m.id = mc.modulo_id
      JOIN leccion l ON l.modulo_id = m.id
      JOIN quiz q ON q.leccion_id = l.id
      WHERE ic.id = NEW.inscripcion_curso_id
        AND q.id = NEW.quiz_id
    ) THEN
      RAISE EXCEPTION 'El quiz no pertenece a una lección del curso de la inscripción';
    END IF;
  END IF;
  
  -- Validar examen final: debe pertenecer al curso de la inscripción
  IF NEW.examen_final_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM inscripcion_curso ic
      JOIN examen_final ef ON ef.curso_id = ic.curso_id
      WHERE ic.id = NEW.inscripcion_curso_id
        AND ef.id = NEW.examen_final_id
    ) THEN
      RAISE EXCEPTION 'El examen final no pertenece al curso de la inscripción';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger: trg_validar_intento_inscripcion
-- =====================================================
-- Valida las relaciones en intento.
-- =====================================================

CREATE TRIGGER trg_validar_intento_inscripcion
BEFORE INSERT OR UPDATE ON intento
FOR EACH ROW
EXECUTE FUNCTION validar_intento_inscripcion();

-- =====================================================
-- Función: validar_examen_final_prerequisitos
-- =====================================================
-- Valida que todos los quizzes de las lecciones del curso
-- estén completados antes de permitir el examen final.
-- =====================================================

CREATE OR REPLACE FUNCTION validar_examen_final_prerequisitos()
RETURNS TRIGGER AS $$
DECLARE
  curso_id_param UUID;
  quizzes_pendientes INT;
BEGIN
  -- Solo validar si es un intento de examen final
  IF NEW.examen_final_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Obtener curso_id del examen final
  SELECT curso_id INTO curso_id_param
  FROM examen_final
  WHERE id = NEW.examen_final_id;
  
  -- Contar quizzes de lecciones del curso que no tienen intentos aprobados
  SELECT COUNT(*) INTO quizzes_pendientes
  FROM leccion l
  JOIN modulo_curso mc ON mc.modulo_id = l.modulo_id
  JOIN curso c ON c.id = mc.curso_id
  JOIN quiz q ON q.leccion_id = l.id
  WHERE c.id = curso_id_param
    AND NOT EXISTS (
      SELECT 1
      FROM intento i
      WHERE i.quiz_id = q.id
        AND i.inscripcion_curso_id = NEW.inscripcion_curso_id
        AND i.resultado = 'APROBADO'
    );
  
  IF quizzes_pendientes > 0 THEN
    RAISE EXCEPTION 'No se puede realizar el examen final. Faltan % quiz(es) por completar y aprobar', quizzes_pendientes;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger: trg_validar_examen_final_prerequisitos
-- =====================================================
-- Valida que todos los quizzes estén completados antes
-- de permitir el examen final.
-- =====================================================

CREATE TRIGGER trg_validar_examen_final_prerequisitos
BEFORE INSERT ON intento
FOR EACH ROW
WHEN (NEW.examen_final_id IS NOT NULL)
EXECUTE FUNCTION validar_examen_final_prerequisitos();

-- =====================================================
-- Función: validar_nuevo_intento_permitido
-- =====================================================
-- Valida que permitir_nuevo_intento = TRUE antes de
-- crear un nuevo intento (excepto el primer intento).
-- =====================================================

CREATE OR REPLACE FUNCTION validar_nuevo_intento_permitido()
RETURNS TRIGGER AS $$
DECLARE
  intentos_previos INT;
  ultimo_intento_permitir BOOLEAN;
BEGIN
  -- Contar intentos previos
  IF NEW.quiz_id IS NOT NULL THEN
    SELECT COUNT(*), COALESCE(MAX(permitir_nuevo_intento), FALSE)
    INTO intentos_previos, ultimo_intento_permitir
    FROM intento
    WHERE usuario_id = NEW.usuario_id
      AND quiz_id = NEW.quiz_id
      AND inscripcion_curso_id = NEW.inscripcion_curso_id;
  ELSIF NEW.examen_final_id IS NOT NULL THEN
    SELECT COUNT(*), COALESCE(MAX(permitir_nuevo_intento), FALSE)
    INTO intentos_previos, ultimo_intento_permitir
    FROM intento
    WHERE usuario_id = NEW.usuario_id
      AND examen_final_id = NEW.examen_final_id
      AND inscripcion_curso_id = NEW.inscripcion_curso_id;
  ELSE
    RETURN NEW;
  END IF;
  
  -- Si hay intentos previos, el último debe tener permitir_nuevo_intento = TRUE
  IF intentos_previos > 0 AND NOT ultimo_intento_permitir THEN
    RAISE EXCEPTION 'No se puede crear un nuevo intento. El instructor debe permitir un nuevo intento estableciendo permitir_nuevo_intento = TRUE en el intento anterior';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger: trg_validar_nuevo_intento_permitido
-- =====================================================
-- Valida que se permita un nuevo intento antes de crearlo.
-- =====================================================

CREATE TRIGGER trg_validar_nuevo_intento_permitido
BEFORE INSERT ON intento
FOR EACH ROW
EXECUTE FUNCTION validar_nuevo_intento_permitido();

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
-- existe al menos un intento aprobado del examen final
-- que cumpla el score mínimo según las reglas de acreditación activas.
-- =====================================================

CREATE OR REPLACE FUNCTION validar_acreditacion_curso()
RETURNS TRIGGER AS $$
DECLARE
  min_score NUMERIC(5,2);
  intento_aprobado BOOLEAN := FALSE;
BEGIN
  -- Solo validar si se está marcando como acreditado
  IF NEW.acreditado = TRUE AND (TG_OP = 'INSERT' OR OLD.acreditado = FALSE) THEN
    -- Obtener min_score de regla de acreditación activa (prioridad: examen final > general)
    SELECT ra.min_score_aprobatorio INTO min_score
    FROM regla_acreditacion ra
    WHERE ra.curso_id = NEW.curso_id
      AND ra.activa = TRUE
    ORDER BY 
      CASE WHEN ra.examen_final_id IS NOT NULL THEN 1 
           WHEN ra.quiz_id IS NOT NULL THEN 2 
           ELSE 3 END
    LIMIT 1;
    
    -- Si no hay regla, usar default
    IF min_score IS NULL THEN
      min_score := 80.00;
    END IF;
    
    -- Verificar que existe al menos un intento aprobado del examen final que cumpla el score mínimo
    SELECT EXISTS (
      SELECT 1 
      FROM intento i
      JOIN examen_final ef ON ef.id = i.examen_final_id
      WHERE i.inscripcion_curso_id = NEW.id
        AND i.resultado = 'APROBADO'
        AND i.puntaje >= min_score
        AND ef.curso_id = NEW.curso_id
      LIMIT 1
    ) INTO intento_aprobado;
    
    IF NOT intento_aprobado THEN
      RAISE EXCEPTION 'No se puede acreditar la inscripción. No existe un intento aprobado del examen final que cumpla el score mínimo de %. Score mínimo requerido: %', min_score, min_score;
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
-- cumplan los requisitos de intentos aprobados del examen final.
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
