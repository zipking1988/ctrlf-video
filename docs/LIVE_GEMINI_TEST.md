# Limited Gemini test on ctrlfvideo.com

Updated October 16, 2026. The user authorized real uploaded-video testing within the existing **JPY 3,000 aggregate cloud/model ceiling**, ending October 19 at 23:59 JST. This does not increase that ceiling or extend hosting. Real mode is active for the approved browser session. One uploaded 18-second synthetic clip completed ingestion, retrieval, visual verification, synthesis and editable finding saving. This is technical validation, not broad accuracy or UX acceptance.

## Test workflow

1. Keep the currently authorized browser session. Open [CtrlF Video](https://ctrlfvideo.com/), refresh, and open **Workspace menu → Model setup** to check prerequisites.
2. Choose **Upload video**. Start with a 30–120 second recording you are authorized to process. Upload runs local media preflight, without a model request.
3. Open **Sources → Start analysis**. This sends sampled JPEG frames to Google's Gemini API. The original video stays on the backend. Indexing also embeds frame descriptions.
4. Open the source and ask a short visual question. Check the cited frames and source timestamps, then edit/save a finding and export the investigation.

The synthetic demo continues to use labeled preset answers. For real analysis, select an uploaded source. Audio transcription is unavailable; do not ask what someone said. Keep observations separate from inferred usability causes.

## Operating limits

- The **JPY 1,200 cumulative model reservation pool is part of the JPY 3,000 total**. It includes JPY 225 in the separate historical calibration ledger (including unknown calls) and JPY 214 already reserved in cloud v1. The replacement v2 grant has JPY 761 available, shared by deployment and the same explicitly approved session; the old unused JPY 386 is revoked, not added. This is an operator allocation, not a GCP quota or JPY 1,200 per visitor/reset.
- The replacement grant limits new model attempts to 48 and initial visual indexing calls to eight; its JPY 761 money cap normally binds first. Atomic owner/deployment reservations enforce the first exhausted limit. Existing v1 usage is retained. There is no public automatic budget enrollment. About three additional single-window short clips plus one question each fit the current conservative bounds; multi-window footage and follow-ups consume more.
- Generation uses `gemini-3.1-flash-lite` (verified revision `3.1-flash-lite-05-2026`); text retrieval uses `gemini-embedding-001` (revision `001`). Credentials stay solely in the private backend environment.
- Every vision call reserves JPY 75; text/relevance calls reserve JPY 8; each embedding batch reserves JPY 10. These are conservative maximum-cost reservations, **not measured invoice charges**. A question requires several calls. Admission may stop a question while a small unusable balance remains.
- Generation text is limited to 64 KiB before/after Unicode normalization; output including thinking is limited to 4,096 tokens. Inline requests remain under 19 MiB, with at most 128 decoded JPEGs. Embedding batches contain at most 100 texts and reject over-length input rather than silently truncating it.
- Pricing bounds use the complete 1,048,576-token generation context for vision, 2,048 tokens per embedding input, JPY 250 per USD as a conservative conversion allowance, and a 10% tax margin. See Google's [pricing](https://ai.google.dev/gemini-api/docs/pricing), [model limits](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite), and [embedding contract](https://ai.google.dev/api/embeddings).
- Unknown or interrupted calls retain their reservations and are never automatically resent or refunded. Redeployment, rollback and backup restoration must not reset the live ledger.
- Model authorization expires October 19 at **22:00 JST**, ahead of the existing backup/shutdown schedule. Source/investigation retention and browser sessions remain 24 hours by default. A new browser/session needs its own trusted operator approval within the same shared deployment allowance.

## October 16 billing reconciliation and allocation

The project-specific `ctrlfvideo-initial-test-20261019` GCP budget reported **JPY 0.00 / JPY 3,000.00, no credits used**, checked October 16 around 20:00 JST. This is reported cost, not proof that incurred usage is zero: the project was created that afternoon and [usage can take more than 24 hours to appear](https://docs.cloud.google.com/billing/docs/how-to/reports). Account-wide charges from other projects are excluded. No CtrlF credits are assumed.

| Allocation through October 19 | JPY |
| --- | ---: |
| Hosting, disks, network, artifacts, DNS and pending billing reserve | 1,500 |
| Cumulative model reservations, including all historical/unknown attempts | 1,200 |
| Unallocated buffer | 300 |
| Total authorized ceiling | 3,000 |

The Cloud Billing Catalog's Tokyo E2 list prices returned JPY 4.405613091 per vCPU-hour and JPY 0.587769396 per GiB-hour. Conservatively counting two full vCPUs and four GiB for the entire roughly 80.84-hour VM window gives about JPY 993 including a 10% tax margin, before disks/network/other services. This is a planning estimate, not an invoice; the JPY 1,500 infrastructure reserve includes additional headroom. The existing single VM, capped Cloud Run frontend, disks and cutoff remain unchanged. The existing budget is alert-only; no supplier-enforced aggregate hard cap is claimed.

Budget rollover explicitly allows query-only use of already-ready v1 indices with the same model identities. New questions charge v2, while original index manifests and all old financial records remain unchanged. Completed/cached ingestion is not repeated. No key, public enrollment, model limit or shutdown extension is introduced.

## Deployment and recovery

CI runs offline frontend/backend tests and verifies health, sessions and persistence without model dispatch. The root-owned release configuration and trusted workflow variable independently select the expected `fixture` or `real` mode; a mismatch fails deployment checks. Code cannot install spending approvals.

The operator takes a consistent, restored-and-verified backup before changing mode. If activation fails, restore the previous runtime configuration and revoke the new allowance; preserve all attempt records. To stop further spending after activation, revoke the active owner/deployment version through the existing local budget operator tool. Switching back to fixture also requires the backend expected mode and workflow `CTRLF_EXPECTED_MODE` to be set to `fixture`. Never rewind the financial database to recover code.

## October 16 live evidence

- Both embedding task types returned HTTP 200 and 3,072-dimensional vectors. The uploaded clip indexed one window, then a real question completed with schema status `ok`, `visual_vector` provenance, seven observations and one actual cited frame at 00:00.
- Before the rollover, the cloud ledger recorded nine completed dispatches and JPY 214 reserved from the original JPY 600 allowance, leaving JPY 386 then available. That unused capacity is superseded by v2, not stacked with it. These figures are not settled Gemini charges or the remaining total GCP budget.
- The source frame visibly contains the box and packing tools. The model called the box centered despite its left-of-center position; the original answer was retained and a human-reviewed finding records this qualification. Contract validation does not prove semantic correctness.
- CI [38884904791](https://github.com/zipking1988/ctrlf-video/actions/runs/38884904791) passed 215 Linux backend tests, 100 frontend tests, build/schema/lint checks, and deployed both components from reviewed commit `e67468f`. Subsequent activation changed private runtime/ledger configuration, with no frontend key.
- A managed real-mode rollback drill reached a healthy candidate, verified a restorable backup, and returned to the prior reviewed code. Runtime and every financial row stayed unchanged; no model calls were added. The local backup was independently restored to a scratch directory and verified by complete file hashes plus both SQLite integrity checks.
- Browser refresh after rollback restored the real question, source and edited finding. The restored private MP4 loaded all 18 seconds and played successfully.
