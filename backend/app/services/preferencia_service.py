import logging
import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import models
from app.utils.exceptions import NotFoundError

logger = logging.getLogger(__name__)


class PreferenciaService:
	"""Lógica de negocio para preferencias de notificación."""

	def __init__(self, db: AsyncSession):
		self.db = db

	async def get_preferencias(
		self,
		usuario_id: uuid.UUID,
	) -> Optional[models.PreferenciaNotificacion]:
		"""Obtener preferencias de un usuario."""
		stmt = (
			select(models.PreferenciaNotificacion)
			.options(selectinload(models.PreferenciaNotificacion.usuario))
			.where(models.PreferenciaNotificacion.usuario_id == usuario_id)
		)
		result = await self.db.execute(stmt)
		return result.scalar_one_or_none()

	async def get_or_create_preferencias(
		self,
		usuario_id: uuid.UUID,
	) -> models.PreferenciaNotificacion:
		"""Obtener preferencias o crear si no existen."""
		preferencias = await self.get_preferencias(usuario_id)
		
		if not preferencias:
			preferencias = models.PreferenciaNotificacion(
				usuario_id=usuario_id,
				email_recordatorios=None,
				email_motivacion=None,
				email_resultados=None,
			)
			self.db.add(preferencias)
			await self.db.commit()
			await self.db.refresh(preferencias)
			logger.info("Preferencias creadas para usuario %s", usuario_id)
		
		return preferencias

	async def update_preferencias(
		self,
		usuario_id: uuid.UUID,
		email_recordatorios: Optional[bool] = None,
		email_motivacion: Optional[bool] = None,
		email_resultados: Optional[bool] = None,
	) -> models.PreferenciaNotificacion:
		"""Actualizar preferencias de un usuario."""
		preferencias = await self.get_or_create_preferencias(usuario_id)
		
		if email_recordatorios is not None:
			preferencias.email_recordatorios = email_recordatorios
		if email_motivacion is not None:
			preferencias.email_motivacion = email_motivacion
		if email_resultados is not None:
			preferencias.email_resultados = email_resultados
		
		self.db.add(preferencias)
		await self.db.commit()
		await self.db.refresh(preferencias)
		logger.info("Preferencias actualizadas para usuario %s", usuario_id)
		return preferencias

