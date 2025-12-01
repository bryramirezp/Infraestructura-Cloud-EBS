from fastapi import APIRouter, Depends, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
import uuid

from app.database.session import get_db
from app.database.models import Certificado, InscripcionCurso, Usuario
from app.schemas.certificado import CertificadoResponse, CertificadoCreate
from app.services.certificate_service import CertificateService, get_certificate_service
from app.services.inscripcion_service import InscripcionService
from app.tasks.certificate_tasks import generar_certificado_background
from app.utils.jwt_auth import get_current_user
from app.utils.roles import is_admin, require_role, UserRole
from app.utils.exceptions import NotFoundError, AuthorizationError, BusinessRuleError
from app.utils.error_codes import NotFoundErrorCodes, CertificateErrorCodes

router = APIRouter(prefix="/certificados", tags=["Certificados"])


@router.get(
    "",
    response_model=List[CertificadoResponse],
    status_code=status.HTTP_200_OK
)
async def listar_certificados(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Listar certificados del usuario autenticado.
    
    - **Permisos**: Requiere autenticación
    - **Respuesta**: Lista de certificados del usuario autenticado
    - **Nota**: Si es administrador, puede ver todos (por ahora solo propios)
    """
    usuario_id = current_user.get("sub")
    
    # Por defecto, RLS filtrará, pero explícitamente filtramos por inscripción del usuario
    # para optimizar y ser explícitos
    stmt = select(Certificado).join(InscripcionCurso).where(
        InscripcionCurso.usuario_id == usuario_id
    )
    result = await db.execute(stmt)
    certificados = result.scalars().all()
    
    certificate_service = get_certificate_service()
    result_list = []
    for cert in certificados:
        estado = "COMPLETED" if cert.s3_key else "PROCESSING"
        download_url = None
        if cert.s3_key:
            download_url = certificate_service.get_certificate_download_url(cert.s3_key)
        result_list.append(CertificadoResponse(
            id=cert.id,
            inscripcion_curso_id=cert.inscripcion_curso_id,
            folio=cert.folio,
            hash_verificacion=cert.hash_verificacion,
            s3_key=cert.s3_key,
            emitido_en=cert.emitido_en,
            valido=cert.valido,
            creado_en=cert.creado_en,
            actualizado_en=cert.actualizado_en,
            estado=estado,
            download_url=download_url
        ))
    return result_list


@router.get(
    "/inscripciones/{inscripcion_id}",
    response_model=CertificadoResponse,
    status_code=status.HTTP_200_OK
)
async def obtener_certificado_inscripcion(
    inscripcion_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener el certificado asociado a una inscripción específica.
    
    - **Permisos**: Requiere autenticación. El usuario debe ser propietario de la inscripción o administrador
    - **Parámetros**: `inscripcion_id` - ID de la inscripción
    - **Respuesta**: Certificado asociado a la inscripción
    """
    usuario_id = current_user.get("sub")
    
    # Verificar que la inscripción pertenece al usuario (o es admin)
    stmt = select(InscripcionCurso).where(
        InscripcionCurso.id == inscripcion_id
    )
    result = await db.execute(stmt)
    inscripcion = result.scalar_one_or_none()
    
    if not inscripcion:
        raise NotFoundError("Inscripción", str(inscripcion_id), error_code=NotFoundErrorCodes.ENROLLMENT_NOT_FOUND)
        
    # Validación adicional de seguridad (aunque RLS debería manejarlo)
    if str(inscripcion.usuario_id) != usuario_id and not is_admin(current_user):
        raise AuthorizationError("No tienes acceso a esta inscripción")
        
    stmt = select(Certificado).where(
        Certificado.inscripcion_curso_id == inscripcion_id
    )
    result = await db.execute(stmt)
    certificado = result.scalar_one_or_none()
    
    if not certificado:
        raise NotFoundError("Certificado", f"para inscripción {inscripcion_id}", error_code=NotFoundErrorCodes.CERTIFICATE_NOT_FOUND)
    
    certificate_service = get_certificate_service()
    estado = "COMPLETED" if certificado.s3_key else "PROCESSING"
    download_url = None
    if certificado.s3_key:
        download_url = certificate_service.get_certificate_download_url(certificado.s3_key)
    
    return CertificadoResponse(
        id=certificado.id,
        inscripcion_curso_id=certificado.inscripcion_curso_id,
        folio=certificado.folio,
        hash_verificacion=certificado.hash_verificacion,
        s3_key=certificado.s3_key,
        emitido_en=certificado.emitido_en,
        valido=certificado.valido,
        creado_en=certificado.creado_en,
        actualizado_en=certificado.actualizado_en,
        estado=estado,
        download_url=download_url
    )


@router.get(
    "/{certificado_id}",
    response_model=CertificadoResponse,
    status_code=status.HTTP_200_OK
)
async def obtener_certificado(
    certificado_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    certificate_service: CertificateService = Depends(get_certificate_service)
):
    """
    Obtener certificado con su estado y URL de descarga si está disponible.
    
    - **Permisos**: Requiere autenticación. El usuario debe ser propietario del certificado o administrador
    - **Parámetros**: `certificado_id` - ID del certificado
    - **Respuesta**: 
      - Si estado es "COMPLETED": 200 OK con URL de descarga
      - Si estado es "PROCESSING": 202 Accepted (aunque retorna 200, el estado indica procesamiento)
    """
    usuario_id = current_user.get("sub")
    
    stmt = (
        select(Certificado)
        .options(selectinload(Certificado.inscripcion_curso))
        .join(InscripcionCurso)
        .where(Certificado.id == certificado_id)
    )
    result = await db.execute(stmt)
    certificado = result.scalar_one_or_none()
    
    if not certificado:
        raise NotFoundError("Certificado", str(certificado_id), error_code=NotFoundErrorCodes.CERTIFICATE_NOT_FOUND)
        
    # Validar propiedad
    if str(certificado.inscripcion_curso.usuario_id) != usuario_id and not is_admin(current_user):
        raise AuthorizationError("No tienes acceso a este certificado")
    
    estado = "COMPLETED" if certificado.s3_key else "PROCESSING"
    download_url = None
    
    if certificado.s3_key:
        download_url = certificate_service.get_certificate_download_url(certificado.s3_key)
        if not download_url:
            raise NotFoundError(
                "URL de descarga",
                str(certificado_id),
                error_code=CertificateErrorCodes.CERTIFICATE_DOWNLOAD_ERROR
            )
    
    return CertificadoResponse(
        id=certificado.id,
        inscripcion_curso_id=certificado.inscripcion_curso_id,
        folio=certificado.folio,
        hash_verificacion=certificado.hash_verificacion,
        s3_key=certificado.s3_key,
        emitido_en=certificado.emitido_en,
        valido=certificado.valido,
        creado_en=certificado.creado_en,
        actualizado_en=certificado.actualizado_en,
        estado=estado,
        download_url=download_url
    )


@router.get(
    "/{certificado_id}/verificar",
    status_code=status.HTTP_200_OK
)
async def verificar_certificado(
    certificado_id: uuid.UUID,
    hash: str = Query(..., description="Hash de verificación del certificado"),
    db: AsyncSession = Depends(get_db),
    certificate_service: CertificateService = Depends(get_certificate_service)
):
    """
    Verificar la validez de un certificado mediante su hash.
    
    - **Permisos**: Endpoint público (no requiere autenticación)
    - **Parámetros**: 
      - `certificado_id` - ID del certificado
      - `hash` - Hash de verificación del certificado
    - **Respuesta**: Objeto con estado de validez del certificado, folio y fecha de emisión
    """
    # Nota: No usamos Depends(get_current_user) para hacerlo público
    
    stmt = select(Certificado).where(
        Certificado.id == certificado_id
    )
    result = await db.execute(stmt)
    certificado = result.scalar_one_or_none()
    
    if not certificado:
        raise NotFoundError("Certificado", str(certificado_id), error_code=NotFoundErrorCodes.CERTIFICATE_NOT_FOUND)
        
    if not certificado.valido:
        return {"valido": False, "mensaje": "El certificado ha sido revocado o no es válido"}
        
    # Verificar hash almacenado vs proporcionado
    if certificado.hash_verificacion != hash:
        return {"valido": False, "mensaje": "El hash de verificación no coincide"}
        
    return {
        "valido": True,
        "folio": certificado.folio,
        "emitido_en": certificado.emitido_en,
        "mensaje": "Certificado válido"
    }


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def crear_certificado(
    payload: CertificadoCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Crear e iniciar la generación de un certificado para una inscripción acreditada.
    
    - **Permisos**: Requiere autenticación. El usuario debe ser propietario de la inscripción o administrador
    - **Parámetros**: `inscripcion_id` - ID de la inscripción acreditada en el body
    - **Respuesta**: Retorna 202 Accepted y procesa la generación del PDF en background
    - **Nota**: Si el certificado ya está generado, retorna estado "completed" inmediatamente
    """
    usuario_id = current_user.get("sub")
    is_admin_user = is_admin(current_user)
    
    inscripcion_service = InscripcionService(db)
    inscripcion = await inscripcion_service.get_inscripcion(payload.inscripcion_id)
    
    if str(inscripcion.usuario_id) != usuario_id and not is_admin_user:
        raise AuthorizationError("No tienes acceso a esta inscripción")
    
    if not inscripcion.acreditado:
        raise BusinessRuleError(
            "La inscripción no está acreditada. Solo se pueden generar certificados para inscripciones acreditadas."
        )
    
    stmt = select(Certificado).where(
        Certificado.inscripcion_curso_id == payload.inscripcion_id
    )
    result = await db.execute(stmt)
    certificado = result.scalar_one_or_none()
    
    if not certificado:
        raise NotFoundError(
            "Certificado",
            f"para inscripción {payload.inscripcion_id}",
            error_code=NotFoundErrorCodes.CERTIFICATE_NOT_FOUND
        )
    
    if certificado.s3_key:
        certificate_service = get_certificate_service()
        download_url = certificate_service.get_certificate_download_url(certificado.s3_key) if certificado.s3_key else None
        return CertificadoResponse(
            id=certificado.id,
            inscripcion_curso_id=certificado.inscripcion_curso_id,
            folio=certificado.folio,
            hash_verificacion=certificado.hash_verificacion,
            s3_key=certificado.s3_key,
            emitido_en=certificado.emitido_en,
            valido=certificado.valido,
            creado_en=certificado.creado_en,
            actualizado_en=certificado.actualizado_en,
            estado="COMPLETED",
            download_url=download_url
        )
    
    background_tasks.add_task(generar_certificado_background, certificado.id)
    
    return CertificadoResponse(
        id=certificado.id,
        inscripcion_curso_id=certificado.inscripcion_curso_id,
        folio=certificado.folio,
        hash_verificacion=certificado.hash_verificacion,
        s3_key=certificado.s3_key,
        emitido_en=certificado.emitido_en,
        valido=certificado.valido,
        creado_en=certificado.creado_en,
        actualizado_en=certificado.actualizado_en,
        estado="PROCESSING",
        download_url=None
    )


@router.get(
    "/{certificado_id}/estado",
    status_code=status.HTTP_200_OK
)
async def obtener_estado_certificado(
    certificado_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Consultar el estado de generación de un certificado.
    
    - **Permisos**: Requiere autenticación. El usuario debe ser propietario del certificado o administrador
    - **Parámetros**: `certificado_id` - ID del certificado
    - **Respuesta**: Objeto con estado de generación ("processing" o "completed") y datos del certificado si está listo
    """
    usuario_id = current_user.get("sub")
    
    stmt = (
        select(Certificado)
        .options(selectinload(Certificado.inscripcion_curso))
        .where(Certificado.id == certificado_id)
    )
    result = await db.execute(stmt)
    certificado = result.scalar_one_or_none()
    
    if not certificado:
        raise NotFoundError(
            "Certificado",
            str(certificado_id),
            error_code=NotFoundErrorCodes.CERTIFICATE_NOT_FOUND
        )
    
    if str(certificado.inscripcion_curso.usuario_id) != usuario_id and not is_admin(current_user):
        raise AuthorizationError("No tienes acceso a este certificado")
    
    if certificado.s3_key:
        return {
            "certificado_id": str(certificado_id),
            "status": "completed",
            "folio": certificado.folio,
            "emitido_en": certificado.emitido_en,
            "s3_key": certificado.s3_key
        }
    else:
        return {
            "certificado_id": str(certificado_id),
            "status": "processing",
            "mensaje": "El certificado está siendo generado"
        }
