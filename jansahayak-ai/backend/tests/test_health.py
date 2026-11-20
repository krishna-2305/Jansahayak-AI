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


def test_ai_analysis_is_explainable_and_preserves_text():
    payload = valid_complaint_payload()
    payload.update({
        "title": "Live wire hanging near the school",
        "description": "A live wire is hanging dangerously beside the school gate and may cause electrocution.",
        "category": "Other Civic Issues",
        "priority": "Medium",
    })
    created = client.post("/api/complaints", json=payload)
    assert created.status_code == 201

    complaint = created.json()
    assert complaint["title"] == payload["title"]
    assert complaint["description"] == payload["description"]

    response = client.get(f"/api/complaints/{complaint['reference_id']}/ai-analysis")
    assert response.status_code == 200
    analysis = response.json()["analysis"]
    assert analysis["recommended_category"] == "Electricity"
    assert analysis["recommended_department"] == "Public Works"
    assert analysis["recommended_priority"] == "Critical"
    assert analysis["category_evidence"]
    assert analysis["priority_rationale"]


def test_ai_analysis_returns_no_external_dependency_result():
    payload = valid_complaint_payload()
    created = client.post("/api/complaints", json=payload).json()

    response = client.get(f"/api/complaints/{created['reference_id']}/ai-analysis")
    assert response.status_code == 200
    assert "analysis" in response.json()
    assert "similar_complaints" in response.json()


def test_status_remark_is_persisted_in_timeline():
    created = client.post("/api/complaints", json=valid_complaint_payload()).json()
    remarks = "Road repair squad dispatched; inspection is scheduled."

    update = client.patch(
        f"/api/complaints/{created['id']}/status",
        json={"status": "In Progress", "remarks": remarks},
    )
    assert update.status_code == 200

    retrieve = client.get(f"/api/complaints/{created['reference_id']}")
    assert retrieve.status_code == 200
    history = retrieve.json()["status_history"]
    assert any(entry["status"] == "In Progress" and entry["remarks"] == remarks for entry in history)


def test_complaint_text_is_normalized_and_priority_is_validated():
    payload = valid_complaint_payload()
    payload.update({
        "title": "  Broken   streetlight  ",
        "description": "  The   streetlight is not working outside the hall.  ",
        "district": "  Bhopal  ",
        "locality": "  Arera   Colony  ",
        "priority": "high",
    })

    created = client.post("/api/complaints", json=payload)
    assert created.status_code == 201
    complaint = created.json()
    assert complaint["title"] == "Broken streetlight"
    assert complaint["description"] == "The streetlight is not working outside the hall."
    assert complaint["district"] == "Bhopal"
    assert complaint["locality"] == "Arera Colony"
    assert complaint["priority"] == "High"

    invalid = dict(payload)
    invalid["priority"] = "Urgent"
    assert client.post("/api/complaints", json=invalid).status_code == 422


def test_reference_ids_are_unique_across_registered_complaints():
    first = client.post("/api/complaints", json=valid_complaint_payload()).json()
    second = client.post("/api/complaints", json=valid_complaint_payload()).json()

    assert first["reference_id"] != second["reference_id"]
    assert len(first["reference_id"]) == 11
    assert len(second["reference_id"]) == 11


def test_complaint_listing_supports_search_and_filters():
    department = client.get("/api/departments").json()[0]
    payload = valid_complaint_payload()
    payload.update({
        "district": "Gwalior",
        "locality": "City Center",
        "category": "Traffic Signal",
        "priority": "Critical",
        "department_id": department["id"],
    })
    created = client.post("/api/complaints", json=payload).json()

    response = client.get(
        "/api/complaints",
        params={
            "search": created["reference_id"],
            "category": "Traffic",
            "department_id": department["id"],
            "priority": "Critical",
            "status": "Submitted",
            "locality": "City",
            "skip": 0,
            "limit": 10,
        },
    )
    assert response.status_code == 200
    items = response.json()
    assert any(item["id"] == created["id"] for item in items)


def test_complaint_listing_rejects_invalid_filters_and_supports_pagination():
    assert client.get("/api/complaints", params={"priority": "Urgent"}).status_code == 422
    assert client.get("/api/complaints", params={"status": "Unknown"}).status_code == 422

    first_page = client.get("/api/complaints", params={"skip": 0, "limit": 1})
    assert first_page.status_code == 200
    assert len(first_page.json()) <= 1


def test_status_history_rejects_no_op_status_update():
    created = client.post("/api/complaints", json=valid_complaint_payload()).json()

    response = client.patch(
        f"/api/complaints/{created['id']}/status",
        json={"status": "Submitted", "remarks": "No change"},
    )
    assert response.status_code == 409


def test_status_update_missing_complaint_is_reported():
    response = client.patch("/api/complaints/999999/status", json={"status": "Resolved"})
    assert response.status_code == 404
    assert response.json()["detail"] == "Complaint not found"


def test_dashboard_summary_includes_category_and_department_breakdowns():
    department = client.get("/api/departments").json()[0]
    payload = valid_complaint_payload()
    payload.update({
        "category": "Road Maintenance",
        "priority": "High",
        "department_id": department["id"],
    })
    client.post("/api/complaints", json=payload)

    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    summary = response.json()
    assert "total_complaints" in summary
    assert "by_status" in summary
    assert "by_priority" in summary
    assert "by_category" in summary
    assert "by_department" in summary
    assert summary["by_category"].get("Road Maintenance", 0) >= 1
    assert summary["by_department"].get(department["name"], 0) >= 1


def test_english_complaint_understanding_is_structured_and_persisted():
    payload = valid_complaint_payload()
    payload.update({
        "title": "Large pothole and live wire",
        "description": "A large pothole is blocking the road and a live wire is hanging dangerously near the bridge.",
        "category": "Road and Infrastructure",
    })

    created = client.post("/api/complaints", json=payload)
    assert created.status_code == 201
    complaint = created.json()

    assert complaint["title"] == payload["title"]
    assert complaint["description"] == payload["description"]
    assert complaint["ai_assessment"] is not None
    assessment = complaint["ai_assessment"]
    assert assessment["predicted_category"] in {
        "Water Supply", "Road and Infrastructure", "Electricity", "Sanitation",
        "Public Health", "Education", "Transport", "Drainage", "Other",
    }
    assert assessment["language"] in {"English", "Hindi", "Mixed", "Unclear"}
    assert assessment["summary"]
    assert assessment["evidence"]
    assert assessment["explanation"]
    assert assessment["model_or_method"] == "rule-based-keyword-v1"


def test_hindi_complaint_is_classified():
    payload = valid_complaint_payload()
    payload.update({
        "title": "सड़क पर बड़ा गड्ढा",
        "description": "मुख्य सड़क पर गड्ढा है और बारिश में पानी भर जाता है।",
        "language": "Hindi",
    })

    created = client.post("/api/complaints", json=payload)
    assert created.status_code == 201
    assessment = created.json()["ai_assessment"]
    assert assessment["language"] == "Hindi"
    assert assessment["predicted_category"] in {"Road and Infrastructure", "Drainage", "Water Supply"}
    assert assessment["issue_entities"]


def test_mixed_language_complaint_is_detected():
    payload = valid_complaint_payload()
    payload.update({
        "title": "Streetlight तार खराब",
        "description": "The streetlight तार is not working and the area is unsafe at night.",
        "language": "Hindi",
    })

    created = client.post("/api/complaints", json=payload)
    assert created.status_code == 201
    assessment = created.json()["ai_assessment"]
    assert assessment["language"] == "Mixed"
    assert assessment["predicted_category"] == "Electricity"


def test_unclear_complaint_is_not_rejected_and_maps_to_other():
    payload = valid_complaint_payload()
    payload.update({
        "title": "Please review this matter",
        "description": "There is an issue at the place we discussed yesterday.",
        "category": "Other",
    })

    created = client.post("/api/complaints", json=payload)
    assert created.status_code == 201
    assessment = created.json()["ai_assessment"]
    assert assessment["predicted_category"] == "Other"
    assert "Other" in assessment["explanation"]


def test_ai_analysis_returns_persisted_structured_assessment():
    payload = valid_complaint_payload()
    payload.update({
        "title": "Garbage pile in lane",
        "description": "A pile of garbage is creating a smell near the school gate.",
    })

    created = client.post("/api/complaints", json=payload)
    assert created.status_code == 201
    complaint = created.json()

    response = client.get(f"/api/complaints/{complaint['reference_id']}/ai-analysis")
    assert response.status_code == 200
    body = response.json()
    assert body["assessment"]["predicted_category"]
    assert body["assessment"]["summary"]
    assert body["assessment"]["language"]
    assert body["assessment"]["issue_entities"]
    assert body["assessment"]["evidence"]
    assert body["assessment"]["explanation"]


def test_critical_safety_priority_has_explainable_rule_evidence():
    payload = valid_complaint_payload()
    payload.update({
        "title": "Live wire hanging over school",
        "description": "A live wire is hanging and may cause electrocution immediately.",
    })

    created = client.post("/api/complaints", json=payload)
    assert created.status_code == 201
    assessment = created.json()["ai_assessment"]
    assert assessment["recommended_priority"] == "Critical"
    assert "live wire" in assessment["priority_evidence"]
    assert assessment["priority_rules"]


def test_essential_service_priority_and_public_works_department():
    payload = valid_complaint_payload()
    payload.update({
        "title": "No water in entire locality",
        "description": "The water supply is shut and the whole ward has no water since today.",
        "category": "Water Supply",
    })

    created = client.post("/api/complaints", json=payload)
    assert created.status_code == 201
    assessment = created.json()["ai_assessment"]
    assert assessment["recommended_priority"] == "High"
    assert assessment["recommended_department"] == "Public Works"
    assert assessment["department_evidence"]


def test_routine_complaint_receives_low_priority():
    payload = valid_complaint_payload()
    payload.update({
        "title": "Suggestion for park cleaning",
        "description": "This is a routine suggestion for future park cleaning, not urgent.",
        "category": "Sanitation",
    })

    created = client.post("/api/complaints", json=payload)
    assert created.status_code == 201
    assessment = created.json()["ai_assessment"]
    assert assessment["recommended_priority"] == "Low"
    assert assessment["recommended_department"] == "Sanitation"


def test_officer_triage_override_preserves_ai_recommendation():
    payload = valid_complaint_payload()
    payload.update({
        "title": "Dengue patient care complaint",
        "description": "The local hospital needs mosquito-control support for a dengue outbreak.",
        "priority": "Medium",
    })

    created = client.post("/api/complaints", json=payload)
    assert created.status_code == 201
    complaint = created.json()

    departments = client.get("/api/departments").json()
    health = next((item for item in departments if item["name"] == "Health"), None)
    if health is None:
        health = departments[0]

    override = client.patch(
        f"/api/complaints/{complaint['id']}/triage",
        json={
            "department_id": health["id"],
            "priority": "Low",
            "reason": "Local follow-up scope is informational rather than an emergency.",
        },
    )
    assert override.status_code == 200
    result = override.json()
    assert result["final_department_id"] == health["id"]
    assert result["final_priority"] == "Low"
    assert result["recommended_department"]
    assert result["recommended_priority"]
    assert result["human_decision_reason"]

    retrieved = client.get(f"/api/complaints/{complaint['reference_id']}")
    assert retrieved.status_code == 200
    assert retrieved.json()["priority"] == "Low"
    assert retrieved.json()["department_id"] == health["id"]
    assert retrieved.json()["status"] == "Submitted"


def test_officer_triage_requires_override_and_reason():
    created = client.post("/api/complaints", json=valid_complaint_payload()).json()

    missing_override = client.patch(
        f"/api/complaints/{created['id']}/triage",
        json={"reason": "Officer reviewed the complaint"},
    )
    assert missing_override.status_code == 422

    missing_reason = client.patch(
        f"/api/complaints/{created['id']}/triage",
        json={"priority": "Low", "reason": "x"},
    )
    assert missing_reason.status_code == 422
