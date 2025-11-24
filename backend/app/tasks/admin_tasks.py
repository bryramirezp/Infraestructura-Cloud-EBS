"""
Tareas administrativas pesadas que se ejecutan en background.

Operaciones que pueden tomar tiempo y no deben bloquear la interfaz de administración.
"""

import logging
import uuid
from typing import List, Optional

from app.utils.background_tasks import get_background_db_session
from app.database.models import Intento, Usuario, InscripcionCurso
from sqlalchemy import select, delete, update, and_

logger = logging.getLogger(__name__)


async def reset_intentos_masivo(
    usuario_id: Optional[uuid.UUID] = None,
    curso_id: Optional[uuid.UUID] = None,
    intento_ids: Optional[List[uuid.UUID]] = None
):
    """
    Reset masivo de intentos en background.
    
    Puede resetear intentos por usuario, curso, o lista específica de intentos.
    Esta operación puede ser lenta si hay muchos intentos.
    
    Args:
        usuario_id: Opcional, resetear todos los intentos de un usuario
        curso_id: Opcional, resetear todos los intentos de un curso
        intento_ids: Opcional, lista específica de IDs de intentos a resetear
    """
    async with get_background_db_session() as db:
        try:
            logger.info(
                f"Iniciando reset masivo de intentos: usuario_id={usuario_id}, "
                f"curso_id={curso_id}, intento_ids={intento_ids}"
            )
            
            conditions = []
            
            if intento_ids:
                stmt = (
                    update(Intento)
                    .where(Intento.id.in_(intento_ids))
                    .values(permitir_nuevo_intento=True)
                )
                result = await db.execute(stmt)
                count = result.rowcount
                await db.commit()
                logger.info(f"Reseteados {count} intentos específicos")
                return
            
            if usuario_id:
                stmt = (
                    select(Intento.id)
                    .join(InscripcionCurso)
                    .where(InscripcionCurso.usuario_id == usuario_id)
                )
                result = await db.execute(stmt)
                intento_ids_list = [row[0] for row in result.fetchall()]
                
                if intento_ids_list:
                    stmt = (
                        update(Intento)
                        .where(Intento.id.in_(intento_ids_list))
                        .values(permitir_nuevo_intento=True)
                    )
                    await db.execute(stmt)
                    await db.commit()
                    logger.info(f"Reseteados {len(intento_ids_list)} intentos del usuario {usuario_id}")
                    return
            
            if curso_id:
                stmt = (
                    select(Intento.id)
                    .join(InscripcionCurso)
                    .where(InscripcionCurso.curso_id == curso_id)
                )
                result = await db.execute(stmt)
                intento_ids_list = [row[0] for row in result.fetchall()]
                
                if intento_ids_list:
                    stmt = (
                        update(Intento)
                        .where(Intento.id.in_(intento_ids_list))
                        .values(permitir_nuevo_intento=True)
                    )
                    await db.execute(stmt)
                    await db.commit()
                    logger.info(f"Reseteados {len(intento_ids_list)} intentos del curso {curso_id}")
                    return
            
            logger.warning("No se especificaron criterios para reset de intentos")
            
        except Exception as e:
            logger.error(
                f"Error en reset masivo de intentos: {str(e)}",
                exc_info=True
            )
            try:
                await db.rollback()
            except Exception:
                pass
            raise


async def limpiar_datos_antiguos(
    dias_antiguedad: int = 365,
    eliminar_intentos: bool = False,
    eliminar_inscripciones_inactivas: bool = False
):
    """
    Limpiar datos antiguos en background.
    
    Esta operación puede ser muy lenta dependiendo del volumen de datos.
    
    Args:
        dias_antiguedad: Días de antigüedad mínima para considerar datos como antiguos
        eliminar_intentos: Si True, eliminar intentos antiguos
        eliminar_inscripciones_inactivas: Si True, eliminar inscripciones inactivas antiguas
    """
    async with get_background_db_session() as db:
        try:
            from datetime import datetime, timedelta
            fecha_limite = datetime.now() - timedelta(days=dias_antiguedad)
            
            logger.info(f"Iniciando limpieza de datos antiguos anteriores a {fecha_limite}")
            
            total_eliminados = 0
            
            if eliminar_intentos:
                stmt = delete(Intento).where(
                    Intento.creado_en < fecha_limite
                )
                result = await db.execute(stmt)
                count = result.rowcount
                total_eliminados += count
                logger.info(f"Eliminados {count} intentos antiguos")
            
            if eliminar_inscripciones_inactivas:
                stmt = (
                    delete(InscripcionCurso)
                    .where(
                        and_(
                            InscripcionCurso.creado_en < fecha_limite,
                            InscripcionCurso.estado == "INACTIVA"
                        )
                    )
                )
                result = await db.execute(stmt)
                count = result.rowcount
                total_eliminados += count
                logger.info(f"Eliminadas {count} inscripciones inactivas antiguas")
            
            await db.commit()
            logger.info(f"Limpieza completada. Total eliminado: {total_eliminados}")
            
        except Exception as e:
            logger.error(
                f"Error en limpieza de datos antiguos: {str(e)}",
                exc_info=True
            )
            try:
                await db.rollback()
            except Exception:
                pass
            raise


async def generar_reporte_masivo(
    curso_id: Optional[uuid.UUID] = None,
    formato: str = "json"
):
    """
    Generar reporte masivo de datos en background.
    
    Esta operación puede ser lenta si hay muchos datos.
    
    Args:
        curso_id: Opcional, filtrar por curso específico
        formato: Formato del reporte ("json", "csv", etc.)
    """
    async with get_background_db_session() as db:
        try:
            logger.info(f"Iniciando generación de reporte masivo: curso_id={curso_id}, formato={formato}")
            
            if curso_id:
                stmt = (
                    select(InscripcionCurso, Usuario)
                    .join(Usuario)
                    .where(InscripcionCurso.curso_id == curso_id)
                )
            else:
                stmt = (
                    select(InscripcionCurso, Usuario)
                    .join(Usuario)
                )
            
            result = await db.execute(stmt)
            rows = result.fetchall()
            
            logger.info(f"Generado reporte con {len(rows)} registros")
            
        except Exception as e:
            logger.error(
                f"Error generando reporte masivo: {str(e)}",
                exc_info=True
            )
            raise

