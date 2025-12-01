import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.evaluacion import (
    QuizResponse,
    QuizCreate,
    QuizUpdate,
    PreguntaCreate,
    PreguntaResponse,
    PreguntaUpdate,
    OpcionCreate,
    OpcionResponse
)
from app.schemas.intento import (
    IntentoCreate,
    IntentoResponse,
    IntentoEnvio
)
from app.services.evaluacion_service import EvaluacionService
from app.services.intento_service import IntentoService
from app.utils.roles import UserRole, require_role, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Evaluaciones"])


# --- Quizzes ---

@router.get("/quizzes/{quiz_id}", response_model=QuizResponse, status_code=status.HTTP_200_OK)
async def get_quiz(
    quiz_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Obtener quiz (sin respuestas correctas si no es admin, lógica pendiente)."""
    service = EvaluacionService(db)
    quiz = await service.get_quiz(quiz_id)
    return quiz


@router.post("/quizzes", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    payload: QuizCreate,
    _: dict = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Crear quiz (Admin)."""
    service = EvaluacionService(db)
    quiz = await service.create_quiz(payload.dict())
    return quiz


# --- Intentos ---

@router.post("/quizzes/{quiz_id}/intentos", response_model=IntentoResponse, status_code=status.HTTP_201_CREATED)
async def iniciar_intento(
    quiz_id: UUID,
    payload: IntentoCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Iniciar un intento de quiz."""
    # Nota: IntentoService debe existir o ser adaptado. Asumimos que existe.
    # Si no existe, usaremos lógica básica aquí o en EvaluacionService.
    # Revisando servicios, IntentoService existe.
    service = IntentoService(db)
    # Necesitamos inscripcion_curso_id. Esto complica un poco si no viene en payload.
    # Por simplicidad, asumimos que el frontend envía el contexto necesario o lo deducimos.
    # Pero IntentoCreate definido antes solo tenía quiz_id.
    # Vamos a necesitar inscripcion_curso_id para crear el intento correctamente.
    # Ajuste rápido: buscar la inscripción activa del usuario para el curso del quiz.
    # Esto requiere lógica extra. Por ahora, dejaremos un TODO o requeriremos que el usuario esté inscrito.
    
    # TODO: Implementar lógica completa de inicio de intento
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.get("/intentos/{intento_id}", response_model=IntentoResponse, status_code=status.HTTP_200_OK)
async def get_intento(
    intento_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Obtener resultado de un intento."""
    service = IntentoService(db)
    intento = await service.get_intento(intento_id)
    # Verificar que el intento pertenece al usuario
    if intento.usuario_id != UUID(current_user["id"]):
         raise HTTPException(status_code=403, detail="No tienes permiso para ver este intento")
    return intento
