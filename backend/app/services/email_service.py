"""
Servicio para envío de emails.

Soporta AWS SES y SMTP como métodos de envío.
En producción usar SES, en desarrollo puede usar SMTP o simplemente loggear.
"""

import logging
from typing import Optional, List
import boto3
from botocore.exceptions import ClientError, BotoCoreError

from app.config import settings
from app.utils.exceptions import EBSException

logger = logging.getLogger(__name__)


class EmailService:
    """Servicio para envío de emails usando SES o SMTP"""

    def __init__(self):
        """Inicializar servicio de email"""
        self.use_ses = settings.is_production or bool(settings.aws_access_key_id)
        self.from_email = settings.from_email if hasattr(settings, "from_email") else None
        
        if self.use_ses:
            session_params = {
                "region_name": settings.aws_region,
            }
            
            if settings.aws_access_key_id and settings.aws_secret_access_key:
                session_params["aws_access_key_id"] = settings.aws_access_key_id
                session_params["aws_secret_access_key"] = settings.aws_secret_access_key
            
            session = boto3.Session(**session_params)
            self.ses_client = session.client("ses", region_name=settings.aws_region)
            logger.info("EmailService initialized with AWS SES")
        else:
            self.ses_client = None
            logger.info("EmailService initialized in development mode (logging only)")

    def send_email(
        self,
        to_email: str,
        subject: str,
        body_html: Optional[str] = None,
        body_text: Optional[str] = None,
        from_email: Optional[str] = None
    ) -> bool:
        """
        Enviar email usando SES o SMTP.
        
        Args:
            to_email: Email del destinatario
            subject: Asunto del email
            body_html: Cuerpo del email en HTML (opcional)
            body_text: Cuerpo del email en texto plano (requerido si no hay HTML)
            from_email: Email remitente (opcional, usa configuración por defecto)
            
        Returns:
            True si se envió exitosamente, False en caso contrario
            
        Raises:
            EBSException: Si hay error crítico enviando el email
        """
        if not body_html and not body_text:
            raise ValueError("Se debe proporcionar body_html o body_text")
        
        from_email = from_email or self.from_email or "noreply@ebs.salem"
        
        if self.use_ses and self.ses_client:
            return self._send_via_ses(to_email, subject, body_html, body_text, from_email)
        else:
            return self._log_email(to_email, subject, body_html, body_text, from_email)

    def _send_via_ses(
        self,
        to_email: str,
        subject: str,
        body_html: Optional[str],
        body_text: Optional[str],
        from_email: str
    ) -> bool:
        """Enviar email usando AWS SES"""
        try:
            message = {
                "Subject": {"Data": subject, "Charset": "UTF-8"},
            }
            
            body_dict = {}
            if body_html:
                body_dict["Html"] = {"Data": body_html, "Charset": "UTF-8"}
            if body_text:
                body_dict["Text"] = {"Data": body_text, "Charset": "UTF-8"}
            
            message["Body"] = body_dict
            
            response = self.ses_client.send_email(
                Source=from_email,
                Destination={"ToAddresses": [to_email]},
                Message=message
            )
            
            logger.info(f"Email sent via SES to {to_email}, MessageId: {response.get('MessageId')}")
            return True
            
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")
            error_message = e.response.get("Error", {}).get("Message", str(e))
            logger.error(f"SES error sending email to {to_email}: {error_code} - {error_message}")
            raise EBSException(
                status_code=500,
                detail=f"Error sending email: {error_message}",
                error_code="EMAIL_SEND_ERROR"
            )
        except BotoCoreError as e:
            logger.error(f"Boto3 error sending email to {to_email}: {str(e)}")
            raise EBSException(
                status_code=500,
                detail=f"Error sending email: {str(e)}",
                error_code="EMAIL_SEND_ERROR"
            )
        except Exception as e:
            logger.error(f"Unexpected error sending email to {to_email}: {str(e)}", exc_info=True)
            raise EBSException(
                status_code=500,
                detail=f"Unexpected error sending email: {str(e)}",
                error_code="EMAIL_SEND_ERROR"
            )

    def _log_email(
        self,
        to_email: str,
        subject: str,
        body_html: Optional[str],
        body_text: Optional[str],
        from_email: str
    ) -> bool:
        """Loggear email en desarrollo (no enviar realmente)"""
        logger.info(
            f"[EMAIL DEV] From: {from_email}, To: {to_email}, Subject: {subject}\n"
            f"Body (text): {body_text}\n"
            f"Body (HTML): {body_html}"
        )
        return True

    def send_bulk_email(
        self,
        to_emails: List[str],
        subject: str,
        body_html: Optional[str] = None,
        body_text: Optional[str] = None,
        from_email: Optional[str] = None
    ) -> dict:
        """
        Enviar emails a múltiples destinatarios usando SES.
        En desarrollo, solo loggea.
        
        Returns:
            Dict con 'success_count' y 'failure_count'
        """
        from_email = from_email or self.from_email or "noreply@ebs.salem"
        
        if not self.use_ses or not self.ses_client:
            for email in to_emails:
                self._log_email(email, subject, body_html, body_text, from_email)
            return {"success_count": len(to_emails), "failure_count": 0}
        
        success_count = 0
        failure_count = 0
        
        for email in to_emails:
            try:
                if self.send_email(email, subject, body_html, body_text, from_email):
                    success_count += 1
                else:
                    failure_count += 1
            except Exception as e:
                logger.error(f"Failed to send email to {email}: {str(e)}")
                failure_count += 1
        
        return {
            "success_count": success_count,
            "failure_count": failure_count
        }


_email_service_instance: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """Obtener instancia singleton del servicio de email"""
    global _email_service_instance
    if _email_service_instance is None:
        _email_service_instance = EmailService()
    return _email_service_instance

