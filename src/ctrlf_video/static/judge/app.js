/* Public recorded-result walkthrough. No session API, writes, or model dispatch. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const model=window.CtrlFVideoJudge, reports=window.CtrlFVideoReport;
  const storageKey="ctrlf-video:judge:basketball-20261017-v1:finding";
  let sample, saved=null, snapshot=null, exporting=null, returnFocus=null;
  const form=$("finding-form"), video=$("source-video"), dialog=$("report-dialog");
  const nodes={title:$("finding-name"),observation:$("observation"),interpretation:$("interpretation"),openQuestions:$("open-questions")};
  const current=()=>Object.fromEntries(Object.entries(nodes).map(([k,node])=>[k,node.value]));
  const setFields=value=>{for(const [key,node] of Object.entries(nodes))node.value=value[key];};
  const same=(a,b)=>Boolean(a && b && Object.keys(nodes).every(k=>a[k]===b[k]));
  const text=(tag,value,className)=>{const n=document.createElement(tag);n.textContent=value;if(className)n.className=className;return n;};
  function sync() {
    const dirty=!same(saved,current());
    $("open-report").disabled=!saved || dirty;
    $("save-finding").disabled=!model.complete(current());
    $("reset-finding").disabled=!saved && Object.values(current()).every(v=>!v);
    return dirty;
  }
  function seek() {
    if (!sample) return;
    const apply=()=>{video.currentTime=1.001;video.pause();$("playback-status").textContent="Citation selected · source time 00:01.001. Press Play to review the context.";};
    if(video.readyState>=1)apply();
    else {video.addEventListener("loadedmetadata",apply,{once:true});video.load();}
    video.scrollIntoView({block:"center",behavior:"smooth"});video.focus({preventScroll:true});
  }
  $("replay").addEventListener("click",seek);$("answer-replay").addEventListener("click",seek);
  video.addEventListener("error",()=>{$("playback-status").textContent="Source playback could not load. Reload this page or open the original published source below.";});
  video.addEventListener("timeupdate",()=>{$("playback-status").textContent=`Source time ${reports.time(video.currentTime)} · ${video.paused ? "Paused" : "Playing"}`;});
  form.addEventListener("input",()=>{if(sync())$("save-status").textContent="Unsaved changes. Save before exporting.";else $("save-status").textContent="Saved finding matches this form.";});
  $("use-example").addEventListener("click",()=>{setFields(sample.reviewed_finding);sync();$("save-status").textContent="Existing human review copied into your draft. Check it and save your version.";nodes.observation.focus();});
  form.addEventListener("submit",event=>{
    event.preventDefault();const value=model.draft(current());if(!model.complete(value))return;
    saved=value;
    try {localStorage.setItem(storageKey,JSON.stringify(saved));$("save-status").textContent="Finding saved in this browser. Ready to export.";}
    catch {$("save-status").textContent="Finding kept in this tab. Browser storage is unavailable; export before leaving.";}
    sync();
  });
  $("reset-finding").addEventListener("click",()=>{
    saved=null;setFields(model.empty());
    let persisted=true;try {localStorage.removeItem(storageKey);}catch {persisted=false;}
    sync();$("save-status").textContent=persisted ? "Your finding was cleared. The recorded model result is unchanged." : "Cleared in this tab; browser storage could not be updated.";
  });
  function openReport() {
    if (!saved || sync()) return;
    snapshot=model.report(sample,saved,location.origin);
    const preview=$("report-preview");preview.replaceChildren();
    preview.append(text("h3",snapshot.title),text("p",reports.provenance(snapshot),"muted"));
    const notes=document.createElement("dl");
    for(const [key,label] of [["observation","Observed facts"],["interpretation","Interpretation / hypothesis"],["openQuestions","Open questions"]])notes.append(text("dt",label),text("dd",snapshot.findings[0].research[key] || "Not recorded"));
    preview.append(notes,text("p","Original Gemini answer · partial","eyebrow"),text("p",snapshot.questions[0].response.answer));
    for(const issue of snapshot.questions[0].response.unresolved)preview.append(text("p",`Still to verify: ${issue}`,"muted"));
    const img=document.createElement("img");img.src=snapshot.evidence[0].uri;img.alt="Actual source frame at 00:01.001";
    const replay=text("button","00:01.001 · Replay source","text-action");replay.type="button";replay.addEventListener("click",()=>{dialog.close();seek();});
    preview.append(img,replay,text("p",snapshot.scope,"muted"));
    returnFocus=document.activeElement;$("export-status").textContent="Includes the original model result, uncertainty and your saved finding.";
    dialog.showModal();$("close-report").focus();
  }
  $("open-report").addEventListener("click",openReport);
  $("close-report").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("close",()=>{exporting?.abort();returnFocus?.focus();});
  function download(content,name,type) {
    const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement("a");
    a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  $("download-md").addEventListener("click",()=>{download(reports.markdown(snapshot),"CtrlF Video - judge finding.md","text/markdown;charset=utf-8");$("export-status").textContent="Markdown download started, including the source replay link.";});
  $("download-json").addEventListener("click",()=>{download(JSON.stringify(snapshot,null,2),"CtrlF Video - judge finding.json","application/json");$("export-status").textContent="JSON download started, including the saved result and development history.";});
  const dataUrl=blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
  $("download-html").addEventListener("click",async()=>{
    if(exporting)return;
    const captured=snapshot,controller=new AbortController();exporting=controller;$("download-html").disabled=true;$("export-status").textContent="Embedding the public evidence image…";
    try {
      const frame=captured.evidence[0];
      const response=await fetch(frame.uri,{signal:controller.signal,credentials:"omit"});
      if(!response.ok || !response.headers.get("content-type")?.startsWith("image/jpeg"))throw Error("Evidence image unavailable");
      const blob=await response.blob();if(blob.size>2*1024*1024)throw Error("Evidence image exceeds export limit");
      const image=await dataUrl(blob);
      if(controller.signal.aborted || !dialog.open)return;
      download(reports.html(captured,{[frame.id]:image}),"CtrlF Video - judge finding.html","text/html;charset=utf-8");
      $("export-status").textContent="HTML download started. Evidence image is embedded for offline viewing; source video replay uses its public online link.";
    } catch(error) {if(!controller.signal.aborted)$("export-status").textContent="Could not embed the image. Try again, or download Markdown / JSON with the source reference.";}
    finally {if(exporting===controller){exporting=null;$("download-html").disabled=false;}}
  });
  async function load() {
    const response=await fetch("/static/judge/basketball/results.json",{credentials:"omit",cache:"no-store"});
    if(!response.ok)throw Error("Recorded test unavailable");sample=await response.json();
    // Validate the curated source/evidence before enabling any visitor actions.
    model.report(sample,{title:"Validation",observation:"Validation",interpretation:"",openQuestions:""},location.origin);
    $("question").textContent=sample.query.question;$("answer-text").textContent=sample.query.response.answer;
    for(const issue of sample.query.response.unresolved)$("unresolved").append(text("li",issue));
    for(const row of sample.history){const tr=document.createElement("tr");for(const v of [row.attempt,row.task,row.model_status,row.review])tr.append(text("td",v));$("history").append(tr);}
    $("source-duration").textContent="70.2 seconds · video only";$("copy-disclosure").textContent=sample.provenance.public_copy;video.src=sample.source.url;
    try {const value=localStorage.getItem(storageKey);saved=value ? model.draft(JSON.parse(value)) : null;if(saved && !model.complete(saved))saved=null;}catch {saved=null;}
    setFields(saved || model.empty());sync();if(saved)$("save-status").textContent="Your finding was restored from this browser. It is not shared with other visitors.";
    $("walkthrough").hidden=false;$("load-status").hidden=true;
  }
  load().catch(()=>{
    $("load-status").replaceChildren(text("span","The recorded test could not load. "));
    const retry=text("button","Reload walkthrough","text-action");retry.type="button";retry.addEventListener("click",()=>location.reload());$("load-status").append(retry);
  });
})();
