"""Deterministic, explainable incident priority assessment."""


CRITICAL_TERMS = (
    "live wire", "open manhole", "gas leak", "fire", "collapse", "electrocution",
    "death", "fatal",
)
HIGH_TERMS = (
    "urgent", "immediately", "emergency", "danger", "dangerous", "severe",
    "contaminated", "dengue", "overflowing sewer", "accident", "हंगामी", "खतरा", "गंभीर",
)
ESSENTIAL_SERVICE_TERMS = (
    "no water", "water supply", "power cut", "blackout", "hospital",
    "water shortage", "संपूर्ण क्षेत्र", "पूरे मोहल्ले",
)
TIME_SENSITIVE_TERMS = (
    "today", "tonight", "now", "immediately", "urgent", "emergency",
    "आज", "तुरंत", "आज रात",
)
SCOPE_TERMS = (
    "hundreds", "thousands", "entire area", "whole ward", "whole village",
    "entire locality", "many people", "सैकड़ों", "हजारों", "पूरा क्षेत्र", "पूरा मोहल्ला",
)
LOW_TERMS = (
    "routine", "suggestion", "inquiry", "feedback", "not urgent", "सुझाव", "जानकारी",
)


def calculate_priority(features: dict) -> dict:
    text = " ".join((
        str(features.get("title", "")),
        str(features.get("description", "")),
    )).lower()

    negated_urgency = "not urgent" in text or "no urgency" in text or "routine" in text or "suggestion" in text

    critical_evidence = sorted({term for term in CRITICAL_TERMS if term in text})
    high_evidence = sorted({term for term in HIGH_TERMS if term in text})
    essential_evidence = sorted({term for term in ESSENTIAL_SERVICE_TERMS if term in text})
    time_evidence = sorted({term for term in TIME_SENSITIVE_TERMS if term in text})
    scope_evidence = sorted({term for term in SCOPE_TERMS if term in text})
    low_evidence = sorted({term for term in LOW_TERMS if term in text})

    if negated_urgency:
        high_evidence = []
        time_evidence = []

    triggered_rules = []
    evidence = []

    if critical_evidence:
        priority, score = "Critical", 95
        triggered_rules.append("Critical public-safety evidence rule")
        evidence.extend(critical_evidence)
    elif essential_evidence or scope_evidence:
        priority, score = "High", 85
        if essential_evidence:
            triggered_rules.append("Essential-service disruption rule")
            evidence.extend(essential_evidence)
        if scope_evidence:
            triggered_rules.append("Broadly stated affected-area/scope rule")
            evidence.extend(scope_evidence)
    elif high_evidence or time_evidence:
        priority, score = "High", 80
        if high_evidence:
            triggered_rules.append("Severity or danger evidence rule")
            evidence.extend(high_evidence)
        if time_evidence:
            triggered_rules.append("Time-sensitivity evidence rule")
            evidence.extend(time_evidence)
    elif low_evidence:
        priority, score = "Low", 25
        triggered_rules.append("Routine or informational wording rule")
        evidence.extend(low_evidence)
    else:
        priority, score = "Medium", 45
        triggered_rules.append("No critical, essential-service, broad-scope, urgency, or routine rule matched")

    if evidence:
        rationale = (
            f"Assigned {priority} priority because: {'; '.join(triggered_rules)}. "
            f"Supporting evidence: {', '.join(sorted(set(evidence)))}."
        )
    else:
        rationale = f"Assigned {priority} priority because no more specific rule matched."

    return {
        "priority": priority,
        "score": score,
        "rationale": rationale,
        "evidence": sorted(set(evidence)),
        "rules": triggered_rules,
    }
