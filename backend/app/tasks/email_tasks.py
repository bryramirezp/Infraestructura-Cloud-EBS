"""
Tareas de background para envío de emails.

Incluye retry logic simple (3 intentos con backoff exponencial).
"""

import logging
import asyncio
import uuid
from typing import Optional

from app.utils.background_tasks import get_background_db_session
from app.services.email_service import get_email_service
from app.utils.email_templates import (
    template_bienvenida,
    template_certificado_listo,
    template_recordatorio_progreso
)
from app.database.models import Usuario, InscripcionCurso, Certificado, Curso
from sqlalchemy import select
from sqlalchemy.orm import selectinload

logger = logging.getLogger(__name__)


async def _send_email_with_retry(
    to_email: str,
    subject: str,
    body_html: str,
    body_text: str,
    max_retries: int = 3,
    initial_delay: float = 1.0
) -> bool:
    """
    Enviar email con retry logic simple.
    
    Args:
        to_email: Email del destinatario
        subject: Asunto
        body_html: Cuerpo HTML
        body_text: Cuerpo texto
        max_retries: Número máximo de intentos
        initial_delay: Delay inicial en segundos (se duplica en cada intento)
        
    Returns:
        True si se envió exitosamente, False si falló después de todos los intentos
    """
    email_service = get_email_service()
    
    for attempt in range(1, max_retries + 1):
        try:
            success = email_service.send_email(
                to_email=to_email,
                subject=subject,
                body_html=body_html,
                body_text=body_text
            )
            if success:
                logger.info(f"Email sent successfully to {to_email} (attempt {attempt})")
                return True
            else:
                logger.warning(f"Email service returned False for {to_email} (attempt {attempt})")
        except Exception as e:
            logger.warning(
                f"Error sending email to {to_email} (attempt {attempt}/{max_retries}): {str(e)}"
            )
            
            if attempt < max_retries:
                delay = initial_delay * (2 ** (attempt - 1))
                logger.info(f"Retrying email to {to_email} in {delay} seconds...")
                await asyncio.sleep(delay)
            else:
                logger.error(
                    f"Failed to send email to {to_email} after {max_retries} attempts: {str(e)}",
                    exc_info=True
                )
    
    return False


async def enviar_email_bienvenida(usuario_id: uuid.UUID):
    """
    Enviar email de bienvenida a un nuevo usuario.
    
    Args:
        usuario_id: ID del usuario
    """
    async with get_background_db_session() as db:
        try:
            stmt = select(Usuario).where(Usuario.id == usuario_id)
            result = await db.execute(stmt)
            usuario = result.scalar_one_or_none()
            
            if not usuario:
                logger.warning(f"Usuario {usuario_id} no encontrado para enviar email de bienvenida")
                return
            
            if not usuario.email:
                logger.warning(f"Usuario {usuario_id} no tiene email configurado")
                return
            
            body_html, body_text = template_bienvenida(usuario.nombre)
            
            await _send_email_with_retry(
                to_email=usuario.email,
                subject="¡Bienvenido a Escuela Bíblica Salem!",
                body_html=body_html,
                body_text=body_text
            )
            
        except Exception as e:
            logger.error(
                f"Error en tarea de email de bienvenida para usuario {usuario_id}: {str(e)}",
                exc_info=True
            )


async def enviar_email_certificado_listo(certificado_id: uuid.UUID, certificado_url: Optional[str] = None):
    """
    Enviar email notificando que un certificado está listo.
    
    Args:
        certificado_id: ID del certificado
        certificado_url: URL para descargar el certificado (opcional)
    """
    async with get_background_db_session() as db:
        try:
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
                logger.warning(f"Certificado {certificado_id} no encontrado para enviar email")
                return
            
            inscripcion = certificado.inscripcion_curso
            usuario = inscripcion.usuario
            curso = inscripcion.curso
            
            if not usuario.email:
                logger.warning(f"Usuario {usuario.id} no tiene email configurado")
                return
            
            if not certificado.folio:
                logger.warning(f"Certificado {certificado_id} no tiene folio asignado")
                return
            
            body_html, body_text = template_certificado_listo(
                usuario_nombre=usuario.nombre,
                curso_titulo=curso.titulo,
                folio=certificado.folio,
                certificado_url=certificado_url
            )
            
            await _send_email_with_retry(
                to_email=usuario.email,
                subject=f"Tu certificado de {curso.titulo} está listo",
                body_html=body_html,
                body_text=body_text
            )
            
        except Exception as e:
            logger.error(
                f"Error en tarea de email de certificado listo para certificado {certificado_id}: {str(e)}",
                exc_info=True
            )


async def enviar_email_recordatorio_progreso(inscripcion_id: uuid.UUID, progreso_porcentaje: float):
    """
    Enviar email de recordatorio para continuar el progreso en un curso.
    
    Args:
        inscripcion_id: ID de la inscripción
        progreso_porcentaje: Porcentaje de progreso (0-100)
    """
    async with get_background_db_session() as db:
        try:
            stmt = (
                select(InscripcionCurso)
                .options(
                    selectinload(InscripcionCurso.usuario),
                    selectinload(InscripcionCurso.curso)
                )
                .where(InscripcionCurso.id == inscripcion_id)
            )
            result = await db.execute(stmt)
            inscripcion = result.scalar_one_or_none()
            
            if not inscripcion:
                logger.warning(f"Inscripción {inscripcion_id} no encontrada para enviar email de recordatorio")
                return
            
            usuario = inscripcion.usuario
            curso = inscripcion.curso
            
            if not usuario.email:
                logger.warning(f"Usuario {usuario.id} no tiene email configurado")
                return
            
            body_html, body_text = template_recordatorio_progreso(
                usuario_nombre=usuario.nombre,
                curso_titulo=curso.titulo,
                progreso_porcentaje=progreso_porcentaje
            )
            
            await _send_email_with_retry(
                to_email=usuario.email,
                subject=f"Continúa tu progreso en {curso.titulo}",
                body_html=body_html,
                body_text=body_text
            )
            
        except Exception as e:
            logger.error(
                f"Error en tarea de email de recordatorio para inscripción {inscripcion_id}: {str(e)}",
                exc_info=True
            )

