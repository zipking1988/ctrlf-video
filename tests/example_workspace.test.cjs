const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const helper=import('../frontend/example-workspace.mjs');
const response=(data,headers={})=>new Response(data,{headers:{'content-type':'video/mp4',...headers}});
test('example preparation reads only the fixed public clip and verifies its bytes before upload',async()=>{
 const {loadExampleFile,publicExample}=await helper,bytes=fs.readFileSync('src/ctrlf_video'+publicExample.url),calls=[];
 const file=await loadExampleFile({fetcher:async(url,options)=>{calls.push({url,options});return response(bytes);}});
 assert.equal(file.size,bytes.length);assert.equal(file.type,'video/mp4');assert.equal(file.name,publicExample.name);
 assert.equal(calls.length,1);assert.equal(calls[0].url,'/static/judge/basketball/source.mp4');assert.equal(calls[0].options.credentials,'omit');assert.equal(calls[0].options.redirect,'error');
});
test('modified example content is never handed to the private upload flow',async()=>{
 const {loadExampleFile}=await helper;
 await assert.rejects(loadExampleFile({fetcher:async()=>response('different video')}),/does not match/);
 await assert.rejects(loadExampleFile({fetcher:async()=>new Response('html',{headers:{'content-type':'text/html'}})}),/could not be prepared/);
});
test('streamed and declared size bounds both stop unbounded example reads',async()=>{
 const {loadExampleFile,publicExample}=await helper;
 await assert.rejects(loadExampleFile({fetcher:async()=>response('',{'content-length':String(publicExample.maxBytes+1)})}),/exceeds/);
 let cancelled=false;
 const stream=new ReadableStream({pull(controller){controller.enqueue(new Uint8Array(publicExample.maxBytes+1));},cancel(){cancelled=true;}});
 await assert.rejects(loadExampleFile({fetcher:async()=>response(stream)}),/exceeds/);assert.equal(cancelled,true);
});
test('navigation or abort prevents a late example download from opening a workspace',async()=>{
 const {loadExampleFile}=await helper;let count=0;
 await assert.rejects(loadExampleFile({isCurrent:()=>false,fetcher:async()=>{count++;return response('');}}),{name:'AbortError'});assert.equal(count,0);
 let active=true,cancelled=false;
 const stream=new ReadableStream({pull(controller){active=false;controller.enqueue(new Uint8Array([1]));},cancel(){cancelled=true;}});
 await assert.rejects(loadExampleFile({isCurrent:()=>active,fetcher:async()=>response(stream)}),{name:'AbortError'});
 const controller=new AbortController();controller.abort();await assert.rejects(loadExampleFile({signal:controller.signal}),{name:'AbortError'});
 // Cancellation is also required if ownership changed before the body was read.
 assert.equal(cancelled,true);
});
