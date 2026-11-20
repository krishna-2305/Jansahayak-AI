"""Deterministic TF-IDF and metadata similarity for complaint relationships."""

from datetime import datetime, timezone


def _normalized(value) -> str:
    return " ".join(str(value or "").strip().lower().split())


def _as_datetime(value) -> datetime | None:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            return None
    return None


def find_similar(text: str, candidates: list[dict] | None = None, limit: int = 5, threshold: float = 0.25,
                 district: str = "", locality: str = "", category: str = "", submitted_at=None) -> list:
    """Rank candidate complaints using text plus explicit matching signals.

    The returned score is a proposal score, never proof that complaints belong to
    the same incident. Candidates must also pass a district/locality/category gate.
    """
    if not text or not candidates:
        return []

    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
    except ImportError:
        return []

    documents = [text]
    valid_candidates = []
    for candidate in candidates:
        candidate_text = " ".join((str(candidate.get("title", "")), str(candidate.get("description", "")))).strip()
        if candidate_text:
            documents.append(candidate_text)
            valid_candidates.append(candidate)

    if not valid_candidates:
        return []

    try:
        vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), lowercase=True)
        matrix = vectorizer.fit_transform(documents)
        similarity_matrix = cosine_similarity(matrix)
        text_scores = similarity_matrix[0, 1:].flatten()
    except ValueError:
        return []

    reference_time = _as_datetime(submitted_at) or datetime.now(timezone.utc)
    matches = []
    for candidate, text_score in zip(valid_candidates, text_scores):
        candidate_district = _normalized(candidate.get("district"))
        candidate_locality = _normalized(candidate.get("locality"))
        candidate_category = _normalized(candidate.get("category"))

        district_match = bool(district and candidate_district and district.lower() == candidate_district)
        locality_match = bool(locality and candidate_locality and locality.lower() == candidate_locality)
        category_match = bool(category and candidate_category and category.lower() == candidate_category)

        # Geographic/category context prevents an unrelated issue with similar words
        # from receiving a high relationship score.
        if not district_match and not locality_match:
            continue

        candidate_time = _as_datetime(candidate.get("created_at"))
        hours_apart = abs((reference_time - candidate_time).total_seconds() / 3600) if candidate_time else 24 * 365
        time_score = max(0.0, 1.0 - (hours_apart / (24.0 * 30.0)))

        combined = (
            0.55 * float(text_score)
            + 0.20 * float(locality_match)
            + 0.10 * float(district_match)
            + 0.10 * float(category_match)
            + 0.05 * time_score
        )

        signals = []
        if float(text_score) >= threshold:
            signals.append("Text similarity")
        if locality_match:
            signals.append("Same locality")
        if district_match:
            signals.append("Same district")
        if category_match:
            signals.append("Same complaint category")
        if candidate_time:
            signals.append("Submitted within 30 days" if hours_apart <= 24 * 30 else "Older submission")

        if combined >= max(threshold, 0.45) and (float(text_score) >= 0.08 or locality_match and category_match):
            matches.append({
                "complaint_id": candidate.get("id"),
                "reference_id": candidate.get("reference_id"),
                "score": round(combined, 3),
                "text_similarity": round(float(text_score), 3),
                "matching_evidence": signals,
                "matching_signals": {
                    "text_similarity": round(float(text_score), 3),
                    "same_locality": locality_match,
                    "same_district": district_match,
                    "same_category": category_match,
                    "hours_apart": round(hours_apart, 2) if candidate_time else None,
                },
            })

    matches.sort(key=lambda item: (-item["score"], item["complaint_id"] or 0))
    return matches[:limit]
