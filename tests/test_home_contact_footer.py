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
        self.shared = (ROOT / "common/site-footer.js").read_text()
        self.footer = FooterParser(self.shared.split('"handicapskater.com": `', 1)[1].split('`,', 1)[0])

    def test_one_shared_footer_and_named_safe_links(self):
        self.assertNotIn("<footer", self.home)
        self.assertEqual(self.home.count('src="/common/site-footer.js"'), 1)
        self.assertEqual(len(self.footer.footers), 1)
        self.assertEqual(len(self.footer.links), 9)
        self.assertEqual(self.footer.embeds, [])
        for link in self.footer.links:
            self.assertTrue(link.get("aria-label") or link["label"].strip())
            if link["href"].startswith("https://"):
                self.assertEqual(link["target"], "_blank")
                self.assertEqual(set(link["rel"].split()), {"noopener", "noreferrer"})

    def test_canonical_homepage_social_targets_and_description(self):
        targets = {link["href"] for link in self.footer.links}
        welcome = next(link for link in self.footer.links if link["href"] == "/?welcome=1")
        self.assertEqual(welcome["label"].strip(), "Welcome")
        self.assertIn("data-welcome-modal", welcome)
        self.assertIn("https://www.facebook.com/RollerGracie/", targets)
        self.assertIn("https://www.linkedin.com/company/103320223/", targets)
        self.assertIn("This site presents an N-of-1 scientific record and public case study.", "".join(self.footer.text))
        self.assertEqual(len(self.footer.icons), 6)
        for icon in self.footer.icons:
            self.assertEqual(icon["aria-hidden"], "true")
            self.assertEqual(icon["focusable"], "false")

    def test_shared_actions_center_wrap_and_keyboard_focus(self):
        css = (ROOT / "common/css/site-pages.css").read_text()
        self.assertIn(".site-com .home-footer-inner", css)
        self.assertIn(".site-com .home-contact-footer a:focus-visible", css)
        self.assertIn(".site-com .home-footer-welcome", css)
        self.assertNotIn(".page-home .home-footer-", css)


if __name__ == "__main__":
    unittest.main()
