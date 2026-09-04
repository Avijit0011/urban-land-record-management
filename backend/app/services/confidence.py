import logging
from typing import Dict, Any

logger = logging.getLogger("land_record.services.confidence")

# Thresholds
HIGH_THRESHOLD = 0.85
MED_THRESHOLD = 0.60

def calculate_overall_confidence(
    spatial_score: float = 1.0,
    geometry_score: float = 1.0,
    attribute_score: float = 1.0,
    imagery_score: float = 1.0,
    source_reliability: float = 1.0
) -> Dict[str, Any]:
    """
    Computes weighted overall confidence score across multi-source GIS data.
    Formula:
      Overall = 0.35*Spatial + 0.25*Geometry + 0.20*Attribute + 0.10*Imagery + 0.10*Source
    """
    s_score = max(0.0, min(1.0, spatial_score))
    g_score = max(0.0, min(1.0, geometry_score))
    a_score = max(0.0, min(1.0, attribute_score))
    i_score = max(0.0, min(1.0, imagery_score))
    r_score = max(0.0, min(1.0, source_reliability))

    weights = {
        "spatial": 0.35,
        "geometry": 0.25,
        "attribute": 0.20,
        "imagery": 0.10,
        "source": 0.10
    }

    overall = (
        weights["spatial"] * s_score +
        weights["geometry"] * g_score +
        weights["attribute"] * a_score +
        weights["imagery"] * i_score +
        weights["source"] * r_score
    )

    overall_clean = float(round(overall, 4))
    percentage = float(round(overall_clean * 100, 1))

    if overall_clean >= HIGH_THRESHOLD:
        category = "HIGH CONFIDENCE"
        action_recommendation = "AUTO-ACCEPT CANDIDATE"
    elif overall_clean >= MED_THRESHOLD:
        category = "MEDIUM CONFIDENCE"
        action_recommendation = "REVIEW REQUIRED"
    else:
        category = "LOW CONFIDENCE"
        action_recommendation = "MANUAL REVIEW"

    return {
        "overall_score": overall_clean,
        "confidence_percentage": percentage,
        "category": category,
        "action_recommendation": action_recommendation,
        "score_breakdown": {
            "spatial": float(round(s_score, 3)),
            "geometry": float(round(g_score, 3)),
            "attribute": float(round(a_score, 3)),
            "imagery": float(round(i_score, 3)),
            "source_reliability": float(round(r_score, 3))
        },
        "weights": weights
    }
