# Working on CtrlF Video

## Product and authorized scope

CtrlF Video ("Ctrl+F for video") is a desktop video investigation agent for AI Builder Cup 2026. Its workspace is a spatial canvas of questions, evidence frames and conclusions with multi-turn context and a source player. Mobile is outside this edition's scope.

On 2026-10-14 the user requested a complete rename and a Gemini-only cleanup of this checkout, explicitly authorizing removal of the other provider integration and obsolete docs/source snapshots. The package is `ctrlf_video`; settings use `CTRLF_VIDEO_*`, runtime/infrastructure use `CTRLF_*`, and browser globals use `CtrlFVideo*`. Do not add previous-brand compatibility aliases. The original separate repository/workspace must remain untouched.

The private repository and local import commit were authorized. On 2026-10-14 the user explicitly authorized code review, fixes, an English README update and pushing the reviewed work to private `main`, superseding the earlier unpushed-import hold. Future pushes still require explicit authorization. Do not change visibility or publish source without explicit authorization. See [hackathon.md](hackathon.md) and [provenance](docs/provenance.md); event requirements are not permission to publish or deploy.

Default `fixture` mode has labeled synthetic answers and makes no model requests. Upload, preflight, playback, investigations and exports work locally. The split GCP deployment and a limited real Gemini pipeline on one uploaded synthetic clip are verified; broad model quality, actual UX recording value and settled operating costs remain unverified. Do not claim complete MVP or GO.

On 2026-10-16 the user authorized a separate `ctrlfvideo` GCP project and split frontend/backend deployment, with JPY 3,000 total through October 19, 2026, 23:59 JST, including non-credit charges. Model calibration, verified finite per-call bounds and source consent still apply. Continued hosting after that window needs a new budget. The user authorized backing up test videos/investigations locally and then removing temporary cloud resources at cutoff. Verify a consistent local backup before deleting the cloud data; keep the original separate workspace untouched.

On 2026-10-16 the user also explicitly authorized review, fixes and pushing these deployment changes to private `main`. This does not authorize source publication or automatic deployments on future pushes.

Later on October 16 the user explicitly authorized CI/CD for both components,
tests before deployment, and verified backend backup/rollback within the same
JPY 3,000 total and October 19 cutoff. The private main workflow and its deployment
pushes are authorized for that temporary window. Use keyless main-only federation;
do not create service-account keys, enable paid model calls, add build servers or
extend hosting. Preserve the release manager's finite allowance and earlier
admission cutoff. Final cleanup shares its lock and permanently disables releases.
The original four-attempt setting was an assistant-chosen setup guard, not a GCP
quota or an amount derived from the monetary budget. It was revised to 24 total
attempts on October 16, retaining the four consumed attempts and every existing
resource/time/model restriction. Do not describe release counts as billing credit
or claim a verified remaining balance when billing data is unavailable.

The user subsequently explicitly requested real Gemini uploads on ctrlfvideo.com within the same JPY 3,000 total. This supersedes the earlier paid-call hold for this limited test. The operator allocated a shared JPY 600 maximum, 40 model attempts and six primary calls to matching deployment/session ledgers, including calibration and smoke tests. No public automatic enrollment, budget resets or extra allowance is authorized. Model validity ends October 19 at 22:00 JST ahead of cleanup. Keep the key backend-only and preserve all reservations across deployments/rollback; see [live test limits](docs/LIVE_GEMINI_TEST.md). On the same day, the user explicitly requested billing reconciliation and additional video tests within the unchanged JPY 3,000 total. The project-specific budget reported JPY 0 (reporting lag applies). The revised allocation is JPY 1,500 infrastructure/pending costs, JPY 1,200 cumulative models and JPY 300 buffer. Preserve JPY 225 prior calibration and JPY 214 v1 reservations; revoke old unused funding and install a fresh JPY 761 v2 grant, 48 calls/eight primary, for the same owner/deployment. Ready v1 indices may be explicitly allowed for query-only reuse; new work charges v2. No deadline, model bound or public enrollment changes. See the live test document for the audit and limits.

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
- **Media/resources:** retain upload/storage/decoder/time/window/sampling limits and process isolation. One API/worker process per workspace. macOS and the native GCE backend passed bounded isolation checks; containerized Linux decoding still needs separate proof.
- **Gemini:** only bounded locally decoded JPEGs may reach Google's fixed Gemini API origin, with trusted `allow_google_media` consent. Original video stays on the backend; text stages send no media. No external-media fetching, Files API uploads, automatic retries or ASR. Reject unsupported audio questions.
- **Authorization:** do not enable live calls, install spending approvals, provision resources or raise budgets without explicit finite numeric spending/calibration authorization. Private pushes do not grant those permissions.

## Hygiene and delivery

Inspect `git status` before edits and preserve unrelated work. Keep `.ctrlf-video-data/`, `.ctrlf-video-eval/`, private videos, databases, `.env`, runtime/approval records, caches, `.venv/` and `node_modules/` out of Git. Templates are not operational approvals; `.env` is not loaded automatically.

Keep current docs consistent with behavior. Report passed checks and material verification limits. Preserve the actual source lineage even when removing old branding or documents; renaming does not establish hackathon eligibility. Never force-push or rewrite history without authorization.
