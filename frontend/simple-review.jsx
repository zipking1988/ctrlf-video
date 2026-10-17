import React, {useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {citedMoments, sourceClock} from "./review-timeline.mjs";
import {questionLabel} from "./question-shortcuts.mjs";

export default function SimpleReview({state, ui, icon, metaTarget, playerId = "player", onSaveFinding, newQuestionLabel = "New question"}) {
  const selected = state.records.find(record => record.id === state.selectedId) || state.records.at(-1);
  const query = selected?.query;
  const moments = citedMoments(query, state.sourceInfo?.metadata?.duration);
  const [timelineFor, setTimelineFor] = useState(null);
  const timeline = useRef(null);
  const timelineTrigger = useRef(null);
  const closeTimeline = () => {
    setTimelineFor(null);
    timelineTrigger.current?.focus();
  };
  const timelineKeyDown = event => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    closeTimeline();
  };
  const key = `${state.sourceInfo?.id}:${state.epoch}:${selected?.id || "empty"}`;
  const timelineId = `${playerId}-cited-timeline`;
  const open = timelineFor === key;
  useEffect(() => setTimelineFor(null), [state.sourceInfo?.id, state.epoch]);
  useEffect(() => {
    if (open && document.querySelector(".agent-shell")?.classList.contains("review-first"))
      timeline.current?.scrollIntoView({block:"nearest"});
  }, [open]);
  const replay = frame => {
    ui()?.seek(frame.t, query);
    document.getElementById(playerId)?.scrollIntoView({block:"center"});
  };
  const save = () => {
    if (onSaveFinding) {onSaveFinding();return;}
    const pin = ui()?.saveConclusion(selected.id, query);
    if (!pin) return;
    ui()?.openInspector("findings");
    window.dispatchEvent(new CustomEvent("ctrlf-video-edit-finding", {detail:pin.id}));
  };
  const fixture = !state.sourceInfo?.id || state.sourceInfo.id === "demo_parcel";
  const details = query ? (
          <details className="simple-answer-details"><summary>Details & save</summary>
            {questionLabel(query.question) !== query.question && <><strong>Full question</strong><p>{query.question}</p></>}
            {query.response.unresolved.map(text => <p key={text}>{text}</p>)}
            {query.mode === "real" && <p>Sampled visual evidence; audio is not transcribed. Replay the source to check the claim.</p>}
            {["ok","partial"].includes(query.response.status) && <button type="button" className="text-button" onClick={save}>Write a finding</button>}
            <button type="button" className="text-button" onClick={() => ui()?.newQuestion()}>{newQuestionLabel}</button>
            {state.records.length > 1 && <details className="simple-question-history"><summary>Earlier questions ({state.records.length-1})</summary>
              {state.records.filter(record => record.id !== selected.id).map(record => <button type="button" key={record.id} onClick={() => ui()?.select(record.id)}>{record.query.question}</button>)}
            </details>}
          </details>
  ) : null;
  const target = metaTarget === undefined ? document.getElementById("review-source-meta") : metaTarget;
  return <>
    {target && createPortal(<div className="simple-source-meta">
      <span>{state.sourceInfo?.name || "Package positions · Synthetic demo"}</span>
      <button type="button" className="simple-timeline-toggle" ref={timelineTrigger} aria-expanded={open} aria-controls={timelineId} onClick={() => setTimelineFor(open ? null : key)}>
        {icon("list")}Timeline<span className="simple-timeline-count">{moments.length}</span>
      </button>
    </div>, target)}
    <section key={key} className="simple-conversation" aria-label="Video conversation">
      {query ? <>
        <p className="simple-user-message">{questionLabel(query.question)}</p>
        <article className="simple-answer" aria-label="Answer and source citations">
          <div className="simple-answer-heading">{icon("chats-circle")}<span>{query.response.status === "error" ? "Question not completed" : "Answer"}</span></div>
          <p className="simple-answer-text">{query.response.answer}</p>
          <div className="simple-citations">
            {moments.map(frame => <button type="button" key={`${frame.uri}:${frame.t}`} onClick={() => replay(frame)} aria-label={`Replay source ${sourceClock(frame.t)}`}>{sourceClock(frame.t)}{icon("play")}</button>)}
            <span>{query.mode === "real" ? "Saved Gemini result" : "Preset demo"} · {({ok:"Cited result",partial:"Partial",error:"Not completed",no_result:"No matching evidence"})[query.response.status]}</span>
            {details}
          </div>
          <section id={timelineId} className="simple-cited-timeline" ref={timeline} hidden={!open} aria-label="Cited timeline" onKeyDown={timelineKeyDown}>
            <header><h2>Cited timeline <span>{moments.length} {moments.length === 1 ? "moment" : "moments"}</span></h2><button type="button" className="icon-button" aria-label="Close timeline" onClick={closeTimeline}>{icon("x")}</button></header>
            {moments.length ? <ol>{moments.map(frame => <li key={`${frame.uri}:${frame.t}`}>
              <button type="button" onClick={() => replay(frame)} aria-label={`Replay timeline ${sourceClock(frame.t)}`}>
                <time>{sourceClock(frame.t)}</time><img src={frame.uri} alt={frame.caption || "Cited source frame"}/><span>{frame.description}</span>
              </button>
            </li>)}</ol> : <p>No cited moments for this question. Open a saved answer or start a new question.</p>}
            <p className="simple-timeline-scope">{query.mode === "real" ? "Other moments were not exhaustively reviewed. This lists citations, not a full-video breakdown." : "Synthetic demo · preset moments, no model calls."}</p>
          </section>

        </article>
      </> : <div className="simple-chat-empty">
        <p>{state.local ? "Your video is ready to watch. Analysis is not ready yet." : "Ask about something visible in the video."}</p>
        {fixture && !state.local && <button type="button" className="outline-button" onClick={() => ui()?.askDemoQuestion("When is the package at the center?")}>Try: When is the package at the center?</button>}
        {state.local && <button type="button" className="text-button" onClick={() => ui()?.sources()}>Check analysis status</button>}
        <section id={timelineId} className="simple-cited-timeline" ref={timeline} hidden={!open} aria-label="Cited timeline" onKeyDown={timelineKeyDown}><h2>Cited timeline</h2><p>No cited moments yet. Ask a question or open a saved answer.</p></section>
      </div>}
    </section>
  </>;
}
