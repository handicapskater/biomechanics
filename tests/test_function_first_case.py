from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
import re

from scripts import check_site_links


ROOT = Path(__file__).resolve().parents[1]
HOME = (ROOT / "index.html").read_text()
CASE = (ROOT / "case/index.html").read_text()

HERO_IDS = {
    "functional_output_vs_burden_authoritative_miles",
    "walking_vs_mall_accumulated_mechanical_load",
    "accepted_triplet_stage_profiles",
    "fns_sns_longitudinal_functional_capacity",
    "transportation_body_coupling_comparison",
}


def test_home_is_function_first_and_uses_exactly_five_governed_evidence_ids():
    assert "FUNCTION BEFORE FORM" in HOME
    assert "Inline skates are not the claim. Functional mobility is." in HOME
    ids = re.findall(r'data-hero-graph-id="([^"]+)"', HOME)
    assert len(ids) == 5
    assert set(ids) == HERO_IDS
    assert len(ids) == len(set(ids))


def test_medical_boundaries_and_privacy_are_preserved():
    combined = HOME + CASE
    assert "doctor prescribed skates" not in combined.lower()
    assert "told him not to walk" not in combined.lower()
    assert "The MRI itself is not described here as diagnosing HIS" in CASE
    assert "The individual reports that subsequent clinical evaluation" in CASE
    assert "does not measure pain" in CASE
    for private_path in ("HandicapSkater-DrNote.pdf", "Valley", "MRI.pdf"):
        assert private_path not in combined


def test_hillsdale_and_legal_boundaries_are_explicit():
    assert "reports more than 20 years" in HOME
    assert "not 20 years of sensor coverage" in HOME
    assert "DOJ referred the complaint to DOT" in CASE
    assert "concourses and controlled exterior areas" in CASE
    assert "None is a general certification" in CASE
    assert "precedent" in CASE and "None is a general certification or precedent" in CASE


def test_case_and_preserved_public_routes_are_present_and_linkable():
    for page in ("case/index.html", "story/index.html", "biomechanics/index.html", "access/index.html", "evidence/strava-gps-skate-maps/index.html", "platform/index.html"):
        assert (ROOT / page).exists()
    assert check_site_links.check_pages(check_site_links.PUBLIC_PAGES) == []
