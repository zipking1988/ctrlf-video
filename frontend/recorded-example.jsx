import React, {useEffect, useRef, useState} from "react";
import SimpleReview from "./simple-review.jsx";
import {exampleView, exampleReport, findingKey, emptyFinding, completeFinding, storedFinding} from "./recorded-example-model.mjs";

const initialFinding = () => {try {return storedFinding(localStorage.getItem(findingKey));} catch {return null;}};
const same = (a,b) => !!a && Object.keys(emptyFinding()).every(key => a[key] === b[key]);
const reports = () => window.CtrlFVideoReport;
function download(content, extension, type) {
  const url=URL.createObjectURL(new Blob([content],{type})), link=document.createElement("a");
  link.href=url;link.download=`CtrlF Video - finding.${extension}`;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}
const dataUrl = blob => new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});

export default function RecordedExample({icon}) {
  const [active,setActive]=useState(false),[sample,setSample]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState("");
  const [saved,setSaved]=useState(initialFinding),[draft,setDraft]=useState(()=>initialFinding() || emptyFinding());
  const [editing,setEditing]=useState(false),[status,setStatus]=useState("");
  const [report,setReport]=useState(null),[exportStatus,setExportStatus]=useState(""),[exporting,setExporting]=useState(false);
  const [metaNode,setMetaNode]=useState(null);
  const player=useRef(null),editor=useRef(null),dialog=useRef(null),request=useRef(0),abort=useRef(null),returnFocus=useRef(null),activeRef=useRef(false);
  const dirty=!same(saved,draft);
  function leave(upload=false,workspace=false) {
    player.current?.pause();
    abort.current?.abort();setReport(null);
    ++request.current;setLoading(false);setActive(false);activeRef.current=false;
    document.body.classList.remove("recorded-view");
    document.getElementById("skip-link").href="#question";
    history.replaceState(null,"",(upload || workspace) ? "/#review" : "/#start");
    if(upload || workspace) {
      document.getElementById("welcome-resume").click();
      window.CtrlFVideoUI?.review();
      if(upload) document.getElementById("open-local").click();
    }
    else document.getElementById("open-welcome").click();
  }
  useEffect(()=>{
    async function open() {
      const token=++request.current,context=window.CtrlFVideoPersistence?.captureContext();
      setLoading(true);setError("");setStatus("");setActive(true);activeRef.current=true;
      document.body.classList.add("recorded-view");
      document.getElementById("player").pause();
      document.getElementById("skip-link").href="#example-player";
      try {
        if(context) {
          const flushed=await window.CtrlFVideoPersistence.flush();
          if(token!==request.current)return;
          if(!window.CtrlFVideoPersistence.isCurrent(context)) {leave();return;}
          if(!flushed) throw Error("Save your workspace changes before opening the example.");
        }
        const response=await fetch("/static/judge/basketball/results.json",{credentials:"omit",cache:"no-store"});
        if(!response.ok)throw Error("The example could not load. Please try again.");
        const data=await response.json();exampleView(data,location.origin);
        if(token!==request.current)return;
        setSample(data);
        history.replaceState(null,"","/#example");
      } catch(reason) {if(token===request.current)setError(reason.message);}
      finally {if(token===request.current)setLoading(false);}
    }
    window.CtrlFVideoRecordedExample={open,active:()=>activeRef.current};
    const onHash=()=>{if(location.hash==="#example")open();else if(activeRef.current)leave(false,location.hash==="#review");};
    const skip=document.getElementById("skip-link");
    const skipToVideo=event=>{
      if(!activeRef.current)return;
      event.preventDefault();
      player.current?.focus();player.current?.scrollIntoView({block:"start"});
    };
    skip.addEventListener("click",skipToVideo);
    window.addEventListener("hashchange",onHash);
    if(location.hash==="#example")open();
    return ()=>{++request.current;abort.current?.abort();skip.removeEventListener("click",skipToVideo);window.removeEventListener("hashchange",onHash);delete window.CtrlFVideoRecordedExample;};
  },[]);
  useEffect(()=>{if(editing)editor.current?.scrollIntoView({block:"start"});},[editing]);
  useEffect(()=>{
    if(report) {dialog.current.showModal();dialog.current.querySelector("button").focus();}
  },[report]);
  if(!active)return null;
  const seek = time => {
    const video=player.current;
    const apply=()=>{video.currentTime=time;video.pause();};
    if(video.readyState>=1)apply();else video.addEventListener("loadedmetadata",apply,{once:true});
    setStatus(`Source selected at ${reports().time(time)}. Play to check the context.`);
  };
  const openReport = () => {
    if(!saved || dirty)return;
    returnFocus.current=document.activeElement;
    setExportStatus("");setReport(exampleReport(sample,saved,location.origin));
  };
  const closeReport = () => {
    abort.current?.abort();setReport(null);returnFocus.current?.focus();
  };
  const embedHtml = async () => {
    if(exporting || !report)return;
    const captured=report,controller=new AbortController();abort.current=controller;setExporting(true);setExportStatus("Embedding the source frame…");
    try {
      const frame=captured.evidence[0];
      const response=await fetch(frame.uri,{credentials:"omit",signal:controller.signal});
      if(!response.ok || !response.headers.get("content-type")?.startsWith("image/jpeg"))throw Error();
      const blob=await response.blob();if(blob.size>2*1024*1024)throw Error();
      const image=await dataUrl(blob);if(controller.signal.aborted)return;
      download(reports().html(captured,{[frame.id]:image}),"html","text/html;charset=utf-8");
      setExportStatus("HTML downloaded with its evidence image. Video replay uses the public source link.");
    } catch {if(!controller.signal.aborted)setExportStatus("Could not embed the frame. Try again or download Markdown / JSON.");}
    finally {if(abort.current===controller){abort.current=null;setExporting(false);}}
  };
  const view=sample ? exampleView(sample,location.origin) : null;
  return <section className="recorded-workspace fieldnotes canvas-first review-desk review-first workbench-shell" aria-label="Recorded example workspace">
    <header className="studio-header">
      <button className="brand" onClick={()=>leave()}>CtrlF Video</button>
      <span className="example-project-title">Recorded example</span>
      <button className="example-upload" onClick={()=>leave(true)}>Upload video</button>
      <button className="text-button" onClick={()=>leave()}>Home</button>
    </header>
    {loading && <p className="example-load" role="status">Opening the recorded example…</p>}
    {error && <div className="example-load" role="alert"><p>{error}</p><button onClick={()=>window.CtrlFVideoRecordedExample.open()}>Try again</button> <button onClick={()=>leave()}>Back</button></div>}
    {!loading && !error && view && <>
      <section className="source-dock" aria-label="Example source video">
        <div className="player-wrap"><video ref={player} id="example-player" tabIndex={-1} controls playsInline preload="metadata" src={sample.source.url} poster="/static/judge/basketball/frames/scoreboard-1-001.jpg" aria-label="Recorded basketball source" onError={()=>setStatus("Video could not load. Reload this page to retry.")}/></div>
        <div id="example-source-meta" ref={setMetaNode}/>
      </section>
      <section className="agent-chat" aria-label="Example video chat">
        <SimpleReview state={view} ui={()=>({seek,newQuestion:()=>leave(true)})} icon={icon} metaTarget={metaNode} newQuestionLabel="Upload your video" playerId="example-player" onSaveFinding={()=>setEditing(true)}/>
        <div className="example-next"><span>Saved real Gemini result · No new analysis</span><button className="outline-button" onClick={()=>setEditing(!editing)}>{editing ? "Hide finding" : "Write a finding"}{icon("stack")}</button></div>
        {status && <p className="example-status" role="status">{status}</p>}
        {editing && <section ref={editor} className="example-finding" aria-label="Write a source-linked finding">
          <header><div><h2>Your finding</h2><p>Write what you checked. The source citation stays attached.</p></div><button className="text-button" onClick={()=>{setDraft({...sample.reviewed_finding});setStatus("Existing human review copied into your draft. Check it before saving.");}}>Use reviewed example</button></header>
          <form onSubmit={event=>{event.preventDefault();if(!completeFinding(draft))return;const value={...draft};setSaved(value);try{localStorage.setItem(findingKey,JSON.stringify(value));setStatus("Finding saved in this browser. Ready to export.");}catch{setStatus("Kept in this tab. Storage is unavailable; export before leaving.");}}}>
            <label>Finding title<input required maxLength={200} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
            <label>Observed facts<textarea required rows={3} maxLength={2000} value={draft.observation} onChange={e=>setDraft({...draft,observation:e.target.value})}/></label>
            <details><summary>Open questions & interpretation</summary>
              <label>Open questions<textarea rows={2} maxLength={2000} value={draft.openQuestions} onChange={e=>setDraft({...draft,openQuestions:e.target.value})}/></label>
              <label>Interpretation / hypothesis<textarea rows={2} maxLength={2000} value={draft.interpretation} onChange={e=>setDraft({...draft,interpretation:e.target.value})}/></label>
              <button className="text-button" type="button" onClick={()=>{setSaved(null);setDraft(emptyFinding());try{localStorage.removeItem(findingKey);setStatus("Your saved finding was cleared. The recorded result is unchanged.");}catch{setStatus("Cleared in this tab. Browser storage could not be updated.");}}}>Clear my saved finding</button>
            </details>
            <footer><button className="outline-button" disabled={!completeFinding(draft)} type="submit">Save finding</button><button className="primary-button" type="button" disabled={!saved || dirty} onClick={openReport}>Export report {icon("arrow-right")}</button><small>{dirty ? "Save edits before exporting." : "Saved in this browser only."}</small></footer>
          </form>
        </section>}
        <details className="example-history"><summary>Real test results & limitations</summary><p>This 70.2-second sports clip is a technical sample, not a UX study. The history below is a development record, not an accuracy benchmark.</p><ol>{sample.history.map((attempt,i)=><li key={i}><strong>{attempt.task || attempt.question || `Attempt ${i+1}`} · {attempt.model_status}</strong><p>{attempt.human_review || attempt.review}</p></li>)}</ol><p>{sample.provenance.public_copy}</p></details>
      </section>
    </>}
    <dialog ref={dialog} className="example-report-dialog" onClose={closeReport} aria-labelledby="example-report-title">
      <header><h2 id="example-report-title">Your investigation report</h2><button className="icon-button" aria-label="Close report" onClick={()=>dialog.current.close()}>{icon("x")}</button></header>
      {report && <><h3>{report.title}</h3><p>{reports().provenance(report)}</p><dl>{[["observation","Observed facts"],["interpretation","Interpretation / hypothesis"],["openQuestions","Open questions"]].map(([key,label])=><React.Fragment key={key}><dt>{label}</dt><dd>{report.findings[0].research[key] || "Not recorded"}</dd></React.Fragment>)}</dl><p>{report.questions[0].response.answer}</p>{report.questions[0].response.unresolved.map(text=><p key={text}>Still to verify: {text}</p>)}<img src={report.evidence[0].uri} alt="Cited frame at 00:01.001"/><button className="text-button" onClick={()=>{dialog.current.close();seek(1.001);player.current.scrollIntoView({block:"center"});}}>00:01.001 · Replay source</button><p>{report.scope}</p><footer>
        <button className="outline-button" onClick={()=>{download(reports().markdown(report),"md","text/markdown;charset=utf-8");setExportStatus("Markdown download started.");}}>Markdown</button>
        <button className="outline-button" onClick={()=>{download(JSON.stringify(report,null,2),"json","application/json");setExportStatus("JSON download started.");}}>JSON</button>
        <button className="primary-button" disabled={exporting} onClick={embedHtml}>HTML with evidence</button>
      </footer><p role="status">{exportStatus}</p></>}
    </dialog>
  </section>;
}
