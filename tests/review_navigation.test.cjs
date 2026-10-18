const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const {buildSync} = require('esbuild');
const compiled = new Module(path.resolve('frontend/review-navigation.test.cjs'), module);
compiled.filename = compiled.id;
compiled.paths = module.paths;
compiled._compile(buildSync({entryPoints:['frontend/simple-review.jsx'],bundle:true,platform:'node',format:'cjs',external:['react','react-dom'],write:false}).outputFiles[0].text,compiled.filename);
const SimpleReview = compiled.exports.default;
const sample = require('../src/ctrlf_video/static/judge/basketball/results.json');
function render(count, conversationMode = true, playerId = 'player') {
  const records = Array.from({length:count},(_,i)=>({id:`turn-${i}`,query:{...sample.query,question:`Question ${i}`}}));
  return renderToStaticMarkup(React.createElement(SimpleReview,{state:{records,selectedId:records[0]?.id,sourceInfo:sample.source,epoch:0},metaTarget:null,ui:()=>({}),icon:()=>null,conversationMode,playerId}));
}
test('conversation navigation reaches the composer even with no answers and only offers latest for history',()=>{
  for (const count of [0,1,9]) {
    const html = render(count);
    assert.match(html,/<nav[^>]*aria-label="Conversation navigation"/);
    assert.match(html,/<a href="#question"/);
    assert.equal(html.includes('>Latest answer</button>'),count>1);
    if (count) assert.match(html,/<article id="player-review-answer" tabindex="-1"[^>]*aria-label="Answer and source citations"/);
  }
});
test('recorded examples never acquire private composer navigation or duplicate private focus targets',()=>{
  const example = render(2,false,'example-player');
  assert.ok(!example.includes('Conversation navigation'));
  assert.ok(!example.includes('href="#question"'));
  assert.match(example,/id="example-player-review-answer"/);
  assert.ok(!example.includes('id="player-review-answer"'));
});
