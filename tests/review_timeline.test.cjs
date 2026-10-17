const test=require("node:test");
const assert=require("node:assert/strict");
const timeline=import("../frontend/review-timeline.mjs");

test("timeline uses actual cited frame times, excluding other sources and invalid points",async()=>{
 const {citedMoments}=await timeline;
 const query={video_id:"v",response:{events:[
  {video_id:"v",start:0,end:70,evidence:[{t:6,uri:"/6.jpg"},{t:1.001,uri:"/1.jpg",caption:"Readable scoreboard"},{t:1.001,uri:"/1.jpg"},{t:80,uri:"/80.jpg"},{t:-1,uri:"/bad.jpg"},{t:NaN,uri:"/bad.jpg"}]},
  {video_id:"other",evidence:[{t:3,uri:"/other.jpg"}]}
 ]}};
 const moments=citedMoments(query,70.2);
 assert.deepEqual(moments.map(m=>m.t),[1.001,6]);
 assert.equal(moments[0].description,"Readable scoreboard");
 assert.equal(query.response.events[0].evidence.length,6);
 assert.deepEqual(citedMoments({response:{events:[]}},70),[]);
});
test("source clock preserves milliseconds and handles second and hour rollover",async()=>{
 const {sourceClock}=await timeline;
 assert.equal(sourceClock(1.001),"00:01.001");
 assert.equal(sourceClock(59.9999),"01:00.000");
 assert.equal(sourceClock(3601.001),"01:00:01.001");
});
