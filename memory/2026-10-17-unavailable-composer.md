# Unavailable composer recovery

- Symptom: clicking the local Review composer appeared to do nothing.
- Root cause: the isolated fixture has real_ready=false. Native Send was disabled but refined Review CSS concealed its Unavailable label. Enter returned silently.
- Fix: explicit saved-results state, hidden Send while unavailable, active View saved answers toggle, and Enter recovery. Retained draft and funding admission remain unchanged.
- Regression: tests/frontend_state.test.cjs, unavailable live analysis replaces the inert send affordance with saved-result recovery. Failed against the prior implementation and passed with the fix.
- Evidence: .ctrlf-video-eval/simple-review-design/unavailable-before.log, unavailable-full-tests.log, unavailable-backend-tests.log, unavailable-fixed.jpg.
- Checks: 134 frontend, 230 backend with one macOS Linux-only skip; build/lint/format/contracts/whitespace passed. Browser replay reached 1.000999s and kept the draft. Two stored queries remain; no model dispatch or grant.
- Related: repeated unavailable-analysis confusion was amplified by visual simplification. Keep capability state beside the action rather than only in small footer text.
- Status: DONE_WITH_CONCERNS — UI recovery verified; new model analysis remains unavailable in this fixture by design. No push/deploy.
