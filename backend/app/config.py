from pydantic_settings import BaseSettings
from typing import List, Optional
import os
import logging

logger = logging.getLogger(__name__)


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
    s3_bucket_name: str

    # Cognito
    cognito_user_pool_id: str
    cognito_client_id: str
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
    cors_origins: str = "http://localhost:5173"

    # Cookie behavior for auth (defaults are safe for development)
    cookie_domain: Optional[str] = None
    cookie_secure: bool = True
    cookie_samesite: str = "Lax"
    cookie_access_max_age: int = 300  # seconds (5 minutes)
    cookie_refresh_max_age: int = 1209600  # seconds (14 days)

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        if isinstance(self.cors_origins, list):
            return self.cors_origins
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Debug: Log environment variables
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
            errors.append(f"ENVIRONMENT must be one of: development, staging, production")

        if errors:
            raise ValueError(f"Configuration errors: {', '.join(errors)}")

    @property
    def cognito_base_url(self) -> str:
        """Return the Cognito hosted UI base URL.

        Priority:
        - If `cognito_domain` is provided, use it as the host (can be custom domain)
        - Otherwise construct the hosted domain pattern using the user pool id
        """
        if self.cognito_domain:
            domain = self.cognito_domain
            if domain.startswith("https://"):
                return domain.rstrip("/")
            return f"https://{domain.rstrip('/') }"

        # Default hosted UI domain format: <your-domain>.auth.<region>.amazoncognito.com
        # Many setups map a custom domain; when not provided we attempt a sensible default
        return f"https://{self.cognito_user_pool_id}.auth.{self.aws_region}.amazoncognito.com"

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


def get_settings() -> Settings:
    """Get application settings singleton"""
    return Settings()


settings = get_settings()

