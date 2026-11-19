"""Deterministic TF-IDF similarity search for related complaints."""


def find_similar(text: str, candidates: list[dict] | None = None, limit: int = 5, threshold: float = 0.25) -> list:
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

    if len(valid_candidates) == 0:
        return []

    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), lowercase=True)
    try:
        matrix = vectorizer.fit_transform(documents).toarray()  # type: ignore[attr-defined]
        scores = cosine_similarity(matrix[0:1], matrix[1:]).flatten()
    except ValueError:
        return []

    matches = []
    for candidate, score in zip(valid_candidates, scores):
        if float(score) >= threshold:
            matches.append({"complaint_id": candidate.get("id"), "score": round(float(score), 3), "reference_id": candidate.get("reference_id")})

    matches.sort(key=lambda item: item["score"], reverse=True)
    return matches[:limit]
