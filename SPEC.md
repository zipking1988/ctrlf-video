# CtrlF Video — UX Recording Review

Status: implementation authorized on 2026-10-14. Task-context persistence/capture, recording-purpose labels and structured researcher findings with exports and the selected English desktop workspace are implemented locally. Sports visual annotations, live model acceptance and actual UX validation remain pending. No issue has been filed.

## Decision and purpose

Build a desktop workspace for UX researchers and product designers reviewing recorded usability tests. Help them find visible task interruptions, inspect what happened before and after, ask contextual follow-up questions, and export findings with source evidence.

The user confirmed that the sports video is a technical sample only; UX research remains the product direction. Rebuilding is permitted if necessary, but the useful ownership, media, persistence and evidence safeguards remain requirements. Gemini remains the model provider.

Public discussions are demand signals, not evidence of adoption or willingness to pay. The product hypothesis is that this workflow reduces the time needed to produce a source-verified research finding.

## First use case

A researcher supplies one authorized usability-test recording and the task the participant was asked to complete. They investigate visible errors, returns to earlier screens and changes in task state, then prepare a finding for their product team.

“Create a project and invite a teammate” is an illustrative task, not a verified description of the user's footage. The actual UX recording and task brief are still needed. The user reports having authorized footage, but the supplied YouTube link contains sports highlights.

## Researcher journey

1. Upload one recording and enter the participant's task. Display source duration and analysis/readiness status.
2. Ask a concrete visual question, such as “What happened during the invitation attempt?”
3. Inspect candidate intervals, actual source frames and a description of the visible evidence. Seek the source player to verify context.
4. Select a result and ask a follow-up, such as “What happened next?” or “Was a success state visible later?” Preserve the selected event and source context.
5. Compare before/after evidence. Add a finding that separates observed facts, researcher interpretation and unanswered questions.
6. Export the finding with source identity, time references and limitations. Restore the investigation after refresh.

A pause alone does not establish confusion; a visible error does not establish backend root cause. A success state supports only what the recording shows. Unreviewed footage cannot establish that an event never occurred.

## First-version boundaries

Include one uploaded recording per investigation, a task brief, visual questions, contextual follow-ups, source playback, evidence comparison, editable findings and report export. Keep the canvas focused on the current question and its evidence; existing advanced layout controls need not dominate the demo.

Exclude live screen capture, continuous camera streams, cross-recording statistics, participant emotion inference, automatic root-cause judgments, speech transcription, video editing, autonomous product changes and additional model providers. Region annotations are a later enhancement, not a prerequisite for demonstrating source verification.

## Technical sample and evidence separation

Sample: [Highlights: Maine 13, Villanova 10](https://www.youtube.com/watch?v=-1UXq-FzmQA), published by Maine Black Bears. Title/channel metadata and automatic captions were inspected; the video has not been visually annotated or processed by our Gemini pipeline.

This video also appears in the [VLX-VR author's examples](https://om-ai-lab.github.io/2026_09_07_vlx_vr_en.html). Its published answers/timestamps are known references and must not enter model prompts, retrieval records or expected-output fixtures for an allegedly independent test. Treat this as a development smoke sample, not a held-out benchmark or proof of UX value.

Proposed sample questions, pending manual visual annotation:

- Find a clearly readable brand/title graphic and return the supporting source interval.
- From the selected interval, inspect what appears immediately before and after it.
- Ask about an entity manually verified as absent from a specified reviewed interval; assess scoped uncertainty or absence handling.
- Ask for the commercial sponsorship contract or payment amount; explain that this cannot be established from visible branding alone.

Do not assume that a visible brand is the contractual primary sponsor. Do not use public reference answers as our measured results. The YouTube URL is a reference: the current application accepts local uploads and does not implement arbitrary URL ingestion. A usable local source is still required for application testing.

## References and proposed reuse

| Reference | Relevant idea | Decision |
| --- | --- | --- |
| [VLX-VR](https://github.com/om-ai-lab/VLX-VR) | Seek further evidence when a question remains unresolved | Borrow the investigation pattern, not its model or benchmark claims |
| [VLX-Flow](https://github.com/om-ai-lab/VLX-Flow) | Incremental observations and remembered context | Consider application-level event records; live streaming stays outside v1 |
| [VLX-Seek](https://github.com/om-ai-lab/VLX-Seek) | Refer to specific visual regions | Defer automatic region localization until temporal retrieval is validated |
| [Dovetail](https://dovetail.com/changelog/magic-insight-enhancements/) | Findings linked to playable source evidence | Treat traceable citations as an existing expectation, not unique differentiation |

Gemini application state is not VLX-Flow's internal recurrent cache; explicit evidence IDs are not VLX-Seek's trained region tokens. The differentiating hypothesis is task-focused visual investigation of interface changes, to be tested with researchers.

## Verified starting point and risk

The current local app has upload/preflight/playback, session-owned investigations, a question/evidence canvas and report exports. Gemini adapters have mock-transport coverage; live accuracy, latency and cost remain unverified. Default fixture results are synthetic and never answer uploaded footage.

Relevant source: `src/ctrlf_video/config.py` fixes sampling at a maximum of one frame per second; `schema.py` provides timestamped events/evidence and four final answer statuses; `gemini.py` adapts model requests; `frontend/workbench.jsx` and authored static modules implement the workbench.

The first technical risk is missing small text or short-lived interface states. Evaluate this before committing to a broad rebuild. Preserve source resolution for review and disclose sampling gaps. This spec does not authorize raising protected sampling, resource or spending limits. If the critical event cannot be observed within the supported pipeline, record the failure and revisit scope explicitly.

Keep schema 0.1, ownership/CSRF/expiry checks, revision CAS, context validation, cancellation, budget accounting and isolated decoding. A task brief must be persisted with the investigation and included in captured question context; exact data/API changes belong in the implementation plan after the sample review.

## Acceptance plan

These are proposed v1 demo checks, not replacements for the broader targets in [ARCHITECTURE.md](ARCHITECTURE.md) and [TODOS.md](TODOS.md).

1. Before live runs, freeze a manual annotation sheet with source identity, task, question, relevant start/end times, supporting frames, uncertainty and whether visual evidence can answer it.
2. Every displayed evidence reference resolves to the same uploaded source and a real decoded timestamp. Invalid or invented references fail the run.
3. A successful positive test returns an interval covering the annotated event; preserve raw results and report failures rather than selecting only successful questions.
4. A follow-up retains its selected source/event context. Changing investigations during a request never publishes the answer into the new investigation.
5. Findings and exports distinguish observations from interpretation and retain source references plus unresolved questions. Refresh restores the finding and references.
6. Unsupported audio, inaccessible evidence and unobserved ranges are disclosed. No fixture answer is substituted for a real source.
7. For an actual UX recording, an independent reviewer checks every finding against playback. Measure end-to-end research-task time against manual review, including preparation/indexing separately. Disclose participant/task counts and order effects; a single recording cannot establish general market value.
8. Record processing time, query latency and actual provider usage for authorized live runs. No unmeasured performance claims appear in the demo.

Validation layers: existing backend ownership/evidence/context regressions; focused task-brief/context and export regressions when those behaviors change; frontend navigation/draft restoration tests; one end-to-end recording-to-finding journey. Documentation work alone needs link and whitespace checks.

## Delivery sequence and open inputs

1. Obtain a local technical sample and manually annotate it; do not copy the author's answer into the pipeline.
2. Obtain the actual UX recording and participant task; identify the decisive visual events before fixing demo questions.
3. With the existing required finite budget/media authorization, test Gemini grounding and sampling on those events. Record failures, costs and limits.
4. Implement the smallest necessary task-context, findings and English demo-flow changes. Retain working infrastructure unless concrete evidence justifies replacing it.
5. Run researcher verification, prepare a recorded real-run demo and finalize the submission narrative.

Track recommendation for this narrower workflow: Future of Work & Enterprise Productivity. The previous Media positioning and dashboard selection have not been changed or confirmed; resolve the final single track before submission using [hackathon.md](hackathon.md).

Implementation effort cannot be estimated responsibly until the sample spike identifies whether visual extraction works. Estimate separately for extraction/retrieval, task-context persistence, findings/export, English UI and validation after that result.

Rollback: keep changes separable from the existing fixture workflow; any later storage migration requires a private backup and verified restore path. Preserve the original separate repository and true source lineage. This draft authorizes no live calls, provisioning, publication, pushes or deletion of private footage.
