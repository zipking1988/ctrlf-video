import React, {useEffect, useMemo, useRef, useState} from 'react';
import {analysisEvents, sourceClock} from './review-timeline.mjs';

export default function AnalysisTimeline({query, duration, playerId, onSeek, onReplay}) {
  const {events, rows, scale, knownDuration} = useMemo(() => analysisEvents(query, duration), [query, duration]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [playhead, setPlayhead] = useState(0);
  const nodes = useRef(new Map());
  const selected = events.find(item => item.index === selectedIndex) || events[0];
  const position = time => `${Math.min(100, Math.max(0, time / scale * 100))}%`;
  const step = [1, 2, 5, 10, 20, 30, 60, 120, 300, 600, 1800, 3600].find(value => scale / value <= 8) || Math.ceil(scale / 8);
  const ticks = [...Array.from({length:Math.ceil(scale / step)}, (_, index) => index * step)
    .filter(time => time === 0 || scale - time > step / 3), scale];

  useEffect(() => {
    const player = document.getElementById(playerId);
    if (!player) return;
    const update = () => setPlayhead(player.currentTime || 0);
    update();
    for (const event of ['timeupdate', 'seeked', 'loadedmetadata']) player.addEventListener(event, update);
    return () => {
      for (const event of ['timeupdate', 'seeked', 'loadedmetadata']) player.removeEventListener(event, update);
    };
  }, [playerId]);

  function inspect(item, reveal = false) {
    setSelectedIndex(item.index);
    onSeek(item.points[0]);
    if (reveal) nodes.current.get(item.index)?.scrollIntoView({block:'nearest', inline:'center'});
  }

  if (!selected) return <p>No source-linked observations for this answer. This does not establish that the video contains no relevant event.</p>;
  const selection = events.indexOf(selected);
  return <div className="analysis-timeline" aria-label="Model observations on the source timeline">
    <div className="analysis-timeline-toolbar">
      <p><strong>{events.length} model {events.length === 1 ? 'observation' : 'observations'}</strong><span>Player {sourceClock(playhead)}</span></p>
      <div><button type="button" className="outline-button" disabled={selection === 0} onClick={() => inspect(events[selection - 1], true)}>Previous</button><span>{selection + 1} / {events.length}</span><button type="button" className="outline-button" disabled={selection === events.length - 1} onClick={() => inspect(events[selection + 1], true)}>Next</button></div>
    </div>
    <p className="analysis-timeline-note">Select an observation to inspect its cited frames. Model claims need checking; cited spans do not establish continuous action between frames.</p>
    {!knownDuration && <p className="analysis-timeline-note">Source duration is unavailable. The ruler ends at the latest citation, not a verified video ending.</p>}
    <div className="analysis-timeline-scroll" role="region" tabIndex={0} aria-label="Scrollable model observation timeline">
      <div className="analysis-timeline-board">
        <div className="clip-timeline-ruler" aria-label="Source time">{ticks.map(time => <time key={time} style={{left:position(time)}}>{scale < 1 ? sourceClock(time) : sourceClock(time).slice(0, -4)}</time>)}</div>
        <div className="analysis-observation-tracks" style={{height:rows * 132}}>
          <div className="clip-playhead" aria-hidden="true" style={{left:position(playhead)}} />
          <ol>{events.map(item => <li key={item.index} style={{top:item.row * 132}}>
            <span className="analysis-time-anchor" aria-hidden="true" style={{left:position(item.first)}} />
            <button type="button" className="analysis-observation-node" style={{left:`min(${position(item.first)}, calc(100% - 228px))`}}
              ref={node => {if (node) nodes.current.set(item.index, node); else nodes.current.delete(item.index);}}
              aria-pressed={selected.index === item.index} aria-label={`Inspect observation ${item.index + 1} at ${sourceClock(item.first)}: ${item.event.action}`}
              onClick={() => inspect(item)}>
              <time>{sourceClock(item.first)}{item.last !== item.first ? `–${sourceClock(item.last)}` : ' · one frame'}</time>
              <strong>{item.event.action || 'Model observation'}</strong><small>{item.points.length} cited {item.points.length === 1 ? 'frame' : 'frames'}</small>
            </button>
          </li>)}</ol>
        </div>
      </div>
    </div>
    <section className="analysis-observation-detail" aria-label="Selected model observation and evidence">
      <div>
        <span className="clip-eyebrow">MODEL OBSERVATION {selected.index + 1} · CHECK AGAINST THE SOURCE</span>
        <h3>{selected.event.action || 'Model observation'}</h3>
        {selected.event.summary !== selected.event.action && <p>{selected.event.summary}</p>}
        <p className="analysis-evidence-scope">{selected.first === selected.last ? `Single cited instant: ${sourceClock(selected.first)}. No event duration is established.` : `Cited frame span: ${sourceClock(selected.first)}–${sourceClock(selected.last)}. Exact action boundaries remain unverified.`}</p>
        <button type="button" className="outline-button" onClick={() => onReplay(selected.points[0])}>Replay in player</button>
      </div>
      <div className="analysis-evidence-grid" role="region" tabIndex={0} aria-label={`All ${selected.points.length} cited frames for observation ${selected.index + 1}`}>
        {selected.points.map(frame => <figure key={`${frame.uri}:${frame.t}`}>
          <button type="button" onClick={() => onSeek(frame)} aria-label={`Seek evidence at ${sourceClock(frame.t)}`}><img src={frame.uri} loading="lazy" alt={`Cited source frame at ${sourceClock(frame.t)}`} /><time>{sourceClock(frame.t)}</time></button>
        </figure>)}
      </div>
    </section>
  </div>;
}
