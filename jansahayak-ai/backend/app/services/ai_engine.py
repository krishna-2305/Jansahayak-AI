"""Explainable orchestration for local JanSahayak AI recommendations."""

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
        return {
            "recommended_category": classification["category"],
            "recommended_department": classification["department"],
            "category_confidence": classification["confidence"],
            "category_evidence": classification["evidence"],
            "recommended_priority": priority["priority"],
            "priority_score": priority["score"],
            "priority_rationale": priority["rationale"],
            "priority_evidence": priority["evidence"],
        }
