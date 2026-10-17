const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sample=()=>JSON.parse(fs.readFileSync('src/ctrlf_video/static/judge/basketball/results.json','utf8'));
const helper=import('../frontend/recorded-example-model.mjs');

test('unified example resolves only the validated public copy without mutating saved evidence',async()=>{
 const {exampleView}=await helper,data=sample(),before=JSON.stringify(data);
 const state=exampleView(data,'http://127.0.0.1:8879');
 assert.equal(JSON.stringify(data),before);
 assert.equal(state.records.length,1);
 assert.equal(state.records[0].query.response.status,'partial');
 assert.equal(state.records[0].query.response.events[0].evidence[0].uri,'/static/judge/basketball/frames/scoreboard-1-001.jpg');
 assert.equal(state.records[0].query.response.events[0].evidence[0].t,1.001);
 data.public_assets[data.query.response.events[0].evidence[0].frame_id]='https://other.example/frame.jpg';
 assert.throws(()=>exampleView(data,'https://ctrlfvideo.com'),/evidence/);
});
test('unified example restores legacy visitor notes and rejects malformed storage',async()=>{
 const {storedFinding,findingKey,exampleReport}=await helper,data=sample();
 assert.equal(findingKey,'ctrlf-video:judge:basketball-20261017-v1:finding');
 assert.deepEqual(storedFinding(JSON.stringify(data.reviewed_finding)),data.reviewed_finding);
 for(const value of ['{bad','null','[]',JSON.stringify({...data.reviewed_finding,observation:''})])assert.equal(storedFinding(value),null);
 const report=exampleReport(data,data.reviewed_finding,'https://ctrlfvideo.com');
 assert.equal(report.source.kind,'recorded');assert.equal(report.evidence[0].uri,'/static/judge/basketball/frames/scoreboard-1-001.jpg');
 assert.equal(report.recorded_test_history.length,6);
});
test('legacy judge entry redirects within the same origin to the unified product',()=>{
 const page=fs.readFileSync('src/ctrlf_video/static/judge/index.html','utf8');
 const redirect=fs.readFileSync('src/ctrlf_video/static/judge/redirect.js','utf8');
 assert.match(page,/href="\/#example"/);assert.match(redirect,/location\.replace\("\/#example"\)/);
 assert.ok(!page.includes('finding-form'));
 const home=fs.readFileSync('src/ctrlf_video/static/index.html','utf8');
 assert.match(home,/Try a real example/);assert.ok(!home.includes('href="/static/judge/index.html"'));
});
