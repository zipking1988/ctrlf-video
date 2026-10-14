# CtrlF Video — Desktop Workspace Design

Updated: 2026-10-14. Current direction; obsolete ideation and screenshot reviews have been removed.

## Product experience

The spatial investigation canvas is the central workspace. Questions form paths, evidence frames remain connected to their questions, and findings preserve their source. A synchronized player lets users inspect the original footage at absolute timestamps.

The selected canvas-first option 1 is implemented in the existing app. Evidence canvas occupies the desktop workspace beneath the header and toolbar. The source player floats at the bottom left with expand, shrink and hide controls. The agent uses message bubbles in a dismissible bottom-right popover; the round launcher restores it without clearing the draft. The conversation selector returns to stored questions, and Research context expands to edit the task and recording purpose.

Click a finding's title or Edit finding to open its editor on demand. The editor and chat share the right-hand space. Observed facts update the finding's canvas summary immediately; the original source answer remains available separately. Open questions are directly editable and interpretation is expandable. The header retains investigation navigation, save status and report export. Application UI and synthetic demo content are English; existing researcher content is preserved verbatim. Mobile is outside this edition.

The implementation uses canonical demo frames and native video controls instead of generated evidence or decorative player controls. Existing question/finding relationships and researcher-authored notes are retained. Fit view accounts for visible floating tools; large investigations can be zoomed, panned or viewed with both tools minimized. Notices remain visible even when chat is minimized. [Design QA](design-qa.md) records local browser validation and its limits.

## Interaction contracts

- Select a question to establish visible follow-up context. Keep the selected prior question separate from a draft being typed.
- Pin frames or conclusions as independently inspectable objects. Preserve source, question and time references when moving/grouping them.
- Shift-select for multi-select and batch movement; support named groups, alignment, spacing and layout undo/redo.
- Undo/redo affects layout, not model execution, answers or budget reservations. Undo history does not persist across refresh.
- Search current questions, evidence and groups; use minimap, fit view and focus selected for navigation.
- Compare two evidence frames side by side and seek their source timestamps.
- Persist investigation state, notes, drafts, paths and player position. Revision conflicts must be visible and require recovery rather than silent overwrite.

## Visual and accessibility direction

Use the white research-agent direction selected on 2026-10-14: white workspace and panels (`#ffffff`), charcoal text (`#111722`), restrained green actions (`#086b4c`) and a dark prompt-submit button. Gray workspace fills and the earlier navy/orange direction are superseded. Keep the player and image-caption overlays dark (`#17191d`). Status colors retain labeled success, incomplete and error states. Keep Instrument Sans and the licensed icon assets. Use whitespace and fine dividers to separate conversation, findings and evidence. The selected visual reference is `exec-93e1d22f-2d1e-44a2-8764-4962b937f855.png` from the canvas-first ideation set.

The agent panel renders actual stored response data; it does not invent reasoning or execution activity. Synthetic answers are labeled as preset results. Real-answer activity uses the public reviewed-segment count and supporting frames, not private reasoning. Existing sampled-frame and source limitations continue to apply.

Use real buttons, labeled dialogs, keyboard-accessible menus, focus restoration and visible selected/busy/error states. Do not communicate status through color alone. Menu and inspector controls must return focus predictably. Keep playback controls usable independently from canvas navigation.

## Honest states

Fixture answers are synthetic and visibly labeled. Uploaded sources awaiting Gemini setup cannot receive demo results. Model/budget readiness must separate local prerequisites from live verification. Present loading, pending, unknown, partial, no result and processing errors according to the API contracts; preserve user drafts and verified evidence through failures.

Report exports capture the current investigation and disclose unresolved items and source timestamps. Optional embedded evidence creates a shareable copy and needs an explicit export choice. No generated identity or invented speech belongs in an evidence card.

## Implementation

React components: `frontend/workbench.jsx`. Player/session behavior, persistence and canvas geometry: `src/ctrlf_video/static/`. Rebuild after authored frontend changes; never hand-edit the generated bundle. [Canvas/report guide](docs/CANVAS_AND_REPORTS.md) describes current controls. [ARCHITECTURE](ARCHITECTURE.md) governs async ownership and evidence.

The shared palette is defined in `static/styles.css`; workbench styles and canvas connectors consume its semantic tokens. Readable primary, secondary, focused and selected states must be checked together when changing color.
