import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, Text, DateTime, Integer, JSON
from app.database.db import Base

def generate_uuid():
    return str(uuid.uuid4())

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    dataset_type = Column(String, nullable=False) # Cadastral, Building, Imagery, Road, Utility, Revenue, Survey, Other
    file_name = Column(String, nullable=False)
    crs = Column(String, default="EPSG:4326")
    geometry_type = Column(String, default="Polygon")
    source = Column(String, default="Upload")
    status = Column(String, default="uploaded") # uploaded, validating, harmonizing, completed, failed
    feature_count = Column(Integer, default=0)
    bbox = Column(JSON, nullable=True) # [minx, miny, maxx, maxy]
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class Parcel(Base):
    __tablename__ = "parcels"

    id = Column(String, primary_key=True, default=generate_uuid)
    parcel_id = Column(String, index=True, nullable=False)
    survey_number = Column(String, nullable=True)
    owner_reference = Column(String, nullable=True)
    land_use = Column(String, default="Unclassified")
    area = Column(Float, default=0.0) # in sq meters
    source_dataset = Column(String, nullable=False)
    confidence_score = Column(Float, default=1.0)
    geometry = Column(JSON, nullable=False) # GeoJSON geometry dict
    original_geometry = Column(JSON, nullable=True)
    is_corrected = Column(Boolean, default=False)
    correction_reason = Column(String, nullable=True)
    crs = Column(String, default="EPSG:4326")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Building(Base):
    __tablename__ = "buildings"

    id = Column(String, primary_key=True, default=generate_uuid)
    building_id = Column(String, index=True, nullable=False)
    parcel_id = Column(String, index=True, nullable=True)
    source_dataset = Column(String, nullable=False)
    area = Column(Float, default=0.0)
    confidence_score = Column(Float, default=1.0)
    geometry = Column(JSON, nullable=False)
    building_type = Column(String, default="Structure")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Conflict(Base):
    __tablename__ = "conflicts"

    id = Column(String, primary_key=True, default=generate_uuid)
    parcel_id = Column(String, index=True, nullable=True)
    building_id = Column(String, index=True, nullable=True)
    conflict_type = Column(String, nullable=False) # spatial_overlap, building_outside, boundary_displacement, land_use_mismatch, area_mismatch, missing_owner, duplicate_parcel, temporal_change
    severity = Column(String, default="medium") # high, medium, low
    description = Column(Text, nullable=False)
    source_a = Column(String, nullable=True)
    source_b = Column(String, nullable=True)
    expected_value = Column(Text, nullable=True)
    observed_value = Column(Text, nullable=True)
    confidence_score = Column(Float, default=0.5)
    recommendation = Column(Text, nullable=True)
    explainability = Column(JSON, nullable=True) # IoU, distance, area_ratio
    status = Column(String, default="open") # open, approved, rejected, modified
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

class HarmonizedAttribute(Base):
    __tablename__ = "harmonized_attributes"

    id = Column(String, primary_key=True, default=generate_uuid)
    parcel_id = Column(String, index=True, nullable=False)
    source_field = Column(String, nullable=False)
    standardized_field = Column(String, nullable=False)
    original_value = Column(Text, nullable=True)
    normalized_value = Column(Text, nullable=True)
    confidence_score = Column(Float, default=1.0)

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(String, primary_key=True, default=generate_uuid)
    dataset_id = Column(String, nullable=True)
    operation = Column(String, nullable=False) # validation, crs_transform, spatial_match, harmonization, imagery_extraction
    status = Column(String, default="pending") # pending, running, completed, failed
    progress = Column(Float, default=0.0) # 0 to 100
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    entity_type = Column(String, nullable=False) # parcel, conflict, dataset, harmonization
    entity_id = Column(String, nullable=False)
    action = Column(String, nullable=False) # approve, reject, edit, upload, harmonize, repair
    previous_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    user_id = Column(String, default="admin_user")
    timestamp = Column(DateTime, default=datetime.utcnow)
