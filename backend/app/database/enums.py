from enum import Enum


class EstadoPublicacion(str, Enum):
    """Estado de publicación de contenido"""
    PUBLICADO = "PUBLICADO"
    NO_PUBLICADO = "NO_PUBLICADO"


class TipoContenido(str, Enum):
    """Tipo de contenido de lección"""
    TEXTO = "TEXTO"
    PDF = "PDF"
    VIDEO = "VIDEO"
    LINK = "LINK"


class EstadoInscripcion(str, Enum):
    """Estado de inscripción a curso"""
    ACTIVA = "ACTIVA"
    PAUSADA = "PAUSADA"
    CONCLUIDA = "CONCLUIDA"
    REPROBADA = "REPROBADA"


class ResultadoIntento(str, Enum):
    """Resultado de un intento de evaluación"""
    APROBADO = "APROBADO"
    NO_APROBADO = "NO_APROBADO"


class TipoPregunta(str, Enum):
    """Tipo de pregunta en evaluación"""
    ABIERTA = "ABIERTA"
    OPCION_MULTIPLE = "OPCION_MULTIPLE"
    VERDADERO_FALSO = "VERDADERO_FALSO"

