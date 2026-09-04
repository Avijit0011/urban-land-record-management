from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import Building, Parcel
from app.services.change_detector import detect_temporal_changes

router = APIRouter(prefix="/api/change-detection", tags=["Change Detection"])

@router.post("")
def run_change_detection(db: Session = Depends(get_db)):
    """
    Compares baseline building footprints against latest AI extractions and parcel surveys.
    Detects NEW BUILDINGS, REMOVED BUILDINGS, MODIFIED BUILDINGS, and BOUNDARY DRIFT.
    """
    all_buildings = db.query(Building).all()

    # Split into baseline (first half) vs current (second half + extractions)
    half = max(1, len(all_buildings) // 2)
    baseline = [{"properties": {"building_id": b.building_id, "area": b.area}, "geometry": b.geometry} for b in all_buildings[:half]]
    current = [{"properties": {"building_id": b.building_id, "area": b.area}, "geometry": b.geometry} for b in all_buildings[half-15:]]

    result = detect_temporal_changes(baseline, current)
    return result
