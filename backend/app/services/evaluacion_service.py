import logging
import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import models
from app.utils.exceptions import NotFoundError

logger = logging.getLogger(__name__)


class EvaluacionService:
    """Lógica de negocio para evaluaciones (Quizzes, Exámenes, Preguntas)."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # --- Quiz ---
    async def get_quiz(self, quiz_id: uuid.UUID) -> models.Quiz:
        stmt = (
            select(models.Quiz)
            .options(selectinload(models.Quiz.preguntas).selectinload(models.Pregunta.opciones))
            .where(models.Quiz.id == quiz_id)
        )
        result = await self.db.execute(stmt)
        quiz = result.scalar_one_or_none()
        if not quiz:
            raise NotFoundError("Quiz", str(quiz_id))
        return quiz

    async def create_quiz(self, data: dict) -> models.Quiz:
        quiz = models.Quiz(**data)
        self.db.add(quiz)
        await self.db.commit()
        await self.db.refresh(quiz)
        return quiz

    async def update_quiz(self, quiz: models.Quiz, data: dict) -> models.Quiz:
        for field, value in data.items():
            if value is not None:
                setattr(quiz, field, value)
        self.db.add(quiz)
        await self.db.commit()
        await self.db.refresh(quiz)
        return quiz

    # --- Preguntas ---
    async def create_pregunta(self, data: dict) -> models.Pregunta:
        pregunta = models.Pregunta(**data)
        self.db.add(pregunta)
        await self.db.commit()
        await self.db.refresh(pregunta)
        return pregunta

    async def get_pregunta(self, pregunta_id: uuid.UUID) -> models.Pregunta:
        stmt = select(models.Pregunta).where(models.Pregunta.id == pregunta_id)
        result = await self.db.execute(stmt)
        pregunta = result.scalar_one_or_none()
        if not pregunta:
            raise NotFoundError("Pregunta", str(pregunta_id))
        return pregunta

    async def update_pregunta(self, pregunta: models.Pregunta, data: dict) -> models.Pregunta:
        for field, value in data.items():
            if value is not None:
                setattr(pregunta, field, value)
        self.db.add(pregunta)
        await self.db.commit()
        await self.db.refresh(pregunta)
        return pregunta

    # --- Opciones ---
    async def create_opcion(self, data: dict) -> models.Opcion:
        opcion = models.Opcion(**data)
        self.db.add(opcion)
        await self.db.commit()
        await self.db.refresh(opcion)
        return opcion
