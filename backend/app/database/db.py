import os
import json
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger("land_record.db")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://gis_user:gis_password@localhost:5432/land_record_db")
SQLITE_FALLBACK_PATH = os.getenv("SQLITE_FALLBACK_PATH", "./land_record_fallback.db")

Base = declarative_base()

engine = None
SessionLocal = None
IS_POSTGIS = False

def init_db():
    global engine, SessionLocal, IS_POSTGIS
    
    # Try PostgreSQL/PostGIS connection first
    if "postgresql" in DATABASE_URL:
        try:
            logger.info(f"Attempting PostgreSQL connection: {DATABASE_URL}")
            test_engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={"connect_timeout": 3})
            with test_engine.connect() as conn:
                logger.info("PostgreSQL connection successful!")
                engine = test_engine
                IS_POSTGIS = True
        except Exception as e:
            logger.warning(f"PostgreSQL connection failed: {e}. Falling back to SQLite spatial database...")
            IS_POSTGIS = False

    if not IS_POSTGIS:
        sqlite_url = f"sqlite:///{SQLITE_FALLBACK_PATH}"
        logger.info(f"Initializing SQLite fallback database at: {sqlite_url}")
        engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
        IS_POSTGIS = False

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    logger.info(f"Database initialized. IS_POSTGIS={IS_POSTGIS}")

def get_db():
    if SessionLocal is None:
        init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
