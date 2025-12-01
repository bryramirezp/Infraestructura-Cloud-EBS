"""
Tareas de background para generación de certificados.

Usa asyncio.to_thread() para ejecutar la generación de PDF en un thread separado,
evitando bloquear el event loop mientras se genera el documento.
"""

import logging
import uuid
import asyncio
from datetime import datetime
from typing import Optional

from app.utils.background_tasks import get_background_db_session
from app.utils.pdf_generator import generar_pdf_certificado
from app.services.s3_service import S3Service, get_s3_service
from app.services.certificate_service import CertificateService, get_certificate_service
from app.database.models import Certificado, InscripcionCurso
from app.utils.query_helpers import get_or_404
from sqlalchemy import select
from sqlalchemy.orm import selectinload

logger = logging.getLogger(__name__)


async def generar_certificado_background(certificado_id: uuid.UUID):
    """
    Tarea de background para generar y subir un certificado PDF.
    
    Esta función crea su propia sesión de BD, obtiene los datos necesarios,
    genera el PDF en un thread separado, lo sube a S3 y actualiza el certificado.
    
    Args:
        certificado_id: ID del certificado que se va a generar
    """
    async with get_background_db_session() as db:
        try:
            logger.info(f"Iniciando generación de certificado en background: {certificado_id}")
            
            stmt = (
                select(Certificado)
                .options(
                    selectinload(Certificado.inscripcion_curso).selectinload(InscripcionCurso.usuario),
                    selectinload(Certificado.inscripcion_curso).selectinload(InscripcionCurso.curso)
                )
                .where(Certificado.id == certificado_id)
            )
            result = await db.execute(stmt)
            certificado = result.scalar_one_or_none()
            
            if not certificado:
                raise ValueError(f"Certificado {certificado_id} no encontrado")
            
            inscripcion = certificado.inscripcion_curso
            usuario = inscripcion.usuario
            curso = inscripcion.curso
            
            certificate_service = get_certificate_service()
            
            fecha_emision = certificado.emitido_en or datetime.now()
            folio = certificate_service.generate_folio()
            
            logger.info(f"Generando PDF para certificado {certificado_id}, folio: {folio}")
            
            pdf_bytes = await asyncio.to_thread(
                generar_pdf_certificado,
                usuario.nombre,
                usuario.apellido,
                curso.titulo,
                folio,
                fecha_emision
            )
            
            logger.info(f"PDF generado para certificado {certificado_id}, tamaño: {len(pdf_bytes)} bytes")
            
            s3_service = get_s3_service()
            s3_key = S3Service.build_certificate_key(str(certificado_id))
            
            s3_service.upload_file(
                file_content=pdf_bytes,
                s3_key=s3_key,
                content_type="application/pdf",
                metadata={
                    "certificado_id": str(certificado_id),
                    "folio": folio,
                    "usuario_id": str(usuario.id),
                    "curso_id": str(curso.id),
                    "fecha_emision": fecha_emision.isoformat()
                }
            )
            
            logger.info(f"PDF subido a S3: {s3_key}")
            
            hash_verificacion = certificate_service.generate_hash_verification(
                certificado_id=str(certificado_id),
                usuario_id=str(usuario.id),
                curso_id=str(curso.id),
                folio=folio,
                fecha_emision=fecha_emision
            )
            
            certificado.folio = folio
            certificado.hash_verificacion = hash_verificacion
            certificado.s3_key = s3_key
            certificado.valido = True
            
            await db.commit()
            await db.refresh(certificado)
            
            logger.info(
                f"Certificado {certificado_id} generado exitosamente. "
                f"Folio: {folio}, S3: {s3_key}"
            )
            
        except Exception as e:
            logger.error(
                f"Error generando certificado {certificado_id} en background: {str(e)}",
                exc_info=True
            )
            try:
                await db.rollback()
            except Exception:
                pass
            raise

