#!/usr/bin/env python3
"""Validate the pain-first homepage and Pain page structure."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
PAIN = ROOT / "pain" / "index.html"
PRECEDENT = ROOT / "precedent.html"


def read(path: Path) -> str:
    if not path.exists():
        raise AssertionError(f"Missing required file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def assert_contains(source: str, needle: str, label: str) -> None:
    if needle not in source:
        raise AssertionError(f"{label} missing required text: {needle}")


def assert_not_contains(source: str, needle: str, label: str) -> None:
    if needle.lower() in source.lower():
        raise AssertionError(f"{label} contains prohibited text: {needle}")


def main() -> None:
    index = read(INDEX)
    pain = read(PAIN)
    _precedent = read(PRECEDENT)

    assert_contains(index, "Inline skates are not the claim. Functional mobility is.", "homepage")
    assert_contains(index, "FUNCTION BEFORE FORM", "homepage")
    assert_contains(index, 'href="/pain/"', "homepage")
    assert_contains(index, 'href="/evidence/"', "homepage")
    assert_contains(index, 'href="/case/"', "homepage")
    assert_contains(index, "Measurements add context; they do not read pain.", "homepage")
    assert_contains(index, "not 20 years of sensor coverage", "homepage")

    assert_not_contains(index, "fsi-cohort-ranking", "homepage")
    assert_not_contains(index, "fsi_tensor_v0_3_public_overview.json", "homepage")
    assert_not_contains(index, "Data Science Evidence Snapshot", "homepage")
    assert_not_contains(index, "doctor prescribed skates", "homepage")
    assert_not_contains(index, "the MRI diagnosed", "homepage")

    assert_contains(pain, "Walking, Controlled Rolling, and Function", "pain page")
    assert_contains(pain, "timing, source, activity, and N-of-1 baseline", "pain page")
    assert_not_contains(pain, "not clinical proof", "pain page")
    assert_not_contains(pain, "not legal proof", "pain page")
    assert_contains(pain, "sensor stream cannot supply", "pain page")
    assert_contains(pain, "The Orthopedic Recommendation Was to Substitute Non-Ballistic Activity", "pain page")
    assert_contains(
        pain,
        "The later decision to use inline skates",
        "pain page",
    )
    assert_contains(pain, 'href="/evidence/mobility-comparison/', "pain page")

    combined = "\n".join([index, pain])
    for phrase in (
        "pain " + "proven",
        "legal " + "proof",
        "wearables " + "prove pain",
        "data " + "proves pain",
        "clinical " + "proof",
        "guarantees " + "access",
    ):
        assert_not_contains(combined, phrase, "homepage/pain page")

    print("function-first homepage entry present")
    print("pain page boundary language present")
    print("perspective guide summary present")
    print("full FSI snapshot absent from homepage")
    print("precedent page still available")
    print("no prohibited overclaiming language")


if __name__ == "__main__":
    main()
