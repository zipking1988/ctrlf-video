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

test("analysis timeline uses citation times, not broad windows, and keeps overlaps separate",async()=>{
 const {analysisEvents}=await timeline;
 const query={video_id:'v',response:{events:[
  {video_id:'v',start:0,end:300,action:'Later observation',evidence:[{t:37.037,uri:'/37.jpg'},{t:36.036,uri:'/36.jpg'}]},
  {video_id:'v',start:0,end:300,action:'One frame only',evidence:[{t:14.014,uri:'/14.jpg'}]},
  {video_id:'v',start:0,end:300,action:'Overlapping claim',evidence:[{t:36.036,uri:'/36.jpg'}]},
  {video_id:'other',evidence:[{t:1,uri:'/other.jpg'}]},
  {video_id:'v',evidence:[{t:301,uri:'/past-end.jpg'}]},
 ]}};
 const result=analysisEvents(query,300);
 assert.deepEqual(result.events.map(item=>item.index),[1,0,2]);
 assert.equal(result.events[0].first,result.events[0].last);
 assert.deepEqual(result.events[1].points.map(p=>p.t),[36.036,37.037]);
 assert.notEqual(result.events[1].row,result.events[2].row);
 assert.equal(result.scale,300);assert.equal(result.knownDuration,true);
 assert.equal(query.response.events[0].start,0);
 assert.deepEqual(analysisEvents({response:{events:[]}},70).events,[]);
 const unknown=analysisEvents({response:{events:[{evidence:[{t:5,uri:'/5.jpg'}]}]}},undefined);
 assert.equal(unknown.knownDuration,false);assert.equal(unknown.scale,5);
});
