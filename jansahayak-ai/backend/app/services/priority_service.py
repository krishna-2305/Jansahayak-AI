"""Deterministic, explainable incident priority scoring."""


CRITICAL_TERMS = ("live wire", "open manhole", "gas leak", "fire", "collapse", "electrocution")
HIGH_TERMS = ("urgent", "immediately", "emergency", "danger", "severe", "contaminated", "dengue", "overflowing sewer")
LOW_TERMS = ("routine", "suggestion", "inquiry", "feedback")


def calculate_priority(features: dict) -> dict:
    text = " ".join((str(features.get("title", "")), str(features.get("description", "")))).lower()

    critical_evidence = [term for term in CRITICAL_TERMS if term in text]
    high_evidence = [term for term in HIGH_TERMS if term in text]
    low_evidence = [term for term in LOW_TERMS if term in text]

    if critical_evidence:
        priority, score = "Critical", 95
        rationale = "Critical public-safety term detected: " + ", ".join(sorted(critical_evidence))
    elif high_evidence:
        priority, score = "High", 80
        rationale = "Urgency or hazard term detected: " + ", ".join(sorted(high_evidence))
    elif low_evidence:
        priority, score = "Low", 25
        rationale = "Routine or informational wording detected: " + ", ".join(sorted(low_evidence))
    else:
        priority, score = "Medium", 45
        rationale = "No critical, high, or low urgency evidence detected; medium baseline assigned"

    return {
        "priority": priority,
        "score": score,
        "rationale": rationale,
        "evidence": sorted(set(critical_evidence + high_evidence + low_evidence)),
    }
