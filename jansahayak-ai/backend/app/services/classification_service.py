"""Deterministic grievance classification fallback."""


CATEGORY_RULES = (
    ("Roads & Potholes", ("Public Works", "road", "pothole", "bridge", "pavement", "drainage", "नाली", "सड़क", "गड्ढा")),
    ("Garbage & Solid Waste", ("Sanitation", "garbage", "trash", "waste", "dirt", "sewer", "cleaning", "कचरा", "सफाई", "गंदगी")),
    ("Public Health & Hospitals", ("Health", "hospital", "clinic", "dengue", "malaria", "medicine", "doctor", "disease", "अस्पताल", "बीमारी", "डेंगू")),
    ("Public Transport & Traffic Signals", ("Transport", "bus", "traffic", "signal", "transport", "parking", "यातायात", "ट्रैफिक", "बस")),
    ("School & Education Facilities", ("Education", "school", "teacher", "classroom", "books", "admission", "स्कूल", "शिक्षक", "कक्षा")),
    ("Encroachment & Land Records", ("Revenue", "land", "patwari", "registry", "mutation", "tax", "certificate", "जमीन", "रजिस्ट्री", "राजस्व")),
)


def classify(text: str) -> dict:
    """Classify text using transparent keyword evidence; no model download required."""
    normalized = (text or "").lower()
    scores: list[tuple[int, str, str, list[str]]] = []

    for category, (department, *keywords) in CATEGORY_RULES:
        evidence = [term for term in keywords if term.lower() in normalized]
        if evidence:
            scores.append((len(evidence), category, department, evidence))

    if not scores:
        return {
            "category": "Other Civic Issues",
            "department": None,
            "confidence": 0.45,
            "evidence": [],
            "text": text,
        }

    evidence_count, category, department, evidence = max(scores, key=lambda item: (item[0], item[1]))
    confidence = min(0.95, 0.55 + evidence_count * 0.12)
    return {
        "category": category,
        "department": department,
        "confidence": round(confidence, 2),
        "evidence": sorted(set(evidence)),
        "text": text,
    }
