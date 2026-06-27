"""
utils/severity.py — Convert numeric severity (1-10) to labels and colours.
"""


SEVERITY_MAP = {
    (1, 2): ("Info",     "white",  "#FFFFFF"),
    (3, 4): ("Minor",    "blue",   "#378ADD"),
    (5, 6): ("Moderate", "yellow", "#DDB929"),
    (7, 8): ("Serious",  "orange", "#EF9F27"),
    (9, 10): ("Critical","red",    "#E24B4A"),
}


def severity_label(score: int) -> str:
    for (lo, hi), (label, *_) in SEVERITY_MAP.items():
        if lo <= score <= hi:
            return label
    return "Unknown"


def severity_colour(score: int) -> str:
    for (lo, hi), (_, _, colour) in SEVERITY_MAP.items():
        if lo <= score <= hi:
            return colour
    return "#888780"


def severity_risk_level(score: int) -> str:
    return severity_label(score)


def should_notify_authorities(score: int) -> bool:
    """Return True when score reaches 'Serious' or above."""
    return score >= 7


def crowd_threshold_for_severity_raise(current_severity: int) -> int:
    """
    How many crowd confirmations are needed to raise severity by 1.
    Higher current severity requires more confirmations.
    """
    if current_severity <= 4:
        return 2
    if current_severity <= 7:
        return 3
    return 5
