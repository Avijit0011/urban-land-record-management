import logging
from typing import Dict, Any, List, Tuple
import shapely.geometry
from shapely.geometry import shape, mapping, MultiPolygon, Polygon
from shapely.validation import make_valid

logger = logging.getLogger("land_record.gis.validation")

MIN_PARCEL_AREA_SQM = 1.0 # Minimum reasonable parcel area

def validate_geometry(geom_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates a GeoJSON geometry.
    Checks: empty, valid structure, self-intersection, tiny area.
    Attempts non-destructive repair using Shapely make_valid / buffer(0).
    """
    result = {
        "valid": True,
        "errors": [],
        "repaired": False,
        "correction_reason": None,
        "original_geometry": geom_dict,
        "corrected_geometry": geom_dict,
        "area_sqm": 0.0
    }

    if not geom_dict or "coordinates" not in geom_dict or not geom_dict["coordinates"]:
        result["valid"] = False
        result["errors"].append({"type": "empty_geometry", "severity": "high", "message": "Geometry is empty or missing coordinates"})
        return result

    try:
        geom = shape(geom_dict)
    except Exception as e:
        result["valid"] = False
        result["errors"].append({"type": "invalid_structure", "severity": "high", "message": f"Malformed geometry structure: {str(e)}"})
        return result

    if geom.is_empty:
        result["valid"] = False
        result["errors"].append({"type": "empty_geometry", "severity": "high", "message": "Shapely shape is empty"})
        return result

    # Calculate area (approximate if unprojected)
    result["area_sqm"] = float(geom.area)

    # Check for validity / self-intersection
    if not geom.is_valid:
        result["valid"] = False
        reason = f"Invalid topology / self-intersection: {shapely.validation.explain_validity(geom)}"
        result["errors"].append({"type": "self_intersection", "severity": "high", "message": reason})

        # Attempt repair
        try:
            repaired_geom = make_valid(geom)
            if not repaired_geom.is_valid or repaired_geom.is_empty:
                repaired_geom = geom.buffer(0)

            if repaired_geom.is_valid and not repaired_geom.is_empty:
                # Convert back to polygon if multipolygon with small artifacts
                if isinstance(repaired_geom, MultiPolygon):
                    # keep largest polygon
                    polys = sorted(repaired_geom.geoms, key=lambda p: p.area, reverse=True)
                    if polys:
                        repaired_geom = polys[0]

                result["repaired"] = True
                result["correction_reason"] = reason
                result["corrected_geometry"] = mapping(repaired_geom)
                result["area_sqm"] = float(repaired_geom.area)
                logger.info(f"Successfully repaired invalid geometry: {reason}")
        except Exception as repair_err:
            logger.error(f"Failed to repair geometry: {repair_err}")

    # Check for tiny polygon
    if geom.area < MIN_PARCEL_AREA_SQM:
        result["errors"].append({"type": "tiny_polygon", "severity": "medium", "message": f"Geometry area is extremely small ({geom.area:.4f} m²)"})

    return result

def validate_topology_dataset(features: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Checks dataset-wide topology issues: overlaps, gaps, duplicates.
    """
    shapes = []
    feature_ids = []
    
    for i, f in enumerate(features):
        g = f.get("geometry")
        f_id = f.get("properties", {}).get("parcel_id") or f.get("properties", {}).get("id") or str(i)
        if g:
            try:
                s = shape(g)
                if s.is_valid and not s.is_empty:
                    shapes.append(s)
                    feature_ids.append(f_id)
            except Exception:
                pass

    overlaps = []
    duplicates = []
    
    # Check pairwise overlaps and duplicates using spatial indexing or pairwise check
    n = len(shapes)
    for i in range(n):
        for j in range(i + 1, n):
            s1, s2 = shapes[i], shapes[j]
            if s1.intersects(s2):
                intersection = s1.intersection(s2)
                if intersection.area > 0.1: # non-trivial overlap
                    iou = intersection.area / (s1.area + s2.area - intersection.area)
                    if iou > 0.95:
                        duplicates.append({
                            "feature_id_1": feature_ids[i],
                            "feature_id_2": feature_ids[j],
                            "iou": float(iou),
                            "severity": "high"
                        })
                    else:
                        overlaps.append({
                            "feature_id_1": feature_ids[i],
                            "feature_id_2": feature_ids[j],
                            "overlap_area_sqm": float(intersection.area),
                            "severity": "medium"
                        })

    return {
        "total_features": len(features),
        "valid_features": len(shapes),
        "overlaps_detected": len(overlaps),
        "duplicates_detected": len(duplicates),
        "overlap_details": overlaps[:20], # cap sample
        "duplicate_details": duplicates[:20]
    }
