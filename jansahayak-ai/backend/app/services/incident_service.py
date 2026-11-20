"""Incident coordination workflows; relationships are always officer-reviewable."""

from datetime import datetime, timezone


def review_decision(decision: str) -> str:
    normalized = decision.strip().lower()
    if normalized not in {"confirm", "reject"}:
        raise ValueError("Decision must be confirm or reject")
    return "Confirmed" if normalized == "confirm" else "Rejected"


def timestamp_now() -> datetime:
    return datetime.now(timezone.utc)
