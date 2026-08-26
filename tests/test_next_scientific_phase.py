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
    longitudinal = (ROOT / "evidence/longitudinal/index.html").read_text()
    assert "Post-Skate Transportation Trajectories" in longitudinal
    assert "reports no transportation physiology finding" in longitudinal


def test_no_new_top_level_page_or_graph_mapping_table_was_added():
    header = (ROOT / "common/site-header.js").read_text()
    assert 'href: "/evidence/repeated-protocol/"' in header
    assert "Perturbation & Recovery" in header
    assert "Access-Limited Fixed-Rail Extension" not in header
