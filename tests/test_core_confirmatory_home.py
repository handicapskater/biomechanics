from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LOCAL_BUNDLE = ROOT / "data/public/evidence-observatory/v1"
LOCAL_PUBLICATION = LOCAL_BUNDLE / "computational-evidence.json"
HOME = (ROOT / "index.html").read_text(encoding="utf-8")
HOME_CSS = (ROOT / "common/css/site-pages.css").read_text(encoding="utf-8")


def _core_rows() -> dict[str, dict]:
    manifest = json.loads((LOCAL_BUNDLE / "manifest.json").read_text(encoding="utf-8"))
    entry = next(
        item
        for item in manifest["resources"]
        if item["resource_id"] == "computational-evidence"
    )
    assert entry["path"] == "computational-evidence.json"
    payload = json.loads(LOCAL_PUBLICATION.read_text(encoding="utf-8"))
    assert payload["content_hash"] == entry["content_hash"]
    core = payload["approved_values"]["bands"][2]["offline_rl_lab"][
        "core_confirmatory_evidence"
    ]
    assert core["contract_version"] == "core_confirmatory_evidence.v1"
    assert core["scientific_recomputation"] is False
    return {row["evidence_id"]: row for row in core["rows"]}


def test_home_primary_values_match_governed_b5_publication_rows() -> None:
    rows = _core_rows()
    assert 'data-core-evidence-contract="core_confirmatory_evidence.v1"' in HOME
    assert 'data-publication-resource-id="computational-evidence"' in HOME
    assert (
        'data-publication-resource-path="/data/public/evidence-observatory/v1/'
        'computational-evidence.json"'
    ) in HOME
    expected = {
        "triplet_distance_miles_Mall_to_Walk": {
            "effect": "median paired Δ -1.8644",
            "CI": "[-1.8808, -1.8465]",
            "p_value": "<0.001",
            "display": "−1.864 <span>mi</span>",
        },
        "triplet_distance_miles_Walk_to_PT": {
            "effect": "median paired Δ 1.6683",
            "CI": "[1.6529, 1.6852]",
            "p_value": "<0.001",
            "display": "+1.668 <span>mi</span>",
        },
        "triplet_vertical_dynamic_g_rms_Mall_to_Walk": {
            "effect": "median paired Δ 0.0849",
            "CI": "[0.0827, 0.0861]",
            "p_value": "<0.001",
            "display": "+0.0849 <span>g</span>",
        },
        "triplet_jerk_rms_g_per_s_Mall_to_Walk": {
            "effect": "median paired Δ 0.6370",
            "CI": "[0.6180, 0.6610]",
            "p_value": "<0.001",
            "display": "+0.637 <span>g/s</span>",
        },
    }
    for evidence_id, governed in expected.items():
        row = rows[evidence_id]
        assert row["independent_N"] == 44
        assert row["effect"] == governed["effect"]
        assert row["CI"] == governed["CI"]
        assert row["p_value"] == governed["p_value"]
        assert f'data-core-evidence-id="{evidence_id}"' in HOME
        assert governed["display"] in HOME


def test_home_secondary_shock_rate_matches_governed_b5_publication_row() -> None:
    row = _core_rows()["triplet_shock_spike_rate_per_min_Walk_to_PT"]
    assert row["independent_N"] == 44
    assert row["effect"] == "median paired Δ -1.7744"
    assert row["CI"] == "[-2.0759, -1.0971]"
    assert row["p_value"] == "0.001"
    assert "Walking → PT shock-event rate decreased by 1.774/min" in HOME
    assert "Vertical RMS and jerk do not universally return to Mall levels." in HOME


def test_home_contains_no_scientific_calculation_or_unapproved_terminology() -> None:
    lowered = HOME.lower()
    for forbidden in (
        "math.",
        "reduce(",
        "duckdb",
        "/rag/query",
        "rollerblade",
        "skateboard",
        "one-wheel",
        "exoskeleton",
    ):
        assert forbidden not in lowered


def test_core_evidence_has_semantic_and_responsive_fallbacks() -> None:
    for required in (
        'aria-labelledby="core-evidence-title"',
        'aria-labelledby="core-evidence-figure-title"',
        'aria-describedby="core-evidence-figure-description"',
        'aria-label="Mall skating to Walking to PT skating protocol"',
        "View accessible evidence table",
        'scope="col"',
        'scope="row"',
    ):
        assert required in HOME
    assert "carousel" not in HOME.lower()
    assert "@media (max-width: 1050px)" in HOME_CSS
    assert "@media (max-width: 680px)" in HOME_CSS
    assert "@media (max-width: 420px)" in HOME_CSS
    assert ".core-evidence-table-wrap" in HOME_CSS
    assert "overflow-x: auto" in HOME_CSS
