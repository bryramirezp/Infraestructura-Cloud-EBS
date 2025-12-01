"""
Helpers para BackgroundTasks de FastAPI.

Proporciona utilidades para crear sesiones de BD independientes en background tasks,
ya que las tareas NO deben usar la sesión del request (se cierra cuando termina).
"""

import logging
from typing import AsyncGenerator
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import SessionLocal

logger = logging.getLogger(__name__)


@asynccontextmanager
async def get_background_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Context manager para obtener una sesión de BD independiente en background tasks.
    
    IMPORTANTE: Las background tasks NO deben usar la sesión del request.
    Esta función crea una sesión completamente independiente que se puede usar
    después de que el request haya terminado.
    
    Usage:
        async def my_background_task(resource_id: UUID):
            async with get_background_db_session() as db:
                # Usar db aquí - es una sesión nueva e independiente
                service = MyService(db)
                await service.do_something(resource_id)
    
    Returns:
        AsyncSession independiente del request
    """
    async with SessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Error in background task database session: {e}", exc_info=True)
            await session.rollback()
            raise
        finally:
            await session.close()

