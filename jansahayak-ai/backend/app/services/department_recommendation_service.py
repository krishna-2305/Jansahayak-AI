"""Deterministic department recommendation with auditable evidence."""

CATEGORY_DEPARTMENT_MAP = {
    "Water Supply": ("Public Works", "Water supply keyword/category mapping"),
    "Road and Infrastructure": ("Public Works", "Road and infrastructure category mapping"),
    "Electricity": ("Public Works", "Electricity services are mapped to Public Works"),
    "Sanitation": ("Sanitation", "Sanitation category mapping"),
    "Public Health": ("Health", "Public health category mapping"),
    "Education": ("Education", "Education category mapping"),
    "Transport": ("Transport", "Transport category mapping"),
    "Drainage": ("Public Works", "Drainage category mapping"),
    "Other": (None, "No category-specific department mapping matched"),
}

ISSUE_DEPARTMENT_MAP = (
    ("Public Works", ("live wire", "transformer", "power cut", "streetlight", "बिजली", "विद्युत", "स्ट्रीट लाइट")),
    ("Health", ("hospital", "dengue", "malaria", "contaminated water", "अस्पताल", "डेंगू")),
    ("Sanitation", ("garbage", "waste", "sewer", "कचरा", "सीवर", "सफाई")),
    ("Education", ("school", "teacher", "classroom", "स्कूल", "शिक्षक")),
    ("Transport", ("bus", "traffic", "signal", "metro", "बस", "यातायात", "मेट्रो")),
    ("Public Works", ("road", "pothole", "water", "drain", "pipeline", "streetlight", "सड़क", "गड्ढा", "पानी", "नाला", "पाइप")),
)


def recommend_department(category: str, title: str, description: str, district: str = "", locality: str = "") -> dict:
    text = " ".join((title or "", description or "", district or "", locality or "")).lower()

    evidence = []
    recommended_department = None
    rule = "No deterministic department mapping matched"

    for department, keywords in ISSUE_DEPARTMENT_MAP:
        matched = sorted({keyword for keyword in keywords if keyword.lower() in text})
        if matched:
            recommended_department = department
            evidence.extend(matched)
            rule = f"Issue-keyword mapping to {department}"
            break

    if recommended_department is None:
        mapped_department, category_rule = CATEGORY_DEPARTMENT_MAP.get(
            category,
            (None, "No category-specific department mapping matched"),
        )
        recommended_department = mapped_department
        rule = category_rule

    jurisdiction = " ".join(part for part in (district, locality) if part).strip()
    reason = (
        f"Recommended {recommended_department} based on {rule}."
        if recommended_department
        else "No configured department mapping matched; officer review is required."
    )

    return {
        "recommended_department": recommended_department,
        "reason": reason,
        "supporting_evidence": sorted(set(evidence)),
        "rule": rule,
        "jurisdiction": jurisdiction or None,
    }
