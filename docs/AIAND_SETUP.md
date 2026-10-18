# ai& Gemma setup

Prepared October 18, 2026 at the user's explicit request. This optional adapter
is not live acceptance. Gemini remains the default. Production retains its working Gemini runtime.
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

The signed-in ai& API Keys page already contains a `ctrlfvideo` key created today,
with no recorded use. Its masked value is not a usable credential. The user supplied the full value through the private local file, never chat.
Authenticated catalog access, structured JSON and a single actual source frame
have been verified. The key value is not recorded in these documents.

`.env.aiand` is an ignored, owner-readable local handoff file. Put the full key
after `AIAND_API_KEY=` and save. The application does not automatically load env
files. An operator must inject `AIAND_API_KEY` into the backend process environment
and preserve backend-only storage. Never include the file, full key, browser
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
integration only. The actual five-minute source, live quality and at least three
genuine follow-ups remain pending. Four live calibration requests were made: two 128-image cases were rejected by
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
