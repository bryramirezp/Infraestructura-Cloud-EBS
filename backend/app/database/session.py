from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator
import logging
import os
from fastapi import Request
import jwt
from app.config import settings
from app.database.rls import set_current_cognito_user_id

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Base class for all database models"""
    pass


def get_database_url() -> str:
    """Get database URL from settings or construct from components"""
    if settings.database_url:
        db_url = settings.database_url
        # Convert postgresql:// to postgresql+asyncpg:// if needed
        if db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        logger.info(f"Using DATABASE_URL from settings: {db_url[:50]}...")
        return db_url
    
    if settings.is_development:
        logger.warning("DATABASE_URL not set, constructing from components")
        db_host = os.getenv("POSTGRES_HOST", "db")
        constructed_url = (
            f"postgresql+asyncpg://{settings.postgres_user}:{settings.postgres_password}"
            f"@{db_host}:{settings.postgres_port}/{settings.postgres_db}"
        )
        logger.info(f"Constructed DATABASE_URL: {constructed_url[:50]}...")
        return constructed_url
    
    raise ValueError("DATABASE_URL is required in non-development environments")


def create_database_engine():
    """Create SQLAlchemy async engine with optimized pool settings"""
    database_url = get_database_url()
    
    engine_kwargs = {
        "url": database_url,
        "echo": settings.is_development,
        "pool_pre_ping": True,
    }
    
    if settings.is_production:
        engine_kwargs.update({
            "pool_size": 20,
            "max_overflow": 40,
            "pool_recycle": 1800,
            "echo": False,
        })
    else:
        engine_kwargs.update({
            "pool_size": 10,
            "max_overflow": 20,
            "pool_recycle": 3600,
        })
    
    engine = create_async_engine(**engine_kwargs)
    
    logger.info(f"Database async engine created for {settings.environment} environment")
    return engine


_engine = None
_SessionLocal = None

def _get_engine():
    """Lazy initialization of database engine"""
    global _engine
    if _engine is None:
        _engine = create_database_engine()
    return _engine

def _get_session_local():
    """Lazy initialization of async session maker"""
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = async_sessionmaker(
            bind=_get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _SessionLocal

class _LazyEngine:
    """Lazy wrapper for engine"""
    def __getattr__(self, name):
        return getattr(_get_engine(), name)

class _LazySessionLocal:
    """Lazy wrapper for SessionLocal"""
    def __call__(self, *args, **kwargs):
        return _get_session_local()(*args, **kwargs)
    def __getattr__(self, name):
        return getattr(_get_session_local(), name)

engine = _LazyEngine()
SessionLocal = _LazySessionLocal()


async def get_db(request: Request = None) -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to get async database session.
    Sets RLS context if Authorization header is present.
    
    Usage:
        @router.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(Item))
            return result.scalars().all()
    """
    async with _get_session_local()() as db:
        try:
            # RLS Integration
            if request:
                auth_header = request.headers.get("Authorization")
                if auth_header and auth_header.startswith("Bearer "):
                    token = auth_header.split(" ")[1]
                    try:
                        # Decode without verification just to get sub for RLS
                        # Verification happens in auth dependency
                        payload = jwt.decode(token, options={"verify_signature": False})
                        user_id = payload.get("sub")
                        if user_id:
                            await set_current_cognito_user_id(db, user_id)
                    except Exception as e:
                        logger.warning(f"Error setting RLS context: {e}")

            yield db
        except Exception as e:
            logger.error(f"Database session error: {e}")
            await db.rollback()
            raise
        finally:
            await db.close()


async def init_db():
    """Initialize database by creating all tables"""
    logger.info("Initializing database tables...")
    async with _get_engine().begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created successfully")


async def close_db():
    """Close database engine connections"""
    logger.info("Closing database connections...")
    if _engine is not None:
        await _engine.dispose()
    logger.info("Database connections closed")

