import subprocess
import sys
import unittest

class LinkTests(unittest.TestCase):
    def test_site_links(self):
        result = subprocess.run(
            [sys.executable, "scripts/check_site_links.py"],
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )
        self.assertEqual(result.returncode, 0, result.stdout)

if __name__ == "__main__":
    unittest.main()
