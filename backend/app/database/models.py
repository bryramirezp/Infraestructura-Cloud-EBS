from sqlalchemy import (
    String, Text, Boolean, Integer, Numeric, Date,
    DateTime, ForeignKey, UniqueConstraint, CheckConstraint,
    func
)
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, date
from typing import Optional, List
import uuid

from app.database.session import Base
from app.database.enums import (
    TipoContenido, EstadoInscripcion,
    ResultadoIntento, TipoPregunta
)


# =====================================================
# Tablas de Usuarios y Acceso
# =====================================================

class Usuario(Base):
    """Modelo de usuario del sistema"""
    __tablename__ = "usuario"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid()
    )
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    apellido: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(190), unique=True, nullable=False, index=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    cognito_user_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    roles: Mapped[List["UsuarioRol"]] = relationship("UsuarioRol", back_populates="usuario", cascade="all, delete-orphan")
    inscripciones: Mapped[List["InscripcionCurso"]] = relationship("InscripcionCurso", back_populates="usuario", cascade="all, delete-orphan")
    intentos: Mapped[List["Intento"]] = relationship("Intento", back_populates="usuario")
    comentarios: Mapped[List["ForoComentario"]] = relationship("ForoComentario", back_populates="usuario", cascade="all, delete-orphan")
    preferencias: Mapped[Optional["PreferenciaNotificacion"]] = relationship("PreferenciaNotificacion", back_populates="usuario", uselist=False, cascade="all, delete-orphan")


class Rol(Base):
    """Modelo de rol del sistema"""
    __tablename__ = "rol"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid()
    )
    nombre: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    usuarios: Mapped[List["UsuarioRol"]] = relationship("UsuarioRol", back_populates="rol")


class UsuarioRol(Base):
    """Tabla pivote usuario-rol"""
    __tablename__ = "usuario_rol"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuario.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    rol_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rol.id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False, index=True)
    asignado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="roles")
    rol: Mapped["Rol"] = relationship("Rol", back_populates="usuarios")
    
    __table_args__ = (
        UniqueConstraint("usuario_id", "rol_id", name="uq_usuario_rol"),
    )


# =====================================================
# Tablas de Contenido: Módulo y Materias
# =====================================================

class Curso(Base):
    """Modelo de curso (materia)"""
    __tablename__ = "curso"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    publicado: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True, index=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    modulos: Mapped[List["ModuloCurso"]] = relationship("ModuloCurso", back_populates="curso")
    guias_estudio: Mapped[List["GuiaEstudio"]] = relationship("GuiaEstudio", back_populates="curso", cascade="all, delete-orphan")
    examen_final: Mapped[Optional["ExamenFinal"]] = relationship("ExamenFinal", back_populates="curso", uselist=False, cascade="all, delete-orphan")
    inscripciones: Mapped[List["InscripcionCurso"]] = relationship("InscripcionCurso", back_populates="curso")
    reglas_acreditacion: Mapped[List["ReglaAcreditacion"]] = relationship("ReglaAcreditacion", back_populates="curso", cascade="all, delete-orphan")
    comentarios: Mapped[List["ForoComentario"]] = relationship("ForoComentario", back_populates="curso", cascade="all, delete-orphan")


class Modulo(Base):
    """Modelo de módulo"""
    __tablename__ = "modulo"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[date] = mapped_column(Date, nullable=False)
    publicado: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True, index=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    cursos: Mapped[List["ModuloCurso"]] = relationship("ModuloCurso", back_populates="modulo", cascade="all, delete-orphan")
    lecciones: Mapped[List["Leccion"]] = relationship("Leccion", back_populates="modulo", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint("fecha_fin >= fecha_inicio", name="chk_fechas_modulo"),
    )


class ModuloCurso(Base):
    """Tabla pivote módulo-curso"""
    __tablename__ = "modulo_curso"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    modulo_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("modulo.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    curso_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("curso.id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False, index=True)
    slot: Mapped[int] = mapped_column(Integer, nullable=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    modulo: Mapped["Modulo"] = relationship("Modulo", back_populates="cursos")
    curso: Mapped["Curso"] = relationship("Curso", back_populates="modulos")
    
    __table_args__ = (
        UniqueConstraint("modulo_id", "slot", name="uq_modulo_slot"),
        UniqueConstraint("modulo_id", "curso_id", name="uq_modulo_curso"),
    )


class GuiaEstudio(Base):
    """Modelo de guía de estudio"""
    __tablename__ = "guia_estudio"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    curso_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("curso.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    activo: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True, index=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    curso: Mapped["Curso"] = relationship("Curso", back_populates="guias_estudio")


class Leccion(Base):
    """Modelo de lección"""
    __tablename__ = "leccion"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    modulo_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("modulo.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    orden: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    publicado: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True, index=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    modulo: Mapped["Modulo"] = relationship("Modulo", back_populates="lecciones")
    contenido: Mapped[List["LeccionContenido"]] = relationship("LeccionContenido", back_populates="leccion", cascade="all, delete-orphan")
    quiz: Mapped[Optional["Quiz"]] = relationship("Quiz", back_populates="leccion", uselist=False, cascade="all, delete-orphan")
    comentarios: Mapped[List["ForoComentario"]] = relationship("ForoComentario", back_populates="leccion", cascade="all, delete-orphan")


class LeccionContenido(Base):
    """Modelo de contenido de lección"""
    __tablename__ = "leccion_contenido"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    leccion_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("leccion.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    tipo: Mapped[TipoContenido] = mapped_column(ENUM(TipoContenido, name="tipo_contenido", create_type=False), nullable=False)
    titulo: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    orden: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    leccion: Mapped["Leccion"] = relationship("Leccion", back_populates="contenido")


# =====================================================
# Tablas de Evaluaciones
# =====================================================

class Quiz(Base):
    """Modelo de quiz (evaluación por lección)"""
    __tablename__ = "quiz"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    leccion_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("leccion.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    publicado: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True, index=True)
    aleatorio: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    guarda_calificacion: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    leccion: Mapped["Leccion"] = relationship("Leccion", back_populates="quiz")
    preguntas: Mapped[List["Pregunta"]] = relationship("Pregunta", back_populates="quiz", cascade="all, delete-orphan", foreign_keys="Pregunta.quiz_id")
    intentos: Mapped[List["Intento"]] = relationship("Intento", back_populates="quiz", foreign_keys="Intento.quiz_id")
    reglas_acreditacion: Mapped[List["ReglaAcreditacion"]] = relationship("ReglaAcreditacion", back_populates="quiz", foreign_keys="ReglaAcreditacion.quiz_id")
    certificados: Mapped[List["Certificado"]] = relationship("Certificado", back_populates="quiz", foreign_keys="Certificado.quiz_id")


class ExamenFinal(Base):
    """Modelo de examen final (evaluación final de curso)"""
    __tablename__ = "examen_final"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    curso_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("curso.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    publicado: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True, index=True)
    aleatorio: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    guarda_calificacion: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    curso: Mapped["Curso"] = relationship("Curso", back_populates="examen_final")
    preguntas: Mapped[List["Pregunta"]] = relationship("Pregunta", back_populates="examen_final", cascade="all, delete-orphan", foreign_keys="Pregunta.examen_final_id")
    intentos: Mapped[List["Intento"]] = relationship("Intento", back_populates="examen_final", foreign_keys="Intento.examen_final_id")
    reglas_acreditacion: Mapped[List["ReglaAcreditacion"]] = relationship("ReglaAcreditacion", back_populates="examen_final", foreign_keys="ReglaAcreditacion.examen_final_id")
    certificados: Mapped[List["Certificado"]] = relationship("Certificado", back_populates="examen_final", foreign_keys="Certificado.examen_final_id")


class Pregunta(Base):
    """Modelo de pregunta (puede ser de quiz o examen final)"""
    __tablename__ = "pregunta"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("quiz.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=True, index=True)
    examen_final_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("examen_final.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=True, index=True)
    enunciado: Mapped[str] = mapped_column(Text, nullable=False)
    puntos: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    orden: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    quiz: Mapped[Optional["Quiz"]] = relationship("Quiz", back_populates="preguntas")
    examen_final: Mapped[Optional["ExamenFinal"]] = relationship("ExamenFinal", back_populates="preguntas")
    config: Mapped[Optional["PreguntaConfig"]] = relationship("PreguntaConfig", back_populates="pregunta", uselist=False, cascade="all, delete-orphan")
    opciones: Mapped[List["Opcion"]] = relationship("Opcion", back_populates="pregunta", cascade="all, delete-orphan")
    intentos_preguntas: Mapped[List["IntentoPregunta"]] = relationship("IntentoPregunta", back_populates="pregunta")
    
    __table_args__ = (
        CheckConstraint(
            "(quiz_id IS NOT NULL AND examen_final_id IS NULL) OR (quiz_id IS NULL AND examen_final_id IS NOT NULL)",
            name="chk_pregunta_quiz_o_examen"
        ),
    )


class PreguntaConfig(Base):
    """Modelo de configuración de pregunta"""
    __tablename__ = "pregunta_config"
    
    pregunta_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("pregunta.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    tipo: Mapped[TipoPregunta] = mapped_column(ENUM(TipoPregunta, name="tipo_pregunta", create_type=False), nullable=False)
    abierta_modelo_respuesta: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    om_seleccion_multiple: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    om_min_selecciones: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    om_max_selecciones: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    vf_respuesta_correcta: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    penaliza_error: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    puntos_por_opcion: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    pregunta: Mapped["Pregunta"] = relationship("Pregunta", back_populates="config")
    
    __table_args__ = (
        CheckConstraint(
            "(tipo = 'ABIERTA' AND abierta_modelo_respuesta IS NOT NULL) OR (tipo != 'ABIERTA')",
            name="chk_abierta_config"
        ),
        CheckConstraint(
            "(tipo = 'VERDADERO_FALSO' AND vf_respuesta_correcta IS NOT NULL) OR (tipo != 'VERDADERO_FALSO')",
            name="chk_vf_config"
        ),
        CheckConstraint(
            "(tipo = 'OPCION_MULTIPLE' AND om_min_selecciones IS NOT NULL AND om_max_selecciones IS NOT NULL) OR (tipo != 'OPCION_MULTIPLE')",
            name="chk_om_config"
        ),
        CheckConstraint(
            "om_min_selecciones IS NULL OR om_max_selecciones IS NULL OR om_min_selecciones <= om_max_selecciones",
            name="chk_om_min_max"
        ),
    )


class Opcion(Base):
    """Modelo de opción de pregunta"""
    __tablename__ = "opcion"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pregunta_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("pregunta.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    texto: Mapped[str] = mapped_column(String(500), nullable=False)
    es_correcta: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    orden: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    pregunta: Mapped["Pregunta"] = relationship("Pregunta", back_populates="opciones")
    respuestas: Mapped[List["Respuesta"]] = relationship("Respuesta", back_populates="opcion")


# =====================================================
# Tablas de Inscripción y Progreso
# =====================================================

class InscripcionCurso(Base):
    """Modelo de inscripción a curso (materia)"""
    __tablename__ = "inscripcion_curso"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuario.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    curso_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("curso.id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False, index=True)
    estado: Mapped[EstadoInscripcion] = mapped_column(ENUM(EstadoInscripcion, name="estado_inscripcion", create_type=False), nullable=False, default=EstadoInscripcion.ACTIVA, server_default="ACTIVA", index=True)
    acreditado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false", index=True)
    acreditado_en: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    fecha_inscripcion: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_conclusion: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="inscripciones")
    curso: Mapped["Curso"] = relationship("Curso", back_populates="inscripciones")
    intentos: Mapped[List["Intento"]] = relationship("Intento", back_populates="inscripcion_curso", cascade="all, delete-orphan")
    certificados: Mapped[List["Certificado"]] = relationship("Certificado", back_populates="inscripcion_curso", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint("usuario_id", "curso_id", name="uq_usuario_curso"),
        CheckConstraint("fecha_conclusion IS NULL OR fecha_conclusion >= fecha_inscripcion", name="chk_fechas_inscripcion"),
    )


class Intento(Base):
    """Modelo de intento de quiz o examen final"""
    __tablename__ = "intento"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuario.id", ondelete="NO ACTION", onupdate="CASCADE"), nullable=False, index=True)
    quiz_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("quiz.id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=True, index=True)
    examen_final_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("examen_final.id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=True, index=True)
    inscripcion_curso_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("inscripcion_curso.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    numero_intento: Mapped[int] = mapped_column(Integer, nullable=False)
    puntaje: Mapped[Optional[Numeric]] = mapped_column(Numeric(5, 2), nullable=True)
    resultado: Mapped[Optional[ResultadoIntento]] = mapped_column(ENUM(ResultadoIntento, name="resultado_intento", create_type=False), nullable=True, index=True)
    iniciado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    finalizado_en: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    permitir_nuevo_intento: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="intentos")
    quiz: Mapped[Optional["Quiz"]] = relationship("Quiz", back_populates="intentos")
    examen_final: Mapped[Optional["ExamenFinal"]] = relationship("ExamenFinal", back_populates="intentos")
    inscripcion_curso: Mapped["InscripcionCurso"] = relationship("InscripcionCurso", back_populates="intentos")
    preguntas: Mapped[List["IntentoPregunta"]] = relationship("IntentoPregunta", back_populates="intento", cascade="all, delete-orphan")
    certificados: Mapped[List["Certificado"]] = relationship("Certificado", back_populates="intento")
    
    __table_args__ = (
        CheckConstraint(
            "(quiz_id IS NOT NULL AND examen_final_id IS NULL) OR (quiz_id IS NULL AND examen_final_id IS NOT NULL)",
            name="chk_intento_quiz_o_examen"
        ),
        UniqueConstraint("usuario_id", "quiz_id", "inscripcion_curso_id", "numero_intento", name="uq_intento_usuario_quiz_inscripcion"),
    )


class IntentoPregunta(Base):
    """Modelo de pregunta en un intento"""
    __tablename__ = "intento_pregunta"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    intento_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("intento.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    pregunta_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("pregunta.id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False, index=True)
    puntos_maximos: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    orden: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    intento: Mapped["Intento"] = relationship("Intento", back_populates="preguntas")
    pregunta: Mapped["Pregunta"] = relationship("Pregunta", back_populates="intentos_preguntas")
    respuestas: Mapped[List["Respuesta"]] = relationship("Respuesta", back_populates="intento_pregunta", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint("intento_id", "pregunta_id", name="uq_intento_pregunta"),
    )


class Respuesta(Base):
    """Modelo de respuesta a pregunta en intento"""
    __tablename__ = "respuesta"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    intento_pregunta_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("intento_pregunta.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    respuesta_texto: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    opcion_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("opcion.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True, index=True)
    respuesta_bool: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    intento_pregunta: Mapped["IntentoPregunta"] = relationship("IntentoPregunta", back_populates="respuestas")
    opcion: Mapped[Optional["Opcion"]] = relationship("Opcion", back_populates="respuestas")


# =====================================================
# Tablas de Reglas y Certificados
# =====================================================

class ReglaAcreditacion(Base):
    """Modelo de regla de acreditación"""
    __tablename__ = "regla_acreditacion"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    curso_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("curso.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    quiz_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("quiz.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=True, index=True)
    examen_final_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("examen_final.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=True, index=True)
    min_score_aprobatorio: Mapped[Numeric] = mapped_column(Numeric(5, 2), nullable=False, default=80.00, server_default="80.00")
    max_intentos_quiz: Mapped[int] = mapped_column(Integer, nullable=False, default=3, server_default="3")
    bloquea_curso_por_reprobacion_quiz: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    activa: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true", index=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    curso: Mapped["Curso"] = relationship("Curso", back_populates="reglas_acreditacion")
    quiz: Mapped[Optional["Quiz"]] = relationship("Quiz", back_populates="reglas_acreditacion")
    examen_final: Mapped[Optional["ExamenFinal"]] = relationship("ExamenFinal", back_populates="reglas_acreditacion")
    
    __table_args__ = (
        CheckConstraint(
            "(quiz_id IS NOT NULL AND examen_final_id IS NULL) OR (quiz_id IS NULL AND examen_final_id IS NOT NULL) OR (quiz_id IS NULL AND examen_final_id IS NULL)",
            name="chk_regla_quiz_o_examen"
        ),
    )


class Certificado(Base):
    """Modelo de certificado"""
    __tablename__ = "certificado"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inscripcion_curso_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("inscripcion_curso.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    quiz_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("quiz.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True, index=True)
    examen_final_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("examen_final.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True, index=True)
    intento_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("intento.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True, index=True)
    folio: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    hash_verificacion: Mapped[Optional[str]] = mapped_column(String(128), unique=True, nullable=True, index=True)
    s3_key: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    emitido_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    valido: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true", index=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    inscripcion_curso: Mapped["InscripcionCurso"] = relationship("InscripcionCurso", back_populates="certificados")
    quiz: Mapped[Optional["Quiz"]] = relationship("Quiz", back_populates="certificados")
    examen_final: Mapped[Optional["ExamenFinal"]] = relationship("ExamenFinal", back_populates="certificados")
    intento: Mapped[Optional["Intento"]] = relationship("Intento", back_populates="certificados")


# =====================================================
# Tablas de Interacción
# =====================================================

class ForoComentario(Base):
    """Modelo de comentario en foro"""
    __tablename__ = "foro_comentario"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuario.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    curso_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("curso.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    leccion_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("leccion.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    contenido: Mapped[str] = mapped_column(Text, nullable=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="comentarios")
    curso: Mapped["Curso"] = relationship("Curso", back_populates="comentarios")
    leccion: Mapped["Leccion"] = relationship("Leccion", back_populates="comentarios")


class PreferenciaNotificacion(Base):
    """Modelo de preferencias de notificación del usuario"""
    __tablename__ = "preferencia_notificacion"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuario.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, unique=True, index=True)
    email_recordatorios: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    email_motivacion: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    email_resultados: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="preferencias")

