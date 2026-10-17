// Reopen results from this source; these controls never submit a model request.
export function savedAnswersForSource(state) {
  const seen = new Set();
  return [...state.records].reverse().filter(({ query }) => {
    if (query.mode !== "real" || query.video_id !== state.sourceInfo?.id || query.kind
        || !["ok", "partial"].includes(query.response?.status)
        || !query.response.events?.some(event => event.evidence?.length)) return false;
    const key = query.question.trim().toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 3);
}

export function questionLabel(question) {
  const questionSentence = question.split(/(?<=[.!?。？])\s+/u).find(sentence => /[?？]$/u.test(sentence));
  return (questionSentence || question).trim();
}
