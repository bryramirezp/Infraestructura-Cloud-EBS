import logging
import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import models
from app.utils.exceptions import NotFoundError, ValidationError

logger = logging.getLogger(__name__)


class UsuarioService:
	"""Operaciones de acceso a datos para usuarios."""

	def __init__(self, db: Session):
		self.db = db

	def list(self, *, limit: int = 100, offset: int = 0) -> List[models.Usuario]:
		stmt = (
			select(models.Usuario)
			.order_by(models.Usuario.creado_en.desc())
			.offset(offset)
			.limit(limit)
		)
		usuarios = self.db.execute(stmt).scalars().all()
		logger.debug("Usuarios recuperados: %s", len(usuarios))
		return usuarios

	def get_by_id(self, usuario_id: uuid.UUID) -> models.Usuario:
		stmt = select(models.Usuario).where(models.Usuario.id == usuario_id)
		usuario = self.db.execute(stmt).scalar_one_or_none()
		if not usuario:
			raise NotFoundError("Usuario", str(usuario_id))
		return usuario

	def get_by_cognito_id(self, cognito_user_id: Optional[str]) -> models.Usuario:
		if not cognito_user_id:
			raise ValidationError("Missing cognito user id in token")

		stmt = select(models.Usuario).where(models.Usuario.cognito_user_id == cognito_user_id)
		usuario = self.db.execute(stmt).scalar_one_or_none()
		if not usuario:
			raise NotFoundError("Usuario", cognito_user_id)
		return usuario

	def update_profile(self, usuario: models.Usuario, data: dict) -> models.Usuario:
		if not data:
			logger.debug("No hay campos para actualizar en el perfil de usuario %s", usuario.id)
			return usuario

		allowed_fields = {"nombre", "apellido", "avatar_url"}
		for field, value in data.items():
			if field in allowed_fields:
				setattr(usuario, field, value)

		self.db.add(usuario)
		self.db.commit()
		self.db.refresh(usuario)
		logger.debug("Perfil de usuario %s actualizado", usuario.id)
		return usuario
