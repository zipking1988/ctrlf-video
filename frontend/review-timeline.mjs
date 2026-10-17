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
