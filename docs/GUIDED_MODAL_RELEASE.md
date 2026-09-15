# Six-perspective modal

## Historical source and adaptation

`aa707df:index.html#heroModal` and `aa707df:common/css/global.css` contained the
original motorcycle overlay: shaded backdrop, rounded light panel, close/replay,
body scroll lock and image-led navigation. The old implementation auto-opened and
persisted dismissal in localStorage, without explicit focus trapping/Escape.
It also contained claims and video targets that are not the current governed copy.

This adaptation retains the compact visual pattern and uses native `dialog` with
an explicit Tab wrap, Escape/cancel handling, focus restoration, stable header,
independent content scrolling and reduced-motion support. It opens on demand;
it does not restore the old unsupported scientific claims or dismissal storage.

## One homepage client

- `Explore the six questions` beside the direct public-video action opens landing.
- Homepage cards 1–5 open their selected journey immediately in the same dialog.
- All questions returns to the motorcycle landing without destroying the frame.
- Card 6, on either surface, navigates directly to `.org/review-tools/`.
- Homepage authored anchors supply both menus' labels, subtitles and destinations.
  Existing native entry mapping and governed reading contexts remain in
  `common/home-journeys.js`; no new route service is introduced.
- The current image and video URL are read from the homepage, not copied assets.
- Existing `?journey=...&route=...#audience-routing` sign-in returns still reopen
  the selected journey. No auth/session identifiers are placed in URL state.
- One iframe is retained across topics, All questions, Close and reopening. Native
  session authorization/accounting remains entirely with the existing broker.
- A strict origin **and frame-source** check accepts the existing parent messages.
  New `hs-escape` is emitted only by the trusted .com CX embed, carrying no data.

## Boundaries

Anonymous or native-disabled visitors use the existing free broker guidance.
If the broker cannot load, local governed summaries and reading links remain.
No private Ask Evidence, NSMAEP form, account or Registry content is added here.
The legal introduction distinguishes Troy's personal transportation history from
documented, setting-specific decisions; existing Legal/Equality bodies are unchanged.
Sources remain the public `/access/`, `/case/` and `/story/` records.

No native/Ask Evidence call or email is required for this presentation release.
The small portal keyboard bridge reuses its existing scale-to-zero service;
no auth, agent, database, IAM, budget or scientific configuration changes.

## Verification

`tests/guided_modal.spec.js`: landing/video, five entries, All questions, .org
handoff, offline fallback, return URL, one-frame reuse, forged-message rejection,
focus/Tab/Escape/body scroll and screenshots at all five configured viewports.
The portal's site-ownership browser tests exercise the actual embedded client
with anonymous and approved synthetic mocks, not billable native sessions.

Existing homepage/footer/scientific-invariance tests are retained. Release snapshot
must exclude pre-existing uncommitted homepage copy edits. Do not stage those edits
merely to make local worktree and deployed bytes match.
