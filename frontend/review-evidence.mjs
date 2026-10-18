// Local lookup over the fixed editorial review. This never dispatches a model or
// invents an answer; the UI must identify returned text as reviewed excerpts.
export function reviewDocuments(review) {
  const first=review.score_path[0],last=review.score_path.at(-1);
  return [
    {id:'lead',title:`The displayed lead grows from ${first.atlanta-first.milwaukee} to ${last.atlanta-last.milwaukee}`,
      text:`The visible score moves from Atlanta ${first.atlanta}–Milwaukee ${first.milwaukee} to Atlanta ${last.atlanta}–Milwaukee ${last.milwaukee}. The displayed lead increases from ${first.atlanta-first.milwaukee} to ${last.atlanta-last.milwaukee} points.`,
      limit:'This is the displayed change in an edited excerpt, not the final game result.',
      points:[first.point,last.point],terms:'score lead margin points Atlanta Milwaukee 比分 分差 领先 得分',question:'How does the lead change?'},
    {id:'revision',title:review.insight.title,text:review.insight.observation,
      limit:review.insight.interpretation,points:[review.insight.before,review.insight.after],
      terms:'score scoreboard revision correction decrease drop lost why 62 61 point anomaly reason 比分 修正 减少 下降 为什么 原因 异常',question:'Why does the score go from 62 to 61?'},
    {id:'scope',title:'Broadcast edits leave gaps in the game',text:review.chapters[1].text,
      limit:review.chapters.at(-1).text,points:['19','24','70'],
      terms:'edit cuts continuity whole complete game final winner end missing gap 完整 全场 比赛 结束 剪辑 缺失 结局 谁赢',question:'Does this show the whole game?'},
    ...review.chapters.map((chapter,index)=>({...chapter,id:`chapter-${index}`,limit:'Sampled source review; replay the surrounding footage to check the event.',terms:'sequence possession play movement action court basket 顺序 过程 进攻 运动 动作 篮筐',question:`What is visible at ${Math.floor(chapter.start)} seconds?`})),
  ];
}
const normalized=value=>String(value||'').normalize('NFKC').toLowerCase().trim();
const stop=new Set('what which when where how why does did do is are was were the a an of in at to from and or it this that these those then about show shows me tell can you we see there happens happen please go'.split(' '));
function tokens(text) {
  const found=normalized(text).match(/[a-z0-9]+|[\u3400-\u9fff]{2,}/g)||[];
  return [...new Set(found.filter(word=>!stop.has(word)).flatMap(word=>/[\u3400-\u9fff]/.test(word)?Array.from({length:word.length-1},(_,i)=>word.slice(i,i+2)):[word]))];
}
function timeInQuestion(question) {
  const clock=question.match(/\b(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\b/);
  if(clock)return Number(clock[1])*60+Number(clock[2])+Number(`0.${clock[3]||0}`);
  const seconds=question.match(/(?:\bat\s+|\b)(-?\d+(?:\.\d+)?)\s*(?:seconds?\b|secs?\b|秒)/i);
  return seconds ? Number(seconds[1]) : null;
}
export function searchReview(review,question,contextIds=[]) {
  const q=normalized(question),docs=reviewDocuments(review),context=contextIds.map(id=>docs.find(d=>d.id===id)).filter(Boolean);
  const missing=message=>({kind:'unanswered',message,ids:[]});
  if(!q)return missing('Enter a question or choose a finding to explore.');
  if(q.length>2000)return missing('Keep the question within 2,000 characters.');
  // Search results are excerpts, never confirmation of an identity, cause or sound.
  if(/\b(said|say|saying|speech|audio|hear|commentator|transcript)\b|说了|听到|解说|声音|语音|台词/.test(q))return missing('No audio was reviewed. These notes cannot answer speech or commentary questions.');
  if(/\b(who is|who was|player name|identify|jersey|shirt number)\b|谁是|是谁|叫什么|球员名字|几号/.test(q))return missing('Player identities and jersey numbers were not verified in this review. Replay a frame to inspect it; these notes cannot identify the player.');
  const time=timeInQuestion(q);
  if(time!==null) {
    if(time<0 || time>review.source.duration)return missing('This source is only 70.2 seconds long. That time is outside the reviewed clip.');
    return {kind:'excerpts',message:'Reviewed notes for this source-time range. This is not a new inspection of the video.',ids:docs.filter(d=>d.start!==undefined && time>=d.start && (time<d.end || (time===d.end && d.end===review.source.duration))).map(d=>d.id)};
  }
  const refersBack=/\b(it|this|that|these|those|next|after|before|proof|evidence|why)\b|这个|这点|那里|之后|之前|接下来|证据|为什么/.test(q);
  const next=/\b(next|after that|after this)\b|之后|接下来/.test(q),previous=/\b(before that|before this)\b|之前/.test(q);
  if((next||previous) && !context.length)return missing('Choose a finding first so the review knows which moment you mean.');
  if((next||previous) && context.length) {
    const anchor=context[0];
    const anchorTime=anchor.end!==undefined ? (previous?anchor.start:anchor.end) : review.points[previous?anchor.points[0]:anchor.points.at(-1)].t;
    const chapters=docs.filter(d=>d.start!==undefined);
    let index=chapters.findIndex(d=>anchorTime>=d.start&&anchorTime<d.end);
    if(index<0)index=chapters.length-1;
    if(previous)index-=1;
    else if(anchor.end===undefined)index+=1;
    if(!previous && anchor.end===review.source.duration)index=chapters.length;
    if(index<0 || index>=chapters.length)return missing('The reviewed clip has no earlier/later section for this selection. It cannot establish what happened outside the excerpt.');
    return {kind:'excerpts',message:'Adjacent reviewed section, using your selected finding as context.',ids:[chapters[index].id]};
  }
  const words=tokens(q),ranked=docs.map(doc=>{
    const content=new Set(tokens(`${doc.text} ${doc.limit}`)),title=new Set(tokens(doc.title)),terms=new Set(tokens(doc.terms));
    return {id:doc.id,score:words.reduce((sum,word)=>sum+(title.has(word)?3:terms.has(word)?2:content.has(word)?1:0),0)};
  }).filter(item=>item.score>0).sort((a,b)=>b.score-a.score);
  // A short follow-up keeps the selected subject; a new subject searches afresh.
  const meaningful=words.filter(word=>!['proof','evidence','reason','happened','证据','原因'].includes(word));
  if(refersBack&&context.length&&(!meaningful.length || ranked[0]?.id===context[0].id))return {kind:'excerpts',message:'Reviewed notes for your selected finding. Any unverified cause remains open.',ids:context.map(d=>d.id).slice(0,2)};
  if(!ranked.length)return missing('No reviewed passage matches this question. This does not mean the event is absent. A new Gemini analysis is needed to investigate beyond these notes; live analysis is not enabled for this public example.');
  return {kind:'excerpts',message:'Matching reviewed passages, not a generated answer. Check the citations and limits before drawing a conclusion.',ids:ranked.slice(0,2).map(d=>d.id)};
}
export function reviewStorageKey(review) {return `ctrlf-video:review-notes:v1:${review.source.sha256}`;}
export function restoreReviewState(review,raw) {
  const empty={draft:'',contextIds:[],savedIds:[],turns:[]};
  try {
    const value=JSON.parse(raw),ids=new Set(reviewDocuments(review).map(d=>d.id));
    if(value?.version!==1 || value.source!==review.source.sha256)return empty;
    const validIds=input=>Array.isArray(input)?[...new Set(input.filter(id=>typeof id==='string'&&ids.has(id)))].slice(0,9):[];
    return {draft:typeof value.draft==='string'?value.draft.slice(0,2000):'',contextIds:validIds(value.contextIds).slice(0,2),savedIds:validIds(value.savedIds),turns:Array.isArray(value.turns)?value.turns.filter(t=>t&&typeof t.question==='string'&&t.question.trim()&&t.question.length<=2000).slice(-12).map(t=>({question:t.question,contextIds:validIds(t.contextIds).slice(0,2)})):[]};
  } catch{return empty;}
}
export function savedReviewMarkdown(review,savedIds,origin) {
  const docs=reviewDocuments(review).filter(d=>savedIds.includes(d.id)),source=new URL(review.source.url,origin).href;
  return `# Saved findings · basketball clip\n\n${review.provenance}\n\nSelected by the visitor from prepared review notes. No new model analysis.\n\n${docs.map(doc=>`## ${doc.title}\n\n${doc.text}\n\nLimits: ${doc.limit}\n\n${doc.points.map(id=>`- [Source at ${review.points[id].t.toFixed(3)}s](${source}#t=${review.points[id].t})`).join('\n')}`).join('\n\n')}\n\nSource SHA-256: ${review.source.sha256}\n`;
}
