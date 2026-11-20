from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def create_complaint(title: str, description: str, locality: str = "Green Park"):
    response = client.post("/api/complaints", json={
        "title": title,
        "description": description,
        "language": "English",
        "district": "Bhopal",
        "locality": locality,
        "category": "Water Supply",
        "priority": "High",
    })
    assert response.status_code == 201
    return response.json()


def test_recurring_issue_endpoint_aggregates_stored_complaints():
    first = create_complaint(
        "Interrupted water supply",
        "No water supply in Green Park since yesterday.",
    )
    second = create_complaint(
        "Low pressure water supply",
        "Water pressure is low and supply is interrupted in Green Park.",
    )

    response = client.get("/api/dashboard/recurring-issues", params={
        "days": 30,
        "minimum_complaints": 2,
        "district": "Bhopal",
        "locality": "Green Park",
        "category": "Water",
    })

    assert response.status_code == 200
    intelligence = response.json()
    assert intelligence["total_recurring_groups"] >= 1

    group = next(
        item for item in intelligence["recurring_issues"]
        if item["locality"] == "Green Park"
    )
    assert group["total_complaints"] >= 2
    assert group["affected_locality_count"] == 1
    assert group["first_reported_at"]
    assert group["latest_reported_at"]
    assert group["recurring_patterns"]
    assert group["supporting_reference_ids"]
    assert first["reference_id"] in group["supporting_reference_ids"]
    assert second["reference_id"] in group["supporting_reference_ids"]
    assert group["investigation_only"] is True
    assert group["investigation_points"]
    assert "root-cause" not in group["summary"].lower()


def test_recurring_issue_endpoint_rejects_invalid_parameters():
    assert client.get("/api/dashboard/recurring-issues", params={"days": 0}).status_code == 422
    assert client.get("/api/dashboard/recurring-issues", params={"minimum_complaints": 1}).status_code == 422
    assert client.get("/api/dashboard/recurring-issues", params={"department_id": 999999}).status_code == 404


def test_recurring_issue_groups_include_relevant_incident_information():
    first = create_complaint("No water", "No water supply in Green Park today.")
    second = create_complaint("Dry taps", "Green Park taps are dry since morning.")

    incident = client.post("/api/incidents", json={
        "title": "Green Park water outage",
        "complaint_ids": [first["id"], second["id"]],
        "district": "Bhopal",
        "locality": "Green Park",
        "severity": "High",
    })
    assert incident.status_code == 201

    response = client.get("/api/dashboard/recurring-issues", params={"minimum_complaints": 2})
    assert response.status_code == 200

    group = next(
        (item for item in response.json()["recurring_issues"] if item["locality"] == "Green Park"),
        None,
    )
    assert group is not None
    assert any(item["incident_id"] == incident.json()["id"] for item in group["relevant_incidents"])
