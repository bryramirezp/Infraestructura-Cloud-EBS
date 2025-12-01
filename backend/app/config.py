from pydantic_settings import BaseSettings
from typing import List, Optional
import os
import logging

logger = logging.getLogger(__name__)

# Configurar logging básico si no está configurado (para capturar errores de importación)
if not logging.getLogger().handlers:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )


class Settings(BaseSettings):
    # Database
    database_url: Optional[str] = None
    postgres_user: str = "ebs_user"
    postgres_password: str = "ebs_password"
    postgres_db: str = "ebs_db"
    postgres_port: int = 5432

    # AWS
    aws_region: str = "us-east-1"
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None

    # S3
    s3_bucket_name: Optional[str] = None

    # Cognito
    cognito_user_pool_id: Optional[str] = None
    cognito_client_id: Optional[str] = None
    # Optional: custom Cognito hosted domain (e.g. "your-domain.auth.us-east-1.amazoncognito.com")
    cognito_domain: Optional[str] = None
    # Optional client secret (for confidential clients)
    cognito_client_secret: Optional[str] = None
    # OAuth settings
    cognito_redirect_uri: Optional[str] = None
    cognito_scopes: str = "openid profile email"
    cognito_use_pkce: bool = True

    # Application
    environment: str = "development"
    log_level: str = "INFO"
    backend_port: int = 8000

    # CORS (comma-separated string or list)
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"

    # Cookie behavior for auth (defaults are safe for development)
    cookie_domain: Optional[str] = None
    cookie_secure: bool = True
    cookie_samesite: str = "Lax"
    cookie_access_max_age: int = 300  # seconds (5 minutes)
    cookie_refresh_max_age: int = 1209600  # seconds (14 days)

    # Email
    from_email: Optional[str] = None

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        if isinstance(self.cors_origins, list):
            return self.cors_origins
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"
        # En Docker, las variables de entorno tienen prioridad sobre .env
        env_ignore_empty = True

    def __init__(self, **kwargs):
        # Normalizar valores vacíos a None para campos opcionales
        # Docker Compose puede pasar strings vacíos "" cuando la variable no existe
        for key in ["s3_bucket_name", "cognito_user_pool_id", "cognito_client_id", 
                    "cognito_redirect_uri", "aws_access_key_id", "aws_secret_access_key"]:
            if key in kwargs and kwargs[key] == "":
                kwargs[key] = None
        
        # En desarrollo, establecer valores por defecto si están vacíos o son None
        env = kwargs.get("environment", os.getenv("ENVIRONMENT", "development"))
        if env == "development":
            kwargs.setdefault("s3_bucket_name", os.getenv("S3_BUCKET_NAME") or "dev-bucket")
            kwargs.setdefault("cognito_user_pool_id", os.getenv("COGNITO_USER_POOL_ID") or "dev-pool-id")
            kwargs.setdefault("cognito_client_id", os.getenv("COGNITO_CLIENT_ID") or "dev-client-id")
            kwargs.setdefault("cognito_redirect_uri", os.getenv("COGNITO_REDIRECT_URI") or "http://localhost:5173/auth/callback")
        
        super().__init__(**kwargs)
        # Debug: Log environment variables (solo en desarrollo para no exponer secrets)
        if self.environment == "development":
            db_url_env = os.getenv("DATABASE_URL")
            if db_url_env:
                logger.info(f"DATABASE_URL from env: {db_url_env[:60]}...")
            if self.database_url:
                logger.info(f"DATABASE_URL loaded in settings: {self.database_url[:60]}...")
            else:
                logger.warning("DATABASE_URL not found in settings, will construct from components")
        self._validate_settings()

    def _validate_settings(self):
        """Validate critical settings on startup"""
        errors = []

        # En desarrollo, ser más flexible con las validaciones
        if self.environment == "development":
            # Solo validar que las variables críticas estén presentes (pueden ser placeholders)
            if not self.s3_bucket_name:
                logger.warning("S3_BUCKET_NAME not set - S3 features will not work")
            
            if not self.cognito_user_pool_id:
                logger.warning("COGNITO_USER_POOL_ID not set - Auth features will not work")
            
            if not self.cognito_client_id:
                logger.warning("COGNITO_CLIENT_ID not set - Auth features will not work")
            
            if not self.cognito_redirect_uri:
                logger.warning("COGNITO_REDIRECT_URI not set - OAuth flows will not work")
        else:
            # En producción/staging, validar estrictamente
            if not self.s3_bucket_name:
                errors.append("S3_BUCKET_NAME is required")

            if not self.cognito_user_pool_id:
                errors.append("COGNITO_USER_POOL_ID is required")

            if not self.cognito_client_id:
                errors.append("COGNITO_CLIENT_ID is required")

            # For OAuth flows we need a redirect URI configured
            if not self.cognito_redirect_uri:
                errors.append("COGNITO_REDIRECT_URI is required for OAuth flows")

        if not self.database_url and self.environment != "development":
            errors.append("DATABASE_URL is required in non-development environments")

        if self.environment not in ["development", "staging", "production"]:
            errors.append("ENVIRONMENT must be one of: development, staging, production")

        if errors:
            raise ValueError(f"Configuration errors: {', '.join(errors)}")

    @property
    def cognito_base_url(self) -> str:
        """Return the Cognito hosted UI base URL.

        Requires `cognito_domain` to be explicitly configured in environment variables.
        This prevents security issues from auto-constructing URLs.
        """
        if not self.cognito_domain:
            error_msg = (
                "COGNITO_DOMAIN is not configured in environment variables. "
                "Please set COGNITO_DOMAIN in your .env file with the exact Cognito Hosted UI domain "
                "provided by AWS (e.g., https://us-east-1mjw0ejoju.auth.us-east-1.amazoncognito.com). "
                "Auto-constructing the domain from user pool ID is disabled for security reasons."
            )
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        domain = self.cognito_domain
        if domain.startswith("https://"):
            return domain.rstrip("/")
        return f"https://{domain.rstrip('/')}"

    @property
    def cognito_authorize_url(self) -> str:
        return f"{self.cognito_base_url}/oauth2/authorize"

    @property
    def cognito_token_url(self) -> str:
        return f"{self.cognito_base_url}/oauth2/token"

    @property
    def cognito_userinfo_url(self) -> str:
        return f"{self.cognito_base_url}/oauth2/userInfo"

    @property
    def cognito_issuer(self) -> str:
        """Generate Cognito issuer URL"""
        return f"https://cognito-idp.{self.aws_region}.amazonaws.com/{self.cognito_user_pool_id}"

    @property
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.environment == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.environment == "production"


_settings_instance: Optional[Settings] = None
_settings_error: Optional[Exception] = None


def get_settings() -> Settings:
    """Get application settings singleton with lazy initialization and error handling"""
    global _settings_instance, _settings_error
    
    if _settings_instance is not None:
        return _settings_instance
    
    if _settings_error is not None:
        raise _settings_error
    
    try:
        _settings_instance = Settings()
        return _settings_instance
    except Exception as e:
        _settings_error = e
        logger.error(f"Failed to initialize settings: {e}", exc_info=True)
        # En desarrollo, intentar continuar con valores por defecto
        if os.getenv("ENVIRONMENT", "development") == "development":
            logger.warning("Attempting to continue with minimal settings for development...")
            try:
                # Crear settings con valores mínimos
                _settings_instance = Settings(
                    s3_bucket_name=os.getenv("S3_BUCKET_NAME", "dev-bucket"),
                    cognito_user_pool_id=os.getenv("COGNITO_USER_POOL_ID", "dev-pool"),
                    cognito_client_id=os.getenv("COGNITO_CLIENT_ID", "dev-client"),
                    cognito_redirect_uri=os.getenv("COGNITO_REDIRECT_URI", "http://localhost:5173/auth/callback"),
                    environment="development"
                )
                logger.warning("Using minimal development settings - some features may not work")
                return _settings_instance
            except Exception as e2:
                logger.error(f"Failed to create minimal settings: {e2}")
        raise


def get_settings_safe() -> Optional[Settings]:
    """Get settings without raising exceptions (for development/debugging)"""
    try:
        return get_settings()
    except Exception as e:
        logger.warning(f"Settings not available: {e}")
        return None


# Inicializar settings de forma lazy pero asegurar que siempre esté disponible
# En desarrollo, si falla la inicialización, creamos una instancia mínima
def _ensure_settings():
    """Ensure settings is always available, even if initialization fails"""
    global _settings_instance
    if _settings_instance is None:
        try:
            _settings_instance = get_settings()
        except Exception as e:
            env = os.getenv("ENVIRONMENT", "development")
            if env == "development":
                logger.warning(f"Settings initialization failed ({e}), creating minimal dev settings")
                try:
                    _settings_instance = Settings(
                        s3_bucket_name=os.getenv("S3_BUCKET_NAME", "dev-bucket"),
                        cognito_user_pool_id=os.getenv("COGNITO_USER_POOL_ID", "dev-pool-id"),
                        cognito_client_id=os.getenv("COGNITO_CLIENT_ID", "dev-client-id"),
                        cognito_redirect_uri=os.getenv("COGNITO_REDIRECT_URI", "http://localhost:5173/auth/callback"),
                        environment="development"
                    )
                    # Saltar validación en desarrollo
                    logger.warning("Using minimal development settings")
                except Exception as e2:
                    logger.error(f"Failed to create minimal settings: {e2}")
                    raise
            else:
                raise
    return _settings_instance


# Proxy simple que siempre retorna una instancia válida
class _SettingsProxy:
    """Proxy que garantiza acceso a settings"""
    def __getattr__(self, name):
        return getattr(_ensure_settings(), name)
    
    def __call__(self):
        return _ensure_settings()


# Settings siempre disponible a través del proxy
settings = _SettingsProxy()

