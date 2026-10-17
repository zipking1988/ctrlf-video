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
