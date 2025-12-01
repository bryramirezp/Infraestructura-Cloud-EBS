from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional
import uuid

from app.database.models import ReglaAcreditacion
from app.schemas.regla_acreditacion import ReglaAcreditacionBase
from app.utils.exceptions import EBSException

class ReglaAcreditacionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_reglas(self, skip: int = 0, limit: int = 100) -> List[ReglaAcreditacion]:
        """Obtener lista de reglas de acreditación"""
        stmt = select(ReglaAcreditacion).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_regla(self, regla_id: uuid.UUID) -> Optional[ReglaAcreditacion]:
        """Obtener regla por ID"""
        stmt = select(ReglaAcreditacion).where(ReglaAcreditacion.id == regla_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_regla(self, regla: ReglaAcreditacionBase) -> ReglaAcreditacion:
        """Crear nueva regla de acreditación"""
        # Validar unicidad (solo una regla por target)
        conditions = [ReglaAcreditacion.curso_id == regla.curso_id]
        
        if regla.quiz_id:
            conditions.append(ReglaAcreditacion.quiz_id == regla.quiz_id)
        elif regla.examen_final_id:
            conditions.append(ReglaAcreditacion.examen_final_id == regla.examen_final_id)
        else:
            # Regla general del curso (sin quiz ni examen específico)
            conditions.append(ReglaAcreditacion.quiz_id.is_(None))
            conditions.append(ReglaAcreditacion.examen_final_id.is_(None))
        
        stmt = select(ReglaAcreditacion).where(and_(*conditions))
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()
            
        if existing:
            raise EBSException(
                status_code=400,
                detail="Ya existe una regla de acreditación para este objetivo",
                error_code="DUPLICATE_RULE"
            )

        db_regla = ReglaAcreditacion(**regla.model_dump())
        self.db.add(db_regla)
        await self.db.commit()
        await self.db.refresh(db_regla)
        return db_regla

    async def update_regla(self, regla_id: uuid.UUID, regla_update: ReglaAcreditacionBase) -> ReglaAcreditacion:
        """Actualizar regla existente"""
        db_regla = await self.get_regla(regla_id)
        if not db_regla:
            raise EBSException(status_code=404, detail="Regla no encontrada", error_code="RULE_NOT_FOUND")

        for key, value in regla_update.model_dump(exclude_unset=True).items():
            setattr(db_regla, key, value)

        await self.db.commit()
        await self.db.refresh(db_regla)
        return db_regla

    async def delete_regla(self, regla_id: uuid.UUID):
        """Eliminar regla"""
        db_regla = await self.get_regla(regla_id)
        if not db_regla:
            raise EBSException(status_code=404, detail="Regla no encontrada", error_code="RULE_NOT_FOUND")

        self.db.delete(db_regla)
        await self.db.commit()

def get_regla_acreditacion_service(db: AsyncSession) -> ReglaAcreditacionService:
    return ReglaAcreditacionService(db)
