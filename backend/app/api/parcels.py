from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import Parcel, Building, Conflict
from app.models.schemas import GeoJSONFeatureCollection, GeoJSONFeature, ParcelResponse, BuildingResponse

router = APIRouter(prefix="/api/parcels", tags=["Parcels & Spatial Features"])

@router.get("", response_model=GeoJSONFeatureCollection)
def get_parcels_geojson(
    query: Optional[str] = Query(None, description="Search term for parcel_id, survey_number, or owner"),
    land_use: Optional[str] = None,
    min_confidence: Optional[float] = None,
    has_conflict: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    db_query = db.query(Parcel)

    if query:
        term = f"%{query.strip()}%"
        db_query = db_query.filter(
            (Parcel.parcel_id.ilike(term)) |
            (Parcel.survey_number.ilike(term)) |
            (Parcel.owner_reference.ilike(term))
        )

    if land_use:
        db_query = db_query.filter(Parcel.land_use == land_use)

    if min_confidence is not None:
        db_query = db_query.filter(Parcel.confidence_score >= min_confidence)

    parcels = db_query.limit(1000).all()

    # Get list of parcel IDs with conflicts if filtered
    conflict_parcel_ids = set()
    if has_conflict is not None:
        active_conflicts = db.query(Conflict.parcel_id).filter(Conflict.status == "open").all()
        conflict_parcel_ids = {c[0] for c in active_conflicts if c[0]}

    features = []
    for p in parcels:
        if has_conflict is True and p.parcel_id not in conflict_parcel_ids:
            continue
        if has_conflict is False and p.parcel_id in conflict_parcel_ids:
            continue

        features.append(GeoJSONFeature(
            type="Feature",
            geometry=p.geometry,
            properties={
                "id": p.id,
                "parcel_id": p.parcel_id,
                "survey_number": p.survey_number or p.parcel_id,
                "owner_reference": p.owner_reference or "Unspecified Owner",
                "land_use": p.land_use,
                "area": p.area,
                "confidence_score": p.confidence_score,
                "source_dataset": p.source_dataset,
                "is_corrected": p.is_corrected,
                "correction_reason": p.correction_reason,
                "has_conflict": p.parcel_id in conflict_parcel_ids
            }
        ))

    return GeoJSONFeatureCollection(type="FeatureCollection", features=features)

@router.get("/buildings", response_model=GeoJSONFeatureCollection)
def get_buildings_geojson(db: Session = Depends(get_db)):
    buildings = db.query(Building).limit(1000).all()
    features = []
    for b in buildings:
        features.append(GeoJSONFeature(
            type="Feature",
            geometry=b.geometry,
            properties={
                "id": b.id,
                "building_id": b.building_id,
                "parcel_id": b.parcel_id,
                "area": b.area,
                "confidence_score": b.confidence_score,
                "source_dataset": b.source_dataset,
                "building_type": b.building_type
            }
        ))
    return GeoJSONFeatureCollection(type="FeatureCollection", features=features)

@router.get("/{parcel_id}")
def get_parcel_detail(parcel_id: str, db: Session = Depends(get_db)):
    parcel = db.query(Parcel).filter(Parcel.parcel_id == parcel_id).first()
    if not parcel:
        parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    matched_buildings = db.query(Building).filter(Building.parcel_id == parcel.parcel_id).all()
    conflicts = db.query(Conflict).filter(Conflict.parcel_id == parcel.parcel_id).all()

    return {
        "parcel": ParcelResponse.from_orm(parcel),
        "matched_buildings": [BuildingResponse.from_orm(b) for b in matched_buildings],
        "conflicts": conflicts
    }
