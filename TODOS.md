# CtrlF Video — Remaining Work

Updated: 2026-10-19. This is the current acceptance backlog, consolidated from obsolete planning/review documents. Checked local behavior and mock transports do not establish live acceptance.

## October 18 alpha candidate

- [x] Add a client-facing Quick guide, upload access/retention disclosure and server-advertised upload limits.
- [x] Fix upload-to-Review refresh, hash navigation, unindexed draft editing and in-dialog rename recovery.
- [x] Surface unresolved scope and failure recovery beside answers; preserve evidence and model admission gates.
- [x] Obtain authorization for one additional reviewed alpha deployment attempt (cumulative 26); retain all 25 records and pin the reviewed commit. Main CI is the authoritative deployment result.
- [x] Deploy reviewed `9d2dad0` through main CI, verify public replay/download/finding export, and restore-check a private local backup of both databases. This consumed the then-authorized 26/26 allowance; the later 29-attempt authorization is recorded below.
- [x] Update the editable 14-slide deck and 120.62-second captioned UI demonstration locally. Publishing/submission remains separate.
- [ ] Fund any new model trial explicitly and agree client data/retention expectations; anonymous live analysis remains unavailable.
- [ ] Resolve the submission and UX-validation prerequisites below. See [ALPHA.md](ALPHA.md).

## ai& Gemma integration

- [x] Verify the public ai& catalog lists `google/gemma-4-31b-it` with vision/video capability; prepare a bounded inline-JPEG generation adapter through existing reservations.
- [x] Verify the supplied key and organization pricing; live structured text and single-image Gemma checks passed. Four calls reserve JPY 233 in the sole existing grant; both rejected 128-image attempts remain unknown.
- [ ] Resolve all-Gemma full-window input compatibility before activating that route; two 128-image cases failed. Production instead uses fixed Gemini vision / Gemma text, retaining coverage/attempt guards and the same grant.
- [x] Deploy the split (`0ffd59e`, release 29/29) and run actual 70.203-second source analysis plus three contextual follow-ups. All follow-ups used context; this verifies live integration only.
- [ ] Correct observed score readings/timing, contradictory findings and inadequate game-sequence analysis. The live trial failed accuracy acceptance. No deployment attempts remain authorized.
- [x] Locally trace the correct archived image/time pairing, fix multi-frame event bounds that incorrectly used the full review window, and render actual answers as source-linked timelines. Single citations remain points; existing model claims and stored records are preserved. Visual reading/prose errors still require separate live quality work.
- [x] Deploy the separately authorized reviewed timeline/readiness fixes as attempt 30/30 (`4ccee61`, CI 39135948648); verify exact serving assets/revision, source seeking, unchanged funding/results and a restored local backup (361 files, two SQLite checks). No model calls or cutoff changes were added.
- [x] Diagnose the subsequent final-ball question: five completed calls, JPY 109 reserved, at least 24.762s after embedding; an earlier match was accepted without finality. Build a chronological-ordering/uncertainty safeguard and elapsed waiting feedback, with mock regressions and zero extra paid requests during preparation. The subsequent live retest is recorded below.
- [x] Deploy reviewed `9ad193d` as separately authorized attempt 31/31; verify exact serving assets, unchanged source/five answers/ledgers, and a locally restored 438-file backup. One fresh real final-ball retest used one visual call (JPY 75), but still missed later actions; accuracy acceptance fails.
- [x] Preserve incorrect answers alongside a labeled human finding; verify four-question report preview, refresh and a consistent private local backup (363 file hashes, two SQLite checks). Browser JSON export initiated; its download file remains unlocated.

## Whole-video product value

- [x] Prepare and browser-check the October 19 local continuing-conversation UI: visible chronological turns, original saved replies, prior-turn follow-ups, retained draft and stable expanded replies. 181 frontend tests pass; no new model calls or deployment. The public saved example remains explicitly separate.
- [x] Fix the subsequent timeline/composer annotations locally: drag-to-pan, native ruler scrubbing, explicit unindexed status/acknowledgement and a current-source marker for duplicate names. 187 frontend and 270 backend tests pass (one platform skip); the pending-state browser check uses a labeled read-only UI simulation. No new model call or deployment.
- [x] Deploy reviewed `95d0842` as separately authorized attempt 32/32; verify actual status actions, current-source marker, exact serving assets and a restored 600-file backup. All 32 attempts are consumed.
- [x] Prepare the local frame-reference format recovery and failed-draft retention fix; replay the unchanged actual response against 71 sampled-file IDs, with all four observations retained and three format corrections disclosed. No new paid request or stored-answer rewrite.
- [x] Deploy reviewed `6d96727` under the separate 33rd-attempt authorization; CI passed 188 frontend / 280 Linux backend tests, exact assets and unchanged ledgers verified, backup restored (675 files / two databases). One authorized real retest returned partial with 21 references, but missed intermediate score changes. All 33 releases are consumed; no additional retest or attempt 34 is authorized.

- [x] Add a local finding-first example with direct save/export and contextual search of reviewed notes. This is not live AI conversation; it subsequently shipped in `1a980ae`.
- [x] Connect the public sample to the owned upload flow with a verified source copy and a preserved question draft. Confirm cancellation, upload and refresh locally; no analysis starts automatically. Deployed in `1a980ae`.
- [x] Install the October 18 JPY 2,000 / 60-call / eight-index-call grant for the explicitly confirmed current browser owner, preserving historical records; deploy reviewed `1a980ae` as attempt 27 of 29.
- [ ] Verify an actual five-minute video and at least three genuine contextual follow-ups. The concrete real input file is still missing. The shorter real trials now reserve JPY 1,145, 33/60 calls and 2/8 primary calls; preset notes and the synthetic five-minute decoder fixture cannot satisfy acceptance.
- [x] Add deterministic complete-range sampling for explicit whole-video breakdowns up to 5:50, within existing resource/model limits.
- [x] Preserve evidence and coverage gaps through later decode failures, output-cap selection and unknown/cancel recovery.
- [x] Replace scoreboard-only framing with a prepared full-clip source review, independently attributed from the original Gemini result.
- [ ] Validate fresh five-minute analysis against a fully annotated authorized source using the remaining sole v4 grant if actual preflight fits. After the release-32 lead-change trial, remaining capacity is JPY 964, 32 attempts and six primary calls; no new grant or deadline is implied.
- [ ] Run an actual first-time human study. Automated browser walkthroughs establish flow behavior, not human comprehension or researcher value.

## First-use-case validation

- [x] Begin the authorized [UX recording spec](SPEC.md); keep the sports video as a technical development sample only.
- [x] Implement saved task briefs, immutable submitted context, purpose labels and structured findings in reports.
- [x] Obtain and verify a playable local sports source; the uploaded NBA clip is a technical sample, not UX validation. See [live test evidence](docs/LIVE_GEMINI_TEST.md).
- [ ] Obtain the actual UX recording and participant task; manually annotate visible events before model testing.
- [ ] Verify short-lived interface states and small text under current sampling bounds before deciding the rebuild scope.
- [ ] Measure source-grounded findings and researcher review time separately from technical sample performance.

## Submission prerequisites

- [ ] Verify accepted registration, eligible 2–4-person roster and the final single dashboard category; Future of Work is recommended for the UX focus, replacing the earlier Media recommendation pending confirmation.
- [ ] Resolve source-lineage eligibility with the organizer; preserve true dates and [provenance](docs/provenance.md).
- [ ] Verify the October 18 deadline hour/timezone and current dashboard requirements.
- [ ] Obtain separate authorization for any public source release; review footage/dependency rights and event IP terms.
- [ ] Prepare English submission materials, a PDF deck and a public demo video strictly under three minutes.

## Live Gemini acceptance

- [x] Verify account-accessible generation/embedding IDs and revisions, live JSON/image dispatch and both embedding task types.
- [ ] Validate over-limit embedding inputs and a representative multilingual dataset against the real provider.
- [x] Record the explicit JPY 3,000 authorization, later JPY 1,245 cumulative model ceiling, retained historical reservations and finite per-role/attempt/time bounds. The October 17 one-question grant is complete and its grants remain revoked; the separately authorized October 18 grant is recorded above; see [live test limits](docs/LIVE_GEMINI_TEST.md).
- [x] Run one uploaded synthetic clip through real ingestion, retrieval, visual verification, synthesis, editable finding saving and refresh after a real-mode rollback.
- [ ] Resolve observed spatial wording errors (the first live answer called a left-of-center box centered); preserve source-linked human corrections.
- [ ] Run authorized ingestion -> question -> follow-up -> actual source evidence -> findings/export -> refresh/restore.
- [ ] Verify uncertain/negative questions, unsupported audio, malformed responses and cancellation against real provider behavior.
- [ ] Reconcile provider usage/billing with reserved/completed/unknown attempts, including failure and crash cases.

## Deployment and recovery

- [x] Create `ctrlfvideo` with project-scoped cost alerts and the user-authorized temporary test window.
- [x] Deploy the separate Cloud Run frontend and native durable GCE backend in fixture mode; verify cloud upload/playback, finding restoration, private TLS and native Linux file/network isolation.
- [x] Verify one live Gemini 3.1 Flash-Lite observation on a public synthetic JPEG; keep broad video quality and UX acceptance open.
- [x] Build both locked container targets; use the native backend until container decoder isolation is accepted.
- [x] Obtain explicit GCP project/resource/region/spending/shutdown authorization for the initial test window.
- [x] Validate Cloud Run ingress plus one durable GCE workspace, private token/HTTPS, cloud upload/playback and session/CSRF/Range integration tests.
- [x] Download a consistent initial local backup; verify its checksum, both SQLite databases, source media and private configuration.
- [x] Implement test-gated CI/CD, finite main-only deployment access, backend backup/restore checks and failure rollback regressions.
- [x] Record the successful hosted frontend/backend pipeline, live forced-failure rollback and independently verified local recovery backup; see [deployment evidence](docs/deployment.md#release-process-and-cicd).
- [ ] Reconcile actual cloud spend against the newly authorized JPY 5,000 total; the 29-attempt release backstop is an engineering setting, not a money meter.
- [ ] Verify containerized Linux decoding/file/network isolation and resource bounds without disabling protection before using that deployment target.
- [ ] Validate disk encryption, expiry/deletion, restart recovery, consistent backups and restoration without resurrecting deleted media.
- [ ] Test bounded concurrent query/ingestion workloads, cancellation/deletion races and capacity release on the target host.

## Quality, performance and UX

- [x] Implement a recorded real-test walkthrough for anonymous visitors: public source replay, browser-local findings and shared-renderer report exports, with the user's confirmed basketball demonstration permission. Independent judge access lasts only while the existing deployment runs; hosting beyond October 19 remains unapproved. See [judge walkthrough](docs/JUDGE_WALKTHROUGH.md).

- [ ] Freeze reviewed annotations and instrument actual retrieval/model/result traces; retain missing/failed cases and human evidence reviews.
- [ ] Complete development-set commitment (>=10 videos/30 questions); disclose actual independent report-set size (goal >=30/100).
- [ ] Measure Recall@5 >=80%, full event coverage at IoU>=0.5 >=70%, schema >=99% and evidence support >=90%; targets remain unmeasured.
- [ ] Measure one-hour indexing <=30 minutes and query P95 <=15 seconds, including queuing/stages and separate completion rates/cold starts.
- [ ] Run hybrid-versus-vector and review-versus-no-review comparisons against frozen data. No ASR implementation exists; speech diagnostic/dual-channel experiments remain unsupported rather than silently passing.
- [x] Implement selected option 1 with English app UI, direct finding editing and readable exports; verify local desktop layout, save/restore and evidence replay.
- [ ] Rehearse keyboard focus, evidence/error states and the full real-recording workflow on the presentation machine.
- [ ] Record a verified real-flow backup demo; keep fixture/UI demonstration distinct from live quality proof.

See [ARCHITECTURE](ARCHITECTURE.md), [runtime](docs/WORKSPACE_RUNTIME.md), [evaluation](docs/evaluation.md), [deployment](docs/deployment.md) and [hackathon rules](hackathon.md).
