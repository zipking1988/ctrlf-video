# ai& Gemma setup

Updated October 18, 2026 at the user's explicit request. Gemini remains the default
configuration; production now uses the fixed Gemini-vision / Gemma-text split.
The ai& key is installed privately. Full-window all-Gemma activation is blocked
by the live batch failures below; the fixed Gemini-vision / Gemma-text split
avoids that incompatible route without reducing source coverage.

The public [model catalog](https://docs.aiand.com/models/catalog/) and live
`GET https://api.aiand.com/v1/models` list `google/gemma-4-31b-it` with vision and
video capabilities, 262,144 context tokens and 32,768 maximum output tokens.
At this check its public USD rates were $0.20/M input and $0.50/M output tokens;
organization access, billing currency and rates must be checked with its backend
credential. Gemini is not listed. “Gamma” is interpreted as Gemma, not a distinct
model. See [pricing](https://docs.aiand.com/models/pricing/).

## Credential

At setup, the signed-in ai& API Keys page already contained an unused `ctrlfvideo`
key created today. Its masked value was not a usable credential. The user supplied the full value through the private local file, never chat.
Authenticated catalog access, structured JSON and a single actual source frame
have been verified. The key value is not recorded in these documents.

`.env.aiand` is an ignored, owner-readable local handoff file. Put the full key
after `AIAND_API_KEY=` and save. The application does not automatically load env
files. `AIAND_API_KEY` is installed in the backend process environment with
backend-only storage. Never include the file, full key, browser
cookies or operational approval records in Git, screenshots, logs or reports.

## Fixed Gemini vision / Gemma text split

Use [runtime.gemini-aiand.example.json](runtime.gemini-aiand.example.json) for
`provider=gemini_aiand`. Vision and embeddings retain native Gemini; planning,
selection and synthesis use ai& Gemma. `allow_google_media` is required; ai&
receives text only, so `allow_aiand_media` is not required for this split. Each
role has a fixed supplier; no runtime fallback occurs. All requests share the
existing owner/deployment ledger. Original frame resolution, timestamps and
review-window coverage are preserved. New index generations identify the split
explicitly. Templates remain blocked and install no spending approval.

## All-Gemma runtime and transmission

Use [runtime.aiand.example.json](runtime.aiand.example.json) as preparation. It is
deliberately blocked: consent is false, validity expired, costs placeholders and
revisions/calibration references unverified. It installs no spending approval.

- `provider=aiand`: visual descriptions/review, relevance selection, planning and
  synthesis use `google/gemma-4-31b-it` at `https://api.aiand.com/v1`.
- Retrieval embeddings retain native Google Gemini and `GEMINI_API_KEY`. ai& has
  no documented embedding endpoint in the reviewed catalog. Only text reaches
  the embedding endpoint. Both suppliers share the same owner/deployment ledger.
- `allow_aiand_media=true` is separate trusted consent. Google media consent
  cannot authorize transmission to ai&. The original source remains on the
  backend; bounded locally decoded JPEGs carry actual source frame IDs/timestamps.
- The adapter uses inline images through Chat Completions, not ai&'s Files API
  or video uploads. No public video URLs, remote media fetching, transcription,
  automatic retries, automatic model choice or provider fallback are enabled.
- Bounds remain 128 JPEGs, 19 MiB requests, 64 KiB normalized generation text,
  4,096 total completion tokens including reasoning, four MiB responses and the
  existing three visual reviews/one repair. Gemma reasoning is explicitly off.
  Structured output still undergoes the existing server evidence validation.

See [inline vision](https://docs.aiand.com/capabilities/vision/),
[structured outputs](https://docs.aiand.com/capabilities/structured-outputs/) and
[reasoning limits](https://docs.aiand.com/capabilities/reasoning/).

## Activation and acceptance

Verify organization-accessible model identity/pricing, JSON/image behavior,
maximum supported frame inputs and conservative per-call cost bounds before
activation. A runtime/provider change requires a fresh index generation; never
relabel Gemini results as Gemma results. All prior reservations remain charged.
Use the sole existing JPY 2,000 / 60-call / eight-index-call allowance within the
JPY 5,000 aggregate and existing October 19 cutoffs. Calibration consumes that
allowance. ai& account credits are separate from Google Cloud credits; their
presence does not authorize more spending or hosting.

Mock regressions cover ingestion, a whole-source query, three contextual follow-ups,
source playback/ownership, idempotency, wrong origins/models, missing budgets,
external-media rejection and unknown attempts without resend. They establish
integration only. The actual five-minute source remains missing; the shorter live
trial below verifies integration but fails quality acceptance. Four live calibration requests were made: two 128-image cases were rejected by
the inference backend (one too large; one invalid after reducing image size),
then structured text and a single image succeeded. Each rejected request remains
unknown with its reservation retained. Total calibration reservations: JPY 233,
four of the existing 60 calls, zero initial indexing calls. No deployment attempt
was consumed. These are calibration results, not a whole-video product result.

Do not activate this adapter for full-window analysis until a compatible batch
strategy is reviewed and live-verified within existing bounds. Do not silently
reduce timeline coverage or resend the two unknown attempts. The fixed split uses Gemini for those visual requests and Gemma for text; it
must pass its own deployed source/follow-up check before claiming live operation.
The sole existing model grant and all historical charges remain intact.

The split deployed in `7f5f14e` as release 28/29. Its actual 70.203-second source
completed indexing, a whole-clip breakdown and one contextual question. The
breakdown had eight findings/16 citations, but overstated score-change timing;
the first follow-up repeated those claims. Those results remain in the audit.
The subsequent fix removes the misleading “verified evidence” label from prior
model prose, requires frame-specific counter comparisons, and prevents a
near-tail scene from adding a redundant index window. This fix deployed as
`0ffd59e`, release 29/29, through
[CI 39131832940](https://github.com/zipking1988/ctrlf-video/actions/runs/39131832940).
Two further genuine contextual rechecks completed, bringing the trial to one
breakdown plus three follow-ups. All three report `usedContext=true`.

The final answer retracts Atlanta 67 at 00:28 and notices a displayed decrease,
but still reads 00:14 incorrectly, gives contradictory intervals and formats
60.060 seconds as `01:00:06`. It does not adequately analyze on-court sequence or
camera cuts. All original answers remain retained. A separate human-reviewed
finding identifies the actual 62 → 61 display change at 36.036/37.037 seconds;
that correction is not counted as model success. No five-minute or client-quality
acceptance is claimed.

Current grant use: JPY 751 reserved, 18/60 calls and 2/8 primary indexing calls;
remaining JPY 1,249, 42 calls and six primary calls. The two failed visual
calibrations remain unknown with JPY 150 retained. Old JPY 1,162 reservations
remain separate and charged. These are conservative accounting reservations,
not supplier invoices. Actual five-minute admission depends on that source's
preflight windows and the remaining grant. No deployments remain authorized.

The product report preview contains all four questions, one labeled human review
and 49 evidence frames; JSON export reports download started, but its browser
download file was not independently located. Refresh retained the investigation.
A consistent private backup restored locally: all 363 file hashes and both
SQLite checks passed (archive SHA-256
`3044b6195fccf782c74b0d7bc23c1caa5b1be0d538787f7ea548e8f133a26886`).
