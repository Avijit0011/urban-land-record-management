import logging
from typing import Dict, Any, List
from shapely.geometry import shape

logger = logging.getLogger("land_record.services.change_detector")

def detect_temporal_changes(
    baseline_features: List[Dict[str, Any]],
    current_features: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Compares baseline geospatial layer (e.g. Year 2020) against current layer (e.g. Year 2024).
    Detects: NEW BUILDING, REMOVED BUILDING, MODIFIED BUILDING, BOUNDARY CHANGE, ATTRIBUTE CHANGE.
    """
    changes = []

    base_map = {}
    for f in baseline_features:
        f_id = f.get("properties", {}).get("building_id") or f.get("properties", {}).get("parcel_id") or f.get("id")
        g = f.get("geometry")
        if f_id and g:
            try:
                base_map[f_id] = (shape(g), f)
            except Exception:
                pass

    curr_map = {}
    for f in current_features:
        f_id = f.get("properties", {}).get("building_id") or f.get("properties", {}).get("parcel_id") or f.get("id")
        g = f.get("geometry")
        if f_id and g:
            try:
                curr_map[f_id] = (shape(g), f)
            except Exception:
                pass

    # 1. Detect New and Modified features
    for c_id, (c_shape, c_feat) in curr_map.items():
        if c_id not in base_map:
            # Check spatial overlap with baseline to see if it's completely new or modified
            spatially_new = True
            for b_id, (b_shape, b_feat) in base_map.items():
                if c_shape.intersects(b_shape):
                    inter = c_shape.intersection(b_shape).area
                    iou = inter / (c_shape.area + b_shape.area - inter)
                    if iou > 0.4:
                        spatially_new = False
                        changes.append({
                            "change_type": "MODIFIED_BUILDING",
                            "feature_id": c_id,
                            "previous_state": f"Matched with {b_id} (IoU {iou:.2f})",
                            "current_state": f"Modified shape / area {c_shape.area:.1f} m²",
                            "area_delta_sqm": float(round(c_shape.area - b_shape.area, 2)),
                            "confidence": 0.89
                        })
                        break
            if spatially_new:
                changes.append({
                    "change_type": "NEW_BUILDING",
                    "feature_id": c_id,
                    "previous_state": "Non-existent in baseline dataset",
                    "current_state": f"Newly detected feature area {c_shape.area:.1f} m²",
                    "area_delta_sqm": float(round(c_shape.area, 2)),
                    "confidence": 0.94
                })
        else:
            b_shape, b_feat = base_map[c_id]
            # Exact ID match - check geometric & attribute changes
            if b_shape.intersects(c_shape):
                inter = b_shape.intersection(c_shape).area
                union = b_shape.area + c_shape.area - inter
                iou = inter / union if union > 0 else 0
                
                if iou < 0.90:
                    changes.append({
                        "change_type": "BOUNDARY_CHANGE",
                        "feature_id": c_id,
                        "previous_state": f"Baseline Area: {b_shape.area:.1f} m²",
                        "current_state": f"Current Area: {c_shape.area:.1f} m²",
                        "area_delta_sqm": float(round(c_shape.area - b_shape.area, 2)),
                        "confidence": 0.92
                    })

            # Check attribute changes (e.g. land use)
            b_use = b_feat.get("properties", {}).get("land_use")
            c_use = c_feat.get("properties", {}).get("land_use")
            if b_use and c_use and b_use != c_use:
                changes.append({
                    "change_type": "ATTRIBUTE_CHANGE",
                    "feature_id": c_id,
                    "previous_state": f"Land Use: {b_use}",
                    "current_state": f"Land Use: {c_use}",
                    "area_delta_sqm": 0.0,
                    "confidence": 0.96
                })

    # 2. Detect Removed features
    for b_id, (b_shape, b_feat) in base_map.items():
        if b_id not in curr_map:
            # Check if spatially replaced
            replaced = False
            for c_id, (c_shape, c_feat) in curr_map.items():
                if b_shape.intersects(c_shape) and b_shape.intersection(c_shape).area / b_shape.area > 0.4:
                    replaced = True
                    break
            if not replaced:
                changes.append({
                    "change_type": "REMOVED_BUILDING",
                    "feature_id": b_id,
                    "previous_state": f"Existed in baseline area {b_shape.area:.1f} m²",
                    "current_state": "Removed / Demolished",
                    "area_delta_sqm": float(round(-b_shape.area, 2)),
                    "confidence": 0.91
                })

    return {
        "total_baseline_features": len(baseline_features),
        "total_current_features": len(current_features),
        "total_changes_detected": len(changes),
        "summary": {
            "new_buildings": sum(1 for c in changes if c["change_type"] == "NEW_BUILDING"),
            "removed_buildings": sum(1 for c in changes if c["change_type"] == "REMOVED_BUILDING"),
            "modified_buildings": sum(1 for c in changes if c["change_type"] == "MODIFIED_BUILDING"),
            "boundary_changes": sum(1 for c in changes if c["change_type"] == "BOUNDARY_CHANGE"),
            "attribute_changes": sum(1 for c in changes if c["change_type"] == "ATTRIBUTE_CHANGE")
        },
        "changes": changes
    }
