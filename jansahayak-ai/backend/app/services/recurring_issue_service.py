"""Template-based recurring issue aggregation from stored complaint data."""

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
import re

from app.models.complaint import Complaint
from app.models.department import Department
from app.models.incident import Incident, IncidentComplaint


STOP_WORDS = {
    "a", "an", "and", "are", "at", "be", "been", "but", "for", "from", "has", "have",
    "in", "is", "it", "of", "on", "our", "please", "since", "the", "there", "to", "was",
    "with", "yesterday", "today", "last", "night",
}


def _aware(value: datetime | None) -> datetime:
    if value is None:
        return datetime.now(timezone.utc)
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def _duration_label(first: datetime, latest: datetime) -> str:
    days = max(1, (latest - first).total_seconds() / 86400)
    if days < 1:
        return "less than one day"
    rounded = int(round(days))
    return f"{rounded} day" if rounded == 1 else f"{rounded} days"


def _patterns(complaints: list[Complaint]) -> list[dict]:
    words_by_complaint = []
    for complaint in complaints:
        text = f"{complaint.title} {complaint.description}".lower()
        words = [word for word in re.findall(r"[a-z]+", text) if len(word) > 2 and word not in STOP_WORDS]
        words_by_complaint.append(words)

    word_counts = Counter(word for words in words_by_complaint for word in set(words))
    bigrams = Counter(
        f"{words[index]} {words[index + 1]}"
        for words in words_by_complaint
        for index in range(len(words) - 1)
        if words[index] not in STOP_WORDS and words[index + 1] not in STOP_WORDS
    )

    patterns = []
    for phrase, count in bigrams.most_common(3):
        if count >= 2:
            patterns.append({"pattern": phrase, "complaint_count": count, "type": "phrase"})
    for word, count in word_counts.most_common(5):
        if count >= 2:
            patterns.append({"pattern": word, "complaint_count": count, "type": "keyword"})
    return patterns[:5]


def _investigation_points(category: str, locality: str, patterns: list[dict]) -> list[str]:
    category_lower = (category or "").lower()
    points = [
        f"Verify whether recent records or inspection reports are available for {locality or 'the reported area'}.",
        "Compare complaint timestamps with service logs, maintenance records, or field officer observations.",
    ]
    if patterns:
        points.append("Review the repeated terms " + ", ".join(item["pattern"] for item in patterns[:3]) + " against verified incident notes.")
    if "water" in category_lower:
        points.append("Suggested investigation point: review distribution-network status and published supply schedules.")
    elif "road" in category_lower or "street" in category_lower:
        points.append("Suggested investigation point: inspect the reported locations and maintenance/repair logs.")
    else:
        points.append("Suggested investigation point: verify field conditions with the responsible department and recorded service logs.")
    return points


def analyze_recurring_issues(db, days: int = 30, minimum_complaints: int = 2,
                            district: str | None = None, locality: str | None = None,
                            category: str | None = None, department_id: int | None = None) -> dict:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    query = db.query(Complaint)
    if district:
        query = query.filter(Complaint.district.ilike(f"%{district.strip()}%"))
    if locality:
        query = query.filter(Complaint.locality.ilike(f"%{locality.strip()}%"))
    if category:
        query = query.filter(Complaint.category.ilike(f"%{category.strip()}%"))
    if department_id is not None:
        query = query.filter(Complaint.department_id == department_id)

    complaints = [c for c in query.all() if _aware(c.created_at) >= cutoff]

    groups = defaultdict(list)
    for complaint in complaints:
        department_name = complaint.department.name if complaint.department else "Unassigned"
        key = (
            _normalized(complaint.district),
            _normalized(complaint.locality),
            _normalized(complaint.category),
            department_name,
        )
        groups[key].append(complaint)

    recurring = []
    for (district_name, locality_name, category_name, department_name), items in groups.items():
        if len(items) < minimum_complaints:
            continue

        times = [_aware(item.created_at) for item in items]
        first = min(times)
        latest = max(times)
        title_counts = Counter(item.title.strip() for item in items if item.title.strip())
        affected_localities = sorted({item.locality for item in items if item.locality})
        patterns = _patterns(items)

        if len(items) == 1:
            continue

        locality_display = locality_name.title() if locality_name else "Unknown locality"
        district_display = district_name.title() if district_name else "Unknown district"
        period = _duration_label(first, latest)
        summary = (
            f"Recurring {category_name or 'public'} complaints were reported in {locality_display}, "
            f"{district_display}: {len(items)} complaints over {period}. "
            f"The stored descriptions repeatedly mention: {', '.join(p['pattern'] for p in patterns[:3]) or 'no distinctive repeated phrase'}."
        )

        recurring.append({
            "district": district_name.title(),
            "locality": locality_name.title(),
            "category": category_name,
            "department": department_name,
            "total_complaints": len(items),
            "first_reported_at": first.isoformat(),
            "latest_reported_at": latest.isoformat(),
            "affected_localities": affected_localities,
            "affected_locality_count": len(affected_localities),
            "most_common_issue_descriptions": [
                {"title": title, "count": count}
                for title, count in title_counts.most_common(5)
            ],
            "recurring_patterns": patterns,
            "supporting_reference_ids": sorted({item.reference_id for item in items}),
            "summary": summary,
            "investigation_points": _investigation_points(category_name, locality_display, patterns),
            "investigation_only": True,
            "relevant_incidents": [],
        })

    incident_groups = db.query(Incident).all()
    for incident in incident_groups:
        associations = db.query(IncidentComplaint).filter(IncidentComplaint.incident_id == incident.id).all()
        incident_complaints = [a.complaint for a in associations if a.complaint and _aware(a.complaint.created_at) >= cutoff]
        if len(incident_complaints) < minimum_complaints:
            continue

        for item in recurring:
            if item["district"].lower() == str(incident.district or "").strip().lower() or item["locality"].lower() == str(incident.locality or "").strip().lower():
                item["relevant_incidents"].append({
                    "incident_id": incident.id,
                    "title": incident.title,
                    "severity": incident.severity,
                    "created_at": _aware(incident.created_at).isoformat(),
                    "review_statuses": sorted({a.review_status for a in associations if a.review_status}),
                    "confirmed_complaint_count": sum(1 for a in associations if a.officer_decision == "Confirmed"),
                })

    recurring.sort(key=lambda item: (-item["total_complaints"], item["district"], item["locality"], item["category"]))
    return {
        "time_period_days": days,
        "minimum_complaints": minimum_complaints,
        "total_recurring_groups": len(recurring),
        "recurring_issues": recurring,
        "notice": "Summaries are based only on stored complaint text and metadata. Investigation points are suggestions, not verified root-cause findings.",
    }


def _normalized(value: str | None) -> str:
    return " ".join(str(value or "").strip().lower().split())
