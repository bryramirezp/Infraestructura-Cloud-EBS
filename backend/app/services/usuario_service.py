import logging
import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import models
from app.utils.exceptions import NotFoundError, ValidationError

logger = logging.getLogger(__name__)


class UsuarioService:
	"""Operaciones de acceso a datos para usuarios."""

	def __init__(self, db: AsyncSession):
		self.db = db

	async def list(self, *, limit: int = 100, offset: int = 0) -> List[models.Usuario]:
		stmt = (
			select(models.Usuario)
			.options(
				selectinload(models.Usuario.roles).selectinload(models.UsuarioRol.rol),
			)
			.order_by(models.Usuario.creado_en.desc())
			.offset(offset)
			.limit(limit)
		)
		result = await self.db.execute(stmt)
		usuarios = result.scalars().all()
		logger.debug("Usuarios recuperados: %s", len(usuarios))
		return usuarios

	async def get_by_id(self, usuario_id: uuid.UUID) -> models.Usuario:
		stmt = (
			select(models.Usuario)
			.options(
				selectinload(models.Usuario.roles).selectinload(models.UsuarioRol.rol),
			)
			.where(models.Usuario.id == usuario_id)
		)
		result = await self.db.execute(stmt)
		usuario = result.scalar_one_or_none()
		if not usuario:
			raise NotFoundError("Usuario", str(usuario_id))
		return usuario

	async def get_by_cognito_id(self, cognito_user_id: Optional[str]) -> models.Usuario:
		if not cognito_user_id:
			raise ValidationError("Missing cognito user id in token")

		try:
			usuario_id = uuid.UUID(cognito_user_id)
		except ValueError:
			raise ValidationError(f"Invalid UUID format: {cognito_user_id}")

		stmt = (
			select(models.Usuario)
			.options(
				selectinload(models.Usuario.roles).selectinload(models.UsuarioRol.rol),
			)
			.where(models.Usuario.id == usuario_id)
		)
		result = await self.db.execute(stmt)
		usuario = result.scalar_one_or_none()
		if not usuario:
			raise NotFoundError("Usuario", cognito_user_id)
		return usuario

	async def update_profile(self, usuario: models.Usuario, data: dict) -> models.Usuario:
		if not data:
			logger.debug("No hay campos para actualizar en el perfil de usuario %s", usuario.id)
			return usuario

		allowed_fields = {"nombre", "apellido", "avatar_url"}
		for field, value in data.items():
			if field in allowed_fields:
				setattr(usuario, field, value)

		self.db.add(usuario)
		await self.db.commit()
		await self.db.refresh(usuario)
		logger.debug("Perfil de usuario %s actualizado", usuario.id)
		return usuario
