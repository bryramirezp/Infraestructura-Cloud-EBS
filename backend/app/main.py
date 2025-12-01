from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import sys
import traceback

# Importar settings (ahora con inicialización lazy que siempre funciona en desarrollo)
try:
    from app.config import settings
    from app.utils.logging_config import setup_logging
except Exception as e:
    print(f"ERROR: Failed to import settings: {e}", file=sys.stderr)
    sys.exit(1)

<<<<<<< HEAD
# Importar routers con manejo de errores
try:
    from app.routes.auth_routes import router as auth_router
    from app.routes.usuarios import router as usuarios_router
    from app.routes.modulos import router as modulos_router
    from app.routes.cursos import router as cursos_router
    from app.routes.lecciones import router as lecciones_router
    from app.routes.contenidos import router as contenidos_router
    from app.routes.evaluaciones import router as evaluaciones_router
    from app.routes.inscripciones import router as inscripciones_router
    from app.routes.progreso import router as progreso_router
    from app.routes.foro import router as foro_router
except Exception as e:
    print(f"ERROR: Failed to import routers: {e}", file=sys.stderr)
    print(f"Traceback: {traceback.format_exc()}", file=sys.stderr)
    sys.exit(1)

logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
=======
# Configurar logging al inicio
setup_logging()
>>>>>>> 50bb6094d50d71301466789ca430ba62ffdca6f9

logger = logging.getLogger(__name__)

# Import routers
from app.routes.auth_routes import router as auth_router
from app.routes.usuarios import router as usuarios_router
from app.routes.modulos import router as modulos_router
from app.routes.cursos import router as cursos_router
from app.routes.lecciones import router as lecciones_router
from app.routes.quizzes import router as quizzes_router
from app.routes.examenes_finales import router as examenes_finales_router
from app.routes.inscripciones import router as inscripciones_router
from app.routes.progreso import router as progreso_router
from app.routes.foro import router as foro_router
from app.routes.preferencias import router as preferencias_router
from app.routes.certificados import router as certificados_router
from app.routes.admin import router as admin_router
from app.utils.exceptions import EBSException
from app.utils.error_codes import ValidationErrorCodes, InternalErrorCodes


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Manage application startup and shutdown lifecycle."""
    logger.info(f"Starting EBS API in {settings.environment} mode")
    logger.info(f"CORS origins: {settings.cors_origins_list}")
    if settings.database_url:
        logger.info(f"Database URL configured: {settings.database_url[:20]}...")
    else:
        logger.warning("Database URL not configured - running without database connection")
    try:
        yield
    finally:
        logger.info("Shutting down EBS API")


app = FastAPI(
    title="EBS API",
    description="API para Plataforma Digital Escuela Bíblica Salem",
    version="1.0.0",
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register auth router (Cognito routes: /api/auth/login, /api/auth/callback, /api/auth/refresh, /api/auth/logout)
<<<<<<< HEAD
# Usar prefijo /api/auth para consistencia con el frontend
=======
>>>>>>> 50bb6094d50d71301466789ca430ba62ffdca6f9
app.include_router(auth_router, prefix="/api/auth")

# Register API routers (Fase 4: Usuarios, Módulos y Cursos; Fase 5: Lecciones; Fase 6: Quizzes y Exámenes; Fase 7: Inscripciones y Progreso; Fase 9: Foro y Preferencias)
app.include_router(usuarios_router, prefix="/api")
app.include_router(modulos_router, prefix="/api")
app.include_router(cursos_router, prefix="/api")
app.include_router(lecciones_router, prefix="/api")
<<<<<<< HEAD
app.include_router(contenidos_router, prefix="/api")
app.include_router(evaluaciones_router, prefix="/api")
app.include_router(inscripciones_router, prefix="/api")
app.include_router(progreso_router, prefix="/api")
app.include_router(foro_router, prefix="/api")
=======
app.include_router(quizzes_router, prefix="/api")
app.include_router(examenes_finales_router, prefix="/api")
app.include_router(inscripciones_router, prefix="/api")
app.include_router(progreso_router, prefix="/api")
app.include_router(foro_router, prefix="/api")
app.include_router(preferencias_router, prefix="/api")
app.include_router(certificados_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.exception_handler(EBSException)
async def ebs_exception_handler(request: Request, exc: EBSException):
    """
    Handle custom EBS exceptions.
    
    Incluye códigos de error y logging contextual.
    """
    user_id = None
    if hasattr(request.state, "user"):
        user_id = getattr(request.state.user, "sub", None)
    
    logger.warning(
        f"EBSException: {exc.error_code} - {exc.detail}",
        extra={
            "error_code": exc.error_code,
            "status_code": exc.status_code,
            "path": str(request.url.path),
            "method": request.method,
            "user_id": user_id
        }
    )
    
    content = {
        "error": exc.detail,
        "error_code": exc.error_code,
        "status_code": exc.status_code,
        "path": str(request.url.path)
    }
    
    if settings.is_development and hasattr(exc, "__traceback__"):
        content["traceback"] = traceback.format_tb(exc.__traceback__)
    
    return JSONResponse(
        status_code=exc.status_code,
        content=content
    )
>>>>>>> 50bb6094d50d71301466789ca430ba62ffdca6f9


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Handle standard HTTP exceptions.
    
    Para errores HTTP estándar que no son excepciones personalizadas.
    """
    logger.warning(
        f"HTTPException: {exc.status_code} - {exc.detail}",
        extra={
            "status_code": exc.status_code,
            "path": str(request.url.path),
            "method": request.method
        }
    )
    
    content = {
        "error": exc.detail,
        "status_code": exc.status_code,
        "path": str(request.url.path)
    }
    
    if settings.is_development:
        content["error_code"] = "HTTP_ERROR"
    
    return JSONResponse(
        status_code=exc.status_code,
        content=content
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle Pydantic validation errors.
    
    Errores de validación de formato de datos de entrada.
    """
    logger.warning(
        f"Validation error on {request.method} {request.url.path}",
        extra={
            "path": str(request.url.path),
            "method": request.method,
            "errors": exc.errors()
        }
    )
    
    content = {
        "error": "Validation error",
        "error_code": ValidationErrorCodes.VALIDATION_ERROR,
        "details": exc.errors(),
        "path": str(request.url.path)
    }
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=content
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Handle unexpected exceptions.
    
    Captura todas las excepciones no manejadas y las registra con contexto completo.
    Solo muestra stack traces en desarrollo.
    """
    user_id = None
    if hasattr(request.state, "user"):
        user_id = getattr(request.state.user, "sub", None)
    
    logger.error(
        f"Unhandled exception: {type(exc).__name__}: {str(exc)}",
        exc_info=True,
        extra={
            "path": str(request.url.path),
            "method": request.method,
            "user_id": user_id,
            "exception_type": type(exc).__name__
        }
    )
    
    content = {
        "error": "Internal server error",
        "error_code": InternalErrorCodes.INTERNAL_SERVER_ERROR,
        "path": str(request.url.path)
    }
    
    if settings.is_development:
        content["message"] = str(exc)
        content["exception_type"] = type(exc).__name__
        if hasattr(exc, "__traceback__"):
            content["traceback"] = traceback.format_tb(exc.__traceback__)
    else:
        content["message"] = "An unexpected error occurred"
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=content
    )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok"
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "EBS API",
        "version": "1.0.0",
        "docs": "/docs" if settings.is_development else "disabled"
    }

# --- Ejecutar la aplicación ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)