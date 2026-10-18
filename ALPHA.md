# CtrlF Video — Alpha handoff

Prepared October 18, 2026 (JST). This is a desktop **alpha candidate for a guided demo and supervised evaluation**, not a claim of production readiness or validated UX-research value. Check the latest main CI deployment result for the hosted revision. The original separate workspace remains untouched.

## What a visitor can do

- Open the recorded Gemini example without signing in, replay its actual source citation at 00:01.001, write a finding, save in the browser and export Markdown, JSON or HTML with an evidence image.
- Explore synthetic preset conversations, follow their source timestamps, organize evidence on Canvas, edit findings and export a report. These answers are visibly labeled and incur no model calls.
- Upload authorized footage for bounded preflight and private playback, retain a question draft, rename/delete sources, and return to saved investigations. The upload dialog states the size limit, analysis access and retention before sending the file.
- Use Quick guide from Home or the workspace menu. Review remains one video above the conversation; Canvas is optional.

New analysis of uploaded footage requires an approved session. Current model grants are closed. Uploading does not grant analysis access or start a paid request. There is no public enrollment, account login, cross-device recovery, audio transcription or multi-recording aggregation.

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

1. **0:00–0:20 — Problem.** “CtrlF Video turns a visual question into a moment you can replay and a finding you can check.” Open the recorded example. Identify it as a saved real Gemini test on a sports technical sample, not a UX study or a live request.
2. **0:20–0:50 — Verify.** Read the scoreboard answer. Open Still to verify, then replay 00:01.001 and surrounding footage. Show that the result remains partial and sampling is not exhaustive.
3. **0:50–1:25 — Make a finding.** Write an observation, or explicitly copy the existing human review and label it as such. Keep interpretation and open questions separate. Save the finding.
4. **1:25–1:50 — Deliver.** Export HTML with evidence. Explain that the JPEG travels with the report while original video playback needs its source link. JSON and Markdown retain the source references too.
5. **1:50–2:00 — Scope.** “Next validation is an authorized UX recording with manually checked events. Fresh uploads currently support playback; new Gemini analysis requires a funded session.”

Use Menu → Demo library for a separate interactive demonstration of follow-ups and Canvas, explicitly labeled as preset responses. Do not present that sequence as a new Gemini run.

## Client evaluation boundaries

Start with a short, non-sensitive recording the evaluator has permission to process. The gateway supports up to 30 MiB; direct local use supports up to 500 MiB. Analysis sends sampled JPEG frames and text to Google; the original video stays on the backend. A browser cookie owns private access. Clearing cookies loses access. Default retention is 24 hours, shown before upload; exports are the user's portable copy, not a cloud sharing feature.

Save failures and revision conflicts require recovery before navigation that would replace work. Upload is blocked until the current investigation saves. Export current work before expiry. Delete sources through the library when no longer needed. Broad client privacy, commercial operating terms, long-term availability, model quality and support commitments are not established by this alpha.

## Release gates

The user authorized review of PR #2 and one additional alpha deployment attempt on October 18. This is cumulative attempt 26, with all previous records retained and the candidate pinned to its reviewed commit. The JPY 3,000 total and October 19 cutoffs remain unchanged. No new models, grants, resources or hosting extension are included. See the latest main CI deployment result for completion and [deployment controls](docs/deployment.md#release-process-and-cicd) for the exact operator gate.

The public recorded example remains available only while the existing temporary deployment runs. Model validity ends October 19 at 22:00 JST; hosting authorization ends at 23:59 JST. The existing backup/cleanup process must remain in place. Continued judge/client access needs a new hosting agreement and finite budget.

Hackathon registration, roster, exact submission cutoff, final category, source-lineage eligibility and source-publication authorization remain unresolved. See [hackathon.md](hackathon.md), [provenance](docs/provenance.md), [deployment](docs/deployment.md) and [TODOS](TODOS.md). No submission, public repository release or organizer communication is implied.

## Verification

The alpha pass covers landing/Review navigation, recorded-source replay, finding save/refresh/export, synthetic conversations, private upload/preflight/playback, retained drafts, library recovery and desktop layout. Regression suites cover ownership, CAS, generations, cancellation and budgets. Exact results and remaining limitations are recorded in [alpha QA](docs/ALPHA_QA.md).
