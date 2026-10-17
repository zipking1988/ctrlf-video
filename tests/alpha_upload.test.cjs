const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

function uploadHarness(limit=30*1024**2,ready=false) {
  const ids=new Map(),notices=[];
  const get=id=>{if(!ids.has(id))ids.set(id,{textContent:"",focus(){},showModal(){this.open=true;},close(){this.open=false;}});return ids.get(id);};
  const sandbox=vm.createContext({document:{getElementById:get},
    window:{addEventListener(){},CtrlFVideoSessionUI:{ready:()=>false,notify:text=>notices.push(text)}},
    fetch:async()=>({ok:true,status:200,headers:{get:()=>String(limit)},json:async()=>({})}),
    XMLHttpRequest:class {constructor(){throw Error("Unexpected file transmission");}},
  });
  const source=fs.readFileSync("src/ctrlf_video/static/workspace.js","utf8").replace("window.CtrlFVideoPersistence={flush,",
    "window.testUpload={seed:s=>{session=s;current={id:'desk'};},problem:uploadProblem,renameSource,api};window.CtrlFVideoPersistence={flush,");
  vm.runInContext(source,sandbox);
  sandbox.window.testUpload.seed({upload_max_bytes:limit,ttl_hours:24,real_ready:ready});
  return {get,notices,helpers:sandbox.window.testUpload,ui:sandbox.window.CtrlFVideoPersistence,setFetch:fn=>{sandbox.fetch=fn;}};
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

test("source rename validates whitespace and shows network failure inside the active dialog",async()=>{
  const h=uploadHarness();let requests=0;
  h.setFetch(async()=>{requests++;throw Error("Offline");});
  h.helpers.renameSource({id:"video",name:"Recording.mp4"});
  h.get("rename-source-input").value="   ";
  await h.get("rename-source-form").onsubmit({preventDefault(){}});
  assert.equal(requests,0);
  assert.match(h.get("rename-source-notice").textContent,/Enter a source name/);
  h.get("rename-source-input").value="Research session";
  await h.get("rename-source-form").onsubmit({preventDefault(){}});
  assert.equal(requests,1);
  assert.match(h.get("rename-source-notice").textContent,/Could not rename/);
  assert.equal(h.get("rename-source-dialog").open,true);
  assert.equal(h.get("rename-source-input").value,"Research session");
  assert.equal(h.get("rename-source-save").disabled,false);
});

test("late rename failure cannot replace a newly opened source dialog",async()=>{
  const h=uploadHarness();let reject;
  h.setFetch(()=>new Promise((_resolve,no)=>{reject=no;}));
  h.helpers.renameSource({id:"old",name:"Old.mp4"});
  const pending=h.get("rename-source-form").onsubmit({preventDefault(){}});
  assert.equal(h.get("rename-source-save").disabled,true);
  h.get("rename-source-dialog").close();
  h.helpers.renameSource({id:"new",name:"New.mp4"});
  reject(Error("Offline"));await pending;
  assert.equal(h.get("rename-source-notice").textContent,"");
  assert.equal(h.get("rename-source-input").value,"New.mp4");
  assert.equal(h.get("rename-source-save").disabled,false);
});
