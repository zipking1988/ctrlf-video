# Coral Fieldnotes desktop design QA

## Research entry follow-up, October 16

First use now presents the research purpose, primary recording upload and secondary synthetic demo in the existing palette. The rail brand reopens this entry without clearing work; the header exposes Demo library directly. An untouched starter desk stays behind the entry; recordings, populated investigations, task briefs, notes and drafts restore directly. Demo creation/loading marks its purpose as a technical sample. Service/catalog failure exposes reload, and cancelling or failing upload keeps the entry available. Failed source jobs show the API error code and retained window progress; unknown dispatch outcomes disable another analysis attempt.

Verified locally in the in-app browser at the default 1280 × 720 viewport: entry hierarchy and disclosures, six demo paths, loading a preset path, direct header demo access, populated-desk restoration after refresh, returning to the entry, keyboard search isolation, and uploading the user's new 70.2-second basketball technical sample through the primary action. Private video decoding reached 1280 × 720 and media readyState 4; no browser warning/error was recorded. These local checks made no model requests. The temporary viewport override did not change the measured viewport, so no new 1024px visual verification is claimed.

Updated local validation: 113 frontend tests passed; 218 backend tests passed with the Linux-only isolation test skipped; lint/format/contracts, rebuild and whitespace checks passed. The new source was separately uploaded to the existing funded cloud session. Initial indexing stopped after 1/2 windows with `frame_pts_missing`. A separately reviewed decoder fix (`b38270e`) passed 224 local backend tests and 225 Linux CI tests, then an explicit resume reached 2/2 indexed windows. Actual cloud playback was verified. The first real question subsequently failed with `invalid_tool_request`, with no published evidence; its failed report was exported and the query was not resent. No end-to-end model-quality acceptance is claimed. Screenshots: `research-entry.png`, `nba-index-error.png`, `nba-real-playback.png` and `nba-query-result.png` in the task's local visualization directory. See [live test evidence](docs/LIVE_GEMINI_TEST.md).

Date: 2026-10-16

final result: passed

## Target, implementation and comparison evidence

Selected visual: the first displayed result in the latest colorful ideation set, `/Users/zip/.codex/generated_images/01a14452-3cc0-7292-9187-ec1fb7b2a866/exec-82064454-b3cc-4b77-8705-ec266a768c92.png`.

Implementation: http://127.0.0.1:8877/, the existing application in local fixture mode. Source: 1487 × 1058 pixels. Main implementation capture: 1487 × 1058 pixels at a 1487 × 1058 CSS viewport, density 1. No scaling or density correction was required. Additional desktop checks: 1280 × 720 and 1024 × 800 CSS pixels. Mobile is outside scope.

Local evidence directory: `.ctrlf-video-eval/fieldnotes/` (ignored; screenshots contain only the public synthetic source and test annotations).

- Main implementation: `final-desktop.png`.
- Full-view comparison, with source and implementation in the same image: `comparison-final.jpg` (2974 × 1098 pixels including labels).
- Focused reference/implementation comparison of answer typography, frame rows and actions: `comparison-agent.png`.
- Earlier full comparison: `comparison-first.jpg`; first implementation: `first.png`.
- Additional states: `desktop-1280x720.png`, `desktop-1024x800.png`, `empty.png`, `partial.png`, `editor.png`, `report.png`.

Both main views show an open research panel, source dock, one question, two independent supporting-frame objects and one conclusion. Content intentionally differs: the conceptual invitation flow remains illustration only. The implementation uses canonical synthetic package frames, actual timestamps, a preset answer and source-linked test annotations. Generated UI artwork never becomes video evidence. The graph retains actual question-to-frame/finding relationships; it does not add an unsupported evidence-to-conclusion edge to imitate the mock.

## Findings and comparison history

| Earlier finding | Severity | Fix | Post-fix evidence |
| --- | --- | --- | --- |
| Replay icons inherited thumbnail dimensions; pin icons inherited an image-hiding rule | P1 | Restrict thumbnail styles to direct images and explicitly display row icons | `comparison-agent.png`, `final-desktop.png`; replay and pin/locate controls verified |
| Header content retained a 60px height inside the new 80px header region | P2 | Let the header fill its grid region | `comparison-final.jpg`; measured header is 80px high |
| Floating-tool space reservation made Fit unnecessarily shrink the graph | P2 | Fit the unobstructed docked canvas, with 28px top and 24px bottom insets | `final-desktop.png`; the four-node graph fits at approximately 97% at the main viewport |
| Reopening a panel caused the resize observer to refocus and move the canvas | P2 | Docked-layout resize redraws without changing the viewport transform | Panel collapse/reopen and draft retention checked after the fix |
| Short-window source dock could clip playback-status text | P2 | Increase its compact row allowance and reduce source-heading height | Source dock checked after the change; 1280 × 720 and 1024 × 800 controls stay in view |
| Questions and findings were top-aligned rather than centered beside their evidence | P2 | Center each column within its question's evidence stack during Question paths arrangement | `comparison-final.jpg`, `final-desktop.png` |

The final full-view and focused comparisons found no remaining actionable P0/P1/P2 issue in this desktop scope.

## Required fidelity surfaces

- **Fonts and typography:** retained locally served Instrument Sans and existing language fallbacks. Header uses 24px semibold; canvas titles use 18px, answer text 16px, body text 14px, supporting captions 11–12px. Smaller metadata remains secondary. At the main viewport the fitted graph is near native size. Focus restores a readable individual object on smaller desktops. No clipped primary title or composer at the checked sizes.
- **Spacing and layout:** dark teal permanent rail, warm canvas, integrated right panel and dark teal bottom player follow the selected composition. Measured main regions: 88px rail, 80px header, 62px canvas toolbar, 1007 × 646px canvas, 392px research panel, 210px source dock and 52px view-control row. Panels cannot cover canvas objects. The toolbar and native player differ from the illustration to retain real controls. Question paths preserves real graph parents and editable positions; it does not silently rearrange a saved desk on load.
- **Colors and tokens:** warm paper `#faf7f2`, ink `#192b30`, teal rail `#084f52`, coral actions `#ed654b`, coral questions `#fff0e9`, amber evidence `#fff7e3`, mint findings `#e1f2e9`. Color identifies object type; labels independently convey type and result state. Media keeps dark chrome and light text. Keyboard focus and selection remain visible.
- **Images, icons and asset fidelity:** actual source frames retain their aspect ratio and source URLs. Native playback stays functional. Existing licensed Phosphor icons and font notices remain. No generated evidence, custom replacement icons, decorative raster placeholders or fabricated footage were added. The source dock has the actual two supporting frames rather than inventing the mock's five thumbnails.
- **Copy and content:** English app labels; researcher-entered text is retained. Synthetic answers remain explicitly labeled. Observations, interpretations and open questions stay separate. Unresolved items are expanded under Still to verify. No fabricated model reasoning, confidence metrics, performance claims or transcription features were added. Findings replaces the concept's Notes tab with a working route to the existing editor.

## Interaction and persistence verification

Checked in the in-app browser against the running application:

- Empty investigation; preset question submission; contextual What happened next? and Who moved it? follow-ups; partially verified answer and visible unresolved text.
- Frame replay from the research panel and source strip; explicit pin to canvas; locate an already pinned frame without duplication.
- Source library navigation; source expand/shrink with Escape; source/panel hide and reopen; unsent draft retention through panel changes and refresh.
- Finding selection, title/observation/open-question editing, successful durable Save finding, immediate canvas update and restored findings after reopening the investigation.
- Export report preview includes the saved annotations, source provenance and limitations. Existing export regressions cover serialization; no new live recording/export accuracy claim is made.
- Sources and Investigations libraries, new investigation and return to the original saved desk.
- Fit, Arrange, Focus, selected/busy/saved states and fixed composer at the checked desktop sizes. Larger graphs still require zoom/pan/folding/Focus.
- Browser warning/error log: empty in the final session.

## Validation and limits

- `npm run build`: passed; generated React bundle, retained legal notices and asset hashes updated, including the new authored stylesheet.
- `npm test`: 102 passed, 0 failed; includes new source-library and findings-navigation draft/playback regressions.
- `make test`: 218 passed, 1 skipped (Linux namespace integration on macOS).
- `make check`: passed (lint, formatting and contract-export checks).
- `git diff --check`: passed.
- The initial visual pass used local fixtures, with no paid Gemini calls, budget changes or resource provisioning. Private-main delivery and CI/CD were subsequently authorized. Broad live evidence quality, real UX-recording value, latency and operating costs remain unverified.

## Implementation checklist

- [x] Apply selected palette, typography, navigation and docked composition to the existing app.
- [x] Keep actual evidence, owned APIs, immutable submitted context, eight-pin cap and durable save behavior.
- [x] Fix the P1/P2 findings and inspect final combined comparisons.
- [x] Rebuild generated assets and run the applicable regressions/checks.
- [x] Leave the local preview available for review.

## Follow-up polish

P3: dense investigations can fit below comfortable reading size on a 1024px desktop. Focus, pan/zoom and minimizing tools provide the existing supported navigation; richer narrow-window graph layouts can be considered separately. No mobile acceptance is claimed.

## Pre-push code review follow-up

Reviewed October 16 after the visual implementation. Corrected docked placement being overwritten by the older grid, follow-up/frame collisions, typed-column arrangement after folding and orphaned source pins, editor focus returning to a hidden control, low-contrast focus rings on teal surfaces, and clipped source status/return controls. The dock now scrolls when uploaded-source disclosures need extra space.

Browser verification at 1440 × 900 and 1024 × 768 confirmed nonoverlapping follow-up/pinned cards, frame replay at 00:10, editor close returning focus to the visible Findings rail control, and the playback status remaining inside the compact dock. A synthetic MP4 was uploaded to the local fixture backend and returned to the original saved demo investigation without model analysis. No paid calls were made.

Updated validation: 106 frontend regressions passed; 218 backend tests passed locally with the Linux-only isolation test skipped; lint, format, contract exports, generated bundle/content hashes and whitespace checks passed. The native reviewer and red-team checks ran in the current Codex harness; no separate Claude/outside-model review is claimed.

## Additional independent review and fixes

The independent testing/maintainability reviewers found that the new Sources rail discarded library-load failures. It now uses the existing guarded source-navigation handler. The shared library installs Refresh before its first request, reports failures inside the dialog, and ignores stale errors after a newer library navigation. Failure/retry and stale-response regressions cover these cases while preserving the unsent draft.

The accessibility review found three contrast issues: amber keyboard outlines inherited by the white menu, white text/icons on the expanded menu trigger, and muted playback-recovery text on the teal dock. Menu focus is now teal; the expanded trigger uses coral with dark text/icons; Reload video uses light text and amber hover. Browser inspection verified the computed colors and keyboard focus; local evidence: `.ctrlf-video-eval/fieldnotes/review-menu.png`.

After these fixes, the independent native reviewers and fresh adversarial reviewer reported no remaining actionable findings. Updated checks: 108 frontend tests and 218 backend tests passed, with the macOS Linux-isolation skip unchanged; build, lint/format, contract exports and whitespace checks passed. These reviews use the current Codex harness, not a separately claimed external provider. The real-mode workflow selection, spending approvals, historical reservations and deployment cutoffs remain unchanged.
