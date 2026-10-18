# Recorded-test walkthrough

The public entry is `/#example`, linked from the landing's **Explore the clip review**
action and the workspace menu. It opens a curated recorded sample in the same
application, using the shared video/chat component. The former
`/static/judge/index.html` redirects to this route. It needs neither
an original browser session nor a private source's retention window. It does not
run new model requests, enroll visitors, change a budget, share arbitrary user
investigations or extend hosting beyond October 19, 2026.

## Prepared clip review (October 18)

The main example now covers the complete 70.2-second excerpt in six editorial sections. Codex inspected 71 locally decoded frames at approximately one-second spacing. The full-size 36.036 and 37.037-second frames show Atlanta's broadcast score changing from 62 to 61. The review distinguishes that observed revision from its unknown cause, identifies broadcast cuts/reaction shots and retains sampling limits. Each section links to actual source points. Download clip review exports a separate Markdown report with provenance and source/frame links.

This is a **prepared editorial source review**, not a new Gemini pipeline result or a five-minute/full-game quality test. `clip-review.json` records source/frame hashes and exact decoded timestamps. The already authorized public source is unchanged; only selected derived public JPEGs are added. The original Gemini answer remains below **Original Gemini test · one scoreboard question**, with its original finding/export controls and unchanged private-source isolation. The following steps apply inside that disclosure.

## Visitor journey

1. Read the saved real Gemini scoreboard question and its `partial` answer.
2. Click **00:01.001**. The public copy of the original
   basketball source seeks to 1.001 seconds, paused. Play surrounding footage to
   verify Milwaukee 51 / Atlanta 56.
3. Write a finding, or copy the existing human review into an editable draft.
   Observed facts, interpretation and open questions remain separate.
4. Save the finding. Notes stay in this browser's local storage. If storage is
   unavailable, the interface reports that they remain only in the tab.
   Editing after saving disables export until the updated finding is saved.
5. Open **Export report**. Markdown and HTML include the public source replay
   link; JSON retains structured provenance. HTML embeds the evidence JPEG for
   offline inspection. Original-video playback still requires the public
   deployment. There is no native PDF report export.
6. Expand **Real test results & limitations** The development summary
   retains errors, false person matches, the wrong-time summary and the two
   manually checked partial results. It is not a held-out accuracy benchmark.

The walkthrough is an isolated browser-local mode using the same Review component
and report renderers as the private workspace. Before switching, pending private
workspace edits are flushed; the example never replaces the private investigation.
**Home** returns to the landing, and **Upload video** returns to the private upload path. It is not an anonymous live Gemini session
or a cloud-saved investigation. It does not offer arbitrary new questions:
new analysis still requires explicit session funding.

## Public copy and permission

On October 17, 2026 the user requested public judge access to real test results
and confirmed: “已有篮球片段公开使用许可，可用于评委演示”. This is recorded owner
confirmation, not independent legal verification. It is specific to this selected
demonstration, not publication of source code or other private uploads.

Source: <https://www.youtube.com/watch?v=WZwbp2nNFhY>. Original local source
SHA-256: `dfc0d9d33bcd62d2e8b3b8451f30ca4577c8ae79e83faf11b936d3f53a2a3374`.
The 70.203467-second `static/judge/basketball/source.mp4` is remuxed without video
re-encoding or audio. It keeps the original timebase and decoded frames. The
public JPEG is decoded again from that source at the cited 1.001 seconds; it is
not presented as the exact original model-request JPEG. The container checksum
is recorded in `results.json`.

`results.json` retains the scoreboard answer's text, status, event bounds,
uncertainty and source timestamps. Public aliases replace internal source,
request and frame identifiers. Logical answer URIs retain the schema 0.1 format; `public_assets` resolves the
aliases to the separate public JPEG. The report evidence index uses that public
URI. No new private-media endpoint is exposed.
The original private source, investigation, query rows and financial ledger are
not changed. The six-attempt summary is a curated development record; full private
results and internal operational artifacts are not exported.

Model event bounds are review-window bounds, not a verified duration of the
scoreboard state. Point support and original playback were checked; the result
remains partial. This sports clip does not validate UX research usefulness.

## Isolation and operation

- Anonymous reads use fixed static paths. No session cookie or CSRF token is
  needed. Existing private `/api` and `/media` guards are unchanged. Gateway
  regressions verify static replay with an unavailable upstream and no cookie.
- Notes use a versioned browser-local key, are type/length checked, and render as
  text. They are not sent to the server. Other visitors do not share notes.
  Clearing a finding removes only this demo's key.
- Export freezes the saved snapshot. HTML escapes notes, embeds a bounded JPEG
  and retains a restrictive document CSP. Closing its dialog cancels a pending
  image fetch. Source replay links have a fixed sample path.
- New static paths are intentionally public. Private uploads, databases, runtime
  files, keys, grants, cookies and original private object identifiers must never
  be placed in this folder.
- Access lasts while the current deployment runs. It does not authorize hosting
  through the November 6 evaluation end date. The existing October 19 backup and
  cleanup cutoff remains in force.

## Checks

Run `npm test`, `npm run build`, and the Python judge/gateway/ownership regressions.
The build updates hashes for the walkthrough and shared report renderer. Browser
verification covers a fresh page, timestamp replay, finding edits, save/reload,
disabled export after unsaved edits, downloads, legacy redirects and private-workspace return.
The previous standalone UI scripts are not loaded by the compatibility entry.
