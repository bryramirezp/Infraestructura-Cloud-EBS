from .usuario import *
from .rol import *
from .curso import *
from .modulo import *
from .leccion import *
from .guia_estudio import *
from .evaluacion import *
from .inscripcion import *
from .intento import *
from .certificado import *
from .foro import *
from .preferencia import *
from .regla_acreditacion import *

__all__ = [
    # usuario
    "UsuarioBase", "UsuarioCreate", "UsuarioUpdate", "UsuarioResponse",
    # rol
    "RolBase", "RolResponse",
    # curso
    "CursoBase", "CursoCreate", "CursoUpdate", "CursoResponse", "CursoDetailResponse",
    # modulo
    "ModuloBase", "ModuloCreate", "ModuloUpdate", "ModuloResponse", "ModuloCursoItem", "ModuloDetailResponse",
    # leccion
    "LeccionBase", "LeccionResponse", "LeccionContenidoBase", "LeccionContenidoResponse",
    # guia
    "GuiaEstudioBase", "GuiaEstudioResponse",
    # evaluacion
    "QuizBase", "QuizResponse", "ExamenFinalBase", "ExamenFinalResponse",
    "PreguntaBase", "PreguntaResponse", "PreguntaConfigBase", "OpcionBase", "OpcionResponse",
    # inscripcion
    "InscripcionBase", "InscripcionResponse",
    # intento
    "IntentoBase", "IntentoResponse", "IntentoPreguntaBase", "RespuestaBase",
    # certificado
    "CertificadoBase", "CertificadoResponse",
    # foro
    "ForoComentarioBase", "ForoComentarioResponse",
    # preferencia
    "PreferenciaNotificacionBase", "PreferenciaNotificacionResponse",
    # regla
    "ReglaAcreditacionBase", "ReglaAcreditacionResponse",
]
