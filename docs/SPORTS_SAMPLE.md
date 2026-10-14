# Sports technical sample

This is a development smoke test of video evidence retrieval. The product remains UX recording review. This sample cannot establish researcher value, usability, adoption or held-out model accuracy.

## Source and current availability

- URL: https://www.youtube.com/watch?v=-1UXq-FzmQA
- Title: Highlights: Maine 13, Villanova 10
- Channel: Maine Black Bears
- Metadata duration: 171 seconds (2:51).
- Metadata and automatic English captions were retrieved on 2026-10-14.
- Video download returned HTTP 403. No local playable copy or visually verified event annotations were obtained. No Gemini requests were made.
- Local metadata is in ignored `.ctrlf-video-eval/sports-sample/`; do not commit private evaluation artifacts or raw downloader metadata.

The source appears in an author's published VLX-VR example. Keep its reference answer and suggested timestamps outside model inputs and annotations. A locally reviewed annotation is still a development annotation, not a blind benchmark after exposure to that reference.

## Run through the app

1. Obtain an authorized local copy. Run `make run` and upload the file; the app does not accept YouTube URLs as uploads.
2. Allow local preflight to finish. Check duration, decoded preview and private source playback. This needs no model request.
3. In **Research setup**, expand **Sports technical sample**, then select **Use technical test brief**. Verify the selected source is the sports recording. The preset changes the task brief and recording purpose only; it does not import video, answers or annotations.
4. Independently review the video and fill the annotation sheet below before any live analysis. Use actual visible events, not the author's reference answer.
5. Run analysis only when the existing trusted runtime, media consent, calibration and finite budget requirements have been explicitly satisfied. Until then the source remains awaiting configuration; no synthetic answers are allowed for it.
6. Ask the annotated positive question, verify source frames and playback, then select the result and ask a contextual follow-up.
7. Save a finding. Use **Edit research finding** to separate **Observed facts**, **Interpretation / hypothesis** and **Open questions**. Export Markdown, JSON or HTML and verify source identity/times and the technical-sample label.
8. Reload and check the task, finding and references. Record actual failures, elapsed time and usage in the run sheet.

## Annotation sheet — fill before live testing

Store a filled copy in `.ctrlf-video-eval/`, outside Git. Do not mark this template accepted.

| Field | Value |
| --- | --- |
| Local source path / SHA-256 | Not available |
| Verified duration / dimensions | Not inspected locally |
| Reviewer / annotation date | Unassigned |
| Positive question: readable graphic | Pending visual review |
| Relevant interval and supporting frames | Unannotated |
| Follow-up question and supporting interval | Unannotated |
| Absent-target question and fully reviewed interval | Unannotated |
| Unsupported question | What is the contractual sponsorship payment amount? |
| Unsupported-question expectation | State that visible branding cannot establish a contract or payment |
| Short-lived / unreadable evidence | Unmeasured |

## Run sheet

For each question record the frozen input, task brief, source ID/generation, request ID, returned status, returned intervals/frame IDs, manually judged support, unresolved claims and failure code. Record indexing time separately from query time, and supplier usage separately from local budget reservations. Never remove failed or timed-out cases from the denominator.

Current result: **NOT RUN — playable source unavailable and live execution not authorized.** Fixture UI checks and Gemini mock transports validate wiring only.
