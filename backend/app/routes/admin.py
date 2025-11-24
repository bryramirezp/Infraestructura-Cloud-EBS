from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from app.database.session import get_db
from app.database.models import Usuario, InscripcionCurso, Intento, ReglaAcreditacion, EstadoInscripcion
from app.schemas.usuario import UsuarioResponse
from app.schemas.inscripcion import InscripcionResponse
from app.schemas.intento import IntentoResponse
from app.schemas.regla_acreditacion import ReglaAcreditacionResponse, ReglaAcreditacionBase
from app.services.admin_service import AdminService
from app.services.regla_acreditacion_service import ReglaAcreditacionService
from app.utils.roles import require_role, UserRole

router = APIRouter(
    prefix="/admin", 
    tags=["Administración"],
    dependencies=[Depends(require_role([UserRole.ADMIN]))]
)

@router.get(
    "/usuarios",
    response_model=List[UsuarioResponse],
    status_code=status.HTTP_200_OK
)
async def listar_usuarios(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    db: AsyncSession = Depends(get_db)
):
    """
    Listar todos los usuarios con paginación.
    
    - **Permisos**: Requiere rol de administrador
    - **Paginación**: Usa skip/limit para paginación
    - **Respuesta**: Lista paginada de usuarios
    """
    admin_service = AdminService(db)
    usuarios = await admin_service.get_usuarios(skip, limit)
    return [UsuarioResponse.from_orm(usuario) for usuario in usuarios]

@router.put(
    "/usuarios/{usuario_id}/roles",
    response_model=UsuarioResponse,
    status_code=status.HTTP_200_OK
)
async def actualizar_roles_usuario(
    usuario_id: uuid.UUID,
    roles: List[str] = Body(..., embed=True),
    db: AsyncSession = Depends(get_db)
):
    """
    Actualizar roles de un usuario.
    
    - **Permisos**: Requiere rol de administrador
    - **Parámetros**: `usuario_id` - ID del usuario, `roles` - Lista de nombres de roles
    - **Respuesta**: Usuario actualizado con nuevos roles
    """
    admin_service = AdminService(db)
    usuario = await admin_service.update_usuario_roles(usuario_id, roles)
    return UsuarioResponse.from_orm(usuario)

@router.get(
    "/inscripciones",
    response_model=List[InscripcionResponse],
    status_code=status.HTTP_200_OK
)
async def listar_inscripciones(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    db: AsyncSession = Depends(get_db)
):
    """
    Listar todas las inscripciones con paginación.
    
    - **Permisos**: Requiere rol de administrador
    - **Paginación**: Usa skip/limit para paginación
    - **Respuesta**: Lista paginada de inscripciones
    """
    admin_service = AdminService(db)
    inscripciones = await admin_service.get_inscripciones(skip, limit)
    return [InscripcionResponse.from_orm(inscripcion) for inscripcion in inscripciones]

@router.put(
    "/inscripciones/{inscripcion_id}/estado",
    response_model=InscripcionResponse,
    status_code=status.HTTP_200_OK
)
async def actualizar_estado_inscripcion(
    inscripcion_id: uuid.UUID,
    estado: EstadoInscripcion = Body(..., embed=True),
    db: AsyncSession = Depends(get_db)
):
    """
    Actualizar estado de una inscripción.
    
    - **Permisos**: Requiere rol de administrador
    - **Parámetros**: `inscripcion_id` - ID de la inscripción, `estado` - Nuevo estado
    - **Respuesta**: Inscripción actualizada
    """
    admin_service = AdminService(db)
    inscripcion = await admin_service.update_inscripcion_estado(inscripcion_id, estado)
    return InscripcionResponse.from_orm(inscripcion)

@router.get(
    "/intentos",
    response_model=List[IntentoResponse],
    status_code=status.HTTP_200_OK
)
async def listar_intentos(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    db: AsyncSession = Depends(get_db)
):
    """
    Listar todos los intentos con paginación.
    
    - **Permisos**: Requiere rol de administrador
    - **Paginación**: Usa skip/limit para paginación
    - **Respuesta**: Lista paginada de intentos
    """
    admin_service = AdminService(db)
    intentos = await admin_service.get_intentos(skip, limit)
    return [IntentoResponse.from_orm(intento) for intento in intentos]

@router.put(
    "/intentos/{intento_id}/permitir-nuevo",
    response_model=IntentoResponse,
    status_code=status.HTTP_200_OK
)
async def permitir_nuevo_intento(
    intento_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Permitir nuevo intento (recursamiento) para un intento fallido.
    
    - **Permisos**: Requiere rol de administrador
    - **Parámetros**: `intento_id` - ID del intento
    - **Respuesta**: Intento actualizado con `permitir_nuevo_intento` habilitado
    """
    admin_service = AdminService(db)
    intento = await admin_service.permitir_nuevo_intento(intento_id)
    return IntentoResponse.from_orm(intento)

# Reglas de Acreditación

@router.get(
    "/reglas-acreditacion",
    response_model=List[ReglaAcreditacionResponse],
    status_code=status.HTTP_200_OK
)
async def listar_reglas(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    db: AsyncSession = Depends(get_db)
):
    """
    Listar reglas de acreditación con paginación.
    
    - **Permisos**: Requiere rol de administrador
    - **Paginación**: Usa skip/limit para paginación
    - **Respuesta**: Lista paginada de reglas de acreditación
    """
    regla_service = ReglaAcreditacionService(db)
    reglas = await regla_service.get_reglas(skip, limit)
    return [ReglaAcreditacionResponse.from_orm(regla) for regla in reglas]

@router.post(
    "/reglas-acreditacion",
    response_model=ReglaAcreditacionResponse,
    status_code=status.HTTP_201_CREATED
)
async def crear_regla(
    regla: ReglaAcreditacionBase,
    db: AsyncSession = Depends(get_db)
):
    """
    Crear nueva regla de acreditación.
    
    - **Permisos**: Requiere rol de administrador
    - **Parámetros**: Datos de la nueva regla de acreditación
    - **Respuesta**: Regla de acreditación creada
    """
    regla_service = ReglaAcreditacionService(db)
    nueva_regla = await regla_service.create_regla(regla)
    return ReglaAcreditacionResponse.from_orm(nueva_regla)

@router.put(
    "/reglas-acreditacion/{regla_id}",
    response_model=ReglaAcreditacionResponse,
    status_code=status.HTTP_200_OK
)
async def actualizar_regla(
    regla_id: uuid.UUID,
    regla: ReglaAcreditacionBase,
    db: AsyncSession = Depends(get_db)
):
    """
    Actualizar regla de acreditación.
    
    - **Permisos**: Requiere rol de administrador
    - **Parámetros**: `regla_id` - ID de la regla, datos actualizados
    - **Respuesta**: Regla de acreditación actualizada
    """
    regla_service = ReglaAcreditacionService(db)
    regla_actualizada = await regla_service.update_regla(regla_id, regla)
    return ReglaAcreditacionResponse.from_orm(regla_actualizada)

@router.delete(
    "/reglas-acreditacion/{regla_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def eliminar_regla(
    regla_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Eliminar regla de acreditación.
    
    - **Permisos**: Requiere rol de administrador
    - **Parámetros**: `regla_id` - ID de la regla a eliminar
    - **Respuesta**: No content (204)
    """
    regla_service = ReglaAcreditacionService(db)
    await regla_service.delete_regla(regla_id)
