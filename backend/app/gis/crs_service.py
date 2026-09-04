import logging
from typing import Dict, Any, List, Optional
import pyproj
from pyproj import CRS, Transformer
import geopandas as gpd
from shapely.geometry import shape, mapping

logger = logging.getLogger("land_record.gis.crs")

DEFAULT_TARGET_CRS = "EPSG:3857" # Standard metric projection for area calculations
DEFAULT_DISPLAY_CRS = "EPSG:4326" # Standard lat/lon for WebGIS mapping

def detect_crs(raw_crs: Any) -> str:
    """
    Detects and normalizes CRS from string, dict, integer, or GeoJSON crs object.
    """
    if not raw_crs:
        return DEFAULT_DISPLAY_CRS
    
    try:
        if isinstance(raw_crs, int):
            return f"EPSG:{raw_crs}"
        if isinstance(raw_crs, str):
            if raw_crs.upper().startswith("EPSG:"):
                return raw_crs.upper()
            crs_obj = CRS.from_string(raw_crs)
            if crs_obj.to_epsg():
                return f"EPSG:{crs_obj.to_epsg()}"
            return str(crs_obj.name)
        if isinstance(raw_crs, dict):
            # GeoJSON CRS dictionary
            if "properties" in raw_crs and "name" in raw_crs["properties"]:
                name = raw_crs["properties"]["name"]
                if "EPSG" in name.upper():
                    code = name.split(":")[-1]
                    return f"EPSG:{code}"
            crs_obj = CRS.from_user_input(raw_crs)
            if crs_obj.to_epsg():
                return f"EPSG:{crs_obj.to_epsg()}"
    except Exception as e:
        logger.warning(f"Could not parse CRS '{raw_crs}': {e}. Defaulting to EPSG:4326")
    
    return DEFAULT_DISPLAY_CRS

def validate_crs(crs_str: str) -> bool:
    try:
        CRS.from_string(crs_str)
        return True
    except Exception:
        return False

def transform_geometry(geom_dict: Dict[str, Any], source_crs: str, target_crs: str) -> Dict[str, Any]:
    """
    Reprojects a single GeoJSON geometry dict from source_crs to target_crs.
    """
    source_crs = detect_crs(source_crs)
    target_crs = detect_crs(target_crs)

    if source_crs == target_crs:
        return geom_dict

    try:
        transformer = Transformer.from_crs(source_crs, target_crs, always_xy=True)
        geom = shape(geom_dict)
        
        # Apply transformation to shapely geometry coordinates
        def _reproject_coords(coords):
            if isinstance(coords[0], (int, float)):
                x, y = transformer.transform(coords[0], coords[1])
                return (x, y) if len(coords) == 2 else (x, y, coords[2])
            return [_reproject_coords(c) for c in coords]

        transformed_dict = geom_dict.copy()
        transformed_dict["coordinates"] = _reproject_coords(geom_dict["coordinates"])
        return transformed_dict
    except Exception as e:
        logger.error(f"Failed to transform geometry from {source_crs} to {target_crs}: {e}")
        return geom_dict

def transform_feature_collection(feature_collection: Dict[str, Any], source_crs: str, target_crs: str) -> Dict[str, Any]:
    """
    Reprojects an entire GeoJSON FeatureCollection.
    """
    s_crs = detect_crs(source_crs)
    t_crs = detect_crs(target_crs)
    
    features = feature_collection.get("features", [])
    transformed_features = []

    transformer = None
    if s_crs != t_crs:
        try:
            transformer = Transformer.from_crs(s_crs, t_crs, always_xy=True)
        except Exception as e:
            logger.error(f"Transformer creation error ({s_crs} -> {t_crs}): {e}")

    for f in features:
        geom = f.get("geometry")
        if geom and transformer:
            try:
                sh_geom = shape(geom)
                # reproject shapely object via pyproj ops or coords
                import shapely.ops
                reprojected_sh = shapely.ops.transform(transformer.transform, sh_geom)
                f_copy = dict(f)
                f_copy["geometry"] = mapping(reprojected_sh)
                transformed_features.append(f_copy)
            except Exception as f_err:
                logger.warning(f"Feature transformation error: {f_err}")
                transformed_features.append(f)
        else:
            transformed_features.append(f)

    result = dict(feature_collection)
    result["features"] = transformed_features
    result["crs"] = {"type": "name", "properties": {"name": t_crs}}
    return result
