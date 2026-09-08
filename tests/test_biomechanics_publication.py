from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PAGE = (ROOT / "biomechanics/index.html").read_text()
READER = (ROOT / "common/biomechanics-publication.js").read_text()
BUNDLE_ROOT = ROOT / "data/public/evidence-observatory/v1"
RESOURCE = json.loads((BUNDLE_ROOT / "biomechanics-evidence.json").read_text())
MANIFEST = json.loads((BUNDLE_ROOT / "manifest.json").read_text())
VALUES = RESOURCE["approved_values"]


def test_page_uses_manifest_owned_render_only_evidence() -> None:
    entry = next(item for item in MANIFEST["resources"] if item["resource_id"] == "biomechanics-evidence")
    assert entry["path"] == "biomechanics-evidence.json"
    assert entry["content_hash"] == RESOURCE["content_hash"]
    assert VALUES["contract"] == "biomechanics_publication_evidence.v1"
    assert VALUES["scientific_recomputation"] is False
    assert 'src="/common/biomechanics-publication.js"' in PAGE
    assert 'const RESOURCE_IDS = ["biomechanics-evidence", "computational-evidence", "repeated-protocol", "transportation"]' in READER
    assert "failed manifest parity" in READER
    assert "walking_minus_mall" in READER
    assert "median_paired_difference_right_minus_left" in READER
    assert "calculates no effects" in PAGE


def test_reviewer_first_hierarchy_and_boundaries_are_static_and_visible() -> None:
    ordered_ids = [
        "historical-context",
        "paired-evidence",
        "function-mechanics",
        "impact-morphology",
        "pt-state",
        "longitudinal-capacity",
        "vehicle-biomechanics",
        "measurement-boundary",
        "future-transfer",
        "external-context",
        "governed-evidence",
    ]
    positions = [PAGE.index(f'id="{item}"') for item in ordered_ids]
    assert positions == sorted(positions)
    for phrase in (
        "Walking is the ballistic mobility perturbation",
        "Non-ballistic rolling reference",
        "MAD-based impact-rate metric moves in the opposite direction",
        "PT skating restores function in a distinct state",
        "Motion alone does not define burden",
        "BODY_COUPLING_CONSISTENT_NOT_IDENTIFIED",
        "It has not been executed and contains no transfer results",
        "Internal joint force measured",
        "Pain identified",
        "Body coupling directly measured",
    ):
        assert phrase in PAGE
    assert "5σ" not in PAGE
    assert "pain-free" not in PAGE
    assert "Ballistic Index" not in PAGE


def test_governed_ib_vtb_and_bct_contract_fields_are_consumed() -> None:
    ib = VALUES["ib01"]
    assert ib["vertical_rms"]["direction_count"] == ib["vertical_rms"]["N"]
    assert ib["magnitude_jerk"]["direction_count"] == ib["magnitude_jerk"]["N"]
    assert ib["tails"]["direction_count"] == ib["tails"]["N"]
    assert ib["pareto"]["core"]["direction_count"] == ib["pareto"]["core"]["N"]
    assert ib["pareto"]["with_shock"]["direction_count"] < ib["pareto"]["with_shock"]["N"]
    assert ib["shock_taxonomy"]["adaptive_mad_counter_result_preserved"] is True

    vtb = VALUES["vtb01"]
    assert vtb["mode_coverage"]["SilverRide_BackSeat"]["support"] == "CASE_CONTEXT_ONLY"
    assert vtb["pain_inferred_from_mechanics"] is False
    assert vtb["session_median_transients"]["session_median_missed_excursion_N"] < vtb["session_median_transients"]["transport_event_N"]

    bct = VALUES["bct01"]
    assert bct["status"] == "DESIGN_COMPLETE_EXPERIMENT_NOT_EXECUTED"
    assert bct["bct_executed"] is False
    assert VALUES["measurement_boundaries"] == {
        "bct_executed": False,
        "body_coupling_directly_measured": False,
        "frequency_structure_available": False,
        "internal_joint_force_measured": False,
        "pain_identified": False,
    }


def test_page_does_not_embed_governed_scientific_values_or_touch_route_data() -> None:
    for governed_value in (
        VALUES["ib01"]["vertical_rms"]["walking_minus_mall"],
        VALUES["ib01"]["magnitude_jerk"]["walking_minus_mall"],
        VALUES["ib01"]["fixed_reference_event_density"]["walking_median"],
        VALUES["ib01"]["pt"]["distance"]["median_paired_difference_right_minus_left"],
        VALUES["vtb01"]["mode_signatures"]["motorcycle"]["medians"]["rms"],
    ):
        assert str(governed_value) not in PAGE
    assert "route_weather_context" not in PAGE
    assert "route_weather_context" not in READER


def test_semantic_and_responsive_accessibility_contract() -> None:
    for token in (
        '<main id="main">',
        "<figure",
        "<figcaption",
        '<table>',
        '<th scope="col">',
        '<th scope="row">',
        'role="status"',
        'role="img"',
        "<details",
        "<summary>",
    ):
        assert token in PAGE
    css = (ROOT / "common/css/biomechanics-publication.css").read_text()
    for breakpoint in ("1050px", "780px", "560px"):
        assert breakpoint in css
    assert "overflow-x" in (ROOT / "common/css/site-components.css").read_text()


def test_30_second_reviewer_audit_has_all_answers_on_page() -> None:
    required_visible_answers = (
        "Walking is the ballistic mobility perturbation",
        "Non-ballistic rolling reference",
        'data-bind="function-effect"',
        'data-bind="vertical-effect"',
        'data-bind="jerk-effect"',
        'data-direction-strip="vertical"',
        'data-direction-strip="jerk"',
        "Supporting impact morphology",
        "Why one “shock” number is not enough",
        "PT skating restores function in a distinct state",
        "Skating capacity persists longitudinally",
        "Motion alone does not define burden",
        "Not directly measured",
        "Open Evidence Observatory",
    )
    for answer in required_visible_answers:
        assert answer in PAGE
