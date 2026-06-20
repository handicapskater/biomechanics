# HandicapSkater Static Site

This repository is a static HTML/CSS website. The intended local site root is the repository root, where `index.html`, `advocacy-site.css`, `story/`, and `videos/` live.

## Local Development

From the repo root:

```sh
cd /Users/troywilkes/repos/biomechanics
python3 -m http.server 8080

cloudflared tunnel --url http://localhost:8080
```

Or run the helper script:

```sh
./scripts/serve.sh
```

Then open:

- http://localhost:8080/
- http://localhost:8080/story/
- http://localhost:8080/data.html
- http://localhost:8080/evidence/strava-gps-skate-maps/
- http://localhost:8080/precedent.html
- http://localhost:8080/platform.html
- http://localhost:8080/standards.html

## Verification

These URLs should return successfully when served from the repo root:

- http://localhost:8080/
- http://localhost:8080/index.html
- http://localhost:8080/story/
- http://localhost:8080/story/index.html
- http://localhost:8080/precedent.html
- http://localhost:8080/data.html
- http://localhost:8080/evidence/strava-gps-skate-maps/
- http://localhost:8080/datascience.htm
- http://localhost:8080/health-ai.html
- http://localhost:8080/platform.html
- http://localhost:8080/standards.html
- http://localhost:8080/videos/
- http://localhost:8080/videos/index.html

The canonical story page is `/story/`, backed by `story/index.html`. The legacy `story.html` page redirects there. The canonical videos URL is `/videos/`, with legacy `videos.html` redirecting there.

## Public Positioning

- `HandicapSkater.com`: commercial AI/ML wearable data science platform positioning for wearable biometrics, HR/HRV/activity evidence, mobility accommodation analytics, AI/ML pattern detection, and platform potential.
- `HandicapSkater.org`: nonprofit standards, civil rights, and accommodation framework for non-traditional mobility aid standards, evidence-based accommodation standards, public sector accessibility education, and fair access.
- `data.html` and `datascience.htm`: public biomechanics proof layer. HR and HRV are supportive signals, not standalone proof of pain. FSI and CSS are proposed synthesized metrics, not medical diagnoses.
- `evidence/strava-gps-skate-maps/`: Strava GPS skate-map evidence page derived from the sibling datascience notebook section `Strava GPS Skate Maps for Physical Therapy`. Route data is activity context for physical therapy and mobility aid use, not diagnosis.

## Claim Governance

- `docs/source_linked_claim_map.md`: maps public pages to canonical claim IDs,
  notebook outputs, platform reports, and evidence records.
- `docs/linkedin_claim_vocabulary.md`: keeps LinkedIn company copy aligned with
  the same public-safe vocabulary used on the website.

## Site Tests

Run static link and public-copy checks:

```sh
python3 scripts/check_site_links.py
python3 scripts/check_links.py
python3 -m unittest discover -s tests

python3 -m unittest discover -s tests 2>&1 | pbcopy
```
