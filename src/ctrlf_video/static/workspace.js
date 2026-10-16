/* Durable investigations, owned sources, and recoverable real-model requests. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const ui = () => window.CtrlFVideoSessionUI;
  const store = () => window.CtrlFVideoWorkbench;
  const demo = {id:"demo_parcel",name:"Package positions · Synthetic demo",metadata:{duration:18,audio:false},job:{state:"ready"}};
  const labels = { queued:"Awaiting preflight", probing:"Checking source", captioning:"Describing frames", indexing:"Indexing", ready:"Ready for questions", failed:"Processing failed", cancelled:"Cancelled", awaiting_configuration:"Awaiting configuration" };
  let session, current, currentVideo = demo, suspended = true, saving = null, lastSaved = "", lastSavedEdits = "", timer;
  let conflict = false, requestEpoch = 0, activeRequest = null, libraryEpoch = 0;
  const owns = (id, epoch) => current?.id === id && requestEpoch === epoch;
  function status(text, kind="") { $("save-state").textContent = text; $("save-state").dataset.state = kind; }
  async function api(path, method="GET", body) {
    const response = await fetch(path, {method, credentials:"same-origin", cache:"no-store",
      headers: body ? {"Content-Type":"application/json", "X-CTRLF-CSRF":session.csrf} : method !== "GET" ? {"X-CTRLF-CSRF":session.csrf} : {},
      body: body ? JSON.stringify(body) : undefined });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) { const error = new Error(data?.detail || "request_failed"); error.status=response.status; error.data=data; throw error; }
    return data;
  }
  const snapshot = () => ui().snapshot();
  function editSnapshot(state) {
    const {playerTime, ...panelState}=state.ui || {};
    return JSON.stringify({...state,ui:panelState});
  }
  function remember() { try { localStorage.setItem("ctrlf-video-current", current.id); } catch {} }
  async function flush() {
    if (saving) {
      const desk=current;
      await saving;
      if (current!==desk) return false;
      if (editSnapshot(snapshot())!==lastSavedEdits) return flush();
      return !suspended && !conflict;
    }
    if (suspended || conflict || !current) return false;
    const state=snapshot(), encoded=JSON.stringify(state), edits=editSnapshot(state);
    if (encoded === lastSaved) return true;
    const desk = current;
    status("Saving…");
    saving = api(`/api/investigations/${desk.id}`, "PUT", {revision:desk.revision,state:JSON.parse(encoded)})
      .then(result => { desk.revision=result.revision; lastSaved=encoded; lastSavedEdits=edits; status("Saved to workspace","saved"); })
      .catch(error => { conflict=error.status===409; status(conflict ? "Changed in another window · reopen to recover" : "Save failed · click to retry", "error"); throw error; })
      .finally(() => { saving=null; });
    await saving;
    if (current!==desk) return false;
    if (editSnapshot(snapshot())!==lastSavedEdits) return flush();
    return true;
  }
  function changed() {
    if (suspended || conflict) return;
    status("Unsaved changes"); clearTimeout(timer);
    timer=setTimeout(() => flush().catch(() => {}),500);
  }
  async function openDesk(id) {
    const previousId=current?.id, epoch=++requestEpoch;
    ui().busy(true);
    try {
      await flush(); if (!owns(previousId,epoch)) return false;
      await stopRequest(); if (!owns(previousId,epoch)) return false;
      const desk=await api(`/api/investigations/${id}`);
      if (!owns(previousId,epoch)) return false;
      const video=desk.video === "demo_parcel" ? demo : await api(`/api/videos/${desk.video}`);
      if (!owns(previousId,epoch)) return false;
      await flush(); if (!owns(previousId,epoch)) return false;
      if (desk.id===previousId && !conflict && current.revision>desk.revision) {desk.state=snapshot();desk.revision=current.revision;}
      suspended=true;
      current=desk; currentVideo=video; conflict=false;
      ui().restore({...desk.state,title:desk.state.title || desk.title},video);
      const restored=snapshot();lastSaved=JSON.stringify(restored);lastSavedEdits=editSnapshot(restored);
      remember(); status("Investigation restored","saved");
      $("workspace-library").close();
      suspended=false;
      await recover();
      if (!owns(desk.id,epoch)) return false;
      if (["queued","probing","captioning","indexing"].includes(video.job?.state)) watch(video.id,epoch);
      return true;
    } finally { if (epoch===requestEpoch) {suspended=false;ui().busy(false);} }
  }
  async function create(video=demo) {
    const previousId=current?.id, epoch=++requestEpoch;
    ui().busy(true);
    try {
      await flush(); if (!owns(previousId,epoch)) return false;
      await stopRequest(); if (!owns(previousId,epoch)) return false;
      const desk=await api("/api/investigations","POST",{video_id:video.id,title:video.id === "demo_parcel" ? "Untitled investigation" : video.name.replace(/\.[^.]+$/, "")});
      if (!owns(previousId,epoch)) return false;
      await flush(); if (!owns(previousId,epoch)) return false;
      suspended=true;
      current=desk;
      currentVideo=video; conflict=false;
      ui().applySource(video); store().rename(current.title);
      lastSaved=""; lastSavedEdits="";remember();
      suspended=false;
      await flush(); if (!owns(desk.id,epoch)) return false;
      $("workspace-library").close();
      if (["queued","probing","captioning","indexing"].includes(video.job?.state)) watch(video.id,epoch);
      return true;
    } finally { if (epoch===requestEpoch) {suspended=false;ui().busy(false);} }
  }
  function item(title, detail, action, actionLabel="Open") {
    const row=document.createElement("article"); row.className="library-row";
    const copy=document.createElement("div"); const name=document.createElement("strong"); name.textContent=title;
    const meta=document.createElement("small");meta.textContent=detail;copy.append(name,meta);row.append(copy);
    const button=document.createElement("button");button.className="outline-button";button.textContent=actionLabel;
    button.onclick=()=>Promise.resolve(action()).catch(error=>libraryNotice(error.message));row.append(button);return row;
  }
  function libraryNotice(message) { $("library-notice").textContent=message; }
  async function showRuntime() {
    const dialog=$("agent-setup-dialog"), button=$("refresh-agent-setup");
    if(!dialog.open) dialog.showModal();
    button.disabled=true;$("agent-setup-summary").textContent="Reading local configuration…";
    try {
      const data=await api("/api/runtime/status");
      const provider="Gemini · AI Builder Cup";
      $("agent-setup-summary").textContent=data.dispatch_prerequisites_met
        ? `${provider}: Local prerequisites are ready. Start analysis in Sources; live model connectivity and quality remain unverified.`
        : `${provider}: Analysis is not ready. Demos, upload preflight, playback and local saving remain available.`;
      const list=$("agent-readiness-checks");list.replaceChildren();
      for(const check of data.checks) {
        const row=document.createElement("article");row.className="agent-check";
        const heading=document.createElement("strong");heading.textContent=check.label;
        const state=document.createElement("span");state.textContent=check.state==="available" ? "Provided" : "Required";state.dataset.state=check.state;
        const detail=document.createElement("p");detail.textContent=check.detail;
        row.append(heading,state,detail);list.append(row);
      }
      const models=$("agent-model-roles");models.replaceChildren();
      for(const model of data.models) {
        const row=document.createElement("p");row.textContent=`${model.label}${model.optional ? "(Optional)" : ""} · ${model.configured ? `${model.model} / ${model.revision} · ${model.key_present ? "Credentials configured" : "Credentials missing"}` : "Not configured"}`;
        models.append(row);
      }
    }catch(error){$("agent-setup-summary").textContent=`Could not load: ${error.message}.Check again.`;}
    finally {button.disabled=false;}
  }
  async function library(kind="investigations") {
    const deskId=current?.id, epoch=requestEpoch, token=++libraryEpoch;
    const active=()=>owns(deskId,epoch) && token===libraryEpoch;
    await flush(); if (!active()) return; libraryNotice("");
    $("library-title").textContent=kind === "videos" ? "Sources" : "Investigations";
    $("library-intro").textContent=kind === "videos" ? "Upload checks your video locally. Start analysis sends sampled JPEG frames to Google Gemini within your approved budget. The original video stays on this server; audio is not transcribed." : `Investigations are saved in this workspace, retained for ${session.ttl_hours} hours by default. Resume or start an investigation.`;
    $("library-add").textContent=kind === "videos" ? "Upload video" : "New investigation";
    $("library-add").onclick=()=>{
      if(kind === "videos") {$("workspace-library").close();$("file-input").click();}
      else create(currentVideo).catch(e=>libraryNotice(e.message));
    };
    const body=$("library-items");body.replaceChildren();
    $("workspace-library").showModal();
    if (kind === "videos") {
      body.append(item(demo.name,"18 seconds · public synthetic demo · preset answers",()=>openSource(demo)));
      const data=await api("/api/videos");
      if (!active()) return;
      for (const video of data.items) {
        const job=video.job;
        const jobLabel=job?.state === "awaiting_configuration" && session.real_ready ? "Ready to analyze" : labels[job?.state] || "Uploaded";
        const row=item(video.name,`${Math.round(video.bytes/1024/1024)} MB · ${jobLabel}${job?.total ? ` · ${job.completed}/${job.total} windows` : ""}`,()=>openSource(video));
        if (["failed","cancelled"].includes(job?.state) && !video.metadata?.windows) {
          const retry=document.createElement("button");retry.className="outline-button";retry.textContent="Run preflight again";
          retry.onclick=async()=>{try {await api(`/api/videos/${video.id}/retry`,"POST");libraryNotice("Preflight restarted.");if(currentVideo.id===video.id) watch(video.id,requestEpoch);}catch(e){libraryNotice(e.message);}};
          row.append(retry);
        } else if (["awaiting_configuration","failed","cancelled"].includes(job?.state)) {
          const analyze=document.createElement("button");analyze.className="outline-button";analyze.textContent="Start analysis";
          analyze.disabled=!session.real_ready || !video.metadata?.windows;
          analyze.title=analyze.disabled ? "Requires model configuration, valid calibration and approved budgets" : "Send sampled JPEG frames to Google Gemini using your approved budget";
          analyze.onclick=async()=>{try {await api(`/api/videos/${video.id}/analyze`,"POST"); libraryNotice("Analysis accepted. Refresh to see progress."); if (currentVideo.id===video.id) watch(video.id,requestEpoch);}catch(e){libraryNotice(e.message);}};
          row.append(analyze);
        }
        if (["queued","probing","captioning","indexing"].includes(job?.state)) {
          const cancel=document.createElement("button");cancel.className="text-button";cancel.textContent="Cancel";
          cancel.onclick=async()=>{await api(`/api/videos/${video.id}/cancel`,"POST");await library("videos");};row.append(cancel);
        }
        const rename=document.createElement("button");rename.className="text-button";rename.textContent="Rename";
        rename.onclick=()=>renameSource(video);row.append(rename);
        const remove=document.createElement("button");remove.className="text-button danger";remove.textContent="Delete";
        remove.setAttribute("aria-label",`Delete source: ${video.name}`);
        remove.onclick=()=>confirmDelete(video,"videos");row.append(remove);body.append(row);
      }
      if (!session.real_ready) libraryNotice("Analysis awaits model and budget configuration. Upload, preflight, playback and saving are available.");
    } else {
      const data=await api("/api/investigations");
      if (!active()) return;
      for (const desk of data.items) {
        const row=item(desk.title,`${desk.video === "demo_parcel" ? "Demo source" : "Uploaded source"} · ${new Date(desk.updated*1000).toLocaleString()}${desk.id===current?.id ? " · Current" : ""}`,()=>openDesk(desk.id));
        const remove=document.createElement("button");remove.className="text-button danger";remove.textContent="Delete";
        remove.onclick=()=>confirmDelete(desk,"investigations");row.append(remove);body.append(row);
      }
    }
    $("library-refresh").onclick=()=>library(kind).catch(e=>libraryNotice(e.message));
  }
  function renameSource(video) {
    $("rename-source-input").value=video.name;
    $("rename-source-form").onsubmit=async event=>{
      event.preventDefault();
      try {
        const result=await api(`/api/videos/${video.id}`,"PATCH",{name:$("rename-source-input").value});
        if(currentVideo.id===video.id) {currentVideo={...currentVideo,name:result.name};ui().renameSource(result.name);}
        $("rename-source-dialog").close();await library("videos");
      } catch(error) {libraryNotice(error.message);}
    };
    $("rename-source-cancel").onclick=()=>$("rename-source-dialog").close();
    $("rename-source-dialog").showModal();$("rename-source-input").focus();
  }
  function confirmDelete(entity,table) {
    $("delete-description").textContent=table === "videos" ? `Delete「${entity.name}」and all its investigations, evidence and original file?` : `Delete investigation「${entity.title}」?`;
    $("delete-confirm").onclick=async()=>{
      const deskId=current?.id;
      const deletingCurrent=(table === "videos" && current?.video===entity.id) || deskId===entity.id;
      const epoch=deletingCurrent ? ++requestEpoch : requestEpoch;
      if (deletingCurrent) ui().busy(true);
      try {
        if (deletingCurrent) {
          await flush(); if (!owns(deskId,epoch)) return;
          await stopRequest(); if (!owns(deskId,epoch)) return;
          suspended=true;
        }
        await api(`/api/${table}/${entity.id}`,"DELETE");
        if (!owns(deskId,epoch)) return;
        $("delete-dialog").close();
        suspended=false;
        if (deletingCurrent) { current=null; if (!await create(demo)) return; }
        await library(table);
      } catch(e) {if (owns(deskId,epoch)) {$("delete-dialog").close();libraryNotice(e.message);}}
      finally {if (epoch===requestEpoch) {suspended=false;if (deletingCurrent) ui().busy(false);}}
    };
    $("delete-dialog").showModal();
  }
  async function openSource(video) {
    const deskId=current?.id, epoch=++requestEpoch;
    ui().busy(true);
    try {
      await flush(); if (!owns(deskId,epoch)) return false;
      const desks=(await api("/api/investigations")).items.filter(d=>d.video===video.id);
      if (!owns(deskId,epoch)) return false;
      if (desks.length) return await openDesk(desks[0].id);
      return await create(video);
    } finally {if (owns(deskId,epoch)) ui().busy(false);}
  }
  async function upload(file) {
    if (!file.type.startsWith("video/") || file.size > 500*1024**2) {ui().notify("Choose a video no larger than 500 MB .");return;}
    try {
      const deskId=current?.id, epoch=requestEpoch;
      await flush();if (!owns(deskId,epoch)) return;ui().notify(`Uploading ${file.name} · 0%`);
      const result=await new Promise((resolve,reject)=>{
        const xhr=new XMLHttpRequest();xhr.open("POST","/api/videos");
        xhr.setRequestHeader("Content-Type",file.type);xhr.setRequestHeader("X-CTRLF-CSRF",session.csrf);
        xhr.setRequestHeader("X-File-Name",encodeURIComponent(file.name));xhr.timeout=180000;
        xhr.upload.onprogress=e=>{if(owns(deskId,epoch) && e.lengthComputable)ui().notify(`Uploading ${file.name} · ${Math.round(e.loaded/e.total*100)}%`);};
        xhr.onload=()=>{let data;try {data=JSON.parse(xhr.responseText);}catch{reject(new Error("Invalid upload response"));return;}xhr.status===201 ? resolve(data) : reject(new Error(data.detail || "Upload failed"));};
        xhr.onerror=()=>reject(new Error("Upload interrupted. The previous investigation is preserved."));xhr.ontimeout=xhr.onerror;xhr.send(file);
      });
      if (!owns(deskId,epoch)) return;
      const video=await api(`/api/videos/${result.id}`);if (!owns(deskId,epoch)) return;
      if (!await create(video)) return;
      ui().notify("Upload complete. Preflight is running; check Sources for progress.");
      ui().showSource();
    }catch(error){ui().notify(error.message);}
  }
  async function watch(videoId, epoch) {
    const deskId=current?.id;
    for (let i=0;i<90 && owns(deskId,epoch);i++) {
      await new Promise(r=>setTimeout(r,2000));
      if (!owns(deskId,epoch)) return;
      try {
        const video=await api(`/api/videos/${videoId}`);
        if (!owns(deskId,epoch)) return;
        ui().notify(`${labels[video.job?.state] || "Processing source"}${video.job?.total ? ` · ${video.job.completed}/${video.job.total} windows` : ""}`);
        if (["ready","failed","awaiting_configuration","cancelled"].includes(video.job?.state)) {
          await flush(); if (!owns(deskId,epoch)) return;
          currentVideo=video; const saved=snapshot();suspended=true;
          try {ui().restore(saved,video);} finally {suspended=false;}
          changed();
          if (video.job?.state === "failed") ui().notify(`Preflight or analysis failed: ${video.job.error}.Source retained; retry processing or delete it.`);
          if (video.job?.state === "awaiting_configuration") ui().notify("Preflight complete. Awaiting model and budget configuration; no model requests will be sent.");
          return;
        }
      }catch(error){if (owns(deskId,epoch)) ui().notify(error.message);return;}
    }
  }
  async function recover() {
    if (!current || currentVideo.id === "demo_parcel") return;
    const deskId=current.id, epoch=requestEpoch, initialDraft=$("question").value;
    $('resume-query').hidden=true;
    const data = await api(`/api/investigations/${deskId}/requests`);
    if (!owns(deskId,epoch)) return;
    const existing=new Set(store().getSnapshot().records.map(r=>r.query.id));
    const completed=data.items.filter(r=>r.state === "done" && r.result?.response?.schema_version).slice(0,12).reverse();
    let added=false;
    for (const request of completed) {
      if (!existing.has(request.id)) {
        const parent=store().getSnapshot().records.find(r=>r.query.id===request.input?.parent_request_id);
        ui().answer({...request.result,
          task_brief:request.result.task_brief ?? request.input?.task_brief ?? "",
          study_type:request.result.study_type ?? request.input?.study_type ?? null,
          parentTurn:parent?.id || null});
        added=true;
      }
      if (activeRequest?.desk===deskId && activeRequest.id===request.id) activeRequest=null;
    }
    let draft=$("question").value;
    for (const request of data.items) {
      if (request.state === "done" && activeRequest?.desk===deskId && activeRequest.id===request.id) activeRequest=null;
      if (["running","unknown"].includes(request.state)) {
        if (!draft && initialDraft===draft && request.input) draft=request.input.question;
        if (!activeRequest) activeRequest={desk:deskId,id:request.id,state:request.state};
        else if (activeRequest.desk===deskId && activeRequest.id===request.id) activeRequest.state=request.state;
        ui().notify(request.state === "unknown" ? "Previous call outcome is unknown. It will not be repeated automatically; your question is preserved." : "The previous query is running. Resume it to retrieve the result.");
        $('resume-query').hidden=false;
      }
    }
    ui().restoreDraft(draft);
    if (added || draft!==initialDraft) {await flush();if (!owns(deskId,epoch)) return;}
  }
  async function ask(question) {
    if (suspended || !current || currentVideo.job?.state!=="ready") return;
    if (activeRequest?.state!=="unknown" && activeRequest) {
      $('resume-query').hidden=false;ui().notify("Query running. Resume the current request rather than submitting it again.");return;
    }
    const desk=current,epoch=requestEpoch;
    const context=ui().currentContext();
    const parentTurn=context?.mode==="real" ? store().getSnapshot().records.find(r=>r.query.id===context.id)?.id || null : null;
    const body={investigation_id:desk.id,request_id:crypto.randomUUID().replaceAll("-",""),
      generation:store().getSnapshot().epoch,question,parent_request_id:context?.mode==="real" ? context.id : null,
      task_brief:store().getSnapshot().taskBrief,study_type:store().getSnapshot().studyType};
    ui().busy(true);
    let pending=null;
    try {
      await flush(); if (!owns(desk.id,epoch)) return;
      if (activeRequest) {await stopRequest();if (!owns(desk.id,epoch)) return;}
      const prepared=await api("/api/chat/prepare","POST",body);
      if(!owns(desk.id,epoch)) return;
      if (prepared.kind!=="ready") {ui().notify(prepared.message);return;}
      pending={desk:desk.id,id:body.request_id,state:"running"};activeRequest=pending;
      status("Finding evidence…");
      let data;
      for (let i=0;i<15;i++) {
        try {data=await api("/api/chat","POST",body);}catch(error){if(error.data?.kind==="query_control") {data=error.data;}else if(error.data?.response) {data=error.data;} else throw error;}
        if(data?.response && activeRequest===pending) activeRequest=null;
        if(!owns(desk.id,epoch)) return;
        if(data.kind!=="query_control") break;
        if(data.state==="unknown") {pending.state="unknown";$('resume-query').hidden=false;ui().notify(data.suggested_action);status("Call outcome unknown","error");return;}
        await new Promise(r=>setTimeout(r,Math.min(10000,3000+i*500)));
        if (!owns(desk.id,epoch)) return;
      }
      if(data?.response) {
        if (!store().getSnapshot().records.some(r=>r.query.id===data.id)) ui().answer({...data,parentTurn},question);
        ui().notify("");await flush();if (!owns(desk.id,epoch)) return;
      } else {$('resume-query').hidden=false;ui().notify("Query running; your question is preserved. Resume this request rather than submitting it again.");}
    }catch(error){if(owns(desk.id,epoch)){if(activeRequest===pending && pending) $('resume-query').hidden=false;ui().notify(`${error.message} · Your question is preserved.`);status("Search incomplete","error");}}
    finally {if(owns(desk.id,epoch)) ui().busy(false);}
  }
  async function stopRequest() {
    const pending=activeRequest;
    if(!pending) return;
    await api(`/api/investigations/${pending.desk}/requests/${pending.id}/cancel`,"POST");
    if (activeRequest===pending) activeRequest=null;
  }
  async function start() {
    if(!ui()?.ready())return;
    try {
      session=await api("/api/session");
      let id;try{id=localStorage.getItem("ctrlf-video-current");}catch{}
      const desks=(await api("/api/investigations")).items;
      suspended=false;
      if(id && desks.some(d=>d.id===id))await openDesk(id);
      else if(desks.length)await openDesk(desks[0].id);else await create(demo);
      store().subscribe(changed);
      window.addEventListener("ctrlf-video-canvas-changed",changed);
      ["pointerup","keyup","wheel"].forEach(event=>document.addEventListener(event,()=>{if(JSON.stringify(snapshot())!==lastSaved)changed();},{passive:true}));
      document.addEventListener("visibilitychange",()=>{if(document.hidden)flush().catch(()=>{});});
      $("open-investigations").onclick=()=>library().catch(e=>ui().notify(e.message));
      $("open-sources").onclick=()=>library("videos").catch(e=>ui().notify(e.message));
      $("open-agent-setup").disabled=false;
      $("open-agent-setup").onclick=showRuntime;
      $("refresh-agent-setup").onclick=showRuntime;
      $("close-agent-setup").onclick=()=>$("agent-setup-dialog").close();
      $("save-state").onclick=()=>conflict ? openDesk(current.id).catch(e=>ui().notify(e.message)) : flush().catch(()=>{});
      $("resume-query").onclick=()=>recover().catch(e=>ui().notify(e.message));
      $("close-library").onclick=()=>$("workspace-library").close();
      $("delete-cancel").onclick=()=>$("delete-dialog").close();
    }catch(error){suspended=true;status("Investigation service unavailable","error");ui().notify(error.message);}
  }
  window.CtrlFVideoPersistence={flush,upload,ask,library,openDemo:()=>openSource(demo).catch(e=>ui().notify(e.message)),
    captureContext:()=>current ? {id:current.id,epoch:requestEpoch} : null,
    isCurrent:context=>!!context && owns(context.id,context.epoch),
    newInvestigation:()=>create(currentVideo).catch(e=>ui().notify(e.message))};
  window.addEventListener("ctrlf-video-catalog-ready",start,{once:true});
  if(ui()?.ready())start();
})();
