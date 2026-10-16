# CtrlF Video — Runtime and Workflow

Updated: 2026-10-17. Gemini-only implementation. The split GCP deployment now permits a limited real Gemini test for one explicitly approved browser session. A complete uploaded-synthetic-video pipeline and finding save passed; broad model quality, actual UX value and settled operating costs remain unverified. See [live test limits](LIVE_GEMINI_TEST.md). See [deployment status](deployment.md). Default `fixture` sends no model requests.

## Local workflow

Use `make setup`, `make preflight`, `make run` and open http://127.0.0.1:8765. The source library uploads and renames/deletes videos, performs bounded FFmpeg/ffprobe preflight, and supports private source playback. Analysis stays blocked until real prerequisites and budgets are met.

Investigation storage includes the latest 12 questions, up to eight findings, notes, layout, groups, paths, viewport, drafts and player position in local SQLite. Default retention is 24 hours. Ownership follows the `ctrlf_session` cookie; clearing it does not transfer an old investigation. There is no account-based cross-device sync.

The synthetic library uses a public 18-second static-scene demo. It demonstrates the UI and contracts; it cannot answer uploaded-source questions or establish model quality. New visitors see a product entry with an actual screenshot and a source-linked example first, with this labeled demo primary and recording upload secondary. Returning work restores directly. The entry's upload uses the same owned upload/preflight path and does not start model analysis. A demo starter desk is initialized for ownership/saving, without dispatching a model request.

## Trusted Gemini configuration

Copy [runtime.example.json](runtime.example.json) to private storage outside Git. It is intentionally blocked: Google media consent is off, calibration references are empty, validity is expired, model/revision fields require verification, and cost `1` is a placeholder rather than a price or approval.

Before live dispatch, independently complete these prerequisites:

1. Verify account-accessible Gemini model IDs/revisions, image/JSON support, embedding bounds and actual maximum-cost inputs/outputs.
2. Supply backend-only `GEMINI_API_KEY` through the server environment. Never write it to browser code, runtime JSON, Git, deck or chat; `.env` is not automatically loaded.
3. Deliberately set `allow_google_media=true`, permitting bounded locally decoded JPEGs to Google's fixed Gemini API origin. Original video remains on the backend. Review account data-use terms and start with authorized nonprivate footage.
4. Obtain explicit finite currency/money/primary-call/model-call and calibration authorization, with validity and supplier spending/cutoff evidence. HTTP timeouts and billing alerts do not establish a hard supplier cap.
5. Record matching active deployment `*` and session-owner approvals through the trusted local budget tool. Runtime configuration cannot install them.

Four model roles are required: vision, embed, rerank (Gemini relevance selection) and text. `provider` defaults to and only accepts `gemini`. No ASR provider is accepted. Audio questions return `audio_channel_unavailable`.

```sh
CTRLF_RUNTIME_FILE=/absolute/private/path/runtime.json make preflight
CTRLF_RUNTIME_FILE=/absolute/private/path/runtime.json \
  CTRLF_VIDEO_MODE=real make agent-check
```

Both checks are read-only and make no model calls. `preflight` reports open deployment acceptance and exits 2 in real mode even when locally configured. `agent-check` dynamically checks local prerequisites; pass `--owner EXISTING_OWNER_ID` to `uv run python -m ctrlf_video.readiness` to read existing approval readiness. Passing does not prove live quality, billing or deployment.

## Approved-budget operator interface

Budget fields: scope/version/approval_reference/primary_calls/model_calls/money_units/currency_unit. Money is integer micro-currency (for example `USD_MICRO`). Both owner and deployment scopes reserve atomically; unknown/dispatched calls retain charges. Cache-only ingest resumes still need active approvals.

The commands below describe an operator action only after numeric authorization; they are not automated setup:

```sh
uv run python -m ctrlf_video.budget_admin show
uv run python -m ctrlf_video.budget_admin install --file /private/approved-records.json \
  --scope APPROVED_OWNER_ID --confirm-approved-reference APPROVAL_REFERENCE
uv run python -m ctrlf_video.budget_admin revoke --scope APPROVED_OWNER_ID --version APPROVED_VERSION
```

`budget_admin show` opens/initializes the local ledger; use `make agent-check` for a non-creating readiness check. Browser/API operations cannot install approvals. Increasing a cap requires a fresh approved version and revoking the prior unused allowance. For fully ready indices only, trusted `query_index_budget_versions` can list up to eight explicitly approved predecessor versions (default empty). Provider and all model/revision identities must still match; new queries charge only the current grant. Old manifests, frozen ingest configuration and all reservations remain unchanged. This exception never authorizes spending or resumes old ingestion; other incompatible changes require a new index generation.

## Authorized real smoke, still pending

After separate authorization and configuration, start one real backend. Upload a short video with manually known visual answers; use <30 MiB for the prepared Cloud Run ingress. Inspect previews, start analysis and wait for a complete ready index. Ask a visible-fact question, verify every cited source frame/time, then select it and ask a follow-up. Pin a finding, compare frames, export, refresh and restore.

Also test unsupported/uncertain questions, audio rejection, cancellation and owner isolation. Record actual model/revision, provider outcomes/usage/billing, tested sample size, latency and evidence mismatches. Never substitute fixture results.

Limits remain: 120-second windows/5-second overlap; 1 FPS/128 frames per visual review; <=100 complete embedding windows; <=19 MiB inline requests; 4,096 output tokens/4 MiB responses; three visual attempts and one repair. Unknown results never automatically resend.

## Rename and storage

Current names: package `ctrlf_video`; settings `CTRLF_VIDEO_*`; runtime/infrastructure `CTRLF_*`; storage `.ctrlf-video-data/`; cookie `ctrlf_session`; header `X-CTRLF-CSRF`; browser globals `CtrlFVideo*`. Restart/reload after the rename. Old package/config/session names have no aliases. Existing private data remains untouched; default storage/session ownership is separate, and data must never be re-owned by a file copy.

See [configuration](configuration.md), [API](api.md), [errors](errors.md), [deployment](deployment.md), [ARCHITECTURE](../ARCHITECTURE.md) and [TODOS](../TODOS.md).
