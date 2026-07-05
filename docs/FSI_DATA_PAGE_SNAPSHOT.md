# FSI Data Page Snapshot

HandicapSkater.com keeps the homepage short. The homepage has only a compact Data Science Evidence teaser that links to `/data.html`.

The Data page displays the full FSI Tensor v0.3 public snapshot.

## Files Read By The Data Page

- `data/review/fsi_tensor_v0_3_public_overview.json`
- `data/review/fsi_tensor_v0_3_autonomic_gated_cohort_summary.json`
- `data/review/fsi_tensor_v0_3_validation_summary.json`
- `data/review/fsi_tensor_v0_3_artifact_manifest_summary.json`

## Refresh Command

Run this from the FSICSS IoMT evidence platform repo:

```bash
python scripts/generate_fsi_tensor_v0_3_outputs.py
python scripts/run_fsi_tensor_v0_3_validation.py
python scripts/export_fsi_tensor_v0_3_public_review_data.py --site-dir /Users/troywilkes/repos/biomechanics
python scripts/validate_fsi_tensor_public_review_export.py
```

Then validate the static site wiring from this repo:

```bash
python scripts/validate_fsi_data_page_snapshot.py
```

## What The Data Page Shows

- FSI Tensor v0.3 cohort ranking sorted by FSI burden score.
- Impact burden proxy.
- Functional mobility efficiency.
- Dynamic validation cards for Moves 1-9 and later moves if added to JSON.
- Source-index and artifact manifest status.

## Boundary

The snapshot summarizes within-person evidence. It does not measure pain directly and does not make clinical or legal conclusions.
