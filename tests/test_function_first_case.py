from __future__ import annotations

from pathlib import Path

from scripts import check_site_links


ROOT = Path(__file__).resolve().parents[1]
HOME = (ROOT / "index.html").read_text()
CASE = (ROOT / "case/index.html").read_text()

def test_home_foregrounds_core_confirmatory_mobility_evidence():
    assert "HANDICAPSKATER" in HOME
    assert "Skates are the mobility aid. Functional mobility is the evidence." in HOME
    assert HOME.index('id="core-evidence"') < HOME.index('id="visual-evidence"')
    assert HOME.count('class="core-evidence-card"') == 4
    assert "45 accepted Mall → Walk → PT sequences" in HOME
    assert "44 eligible whole-triplet paired comparisons" in HOME
    assert "What Looks Like a Stunt Is the Access Story" in HOME
    assert "Watch the Smart &amp; Final video" in HOME
    assert "reddit.com/r/HandicapSkater/s/6pPCv2k02t" in HOME


def test_home_core_evidence_has_a_complete_30_second_answer():
    for expected in (
        "−1.864 <span>mi</span>",
        "+0.0849 <span>g</span>",
        "+0.637 <span>g/s</span>",
        "+1.668 <span>mi</span>",
        "44/44 same direction",
        "Walking reduces mobility while increasing mechanical burden",
        "Inspect the governed evidence",
    ):
        assert expected in HOME
    assert "PT skating" in HOME
    assert "skateboard" not in HOME.lower()


def test_medical_boundaries_and_privacy_are_preserved():
    combined = HOME + CASE
    assert "doctor prescribed skates" not in combined.lower()
    assert "told him not to walk" not in combined.lower()
    assert "The MRI itself is not described here as diagnosing HIS" in CASE
    assert "The individual reports that subsequent clinical evaluation" in CASE
    assert "surgery, which helped but did not eliminate the functional need" in CASE
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
