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

- Frontend: **154 passed** (`npm test`).
- Backend: **234 passed, 1 skipped** (`make test`); the skip is Linux namespace integration on macOS.
- `npm run build` succeeded; generated bundle and asset hashes included.
- `make check` passed lint, formatting and exported-contract drift checks.
- `make preflight` confirmed fixture tools/contracts with zero model requests.
- `make agent-check` correctly exits 2 because no live runtime/budget is installed in this local fixture environment.
- `make eval-check` executes, but its diagnostic gate remains **NOT_ACCEPTED** with missing real results. It is not a quality pass.
- Browser: landing, Home/Review hash transitions, recorded example, source replay at 1.000999 seconds (the media representation of 1.001), Timeline open/close, finding edit/save/refresh, export, private-draft restoration, upload/preflight, source rename, synthetic no-result/error recovery and Canvas submission. Desktop checks include 1280×900, 1024×768 and 896×900. No new console errors remained after the deliberately invalid rename baseline was cleared.

The QA skill's provisional UI score is **89 → 100 for the tested categories only**: baseline Links 85 (navigation), Functional 76 (upload/draft/rename), UX 84 (transfer explanation/result recovery), Visual 92 (Canvas control), Console and Accessibility 100. Content/performance were not scored. Weighted denominator is 0.85; this score measures this limited defect pass, not overall product readiness. Save-conflict hardening was code/test-discovered and is not counted as an extra browser defect.

## Material limits

No paid model requests, spending approvals, cloud deployment, budget increase, new resources, public source release or hackathon submission ran in this pass. The most recent successful hosted CI is `49bb911`; the local changes require a newly reviewed release attempt after the consumed 25-attempt allowance. The JPY 3,000 ceiling and October 19 cutoffs remain unchanged.

Linux runtime isolation must be checked by the existing CI/target-host process. This macOS pass does not establish target-host load, billing, broad Gemini accuracy, UX-recording usefulness, client privacy/commercial terms, or long-term service availability. Registration/category/source-lineage and public-source prerequisites remain open. See [alpha handoff](../ALPHA.md) and [remaining work](../TODOS.md).
