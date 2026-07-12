# Homepage Pain and Precedent Structure

## Purpose

The HandicapSkater.com homepage now starts with chronic MSK pain because pain is the human and scientific impetus for the project. The homepage should stay concise: it introduces the movement problem, links to the Pain page, summarizes recognition records, and points to the Evidence Corpus page for generated evidence.

## Page Roles

HandicapSkater.com explains the lived disability, pain, biomechanics, public story, data, and evidence record.

HandicapSkater.org handles standards, non-standard mobility aid framing, policy structure, DMV/DOT/FTA context, and broader reviewer guidance.

The FSI Evidence Observatory handles the data science dashboard, FSI Tensor outputs, validation checks, source indexing, and audit artifacts.

## Homepage

The homepage is the fast entry point. It should include:

- Chronic MSK pain and controlled rolling as the core frame.
- A short distinction between walking, skating, and passive transportation.
- A concise "Recognized in Practice" summary of standards forming records.
- A compact Evidence Corpus teaser.
- Links to Pain, Data, Precedent, and HandicapSkater.org.

The homepage should not include the full FSI Tensor cohort ranking, validation card grid, or source artifact details. Those belong on `/evidence/`.

## Pain Page

`pain.html` explains why pain changes the practical meaning of movement. It distinguishes walking from controlled rolling and preserves the evidence boundary:

Wearables do not directly measure pain. They measure related burden signals such as heart rate, HRV/RMSSD, movement exposure, impact, duration, recovery context, and repeatability.

The Pain page should stay human, direct, and scientifically cautious. It should not claim that data establishes pain or that a wearable directly measures pain.

## Precedent Summary

The homepage summarizes recognition records in a short timeline:

- Functional mobility history.
- Work access and tax recognition.
- Public/business use.
- Courtroom access.
- DOT / FTA transit review.
- Transit access history.
- DMV vehicle operation recognition.
- Airport and flight access.
- Current source-indexed data science evidence.

Detailed source context remains on `precedent.html` and archive/source pages.

## Validation

Run:

```bash
python scripts/validate_home_pain_precedent.py
python scripts/validate_fsi_data_page_snapshot.py
```

The validation checks that the homepage is pain-first, links to the Pain and Evidence Corpus pages, includes a concise recognition summary, keeps the full FSI snapshot off the homepage, and avoids unsupported pain, medical, and legal overclaiming.
