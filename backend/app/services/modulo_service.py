import logging
import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import models
from app.utils.exceptions import NotFoundError

logger = logging.getLogger(__name__)


class ModuloService:
	"""Servicios de dominio para módulos y su relación con cursos."""

	def __init__(self, db: Session):
		self.db = db

	def list_modulos(self, *, publicado: Optional[bool] = None) -> List[models.Modulo]:
		stmt = select(models.Modulo)
		if publicado is not None:
			stmt = stmt.where(models.Modulo.publicado == publicado)

		stmt = stmt.order_by(models.Modulo.fecha_inicio.asc(), models.Modulo.titulo.asc())
		modulos = self.db.execute(stmt).scalars().all()
		logger.debug("Modulos recuperados: %s", len(modulos))
		return modulos

	def get_modulo(self, modulo_id: uuid.UUID) -> models.Modulo:
		stmt = select(models.Modulo).where(models.Modulo.id == modulo_id)
		modulo = self.db.execute(stmt).scalar_one_or_none()
		if not modulo:
			raise NotFoundError("Modulo", str(modulo_id))
		return modulo

	def get_modulo_with_cursos(self, modulo_id: uuid.UUID) -> models.Modulo:
		stmt = (
			select(models.Modulo)
			.options(selectinload(models.Modulo.cursos).selectinload(models.ModuloCurso.curso))
			.where(models.Modulo.id == modulo_id)
		)
		modulo = self.db.execute(stmt).scalar_one_or_none()
		if not modulo:
			raise NotFoundError("Modulo", str(modulo_id))
		return modulo

	def create_modulo(self, data: dict) -> models.Modulo:
		modulo = models.Modulo(**data)
		self.db.add(modulo)
		self.db.commit()
		self.db.refresh(modulo)
		logger.info("Modulo %s creado", modulo.id)
		return modulo

	def update_modulo(self, modulo: models.Modulo, data: dict) -> models.Modulo:
		if not data:
			return modulo

		allowed_fields = {"titulo", "fecha_inicio", "fecha_fin", "publicado"}
		for field, value in data.items():
			if field in allowed_fields and value is not None:
				setattr(modulo, field, value)

		self.db.add(modulo)
		self.db.commit()
		self.db.refresh(modulo)
		logger.info("Modulo %s actualizado", modulo.id)
		return modulo

	def list_cursos_by_modulo(self, modulo_id: uuid.UUID) -> List[models.Curso]:
		stmt = (
			select(models.Curso)
			.join(models.ModuloCurso, models.ModuloCurso.curso_id == models.Curso.id)
			.where(models.ModuloCurso.modulo_id == modulo_id)
			.order_by(models.ModuloCurso.slot.asc())
		)
		cursos = self.db.execute(stmt).scalars().all()
		logger.debug("Cursos recuperados para modulo %s: %s", modulo_id, len(cursos))
		return cursos
