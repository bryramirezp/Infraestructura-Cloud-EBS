import logging
import uuid
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import models
from app.utils.exceptions import NotFoundError

logger = logging.getLogger(__name__)


class ForoService:
    """Lógica de negocio para el foro."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_comentarios(self, leccion_id: uuid.UUID) -> List[models.ForoComentario]:
        stmt = (
            select(models.ForoComentario)
            .options(selectinload(models.ForoComentario.usuario))
            .where(models.ForoComentario.leccion_id == leccion_id)
            .order_by(models.ForoComentario.creado_en.asc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def create_comentario(self, data: dict) -> models.ForoComentario:
        comentario = models.ForoComentario(**data)
        self.db.add(comentario)
        await self.db.commit()
        await self.db.refresh(comentario)
        return comentario
