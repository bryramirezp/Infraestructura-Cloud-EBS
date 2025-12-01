import logging
import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import models
from app.database.enums import EstadoInscripcion
from app.utils.exceptions import NotFoundError, BadRequestError

logger = logging.getLogger(__name__)


class InscripcionService:
    """Lógica de negocio para inscripciones."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def inscribir_usuario(self, usuario_id: uuid.UUID, curso_id: uuid.UUID) -> models.InscripcionCurso:
        # Verificar si ya existe inscripción
        stmt = select(models.InscripcionCurso).where(
            models.InscripcionCurso.usuario_id == usuario_id,
            models.InscripcionCurso.curso_id == curso_id
        )
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if existing:
            if existing.estado == EstadoInscripcion.CANCELADO:
                existing.estado = EstadoInscripcion.ACTIVO
                self.db.add(existing)
                await self.db.commit()
                await self.db.refresh(existing)
                return existing
            raise BadRequestError(f"Usuario ya inscrito en el curso {curso_id}")

        inscripcion = models.InscripcionCurso(
            usuario_id=usuario_id,
            curso_id=curso_id,
            estado=EstadoInscripcion.ACTIVO
        )
        self.db.add(inscripcion)
        await self.db.commit()
        await self.db.refresh(inscripcion)
        logger.info("Usuario %s inscrito en curso %s", usuario_id, curso_id)
        return inscripcion

    async def list_mis_cursos(self, usuario_id: uuid.UUID) -> List[models.InscripcionCurso]:
        stmt = (
            select(models.InscripcionCurso)
            .options(selectinload(models.InscripcionCurso.curso))
            .where(
                models.InscripcionCurso.usuario_id == usuario_id,
                models.InscripcionCurso.estado == EstadoInscripcion.ACTIVO
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()
