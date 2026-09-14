# Homepage front-door restructuring

## Before (2026-09-13 working-tree inventory)

Visible order: hero, six audience/path links inside the hero, Visual Evidence
(`#visual-evidence`), centered contact/donation footer with full description.
Hero: “Skates are the mobility aid. Functional mobility is the evidence.”

The authored sections below remained in the file but were commented out:
`#audience-routing` (older duplicate), `#continuity`, `#pain-function`,
`#core-evidence`, `#hillsdale`, `#why-controlled-rolling`, `#recognition`,
`#requested-change`. Historical Core cards, accessible table, source references,
and Observatory handoff were present inside those comments.

Existing media authority: `common/images/HandicapSkater-H2-Skates.png`, the
Smart & Final Reddit video linked from `/videos/`, and motorcycle context on
`/story/` and `/access/`. Reuse these; no new asset or factual authority.

Existing buttons were ordinary navigation links, not six automated CX
conversations. The private reviewer Ask Evidence supports `?view=ask`, but does
not initialize its question from URL parameters. Live inspection confirms the
public `evidence.handicapskater.com` is a read-only graph/evidence browser, not
the Ask service. The .org `guided-review=start` query and local
uncommitted “Start guided review” button have no handler in the current script.
Use the working `/review-tools/#functional-intake` forms, without modifying them.

## After

Hero → motorcycle/skates image and explanation → six guided questions → Visual
Evidence → Then/Now → Measurements Add Context → historical Core → separate
prospective validation → Long-Horizon Function → preserved rolling/recognition
context → Observatory → .org review tools → preserved centered footer.

First five questions progressively disclose relevant reading choices and an
starting question for the existing governed Ask Evidence service, explicitly
labeled as requiring an authorized reviewer account. The working IAP URL is
linked only in that optional disclosure; public visitors retain all reading
paths and the public Observatory. Public automated CX requires a separate,
publication-safe service decision; private RAG is not exposed by this task.
No browser-generated scientific answer, automatic query, credentials,
or new backend. Links still work without JavaScript. The accommodation choice
goes directly to the .org functional-intake form in the same tab.

PVC-01 reuses the existing manifest-backed prospective reader behind a closed
details element. Six endpoints, source values, intervals, and qualifications
remain untouched. Historical N is not combined with prospective N. No
scientific computation or publication-resource regeneration.

Existing homepage evidence anchors and contents are restored, not replaced.
The former audience links remain reachable through the guided choices and
methods/record/standard links. Unrelated header, platform, and .org edits are
outside this change. GitHub Pages continues to publish `main` at repository
root; no hosting migration or GCP redeployment is needed.

The small-screen homepage header scrolls with the document, so it does not
obscure focused conversation headings; its links, labels, and shared source
remain unchanged. Social icons, donation, copyright, and the full footer
description are retained from the preceding homepage task.

## Publication gate (paused)

An intermediate version passed 29 focused Python checks and 60 Playwright
checks across five viewports. Later refinements corrected small-screen sticky
header occlusion, explicit focus scrolling, and the protected Ask handoff.
During the follow-up run, concurrent homepage edits re-commented all lower
evidence sections and changed the motorcycle paragraph. Those edits were not
overwritten. The follow-up run was stopped; its failures are not a validation
pass for the current file. No commit, push, or deployment has occurred. Confirm
the desired evidence visibility/copy, then rerun the focused checks before
publication. Existing source links passed the static checker (23 public pages,
2 sampled maps, 557 map targets); public external links responded successfully,
and reviewer Ask correctly redirects unauthenticated visitors to sign-in.
