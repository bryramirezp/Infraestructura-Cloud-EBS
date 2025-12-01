import logging
import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import models
from app.utils.exceptions import NotFoundError

logger = logging.getLogger(__name__)


class LeccionService:
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
