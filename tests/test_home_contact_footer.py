"""Compact homepage footer: static access, source destinations, shared fallback."""
import re
import subprocess
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class FooterParser(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.in_footer = False
        self.footers = []
        self.links = []
        self.embeds = []
        self.text = []
        self.icons = []
        self.current_link = None
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "footer":
            self.in_footer = True
            self.footers.append(attrs)
        if not self.in_footer:
            return
        if tag == "a":
            self.current_link = {**attrs, "label": ""}
            self.links.append(self.current_link)
        if tag in {"script", "iframe", "img"}:
            self.embeds.append(tag)
        if tag == "svg":
            self.icons.append(attrs)

    def handle_endtag(self, tag):
        if tag == "a":
            self.current_link = None
        if tag == "footer":
            self.in_footer = False

    def handle_data(self, data):
        if self.in_footer:
            self.text.append(data)
        if self.in_footer and self.current_link is not None:
            self.current_link["label"] += data


class HomeContactFooterTests(unittest.TestCase):
    def setUp(self):
        self.home = (ROOT / "index.html").read_text()
        self.footer = FooterParser(self.home)

    def test_one_static_footer_has_named_links_and_no_external_widgets(self):
        self.assertEqual(len(self.footer.footers), 1)
        self.assertEqual(self.footer.footers[0]["aria-label"], "Contact and support")
        self.assertEqual(len(self.footer.links), 8)
        self.assertTrue(all(link.get("aria-label") or link["label"].strip() for link in self.footer.links))
        self.assertEqual(self.footer.embeds, [])
        for link in self.footer.links:
            if link["href"].startswith("https://"):
                self.assertEqual(link["target"], "_blank")
                self.assertEqual(set(link["rel"].split()), {"noopener", "noreferrer"})
            else:
                self.assertTrue((ROOT / link["href"].lstrip("/")).is_file())

    def test_destinations_preserve_master_footer_authority(self):
        master = (ROOT / "MasterLayout.htm").read_text().split("<footer", 1)[1].split("</footer>", 1)[0]
        targets = {link["href"] for link in self.footer.links}
        for href in re.findall(r'href="([^"]+)"', master):
            expected = href.replace("http://www.facebook.com", "https://www.facebook.com")
            if not expected.startswith("https://"):
                expected = "/" + expected
            self.assertIn(expected, targets)
        company_id = re.search(r'data-id="(\d+)"', master).group(1)
        self.assertIn(f"https://www.linkedin.com/company/{company_id}/", targets)
        donate = next(link for link in self.footer.links if "gofundme.com" in link["href"])
        self.assertEqual(donate["label"], "Donation")

    def test_original_description_and_accessible_social_icons_are_preserved(self):
        shared = (ROOT / "common/site-footer.js").read_text()
        original = re.search(r'<p class="footer-description">.*?</p>', shared, re.S).group(0)
        description = FooterParser(f"<footer>{original}</footer>")
        self.assertIn(" ".join("".join(description.text).split()),
                      " ".join("".join(self.footer.text).split()))
        self.assertEqual(len(self.footer.icons), 6)
        for icon in self.footer.icons:
            self.assertEqual(icon["aria-hidden"], "true")
            self.assertEqual(icon["focusable"], "false")
        names = {link.get("aria-label") for link in self.footer.links if link.get("aria-label")}
        self.assertEqual(names, {"Facebook", "X / Twitter", "LinkedIn", "YouTube", "Rumble", "Instagram"})

    def test_description_and_wrapping_actions_are_centered(self):
        css = (ROOT / "common/css/site-pages.css").read_text()
        for name in ("inner", "description", "meta"):
            rule = re.search(r"\.page-home \.home-footer-" + name + r" \{([^}]+)\}", css).group(1)
            self.assertIn("text-align: center;", rule)
        for name in ("actions", "social"):
            rule = re.search(r"\.page-home \.home-footer-" + name + r" \{([^}]+)\}", css).group(1)
            self.assertIn("justify-content: center;", rule)
            self.assertIn("flex-wrap: wrap;", rule)

    def test_shared_script_preserves_authored_footer_and_other_page_fallback(self):
        script = r'''
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('common/site-footer.js', 'utf8');
for (const authored of [true, false]) {
  const mount = { innerHTML: 'authored footer', querySelector: () => authored ? {} : null };
  vm.runInNewContext(source, {
    window: { location: { hostname: 'handicapskater.com' } },
    document: { getElementById: () => mount, querySelectorAll: () => [], querySelector: () => ({}) },
    MutationObserver: class { observe() {} }
  });
  if (authored) assert.equal(mount.innerHTML, 'authored footer');
  else assert.match(mount.innerHTML, /footer-social/);
}
'''
        subprocess.run(["node", "-e", script], cwd=ROOT, check=True, capture_output=True, text=True)


if __name__ == "__main__":
    unittest.main()
