# CtrlF Video — Remaining Work

Updated: 2026-10-16. This is the current acceptance backlog, consolidated from obsolete planning/review documents. Checked local behavior and mock transports do not establish live acceptance.

## First-use-case validation

- [x] Begin the authorized [UX recording spec](SPEC.md); keep the sports video as a technical development sample only.
- [x] Implement saved task briefs, immutable submitted context, purpose labels and structured findings in reports.
- [ ] Obtain a playable local sports source; YouTube download returned 403. Follow [sample protocol](docs/SPORTS_SAMPLE.md).
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
- [x] Record the explicit JPY 3,000 authorization, JPY 600 shared model sublimit, conservative per-role maximum costs, finite attempts/validity and existing resource cutoffs.
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
- [ ] Reconcile actual cloud spend against the JPY 3,000 total; the 24-attempt CI backstop is an engineering setting, not a money meter.
- [ ] Verify containerized Linux decoding/file/network isolation and resource bounds without disabling protection before using that deployment target.
- [ ] Validate disk encryption, expiry/deletion, restart recovery, consistent backups and restoration without resurrecting deleted media.
- [ ] Test bounded concurrent query/ingestion workloads, cancellation/deletion races and capacity release on the target host.

## Quality, performance and UX

- [ ] Freeze reviewed annotations and instrument actual retrieval/model/result traces; retain missing/failed cases and human evidence reviews.
- [ ] Complete development-set commitment (>=10 videos/30 questions); disclose actual independent report-set size (goal >=30/100).
- [ ] Measure Recall@5 >=80%, full event coverage at IoU>=0.5 >=70%, schema >=99% and evidence support >=90%; targets remain unmeasured.
- [ ] Measure one-hour indexing <=30 minutes and query P95 <=15 seconds, including queuing/stages and separate completion rates/cold starts.
- [ ] Run hybrid-versus-vector and review-versus-no-review comparisons against frozen data. No ASR implementation exists; speech diagnostic/dual-channel experiments remain unsupported rather than silently passing.
- [x] Implement selected option 1 with English app UI, direct finding editing and readable exports; verify local desktop layout, save/restore and evidence replay.
- [ ] Rehearse keyboard focus, evidence/error states and the full real-recording workflow on the presentation machine.
- [ ] Record a verified real-flow backup demo; keep fixture/UI demonstration distinct from live quality proof.

See [ARCHITECTURE](ARCHITECTURE.md), [runtime](docs/WORKSPACE_RUNTIME.md), [evaluation](docs/evaluation.md), [deployment](docs/deployment.md) and [hackathon rules](hackathon.md).
