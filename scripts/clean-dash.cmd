python3 - <<'PY'
from pathlib import Path

replacements = {
    # "non-traditional": "nontraditional",
    "source-linked": "source linked",
    "case-study": "case study",
    "product-development": "product development",
    "single-metric": "single metric",
    "legal-access": "legal access",
    "public-use": "public use",
    "plain-English": "plain English",
    "long-history": "long history",
    "long-term": "long term",
    "real-world": "real world",
    "user-controlled": "user controlled",
    "privacy-preserving": "privacy preserving",
    "platform-default": "platform default",
    "user-confirmed": "user confirmed",
    "activity-specific": "activity specific",
    "within-person": "within person",
    "mode-specific": "mode specific",
    "back-seat": "back seat",
    "front-seat": "front seat",
    "shared-ride": "shared ride",
    "ride-duration": "ride duration",
    "route-capacity": "route capacity",
    "decision-support": "decision support",
    "court-safe": "court safe",
    "high-burden": "high burden",
    "lower-burden": "lower burden",
    "several-hundred-foot": "several hundred foot",
    "two-mile": "2 mile",
    "wheelchair-labeled": "wheelchair labeled",
    "human-centered": "human centered",
    "health-data": "health data",
    "mobility-burden": "mobility burden",
}

encodings = ("utf-8", "utf-8-sig", "cp1252", "latin-1")

def read_text_with_encoding(path):
    data = path.read_bytes()
    for enc in encodings:
        try:
            return data.decode(enc), enc
        except UnicodeDecodeError:
            pass
    return None, None

for path in Path(".").rglob("*.html"):
    if ".git" in path.parts:
        continue

    text, enc = read_text_with_encoding(path)
    if text is None:
        print(f"SKIP unreadable: {path}")
        continue

    original = text

    for old, new in replacements.items():
        text = text.replace(old, new)

    if text != original:
        # Write back as UTF-8 so the site is normalized going forward.
        path.write_text(text, encoding="utf-8")
        print(f"updated {path}  ({enc} -> utf-8)")
PY