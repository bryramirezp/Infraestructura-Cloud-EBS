import logging
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.preferencia import (
	PreferenciaNotificacionResponse,
	PreferenciaNotificacionUpdate,
)
from app.services.preferencia_service import PreferenciaService
from app.services.usuario_service import UsuarioService
from app.utils.jwt_auth import get_current_user
from app.utils.exceptions import AuthorizationError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/preferencias", tags=["Preferencias"])


@router.get(
	"",
	response_model=PreferenciaNotificacionResponse,
	status_code=status.HTTP_200_OK,
)
async def get_preferencias(
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""Obtener preferencias de notificación del usuario autenticado."""
	service = PreferenciaService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	preferencias = await service.get_or_create_preferencias(usuario.id)
	return PreferenciaNotificacionResponse.from_orm(preferencias)


@router.put(
	"",
	response_model=PreferenciaNotificacionResponse,
	status_code=status.HTTP_200_OK,
)
async def update_preferencias(
	payload: PreferenciaNotificacionUpdate,
	db: AsyncSession = Depends(get_db),
	token_payload: dict = Depends(get_current_user),
):
	"""Actualizar preferencias de notificación del usuario autenticado."""
	service = PreferenciaService(db)
	usuario_service = UsuarioService(db)
	
	usuario = await usuario_service.get_by_cognito_id(token_payload.get("sub"))
	if not usuario:
		raise AuthorizationError("Usuario no encontrado")
	
	preferencias = await service.update_preferencias(
		usuario_id=usuario.id,
		email_recordatorios=payload.email_recordatorios,
		email_motivacion=payload.email_motivacion,
		email_resultados=payload.email_resultados,
	)
	
	return PreferenciaNotificacionResponse.from_orm(preferencias)

