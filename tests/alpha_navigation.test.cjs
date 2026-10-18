/* Browser-session regressions found during the October 18 alpha QA. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function appHarness() {
  const ids = new Map();
  function element() {
    const classes = new Set(), attributes = new Map();
    return {hidden:false, value:"", textContent:"", disabled:false, dataset:{}, style:{},
      firstChild:{textContent:""}, children:[], listeners:{},
      classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),contains:v=>classes.has(v),
        toggle:(v,on)=>on ? classes.add(v) : classes.delete(v)},
      setAttribute:(k,v)=>attributes.set(k,v),getAttribute:k=>attributes.get(k),removeAttribute:k=>attributes.delete(k),
      addEventListener(k,fn){(this.listeners[k] ||= []).push(fn);},
      append(...nodes){this.children.push(...nodes);},replaceChildren(){this.children=[];},
      querySelector:()=>element(),focus(){},pause(){},load(){},scrollIntoView(){},
    };
  }
  const get = id => {if(!ids.has(id))ids.set(id,element());return ids.get(id);};
  const shell = element(), routes=[], events=new Map();
  const context=vm.createContext({document:{getElementById:get,querySelector:()=>shell,querySelectorAll:()=>[],createElement:element},
    window:{addEventListener(name,fn){events.set(name,fn);},innerWidth:1280,location:{hash:"#start"},matchMedia:()=>({matches:true})},
    history:{replaceState(_state,_title,url){routes.push(url);}},
    fetch:()=>new Promise(()=>{}),console});
  vm.runInContext(fs.readFileSync("src/ctrlf_video/static/app.js","utf8"),context);
  return {get,shell,routes,run:code=>vm.runInContext(code,context),navigate:hash=>{context.window.location.hash=hash;events.get("hashchange")();}};
}

test("opening an uploaded investigation from Home changes the route so refresh restores work",()=>{
  const h=appHarness();
  h.run("window.CtrlFVideoSessionUI.entryReady(true)");
  assert.equal(h.get("research-welcome").hidden,false);
  h.run("window.CtrlFVideoSessionUI.entered()");
  assert.equal(h.routes.at(-1),"/#review");
  assert.equal(h.get("research-welcome").hidden,true);
  assert.equal(h.shell.inert,false);
});

test("initial restoration preserves an explicitly requested Home route",()=>{
  const h=appHarness();
  h.run("window.CtrlFVideoSessionUI.entered()");
  assert.deepEqual(h.routes,[]);
  h.run("window.CtrlFVideoSessionUI.entryReady(false)");
  assert.equal(h.get("research-welcome").hidden,false);
  assert.equal(h.shell.inert,true);
});

test("hash navigation changes the visible surface without clearing the draft",()=>{
  const h=appHarness();
  h.run("window.CtrlFVideoSessionUI.entryReady(true)");
  h.get("question").value="Keep this question";
  h.navigate("#review");
  assert.equal(h.get("research-welcome").hidden,true);
  assert.equal(h.shell.inert,false);
  h.navigate("#start");
  assert.equal(h.get("research-welcome").hidden,false);
  assert.equal(h.shell.inert,true);
  assert.equal(h.get("question").value,"Keep this question");
});

test("unindexed uploaded recordings allow drafts without admitting questions",()=>{
  const h=appHarness();
  h.get("question").disabled=true;
  h.get("question").value="Where does the checkout error appear?";
  h.run("activeVideo={id:'uploaded'};localMode=true;liveAccess=true;demo={};updateSend()");
  assert.equal(h.get("question").disabled,false);
  assert.equal(h.get("send-question").disabled,false);
  assert.equal(h.get("send-question").getAttribute("aria-label"),"Check analysis status; question is not sent");
  assert.equal(h.get("composer-analysis").hidden,false);
  assert.match(h.get("composer-analysis-message").textContent,/has not started/);
  h.run("window.CtrlFVideoPersistence={library(kind){window.checkedLibrary=kind;},ask(){throw Error('Must not send an unindexed question');}}");
  h.get("question-form").listeners.submit[0]({preventDefault(){}});
  assert.match(h.get("composer-feedback").textContent,/not been sent/);
  assert.equal(h.run("window.checkedLibrary"),"videos");
  assert.equal(h.get("question").value,"Where does the checkout error appear?");
  h.run("liveAccess=false;updateSend()");
  assert.equal(h.get("question").disabled,false);
  assert.equal(h.get("send-question").hidden,true);
  assert.equal(h.get("composer-analysis").hidden,true);
});

test("analysis status action explains active and failed indexing without sending the draft",()=>{
  const h=appHarness();
  h.get("question").value="Keep my follow-up";
  h.run("activeVideo={id:'uploaded',job:{state:'indexing'}};localMode=true;liveAccess=true;demo={};updateSend()");
  assert.match(h.get("composer-analysis-message").textContent,/running/);
  h.run("activeVideo.job.state='failed';updateSend()");
  assert.match(h.get("composer-analysis-message").textContent,/stopped/);
  h.run("localMode=false;updateSend()");
  assert.equal(h.get("composer-analysis").hidden,true);
  assert.equal(h.get("send-question").getAttribute("aria-label"),"Send question");
  assert.equal(h.get("question").value,"Keep my follow-up");
});

test("a delayed analysis-status error cannot overwrite another source's feedback",async()=>{
  const h=appHarness();
  h.run("activeVideo={id:'uploaded'};localMode=true;liveAccess=true;demo={};window.CtrlFVideoPersistence={library(){return new Promise((_,reject)=>window.rejectStatus=reject);}};checkComposerAnalysis();activeVideo={id:'another'};notice('Other source feedback');window.rejectStatus(Error('offline'))");
  await new Promise(setImmediate);
  assert.equal(h.get("composer-feedback").textContent,"Other source feedback");
});
