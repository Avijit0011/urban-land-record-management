import logging
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.database.models import AuditLog

logger = logging.getLogger("land_record.services.audit")

def record_audit_log(
    db: Session,
    entity_type: str,
    entity_id: str,
    action: str,
    previous_value: Optional[Any] = None,
    new_value: Optional[Any] = None,
    user_id: str = "admin_user"
) -> AuditLog:
    """
    Creates an immutable audit log entry for human-in-the-loop actions and harmonizations.
    """
    prev_str = str(previous_value) if previous_value is not None else None
    new_str = str(new_value) if new_value is not None else None

    log_entry = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        previous_value=prev_str,
        new_value=new_str,
        user_id=user_id,
        timestamp=datetime.utcnow()
    )

    try:
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        logger.info(f"Audit log saved: [{action}] {entity_type} #{entity_id}")
    except Exception as e:
        logger.error(f"Failed to record audit log: {e}")
        db.rollback()

    return log_entry
