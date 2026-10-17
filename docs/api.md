# CtrlF Video — API and Evidence Contracts

Updated: 2026-10-14. The FastAPI `/docs` and `/openapi.json` expose concrete input models. All status endpoints report the single provider `gemini`, including unconfigured fixture mode; that label does not mean a model request has run.

## Ownership and HTTP operations

`GET /api/session` initializes the `ctrlf_session` HttpOnly/SameSite=Strict cookie and returns the CSRF token. Writes require `X-CTRLF-CSRF` and valid Origin. Every private source/frame/job/query/investigation checks owner and expiry. The public synthetic `demo_parcel` media is the exception within those media routes. The separately selected [recorded-test copy](JUDGE_WALKTHROUGH.md) is served under `/static/judge/`, with no private-media endpoint or anonymous analysis approval. Its versioned public asset map resolves sanitized answer references to the public static JPEG.

The session response advertises `X-CTRLF-Upload-Limit` in bytes: 524288000 for a direct workspace and 31457280 through the gateway. The gateway replaces the backend value with its own enforced cap. This is a UI hint, not authorization; both servers continue enforcing their existing limits. The browser defaults conservatively to 30 MiB when an older deployment omits the header.

| Operation | Purpose |
| --- | --- |
| `GET /api/runtime/status` | Owned read-only model/calibration/budget prerequisites |
| `GET/POST /api/investigations` | List/create owned investigations |
| `GET/PUT/DELETE /api/investigations/{id}` | Read, revision-CAS save and delete |
| `GET/POST /api/videos` | List/upload bounded raw video bytes, never a remote URL |
| `GET/PATCH/DELETE /api/videos/{id}` | Inspect job/media metadata, rename and delete |
| `POST /api/videos/{id}/analyze` | Explicit approved Gemini ingestion |
| `POST /api/videos/{id}/retry` | Retry failed/cancelled local preflight |
| `POST /api/videos/{id}/cancel` | Invalidate running source work |
| `GET /media/{id}/video` | Owned private video with Range support |
| `GET /media/{id}/frames/{file}` | Owned private decoded evidence |
| `POST /api/chat/prepare` | Check readiness and verified context |
| `POST /api/chat` | Execute/recover an idempotent question |
| `GET /api/investigations/{id}/requests` | Restore durable controls/results without dispatch |
| `POST /api/investigations/{id}/requests/{request_id}/cancel` | Idempotent cancellation retaining verified evidence |

Question payloads bind investigation, request ID, question, generation and optional parent request. Reusing an ID with changed input conflicts. Pending uses HTTP 202; unknown uses 409 and stops polling. Cancellation blocks later dispatch and late publication; an already-dispatched supplier call is not refunded.

Questions also accept `task_brief` (string, up to 2,000 characters, default empty) and `study_type` (`ux_research` or `technical_sample`). Both are captured before client awaits, included in the durable idempotent input, and returned with completed results. The brief reaches Gemini as untrusted task context, never as verified evidence. Editing the investigation later does not change an existing request. Requests with default research fields retain the prior payload hash for compatibility.

Investigation snapshots accept `taskBrief` and `studyType` with the same limits. Each saved finding has an editable `title` (up to 200 characters) and may contain `research` with `observation`, `interpretation` and `openQuestions`, each a string of at most 2,000 characters. These annotations remain separate from the validated source answer/frame. Report version 1.1 includes current research context, per-question captured context and researcher annotations. Answer schema 0.1 remains unchanged; older question purposes are reported as not recorded.

Demo snapshot saves accept current canonical answers, or an exact answer/id already retained by the same owned investigation. This allows existing desks to survive demo-catalog translation without accepting arbitrary demo evidence into new investigations. Source validation, revision checks and ownership still apply.

## Answer contract

Exports: [Answer](schema/answer-0.1.json), [QueryControl](schema/query-control-0.1.json), [synthetic fixtures](schema/fixtures-0.1.json). Run `make schema` after model changes and `make check` for drift.

Final answers keep schema `0.1`, absolute video-second timebase, answer, events, unresolved, followups, trace and errors. Event/frame video ownership and times are validated server-side; human-readable times must equal seconds, evidence must lie in the event interval, and support score/level are mutually exclusive. `trace.debug` is null. JSON Schema alone does not establish factual evidence quality.

| Status | Requirement |
| --- | --- |
| `ok` | Valid supported events; no unresolved/errors |
| `partial` | Valid supported events plus unresolved items |
| `no_result` | Successful search with empty events/unresolved/errors |
| `error` | No valid events plus structured errors |

Pending/unknown controls use `kind=query_control`, have no final `status`, and do not add answer states. Pending carries a bounded 2–10-second polling interval. Unknown/dispatched paid attempts are never automatically resent.

## Readiness and public endpoints

Owned runtime status uses `Cache-Control: no-store`, reveals credential presence rather than values/endpoint URLs, and makes zero model requests. `dispatch_prerequisites_met` is local eligibility, not live quality/cost/deployment proof. `live_verified` remains false.

`/`, `/demo/catalog`, `/demo/video` and demo frames serve the labeled synthetic workspace. `/health` reports settings/tools/open acceptance and recorded dispatch counts. `/docs/errors` offers brief recovery guidance. The stateless gateway's `/gateway/health` reports ingress liveness without probing the backend. With `CTRLF_COMPONENT=frontend`, it also serves `/` and `/static/` directly; all API/demo/media operations still reach the backend through the same public origin.

See [runtime](WORKSPACE_RUNTIME.md), [errors](errors.md) and [ARCHITECTURE](../ARCHITECTURE.md).
