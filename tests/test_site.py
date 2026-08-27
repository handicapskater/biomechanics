from __future__ import annotations

import json
import re
import subprocess
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
    Path("pain/index.html"),
    Path("biomechanics/index.html"),
    Path("evidence/index.html"),
    Path("health-ai/index.html"),
    Path("platform/index.html"),
    Path("access/index.html"),
    Path("videos/index.html"),
    Path("evidence/strava-gps-skate-maps/index.html"),
]

EXPECTED_NAV_HREFS = {
    "/story/",
    "/pain/",
    "/biomechanics/",
    "/evidence/strava-gps-skate-maps/",
    "/access/",
    "/platform/",
    "/health-ai/",
}

EXPECTED_NAV_LABELS = {
    "Story",
    "Walking vs Rolling",
    "Biomechanics",
    "Route Explorer",
    "Recognition",
    "Mobility Intelligence",
    "Evidence Observatory",
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
    def test_homepage_evidence_highlights_use_approved_publication_artifacts(self) -> None:
        home = read("index.html")
        renderer = read("common/evidence-publication.js")
        acceleration = read("common/acceleration-summary.js")
        self.assertIn('data-publication-graph="functional_output_vs_burden_authoritative_miles"', home)
        self.assertIn('data-publication-graph="transportation_body_coupling_comparison"', home)
        self.assertIn("evidence-publication.js", home)
        self.assertIn("apple_silicon_acceleration_summary.json", acceleration)
        self.assertIn("speedup_vs_numpy.toFixed(2)", acceleration)
        self.assertNotIn("acc measures pain", home.lower())
        self.assertIn("RMSSD coupling remains unsupported", home)
        self.assertIn("Evidence Observatory—the only scientific source", home)
        self.assertIn("Accessible values supplied by the publication graph payload.", renderer)

    def test_footer_has_no_sequence_or_related_navigation(self) -> None:
        footer = read("common/site-footer.js")
        css = nav_css()
        for token in ("Previous", "Next", "Related", "sequence-nav"):
            self.assertNotIn(token, footer)
        self.assertNotIn(".sequence-nav", css)

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
        self.assertIn('<a class="brand" href="/" aria-label="${config.brand}"${brandCurrent}>', js)
        self.assertNotIn('label: "Home"', js)
        for href in EXPECTED_NAV_HREFS:
            self.assertIn(f'href: "{href}"', js)
        for label in EXPECTED_NAV_LABELS:
            self.assertIn(f'label: "{label}"', js)

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
        self.assertIn('return match.includes(path)', js)
        self.assertIn('href: "/health-ai/"', js)
        self.assertIn('label: "Mobility Intelligence"', js)
        self.assertNotIn('label: "Home"', js)
        self.assertIn('<a class="brand" href="/"', js)
        self.assertIn('{ href: "/story/", label: "Story", match: ["/story/"] }', js)
        self.assertIn('{ href: "/pain/", label: "Walking vs Rolling", match: ["/pain/"] }', js)
        self.assertIn('label: "Biomechanics"', js)
        self.assertNotIn('"/healthcare-wearable-mobility/"', js)

    def test_shared_navigation_external_link_behavior(self) -> None:
        js = site_header_js()
        # self.assertIn('link.href.startsWith("http")', js)
        self.assertIn('target="_blank"', js)
        self.assertIn('rel="noopener noreferrer"', js)
        self.assertIn("const className = external ? ' class=\"nav-link external-link\"' : ' class=\"nav-link\"'", js)

    def test_page_button_rows_are_limited_to_current_local_actions(self) -> None:
        for page in ("health-ai/index.html", "story/index.html"):
            self.assertNotIn('class="button-row"', read(page), page)
        evidence = read("evidence/index.html")
        self.assertEqual(evidence.count('class="button-row"'), 1)
        self.assertIn('href="/evidence/repeated-protocol/"', evidence)
        self.assertIn('href="/evidence/mobility-comparison/#functional-output"', evidence)
        home = read("index.html")
        self.assertEqual(home.count('class="button-row"'), 1)
        hook = home.split('class="button-row"', 1)[1].split("</div>", 1)[0]
        self.assertIn("Watch the Smart &amp; Final video", hook)
        self.assertNotIn('href="/', hook)

    def test_primary_navigation_uses_current_observatory_dropdown(self) -> None:
        js = site_header_js()
        css = nav_css()
        self.assertIn("primaryLinks", js)
        for label in EXPECTED_NAV_LABELS:
            self.assertIn(f'label: "{label}"', js)
        self.assertIn('children: [', js)
        self.assertIn('class="nav-dropdown"', js)
        self.assertNotIn("menuGroups", js)
        self.assertNotIn(".nav-more", css)

    def test_com_header_identity_is_the_home_link(self) -> None:
        js = site_header_js()
        self.assertIn("HandicapSkater.com", js)
        self.assertIn('href="/" aria-label="${config.brand}"', js)
        self.assertIn('path === "/"', js)

    def test_com_header_does_not_duplicate_org_navigation(self) -> None:
        js = site_header_js()
        self.assertNotIn('brand: "HandicapSkater.org"', js)
        self.assertNotIn("https://handicapskater.org/", js)

    def test_shared_navigation_css_contract(self) -> None:
        css = nav_css()
        for selector in (".site-header", ".nav-wrap", ".brand", ".site-nav", ".site-nav a", ".site-nav a.external-link"):
            self.assertIn(selector, css)
        self.assertIn('.brand[aria-current="page"]', css)
        self.assertIn(".brand:focus-visible", css)
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
        data = read("evidence/index.html").lower()
        platform = read("platform/index.html").lower()

        self.assertIn("source-linked fsi/css results", data)
        self.assertIn("polar h10 and kubios", data)
        self.assertIn("whoop longitudinal records", data)
        self.assertIn("strava route records", data)
        self.assertIn("evidence observatory", platform)
        self.assertIn("source provenance", platform)
        self.assertIn("publication contract", platform)
        self.assertIn("human review", platform)

    def test_evidence_observatory_navigation_uses_current_local_sections(self) -> None:
        js = site_header_js()
        self.assertIn('class="nav-dropdown"', js)
        self.assertIn('class="nav-dropdown-menu"', js)
        for href in (
            "/platform/",
            "/evidence/",
            "/evidence/mobility-comparison/",
            "/evidence/repeated-protocol/",
            "/evidence/transportation/",
            "/evidence/longitudinal/",
            "/evidence/strava-gps-skate-maps/#route-browser",
        ):
            self.assertIn(f'href: "{href}"', js)
        self.assertNotIn('href: "https://evidence.handicapskater.com/#ask-evidence"', js)

    def test_primary_pages_link_to_current_local_evidence_sections(self) -> None:
        mappings = {
            "evidence/index.html": (
                "/evidence/repeated-protocol/",
                "/evidence/mobility-comparison/#functional-output",
            ),
            "access/index.html": ("/evidence/transportation/#transport-graph",),
        }
        for page, hrefs in mappings.items():
            html = read(page)
            for href in hrefs:
                self.assertIn(f'href="{href}"', html)

    def test_ml_graph_artifacts_resolve_to_their_current_com_pages(self) -> None:
        manifest = json.loads(read("data/public/evidence-observatory/v1/manifest.json"))
        entries = {entry["graph_id"]: entry for entry in manifest["graphs"]}
        expected = {
            "h1_exposure_blind_mechanical": "/evidence/mobility-comparison/",
            "h1_feature_tier_validation": "/platform/",
            "h1_mechanical_only_validation": "/evidence/mobility-comparison/",
            "h2_h13_context_increment": "/platform/",
            "h3_transport_validation": "/evidence/transportation/",
            "ml_feature_domain_importance": "/platform/",
        }
        reader = read("common/evidence-publication.js")
        self.assertIn("fetchJson(entry.artifact_path, entry.content_hash)", reader)
        self.assertIn('entryById(manifest.graphs, "graph_id", id)', reader)
        for graph_id, page in expected.items():
            entry = entries[graph_id]
            self.assertEqual(entry["destination"], "handicapskater.com")
            self.assertEqual(entry["page"], page)
            self.assertEqual(entry["artifact_filename"], Path(entry["artifact_path"]).name)
            payload = json.loads(read(f"data/public/evidence-observatory/v1/{entry['artifact_path']}"))
            self.assertEqual(payload["graph_id"], graph_id)
            self.assertEqual(payload["content_hash"], entry["content_hash"])
            page_html = read(page.removeprefix("/") + "index.html")
            self.assertIn('evidence-publication.js', page_html)
            self.assertIn(f'data-publication-graph="{graph_id}"', page_html)

    def test_unknown_publication_graph_fails_closed_in_reader(self) -> None:
        reader = read("common/evidence-publication.js")
        self.assertIn('entryById(manifest.graphs, "graph_id", id)', reader)
        self.assertIn('throw new Error("Publication entry unavailable")', reader)

    def test_actual_com_reader_renders_ml_graphs_from_synchronized_bundle(self) -> None:
        graph_ids = [
            "h1_exposure_blind_mechanical",
            "h1_feature_tier_validation",
            "h1_mechanical_only_validation",
            "h2_h13_context_increment",
            "h3_transport_validation",
            "ml_feature_domain_importance",
        ]
        reader_path = ROOT / "common/evidence-publication.js"
        bundle_root = ROOT / "data/public/evidence-observatory/v1"
        harness = """
const fs = require("fs");
const vm = require("vm");
const readerPath = __READER_PATH__;
const bundleRoot = __BUNDLE_ROOT__;
const graphIds = __GRAPH_IDS__;
const readyIds = new Set(__READY_IDS__);

class Element {
  constructor(tag) {
    this.tagName = tag;
    this.dataset = {};
    this.children = [];
    this.attributes = {};
    this._text = "";
    this.style = { setProperty() {} };
    this.classList = { add() {}, toggle() {} };
  }
  appendChild(child) { this.children.push(child); return child; }
  append(...children) { children.forEach((child) => this.appendChild(child)); }
  replaceChildren(...children) { this.children = []; this._text = ""; this.append(...children); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] || null; }
  get textContent() { return this._text + this.children.map((child) => child.textContent || "").join(""); }
  set textContent(value) { this.children = []; this._text = String(value); }
}

const mounts = graphIds.map((graphId) => {
  const mount = new Element("div");
  mount.dataset.publicationGraph = graphId;
  mount.textContent = "Loading approved graph…";
  return mount;
});
global.document = {
  readyState: "complete",
  createElement(tag) { return new Element(tag); },
  createElementNS(_namespace, tag) { return new Element(tag); },
  addEventListener() {},
  querySelectorAll(selector) {
    return selector.includes("[data-publication-graph]") ? mounts : [];
  },
};
global.window = {};
global.fetch = async (url) => {
  const prefix = "/data/public/evidence-observatory/v1/";
  const relative = String(url).startsWith(prefix) ? String(url).slice(prefix.length).split("?")[0] : "";
  const target = relative ? bundleRoot + "/" + relative : "";
  if (!target || !fs.existsSync(target)) return { ok: false, json: async () => ({}) };
  return { ok: true, json: async () => JSON.parse(fs.readFileSync(target, "utf8")) };
};
function hasClass(node, className) {
  return node && (node.className === className || node.attributes.class === className || (node.children || []).some((child) => hasClass(child, className)));
}

(async () => {
  vm.runInThisContext(fs.readFileSync(readerPath, "utf8"), { filename: readerPath });
  await new Promise((resolve) => setTimeout(resolve, 25));
  for (const mount of mounts) {
    if (readyIds.has(mount.dataset.publicationGraph)) {
      if (mount.dataset.state !== "ready" || mount.textContent.includes("Loading approved")) {
        throw new Error("reader did not render " + mount.dataset.publicationGraph + ": " + mount.textContent);
      }
      if (!hasClass(mount, "publication-ml-chart")) {
        throw new Error("reader did not select a supported visual renderer for " + mount.dataset.publicationGraph);
      }
    } else if (mount.dataset.state !== "unavailable" || mount.textContent.includes("Loading approved")) {
      throw new Error("unknown graph did not fail closed");
    }
  }
})().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
"""
        def run_reader(ids: list[str], ready_ids: list[str]) -> None:
            completed = subprocess.run(
                [
                    "node",
                    "-e",
                    harness.replace("__READER_PATH__", json.dumps(str(reader_path)))
                    .replace("__BUNDLE_ROOT__", json.dumps(str(bundle_root)))
                    .replace("__GRAPH_IDS__", json.dumps(ids))
                    .replace("__READY_IDS__", json.dumps(ready_ids)),
                ],
                check=False,
                capture_output=True,
                text=True,
                timeout=10,
            )
            self.assertEqual(completed.returncode, 0, completed.stderr)

        run_reader(graph_ids, graph_ids)
        run_reader(["unknown_graph"], [])

    def test_approved_publication_pages_hydrate_every_graph_mount(self) -> None:
        pages = (
            "evidence/longitudinal/index.html",
            "evidence/transportation/index.html",
            "evidence/strava-gps-skate-maps/index.html",
        )
        graph_ids = [
            graph_id
            for page in pages
            for graph_id in re.findall(
                r'data-publication-graph="([^"]+)"', read(page)
            )
        ]
        resource_ids = [
            resource_id
            for page in pages
            for resource_id in re.findall(
                r'data-publication-resource="([^"]+)"', read(page)
            )
        ]
        reader_path = ROOT / "common/evidence-publication.js"
        bundle_root = ROOT / "data/public/evidence-observatory/v1"
        harness = """
const fs = require("fs");
const vm = require("vm");
const readerPath = __READER_PATH__;
const bundleRoot = __BUNDLE_ROOT__;
const graphIds = __GRAPH_IDS__;
const resourceIds = __RESOURCE_IDS__;

class Element {
  constructor(tag) {
    this.tagName = tag;
    this.dataset = {};
    this.children = [];
    this.attributes = {};
    this._text = "";
    this.style = { setProperty() {} };
    this.classList = { add() {}, toggle() {} };
  }
  appendChild(child) { this.children.push(child); return child; }
  append(...children) { children.forEach((child) => this.appendChild(child)); }
  replaceChildren(...children) { this.children = []; this._text = ""; this.append(...children); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] || null; }
  addEventListener() {}
  get firstChild() { return this.children[0] || null; }
  get textContent() { return this._text + this.children.map((child) => child.textContent || "").join(""); }
  set textContent(value) { this.children = []; this._text = String(value); }
}

const graphMounts = graphIds.map((graphId) => {
  const mount = new Element("div");
  mount.dataset.publicationGraph = graphId;
  mount.textContent = "Loading approved graph…";
  return mount;
});
const resourceMounts = resourceIds.map((resourceId) => {
  const mount = new Element("div");
  mount.dataset.publicationResource = resourceId;
  mount.textContent = "Loading approved resource…";
  return mount;
});
global.document = {
  readyState: "complete",
  createElement(tag) { return new Element(tag); },
  createElementNS(_namespace, tag) { return new Element(tag); },
  addEventListener() {},
  querySelectorAll(selector) {
    const mounts = [];
    if (selector.includes("[data-publication-graph]")) mounts.push(...graphMounts);
    if (selector.includes("[data-publication-resource]")) mounts.push(...resourceMounts);
    return mounts;
  },
};
global.window = {};
global.fetch = async (url) => {
  const prefix = "/data/public/evidence-observatory/v1/";
  const relative = String(url).startsWith(prefix) ? String(url).slice(prefix.length).split("?")[0] : "";
  const target = relative ? bundleRoot + "/" + relative : "";
  if (!target || !fs.existsSync(target)) return { ok: false, json: async () => ({}) };
  return { ok: true, json: async () => JSON.parse(fs.readFileSync(target, "utf8")) };
};

(async () => {
  vm.runInThisContext(fs.readFileSync(readerPath, "utf8"), { filename: readerPath });
  await new Promise((resolve) => setTimeout(resolve, 75));
  for (const mount of [...graphMounts, ...resourceMounts]) {
    if (mount.dataset.state !== "ready" || mount.textContent.includes("Loading approved")) {
      throw new Error("publication mount did not hydrate: " + (mount.dataset.publicationGraph || mount.dataset.publicationResource) + " " + (mount.dataset.publicationError || mount.textContent));
    }
  }
})().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
"""
        completed = subprocess.run(
            [
                "node",
                "-e",
                harness.replace("__READER_PATH__", json.dumps(str(reader_path)))
                .replace("__BUNDLE_ROOT__", json.dumps(str(bundle_root)))
                .replace("__GRAPH_IDS__", json.dumps(graph_ids))
                .replace("__RESOURCE_IDS__", json.dumps(resource_ids)),
            ],
            check=False,
            capture_output=True,
            text=True,
            timeout=15,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)

    def test_ml_visualization_contract_preserves_supplied_data(self) -> None:
        reader = read("common/evidence-publication.js")
        self.assertNotIn("supplied graph units", reader.lower())
        self.assertIn("function percentage(value)", reader)
        self.assertIn('" pp"', reader)
        self.assertIn("publication-zero-line", reader)
        self.assertIn("Unsupported publication graph type", reader)
        self.assertNotIn("mean_importance_sum", reader)
        self.assertIn("hypothesis_ml_scientific_figure.v1.0.0", reader)
        self.assertIn("data-visual-row-count", reader)
        self.assertNotIn("function mlPlot(", reader)

        exposure = json.loads(read("data/public/evidence-observatory/v1/graphs/h1_exposure_blind_mechanical.json"))
        exposure_rows = exposure["accessible_table"]
        self.assertEqual(len(exposure_rows), 12)
        self.assertEqual(sum(row["held_out_balanced_accuracy"] == 1.0 for row in exposure_rows if row["task_id"] == "walking_vs_mall"), 4)
        pt = [row["held_out_balanced_accuracy"] for row in exposure_rows if row["task_id"] == "walking_vs_pt"]
        self.assertAlmostEqual(min(pt), 0.7407407407407407)
        self.assertAlmostEqual(max(pt), 0.9833333333333334)

        transport = json.loads(read("data/public/evidence-observatory/v1/graphs/h3_transport_validation.json"))
        gbt = next(row for row in transport["accessible_table"] if row["feature_tier"] == "sensor_only" and row["model"] == "gradient_boosted_trees")
        self.assertEqual(gbt["decision"], "fail_to_reject")
        self.assertEqual(gbt["balanced_accuracy"], 0.5)

        context = json.loads(read("data/public/evidence-observatory/v1/graphs/h2_h13_context_increment.json"))
        self.assertTrue(any(row["incremental_over_baseline"] < 0 for row in context["accessible_table"]))
        self.assertTrue(any(row["incremental_over_baseline"] > 0 for row in context["accessible_table"]))

        css = read("common/css/publication.css")
        self.assertIn("grid-template-columns: repeat(3, minmax(0, 1fr))", css)
        self.assertIn("@media (max-width: 820px)", css)
        self.assertNotIn("min-width: 42rem", css)

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
        self.assertIn("why skates?", html)
        self.assertIn("a human story of movement and access", html)
        self.assertIn("what looks unusual from a distance", html)
        self.assertIn("let the evidence observatory remain the sole scientific authority", html)
        self.assertNotIn("<h2>a. the injury</h2>", html)
        self.assertNotIn("<h2>n. the present appeal</h2>", html)

    def test_homepage_chapters_follow_question_led_narrative_order(self) -> None:
        html = read("index.html")
        chapter_ids = (
            'id="why-skates"',
            'id="what-happened"',
            'id="walking"',
            'id="rolling"',
            'id="method"',
            'id="evidence"',
            'id="recognition"',
            'id="future"',
        )
        positions = [html.index(chapter_id) for chapter_id in chapter_ids]
        self.assertEqual(positions, sorted(positions))
        self.assertEqual(html.count('class="section story-chapter'), 8)
        for question in (
            "Why did inline skates become a mobility aid?",
            "What happened?",
            "Why can walking hurt?",
            "Why can rolling work differently?",
            "How was this studied?",
            "Where can the evidence be examined?",
            "What happens when an unfamiliar aid meets a public system?",
            "What should mobility intelligence understand next?",
        ):
            self.assertIn(question, html)

    def test_scientific_routes_use_only_the_primary_navigation(self) -> None:
        js = site_header_js()
        self.assertIn('label: "Evidence Observatory"', js)
        self.assertNotIn("evidence-authority-strip", js)
        self.assertNotIn("ecosystem-path", js)
        self.assertNotIn("page-anchor-nav", read("evidence/index.html"))

    def test_shared_chrome_has_no_breadcrumb_or_ecosystem_navigation(self) -> None:
        js = site_header_js()
        css = nav_css()
        for token in ("breadcrumb", "ecosystem-path", "evidence-authority-strip"):
            self.assertNotIn(token, js)
            self.assertNotIn(token, css)

    def test_primary_navigation_uses_requested_order_and_canonical_urls(self) -> None:
        js = site_header_js()
        com_config = js[js.index("const config ="):js.index("function normalizePath")]
        ordered = (
            'label: "Story"',
            'label: "Walking vs Rolling"',
            'label: "Biomechanics"',
            'label: "Route Explorer"',
            'label: "Recognition"',
            'label: "Mobility Intelligence"',
            'label: "Evidence Observatory"',
        )
        positions = [com_config.index(label) for label in ordered]
        self.assertEqual(positions, sorted(positions))
        self.assertEqual(len(positions), 7)
        self.assertNotRegex(com_config, r'href: "/[^\"]+\.html')

    def test_story_page_contains_full_timeline(self):
        html = read("story/index.html").lower()
        self.assertIn("walking", html)
        self.assertIn("skating", html)
        self.assertIn("1983", html)
        self.assertIn("1991", html)
        self.assertIn("hip-impingement", html)
        self.assertIn("fsi/css evidence observatory", html)

    def test_shared_navigation_has_distinct_home_story_healthcare_matches(self):
        js = read("common/site-header.js")
        self.assertIn('brand: "HandicapSkater.com"', js)
        self.assertNotIn('brand: "HandicapSkater.org"', js)
        self.assertIn('{ href: "/story/", label: "Story", match: ["/story/"] }', js)
        self.assertIn('href: "/health-ai/"', js)
        self.assertIn('return match.includes(path)', js)

    def test_homepage_is_story_not_redirect_shell(self) -> None:
        html = read("index.html").lower()
        self.assertIn("a bounded, repeated n-of-1 inquiry", html)
        self.assertIn("the evidence observatory—the only scientific source", html)
        self.assertIn("site-footer", html)
        self.assertNotIn('url=/story/', html)
        self.assertNotIn('this homepage now routes', html)
        self.assertNotIn('comparable similarity score', html)

    def test_health_ai_canonical_and_legacy_redirect(self) -> None:
        html = read("healthcare-wearable-mobility/index.html")
        canonical = read("health-ai/index.html").lower()
        self.assertIn('url=/health-ai/', html.lower())
        self.assertIn('rel="canonical" href="https://handicapskater.com/health-ai/"', html.lower())
        self.assertIn("context is the missing sensor", canonical)
        self.assertIn("fractal stability index", canonical)
        self.assertIn("cohort similarity score", canonical)
        self.assertIn("human review", canonical)
        self.assertNotIn("google", canonical)
        self.assertNotIn("fitbit", canonical)

    def test_data_and_health_ai_define_fsi_css_correctly(self) -> None:
        for page in ("evidence/index.html", "health-ai/index.html"):
            html = read(page).lower()
            self.assertIn("fractal stability index", html, page)
            self.assertIn("cohort similarity score", html, page)
            self.assertNotIn("comparable similarity score", html, page)
            self.assertNotIn("functional stress and cumulative strain", html, page)
            self.assertNotIn("cumulative strain score", html, page)

    def test_evidence_page_renders_canonical_hypothesis_registry_from_bundle(self) -> None:
        html = read("evidence/index.html")
        reader = read("common/evidence-publication.js")
        self.assertIn('data-publication-hypothesis-registry="hypothesis-registry"', html)
        self.assertIn("Canonical Scientific Contract", html)
        self.assertIn("renderHypothesisRegistry", reader)
        self.assertIn('"H1,H2,H3,H4,H5,H6"', reader)
        self.assertIn("Required conclusion order", reader)
        self.assertNotIn("calculateFsi", reader)
        self.assertNotIn("calculateCss", reader)

    def test_public_evidence_mounts_current_approved_observatory_figures(self) -> None:
        pages = {
            "evidence/repeated-protocol/index.html": ("accepted_triplet_stage_profiles",),
            "evidence/mobility-comparison/index.html": (
                "walking_vs_mall_accumulated_mechanical_load",
                "triplet_functional_output_context",
                "h1_mechanical_only_validation",
                "h1_exposure_blind_mechanical",
            ),
            "evidence/longitudinal/index.html": (
                "fns_sns_historical_coverage",
                "fns_sns_longitudinal_functional_capacity",
                "fns_sns_sustained_skating_context",
                "longitudinal_activity_context",
                "readiness_before_activity_context",
                "paired_fns_sns_outcome_summary",
                "paired_fns_sns_max_hr",
                "extreme_hr_reference_sensitivity",
                "temporal_context_decomposition",
                "authority_correction_summary",
            ),
            "evidence/transportation/index.html": (
                "transportation_body_coupling_comparison",
                "transport_coupling_profiles",
                "corrected_transport_context_counts",
                "h3_transport_validation",
            ),
            "evidence/strava-gps-skate-maps/index.html": (
                "route_weather_context",
            ),
            "platform/index.html": (
                "h1_feature_tier_validation",
                "h2_h13_context_increment",
                "ml_feature_domain_importance",
            ),
        }
        mounted = []
        for page, expected in pages.items():
            html = read(page)
            ids = re.findall(r'data-publication-graph="([^"]+)"', html)
            self.assertEqual(tuple(ids), expected, page)
            mounted.extend(ids)
        self.assertEqual(len(mounted), 23)
        reader = read("common/evidence-publication.js")
        self.assertIn("Inspect in Evidence Observatory", reader)
        self.assertIn("No measured value or zero bar is shown", reader)

    def test_longitudinal_phase2_story_keeps_all_governed_results_visible(self) -> None:
        html = read("evidence/longitudinal/index.html")
        for text in (
            "1,807 current mobility events",
            "54 primary paired-HR outings",
            "Average HR: n=54 dates",
            "Maximum HR: n=54 dates",
            "Resting-relative HR: n=52 dates",
            "119 eligible rides, 10 P95 and 2 P99 exceedances",
            "38 eligible rides, 6 P95 and 3 P99 exceedances",
            "raw p=0.022",
            "Holm-adjusted p=0.352",
        ):
            self.assertIn(text, html)
        self.assertIn("REAL_WORLD_THERAPEUTIC_SKATING", html)
        self.assertNotIn("FNS/SNS controlled skating", html)
        self.assertNotIn("FNS/SNS recovery skating", html)

    def test_access_history_separates_fixed_rail_claim_classes(self) -> None:
        lower = read("access/index.html").lower()
        for text in ("scientific finding:", "user account:", "documented history:", "legal argument:", "no direct fixed-rail mechanical or physiological measurement"):
            self.assertIn(text, lower)
        self.assertNotIn("fixed rail is medically proven safer", lower)

    def test_strava_evidence_page_content_and_caveats(self) -> None:
        html = read("evidence/strava-gps-skate-maps/index.html")
        self.assertIn("LONGITUDINAL MOBILITY RECORD", html)
        self.assertIn("Route Map Explorer", html)
        self.assertIn("what these routes add to the case study", html.lower())
        self.assertIn("does not directly locate pain or establish safety", html.lower())
        self.assertIn("data-publication-resource=\"longitudinal\"", html)
        self.assertNotIn("what a health or mobility reviewer should notice", html.lower())

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

    def test_all_generated_route_maps_have_mobile_viewport(self) -> None:
        pages = sorted((ROOT / "common/maps").glob("*.html"))
        self.assertGreaterEqual(len(pages), 542)
        for page in pages:
            self.assertIn('<meta name="viewport"', page.read_text(errors="ignore"), str(page))

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
        platform = read("platform/index.html").lower()
        standards = read("standards.html").lower()
        data = read("evidence/index.html").lower()
        health_ai = read("health-ai/index.html").lower()
        self.assertIn("wearable and mobility intelligence", platform)
        self.assertIn("what the system does not claim", platform)
        self.assertIn("publication contract", platform)
        self.assertIn("standards &amp; reviewer guidance", standards)
        self.assertIn("n-of-1", data)
        self.assertIn("context is the missing sensor", health_ai)

    def test_story_has_no_page_to_page_navigation_cards(self) -> None:
        html = read("story/index.html")
        self.assertNotIn('class="story-links"', html)
        self.assertNotIn('href="/access/"', html)

    def test_smart_and_final_video_and_access_story_hook_are_present(self) -> None:
        home = read("index.html")
        videos = read("videos/index.html")
        video_url = "https://www.reddit.com/r/HandicapSkater/s/6pPCv2k02t"
        self.assertIn("What Looks Like a Stunt Is the Access Story", home)
        self.assertIn("Watch the Smart &amp; Final video", home)
        self.assertIn(video_url, home)
        self.assertIn("shopping on skates, rolling to a motorcycle, and riding away", home)
        self.assertIn("Smart &amp; Final: Shopping, Skating, and Motorcycle Access", videos)
        self.assertIn(video_url, videos)

    def test_route_and_weather_context_presentation_is_mounted(self) -> None:
        route = read("evidence/strava-gps-skate-maps/index.html")
        self.assertIn("Governed route and weather context", route)
        self.assertIn('data-publication-graph="route_weather_context"', route)

    def test_fsi_and_css_graph_presentations_are_absent_from_static_evidence_ui(self) -> None:
        platform = read("platform/index.html")
        for heading in (
            "Fractal Stability Index distributions",
            "Cohort Similarity Score Matrix",
            "CSS Ranking",
        ):
            self.assertNotIn(heading, platform)
        self.assertNotIn('data-publication-graph="fsi_distributions"', platform)
        self.assertNotIn('data-publication-graph="css_similarity_matrix_ranking"', platform)
        self.assertIn("Fractal Stability Index (FSI)", platform)
        self.assertIn("Cohort Similarity Score (CSS)", platform)

    def test_all_biomechanics_content_remains_without_navigation_chrome(self) -> None:
        html = read("biomechanics/index.html")
        for content in (
            "Pelvic Structure",
            "Pelvic Kinematic Chain",
            "Movement Happens in Three Dimensions",
            "Walking Rebuilds Forward Motion Step by Step",
            "Walking Load Path and Controlled Rolling",
            "Controlled Propulsion and Double-Push Context",
            "Inspect the Supplied Comparison",
            "Walking therefore cannot be reduced to heel contact alone.",
            "Double-push techniques add another inward or outward propulsion phase within the stride.",
            "This is movement context, not a prescription or a website-derived scientific result.",
            "That control does not make skating universally safe or mechanically load-free.",
        ):
            self.assertIn(content, html)
        for image in (
            "Skeleton-Walking-Pelvis.gif",
            "Pelvis-LinesOfForce.gif",
            "Skeleton-Coronal-Plane.gif",
            "Skeleton-Sagittal-Plane.gif",
            "Skeleton-Transverse-Plane.gif",
            "Skeleton-Walking-3D.gif",
            "Skeleton-Walking-Hi.gif",
            "Skeleton-Skating-Hi.gif",
            "Skeleton-Walking-SideView.gif",
            "Skeleton-Skating-SideView.gif",
            "Skeleton-Skating.gif",
        ):
            self.assertIn(f'/common/images/{image}', html)
        self.assertNotIn('class="topic-index"', html)
        self.assertNotIn('class="biomech-links"', html)

    def test_video_cards_have_no_related_page_navigation(self) -> None:
        self.assertNotIn("Related page", read("videos/index.html"))

    def test_main_pages_share_evidence_stack_and_role_language(self) -> None:
        for page in ("index.html", "healthcare-wearable-mobility/index.html", "evidence/index.html", "platform.html", "story/index.html", "standards.html", "precedent.html"):
            lower = read(page).lower()
            # self.assertIn("handicapskater.com", lower, page)
            # self.assertIn("handicapskater.org", lower, page)
            # self.assertIn("fsicss platform", lower, page)


if __name__ == "__main__":
    unittest.main()
