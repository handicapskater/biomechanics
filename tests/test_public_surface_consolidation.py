from __future__ import annotations

import json
import re
import unittest
from pathlib import Path

from scripts import check_site_links

ROOT = Path(__file__).resolve().parents[1]
LAB_CONFIG = ROOT / "common/evidence-observatory.js"
GRAPH_PAGES = (
    "index.html", "case/index.html", "evidence/index.html",
    "evidence/longitudinal/index.html", "evidence/transportation/index.html",
    "evidence/mobility-comparison/index.html", "evidence/repeated-protocol/index.html",
    "platform/index.html", "access/index.html", "story/index.html", "biomechanics/index.html",
)


class PublicSurfaceConsolidationTests(unittest.TestCase):
    def read(self, page: str) -> str:
        return (ROOT / page).read_text(errors="ignore")

    def test_case_pages_have_no_canonical_scientific_graph_mounts(self) -> None:
        for page in GRAPH_PAGES:
            self.assertNotIn('data-publication-graph="', self.read(page), page)
        self.assertNotIn('data-hero-graph-id="', self.read("index.html"))

    def test_evidence_brief_keeps_exactly_five_questions(self) -> None:
        home = self.read("index.html")
        brief = self.read("evidence/index.html")
        self.assertEqual(home.count('class="evidence-brief-card"'), 5)
        self.assertEqual(brief.count('class="evidence-brief-card"'), 5)
        self.assertEqual(len(re.findall(r"Open in Evidence Observatory", brief)), 5)

    def test_lab_url_is_centralized_and_safe(self) -> None:
        config = LAB_CONFIG.read_text()
        self.assertIn("PUBLIC_EVIDENCE_OBSERVATORY_URL", config)
        self.assertIn("https://hs-evidence-public-dpnhm5kswq-uc.a.run.app/", config)
        self.assertNotIn("evidence.handicapskater.com", config)
        self.assertNotIn("rag", config.lower())
        self.assertNotIn("clinical", config.lower())
        for page in ("index.html", "case/index.html", "evidence/index.html", "platform/index.html", "access/index.html"):
            self.assertNotIn("run.app", self.read(page), page)

    def test_removed_graphs_are_present_in_lab_and_have_accessible_tables(self) -> None:
        ledger = json.loads((ROOT / "data/public/evidence-observatory/v1/com_graph_demotions.json").read_text())
        manifest = json.loads((ROOT / "data/public/evidence-observatory/v1/manifest.json").read_text())
        available = {entry["graph_id"] for entry in manifest["graphs"]}
        self.assertEqual(len(ledger["removed_from_com"]), 24)
        for item in ledger["removed_from_com"]:
            self.assertIn(item["graph_id"], available)
            payload = json.loads((ROOT / "data/public/evidence-observatory/v1" / item["artifact_path"]).read_text())
            self.assertTrue(payload.get("accessible_table"), item["graph_id"])

    def test_route_explorer_stays_a_route_explorer(self) -> None:
        routes = self.read("evidence/strava-gps-skate-maps/index.html")
        self.assertIn("Route Map Explorer", routes)
        self.assertNotIn('data-publication-graph="', routes)
        self.assertEqual(len(check_site_links.evidence_map_links()), 542)
        self.assertEqual(check_site_links.check_pages(check_site_links.PUBLIC_PAGES), [])

    def test_redirected_evidence_routes_are_demoted(self) -> None:
        for page in ("evidence/mobility-comparison/index.html", "evidence/repeated-protocol/index.html"):
            self.assertIn("url=/evidence/", self.read(page))

