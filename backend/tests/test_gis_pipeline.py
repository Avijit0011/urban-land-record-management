import pytest
from shapely.geometry import Polygon, mapping
from app.gis.crs_service import detect_crs, transform_geometry
from app.gis.validation import validate_geometry
from app.gis.spatial_match import calculate_spatial_metrics
from app.ai.matching_model import spatial_matcher
from app.services.confidence import calculate_overall_confidence
from app.services.conflict_detector import detect_conflicts_in_dataset
from app.services.attribute_harmonizer import harmonize_feature_attributes, normalize_unit_to_sqm

def test_crs_detection():
    assert detect_crs(4326) == "EPSG:4326"
    assert detect_crs("EPSG:3857") == "EPSG:3857"

def test_geometry_validation_and_repair():
    # Valid square polygon
    poly = Polygon([(0, 0), (10, 0), (10, 10), (0, 10), (0, 0)])
    res = validate_geometry(mapping(poly))
    assert res["valid"] is True
    assert res["repaired"] is False

    # Invalid self-intersecting bow-tie polygon
    bowtie = Polygon([(0, 0), (10, 10), (10, 0), (0, 10), (0, 0)])
    res2 = validate_geometry(mapping(bowtie))
    assert res2["valid"] is False
    assert res2["repaired"] is True
    assert res2["corrected_geometry"] is not None

def test_spatial_metrics_and_ml_matching():
    poly1 = Polygon([(0, 0), (20, 0), (20, 20), (0, 20), (0, 0)])
    poly2 = Polygon([(5, 5), (15, 5), (15, 15), (5, 15), (5, 5)])

    metrics = calculate_spatial_metrics(poly2, poly1)
    assert metrics["containment_ratio"] == 1.0 # poly2 is fully inside poly1
    assert metrics["iou"] > 0.2

    ml_res = spatial_matcher.predict_match(metrics)
    assert ml_res["is_match"] is True
    assert ml_res["confidence_percentage"] >= 60.0

def test_conflict_detection():
    parcels = [{
        "parcel_id": "P0001",
        "geometry": mapping(Polygon([(0, 0), (100, 0), (100, 100), (0, 100), (0, 0)])),
        "area": 15000.0, # 15000 documented area vs 10000 calculated area -> discrepancy
        "owner_reference": None # Missing owner
    }]
    buildings = [{
        "building_id": "B0001",
        "geometry": mapping(Polygon([(80, 80), (120, 80), (120, 120), (80, 120), (80, 80)])), # Spills outside parcel
        "area": 1600.0
    }]

    conflicts = detect_conflicts_in_dataset(parcels, buildings)
    assert len(conflicts) >= 2
    types = [c["conflict_type"] for c in conflicts]
    assert "area_mismatch" in types
    assert "missing_owner" in types
    assert "building_outside" in types

def test_confidence_engine():
    res = calculate_overall_confidence(
        spatial_score=0.90,
        geometry_score=0.95,
        attribute_score=0.90,
        imagery_score=0.85,
        source_reliability=0.90
    )
    assert res["category"] == "HIGH CONFIDENCE"
    assert res["action_recommendation"] == "AUTO-ACCEPT CANDIDATE"
    assert res["overall_score"] >= 0.85

def test_attribute_harmonization():
    props = {
        "plot_no": "SURVEY-402",
        "landholder": "mr. rajesh sharma",
        "plot_area": 1000.0,
        "zoning": "res"
    }

    harm, _ = harmonize_feature_attributes(props)
    assert harm["parcel_id"] == "SURVEY-402"
    assert harm["owner_reference"] == "Mr. Rajesh Sharma"
    assert harm["land_use"] == "Residential"
    assert harm["area"] == 1000.0

    sqft_to_sqm = normalize_unit_to_sqm(100.0, "sq_ft")
    assert round(sqft_to_sqm, 2) == 9.29
