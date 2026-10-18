# CtrlF Video — Errors and Recovery

Updated: 2026-10-14. Current adapters and HTTP recovery are implemented; live provider behavior remains unverified. Do not resolve an error by bypassing ownership, isolation, media consent or budget checks.

| Code/state | Meaning and recovery |
| --- | --- |
| `invalid_config` / config exit 2 | Correct TOML names/types/protected limits; errors do not echo supplied secrets |
| `real_blocked` | Complete trusted model, media-consent, calibration and approved-budget prerequisites |
| `google_media_not_enabled` | Google JPEG transmission requires trusted runtime consent |
| `gemini_endpoint_not_allowed` / `invalid_gemini_model` | Use fixed Google API origin and verified model identifiers |
| `model_key_missing` / `model_revision_missing` | Supply backend credentials and verified revision without exposing them |
| `aiand_media_not_enabled` / `aiand_endpoint_not_allowed` / `invalid_aiand_model` | ai& needs separate trusted media consent, its fixed API origin and the pinned Gemma model; see [setup](AIAND_SETUP.md). |
| `aiand_incomplete_response` / `invalid_aiand_response` | Incomplete or invalid Gemma output retains an unknown attempt; never resend automatically. |
| `gemini_embedding_input_limit` / `gemini_request_limit` | Complete batch >100 windows or request >19 MiB; choose smaller footage, never truncate readiness |
| `gemini_inline_jpeg_required` | Only decoded inline JPEGs are allowed; no remote media URL |
| `audio_channel_unavailable` | This edition has no audio transcription; ask a visible-fact question |
| `model_unknown` / `unknown_attempt_do_not_resend` | Dispatched outcome is uncertain; preserve charge and stop automatic replay |
| `gemini_incomplete_response` / `invalid_gemini_response` | Provider output incomplete/blocked/invalid; dispatched attempts become unknown |
| `invalid_observations` / `invalid_synthesis` / `invalid_rerank` | Model output failed validation; retain verified partial evidence when available |
| `index_configuration_changed` | Frozen config/provider/model/budget no longer matches; rebuild with a new generation |
| `whole_video_review_limit` | Whole-video review is limited to 350 seconds (5:50); use a shorter authorized clip or ask a specific question. No model call is made for this rejected request. |
| `video_not_ready` / `preflight_required` | Finish complete local preflight/approved analysis before questions |
| `invalid_context_anchor` / `stale_chat_generation` | Select current owned verified context; stale requests cannot publish |
| `revision_conflict` | Another tab changed the desk; reload/reconcile instead of overwriting |
| `csrf_rejected` / `origin_rejected` | Reload the same-origin session; cross-origin writes are rejected |
| `expired_or_deleted` | Private source/investigation is no longer accessible |
| `upload_limit` / `storage_limit` | Use smaller footage or delete an unneeded owned source |
| `invalid_media` / `media_timeout` / `media_isolation_unavailable` | Check/re-encode media and verify isolation; do not disable protection |
| `query_cancelled` | Terminal idempotent cancellation; later stages do not dispatch |
| `gateway_auth_required` | Operator checks backend's private ingress token; user ownership still applies |
| `workspace_backend_unavailable` | Gateway cannot reach durable backend; no fixture/model fallback |
| `gateway_upload_limit_30_mib` | Gateway body limit is 30 MiB; direct local upload limit is 500 MiB |

A pending query uses HTTP 202 with a bounded polling delay; unknown uses 409 and stops polling. A completed final error is distinct from unknown. A retained partial response does not prove the entire request succeeded.

`BudgetDenied` rejects missing/revoked/insufficient or conflicting approval before dispatch. SQLite contention has bounded waiting; failures do not authorize calls. Real `preflight` always exits 2 for open deployment acceptance; `agent-check` is the independent local readiness check.

Cloud Run `K_SERVICE` cannot start a stateful workspace. Run the stateless gateway there and use one durable backend. See [API](api.md), [runtime](WORKSPACE_RUNTIME.md), [deployment](deployment.md) and [ARCHITECTURE](../ARCHITECTURE.md).
