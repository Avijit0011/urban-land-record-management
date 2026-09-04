import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Dataset {
  id: string;
  name: string;
  dataset_type: string;
  file_name: string;
  crs: string;
  geometry_type: string;
  source: string;
  status: string;
  feature_count: number;
  bbox?: number[];
  uploaded_at: string;
}

export interface ParcelProperties {
  id: string;
  parcel_id: string;
  survey_number: string;
  owner_reference: string;
  land_use: string;
  area: number;
  confidence_score: number;
  source_dataset: string;
  is_corrected: boolean;
  correction_reason?: string;
  has_conflict?: boolean;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: any;
  properties: ParcelProperties | any;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface Conflict {
  id: string;
  parcel_id?: string;
  building_id?: string;
  conflict_type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  source_a?: string;
  source_b?: string;
  expected_value?: string;
  observed_value?: string;
  confidence_score: number;
  recommendation?: string;
  explainability?: Record<string, any>;
  status: 'open' | 'approved' | 'rejected' | 'modified';
  created_at: string;
  resolved_at?: string;
}

export interface Statistics {
  kpis: {
    total_parcels: number;
    total_buildings: number;
    total_datasets: number;
    total_conflicts: number;
    open_conflicts: number;
    high_severity_conflicts: number;
    high_confidence_parcels: number;
    review_required_parcels: number;
  };
  conflicts_by_type: { type: string; count: number }[];
  confidence_distribution: { range: string; count: number }[];
}

export interface DatasetAnalysis {
  dataset_id: string;
  dataset_name: string;
  dataset_type: string;
  crs: string;
  geometry_type: string;
  uploaded_at?: string;
  feature_count: number;
  bbox?: number[];
  metrics: {
    valid_geometries: number;
    repaired_geometries: number;
    validity_percentage: number;
    min_area_sqm: number;
    max_area_sqm: number;
    mean_area_sqm: number;
    total_area_sqm: number;
  };
  land_use_breakdown: { type: string; count: number }[];
}

export const fetchDatasets = () => api.get<Dataset[]>('/datasets').then((res) => res.data);
export const uploadDatasetFile = (formData: FormData) =>
  api.post<Dataset>('/datasets/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((res) => res.data);

export const fetchDatasetAnalysis = (datasetId: string) =>
  api.get<DatasetAnalysis>(`/datasets/${datasetId}/analyze`).then((res) => res.data);

export const fetchParcelsGeoJSON = (query?: string, land_use?: string, min_confidence?: number, has_conflict?: boolean) =>
  api.get<GeoJSONFeatureCollection>('/parcels', { params: { query, land_use, min_confidence, has_conflict } }).then((res) => res.data);

export const fetchBuildingsGeoJSON = () =>
  api.get<GeoJSONFeatureCollection>('/parcels/buildings').then((res) => res.data);

export const fetchConflicts = (status?: string, severity?: string) =>
  api.get<Conflict[]>('/conflicts', { params: { status, severity } }).then((res) => res.data);

export const resolveConflict = (conflictId: string, action: string, resolution_note?: string, corrected_value?: string) =>
  api.post(`/conflicts/${conflictId}/resolve`, { action, resolution_note, corrected_value }).then((res) => res.data);

export const executeHarmonization = () =>
  api.post('/harmonize/execute', { dataset_ids: [], target_crs: 'EPSG:3857' }).then((res) => res.data);

export const triggerSpatialMatch = () =>
  api.post('/spatial/match', { max_distance_meters: 50.0 }).then((res) => res.data);

export const triggerImageryExtraction = (threshold: number = 120) =>
  api.post('/imagery/extract', null, { params: { threshold, demo_mode: true } }).then((res) => res.data);

export const runChangeDetection = () =>
  api.post('/change-detection').then((res) => res.data);

export const fetchStatistics = () => api.get<Statistics>('/analytics/statistics').then((res) => res.data);
export const fetchEvaluation = () => api.get('/analytics/evaluation').then((res) => res.data);

export const loadDemoDataset = () => api.post('/demo/load').then((res) => res.data);

