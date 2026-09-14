# Homepage front-door restructuring

## Lifelong-mobility follow-up (2026-09-13)

The current user's longer motorcycle block is shortened from approximately
178 to 148 words across the complete hero (same HTML-stripping count). The
headline, prosthetic-mobility lead, image, pain link, removal/switching-mode
explanation and public video remain. The closing copy is now:

> Shop. Skate. Ride. Continuous mobility.
> The skates stay with me because the mobility need doesn’t end when I reach the motorcycle.

The lifespan/“mobility should evolve” discussion and redundant impact paragraph
move out of the hero into `/lifelong-mobility/`. The fourth of six cards changes
from “Why aren’t a wheelchair or paratransit enough?” to “What does this mean for
lifelong mobility?” with “Mobility should evolve with us”. Other cards retain
their behavior. Transportation remains reachable through the reading guide,
Story, Access, Evidence and existing destinations; no cohorts/resources change.

The card carries `HOMEPAGE_LIFELONG_MOBILITY`, but **does not start live GCP CX
yet**. Its six public reading choices and destination explicitly disclose that
the live journey is not connected. This fallback has no Ask Evidence action,
request API, account, registration or local NSMAEP link. The optional private
reviewer handoff on other existing cards remains unchanged.

The platform contains a deterministic native CES callback package, seven
controlled fixtures and synthetic tests under `deploy/gcp_cx/lifelong_mobility/`
and `packages/fsicss_agents/`. It is not a deployed conversation. Existing GCP
discovery found a shared seven-agent draft app, no public deployments, and
Science Agent wording requiring a separate public-readiness review. No shared
agent or access policy is changed. Public GCP activation requires approval of
that bounded review and verified server-side route isolation, logging and
abuse/cost controls; a browser-supplied agent ID is not isolation.

Reading and prepared CX distinguish kinematics/kinetics, on-body acceleration
proxies/internal force, mechanism hypotheses/measurements, and functional
lifespan/longevity outcomes. Mahar 1997 is qualitative skating-versus-running
context only; no new numeric peer-reference values. PVC-01 keeps all six
endpoint directions (5/5, 5/5, 5/5, 5/5, 5/5, 1/5), without family-level success
or pooled historical/prospective N. Public evidence resource bytes, hidden
homepage comments and the full contact/donation footer remain unchanged.

Validation and deployment results are recorded in the workspace task state.
The five pre-existing `test_next_scientific_phase.py` failures were reproduced
against a clean HEAD snapshot; those older assertions expect pages/navigation
already superseded before this task. They are not repaired as part of this work.

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

## Approved final presentation

Hero → motorcycle/skates image and explanation → six guided questions → centered
footer. On 2026-09-13 the user explicitly directed: “Keep the hidden-section
state.” Visual Evidence, Then/Now, Measurements Add Context, historical Core,
prospective validation, Long-Horizon Function, rolling/recognition context,
Observatory handoff, and final .org action remain intact in HTML comments.
They are not rendered or used as active homepage link destinations.

First five questions progressively disclose relevant reading choices and a
starting question for the existing governed Ask Evidence service, explicitly
labeled as requiring an authorized reviewer account. The working IAP URL is
linked only in that optional disclosure; public visitors retain all reading
paths and the public Observatory. Public automated CX requires a separate,
publication-safe service decision; private RAG is not exposed by this task.
No browser-generated scientific answer, automatic query, credentials,
or new backend. Links still work without JavaScript. The accommodation choice
goes directly to the .org functional-intake form in the same tab.

PVC-01 remains available on `/evidence/#prospective-validation`, using the
unchanged manifest-backed reader. Six endpoints, source values, intervals, and
qualifications remain untouched. Historical N is not combined with prospective N. No
scientific computation or publication-resource regeneration.

Existing homepage evidence source content is preserved but deliberately hidden.
The Historical Core choice now links to `/evidence/#mobility-biomechanics-evidence`
instead of the non-rendered `#core-evidence` anchor.
The former audience links remain reachable through the guided choices and
methods/record/standard links. Unrelated header, platform, and .org edits are
outside this change. GitHub Pages continues to publish `main` at repository
root; no hosting migration or GCP redeployment is needed.

The small-screen homepage header scrolls with the document, so it does not
obscure focused conversation headings; its links, labels, and shared source
remain unchanged. Social icons, donation, copyright, and the full footer
description are retained from the preceding homepage task.

## Validation history

An intermediate version passed 29 focused Python checks and 60 Playwright
checks across five viewports. Later refinements corrected small-screen sticky
header occlusion, explicit focus scrolling, and the protected Ask handoff.
During the follow-up run, concurrent homepage edits re-commented all lower
evidence sections and changed the motorcycle paragraph. Those edits were not
overwritten. The follow-up run was stopped; its failures are not a validation
pass for the current file. The user subsequently committed the homepage as
`8b5f7cd` and approved the hidden-section state. Follow-up tests now explicitly
require the sections to remain unrendered while checking their source presence,
six working journeys, and unchanged evidence-destination results.
Existing source links passed the static checker (23 public pages,
2 sampled maps, 557 map targets); public external links responded successfully,
and reviewer Ask correctly redirects unauthenticated visitors to sign-in.

The existing Evidence page has document-level overflow at some narrower widths
outside the PVC table. This task does not redesign that page. The prospective
table retains its own horizontal-scroll containment; the homepage is checked
for no document overflow at all five requested viewports.

Final focused checks: 29 Python tests; 65 Playwright cases across 390×844,
430×932, 768×1024, 1024×1366, and 1280×900. They cover source-preserved hidden
sections, all six entry paths, keyboard focus/return/Escape, clipboard denial,
no-JavaScript routes, reduced motion, footer, and source-parity endpoint rows.
Screenshot review preserved the user's copy and improved the dark-hero pain
link contrast. No TypeScript/application build is required for these static
HTML/CSS/JavaScript changes; GitHub Pages remains the deployment build.
