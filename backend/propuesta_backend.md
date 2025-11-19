# Propuesta de Mejoras - Backend EBS API

## Resumen Ejecutivo

Análisis del estado actual del backend FastAPI y propuestas de mejora organizadas por prioridad y categoría. El backend tiene una base sólida con arquitectura modular, pero requiere mejoras en seguridad, rendimiento, observabilidad y completitud funcional.

---

## Prioridad Alta (Implementar Inmediatamente)

### 1. Integración RLS (Fase 10 Pendiente)

**Problema**: RLS configurado en BD pero no se establece `app.current_cognito_user_id` en sesiones.

**Impacto**: 
- RLS no funciona efectivamente
- Posible acceso no autorizado
- Inconsistencia entre validaciones de aplicación y BD

**Solución**:
```python
# backend/app/database/rls.py
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

async def set_current_cognito_user_id(db: AsyncSession, cognito_user_id: Optional[str]) -> None:
    """Establecer variable de sesión para RLS"""
    if cognito_user_id:
        await db.execute(text("SET app.current_cognito_user_id = :cognito_id"), 
                        {"cognito_id": cognito_user_id})
    else:
        await db.execute(text("SET app.current_cognito_user_id = NULL"))

async def clear_current_cognito_user_id(db: AsyncSession) -> None:
    """Limpiar variable de sesión"""
    await db.execute(text("SET app.current_cognito_user_id = NULL"))
```

**Actualizar `get_db()` dependency**:
```python
# backend/app/database/session.py
from app.utils.jwt_auth import get_current_user
from app.database.rls import set_current_cognito_user_id, clear_current_cognito_user_id

async def get_db(request: Request) -> AsyncGenerator[AsyncSession, None]:
    async with _get_session_local()() as db:
        try:
            # Obtener cognito_user_id del token JWT
            cognito_user_id = None
            try:
                token_payload = await get_current_user(request)
                cognito_user_id = token_payload.get("sub")
            except:
                pass  # Request no autenticada
            
            # Establecer variable de sesión para RLS
            await set_current_cognito_user_id(db, cognito_user_id)
            
            yield db
        except Exception as e:
            logger.error(f"Database session error: {e}")
            await db.rollback()
            raise
        finally:
            await clear_current_cognito_user_id(db)
            await db.close()
```

**Archivos afectados**:
- `backend/app/database/rls.py` (crear)
- `backend/app/database/session.py` (actualizar)
- Remover filtros manuales de `usuario_id` en servicios donde RLS ya aplica

---

### 2. Manejo de Errores de Triggers PostgreSQL

**Problema**: No se manejan específicamente excepciones de triggers de BD (constraints, validaciones).

**Impacto**: Errores genéricos sin contexto, difícil debugging.

**Solución**:
```python
# backend/app/utils/exceptions.py
from sqlalchemy.exc import IntegrityError
import re

class DatabaseTriggerError(EBSException):
    """Error de trigger de base de datos"""
    def __init__(self, detail: str, trigger_name: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="DATABASE_TRIGGER_ERROR"
        )
        self.trigger_name = trigger_name

def parse_trigger_error(error: IntegrityError) -> DatabaseTriggerError:
    """Parsear error de trigger PostgreSQL a excepción específica"""
    error_msg = str(error.orig)
    
    # Mapeo de triggers a mensajes
    trigger_patterns = {
        r"validar_max_intentos": ("Máximo de intentos alcanzado", "MAX_INTENTOS"),
        r"validar_examen_final_prerequisitos": ("No se cumplen los prerrequisitos para el examen final", "PREREQUISITOS"),
        r"validar_transicion_estado_inscripcion": ("Transición de estado inválida", "ESTADO_INVALIDO"),
        r"validar_acreditacion_curso": ("Error en acreditación", "ACREDITACION"),
        r"validar_respuesta_tipo": ("Tipo de respuesta inválido", "RESPUESTA_TIPO"),
    }
    
    for pattern, (message, code) in trigger_patterns.items():
        if re.search(pattern, error_msg, re.IGNORECASE):
            return DatabaseTriggerError(message, code)
    
    return DatabaseTriggerError("Error de validación en base de datos")
```

**Middleware de manejo**:
```python
# backend/app/main.py
from sqlalchemy.exc import IntegrityError
from app.utils.exceptions import parse_trigger_error

@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    """Handle database integrity errors (triggers, constraints)"""
    trigger_error = parse_trigger_error(exc)
    logger.warning(f"Database integrity error: {exc.orig}")
    return JSONResponse(
        status_code=trigger_error.status_code,
        content={
            "error": trigger_error.detail,
            "error_code": trigger_error.error_code,
            "path": str(request.url.path)
        }
    )
```

---

### 3. Health Check Mejorado

**Problema**: Health check básico sin validación de dependencias.

**Solución**:
```python
# backend/app/routes/health.py
from fastapi import APIRouter, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.s3_service import S3Service
from app.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check básico"""
    return {
        "status": "healthy",
        "environment": settings.environment,
        "version": "1.0.0"
    }

@router.get("/health/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """Readiness check con validación de dependencias"""
    checks = {
        "database": False,
        "s3": False,
        "cognito": bool(settings.cognito_user_pool_id),
    }
    
    # Verificar BD
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception as e:
        logger.error(f"Database check failed: {e}")
    
    # Verificar S3
    try:
        s3_service = S3Service()
        # Intentar listar bucket (operación ligera)
        checks["s3"] = bool(settings.s3_bucket_name)
    except Exception as e:
        logger.error(f"S3 check failed: {e}")
    
    all_ready = all(checks.values())
    status_code = status.HTTP_200_OK if all_ready else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ready" if all_ready else "not_ready",
            "checks": checks,
            "environment": settings.environment
        }
    )
```

---

### 4. Endpoints de Certificados (Fase 8 Pendiente)

**Estado**: Completamente pendiente.

**Implementación**:
```python
# backend/app/routes/certificados.py
# Ver README_Backend.md línea 543-574 para especificaciones completas
```

**Funcionalidades críticas**:
- Generación automática al acreditar (trigger o servicio)
- Descarga de PDF desde S3
- Verificación por hash
- Endpoint público de verificación

---

## Prioridad Media (Implementar en Siguiente Sprint)

### 5. Paginación Estandarizada

**Problema**: Solo `list_usuarios` tiene paginación, otros endpoints pueden retornar miles de registros.

**Solución**:
```python
# backend/app/utils/pagination.py
from typing import Generic, TypeVar, List
from pydantic import BaseModel

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    pages: int
    
    @classmethod
    def create(cls, items: List[T], total: int, page: int, page_size: int):
        pages = (total + page_size - 1) // page_size if page_size > 0 else 0
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages
        )
```

**Aplicar a endpoints**:
- `GET /api/cursos` (puede tener muchos cursos)
- `GET /api/modulos` (puede tener muchos módulos)
- `GET /api/inscripciones` (puede tener muchas inscripciones)
- `GET /api/progreso` (si se expande)

---

### 6. Logging Estructurado

**Problema**: Logging básico sin contexto estructurado.

**Solución**:
```python
# backend/app/utils/logging.py
import logging
import json
from typing import Any, Dict, Optional
from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar('request_id', default='')
user_id_var: ContextVar[str] = ContextVar('user_id', default='')

class StructuredLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
    
    def _extra(self, **kwargs) -> Dict[str, Any]:
        extra = {
            "request_id": request_id_var.get(),
            "user_id": user_id_var.get(),
        }
        extra.update(kwargs)
        return extra
    
    def info(self, message: str, **kwargs):
        self.logger.info(message, extra=self._extra(**kwargs))
    
    def error(self, message: str, **kwargs):
        self.logger.error(message, extra=self._extra(**kwargs))
```

**Middleware de request ID**:
```python
# backend/app/main.py
import uuid
from fastapi import Request
from app.utils.logging import request_id_var

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request_id_var.set(request_id)
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response
```

---

### 7. Manejo de Transacciones para Operaciones Complejas

**Problema**: Algunas operaciones multi-paso no están en transacciones explícitas.

**Ejemplos**:
- Crear intento + crear intento_pregunta (ya tiene bloqueo pesimista en `IntentoService`)
- Generar certificado + subir a S3 + crear registro
- Actualizar inscripción + calcular progreso

**Solución**:
```python
# backend/app/utils/transactions.py
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession

@asynccontextmanager
async def transaction(db: AsyncSession):
    """Context manager para transacciones explícitas"""
    try:
        yield db
        await db.commit()
    except Exception:
        await db.rollback()
        raise

# Uso:
async def generate_certificate(...):
    async with transaction(db):
        # 1. Generar PDF
        # 2. Subir a S3
        # 3. Crear registro en BD
        pass
```

---

### 8. Validación de Integridad Referencial en Servicios

**Problema**: Algunos servicios asumen que las relaciones existen sin validar.

**Ejemplo**: `quiz_service.py` asume que `leccion_id` existe.

**Solución**: Validar relaciones antes de operaciones críticas:
```python
async def get_quiz_by_leccion(self, leccion_id: uuid.UUID) -> Optional[models.Quiz]:
    # Validar que lección existe
    leccion = await self.db.get(models.Leccion, leccion_id)
    if not leccion:
        raise NotFoundError("Lección", str(leccion_id))
    
    # Obtener quiz
    stmt = select(models.Quiz).where(models.Quiz.leccion_id == leccion_id)
    result = await self.db.execute(stmt)
    return result.scalar_one_or_none()
```

---

### 9. Rate Limiting

**Problema**: Sin protección contra abuso de endpoints.

**Solución**:
```python
# Agregar a requirements.txt
# slowapi==0.1.9

# backend/app/middleware/rate_limit.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

# Aplicar a endpoints sensibles:
@router.post("/quizzes/{quiz_id}/enviar")
@limiter.limit("5/minute")  # Máximo 5 intentos por minuto
async def submit_quiz(...):
    pass
```

---

### 10. Documentación OpenAPI Mejorada

**Problema**: Falta ejemplos, descripciones detalladas, códigos de error documentados.

**Solución**:
```python
@router.post(
    "/inscripciones",
    response_model=InscripcionResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {
            "description": "Error de validación",
            "content": {
                "application/json": {
                    "example": {"error": "Curso no disponible", "error_code": "VALIDATION_ERROR"}
                }
            }
        },
        409: {
            "description": "Inscripción ya existe",
            "content": {
                "application/json": {
                    "example": {"error": "Ya estás inscrito en este curso", "error_code": "BUSINESS_RULE_ERROR"}
                }
            }
        }
    },
    summary="Inscribirse a un curso",
    description="Crea una nueva inscripción para el usuario autenticado. El estado inicial es ACTIVA."
)
async def create_inscripcion(...):
    pass
```

---

## Prioridad Baja (Mejoras Futuras)

### 11. Caché para Queries Frecuentes

**Targets**:
- Lista de módulos/cursos públicos (TTL: 5-15 minutos)
- Reglas de acreditación (TTL: 1 hora)
- Perfil de usuario (TTL: 5 minutos)

**Solución**: Redis o in-memory cache:
```python
# backend/app/utils/cache.py
from functools import wraps
from typing import Callable, Any
import hashlib
import json

cache_store = {}  # O usar Redis en producción

def cache_key(*args, **kwargs) -> str:
    """Generate cache key from function arguments"""
    key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
    return hashlib.md5(key_data.encode()).hexdigest()

def cached(ttl: int = 300):
    """Decorator for caching function results"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            key = f"{func.__name__}:{cache_key(*args, **kwargs)}"
            # Check cache
            if key in cache_store:
                return cache_store[key]
            # Execute and cache
            result = await func(*args, **kwargs)
            cache_store[key] = result
            return result
        return wrapper
    return decorator
```

---

### 12. Optimización de Queries N+1

**Estado actual**: Buen uso de `selectinload`, pero revisar:

**Areas a optimizar**:
- Lista de inscripciones con curso (ya tiene `selectinload`)
- Lista de comentarios del foro (ya tiene `selectinload`)
- Progreso de módulo (usar vistas materializadas si es crítico)

**Herramientas**:
```python
# Agregar a requirements.txt
# sqlalchemy-utils==0.41.2  # Para debugging

# En desarrollo, habilitar logging de queries:
# SQLALCHEMY_ECHO=True
```

---

### 13. Endpoints de Administración (Fase 11 Pendiente)

**Estado**: Completamente pendiente.

**Implementación**: Ver README_Backend.md línea 677-707.

**Endpoints críticos**:
- Permitir nuevos intentos (útil para casos especiales)
- Cambiar estados de inscripciones (para coordinadores)
- Gestionar reglas de acreditación

---

### 14. Tests Unitarios y de Integración

**Estado actual**: Solo `test_main.py` básico.

**Cobertura mínima requerida**:
- Servicios críticos (quiz, examen_final, inscripcion)
- Validaciones de reglas de negocio
- Manejo de errores
- Integración con BD (usar pytest-asyncio + testcontainers)

**Estructura**:
```
backend/app/tests/
├── conftest.py  # Fixtures
├── test_services/
│   ├── test_quiz_service.py
│   ├── test_examen_final_service.py
│   └── test_inscripcion_service.py
├── test_routes/
│   ├── test_quizzes.py
│   └── test_inscripciones.py
└── test_utils/
    └── test_exceptions.py
```

---

### 15. Métricas y Observabilidad

**Solución**:
```python
# Agregar a requirements.txt
# prometheus-fastapi-instrumentator==7.0.0

# backend/app/main.py
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)

# Métricas custom:
from prometheus_client import Counter, Histogram

http_requests_total = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])
http_request_duration = Histogram('http_request_duration_seconds', 'HTTP request duration')
```

---

## Resumen de Archivos a Crear/Modificar

### Nuevos Archivos
- `backend/app/database/rls.py`
- `backend/app/routes/health.py`
- `backend/app/routes/certificados.py`
- `backend/app/routes/admin.py`
- `backend/app/utils/pagination.py`
- `backend/app/utils/logging.py`
- `backend/app/utils/transactions.py`
- `backend/app/utils/cache.py`
- `backend/app/middleware/rate_limit.py`

### Archivos a Modificar
- `backend/app/database/session.py` (integrar RLS)
- `backend/app/main.py` (manejo de errores, middleware, health)
- `backend/app/utils/exceptions.py` (DatabaseTriggerError)
- `backend/app/routes/*.py` (agregar paginación, documentación)
- `backend/app/services/*.py` (validaciones, transacciones)
- `backend/requirements.txt` (dependencias nuevas)

---

## Priorización Recomendada

### Sprint 1 (Crítico)
1. Integración RLS
2. Manejo de errores de triggers
3. Health check mejorado
4. Endpoints de certificados

### Sprint 2 (Importante)
5. Paginación estandarizada
6. Logging estructurado
7. Manejo de transacciones
8. Validación de integridad referencial

### Sprint 3 (Mejoras)
9. Rate limiting
10. Documentación OpenAPI
11. Caché básico
12. Tests unitarios básicos

### Sprint 4 (Futuro)
13. Endpoints de administración
14. Métricas y observabilidad
15. Optimizaciones avanzadas

---

## Métricas de Éxito

- **Seguridad**: RLS funcionando en 100% de queries autenticadas
- **Rendimiento**: <200ms p95 para endpoints de lectura
- **Confiabilidad**: <0.1% tasa de error 500
- **Cobertura**: >70% cobertura de tests en servicios críticos
- **Documentación**: 100% de endpoints con ejemplos y descripciones

