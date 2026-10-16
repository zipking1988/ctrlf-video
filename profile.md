# CtrlF Video — Project Profile

Updated: 2026-10-14. AI Builder Cup 2026 edition.

## Positioning

**Ctrl+F for video.** CtrlF Video is a desktop video investigation agent whose first use case is UX research: help researchers and product designers locate visible events in usability-test recordings, inspect their context and build findings linked to source timestamps. See the [product spec](SPEC.md).

The central workspace is a spatial canvas of questions, evidence frames and conclusions, connected to a source player. Users can follow an investigation path, compare evidence and return to the original footage to check a claim.

**Current product direction: UX recording review.** The user confirmed that the supplied sports video is only a technical sample. Future of Work & Enterprise Productivity is now the recommended track for this narrower workflow; Media, Content & Digital Experiences was the earlier positioning. The final track, registration and dashboard selection remain unverified. Submit under one theme. See [hackathon rules](hackathon.md) and the [official themes](https://aibuildercup.com/themes.html).

## Problem and intended users

UX researchers need to inspect specific moments in a task recording, compare what happened before and after them, and preserve evidence behind their findings. Reducing that review effort is the initial product hypothesis. The actual UX recording and participant task have not yet been supplied for inspection.

| Intended user | Task | Proposed value |
| --- | --- | --- |
| UX researchers | Locate and verify visible task interruptions in usability tests | Questions lead to reviewable frames and source timestamps |
| Product designers | Inspect interface states before and after an event | Follow-up questions and side-by-side evidence comparison |
| Product teams reviewing findings | Check the observations supporting a proposed change | Findings retain source references and distinguish interpretation |

These are target users, not validated customers. Time savings, adoption and accuracy remain to be measured. The Gemini edition currently handles visual questions, including visible text; spoken interviews and audio-only facts are outside its configured capabilities.

## Proposed judge journey

This is the intended real-model demonstration, pending live verification:

1. Upload a short, authorized video and inspect its decoded previews.
2. Complete Gemini analysis, then ask a question about a visible event.
3. Open a returned frame at its absolute source timestamp and verify the answer.
4. Select the question and ask a follow-up about that event or time range.
5. Pin evidence, compare frames, add a conclusion and export the investigation.
6. Ask an unsupported question and inspect the uncertainty or absence of supporting evidence.

Choose footage with manually known answers. Do not prewrite results for an uploaded source. A recording of a verified real run can support the presentation; the labeled synthetic fixture is a separate UI demonstration and cannot establish model performance.

## Current implementation and verification

| Area | Current state | Verification limit |
| --- | --- | --- |
| Desktop canvas | Questions, investigation paths, evidence, findings, grouping, search and layout controls implemented | Local UI and regression evidence; no mobile product |
| Source workflow | Upload, isolated media preflight, timestamped previews and private playback implemented | macOS locally verified; deployed Linux isolation pending |
| Persistence | SQLite investigations, notes, layout, drafts and player position implemented | Session-owned storage; no account-based cross-device collaboration |
| Exports | Markdown, JSON and offline HTML investigation reports implemented | Exports retain source references and unresolved items |
| Gemini pipeline | Native REST adapters for descriptions, embeddings, relevance selection, planning, visual review and synthesis implemented | Mock transports verified integration; no live Gemini acceptance result |
| Cloud deployment | Initial Cloud Run frontend and native durable GCE backend deployed in fixture mode | Upload/playback/persistence and native Linux isolation checked; full live-video acceptance and longer judge hosting pending |

The default mode is **fixture**: explicitly labeled synthetic answers, no model requests. Uploaded videos can be preflighted and played, but cannot receive fixture answers. See [README](README.md), [current Gemini runtime](docs/WORKSPACE_RUNTIME.md) and [deployment preparation](docs/deployment.md).

## AI mechanism and differentiation

The implemented pipeline decodes bounded source windows, creates descriptions and an index, retrieves candidate windows, plans a bounded visual review, validates model output and synthesizes an answer with evidence. Its real-model effectiveness is still unverified.

Gemini has a central role in understanding sampled images and connecting natural-language questions to candidate evidence. Only bounded, locally decoded JPEGs reach Google's fixed Gemini API origin when trusted runtime configuration explicitly permits it. The original video remains on the workspace backend. Embedding, planning, relevance selection and synthesis use text. Gemini relevance selection is not a dedicated reranker with calibrated scores. Audio transcription is not configured for this route.

The differentiation to demonstrate is the connection between conversation, a spatial investigation and source verification. Each question retains its context; evidence can be inspected, compared and incorporated into a finding. This is a product hypothesis, not a proven superiority claim.

## Evidence and scope contracts

- Keep schema version `0.1` and final statuses `ok`, `partial`, `no_result` and `error`; pending/unknown query controls are separate.
- Evidence references actual decoded frames and absolute source-video timestamps. Sampling does not establish frame-perfect event boundaries.
- Validate answers before accepting evidence. Preserve verified partial results and explicitly state unresolved claims and unreviewed ranges.
- Do not infer unverified identities, invent speech or interpret a limited search as proof that an event never occurs anywhere in the video.
- Support levels or scores describe evidence support; they are not calibrated probabilities of truth.
- Preserve ownership, CSRF/Origin checks, expiry, revision CAS, generations and request idempotency. Default retention is 24 hours; private session storage is not an enterprise compliance certification.
- Keep media/resource bounds, isolated decoding and one API/worker process per workspace. Model calls require active owner and deployment budget approvals.

This edition focuses on uploaded video and a desktop visual investigation workflow. Mobile, real-time streams, video editing, identity recognition and cross-video retrieval are outside the current demonstration scope.

## Acceptance and impact evidence still required

The shorter hackathon demo does not waive the evidence, ownership, budgets or acceptance targets in [ARCHITECTURE.md](ARCHITECTURE.md) and [TODOS.md](TODOS.md). This edition is now Gemini-only, with audio transcription explicitly out of scope.

| Inherited target | Target, not measured performance |
| --- | --- |
| Retrieval Recall@5 | At least 80% |
| Questions covering all annotated events at IoU >= 0.5 | At least 70% |
| Output schema validation | At least 99%, with raw and repaired results reported separately |
| One-hour source indexing | At most 30 minutes |
| Query P95 completion latency | At most 15 seconds, including server-side queuing and model stages |
| Evidence support accuracy | At least 90% |

The development-set commitment remains at least 10 videos / 30 questions. The independent frozen report-set goal remains 30 videos / 100 questions. Preserve visual review and hybrid-retrieval comparisons; the existing offline speech diagnostic remains unsupported and cannot pass as part of this visual edition. Failures, refusals and timeouts must remain visible in the evaluation; synthetic fixtures do not count as quality evidence.

For the hackathon, also measure manual search time versus the verified workflow on disclosed tasks, inspect every cited frame and report actual latency and provider cost. Publish only measured results and the tested sample size.

## Submission readiness and provenance

CtrlF Video was imported into a separate private repository on 2026-10-14 from an earlier video-search implementation, whose documented design and implementation began October 2–4. The original repository/workspace remains preserved. This checkout now uses `ctrlf_video` and is Gemini-only. A new name or Git import does not reset the source's development history.

Fresh-project eligibility needs organizer clarification because the original route targeted another event. See [source provenance](docs/provenance.md). Obsolete planning/review documents were removed from this checkout; committed history remains recoverable through Git.

Registration/team eligibility, public source release, full live Gemini video verification, continued deployed judge access, the prescribed English PDF deck and the current dashboard video requirements remain to verify or complete. The initial fixture deployment and one live synthetic-image probe do not complete those requirements; see the current README and deployment record. The repository remains private. The reviewed main push was authorized and completed on October 14; review, fixes and a private main push for the deployment changes were explicitly authorized on October 16. This document authorizes no publication, spending, model calls or provisioning. See [hackathon.md](hackathon.md) for the rule summary and readiness checklist.
