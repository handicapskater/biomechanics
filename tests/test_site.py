from __future__ import annotations

import unittest
from pathlib import Path

from scripts import check_site_links

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_PAGES = check_site_links.PUBLIC_PAGES
SAMPLED_MAP_PAGES = check_site_links.SAMPLED_MAP_PAGES


def read(path: str | Path) -> str:
    return (ROOT / path).read_text(errors="ignore")


class SiteTests(unittest.TestCase):
    def test_public_pages_exist(self) -> None:
        for page in PUBLIC_PAGES:
            self.assertTrue((ROOT / page).exists(), str(page))

    def test_static_internal_links_and_route_targets(self) -> None:
        self.assertEqual(check_site_links.check_pages(PUBLIC_PAGES + SAMPLED_MAP_PAGES), [])
        map_links = check_site_links.evidence_map_links()
        self.assertGreaterEqual(len(map_links), 2)
        for url in map_links:
            target = check_site_links.resolve_local(Path("evidence/strava-gps-skate-maps/index.html"), url)
            self.assertIsNotNone(target)
            self.assertTrue(target.exists(), url)

    def test_strava_evidence_page_content_and_caveats(self) -> None:
        html = read("evidence/strava-gps-skate-maps/index.html")
        self.assertIn("Strava GPS Skate Maps for Physical Therapy", html)
        self.assertIn("physical therapy", html.lower())
        self.assertIn("mobility-aid", html.lower())
        self.assertIn("not medical diagnosis", html.lower())
        self.assertIn("not standalone proof of pain", html.lower())
        self.assertIn("HandicapSkater-Public.ipynb", html)

    def test_sampled_route_maps_have_provenance_banner(self) -> None:
        for page in SAMPLED_MAP_PAGES:
            html = read(page)
            self.assertIn("hs-route-provenance", html)
            self.assertIn("Strava GPS Skate Maps for Physical Therapy", html)
            self.assertIn("/evidence/strava-gps-skate-maps/", html)

    def test_public_pages_do_not_name_disallowed_platforms(self) -> None:
        # Vendor libraries and archived case records are intentionally excluded.
        disallowed = ("Go" + "ogle", "Fit" + "bit")
        for page in PUBLIC_PAGES:
            html = read(page)
            for token in disallowed:
                self.assertNotIn(token, html, str(page))

    def test_important_pages_keep_platform_safe_language(self) -> None:
        platform = read("platform.html")
        standards = read("standards.html")
        data = read("data.html")
        self.assertIn("wearable-health", platform)
        self.assertIn("licensing or partnership candidate", platform)
        self.assertIn("nonprofit standards", standards)
        self.assertIn("within-person pattern", data)
        self.assertIn("medical diagnoses", data)


if __name__ == "__main__":
    unittest.main()
