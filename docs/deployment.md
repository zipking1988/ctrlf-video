# Google Cloud deployment preparation

Updated 2026-10-16. The user authorized the `ctrlfvideo` GCP project and an initial
deployment/Gemini-validation ceiling of **JPY 3,000 through October 19, 2026,
23:59 JST**, including charges not covered by credits. The project, billing link,
required APIs, scoped budget alert and Tokyo VPC/subnet have been created.
The deployed native GCE backend has passed bounded Linux decode and namespace-isolation checks. This does not establish live Gemini video quality or containerized backend isolation.
Templates remain non-operational until their placeholders are deliberately supplied.

## Separate frontend and backend

The frontend is independently packaged with `docker build --target frontend`.
It starts `CTRLF_COMPONENT=frontend`, serves the committed HTML and `/static/`
assets, and forwards all API, demo and media requests to the durable backend.
The browser uses one public origin: no broad CORS, cross-site session cookies or
browser-visible gateway/model credentials are introduced. HTML uses `no-store`
so a new frontend revision does not reuse an obsolete shell. A backend outage
leaves the UI available but API requests return an explicit 502; there is no
substitute demo response for failed operations.

The backend remains one stateful API/worker process. The default Docker target
(`--target backend`) includes FFmpeg and bubblewrap; the frontend target does not.
The legacy proxy-only `CTRLF_COMPONENT=gateway` entry point also remains available.
Use [frontend.service.example.yaml](../deploy/gcp/frontend.service.example.yaml)
for the UI service. The current frontend uses an immutable image digest. The current backend runs a locked native Python environment under systemd so its decoder can use unprivileged Linux namespaces without weakening container protection. Both Docker targets built successfully on GCE. The backend container decoder isolation must still be verified independently before using that target for uploads.

For a private VPC backend, `CTRLF_BACKEND_CA_FILE` can load a reviewed private CA
certificate. The certificate must match the backend hostname/IP; verification is
never disabled. The public browser still uses Cloud Run's normal HTTPS endpoint.
Only the public CA certificate goes to the frontend; backend TLS private keys stay
on the backend. TLS regression coverage rejects unknown CAs and mismatched names.

The initial test window is shorter than the hackathon evaluation period. Continued
judge access needs a separately agreed hosting window. Budget alerts are not a hard
spending cutoff; bound resources/model attempts and arrange shutdown/backup before
the approved deadline. Credit eligibility remains unconfirmed; do not count the
App Builder balance as general-purpose hosting or direct Gemini API funding.

## Preserve the existing workspace runtime

The current workspace has one API/worker process, local private source files and
SQLite WAL databases for sessions, investigations and the approved attempt
ledger. Running this component on Cloud Run's ephemeral filesystem would lose
ownership and financial state. Cloud Run autoscaling or overlapping revisions
would also split that state. Limiting replicas to one does not provide durable
storage or prevent overlapping rollout instances. NFS/GCS mounts are not a safe
drop-in SQLite WAL backend: Cloud Run NFS mounts have no locking, and SQLite WAL
requires same-host shared memory.

Preparation therefore keeps the workspace unchanged behind a stateless ingress:

```text
Browser ─HTTPS─> Cloud Run frontend/gateway ─HTTPS + private shared token─>
  one Google Compute Engine backend ─> local persistent disk + isolated decoder
                                  └─> Google Gemini API (approved calls only)
```

This is the selected GCP topology, not deployed-platform or competition eligibility
proof. The prototype is served through Cloud Run and its workload remains on
Google Cloud. Verify the event's acceptance of this split topology before
submission; do not claim a fully serverless workspace. A future Cloud Run-only
backend would require a separate durable database/media/worker migration with
equivalent CAS, ownership, generation and atomic budget behavior.

## Prepared files

- [Dockerfile](../Dockerfile): Python 3.13, frozen `uv.lock`, committed frontend,
  separate frontend/backend targets, nonroot UID 10001; no Node or GPU requirement.
  The backend target additionally installs FFmpeg/ffprobe and bubblewrap.
  Workspace startup requires an explicit `CTRLF_DATA_DIR` volume mount by default
  (`CTRLF_REQUIRE_DATA_MOUNT=1`); a mounted volume still needs durability validation.
- [.dockerignore](../.dockerignore): an allowlist excluding private media,
  databases, credentials, approval records, evaluation data and unrelated drafts.
- `ctrlf_video.server`: binds `0.0.0.0:$PORT`, defaults to workspace and fixture,
  always runs one Uvicorn process. Workspace startup refuses Cloud Run's
  `K_SERVICE` before opening storage, even when invoked directly via the factory.
- `ctrlf_video.gateway`: streams HTTP without copying storage or starting workers,
  follows no redirects and has no retry/model/cloud SDK path.
- [gateway.service.example.yaml](../deploy/gcp/gateway.service.example.yaml):
  Cloud Run ingress template with placeholder image/origins/secret. Its replica,
  memory and CPU values are review candidates, not approved cloud spending.

The frontend image was built on the amd64 GCE host and deployed by digest. Native backend Linux decoding and namespace file/network restrictions passed on that host. The public HTTPS frontend reached the private backend using its reviewed CA and preserved private media/session behavior. The backend container has not been accepted for isolated decoding.
The local Python/ASGI tests exercise the gateway and real workspace together.

## Configuration boundaries

### Verified custom domain (October 16)

`ctrlfvideo.com` is delegated to the public Cloud DNS zone `ctrlfvideo-com` in
this temporary project. Google ownership verification passed using the user's
TXT record alongside the retained SPF. The Cloud Run mapping exists and its
returned A/AAAA records replace the previous parking address. Mapping Ready,
CertificateProvisioned and DomainRoutable are all True. The Google-managed
certificate validates for `ctrlfvideo.com` (TLS 1.3 independently checked from
Tokyo); HTTP returns a 302 redirect to HTTPS. The frontend revision
`ctrlfvideo-frontend-domain-ecbd8db3-1792143729` serves 100% of traffic using the
immutable image tested by [this successful CI run](https://github.com/zipking1988/ctrlf-video/actions/runs/38880993686).
It passed 100 frontend tests and 204 backend tests, including Linux isolation.

The frontend can use `CTRLF_PUBLIC_ORIGIN=https://ctrlfvideo.com` while the
durable backend retains its existing canonical origin. Set gateway-only
`CTRLF_BACKEND_PUBLIC_ORIGIN` to that backend canonical origin (the default is
the frontend public origin). The gateway rejects foreign browser Origins on
unsafe methods and translates only an exactly matched frontend Origin to the
trusted backend canonical origin. It rebuilds Host, preserves the backend's
CSRF/session/ownership checks, and rewrites redirects only for that same canonical
authority to the frontend HTTPS origin. Relative/foreign redirect hosts remain
unchanged. No backend configuration switch, data copy or ownership transfer is
needed for the domain change; retained frontend revisions provide rollback.

The publisher reads `CTRLF_PUBLIC_ORIGIN` from the existing Cloud Run service
instead of assuming the default hostname. Only the existing run.app origin and
`https://ctrlfvideo.com` are accepted; missing/other origins reject the release
before backend work. After cutover, use `https://ctrlfvideo.com`; the default
run.app hostname is retained only as the backend's canonical ingress identity.
Domain mapping and DNS remain within the October 19 cleanup window; a custom
domain does not extend the hosting authorization.

Twenty live HTTPS checks passed: page/session/fixture health, Secure/HttpOnly
cookies, public and private video Range playback, bounded uploaded-media
preflight, finding save/restore, revision conflicts, rejected foreign Origin and
missing CSRF, same-origin redirects and cross-owner access denial. Synthetic API
test sources/desks were deleted afterward. Browser testing separately verified
timestamp seeking, actual playback, finding editing and restoration after reload.
No model requests ran. The operational results, screenshot and DNS recovery export
are private ignored artifacts under `.ctrlf-video-eval/`.

### Component settings

| Component | Required configuration |
| --- | --- |
| Frontend | `CTRLF_COMPONENT=frontend`, `CTRLF_PUBLIC_ORIGIN`, `CTRLF_BACKEND_ORIGIN`, private `CTRLF_GATEWAY_TOKEN`, optional `CTRLF_BACKEND_PUBLIC_ORIGIN`, optional `CTRLF_BACKEND_CA_FILE`, `PORT` |
| Workspace | `CTRLF_COMPONENT=workspace`, canonical `CTRLF_PUBLIC_ORIGIN` (gateway's `CTRLF_BACKEND_PUBLIC_ORIGIN` when different), same private `CTRLF_GATEWAY_TOKEN`, persistent `CTRLF_DATA_DIR`, trusted `CTRLF_RUNTIME_FILE`, backend-only `GEMINI_API_KEY`, `CTRLF_VIDEO_MODE=real` only after prerequisites |

Both origins must be exact HTTPS origins without credentials, path, query or
fragment. They must differ. The shared token must be 32–256 printable ASCII
characters, generated privately later, never copied into this repository.
Store it using a reviewed secret mechanism. It grants ingress access, not media
ownership or model spending; the backend still requires the browser's private
session cookie, CSRF and public-Origin checks.

The gateway discards client-supplied forwarding metadata and gateway tokens,
sets the canonical public Host and injects its private token. It preserves
Range requests, status codes, cookie headers, cache headers, request bodies and
streamed bytes. Backend cookies are Secure whenever a public HTTPS origin is
configured. No public-origin rewriting can bypass the existing CSRF/ownership
checks. With `CTRLF_GATEWAY_TOKEN` configured, all direct backend requests require
the token; an unavailable backend produces an explicit 502.

The gateway limits request bodies to **30 MiB** because its Uvicorn HTTP/1 server
is subject to Cloud Run's 32 MiB HTTP/1 request limit. Oversized declared or
streamed bodies return `gateway_upload_limit_30_mib`; they are never silently
truncated. The original direct local workspace's 500 MiB limit remains intact.
The first cloud prototype should use short files below 30 MiB. Do not raise this
limit without an independently tested larger-upload transport.

## Before any future deployment

1. Obtain explicit authorization for a GCP project, region, resource configuration,
   finite total spending and shutdown policy. Separately approve Gemini calls and
   calibration. Cloud billing alerts are not hard spending cutoffs.
2. Build/review the image and dependencies locally, then select an immutable image
   digest. Provision/push only when separately authorized.
3. Prepare one GCP Linux backend with a persistent local block filesystem (not
   GCS/NFS), appropriate private ownership/permissions and one service process.
   Stop the old workspace before replacement; never run rolling replicas against
   the same SQLite workspace. Back up using a consistent SQLite backup method.
4. Verify bubblewrap namespace/file/network isolation on that exact Linux host
   and container policy. Do not disable decoder isolation or add privileged
   container mode to make a smoke pass. Reject uploads if isolation is unavailable.
5. Terminate backend HTTPS with a valid reviewed certificate, preserve the
   gateway's canonical Host and restrict ingress/network access. The shared token
   does not replace TLS, firewall controls or session ownership. Keep the Gemini
   key and runtime/approval files solely on the durable backend.
6. Validate media deletion/expiry, cookie/CSRF/Origin, CAS, cancellation, database
   restart, unknown-attempt reconciliation and backup restoration on the backend.
7. Configure the public Cloud Run ingress and secret reference only after the
   backend passes. Test forwarding, spoofed headers, uploads, ranges, session
   persistence across gateway restarts and free authorized judge access.
8. Run the authorized real-video smoke in [runtime guide](WORKSPACE_RUNTIME.md),
   retain billing/quality proof and verify the event's deployment requirements.

Rollback keeps the same durable backend/ledger and stops the replacement before
restoring a reviewed version. A gateway rollback never resets or refunds model
attempts. Revoke approvals to prevent subsequent model dispatch; independently
stop/delete cloud resources under the authorized shutdown plan to stop hosting
costs. Application timeout/cancellation cannot prove supplier-side stopped billing.

## Verified initial deployment — October 16, 2026

- Project: `ctrlfvideo` (`655757141159`), region `asia-northeast1`.
- URL: https://ctrlfvideo-frontend-655757141159.asia-northeast1.run.app/
- Frontend: Cloud Run `ctrlfvideo-frontend`, zero minimum/one maximum instance,
  1 vCPU, 512 MiB, concurrency 32; private VPC egress to `10.80.0.10:443`.
- Backend: one `e2-medium` Debian 12 VM `ctrlfvideo-backend`, native Python 3.13
  and locked dependencies under `ctrlfvideo-backend.service`, 20 GiB boot disk,
  10 GiB mounted data disk. API listens behind nginx TLS; ingress is limited to
  the frontend subnet and IAP SSH. The backend service identity can write only
  this project's image repository; the frontend can read only its token/CA secrets.
- At initial deployment the model mode was `fixture`, with no cloud model approvals.
  Later on October 16 the user authorized limited real Gemini testing; the key is
  now solely in the private backend environment. See [live test limits](LIVE_GEMINI_TEST.md).
  It remains absent from frontend configuration, images, browser bundles and Git.
- Separate live probe: Gemini 3.1 Flash-Lite returned a validated observation on
  one public synthetic JPEG (1,157 input / 38 output tokens). A 2.5 Flash probe
  returned 404; an instrumented text probe observed a response but did not complete
  local validation. Reservations remain charged; no unknown request was replayed.
  Probe budgets were revoked. These probes do not accept the full video pipeline.
- Checks: 169 local backend tests passed with one Linux-only skip; all 16 focused
  gateway/TLS/media tests passed on Linux; 100 frontend regressions passed. Browser
  verified synthetic question/evidence, editable finding save/restore and an
  uploaded synthetic file's preflight and private playback. No real UX value claim.
- An initial consistent backup was downloaded locally on October 16 after stopping
  backend writes. Its SHA-256 matched, both copied SQLite databases passed integrity
  checks, and the uploaded source media and private configuration were present.
- A provider-side VM stop is set for `2026-10-19T14:59:00Z` (23:59 JST). Local
  automation `ctrlf-video-backup-and-shutdown` starts at 23:15 JST to stop writes,
  download and verify a consistent private backup, then remove temporary resources.
  It requires an available local host. If backup fails, keep the only data copy
  and report residual storage costs rather than deleting unverified private data.
- One project-scoped JPY 3,000 budget alert excludes credits and notifies at
  50%, 80% and 95%. It is an alert, not a hard supplier cutoff. Credit coverage
  and final billing remain unverified. Do not continue hosting past the approved
  window without a new budget.

Private deployment scripts, model-catalog/usage evidence, revoked and current
credential records, source archives and cleanup inventory are in ignored
`.ctrlf-video-eval/cloud-split/`. Never print their secret contents or commit them.
The Cloud Run UI now says “Saved to workspace” rather than implying device storage.
The user authorized reviewing and pushing these deployment changes to private
`main` on October 16. No public source release is authorized.

## Release process and CI/CD

The user subsequently authorized CI/CD for both components under the same total
JPY 3,000 test ceiling. [GitHub Actions](../.github/workflows/ci-cd.yml) runs tests
on pull requests and main code pushes. Only the successful main workflow can
enter the `gcp-test` environment and obtain deployment credentials. Markdown-only
main pushes skip it. No Cloud Build, Cloud Deploy, second VM, paid-model dispatch
or persistent GitHub runner is introduced. Hosted Linux jobs have finite timeouts,
no uploaded private artifacts and no paid cache configuration.

Workload Identity Federation checks immutable repository/owner IDs, private
visibility, main ref and the exact workflow ref. The deployment service account
has temporary access to this image repository, frontend and backend SSH through
IAP/OS Login, plus only required project metadata/operation reads. All cloud role
bindings expire October 19 at 23:00 JST. There are no service-account keys or
Gemini credentials in GitHub. The OS Login user has only the reviewed release
command in sudoers; the runtime identity and original workspace remain separate.

The auth action explicitly generates an 1,800-second service-account OAuth token
for the bounded 25-minute deployment job. It is masked, written only to a private
runner-temporary file and removed on exit. This avoids refreshing the five-minute
GitHub OIDC assertion during a long native test run. SSH sends keepalives through
IAP; a lost connection still invokes the managed recovery/watchdog safeguards.
See [Google's token inputs](https://github.com/google-github-actions/auth#inputs-generating-oauth-20-access-tokens)
and [gcloud access-token file configuration](https://cloud.google.com/sdk/gcloud/reference/topic/configurations).

The workflow first runs Node frontend tests/build/hash checks, frozen Python
lint/schema/tests and real Linux media isolation. It then builds/pushes the
frontend image and uses its digest. On the backend,
[the release manager](../deploy/gcp/backend_release.py):

1. Reserves a finite release attempt in root-owned durable state, stages a
   separate immutable source directory and installs frozen dependencies. It runs
   backend tests as the unprivileged service user on the actual deployment host.
2. Rejects changes to `workspace.py`, `attempts.py`, `schema.py`, `api.py` or
   `routes.py`. These temporary automatic releases cannot perform migrations or
   incompatible API changes; new frontend/previous backend versions keep the same
   public contract if a hosted runner disappears between components.
3. Creates a fresh owned investigation, enables maintenance at private nginx and
   stops the single backend writer. It archives `/data` plus private configuration
   outside the checkout, restores to a private scratch copy, verifies every file's
   SHA-256 and runs integrity checks on both restored SQLite databases. Insufficient
   free space or a failed restore rejects the release before switching code.
4. Atomically switches the code symlink, starts one backend, and checks the operator-configured model mode without dispatching models,
   health and the retained owned investigation. The backend remains in maintenance
   until the frontend revision is ready. The frontend gets all traffic, the backend
   finalizes, and public UI/session/backend checks must pass.
5. On failure, restores the previous code and previous frontend traffic. It never
   rewinds the live data or financial ledger, resurrects deleted sources, re-owns
   sessions or replays model attempts. Backups remain private recovery copies.

A managed systemd release unit survives SSH loss, recovers on failure/timeout,
and a minute watchdog rolls back an abandoned pending release after ten minutes.
A boot unit restores the previous code before starting an interrupted backend.
Terminal-state maintenance markers are reconciled too. Failed recovery keeps
maintenance and reports operator attention rather than claiming success.

New workflow releases close October 19 at **22:00 JST**; the backend independently
rechecks its **22:45 JST** cutoff before switching/finalizing. IAM expires at
23:00. Final cleanup at 23:15 creates `/etc/ctrlfvideo/deploy-disabled`, stops the
watchdog, and holds `/run/lock/ctrlfvideo-release.lock` while stopping writes and
making the final consistent backup. No deployment may restart the backend after
that marker. The release-attempt backstop includes failed preparation, forced-failure
drills and normal releases; exhaustion requires operator review under the existing
budget. This is a locally chosen automation-loop bound, not a GCP quota or a
monetary budget calculation. Deployments reuse the existing VM and capped frontend;
the attempt count does not measure hosting, storage, network or model charges.
Billing reports can lag or fail; the budget alert is not a hard supplier cap.

On October 17, all 24 attempts were consumed. The user explicitly authorized one
additional attempt for reviewed commit `49bb911`, changing only the root-owned
`max_releases` setting from 24 to 25 under the shared release lock. All prior
release records and other configuration were checked unchanged. The JPY 3,000
total, model restrictions and October 19 cutoffs remain unchanged; this count is
not billing credit. Any further attempt after number 25 needs a new review.

On October 18 the user authorized review of PR #2 and exactly one additional
alpha attempt, bringing the cumulative limit to 26 while retaining all 25
records and the same JPY 3,000 total and cutoffs. The trusted operator pins
`approved_release_sha` to the reviewed alpha commit. A different commit fails
before reservation. No model allowance is included.

The alpha's sole protected API change adds the `X-CTRLF-Upload-Limit` response
header to the session route. After reviewing it, the operator can install
`reviewed_routes_change` with the exact commit and before/after SHA-256 values.
Only `routes.py` can use this exception; mismatched hashes or commits and all
other protected files still fail. The root-owned release control and configuration
must be backed up and installed under the existing shared lock. The candidate
cannot authorize itself. Existing restored-backup, ledger, rollback and cleanup
checks still run. The final main CI run records whether this attempt succeeds.

For local operator commands, the verified project account is
`zipking1988@gmail.com`. Supply all three flags explicitly:
`--account=zipking1988@gmail.com --project=ctrlfvideo --billing-project=ctrlfvideo`.
An inherited work account can report `compute.instances.get` denied even when
this saved personal account already has access. No global account switch or
additional IAM grant is needed for that mismatch.

Attempt 26 completed successfully on October 18: reviewed `9d2dad0` was pushed
to private main and [CI 39089788904](https://github.com/zipking1988/ctrlf-video/actions/runs/39089788904)
deployed both components. The release state is `committed`, with 26/26 attempts
retained. Financial-ledger and runtime hashes are unchanged; no model grant was
added. The consistent release backup was downloaded under
`.ctrlf-video-eval/cloud-backups/2026-10-18-alpha26/` and independently restored
locally: all 30 files and both SQLite databases passed verification. The existing
final cutoff backup/cleanup remains required. Markdown-only handoff updates are
excluded from deployment by the workflow's `paths-ignore` rule.

Later October 18, the user explicitly approved JPY 5,000 aggregate spending,
one fresh JPY 2,000 / 60-call / eight-index-call grant and three further reviewed
deployment attempts. The release configuration now permits 29 cumulative attempts
and retains all 26 earlier records. The user confirmed the sole new grant's
binding to the current named browser workspace after the old session expired.
The billing alert amount changed to JPY 5,000; all project/date/credit/threshold
filters and all model/release/IAM/cleanup cutoffs stayed unchanged.

Attempt 27 deployed reviewed private-main commit `1a980ae` successfully through
[CI 39100631476](https://github.com/zipking1988/ctrlf-video/actions/runs/39100631476).
Upload is the primary landing action; real whole-video answers expose generated
observations and direct contextual follow-up. Grant installation and CI sent zero
new model requests. Actual five-minute source input and three-follow-up acceptance
remained pending at that release; prepared notes are not acceptance evidence. Two release attempts
then remained. The grant's consistent local backup passed all 34 file hashes and both
database integrity checks. See [live test record](LIVE_GEMINI_TEST.md).

Attempts 28 (`7f5f14e`) and 29 (`0ffd59e`) subsequently deployed the fixed
Gemini-vision / ai& Gemma-text split and a contextual-claim/tail-window fix.
[CI 39131832940](https://github.com/zipking1988/ctrlf-video/actions/runs/39131832940)
passed 173 frontend and 268 Linux backend tests, then verified both deployments,
session, configured mode and persistence. Public HTML, workspace module and
generated bundle match the reviewed files. The release state is committed,
29/29: no further deployment is authorized. Markdown-only handoff pushes are
excluded from deployment. The backend key is privately installed; no new IAM
grant or service-account key was needed. Existing explicit account/project/
billing-project CLI flags remain required.

Real indexing, one whole-source answer and three contextual follow-ups completed
on the actual 70.203-second clip. Accuracy acceptance failed; the real five-minute
input remains missing. Current v4 reservations are JPY 751 / 2,000, 18/60 calls
and 2/8 primary calls. The aggregate JPY 5,000 and all original October 19 cutoffs
remain unchanged. A new consistent private backup restored locally with all 363
file hashes and both SQLite checks passing (SHA-256
`3044b6195fccf782c74b0d7bc23c1caa5b1be0d538787f7ea548e8f133a26886`).
Its credentials, sources and financial ledger remain outside Git. This does not
replace the scheduled cutoff backup/cleanup.

Later October 18, the user explicitly authorized exactly one further deployment,
30 cumulative, and pushing the latest reviewed fixes to private main. Attempt 30
contains the prepared-review timeline, actual-result source timeline, corrected
multi-frame event bounds and explicit preview/session readiness notices. The
operator must preserve every prior record and pin the reviewed commit while
changing only `max_releases` from 29 to 30 and `approved_release_sha`. No model
grant, runtime, IAM, resource sizing, JPY 5,000 total or cutoff changes are included.
The existing main-only workflow remains the deployment path; its Linux tests,
consistent restored-backup check, owned-data verification and rollback guards
still apply. This authorization does not grant attempt 31. The deployment result
will be recorded after the matching CI run and production checks finish.

Recovery entry points on the VM (trusted operator only):

```sh
sudo /usr/local/sbin/ctrlfvideo-release recover
sudo /usr/local/sbin/ctrlfvideo-release rollback FULL_PENDING_OR_COMMITTED_SHA
```

`recover` handles interrupted/unfinalized work. `rollback` requires the matching
release and open deployment window. Do not restore live databases from a backup
as an automatic rollback. Disaster data restoration needs a separately reviewed
reconciliation of newer/deleted data and reserved model attempts. Installation is
in [bootstrap_release.py](../deploy/gcp/bootstrap_release.py); release-control or
persistence/API changes need a reviewed operator update, not self-modification.

Verified on October 16, 2026:

- [The main-push pipeline](https://github.com/zipking1988/ctrlf-video/actions/runs/38876396945)
  passed 100 frontend tests, asset rebuild checks, lint/schema checks and 195
  backend tests, including real Linux isolation. The full backend suite also
  passed as the unprivileged service user on the GCE host before switching code.
  The backend deployed commit `712006553cfad5f3725bbc7e84c68bce3382f61b`, and
  its frontend image/revision was created. Public UI, gateway health, fixture-mode
  health and session checks passed. Final operator verification caught that
  `latestReadyRevisionName` still named the old serving revision after
  `--no-traffic`; the tested frontend revision was explicitly promoted to 100%.
  The publisher now checks that exact revision's readiness and resulting traffic
  before finalizing. All 27 deployment regressions passed, including stale
  readiness and traffic-mismatch cases. The deployed application source is
  unchanged by this publisher correction; no additional backend attempt was used.
- [The earlier drill](https://github.com/zipking1988/ctrlf-video/actions/runs/38874962485)
  reached a healthy candidate, intentionally failed and recovered the previous
  code with its owned investigation. That run later lost its SSH connection on
  the normal release and automatically recovered too; the complete run was not
  successful. The final pipeline above verifies the corrected token/keepalives.
- Every live release backup was restored to scratch, checked against per-file
  SHA-256 and both SQLite integrity checks. A private recovery copy was downloaded
  locally and independently verified: 17 files, two intact databases, runtime
  configuration and source media. Operational archives/manifests stay ignored
  under `.ctrlf-video-eval/cloud-backups/`, outside Git and CI artifacts.

The initial four-attempt operator setting was overly restrictive and was increased
to 24 without deleting any records. The custom-domain code release is the fifth
backend attempt, leaving 19 within the same authorized test window. No compute
size, instance cap, model allowance, JPY 3,000 total or deadline is increased.
Billing reconciliation remains unavailable, so this is verified deployment/recovery
evidence, not a verified remaining balance or live model-quality result.

## Primary references

- [Cloud Run container filesystem/lifecycle](https://cloud.google.com/run/docs/container-contract)
- [Cloud Run NFS locking limitation](https://cloud.google.com/run/docs/configuring/services/nfs-volume-mounts)
- [Cloud Run request/response limits](https://cloud.google.com/run/quotas)
- [SQLite WAL same-host requirement](https://www.sqlite.org/wal.html)

## Limited real Gemini operation — October 16

The user subsequently requested real uploaded-video analysis within the same JPY 3,000 total. A JPY 600 shared model sublimit, 40 total model attempts and six primary indexing calls were installed for the deployment and one explicitly identified active browser session. There is no public automatic enrollment. The operator verified a consistent backup before switching the backend to `real`, and set the root-owned expected mode and workflow `CTRLF_EXPECTED_MODE` to `real`. The public custom-domain gateway remains unchanged; credentials stay on the backend.

Two live embedding probes, real ingestion of an uploaded 18-second synthetic clip, and a complete evidence query succeeded. A finding was edited and saved through the public UI. Model spatial wording still needed human correction, so broad model/UX quality acceptance remains open. All nine requests used the same new allowance; JPY 214 was conservatively reserved, leaving JPY 386 of that model allowance at verification time. These are ledger reservations, not invoice charges or a verified remaining GCP balance. See [operating limits and evidence](LIVE_GEMINI_TEST.md).

CI [38884904791](https://github.com/zipking1988/ctrlf-video/actions/runs/38884904791) passed 215 Linux backend tests and 100 frontend tests, then deployed both components from commit `e67468f`. Offline deployment health checks explicitly preserve the operator-selected mode and make no model requests. Model expiry is October 19 at 22:00 JST, ahead of the existing maintenance/backup/removal schedule. No hosting extension, extra service, larger instance or increased total budget was introduced.

A subsequent managed drill under real mode verified backup/candidate health/rollback while preserving every live budget and attempt row and the private runtime. No paid call was added. The real-mode backup was downloaded privately and independently restored/verified locally, including runtime configuration and both SQLite databases. A browser refresh restored the real source-linked finding and playable private source.
