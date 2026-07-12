#!/usr/bin/env python3
"""Validate HandicapSkater.com Evidence Corpus page FSI evidence snapshot wiring."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
DATA_PAGE = ROOT / "evidence" / "index.html"

DATA_REQUIRED_STRINGS = [
    "Generated Evidence Snapshot",
    "Validation and Audit Checks",
    "Source and Reproducibility",
    "fsi_tensor_v0_3_public_overview.json",
    "fsi_tensor_v0_3_autonomic_gated_cohort_summary.json",
    "fsi_tensor_v0_3_validation_summary.json",
    "fsi_tensor_v0_3_artifact_manifest_summary.json",
    "These scores do not measure pain directly and do not make clinical or legal conclusions.",
    ]

HOME_REQUIRED_STRINGS = [
    "Evidence Corpus",
    "Review the Evidence",
    "/evidence/",
    "Review source-linked HR",
]

REQUIRED_CLASSES = [
    "fsi-snapshot",
    "fsi-score-card-grid",
    "fsi-score-card",
    "fsi-cohort-ranking",
    "fsi-cohort-row",
    "fsi-score-pill",
    "fsi-validation-grid",
    "fsi-validation-card",
    "fsi-boundary-note",
    "fsi-data-fallback",
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

    for path in [
        ROOT / "data/review/fsi_tensor_v0_3_public_overview.json",
        ROOT / "data/review/fsi_tensor_v0_3_autonomic_gated_cohort_summary.json",
        ROOT / "data/review/fsi_tensor_v0_3_validation_summary.json",
        ROOT / "data/review/fsi_tensor_v0_3_artifact_manifest_summary.json",
    ]:
        assert path.exists(), f"Missing local data artifact: {path.relative_to(ROOT)}"

    print("FSI Evidence Corpus page snapshot valid")
    print("homepage teaser present")
    print("homepage does not contain full FSI ranking")
    print("Evidence Corpus page references public overview JSON")
    print("Evidence Corpus page references cohort, validation, and manifest JSON")
    print("boundary language present")


if __name__ == "__main__":
    main()
