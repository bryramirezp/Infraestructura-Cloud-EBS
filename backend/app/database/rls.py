from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)

async def set_current_cognito_user_id(db: AsyncSession, cognito_user_id: str):
    """
    Establece la variable de sesión app.current_cognito_user_id para RLS.
    El cognito_user_id (sub del token JWT) ahora es directamente el id del usuario.
    
    Args:
        db: Sesión de base de datos SQLAlchemy (AsyncSession)
        cognito_user_id: ID de usuario de Cognito (sub del token JWT) que ahora es el id del usuario
    """
    if not cognito_user_id:
        return
        
    try:
        # Usamos set_config para establecer la variable de sesión
        # is_local=True hace que la variable solo viva durante la transacción actual
        await db.execute(
            text("SELECT set_config('app.current_cognito_user_id', :user_id, true)"),
            {"user_id": cognito_user_id}
        )
        logger.debug(f"RLS session variable set for user: {cognito_user_id}")
    except Exception as e:
        logger.error(f"Error setting RLS session variable: {e}")
        # No lanzamos excepción para no romper el flujo si algo falla con RLS,
        # pero logueamos el error. En producción estricta, esto debería fallar.

async def clear_current_cognito_user_id(db: AsyncSession):
    """
    Limpia la variable de sesión app.current_cognito_user_id.
    """
    try:
        await db.execute(text("SELECT set_config('app.current_cognito_user_id', '', true)"))
        logger.debug("RLS session variable cleared")
    except Exception as e:
        logger.error(f"Error clearing RLS session variable: {e}")
