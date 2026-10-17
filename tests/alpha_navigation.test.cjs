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
  const shell = element(), routes=[];
  const context=vm.createContext({document:{getElementById:get,querySelector:()=>shell,querySelectorAll:()=>[],createElement:element},
    window:{addEventListener(){},innerWidth:1280,location:{hash:"#start"},matchMedia:()=>({matches:true})},
    history:{replaceState(_state,_title,url){routes.push(url);}},
    fetch:()=>new Promise(()=>{}),console});
  vm.runInContext(fs.readFileSync("src/ctrlf_video/static/app.js","utf8"),context);
  return {get,shell,routes,run:code=>vm.runInContext(code,context)};
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
