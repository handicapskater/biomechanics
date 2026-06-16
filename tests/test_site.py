from __future__ import annotations

import re
import unittest
from html.parser import HTMLParser
from pathlib import Path

from scripts import check_site_links

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_PAGES = check_site_links.PUBLIC_PAGES
SAMPLED_MAP_PAGES = check_site_links.SAMPLED_MAP_PAGES

MODERN_PAGES = [
    Path("index.html"),
    Path("story/index.html"),
    Path("healthcare-wearable-mobility/index.html"),
    Path("data.html"),
    Path("health-ai.html"),
    Path("precedent.html"),
    Path("videos/index.html"),
    Path("platform.html"),
    Path("standards.html"),
    Path("evidence/strava-gps-skate-maps/index.html"),
]

EXPECTED_NAV_HREFS = {
    "/",
    "/story/",
    "/healthcare-wearable-mobility/",
    "/data.html",
    "/health-ai.html",
    "/platform.html",
    "/videos/",
    "/evidence/strava-gps-skate-maps/",
    "/precedent.html",
    "https://handicapskater.org/",
}

EXPECTED_NAV_LABELS = {
    "Story",
    "Healthcare",
    "Data",
    "Health AI",
    "Platform",
    "Videos",
    "GPS Maps",
    "Precedent",
    "Standards",
}


def read(path: str | Path) -> str:
    return (ROOT / path).read_text(errors="ignore")


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[tuple[str, str]] = []
        self._href: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "a":
            attr = dict(attrs)
            self._href = attr.get("href")

    def handle_endtag(self, tag: str) -> None:
        if tag == "a":
            self._href = None

    def handle_data(self, data: str) -> None:
        if self._href:
            text = " ".join(data.split())
            if text:
                self.links.append((self._href, text))


def parse_links(path: str | Path) -> LinkParser:
    parser = LinkParser()
    parser.feed(read(path))
    return parser


def site_header_js() -> str:
    return read("common/site-header.js")


def nav_css() -> str:
    return read("common/css/site-chrome.css")


class SiteTests(unittest.TestCase):
    def test_public_pages_exist(self) -> None:
        for page in PUBLIC_PAGES:
            self.assertTrue((ROOT / page).exists(), str(page))

    def test_static_internal_links_and_route_targets(self) -> None:
        self.assertEqual(check_site_links.check_pages(PUBLIC_PAGES + SAMPLED_MAP_PAGES), [])
        map_links = check_site_links.evidence_map_links()
        self.assertGreaterEqual(len(map_links), 300)
        for url in map_links:
            target = check_site_links.resolve_local(Path("evidence/strava-gps-skate-maps/index.html"), url)
            self.assertIsNotNone(target)
            self.assertTrue(target.exists(), url)

    def test_shared_navigation_include_is_used_by_modern_pages(self) -> None:
        for page in MODERN_PAGES:
            html = read(page)
            self.assertIn('id="site-header"', html, str(page))
            self.assertIn('/common/site-header.js', html, str(page))
            self.assertIn('/common/css/site-chrome.css', html, str(page))
            self.assertNotIn('<header class="site-header">', html, str(page))

    def test_shared_chrome_css_loads_after_page_css(self) -> None:
        for page in MODERN_PAGES:
            html = read(page)
            self.assertIn("advocacy-site.css", html, str(page))
            self.assertIn("/common/css/site-chrome.css", html, str(page))
            self.assertLess(
                html.index("advocacy-site.css"),
                html.index("/common/css/site-chrome.css"),
                str(page),
            )

    def test_shared_navigation_contains_expected_items_once(self) -> None:
        js = site_header_js()
        self.assertIn("HandicapSkater.com", js)
        self.assertNotIn("HandicapSkater.org", js)
        self.assertIn('href: "/story/"', js)
        self.assertIn('href: "/healthcare-wearable-mobility/"', js)
        self.assertIn('href: "/health-ai.html"', js)
        self.assertIn('href: "/platform.html"', js)
        self.assertIn('href: "/videos/"', js)
        self.assertIn('href: "/evidence/strava-gps-skate-maps/"', js)
        self.assertIn('href: "/precedent.html"', js)
        self.assertIn('href: "https://handicapskater.org/"', js)
        self.assertIn('label: "Story"', js)
        self.assertIn('label: "Healthcare"', js)
        self.assertIn('label: "Data"', js)
        self.assertIn('label: "Health AI"', js)
        self.assertIn('label: "Platform"', js)
        self.assertIn('label: "Videos"', js)
        self.assertIn('label: "GPS Maps"', js)
        self.assertIn('label: "Precedent"', js)
        self.assertIn('label: "Standards"', js)
        for label in ("Mobility Aids", "Timeline", "Framework", "Case Study"):
            self.assertNotIn(label, js)

        hrefs = set(re.findall(r'href:\s*"([^"]+)"', js))
        labels = set(re.findall(r'label:\s*"([^"]+)"', js))
        self.assertTrue(EXPECTED_NAV_HREFS.issubset(hrefs))
        self.assertTrue(EXPECTED_NAV_LABELS.issubset(labels))

    def test_external_nav_links_are_not_active_candidates(self) -> None:
        js = site_header_js()
        self.assertIn('const external = link.href.startsWith("http")', js)
        self.assertIn('!external && link.match.includes(path)', js)
        self.assertIn('target="_blank"', js)
        self.assertIn('rel="noopener noreferrer"', js)

    def test_external_nav_links_never_receive_current_page_logic(self) -> None:
        js = site_header_js()
        self.assertIn('const external = link.href.startsWith("http")', js)
        self.assertIn('!external && link.match.includes(path)', js)
        self.assertIn('target="_blank"', js)
        self.assertIn('rel="noopener noreferrer"', js)

    def test_shared_navigation_uses_exact_active_matching(self) -> None:
        js = site_header_js()
        self.assertIn('normalizePath', js)
        self.assertIn('link.match.includes(path)', js)
        self.assertIn('link.href.startsWith("http")', js)
        self.assertIn('href: "/healthcare-wearable-mobility/"', js)
        self.assertIn('label: "Healthcare"', js)
        self.assertIn('"/healthcare-wearable-mobility/"', js)
        self.assertIn('{ href: "/", label: "Home", match: ["/"] }', js)
        self.assertIn('{ href: "/story/", label: "Story", match: ["/story/"] }', js)
        self.assertIn('{ href: "/healthcare-wearable-mobility/", label: "Healthcare", match: ["/healthcare-wearable-mobility/"] }', js)
        self.assertNotIn('label: "Healthcare", match: ["/", "/healthcare-wearable-mobility/"]', js)
        self.assertIn("link.match.includes(path)", js)

    def test_shared_navigation_external_link_behavior(self) -> None:
        js = site_header_js()
        self.assertIn('link.href.startsWith("http")', js)
        self.assertIn('target="_blank"', js)
        self.assertIn('rel="noopener noreferrer"', js)
        self.assertIn('const className = external ? \' class="external-link"\' : ""', js)

    def test_com_header_identity_and_cross_site_link(self) -> None:
        js = site_header_js()
        self.assertIn("HandicapSkater.com", js)
        self.assertIn('label: "Standards"', js)
        self.assertIn("https://handicapskater.org/", js)
        self.assertNotIn("HandicapSkater.org", js)

    def test_no_org_nav_labels_in_com_header(self) -> None:
        js = site_header_js()
        self.assertNotIn('label: "Mobility Aids"', js)
        self.assertNotIn('label: "Timeline"', js)
        self.assertNotIn('label: "Framework"', js)
        self.assertNotIn('label: "Case Study"', js)

    def test_shared_navigation_css_contract(self) -> None:
        css = nav_css()
        for selector in (".site-header", ".nav-wrap", ".brand", ".site-nav", ".site-nav a", ".site-nav a.external-link"):
            self.assertIn(selector, css)
        self.assertIn("flex-wrap: nowrap", css)
        self.assertIn("overflow-x: auto", css)
        self.assertIn("white-space: nowrap", css)

    def test_external_link_css_is_not_default_active_pill(self) -> None:
        css = nav_css()
        self.assertIn('.site-nav a[aria-current="page"]', css)
        self.assertIn(".site-nav a.external-link,", css)
        self.assertIn(".site-nav a.external-link:visited,", css)
        self.assertIn(".site-nav a.external-link:active,", css)
        self.assertIn(".site-nav a.external-link:focus", css)
        self.assertIn("background: transparent", css)
        self.assertIn("border-color: var(--chrome-line)", css)

    def test_public_fsi_css_results_are_source_linked_and_court_safe(self) -> None:
        data = read("data.html")
        platform = read("platform.html")
        claim_map = read("docs/source_linked_claim_map.md")

        self.assertIn("Source-linked FSI/CSS case-study results", data)
        self.assertIn("Kubios/Polar H10 as the activity-specific biomechanics stream", data)
        self.assertIn("WHOOP as longitudinal physiology context", data)
        self.assertIn("Strava as functional distance and route-capacity context", data)
        self.assertIn("do not diagnose pain", data)
        self.assertIn("Evidence Observatory", platform)
        self.assertIn("Qdrant similarity search", platform)
        self.assertIn("optional Neo4j knowledge graph context", platform)
        self.assertIn("HS-CLAIM-007", claim_map)
        self.assertIn("HS-CLAIM-008", claim_map)

    def test_nav_focus_is_not_grouped_with_current_page_active_style(self) -> None:
        css = nav_css()
        self.assertIn('.site-nav a[aria-current="page"]', css)
        self.assertIn(".site-nav a.external-link:focus", css)
        self.assertIn(".site-nav a.external-link:active", css)
        self.assertIn("background: transparent", css)
        for pattern in (
            '.site-nav a:hover,\n.site-nav a:focus,\n.site-nav a[aria-current="page"]',
            '.site-nav a:hover, .site-nav a:focus, .site-nav a[aria-current="page"]',
            '.site-nav a:focus,\n.site-nav a[aria-current="page"]',
        ):
            self.assertNotIn(pattern, css)

    def test_nav_uses_consistent_one_line_layout(self) -> None:
        css = nav_css()
        self.assertIn("flex-wrap: nowrap", css)
        self.assertIn("overflow-x: auto", css)
        self.assertIn("white-space: nowrap", css)

    def test_shared_hero_typography_contract(self) -> None:
        css = nav_css()
        self.assertIn("--chrome-hero-h1: clamp(2.7rem, 7vw, 5.8rem)", css)
        self.assertIn("--chrome-hero-lead: clamp(1.18rem, 2vw, 1.45rem)", css)
        self.assertIn("--chrome-section-y: 4rem", css)
        self.assertIn("h1", css)
        self.assertIn("font-size: var(--chrome-hero-h1)", css)
        self.assertIn(".lead", css)
        self.assertIn("font-size: var(--chrome-hero-lead)", css)

    def test_homepage_is_executive_front_door(self):
        html = read("index.html").lower()
        lower = html.lower()
        self.assertIn("wearable health evidence for mobility and accommodation", lower)
        self.assertIn("mobility data for bodies that standard categories miss", lower)
        self.assertIn("/healthcare-wearable-mobility/", html)
        self.assertIn("/data.html", html)
        self.assertIn("/story/", html)
        self.assertIn("motorcycle-with-skates moment", lower)
        self.assertIn("not a medical diagnosis", lower)
        self.assertIn("not merely recreation", lower)
        # The full narrative timeline belongs on /story/, not the root homepage.
        self.assertNotIn("<h2>A. The injury</h2>", html)
        self.assertNotIn("<h2>N. The present appeal</h2>", html)

    def test_story_page_contains_full_timeline(self):
        html = read("story/index.html").lower()
        self.assertIn("walking hurts. skating lets me live.", html)
        self.assertIn("<h2>a. the injury</h2>", html)
        self.assertIn("<h2>n. the present appeal</h2>", html)

    def test_shared_navigation_has_distinct_home_story_healthcare_matches(self):
        js = read("common/site-header.js")
        self.assertIn('{ href: "/", label: "Home", match: ["/"] }', js)
        self.assertIn('{ href: "/story/", label: "Story", match: ["/story/"] }', js)
        self.assertIn('{ href: "/healthcare-wearable-mobility/", label: "Healthcare", match: ["/healthcare-wearable-mobility/"] }', js)
        self.assertNotIn('label: "Healthcare", match: ["/",', js)
        self.assertNotIn('label: "Story", match: ["/",', js)
        self.assertIn("link.match.includes(path)", js)
        self.assertIn('link.href.startsWith("http")', js)

    def test_homepage_is_story_not_redirect_shell(self) -> None:
        html = read("index.html")
        self.assertIn("A Disability Nobody Recognized Until the Data Made It Visible", html)
        self.assertIn("Walking hurts. Skating lets me live.", html)
        self.assertIn("Beyond step counting", html)
        self.assertIn("wearable health analytics can help compare", html.lower())
        self.assertIn("Legacy Site", html)
        self.assertIn('href="/index.htm"', html)
        self.assertNotIn('url=/story/', html)
        self.assertNotIn('This homepage now routes', html)
        self.assertNotIn('Comparable Similarity Score evidence..', html)

    def test_healthcare_landing_page_exists_and_is_company_neutral(self) -> None:
        html = read("healthcare-wearable-mobility/index.html")
        self.assertIn("Wearable Mobility Evidence for Individualized Accommodation", html)
        self.assertIn("Most wearables count activity", html)
        self.assertIn("Fractal Stability Index", html)
        self.assertIn("Comparable Similarity Score", html)
        self.assertIn("This is not a diagnostic product", html)
        self.assertIn("privacy preserving summaries", html)
        self.assertIn('href="/health-ai.html"', html)
        self.assertIn('href="/evidence/strava-gps-skate-maps/"', html)
        self.assertNotIn("Google", html)
        self.assertNotIn("Fitbit", html)

    def test_data_and_health_ai_define_fsi_css_correctly(self) -> None:
        for page in ("data.html", "health-ai.html"):
            html = read(page)
            lower = html.lower()
            self.assertIn("Fractal Stability Index", html, page)
            self.assertIn("Comparable Similarity Score", html, page)
            self.assertNotIn("functional stress and cumulative strain", lower, page)
            self.assertNotIn("cumulative strain score", lower, page)

            # Data has the explicit medical-diagnosis caveat. Health AI uses
            # the safer HR/HRV burden-review caveat instead, so accept either
            # phrasing rather than forcing identical copy across pages.
            self.assertTrue(
                "not medical" in lower
                or "do not prove pain by themselves" in lower
                or "not a claim" in lower,
                page,
            )

    def test_strava_evidence_page_content_and_caveats(self) -> None:
        html = read("evidence/strava-gps-skate-maps/index.html")
        self.assertIn("Strava GPS Skate Maps for Physical Therapy", html)
        self.assertIn("Route Map Explorer", html)
        self.assertIn("physical therapy", html.lower())
        self.assertIn("mobility aid", html.lower())
        self.assertIn("not medical diagnosis", html.lower())
        self.assertIn("Route maps do not prove pain by themselves", html)
        self.assertIn("HandicapSkater-Public.ipynb", html)

    def test_route_explorer_has_single_immediate_preview_ui(self) -> None:
        html = read("evidence/strava-gps-skate-maps/index.html")
        self.assertIn('id="route-select"', html)
        self.assertIn('id="route-map-frame"', html)
        self.assertIn('id="route-map-empty"', html)
        self.assertIn('id="selected-route-open"', html)
        self.assertIn("function selectRoute(route, updateUrl)", html)
        self.assertIn("frame.src", html)
        self.assertIn("route.index + 1", html)
        self.assertNotIn('id="selected-route-load"', html)
        self.assertNotIn(">Preview map<", html)

        ids = re.findall(r'id="([^"]+)"', html)
        duplicates = sorted({item for item in ids if ids.count(item) > 1})
        self.assertEqual(duplicates, [])

    def test_route_maps_do_not_contain_popup_or_provenance_overlay(self) -> None:
        forbidden = (
            "hs-route-provenance",
            "HandicapSkater route/activity context",
            "Back to evidence page",
            "bindPopup",
            "openPopup",
            "L.popup",
            "setContent",
            "leaflet-popup",
        )
        for page in SAMPLED_MAP_PAGES:
            html = read(page)
            for token in forbidden:
                self.assertNotIn(token, html, str(page))
            self.assertIn("OpenStreetMap", html, str(page))
            self.assertIn("L.map", html, str(page))

    def test_route_maps_have_no_folium_popup_variables(self) -> None:
        map_dir = ROOT / "common/maps"
        self.assertTrue(map_dir.exists())
        sampled = sorted(map_dir.glob("*.html"))[:20]
        self.assertGreaterEqual(len(sampled), 2)
        for page in sampled:
            html = page.read_text(errors="ignore")
            self.assertNotRegex(html, r"\bpopup_[A-Za-z0-9_]+")
            self.assertNotRegex(html, r"\bhtml_[A-Za-z0-9_]+")
            self.assertNotIn("hs-route-provenance", html)

    def test_required_pages_include_legacy_footer(self) -> None:
        for page in MODERN_PAGES:
            html = read(page)
            self.assertIn("Legacy Site", html, str(page))

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
        health_ai = read("health-ai.html")
        self.assertIn("wearable health", platform)
        self.assertIn("What this can become", platform)
        self.assertIn("platform collaboration after validation", platform)
        self.assertIn("nonprofit standards", standards)
        self.assertIn("Distinguish user-defined labels from platform-default labels", standards)
        self.assertIn("within-person pattern", data)
        self.assertIn("mobility-burden patterns for review", health_ai)
        self.assertIn("medical diagnoses", data)

    def test_main_pages_share_evidence_stack_and_role_language(self) -> None:
        pages = (
            "index.html",
            "healthcare-wearable-mobility/index.html",
            "data.html",
            "platform.html",
            "story/index.html",
            "standards.html",
            "precedent.html",
        )
        for page in pages:
            html = read(page)
            self.assertIn("Evidence Stack", html, page)
            self.assertIn("HandicapSkater.com is the public case-study, evidence, and product-development site", html, page)
            self.assertIn("HandicapSkater.org is the standards, doctrine, and accommodation-review site", html, page)
            self.assertIn("legal notebook", html.lower(), page)
            self.assertIn("wearable notebook", html.lower(), page)
            self.assertIn("Legacy notebook", html, page)
            self.assertIn("FSICSS platform", html, page)

    def test_public_non_claims_and_archive_context_are_visible(self) -> None:
        for page in ("index.html", "healthcare-wearable-mobility/index.html", "data.html", "platform.html", "story/index.html", "standards.html", "precedent.html"):
            html = read(page)
            self.assertIn("What this does not claim", html, page)
        for page in ("data.html", "story/index.html", "precedent.html"):
            html = read(page).lower()
            self.assertIn("archive context", html, page)


if __name__ == "__main__":
    unittest.main()
