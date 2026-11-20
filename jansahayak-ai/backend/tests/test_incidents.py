from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.main import app
from app.services.similarity_service import find_similar

client = TestClient(app)


def create_complaint(title: str, description: str, locality: str = "Green Park", category: str = "Water Supply"):
    return client.post("/api/complaints", json={
        "title": title,
        "description": description,
        "language": "English",
        "district": "Bhopal",
        "locality": locality,
        "category": category,
        "priority": "High",
    }).json()


def test_water_supply_examples_are_ranked_related():
    current = {
        "title": "No water supply",
        "description": "No water supply in Green Park since yesterday.",
    }
    candidates = [
        {"id": 1, "reference_id": "JS-1", "title": "Dry taps", "description": "The taps are completely dry in our Green Park colony.", "district": "Bhopal", "locality": "Green Park", "category": "Water Supply", "created_at": datetime.now(timezone.utc)},
        {"id": 2, "reference_id": "JS-2", "title": "No pressure", "description": "Water pressure has stopped in Green Park since last night.", "district": "Bhopal", "locality": "Green Park", "category": "Water Supply", "created_at": datetime.now(timezone.utc)},
    ]
    matches = find_similar(
        f"{current['title']} {current['description']}", candidates,
        district="Bhopal", locality="Green Park", category="Water Supply",
        submitted_at=datetime.now(timezone.utc), limit=5,
    )
    assert len(matches) >= 1
    assert matches[0]["matching_signals"]["same_locality"] is True
    assert matches[0]["matching_evidence"] if "matching_evidence" in matches[0] else matches[0]["matching_evidence"]


def test_unrelated_location_is_not_returned():
    matches = find_similar(
        "water leakage in the street",
        [{"id": 99, "reference_id": "JS-99", "title": "Water leakage", "description": "Water pipe is leaking", "district": "Indore", "locality": "Vijay Nagar", "category": "Water Supply", "created_at": datetime.now(timezone.utc)}],
        district="Bhopal", locality="Green Park", category="Water Supply",
        submitted_at=datetime.now(timezone.utc),
    )
    assert matches == []


def test_related_endpoint_incident_creation_and_officer_review():
    first = create_complaint("No water supply", "No water supply in Green Park since yesterday.")
    second = create_complaint("Dry taps", "The taps are completely dry in our Green Park colony.")

    related = client.get(f"/api/complaints/{first['id']}/related")
    assert related.status_code == 200
    assert "potential_matches" in related.json()

    created = client.post("/api/incidents", json={
        "title": "Green Park water outage",
        "complaint_ids": [first["id"], second["id"]],
        "district": "Bhopal",
        "locality": "Green Park",
        "severity": "High",
    })
    assert created.status_code == 201
    incident = created.json()
    assert len(incident["complaints"]) == 2

    reviewed = client.post(f"/api/incidents/{incident['id']}/review", json={
        "complaint_id": second["id"],
        "decision": "confirm",
        "officer_decision_reason": "Same locality and water outage issue.",
    })
    assert reviewed.status_code == 200
    association = next(item for item in reviewed.json()["complaints"] if item["complaint_id"] == second["id"])
    assert association["review_status"] == "Confirmed"
    assert association["review_timestamp"] is not None

    assert client.get("/api/incidents").status_code == 200
