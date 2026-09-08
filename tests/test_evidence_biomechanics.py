from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "data/public/evidence-observatory/v1"


class EvidenceBiomechanicsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.resource = json.loads((BUNDLE / "biomechanics-evidence.json").read_text())
        cls.manifest = json.loads((BUNDLE / "manifest.json").read_text())
        cls.page = (ROOT / "evidence/index.html").read_text()
        cls.reader = (ROOT / "common/evidence-biomechanics.js").read_text()
        cls.legacy_biomechanics = (ROOT / "biomechanics/index.html").read_text()

    def test_governed_biomechanics_contract_is_the_page_authority(self) -> None:
        entry = next(item for item in self.manifest["resources"] if item["resource_id"] == "biomechanics-evidence")
        self.assertEqual(self.resource["content_hash"], entry["content_hash"])
        self.assertEqual(self.resource["approved_values"]["contract"], "biomechanics_publication_evidence.v1")
        self.assertFalse(self.resource["approved_values"]["scientific_recomputation"])
        self.assertIn('data-biomechanics-resource="/data/public/evidence-observatory/v1/biomechanics-evidence.json"', self.page)
        self.assertIn('resource(manifest, "biomechanics-evidence")', self.reader)
        self.assertIn('resource(manifest, "repeated-protocol")', self.reader)
        self.assertIn('resource(manifest, "transportation")', self.reader)

    def test_primary_and_supporting_values_are_direct_public_fields(self) -> None:
        values = self.resource["approved_values"]
        self.assertEqual(values["ib01"]["vertical_rms"]["direction_count"], 44)
        self.assertEqual(values["ib01"]["magnitude_jerk"]["direction_count"], 44)
        self.assertEqual(values["ib01"]["fixed_reference_event_density"]["direction_count"], 25)
        self.assertEqual(values["ib01"]["tails"]["direction_count"], 25)
        self.assertEqual(values["ib01"]["pareto"]["core"]["direction_count"], 43)
        self.assertEqual(values["ib01"]["pareto"]["with_shock"]["direction_count"], 38)
        self.assertTrue(values["ib01"]["shock_taxonomy"]["adaptive_mad_counter_result_preserved"])
        self.assertIn("walking_minus_mall", self.reader)
        self.assertNotIn("Math.", self.reader)

    def test_boundaries_and_future_status_are_rendered_without_pain_or_force_inference(self) -> None:
        values = self.resource["approved_values"]
        self.assertEqual(values["ib01"]["pt"]["classification"], "PT_DISTINCT_FUNCTIONAL_SKATING_STATE")
        self.assertFalse(values["measurement_boundaries"]["pain_identified"])
        self.assertFalse(values["measurement_boundaries"]["internal_joint_force_measured"])
        self.assertFalse(values["measurement_boundaries"]["body_coupling_directly_measured"])
        self.assertFalse(values["bct01"]["bct_executed"])
        self.assertIn("DESIGN ONLY — NOT YET EXECUTED", self.reader)
        self.assertIn("No seat-effect estimate is presented", self.reader)
        self.assertIn("HR is not treated as pain", self.reader)

    def test_legacy_biomechanics_page_is_protected_from_replacement_regression(self) -> None:
        for heading in (
            "Walking and Controlled Inline Skating",
            "A Functional Movement Hypothesis",
            "A Step Travels Through a Linked Mechanical Chain",
            "Mechanical Exposure Is Not the Same as Functional Burden",
            "Inspect the Supplied Comparison",
        ):
            self.assertIn(heading, self.legacy_biomechanics)
        self.assertNotIn("evidence-biomechanics.js", self.legacy_biomechanics)
        self.assertNotIn("biomechanics-publication.js", self.legacy_biomechanics)
