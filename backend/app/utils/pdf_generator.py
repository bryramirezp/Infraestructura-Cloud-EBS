"""
Generador síncrono de PDFs de certificados.

Esta es una función pura que no sabe de async y solo genera el PDF.
Se ejecuta en un thread separado usando asyncio.to_thread() para no bloquear el event loop.
"""

from datetime import datetime
from typing import Optional
from io import BytesIO
import logging

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY

logger = logging.getLogger(__name__)


def generar_pdf_certificado(
    usuario_nombre: str,
    usuario_apellido: str,
    curso_titulo: str,
    folio: str,
    fecha_emision: Optional[datetime] = None
) -> bytes:
    """
    Generar PDF de certificado de forma síncrona.
    
    Esta función es pura y síncrona, diseñada para ejecutarse en un thread
    separado usando asyncio.to_thread(). No debe usar operaciones async.
    
    Args:
        usuario_nombre: Nombre del usuario
        usuario_apellido: Apellido del usuario
        curso_titulo: Título del curso
        folio: Folio del certificado
        fecha_emision: Fecha de emisión (default: ahora)
        
    Returns:
        Contenido del PDF en bytes
        
    Raises:
        Exception: Si hay error generando el PDF
    """
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
            "Por medio del presente se certifica que",
            center_style
        )
    )
    story.append(Spacer(1, 0.2 * inch))
    
    nombre_completo = f"{usuario_nombre} {usuario_apellido}".strip()
    story.append(Paragraph(nombre_completo, name_style))
    story.append(Spacer(1, 0.2 * inch))
    
    story.append(
        Paragraph(
            "ha completado exitosamente el curso",
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
            "cumpliendo con todos los requisitos académicos establecidos.",
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

