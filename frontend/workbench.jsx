import React, {
  useSyncExternalStore,
  useRef,
  useState,
  useEffect,
} from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { openFinding, saveFinding } from "./finding-editor-actions.mjs";

const store = window.CtrlFVideoWorkbenchModel.createStore();
window.CtrlFVideoWorkbench = store;
const clock = window.CtrlFVideoWorkbenchModel.clock;
const useDesk = () => useSyncExternalStore(store.subscribe, store.getSnapshot);
const ui = () => window.CtrlFVideoUI;
const icon = (name) => (
  <img className="icon" src={`/static/icons/${name}.svg`} alt="" />
);
const labels = {
  ok: "Supported by frames",
  partial: "Partially verified",
  no_result: "No matching frames",
  error: "Incomplete",
};

function WorkspaceNavigation() {
  const state = useDesk();
  useEffect(() => {
    const count = document.getElementById("rail-findings-count");
    count.textContent = state.pins.length;
    count.hidden = !state.pins.length;
  }, [state.pins.length]);
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  useEffect(() => {
    if (!open) return;
    root.current.querySelector(".workspace-menu button").focus();
    const dismiss = (event) => {
      if (!root.current.contains(event.target)) setOpen(false);
    };
    const escape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      trigger.current.focus();
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const run = (action) => {
    setOpen(false);
    trigger.current.focus();
    action();
  };
  return (
    <div ref={root} className="workspace-navigation">
      <button
        ref={trigger}
        className="rail-button menu-trigger"
        aria-label="Workspace menu"
        aria-expanded={open}
        aria-controls="workspace-menu"
        title={open ? "Close workspace menu" : "Open workspace menu"}
        onClick={() => setOpen(!open)}
      >
        {icon("list")}
        <span>Menu</span>
      </button>
      {open && (
        <section
          id="workspace-menu"
          className="workspace-menu"
          role="dialog"
          aria-label="Workspace menu"
        >
          <div className="workspace-menu-heading">
            <div>
              <span>This investigation</span>
              <strong>{state.title || "Untitled investigation"}</strong>
            </div>
            <button
              className="icon-button"
              aria-label="Close workspace menu"
              onClick={() => run(() => {})}
            >
              {icon("x")}
            </button>
          </div>
          <p className="workspace-summary">
            {state.records.length} questions · {state.pins.length} findings
          </p>
          <p className="menu-section-label">Workspace</p>
          <button className="workspace-menu-item" onClick={() => run(() => ui()?.review())}>
            {icon("play")}<span>Review video<small>Ask a question and replay cited moments</small></span>
          </button>
          <button
            className="workspace-menu-item"
            onClick={() => run(() => ui()?.canvas())}
          >
            {icon("chats-circle")}
            <span>
              Evidence canvas<small>Return to this investigation</small>
            </span>
            {icon("arrow-right")}
          </button>
          <button
            className="workspace-menu-item"
            onClick={() => run(() => ui()?.toggleSource())}
          >
            {icon("folder-open")}
            <span>
              Source video<small>Show or hide the player</small>
            </span>
          </button>
          <button
            className="workspace-menu-item"
            onClick={() => run(() => ui()?.openInspector("findings"))}
          >
            {icon("stack")}
            <span>
              Findings<small>Evidence, conclusions and notes</small>
            </span>
            <span className="menu-count">{state.pins.length}</span>
          </button>
          <button
            className="workspace-menu-item"
            onClick={() => run(() => ui()?.openInspector("context"))}
          >
            {icon("paperclip")}
            <span>
              Question details<small>Inspect the selected question</small>
            </span>
          </button>
          <button className="workspace-menu-item" onClick={() => run(() => document.getElementById("open-agent-setup").click())}>{icon("code")}<span>Model setup<small>Readiness and approved budgets</small></span></button>
          <p className="menu-section-label">Investigation actions</p>
          <button className="workspace-menu-item" onClick={() => run(() => document.getElementById("export-report").click())}>
            {icon("stack")}<span>Export report<small>Preview and download findings with sources</small></span>
          </button>
          <button
            className="workspace-menu-item"
            onClick={() => run(() => ui()?.newTask())}
          >
            {icon("plus")}
            <span>
              New investigation<small>Start a new investigation</small>
            </span>
          </button>
          <button
            className="workspace-menu-item"
            onClick={() => run(() => ui()?.demos())}
          >
            {icon("play")}
            <span>
              Demo library<small>Explore six synthetic demo paths</small>
            </span>
          </button>
          <a className="workspace-menu-item" href="/static/judge/index.html">
            {icon("play")}
            <span>Real test walkthrough<small>Replay recorded Gemini evidence and export your finding</small></span>
          </a>
          <button
            className="workspace-menu-item"
            onClick={() => run(() => ui()?.openLocal())}
          >
            {icon("folder-open")}
            <span>
              Upload video<small>Save a recording and check readiness</small>
            </span>
          </button>
          <button className="workspace-menu-item" onClick={() => run(() => window.CtrlFVideoPersistence?.library())}>{icon("chats-circle")}<span>Investigations<small>Resume and manage investigations</small></span></button>
          <button className="workspace-menu-item" onClick={() => run(() => window.CtrlFVideoPersistence?.library("videos"))}>{icon("folder-open")}<span>Sources<small>Upload and manage recordings</small></span></button>
          <a
            className="workspace-menu-item"
            href="/docs"
            target="_blank"
            rel="noopener"
            onClick={() => setOpen(false)}
          >
            {icon("code")}
            <span>API Docs</span>
            {icon("arrow-right")}
          </a>
          <div className="menu-footnote">
            Saved to workspace<small>Retained for 24 hours by default</small>
          </div>
        </section>
      )}
    </div>
  );
}

function ProjectTitle() {
  const state = useDesk();
  return (
    <div className="project-name">
      <span>Workspace /</span>
      <input
        aria-label="Investigation name"
        value={state.title}
        onChange={(e) => store.rename(e.target.value)}
        onBlur={() =>
          !store.getSnapshot().title.trim() && store.rename("Untitled investigation")
        }
        maxLength={80}
      />
      <span className="session-label">Autosaved</span>
      <p className="project-caption">Video questions with moments you can replay</p>
    </div>
  );
}
function ResearchTask() {
  const state = useDesk();
  return ( <details className="research-context"><summary>Research context <span>{state.studyType === "technical_sample" ? "Technical sample" : "UX research"}</span></summary><section className="research-brief" aria-label="Research setup">
        <h2>Research task</h2>
        <label htmlFor="study-type">Recording purpose</label>
        <select id="study-type" value={state.studyType}
          onChange={e => store.setStudyType(e.target.value)}>
          <option value="ux_research">UX research</option>
          <option value="technical_sample">Technical sample</option>
        </select>
        <label htmlFor="task-brief">{state.studyType === "technical_sample" ? "Technical test objective" : "Participant's task"}</label>
        <textarea id="task-brief" aria-label="Research task" maxLength={2000} value={state.taskBrief}
          placeholder="What was the participant asked to complete?"
          onChange={e => store.setTaskBrief(e.target.value)} />
        <p className="session-footnote">Saved with this investigation. Each question keeps the task as it was when submitted.</p>
        {state.studyType === "technical_sample" && <p className="research-sample-note" role="status">
          Technical sample only. This recording does not validate UX research value.
        </p>}
        <details className="sample-guide">
          <summary>Sports technical sample</summary>
          <p>Highlights: Maine 13, Villanova 10. Upload a local copy, then test visible evidence and follow-up context. Published reference answers are excluded.</p>
          <a href="https://www.youtube.com/watch?v=-1UXq-FzmQA" target="_blank" rel="noopener noreferrer">Open source video</a>
          <button type="button" className="outline-button" onClick={() => {
            store.setStudyType("technical_sample");
            store.setTaskBrief("Technical test: locate readable brand or title graphics in the sports highlights, verify their source timestamps, and inspect the surrounding footage. Visible branding does not establish sponsorship contracts. This is not a UX participant task.");
          }}>Use technical test brief</button>
          <p>Suggested question: Find a clearly readable brand or title graphic and show the supporting frames.</p>
        </details>
      </section></details>
);
}
function Outline() {
  const state = useDesk();
  return (
    <section className="investigation-outline">
      <div className="section-line">
        <h2>Questions</h2>
        <span>{state.records.length} questions</span>
      </div>
      {state.records.length ? (
        <ol>
          {state.records.map((record, index) => (
            <li key={record.id}>
              <button
                className={record.id === state.selectedId ? "active" : ""}
                onClick={() => ui()?.select(record.id)}
              >
                <span className="outline-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{record.query.question}</span>
                <span
                  className={`outline-state ${record.query.response.status}`}
                />
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted-text">
          Questions stay on the canvas. Select one to follow up.
        </p>
      )}
      <p className="session-footnote">Sources and questions are saved for your next visit</p>
    </section>
  );
}
function QuestionHistory({ records, selectedId }) {
  const history = useRef(null);
  const index = records.findIndex(record => record.id === selectedId);
  const select = id => {
    if (!id) return;
    ui()?.select(id);
    history.current.open = false;
    history.current.querySelector("summary").focus();
  };
  return <nav className="agent-history" aria-label="Question navigation">
    <button type="button" className="question-step previous" aria-label="Previous question" disabled={index <= 0} onClick={() => select(records[index - 1]?.id)}>{icon("arrow-right")}</button>
    <details className="question-history" ref={history}>
      <summary><span>Question {index + 1} of {records.length}</span><span className="history-toggle">History {icon("list")}</span></summary>
      <ol aria-label="Saved questions">{records.map((record, number) => <li key={record.id}>
        <button type="button" aria-current={record.id === selectedId ? "true" : undefined} onClick={() => select(record.id)}>
          <span className="history-number">{String(number + 1).padStart(2, "0")}</span>
          <span className="history-copy"><span>{record.query.question}</span><small>{record.query.mode === "real" ? labels[record.query.response.status] : record.query.response.status === "ok" ? "Preset answer" : `Preset · ${labels[record.query.response.status]}`}</small></span>
        </button>
      </li>)}</ol>
    </details>
    <button type="button" className="question-step" aria-label="Next question" disabled={index >= records.length - 1} onClick={() => select(records[index + 1]?.id)}>{icon("arrow-right")}</button>
  </nav>;
}
function AgentConversation() {
  const state = useDesk();
  const selected = state.records.find(record => record.id === state.selectedId);
  const needsSetup = state.sourceInfo?.job?.state === "awaiting_configuration";
  if (!selected) return <section className="agent-conversation agent-welcome">
    <div className="partner-identity"><span className="partner-mark">{icon("chats-circle")}</span><div><strong>CtrlF</strong><small>Your research partner</small></div></div>
    <h2>{state.local ? "Watch now. Ask after analysis." : "What would you like to find?"}</h2>
    <p>{state.local ? needsSetup ? "This workspace is not configured for analysis. Your video is saved and can be played; questions are unavailable here until analysis is enabled and completed." : "Your video is saved and ready to play. Questions become available after this recording has been analyzed." : "Ask about something visible in the video. The answer will include moments you can click to replay."}</p>
    <p className="agent-disclosure">{state.local ? "Playback only · this source is not ready for analysis." : state.sourceInfo?.id && state.sourceInfo.id !== "demo_parcel" ? "Uploaded source · Gemini reviews sampled frames. No audio transcription." : "Synthetic demo · preset answers, no model calls"}</p>
    {state.local ? <button className="outline-button" onClick={() => ui()?.sources()}>Check analysis status {icon("arrow-right")}</button> : !state.sourceInfo?.id || state.sourceInfo.id === "demo_parcel" ? <button className="demo-question-button" onClick={() => ui()?.askDemoQuestion("When is the package at the center?")}>Try: When is the package at the center? {icon("arrow-right")}</button> : <button className="outline-button" onClick={() => document.getElementById("question").focus()}>Ask about this video {icon("arrow-right")}</button>}
  </section>;
  const {query} = selected;
  const response = query.response;
  const frames = [...new Map(response.events.flatMap(event => event.evidence).map(frame => [frame.uri, frame])).values()];
  return <section className="agent-conversation" aria-label="Agent conversation">
    {state.records.length > 1 && <QuestionHistory records={state.records} selectedId={selected.id} />}
    <div className="agent-user"><span className="speaker-label">Your question</span><p>{query.question}</p></div>
    <div className="partner-identity"><span className="partner-mark">{icon("chats-circle")}</span><div><strong>Answer</strong><small>{query.mode === "real" ? "From sampled source frames" : "Synthetic demo · preset answer"}</small></div></div>
    <div className="agent-assistant">
    <p className="agent-answer">{response.answer}</p>
    <p className="agent-disclosure">{query.mode === "real" ? labels[response.status] : "Synthetic demo · preset result"}</p>
    <details className="agent-activity"><summary>{frames.length} supporting {frames.length === 1 ? "frame" : "frames"} {icon("paperclip")}</summary>
      <p>{query.mode === "real" ? `${response.trace?.visible?.segments_reviewed ?? 0} segments reviewed. These frames support this answer; they do not establish what happened between samples.` : "This example uses preset answers and synthetic source frames. No model request was made."}</p>
      <button className="text-button" onClick={() => ui()?.openInspector("context")}>Inspect evidence details</button>
    </details>
    {!!frames.length && <div className="agent-frames" aria-label="Supporting source frames"><p className="replay-instruction">Click a timestamp to watch that moment.</p>{frames.map(frame => {
      const saved = state.pins.find(pin => pin.kind === "evidence" && pin.frame.uri === frame.uri && pin.frame.t === frame.t);
      return <div className="agent-frame-row" key={frame.uri}>
        <button className="agent-frame-replay" onClick={() => ui()?.seek(frame.t, query)} aria-label={`Replay agent frame ${clock(frame.t)}`}><img src={frame.uri} alt={frame.caption || "Source frame"} /><span><strong>{icon("play")}{clock(frame.t)} · Watch this moment</strong><small>{frame.caption || "Replay source frame"}</small></span></button>
        <button className="agent-frame-pin" aria-label={`${saved ? "Locate" : "Pin"} frame ${clock(frame.t)} on canvas`} disabled={!saved && state.pins.length >= 8} onClick={() => saved ? ui()?.focusFinding(saved.id) : ui()?.saveEvidence(selected.id, query, frame)} title={saved ? "Locate on canvas" : "Pin frame to canvas"}>{icon(saved ? "stack" : "plus")}</button>
      </div>;
    })}</div>}
    {!!response.unresolved.length && <section className="agent-unresolved" aria-label="What remains unknown"><h3>Still to verify</h3>{response.unresolved.map(text => <p key={text}>{text}</p>)}</section>}
    </div>
    <details className="agent-result-actions"><summary>Save an observation or follow up</summary>{["ok", "partial"].includes(response.status) && <button className="save-finding-action" onClick={() => { const pin = ui()?.saveConclusion(selected.id, query); if (pin) { ui()?.openInspector("findings"); window.dispatchEvent(new CustomEvent("ctrlf-video-edit-finding", {detail:pin.id})); } }}>{icon("stack")}Write a finding</button>}<button className="text-button" disabled={state.local} onClick={() => ui()?.continueFrom(selected.id)}>Follow up on this answer {icon("arrow-right")}</button></details>
  </section>;
}
function QuestionHelp() {
  const state = useDesk();
  const demo = !state.sourceInfo?.id || state.sourceInfo.id === "demo_parcel";
  return <p className="question-help">{state.local ? "Analysis required. Check status in Sources." : demo ? "Preset demo · No model calls." : "Sampled frames · Check cited moments · No audio transcription."}</p>;
}
function SourceReviewHelp() {
  const state = useDesk();
  const demo = !state.sourceInfo?.id || state.sourceInfo.id === "demo_parcel";
  const answered = state.records.length > 0;
  const title = state.local ? "Your video is ready to watch" : !answered ? demo ? "Try the package video" : "Find a moment in this recording" : "Check the answer in the video";
  const explanation = state.local ? "You can play this recording now. The question panel explains when analysis is available; no demo answers will be used for your video." : demo && !answered ? "This 18-second synthetic clip shows a package in different positions. Ask when it is at the center, then click a cited moment to check." : !answered ? "Ask about something visible in this recording using the question box on the right. Then replay the returned timestamps to check the source." : "Click a timestamp on the right to jump to that moment. Play a few seconds before and after it to check what happened.";
  return <section className="review-source-help"><h2>{title}</h2><p>{explanation}</p>{demo && !state.local ? answered ? <button className="outline-button" onClick={() => ui()?.newQuestion()}>Ask a new question {icon("arrow-right")}</button> : <button className="outline-button" onClick={() => ui()?.askDemoQuestion("When is the package at the center?")}>Try the example question {icon("arrow-right")}</button> : null}</section>;
}
function SourceEvidenceStrip() {
  const state = useDesk();
  const selected = state.records.find(record => record.id === state.selectedId);
  const frames = selected ? [...new Map(selected.query.response.events.flatMap(event => event.evidence).map(frame => [frame.uri, frame])).values()] : [];
  if (!frames.length) return <div className="source-strip-empty"><strong>Keep the source in view.</strong><p>Replay a moment here. Supporting frames appear after you ask a question.</p></div>;
  return <section className="source-evidence-strip" aria-label="Current question evidence"><div className="source-strip-label"><span>Supporting frames</span><small>{frames.length} linked to this question</small></div><div className="source-strip-frames">{frames.map(frame => <button key={frame.uri} onClick={() => ui()?.seek(frame.t, selected.query)} aria-label={`Replay source strip frame ${clock(frame.t)}`}><img src={frame.uri} alt={frame.caption || "Source frame"} /><span>{icon("play")}{clock(frame.t)}</span></button>)}</div></section>;
}
function ComposerSource() {
  const state = useDesk();
  return <span className="composer-source">{icon("play")}<span>{state.sourceInfo?.name || (state.local ? "Local video" : "Synthetic demo")}</span></span>;
}
function Inspector() {
  const state = useDesk();
  const tab = state.inspectorTab;
  const setTab = store.showPanel;
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  useEffect(() => {
    const edit = event => openFinding(event.detail, setEditingId, setFilter);
    window.addEventListener("ctrlf-video-edit-finding", edit);
    return () => window.removeEventListener("ctrlf-video-edit-finding", edit);
  }, []);
  const [order, setOrder] = useState("saved");
  const [message, setMessage] = useState("");
  useEffect(() => {
    setMessage("");
    setEditingId(null);
    setFilter("all");
    setOrder("saved");
  }, [state.epoch]);
  const scroll = useRef(null);
  useEffect(() => {
    scroll.current.scrollTop = 0;
    setMessage("");
  }, [state.selectedId, tab]);
  const compare = useRef(null);
  const report = useRef(null);
  const [reportText, setReportText] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [reportData, setReportData] = useState(null);
  const [includeImages, setIncludeImages] = useState(true);
  const [exporting, setExporting] = useState(false);
  const exportController = useRef(null);
  useEffect(() => () => exportController.current?.abort(), []);
  const drag = useRef(null);
  const skipClick = useRef(false);
  const selected = state.records.find((r) => r.id === state.selectedId);
  const frames = selected
    ? [
        ...new Map(
          selected.query.response.events
            .flatMap((event) => event.evidence)
            .map((frame) => [frame.uri, frame]),
        ).values(),
      ]
    : [];
  const pinnedFrames = state.pins.filter((p) => p.kind === "evidence");
  const visiblePins = window.CtrlFVideoWorkbenchModel.visiblePins(
    state.pins,
    filter,
    order,
  );
  const action = (fn) => {
    const result = fn();
    setMessage(
      result
        ? "Saved to findings with its source."
        : "Cannot save. Keep up to eight findings per investigation.",
    );
  };
  function exportNotes() {
    const captured = window.CtrlFVideoReport.create(window.CtrlFVideoSessionUI.snapshot());
    setReportData(captured);
    setReportText(window.CtrlFVideoReport.markdown(captured));
    setReportStatus("");
    report.current.showModal();
  }
  useEffect(() => {
    const trigger = document.getElementById("export-report");
    trigger.addEventListener("click", exportNotes);
    return () => trigger.removeEventListener("click", exportNotes);
  }, []);
  function downloadFile(content, extension, type) {
    const url = URL.createObjectURL(new Blob([content], {type}));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `CtrlF Video-Investigation report.${extension}`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function downloadReport(format) {
    if (!reportData || exporting) return;
    if (format === "md") downloadFile(reportText, "md", "text/markdown;charset=utf-8");
    else if (format === "json") downloadFile(JSON.stringify(reportData, null, 2), "json", "application/json");
    else {
      const controller = new AbortController();
      exportController.current = controller;
      setExporting(true);
      const images = {};
      let bytes = 0;
      try {
        if (includeImages) for (const frame of reportData.evidence.slice(0, 24)) {
          if (!window.CtrlFVideoReport.safeFrameUri(reportData.source.id, frame.uri)) continue;
          setReportStatus(`Collecting evidence images ${Object.keys(images).length} / ${reportData.evidence.length}…`);
          try {
            const response = await fetch(frame.uri, {credentials: "same-origin", signal: controller.signal});
            if (!response.ok) continue;
            const reader = response.body.getReader();
            const chunks = []; let length = 0;
            while (true) {
              const {done, value} = await reader.read();
              if (done) break;
              length += value.byteLength;
              if (length > 2 * 1024 * 1024 || bytes + length > 16 * 1024 * 1024) {
                await reader.cancel(); break;
              }
              chunks.push(value);
            }
            const mime = response.headers.get("content-type")?.split(";")[0];
            if (length > 2 * 1024 * 1024 || bytes + length > 16 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(mime)) continue;
            const blob = new Blob(chunks, {type:mime});
            images[frame.id] = await new Promise((resolve, reject) => {
              const fileReader = new FileReader();
              fileReader.onload = () => resolve(fileReader.result);
              fileReader.onerror = reject;
              fileReader.readAsDataURL(blob);
            });
            bytes += length;
          } catch (error) { if (controller.signal.aborted) throw error; }
        }
        if (controller.signal.aborted) return;
        downloadFile(window.CtrlFVideoReport.html(reportData, images), "html", "text/html;charset=utf-8");
        setReportStatus(`HTML Exported with ${Object.keys(images).length} / ${reportData.evidence.length} images embedded. Other references remain listed; open offline or print as PDF.`);
      } finally { setExporting(false); exportController.current = null; }
      return;
    }
    setReportStatus("Download started. This report captures the investigation when export was opened.");
  }
  return (
    <>
      <div className="inspector-heading">
        <span>
          Finding editor<small>Keep observations linked to their source</small>
        </span>
        <button
          className="icon-button"
          aria-label="Hide finding editor"
          onClick={() => ui()?.toggleInspector()}
        >
          {icon("x")}
        </button>
      </div>
      <div
        className="inspector-tabs"
        role="tablist"
        aria-label="Investigation panels"
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
          event.preventDefault();
          const next = tab === "context" ? "findings" : "context";
          setTab(next);
          event.currentTarget
            .querySelector(`[data-inspector-tab="${next}"]`)
            .focus();
        }}
      >
        <button
          id="inspector-context-tab"
          role="tab"
          aria-controls="inspector-panel"
          data-inspector-tab="context"
          tabIndex={tab === "context" ? 0 : -1}
          aria-selected={tab === "context"}
          onClick={() => setTab("context")}
        >
          Evidence details
        </button>
        <button
          id="inspector-findings-tab"
          role="tab"
          aria-controls="inspector-panel"
          data-inspector-tab="findings"
          tabIndex={tab === "findings" ? 0 : -1}
          aria-selected={tab === "findings"}
          onClick={() => setTab("findings")}
        >
          Findings <span>{state.pins.length}</span>
        </button>
      </div>
      <div
        id="inspector-panel"
        ref={scroll}
        className="inspector-scroll"
        role="tabpanel"
        aria-label={tab === "context" ? "Current question details" : "Saved findings"}
        aria-labelledby={
          tab === "context" ? "inspector-context-tab" : "inspector-findings-tab"
        }
      >
        {tab === "context" ? (
          selected ? (
            <>
              <div className="inspector-context-line">
                <p className="inspector-kicker">
                  Question{" "}
                  {String(state.records.indexOf(selected) + 1).padStart(2, "0")}
                </p>
                <span
                  className={`result-pill ${selected.query.response.status}`}
                >
                  {labels[selected.query.response.status]}
                </span>
              </div>
              <h2 className="inspector-question">{selected.query.question}</h2>
              <details className="sample-guide">
                <summary>Task context at submission</summary>
                <p>{selected.query.task_brief || "No task brief was recorded for this question."}</p>
                <p>{selected.query.study_type === "technical_sample"
                  ? "Technical sample — not UX validation."
                  : selected.query.study_type === "ux_research" ? "UX research" : "Purpose was not recorded."}</p>
                <p>The task provides context, not observed evidence.</p>
              </details>
              <div className="inspector-primary-actions">
                <button
                  className="outline-button"
                  disabled={state.local}
                  onClick={() => ui()?.continueFrom(selected.id)}
                >
                  Follow up {icon("arrow-right")}
                </button>
                <button
                  className="text-button"
                  onClick={() => ui()?.locate(selected.id)}
                >
                  Locate on canvas
                </button>
              </div>
              <div className="inspector-conclusion">
                <div className="section-line">
                  <h3>Source answer</h3>
                  {["ok", "partial"].includes(
                    selected.query.response.status,
                  ) && (
                    <button
                      aria-label="Save current answer as finding"
                      className="text-button"
                      onClick={() =>
                        action(() =>
                          ui()?.saveConclusion(selected.id, selected.query),
                        )
                      }
                    >
                      Save finding
                    </button>
                  )}
                </div>
                <p>{selected.query.response.answer}</p>
              </div>
              {!!selected.query.response.unresolved.length && (
                <div className="open-questions">
                  <h3>Needs verification</h3>
                  {selected.query.response.unresolved.map((text) => (
                    <p key={text}>{text}</p>
                  ))}
                </div>
              )}
              {!!frames.length && (
                <section className="inspector-evidence">
                  <div className="section-line">
                    <h3>Supporting frames</h3>
                    <span>{frames.length}</span>
                  </div>
                  {frames.map((frame) => (
                    <div className="frame-row" key={frame.uri}>
                      <button
                        className="frame-preview"
                        draggable={false}
                        data-drag-evidence
                        title="Drag to canvas to save, or click to replay"
                        onPointerDown={(event) => {
                          if (event.button !== 0) return;
                          event.preventDefault();
                          event.currentTarget.focus();
                          event.currentTarget.setPointerCapture(
                            event.pointerId,
                          );
                          drag.current = {
                            x: event.clientX,
                            y: event.clientY,
                            moved: false,
                          };
                          skipClick.current = false;
                        }}
                        onPointerMove={(event) => {
                          if (!drag.current) return;
                          if (
                            Math.hypot(
                              event.clientX - drag.current.x,
                              event.clientY - drag.current.y,
                            ) > 8
                          )
                            drag.current.moved = true;
                          if (drag.current.moved)
                            document
                              .getElementById("chat-content")
                              .classList.add("drop-ready");
                        }}
                        onPointerUp={(event) => {
                          const gesture = drag.current;
                          drag.current = null;
                          document
                            .getElementById("chat-content")
                            .classList.remove("drop-ready");
                          if (!gesture?.moved) return;
                          skipClick.current = true;
                          const rect = document
                            .getElementById("chat-content")
                            .getBoundingClientRect();
                          if (
                            event.clientX >= rect.left &&
                            event.clientX < rect.right &&
                            event.clientY >= rect.top &&
                            event.clientY < rect.bottom
                          )
                            action(() =>
                              ui()?.saveEvidence(
                                selected.id,
                                selected.query,
                                frame,
                              ),
                            );
                        }}
                        onPointerCancel={() => {
                          drag.current = null;
                          document
                            .getElementById("chat-content")
                            .classList.remove("drop-ready");
                        }}
                        onClick={() => {
                          if (skipClick.current) {
                            skipClick.current = false;
                            return;
                          }
                          ui()?.seek(frame.t, selected.query);
                        }}
                        aria-label={`Replay reference ${clock(frame.t)}`}
                      >
                        <img src={frame.uri} alt={frame.caption} />
                        <span>{clock(frame.t)}</span>
                      </button>
                      <div>
                        <p>{frame.caption}</p>
                        <button
                          className="text-button"
                          onClick={() =>
                            action(() =>
                              ui()?.saveEvidence(
                                selected.id,
                                selected.query,
                                frame,
                              ),
                            )
                          }
                          aria-label={`Save evidence ${clock(frame.t)}`}
                        >
                          Pin to canvas {icon("plus")}
                        </button>
                      </div>
                    </div>
                  ))}
                </section>
              )}
              <details className="basis-section">
                <summary>
                  Evidence basis<span>{frames.length} frames · {selected.query.mode === "real" ? "Model review" : "Preset match"}</span>
                </summary>
                <ol className="basis-steps">
                  <li>
                    <span>01</span>
                    <div>
                      Review scope<small>{state.sourceInfo?.name || "Synthetic video"} · 00:00–{clock(state.sourceInfo?.metadata?.duration || 18)}</small>
                    </div>
                  </li>
                  <li>
                    <span>02</span>
                    <div>
                      {selected.query.mode === "real" ? "Retrieval and visual review" : "Preset example match"}
                      <small>
                        {selected.query.response.events.length} events ·{" "}
                        {frames.length} frames
                      </small>
                    </div>
                  </li>
                  <li>
                    <span>03</span>
                    <div>
                      {labels[selected.query.response.status]}
                      <small>{selected.query.mode === "real" ? `${selected.query.response.trace.visible.segments_reviewed} segments reviewed` : "No new model request"}</small>
                    </div>
                  </li>
                </ol>
              </details>
            </>
          ) : (
            <div className="inspector-empty">
              <p className="inspector-kicker">FOLLOW THE EVIDENCE</p>
              <h2>Start with the evidence.</h2>
              <p>Select a question to inspect its evidence and unresolved details.</p>
              <button className="outline-button" onClick={() => ui()?.demos()}>
                Explore a demo {icon("arrow-right")}
              </button>
            </div>
          )
        ) : (
          <>
            <details className="collection-options"><summary>Organize findings <span>{state.pins.length} / 8 saved</span></summary>
            <label className="inspector-kicker" htmlFor="finding-group">
              Finding collection
            </label>
            <input
              id="finding-group"
              className="finding-group"
              value={state.groupTitle}
              onChange={(e) => store.group(e.target.value)}
              maxLength={60}
            />
            <div className="collection-summary">
              <span>{state.pins.length} / 8 saved</span>
              <span>
                {pinnedFrames.length} frames ·{" "}
                {state.pins.length - pinnedFrames.length} conclusions
              </span>
            </div>
            <div className="finding-controls">
              <div
                className="finding-filters"
                role="group"
                aria-label="Filter findings"
              >
                {[
                  ["all", "All"],
                  ["evidence", "Evidence"],
                  ["conclusion", "Finding"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    aria-label={`Filter ${label.toLowerCase()} findings`}
                    aria-pressed={filter === value}
                    onClick={() => setFilter(value)}
                  >
                    {label}
                    <span>
                      {value === "all"
                        ? state.pins.length
                        : state.pins.filter((p) => p.kind === value).length}
                    </span>
                  </button>
                ))}
              </div>
              <label className="sr-only" htmlFor="finding-order">
                Sort findings
              </label>
              <select
                id="finding-order"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              >
                <option value="saved">Saved order</option>
                <option value="time">Video time</option>
              </select>
            </div>
            </details>
            {visiblePins.length > 1 && <label className="finding-picker">Edit finding<select aria-label="Edit finding" value={visiblePins.some(pin => pin.id === editingId) ? editingId : visiblePins.at(-1).id} onChange={e => setEditingId(e.target.value)}>{visiblePins.map(pin => <option key={pin.id} value={pin.id}>{pin.title}</option>)}</select></label>}
            {visiblePins.length ? (
              <div className="finding-list">
                {visiblePins.filter(pin => pin.id === (visiblePins.some(item => item.id === editingId) ? editingId : visiblePins.at(-1).id)).map((pin) => (
                  <div className={`finding-row ${pin.kind}`} key={pin.id}>
                    <details className="finding-original"><summary>Source answer</summary><button
                      className="finding-main"
                      aria-label={`Locate finding: ${pin.title}`}
                      onClick={() => ui()?.focusFinding(pin.id)}
                    >
                      {pin.kind === "evidence" ? (
                        <img src={pin.frame.uri} alt={pin.frame.caption} />
                      ) : (
                        icon("chats-circle")
                      )}
                      <span>
                        <small>
                          {pin.kind === "evidence" ? "Evidence frame" : "Finding"} /{" "}
                          {pin.kind === "evidence"
                            ? clock(pin.frame.t)
                            : labels[pin.query.response.status]}
                        </small>
                        <span className="finding-caption">
                          {pin.kind === "evidence"
                            ? pin.frame.caption
                            : pin.query.response.answer}
                        </span>
                      </span>
                    </button>
                    </details>
                    <div className="finding-provenance">
                      <button
                        className="text-button"
                        aria-label={`View finding source: ${pin.title}`}
                        disabled={
                          !state.records.some(
                            (record) => record.id === pin.turnId,
                          )
                        }
                        onClick={() => {
                          ui()?.select(pin.turnId);
                          setTab("context");
                          document
                            .getElementById("inspector-context-tab")
                            .focus();
                        }}
                      >
                        Source: {pin.query.question}
                      </button>
                      {pin.kind === "evidence" && (
                        <button
                          className="text-button"
                          aria-label={`Replay saved evidence ${clock(pin.frame.t)}`}
                          onClick={() => ui()?.seek(pin.frame.t, pin.query)}
                        >
                          {icon("play")}Replay
                        </button>
                      )}
                    </div>
                    <button
                      className="icon-button remove-finding"
                      aria-label={`Remove ${pin.title}`}
                      onClick={() => ui()?.removeFinding(pin.id)}
                    >
                      {icon("x")}
                    </button>
                    <section className="finding-research" aria-label="Edit research finding">
                      <label>Finding title<input value={pin.title} maxLength={200} onChange={e => store.renameFinding(pin.id, e.target.value)} /></label>
                      <p className="session-footnote">Researcher-authored notes; source evidence remains unchanged.</p>
                      {[
                        ["observation", "Observed facts", "Describe what you verified in the source."],
                        ["openQuestions", "Open questions", "What still needs verification?"],
                        ["interpretation", "Interpretation / hypothesis", "Explain a possible meaning, not a proven cause."],
                      ].map(([field, label, placeholder]) => {
                        const input = <label key={field}>{label}<textarea value={pin.research?.[field] || ""} maxLength={2000} placeholder={placeholder} onChange={e => store.editFinding(pin.id, field, e.target.value)} /></label>;
                        return field === "interpretation" ? <details className="finding-interpretation" key={field}><summary>Interpretation / hypothesis{pin.research?.interpretation ? " · saved" : ""}</summary>{input}</details> : input;
                      })}
                      <div className="supporting-evidence"><h3>Supporting evidence</h3><div>
                        {(pin.kind === "evidence" ? [pin.frame] : [...new Map(pin.query.response.events.flatMap(event => event.evidence).map(frame => [frame.uri, frame])).values()]).map(frame => <button key={frame.uri} type="button" onClick={() => ui()?.seek(frame.t, pin.query)} aria-label={`Replay supporting frame ${clock(frame.t)}`}>
                          <img src={frame.uri} alt={frame.caption || "Source frame"} /><span>{clock(frame.t)}</span>
                        </button>)}
                      </div></div>
                      <div className="finding-edit-actions"><button className="export-button" onClick={() => saveFinding(window.CtrlFVideoPersistence, setMessage)}>Save finding</button><button className="outline-button" onClick={() => {
                        const frame = pin.kind === "evidence" ? pin.frame : pin.query.response.events.flatMap(event => event.evidence)[0];
                        if (frame) ui()?.seek(Math.max(0, frame.t - 2), pin.query);
                      }}>Replay context</button></div>
                    </section>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-text">
                {state.pins.length
                  ? "No findings in this category. Choose All to see saved items."
                  : "Select a question and save its answer or a source frame to start a finding."}
              </p>
            )}
            {!state.pins.length && selected && ["ok", "partial"].includes(selected.query.response.status) && <button className="export-button" onClick={() => action(() => ui()?.saveConclusion(selected.id, selected.query))}>Create finding from selected answer</button>}
            <details className="collection-extras"><summary>Compare frames and investigation notes</summary><button
              className="outline-button compare-button"
              disabled={pinnedFrames.length < 2}
              onClick={() => compare.current.showModal()}
            >
              Compare frames{" "}
              <span>
                {pinnedFrames.length < 2
                  ? "Save two frames first"
                  : `${pinnedFrames.length} available`}
              </span>
            </button>
            <label
              className="section-line note-label"
              htmlFor="investigation-note"
            >
              Investigation notes <span>{state.note.length} / 1200</span>
            </label>
            <textarea
              id="investigation-note"
              aria-label="Investigation notes"
              placeholder="Observations, questions or next steps…"
              value={state.note}
              onChange={(e) => store.annotate(e.target.value)}
              maxLength={1200}
            />
            <p className="session-footnote">
              Your title, findings and notes save to this workspace as you edit.
            </p>
            <button className="export-button" onClick={exportNotes}>
              Export report {icon("arrow-right")}
            </button></details>
          </>
        )}
        <p className="inspector-message" role="status">
          {message}
        </p>
      </div>
      {createPortal(<>
      <dialog
        className="compare-dialog"
        ref={compare}
        aria-labelledby="compare-title"
      >
        <header>
          <div>
            <p className="inspector-kicker">EVIDENCE / COMPARISON</p>
            <h2 id="compare-title">Compare evidence</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close comparison"
            onClick={() => compare.current.close()}
          >
            {icon("x")}
          </button>
        </header>
        <div className="compare-frames">
          {pinnedFrames.slice(0, 2).map((pin) => (
            <figure key={pin.id}>
              <img src={pin.frame.uri} alt={pin.frame.caption} />
              <figcaption>
                <strong>{clock(pin.frame.t)}</strong>
                <span>{pin.frame.caption}</span>
                <button
                  className="text-button"
                  onClick={() => {
                    compare.current.close();
                    ui()?.seek(pin.frame.t, pin.query);
                  }}
                >
                  Replay this frame {icon("play")}
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="muted-text">
          Frames from the same source. Different positions do not establish continuous movement.
        </p>
      </dialog>
      <dialog
        className="report-dialog compare-dialog"
        ref={report}
        aria-labelledby="report-title"
        onClose={() => exportController.current?.abort()}
      >
        <header>
          <div>
            <p className="inspector-kicker">INVESTIGATION / RECORD</p>
            <h2 id="report-title">Investigation report</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close report"
            onClick={() => report.current.close()}
          >
            {icon("x")}
          </button>
        </header>
        <p className="report-summary">{reportData?.questions.length || 0} questions · {reportData?.findings.length || 0} findings · {reportData?.evidence.length || 0} evidence frames. Includes retained questions and finding sources; unresolved details are listed separately.</p>
        {reportData && <section className="report-preview" aria-label="Report preview">
          <h3>{reportData.title}</h3>
          <p>{window.CtrlFVideoReport.provenance(reportData)}</p>
          <p><strong>Research task</strong><br />{reportData.research_context?.task_brief || "Not provided"}</p>
          {reportData.research_context?.study_type === "technical_sample" && <p>Technical sample only — does not validate UX research value.</p>}
          {reportData.findings.map(finding => <article key={finding.id}>
            <h4>{finding.title}</h4>
            <dl>{[["observation", "Observed facts"], ["interpretation", "Interpretation / hypothesis"], ["openQuestions", "Open questions"]].map(([field, label]) => <React.Fragment key={field}><dt>{label}</dt><dd>{finding.research?.[field] || "Not recorded"}</dd></React.Fragment>)}</dl>
          </article>)}
          {!reportData.findings.length && <p>No saved findings yet.</p>}
          <p className="muted-text">{reportData.scope}</p>
        </section>}
        <details className="report-source-text"><summary>Full Markdown and source references</summary><textarea aria-label="Investigation record Markdown" value={reportText} readOnly /></details>
        <label className="report-image-option"><input type="checkbox" checked={includeImages} onChange={e => setIncludeImages(e.target.checked)} disabled={exporting} /> Embed evidence images in HTML (up to 24 images, 16 MB)</label>
        <div className="report-actions">
          <button
            className="outline-button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(reportText);
                setReportStatus("Markdown copied.");
              } catch {
                setReportStatus("Open Full Markdown and source references, select the text, and use browser copy.");
              }
            }}
          >
            Copy Markdown
          </button>
          <button className="outline-button" disabled={exporting} onClick={() => downloadReport("md")}>Download Markdown</button>
          <button className="outline-button" disabled={exporting} onClick={() => downloadReport("json")}>Download JSON</button>
          <button className="export-button" disabled={exporting} onClick={() => downloadReport("html").catch(() => setReportStatus("Export cancelled or failed. Please retry."))}>{exporting ? "Collecting images…" : "Download HTML"}</button>
        </div>
        <p className="muted-text" role="status">
          {reportStatus}
        </p>
      </dialog>
      </>, document.querySelector(".agent-shell"))}
    </>
  );
}
createRoot(document.getElementById("workspace-navigation")).render(
  <WorkspaceNavigation />,
);
createRoot(document.getElementById("project-title")).render(<ProjectTitle />);
createRoot(document.getElementById("investigation-outline")).render(
  <Outline />,
);
createRoot(document.getElementById("workbench-inspector")).render(
  <Inspector />,
);

createRoot(document.getElementById("research-task")).render(<ResearchTask />);

createRoot(document.getElementById("composer-source")).render(<ComposerSource />);

createRoot(document.getElementById("agent-conversation-root")).render(<AgentConversation />);
createRoot(document.getElementById("source-evidence-strip")).render(<SourceEvidenceStrip />);
createRoot(document.getElementById("question-help")).render(<QuestionHelp />);
createRoot(document.getElementById("review-source-help")).render(<SourceReviewHelp />);
