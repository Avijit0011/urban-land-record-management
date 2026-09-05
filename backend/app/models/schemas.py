from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class DatasetBase(BaseModel):
    name: str
    dataset_type: str # Cadastral, Building, Imagery, Road, Utility, Revenue, Survey, Other
    file_name: str
    crs: str = "EPSG:4326"
    geometry_type: str = "Polygon"
    source: str = "Upload"

class DatasetCreate(DatasetBase):
    pass

class DatasetResponse(DatasetBase):
    id: str
    status: str
    feature_count: int
    bbox: Optional[List[float]] = None
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)

class GeometryModel(BaseModel):
    type: str
    coordinates: Any

class ParcelBase(BaseModel):
    parcel_id: str
    survey_number: Optional[str] = None
    owner_reference: Optional[str] = None
    land_use: str = "Unclassified"
    area: float = 0.0
    source_dataset: str
    confidence_score: float = 1.0
    crs: str = "EPSG:4326"

class ParcelCreate(ParcelBase):
    geometry: Dict[str, Any]

class ParcelResponse(ParcelBase):
    id: str
    geometry: Dict[str, Any]
    original_geometry: Optional[Dict[str, Any]] = None
    is_corrected: bool = False
    correction_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BuildingBase(BaseModel):
    building_id: str
    parcel_id: Optional[str] = None
    source_dataset: str
    area: float = 0.0
    confidence_score: float = 1.0
    building_type: str = "Structure"

class BuildingCreate(BuildingBase):
    geometry: Dict[str, Any]

class BuildingResponse(BuildingBase):
    id: str
    geometry: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]

class ConflictResponse(BaseModel):
    id: str
    parcel_id: Optional[str] = None
    building_id: Optional[str] = None
    conflict_type: str
    severity: str
    description: str
    source_a: Optional[str] = None
    source_b: Optional[str] = None
    expected_value: Optional[str] = None
    observed_value: Optional[str] = None
    confidence_score: float
    recommendation: Optional[str] = None
    explainability: Optional[Dict[str, Any]] = None
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ConflictResolveRequest(BaseModel):
    action: str # approve, reject, edit
    resolution_note: Optional[str] = None
    corrected_value: Optional[str] = None
    user_id: str = "admin_user"

class AuditLogResponse(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    action: str
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    user_id: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class FieldMappingRule(BaseModel):
    source_field: str
    target_field: str # parcel_id, owner_reference, area, land_use, survey_number
    data_type: str = "string"
    unit: Optional[str] = None # sq_m, sq_ft, acres, hectares

class HarmonizeRequest(BaseModel):
    dataset_ids: List[str]
    target_crs: str = "EPSG:3857"
    field_mappings: Optional[List[FieldMappingRule]] = None

class ProcessingJobResponse(BaseModel):
    id: str
    dataset_id: Optional[str] = None
    operation: str
    status: str
    progress: float
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class EvaluationMetrics(BaseModel):
    spatial_matching_accuracy: float
    spatial_matching_precision: float
    spatial_matching_recall: float
    spatial_matching_f1: float
    mean_iou: float
    geometry_invalid_count: int
    geometry_corrections_made: int
    conflict_precision: float
    conflict_recall: float
    processing_time_seconds: float
    total_parcels_processed: int
    total_buildings_processed: int
    total_conflicts_detected: int
