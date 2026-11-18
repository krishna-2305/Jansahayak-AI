from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def valid_complaint_payload() -> dict[str, object]:
    return {
        "title": "Streetlight not working",
        "description": "The streetlight outside our community hall is not working.",
        "language": "English",
        "district": "Bhopal",
        "locality": "Arera Colony",
        "category": "Streetlight",
        "priority": "Medium",
    }


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "success",
        "message": "JanSahayak AI Backend Running",
    }


def test_register_and_retrieve_complaint():
    create_response = client.post("/api/complaints", json=valid_complaint_payload())
    assert create_response.status_code == 201

    complaint = create_response.json()
    assert complaint["reference_id"].startswith("JS-")
    assert len(complaint["reference_id"]) == 11

    retrieve_response = client.get(f"/api/complaints/{complaint['reference_id']}")
    assert retrieve_response.status_code == 200
    assert retrieve_response.json()["id"] == complaint["id"]


def test_complaint_is_persisted_and_listed():
    created = client.post("/api/complaints", json=valid_complaint_payload()).json()

    list_response = client.get("/api/complaints")
    assert list_response.status_code == 200
    assert any(item["id"] == created["id"] for item in list_response.json())


def test_update_complaint_status_and_reject_invalid_status():
    created = client.post("/api/complaints", json=valid_complaint_payload()).json()

    update_response = client.patch(
        f"/api/complaints/{created['id']}/status",
        json={"status": "In Progress"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["status"] == "In Progress"

    invalid_response = client.patch(
        f"/api/complaints/{created['id']}/status",
        json={"status": "Unknown"},
    )
    assert invalid_response.status_code == 422


def test_invalid_complaint_input_is_rejected():
    payload = valid_complaint_payload()
    payload["title"] = ""

    response = client.post("/api/complaints", json=payload)
    assert response.status_code == 422


def test_missing_complaint_and_department_are_reported():
    missing_complaint = client.get("/api/complaints/JS-NOTFOUND")
    assert missing_complaint.status_code == 404

    payload = valid_complaint_payload()
    payload["department_id"] = 999999
    invalid_department = client.post("/api/complaints", json=payload)
    assert invalid_department.status_code == 404


def test_departments_and_dashboard_summary():
    departments = client.get("/api/departments")
    assert departments.status_code == 200
    assert len(departments.json()) >= 1

    summary = client.get("/api/dashboard/summary")
    assert summary.status_code == 200
    assert "total_complaints" in summary.json()
