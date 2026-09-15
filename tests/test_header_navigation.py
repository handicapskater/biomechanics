"""Shared HandicapSkater.com navigation order and cross-site contracts."""

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class HeaderNavigationTests(unittest.TestCase):
    def setUp(self):
        self.header = (ROOT / "common/site-header.js").read_text()
        self.journeys = (ROOT / "common/home-journeys.js").read_text()
        self.css = (ROOT / "common/css/site-chrome.css").read_text()

    def test_primary_navigation_order_and_destinations(self):
        labels = re.findall(r'label: "([^"]+)"', self.header.split("primaryLinks:", 1)[1])
        primary = [label for label in labels if label not in {
            "The Story", "Evidence Brief", "How the System Works", "Physical Therapy Route Maps",
            "Open Evidence Observatory",
        }]
        self.assertEqual(primary[:7], [
            "The Science", "Evidence", "Equality", "Accommodation", "Legal",
            "Guided Tour", "Standard",
        ])
        self.assertIn('href: "https://handicapskater.org/review-tools/", label: "Accommodation"', self.header)
        self.assertIn('href: "https://handicapskater.org/", label: "Standard"', self.header)
        self.assertEqual(self.header.count("externalSite: true"), 2)

    def test_guided_tour_and_evidence_semantics_are_preserved(self):
        self.assertIn('action: "guided-tour"', self.header)
        self.assertIn('data-welcome-modal aria-haspopup="dialog"', self.header)
        self.assertIn('children: [', self.header)
        self.assertIn('class="nav-dropdown"', self.header)

    def test_shared_geometry_and_semantic_treatments(self):
        for declaration in (
            "min-height: 42px", "border-radius: 999px", "font: inherit",
            "padding: 0 0.9rem",
        ):
            self.assertGreaterEqual(self.css.count(declaration), 2)
        self.assertIn(".site-nav a.nav-guided-tour", self.css)
        self.assertIn("border-color: var(--green)", self.css)
        self.assertIn(".site-nav a.external-link", self.css)
        self.assertNotIn("top: -10px", self.css)

    def test_accommodation_guided_card_copy_and_handoff(self):
        self.assertIn('subtitle:"Request accommodation help →"', self.journeys)
        self.assertIn('href:"https://handicapskater.org/review-tools/"', self.journeys)


if __name__ == "__main__":
    unittest.main()
