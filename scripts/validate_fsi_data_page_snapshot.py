#!/usr/bin/env python3
"""Validate HandicapSkater.com Evidence Corpus page FSI evidence snapshot wiring."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
DATA_PAGE = ROOT / "evidence" / "index.html"

DATA_REQUIRED_STRINGS = [
    "Source-Linked FSI/CSS Results",
    "Fractal Stability Index (FSI)",
    "Cohort Similarity Score (CSS)",
    "not established clinical diagnostic scores",
    "Validation and Audit",
    ]

HOME_REQUIRED_STRINGS = [
    "Five questions. Five governed views.",
    "Review the evidence",
    "/evidence/",
    "Complete graphs, methods, provenance, limitations, and accessible tables",
]

REQUIRED_CLASSES = [
    "publication-finding-stack",
    "technical-disclosure",
    "contextual-qualification",
]

FORBIDDEN_STRINGS = [
    "pain proven",
    "legal proof",
]


def main() -> None:
    homepage = INDEX.read_text(encoding="utf-8")
    data_page = DATA_PAGE.read_text(encoding="utf-8")

    missing_home = [text for text in HOME_REQUIRED_STRINGS if text not in homepage]
    assert not missing_home, f"Homepage missing compact FSI teaser strings: {missing_home}"

    assert "fsi-cohort-ranking" not in homepage, "Homepage still contains full FSI cohort ranking"
    assert "Critic-Resistant Validation" not in homepage, "Homepage still contains full validation section"
    assert "fsi_tensor_v0_3_public_overview.json" not in homepage, "Homepage should not fetch FSI snapshot JSON"

    missing_data = [text for text in DATA_REQUIRED_STRINGS if text not in data_page]
    assert not missing_data, f"Evidence Corpus page missing FSI snapshot strings: {missing_data}"

    combined = homepage + "\n" + data_page
    missing_classes = [name for name in REQUIRED_CLASSES if name not in combined]
    assert not missing_classes, f"Missing required FSI snapshot classes: {missing_classes}"

    lower = combined.lower()
    forbidden = [text for text in FORBIDDEN_STRINGS if text in lower]
    assert not forbidden, f"Site contains forbidden overclaiming language: {forbidden}"

    print("FSI/CSS Evidence Corpus page framing valid")
    print("homepage evidence brief present")
    print("homepage does not contain full FSI ranking")
    print("Evidence Corpus page preserves FSI/CSS scope and validation framing")
    print("boundary language present")


if __name__ == "__main__":
    main()
