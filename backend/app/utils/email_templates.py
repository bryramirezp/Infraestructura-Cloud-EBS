"""
Templates de email para diferentes tipos de notificaciones.

Todos los templates soportan HTML y texto plano.
"""

from typing import Tuple, Optional


def template_bienvenida(usuario_nombre: str) -> Tuple[str, str]:
    """
    Template de email de bienvenida para nuevos usuarios.
    
    Args:
        usuario_nombre: Nombre del usuario
        
    Returns:
        Tupla (body_html, body_text)
    """
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #1a472a; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; background-color: #f9f9f9; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Bienvenido a Escuela Bíblica Salem</h1>
            </div>
            <div class="content">
                <p>Hola {usuario_nombre},</p>
                <p>¡Te damos la bienvenida a nuestra plataforma de aprendizaje en línea!</p>
                <p>Estamos emocionados de que formes parte de nuestra comunidad educativa. Ahora puedes:</p>
                <ul>
                    <li>Explorar nuestros cursos disponibles</li>
                    <li>Inscribirte en los cursos que te interesen</li>
                    <li>Acceder a lecciones, quizzes y materiales de estudio</li>
                    <li>Interactuar con otros estudiantes en el foro</li>
                </ul>
                <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                <p>¡Que tengas un excelente inicio en tu camino de aprendizaje!</p>
                <p>Atentamente,<br>El equipo de Escuela Bíblica Salem</p>
            </div>
            <div class="footer">
                <p>Escuela Bíblica Salem - Plataforma de Aprendizaje en Línea</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text = f"""
    Bienvenido a Escuela Bíblica Salem
    
    Hola {usuario_nombre},
    
    ¡Te damos la bienvenida a nuestra plataforma de aprendizaje en línea!
    
    Estamos emocionados de que formes parte de nuestra comunidad educativa. Ahora puedes:
    - Explorar nuestros cursos disponibles
    - Inscribirte en los cursos que te interesen
    - Acceder a lecciones, quizzes y materiales de estudio
    - Interactuar con otros estudiantes en el foro
    
    Si tienes alguna pregunta, no dudes en contactarnos.
    
    ¡Que tengas un excelente inicio en tu camino de aprendizaje!
    
    Atentamente,
    El equipo de Escuela Bíblica Salem
    
    ---
    Escuela Bíblica Salem - Plataforma de Aprendizaje en Línea
    """
    
    return html, text


def template_certificado_listo(
    usuario_nombre: str,
    curso_titulo: str,
    folio: str,
    certificado_url: Optional[str] = None
) -> Tuple[str, str]:
    """
    Template de email notificando que el certificado está listo.
    
    Args:
        usuario_nombre: Nombre del usuario
        curso_titulo: Título del curso completado
        folio: Folio del certificado
        certificado_url: URL para descargar el certificado (opcional)
        
    Returns:
        Tupla (body_html, body_text)
    """
    download_text = ""
    download_html = ""
    
    if certificado_url:
        download_text = f"\n\nPuedes descargar tu certificado en: {certificado_url}"
        download_html = f'<p><a href="{certificado_url}" style="background-color: #1a472a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Descargar Certificado</a></p>'
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #1a472a; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; background-color: #f9f9f9; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>¡Felicidades! Tu Certificado está Listo</h1>
            </div>
            <div class="content">
                <p>Hola {usuario_nombre},</p>
                <p>¡Excelente noticia! Has completado exitosamente el curso:</p>
                <p><strong>{curso_titulo}</strong></p>
                <p>Tu certificado de acreditación está listo y disponible para descargar.</p>
                <p><strong>Folio del certificado:</strong> {folio}</p>
                {download_html}
                <p>Este certificado es válido y puede ser verificado mediante el código de verificación proporcionado.</p>
                <p>¡Felicitaciones por tu logro académico!</p>
                <p>Atentamente,<br>El equipo de Escuela Bíblica Salem</p>
            </div>
            <div class="footer">
                <p>Escuela Bíblica Salem - Plataforma de Aprendizaje en Línea</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text = f"""
    ¡Felicidades! Tu Certificado está Listo
    
    Hola {usuario_nombre},
    
    ¡Excelente noticia! Has completado exitosamente el curso:
    
    {curso_titulo}
    
    Tu certificado de acreditación está listo y disponible para descargar.
    
    Folio del certificado: {folio}
    {download_text}
    
    Este certificado es válido y puede ser verificado mediante el código de verificación proporcionado.
    
    ¡Felicitaciones por tu logro académico!
    
    Atentamente,
    El equipo de Escuela Bíblica Salem
    
    ---
    Escuela Bíblica Salem - Plataforma de Aprendizaje en Línea
    """
    
    return html, text


def template_recordatorio_progreso(
    usuario_nombre: str,
    curso_titulo: str,
    progreso_porcentaje: float
) -> Tuple[str, str]:
    """
    Template de email de recordatorio para continuar el progreso en un curso.
    
    Args:
        usuario_nombre: Nombre del usuario
        curso_titulo: Título del curso
        progreso_porcentaje: Porcentaje de progreso (0-100)
        
    Returns:
        Tupla (body_html, body_text)
    """
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #1a472a; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; background-color: #f9f9f9; }}
            .progress-bar {{ background-color: #e0e0e0; border-radius: 10px; height: 30px; margin: 20px 0; }}
            .progress-fill {{ background-color: #1a472a; height: 100%; border-radius: 10px; width: {progreso_porcentaje}%; text-align: center; line-height: 30px; color: white; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>¡Continúa tu Aprendizaje!</h1>
            </div>
            <div class="content">
                <p>Hola {usuario_nombre},</p>
                <p>Queremos recordarte que tienes un curso en progreso:</p>
                <p><strong>{curso_titulo}</strong></p>
                <p>Tu progreso actual:</p>
                <div class="progress-bar">
                    <div class="progress-fill">{progreso_porcentaje:.1f}%</div>
                </div>
                <p>¡Estás haciendo un gran trabajo! Te animamos a continuar y completar el curso.</p>
                <p>Recuerda que puedes acceder a tus cursos en cualquier momento desde la plataforma.</p>
                <p>¡Sigue adelante!</p>
                <p>Atentamente,<br>El equipo de Escuela Bíblica Salem</p>
            </div>
            <div class="footer">
                <p>Escuela Bíblica Salem - Plataforma de Aprendizaje en Línea</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text = f"""
    ¡Continúa tu Aprendizaje!
    
    Hola {usuario_nombre},
    
    Queremos recordarte que tienes un curso en progreso:
    
    {curso_titulo}
    
    Tu progreso actual: {progreso_porcentaje:.1f}%
    
    ¡Estás haciendo un gran trabajo! Te animamos a continuar y completar el curso.
    
    Recuerda que puedes acceder a tus cursos en cualquier momento desde la plataforma.
    
    ¡Sigue adelante!
    
    Atentamente,
    El equipo de Escuela Bíblica Salem
    
    ---
    Escuela Bíblica Salem - Plataforma de Aprendizaje en Línea
    """
    
    return html, text

