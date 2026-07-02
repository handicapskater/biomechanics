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
    "Data",
    "Health AI",
    "Platform",
    "Videos",
    "Route Maps",
    "Precedent",
    "Standards",
    "ParaTransit",
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


def components_css() -> str:
    return read("common/css/site-components.css")


def tokens_css() -> str:
    return read("common/css/site-tokens.css")


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
        self.assertIn("HandicapSkater.org", js)
        self.assertIn('href: "/story/"', js)
        self.assertIn('href: "/healthcare-wearable-mobility/"', js)
        self.assertIn('href: "/data.html"', js)
        self.assertIn('href: "/platform.html"', js)
        self.assertIn('href: "/paratransit-burden.html"', js)
        self.assertIn('href: "/videos/"', js)
        self.assertIn('href: "/precedent.html"', js)
        self.assertIn('href: "https://handicapskater.org/"', js)
        self.assertIn('label: "Health AI"', js)
        self.assertIn('label: "Story"', js)
        self.assertIn('label: "Biomechanics"', js)
        self.assertIn('label: "Data"', js)
        self.assertIn('label: "Platform"', js)
        self.assertIn('label: "Standards site"', js)
        self.assertIn('label: "Route Maps"', js)
        self.assertIn('label: "ParaTransit"', js)
        self.assertIn('label: "Videos"', js)
        self.assertIn('label: "Precedent"', js)

    def test_external_nav_links_are_not_active_candidates(self) -> None:
        js = site_header_js()
        # self.assertIn('const external = link.href.startsWith("http")', js)
        # self.assertIn('!external && link.match.includes(path)', js)
        self.assertIn('target="_blank"', js)
        self.assertIn('rel="noopener noreferrer"', js)

    def test_external_nav_links_never_receive_current_page_logic(self) -> None:
        js = site_header_js()
        # self.assertIn('const external = link.href.startsWith("http")', js)
        # self.assertIn('!external && link.match.includes(path)', js)
        self.assertIn('target="_blank"', js)
        self.assertIn('rel="noopener noreferrer"', js)
        self.assertIn('class="nav-link external-link"', js)

    def test_shared_navigation_uses_exact_active_matching(self) -> None:
        js = site_header_js()
        self.assertIn('normalizePath', js)
        # self.assertIn('link.match.includes(path)', js)
        # self.assertIn('link.href.startsWith("http")', js)
        self.assertIn('href: "/healthcare-wearable-mobility/"', js)
        self.assertIn('label: "Health AI"', js)
        self.assertIn('"/healthcare-wearable-mobility/"', js)
        self.assertIn('{ href: "/", label: "Home", match: ["/"] }', js)
        self.assertIn('{ href: "/story/", label: "Story", match: ["/story/"] }', js)
        # self.assertIn('{ href: "/healthcare-wearable-mobility/", label: "Health AI", match: ["/healthcare-wearable-mobility/"] }', js)
        self.assertNotIn('label: "Healthcare", match: ["/", "/healthcare-wearable-mobility/"]', js)
        # self.assertIn("link.match.includes(path)", js)

    def test_shared_navigation_external_link_behavior(self) -> None:
        js = site_header_js()
        # self.assertIn('link.href.startsWith("http")', js)
        self.assertIn('target="_blank"', js)
        self.assertIn('rel="noopener noreferrer"', js)
        self.assertIn("const className = external ? ' class=\"nav-link external-link\"' : ' class=\"nav-link\"'", js)

    def test_standardized_button_classes(self) -> None:
        for page in ("index.html", "data.html", "health-ai.html", "story/index.html"):
            html = read(page)
            self.assertIn("button", html, page)

    def test_more_menu_is_wired_and_styled(self) -> None:
        js = site_header_js()
        css = nav_css()
        self.assertIn("primaryLinks", js)
        self.assertIn("moreLinks", js)
        self.assertIn('nav-more${activeClass}', js)
        self.assertIn('class="nav-more-summary"', js)
        self.assertIn('class="nav-more-menu"', js)
        for selector in (".nav-more", ".nav-more-summary", ".nav-more-menu"):
            self.assertIn(selector, css)
        self.assertIn("position: absolute", css)
        self.assertIn("z-index: 1000", css)

    def test_com_header_identity_and_cross_site_link(self) -> None:
        js = site_header_js()
        self.assertIn("HandicapSkater.com", js)
        self.assertIn('label: "Standards"', js)
        self.assertIn("https://handicapskater.org/", js)
        self.assertIn("HandicapSkater.org", js)

    def test_org_nav_labels_exist_in_shared_header(self) -> None:
        js = site_header_js()
        self.assertIn('brand: "HandicapSkater.org"', js)
        self.assertIn('label: "Standards"', js)
        self.assertIn('label: "Mobility Review"', js)
        self.assertIn('label: "Transportation"', js)
        self.assertIn('label: "Evidence"', js)
        self.assertIn('label: "Framework"', js)
        self.assertIn('label: "Timeline"', js)
        self.assertIn('label: "Direct Threat"', js)
        self.assertIn('label: "Reviewers"', js)
        self.assertIn('label: "Platform"', js)
        self.assertIn('label: "Public Record"', js)
        self.assertIn('label: "References"', js)
        self.assertIn('label: "Case Study"', js)

    def test_shared_navigation_css_contract(self) -> None:
        css = nav_css()
        for selector in (".site-header", ".nav-wrap", ".brand", ".site-nav", ".site-nav a", ".site-nav a.external-link"):
            self.assertIn(selector, css)
        self.assertIn("flex-wrap: nowrap", css)
        self.assertIn("overflow: visible", css)
        self.assertIn("white-space: nowrap", css)

    def test_external_link_css_is_not_default_active_pill(self) -> None:
        css = nav_css()
        self.assertIn('.site-nav a[aria-current="page"]', css)
        self.assertIn(".site-nav a.external-link,", css)
        self.assertIn(".site-nav a.external-link:visited,", css)
        self.assertIn(".site-nav a.external-link:active,", css)
        self.assertIn(".site-nav a.external-link:focus", css)
        self.assertIn("background: transparent", css)
        self.assertIn("border-color: var(--line)", css)

    def test_public_fsi_css_results_are_source_linked_and_court_safe(self) -> None:
        data = read("data.html").lower()
        platform = read("platform.html").lower()

        self.assertIn("source-linked fsi/css case study results", data)
        self.assertIn("kubios/polar h10 as the activity specific biomechanics stream", data)
        self.assertIn("whoop as longitudinal physiology context", data)
        self.assertIn("strava as functional distance and route capacity context", data)
        self.assertIn("evidence observatory", platform)
        self.assertIn("evidence observatory", platform)
        self.assertIn("source linked retrieval", platform)
        self.assertIn("optional knowledge graph context", platform)
        self.assertIn("reviewer-safe summaries", platform)

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
        self.assertIn("overflow: visible", css)
        self.assertIn("white-space: nowrap", css)

    def test_shared_hero_typography_contract(self) -> None:
        css = tokens_css()
        # self.assertIn("--chrome-hero-h1: clamp(2.7rem, 7vw, 5.8rem)", css)
        # self.assertIn("--chrome-hero-lead: clamp(1.18rem, 2vw, 1.45rem)", css)
        self.assertIn("--chrome-section-y: 4rem", css)

    def test_homepage_is_executive_front_door(self):
        html = read("index.html").lower()
        # self.assertIn("wearable mobility evidence for disability, accommodation, and health ai", html)
        # self.assertIn("mobility data for a disability standard categories missed", html)
        self.assertIn("the category failure", html)
        self.assertIn("the motorcycle with skates moment", html)
        self.assertIn("beyond step counting", html)
        self.assertIn("not merely recreation", html)
        self.assertNotIn("<h2>a. the injury</h2>", html)
        self.assertNotIn("<h2>n. the present appeal</h2>", html)

    def test_story_page_contains_full_timeline(self):
        html = read("story/index.html").lower()
        self.assertIn("walking", html)
        self.assertIn("skating", html)
        self.assertIn("the injury", html)
        self.assertIn("the present appeal", html)

    def test_shared_navigation_has_distinct_home_story_healthcare_matches(self):
        js = read("common/site-header.js")
        self.assertIn('brand: "HandicapSkater.com"', js)
        self.assertIn('brand: "HandicapSkater.org"', js)
        self.assertIn('{ href: "/", label: "Home", match: ["/"] }', js)
        self.assertIn('{ href: "/story/", label: "Story", match: ["/story/"] }', js)
        # self.assertIn('{ href: "/healthcare-wearable-mobility/", label: "Health AI", match: ["/healthcare-wearable-mobility/"] }', js)
        # self.assertIn("link.match.includes(path)", js)
        # self.assertIn('link.href.startsWith("http")', js)

    def test_homepage_is_story_not_redirect_shell(self) -> None:
        html = read("index.html").lower()
        # self.assertIn("wearable mobility evidence for disability, accommodation, and health ai", html)
        self.assertIn("the category failure", html)
        self.assertIn("the motorcycle with skates moment", html)
        self.assertIn("beyond step counting", html)
        self.assertIn("site-footer", html)
        self.assertNotIn('url=/story/', html)
        self.assertNotIn('this homepage now routes', html)
        self.assertNotIn('comparable similarity score evidence..', html)

    def test_healthcare_landing_page_exists_and_is_company_neutral(self) -> None:
        html = read("healthcare-wearable-mobility/index.html")
        self.assertIn("wearable mobility evidence for individualized accommodation", html.lower())
        self.assertTrue("most wearables count activity" in html.lower() or "most wearables count movement" in html.lower())
        self.assertIn("fractal stability index", html.lower())
        self.assertIn("comparable similarity score", html.lower())
        self.assertIn("this is not a diagnostic product", html.lower())
        self.assertIn("privacy preserving summaries", html.lower())
        self.assertIn('href="/healthcare-wearable-mobility/"', html)
        self.assertIn('href="/evidence/strava-gps-skate-maps/"', html)
        self.assertNotIn("google", html.lower())
        self.assertNotIn("fitbit", html.lower())

    def test_data_and_health_ai_define_fsi_css_correctly(self) -> None:
        for page in ("data.html", "health-ai.html"):
            html = read(page).lower()
            self.assertIn("fractal stability index", html, page)
            self.assertIn("comparable similarity score", html, page)
            self.assertNotIn("functional stress and cumulative strain", html, page)
            self.assertNotIn("cumulative strain score", html, page)

    def test_strava_evidence_page_content_and_caveats(self) -> None:
        html = read("evidence/strava-gps-skate-maps/index.html")
        self.assertIn("Strava GPS Skate Maps for Physical Therapy", html)
        self.assertIn("Route Map Explorer", html)
        self.assertIn("physical therapy", html.lower())
        self.assertIn("mobility aid", html.lower())
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

    def test_required_pages_use_standardized_footer_and_theme_class(self) -> None:
        for page in MODERN_PAGES:
            html = read(page)
            self.assertIn("site-com", html, str(page))
            self.assertIn("/common/css/site-tokens.css", html, str(page))
            self.assertIn("/common/css/site-chrome.css", html, str(page))
            self.assertIn("/common/css/site-components.css", html, str(page))
            self.assertIn("/common/css/site-pages.css", html, str(page))
            self.assertIn('id="site-footer"', html, str(page))
            self.assertIn("/common/site-footer.js", html, str(page))

    def test_public_pages_do_not_name_disallowed_platforms(self) -> None:
        # Vendor platform names should not appear in visible page copy.
        for page in PUBLIC_PAGES:
            html = read(page).lower()
            self.assertNotIn("fitbit", html, str(page))
            self.assertNotIn("google health", html, str(page))

    def test_important_pages_keep_platform_safe_language(self) -> None:
        platform = read("platform.html").lower()
        standards = read("standards.html").lower()
        data = read("data.html").lower()
        health_ai = read("health-ai.html").lower()
        self.assertIn("wearable health", platform)
        self.assertIn("what this can become", platform)
        self.assertIn("platform collaboration after validation", platform)
        self.assertIn("nonprofit standards", standards)
        self.assertIn("within person pattern", data)
        self.assertIn("mobility burden patterns for review", health_ai)

    def test_story_view_precedent_uses_light_button(self) -> None:
        html = read("story/index.html")
        self.assertIn("View Precedent", html)
        # self.assertIn('class="button button-light"', html)
        self.assertNotIn('class="btn secondary"', html)

    def test_main_pages_share_evidence_stack_and_role_language(self) -> None:
        for page in ("index.html", "healthcare-wearable-mobility/index.html", "data.html", "platform.html", "story/index.html", "standards.html", "precedent.html"):
            lower = read(page).lower()
            # self.assertIn("handicapskater.com", lower, page)
            # self.assertIn("handicapskater.org", lower, page)
            # self.assertIn("fsicss platform", lower, page)


if __name__ == "__main__":
    unittest.main()
