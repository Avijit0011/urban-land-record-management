import os
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import Building
from app.ai.imagery_extractor import extract_buildings_from_raster
import uuid

router = APIRouter(prefix="/api/imagery", tags=["AI Imagery Extraction"])

@router.post("/extract")
def extract_imagery_features(
    raster_path: Optional[str] = Query(None, description="Path to GeoTIFF file"),
    threshold: int = Query(120, ge=0, le=255),
    demo_mode: bool = Query(True),
    db: Session = Depends(get_db)
):
    """
    Triggers AI / OpenCV computer vision extraction of building footprints from GeoTIFF imagery.
    Converts raster masks into vector polygons, cleans topology, and imports into spatial database.
    """
    r_path = raster_path or "./data/uploads/sample_drone.tif"
    res = extract_buildings_from_raster(r_path, threshold=threshold, demo_mode=demo_mode)

    features = res.get("features", [])
    imported_count = 0

    for f in features:
        props = f.get("properties", {})
        b_id = props.get("building_id") or f"AI_BLDG_{uuid.uuid4().hex[:6]}"
        
        # Check existing
        existing = db.query(Building).filter(Building.building_id == b_id).first()
        if not existing:
            b = Building(
                id=str(uuid.uuid4()),
                building_id=b_id,
                source_dataset="AI_Drone_Imagery_Segmentation",
                area=props.get("area", 0.0),
                confidence_score=props.get("confidence_score", 0.88),
                geometry=f.get("geometry")
            )
            db.add(b)
            imported_count += 1

    db.commit()

    return {
        "status": "success",
        "extracted_count": len(features),
        "imported_new_buildings": imported_count,
        "features": features
    }
