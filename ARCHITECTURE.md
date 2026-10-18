# CtrlF Video — Architecture and Contracts

Updated: 2026-10-16. This is the current technical contract for the Gemini-default edition with an optional ai& Gemma adapter. The cleanup removes obsolete provider plans; it does not weaken evidence, ownership, resource or budget protections. Implementation status does not waive a requirement.

## System

```text
Desktop investigation canvas + source player
                  | owned HTTP operations
                  v
FastAPI + one worker process
  | SQLite investigations / requests / approved attempt ledger
  | bounded isolated FFmpeg decode + private source storage
  v
Gemini descriptions -> embeddings -> complete source manifest
  v
BM25 + vector retrieval -> Gemini relevance selection
  v
text planning -> bounded visual review -> validated answer + evidence
```

The package is `src/ctrlf_video/`. The default fixture path is synthetic and makes no model requests. Real media analysis uses native Gemini by default. An explicitly selected ai& adapter can use Gemma for generation while retaining Google text embeddings. No audio transcription or automatic provider fallback exists.

## Ingestion and retrieval

Preflight reads actual duration, dimensions, audio presence and frame timestamps. Prefer scene boundaries while enforcing windows <=120 seconds with 5-second overlap. Sampling uses decoded source PTS rather than invented evenly spaced timestamps.

When all remaining footage fits within 120 seconds, the final indexing window
ends at the actual duration. A scene near the last decoded PTS must not create
another paid window for a fractional-frame tail plus the overlap. Existing
indices and financial reservations are preserved.

Coarse description samples 8–16 frames per window, validates a complete one-to-one frame/caption mapping and checkpoints by generation. Embed every complete source window; a synchronous batch currently supports at most 100 windows. Oversized sources are rejected before ingestion model calls, not truncated into a partial ready index. Embedding requests disable automatic truncation.

Publication requires complete visual segments, vectors and existing evidence files under the current generation. Failures/cancellation cannot publish readiness. Cached work and frozen configuration must match exactly; no old-provider/checkpoint defaults are inferred.

Queries bind context to an owned, current video/generation and verified prior answer. Combine BM25 and vector rankings, then use Gemini to select relevant candidate descriptions. This is relevance selection, not a dedicated reranker with calibrated scores. Text planning selects at most three visual review windows. All initial/expanded/retried visual review attempts share the three-attempt limit; at most one syntax repair is allowed. Provider/model/revision changes invalidate query reuse. Budget rollover can explicitly allow ready indices from at most eight predecessor budget versions through trusted `query_index_budget_versions`; all new query admission and attempts use the current approved owner/deployment grant. Original manifests, ingest checkpoints and financial history remain unchanged. Ingest resume still requires an exact frozen configuration match; the query compatibility list cannot resume or replay ingestion.

An explicit whole-video prompt (`Break down the whole video.`, `Break down the entire video.`, or `拆解整段视频。` at the beginning of the submitted question) instead chooses deterministic complete-range windows, bypassing embedding/relevance/planning. Scope is never inferred from retrieved content or task context. Clips over 350 seconds are rejected before any model call; the existing three visual-attempt, 120-second window, 1-FPS and single syntax-repair bounds remain unchanged. Admission reserves the conservative visual-window plus synthesis/repair bound against both existing grants. Each window reserves a share of the 100-event output cap; overflow selection is disclosed and preserves chronology including the final window. Partial checkpoints retain uncertainty, completed-window counts, sampling limits and unreviewed ranges so unknown/cancel recovery cannot look complete. No output schema or ownership contract changes. This path has mock regression coverage; fresh live quality validation remains open.

An empty relevance-selection list falls back to the highest hybrid candidates up to `rerank_k`, before the existing three-window visual-review limit. Sparse descriptions cannot establish visual absence. Invalid relevance or planning indices still fail validation; the fallback does not add model retries or bypass budget admission.

Planning requests use Gemini's structured output with a required `inspect` array of integers, and explicitly separate window selection from answering the user's question. Server-side validation still rejects missing fields, noninteger/out-of-range indices and more than three selections before any visual review. A valid JSON answer to the research question is not accepted as a plan or as evidence. The optional schema is included in the existing request fingerprint and bounded syntax repair; ingest requests are unchanged.

Synthesis receives the validated source frame IDs with their decoded `t` and `t_hms`, alongside each observation. Review-window `start`/`end` remain separate and are not frame timestamps. This preserves the precise source time across the visual-review-to-summary boundary; it does not establish model semantic correctness.

Local timing correction after the October 18 live audit: a published observation
with multiple distinct cited times uses their minimum/maximum for event bounds,
rather than the entire review window. These bounds bracket evidence, not verified
continuous action. Schema 0.1 requires `end > start`, so a single-instant observation
retains its legacy review scope in those fields. Clients place it at `evidence.t`
and explicitly state that no event duration is established. Existing stored answers
are not rewritten. The source timeline always uses cited frame times, including
older results whose event bounds span the search window. This correction remains
local; deployed `0ffd59e` has not changed.

Follow-up context contains untrusted prior model claims with validated source
references; reference validation does not verify their factual truth. Visual
review must re-check contradictions against current frames. Visible text/counter
changes need before/after values tied to individual frames, and synthesis must
not present an interval’s final state as already true at its first frame. Answers
use plain text and source timestamps rather than internal frame IDs.

## Gemini transmission and dispatch

The optional ai& Gemma path is described in [ai& setup](docs/AIAND_SETUP.md).
It sends generation requests only to `https://api.aiand.com/v1`, with distinct
`allow_aiand_media` consent and `AIAND_API_KEY`; embeddings retain Google's
text-only endpoint and credential. Both routes share the same atomic ledger,
ownership, time, media and response bounds. Large-batch ai& calibration failed,
so this path remains inactive in production. The following native Gemini rules
continue to govern the default deployment.

Only `https://generativelanguage.googleapis.com/v1beta` is accepted. Trusted runtime configuration must explicitly set `allow_google_media=true`, supply fixed verified models/revisions, backend key references, conservative per-role cost bounds and valid calibration/cutoff references.

Vision sends bounded locally decoded inline JPEGs with actual frame IDs/timestamps. The original video remains in private storage. Embeddings, relevance selection, planning and synthesis send text only. No remote media URLs, Files API, audio uploads, SDK retries or cross-provider fallback exist.

Each generation call is capped at 4,096 output tokens, 128 images, 19 MiB serialized request and 4 MiB streamed response. Combined system/user text is additionally limited to 64 KiB in both raw and NFKC-normalized UTF-8 form before reservation or network dispatch; this includes retrieval documents, prior context and repairs. Incomplete/blocked/invalid provider envelopes become unknown dispatched attempts with retained charges. HTTP clients disable redirects and environment proxies. Model media, quoted text and previous responses are treated as untrusted evidence, never instructions.

## Evidence contract

Keep schema version `0.1`, `timebase=video_absolute_seconds`, and the required answer/events/unresolved/followups/trace/errors fields. Frame and event references belong to the same source and real sampled frames. Human-readable times equal absolute seconds; evidence lies within its event interval. Sampling bounds do not establish frame-perfect accuracy.

| Final status | Contract |
| --- | --- |
| `ok` | Valid supported events, no unresolved items or processing errors |
| `partial` | Valid supported events and unresolved items |
| `no_result` | Successful search with no evidence; empty events/unresolved/errors |
| `error` | No valid events; structured processing error |

Pending/unknown query controls are separate envelopes, not extra answer statuses. Public `trace.debug` stays null. Scores and support levels are mutually exclusive. Use levels unless support-score components can be measured reliably; neither is a calibrated truth probability. Low support cannot justify an unsupported event.

Validate captions, vectors, candidate indices, observations and synthesis before accepting evidence. Keep verified partial results when later stages fail. Never infer identity or speech; audio questions return `audio_channel_unavailable`. A limited candidate review cannot prove full-video absence. Current observations use reviewed window intervals; exact event-boundary accuracy still needs evaluation.

## Ownership, persistence and recovery

The `ctrlf_session` HttpOnly/SameSite=Strict cookie identifies the owner. Writes require `X-CTRLF-CSRF` and same-origin validation. Ownership and expiry gate every source, frame, task, query and investigation. Use Secure cookies for public HTTPS. Credentials remain backend-only.

SQLite revision CAS rejects conflicting saves. Preserve investigation identity/navigation epochs after every async wait. Capture query context at submission, preserve drafts typed in flight, and drain old-desk edits before restoring another desk. Playback-only changes cannot extend save draining indefinitely.

Requests are idempotent by ID and payload; changed payloads conflict. Restore pending/unknown/completed state from durable storage, never resend a paid attempt automatically. Validate current context anchors. Query cancellation preserves verified results or a terminal cancellation error; late completions cannot replace it. Source deletion/expiry invalidates generations, blocks reads/dispatch and cascades cleanup. Restart interrupts unfinished work; it does not replay paid requests.

Default retention is 24 hours, configurable 1–168. There is no account-based cross-device ownership transfer. Encryption, backup restoration and deployed recovery require separate validation.

## Budgets and scheduling

All dispatch uses the durable approved attempt ledger. Require active same-version owner and deployment `*` approvals with explicit currency, primary/model call counts, total money and validity/calibration boundaries. Approval installation is a trusted local operator action, not an API, config flag or browser request.

Admit the actual complete window count and conservative total cost before work. Reserve per-attempt budget atomically across both scopes. Unknown/dispatched attempts retain charges and are never automatically resent/refunded. Completed cached ingest work is not charged twice; cache-only resumes still require active approval. Missing completed results or changed payloads do not authorize replay.

One model attempt runs at a time, with up to 16 bounded waiters and 1:1 query/ingest alternation when both queues are eligible. At most two query slots are active. Check ownership/generation/cancellation/deadline before later dispatch. Attempts have finite timeouts; a timeout does not prove supplier billing has stopped.

## Media and deployment resources

Uploads: 500 MiB/file, 10 sources and 1 GiB per owner, 4 GiB across the service, 180-second upload timeout. Cloud Run gateway bodies are separately limited to 30 MiB. Keep decoder protocol/format restrictions, file/network isolation, CPU/memory/output bounds and streaming frame extraction. macOS isolation and bounded native GCE decoding/file/network isolation are verified; the containerized Linux target and broader resource acceptance remain open.

Run one API/worker process per local SQLite workspace. Never autoscale that workspace or use multiple Uvicorn workers. The initial fixture deployment uses stateless Cloud Run UI/ingress -> one native GCE backend with a durable local block filesystem; live Gemini video analysis remains gated. Cloud Run ephemeral storage and NFS/GCS mounts are not substitutes for SQLite WAL durability/locking. Workspace startup refuses Cloud Run's `K_SERVICE`. The gateway uses HTTPS and a private token while preserving session/CSRF/ownership checks. See [deployment](docs/deployment.md).

## Acceptance remaining

Full-pipeline live model permissions/revisions, real visual evidence quality, unknown/cancellation behavior, calibrated costs/provider cutoff, one-hour performance, concurrent workloads, container isolation, broader deployed recovery and backup restoration remain open. Initial fixture HTTPS/storage checks, native Linux isolation checks and backup integrity verification do not complete those gates. Original target values remain unmeasured: Recall@5 >=80%, complete event coverage at IoU>=0.5 >=70%, schema >=99%, evidence support >=90%, one-hour indexing <=30 minutes, query P95 <=15 seconds. Retain failure/missing denominators and completion rates.

Development dataset commitment: >=10 videos/30 questions. Independent frozen report goal: >=30 videos/100 questions. Required visual comparisons include hybrid retrieval versus vector-only and visual review versus no review. Audio/ASR experiments cannot run in this edition; the existing four-category offline diagnostic gate includes speech and must remain NOT_ACCEPTED until its scope is explicitly revised or supported. Never claim full acceptance from fixtures or a short demo.

See [evaluation](docs/evaluation.md), [TODOS](TODOS.md), [API](docs/api.md), [runtime](docs/WORKSPACE_RUNTIME.md) and [profile](profile.md).
