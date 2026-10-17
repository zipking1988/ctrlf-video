const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

function uploadHarness(limit=30*1024**2,ready=false) {
  const ids=new Map(),notices=[];
  const get=id=>{if(!ids.has(id))ids.set(id,{textContent:"",showModal(){this.open=true;},close(){this.open=false;}});return ids.get(id);};
  const sandbox=vm.createContext({document:{getElementById:get},
    window:{addEventListener(){},CtrlFVideoSessionUI:{ready:()=>false,notify:text=>notices.push(text)}},
    fetch:async()=>({ok:true,status:200,headers:{get:()=>String(limit)},json:async()=>({})}),
    XMLHttpRequest:class {constructor(){throw Error("Unexpected file transmission");}},
  });
  const source=fs.readFileSync("src/ctrlf_video/static/workspace.js","utf8").replace("window.CtrlFVideoPersistence={flush,",
    "window.testUpload={seed:s=>{session=s;current={id:'desk'};},problem:uploadProblem,api};window.CtrlFVideoPersistence={flush,");
  vm.runInContext(source,sandbox);
  sandbox.window.testUpload.seed({upload_max_bytes:limit,ttl_hours:24,real_ready:ready});
  return {get,notices,helpers:sandbox.window.testUpload,ui:sandbox.window.CtrlFVideoPersistence};
}

test("cloud upload limit is applied before any file transmission",async()=>{
  const h=uploadHarness(),cap=30*1024**2;
  const session=await h.helpers.api("/api/session");
  assert.equal(session.upload_max_bytes,cap);
  h.ui.reviewUpload({name:"recording.mp4",type:"video/mp4",size:cap+1});
  assert.match(h.notices.at(-1),/up to 30 MiB/);
  assert.equal(h.get("upload-dialog").open,undefined);
  h.ui.reviewUpload({name:"recording.mp4",type:"video/mp4",size:cap});
  assert.equal(h.get("upload-dialog").open,true);
  assert.match(h.get("upload-access-summary").textContent,/New AI analysis is unavailable/);
  assert.equal(h.get("upload-confirm").textContent,"Upload for playback");
  h.get("upload-cancel").onclick();
  assert.equal(h.get("upload-dialog").open,false);
});

test("local cap, retention and explicit analysis are described without dispatching",async()=>{
  const h=uploadHarness(500*1024**2,true);
  assert.equal((await h.helpers.api("/api/session")).upload_max_bytes,500*1024**2);
  h.ui.reviewUpload({name:"test.mov",type:"",size:1024});
  assert.match(h.get("upload-retention").textContent,/500 MiB.*24 hours/);
  assert.match(h.get("upload-access-summary").textContent,/Analysis starts separately/);
  assert.equal(h.get("upload-confirm").textContent,"Upload video");
});

test("untrusted upload hints cannot raise limits and invalid files never open upload",async()=>{
  for(const limit of [0,-1,NaN,Infinity]) assert.equal((await uploadHarness(limit).helpers.api("/api/session")).upload_max_bytes,30*1024**2);
  assert.equal((await uploadHarness(1024**4).helpers.api("/api/session")).upload_max_bytes,500*1024**2);
  const h=uploadHarness();
  for(const file of [{name:"empty.mp4",type:"video/mp4",size:0},{name:"notes.txt",type:"text/plain",size:100}]) {
    h.ui.reviewUpload(file);
    assert.equal(h.get("upload-dialog").open,undefined);
  }
  assert.equal(h.notices.length,2);
});
