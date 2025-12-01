import logging
import uuid
from typing import List, Optional
<<<<<<< HEAD

from sqlalchemy import select
=======
from datetime import date, datetime

from sqlalchemy import select, and_, or_
>>>>>>> 50bb6094d50d71301466789ca430ba62ffdca6f9
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import models
<<<<<<< HEAD
from app.utils.exceptions import NotFoundError
=======
from app.database.enums import EstadoInscripcion
from app.utils.exceptions import NotFoundError, AuthorizationError, BusinessRuleError
>>>>>>> 50bb6094d50d71301466789ca430ba62ffdca6f9

logger = logging.getLogger(__name__)


class LeccionService:
<<<<<<< HEAD
    """Lógica de negocio para lecciones y contenidos."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_leccion(self, leccion_id: uuid.UUID) -> models.Leccion:
        stmt = (
            select(models.Leccion)
            .options(selectinload(models.Leccion.contenidos))
            .where(models.Leccion.id == leccion_id)
        )
        result = await self.db.execute(stmt)
        leccion = result.scalar_one_or_none()
        if not leccion:
            raise NotFoundError("Leccion", str(leccion_id))
        return leccion

    async def create_leccion(self, data: dict) -> models.Leccion:
        leccion = models.Leccion(**data)
        self.db.add(leccion)
        await self.db.commit()
        await self.db.refresh(leccion)
        logger.info("Leccion %s creada", leccion.id)
        return leccion

    async def update_leccion(self, leccion: models.Leccion, data: dict) -> models.Leccion:
        for field, value in data.items():
            if value is not None:
                setattr(leccion, field, value)
        
        self.db.add(leccion)
        await self.db.commit()
        await self.db.refresh(leccion)
        logger.info("Leccion %s actualizada", leccion.id)
        return leccion

    async def delete_leccion(self, leccion: models.Leccion):
        await self.db.delete(leccion)
        await self.db.commit()
        logger.info("Leccion %s eliminada", leccion.id)

    async def add_contenido(self, data: dict) -> models.Contenido:
        contenido = models.Contenido(**data)
        self.db.add(contenido)
        await self.db.commit()
        await self.db.refresh(contenido)
        logger.info("Contenido %s creado para leccion %s", contenido.id, contenido.leccion_id)
        return contenido

    async def get_contenido(self, contenido_id: uuid.UUID) -> models.Contenido:
        stmt = select(models.Contenido).where(models.Contenido.id == contenido_id)
        result = await self.db.execute(stmt)
        contenido = result.scalar_one_or_none()
        if not contenido:
            raise NotFoundError("Contenido", str(contenido_id))
        return contenido

    async def update_contenido(self, contenido: models.Contenido, data: dict) -> models.Contenido:
        for field, value in data.items():
            if value is not None:
                setattr(contenido, field, value)
        
        self.db.add(contenido)
        await self.db.commit()
        await self.db.refresh(contenido)
        logger.info("Contenido %s actualizado", contenido.id)
        return contenido

    async def delete_contenido(self, contenido: models.Contenido):
        await self.db.delete(contenido)
        await self.db.commit()
        logger.info("Contenido %s eliminado", contenido.id)
=======
	"""Lógica de negocio para lecciones."""

	def __init__(self, db: AsyncSession):
		self.db = db

	async def list_lecciones_by_modulo(
		self,
		modulo_id: uuid.UUID,
		*,
		publicado: Optional[bool] = None,
	) -> List[models.Leccion]:
		"""Listar lecciones de un módulo."""
		stmt = select(models.Leccion).where(models.Leccion.modulo_id == modulo_id)
		
		if publicado is not None:
			stmt = stmt.where(models.Leccion.publicado == publicado)
		
		stmt = stmt.order_by(models.Leccion.orden.asc(), models.Leccion.creado_en.asc())
		result = await self.db.execute(stmt)
		lecciones = result.scalars().all()
		logger.debug("Lecciones recuperadas para módulo %s: %s", modulo_id, len(lecciones))
		return lecciones

	async def get_leccion(self, leccion_id: uuid.UUID) -> models.Leccion:
		"""Obtener una lección por ID con módulo cargado (N-a-1 usa joinedload)."""
		stmt = (
			select(models.Leccion)
			.options(joinedload(models.Leccion.modulo))
			.where(models.Leccion.id == leccion_id)
		)
		result = await self.db.execute(stmt)
		leccion = result.scalar_one_or_none()
		if not leccion:
			raise NotFoundError("Lección", str(leccion_id))
		return leccion

	async def get_leccion_with_contenido(self, leccion_id: uuid.UUID) -> models.Leccion:
		"""Obtener lección con su contenido y módulo (optimizado)."""
		stmt = (
			select(models.Leccion)
			.options(
				joinedload(models.Leccion.modulo),
				selectinload(models.Leccion.contenido)
			)
			.where(models.Leccion.id == leccion_id)
		)
		result = await self.db.execute(stmt)
		leccion = result.scalar_one_or_none()
		if not leccion:
			raise NotFoundError("Lección", str(leccion_id))
		return leccion

	async def get_modulo(self, modulo_id: uuid.UUID) -> models.Modulo:
		"""Obtener módulo por ID."""
		from app.services.modulo_service import ModuloService
		modulo_service = ModuloService(self.db)
		return await modulo_service.get_modulo(modulo_id)

	async def validate_modulo_fechas(self, modulo: models.Modulo) -> None:
		"""Validar que el módulo esté dentro de sus fechas de disponibilidad."""
		today = date.today()
		if today < modulo.fecha_inicio:
			raise BusinessRuleError(
				f"El módulo aún no está disponible. Fecha de inicio: {modulo.fecha_inicio}"
			)
		if today > modulo.fecha_fin:
			raise BusinessRuleError(
				f"El módulo ya no está disponible. Fecha de fin: {modulo.fecha_fin}"
			)

	async def validate_usuario_inscrito_en_modulo(
		self,
		usuario_id: uuid.UUID,
		modulo_id: uuid.UUID,
	) -> bool:
		"""
		Validar que el usuario esté inscrito en al menos un curso del módulo.
		Retorna True si está inscrito, False en caso contrario.
		"""
		stmt = (
			select(models.InscripcionCurso)
			.join(
				models.ModuloCurso,
				models.ModuloCurso.curso_id == models.InscripcionCurso.curso_id,
			)
			.where(
				and_(
					models.InscripcionCurso.usuario_id == usuario_id,
					models.ModuloCurso.modulo_id == modulo_id,
					models.InscripcionCurso.estado.in_([EstadoInscripcion.ACTIVA, EstadoInscripcion.PAUSADA]),
				)
			)
		)
		result = await self.db.execute(stmt)
		inscripcion = result.scalar_one_or_none()
		return inscripcion is not None

	async def validate_acceso_leccion(
		self,
		leccion_id: uuid.UUID,
		usuario_id: Optional[uuid.UUID] = None,
		is_admin: bool = False,
	) -> None:
		"""
		Validar acceso a una lección:
		- Si es admin, acceso completo
		- Si no es admin, debe estar inscrito en un curso del módulo
		- El módulo debe estar dentro de sus fechas de disponibilidad
		- La lección debe estar publicada (o admin puede ver no publicadas)
		"""
		leccion = await self.get_leccion(leccion_id)
		modulo = await self.get_modulo(leccion.modulo_id)

		if is_admin:
			return

		if not leccion.publicado:
			raise AuthorizationError("La lección no está publicada")

		await self.validate_modulo_fechas(modulo)

		if usuario_id:
			inscrito = await self.validate_usuario_inscrito_en_modulo(usuario_id, modulo.id)
			if not inscrito:
				raise AuthorizationError(
					"No estás inscrito en ningún curso de este módulo"
				)

	async def list_contenido_leccion(
		self,
		leccion_id: uuid.UUID,
	) -> List[models.LeccionContenido]:
		"""Listar contenido de una lección."""
		stmt = (
			select(models.LeccionContenido)
			.where(models.LeccionContenido.leccion_id == leccion_id)
			.order_by(models.LeccionContenido.orden.asc(), models.LeccionContenido.creado_en.asc())
		)
		result = await self.db.execute(stmt)
		contenido = result.scalars().all()
		logger.debug("Contenido recuperado para lección %s: %s", leccion_id, len(contenido))
		return contenido

	async def create_leccion(self, data: dict) -> models.Leccion:
		"""Crear una nueva lección."""
		modulo_id = data.get("modulo_id")
		if modulo_id:
			await self.get_modulo(modulo_id)

		leccion = models.Leccion(**data)
		self.db.add(leccion)
		await self.db.commit()
		await self.db.refresh(leccion)
		logger.info("Lección %s creada", leccion.id)
		return leccion

	async def update_leccion(self, leccion: models.Leccion, data: dict) -> models.Leccion:
		"""Actualizar una lección existente."""
		if not data:
			return leccion

		allowed_fields = {"titulo", "orden", "publicado"}
		for field, value in data.items():
			if field in allowed_fields and value is not None:
				setattr(leccion, field, value)

		await self.db.commit()
		await self.db.refresh(leccion)
		logger.info("Lección %s actualizada", leccion.id)
		return leccion

>>>>>>> 50bb6094d50d71301466789ca430ba62ffdca6f9
