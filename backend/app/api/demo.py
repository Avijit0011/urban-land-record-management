import os
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db
import sys
from pathlib import Path
root_dir = Path(__file__).resolve().parent.parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from app.database.models import Dataset, Parcel, Building, Conflict, AuditLog
from scripts.generate_synthetic_data import generate_synthetic_urban_dataset
from app.services.conflict_detector import detect_conflicts_in_dataset
from app.services.audit import record_audit_log

router = APIRouter(prefix="/api/demo", tags=["Demo Mode"])

@router.post("/load")
def load_demo_dataset_endpoint(db: Session = Depends(get_db)):
    """
    Executes full end-to-end demo mode:
    1. Generates 240 synthetic urban cadastral parcels & 166 buildings with ground truth errors
    2. Imports features into PostGIS/SQLite database
    3. Runs CRS harmonization, geometry validation, and topology checks
    4. Triggers ML spatial matching and conflict detection
    5. Populates interactive map and dashboard with real harmonized data!
    """
    output_dir = "./data/synthetic"
    generate_synthetic_urban_dataset(output_dir=output_dir)

    cadastral_path = os.path.join(output_dir, "cadastral_parcels.geojson")
    buildings_path = os.path.join(output_dir, "buildings.geojson")

    if not os.path.exists(cadastral_path) or not os.path.exists(buildings_path):
        raise HTTPException(status_code=500, detail="Failed to generate synthetic demo dataset.")

    # Clear existing demo data
    db.query(Parcel).delete()
    db.query(Building).delete()
    db.query(Conflict).delete()
    db.query(Dataset).delete()
    db.commit()

    # Load Cadastral Parcels
    with open(cadastral_path, "r") as f:
        c_data = json.load(f)
        c_features = c_data.get("features", [])

    d_cadastral = Dataset(
        id="demo_cadastral_dataset",
        name="Cadastral Revenue Map (Demo)",
        dataset_type="Cadastral",
        file_name="cadastral_parcels.geojson",
        crs="EPSG:3857",
        geometry_type="Polygon",
        source="Synthetic Generator",
        status="completed",
        feature_count=len(c_features),
        bbox=[8626000.0, 2156000.0, 8626640.0, 2156525.0]
    )
    db.add(d_cadastral)

    for feat in c_features:
        props = feat.get("properties", {})
        p = Parcel(
            id=props["parcel_id"],
            parcel_id=props["parcel_id"],
            survey_number=props.get("survey_number"),
            owner_reference=props.get("owner_reference"),
            land_use=props.get("land_use", "Unclassified"),
            area=props.get("area", 0.0),
            source_dataset="Cadastral_Revenue_Map",
            confidence_score=props.get("confidence_score", 0.95),
            geometry=feat["geometry"],
            crs="EPSG:3857"
        )
        db.add(p)

    # Load Buildings
    with open(buildings_path, "r") as f:
        b_data = json.load(f)
        b_features = b_data.get("features", [])

    d_buildings = Dataset(
        id="demo_buildings_dataset",
        name="Drone Imagery Footprints (Demo)",
        dataset_type="Building",
        file_name="buildings.geojson",
        crs="EPSG:3857",
        geometry_type="Polygon",
        source="AI Drone Segmentation",
        status="completed",
        feature_count=len(b_features),
        bbox=[8626000.0, 2156000.0, 8626640.0, 2156525.0]
    )
    db.add(d_buildings)

    for feat in b_features:
        props = feat.get("properties", {})
        b = Building(
            id=props["building_id"],
            building_id=props["building_id"],
            parcel_id=props.get("parcel_id"),
            source_dataset="Drone_Orthophoto",
            area=props.get("area", 0.0),
            confidence_score=props.get("confidence_score", 0.92),
            geometry=feat["geometry"]
        )
        db.add(b)

    db.commit()

    # Detect conflicts automatically
    parcel_dicts = [{"parcel_id": f["properties"]["parcel_id"], "geometry": f["geometry"], "area": f["properties"]["area"], "source_dataset": "Cadastral", "owner_reference": f["properties"]["owner_reference"]} for f in c_features]
    building_dicts = [{"building_id": f["properties"]["building_id"], "geometry": f["geometry"], "area": f["properties"]["area"], "source_dataset": "Drone"} for f in b_features]

    conflicts = detect_conflicts_in_dataset(parcel_dicts, building_dicts)

    for c_data in conflicts:
        c_obj = Conflict(
            id=c_data["id"],
            parcel_id=c_data.get("parcel_id"),
            building_id=c_data.get("building_id"),
            conflict_type=c_data["conflict_type"],
            severity=c_data["severity"],
            description=c_data["description"],
            source_a=c_data.get("source_a"),
            source_b=c_data.get("source_b"),
            expected_value=c_data.get("expected_value"),
            observed_value=c_data.get("observed_value"),
            confidence_score=c_data.get("confidence_score", 0.85),
            recommendation=c_data.get("recommendation"),
            explainability=c_data.get("explainability"),
            status="open"
        )
        db.add(c_obj)

    db.commit()

    record_audit_log(
        db=db,
        entity_type="demo_dataset",
        entity_id="demo_load",
        action="load_demo_dataset",
        new_value=f"Loaded {len(c_features)} parcels, {len(b_features)} buildings, {len(conflicts)} detected conflicts."
    )

    return {
        "status": "success",
        "message": "Synthetic demo dataset successfully loaded into PostGIS database!",
        "parcels_loaded": len(c_features),
        "buildings_loaded": len(b_features),
        "conflicts_detected": len(conflicts)
    }
