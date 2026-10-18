import React, {useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {citedMoments, sourceClock} from "./review-timeline.mjs";
import {questionLabel, isBreakdown} from "./question-shortcuts.mjs";
import AnalysisTimeline from "./analysis-timeline.jsx";

function SavedTurn({record, state, ui}) {
  const {query} = record;
  const supported = ["ok", "partial"].includes(query.response.status) && query.response.events.length > 0;
  const status = {ok:"Cited result", partial:"Partial", error:"Not completed", no_result:"No matching evidence"}[query.response.status];
  return <div className="simple-saved-turn">
    <p className="simple-user-message"><span className="simple-saved-question-label">{questionLabel(query.question)}</span></p>
    <details className="simple-saved-response">
      <summary>Saved answer · {status}</summary>
      <p className="simple-saved-question"><strong>Full question</strong><br/>{query.question}</p>
      <p className="simple-saved-answer-text">{query.response.answer}</p>
      <div className="simple-saved-turn-actions">
        <button type="button" className="text-button" aria-label={`Open answer and source evidence for: ${query.question}`} onClick={() => ui()?.select(record.id)}>Open answer & evidence</button>
        {supported && <button type="button" className="text-button" disabled={state.local} aria-label={`Continue conversation from: ${query.question}`} onClick={() => ui()?.continueFrom(record.id)}>Ask a follow-up</button>}
      </div>
    </details>
  </div>;
}

export default function SimpleReview({state, ui, icon, metaTarget, playerId = "player", onSaveFinding, newQuestionLabel = "New question", conversationMode = true}) {
  const selected = state.records.find(record => record.id === state.selectedId) || state.records.at(-1);
  const query = selected?.query;
  const breakdown = !!query && isBreakdown(query.question);
  const duration = state.sourceInfo?.metadata?.duration ?? state.sourceInfo?.duration;
  const moments = citedMoments(query, duration);
  const analysis = query?.mode === "real";
  const [timelineFor, setTimelineFor] = useState(null);
  const timeline = useRef(null);
  const timelineTrigger = useRef(null);
  const closeTimeline = () => {
    setTimelineFor(`closed:${key}`);
    timelineTrigger.current?.focus();
  };
  const timelineKeyDown = event => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    closeTimeline();
  };
  const key = `${state.sourceInfo?.id}:${state.epoch}:${selected?.id || "empty"}`;
  const timelineId = `${playerId}-cited-timeline`;
  const open = timelineFor === key || (breakdown && timelineFor !== `closed:${key}`);
  useEffect(() => setTimelineFor(null), [state.sourceInfo?.id, state.epoch]);
  useEffect(() => {
    if (open && timelineFor === key && document.querySelector(".agent-shell")?.classList.contains("review-first"))
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
            {query.mode === "real" && <p>Sampled visual evidence; audio is not transcribed. Replay the source to check the claim.</p>}
            {["ok","partial"].includes(query.response.status) && <button type="button" className="text-button" onClick={save}>Write a finding</button>}
            <button type="button" className="text-button" onClick={() => ui()?.newQuestion()}>{newQuestionLabel}</button>
            {!conversationMode && state.records.length > 1 && <details className="simple-question-history"><summary>Earlier questions ({state.records.length-1})</summary>
              {state.records.filter(record => record.id !== selected.id).map(record => <button type="button" key={record.id} onClick={() => ui()?.select(record.id)}>{record.query.question}</button>)}
            </details>}
          </details>
  ) : null;
  const target = metaTarget === undefined ? document.getElementById("review-source-meta") : metaTarget;
  const citedTimeline = query ? <section id={timelineId} className={`simple-cited-timeline${analysis ? " simple-analysis-timeline" : ""}`} ref={timeline} hidden={!open} aria-label="Cited timeline" onKeyDown={timelineKeyDown}>
    <header><h2>Cited timeline <span>{moments.length} {moments.length === 1 ? "moment" : "moments"}</span></h2><button type="button" className="icon-button" aria-label="Close timeline" onClick={closeTimeline}>{icon("x")}</button></header>
    {analysis && open ? <AnalysisTimeline key={key} query={query} duration={duration} playerId={playerId} onSeek={frame => ui()?.seek(frame.t, query)} onReplay={replay}/> : moments.length ? <ol>{moments.map(frame => <li key={`${frame.uri}:${frame.t}`}>
      <button type="button" onClick={() => replay(frame)} aria-label={`Replay timeline ${sourceClock(frame.t)}`}>
        <time>{sourceClock(frame.t)}</time><img src={frame.uri} alt={frame.caption || "Cited source frame"}/><span>{frame.description}</span>
      </button>
    </li>)}</ol> : <p>No cited moments for this question. Open a saved answer or start a new question.</p>}
    <p className="simple-timeline-scope">{analysis ? (breakdown ? "These are cited observations from sampled windows. Check Review coverage & limits for unfinished ranges; sampling does not prove every event was detected." : "Other moments were not exhaustively reviewed. This lists citations, not a full-video breakdown.") : "Synthetic demo · preset moments, no model calls."}</p>
  </section> : null;
  const activeTurn = (query ? <>
        <p className="simple-user-message">{questionLabel(query.question)}</p>
        <article className="simple-answer" aria-label="Answer and source citations">
          <div className="simple-answer-heading">{icon("chats-circle")}<span>{query.response.status === "error" ? "Question not completed" : breakdown ? "Whole-video breakdown" : "Answer"}</span></div>
          {analysis && breakdown && !!moments.length ? <>
            {citedTimeline}
            <details className="simple-generated-summary"><summary>Read generated summary · check against the source</summary><p className="simple-answer-text">{query.response.answer}</p></details>
          </> : <p className="simple-answer-text">{query.response.answer}</p>}
          {conversationMode && query.mode === "real" && ["ok","partial"].includes(query.response.status) && !!query.response.events.length && <div className="live-answer-actions">
            <button type="button" className="primary-button" disabled={state.local} onClick={()=>ui()?.continueFrom(selected.id)}>Follow up on this answer {icon("arrow-right")}</button>
            <button type="button" className="outline-button" onClick={save}>Write a finding</button>
            <small>{query.usedContext ? "This answer used the selected earlier answer as context." : "Follow-up questions use this answer and its source evidence as context."}</small>
          </div>}
          {!!query.response.unresolved.length && <details className="simple-result-warning" open={breakdown || undefined}>
            <summary>{breakdown ? "Review coverage & limits" : "Still to verify"} · {query.response.unresolved.length} {query.response.unresolved.length === 1 ? "open point" : "open points"}</summary>
            {query.response.unresolved.map(text => <p key={text}>{text}</p>)}
          </details>}
          {query.response.status === "no_result" && <p className="simple-result-scope">No matching evidence was returned. This does not prove the event never occurred; replay the source or ask about a more specific visible detail.</p>}
          {query.response.status === "error" && <div className="simple-result-recovery">
            {query.response.errors.map((error,index) => <div key={index}>{error.code === "whole_video_review_limit" ? <p>Whole-video review supports clips up to 5:50. Choose a shorter recording, or ask a question about a specific visible moment.</p> : <><p>{error.message}</p><p>{error.suggested_action}</p></>}</div>)}
            <p>This question did not complete. It cannot anchor a follow-up. {conversationMode ? "Your earlier answers remain in this conversation." : "Your earlier answers remain available in Details & save."}</p>
            <button type="button" className="outline-button" onClick={() => ui()?.newQuestion()}>Start a new question</button>
          </div>}
          <div className="simple-citations">
            {moments.map(frame => <button type="button" key={`${frame.uri}:${frame.t}`} onClick={() => replay(frame)} aria-label={`Replay source ${sourceClock(frame.t)}`}>{sourceClock(frame.t)}{icon("play")}</button>)}
            <span>{query.mode === "real" ? "Saved model result" : "Preset demo"} · {({ok:"Cited result",partial:"Partial",error:"Not completed",no_result:"No matching evidence"})[query.response.status]}</span>
            {!target && <button type="button" ref={timelineTrigger} aria-expanded={open} aria-controls={timelineId} onClick={() => setTimelineFor(open ? `closed:${key}` : key)}>Source timeline</button>}
            {details}
          </div>
          {!(analysis && breakdown && !!moments.length) && citedTimeline}

        </article>
      </> : <div className="simple-chat-empty">
        <p>{state.local ? "Your video is ready to watch. Analysis is not ready yet." : "Ask about something visible in the video."}</p>
        {fixture && !state.local && <button type="button" className="outline-button" onClick={() => ui()?.askDemoQuestion("When is the package at the center?")}>Try: When is the package at the center?</button>}
        {state.local && <button type="button" className="text-button" onClick={() => ui()?.sources()}>Check analysis status</button>}
        <section id={timelineId} className="simple-cited-timeline" ref={timeline} hidden={!open} aria-label="Cited timeline" onKeyDown={timelineKeyDown}><h2>Cited timeline</h2><p>No cited moments yet. Ask a question or open a saved answer.</p></section>
      </div>);
  return <>
    {target && createPortal(<div className="simple-source-meta">
      <span>{state.sourceInfo?.name || "Package positions · Synthetic demo"}</span>
      <button type="button" className="simple-timeline-toggle" ref={timelineTrigger} aria-expanded={open} aria-controls={timelineId} onClick={() => setTimelineFor(open ? `closed:${key}` : key)}>
        {icon("list")}Timeline<span className="simple-timeline-count">{moments.length}</span>
      </button>
    </div>, target)}
    <section key={conversationMode ? `${state.sourceInfo?.id}:${state.epoch}` : key} className="simple-conversation" aria-label="Video conversation">
      {conversationMode ? <>
        <header className="simple-conversation-heading">
          <h2>Conversation <span>{state.records.length} {state.records.length === 1 ? "question" : "questions"}</span></h2>
          <p>{fixture ? "Synthetic demo · preset answers, no model calls." : state.local ? "Keep your questions here while analysis is unavailable." : "Keep asking about this video. Follow a detail or explore something new."}</p>
        </header>
        {state.records.length ? <ol className="simple-chat-thread" aria-label="Questions and saved answers">
          {state.records.map(record => <li key={record.id} aria-current={record.id === selected?.id ? "true" : undefined}>
            {record.id === selected?.id ? activeTurn : <SavedTurn record={record} state={state} ui={ui}/>}
          </li>)}
        </ol> : activeTurn}
      </> : activeTurn}
    </section>
  </>;
}
