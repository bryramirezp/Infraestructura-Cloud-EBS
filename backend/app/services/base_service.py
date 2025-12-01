"""
Clase base para servicios con funcionalidad común.

Proporciona métodos reutilizables para operaciones CRUD básicas y acceso a datos,
reduciendo duplicación entre servicios.
"""

import uuid
from typing import Optional, TypeVar, Generic, Type, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from app.utils.query_helpers import get_or_404, get_optional
from app.utils.exceptions import NotFoundError

T = TypeVar("T")


class BaseService(Generic[T]):
    """
    Clase base abstracta para servicios.
    
    Proporciona métodos comunes para operaciones de acceso a datos.
    Los servicios específicos deben heredar de esta clase y definir el modelo.
    """
    
    def __init__(self, db: AsyncSession, model: Type[T]):
        """
        Inicializar servicio base.
        
        Args:
            db: Sesión de base de datos
            model: Modelo SQLAlchemy que maneja este servicio
        """
        self.db = db
        self.model = model
    
    async def get_by_id(
        self,
        resource_id: uuid.UUID,
        resource_name: Optional[str] = None
    ) -> T:
        """
        Obtener un recurso por ID o lanzar NotFoundError.
        
        Args:
            resource_id: ID del recurso
            resource_name: Nombre del recurso para el error (default: nombre del modelo)
        
        Returns:
            Instancia del modelo encontrada
        
        Raises:
            NotFoundError: Si el recurso no existe
        """
        resource_name = resource_name or self.model.__name__
        return await get_or_404(self.db, self.model, resource_id, resource_name)
    
    async def get_optional(self, resource_id: uuid.UUID) -> Optional[T]:
        """
        Obtener un recurso por ID o retornar None si no existe.
        
        Args:
            resource_id: ID del recurso
        
        Returns:
            Instancia del modelo o None
        """
        return await get_optional(self.db, self.model, resource_id)
    
    async def list_all(
        self,
        limit: int = 100,
        offset: int = 0,
        order_by=None
    ) -> List[T]:
        """
        Listar todos los recursos con paginación.
        
        Args:
            limit: Número máximo de resultados
            offset: Desplazamiento para paginación
            order_by: Campo para ordenar (default: creado_en desc)
        
        Returns:
            Lista de instancias del modelo
        """
        stmt = select(self.model)
        
        if order_by is None and hasattr(self.model, 'creado_en'):
            stmt = stmt.order_by(self.model.creado_en.desc())
        elif order_by:
            stmt = stmt.order_by(order_by)
        
        stmt = stmt.limit(limit).offset(offset)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

