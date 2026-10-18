import {sourceClock} from "./review-timeline.mjs";

// Fixed public editorial asset; deliberately separate from the schema 0.1 Gemini answer.
export function clipReviewMarkdown(review,origin) {
  const url=new URL(review.source.url,origin).href;
  const point=id=>{const p=review.points[id];return `[${sourceClock(p.t)}](${url}#t=${p.t}) · [Source frame](${new URL(p.image,origin).href})`;};
  return `# ${review.title}\n\n${review.provenance}\n\n${review.summary}\n\n## ${review.insight.title}\n\n${review.insight.observation}\n\n${point(review.insight.before)}\n\n${point(review.insight.after)}\n\nInterpretation: ${review.insight.interpretation}\n\n## The clip, in sequence\n\n${review.chapters.map(c=>`### ${sourceClock(c.start)}–${sourceClock(c.end)} · ${c.title}\n\n${c.text}\n\n${c.points.map(point).join("\n\n")}`).join("\n\n")}\n\n## Limits\n\n${review.limits.map(t=>`- ${t}`).join("\n")}\n\n## Questions for closer review\n\n${review.next_questions.map(t=>`- ${t}`).join("\n")}\n\nSource SHA-256: ${review.source.sha256}\n`;
}
