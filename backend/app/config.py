from pydantic_settings import BaseSettings
from typing import List, Optional
import os


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

    # Application
    environment: str = "development"
    log_level: str = "INFO"
    backend_port: int = 8000

    # CORS (comma-separated string or list)
    cors_origins: str = "http://localhost:5173"

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

        if not self.database_url and self.environment != "development":
            errors.append("DATABASE_URL is required in non-development environments")

        if self.environment not in ["development", "staging", "production"]:
            errors.append(f"ENVIRONMENT must be one of: development, staging, production")

        if errors:
            raise ValueError(f"Configuration errors: {', '.join(errors)}")

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

