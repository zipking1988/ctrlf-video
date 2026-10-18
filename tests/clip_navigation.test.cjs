const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const {buildSync} = require('esbuild');
const filename = path.resolve('frontend/clip-navigation.test.cjs');
const compiled = new Module(filename, module);
compiled.filename = filename;
compiled.paths = module.paths;
compiled._compile(buildSync({entryPoints:['frontend/clip-timeline.jsx'],bundle:true,
  platform:'node',format:'cjs',external:['react'],write:false}).outputFiles[0].text,filename);

test('clip timeline exposes a native keyboard and pointer scrubber for the entire source',()=>{
  const html=renderToStaticMarkup(React.createElement(compiled.exports.default,{
    review:{source:{duration:70.203},points:[{t:1,image:'/frame.jpg'}]},
    docs:[{id:'chapter-0',start:0,end:70.203,points:[0],title:'Source section'}],
    savedIds:[],citations:()=>null,
  }));
  assert.match(html,/<input[^>]*type="range"/);
  assert.match(html,/aria-label="Seek clip timeline"/);
  assert.match(html,/max="70.203"/);
});

test('dragging a timeline card pans without accidentally selecting it; a later click still works',()=>{
  assert.equal(typeof compiled.exports.timelinePan,'function');
  const handlers=compiled.exports.timelinePan();
  const el={scrollLeft:100,scrollWidth:1180,clientWidth:700,dataset:{},captured:null,
    setPointerCapture(id){this.captured=id;},hasPointerCapture(id){return this.captured===id;},releasePointerCapture(){this.captured=null;}};
  const event=(x,extra={})=>({pointerId:1,isPrimary:true,pointerType:'mouse',button:0,clientX:x,currentTarget:el,
    target:{closest:()=>null},preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...extra});
  handlers.onPointerDown(event(300));handlers.onPointerMove(event(180));handlers.onPointerUp(event(180));
  assert.equal(el.scrollLeft,220);
  const click=event(180,{detail:1});handlers.onClickCapture(click);
  assert.equal(click.prevented,true);assert.equal(click.stopped,true);
  handlers.onPointerDown(event(180));handlers.onPointerUp(event(180));
  const next=event(180,{detail:1});handlers.onClickCapture(next);assert.equal(next.prevented,undefined);
  const keyboard=event(180,{detail:0});handlers.onClickCapture(keyboard);assert.equal(keyboard.prevented,undefined);
});

test('timeline panning leaves native range and touch gestures alone and cancels cleanly',()=>{
  assert.equal(typeof compiled.exports.timelinePan,'function');
  const handlers=compiled.exports.timelinePan();
  const el={scrollLeft:0,scrollWidth:1180,clientWidth:700,dataset:{},setPointerCapture(){throw Error('Unexpected capture');}};
  const base={pointerId:1,isPrimary:true,pointerType:'mouse',button:0,currentTarget:el,clientX:100,target:{closest:()=>true}};
  handlers.onPointerDown(base);handlers.onPointerMove({...base,clientX:20});assert.equal(el.scrollLeft,0);
  handlers.onPointerDown({...base,pointerType:'touch',target:{closest:()=>null}});
  handlers.onPointerMove({...base,clientX:20});assert.equal(el.scrollLeft,0);
  handlers.onPointerCancel(base);assert.notEqual(el.dataset.dragging,'true');
});
