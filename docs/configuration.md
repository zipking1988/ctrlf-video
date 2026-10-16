# CtrlF Video — Configuration

Updated: 2026-10-14. Environment variables override `[ctrlf_video]` TOML, then defaults. `CTRLF_VIDEO_CONFIG` selects the file; `.env` is not loaded. Unknown fields/variables, booleans masquerading as numeric limits and nonfinite/out-of-range values are rejected without echoing secrets.

```toml
[ctrlf_video]
mode = "fixture"
scene_threshold = 0.3
coarse_frames = 12
candidate_k = 10
rerank_k = 5
ttl_hours = 24
```

Use `CTRLF_VIDEO_COARSE_FRAMES=8 make preflight` or `CTRLF_VIDEO_CONFIG=/absolute/path/config.toml make preflight`.

| Setting (`CTRLF_VIDEO_` + uppercase name) | Default | Bounds |
| --- | --- | --- |
| mode | fixture | fixture/real |
| scene_threshold | 0.3 | 0–1 |
| coarse_frames | 12 | 8–16 per window |
| candidate_k / rerank_k | 10 / 5 | 1–100; rerank <= candidate |
| ttl_hours | 24 | 1–168 hours |
| max_window_seconds / overlap_seconds | 120 / 5 | Fixed seconds |
| max_fps / max_frames | 1 / 128 | Fixed sampling bounds |
| primary_cap / coarse_retry_cap | 30 / 0 | Fixed unapproved-budget protection |
| zoom_cap / text_repair_cap | 3 / 1 | Fixed attempt limits |

## Runtime and deployment variables

| Variable | Purpose |
| --- | --- |
| `CTRLF_DATA_DIR` | Private storage; default `.ctrlf-video-data/` |
| `CTRLF_RUNTIME_FILE` | Trusted private Gemini runtime JSON |
| `CTRLF_PUBLIC_ORIGIN` | Reviewed public HTTPS origin |
| `CTRLF_COMPONENT` | `workspace` default, stateless `gateway`, or `frontend` UI/gateway |
| `CTRLF_BACKEND_ORIGIN` | Separate HTTPS durable workspace origin for gateway |
| `CTRLF_BACKEND_PUBLIC_ORIGIN` | Gateway-only optional canonical HTTPS origin expected by the backend; defaults to `CTRLF_PUBLIC_ORIGIN`. Allows a custom frontend domain without changing durable backend configuration. |
| `CTRLF_GATEWAY_TOKEN` | Private 32–256 printable-ASCII token shared by gateway/backend |
| `CTRLF_BACKEND_CA_FILE` | Optional reviewed PEM CA file for a private HTTPS backend; certificate and hostname verification remain enabled |
| `CTRLF_REQUIRE_DATA_MOUNT` | `1` requires explicit workspace volume mount; container default |
| `PORT` | Container port, integer 1–65535; default 8080 |
| `GEMINI_API_KEY` | Backend-only credential referenced by model endpoint `key_env` |

No previous package/environment/session aliases remain. Restart and reload after renaming; storage defaults and session cookie are separate from any earlier workspace. Private data is not automatically migrated or re-owned.

## Gemini runtime

[runtime.example.json](runtime.example.json) is blocked preparation, not approval. Only `provider=gemini` is accepted (also the default). Four roles are required: vision, embed, rerank/relevance selection and text. Each endpoint needs the fixed Google API base URL, a verified model/revision/key environment name and conservative cost bound. No ASR or self-hosted-provider configuration is accepted.

`allow_google_media` defaults false. Locally decoded JPEG transmission requires deliberate trusted consent. `valid_until`, calibration/cutoff references, currency and active two-level budgets independently gate dispatch. Never turn placeholder costs or extended expiry into permission to spend.

`make preflight` remains a deployment-acceptance report, exits 2 in real mode and never claims readiness. `make agent-check` dynamically reads local prerequisites, can inspect an existing owner's approvals, creates no storage and calls no model; passing does not prove live acceptance. See [runtime](WORKSPACE_RUNTIME.md) and [deployment](deployment.md).
