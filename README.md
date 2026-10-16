# CtrlF Video

**Ctrl+F for video.** A desktop video investigation workspace for AI Builder Cup 2026. The first use case is **UX research: review usability-test recordings and build findings linked to visible evidence**. See the [product spec](SPEC.md); the final submission track remains to be confirmed.

Ask visual questions about footage, follow up on evidence, and arrange questions, frames and conclusions on a spatial canvas linked to a source player. See [profile.md](profile.md) for the product and [hackathon.md](hackathon.md) for event rules.

## Workspace

The **Evidence canvas** is the main workspace. Questions, source frames and findings remain connected as you investigate a recording.

- **Agent chat:** ask a question or follow up on a selected result in the bottom-right popover. Minimize it to make room; drafts survive reopening and refresh.
- **Source player:** replay a cited timestamp in the bottom-left player. Expand it to inspect detail, or hide it while organizing the canvas.
- **Finding editor:** open a finding from its card. Edit its title, observed facts, interpretation and open questions. Observed facts update the canvas summary while the original answer and evidence remain available.
- **Research context:** expand this section in agent chat to record the participant's task and whether the recording is a UX study or a technical sample. Each question captures the context submitted with it.
- **Reports:** export Markdown, JSON or HTML with findings, source timestamps and unresolved questions. HTML can optionally include evidence images.

All application labels and synthetic demo content are English. Researcher-entered content keeps its original language. This edition targets desktop use.

## Current status

Local upload, media preflight, private playback, persistent investigations, canvas controls and report exports are implemented. Gemini ingestion and querying have mock-transport coverage. An initial GCP deployment and a bounded live Gemini image-understanding probe are verified; the complete live video-analysis pipeline, quality, latency and billing reconciliation remain pending.

**Default mode: `fixture`.** It makes no model requests and labels its preset answers and source video as synthetic. Uploaded footage can be checked and played in fixture mode, but cannot receive demo answers. Saving uses revision checks; a conflict is shown for recovery instead of overwriting another window's edits.

The first product use case remains UX research. The sports video is a technical sample only; a playable local copy and an actual UX recording are still needed for the planned validation. See [sample availability](docs/SPORTS_SAMPLE.md), [acceptance backlog](TODOS.md) and [design QA](design-qa.md).

This edition is Gemini-only. The original implementation's separate workspace/repository remains preserved. [Provenance](docs/provenance.md) records the source lineage and unresolved hackathon eligibility. The repository is private; publication and deployment require separate authorization.

## Initial cloud test

Open [CtrlF Video](https://ctrlfvideo.com/). The custom domain has a verified
Google-managed HTTPS certificate; HTTP redirects to HTTPS. Browser checks verified
source playback, edited findings and restoration after refresh. Twenty live API
checks also passed, including private video Range delivery and owner/CSRF checks.
The Cloud Run frontend and durable Tokyo GCE backend are separate components with
one browser origin. The cloud service currently runs the **labeled synthetic
fixture**; uploaded footage supports preflight/playback, with model analysis blocked.
A separate live Gemini 3.1 Flash-Lite call on one public synthetic frame validated
image dispatch and response handling, not video retrieval or UX research quality.

The authorized test ceiling is JPY 3,000 through **October 19, 2026, 23:59 JST**.
A local backup/cleanup automation is scheduled for 23:15 JST; the VM also has a
provider-side stop time at 23:59 JST. Automation requires the local host to be
available. The data disk must be preserved if backup verification fails, which
can leave residual storage charges. Continued judge access needs a longer hosting
window and a new budget. See [deployment status](docs/deployment.md).

## Local setup

Requirements: Python 3.13, `uv`, `make`, FFmpeg and ffprobe. Node.js 20+ is needed for frontend development; serving uses the committed build. macOS media isolation is locally verified. The current native GCE backend passed Linux decoding, file-isolation and network-isolation checks; containerized backend isolation still needs separate proof.

```sh
make setup
make preflight
make run
```

Open http://127.0.0.1:8765. Use one API/worker process per storage directory. Local storage defaults to `.ctrlf-video-data/`; `.env` is not automatically loaded.

## Try the local demo

1. Open the workspace menu and choose **Demo library**, then load a preset example.
2. In agent chat, ask **“When is the package at the center?”** or use a suggested question.
3. Replay a timestamp to inspect the source. Use **Edit as finding** to save the answer and open its editor.
4. Add observed facts and open questions, then choose **Save finding**. Check the header save indicator before leaving the investigation.
5. Use **Export report** to preview or download the investigation. Refresh to check that its findings, layout and draft restore.

The demo is an 18-second synthetic video composed of static scenes, not proof of real continuous movement. Open **Sources** from the workspace menu to upload a local recording for preflight and playback. The app accepts local video files, not arbitrary video URLs. Real analysis remains blocked until model, media-consent, calibration and budget prerequisites are met.

## Configuration

Settings precedence is environment variables, then `[ctrlf_video]` TOML, then defaults. Use `CTRLF_VIDEO_CONFIG` to select the TOML file. Protected limits cannot be raised through configuration.

```sh
CTRLF_VIDEO_COARSE_FRAMES=8 make preflight
CTRLF_VIDEO_CONFIG=/absolute/path/config.toml make preflight
```

`CTRLF_RUNTIME_FILE` selects a trusted private Gemini runtime based on [runtime.example.json](docs/runtime.example.json). That template is deliberately blocked. Keep `GEMINI_API_KEY` in the backend environment. Real dispatch also needs verified model revisions, conservative costs, supplier billing controls and explicitly approved owner/deployment budgets. See [runtime](docs/WORKSPACE_RUNTIME.md) and [configuration](docs/configuration.md).

There are no aliases for the previous package, environment names, browser globals or cookie. The package is `ctrlf_video`, settings use `CTRLF_VIDEO_*`, runtime/infrastructure use `CTRLF_*`, and frontend globals use `CtrlFVideo*`. Restart the local server and reload the browser after this rename. New default storage and cookie names start a separate session; existing private data is not automatically copied, deleted or re-owned.

## Development

The cloud frontend and backend can be packaged separately: `docker build --target
frontend -t ctrlfvideo-frontend .` and `docker build --target backend -t
ctrlfvideo-backend .`. The frontend serves the committed UI and proxies API/media
requests under the same public origin; the backend retains one worker and durable
SQLite/media storage. See [deployment setup](docs/deployment.md) for configuration,
the authorized test window and remaining cloud verification.

**CI/CD:** [the GitHub workflow](.github/workflows/ci-cd.yml) tests frontend,
backend, generated assets, schema and Linux isolation before deployment. Main
code pushes deploy the Cloud Run frontend by immutable image digest and the
single native backend through a consistent backup, isolated restore check and
owned-investigation check. Pull requests run tests without cloud credentials;
Markdown-only main pushes skip the pipeline. Credentials are short-lived and
restricted to this private repository's main workflow.

This temporary setup permits 24 backend release attempts, including failed
preparation and rollback drills. This is an operator-chosen loop backstop, not a
GCP quota or a conversion of the JPY 3,000 budget. New releases close **October 19
at 22:00 JST**, leaving recovery
time before cleanup. Automatic releases reject database/ledger/API contract
changes; those need a reviewed migration. A rollback restores code and keeps the
current workspace and model ledger. See the
[release and recovery guide](docs/deployment.md#release-process-and-cicd).

The [October 16 pipeline](https://github.com/zipking1988/ctrlf-video/actions/runs/38876396945)
passed 100 frontend and 195 backend tests; both services now run that tested
application source. Final verification corrected the frontend revision selection
and checked 100% traffic, with 27 deployment regressions passing. A live
forced-failure rollback and independent local backup restoration also passed.
The overly restrictive initial cap of four was increased to 24 without resetting
history. Five backend attempts are now recorded, leaving 19 in the existing
window. Instance limits, the JPY 3,000 total and cleanup deadline
remain unchanged. The app remains in fixture mode; actual cloud billing is not
yet reconciled, and budget alerts do not enforce a hard spending cutoff.

```sh
make test          # backend contracts and Gemini mock transports
make check         # lint, format and exported schema drift
make eval-fixture  # synthetic output-contract examples
make eval-check    # unrun diagnostic templates; NOT_ACCEPTED expected
make agent-check   # read-only local prerequisites; exit 2 while blocked
npm ci --ignore-scripts
npm test
npm run build
```

Edit `frontend/workbench.jsx` and the authored modules/styles in `src/ctrlf_video/static/`. Never edit the generated `workbench.js`; run `npm run build` after JS/JSX/CSS changes and include asset hashes and generated license notices. After output-model changes, run `make schema` and review the exports.

## Repository map

| Location | Responsibility |
| --- | --- |
| `src/ctrlf_video/api.py`, `routes.py` | Owned HTTP operations, workers and private media |
| `workspace.py` | SQLite ownership, investigations, revisions, generations and expiry |
| `agent.py`, `gemini.py`, `attempts.py` | Retrieval/evidence pipeline, native Gemini wire format and approved attempt ledger |
| `media.py`, `media_limits.py`, `windows.py` | Isolated decoding, actual timestamps and bounded windows/sampling |
| `schema.py`, `config.py`, `preflight.py`, `readiness.py` | Contracts, finite configuration and read-only prerequisite checks |
| `evaluation.py`, `eval/` | Offline scoring and unrun diagnostic templates |
| `gateway.py`, `server.py`, `deploy/gcp/` | Prepared Cloud Run ingress and single durable backend startup |
| `frontend/`, `static/` | Authored React/components, browser modules and committed assets |
| `tests/`, `scripts/` | Regressions and local build/contract tools |

Module names without a prefix are inside `src/ctrlf_video/`; `static/` is also relative to that package.

## Current documentation

- [AGENTS.md](AGENTS.md): development and authorization boundaries.
- [ARCHITECTURE.md](ARCHITECTURE.md): evidence, ownership, budgets and resource contracts.
- [DESIGN.md](DESIGN.md): desktop canvas direction.
- [TODOS.md](TODOS.md): remaining acceptance work.
- [Runtime/workflow](docs/WORKSPACE_RUNTIME.md), [configuration](docs/configuration.md), [deployment](docs/deployment.md).
- [API](docs/api.md), [errors](docs/errors.md), [canvas/reports](docs/CANVAS_AND_REPORTS.md), [evaluation](docs/evaluation.md).
- [Hackathon rules](hackathon.md), [project profile](profile.md), [provenance](docs/provenance.md).

Old reviews, screenshots, planning snapshots and diagrams have been removed from the checkout. Git history preserves committed records. No project license has been selected; third-party font/icon/React notices are retained. Private videos, databases, approvals, credentials and caches belong outside Git.
