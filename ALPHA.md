# CtrlF Video — Alpha handoff

Prepared October 18, 2026 (JST). This is a desktop **alpha for a guided demo and supervised evaluation**, not a claim of production readiness or validated UX-research value. Reviewed commit `1a980ae` is deployed at [ctrlfvideo.com](https://ctrlfvideo.com/); [main CI](https://github.com/zipking1988/ctrlf-video/actions/runs/39100631476) passed. Upload is the primary entry. Real whole-video results expose their own source-linked observations and a visible contextual follow-up action. The original separate workspace remains untouched.

## What a visitor can do

- Open a prepared six-section review of the 70.2-second basketball excerpt without signing in, compare the 62 → 61 score-display revision, replay its source and download the review. Codex source-frame inspection is explicitly separate from the saved Gemini test.
- Open the original Gemini test below the review, replay its actual source citation at 00:01.001, write a finding, save in the browser and export Markdown, JSON or HTML with an evidence image.
- Explore synthetic preset conversations, follow their source timestamps, organize evidence on Canvas, edit findings and export a report. These answers are visibly labeled and incur no model calls.
- Upload authorized footage for bounded preflight and private playback, retain a question draft, rename/delete sources, and return to saved investigations. The upload dialog states the size limit, analysis access and retention before sending the file.
- Use Quick guide from Home or the workspace menu. Review remains one video above the conversation; Canvas is optional.

New analysis of uploaded footage requires an approved session. On October 18 a single current browser owner received the explicitly authorized JPY 2,000 / 60-call / eight-index-call grant within a JPY 5,000 aggregate ceiling. Actual five-minute analysis and three contextual follow-ups are pending a concrete real input file; setup readiness is not live acceptance. Uploading does not grant analysis access or start a paid request. There is no public enrollment, account login, cross-device recovery, audio transcription or multi-recording aggregation. See [live test limits](docs/LIVE_GEMINI_TEST.md).

## Local preview

Use Python 3.13, the committed lockfile, Node 20+ and FFmpeg/ffprobe:

```sh
make setup
npm ci --ignore-scripts
npm run build
make run
```

Open `http://127.0.0.1:8765/#start`. Default fixture mode makes no model requests. To isolate evaluation data, set a fresh private `CTRLF_DATA_DIR` before starting the server. Run only one API/worker process per storage directory. Do not copy another user's session or media into it.

## A 2-minute demonstration

1. **0:00–0:27 — Sequence.** Open Explore the clip review. Explain its six chronological sections and the displayed lead change. Identify the prepared Codex review and the separate historical Gemini test.
2. **0:27–0:46 — Verify a change.** Compare Atlanta 62 at 00:36.036 with 61 at 00:37.037. Click both source citations. The display changes; whether it reflects an official correction or a graphic error is unknown.
3. **0:46–1:16 — Keep the evidence.** Read the sequence and limits, then download the review. Open the original Gemini finding/report separately to demonstrate editable notes.
4. **1:16–1:34 — Your recording.** Show the upload disclosure and editable whole-video draft starter. Explain the 5:50 limit and the indexed-source/funded-session prerequisites.
5. **1:34–2:01 — Scope.** Automated first-use and recovery tests passed. Fresh whole-video Gemini quality and actual first-time human comprehension remain unverified. Return to the source comparison.

Use Menu → Demo library for a separate interactive demonstration of follow-ups and Canvas, explicitly labeled as preset responses. Do not present that sequence as a new Gemini run.

## Client evaluation boundaries

Start with a short, non-sensitive recording the evaluator has permission to process. The gateway supports up to 30 MiB; direct local use supports up to 500 MiB. Analysis sends sampled JPEG frames and text to Google; the original video stays on the backend. A browser cookie owns private access. Clearing cookies loses access. Default retention is 24 hours, shown before upload; exports are the user's portable copy, not a cloud sharing feature.

Save failures and revision conflicts require recovery before navigation that would replace work. Upload is blocked until the current investigation saves. Export current work before expiry. Delete sources through the library when no longer needed. Broad client privacy, commercial operating terms, long-term availability, model quality and support commitments are not established by this alpha.

## Release gates

PR #2 merged into private main and attempt 26 deployed `9d2dad0`. The user then explicitly raised the aggregate ceiling to JPY 5,000, authorized a fresh finite model grant and three further deployments, retaining all 26 records. Attempt 27 successfully deployed `1a980ae`; two reviewed attempts remain under cumulative limit 29. The new grant is for one confirmed current session only. All October 19 cutoffs remain unchanged. See [main CI](https://github.com/zipking1988/ctrlf-video/actions/runs/39100631476) and [deployment controls](docs/deployment.md#release-process-and-cicd).

The public recorded example remains available only while the existing temporary deployment runs. Model validity ends October 19 at 22:00 JST; hosting authorization ends at 23:59 JST. The existing backup/cleanup process must remain in place. Continued judge/client access needs a new hosting agreement and finite budget.

Hackathon registration, roster, exact submission cutoff, final category, source-lineage eligibility and source-publication authorization remain unresolved. See [hackathon.md](hackathon.md), [provenance](docs/provenance.md), [deployment](docs/deployment.md) and [TODOS](TODOS.md). No submission, public repository release or organizer communication is implied.

## Verification

The alpha pass covers landing/Review navigation, recorded-source replay, finding save/refresh/export, synthetic conversations, private upload/preflight/playback, retained drafts, library recovery and desktop layout. Regression suites cover ownership, CAS, generations, cancellation and budgets. Exact results and remaining limitations are recorded in [alpha QA](docs/ALPHA_QA.md).

### Whole-video review follow-up

The example now opens a prepared six-section review of the entire 70.2-second
basketball clip, including the verified 62 → 61 score-display revision and
source replay. Its Codex editorial provenance is distinct from the saved Gemini
scoreboard test below it. Download clip review keeps the sequence, citations and
limits together.

For funded, indexed uploads, **Draft a whole-video breakdown** prepares an
editable request for complete-range sampling up to 5:50. It never auto-sends or
overwrites an existing draft. Output retains unfinished ranges and sampling
limits; fresh live whole-video quality remains unverified. The automated first-use
walkthrough passed, but an actual first-time human study remains open.
