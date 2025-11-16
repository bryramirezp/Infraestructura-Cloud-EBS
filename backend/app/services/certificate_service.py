import hashlib
import uuid
from datetime import datetime
from typing import Optional
from io import BytesIO
import logging

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY

from app.services.s3_service import S3Service, get_s3_service
from app.utils.exceptions import EBSException

logger = logging.getLogger(__name__)


class CertificateService:
    """Servicio para generación y gestión de certificados PDF"""

    def __init__(self, s3_service: Optional[S3Service] = None):
        """Inicializar servicio de certificados"""
        self.s3_service = s3_service or get_s3_service()

    def generate_certificate(
        self,
        usuario_nombre: str,
        usuario_apellido: str,
        curso_titulo: str,
        folio: str,
        fecha_emision: Optional[datetime] = None
    ) -> bytes:
        """
        Generar PDF de certificado
        
        Args:
            usuario_nombre: Nombre del usuario
            usuario_apellido: Apellido del usuario
            curso_titulo: Título del curso
            folio: Folio del certificado
            fecha_emision: Fecha de emisión (default: ahora)
            
        Returns:
            Contenido del PDF en bytes
        """
        try:
            fecha_emision = fecha_emision or datetime.now()
            fecha_str = fecha_emision.strftime("%d de %B de %Y")
            
            buffer = BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=18
            )
            
            story = []
            styles = getSampleStyleSheet()
            
            title_style = ParagraphStyle(
                "CustomTitle",
                parent=styles["Heading1"],
                fontSize=24,
                textColor=colors.HexColor("#1a472a"),
                spaceAfter=30,
                alignment=TA_CENTER,
                fontName="Helvetica-Bold"
            )
            
            subtitle_style = ParagraphStyle(
                "CustomSubtitle",
                parent=styles["Heading2"],
                fontSize=16,
                textColor=colors.HexColor("#2d5a3d"),
                spaceAfter=20,
                alignment=TA_CENTER,
                fontName="Helvetica"
            )
            
            body_style = ParagraphStyle(
                "CustomBody",
                parent=styles["Normal"],
                fontSize=12,
                textColor=colors.HexColor("#333333"),
                spaceAfter=12,
                alignment=TA_JUSTIFY,
                fontName="Helvetica"
            )
            
            center_style = ParagraphStyle(
                "CustomCenter",
                parent=body_style,
                alignment=TA_CENTER,
                spaceAfter=20
            )
            
            name_style = ParagraphStyle(
                "CustomName",
                parent=styles["Heading1"],
                fontSize=20,
                textColor=colors.HexColor("#1a472a"),
                spaceAfter=30,
                alignment=TA_CENTER,
                fontName="Helvetica-Bold",
                textTransform="uppercase"
            )
            
            story.append(Spacer(1, 0.5 * inch))
            story.append(Paragraph("CERTIFICADO DE ACREDITACIÓN", title_style))
            story.append(Spacer(1, 0.3 * inch))
            story.append(Paragraph("Escuela Bíblica Salem", subtitle_style))
            story.append(Spacer(1, 0.4 * inch))
            
            story.append(
                Paragraph(
                    f"Por medio del presente se certifica que",
                    center_style
                )
            )
            story.append(Spacer(1, 0.2 * inch))
            
            nombre_completo = f"{usuario_nombre} {usuario_apellido}".strip()
            story.append(Paragraph(nombre_completo, name_style))
            story.append(Spacer(1, 0.2 * inch))
            
            story.append(
                Paragraph(
                    f"ha completado exitosamente el curso",
                    center_style
                )
            )
            story.append(Spacer(1, 0.3 * inch))
            
            course_style = ParagraphStyle(
                "CustomCourse",
                parent=body_style,
                fontSize=14,
                textColor=colors.HexColor("#1a472a"),
                alignment=TA_CENTER,
                fontName="Helvetica-Bold",
                spaceAfter=30
            )
            story.append(Paragraph(curso_titulo, course_style))
            story.append(Spacer(1, 0.3 * inch))
            
            story.append(
                Paragraph(
                    f"cumpliendo con todos los requisitos académicos establecidos.",
                    center_style
                )
            )
            story.append(Spacer(1, 0.4 * inch))
            
            fecha_data = [
                ["Fecha de emisión:", fecha_str],
                ["Folio:", folio]
            ]
            
            fecha_table = Table(fecha_data, colWidths=[2 * inch, 3 * inch])
            fecha_table.setStyle(
                TableStyle([
                    ("ALIGN", (0, 0), (0, -1), "RIGHT"),
                    ("ALIGN", (1, 0), (1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 11),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#333333")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 12),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ])
            )
            
            story.append(fecha_table)
            story.append(Spacer(1, 0.8 * inch))
            
            story.append(
                Paragraph(
                    "Este certificado es válido y puede ser verificado mediante "
                    "el código de verificación proporcionado.",
                    ParagraphStyle(
                        "CustomFooter",
                        parent=styles["Normal"],
                        fontSize=9,
                        textColor=colors.HexColor("#666666"),
                        alignment=TA_CENTER,
                        fontName="Helvetica-Oblique"
                    )
                )
            )
            
            doc.build(story)
            buffer.seek(0)
            pdf_bytes = buffer.read()
            buffer.close()
            
            logger.info(f"Certificate PDF generated for folio: {folio}")
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"Error generating certificate PDF: {str(e)}", exc_info=True)
            raise EBSException(
                status_code=500,
                detail=f"Error generating certificate: {str(e)}",
                error_code="CERTIFICATE_GENERATION_ERROR"
            )

    def generate_hash_verification(
        self,
        certificado_id: str,
        usuario_id: str,
        curso_id: str,
        folio: str,
        fecha_emision: datetime
    ) -> str:
        """
        Generar hash de verificación para certificado
        
        Args:
            certificado_id: ID del certificado
            usuario_id: ID del usuario
            curso_id: ID del curso
            folio: Folio del certificado
            fecha_emision: Fecha de emisión
            
        Returns:
            Hash SHA-256 de verificación
        """
        fecha_str = fecha_emision.isoformat()
        hash_input = f"{certificado_id}:{usuario_id}:{curso_id}:{folio}:{fecha_str}"
        return hashlib.sha256(hash_input.encode()).hexdigest()

    def generate_folio(self) -> str:
        """
        Generar folio único para certificado
        
        Returns:
            Folio en formato CERT-YYYYMMDD-XXXXXX
        """
        fecha_str = datetime.now().strftime("%Y%m%d")
        unique_id = str(uuid.uuid4()).replace("-", "").upper()[:6]
        return f"CERT-{fecha_str}-{unique_id}"

    def create_and_upload_certificate(
        self,
        certificado_id: str,
        usuario_nombre: str,
        usuario_apellido: str,
        curso_titulo: str,
        usuario_id: str,
        curso_id: str,
        fecha_emision: Optional[datetime] = None
    ) -> dict:
        """
        Crear certificado PDF y subirlo a S3
        
        Args:
            certificado_id: ID del certificado
            usuario_nombre: Nombre del usuario
            usuario_apellido: Apellido del usuario
            curso_titulo: Título del curso
            usuario_id: ID del usuario
            curso_id: ID del curso
            fecha_emision: Fecha de emisión (default: ahora)
            
        Returns:
            Dict con folio, hash_verificacion y s3_key
        """
        try:
            fecha_emision = fecha_emision or datetime.now()
            folio = self.generate_folio()
            
            pdf_bytes = self.generate_certificate(
                usuario_nombre=usuario_nombre,
                usuario_apellido=usuario_apellido,
                curso_titulo=curso_titulo,
                folio=folio,
                fecha_emision=fecha_emision
            )
            
            s3_key = S3Service.build_certificate_key(certificado_id)
            
            self.s3_service.upload_file(
                file_content=pdf_bytes,
                s3_key=s3_key,
                content_type="application/pdf",
                metadata={
                    "certificado_id": certificado_id,
                    "folio": folio,
                    "usuario_id": usuario_id,
                    "curso_id": curso_id,
                    "fecha_emision": fecha_emision.isoformat()
                }
            )
            
            hash_verificacion = self.generate_hash_verification(
                certificado_id=certificado_id,
                usuario_id=usuario_id,
                curso_id=curso_id,
                folio=folio,
                fecha_emision=fecha_emision
            )
            
            logger.info(
                f"Certificate created and uploaded: {certificado_id}, "
                f"folio: {folio}, s3_key: {s3_key}"
            )
            
            return {
                "folio": folio,
                "hash_verificacion": hash_verificacion,
                "s3_key": s3_key
            }
            
        except EBSException:
            raise
        except Exception as e:
            logger.error(f"Error creating and uploading certificate: {str(e)}", exc_info=True)
            raise EBSException(
                status_code=500,
                detail=f"Error creating certificate: {str(e)}",
                error_code="CERTIFICATE_CREATION_ERROR"
            )

    def get_certificate_download_url(
        self,
        s3_key: str,
        expiration: int = 3600
    ) -> Optional[str]:
        """
        Obtener URL prefirmada para descarga de certificado
        
        Args:
            s3_key: Clave S3 del certificado
            expiration: Tiempo de expiración en segundos (default: 1 hora)
            
        Returns:
            URL prefirmada o None si no existe
        """
        return self.s3_service.get_file_url(s3_key, expiration=expiration)

    def verify_certificate_hash(
        self,
        certificado_id: str,
        usuario_id: str,
        curso_id: str,
        folio: str,
        fecha_emision: datetime,
        hash_provided: str
    ) -> bool:
        """
        Verificar hash de certificado
        
        Args:
            certificado_id: ID del certificado
            usuario_id: ID del usuario
            curso_id: ID del curso
            folio: Folio del certificado
            fecha_emision: Fecha de emisión
            hash_provided: Hash proporcionado para verificación
            
        Returns:
            True si el hash es válido
        """
        expected_hash = self.generate_hash_verification(
            certificado_id=certificado_id,
            usuario_id=usuario_id,
            curso_id=curso_id,
            folio=folio,
            fecha_emision=fecha_emision
        )
        return expected_hash == hash_provided.lower()


def get_certificate_service() -> CertificateService:
    """Obtener instancia del servicio de certificados"""
    return CertificateService()

