"""Presentation-only invariance and public-reading release checks."""

import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOME = (ROOT / "index.html").read_text()
READING = (ROOT / "lifelong-mobility/index.html").read_text()


def test_existing_hidden_sections_and_contact_footer_are_byte_preserved():
    comments = "\n".join(re.findall(r"<!--.*?-->", HOME, re.S))
    assert (
        hashlib.sha256(comments.encode()).hexdigest()
        == "77e5e2da46bc4d9fc3589f7380af5f1874902bd1e768057c9128a683471129c4"
    )
    footer = HOME[HOME.index("<footer") : HOME.index("</footer>") + 9]
    assert (
        hashlib.sha256(footer.encode()).hexdigest()
        == "ce7e1a0b576f950ff8300390429acc2ed2b39246479b0ec6b22d625a09bfe3dd"
    )


def test_only_fourth_card_replaced_and_hero_shorter():
    hero = HOME.split('<section class="hero', 1)[1].split("</section>", 1)[0]
    assert len(re.sub("<[^>]+>", " ", hero).split()) < 178
    assert "lifespan" not in hero
    assert "Mobility should evolve" not in hero
    for required in [
        "Walking disables me. Skates give me mobility.",
        "Why is that painful?",
        "Watch the public video",
        "Shop. Skate. Ride. Continuous mobility.",
    ]:
        assert required in hero
    assert 'data-home-journey="transport"' not in HOME
    assert 'data-cx-entry-intent="HOMEPAGE_LIFELONG_MOBILITY"' in HOME
    for name in ["walking", "rolling", "evidence", "recognition"]:
        assert f'data-home-journey="{name}"' in HOME


def test_reading_is_not_misrepresented_as_cx_or_private_registration():
    assert "live GCP CX journey is not connected yet" in READING
    assert "Public registration remains disabled" in READING
    for forbidden in ["/nsmaep/", "run.app", "?view=ask", "fetch(", "passed 5/6"]:
        assert forbidden not in READING
    assert "https://handicapskater.org/review-tools/" in READING
    assert "/evidence/transportation/" in READING


def test_endpoint_specific_directions_and_boundaries():
    evidence = READING.split('id="evidence"', 1)[1].split("</section>", 1)[0]
    assert evidence.count("<li>") == 6
    assert evidence.count("5/5") == 5
    assert evidence.count("1/5") == 1
    assert "No family-level success threshold" in evidence
    assert "No longevity benefit" in READING
    assert "not a direct measurement" in READING
    assert "Kinematics" in READING and "Kinetics" in READING
