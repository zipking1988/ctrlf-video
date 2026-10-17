const test=require("node:test");
const assert=require("node:assert/strict");
const Module=require("node:module");
const path=require("node:path");
const React=require("react");
const {renderToStaticMarkup}=require("react-dom/server");
const {buildSync}=require("esbuild");
const filename=path.resolve("frontend/alpha-result-test.cjs");
const compiled=new Module(filename,module);compiled.filename=filename;compiled.paths=module.paths;
compiled._compile(buildSync({entryPoints:["frontend/simple-review.jsx"],bundle:true,platform:"node",format:"cjs",external:["react","react-dom"],write:false}).outputFiles[0].text,filename);
function render(status,overrides={}) {
  const query={id:"query",question:"Where does an error appear?",mode:"real",video_id:"recording",
    response:{status,answer:"Saved answer",events:[],unresolved:[],errors:[],...overrides}};
  const state={records:[{id:"q",query}],selectedId:"q",sourceInfo:{id:"recording"}};
  return renderToStaticMarkup(React.createElement(compiled.exports.default,{state,metaTarget:null,ui:()=>({}),icon:()=>null}));
}
test("partial results surface unresolved scope separately from secondary save controls",()=>{
  const html=render("partial",{unresolved:["The final ten seconds were not reviewed."]});
  assert.match(html,/Still to verify · 1 open point/);
  assert.match(html,/The final ten seconds were not reviewed/);
  assert.ok(html.indexOf("Still to verify")<html.indexOf("Details &amp; save"));
});
test("failed questions retain actionable error text without offering a finding",()=>{
  const html=render("error",{errors:[{message:"Audio is not transcribed.",suggested_action:"Ask about a visible detail."}]});
  assert.match(html,/Audio is not transcribed/);
  assert.match(html,/Ask about a visible detail/);
  assert.match(html,/Start a new question/);
  assert.doesNotMatch(html,/Write a finding/);
});
test("no-result scope never claims exhaustive absence",()=>{
  assert.match(render("no_result"),/does not prove the event never occurred/);
  assert.doesNotMatch(render("ok"),/Still to verify|did not complete/);
});
