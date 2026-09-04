import os
import logging
from typing import Dict, Any, List, Tuple
import numpy as np
from sklearn.ensemble import RandomForestClassifier

logger = logging.getLogger("land_record.ai.matching")

class SpatialMatchingModel:
    """
    Random Forest ML model for predicting feature matching probability
    between spatial features (e.g. Building to Parcel).
    """

    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=50, random_state=42)
        self.is_trained = False
        self._initialize_baseline_model()

    def _initialize_baseline_model(self):
        """
        Trains a synthetic baseline Random Forest model on sample geometric feature vectors
        so that ML predictions are active out of the box.
        """
        try:
            # Generate synthetic feature vectors [iou, centroid_dist_norm, area_ratio, containment, geom_sim]
            np.random.seed(42)
            num_samples = 300

            # Positive matches
            pos_iou = np.random.uniform(0.5, 1.0, num_samples // 2)
            pos_dist = np.random.uniform(0.0, 0.2, num_samples // 2) # normalized distance
            pos_area_ratio = np.random.uniform(0.6, 1.0, num_samples // 2)
            pos_containment = np.random.uniform(0.7, 1.0, num_samples // 2)
            pos_geom_sim = np.random.uniform(0.6, 1.0, num_samples // 2)
            X_pos = np.column_stack([pos_iou, pos_dist, pos_area_ratio, pos_containment, pos_geom_sim])
            y_pos = np.ones(num_samples // 2)

            # Negative matches
            neg_iou = np.random.uniform(0.0, 0.3, num_samples // 2)
            neg_dist = np.random.uniform(0.4, 1.0, num_samples // 2)
            neg_area_ratio = np.random.uniform(0.0, 0.4, num_samples // 2)
            neg_containment = np.random.uniform(0.0, 0.3, num_samples // 2)
            neg_geom_sim = np.random.uniform(0.0, 0.4, num_samples // 2)
            X_neg = np.column_stack([neg_iou, neg_dist, neg_area_ratio, neg_containment, neg_geom_sim])
            y_neg = np.zeros(num_samples // 2)

            X = np.vstack([X_pos, X_neg])
            y = np.concatenate([y_pos, y_neg])

            self.model.fit(X, y)
            self.is_trained = True
            logger.info("Spatial Matching ML Model initialized and baseline trained!")
        except Exception as e:
            logger.error(f"Failed to initialize ML matching model: {e}")

    def predict_match(self, metrics: Dict[str, float]) -> Dict[str, Any]:
        """
        Predicts match probability given spatial metrics.
        Returns: probability, confidence %, explainability breakdown.
        """
        iou = metrics.get("iou", 0.0)
        centroid_dist = metrics.get("centroid_distance", 999.0)
        area_ratio = metrics.get("area_ratio", 0.0)
        containment = metrics.get("containment_ratio", 0.0)
        geom_sim = metrics.get("geometry_similarity", 0.0)

        # Normalize distance for model input (0 to 1 scale assuming max 50m)
        dist_norm = min(1.0, centroid_dist / 50.0)

        feature_vector = np.array([[iou, dist_norm, area_ratio, containment, geom_sim]])

        if self.is_trained:
            try:
                probs = self.model.predict_proba(feature_vector)[0]
                match_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])
            except Exception:
                match_prob = self._heuristic_fallback(iou, containment, area_ratio, dist_norm)
        else:
            match_prob = self._heuristic_fallback(iou, containment, area_ratio, dist_norm)

        # Explainability feature weights
        explainability = {
            "iou_contribution": float(round(iou * 0.35, 3)),
            "containment_contribution": float(round(containment * 0.35, 3)),
            "area_similarity_contribution": float(round(area_ratio * 0.15, 3)),
            "distance_penalty": float(round((1.0 - dist_norm) * 0.15, 3))
        }

        return {
            "match_probability": float(round(match_prob, 4)),
            "confidence_percentage": float(round(match_prob * 100, 1)),
            "is_match": match_prob >= 0.60,
            "explainability": explainability,
            "metrics": metrics
        }

    def _heuristic_fallback(self, iou: float, containment: float, area_ratio: float, dist_norm: float) -> float:
        score = 0.4 * containment + 0.3 * iou + 0.2 * area_ratio + 0.1 * (1.0 - dist_norm)
        return float(min(1.0, max(0.0, score)))

# Global singleton instance
spatial_matcher = SpatialMatchingModel()
