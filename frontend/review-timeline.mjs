// Point citations only: sampled evidence is not a continuous event breakdown.
export function citedMoments(query, duration) {
  const unique = new Map();
  for (const event of query?.response?.events || []) {
    if (query.video_id && event.video_id !== query.video_id) continue;
    for (const frame of event.evidence || []) {
      if (!Number.isFinite(frame.t) || frame.t < 0 || !frame.uri
          || (Number.isFinite(duration) && frame.t > duration)) continue;
      const key = `${frame.uri}:${frame.t}`;
      if (!unique.has(key)) unique.set(key, {...frame, description:frame.caption || event.action});
    }
  }
  return [...unique.values()].sort((a,b) => a.t-b.t);
}

export function sourceClock(seconds) {
  const total = Math.round(Math.max(0, seconds) * 1000);
  const pad = value => String(value).padStart(2,"0");
  const hours = Math.floor(total/3600000);
  return `${hours ? `${pad(hours)}:` : ""}${pad(Math.floor(total/60000)%60)}:${pad(Math.floor(total/1000)%60)}.${String(total%1000).padStart(3,"0")}`;
}

// Event start/end can be a legacy search-window scope. Timeline placement uses
// only the current source's validated, decoded frame references.
export function analysisEvents(query, duration) {
  const events = (query?.response?.events || []).slice(0, 100).flatMap((event, index) => {
    const points = citedMoments({...query, response:{events:[event]}}, duration);
    if (!points.length) return [];
    return [{index, event, points, first:points[0].t, last:points.at(-1).t}];
  }).sort((a, b) => a.first - b.first || a.index - b.index);
  const knownDuration = Number.isFinite(duration) && duration > 0;
  const scale = knownDuration ? duration : Math.max(1, ...events.map(item => item.last));
  // Pack cards into separate rows rather than imply one continuous event. The
  // plot is at least 1132px; clamped end cards keep their exact-time marker.
  const ends = [];
  for (const item of events) {
    const left = Math.min(item.first / scale * 1132, 1132 - 228);
    let row = ends.findIndex(end => end + 12 <= left);
    if (row < 0) row = ends.length;
    ends[row] = left + 228;
    item.row = row;
  }
  return {events, rows:ends.length, scale, knownDuration};
}
