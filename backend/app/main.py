import sys
import os
import logging
from contextlib import asynccontextmanager

# Add backend root to sys.path to enable direct execution
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.db import init_db
from app.api import datasets, parcels, conflicts, harmonization, spatial, imagery, change_detection, analytics, demo

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("land_record.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Land Record Management Platform backend...")
    init_db()
    yield
    logger.info("Shutting down backend...")

app = FastAPI(
    title="Urban Land Record Management API",
    description="Automated Integration & Intelligent Harmonization of Multi-source Geospatial Data for Urban Land Records",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(datasets.router)
app.include_router(parcels.router)
app.include_router(conflicts.router)
app.include_router(harmonization.router)
app.include_router(spatial.router)
app.include_router(imagery.router)
app.include_router(change_detection.router)
app.include_router(analytics.router)
app.include_router(demo.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Urban Land Record Harmonization Platform Backend",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
