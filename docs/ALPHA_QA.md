# October 18 alpha QA

Status: **DONE_WITH_CONCERNS** for the local candidate. This is not a production-release or model-quality acceptance. Testing used an isolated fixture workspace on macOS at `127.0.0.1:8766`; private operational recordings, grants and the original separate workspace were untouched.

## Changes and evidence

| Finding | Resolution | Verification |
| --- | --- | --- |
| Upload from Home left `#start` in the URL; refresh returned to Home | Entering an investigation now sets `#review`; hash navigation updates the visible view | Browser upload/refresh and navigation regressions |
| Browser accepted 500 MiB even through the 30 MiB gateway | Session header advertises the enforced cap; frontend rejects oversize files before transmission | Local/gateway ASGI integration, exact-cap and invalid-header tests |
| Upload did not explain analysis access or retention at the transfer point | Pre-transfer dialog shows access, server storage, Google transmission, retention and cap | Browser cancel/confirm; no automatic model analysis |
| Unindexed uploaded recordings promised a retained draft but disabled typing | Draft stays editable; submission remains gated | Browser Enter/refresh/source switching; regression verifies no question admission |
| Whitespace or failed source rename hid errors behind another dialog | Validate before PATCH and show recoverable errors inside the rename dialog | Browser whitespace/valid rename; network failure and stale-response regressions |
| Upload could continue after save returned false | Upload stops before transmission until save/conflict recovery | Suspended-save regression; ownership checks retained across awaits |
| Simplified Review hid failure guidance and unresolved scope | Visible recovery, Still to verify disclosure and non-exhaustive no-result explanation | Real recorded partial, synthetic failure/no-result browser checks, render regressions |
| Canvas Send control overflowed its narrow panel at 1024 px | Compact icon-only Send retains its accessible label and fits its grid column | Browser right edge 993 px inside 1024 px viewport; button successfully submits preset question |

Quick guide was added to Home and the workspace menu, including a route into the recorded example and preset library. Native dialogs preserve Escape and focus return. The selected Review layout and Canvas remain intact; no new dependency was added.

Screenshots and logs are private local artifacts in `.ctrlf-video-eval/alpha-2026-10-18/`. Key images: `screenshots/upload-reload-bug.png`, `upload-dialog-after.png`, `rename-error-before.png`, `rename-after.png`, `guide-after.png`, `failure-after.png`, `report-after.png`, and `canvas-composer-after.png`. These are verification artifacts, not shipped evidence frames.

## Checks

- Frontend: **155 passed** (`npm test`), including delayed rename success/failure isolation.
- Backend: **234 passed, 1 skipped** (`make test`); the skip is Linux namespace integration on macOS.
- Private pull-request [Linux CI](https://github.com/zipking1988/ctrlf-video/actions/runs/39044981822) passed for code candidate `92e4ed3`: **154 frontend and 235 backend tests passed**, including Linux media isolation and deployment recovery regressions. This was a test-only run; it did not deploy.
- `npm run build` succeeded; generated bundle and asset hashes included.
- `make check` passed lint, formatting and exported-contract drift checks.
- `make preflight` confirmed fixture tools/contracts with zero model requests.
- `make agent-check` correctly exits 2 because no live runtime/budget is installed in this local fixture environment.
- `make eval-check` executes, but its diagnostic gate remains **NOT_ACCEPTED** with missing real results. It is not a quality pass.
- Browser: landing, Home/Review hash transitions, recorded example, source replay at 1.000999 seconds (the media representation of 1.001), Timeline open/close, finding edit/save/refresh, export, private-draft restoration, upload/preflight, source rename, synthetic no-result/error recovery and Canvas submission. Desktop checks include 1280×900, 1024×768 and 896×900. No new console errors remained after the deliberately invalid rename baseline was cleared.

The QA skill's provisional UI score is **89 → 100 for the tested categories only**: baseline Links 85 (navigation), Functional 76 (upload/draft/rename), UX 84 (transfer explanation/result recovery), Visual 92 (Canvas control), Console and Accessibility 100. Content/performance were not scored. Weighted denominator is 0.85; this score measures this limited defect pass, not overall product readiness. Save-conflict hardening was code/test-discovered and is not counted as an extra browser defect.

## Material limits

No paid model requests, spending approvals, cloud deployment, budget increase, new resources, public source release or hackathon submission ran in the initial QA pass. Its hosted baseline was `49bb911`. The user subsequently authorized PR #2 review and exactly one further alpha attempt, cumulative 26. The JPY 3,000 ceiling and October 19 cutoffs remain unchanged.

The release review found and fixed one additional upload failure: after the source uploaded, a rejected investigation creation could hide the recovery notice because creation advanced its own navigation epoch. Regression coverage now includes successful completion, draft-preserving recovery through Sources, and suppression after actual navigation. The operator release gate pins a reviewed commit and permits only the exact reviewed before/after hashes for the additive session header in `routes.py`; other protected files remain frozen. No model grant changes are part of this release. Final deployment evidence belongs to the corresponding main CI run.

Linux namespace isolation passed on the CI runner. This does not establish containerized deployment isolation, target-host load, billing, broad Gemini accuracy, UX-recording usefulness, client privacy/commercial terms, or long-term service availability. Registration/category/source-lineage and public-source prerequisites remain open. See [alpha handoff](../ALPHA.md) and [remaining work](../TODOS.md).

## October 18 whole-video / first-use follow-up

The user rejected scoreboard-only product framing. This follow-up adds explicit
whole-video sampling for clips up to 350 seconds, a prepared source review of the
complete public 70.2-second excerpt, and a visible draft starter. The prepared
review is attributed to Codex source-frame inspection; it is not relabeled as a
Gemini result. The original saved Gemini answer/history remains separate.

Review found and fixed three retention defects: real decoder errors dropping
prior evidence, the first-100-event cap excluding the final window, and
unknown/cancel recovery omitting unfinished ranges. Checkpoints now retain
sampling/coverage warnings and observed uncertainty. UI review fixed starter
visibility after existing answers and replay scrolling under reduced motion.

Validation on macOS: 254 backend tests passed with one Linux-only isolation
check skipped; 162 frontend tests passed; lint, formatting, contract exports and
asset build passed. Native decoding of a 300.167-second synthetic clip reviewed
0–120, 115–235 and 230–300.167 seconds with 120/120/71 frames. Each serialized
image payload was under 19 MiB; no model was called. This proves bounded media
handling, not model-quality performance.

A fresh-browser automated first-use walkthrough passed: entry without sign-in,
six chronological review sections, precise 36.036/37.037-second source seeks,
actual Markdown download with provenance, original Gemini finding save/export,
upload disclosure, empty-draft starter, existing-draft preservation and restore
on refresh. Desktop widths 1024/1440/1920 had no horizontal overflow or page
errors. This is an automated walkthrough, not a study with a new human user.

New live whole-video quality testing remains unrun because all existing model
grants are revoked. No model funding, cap, expiry, private-media permission or
hosting extension was changed. The single additional deployment attempt remains
bound to the final reviewed SHA; main CI determines its actual deployment result.

## Final deployed verification

PR #2 merged to private main at `9d2dad07d853aafada54e311f80fc399d97aab05`.
[Main CI 39089788904](https://github.com/zipking1988/ctrlf-video/actions/runs/39089788904)
passed 162 frontend and 255 Linux backend tests and deployed both components.
The release manager reports `committed`, with 26 retained attempts out of 26.
The operator verified unchanged financial-ledger and runtime hashes, 39 retained
model attempts and zero active grants. Release count is not a billing balance.

A fresh production browser at `https://ctrlfvideo.com/#example` passed no-sign-in
entry, all six review sections, exact before/after source seeks, real Markdown
download with provenance, and original Gemini finding save/report opening.
The session endpoint returns the 30 MiB cap and `real_ready: false` with
`budget_not_approved_or_insufficient`. This is a funding gate, not a cloud IAM error.

The release backup was downloaded privately and restored into local scratch.
All 30 file hashes and both SQLite integrity checks passed. Its SHA-256 is
`8ebed0203d829208f1c8e054502cdbc127d76bc3fa04b2a7ca8a1848207a2456`.
The final cutoff backup/cleanup process is still required for later writes.

The updated 14-slide editable presentation passed package, layout and native-table
validation and visual inspection. The captioned UI demonstration is 120.62 seconds
at 1280×720, with local synthetic narration and no paid media generation. Both
remain private local deliverables under `.ctrlf-video-eval/alpha-2026-10-18/`.
Neither artifact claims fresh Gemini whole-video quality or a human usability study.

## Local finding-first follow-up

The user identified an empty finding form and no useful question entry in the
recorded example. The local candidate now begins with three evidence-linked
findings, direct save/export, a contextual question box, and a collapsed full
review. Question results are verbatim prepared excerpts, visibly labeled as
local lookup with live Gemini off. They do not establish intelligent free-form
model answering. The original finding editor preloads the reviewed finding only
when its draft is empty, and has explicit accessible textarea labels.

167 frontend tests and the generated-asset build passed. Focused regressions cover
exact source-time ranges, adjacent-section context, unknown identity/audio,
out-of-range times, stale/tampered storage and report provenance. Browser checks
verified contextual English/Chinese questions, exact source seeking, saved-note
export, draft preservation, refresh restoration and the prefilled legacy editor.
One automation run stopped on an overly exact textarea label lookup after the
prefill; explicit labels corrected that issue and the editor was rechecked in
the in-app browser. This is not a human usability study.

No backend/model dispatch, funding change or deployment occurred. The production
revision remains `9d2dad0`, and the 26/26 release allowance remains consumed.
True live conversation remains an unmet acceptance requirement.

## Local example-to-workspace entry

The follow-up candidate now separates local note lookup from a path into the
existing real analysis workspace. Preparing the example fetches only the fixed
public MP4, enforces a 30 MiB stream bound and verifies its SHA-256 before opening
the normal upload disclosure. The user's question is handed over as a draft.
Navigation cancels preparation; public notes are not private context anchors;
drafts typed during investigation creation are preserved. No model is dispatched
by preparation or upload.

All 173 frontend tests, `make check`, the generated build and whitespace checks
passed. New regressions cover changed media, type/size rejection, cancellation,
initial-draft persistence, concurrent typing and late navigation. In-app browser
checks confirmed cancel/re-entry retains the question, explicit local upload
creates the owned source investigation, and refresh restores the question draft.
The UI correctly shows live questions off in this fixture session. This does not
verify model analysis or answer quality.

A read-only cloud check again confirmed deployed `9d2dad0`, 26/26 release records,
zero active model grants, 39 retained model attempts, unchanged financial/runtime
hashes and the verified two-database backup. Cloud access works with the explicit
personal account, project and billing-project flags documented in the deployment
handoff. The remaining gate is finite model/release authorization, not missing
IAM access. No funding, model call, release or cloud resource changed. The deck
and demo continue to describe the deployed version, not this local candidate.

## Funded real-alpha deployment (October 18)

The user approved JPY 5,000 aggregate spending, a fresh JPY 2,000 / 60-attempt /
eight-index-call grant, and three more deployments (29 cumulative). After the old
session expired, the user confirmed binding the sole new grant to the current
named browser workspace. The grant is installed; all historical attempts remain.
The project billing alert amount alone changed to JPY 5,000.

Private main `1a980ae` deployed successfully as attempt 27 through
[CI 39100631476](https://github.com/zipking1988/ctrlf-video/actions/runs/39100631476):
173 frontend tests and 255 Linux backend tests passed. Production HTML, browser
bundle, CSS and persistence module matched the reviewed local files byte-for-byte.
The server reports committed, 27/29 releases, 39 retained historical model
attempts, and zero calls/primary calls/money used by the fresh grant. The browser
readiness page confirms configuration and session/deployment budget prerequisites.
The grant backup restored locally: all 34 files and both database checks passed.

Real whole-video answers now render their actual event observations with source
buttons and an explicit contextual follow-up action. Upload is the primary entry.
No live five-minute model validation has run: no actual five-minute source path
has been supplied. The real available basketball clip is only 70.2 seconds and
the five-minute decoder fixture is synthetic. Neither is substituted for the
requested acceptance; prepared-note search is not accepted as model conversation.

## Gemini vision / ai& Gemma text live trial (October 18)

The user-supplied key was installed privately and verified against ai&'s
organization catalog/pricing. Two full-window image calibrations failed and remain
unknown/charged; text and a single real frame passed. Production uses Gemini for
images/embeddings and Gemma for text, with fixed supplier roles and the same grant.
No source video or JPEGs reach ai& in this split. See [provider setup](AIAND_SETUP.md).

Attempt 28 deployed `7f5f14e`; final authorized attempt 29 deployed `0ffd59e`.
[CI 39131832940](https://github.com/zipking1988/ctrlf-video/actions/runs/39131832940)
passed 173 frontend and 268 Linux backend tests. Local verification passed 267
backend tests with one Linux-only skip, frontend tests, build and `make check`.
Production asset hashes match the reviewed build; configured mode, session and
persistence passed deployment checks. No release attempts remain.

The funded browser uploaded the actual public 70.203467-second basketball source
through the owned product flow, not the synthetic fixture. Real indexing, one
whole-clip question and three sequential contextual follow-ups completed. All
three follow-ups report `usedContext=true`; all four answers are `partial`.
Whole-source windows cover the source time range at bounded sampling. This
verifies live model integration and conversation, not factual completeness.

Accuracy acceptance failed. The first answers overstated score timing. Rechecks
notice a displayed decrease and retract 67 at 00:28, but still claim 62 at 00:14
(the independently decoded frame shows 59), contradict intervals and format
60.060 seconds as `01:00:06`. The requested game sequence/camera-cut explanation
remains inadequate. Original incorrect responses are retained. The human review
is explicitly labeled separately, citing actual 36.036/37.037 frames for 62 → 61;
it is not counted as model success. The actual five-minute input is still missing.

The report preview contains four questions, one human finding and 49 evidence
frames. JSON download reports started; its download file was not independently
located. Refresh restores the source, all four questions, finding and selected
context without new model requests. Ledger audit: JPY 751 reserved, 18 calls and
two initial indexing calls; JPY 1,249 / 42 calls / six primary calls remain in the
sole grant. Historical JPY 1,162 remains charged. Reservations are not settled
invoices. A consistent private backup restored locally: all 363 file hashes and
both SQLite integrity checks pass. Evidence and backup stay in ignored
`.ctrlf-video-eval/aiand-20261018/`; no complete MVP/client GO is claimed.

## Local prepared-review timeline annotation (October 18)

The annotated example's three-card overview was replaced locally by a wider
chronological timeline: six source sections and three findings anchored at their
first citations. Selecting a section/finding seeks the existing source player
and opens real evidence frames, observation, uncertainty and ask/save actions.
The playback marker follows native playback without changing the selected note.
Prepared-review authorship and existing evidence-only search remain explicit.

In-app browser checks verified section 6 via Enter, the 36.036/37.037 score
comparison, moving playback marker, uncertainty expansion, explicit question
context with unchanged draft, and finding persistence after refresh. The temporary
test finding was removed and the original saved selection/context/draft preserved.
All 173 frontend tests, build and whitespace checks passed. Before/after captures
are private local artifacts in `.ctrlf-video-eval/timeline-20261018/`. The main
browser viewport was 2614 × 1344. A temporary 1014px iframe also verified readable
layout and horizontal scrolling through the final section without widening the
page. The iframe wrapper and its local test server were closed after checking;
its native click targeting was unavailable, so section activation was verified
in the main tab. Details stack below 850px; that narrower layout was not checked.
No model call, grant change, push to main or deployment ran for this local edit.

## Local actual-result timeline and timing investigation (October 18)

The real-answer renderer now opens whole-video results with their source-linked
timeline and an evidence inspector, retaining generated prose in a disclosure.
Nodes use sorted actual frame times, retain overlapping claims separately and
describe a single citation as a point. They do not import the prepared review.
Previous/Next, keyboard activation, source seeks, last-frame access, question
switching, and Escape/trigger focus recovery passed in a read-only local replay
of all four unchanged actual model answers with checksum-verified archived frames.
The replay was explicitly labeled as saved output with known inaccurate claims;
it made no model calls and did not restore/re-own a private workspace.

The archived 14.014-second image shows Atlanta 59; the model's observation says
62. Image hashes agree across the four requests, and the adapter keeps each
frame's timestamp/image pairing. The false claim originates in visual model
output, not a shifted source image. Generated prose also still contains malformed
timestamps. This pass does not fix those semantic/model-quality failures.

A separate deterministic bug assigned every observation the full review-window
interval. The new regression failed on the prior implementation. Multi-frame
events now bracket their actual citations. Single-frame legacy intervals remain
for schema 0.1 compatibility and are explicitly rendered as points. Existing
stored results and budget records are unchanged. Full local results: 268 backend
tests passed, one Linux-only isolation test skipped; 175 frontend tests, build,
lint/format and contract checks passed. No cloud release or paid model request ran.
Evidence is private under `.ctrlf-video-eval/timeline-20261018/`; live accuracy,
five-minute acceptance and another authorized deployment remain outstanding.

## Reviewed release 30 production verification (October 18)

The user authorized exactly one additional deployment, 30 cumulative, with the
JPY 5,000 total and existing cutoffs unchanged. Reviewed `4ccee61` reached private
main and deployed both components through CI 39135948648. All 176 frontend and
269 Linux backend tests passed. The production frontend revision serves 100% of
traffic, its five checked public assets match the reviewed commit, backend state
is committed, and all 29 earlier release records remain intact.

The approved cloud browser restored the source, four saved actual answers,
follow-up context and human finding. The actual-result timeline displays six
observations and twelve citation moments from the selected retained answer.
Next selected its second observation and sought the paused source to 14.014s;
the actual frame still shows 59 against the retained incorrect model claim 62.
The release changes evidence presentation and bounds, not that model failure.
The prepared-review timeline and real-result timeline remain separate components.

Before/after audit equality and an isolated comparison of both consistent backup
ledgers establish that every historical budget and attempt row is unchanged.
This release added zero model calls. The fresh private backup restored locally
with 361 file hashes and two SQLite integrity checks passing. Runtime/environment
bytes, v4 usage (JPY 751, 18 calls, two primary) and cutoffs remain unchanged.
Production screenshots and audit receipts are ignored private artifacts under
`.ctrlf-video-eval/aiand-20261018/release30/`. Browser load-time/console telemetry
was not captured; HTTP health, exact revision/assets, functional UI and stored-data
checks are the verification evidence. Accuracy/client GO and real five-minute
acceptance remain outstanding. No further deployment is authorized.

The user's subsequent live question, "who throw the final ball ?", returned
after five completed model calls rather than hanging. Cache timestamps establish
at least 24.762 seconds after embedding completion; extraction/vision account for
20.957 seconds. The response cited 7.007s without verifying the final throw. Its
stored visual observation identifies a throw but not chronological finality.
This is a live temporal-grounding failure and an opaque progress experience;
it is separate from the successful release verification. JPY 109 additional
reservations belong to that user-submitted request, not deployment checks.

## Local candidate for waiting feedback and chronological questions

The final-ball response is retained unchanged. Read-only inspection of its cached
vision response shows one generic throw observation at 7.007s, with no evidence
that it was final. Its generic waiting text covered at least 24.762s after
embedding completion; extraction/vision accounted for 20.957s. This was a completed
request, not an unknown dispatch or missing configuration.

The local candidate adds elapsed waiting feedback every ten seconds, stops it on
completion/navigation, preserves edits made while awaiting the response, and
explains why the breakdown action cannot start during an active question. A
submitted first/last/final action question instead reviews the bounded source
chronologically, requests every matching action and orders returned actual
citations directly. It retains other observations and explicitly distinguishes
detected sampled order from actual finality, including single-frame motion limits.
No fixed basketball facts, cached-answer lookup or replacement of the old answer
is introduced. This path avoids embedding/relevance/planning/prose-synthesis calls,
reserving the visual-window cost and one possible syntax repair through both
existing ledgers. Limits and unknown-outcome protections remain unchanged.

The new regressions fail on the earlier behavior. Mock integration verifies
chronological evidence selection despite reversed model observation order, same-ID
replay without another call, and over-350-second rejection before dispatch. Unit
coverage checks prior-answer/numeric-range exclusions and single-frame limits.
Deferred-network regressions verify elapsed feedback, draft retention, one network
submission, timer cleanup and suppression after navigating to another investigation.
Local checks passed 270 backend tests (one Linux-only skip), 178 frontend tests,
targeted final-order/scope tests, lint/format/contracts, build and whitespace checks.
These establish code behavior with mocks, not fresh live model accuracy or latency.
The candidate remains local and undeployed because all 30 releases are consumed.
