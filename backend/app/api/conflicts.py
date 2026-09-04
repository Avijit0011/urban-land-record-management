from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import Conflict, Parcel, Building
from app.models.schemas import ConflictResponse, ConflictResolveRequest
from app.services.audit import record_audit_log

router = APIRouter(prefix="/api/conflicts", tags=["Conflicts & Human Review"])

@router.get("", response_model=List[ConflictResponse])
def list_conflicts(
    status: Optional[str] = Query(None, description="Filter by status: open, approved, rejected, modified"),
    severity: Optional[str] = Query(None, description="Filter by severity: high, medium, low"),
    conflict_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Conflict)
    if status:
        query = query.filter(Conflict.status == status)
    if severity:
        query = query.filter(Conflict.severity == severity)
    if conflict_type:
        query = query.filter(Conflict.conflict_type == conflict_type)

    return query.order_by(Conflict.created_at.desc()).all()

@router.get("/{conflict_id}")
def get_conflict_detail(conflict_id: str, db: Session = Depends(get_db)):
    conflict = db.query(Conflict).filter(Conflict.id == conflict_id).first()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")

    parcel = None
    if conflict.parcel_id:
        parcel = db.query(Parcel).filter(Parcel.parcel_id == conflict.parcel_id).first()

    building = None
    if conflict.building_id:
        building = db.query(Building).filter(Building.building_id == conflict.building_id).first()

    return {
        "conflict": ConflictResponse.from_orm(conflict),
        "parcel_context": parcel.geometry if parcel else None,
        "parcel_properties": {
            "parcel_id": parcel.parcel_id,
            "owner_reference": parcel.owner_reference,
            "land_use": parcel.land_use,
            "area": parcel.area
        } if parcel else None,
        "building_context": building.geometry if building else None,
        "building_properties": {
            "building_id": building.building_id,
            "area": building.area
        } if building else None
    }

@router.post("/{conflict_id}/resolve")
def resolve_conflict(
    conflict_id: str,
    req: ConflictResolveRequest,
    db: Session = Depends(get_db)
):
    conflict = db.query(Conflict).filter(Conflict.id == conflict_id).first()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")

    prev_status = conflict.status
    action = req.action.lower()

    if action == "approve":
        conflict.status = "approved"
        conflict.resolved_at = datetime.utcnow()
        
        # Apply recommendation to parcel if attribute conflict
        if conflict.parcel_id and conflict.conflict_type == "area_mismatch":
            parcel = db.query(Parcel).filter(Parcel.parcel_id == conflict.parcel_id).first()
            if parcel and req.corrected_value:
                try:
                    parcel.area = float(req.corrected_value)
                except ValueError:
                    pass

    elif action == "reject":
        conflict.status = "rejected"
        conflict.resolved_at = datetime.utcnow()

    elif action == "edit":
        conflict.status = "modified"
        conflict.resolved_at = datetime.utcnow()
        if req.corrected_value and conflict.parcel_id:
            parcel = db.query(Parcel).filter(Parcel.parcel_id == conflict.parcel_id).first()
            if parcel:
                parcel.land_use = req.corrected_value

    else:
        raise HTTPException(status_code=400, detail="Invalid action. Choose approve, reject, or edit.")

    db.commit()

    # Record Audit Log entry
    record_audit_log(
        db=db,
        entity_type="conflict",
        entity_id=conflict_id,
        action=f"conflict_{action}",
        previous_value=f"status: {prev_status}",
        new_value=f"status: {conflict.status}, note: {req.resolution_note}, corrected: {req.corrected_value}",
        user_id=req.user_id
    )

    return {
        "status": "success",
        "conflict_id": conflict_id,
        "new_status": conflict.status,
        "action_taken": action
    }
