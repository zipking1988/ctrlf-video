// This is a selected public asset, not an arbitrary URL importer. Upload and
// analysis remain separate, owned operations in the normal workspace.
export const publicExample = Object.freeze({
  url:'/static/judge/basketball/source.mp4',
  sha256:'0c9424e1dd66f0f9823831e4b2ed22b7f81362740667212c8d65bcf2183e9a2a',
  name:'Basketball technical sample.mp4',
  maxBytes:30*1024**2,
});
export async function loadExampleFile({fetcher=fetch,signal,isCurrent=()=>true}={}) {
  function current() {
    if(signal?.aborted || !isCurrent())throw new DOMException('Example preparation cancelled','AbortError');
  }
  current();
  const response=await fetcher(publicExample.url,{credentials:'omit',redirect:'error',signal});
  try {
    current();
    if(!response.ok || !response.headers.get('content-type')?.startsWith('video/mp4'))throw Error('The example video could not be prepared. Your workspace is unchanged.');
    const length=Number(response.headers.get('content-length'));
    if(length>publicExample.maxBytes)throw Error('The example exceeds the upload limit. Your workspace is unchanged.');
  } catch(error) {await response.body?.cancel().catch(()=>{});throw error;}
  const reader=response.body?.getReader();
  if(!reader)throw Error('The example download could not start. Reload and try again.');
  const chunks=[];let total=0;
  try {
    while(true) {
      current();const {done,value}=await reader.read();current();if(done)break;
      total+=value.byteLength;
      if(total>publicExample.maxBytes)throw Error('The example exceeds the upload limit. Your workspace is unchanged.');
      chunks.push(value);
    }
  } catch(error) {await reader.cancel().catch(()=>{});throw error;}
  finally {reader.releaseLock();}
  const file=new File(chunks,publicExample.name,{type:'video/mp4'});
  const bytes=await file.arrayBuffer();current();
  const digest=await crypto.subtle.digest('SHA-256',bytes);current();
  const sha=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  if(sha!==publicExample.sha256)throw Error('The example video does not match its verified source. No copy was uploaded.');
  return file;
}
