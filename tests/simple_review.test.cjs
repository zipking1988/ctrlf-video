const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
const React = require("react");
const {renderToStaticMarkup} = require("react-dom/server");
const {buildSync} = require("esbuild");

const filename = path.resolve("frontend/simple-review.test.cjs");
const compiled = new Module(filename, module);
compiled.filename = filename;
compiled.paths = module.paths;
compiled._compile(buildSync({entryPoints:["frontend/simple-review.jsx"],bundle:true,
  platform:"node",format:"cjs",external:["react","react-dom"],write:false}).outputFiles[0].text, filename);
const SimpleReview = compiled.exports.default;

test("coexisting private and recorded reviews have distinct timeline targets", () => {
  const sample = require("../src/ctrlf_video/static/judge/basketball/results.json");
  const state = {records:[{id:"q",query:sample.query}],selectedId:"q",sourceInfo:sample.source,epoch:0};
  const render = (playerId, state) => renderToStaticMarkup(React.createElement(SimpleReview,
    {state,playerId,metaTarget:null,ui:()=>({}),icon:()=>null}));
  for (const current of [state,{...state,records:[],selectedId:null}]) {
    const privateView = render("player",current), example = render("example-player",current);
    assert.match(privateView,/id="player-cited-timeline"/);
    assert.match(example,/id="example-player-cited-timeline"/);
    const ids = [...(privateView+example).matchAll(/ id="([^"]+)"/g)].map(match=>match[1]);
    assert.equal(new Set(ids).size,ids.length);
  }
});

test("whole-video results expose coverage and chronological citations by default",()=>{
 const sample=require('../src/ctrlf_video/static/judge/basketball/results.json');
 const state={records:[{id:'q',query:{...sample.query,question:'Break down the whole video.'}}],selectedId:'q',sourceInfo:sample.source,epoch:0};
 const html=renderToStaticMarkup(React.createElement(SimpleReview,{state,playerId:'player',metaTarget:null,ui:()=>({}),icon:()=>null}));
 assert.match(html,/Whole-video breakdown/);assert.match(html,/Review coverage &amp; limits/);
 assert.match(html,/<details class="simple-result-warning" open=""/);
 assert.ok(!/<section id="player-cited-timeline"[^>]* hidden/.test(html));
 assert.match(html,/sampling does not prove every event was detected/);
});

test("real analysis timeline distinguishes a single citation from a broad review scope",()=>{
 const sample=require('../src/ctrlf_video/static/judge/basketball/results.json');
 const query={...sample.query,question:'Break down the whole video.',response:{...sample.query.response,events:[{
  video_id:sample.query.video_id,start:0,end:70.203467,action:'Model claim to check',summary:'Model claim to check',
  evidence:[{t:36.036,frame_id:'actual-frame',uri:'/static/judge/basketball/frames/review-36.jpg'}],
 }]}};
 const state={records:[{id:'q',query}],selectedId:'q',sourceInfo:{id:query.video_id,metadata:{duration:70.203467}},epoch:0};
 const html=renderToStaticMarkup(React.createElement(SimpleReview,{state,playerId:'player',metaTarget:null,ui:()=>({}),icon:()=>null}));
 assert.match(html,/Model observations on the source timeline/);
 assert.match(html,/Single cited instant: 00:36.036. No event duration is established./);
 assert.match(html,/Model claims need checking/);
 assert.ok(!html.includes('Cited frame span: 00:00'));
 assert.ok(!html.includes('Prepared by Codex'));
 assert.match(html,/src="\/static\/judge\/basketball\/frames\/review-36.jpg"/);
});

test("new questions retain prior answers in a chronological visible conversation", () => {
  const sample = require("../src/ctrlf_video/static/judge/basketball/results.json");
  const records = ["First visual question?", "A different visual question?", "What happened after that?"].map((question,index) => ({
    id:`turn-${index}`,query:{...sample.query,id:`turn-${index}`,question,response:{...sample.query.response,answer:`Original saved response ${index}`}},
  }));
  const render = (selectedId, records) => renderToStaticMarkup(React.createElement(SimpleReview,
    {state:{records,selectedId,sourceInfo:sample.source,epoch:0},metaTarget:null,ui:()=>({}),icon:()=>null}));
  const html = render("turn-2",records);
  assert.match(html,/Questions and saved answers/);
  assert.match(html,/Keep asking about this video/);
  assert.match(html,/3 questions/);
  assert.equal((html.match(/aria-current="true"/g)||[]).length,1);
  for (let index=0;index<records.length;index++) assert.ok(html.includes(`Original saved response ${index}`));
  assert.ok(html.indexOf('First visual question?') < html.indexOf('A different visual question?'));
  assert.ok(html.indexOf('A different visual question?') < html.indexOf('What happened after that?'));
  assert.ok(!html.includes('Earlier questions'));
  const revisited = render("turn-0",records);
  for (const record of records) assert.ok(revisited.includes(record.query.question));
  assert.equal((revisited.match(/aria-current="true"/g)||[]).length,1);
});

test("failed saved turns are inspectable but cannot become follow-up anchors", () => {
  const sample = require("../src/ctrlf_video/static/judge/basketball/results.json");
  const failed = {id:"failed",query:{...sample.query,question:"Failed earlier question?",response:{...sample.query.response,status:"error",answer:"Saved failure",events:[]}}};
  const active = {id:"active",query:{...sample.query,question:"Current question?"}};
  const html = renderToStaticMarkup(React.createElement(SimpleReview,{state:{records:[failed,active],selectedId:"active",sourceInfo:sample.source,epoch:0},metaTarget:null,ui:()=>({}),icon:()=>null}));
  assert.match(html,/Saved failure/);
  assert.match(html,/Open answer and source evidence for: Failed earlier question/);
  assert.ok(!html.includes('Continue conversation from: Failed earlier question'));
});

test("recorded example does not imply an active free-form conversation", () => {
  const sample = require("../src/ctrlf_video/static/judge/basketball/results.json");
  const html = renderToStaticMarkup(React.createElement(SimpleReview,{state:{records:[{id:"q",query:sample.query}],selectedId:"q",sourceInfo:sample.source,epoch:0},conversationMode:false,playerId:"example-player",metaTarget:null,ui:()=>({}),icon:()=>null}));
  assert.ok(!html.includes('Keep asking about this video'));
  assert.ok(!html.includes('Questions and saved answers'));
  assert.ok(!html.includes('Follow up on this answer'));
  assert.ok(!html.includes('Ask a follow-up'));
  assert.match(html,/Saved model result/);
});
