import judge from "../src/ctrlf_video/static/judge/model.js";

export const findingKey = "ctrlf-video:judge:basketball-20261017-v1:finding";
export const emptyFinding = judge.empty;
export const completeFinding = judge.complete;
export const exampleReport = judge.report;
export function storedFinding(value) {
  try {
    const finding = judge.draft(JSON.parse(value));
    return judge.complete(finding) ? finding : null;
  } catch { return null; }
}
export function exampleView(sample, origin) {
  // Validate the fixed public copy before resolving any media reference.
  const checked=judge.report(sample, {title:"Validation",observation:"Validation",interpretation:"",openQuestions:""}, origin);
  if(checked.evidence.length!==1 || sample.query.mode!=="real" || sample.query.response.status!=="partial") throw new Error("The recorded example has no approved partial result.");
  const query = JSON.parse(JSON.stringify(sample.query));
  for (const event of query.response.events)
    for (const frame of event.evidence) frame.uri = sample.public_assets[frame.frame_id];
  return {
    epoch:0, title:"Basketball · recorded example", records:[{id:"recorded-question",query}],
    selectedId:"recorded-question",pins:[],local:false,
    sourceInfo:{id:sample.source.id,name:sample.source.name,metadata:{duration:sample.source.duration_seconds,audio:false}},
  };
}
