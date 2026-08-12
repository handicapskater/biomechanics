#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STANDARDS_ROOT = ROOT.parent / "standards"
SHARED = ROOT / "shared" / "site-chrome"

CORE = (SHARED / "site-header-core.js").read_text()
SITE_CHROME_CSS = (SHARED / "site-chrome.css").read_text()

SITES = {
    "com": {
        "root": ROOT,
        "brand": "HandicapSkater.com",
        "links": [
            ("/story/", "Story", ["/story/"]),
            ("/pain/", "Walking vs Rolling", ["/pain/"]),
            ("/biomechanics/", "Biomechanics", ["/biomechanics/"]),
            ("/evidence/strava-gps-skate-maps/", "Route Explorer", ["/evidence/strava-gps-skate-maps/"]),
            ("/access/", "Recognition", ["/access/"]),
            ("/health-ai/", "Mobility Intelligence", ["/health-ai/", "/videos/"]),
            ("/platform/", "Evidence Observatory", ["/platform/", "/evidence/", "/evidence/mobility-comparison/", "/evidence/repeated-protocol/", "/evidence/transportation/", "/evidence/longitudinal/"]),
        ],
    },
    "org": {
        "root": STANDARDS_ROOT,
        "brand": "HandicapSkater.org",
        "links": [
            ("/direct-threat-analysis/", "Direct Threat", ["/direct-threat-analysis/"]),
            ("/standards/", "Engineering Principles", ["/standards/"]),
            ("/federal-source-anchors/", "Federal Sources", ["/federal-source-anchors/"]),
            ("/hypothesis-registry/", "Hypothesis Registry", ["/hypothesis-registry/"]),
            ("/evidence-review/", "Methods", ["/evidence-review/"]),
        ],
    },
}


def js_string(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def render_links(links: list[tuple[str, str, list[str]]]) -> str:
    lines = []
    for href, label, matches in links:
        match = "[" + ", ".join(js_string(item) for item in matches) + "]"
        lines.append(f"    {{ href: {js_string(href)}, label: {js_string(label)}, match: {match} }}")
    return ",\n".join(lines)


def render_header(config: dict[str, object]) -> str:
    return """(function () {
  const config = {
    brand: BRAND,
    links: [
LINKS
    ]
  };

CORE

  renderSiteHeader(config);
})();
""".replace("BRAND", js_string(str(config["brand"]))).replace("LINKS", render_links(config["links"])).replace("CORE", CORE)


def write_if_changed(path: Path, content: str) -> bool:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.read_text() == content:
        return False
    path.write_text(content)
    return True


def main() -> int:
    changed: list[Path] = []
    for config in SITES.values():
        root = Path(config["root"])
        if not root.exists():
            raise SystemExit(f"missing site root: {root}")
        targets = {
            root / "common" / "css" / "site-chrome.css": SITE_CHROME_CSS,
            root / "common" / "site-header.js": render_header(config),
        }
        for path, content in targets.items():
            if write_if_changed(path, content):
                changed.append(path)

    for path in changed:
        print(path)
    if not changed:
        print("site chrome already in sync")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
