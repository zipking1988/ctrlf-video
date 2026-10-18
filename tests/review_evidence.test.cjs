const test=require('node:test'),assert=require('node:assert/strict');
const review=require('../src/ctrlf_video/static/judge/basketball/clip-review.json');
const model=import('../frontend/review-evidence.mjs');
test('findings expose evidence and separate unknown causes from observations',async()=>{
 const {reviewDocuments,savedReviewMarkdown}=await model,docs=reviewDocuments(review);
 assert.equal(docs.length,9);assert.ok(!docs[0].text.includes('62'));assert.deepEqual(docs[0].points,['1','59']);
 for(const doc of docs){assert.ok(doc.text&&doc.limit);for(const id of doc.points)assert.ok(review.points[id]);}
 const report=savedReviewMarkdown(review,['revision'],'https://ctrlfvideo.com');
 assert.match(report,/62 at 00:36.036 and 61 at 00:37.037/);
 assert.match(report,/does not establish whether/);assert.match(report,/No new model analysis/);
 assert.match(report,/source.mp4#t=36.036/);assert.match(report,/source.mp4#t=37.037/);
 assert.ok(!report.includes('## The displayed lead'));
});
test('follow-up uses selected evidence and adjacent sections without inventing the next event',async()=>{
 const {searchReview}=await model;
 assert.deepEqual(searchReview(review,'Why?',['revision']).ids,['revision']);
 assert.deepEqual(searchReview(review,'Show the evidence',['revision']).ids,['revision']);
 assert.deepEqual(searchReview(review,'为什么？',['revision']).ids,['revision']);
 assert.deepEqual(searchReview(review,'What happens next?',['revision']).ids,['chapter-3']);
 assert.deepEqual(searchReview(review,'What happens next?',['chapter-3']).ids,['chapter-4']);
 assert.deepEqual(searchReview(review,'What happens next?',['chapter-3','lead']).ids,['chapter-4']);
 assert.deepEqual(searchReview(review,'What happens before this?',['chapter-3']).ids,['chapter-2']);
 assert.equal(searchReview(review,'What happens next?',['chapter-5']).kind,'unanswered');
 assert.equal(searchReview(review,'What happens before this?',['chapter-0']).kind,'unanswered');
 assert.equal(searchReview(review,'What happens next?').kind,'unanswered');
});
test('time questions use source-time ranges and reject times outside the excerpt',async()=>{
 const {searchReview}=await model;
 assert.deepEqual(searchReview(review,'What happens at 00:43?').ids,['chapter-3']);
 assert.deepEqual(searchReview(review,'37秒发生了什么？').ids,['chapter-2']);
 assert.deepEqual(searchReview(review,'What happens at 70.203467 seconds?').ids,['chapter-5']);
 for(const q of ['What happens at 05:00?','What happens at 71 seconds?','What happens at -3 seconds?'])assert.equal(searchReview(review,q).kind,'unanswered');
});
test('unsupported identity/audio and unrelated questions do not become false answers',async()=>{
 const {searchReview}=await model;
 for(const q of ['Who is the player at 00:43?','What did the commentator say?','这个球员叫什么？','What is the weather in Tokyo?','Who is the CEO of Google?'])assert.equal(searchReview(review,q,['revision']).kind,'unanswered',q);
 const answer=searchReview(review,'Why does the score go from 62 to 61?');
 assert.equal(answer.kind,'excerpts');assert.ok(answer.ids.includes('revision'));assert.match(answer.message,/not a generated answer/);
 assert.equal(searchReview(review,'x'.repeat(2001)).kind,'unanswered');
});
test('browser restoration rejects stale/tampered sources and bounds saved question context',async()=>{
 const {restoreReviewState,reviewStorageKey}=await model;
 const empty={draft:'',contextIds:[],savedIds:[],turns:[]};
 for(const raw of ['null','{',JSON.stringify({version:1,source:'wrong',savedIds:['revision']})])assert.deepEqual(restoreReviewState(review,raw),empty);
 const restored=restoreReviewState(review,JSON.stringify({version:1,source:review.source.sha256,draft:'keep me',contextIds:['revision','injected'],savedIds:['lead','lead','injected'],turns:[null,{question:'Why?',contextIds:['revision']},{question:'',contextIds:[]},{question:'x'.repeat(2001)}]}));
 assert.equal(restored.draft,'keep me');assert.deepEqual(restored.contextIds,['revision']);assert.deepEqual(restored.savedIds,['lead']);assert.deepEqual(restored.turns,[{question:'Why?',contextIds:['revision']}]);assert.ok(reviewStorageKey(review).endsWith(review.source.sha256));
});
