import React, {useEffect, useState} from 'react';
import {sourceClock} from './review-timeline.mjs';

const clock = time => sourceClock(time).slice(0, -4);

export default function ClipTimeline({review, docs, seek, citations, onAsk, onSave, savedIds}) {
  const [selectedId, setSelectedId] = useState('chapter-0');
  const [playhead, setPlayhead] = useState(0);
  const duration = review.source.duration;
  const chapters = docs.filter(doc => doc.start !== undefined);
  const findings = docs.filter(doc => doc.start === undefined)
    .sort((a, b) => review.points[a.points[0]].t - review.points[b.points[0]].t);
  const selected = docs.find(doc => doc.id === selectedId) || chapters[0];
  const position = time => `${time / duration * 100}%`;

  useEffect(() => {
    const player = document.getElementById('example-player');
    if (!player) return;
    const update = () => setPlayhead(Math.min(duration, Math.max(0, player.currentTime || 0)));
    update();
    for (const event of ['timeupdate', 'seeked', 'loadedmetadata']) player.addEventListener(event, update);
    return () => {
      for (const event of ['timeupdate', 'seeked', 'loadedmetadata']) player.removeEventListener(event, update);
    };
  }, [duration]);

  function inspect(doc) {
    setSelectedId(doc.id);
    // Keep the timeline in view; the source player remains independently usable.
    seek(doc.start ?? review.points[doc.points[0]].t);
  }

  return <section className="clip-timeline" aria-label="Source timeline and linked findings">
    <header className="clip-timeline-toolbar">
      <div><strong>Clip timeline</strong><span>6 sections · 3 findings</span></div>
      <span>Player <time>{sourceClock(playhead)}</time> / {clock(duration)}</span>
    </header>
    <p className="clip-timeline-help" id="clip-timeline-help">Select a section or finding to seek the source and inspect its evidence. Scroll sideways to explore the timeline.</p>
    <div className="clip-timeline-scroll" tabIndex={0} role="region" aria-label="Scrollable clip timeline" aria-describedby="clip-timeline-help">
      <div className="clip-timeline-board">
        <div className="clip-timeline-ruler" aria-label="Source time in seconds">
          {[0, 10, 20, 30, 40, 50, 60, duration].map(time => <time key={time} style={{left: position(time)}}>{clock(time)}</time>)}
        </div>
        <div className="clip-timeline-tracks">
          <div className="clip-playhead" aria-hidden="true" style={{left: position(playhead)}} />
          <section className="clip-timeline-sequence" aria-label="Chronological source sections">
            <span className="clip-track-label">SEQUENCE</span>
            <ol>{chapters.map((doc, index) => <li key={doc.id} style={{left: position(doc.start), width: position(doc.end - doc.start)}}>
              <button type="button" className="clip-moment" aria-pressed={selected.id === doc.id}
                aria-current={playhead >= doc.start && (playhead < doc.end || doc.end === duration && playhead === duration) ? 'time' : undefined}
                aria-label={`Inspect section ${index + 1}: ${doc.title}, ${clock(doc.start)} to ${sourceClock(doc.end)}`}
                onClick={() => inspect(doc)}>
                <span className="clip-moment-time"><span>{String(index + 1).padStart(2, '0')}</span><time>{clock(doc.start)}–{clock(doc.end)}</time></span>
                <img src={review.points[doc.points[0]].image} alt="" loading="lazy" />
                <strong>{doc.title}</strong>
              </button>
            </li>)}</ol>
          </section>
          <section className="clip-timeline-findings" aria-label="Findings anchored to their first source citation">
            <span className="clip-track-label">FINDINGS <small>Anchored at first citation</small></span>
            <ol>{findings.map(doc => <li key={doc.id} style={{left: position(review.points[doc.points[0]].t)}}>
              <button type="button" className={`clip-finding-node${doc.id === 'revision' ? ' clip-finding-revision' : ''}`}
                aria-pressed={selected.id === doc.id} onClick={() => inspect(doc)}>
                <span><time>{sourceClock(review.points[doc.points[0]].t)}</time><small>{savedIds.includes(doc.id) ? 'Saved' : `${doc.points.length} sources`}</small></span>
                <strong>{doc.title}</strong>
              </button>
            </li>)}</ol>
          </section>
        </div>
      </div>
    </div>
    <article className="clip-timeline-detail" aria-label="Selected timeline evidence">
      <div className="clip-selected-note">
        <span className="clip-eyebrow">{selected.start !== undefined ? `SECTION ${chapters.indexOf(selected) + 1} · ${sourceClock(selected.start)}–${sourceClock(selected.end)}` : 'SOURCE-LINKED FINDING'}</span>
        <h2>{selected.title}</h2><p>{selected.text}</p>
        <details key={selected.id}><summary>What remains uncertain</summary><p>{selected.limit}</p></details>
        <footer>
          <button type="button" className="outline-button" onClick={() => onAsk(selected)}>Ask about this</button>
          <button type="button" className="text-button" aria-pressed={savedIds.includes(selected.id)} onClick={() => onSave(selected)}>{savedIds.includes(selected.id) ? 'Saved' : 'Save finding'}</button>
        </footer>
      </div>
      <div className="clip-selected-evidence">
        <span className="clip-eyebrow">CHECK THE SOURCE · {selected.points.length} FRAMES</span>
        <div>{selected.points.map(id => <figure key={id}>
          <button type="button" onClick={() => seek(review.points[id].t)} aria-label={`Seek selected evidence at ${sourceClock(review.points[id].t)}`}>
            <img src={review.points[id].image} alt={`Source frame at ${sourceClock(review.points[id].t)}`} loading="lazy" />
          </button>
          <figcaption><time>{sourceClock(review.points[id].t)}</time></figcaption>
        </figure>)}</div>
        {citations(selected)}
      </div>
    </article>
  </section>;
}
