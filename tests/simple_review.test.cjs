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
