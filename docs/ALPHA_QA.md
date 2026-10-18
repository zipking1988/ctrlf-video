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
