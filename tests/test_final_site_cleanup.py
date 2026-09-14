"""Presentation-only relocation and unchanged protected downstream content."""
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_downstream_science_and_hidden_home_are_unchanged():
    for path, marker in [('biomechanics/index.html', '<section class="section alt" id="pelvic-structure">')]:
        old = subprocess.check_output(['git', 'show', '3bd9133:' + path], cwd=ROOT, text=True)
        now = (ROOT / path).read_text()
        assert old.split(marker, 1)[1] == now.split(marker, 1)[1]
    old = subprocess.check_output(['git', 'show', '3bd9133:index.html'], cwd=ROOT, text=True)
    now = (ROOT / 'index.html').read_text()
    assert re.findall(r'<!--.*?-->', old, re.S) == re.findall(r'<!--.*?-->', now, re.S)


def test_shared_footer_and_reasoning_location():
    home = (ROOT / 'index.html').read_text()
    shared = (ROOT / 'common/site-footer.js').read_text()
    assert '<footer' not in home
    assert home.count('src="/common/site-footer.js"') == 1
    assert 'home-contact-footer' in shared and 'RollerGracie/' in shared
    science = (ROOT / 'biomechanics/index.html').read_text()
    story = (ROOT / 'story/index.html').read_text()
    for phrase in ['Observation, theory, testing', 'Keep the record types distinct']:
        assert phrase not in story
        assert science.index(phrase) < science.index('From contact to the spine')
