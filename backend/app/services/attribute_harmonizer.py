import logging
from typing import Dict, Any, List, Tuple, Optional

logger = logging.getLogger("land_record.services.attribute_harmonizer")

STANDARD_FIELD_ALIASES = {
    "parcel_id": ["parcel_id", "plot_no", "plot_number", "survey_no", "survey_number", "cadastral_id", "prop_id"],
    "owner_reference": ["owner_reference", "owner", "owner_name", "landholder", "grantee", "proprietor"],
    "area": ["area", "parcel_area", "plot_area", "area_sq_m", "area_sqm", "size_sqm"],
    "land_use": ["land_use", "landuse", "zoning", "use_category", "type_of_use"]
}

LAND_USE_STANDARDIZATION = {
    "res": "Residential",
    "residential": "Residential",
    "housing": "Residential",
    "comm": "Commercial",
    "commercial": "Commercial",
    "retail": "Commercial",
    "shop": "Commercial",
    "ind": "Industrial",
    "industrial": "Industrial",
    "factory": "Industrial",
    "agri": "Agricultural",
    "agricultural": "Agricultural",
    "farming": "Agricultural",
    "gov": "Public/Government",
    "government": "Public/Government",
    "public": "Public/Government",
    "vacant": "Vacant/Open Land",
    "open": "Vacant/Open Land"
}

def normalize_unit_to_sqm(val: float, unit: str) -> float:
    """Converts common area units to square meters."""
    u = unit.lower().strip()
    if u in ["sq_ft", "sqft", "square_feet"]:
        return val * 0.092903
    elif u in ["acre", "acres"]:
        return val * 4046.86
    elif u in ["hectare", "hectares", "ha"]:
        return val * 10000.0
    return val

def harmonize_feature_attributes(
    properties: Dict[str, Any],
    custom_mappings: Optional[Dict[str, str]] = None
) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """
    Standardizes feature properties to uniform schema:
    parcel_id, survey_number, owner_reference, area, land_use.
    Returns: (harmonized_dict, audit_records)
    """
    harmonized = {
        "parcel_id": None,
        "survey_number": None,
        "owner_reference": None,
        "area": 0.0,
        "land_use": "Unclassified"
    }

    audit_records = []
    custom_mappings = custom_mappings or {}

    # 1. Map fields using custom or standard aliases
    for key, val in properties.items():
        if val is None:
            continue

        str_val = str(val).strip()
        k_lower = key.lower()

        target_field = custom_mappings.get(key)
        
        if not target_field:
            for std_field, aliases in STANDARD_FIELD_ALIASES.items():
                if k_lower in aliases:
                    target_field = std_field
                    break

        if not target_field:
            continue

        # Harmonize values
        if target_field == "parcel_id":
            harmonized["parcel_id"] = str_val
            harmonized["survey_number"] = str_val
            audit_records.append({"source_field": key, "standardized_field": "parcel_id", "original": str_val, "normalized": str_val})

        elif target_field == "owner_reference":
            harmonized["owner_reference"] = str_val.title()
            audit_records.append({"source_field": key, "standardized_field": "owner_reference", "original": str_val, "normalized": str_val.title()})

        elif target_field == "area":
            try:
                area_num = float(val)
                # Auto check unit if key contains unit hint
                if "sq_ft" in k_lower or "sqft" in k_lower:
                    area_sqm = normalize_unit_to_sqm(area_num, "sq_ft")
                elif "acre" in k_lower:
                    area_sqm = normalize_unit_to_sqm(area_num, "acres")
                elif "ha" in k_lower or "hectare" in k_lower:
                    area_sqm = normalize_unit_to_sqm(area_num, "hectares")
                else:
                    area_sqm = area_num
                
                harmonized["area"] = float(round(area_sqm, 2))
                audit_records.append({"source_field": key, "standardized_field": "area", "original": str(val), "normalized": str(harmonized["area"])})
            except (ValueError, TypeError):
                pass

        elif target_field == "land_use":
            std_use = LAND_USE_STANDARDIZATION.get(str_val.lower(), str_val.title())
            harmonized["land_use"] = std_use
            audit_records.append({"source_field": key, "standardized_field": "land_use", "original": str_val, "normalized": std_use})

    # Ensure fallback parcel_id
    if not harmonized["parcel_id"]:
        harmonized["parcel_id"] = properties.get("id") or properties.get("OBJECTID") or "P_UNNAMED"
        harmonized["survey_number"] = harmonized["parcel_id"]

    return harmonized, audit_records
