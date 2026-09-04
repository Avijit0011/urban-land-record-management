import os
import json
import random
import numpy as np
from shapely.geometry import Polygon, Point, mapping
from shapely.validation import make_valid

# Standard urban grid in Web Mercator / UTM (Meter projection around EPSG:3857)
BASE_X = 8626000.0
BASE_Y = 2156000.0

LAND_USES = ["Residential", "Commercial", "Industrial", "Agricultural", "Public/Government", "Vacant/Open Land"]
FIRST_NAMES = ["Rajesh", "Priya", "Amit", "Sunita", "Vikram", "Ananya", "Suresh", "Meena", "Ramesh", "Kavita"]
LAST_NAMES = ["Sharma", "Verma", "Patel", "Singh", "Rao", "Joshi", "Gupta", "Deshmukh", "Kulkarni", "Nair"]

def generate_synthetic_urban_dataset(output_dir: str = "./data/synthetic"):
    """
    Generates realistic urban cadastral parcels, buildings, roads, survey points,
    and intentionally injected ground-truth conflicts.
    """
    os.makedirs(output_dir, exist_ok=True)
    random.seed(42)
    np.random.seed(42)

    parcels_features = []
    buildings_features = []
    survey_features = []

    grid_rows, grid_cols = 15, 16 # 240 parcels total
    parcel_counter = 1
    building_counter = 1

    ground_truth = {
        "total_parcels": grid_rows * grid_cols,
        "total_buildings": 0,
        "injected_conflicts": []
    }

    for r in range(grid_rows):
        for c in range(grid_cols):
            p_id = f"P{parcel_counter:04d}"
            survey_no = f"SURVEY/{r+1:02d}/{c+1:03d}"
            
            x = BASE_X + (c * 40.0) + (random.uniform(-2.0, 2.0))
            y = BASE_Y + (r * 35.0) + (random.uniform(-2.0, 2.0))
            w = 38.0 + random.uniform(-3.0, 3.0)
            h = 33.0 + random.uniform(-3.0, 3.0)

            # Create parcel polygon
            poly_coords = [
                (x, y),
                (x + w, y + random.uniform(-1.5, 1.5)),
                (x + w + random.uniform(-1.5, 1.5), y + h),
                (x, y + h + random.uniform(-1.5, 1.5)),
                (x, y)
            ]

            poly = Polygon(poly_coords)
            if not poly.is_valid:
                poly = make_valid(poly)

            area_sqm = float(round(poly.area, 2))
            owner = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
            land_use = random.choice(LAND_USES)

            # Inject Intentional Errors into specific parcels for conflict testing
            doc_area = area_sqm
            is_corrupted = False

            if parcel_counter == 12:
                # Area Mismatch error
                doc_area = area_sqm * 1.25 # 25% area discrepancy
                ground_truth["injected_conflicts"].append({"parcel_id": p_id, "type": "area_mismatch"})
                is_corrupted = True

            elif parcel_counter == 25:
                # Missing owner error
                owner = None
                ground_truth["injected_conflicts"].append({"parcel_id": p_id, "type": "missing_owner"})
                is_corrupted = True

            elif parcel_counter == 42:
                # Self-intersecting / invalid geometry error (bow-tie polygon)
                poly_coords = [(x, y), (x + w, y + h), (x + w, y), (x, y + h), (x, y)]
                poly = Polygon(poly_coords)
                ground_truth["injected_conflicts"].append({"parcel_id": p_id, "type": "invalid_geometry"})
                is_corrupted = True

            parcels_features.append({
                "type": "Feature",
                "geometry": mapping(poly),
                "properties": {
                    "parcel_id": p_id,
                    "survey_number": survey_no,
                    "owner_reference": owner,
                    "land_use": land_use,
                    "area": float(round(doc_area, 2)),
                    "source_dataset": "Cadastral_Revenue_Map_2024",
                    "confidence_score": 0.95 if not is_corrupted else 0.65
                }
            })

            # Create 1 or 2 building footprints inside parcel (70% probability)
            if random.random() < 0.70 and not (parcel_counter == 42):
                b_id = f"B{building_counter:04d}"
                bw = w * random.uniform(0.35, 0.60)
                bh = h * random.uniform(0.35, 0.60)
                bx = x + (w - bw) / 2.0
                by = y + (h - bh) / 2.0

                # Inject Building Spillover / Outside Parcel Conflict
                if parcel_counter == 18:
                    bx = x + w - (bw * 0.3) # Shift building to spill over right boundary
                    ground_truth["injected_conflicts"].append({"parcel_id": p_id, "building_id": b_id, "type": "building_outside"})

                b_coords = [(bx, by), (bx + bw, by), (bx + bw, by + bh), (bx, by + bh), (bx, by)]
                b_poly = Polygon(b_coords)
                
                buildings_features.append({
                    "type": "Feature",
                    "geometry": mapping(b_poly),
                    "properties": {
                        "building_id": b_id,
                        "parcel_id": p_id,
                        "area": float(round(b_poly.area, 2)),
                        "source_dataset": "Drone_Orthophoto_2024",
                        "confidence_score": 0.92
                    }
                })
                building_counter += 1

            # Survey Control Point at parcel centroid
            c = poly.centroid
            survey_features.append({
                "type": "Feature",
                "geometry": mapping(c),
                "properties": {
                    "point_id": f"GNSS_PT_{parcel_counter:04d}",
                    "parcel_id": p_id,
                    "elevation_m": float(round(120.5 + random.uniform(-2.0, 5.0), 2)),
                    "accuracy_m": 0.02
                }
            })

            parcel_counter += 1

    ground_truth["total_buildings"] = len(buildings_features)

    # Save files
    cadastral_path = os.path.join(output_dir, "cadastral_parcels.geojson")
    buildings_path = os.path.join(output_dir, "buildings.geojson")
    survey_path = os.path.join(output_dir, "survey_points.geojson")
    gt_path = os.path.join(output_dir, "ground_truth.json")

    with open(cadastral_path, "w") as f:
        json.dump({"type": "FeatureCollection", "crs": {"type": "name", "properties": {"name": "EPSG:3857"}}, "features": parcels_features}, f, indent=2)

    with open(buildings_path, "w") as f:
        json.dump({"type": "FeatureCollection", "crs": {"type": "name", "properties": {"name": "EPSG:3857"}}, "features": buildings_features}, f, indent=2)

    with open(survey_path, "w") as f:
        json.dump({"type": "FeatureCollection", "crs": {"type": "name", "properties": {"name": "EPSG:3857"}}, "features": survey_features}, f, indent=2)

    with open(gt_path, "w") as f:
        json.dump(ground_truth, f, indent=2)

    print(f"Successfully generated synthetic dataset in '{output_dir}':")
    print(f" - Parcels: {len(parcels_features)}")
    print(f" - Buildings: {len(buildings_features)}")
    print(f" - Survey Points: {len(survey_features)}")
    print(f" - Injected Conflicts: {len(ground_truth['injected_conflicts'])}")

if __name__ == "__main__":
    generate_synthetic_urban_dataset()
