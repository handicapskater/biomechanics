from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "data/public/evidence-observatory/v1"
PRIMARY = {
    "h1_mechanical_only_validation",
    "h3_transport_validation",
    "h2_h13_context_increment",
    "paired_fns_sns_outcome_summary",
    "fns_sns_longitudinal_functional_capacity",
}
MOUNTED = PRIMARY | {
    "walking_vs_mall_accumulated_mechanical_load",
    "accepted_triplet_stage_profiles",
    "triplet_functional_output_context",
    "functional_output_vs_burden_authoritative_miles",
    "transportation_body_coupling_comparison",
}


class GovernedEvidenceProjectionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads((BUNDLE / "manifest.json").read_text())
        cls.entries = {entry["graph_id"]: entry for entry in cls.manifest["graphs"]}

    def page_mounts(self) -> set[str]:
        mounts: set[str] = set()
        for page in ("index.html", "case/index.html", "evidence/index.html"):
            mounts.update(re.findall(r'data-governed-graph="([a-z0-9_-]+)"', (ROOT / page).read_text()))
        return mounts

    def payload(self, graph_id: str) -> dict:
        return json.loads((BUNDLE / self.entries[graph_id]["artifact_path"]).read_text())

    def test_selected_mounts_exist_in_the_governed_bundle_with_tables_and_hashes(self) -> None:
        self.assertTrue(PRIMARY.issubset(self.page_mounts()))
        self.assertEqual(self.page_mounts(), MOUNTED)
        for graph_id in MOUNTED:
            entry = self.entries[graph_id]
            payload = self.payload(graph_id)
            self.assertEqual(payload["graph_contract_version"], "fsi_publication_graph.v1")
            self.assertEqual(payload["graph_id"], graph_id)
            self.assertEqual(payload["content_hash"], entry["content_hash"])
            self.assertTrue(payload["accessible_table"], graph_id)
            self.assertTrue(payload["source_contracts"], graph_id)

    def test_transport_denominator_layers_survive_the_projection(self) -> None:
        payload = self.payload("transportation_body_coupling_comparison")
        self.assertEqual(payload["coverage"]["longitudinal_transport_context_support"]["motorcycle"], 210)
        self.assertEqual(payload["coverage"]["episodic_kubios_body_coupling_support"]["motorcycle"], 6)
        labels = {row.get("denominator_label") for row in payload["accessible_table"]}
        self.assertIn("EPISODIC BODY-COUPLING / COMPONENT SUPPORT (Kubios + WHOOP + Strava)", labels)

    def test_current_ml_provenance_survives_and_legacy_sensitivity_is_not_mounted(self) -> None:
        current = self.payload("h1_mechanical_only_validation")
        current_text = json.dumps(current)
        self.assertIn("full-feature-2f026711c42e", current_text)
        self.assertNotIn("h1_exposure_blind_mechanical", self.page_mounts())
        self.assertNotIn("h1_exposure_blind_tier_comparison", self.page_mounts())

    def test_blocked_graph_is_not_primary_case_evidence(self) -> None:
        self.assertNotIn("episodic_event_triggered_trajectory", self.page_mounts())
        self.assertNotIn("technical-contract-only", (ROOT / "evidence/index.html").read_text().lower())

    def test_renderer_is_bundle_only_and_never_a_private_or_scientific_engine(self) -> None:
        renderer = (ROOT / "common/governed-evidence-graphs.js").read_text().lower()
        self.assertIn('const BUNDLE_ROOT = "/data/public/evidence-observatory/v1/"', (ROOT / "common/governed-evidence-graphs.js").read_text())
        for forbidden in ("/rag", "/mcp", "/warehouse", "/private", "/clinical-export", "duckdb", "sql", "model.fit"):
            self.assertNotIn(forbidden, renderer)

    def test_missing_selected_graph_fails_closed_in_the_renderer(self) -> None:
        renderer = (ROOT / "common/governed-evidence-graphs.js").read_text()
        self.assertIn("canonical graph ${graphId} is absent", renderer)
        self.assertIn("failed contract validation", renderer)
