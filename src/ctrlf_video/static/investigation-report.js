/* Portable reports preserve evidence provenance; text is always escaped in HTML. */
(function (root) {
  "use strict";
  const clone = value => JSON.parse(JSON.stringify(value));
  const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const time = value => {
    const milliseconds=Math.max(0,Math.round((Number(value)||0)*1000));
    const n=Math.floor(milliseconds/1000),fraction=milliseconds%1000;
    const whole=[Math.floor(n/3600),Math.floor(n/60)%60,n%60].map(i=>String(i).padStart(2,"0")).join(":");
    return fraction ? `${whole}.${String(fraction).padStart(3,"0")}` : whole;
  };
  const description = frame => [...new Set((frame.observations || [frame]).map(observation=>[observation.caption,observation.asr ? `Audio: ${observation.asr}` : null].filter(Boolean).join("\n")))].filter(Boolean).join("\n");
  function safeFrameUri(video, uri) {
    return typeof video === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(video) && typeof uri === "string"
      && new RegExp(`^/media/${video}/frames/[a-zA-Z0-9_.-]+\\.(?:jpg|jpeg|png|webp)$`).test(uri)
      && !uri.includes("..");
  }
  function create(state, createdAt = new Date().toISOString()) {
    const source = state.sourceInfo || {id:"demo_parcel",name:"Package positions · Synthetic demo",metadata:{duration:18}};
    const kind = state.local ? "unindexed" : source.id === "demo_parcel" ? "synthetic" : "real";
    const queries = new Map();
    for (const record of state.records || []) if(record.query) queries.set(record.id,{...record.query,turn_id:record.id});
    for (const pin of state.pins || []) if(pin.query && !queries.has(pin.turnId)) queries.set(pin.turnId,{...pin.query,turn_id:pin.turnId,retained_by_finding:true});
    const frames = new Map();
    const questions=[];
    for (const query of queries.values()) {
      const response=query.response;
      if (!response || !["ok","partial","no_result","error"].includes(response.status)) continue;
      for (const event of response.events || []) {
        if (event.video_id && event.video_id !== source.id) throw new Error("Cannot export evidence belonging to another source.");
        for (const frame of event.evidence || []) {
          if(!safeFrameUri(source.id,frame.uri) || !Number.isFinite(frame.t)) throw new Error("Invalid report evidence reference.");
          const key=`${frame.uri}|${frame.t}`;
          if(!frames.has(key)) frames.set(key,{id:`E${frames.size+1}`,video_id:source.id,...clone(frame),query_ids:[],turn_ids:[],observations:[]});
          const saved=frames.get(key);if(!saved.query_ids.includes(query.id))saved.query_ids.push(query.id);if(!saved.turn_ids.includes(query.turn_id))saved.turn_ids.push(query.turn_id);if(!saved.observations.some(o=>o.turn_id===query.turn_id && o.caption===frame.caption && o.asr===frame.asr))saved.observations.push({query_id:query.id,turn_id:query.turn_id,caption:frame.caption??null,asr:frame.asr??null});
        }
      }
      questions.push({id:query.id,turn_id:query.turn_id,parent_turn_id:query.parentTurn || null,
        question:query.question,task_brief:query.task_brief || "",study_type:query.study_type || null,mode:query.mode || "fixture",retained_by_finding:!!query.retained_by_finding,response:clone(response)});
    }
    return {report_version:"1.1",research_context:{task_brief:state.taskBrief || "",study_type:state.studyType || "ux_research"},created_at:createdAt,title:state.title?.trim() || "Untitled investigation",
      group_title:state.groupTitle?.trim() || "Key findings",note:state.note || "",
      source:{id:source.id,name:source.name,kind,duration_seconds:source.metadata?.duration ?? null,
        audio:source.metadata?.audio ?? null,expires_at:source.expires ?? null,capabilities:clone(source.capabilities || null)},
      scope:"Latest 12 questions and sources retained by findings; not a complete history or exhaustive review.",
      findings:(state.pins || []).map(pin=>({id:pin.id,kind:pin.kind,title:pin.title,
        research:{observation:pin.research?.observation || "",interpretation:pin.research?.interpretation || "",openQuestions:pin.research?.openQuestions || ""},
        query_id:pin.query.id,turn_id:pin.turnId,frame:pin.kind==="evidence" ? clone(pin.frame) : null})),
      questions,evidence:[...frames.values()],layout:clone(state.canvas || null)};
  }
  const provenance = report => report.source.kind === "recorded"
    ? "Recorded real Gemini result · visitor-authored finding · no new model request"
    : report.source.kind === "synthetic"
    ? "Synthetic demo · preset results · no model calls"
    : report.source.kind === "unindexed" ? "Local source · not indexed · no analysis conclusions" : "Uploaded source · consult each answer status and unresolved details";
  const researchPurpose = report => report.research_context?.study_type === "technical_sample"
    ? "Technical sample only — does not validate UX research value."
    : "UX research — researcher interpretations require verification.";
  const researchFields = [["observation","Observed facts"],["interpretation","Interpretation / hypothesis"],["openQuestions","Open questions"]];
  function publicReplay(report, t) {
    if (report.source.kind !== "recorded" || report.source.id !== "judge_basketball_20261017") return null;
    try {
      const url=new URL(report.source.playback_url);
      if (!["http:","https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/static/judge/basketball/source.mp4" || url.search || url.hash || !Number.isFinite(t) || t < 0 || t > report.source.duration_seconds) return null;
      url.hash=`t=${t}`;
      return url.href;
    } catch { return null; }
  }
  const mediaNote = report => report.source.kind === "recorded"
    ? "Public recorded sample. Replay links open the source video at the cited time while this deployment is available. Images embedded in HTML remain available offline; video playback requires the online source. No new model request was made."
    : "Media references require the original service and a valid session; access may expire.HTML exports can embed evidence images available at download time.";
  function markdown(report) {
    const lines=[`# ${report.title}`,"",provenance(report),"",`Source: ${report.source.name || report.source.id}`,
      `Source ID: ${report.source.id}`,`Duration: ${report.source.duration_seconds == null ? "Unknown" : time(report.source.duration_seconds)}`,
      `Export: ${report.created_at}`,"",report.scope,"",`## ${report.group_title}`,""];
    lines.splice(2,0,researchPurpose(report),"",`Task brief: ${report.research_context?.task_brief || "Not provided"}`,"The current task brief may differ from the context captured for earlier questions.","");
    const lookup = new Map(report.questions.map(q=>[q.turn_id,q]));
    for(const finding of report.findings) {
      const q=lookup.get(finding.turn_id);if(!q)continue;
      lines.push(`### ${finding.title}`, "");
      if(finding.kind==="evidence") lines.push(`- ${time(finding.frame.t)} — ${description(finding.frame)}`,`  Source question: ${q.question}`);
      else {lines.push(`- ${q.response.answer}`,`  Source question: ${q.question} · ${q.response.status}`);for(const text of q.response.unresolved || [])lines.push(`  Unresolved: ${text}`);}
      for (const [field,label] of researchFields) if(finding.research?.[field]) lines.push(`  ${label} (researcher-authored): ${finding.research[field]}`);
    }
    if(!report.findings.length)lines.push("No saved findings yet.");
    lines.push("","## Investigation notes","",report.note || "No notes yet.","","## Questions and timed evidence","");
    for(const [i,q] of report.questions.entries()) {
      lines.push(`### Q${i+1} ${q.question}`,"",`Result: ${q.response.status} · Turn: ${q.turn_id} · Request: ${q.id} · ${q.mode === "fixture" ? "Preset demo" : "Model analysis"}`,"",q.response.answer,"");
      lines.push(`Captured task brief: ${q.task_brief || "Not provided"}`,`Purpose at submission: ${q.study_type || "Not recorded"}`,"");
      for(const event of q.response.events || [])lines.push(`- ${time(event.start)}–${time(event.end)} · ${event.summary} · Support: ${event.support_level ?? "Measured score " + event.support_score}`);
      for(const text of q.response.unresolved || [])lines.push(`- Unresolved: ${text}`);
      for(const error of q.response.errors || [])lines.push(`- Processing issue: ${error.code} · ${error.message}`);
      lines.push("");
    }
    lines.push("## Evidence index","");
    for(const frame of report.evidence) {
      lines.push(`- ${frame.id} · ${time(frame.t)} · ${description(frame)}`,`  Frame: ${frame.frame_id} · Reference: ${frame.uri}`,`  Source request: ${frame.query_ids.join(", ")}`);
      const replay=publicReplay(report,frame.t);if(replay)lines.push(`  Replay: ${replay}`);
    }
    if (report.source.kind === "recorded" && report.recorded_test_history?.length) {
      lines.push("", "## Recorded development history", "", "Repeated prompts on one clip, across fixes; not an independent accuracy benchmark.", "");
      for (const row of report.recorded_test_history) lines.push(`- Attempt ${row.attempt} · ${row.task} · Model status: ${row.model_status}. Human review: ${row.review}`);
    }
    lines.push("",mediaNote(report),"");
    return lines.join("\n");
  }
  function html(report, embedded = {}) {
    const e=escape, lookup=new Map(report.questions.map(q=>[q.turn_id,q]));
    const evidence=report.evidence.map(frame=>{
      const url=embedded[frame.id];
      const image=typeof url==="string" && /^data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(url)
        ? `<img src="${url}" alt="${e(description(frame))}">` : '<div class="missing">Image not embedded · original reference requires a valid session</div>';
      const replay=publicReplay(report,frame.t);
      return `<figure>${image}<figcaption><b>${e(frame.id)} · ${time(frame.t)}</b><p>${e(description(frame))}</p>${replay ? `<p><a href="${e(replay)}">Replay original source at ${time(frame.t)}</a></p>` : ""}<small>${e(frame.frame_id)}<br>${e(frame.uri)}<br>Source request: ${e(frame.query_ids.join(", "))}</small></figcaption></figure>`;
    }).join("");
    const findings=report.findings.map(f=>{
      const q=lookup.get(f.turn_id);if(!q)return "";
      const text=f.kind==="evidence" ? `${time(f.frame.t)} · ${description(f.frame)}` : q.response.answer;
      const notes=researchFields.filter(([field])=>f.research?.[field]).map(([field,label])=>`<p><b>${e(label)} (researcher-authored)</b><br>${e(f.research[field])}</p>`).join("");
      return `<article><h3>${e(f.title)}</h3><p>${e(text)}</p>${notes}<small>Source: ${e(q.question)} · ${e(q.id)}</small>${f.kind==="conclusion" ? (q.response.unresolved || []).map(t=>`<p class="unknown">Unresolved: ${e(t)}</p>`).join("") : ""}</article>`;
    }).join("");
    const questions=report.questions.map((q,i)=>`<article><h3>Q${i+1} ${e(q.question)}</h3><small>${e(q.response.status)} · Turn ${e(q.turn_id)} · ${e(q.id)} · ${q.mode === "fixture" ? "Preset demo" : "Model analysis"}</small><p>${e(q.response.answer)}</p><p class="meta">Captured task brief: ${e(q.task_brief || "Not provided")}<br>Purpose at submission: ${e(q.study_type || "Not recorded")}</p>${(q.response.events || []).map(event=>`<p><b>${time(event.start)}–${time(event.end)}</b> ${e(event.summary)} <small>Support: ${e(event.support_level ?? event.support_score)}</small></p>`).join("")}${(q.response.unresolved || []).map(t=>`<p class="unknown">Unresolved: ${e(t)}</p>`).join("")}${(q.response.errors || []).map(t=>`<p class="unknown">Processing issue: ${e(t.code)} · ${e(t.message)}</p>`).join("")}</article>`).join("");
    const embeddedCount=report.evidence.filter(f=>embedded[f.id] && /^data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(embedded[f.id])).length;
    const history=report.source.kind === "recorded" && report.recorded_test_history?.length
      ? `<h2>Recorded development history</h2><p>Repeated prompts on one clip, across fixes; not an independent accuracy benchmark.</p>${report.recorded_test_history.map(row=>`<p>Attempt ${e(row.attempt)} · ${e(row.task)} · Model status: ${e(row.model_status)}<br>Human review: ${e(row.review)}</p>`).join("")}` : "";
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${e(report.title)} · CtrlF Video</title><style>body{font:15px/1.75 system-ui,sans-serif;color:#18303c;background:#f4f6f7;max-width:1040px;margin:0 auto;padding:52px 32px}h1{font-size:34px;line-height:1.2}h2{margin-top:40px;border-bottom:1px solid #ced8dd;padding-bottom:10px}h3{font-size:17px}article,figure{background:white;border:1px solid #d7e0e4;border-radius:10px;padding:22px;margin:14px 0;break-inside:avoid}p{white-space:pre-wrap;overflow-wrap:anywhere}small,.meta{color:#58717d;overflow-wrap:anywhere}.unknown{border-left:3px solid #d16d30;padding-left:12px}.frames{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}figure{margin:0;padding:14px}img{width:100%;border-radius:5px}.missing{padding:30px;background:#edf1f3;color:#657781;font-size:13px}footer{margin-top:40px;color:#58717d;font-size:12px}@media print{body{background:white;padding:12mm;max-width:none;font-size:11pt}article,figure{box-shadow:none}h2{break-after:avoid}}@media(max-width:650px){.frames{grid-template-columns:1fr}}</style></head><body><p class="meta">CTRLF VIDEO / INVESTIGATION REPORT</p><h1>${e(report.title)}</h1><p>${e(provenance(report))}</p><p>${e(researchPurpose(report))}</p><p><b>Current task brief</b><br>${e(report.research_context?.task_brief || "Not provided")}</p><p class="meta">Earlier questions retain their submitted task context.</p><p class="meta">Source: ${e(report.source.name || report.source.id)} · ${e(report.source.id)} · ${report.source.duration_seconds==null ? "Unknown duration" : time(report.source.duration_seconds)}<br>Export: ${e(report.created_at)}</p><p>${e(report.scope)}</p><h2>${e(report.group_title)}</h2>${findings || '<p>No saved findings yet.</p>'}<h2>Investigation notes</h2><p>${e(report.note || "No notes yet.")}</p><h2>Questions and timed evidence</h2>${questions || '<p>No completed questions.</p>'}<h2>Evidence images</h2><p class="meta">${embeddedCount}/${report.evidence.length} images embedded for offline viewing; remaining timestamps and source references are retained.</p><section class="frames">${evidence}</section>${history}<footer>Support levels describe evidence support, not accuracy. Partial results and unresolved details are retained. ${e(report.source.kind === "recorded" ? mediaNote(report) : "Original references expire with the source or session. This copy may contain private media; store it securely.")} Print from your browser as PDF.</footer></body></html>`;
  }
  const api={create,markdown,html,time,safeFrameUri,provenance};
  if(typeof module!=="undefined" && module.exports)module.exports=api;
  else root.CtrlFVideoReport=api;
})(typeof window!=="undefined" ? window : globalThis);
