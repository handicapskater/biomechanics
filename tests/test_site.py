from __future__ import annotations

import unittest
from html.parser import HTMLParser
from pathlib import Path

from scripts import check_site_links

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_PAGES = check_site_links.PUBLIC_PAGES
SAMPLED_MAP_PAGES = check_site_links.SAMPLED_MAP_PAGES


def read(path: str | Path) -> str:
    return (ROOT / path).read_text(errors="ignore")


class NavParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_nav = False
        self.nav_links: list[tuple[str, str]] = []
        self.brand_links: list[str] = []
        self._active_href: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = dict(attrs)
        if tag == "nav" and attr.get("class") == "site-nav":
            self.in_nav = True
        if tag == "a" and attr.get("class") == "brand":
            href = attr.get("href")
            if href:
                self.brand_links.append(href)
        if self.in_nav and tag == "a":
            self._active_href = attr.get("href")

    def handle_endtag(self, tag: str) -> None:
        if tag == "nav" and self.in_nav:
            self.in_nav = False
        if tag == "a":
            self._active_href = None

    def handle_data(self, data: str) -> None:
        if self.in_nav and self._active_href:
            text = " ".join(data.split())
            if text:
                self.nav_links.append((self._active_href, text))


def parse_nav(path: str | Path) -> NavParser:
    parser = NavParser()
    parser.feed(read(path))
    return parser


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

    def test_homepage_routes_to_story_and_keeps_legacy_link(self) -> None:
        html = read("index.html")
        self.assertIn('url=/story/', html)
        self.assertIn('href="/story/"', html)
        self.assertIn("HandicapSkater Story", html)
        self.assertIn("Legacy Site", html)
        self.assertIn('href="/index.htm"', html)

    def test_main_navigation_alignment(self) -> None:
        pages = [
            Path("story/index.html"),
            Path("data.html"),
            Path("precedent.html"),
            Path("videos/index.html"),
            Path("health-ai.html"),
            Path("platform.html"),
            Path("standards.html"),
            Path("evidence/strava-gps-skate-maps/index.html"),
        ]
        expected_hrefs = {
            "/story/",
            "/data.html",
            "/evidence/strava-gps-skate-maps/",
            "/precedent.html",
            "/videos/",
            "/platform.html",
            "/standards.html",
        }
        for page in pages:
            nav = parse_nav(page)
            self.assertEqual(nav.brand_links, ["/story/"], str(page))
            labels = [text for _href, text in nav.nav_links]
            hrefs = {href for href, _text in nav.nav_links}
            self.assertNotIn("Home", labels, str(page))
            self.assertTrue(expected_hrefs.issubset(hrefs), str(page))

    def test_required_pages_include_strava_nav_and_legacy_footer(self) -> None:
        for page in ("precedent.html", "standards.html", "evidence/strava-gps-skate-maps/index.html"):
            html = read(page)
            self.assertIn('href="/evidence/strava-gps-skate-maps/"', html)
            self.assertIn("GPS Skate Maps", html)
        for page in ("story/index.html", "data.html", "precedent.html", "videos/index.html", "health-ai.html", "platform.html", "standards.html", "evidence/strava-gps-skate-maps/index.html"):
            self.assertIn("Legacy Site", read(page), page)

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
        self.assertIn("licensing, research, standards, or platform collaboration after validation", platform)
        self.assertIn("nonprofit standards", standards)
        self.assertIn("within-person pattern", data)
        self.assertIn("medical diagnoses", data)


if __name__ == "__main__":
    unittest.main()
