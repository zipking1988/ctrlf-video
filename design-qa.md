# Review and private-main release preparation — October 17, 2026

Reviewed the pending scrolling/history implementation and the completed NBA test documentation before the user-authorized private-main release. Testing, maintainability, performance, design and simplification specialists and a fresh native adversarial reviewer found no actionable code defects. The review traced selection through the spatial engine and store, checked retained drafts and mounted History focus, inspected inherited CSS and accepted comparison images, and verified the 12-record bound. Generated code is verified by rebuilding; test/fixture payloads were reviewed in summary mode in the adversarial pass. This is native review in the current Codex harness; no external-provider review is claimed.

Corrected two stale backlog entries: the NBA source is now acquired/playable, and the model-limit entry now records the JPY 1,245 cumulative ceiling and closed grant. Real UX validation, broad accuracy, invoice reconciliation and remaining acceptance work stay open. Fresh local checks: 122 frontend tests; 229 backend tests with the Linux namespace integration test skipped on macOS; Ruff lint/format/contracts; frontend rebuild; static hashes; documentation target and whitespace checks. Hosted CI must exercise Linux isolation and deploy both components after push. No new model calls, index rebuilds, budget changes or resource extensions are part of this release. No new durable learning was identified in this review.

---

# Review scrolling and question history — October 17, 2026

final result: passed for the scoped local interface

Scope: fix the two annotated Review problems: saved-question navigation truncates long titles, and expanded Research context obscures the answer while scrolling is confined to the small answer region. Product Design context preflight returned no saved preferences or reference entries. The annotated production interface is the source; the requested navigation and scrolling changes are intentional deviations.

Findings and changes: P1 — the absolutely positioned research form covered answer content. In Review it now occupies normal flow, and the entire right pane scrolls with max-content grid rows; the answer no longer owns a nested scroll area. The keyboard-focusable region supports Home, Page Down and End. P2 — the native Conversation select hid long questions. Previous/Next controls and an inline expandable History list now provide wrapped full titles, a current-question marker and result metadata. The first iteration's preset metadata was qualified as “Preset answer”; responsive context padding was aligned with the composer and answer. The source pane and Canvas context placement retain their existing behavior.

Visual evidence is in ignored `.ctrlf-video-eval/review-scroll/`. The combined `comparison-open-full.jpg`, `comparison-context.jpg` and `comparison-history.jpg` were inspected as source/current comparisons before acceptance. Source `10-source-open-matched.jpg` and current `08-final-open.jpg` are each 1063 × 898 CSS-sized screenshot pixels. DOM DPR is 2 on production and 1 on local; screenshot API output is already CSS-sized, so no further DPR scaling was applied. The full comparison is 2126 × 930 including a 32px label strip. Focused context and history comparisons are 950 × 460 and 950 × 352. `07-final-history.jpg` shows the accepted expanded list; `history-preview.jpg` is its user-facing navigation crop. `04-local-scrolled.jpg`, `09-final-scrolled.jpg` and the short-screen `06-short-screen-end.jpg` supplement interaction evidence.

Intentional data differences: production contains six real NBA questions and a ready index; local NBA remains an uploaded source without analysis. Navigation and citation checks use three existing saved synthetic questions without model calls. These are not NBA model-quality results. Source playback is at 1 second on production and about 32 seconds in the local context capture. The local task brief was temporarily matched to production for wrapping comparison and then restored. State-dependent answers, disclosures and frames therefore differ intentionally. The preview is restored to the NBA source, with its truthful unavailable-analysis state.

Required fidelity surfaces: **Typography** preserves Instrument Sans, existing answer hierarchy and readable wrapped 13px history titles with quieter 11px status/number text. **Spacing/layout** aligns context, composer and answer gutters, removes the overlapping popup and nested answer scroll, and keeps the source visible independently. Matched 1063 × 898 and short 896 × 640 desktop checks have no horizontal overflow. **Colors** retain warm paper, teal navigation, mint current selection and visible keyboard focus; disabled boundary arrows are distinct. **Images** retain actual native source playback and decoded citation frames; no generated or replacement imagery is introduced. **Copy** uses “Question n of total” and “History”, preserves complete question text, distinguishes preset answers from real statuses, and leaves analysis/audio/sampling disclosures intact.

Interaction evidence: switching Next, Previous and a full-list item retains a newly typed unsent draft; boundary buttons disable correctly, the list closes and its summary regains focus. With context expanded, wheel input over the form scrolls the right pane without moving the source. At 896 × 640, settled scroll positions for Home/Page Down/End were 0/428/813 pixels; the citation region is reachable. The short-screen image was captured during native scroll animation; the final 813px position was confirmed separately from the DOM. Cited 00:13 and 00:06 actions seek the actual synthetic video to 13 and 6 seconds while paused. Canvas/Review round-trip succeeds, and browser warning/error logs are empty. QA-only draft and task-brief edits were removed and the viewport override reset.

Validation: 122 frontend tests, frontend build, Ruff lint/format, contract exports, ten static asset hashes, local documentation targets and whitespace checks passed. Third-party license content is unchanged. No backend behavior, model calls, indexing or spending authorization changed in this UI pass. The prior authorized NBA question and closed allowance are recorded separately in README and the live-test document. This interface change is local and uncommitted; production remains the earlier composer release.

---

# Question composer refinement — October 17, 2026

final result: passed for the scoped local interface

Scope: the user annotated `form#question-form` as ugly. Retain Review, source playback, saved answers and model admission behavior; refine the question control without introducing another overall design direction. Product Design context preflight found no saved preferences or references. The annotated live composer is the visual source, with the requested refinement as an intentional deviation.

Evidence in ignored `.ctrlf-video-eval/composer-refinement/`: `01-source-focused.jpg` is the live, empty focused NBA composer; `05-final-empty.jpg` is the final local empty focused composer; `06-final-draft.jpg` shows the stable enabled action; `07-final-wide.jpg` and `08-final-unavailable.jpg` show the existing local NBA source without analysis. `comparison-full.jpg` and the focused `comparison-composer.jpg` were inspected together. Source/current comparison inputs are both 896 × 988 CSS/image pixels; DOM DPR 2 does not require additional scaling for these screenshot API outputs. Full comparison is 1792 × 1020 with a 32px label strip; the native-scale composer comparison is 770 × 244. Wide check is 1440 × 1024. The comparison uses local preset data for no-cost input interaction checks; source title, answer and disclosure differ from live NBA data. This is not replacement evidence for NBA model quality. The local preview was restored to the NBA source afterward.

Required fidelity surfaces: **Typography** retains Instrument Sans, with 16px input, a compact 11px context label and 13px action. **Spacing/layout** removes the nested textarea outline, expands input width from 261px to 343px at the matched viewport and moves Ask into a footer row; the form intentionally grows from 133px to 168px. Both desktop widths have no horizontal overflow. **Colors** use the existing teal with a pale sage surface; the first placeholder contrast was insufficient and was corrected to approximately 4.7:1. Enabled white-on-teal text is approximately 6.7:1; disabled action has a separate muted treatment. Focus is visible on the outer form. **Images** preserve actual native source playback and all existing frames; no generated asset was introduced. **Copy** replaces the truncated parent sentence with Follow-up, retains its full question as tooltip and accessible description, and keeps preset, sampling, audio and analysis-state disclosures accurate. Disabled inputs hide the Enter shortcut.

Interaction checks: typing enables the dark teal action; Shift+Enter adds a line and Enter submits the existing preset flow. New question clears the parent description and restores Question while preserving a typed draft. Existing follow-up anchoring regression checks the new label and full parent. Uploaded NBA playback reaches readyState 4, the unavailable composer stays disabled and the keyboard hint stays hidden. Browser warning/error logs were empty. Final viewport override was reset. Mobile is outside scope.

Validation: 122 frontend regressions, frontend build, Ruff lint/format, contract checks, static asset hashes and whitespace checks passed. No backend/model behavior changed and no new model calls, index rebuilds or budget changes occurred. This refinement remains local, uncommitted and undeployed. The separately authorized allowance adjustment still awaits Google reauthentication and a fresh ledger audit.

---

# Code review and private-main release preparation — October 17, 2026

Scope: the user explicitly requested review, fixes and a push to private main. Reviewed the complete pending authored diff, surrounding navigation/persistence/canvas callers and test bodies using the review checklist. A separate native adversarial reviewer reviewed authored code and callers, excluding the generated bundle and reviewing tests/fixtures in summary mode. No outside-provider review was invoked.

Fixed findings:

- P2: Review hides the Canvas viewport, but graph drawing measured zero-sized cards and layout operations mutated its hidden geometry. Skip drawing, fitting and revealing while the viewport has no extent; retain geometry and manual positions until Canvas is measurable. Added two regressions covering hidden dimensions, later insertion and visible fitting.
- P2: explicit Locate actions could reveal a target inside the hidden Canvas. Saved-frame, question-details and finding Locate actions now open Canvas first; ordinary conversation selection stays in Review. Added a navigation regression.
- P2: multi-selection controls were outside the hidden viewport and could remain over Review. Hide the Canvas batch toolbar in Review without clearing the selection.
- Documentation: README and canvas/report instructions now describe Review as default, Canvas as optional and report export through the menu. Existing limited NBA evidence and real UX validation limits remain explicit.

Fresh validation: 122 frontend tests passed; 229 backend tests passed and one Linux namespace integration test was skipped on macOS. `make check`, frontend build, ten asset hashes, local documentation links and whitespace checks passed. The final independent re-review returned no further concrete findings. Generated frontend output was rebuilt from authored JSX; third-party license content was unchanged.

Browser evidence: `review-reviewed-final.jpg` in ignored `.ctrlf-video-eval/workspace-first-use/`. Pinning 00:06 then choosing Locate opened visible Canvas with actual nonzero card sizes. A new synthetic follow-up added while in Review remained separate from the existing question and evidence when returning to Canvas; measured rectangles did not overlap. A two-card selection exposed batch tools in Canvas, then Review hid them while keeping the question composer visible. Existing private media, local data and QA captures remain ignored. No new paid model calls or budget changes were made. Hosted CI/deployment outcome is reported separately after pushing.

---

# Review-first workspace — October 17, 2026

final result: passed for the local preset workflow

Scope: after the user rejected all three generated concepts as unclear, implement their agreed plain workflow directly: watch a recording, ask a question, replay cited moments. The existing application and explicit interaction requirements are the reference; none of the rejected images is a selected fidelity target. Backend/model behavior and the previous landing refinements are preserved.

The audit found the primary question control collapsed into a launcher, oversized empty canvas space and small graph cards that obscured the purpose. Review now gives the recording and question/answer pane equal desktop weight, keeps the composer visible at the top and labels citation actions “Watch this moment.” Canvas, findings and exports remain accessible as secondary functions. Uploaded, unavailable-analysis and preset-demo states have distinct instructions. The demo shortcut cannot dispatch for an uploaded or local-only source. The existing finding/reference creation behavior remains unchanged; draft-finding semantics are outside this iteration.

Screenshots in ignored `.ctrlf-video-eval/workspace-first-use/`: original `01-workspace-entry.jpg`; `review-empty-final.jpg`; `review-upload-final.jpg`; `review-final-896.jpg` (896 × 988); `review-final-wide.jpg` (1440 × 1024). The combined comparison `review-comparison.jpg` (1792 × 1020, with a 32px label strip) uses the same 896 × 988 CSS-sized screenshots; no additional DPR scaling is needed. The before/after comparison intentionally changes the information architecture, not merely visual styling. Typography uses the existing Instrument Sans; the primary instruction, source title, composer and answer have separate hierarchy. Spacing/layout keeps both main panes visible, with independent scrolling and no horizontal overflow at both tested desktop widths. Colors retain warm paper, teal navigation, coral actions and mint citations. Images are actual source frames with the native video player; no concept bitmap is presented as product evidence. Copy states the action, preset/no-call status, sampled-frame limitations and unavailable-analysis recovery. Mobile remains outside scope.

Browser checks: manually submitted the center-package question and used the empty-state example; replaying 00:06 sought and paused the actual source at 6 seconds. View switching retained a draft and player position; closing the finding editor restored the composer. Sources restored the existing NBA upload and actual playback while keeping questions blocked without analysis. Menu → Export report opened the existing report dialog. A separate demo investigation was created without replacing existing investigations. During refresh verification, a citation seek did not trigger persistence after pointerup; settled seek/pause events now schedule the existing save, with a regression ensuring no repeated writes for an unchanged position. Continuous playback still does not cause draining saves. A browser reload then restored the source at exactly 6 seconds, paused with readyState 4; final browser warnings/errors were empty.

Validation: 119 frontend tests, frontend build, Ruff lint/format and contract checks passed. No new Gemini calls, backend changes, budgets, commits, pushes or deployments. Synthetic workflow verification does not establish real UX research usefulness or model accuracy. Existing live person-matching limitations remain as recorded in the live-test document. Standalone downloaded HTML rendering remains unverified because the prior browser file-URL access was blocked.

---

# Final frontend workflow verification — October 17, 2026

final result: passed

Scope: close out the pending landing/frontend refinements and verify the existing local user journey. No additional frontend blocker was found in the checked path, so no new runtime/backend changes were needed. This pass does not claim real-model or UX research acceptance.

Fresh checks: 114 frontend tests passed; `make check` passed Ruff lint, formatting for 60 files and contract export verification. `npm run build`, all 10 static asset hashes and `git diff --check` passed. The preceding scoped visual comparisons remain the source/implementation design evidence; no layout or copy changed in this verification pass.

Browser workflow evidence (ignored `.ctrlf-video-eval/landing/`):

- The user's later YouTube sample is `https://www.youtube.com/watch?v=WZwbp2nNFhY`. The existing local basketball file matches the previously recorded SHA-256 `dfc0d9d33bcd62d2e8b3b8451f30ca4577c8ae79e83faf11b936d3f53a2a3374`, duration 70.203467 seconds, 1280 × 720, 19,915,125 bytes. No new video download was needed. The earlier Maine/Villanova link was also confirmed as a separate 171-second source and was not used for this regression.
- Upload/preflight completed in the existing local fixture preview. The player loaded the actual NBA footage, played, and paused at 6.859617 seconds with no media error. Recording purpose was set to Technical sample with a technical test objective. `final-upload-nba.jpg` records the preflight/blocked-analysis state; `final-nba-playback.jpg` records actual playback.
- Start analysis and question submission stayed unavailable without model configuration. No preset answer was applied to the uploaded source. Source-library round-trip restored its technical purpose and paused playback independently of the synthetic desk.
- The Track positions synthetic path loaded three preset questions. Clicking the 00:06 citation sought the paused original source to exactly 6 seconds. A source frame was pinned, then a finding was saved with observed facts and an unresolved question. `final-finding-saved.jpg` shows the source-linked finding editor and canvas. All content remains explicitly synthetic/technical.
- Actual browser downloads of Markdown, JSON and HTML were copied to `final-workflow-report.md`, `.json` and `.html`. File checks confirmed three retained questions, two saved objects, three evidence frames from the correct source, the authored observation and unknown, and all three evidence images embedded in HTML. The application's report preview was inspected. Standalone file-URL rendering of the downloaded HTML was blocked by browser policy; no alternative browser/server workaround was attempted, so independent HTML rendering remains unverified in this pass.
- Reload at `/#evidence-chain` showed the landing explanation as intended. Open workspace restored the synthetic finding, authored fields, supporting frames and paused source at 6 seconds. Switching back to the NBA investigation retained its independent state. No fixture result was substituted for it.

Limits: no new Gemini calls, index rebuilds or allowance changes occurred. Earlier NBA live results include a verified scoreboard/source-timestamp flow and unresolved person-matching false positives, as retained in `docs/LIVE_GEMINI_TEST.md`; this local pass neither reruns nor upgrades that quality evidence. No real UX usability session is available yet. No source publication, commit, push or deployment was performed. Private/local media and exported test reports remain ignored.

---

# UX researcher positioning — October 17, 2026

final result: passed

Scope: adopt the agreed UX researcher and source-linked finding positioning in the existing hero, while preserving the single-recording implementation and product name. No cross-session feature or AskTape rename was implemented.

Source capture: `.ctrlf-video-eval/landing/ux-position-before.jpg`; implementation capture: `ux-position-after.jpg` in the same directory. Both show the initial landing at 896 × 988 CSS/image pixels. Final DOM DPR is 2; the screenshot API provides CSS-sized output, so no additional density conversion was needed. Combined comparison `ux-position-comparison.jpg` (1792 × 1020, including a 32px label strip) was inspected together. Wide evidence: `ux-position-wide.jpg` at 1440 × 1104 CSS/image pixels. No focused crop was necessary because the copy, controls, labels and full product image are readable in the combined view.

Fonts/typography: existing Instrument Sans and hierarchy remain; the new headline wraps legibly at both desktop widths. Spacing/layout: the compact intro, complete enlarged product screenshot and working controls remain visible at 896px, with no horizontal overflow at either tested width. At 1440px the three-line headline and additional source-limit disclosure naturally increase the hero height to approximately 751px; this is an accepted consequence of the requested positioning, not clipping. Colors/tokens: the existing teal/coral palette remains unchanged. Image quality: the actual labeled synthetic workspace image is unchanged and retains its aspect ratio. Copy: the hero addresses UX researchers, describes visual questions, timestamped replay and source-linked exports, and explicitly states one recording per investigation. Preset-demo and approved-session disclosures remain. Cross-session aggregation, dedicated OCR, PDF and share-link exports are not claimed.

The first combined comparison found no actionable P0/P1/P2 issue and required no visual correction. Browser warning/error logs were empty. Temporary viewport overrides were reset and the hero remains open. This is not a full accessibility certification or evidence of actual UX research value.

Validation: frontend build, 10 asset hashes, README/DESIGN local links and whitespace checks passed. This edit changes only HTML copy and documentation; the preceding 114 frontend behavioral tests remain the latest test run. No new model calls, commits, pushes or deployments occurred.

---

# How it works balance and color refinement — October 17, 2026

final result: passed

Scope: the user's annotation on `section#evidence-chain` described the section as imbalanced and too white. Preserve the landing, actual assets, evidence claims and interaction behavior while giving this section stronger visual weight and a more coherent composition.

Visual target: the annotated existing section, captured locally as `.ctrlf-video-eval/landing/balance-before.jpg` (896 × 988), with the user's requested balance/color changes as intentional deviations. Implementation evidence: `balance-first.jpg`, `balance-final.jpg` (both 896 × 988) and `balance-wide.jpg` (1440 × 1104), all in the same ignored directory. Combined source/current comparison: `balance-comparison.jpg` (1792 × 1020, including a 32px label strip). Both inputs use the same 896 × 988 CSS viewport and CSS-sized screenshot output; the final DOM reported DPR 2. No extra pixel-density conversion was required. Both views show the landing's end, with naturally different scroll offsets from the revised section height. The full comparison is readable enough to assess typography, alignment, image and labels; no focused crop was needed.

Findings and iteration:

- P2 from annotation/audit: sparse cream columns made the image-heavy middle dominate the two text columns. Replace the open columns with a continuous coral/teal/mint strip on sage, with equal panel heights and explicit question/evidence/finding footers. Split the heading and intro and give the final invitation a dark teal band. `balance-first.jpg` records this first revision.
- P2 in first revision: the explanatory paragraphs started at different heights because each column sized its own text row. Reserve matching paragraph rows at both desktop breakpoints. In `balance-final.jpg` all three paragraph tops measure 486.55px; at 1440px all measure 620.59px. The final combined comparison shows the aligned panel headings, body copy and footer labels with no remaining actionable P0/P1/P2 finding.

Required fidelity surfaces: Instrument Sans remains, with larger step numbers, deliberate two-line section heading and readable quotes. The joined grid and matched rows balance layout rhythm; the split intro and darker invitation create clear section hierarchy. Sage, coral, teal and mint replace the near-white expanse while retaining ink text and light text on dark panels. The actual synthetic 00:06 source image is unchanged, uncropped and naturally scaled. Preset/no-call labels, approved-session requirement, original timestamps and sampling limitations remain explicit. The shortened example label and object footers introduce no accuracy or custom-training claim.

Browser verification: no horizontal overflow at 896px or 1440px, no warning/error logs, and the final demo button opens the existing six-path preset library. No scenario replacement or model call was needed. The viewport override was reset and the local explanation was left open. This is not a full accessibility certification.

Validation: frontend build, 10 asset hashes and whitespace checks passed. The preceding 114 frontend regressions passed for the shared interaction code; this refinement changes only HTML/CSS and does not require another behavioral suite. The work remains local and undeployed. No spending, cloud configuration or private-source changes occurred.

---

# How it works audit fixes — October 17, 2026

final result: passed

Scope: implement the user's approval of the latest Product Design audit: simplify the explanation, add an end-of-section demo action and repair direct entry through `/#evidence-chain`. This supersedes the earlier copy-only assessment below, which did not catch returning-session deep-link behavior or the missing final action.

Source visual truth: `.ctrlf-video-eval/landing/audit-how/03-section-end.jpg` (896 × 988); implementation: `.ctrlf-video-eval/landing/how-refined.jpg` (896 × 988), both desktop at DPR 1. The combined comparison `.ctrlf-video-eval/landing/how-refined-comparison.jpg` is 1792 × 1020, showing both captures at native scale with a 32px label strip. Both show the end of the same landing, with different vertical offsets because the approved copy and new action change section height. This is an intentional copy/interaction refinement, not pixel-identical reproduction. No density normalization was needed. All section text, controls and imagery are readable in the combined input, so a focused crop was unnecessary. Wide-desktop evidence: `.ctrlf-video-eval/landing/how-refined-1440.jpg` (1440 × 1104 CSS/image pixels, DPR 1).

Audit findings and completed fixes:

- P2: the mechanism paragraph required reading technical retrieval terms before understanding the benefit. Lead with “Ask what happened. Find where it happened.”, explain avoiding manual scrubbing, shorten steps and keep the sampled-frame mechanism in step two. The combined post-fix comparison shows the simpler hierarchy.
- P2: the section ended without a next action. Add Explore synthetic demo after the shared sampling limitation; it uses the hero action's existing library path and session/catalog gates. Browser verification opened the six-path library without loading a new scenario or making model calls.
- P2: a returning session opening `/#evidence-chain` restored the workspace instead of showing the explanation (audit evidence `audit-how/04-direct-link.jpg`). Entry now shows and scrolls the landing after restoration. Reloading that exact URL displayed the complete explanation and its enabled final action; closing the demo library confirmed the existing Track positions investigation was retained. The new regression also confirms a normal returning root still bypasses the landing.

Required fidelity surfaces: Instrument Sans, hierarchy and weights remain consistent; the new heading is legible at 896px and 1440px. Existing three-column spacing and source-image alignment remain, with the shared limitation and final action separated by clear rhythm and fine dividers. Teal, cream, coral and object-type colors remain unchanged; the final button has a teal keyboard focus outline on cream. The actual synthetic product and source images keep their original aspect ratios, sharpness, timestamps and labels. Copy retains the approved-session requirement, preset-answer labels, sampling limits and absence of model-accuracy claims. No custom-trained or exhaustive tracking claim was added.

The combined comparison and wide capture found no remaining actionable P0/P1/P2 issue; no additional visual correction was needed. At 1440px the scroll container has no horizontal overflow. Browser warning/error logs were empty. Temporary viewport overrides were reset and the local explanation was left open. This is not a full accessibility certification or a model-quality evaluation.

Validation: 114 frontend tests passed, including direct-link/restored-session and final-demo-action coverage; frontend build, asset hashes and whitespace checks passed. Backend behavior did not change. These changes and the earlier image/copy refinements remain local, uncommitted and undeployed. No model requests or cloud changes were made.

---

# How it works copy follow-up — October 17, 2026

final result: passed

The user requested an explanation of how the product finds relevant video moments. The landing now explains approved Gemini analysis, searchable visual descriptions of sampled frames, retrieval of candidate moments, visual review and source-timestamp replay before a researcher saves a finding. The description is grounded in `ARCHITECTURE.md` and `src/ctrlf_video/agent.py`. It claims neither custom model training nor exhaustive frame-by-frame tracking. Brief-event limitations and synthetic/preset example labels remain visible.

Local evidence in `.ctrlf-video-eval/landing/`: `how-before.png`, `how-after.png`, `how-comparison.jpg` and `how-hero.png`. The before/after captures are both 896 × 988 CSS/image pixels at DPR 1 and were inspected together. Their vertical offsets differ because the expanded explanation changes the section height; this is a copy/legibility comparison, not a pixel-equality claim. No normalization or separate focused crop was necessary for the complete visible explanation.

The comparison found no actionable P0/P1/P2 issue and needed no further visual iteration. At 896px the How it works heading, mechanism, synthetic example label and three steps remain readable without horizontal overflow; the enlarged product figure ends at 948.01px in the 988px initial viewport. At 1440px, a DOM geometry check confirmed the original 718px hero height and no horizontal overflow. The navigation reaches the existing evidence section. Browser warning/error logs were empty.

The frontend rebuild, asset hashes, documentation links and whitespace checks passed. No JS/runtime logic changed in this follow-up, so existing behavioral tests were not repeated. This local refinement preserves the pending image-size change and is not committed, pushed or deployed. No model calls were made.

---

# Product image size follow-up — October 17, 2026

final result: passed

Scope: the user's browser annotation on `figure.welcome-product img` at https://ctrlfvideo.com/#start requested a larger product image in an 896 × 988 desktop window. This is a local CSS refinement of the selected third landing design, with the same image, copy, controls and colors.

Evidence in `.ctrlf-video-eval/landing/`:

- `image-size-before.png` and `image-size-after.png`: original and revised 896 × 988 CSS/image-pixel captures, DPR 1.
- `image-size-comparison.jpg`: both captures together at their native scale, inspected as one comparison; no normalization required.
- `image-size-1024.png`: 1024 × 800 desktop, larger image in a scrollable page.
- `image-size-1440.png`: 1440 × 1104 desktop, original side-by-side layout retained.

At widths up to 1100px, the image now uses its own full-width row below compact copy and controls. At 896px its measured width increased from 499.90px to 825.91px (approximately 65%); its figure ends at 925.51px and fits fully within the annotated 988px viewport. At 1024px the image is 944.19px wide with no horizontal overflow. Its natural aspect ratio and source labels remain intact; short windows scroll normally. Both actions stay visible above the image. At 1440px, the original two-column geometry remains, with the image at 884.69px wide.

The combined comparison found no actionable P0/P1/P2 issue and required no further visual iteration. A separate focused crop was unnecessary because the full-size same-viewport comparison directly shows the annotated image and surrounding controls. No image replacement, generated evidence, app-workflow change or backend change was made.

Validation: frontend build and content hashes, 113 existing frontend tests and whitespace checks passed. Browser warning/error logs were empty. No new backend suite was required for this CSS-only change. This refinement has not been committed, pushed or deployed; the earlier deployment is unchanged. Temporary viewport overrides were reset and the local preview was left open.

---

# Landing redesign QA — October 17, 2026

final result: passed

## Target and evidence

Selected target: the third displayed image in the October 17 landing ideation set, `/Users/zip/.codex/generated_images/01a1456f-6908-7612-af76-92d8053b646a/exec-69b41fc8-ec56-43d3-b43a-ace1ae36edcd.png` (1434 × 1097).

Implementation: http://127.0.0.1:8879/#start, the existing application in fixture mode, using separate temporary storage. Browser viewport and final screenshot: 1440 × 1104 CSS/image pixels, DPR 1. The source is scaled by less than 1%, preserving aspect ratio and padding the remaining pixels for the combined comparison. Both views show the landing at its initial scroll position. The conceptual basketball content is deliberately replaced by actual public synthetic-demo content; no pixel-fidelity claim is made for the inner application screenshot.

Current local evidence is under `.ctrlf-video-eval/landing/` (ignored):

- `first.png` and `comparison-first.jpg`: first implementation and combined source/implementation comparison.
- `revised.png` and `comparison-revised.jpg`: corrected headline and hero image geometry.
- `final-desktop.png` and `comparison-final.jpg`: final implementation and aspect-preserving combined comparison, inspected together.
- `proof.png`: scrolled evidence chain, timestamp, source limitations and footer.
- `desktop-1024.png`: 1024 × 800 desktop layout; no horizontal overflow; both primary controls remain visible and enabled.
- `upload.png`: completed local upload/preflight with analysis unavailable and no model dispatch.

The full comparison resolves the hero layout, headline wrapping, product proportions and evidence section; separate cropped comparison was unnecessary for this landing. The product screenshot itself was inspected at its original 1280 × 800 size and its full-size link was verified in the browser.

## Intentional content and accessibility choices

- Keep the chosen deep teal hero, large flat product image, warm paper proof section, Instrument Sans and licensed Phosphor icons. No generated design image is used as a source frame or product screenshot.
- The hero uses `static/landing/workspace-demo.png`, captured from the actual local fixture UI. The question, pinned 00:06 frame and researcher-saved finding are real UI objects. The source image below is the existing `static/demo/frames/6.jpg`.
- Synthetic source and preset-answer labels remain in the product image and adjacent copy. The page discloses the approved-session requirement, unavailable transcription and limits of the static synthetic scenes. It makes no measured accuracy or productivity claims.
- Replace the concept's unavailable Support link with working Evidence navigation. Keep the existing API docs destination and label it precisely. The full-size screenshot uses direct navigation and browser Back.
- Use dark text on the coral primary button for contrast, amber keyboard outlines on teal, labeled navigation and decorative empty-alt icons. Respect reduced motion. This is not a full accessibility certification.
- Additional source-limit and footer copy remains scrollable below the reference's frame; persistent controls are not clipped. Mobile remains out of scope.

## Comparison history

| Finding | Severity | Fix | Final evidence |
| --- | --- | --- | --- |
| Main headline wrapped to three lines instead of two at 1440px; hero image began lower than the target | P2 | Adjust the headline scale, align the real product image to the top and recapture it at 1280 × 800 without stretching | `comparison-final.jpg`: two-line headline, image begins near 102px and teal stage ends at 718px |
| A new-tab image link did not produce a verifiable image view in the in-app browser | P2 | Use direct same-tab image navigation | Browser showed `workspace-demo.png (1280×800)`; Back returned to the landing |

No remaining actionable P0/P1/P2 issue was found in the final comparison. P3: some inner screenshot text naturally needs the full-size view on a narrow desktop. The live app retains its existing Focus/zoom controls.

## Interaction and checks

Verified in the in-app browser:

- Primary demo button opens the labeled six-path library; Track positions loads three preset questions without model calls.
- Secondary upload opens the file chooser. Uploading the repository's public synthetic MP4 completed local preflight and showed playback with analysis blocked. No private recording was used.
- Original frame replay at 00:06, pinning evidence and saving a researcher observation produced the actual hero screenshot.
- Evidence navigation reveals the source-linked example and limitations. Full-size product image opens, and browser Back restores the landing.
- `/#start` opens the entry even with a restored investigation; Open workspace returns to that investigation, and reloading the direct link shows the entry again.
- 1440 × 1104, 1280 × 720 and 1024 × 800 desktop views were inspected. Temporary viewport overrides were reset before handoff.
- Browser warning/error logs were empty after the final interactions.

Validation: frontend build and content hashes passed; 113 frontend regressions passed; 20 existing gateway/demo-route regressions passed; lint, format, schema-export and whitespace checks passed. No new live model quality, UX study value, billing, deployment or mobile acceptance is claimed. No push, deployment, model approval or budget change was performed.

Pre-push verification: the complete local backend suite passed with 229 tests and one Linux-only isolation skip on macOS. Linux isolation remains required by CI before deployment.

The local fixture preview remains running and open for review. Earlier workspace QA is retained below as historical evidence.

---

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
