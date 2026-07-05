#!/usr/bin/env python3
"""Validate the pain-first homepage and Pain page structure."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
PAIN = ROOT / "pain.html"
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

    assert_contains(index, "Chronic Pain, Controlled Rolling", "homepage")
    assert_contains(index, 'href="/pain.html"', "homepage")
    assert_contains(index, 'href="/data.html"', "homepage")
    assert_contains(index, "Recognized in Practice", "homepage")
    assert_contains(index, "Start with Pain", "homepage")

    assert_not_contains(index, "fsi-cohort-ranking", "homepage")
    assert_not_contains(index, "fsi_tensor_v0_3_public_overview.json", "homepage")
    assert_not_contains(index, "Data Science Evidence Snapshot", "homepage")

    assert_contains(pain, "Pain Is the Starting Point", "pain page")
    assert_contains(pain, "Wearables do not directly measure pain", "pain page")
    assert_contains(pain, "Walking vs Controlled Rolling", "pain page")
    assert_contains(
        pain,
        "The issue is not whether I can take steps. The issue is what those steps cost.",
        "pain page",
    )
    assert_contains(pain, 'href="/data.html"', "pain page")

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

    print("homepage pain entry present")
    print("pain page boundary language present")
    print("recognized in practice summary present")
    print("full FSI snapshot absent from homepage")
    print("precedent page still available")
    print("no prohibited overclaiming language")


if __name__ == "__main__":
    main()
