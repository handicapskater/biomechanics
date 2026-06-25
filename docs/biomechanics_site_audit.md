# Biomechanics Site Audit

Branch: `audit/pr08-biomechanics-site-alignment`

## Page Inventory

Primary public pages:

- `/` and `/index.html`: legacy Angular/static shell for the biomechanics site. It now loads `advocacy-site.css` before the legacy `common/css/global.css` shell styles.
- `/story/` and `/story/index.html`: public evidence narrative for disability history, biomechanics, access disputes, wearable evidence, and pending/disputed legal questions.
- `/data.html`: Tableau/public data proof layer for mobility burden, HR/HRV, FSI, CSS, and accommodation relevance.
- `/precedent.html`: public legal/accommodation summary with softened claim boundaries.
- `/videos/` and `/videos/index.html`: public video and article evidence index.
- `/platform.html`: first-class HandicapSkater.com commercial platform positioning page.
- `/standards.html`: first-class HandicapSkater.org nonprofit standards/accessibility framework page.
- `/health-ai.html`: combined Health AI case study that still contains the detailed .com/.org split sections.

Compatibility pages:

- `/story.html`: meta-refresh compatibility page to `/story/`; no divergent content.
- `/videos.html`: meta-refresh compatibility page to `/videos/`; no divergent content.

Legacy/archive pages and fragments:

- Legacy `.htm` fragments remain available through the root shell and direct URLs.
- `pleadings.htm` and `pleadings-backup.html` preserve archive records with PR-07 caution language.
- Generated map exports under `common/maps/` were inventoried as static HTML artifacts but are not part of the current public navigation surface.

## Link Audit

Active public-page local link audit found no broken local references in:

- `index.html`
- `story.html`
- `videos.html`
- `story/index.html`
- `videos/index.html`
- `data.html`
- `precedent.html`
- `health-ai.html`
- `platform.html`
- `standards.html`

External links were not validated for remote availability during this audit.

## .com/.org Positioning Audit

`HandicapSkater.com` is now presented as:

- commercial AI/ML wearable data science platform
- commercial rights/IP layer
- wearable biometrics and mobility-mode analytics
- HR/HRV/activity evidence and pattern detection
- strategic fit, licensing or partnership candidate after validation, or platform extension potential

`HandicapSkater.org` is now presented as:

- nonprofit standards and accessibility mission
- civil rights and public-sector education framework
- non-standard mobility aid standards
- evidence-based accommodation standards
- supportive documentation for fair access

The commercial platform language is intentionally separated from nonprofit standards/accessibility language on `/platform.html`, `/standards.html`, `/data.html`, `/precedent.html`, and `/health-ai.html`.

## Claim-Safety Audit

Risky claim patterns searched:

- direct named-platform acquisition claims
- "proves pain"
- "court-proven biomarker"
- "clinically validated"
- "guaranteed accommodation"
- "final legal victory"

No active public page uses those phrases as claims.

Careful language now emphasized:

- strategic fit
- commercial rights/IP
- licensing or acquisition candidate
- nonprofit standards
- supportive evidence
- within person pattern
- not medical advice
- not legal advice

HR/HRV/FSI/CSS framing:

- HR and HRV are supportive within person signals, not standalone proof of pain.
- FSI and CSS are proposed synthesized metrics for functional stress and cumulative strain.
- FSI and CSS are not medical diagnoses, clinical validation, legal rulings, or guaranteed accommodations.

Legal/accommodation framing:

- Courtroom access records are described as access records, not universal rulings.
- FTA/DOT material is described as administrative determination/history, not final court victory.
- Pending and disputed issues are labeled as disputed, pending, accommodation history, or advocacy claims.
- Public pages avoid claiming guaranteed accommodation or final legal outcome.

## Manual Review Checklist

- Confirm `/platform.html` clearly represents HandicapSkater.com as the commercial platform/IP page.
- Confirm `/standards.html` clearly represents HandicapSkater.org as the nonprofit standards/accessibility framework.
- Confirm `/data.html` describes HR/HRV/FSI/CSS as supportive evidence, not diagnosis.
- Confirm `/precedent.html` preserves legal nuance and does not overstate outcomes.
- Confirm `/story/` remains readable as the public evidence narrative.
- Confirm `/story.html` and `/videos.html` redirect to canonical pages.
- Confirm root and nested public pages load the correct stylesheet paths:
  - root pages: `advocacy-site.css`
  - nested pages: `../advocacy-site.css`

## Local Serving

Attempted:

```sh
./scripts/serve.sh
```

Result: port `8080` was already in use by a Python `SimpleHTTP` server. The existing server responded with `200 OK` for the tested primary pages.

## URLs To Test

- `http://localhost:8080/`
- `http://localhost:8080/index.html`
- `http://localhost:8080/story/`
- `http://localhost:8080/story/index.html`
- `http://localhost:8080/story.html`
- `http://localhost:8080/data.html`
- `http://localhost:8080/precedent.html`
- `http://localhost:8080/videos/`
- `http://localhost:8080/videos/index.html`
- `http://localhost:8080/videos.html`
- `http://localhost:8080/platform.html`
- `http://localhost:8080/standards.html`
- `http://localhost:8080/health-ai.html`
