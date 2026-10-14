# Canvas-first workspace design QA

Date: 2026-10-14

final result: passed

## Target and scope

Selected option 1: `/Users/zip/.codex/generated_images/01a13a7b-3ca9-7902-97f5-5fa8e2c7fc3f/exec-93e1d22f-2d1e-44a2-8764-4962b937f855.png`.

Implementation: http://127.0.0.1:8877/, existing app in local fixture mode. Main comparison uses 1487 × 1058 CSS pixels and same-size image captures. Additional desktop check: 1024 × 800. Source and final implementation were opened together in one image comparison input, after the fixes below. No mobile acceptance is claimed.

Both views show a white evidence canvas, a secondary source player at bottom left, and agent bubbles at bottom right with the editor closed. Content differs intentionally: the existing investigation has four saved objects rather than the six conceptual mock objects. Actual question relationships, synthetic source frames and native video controls are retained; no generated evidence or invented findings were inserted to match the illustration. Arrangement remains editable. This is an implementation of the selected hierarchy and interaction model, not a pixel-identical reproduction of the conceptual graph.

## Fixes and post-fix evidence

Evidence folder: `.ctrlf-video-eval/canvas-bubbles/` (local, ignored).

| Finding | Severity | Resolution | Evidence |
| --- | --- | --- | --- |
| Initial floating tools covered the lower evidence card after Fit | P2 | Fit reserves space for visible tools; desktop Arrange uses available width | `first.jpg`, `final-desktop.jpg`, `narrow-final.jpg` |
| Compact chat put the answer below the visible area | P2 | Answer precedes supporting details; compact composer and revised panel height | `first.jpg`, `final-desktop.jpg`, `narrow-final.jpg` |
| Canvas finding summary still showed the original answer after editing observations | P2 | Summary reflects researcher observations; source answer remains separate | Browser field edit, immediate card update, save and restoration verified; `editor.jpg` |
| Header export opened a hidden dialog when the editor was collapsed | P1 | Report/comparison dialogs render outside the dismissible inspector via a portal | `report.jpg`: visible report with editor closed, close control verified |
| Closing source returned focus to the hidden old rail | P2 | Focus returns to the visible Source launcher | Browser keyboard check and frontend regression |

Final comparison found no remaining P0/P1/P2 issue in the scoped desktop flow.

## Fidelity and interaction checks

- Typography: retained Instrument Sans, clear canvas title, readable question/finding headings and agent answer at the main desktop viewport. No mixed-language application labels introduced.
- Layout: canvas fills the workspace below the header/toolbar. Player, agent and editor are floating tools. Closing panels preserves the canvas transform and draft. Existing fit/zoom/pan and optional minimap remain available.
- Colors: white surfaces, charcoal text, restrained green actions and pale green agent response. No gray workspace fill or invented decorative assets.
- Images/icons: canonical synthetic frames, original source player, existing licensed icon assets. Aspect ratios retained. Reference artwork is not used as evidence.
- Copy: synthetic results remain explicitly labeled. Existing saved researcher content remains verbatim. Findings show source links and editable observed facts/open questions; interpretation is a disclosure.
- Keyboard: chat launcher/minimize, evidence replay, source expand/shrink/Escape, source hide/reopen, finding open/save and report open/close verified. Skip link opens the composer when chat is minimized.
- Persistence: a temporary draft survived chat collapse and page reload. Temporary test text was cleared. Finding edit was saved, reflected on canvas, then restored to its original content and saved again.
- Browser console: no warning/error entries in the checked session.

Full-size comparison images make the primary controls, cards and chat readable; the editor and report received separate state captures. No additional image crops were needed.

## Validation and limits

- `npm run build`: passed; generated bundle and static asset hashes refreshed.
- `npm test`: 100 passed, 0 failed, including floating-panel, draft, playback, finding-save, selection and recovery regressions.
- `git diff --check`: passed.
- Desktop UI verification only. The subsequent code review also passed 166 backend tests and `make check`; model integration uses mock transports. No live Gemini calls, paid resources, deployment or real-video accuracy acceptance.
- P3 follow-up: Fit on a narrow desktop shrinks a wide saved graph substantially. Zoom/pan, Focus and minimizing tools remain available; larger investigations may benefit from richer spatial arrangement in a later iteration.
- Existing question cards retain their evidence previews. The mock's exact graph topology and number of cards are not asserted as implemented data.

The subsequent code review fixed false save confirmation after conflicts, incorrect finding selection under filters, malformed snapshot handling and lost research context during request recovery. Private-main delivery is authorized separately; no public publication or deployment is part of this validation.
