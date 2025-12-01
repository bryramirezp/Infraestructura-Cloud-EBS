import logging
import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import models
from app.database.enums import EstadoInscripcion

logger = logging.getLogger(__name__)


class ProgresoService:
    """Lógica de negocio para el progreso del estudiante."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def marcar_leccion_completa(self, usuario_id: uuid.UUID, leccion_id: uuid.UUID):
        # Verificar si ya existe
        stmt = select(models.ProgresoLeccion).where(
            models.ProgresoLeccion.usuario_id == usuario_id,
            models.ProgresoLeccion.leccion_id == leccion_id
        )
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if existing:
            if not existing.completado:
                existing.completado = True
                self.db.add(existing)
                await self.db.commit()
            return existing

        progreso = models.ProgresoLeccion(
            usuario_id=usuario_id,
            leccion_id=leccion_id,
            completado=True
        )
        self.db.add(progreso)
        await self.db.commit()
        await self.db.refresh(progreso)
        return progreso

    async def get_progreso_curso(self, usuario_id: uuid.UUID, curso_id: uuid.UUID):
        # Esto podría ser más complejo, calculando porcentaje
        # Por ahora devolvemos la inscripción que podría tener datos calculados si usamos la vista
        stmt = select(models.InscripcionCurso).where(
            models.InscripcionCurso.usuario_id == usuario_id,
            models.InscripcionCurso.curso_id == curso_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
