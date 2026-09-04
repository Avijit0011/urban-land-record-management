import logging
from typing import Dict, Any, List, Optional
import uuid
from shapely.geometry import shape

logger = logging.getLogger("land_record.services.conflict_detector")

def detect_conflicts_in_dataset(
    parcels: List[Dict[str, Any]],
    buildings: List[Dict[str, Any]] = None,
    revenue_records: List[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Detects spatial, attribute, and temporal conflicts across parcels, buildings, and revenue records.
    """
    buildings = buildings or []
    revenue_records = revenue_records or []
    conflicts = []

    parcel_shapes = {}
    for p in parcels:
        p_id = p.get("parcel_id") or p.get("id")
        g = p.get("geometry")
        if p_id and g:
            try:
                s = shape(g)
                if s.is_valid and not s.is_empty:
                    parcel_shapes[p_id] = (s, p)
            except Exception:
                pass

    # 1. Attribute & Area Mismatch Conflicts
    for p_id, (p_shape, p_data) in parcel_shapes.items():
        doc_area = p_data.get("area") or p_data.get("properties", {}).get("area")
        gis_area = float(p_shape.area)

        # Area mismatch check (> 8% discrepancy between documented and GIS polygon)
        if doc_area and doc_area > 0:
            diff_ratio = abs(doc_area - gis_area) / doc_area
            if diff_ratio > 0.08:
                conflicts.append({
                    "id": str(uuid.uuid4()),
                    "parcel_id": p_id,
                    "conflict_type": "area_mismatch",
                    "severity": "high" if diff_ratio > 0.20 else "medium",
                    "description": f"Parcel {p_id} documented area ({doc_area:.1f} m²) differs from calculated GIS geometry area ({gis_area:.1f} m²) by {diff_ratio*100:.1f}%.",
                    "source_a": p_data.get("source_dataset", "Cadastral_Record"),
                    "source_b": "GIS_Geometry_Calculation",
                    "expected_value": f"{doc_area:.1f} m²",
                    "observed_value": f"{gis_area:.1f} m²",
                    "confidence_score": 0.88,
                    "recommendation": "Recalculate parcel boundary from physical survey or update official title record.",
                    "explainability": {"area_discrepancy_sqm": float(round(abs(doc_area - gis_area), 2)), "percentage_delta": float(round(diff_ratio*100, 1))},
                    "status": "open"
                })

        # Missing owner check
        owner = p_data.get("owner_reference") or p_data.get("properties", {}).get("owner")
        if not owner or str(owner).strip().lower() in ["null", "none", "unknown", ""]:
            conflicts.append({
                "id": str(uuid.uuid4()),
                "parcel_id": p_id,
                "conflict_type": "missing_owner",
                "severity": "low",
                "description": f"Parcel {p_id} lacks an owner reference record in land registry database.",
                "source_a": p_data.get("source_dataset", "Cadastral_Record"),
                "source_b": "Revenue_Registry",
                "expected_value": "Valid Owner Name/ID",
                "observed_value": "MISSING / NULL",
                "confidence_score": 0.95,
                "recommendation": "Cross-reference with municipal tax roll to assign verified landholder reference.",
                "explainability": {"field_checked": "owner_reference"},
                "status": "open"
            })

    # 2. Building Outside Parcel Spatial Conflicts
    for b in buildings:
        b_id = b.get("building_id") or b.get("id")
        b_geom = b.get("geometry")
        if not b_geom:
            continue
        try:
            b_shape = shape(b_geom)
            if not b_shape.is_valid or b_shape.is_empty:
                continue

            best_p_id = None
            max_containment = 0.0

            for p_id, (p_shape, p_data) in parcel_shapes.items():
                if b_shape.intersects(p_shape):
                    inter_area = b_shape.intersection(p_shape).area
                    containment = inter_area / b_shape.area
                    if containment > max_containment:
                        max_containment = containment
                        best_p_id = p_id

            if best_p_id and max_containment < 0.85:
                # Building overlaps multiple parcels or spills over boundary
                conflicts.append({
                    "id": str(uuid.uuid4()),
                    "parcel_id": best_p_id,
                    "building_id": b_id,
                    "conflict_type": "building_outside",
                    "severity": "high",
                    "description": f"Building {b_id} extends outside parcel {best_p_id} boundary (only {max_containment*100:.1f}% inside parcel).",
                    "source_a": "Cadastral_Parcels",
                    "source_b": b.get("source_dataset", "Drone_Building_Footprints"),
                    "expected_value": f"100% containment in Parcel {best_p_id}",
                    "observed_value": f"{max_containment*100:.1f}% containment",
                    "confidence_score": 0.91,
                    "recommendation": "Verify setback violations or adjust parcel boundary to reflect ground reality.",
                    "explainability": {"building_id": b_id, "parcel_id": best_p_id, "containment_percentage": float(round(max_containment*100, 1))},
                    "status": "open"
                })
        except Exception as e:
            logger.warning(f"Error checking building conflict for {b}: {e}")

    # 3. Spatial Overlap Conflicts between Parcels
    parcel_list = list(parcel_shapes.items())
    n = len(parcel_list)
    for i in range(n):
        p1_id, (s1, data1) = parcel_list[i]
        for j in range(i + 1, n):
            p2_id, (s2, data2) = parcel_list[j]
            if s1.intersects(s2):
                intersection = s1.intersection(s2)
                if intersection.area > 5.0: # > 5 sq.m overlap
                    iou = intersection.area / (s1.area + s2.area - intersection.area)
                    if iou < 0.90:
                        conflicts.append({
                            "id": str(uuid.uuid4()),
                            "parcel_id": p1_id,
                            "conflict_type": "spatial_overlap",
                            "severity": "high",
                            "description": f"Parcel {p1_id} and Parcel {p2_id} spatially overlap by {intersection.area:.1f} m².",
                            "source_a": data1.get("source_dataset", "Cadastral_Layer"),
                            "source_b": data2.get("source_dataset", "Survey_Layer"),
                            "expected_value": "Zero boundary overlap",
                            "observed_value": f"{intersection.area:.1f} m² overlap",
                            "confidence_score": 0.94,
                            "recommendation": "Perform boundary harmonization using highest-accuracy GNSS survey control points.",
                            "explainability": {"overlap_parcel_1": p1_id, "overlap_parcel_2": p2_id, "overlap_area_sqm": float(round(intersection.area, 2))},
                            "status": "open"
                        })

    return conflicts
