from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import Parcel, Building
from app.gis.spatial_match import find_spatial_candidates
from app.ai.matching_model import spatial_matcher

router = APIRouter(prefix="/api/spatial", tags=["Spatial Matching"])

@router.post("/match")
def run_spatial_matching(
    max_distance_meters: float = 50.0,
    db: Session = Depends(get_db)
):
    """
    Runs spatial matching between all building footprints and cadastral parcels.
    Uses STRtree spatial indexing, calculates geometric features (IoU, centroid distance, containment),
    and applies Random Forest ML predictions to assign buildings to parcels with confidence scores.
    """
    parcels = db.query(Parcel).all()
    buildings = db.query(Building).all()

    parcel_features = [{"properties": {"id": p.id, "parcel_id": p.parcel_id}, "geometry": p.geometry} for p in parcels]
    building_features = [{"properties": {"id": b.id, "building_id": b.building_id}, "geometry": b.geometry} for b in buildings]

    match_candidates = find_spatial_candidates(building_features, parcel_features, max_distance_meters=max_distance_meters)

    results = []
    updated_buildings = 0

    for m in match_candidates:
        src_id = m["source_id"]
        bm = m.get("best_match")
        
        if bm:
            metrics = bm["metrics"]
            ml_pred = spatial_matcher.predict_match(metrics)
            
            matched_parcel_id = bm["target_id"]
            
            # Update building parcel_id in database if confidence >= 60%
            if ml_pred["is_match"]:
                b_obj = db.query(Building).filter(Building.building_id == src_id).first()
                if b_obj:
                    b_obj.parcel_id = matched_parcel_id
                    b_obj.confidence_score = ml_pred["match_probability"]
                    updated_buildings += 1

            results.append({
                "building_id": src_id,
                "recommended_parcel_id": matched_parcel_id,
                "match_probability": ml_pred["match_probability"],
                "confidence_percentage": ml_pred["confidence_percentage"],
                "is_match": ml_pred["is_match"],
                "explainability": ml_pred["explainability"],
                "metrics": metrics
            })

    db.commit()

    return {
        "status": "success",
        "buildings_matched_count": len(results),
        "buildings_updated_in_db": updated_buildings,
        "matches": results[:50] # sample top matches
    }
