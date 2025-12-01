import logging
import sys
from app.config import settings


def setup_logging():
    """
    Configurar logging básico según el entorno.
    
    - Development: DEBUG level, formato detallado
    - Production: INFO level, formato simple
    
    CloudWatch captura stdout/stderr automáticamente,
    no requiere configuración adicional.
    """
    log_level = logging.DEBUG if settings.is_development else logging.INFO
    
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"
    
    logging.basicConfig(
        level=log_level,
        format=log_format,
        datefmt=date_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ],
        force=True
    )
    
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("gunicorn").setLevel(logging.INFO)
    
    logger = logging.getLogger(__name__)
    logger.info(f"Logging configured - Level: {logging.getLevelName(log_level)}, Environment: {settings.environment}")

