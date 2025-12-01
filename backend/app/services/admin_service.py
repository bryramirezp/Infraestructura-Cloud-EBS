from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Optional
import uuid

from app.database.models import Usuario, Rol, UsuarioRol, InscripcionCurso, Intento, EstadoInscripcion
from app.utils.exceptions import EBSException

class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_usuarios(self, skip: int = 0, limit: int = 100) -> List[Usuario]:
        """Listar todos los usuarios"""
        stmt = select(Usuario).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_usuario(self, usuario_id: uuid.UUID) -> Optional[Usuario]:
        """Obtener usuario por ID"""
        stmt = select(Usuario).where(Usuario.id == usuario_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_usuario_roles(self, usuario_id: uuid.UUID, role_names: List[str]) -> Usuario:
        """Actualizar roles de un usuario"""
        usuario = await self.get_usuario(usuario_id)
        if not usuario:
            raise EBSException(status_code=404, detail="Usuario no encontrado", error_code="USER_NOT_FOUND")

        # Obtener IDs de roles
        stmt = select(Rol).where(Rol.nombre.in_(role_names))
        result = await self.db.execute(stmt)
        roles = result.scalars().all()
        if len(roles) != len(role_names):
            raise EBSException(status_code=400, detail="Uno o más roles no existen", error_code="ROLE_NOT_FOUND")

        # Eliminar roles actuales
        stmt = delete(UsuarioRol).where(UsuarioRol.usuario_id == usuario_id)
        await self.db.execute(stmt)

        # Asignar nuevos roles
        for rol in roles:
            usuario_rol = UsuarioRol(usuario_id=usuario_id, rol_id=rol.id)
            self.db.add(usuario_rol)

        await self.db.commit()
        await self.db.refresh(usuario)
        return usuario

    async def get_inscripciones(self, skip: int = 0, limit: int = 100) -> List[InscripcionCurso]:
        """Listar todas las inscripciones"""
        stmt = select(InscripcionCurso).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def update_inscripcion_estado(self, inscripcion_id: uuid.UUID, nuevo_estado: EstadoInscripcion) -> InscripcionCurso:
        """Actualizar estado de inscripción"""
        stmt = select(InscripcionCurso).where(InscripcionCurso.id == inscripcion_id)
        result = await self.db.execute(stmt)
        inscripcion = result.scalar_one_or_none()
        if not inscripcion:
            raise EBSException(status_code=404, detail="Inscripción no encontrada", error_code="ENROLLMENT_NOT_FOUND")

        inscripcion.estado = nuevo_estado
        await self.db.commit()
        await self.db.refresh(inscripcion)
        return inscripcion

    async def get_intentos(self, skip: int = 0, limit: int = 100) -> List[Intento]:
        """Listar todos los intentos"""
        stmt = select(Intento).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def permitir_nuevo_intento(self, intento_id: uuid.UUID) -> Intento:
        """Permitir nuevo intento (recursamiento)"""
        stmt = select(Intento).where(Intento.id == intento_id)
        result = await self.db.execute(stmt)
        intento = result.scalar_one_or_none()
        if not intento:
            raise EBSException(status_code=404, detail="Intento no encontrado", error_code="ATTEMPT_NOT_FOUND")

        intento.permitir_nuevo_intento = True
        await self.db.commit()
        await self.db.refresh(intento)
        return intento

def get_admin_service(db: AsyncSession) -> AdminService:
    return AdminService(db)
