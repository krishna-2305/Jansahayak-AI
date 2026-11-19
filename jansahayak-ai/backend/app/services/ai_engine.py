"""Explainable orchestration for local JanSahayak AI complaint understanding."""

from app.services.classification_service import classify
from app.services.priority_service import calculate_priority


class AIEngine:
    """Uses local deterministic fallbacks; no external model is downloaded or required."""

    def __init__(self):
        self.available = True

    def analyze(self, title: str, description: str) -> dict:
        text = " ".join((title or "", description or "")).strip()
        classification = classify(text)
        priority = calculate_priority({"title": title, "description": description})

        evidence = classification["evidence"]
        category = classification["category"]
        language = classification["language"]
        entities = classification["issue_entities"]
        urgency = classification["urgency_indicators"]

        if evidence:
            explanation = (
                f"The complaint was classified as {category} because it contains the extracted evidence: "
                f"{', '.join(evidence)}."
            )
        else:
            explanation = (
                "The complaint did not contain enough distinctive category keywords, so it was assigned "
                "to Other without rejecting or changing the original complaint."
            )

        return {
            "summary": classification["summary"],
            "predicted_category": category,
            "issue_entities": entities,
            "language": language,
            "urgency_indicators": urgency,
            "evidence": evidence,
            "explanation": explanation,
            "model_or_method": "rule-based-keyword-v1",
            "confidence": classification["confidence"],
            "recommended_category": category,
            "recommended_department": classification["department"],
            "category_confidence": classification["confidence"],
            "category_evidence": evidence,
            "recommended_priority": priority["priority"],
            "priority_score": priority["score"],
            "priority_rationale": priority["rationale"],
            "priority_evidence": priority["evidence"],
        }
