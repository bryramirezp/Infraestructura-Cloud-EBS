from __future__ import annotations

from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime, date
from decimal import Decimal
from app.database.enums import EstadoInscripcion


# =====================================================
# Progress Schemas
# =====================================================

class ProgressResponse(BaseModel):
    """Progreso en un curso específico"""
    curso_id: uuid.UUID
    curso_titulo: Optional[str] = None
    inscripcion_id: Optional[uuid.UUID] = None
    estado: EstadoInscripcion
    acreditado: bool
    
    # Progreso de lecciones
    lecciones_completadas: int = 0
    total_lecciones: int = 0
    porcentaje_lecciones: Decimal = Decimal("0.00")
    
    # Progreso de quizzes
    quizzes_completados: int = 0
    total_quizzes: int = 0
    quizzes_aprobados: int = 0
    porcentaje_quizzes: Decimal = Decimal("0.00")
    
    # Examen final
    examen_final_completado: bool = False
    examen_final_aprobado: bool = False
    
    # Progreso general
    progreso_general: Decimal = Decimal("0.00")
    
    # Fechas
    fecha_inscripcion: Optional[date] = None
    fecha_conclusion: Optional[date] = None
    acreditado_en: Optional[datetime] = None
    ultima_actividad: Optional[datetime] = None
    
    # Calificación
    calificacion_promedio: Optional[Decimal] = None
    puntaje_examen_final: Optional[Decimal] = None
    
    # Ubicación actual
    leccion_actual_id: Optional[uuid.UUID] = None
    leccion_actual_titulo: Optional[str] = None

    class Config:
        from_attributes = True


class ProgressModuloResponse(BaseModel):
    """Progreso en un módulo completo"""
    modulo_id: uuid.UUID
    modulo_titulo: Optional[str] = None
    estado: EstadoInscripcion
    acreditado: bool
    
    # Progreso de cursos
    cursos_completados: int = 0
    total_cursos: int = 0
    cursos_en_progreso: int = 0
    porcentaje_cursos: Decimal = Decimal("0.00")
    
    # Progreso general del módulo
    progreso_general: Decimal = Decimal("0.00")
    
    # Fechas
    fecha_inscripcion: Optional[date] = None
    fecha_conclusion: Optional[date] = None
    acreditado_en: Optional[datetime] = None
    
    # Progreso por curso
    progreso_cursos: List[ProgressResponse] = []

    class Config:
        from_attributes = True


class ProgressGeneralResponse(BaseModel):
    """Resumen general de progreso del usuario"""
    usuario_id: uuid.UUID
    
    # Estadísticas generales
    total_cursos_inscritos: int = 0
    total_cursos_completados: int = 0
    total_cursos_acreditados: int = 0
    
    total_modulos_inscritos: int = 0
    total_modulos_completados: int = 0
    total_modulos_acreditados: int = 0
    
    # Progreso general
    progreso_general: Decimal = Decimal("0.00")
    
    # Calificaciones
    calificacion_promedio: Optional[Decimal] = None
    
    # Certificados
    certificados_obtenidos: int = 0
    
    # Actividad reciente
    ultima_actividad: Optional[datetime] = None

    class Config:
        from_attributes = True


# =====================================================
# Progress Comparison Schemas
# =====================================================

class ProgressComparisonItem(BaseModel):
    """Item individual en comparación de progreso"""
    usuario_id: uuid.UUID
    nombre: str
    apellido: str
    avatar_url: Optional[str] = None
    progreso: Decimal
    calificacion_promedio: Optional[Decimal] = None
    posicion: int

    class Config:
        from_attributes = True


class ProgressComparisonResponse(BaseModel):
    """Comparación de progreso con otros estudiantes"""
    curso_id: uuid.UUID
    curso_titulo: Optional[str] = None
    
    # Progreso del usuario actual
    mi_progreso: ProgressResponse
    
    # Estadísticas del curso
    total_estudiantes: int = 0
    promedio_general: Decimal = Decimal("0.00")
    
    # Ranking
    mi_posicion: Optional[int] = None
    total_estudiantes_mejores: int = 0
    total_estudiantes_peores: int = 0
    
    # Comparación con otros (top 10)
    top_estudiantes: List[ProgressComparisonItem] = []
    
    # Percentiles
    percentil: Optional[int] = None

    class Config:
        from_attributes = True

