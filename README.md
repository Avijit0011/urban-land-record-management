# GeoHarmonize AI — Automated Integration & Harmonization of Multi-source Geospatial Data for Urban Land Record Management

**Problem Statement ID 26013 Prototype**

GeoHarmonize AI is a production-grade full-stack GeoAI platform designed for municipal land record authorities and GIS departments. It ingests multi-source geospatial data (cadastral revenue maps, drone imagery footprints, building vectors, municipal GIS layers, GNSS survey points), validates geometry & topology, harmonizes CRS & schemas, executes Random Forest ML spatial matching, detects spatial/attribute/temporal conflicts, calculates multi-component confidence scores, and provides a human-in-the-loop WebGIS interface for interactive auditing.

---

## Key Features

1. **Multi-Source Data Ingestion & Validation**:
   - Ingests GeoJSON, Shapefile ZIP, GeoTIFF, and CSV coordinate records.
   - Detects dataset layer types: Cadastral, Building, Imagery, Road, Utility, Revenue, Survey.
   - Validates geometry structure, detects self-intersections, empty geometries, tiny polygons, and dataset-wide overlaps/duplicates.
   - Non-destructive topology repair using Shapely `make_valid` & `buffer(0)` while preserving original geometries.

2. **CRS Harmonization Service**:
   - Automated PyProj & GeoPandas CRS detection, validation, and reprojection to target project CRS (`EPSG:3857` metric analysis, `EPSG:4326` WebGIS display).

3. **ML Spatial Matching Engine**:
   - STRtree spatial index candidate generation.
   - Calculates spatial metrics: Intersection-over-Union (IoU), Centroid Distance, Boundary Distance, Area Ratio, Containment Ratio, Geometry Similarity score.
   - Random Forest ML model predicting feature match probability with explainability factors (IoU weight, distance penalty, area ratio).

4. **Multi-Component Confidence Engine**:
   - Weighted overall confidence calculation combining Spatial Match, Geometry Validity, Attribute Consistency, Imagery Extraction, and Source Reliability.
   - Categorized as **HIGH CONFIDENCE** (>0.85 -> Auto-Accept Candidate), **MEDIUM CONFIDENCE** (0.60–0.85 -> Review Required), and **LOW CONFIDENCE** (<0.60 -> Manual Review).

5. **Attribute Harmonizer & Schema Mapper**:
   - Field alias mapper (`survey_no` &rarr; `parcel_id`, `landholder` &rarr; `owner_reference`, `plot_area` &rarr; `area`).
   - Data-type normalization, unit conversion (`sq.ft` &rarr; `sq.m`, `acres` &rarr; `sq.m`), and semantic land-use standardization.

6. **Conflict Detection Engine**:
   - Spatial Conflicts: Parcel overlaps, building spillover outside parcel, boundary displacements, duplicate parcels, topology gaps.
   - Attribute Conflicts: Area mismatch (>8% discrepancy between documented area and GIS polygon), missing owner references, land-use mismatches.
   - Temporal Conflicts: New building additions, removed structures, boundary shifts.

7. **Human-in-the-Loop WebGIS Review & Audit Logging**:
   - Dedicated conflict review desk with side-by-side source comparison, AI explainability breakdown, and action buttons (`[Approve]`, `[Reject]`, `[Edit]`, `[Mark for Review]`).
   - Immutable audit logging tracking entity type, entity ID, action, previous vs new values, user ID, and timestamp.

8. **Computer Vision Imagery Extraction**:
   - OpenCV contour segmentation pipeline for building footprint extraction from GeoTIFF rasters with threshold controls.

9. **Temporal Change Detection**:
   - Compares multi-temporal snapshots (2020 vs 2024) to flag NEW, REMOVED, MODIFIED buildings and boundary drift.

10. **Interactive WebGIS Dashboard**:
    - React + Vite + Tailwind CSS + Leaflet interactive map with custom dark glassmorphic styling.
    - Layer visibility toggles, parcel/building/conflict popups, spatial search bar with fly-to zoom, and Recharts analytics.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Leaflet, Recharts, Lucide Icons, Axios
- **Backend**: Python 3.10+, FastAPI, Pydantic v2, Uvicorn, GeoPandas, Shapely, PyProj, Rasterio, scikit-learn, OpenCV
- **Database**: PostgreSQL 15 + PostGIS 3.3 (via SQLAlchemy & GeoAlchemy2) with automated embedded SQLite spatial engine fallback
- **Infrastructure**: Docker & Docker Compose

---

## Project Structure

```
Urban Land Record Management/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (datasets, parcels, conflicts, etc.)
│   │   ├── gis/          # GIS engine (validation, crs_service, spatial_match)
│   │   ├── ai/           # ML matching model & imagery feature extractor
│   │   ├── services/     # Confidence, conflict detector, attribute harmonizer, audit
│   │   ├── database/     # SQLAlchemy PostGIS models & fallback engine
│   │   └── models/       # Pydantic v2 schemas
│   ├── tests/            # Pytest unit & integration test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Navbar and UI layout components
│   │   ├── pages/        # Dashboard, WebGIS Map, Conflicts, Datasets, etc.
│   │   ├── services/     # Axios API service client
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── scripts/
│   └── generate_synthetic_data.py   # Synthetic urban GIS dataset generator
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Quick Start Guide

### Option 1: Running with Docker Compose (Recommended)

1. Clone the repository and navigate into the root directory:
   ```bash
   cd "Urban Land Record Management"
   ```

2. Start the PostGIS database, FastAPI backend, and React frontend:
   ```bash
   docker compose up --build
   ```

3. Open your browser and navigate to:
   - WebGIS Dashboard: `http://localhost:3000`
   - FastAPI Interactive Swagger Docs: `http://localhost:8000/docs`

---

### Option 2: Running Locally (Development Mode)

#### 1. Backend Setup:
```bash
# Navigate to backend
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run FastAPI server (uses embedded SQLite spatial database if PostgreSQL is offline)
python app/main.py
```
Backend runs at `http://127.0.0.1:8000`.

#### 2. Generate Synthetic Demo Data & Run Tests:
```bash
# Run pytest test suite
$env:PYTHONPATH="backend"; python -m pytest backend/tests -v

# Generate synthetic urban dataset
python scripts/generate_synthetic_data.py
```

#### 3. Frontend Setup:
```bash
# Navigate to frontend
cd frontend

# Install node dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend runs at `http://localhost:3000`.

---

## How to Demo the Application

1. Open `http://localhost:3000` in your web browser.
2. Click the **"Load Demo Dataset"** button on the top right navigation bar.
3. The system will automatically seed the PostGIS/SQLite database with **240 synthetic parcels**, **166 building footprints**, **survey control points**, and **4 ground-truth conflicts**.
4. Explore the **Dashboard KPIs & Charts**, click **WebGIS Map** to inspect colored parcels and buildings with spatial search, open **Conflicts** to approve/reject flagged discrepancies with AI explainability, and view the **Analytics Evaluation Scorecard**.
