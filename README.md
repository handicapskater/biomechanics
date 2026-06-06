# HandicapSkater Static Site

This repository is a static HTML/CSS website. The intended local site root is the repository root, where `index.html`, `advocacy-site.css`, `story/`, and `videos/` live.

## Local Development

From the repo root:

```sh
cd /Users/troywilkes/repos/biomechanics
python3 -m http.server 8080
```

Or run the helper script:

```sh
./scripts/serve.sh
```

Then open:

- http://localhost:8080/
- http://localhost:8080/story/

## Verification

These URLs should return successfully when served from the repo root:

- http://localhost:8080/
- http://localhost:8080/index.html
- http://localhost:8080/story/
- http://localhost:8080/story/index.html
- http://localhost:8080/precedent.html
- http://localhost:8080/data.html
- http://localhost:8080/videos/
- http://localhost:8080/videos/index.html

The canonical story page is `/story/`, backed by `story/index.html`. The legacy `story.html` page redirects there. The canonical videos URL is `/videos/`, with legacy `videos.html` redirecting there.
