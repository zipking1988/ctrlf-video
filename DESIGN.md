# CtrlF Video — Desktop Workspace Design

Updated: 2026-10-16. Current direction: the user selected the first colorful concept, Coral Fieldnotes.

## Product experience

The spatial investigation canvas is the central workspace. Questions form paths, evidence frames remain connected to their questions, and findings preserve their source. A synchronized player lets users inspect the original footage at absolute timestamps.

The spatial canvas sits between a permanent dark teal navigation rail and a docked research panel. A compact source player and the current question's supporting frames share a dark teal dock beneath the canvas. Tools occupy separate grid regions rather than covering graph content. Expand, shrink and hide controls remain available. The agent panel can be minimized; its launcher restores it without clearing the draft. The conversation selector returns to stored questions, and Research context expands to edit the task and recording purpose.

Click a finding's title or Edit finding to open its editor on demand. The editor and chat share the right-hand space. Observed facts update the finding's canvas summary immediately; the original source answer remains available separately. Open questions are directly editable and interpretation is expandable. The header retains investigation navigation, save status and report export. Application UI and synthetic demo content are English; existing researcher content is preserved verbatim. Mobile is outside this edition.

The implementation uses actual source frames and native video controls. Generated invitation-screen artwork is a design reference only and is never inserted as evidence. Supporting thumbnails can be replayed or explicitly pinned to the canvas; pins share the existing eight-finding limit. Question paths arranges questions, pinned frames and conclusions in columns without inventing new evidence relationships. Fit uses the unobstructed canvas bounds. Minimizing tools preserves the current transform and draft; large investigations can be zoomed, panned, searched or focused. Notices remain visible when chat is minimized. [Design QA](design-qa.md) records local browser validation and its limits.

## Interaction contracts

- Select a question to establish visible follow-up context. Keep the selected prior question separate from a draft being typed.
- Pin frames or conclusions as independently inspectable objects. Preserve source, question and time references when moving/grouping them.
- Shift-select for multi-select and batch movement; support named groups, alignment, spacing and layout undo/redo.
- Undo/redo affects layout, not model execution, answers or budget reservations. Undo history does not persist across refresh.
- Search current questions, evidence and groups; use minimap, fit view and focus selected for navigation.
- Compare two evidence frames side by side and seek their source timestamps.
- Persist investigation state, notes, drafts, paths and player position. Revision conflicts must be visible and require recovery rather than silent overwrite.

## Visual and accessibility direction

The October 16 colorful selection supersedes the earlier white/green direction. Use warm paper (`#faf7f2`), ink text (`#192b30`), dark teal navigation (`#084f52`), coral actions (`#ed654b`), pale coral questions (`#fff0e9`), amber evidence (`#fff7e3`) and mint findings (`#e1f2e9`). White/ivory panels keep the recording readable. Retain the dark media surface (`#17191d`), Instrument Sans and licensed Phosphor icons. Color identifies object type; text labels separately communicate type, evidence support and errors. Use spacing and fine dividers, restrained radii and minimal shadows. The selected reference is `exec-82064454-b3cc-4b77-8705-ec266a768c92.png` from the October 16 colorful ideation set.

The agent panel renders actual stored response data; it does not invent reasoning or execution activity. Synthetic answers are labeled as preset results. Real-answer activity uses the public reviewed-segment count and supporting frames, not private reasoning. Existing sampled-frame and source limitations continue to apply.

Use real buttons, labeled dialogs, keyboard-accessible menus, focus restoration and visible selected/busy/error states. Do not communicate status through color alone. Menu and inspector controls must return focus predictably. Keep playback controls usable independently from canvas navigation.

## Honest states

Fixture answers are synthetic and visibly labeled. Uploaded sources awaiting Gemini setup cannot receive demo results. Model/budget readiness must separate local prerequisites from live verification. Present loading, pending, unknown, partial, no result and processing errors according to the API contracts; preserve user drafts and verified evidence through failures.

Report exports capture the current investigation and disclose unresolved items and source timestamps. Optional embedded evidence creates a shareable copy and needs an explicit export choice. No generated identity or invented speech belongs in an evidence card.

## Implementation

React components: `frontend/workbench.jsx`. Player/session behavior, persistence and canvas geometry: `src/ctrlf_video/static/`. Rebuild after authored frontend changes; never hand-edit the generated bundle. [Canvas/report guide](docs/CANVAS_AND_REPORTS.md) describes current controls. [ARCHITECTURE](ARCHITECTURE.md) governs async ownership and evidence.

The shared palette is defined in `static/styles.css`; `static/fieldnotes.css` defines the selected desktop layout and component treatment over the existing workbench styles. Canvas connectors consume the semantic palette. Readable primary, secondary, focused and selected states must be checked together when changing color.
