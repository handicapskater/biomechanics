from __future__ import annotations

import json
import re
import unittest
from pathlib import Path

from scripts import check_site_links

ROOT = Path(__file__).resolve().parents[1]
LAB_CONFIG = ROOT / "common/evidence-observatory.js"
GRAPH_PAGES = ("index.html", "case/index.html", "evidence/index.html")


class PublicSurfaceConsolidationTests(unittest.TestCase):
    def read(self, page: str) -> str:
        return (ROOT / page).read_text(errors="ignore")

    def test_case_pages_mount_only_governed_graph_projections(self) -> None:
        for page in GRAPH_PAGES:
            page_text = self.read(page)
            self.assertIn("governed-evidence-graphs.js", page_text, page)
            self.assertNotIn('data-publication-graph="', page_text, page)
        self.assertNotIn('data-governed-graph="authority_correction_summary"', self.read("evidence/index.html"))

    def test_evidence_brief_keeps_five_primary_questions(self) -> None:
        home = self.read("index.html")
        brief = self.read("evidence/index.html")
        self.assertEqual(home.count('class="evidence-brief-card"'), 5)
        self.assertEqual(brief.count('data-governed-graph="h1_mechanical_only_validation"'), 1)
        self.assertEqual(brief.count('data-governed-graph="h3_transport_validation"'), 1)
        self.assertEqual(brief.count('data-governed-graph="h2_h13_context_increment"'), 1)
        self.assertEqual(brief.count('data-governed-graph="paired_fns_sns_outcome_summary"'), 1)
        self.assertEqual(brief.count('data-governed-graph="fns_sns_longitudinal_functional_capacity"'), 1)

    def test_lab_url_is_centralized_and_safe(self) -> None:
        config = LAB_CONFIG.read_text()
        self.assertIn("PUBLIC_EVIDENCE_OBSERVATORY_URL", config)
        self.assertIn("https://evidence.handicapskater.com/", config)
        self.assertNotIn("run.app", config)
        self.assertNotIn("rag", config.lower())
        self.assertNotIn("clinical", config.lower())
        for page in ("index.html", "case/index.html", "evidence/index.html", "platform/index.html", "access/index.html"):
            self.assertNotIn("run.app", self.read(page), page)

    def test_route_explorer_stays_a_route_explorer(self) -> None:
        routes = self.read("evidence/strava-gps-skate-maps/index.html")
        self.assertIn("Route Map Explorer", routes)
        self.assertNotIn('data-publication-graph="', routes)
        self.assertEqual(len(check_site_links.evidence_map_links()), 542)
        self.assertEqual(check_site_links.check_pages(check_site_links.PUBLIC_PAGES), [])

    def test_redirected_evidence_routes_are_demoted(self) -> None:
        for page in ("evidence/mobility-comparison/index.html", "evidence/repeated-protocol/index.html"):
            self.assertIn("url=/evidence/", self.read(page))
