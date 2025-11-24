from fastapi import HTTPException, status
from typing import Optional, Dict, Any
from app.utils.error_codes import (
    AuthErrorCodes,
    ValidationErrorCodes,
    NotFoundErrorCodes,
    BusinessRuleErrorCodes,
    CertificateErrorCodes,
    InternalErrorCodes
)


class EBSException(HTTPException):
    """
    Excepción base para la API EBS.
    
    Todas las excepciones personalizadas heredan de esta clase,
    permitiendo manejo consistente de errores y códigos de error estandarizados.
    """
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        headers: Optional[Dict[str, Any]] = None,
        error_code: Optional[str] = None
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.error_code = error_code or InternalErrorCodes.INTERNAL_SERVER_ERROR


class AuthenticationError(EBSException):
    """
    Error de autenticación.
    
    Se lanza cuando el usuario no está autenticado o el token es inválido.
    """
    
    def __init__(self, detail: str = "Authentication failed", error_code: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code=error_code or AuthErrorCodes.AUTH_REQUIRED
        )


class AuthorizationError(EBSException):
    """
    Error de autorización.
    
    Se lanza cuando el usuario está autenticado pero no tiene permisos
    suficientes para realizar la operación solicitada.
    """
    
    def __init__(self, detail: str = "Insufficient permissions", error_code: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code=error_code or AuthErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS
        )


class NotFoundError(EBSException):
    """
    Error de recurso no encontrado.
    
    Se lanza cuando el recurso solicitado no existe o no está disponible.
    """
    
    def __init__(self, resource: str = "Resource", resource_id: Optional[str] = None, error_code: Optional[str] = None):
        detail = f"{resource} not found"
        if resource_id:
            detail += f": {resource_id}"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code=error_code or NotFoundErrorCodes.NOT_FOUND
        )


class ValidationError(EBSException):
    """
    Error de validación.
    
    Se lanza cuando los datos proporcionados no cumplen con las reglas de validación
    (formato incorrecto, campos requeridos faltantes, valores fuera de rango, etc.).
    """
    
    def __init__(self, detail: str = "Validation error", error_code: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code=error_code or ValidationErrorCodes.VALIDATION_ERROR
        )


class BusinessRuleError(EBSException):
    """
    Error de regla de negocio.
    
    Se lanza cuando se viola una regla de negocio específica del dominio
    (ej: intentar inscribirse a un curso ya inscrito, intentar completar un examen ya completado).
    """
    
    def __init__(self, detail: str = "Business rule violation", error_code: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code=error_code or BusinessRuleErrorCodes.BUSINESS_RULE_ERROR
        )

