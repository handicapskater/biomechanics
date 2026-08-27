from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_experiment_display_name_changes_without_route_or_resource_id_change():
    page = (ROOT / "evidence/repeated-protocol/index.html").read_text()
    assert '<link rel="canonical" href="https://handicapskater.com/evidence/repeated-protocol/">' in page
    assert 'data-publication-resource="repeated-protocol"' in page
    assert "MOBILITY PERTURBATION &amp; RECOVERY EXPERIMENT" in page
    assert "Controlled Mall Skating → Walking Perturbation → PT Continued Mobility" in page


def test_fixed_rail_extension_is_planned_access_limited_and_value_free():
    for relative in ("evidence/repeated-protocol/index.html", "evidence/transportation/index.html"):
        page = (ROOT / relative).read_text()
        assert "Access-Limited Fixed-Rail Extension" in page
        assert "UNMEASURED" in page and "ACCESS-LIMITED" in page and "PLANNED TEST" in page
    experiment = (ROOT / "evidence/repeated-protocol/index.html").read_text()
    assert 'href="/access/"' in experiment


def test_com_story_hierarchy_uses_existing_pages_and_graph_mappings():
    mobility = (ROOT / "evidence/mobility-comparison/index.html").read_text()
    assert "FUNCTIONAL RESULT" in mobility and 'data-publication-graph="triplet_functional_output_context"' in mobility
    assert "MECHANICAL RESULT" in mobility and 'data-publication-graph="walking_vs_mall_accumulated_mechanical_load"' in mobility
    assert "ML VALIDATION" in mobility and 'data-publication-graph="h1_mechanical_only_validation"' in mobility
    assert "ROBUSTNESS / SENSITIVITY" in mobility and 'data-publication-graph="h1_exposure_blind_mechanical"' in mobility
    transportation = (ROOT / "evidence/transportation/index.html").read_text()
    assert 'data-publication-graph="h3_transport_validation"' in transportation
    assert 'href="/evidence/longitudinal/#paired-results"' in transportation
    assert 'data-publication-graph="episodic_mechanical_hr_response"' not in transportation
    longitudinal = (ROOT / "evidence/longitudinal/index.html").read_text()
    for graph_id in ("paired_fns_sns_outcome_summary", "paired_fns_sns_max_hr", "extreme_hr_reference_sensitivity", "temporal_context_decomposition"):
        assert f'data-publication-graph="{graph_id}"' in longitudinal
    assert "RAW_REJECT_BUT_NOT_FAMILYWISE_SIGNIFICANT" in longitudinal
    assert "SCREENING_ONLY_NO_POST_SELECTION_P_VALUE" in longitudinal


def test_no_new_top_level_page_or_graph_mapping_table_was_added():
    header = (ROOT / "common/site-header.js").read_text()
    assert 'href: "/evidence/repeated-protocol/"' in header
    assert "Perturbation & Recovery" in header
    assert "Access-Limited Fixed-Rail Extension" not in header


def test_corrected_authority_story_keeps_cohort_route_and_inference_separate():
    longitudinal = (ROOT / "evidence/longitudinal/index.html").read_text()
    transportation = (ROOT / "evidence/transportation/index.html").read_text()
    combined = longitudinal + transportation
    for graph_id in (
        "fns_sns_historical_coverage",
        "corrected_transport_context_counts",
        "authority_correction_summary",
    ):
        assert f'data-publication-graph="{graph_id}"' in combined
    assert "It does not mean San Francisco geography" in longitudinal
    assert "Roanoke Greenway" in longitudinal
    assert "sf_route=false" in longitudinal
    assert "inference_input_changed=false" in longitudinal
    assert "Scientific readiness is COMPLETE" in longitudinal
    assert "Operational archive readiness is INCOMPLETE" in longitudinal
    assert "eight WHOOP non-activity journal export observations" in longitudinal
    for stale in ("583 FNS/SNS events", "576 dates", "149 passive ParaTransit", "82 TO"):
        assert stale not in combined
