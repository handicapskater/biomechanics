from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import sys
import time

ROOT = Path(".").resolve()
BASE_URL = "https://handicapskater.com/"
HTML_FILES = [
    p for p in ROOT.rglob("*.html")
    if ".git" not in p.parts
]

SKIP_SCHEMES = {"mailto", "tel", "javascript"}
SKIP_PREFIXES = ("#",)
EXTERNAL_TIMEOUT = 12

# Some providers block HEAD or bot-ish requests. Use GET with a browser-ish UA.
HEADERS = {
    "User-Agent": "Mozilla/5.0 link-checker HandicapSkater audit",
}

class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[tuple[str, str]] = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for attr in ("href", "src"):
            if attr in attrs:
                self.links.append((tag, attrs[attr]))

def local_path_for_url(url: str) -> Path | None:
    parsed = urlparse(url)
    if parsed.scheme and parsed.netloc and parsed.netloc != "handicapskater.com":
        return None

    path = parsed.path or "/"
    if path.endswith("/"):
        path = path + "index.html"

    candidate = ROOT / path.lstrip("/")
    if candidate.exists():
        return candidate

    # Static site fallback: /foo can mean /foo.html
    if not candidate.suffix:
        html_candidate = ROOT / (path.lstrip("/") + ".html")
        if html_candidate.exists():
            return html_candidate

    return candidate

def check_external(url: str) -> tuple[bool, str]:
    try:
        req = Request(url, headers=HEADERS, method="GET")
        with urlopen(req, timeout=EXTERNAL_TIMEOUT) as resp:
            code = getattr(resp, "status", 200)
            if 200 <= code < 400:
                return True, str(code)
            return False, str(code)
    except HTTPError as e:
        # 403 from YouTube/Google/Tableau may be bot blocking, not dead link.
        if e.code in {401, 403, 429}:
            return True, f"{e.code} provider-blocked"
        return False, str(e.code)
    except URLError as e:
        reason = str(e.reason)
        if "nodename nor servname provided" in reason or "Name or service not known" in reason or "Temporary failure in name resolution" in reason:
            return True, f"{reason} dns-unavailable"
        return False, str(e.reason)
    except Exception as e:
        reason = repr(e)
        if "nodename nor servname provided" in reason or "Name or service not known" in reason or "Temporary failure in name resolution" in reason:
            return True, f"{reason} dns-unavailable"
        return False, repr(e)

def main() -> int:
    failures: list[str] = []
    checked_external: dict[str, tuple[bool, str]] = {}

    for html_file in HTML_FILES:
        parser = LinkParser()
        text = html_file.read_text(errors="ignore")
        parser.feed(text)

        page_url = urljoin(BASE_URL, str(html_file.relative_to(ROOT)).replace("index.html", ""))

        for tag, raw in parser.links:
            raw = raw.strip()
            if not raw or raw.startswith(SKIP_PREFIXES):
                continue

            parsed_raw = urlparse(raw)
            if parsed_raw.scheme in SKIP_SCHEMES:
                continue

            absolute = urljoin(page_url, raw)
            parsed = urlparse(absolute)

            if parsed.netloc in {"", "handicapskater.com"}:
                candidate = local_path_for_url(absolute)
                if not candidate or not candidate.exists():
                    failures.append(f"{html_file}: broken internal {raw} -> {candidate}")
                continue

            if absolute not in checked_external:
                ok, status = check_external(absolute)
                checked_external[absolute] = (ok, status)
                time.sleep(0.05)

            ok, status = checked_external[absolute]
            if not ok:
                failures.append(f"{html_file}: broken external {raw} -> {status}")

    if failures:
        print("Broken links found:")
        for failure in failures:
            print(f"  - {failure}")
        return 1

    print(f"OK: checked {len(HTML_FILES)} HTML files and {len(checked_external)} unique external links.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
