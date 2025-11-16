from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from sqlalchemy.pool import QueuePool
from typing import Generator
import logging
import os
from app.config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Base class for all database models"""
    pass


def get_database_url() -> str:
    """Get database URL from settings or construct from components"""
    if settings.database_url:
        logger.info(f"Using DATABASE_URL from settings: {settings.database_url[:50]}...")
        return settings.database_url
    
    if settings.is_development:
        logger.warning("DATABASE_URL not set, constructing from components")
        db_host = os.getenv("POSTGRES_HOST", "db")
        constructed_url = (
            f"postgresql://{settings.postgres_user}:{settings.postgres_password}"
            f"@{db_host}:{settings.postgres_port}/{settings.postgres_db}"
        )
        logger.info(f"Constructed DATABASE_URL: {constructed_url[:50]}...")
        return constructed_url
    
    raise ValueError("DATABASE_URL is required in non-development environments")


def create_database_engine():
    """Create SQLAlchemy engine with optimized pool settings"""
    database_url = get_database_url()
    
    engine_kwargs = {
        "url": database_url,
        "poolclass": QueuePool,
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
        "pool_recycle": 3600,
        "echo": settings.is_development,
    }
    
    if settings.is_production:
        engine_kwargs.update({
            "pool_size": 20,
            "max_overflow": 40,
            "pool_recycle": 1800,
            "echo": False,
        })
    
    engine = create_engine(**engine_kwargs)
    
    @event.listens_for(engine, "connect")
    def set_postgres_params(dbapi_conn, connection_record):
        """Set PostgreSQL connection parameters"""
        with dbapi_conn.cursor() as cursor:
            cursor.execute("SET timezone TO 'UTC'")
    
    logger.info(f"Database engine created for {settings.environment} environment")
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
    """Lazy initialization of session maker"""
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=_get_engine(),
            class_=Session,
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


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get database session.
    
    Usage:
        @router.get("/items")
        async def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = _get_session_local()()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """Initialize database by creating all tables"""
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=_get_engine())
    logger.info("Database tables created successfully")


def close_db():
    """Close database engine connections"""
    logger.info("Closing database connections...")
    if _engine is not None:
        _engine.dispose()
    logger.info("Database connections closed")

