import logging
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
from shapely.geometry import shape, Polygon, MultiPolygon
from shapely.strtree import STRtree

logger = logging.getLogger("land_record.gis.spatial_match")

def calculate_spatial_metrics(source_geom: Any, candidate_geom: Any) -> Dict[str, float]:
    """
    Computes spatial relationship metrics between a source geometry (e.g. Building)
    and a candidate geometry (e.g. Parcel).
    """
    metrics = {
        "intersection_area": 0.0,
        "union_area": 0.0,
        "iou": 0.0,
        "centroid_distance": 9999.0,
        "boundary_distance": 9999.0,
        "area_ratio": 0.0,
        "containment_ratio": 0.0, # portion of source inside candidate
        "geometry_similarity": 0.0
    }

    if not source_geom or not candidate_geom or source_geom.is_empty or candidate_geom.is_empty:
        return metrics

    try:
        s_area = source_geom.area
        c_area = candidate_geom.area

        if s_area <= 0 or c_area <= 0:
            return metrics

        # Intersection & Union
        if source_geom.intersects(candidate_geom):
            intersection = source_geom.intersection(candidate_geom)
            metrics["intersection_area"] = float(intersection.area)
            
            union_area = s_area + c_area - intersection.area
            metrics["union_area"] = float(union_area)
            
            if union_area > 0:
                metrics["iou"] = float(intersection.area / union_area)
            
            metrics["containment_ratio"] = float(intersection.area / s_area)

        # Centroid distance
        s_centroid = source_geom.centroid
        c_centroid = candidate_geom.centroid
        metrics["centroid_distance"] = float(s_centroid.distance(c_centroid))

        # Boundary distance
        metrics["boundary_distance"] = float(source_geom.distance(candidate_geom))

        # Area ratio
        metrics["area_ratio"] = float(min(s_area, c_area) / max(s_area, c_area))

        # Geometry similarity (based on area ratio, distance, and shape compactness)
        # Compactness ratio = 4 * pi * Area / Perimeter^2
        s_perim = source_geom.length
        c_perim = candidate_geom.length
        
        s_compactness = (4 * np.pi * s_area) / (s_perim ** 2) if s_perim > 0 else 0
        c_compactness = (4 * np.pi * c_area) / (c_perim ** 2) if c_perim > 0 else 0

        compactness_sim = min(s_compactness, c_compactness) / max(s_compactness, c_compactness) if max(s_compactness, c_compactness) > 0 else 0
        
        # Combine metrics into geometry similarity score
        metrics["geometry_similarity"] = float(
            0.5 * metrics["containment_ratio"] +
            0.3 * metrics["area_ratio"] +
            0.2 * compactness_sim
        )

    except Exception as e:
        logger.error(f"Error calculating spatial metrics: {e}")

    return metrics

def find_spatial_candidates(
    source_features: List[Dict[str, Any]],
    target_features: List[Dict[str, Any]],
    max_distance_meters: float = 50.0
) -> List[Dict[str, Any]]:
    """
    Ranks target candidates for each source feature using STRtree spatial index.
    Returns best matches with candidate metrics and scores.
    """
    if not source_features or not target_features:
        return []

    target_geoms = []
    target_items = []

    for i, t_feat in enumerate(target_features):
        g_dict = t_feat.get("geometry")
        if g_dict:
            try:
                g = shape(g_dict)
                if g.is_valid and not g.is_empty:
                    target_geoms.append(g)
                    target_items.append((i, t_feat))
            except Exception:
                pass

    if not target_geoms:
        return []

    # Build STRtree on target geometries
    tree = STRtree(target_geoms)
    match_results = []

    for s_idx, s_feat in enumerate(source_features):
        s_dict = s_feat.get("geometry")
        s_id = s_feat.get("properties", {}).get("building_id") or s_feat.get("properties", {}).get("id") or f"src_{s_idx}"
        
        if not s_dict:
            continue

        try:
            s_geom = shape(s_dict)
            if not s_geom.is_valid or s_geom.is_empty:
                continue

            # Query spatial index with buffer
            buffered_s = s_geom.buffer(max_distance_meters)
            candidate_indices = tree.query(buffered_s)

            candidates = []
            for c_idx in candidate_indices:
                t_idx, t_feat = target_items[c_idx]
                t_geom = target_geoms[c_idx]
                t_id = t_feat.get("properties", {}).get("parcel_id") or t_feat.get("properties", {}).get("id") or f"tgt_{t_idx}"

                metrics = calculate_spatial_metrics(s_geom, t_geom)
                
                # Heuristic candidate score
                # IoU + containment + inverse distance
                dist_score = max(0.0, 1.0 - (metrics["centroid_distance"] / max_distance_meters))
                candidate_score = (
                    0.4 * metrics["containment_ratio"] +
                    0.3 * metrics["iou"] +
                    0.2 * metrics["area_ratio"] +
                    0.1 * dist_score
                )

                candidates.append({
                    "target_id": t_id,
                    "target_feature": t_feat,
                    "score": float(candidate_score),
                    "metrics": metrics
                })

            # Sort candidates by score descending
            candidates.sort(key=lambda x: x["score"], reverse=True)

            best_match = candidates[0] if candidates else None

            match_results.append({
                "source_id": s_id,
                "source_feature": s_feat,
                "best_match": best_match,
                "candidates_count": len(candidates),
                "top_candidates": candidates[:3]
            })

        except Exception as e:
            logger.error(f"Error matching source feature {s_id}: {e}")

    return match_results
