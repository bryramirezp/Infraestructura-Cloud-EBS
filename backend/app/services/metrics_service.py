"""
Servicio para métricas comparativas en tiempo real.

Usa SQL window functions para calcular rankings, promedios y percentiles
sin necesidad de pre-calcular valores ni cargar todos los datos en memoria.
"""

import logging
import uuid
from typing import Dict, Optional
from decimal import Decimal
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import models
from app.database.enums import EstadoInscripcion
from app.utils.exceptions import NotFoundError

logger = logging.getLogger(__name__)


class MetricsService:
    """Servicio para métricas comparativas usando SQL window functions"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_curso_metrics(
        self,
        curso_id: uuid.UUID,
        usuario_id: uuid.UUID
    ) -> Dict:
        """
        Calcular métricas comparativas del usuario en un curso.
        
        Usa window functions para calcular en tiempo real:
        - Ranking del estudiante
        - Promedio de progreso del curso
        - Percentil del estudiante
        - Posición relativa (percent_rank)
        
        Args:
            curso_id: ID del curso
            usuario_id: ID del usuario
            
        Returns:
            Dict con métricas comparativas
        """
        inscripcion_stmt = select(models.InscripcionCurso).where(
            models.InscripcionCurso.curso_id == curso_id,
            models.InscripcionCurso.usuario_id == usuario_id
        )
        result = await self.db.execute(inscripcion_stmt)
        inscripcion = result.scalar_one_or_none()
        
        if not inscripcion:
            raise NotFoundError("Inscripción", f"usuario {usuario_id}, curso {curso_id}")
        
        query = text("""
            WITH progreso_estudiantes AS (
                SELECT 
                    ic.id as inscripcion_id,
                    ic.usuario_id,
                    COALESCE(
                        (
                            SELECT 
                                CASE 
                                    WHEN COUNT(*) = 0 THEN 0
                                    ELSE (
                                        COUNT(CASE WHEN i.resultado = 'APROBADO' AND i.quiz_id IS NOT NULL THEN 1 END) * 100.0 /
                                        NULLIF(COUNT(DISTINCT q.id), 0)
                                    )
                                END
                            FROM quiz q
                            JOIN leccion l ON l.id = q.leccion_id
                            JOIN modulo_curso mc ON mc.modulo_id = l.modulo_id
                            WHERE mc.curso_id = :curso_id
                                AND q.publicado = TRUE
                            LEFT JOIN intento i ON i.quiz_id = q.id 
                                AND i.inscripcion_curso_id = ic.id
                                AND i.resultado = 'APROBADO'
                        ), 0
                    ) as progreso_porcentaje
                FROM inscripcion_curso ic
                WHERE ic.curso_id = :curso_id
            ),
            metricas AS (
                SELECT 
                    usuario_id,
                    progreso_porcentaje,
                    RANK() OVER (ORDER BY progreso_porcentaje DESC) as ranking,
                    PERCENT_RANK() OVER (ORDER BY progreso_porcentaje) * 100 as percentil,
                    AVG(progreso_porcentaje) OVER () as promedio_curso,
                    COUNT(*) OVER () as total_estudiantes,
                    MAX(progreso_porcentaje) OVER () as maximo,
                    MIN(progreso_porcentaje) OVER () as minimo
                FROM progreso_estudiantes
            )
            SELECT 
                ranking,
                percentil,
                promedio_curso,
                total_estudiantes,
                maximo,
                minimo,
                progreso_porcentaje
            FROM metricas
            WHERE usuario_id = :usuario_id
        """)
        
        result = await self.db.execute(
            query,
            {"curso_id": str(curso_id), "usuario_id": str(usuario_id)}
        )
        row = result.fetchone()
        
        if not row:
            return {
                "ranking": None,
                "percentil": None,
                "promedio_curso": None,
                "total_estudiantes": 0,
                "maximo": None,
                "minimo": None,
                "progreso_porcentaje": 0
            }
        
        return {
            "ranking": int(row[0]) if row[0] else None,
            "percentil": float(row[1]) if row[1] is not None else None,
            "promedio_curso": float(row[2]) if row[2] is not None else 0.0,
            "total_estudiantes": int(row[3]) if row[3] else 0,
            "maximo": float(row[4]) if row[4] is not None else None,
            "minimo": float(row[5]) if row[5] is not None else None,
            "progreso_porcentaje": float(row[6]) if row[6] is not None else 0.0
        }

    async def get_puntaje_metrics(
        self,
        curso_id: uuid.UUID,
        usuario_id: uuid.UUID
    ) -> Dict:
        """
        Calcular métricas comparativas basadas en puntajes promedio.
        
        Args:
            curso_id: ID del curso
            usuario_id: ID del usuario
            
        Returns:
            Dict con métricas de puntajes
        """
        query = text("""
            WITH puntajes_estudiantes AS (
                SELECT 
                    ic.usuario_id,
                    AVG(i.puntaje) as puntaje_promedio
                FROM inscripcion_curso ic
                JOIN intento i ON i.inscripcion_curso_id = ic.id
                WHERE ic.curso_id = :curso_id
                    AND i.puntaje IS NOT NULL
                GROUP BY ic.usuario_id
            ),
            metricas AS (
                SELECT 
                    usuario_id,
                    puntaje_promedio,
                    RANK() OVER (ORDER BY puntaje_promedio DESC) as ranking_puntaje,
                    PERCENT_RANK() OVER (ORDER BY puntaje_promedio) * 100 as percentil_puntaje,
                    AVG(puntaje_promedio) OVER () as promedio_curso,
                    COUNT(*) OVER () as total_estudiantes,
                    MAX(puntaje_promedio) OVER () as maximo,
                    MIN(puntaje_promedio) OVER () as minimo
                FROM puntajes_estudiantes
            )
            SELECT 
                ranking_puntaje,
                percentil_puntaje,
                promedio_curso,
                total_estudiantes,
                maximo,
                minimo,
                puntaje_promedio
            FROM metricas
            WHERE usuario_id = :usuario_id
        """)
        
        result = await self.db.execute(
            query,
            {"curso_id": str(curso_id), "usuario_id": str(usuario_id)}
        )
        row = result.fetchone()
        
        if not row:
            return {
                "ranking_puntaje": None,
                "percentil_puntaje": None,
                "promedio_curso": None,
                "total_estudiantes": 0,
                "maximo": None,
                "minimo": None,
                "puntaje_promedio": None
            }
        
        return {
            "ranking_puntaje": int(row[0]) if row[0] else None,
            "percentil_puntaje": float(row[1]) if row[1] is not None else None,
            "promedio_curso": float(row[2]) if row[2] is not None else None,
            "total_estudiantes": int(row[3]) if row[3] else 0,
            "maximo": float(row[4]) if row[4] is not None else None,
            "minimo": float(row[5]) if row[5] is not None else None,
            "puntaje_promedio": float(row[6]) if row[6] is not None else None
        }

    async def get_general_metrics(
        self,
        usuario_id: uuid.UUID
    ) -> Dict:
        """
        Calcular métricas generales del usuario comparadas con todos los estudiantes.
        
        Args:
            usuario_id: ID del usuario
            
        Returns:
            Dict con métricas generales
        """
        query = text("""
            WITH cursos_completados AS (
                SELECT 
                    ic.usuario_id,
                    COUNT(*) FILTER (WHERE ic.estado = 'CONCLUIDA') as cursos_completados,
                    COUNT(*) as cursos_total
                FROM inscripcion_curso ic
                GROUP BY ic.usuario_id
            ),
            metricas AS (
                SELECT 
                    usuario_id,
                    cursos_completados,
                    cursos_total,
                    CASE 
                        WHEN cursos_total > 0 THEN (cursos_completados * 100.0 / cursos_total)
                        ELSE 0
                    END as porcentaje_completados,
                    RANK() OVER (ORDER BY cursos_completados DESC) as ranking_completados,
                    PERCENT_RANK() OVER (ORDER BY cursos_completados) * 100 as percentil_completados,
                    AVG(cursos_completados) OVER () as promedio_completados,
                    COUNT(*) OVER () as total_usuarios
                FROM cursos_completados
            )
            SELECT 
                ranking_completados,
                percentil_completados,
                promedio_completados,
                total_usuarios,
                cursos_completados,
                cursos_total,
                porcentaje_completados
            FROM metricas
            WHERE usuario_id = :usuario_id
        """)
        
        result = await self.db.execute(
            query,
            {"usuario_id": str(usuario_id)}
        )
        row = result.fetchone()
        
        if not row:
            return {
                "ranking_completados": None,
                "percentil_completados": None,
                "promedio_completados": None,
                "total_usuarios": 0,
                "cursos_completados": 0,
                "cursos_total": 0,
                "porcentaje_completados": 0.0
            }
        
        return {
            "ranking_completados": int(row[0]) if row[0] else None,
            "percentil_completados": float(row[1]) if row[1] is not None else None,
            "promedio_completados": float(row[2]) if row[2] is not None else None,
            "total_usuarios": int(row[3]) if row[3] else 0,
            "cursos_completados": int(row[4]) if row[4] else 0,
            "cursos_total": int(row[5]) if row[5] else 0,
            "porcentaje_completados": float(row[6]) if row[6] is not None else 0.0
        }

