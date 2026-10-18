const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const review=require('../src/ctrlf_video/static/judge/basketball/clip-review.json');
test('prepared clip review keeps editorial provenance and actual public source assets',()=>{
 assert.equal(review.kind,'editorial_source_review');assert.match(review.provenance,/not a new result/);
 assert.equal(review.chapters[0].start,0);assert.equal(review.chapters.at(-1).end,review.source.duration);
 for(let i=1;i<review.chapters.length;i++)assert.equal(review.chapters[i].start,review.chapters[i-1].end);
 const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 assert.equal(sha('src/ctrlf_video'+review.source.url),review.source.sha256);
 for(const point of Object.values(review.points)){
  assert.match(point.image,/^\/static\/judge\/basketball\/frames\/review-\d\d\.jpg$/);
  assert.ok(point.t>=0 && point.t<=review.source.duration);
  assert.equal(sha('src/ctrlf_video'+point.image),point.sha256);
 }
 for(const c of review.chapters)for(const id of c.points)assert.ok(review.points[id].t>=c.start && review.points[id].t<=c.end);
 assert.equal(review.points[review.insight.before].t,36.036);assert.equal(review.points[review.insight.after].t,37.037);
 assert.deepEqual(review.score_path.map(p=>p.atlanta),[56,59,62,61,64,67]);
});
test('clip report retains source times, unresolved cause and separate authorship',async()=>{
 const {clipReviewMarkdown}=await import('../frontend/clip-review-model.mjs');
 const md=clipReviewMarkdown(review,'https://ctrlfvideo.com');
 assert.match(md,/Prepared by Codex/);assert.match(md,/not a new result from the app’s Gemini pipeline/);
 assert.match(md,/source.mp4#t=36.036/);assert.match(md,/source.mp4#t=37.037/);
 assert.match(md,/does not establish whether/);assert.match(md,/not a five-minute recording/);
 assert.ok(!md.includes('/media/vid_'));
});
