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
except Exception as e:
    print(f"ERROR: Failed to import settings: {e}", file=sys.stderr)
    print(f"Traceback: {traceback.format_exc()}", file=sys.stderr)
    sys.exit(1)

# Importar routers con manejo de errores
try:
    from app.routes.auth_routes import router as auth_router
    from app.routes.usuarios import router as usuarios_router
    from app.routes.modulos import router as modulos_router
    from app.routes.cursos import router as cursos_router
except Exception as e:
    print(f"ERROR: Failed to import routers: {e}", file=sys.stderr)
    print(f"Traceback: {traceback.format_exc()}", file=sys.stderr)
    sys.exit(1)

logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)


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

# Register auth router (Cognito routes: /auth/login, /auth/callback, /auth/refresh, /auth/logout)
app.include_router(auth_router, prefix="/auth")

# Register API routers (Fase 4: Usuarios, Módulos y Cursos)
app.include_router(usuarios_router, prefix="/api")
app.include_router(modulos_router, prefix="/api")
app.include_router(cursos_router, prefix="/api")


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "path": str(request.url.path)
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation error",
            "details": exc.errors(),
            "path": str(request.url.path)
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred" if settings.is_production else str(exc),
            "path": str(request.url.path)
        }
    )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.environment,
        "version": "1.0.0"
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