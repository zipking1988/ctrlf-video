# CtrlF Video

**Ctrl+F for video.** A desktop video investigation workspace for AI Builder Cup 2026. The first use case is **UX research: review usability-test recordings and build findings linked to visible evidence**. See the [product spec](SPEC.md); the final submission track remains to be confirmed.

Ask visual questions about footage, follow up on evidence, and arrange questions, frames and conclusions on a spatial canvas linked to a source player. See [profile.md](profile.md) for the product and [hackathon.md](hackathon.md) for event rules.

## Workspace

The default **Review** view places the video on the left and a visible question box on the right. Ask a visual question, then click a cited timestamp to check the original footage. **Canvas** is the optional spatial view for organizing questions, source frames and findings. `/#review` opens the workspace directly.

First-time visitors see a product entry page with a real workspace screenshot and a source-linked question → frame → finding example. **Explore synthetic demo** is available above and below the example; **Upload a recording** uses the existing upload/preflight path. The screenshot, video and preset answers are explicitly labeled synthetic and do not establish model quality or UX-study value. Existing recordings, research context and drafts restore directly. The CtrlF Video rail button reopens the start page; `/#start` opens it directly, and `/#evidence-chain` opens its How it works section, while preserving the restored investigation. **Demo library** is also available directly in the workspace header.

**How it works** explains the approved Gemini path: searchable descriptions of sampled frames → retrieval of candidate moments → visual review → source-timestamp replay and a researcher-saved finding. The implementation uses Gemini rather than a custom-trained model, and sampling can miss brief events.

The landing addresses UX researchers with “Turn a UX recording into findings you can verify.” Each investigation handles one recording. Cross-session questions and aggregation remain a product hypothesis, not an implemented capability; AskTape is only an exploratory working name. Existing exports are Markdown, JSON and HTML.

- **Questions:** ask or follow up in the right panel, then replay supporting timestamps. The composer stays visible in Review; Canvas can minimize the panel. Drafts survive view switching and refresh.
- **Source player:** watch the recording in the left pane. In Canvas, the compact bottom dock can be expanded or hidden while organizing evidence.
- **Finding editor:** open a finding from its card. Edit its title, observed facts, interpretation and open questions. Observed facts update the canvas summary while the original answer and evidence remain available.
- **Research context:** expand this section in agent chat to record the participant's task and whether the recording is a UX study or a technical sample. Each question captures the context submitted with it.
- **Reports:** use **Menu → Export report** for Markdown, JSON or HTML with findings, source timestamps and unresolved questions. Canvas also retains the header export button. HTML can optionally include evidence images.

All application labels and synthetic demo content are English. Researcher-entered content keeps its original language. This edition targets desktop use.

The Coral Fieldnotes workspace uses a warm paper canvas, coral questions, amber evidence and mint findings. The docked player and research panel leave the graph unobstructed; **Question paths → Arrange** separates questions, pinned source frames and conclusions into columns while retaining their actual source relationships. **Sources** in the left rail opens the recording library. Canvas has player visibility controls; explicit Locate actions switch to Canvas before revealing their target.

## Current status

Local upload, media preflight, private playback, persistent investigations, canvas controls and report exports are implemented. Gemini ingestion and querying have mock-transport coverage. The GCP deployment now supports limited real Gemini testing for an explicitly approved browser session. One uploaded 18-second synthetic clip completed live ingestion, retrieval, visual verification, answer synthesis and editable finding saving. Broad model quality, real UX-recording validation, latency targets and billing reconciliation remain pending.

**Default mode: `fixture`.** It makes no model requests and labels its preset answers and source video as synthetic. Uploaded footage can be checked and played in fixture mode, but cannot receive demo answers. Saving uses revision checks; a conflict is shown for recovery instead of overwriting another window's edits.

The first product use case remains UX research. The NBA recording has a verified local playback flow and limited live Gemini evidence; it remains a technical sample, with person-matching limitations retained in [live-test records](docs/LIVE_GEMINI_TEST.md). An actual UX recording and participant task are still needed for product validation. See [sample availability](docs/SPORTS_SAMPLE.md), [acceptance backlog](TODOS.md) and [design QA](design-qa.md).

This edition is Gemini-only. The original implementation's separate workspace/repository remains preserved. [Provenance](docs/provenance.md) records the source lineage and unresolved hackathon eligibility. The repository is private; publication and deployment require separate authorization.

## Initial cloud test

Open [CtrlF Video](https://ctrlfvideo.com/). The custom domain has a verified
Google-managed HTTPS certificate; HTTP redirects to HTTPS. Browser checks verified
source playback, edited findings and restoration after refresh. Twenty live API
checks also passed, including private video Range delivery and owner/CSRF checks.
The Cloud Run frontend and durable Tokyo GCE backend are separate components with
one browser origin. The cloud backend now runs **real Gemini** for the approved
test session; the demo library retains its explicitly labeled preset answers.

The October 17 one-question NBA test completed with a real answer and a verified
source-frame replay. Its finite grant is now closed; saved answers, playback and
exports remain available. New model work requires a separately funded approval.

For a funded test, upload an authorized recording and use **Sources → Start analysis**,
then ask a visual question. Google receives sampled JPEGs and retrieval text; the
original video stays on the backend, and audio is not transcribed. The cumulative
**JPY 1,245 model reservation ceiling is part of the JPY 3,000 total**, including
historical calibration and attempts. The user approved at most JPY 45 from the
existing buffer for this one question. Other browser sessions are not automatically
funded. See [live test limits](docs/LIVE_GEMINI_TEST.md).

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

1. Open the workspace, or use `/#review` to enter it directly. The default Review view places the video on the left and the question box on the right.
2. Ask **“When is the package at the center?”** or choose the example question. The synthetic demo uses preset answers without model calls.
3. Click **00:06 · Watch this moment** in the answer to seek the original video. Play the surrounding footage to check the source.
4. Optionally expand **Save an observation or follow up → Write a finding**, enter observed facts and open questions, then **Save finding**. Check the save indicator before leaving.
5. Use **Menu → Export report** to preview or download the investigation. **Canvas** opens the spatial view for organizing questions and evidence. Switching views retains the question draft and player position.

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
