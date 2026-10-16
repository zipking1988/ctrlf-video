# CtrlF Video — Desktop Workspace Design

Updated: 2026-10-17. Current direction: the user selected the first colorful concept, Coral Fieldnotes.

## Product experience

First use opens a judge-facing research entry page in the selected Coral Fieldnotes palette. The October 17 landing selection is the third displayed design, `exec-69b41fc8-ec56-43d3-b43a-ace1ae36edcd.png`: a deep teal hero with concise copy, a large actual product screenshot and a warm paper question → frame → finding section. Explore synthetic demo is primary; Upload a recording uses the existing upload/preflight path. The product navigation links to the evidence example, API docs and the existing workspace when connected.

Following the product-positioning discussion, the hero explicitly addresses UX researchers: “Turn a UX recording into findings you can verify.” Supporting copy names visual questions, timestamped replay and source-linked exports. The entry states one recording per investigation alongside the preset-demo and approved-session disclosures. This adopts the narrower audience/deliverable positioning without claiming cross-session aggregation, a dedicated OCR pipeline, PDF/share-link export or actual UX validation. AskTape remains an exploratory working name; the product is still CtrlF Video.

Following the screenshot-size annotation, desktop windows at 1100px and below place the complete product image on its own full-width row beneath compact copy and actions. At the annotated 896px width, the image grows from approximately 500px to 826px without cropping or changing its aspect ratio. Wider desktops retain the selected side-by-side composition. Short windows can scroll to inspect the larger image and the evidence section.

The landing's How it works section leads with “Ask what happened. Find where it happened.” and the benefit of finding a moment without scrubbing the whole recording. Three steps explain asking a question, finding relevant moments and replaying before saving. The second step describes the implemented mechanism in plain language: Gemini searches descriptions of sampled frames and reviews relevant segments. A final Explore synthetic demo button opens the same library as the hero action, with the same session/catalog readiness gates. The adjacent worked example stays labeled as a synthetic source with preset answers. Copy does not claim custom model training, exhaustive frame-by-frame tracking or complete event coverage; a shared note below the steps explains that brief events can be missed.

Following the section-balance annotation, How it works uses a pale sage background and a split heading/intro. Its three steps form a joined, equal-height strip: warm coral for the question, deep teal for the actual source frame and mint for the finding. Body text and object labels align across the three panels; labels retain the question → source evidence → source-linked finding relationship. The demo invitation sits in a separate dark teal band. This scoped refinement replaces the earlier open cream columns without changing the hero or the underlying evidence and demo behavior.

The shipped screenshot (`static/landing/workspace-demo.png`) is captured from the actual local fixture workspace at 1280 × 800. It shows a preset question, a pinned source frame at 00:06 and a researcher-saved observation from the existing synthetic package demo. The lower evidence image is the actual existing `static/demo/frames/6.jpg`. This deliberately replaces the concept's basketball sample with the repository's public synthetic source. The screenshot is presentation material, not a new answer or evidence object. No generated mockup, private recording, fabricated UX study, accuracy metric or continuous-motion claim is used. Its original source/answer labels and an adjacent disclosure remain visible. The full-size screenshot opens directly; browser Back returns to the entry.

Returning recordings, drafts, research context, notes and populated investigations restore directly. The explicit `/#start` link keeps the entry visible after restoration; `/#evidence-chain` also keeps it visible and scrolls to How it works after connection. Open workspace returns to the restored desk. An untouched starter demo remains behind the entry page. Upload cancellation or failure keeps the entry available with an actionable notice; session/catalog failures offer reload. The rail brand reopens the entry without clearing the investigation. Demo library has a direct header button as well as its existing menu route.

The default workspace now leads with the recording and a visible question box: “Find a moment in your video.” Review places a native source player on the left and the composer above the answer on the right. A new demo investigation explains the actual 18-second synthetic clip and offers an example question. Clicking a cited timestamp seeks the original video and retains its paused/playing state; adjacent copy asks the user to replay surrounding footage. `/#review` bypasses the landing explicitly. Restoration returns to this usable default even if an older investigation saved a collapsed player or chat.

Review is a desktop layout at widths above 850px. At 896px both the player and question composer are visible together; larger desktops expand both panes. Questions and source status distinguish preset demo results, uploaded recordings awaiting analysis and ready real sources. The demo shortcut is guarded against use with uploaded or local-only sources. Unavailable analysis has a status route to Sources. Audio questions remain unsupported. Drafts, source position, ownership and analysis gates retain their existing behavior.

The Review question composer uses one focus boundary and a full-width text area, with the Ask action in a separate footer row. Follow-up context appears as a short label; the full parent question is retained in its tooltip and accessible description. New question clears the context without discarding the draft. Ready inputs show the Enter shortcut; unavailable analysis hides it and retains the existing status route. Enabled Ask uses dark teal and disabled Ask uses a muted sage treatment.

The spatial canvas remains an optional Canvas view, with question paths, evidence frames, saved findings and its existing layout controls. The rail provides Review, Sources, Findings and Canvas; the menu also provides report export, setup and investigation management. In Review the finding editor replaces the answer pane temporarily; closing it restores the composer. Saving an observation and following up are secondary actions beneath an answer. The existing finding/reference persistence behavior is retained, including creation of a saved reference when entering the finding workflow; this iteration does not introduce draft findings. The product name, English application copy and existing researcher content are preserved. Mobile is outside this edition.

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
