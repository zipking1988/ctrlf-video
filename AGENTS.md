# Working on CtrlF Video

## Product and authorized scope

CtrlF Video ("Ctrl+F for video") is a desktop video investigation agent for AI Builder Cup 2026. Its workspace is a spatial canvas of questions, evidence frames and conclusions with multi-turn context and a source player. Mobile is outside this edition's scope.

On 2026-10-14 the user requested a complete rename and a Gemini-only cleanup of this checkout, explicitly authorizing removal of the other provider integration and obsolete docs/source snapshots. The package is `ctrlf_video`; settings use `CTRLF_VIDEO_*`, runtime/infrastructure use `CTRLF_*`, and browser globals use `CtrlFVideo*`. Do not add previous-brand compatibility aliases. The original separate repository/workspace must remain untouched.

The private repository and local import commit were authorized. On 2026-10-14 the user explicitly authorized code review, fixes, an English README update and pushing the reviewed work to private `main`, superseding the earlier unpushed-import hold. Future pushes still require explicit authorization. Do not change visibility or publish source without explicit authorization. See [hackathon.md](hackathon.md) and [provenance](docs/provenance.md); event requirements are not permission to publish or deploy.

Default `fixture` mode has labeled synthetic answers and makes no model requests. Upload, preflight, playback, investigations and exports work locally. Gemini integration is mock-tested; live model quality, calibrated costs and GCP deployment remain unverified. Do not claim complete MVP or GO.

## Read before changing behavior

Read [README](README.md), [ARCHITECTURE](ARCHITECTURE.md), [DESIGN](DESIGN.md), [runtime](docs/WORKSPACE_RUNTIME.md), [API](docs/api.md), [configuration](docs/configuration.md), [errors](docs/errors.md) and [TODOS](TODOS.md).

## Source map

| Location | Responsibility |
| --- | --- |
| `src/ctrlf_video/api.py`, `routes.py` | App, owned HTTP operations, workers and media |
| `workspace.py` | SQLite investigations, ownership, CAS, generations and expiry |
| `agent.py`, `gemini.py`, `attempts.py` | Gemini, retrieval/evidence and approved budgets |
| `media.py`, `media_limits.py`, `windows.py` | Isolated decoding and bounded sampling |
| `schema.py`, `config.py`, `preflight.py`, `readiness.py` | Contracts and local prerequisites |
| `evaluation.py` | Offline artifact scoring |
| `gateway.py`, `server.py` | Stateless ingress and guarded single-process startup |
| `frontend/workbench.jsx` | Authored React components |
| `src/ctrlf_video/static/` | Authored browser modules/styles and generated build |
| `tests/`, `scripts/` | Regressions, build and schema tools |

Bare module paths above are relative to `src/ctrlf_video/`.

## Development

Use Python 3.13 and the committed `uv.lock`; Node.js 20+ for frontend work; FFmpeg/ffprobe for real media.

```sh
make setup
make preflight
make run
make test
make check
make eval-check
make agent-check
npm ci --ignore-scripts
npm test
npm run build
```

After authored JS/JSX/CSS edits, rebuild and include `static/index.html` hashes and generated bundle/license changes. Never manually edit `static/workbench.js`. Preserve third-party notices. After output-model changes, run `make schema` and review the exports.

Run relevant existing regressions for behavioral changes, especially ownership, async navigation, worker lifecycle, budget accounting and evidence validation. Documentation-only work needs link/command/whitespace checks. Mock transports establish integration, not live quality or cost/performance.

## Invariants

- **Evidence:** schema `0.1`, final statuses `ok` / `partial` / `no_result` / `error`; pending/unknown controls are separate. References use actual decoded frames and absolute source-video timestamps. Validate output, retain verified partial evidence and disclose unresolved ranges. Do not fabricate identities, speech, frames or global negatives from limited review.
- **Ownership:** session cookie, CSRF/Origin and owner/expiry checks protect every private object. Preserve SQLite revision CAS, video generations and request idempotency. Validate context anchors. Cancellation/deletion prevents late publication and releases capacity.
- **Async UI:** recheck investigation identity/navigation epoch after awaits. Capture submission context, preserve newly typed drafts, drain old-desk edits before restoring another desk, and do not let advancing playback keep save draining indefinitely.
- **Budgets:** every model request passes through atomic owner/deployment reservations. Unknown/dispatched attempts are not automatically resent or refunded. Completed cached work is not charged again at admission; zero-new-call resumes still need active approvals. Configuration/checkpoints/frame names stay generation-specific.
- **Media/resources:** retain upload/storage/decoder/time/window/sampling limits and process isolation. One API/worker process per workspace. macOS isolation is locally verified; Linux deployment needs proof.
- **Gemini:** only bounded locally decoded JPEGs may reach Google's fixed Gemini API origin, with trusted `allow_google_media` consent. Original video stays on the backend; text stages send no media. No external-media fetching, Files API uploads, automatic retries or ASR. Reject unsupported audio questions.
- **Authorization:** do not enable live calls, install spending approvals, provision resources or raise budgets without explicit finite numeric spending/calibration authorization. Private pushes do not grant those permissions.

## Hygiene and delivery

Inspect `git status` before edits and preserve unrelated work. Keep `.ctrlf-video-data/`, `.ctrlf-video-eval/`, private videos, databases, `.env`, runtime/approval records, caches, `.venv/` and `node_modules/` out of Git. Templates are not operational approvals; `.env` is not loaded automatically.

Keep current docs consistent with behavior. Report passed checks and material verification limits. Preserve the actual source lineage even when removing old branding or documents; renaming does not establish hackathon eligibility. Never force-push or rewrite history without authorization.
