import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.db import get_db
from app.database.models import Parcel, Building, Conflict, Dataset, AuditLog

client = TestClient(app)

def test_load_and_remove_demo_dataset():
    # 1. Load demo dataset
    response_load = client.post("/api/demo/load")
    assert response_load.status_code == 200
    data_load = response_load.json()
    assert data_load["status"] == "success"
    assert data_load["parcels_loaded"] > 0
    assert data_load["buildings_loaded"] > 0

    db = next(get_db())
    try:
        assert db.query(Parcel).count() > 0
        assert db.query(Building).count() > 0
        assert db.query(Dataset).count() > 0
    finally:
        db.close()

    # 2. Remove demo dataset
    response_remove = client.delete("/api/demo/remove")
    assert response_remove.status_code == 200
    data_remove = response_remove.json()
    assert data_remove["status"] == "success"
    assert data_remove["parcels_removed"] > 0
    assert data_remove["buildings_removed"] > 0
    assert data_remove["datasets_removed"] > 0

    db = next(get_db())
    try:
        assert db.query(Parcel).count() == 0
        assert db.query(Building).count() == 0
        assert db.query(Conflict).count() == 0
        assert db.query(Dataset).count() == 0
    finally:
        db.close()

