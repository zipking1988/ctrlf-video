import React, {useState} from "react";
import review from "../src/ctrlf_video/static/judge/basketball/clip-review.json";
import {sourceClock} from "./review-timeline.mjs";
import ReviewConversation from "./review-conversation.jsx";
import {clipReviewMarkdown} from "./clip-review-model.mjs";

export default function ClipReview({seek, download, prepareWorkspace, preparing, prepareError}) {
  const [selected,setSelected]=useState(null);
  const replay=point=>{setSelected(point);seek(review.points[point].t);document.getElementById("example-player")?.scrollIntoView({block:"center",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"});};
  const evidence=(point,label)=> <button type="button" className="clip-citation" key={point} aria-pressed={selected===point} onClick={()=>replay(point)} aria-label={`Replay ${label || "source"} at ${sourceClock(review.points[point].t)}`}><time>{sourceClock(review.points[point].t)}</time>{label && <span>{label}</span>}<span aria-hidden="true">↗</span></button>;
  return <article className="clip-review" aria-label="Prepared clip breakdown">
    <ReviewConversation review={review} seek={seek} download={download} prepareWorkspace={prepareWorkspace} preparing={preparing} prepareError={prepareError}/>
    <details className="clip-full-review"><summary>Explore the full breakdown · six sections</summary>
    <header className="clip-heading"><span className="clip-eyebrow">SOURCE REVIEW · 01:10 CLIP</span><h2>{review.title}</h2><p>{review.summary}</p></header>
    <div className="clip-score-path" aria-label="Observed Atlanta score progression">{review.score_path.map(item=><button type="button" key={item.point} onClick={()=>replay(item.point)} aria-label={`Replay Atlanta ${item.atlanta}, Milwaukee ${item.milwaukee} at ${sourceClock(review.points[item.point].t)}`}><strong>{item.atlanta}</strong><small>{sourceClock(review.points[item.point].t).slice(0,5)}</small></button>)}<span>Atlanta’s displayed score<br/>Milwaukee: 51 at each citation</span></div>
    <p className="clip-provenance">{review.provenance}</p>
    <section className="clip-insight" aria-labelledby="clip-insight-title"><div><span className="clip-eyebrow">LOOK CLOSER</span><h2 id="clip-insight-title">{review.insight.title}</h2><p>{review.insight.observation}</p></div><div className="clip-compare">{[review.insight.before,review.insight.after].map((point,i)=><figure key={point}><button type="button" onClick={()=>replay(point)} aria-label={`Replay ${i ? "after revision" : "before revision"}`}><img loading="lazy" src={review.points[point].image} alt={`Broadcast score graphic: Atlanta ${i ? 61 : 62}, Milwaukee 51`}/></button><figcaption>{evidence(point,i ? "After · Atlanta 61" : "Before · Atlanta 62")}</figcaption></figure>)}</div><p className="clip-interpretation"><strong>What this means</strong> {review.insight.interpretation}</p></section>
    <section className="clip-sequence" aria-labelledby="clip-sequence-title"><header><h2 id="clip-sequence-title">The clip, in sequence</h2><p>Six review sections cover the source from beginning to end. Tap a timestamp to check the original.</p></header><ol>{review.chapters.map((chapter,index)=><li key={chapter.start}><div className="clip-chapter-time"><span>{String(index+1).padStart(2,"0")}</span><time>{sourceClock(chapter.start).slice(0,5)}–{sourceClock(chapter.end).slice(0,5)}</time></div><div><h3>{chapter.title}</h3><p>{chapter.text}</p><div className="clip-evidence-links">{chapter.points.map(point=>evidence(point))}</div></div><button className="clip-chapter-frame" type="button" onClick={()=>replay(chapter.points.at(-1))} aria-label={`Replay evidence for ${chapter.title}`}><img loading="lazy" src={review.points[chapter.points.at(-1)].image} alt={`Source evidence for ${chapter.title}`}/></button></li>)}</ol></section>
    <section className="clip-limits"><h2>What still needs checking</h2><ul>{review.limits.map(text=><li key={text}>{text}</li>)}</ul><details><summary>Questions for a closer review</summary><ol>{review.next_questions.map(text=><li key={text}>{text}</li>)}</ol></details></section>
    <footer className="clip-export"><div><strong>Keep the breakdown and its sources</strong><p>The report includes timestamps, evidence links and limits.</p></div><button type="button" className="primary-button" onClick={()=>download(clipReviewMarkdown(review,location.origin),"md","text/markdown;charset=utf-8")}>Download clip review</button></footer>
    </details>
  </article>;
}
