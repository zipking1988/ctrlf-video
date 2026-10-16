const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const model=require('../src/ctrlf_video/static/judge/model.js');
const reports=require('../src/ctrlf_video/static/investigation-report.js');
const sample=()=>JSON.parse(fs.readFileSync('src/ctrlf_video/static/judge/basketball/results.json','utf8'));
const finding=()=>({title:'Scores I checked',observation:'Milwaukee 51, Atlanta 56 at 1.001s.',interpretation:'',openQuestions:'Only this point checked.'});

test('public recorded reports freeze visitor notes without modifying the original partial result',()=>{
 const data=sample(),before=JSON.stringify(data),notes=finding();
 const report=model.report(data,notes,'https://ctrlfvideo.com');
 notes.observation='A later draft';data.query.response.answer='Changed later';
 assert.equal(report.questions[0].response.status,'partial');assert.equal(report.evidence[0].t,1.001);
 assert.notEqual(report.findings[0].research.observation,notes.observation);
 assert.notEqual(report.questions[0].response.answer,data.query.response.answer);
 assert.match(before,/Milwaukee Bucks with 51/);assert.equal(report.source.kind,'recorded');
 assert.equal(report.recorded_test_history.length,6);
});
test('visitor storage rejects malformed, overlong or missing notes and cannot replace source evidence',()=>{
 assert.equal(model.draft([]),null);assert.equal(model.draft({...finding(),title:'x'.repeat(201)}),null);
 assert.equal(model.draft({...finding(),observation:42}),null);
 assert.equal(model.complete({...finding(),observation:'   '}),false);
 const data=sample();data.source.url='https://other.example/private.mp4';assert.throws(()=>model.report(data,finding(),'https://ctrlfvideo.com'));
 data.source.url='/static/judge/basketball/source.mp4';data.query.response.events[0].video_id='another';assert.throws(()=>model.report(data,finding(),'https://ctrlfvideo.com'),/another source/);
});
test('recorded report links replay the public sample, preserve limitations and escape visitor markup',()=>{
 const report=model.report(sample(),{...finding(),observation:'<img src=x onerror=evil()>',interpretation:'</p><script>evil()</script>'},'https://ctrlfvideo.com');
 assert.match(reports.markdown(report),/source\.mp4#t=1\.001/);
 const html=reports.html(report,{E1:'data:image/jpeg;base64,YQ=='});
 assert.match(html,/source\.mp4#t=1\.001/);assert.match(html,/1\/1 images embedded/);assert.match(html,/no new model request/);
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x onerror='));assert.match(html,/&lt;script&gt;/);
 assert.match(html,/Partial|partial/);assert.match(html,/not the full private investigation/);
 report.source.playback_url='javascript:alert(1)';assert.ok(!reports.html(report).includes('href="javascript:'));
 report.source.playback_url='https://u:p@example.com/static/judge/basketball/source.mp4';assert.ok(!reports.html(report).includes('href="https://u:p'));
});
test('public sample matches its approved manifest and excludes owner, private media and operational records',()=>{
 const data=sample(),source=fs.readFileSync('src/ctrlf_video/static/judge/basketball/source.mp4');
 assert.equal(crypto.createHash('sha256').update(source).digest('hex'),data.source.public_video_sha256);
 const json=JSON.stringify(data);assert.ok(!json.includes('/media/vid_'));assert.ok(!/owner_id|csrf|budget_version|api_key|vid_[a-f0-9]{32}/.test(json));
 assert.deepEqual(data.history.map(x=>x.model_status),['error','ok','error','partial','partial','partial']);
 assert.match(data.provenance.public_copy,/decoded again/);assert.equal(data.provenance.new_model_requests,0);
});
