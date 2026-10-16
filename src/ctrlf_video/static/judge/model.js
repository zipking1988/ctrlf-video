/* A visitor's notes are separate from the immutable, recorded model result. */
(function (root) {
  "use strict";
  const clone = value => JSON.parse(JSON.stringify(value));
  const sourceId = "judge_basketball_20261017";
  const fields = ["title", "observation", "interpretation", "openQuestions"];
  const empty = () => ({title:"", observation:"", interpretation:"", openQuestions:""});
  function draft(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const result = empty();
    for (const field of fields) {
      if (typeof value[field] !== "string" || value[field].length > (field === "title" ? 200 : 2000)) return null;
      result[field] = value[field];
    }
    return result;
  }
  function complete(value) {
    const checked = draft(value);
    return Boolean(checked?.title.trim() && checked.observation.trim());
  }
  function report(sample, finding, origin, createdAt = new Date().toISOString()) {
    if (sample.source.id !== sourceId || sample.source.url !== "/static/judge/basketball/source.mp4" || !complete(finding)) throw new Error("Save a finding with a title and observed facts first.");
    const location = new URL(origin);
    if (!["http:", "https:"].includes(location.protocol) || location.username || location.password) throw new Error("Invalid sample origin.");
    const q = clone(sample.query);
    const frames = new Map();
    for (const event of q.response.events) {
      if (event.video_id !== sourceId) throw new Error("Evidence belongs to another source.");
      for (const f of event.evidence) {
        if (f.t !== 1.001 || f.uri !== "/media/judge_basketball_20261017/frames/scoreboard-1-001.jpg" || f.frame_id !== sourceId + "_scoreboard_1_001" || sample.public_assets?.[f.frame_id] !== "/static/judge/basketball/frames/scoreboard-1-001.jpg") throw new Error("Invalid recorded evidence.");
        frames.set(f.frame_id, {...clone(f),recorded_uri:f.uri,uri:sample.public_assets[f.frame_id],id:"E1",video_id:sourceId,query_ids:[q.id],turn_ids:[q.turn_id]});
      }
    }
    return {
      report_version:"1.1", created_at:createdAt, title:finding.title.trim(), group_title:"Visitor finding",
      research_context:{study_type:"technical_sample",task_brief:q.task_brief},
      source:{id:sourceId,name:sample.source.name,kind:"recorded",duration_seconds:sample.source.duration_seconds,
        playback_url:new URL(sample.source.url, location.origin).href, audio:false},
      note:"Visitor-authored finding, saved in this browser. Original model answer is unchanged. " + sample.provenance.public_copy,
      scope:"One recorded question and its source evidence, plus summaries of six development attempts. This is not the full private investigation or an accuracy benchmark. Event bounds are review-window bounds, not a verified duration of the scoreboard state.",
      findings:[{id:"visitor-finding",kind:"conclusion",title:finding.title.trim(),query_id:q.id,turn_id:q.turn_id,frame:null,
        research:{observation:finding.observation,interpretation:finding.interpretation,openQuestions:finding.openQuestions}}],
      questions:[q], evidence:[...frames.values()], layout:null,
      recorded_test_history:clone(sample.history), recorded_provenance:clone(sample.provenance)
    };
  }
  const api = {draft,empty,complete,report};
  if (typeof module !== "undefined" && module.exports) module.exports=api;
  else root.CtrlFVideoJudge=api;
})(typeof window !== "undefined" ? window : globalThis);
