# Source-Linked Public Claim Map

This map links public HandicapSkater.com pages to canonical claim IDs and
source-linked artifacts in the datascience and FSICSS platform repos. It is a
public-claim governance document, not a replacement for notebooks, court
records, or generated reports.

## Canonical Claim IDs

| Claim ID | Public-safe claim |
| --- | --- |
| `HS-CLAIM-001` | Skating is documented as functional mobility support in this within-person record. |
| `HS-CLAIM-002` | Walking burden should be reviewed by physiological and biomechanical context, not distance alone. |
| `HS-CLAIM-003` | Some ParaTransit conditions are documented as higher-burden passive travel in the source-linked record. |
| `HS-CLAIM-004` | Wearable, route, sensor, legal, and report artifacts corroborate the broader record; they are not interchangeable proof sources. |
| `HS-CLAIM-005` | The FSICSS platform organizes evidence, metrics, retrieval, and caveats for review by qualified humans. |
| `HS-CLAIM-006` | Public website, standards site, notebooks, and platform outputs should link to each other without blurring responsibilities. |
| `HS-CLAIM-007` | Current FSI/CSS results are source-linked decision-support evidence and should be read as presumptive/directional where sample sizes are small. |
| `HS-CLAIM-008` | Kubios/H10 is the activity-specific biomechanics stream; WHOOP and Strava provide longitudinal physiology and functional-capacity context. |

## Public Page Map

| Page | Claim IDs | Source-linked artifacts |
| --- | --- | --- |
| `index.html` | `HS-CLAIM-001`, `HS-CLAIM-004`, `HS-CLAIM-006` | `datascience:legal/cases/25-7526/README.md`; `fsicss-iomt-evidence-platform:docs/fsicss_platform_positioning.md`; `handicapskater-workspace:docs/phase1_governance_source_map.md` |
| `data.html` | `HS-CLAIM-001`, `HS-CLAIM-002`, `HS-CLAIM-003`, `HS-CLAIM-005`, `HS-CLAIM-007`, `HS-CLAIM-008` | `datascience:legal/docs/evidence_index.md`; `fsicss-iomt-evidence-platform:docs/fsicss_comprehensive_case_study.md`; `fsicss-iomt-evidence-platform:legal/cases/25-7526/outputs/fsicss_comprehensive_case_study/fsicss_comprehensive_case_study.md`; `fsicss-iomt-evidence-platform:legal/cases/25-7526/outputs/fsicss_comprehensive_case_study/integrated_case_study_results.csv`; `fsicss-iomt-evidence-platform:legal/cases/25-7526/outputs/fsicss_comprehensive_case_study/kubios_fsi_css_results.csv` |
| `health-ai.html` | `HS-CLAIM-004`, `HS-CLAIM-005`, `HS-CLAIM-006` | `fsicss-iomt-evidence-platform:docs/local_rag_llm.md`; `fsicss-iomt-evidence-platform:docs/linkedin_company_positioning.md`; `handicapskater-workspace:docs/public_private_data_boundary_checklist.md` |
| `platform.html` | `HS-CLAIM-004`, `HS-CLAIM-005`, `HS-CLAIM-006`, `HS-CLAIM-007`, `HS-CLAIM-008` | `fsicss-iomt-evidence-platform:data/source_maps/cross_repo_source_map.json`; `fsicss-iomt-evidence-platform:docs/LIVE_RAG_LOCAL.md`; `fsicss-iomt-evidence-platform:docs/local_rag_llm.md`; `fsicss-iomt-evidence-platform:docs/runbooks/evidence_observatory_rag.md`; `fsicss-iomt-evidence-platform:apps/evidence_observatory/fsicss_evidence_observatory` |
| `precedent.html` | `HS-CLAIM-001`, `HS-CLAIM-006` | `datascience:legal/docs/legal_framing.md`; `datascience:legal/docs/evidence_index.md`; `standards:dot-fta-doj-timeline.html` |
| `story/index.html` | `HS-CLAIM-001`, `HS-CLAIM-002`, `HS-CLAIM-006` | `datascience:legal/cases/25-7526/outputs/exhibit_a_filed_2026-06-04/README.md`; `datascience:legal/notebooks/NonTraditional_Mobility_Aid_Biomechanics_ParaTransit_Burden.ipynb`; `datascience:legal/notebooks/Wearable_Biomechanical_ParaTransit_Reproducible.ipynb` |
| `evidence/strava-gps-skate-maps/index.html` | `HS-CLAIM-001`, `HS-CLAIM-004` | `fsicss-iomt-evidence-platform:data/processed/strava/strava_evidence_context.jsonl`; `fsicss-iomt-evidence-platform:reports/strava_evidence_context_summary.md` |

## Claim Language Guardrails

Use:

- source-linked evidence
- within-person pattern
- functional mobility
- mobility burden
- corroborates the broader record
- reviewer-safe summaries
- qualified reviewers
- presumptive/directional where sample sizes are small
- activity-specific biomechanics

Avoid:

- medical diagnosis
- proves pain
- final legal victory
- guaranteed accommodation
- agency, court, employer, or platform endorsement
- automated entitlement

## Public/Private Boundary

This public site may reference paths, hashes, generated summaries, notebooks,
route maps, and public case-study outputs. It must not publish raw private
WHOOP, Strava, Kubios/H10, medical, legal, identity, or accommodation records
unless they have been intentionally reviewed and approved for public release.

The working boundary checklist lives in:

`handicapskater-workspace:docs/public_private_data_boundary_checklist.md`
