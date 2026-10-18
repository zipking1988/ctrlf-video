import React, {useEffect, useRef, useState} from 'react';
import {sourceClock} from './review-timeline.mjs';
import {reviewDocuments, searchReview, reviewStorageKey, restoreReviewState, savedReviewMarkdown} from './review-evidence.mjs';
import ClipTimeline from './clip-timeline.jsx';

export default function ReviewConversation({review,seek,download,prepareWorkspace,preparing,prepareError}) {
  const docs=reviewDocuments(review),key=reviewStorageKey(review);
  const [state,setState]=useState(()=>{try{return restoreReviewState(review,localStorage.getItem(key));}catch{return restoreReviewState(review,null);}});
  const [storageError,setStorageError]=useState(false),[notice,setNotice]=useState('');
  const input=useRef(null),latest=useRef(null),submitted=useRef(false);
  useEffect(()=>{
    try {localStorage.setItem(key,JSON.stringify({version:1,source:review.source.sha256,...state}));setStorageError(false);}
    catch {setStorageError(true);}
  },[state,key,review.source.sha256]);
  useEffect(()=>{if(submitted.current){latest.current?.focus();submitted.current=false;}},[state.turns]);
  function replay(id) {
    seek(review.points[id].t);
    document.getElementById('example-player')?.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  const citations=doc=><div className="finding-citations">{doc.points.map(id=><button type="button" className="clip-citation" key={id} onClick={()=>replay(id)} aria-label={`Replay finding source at ${sourceClock(review.points[id].t)}`}>{sourceClock(review.points[id].t)} ↗</button>)}</div>;
  function focusFinding(doc) {
    setState(old=>({...old,contextIds:[doc.id]}));setNotice(`Question context: ${doc.title}. Your draft is unchanged.`);
    input.current?.focus();input.current?.scrollIntoView({block:'center'});
  }
  function toggleSave(doc) {
    const saved=state.savedIds.includes(doc.id);
    setState(old=>({...old,savedIds:old.savedIds.includes(doc.id)?old.savedIds.filter(id=>id!==doc.id):[...old.savedIds,doc.id]}));
    setNotice(saved?'Finding removed from your saved selection.':'Finding selected. Export it with the source timestamps.');
  }
  function submit(question=state.draft) {
    if(!question.trim())return;
    const contextIds=[...state.contextIds],result=searchReview(review,question,contextIds);
    submitted.current=true;
    setState(old=>({...old,draft:'',contextIds:result.ids.length?result.ids.slice(0,1):old.contextIds,turns:[...old.turns,{question:question.trim(),contextIds}].slice(-12)}));
    setNotice('');
  }
  return <section className="review-discovery" aria-label="Findings and questions">
    <header className="finding-heading"><div><span className="clip-eyebrow">70-SECOND CLIP · CHECKED SOURCE NOTES</span><h1>Follow the moments. Connect the findings.</h1><p>Prepared by Codex from 71 sampled frames. Select a moment to inspect its source.</p></div><div><span className="finding-mode">Prepared review</span><button type="button" className="outline-button" onClick={()=>{input.current?.focus();input.current?.scrollIntoView({block:"center"});}}>Ask a question</button></div></header>
    <ClipTimeline review={review} docs={docs} seek={seek} citations={citations} onAsk={focusFinding} onSave={toggleSave} savedIds={state.savedIds}/>
    {!!state.savedIds.length && <section className="review-saved" aria-label="Saved review findings"><strong>{state.savedIds.length} saved {state.savedIds.length===1?'finding':'findings'}</strong><span>{storageError?'Kept in this tab only':'Saved in this browser'}</span><button type="button" className="outline-button" onClick={()=>download(savedReviewMarkdown(review,state.savedIds,location.origin),'md','text/markdown;charset=utf-8')}>Export saved findings</button></section>}
    <section className="review-live-entry" aria-labelledby="review-live-heading">
      <h2 id="review-live-heading">Ask Gemini about this video</h2>
      <p>Make a private workspace copy, then use its real analysis and follow-up conversation. Analysis requires an approved, funded session; copying this clip does not enable it.</p>
      <button type="button" className="primary-button" disabled={preparing || !prepareWorkspace} onClick={()=>prepareWorkspace(state.draft)}>{preparing?'Preparing the verified clip…':'Prepare this clip for questions'}</button>
      <small>Your typed question stays a draft. The next screen explains storage and access before upload. No model request starts here.</small>
      {prepareError && <p role="alert">{prepareError}</p>}
    </section>
    <section className="review-questions" aria-labelledby="review-question-heading">
      <header><h2 id="review-question-heading">Search the existing review</h2><span className="finding-mode">Live Gemini off</span></header>
      <p id="review-question-scope">Search the checked notes below, with follow-up context and source timestamps. This searches existing evidence; it does not analyze new frames or generate an AI answer.</p>
      {!!state.turns.length && <div className="review-conversation" aria-label="Review questions">{state.turns.map((turn,index)=>{
        const result=searchReview(review,turn.question,turn.contextIds);
        return <article key={index} tabIndex={-1} ref={index===state.turns.length-1?latest:null} aria-label={`Review response ${index+1}`}>
          <p className="simple-user-message">{turn.question}</p>
          <span className="clip-eyebrow">{result.kind==='excerpts'?'FROM REVIEWED NOTES':'NOT ANSWERED BY THIS REVIEW'}</span><p>{result.message}</p>
          {result.ids.map(id=>{const doc=docs.find(d=>d.id===id);return <blockquote key={id}><strong>{doc.title}</strong><p>{doc.text}</p><p className="review-answer-limit">{doc.limit}</p>{citations(doc)}<button className="text-button" type="button" onClick={()=>focusFinding(doc)}>Follow up on this</button><button className="text-button" type="button" onClick={()=>toggleSave(doc)}>{state.savedIds.includes(id)?'Remove saved finding':'Save this finding'}</button></blockquote>;})}
        </article>;
      })}</div>}
      <form onSubmit={event=>{event.preventDefault();submit();}}>
        {!!state.contextIds.length && <div className="review-context"><span>Following up on: {state.contextIds.map(id=>docs.find(d=>d.id===id)?.title).join(' · ')}</span><button type="button" className="text-button" onClick={()=>setState(old=>({...old,contextIds:[]}))}>Clear context</button></div>}
        <label htmlFor="review-evidence-question">Question draft</label>
        <textarea ref={input} id="review-evidence-question" rows={2} maxLength={2000} placeholder="Draft a question for the workspace, or search the notes here…" aria-describedby="review-question-scope" value={state.draft} onChange={event=>setState(old=>({...old,draft:event.target.value}))} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();submit();}}}/>
        <div className="review-question-actions"><small>Enter to search · Shift+Enter for a new line</small><button type="submit" className="outline-button" disabled={!state.draft.trim()}>Search reviewed evidence</button><button type="button" className="primary-button" disabled={!state.draft.trim() || preparing || !prepareWorkspace} onClick={()=>prepareWorkspace(state.draft)}>Prepare in workspace</button></div>
      </form>
      <div className="review-question-starters" aria-label="Suggested review questions">{(state.contextIds.length?['Show the evidence','Why?','What happens next?']:['How does the lead change?','Why does the score go from 62 to 61?','What happens at 00:43?']).map(question=><button type="button" className="outline-button" key={question} onClick={()=>{setState(old=>({...old,draft:old.draft.trim()?old.draft:question}));input.current?.focus();}}>{question}</button>)}</div>
      <p className="review-live-limit">For questions beyond these notes, a new Gemini analysis needs an approved, funded workspace. This public example has no live model access.</p>
      {!!state.turns.length && <button type="button" className="text-button" onClick={()=>{setState(old=>({...old,turns:[],contextIds:[]}));setNotice('Question history cleared. Saved findings and your draft are unchanged.');}}>Clear question history</button>}
    </section>
    {(notice||storageError) && <p role="status" className="example-status">{storageError?'Browser storage is unavailable. Export saved findings before leaving. ':''}{notice}</p>}
  </section>;
}
