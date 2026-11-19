"""Deterministic, explainable grievance classification fallback."""


CATEGORY_RULES = (
    ("Water Supply", (
        "water", "supply", "tap", "pipeline", "pipe", "tank", "leak", "no water",
        "पानी", "नल", "पाइपलाइन", "पाइप", "टंकी", "जल", "पानी की आपूर्ति",
    ), "Public Works / Jal Department"),
    ("Road and Infrastructure", (
        "road", "pothole", "bridge", "pavement", "street", "footpath", "culvert", "flyover",
        "सड़क", "गड्ढा", "पुल", "फुटपाथ", "इन्फ्रास्ट्रक्चर",
    ), "Public Works"),
    ("Electricity", (
        "electric", "electricity", "power", "current", "wire", "streetlight", "transformer", "blackout",
        "बिजली", "विद्युत", "तार", "ट्रांसफार्मर", "स्ट्रीट लाइट", "ब्लैकआउट",
    ), "Electricity Department"),
    ("Sanitation", (
        "garbage", "trash", "waste", "dump", "smell", "cleaning", "dirt", "sewer", "sewage",
        "कचरा", "गंदगी", "सफाई", "सीवर", "कूड़ा",
    ), "Sanitation"),
    ("Public Health", (
        "hospital", "clinic", "doctor", "medicine", "dengue", "malaria", "infection", "disease", "contamination",
        "अस्पताल", "क्लिनिक", "डॉक्टर", "दवा", "बीमारी", "डेंगू", "मलेरिया", "स्वास्थ्य",
    ), "Health"),
    ("Education", (
        "school", "college", "teacher", "classroom", "books", "admission", "library", "mid-day meal",
        "स्कूल", "कॉलेज", "शिक्षक", "कक्षा", "किताब", "प्रवेश", "पुस्तकालय",
    ), "Education"),
    ("Transport", (
        "bus", "transport", "traffic", "signal", "auto", "parking", "rail", "metro", "fare",
        "बस", "यातायात", "ट्रैफिक", "सिग्नल", "पार्किंग", "मेट्रो", "परिवहन",
    ), "Transport"),
    ("Drainage", (
        "drain", "drainage", "nallah", "nullah", "overflow", "waterlogging", "manhole", "gutter",
        "नाला", "निकासी", "जलभराव", "मैनहोल", "गटर",
    ), "Public Works / Sanitation"),
)


def identify_language(text: str) -> str:
    normalized = text or ""
    devanagari = sum("\u0900" <= character <= "\u097f" for character in normalized)
    ascii_letters = sum(character.isascii() and character.isalpha() for character in normalized)
    if devanagari and ascii_letters:
        return "Mixed"
    if devanagari:
        return "Hindi"
    if ascii_letters:
        return "English"
    return "Unclear"


def extract_issue_entities(text: str) -> list[str]:
    entity_terms = (
        "water", "road", "pothole", "streetlight", "electricity", "power", "wire",
        "garbage", "waste", "sewer", "drainage", "drain", "hospital", "school",
        "bus", "traffic", "manhole", "pipe", "pipeline", "pump", "tank",
        "पानी", "सड़क", "गड्ढा", "बिजली", "तार", "कचरा", "सीवर", "नाला",
        "अस्पताल", "स्कूल", "बस", "ट्रैफिक", "मैनहोल", "पाइप", "टंकी",
    )
    normalized = (text or "").lower()
    return sorted({term for term in entity_terms if term.lower() in normalized})


def extract_urgency_indicators(text: str) -> list[str]:
    urgency_terms = (
        "urgent", "immediately", "emergency", "danger", "dangerous", "critical",
        "severe", "accident", "fire", "gas leak", "live wire", "collapse",
        "तुरंत", "आवश्यक", "खतरा", "आपातकाल", "गंभीर", "बिजली का तार",
    )
    normalized = (text or "").lower()
    return sorted({term for term in urgency_terms if term.lower() in normalized})


def summarize_text(text: str, max_words: int = 35) -> str:
    cleaned = " ".join((text or "").split())
    if not cleaned:
        return "Complaint details are unavailable."
    words = cleaned.split()
    if len(words) <= max_words:
        return cleaned
    return " ".join(words[:max_words]).rstrip(".,;:") + "..."


def classify(text: str) -> dict:
    """Classify text using transparent keyword evidence; no model download required."""
    normalized = (text or "").lower()
    scores: list[tuple[int, str, str, list[str]]] = []

    for category, keywords, department in CATEGORY_RULES:
        evidence = [term for term in keywords if term.lower() in normalized]
        if evidence:
            scores.append((len(evidence), category, department, evidence))

    if not scores:
        return {
            "category": "Other",
            "department": None,
            "confidence": 0.45,
            "evidence": [],
            "text": text,
            "language": identify_language(text),
            "summary": summarize_text(text),
            "issue_entities": extract_issue_entities(text),
            "urgency_indicators": extract_urgency_indicators(text),
        }

    evidence_count, category, department, evidence = max(scores, key=lambda item: (item[0], item[1]))
    confidence = min(0.95, 0.55 + evidence_count * 0.12)
    return {
        "category": category,
        "department": department,
        "confidence": round(confidence, 2),
        "evidence": sorted(set(evidence)),
        "text": text,
        "language": identify_language(text),
        "summary": summarize_text(text),
        "issue_entities": extract_issue_entities(text),
        "urgency_indicators": extract_urgency_indicators(text),
    }
