/* Evidence collection state shared by React panels and the existing spatial engine. */
(function (root) {
  "use strict";
  const initial = () => ({
    epoch: 0,
    title: "Untitled investigation",
    groupTitle: "Key findings",
    note: "",
    taskBrief: "",
    studyType: "ux_research",
    records: [],
    selectedId: null,
    pins: [],
    local: false,
    inspectorTab: "findings",
    sourceInfo: null,
  });
  const clock = (value) =>
    `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
  function createStore() {
    let state = initial();
    let sequence = 0;
    const listeners = new Set();
    const publish = (changes) => {
      state = { ...state, ...changes };
      listeners.forEach((fn) => fn());
    };
    const store = {
      getSnapshot: () => state,
      subscribe: (fn) => {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
      hydrate(saved) {
        const clean = { ...initial(), ...saved };
        clean.records = (saved.records || []).slice(-12);
        clean.pins = (saved.pins || []).slice(0, 8);
        sequence = Math.max(0, ...clean.pins.map(p => Number(p.id.split("-").pop()) || 0));
        publish(clean);
      },
      describe(sourceInfo) { publish({ sourceInfo }); },
      record(id, query) {
        publish({
          records: [
            ...state.records.filter((r) => r.id !== id),
            { id, query },
          ].slice(-12),
          selectedId: id,
        });
      },
      select(id) {
        if (state.records.some((r) => r.id === id) && state.selectedId !== id)
          publish({ selectedId: id });
      },
      showPanel(tab) {
        if (["context", "findings"].includes(tab) && state.inspectorTab !== tab)
          publish({ inspectorTab: tab });
      },
      rename(title) {
        publish({ title: title.slice(0, 80) });
      },
      group(title) {
        publish({ groupTitle: title.slice(0, 60) });
      },
      annotate(note) {
        publish({ note: note.slice(0, 1200) });
      },
      setTaskBrief(taskBrief) {
        publish({ taskBrief: taskBrief.slice(0, 2000) });
      },
      setStudyType(studyType) {
        if (["ux_research", "technical_sample"].includes(studyType)) publish({ studyType });
      },
      renameFinding(id, title) {
        publish({ pins: state.pins.map(pin => pin.id === id ? { ...pin, title: title.slice(0, 200) } : pin) });
      },
      editFinding(id, field, value) {
        if (!["observation", "interpretation", "openQuestions"].includes(field)) return;
        publish({ pins: state.pins.map(pin => pin.id === id
          ? { ...pin, research: { ...pin.research, [field]: value.slice(0, 2000) } } : pin) });
      },
      source(local) {
        publish({ local });
      },
      clear() {
        sequence = 0;
        publish({ ...initial(), local: state.local, epoch: state.epoch + 1 });
      },
      pinFrame(turnId, query, frame) {
        if (
          state.local ||
          (state.sourceInfo?.id && query?.response.events.some(e => e.video_id !== state.sourceInfo.id)) ||
          !query?.response.events.some((event) =>
            event.evidence.some((f) => f.uri === frame.uri && f.t === frame.t),
          )
        )
          return null;
        const existing = state.pins.find(
          (p) =>
            p.kind === "evidence" &&
            p.frame.uri === frame.uri &&
            p.frame.t === frame.t,
        );
        if (existing) return existing;
        if (state.pins.length >= 8) return null;
        const pin = {
          id: `finding-${++sequence}`,
          kind: "evidence",
          title: `Evidence ${clock(frame.t)}`,
          frame: { ...frame },
          turnId,
          query,
        };
        publish({ pins: [...state.pins, pin] });
        return pin;
      },
      pinConclusion(turnId, query) {
        if (state.local || (state.sourceInfo?.id && query?.response.events.some(e => e.video_id !== state.sourceInfo.id)) || !["ok", "partial"].includes(query?.response.status))
          return null;
        const existing = state.pins.find(
          (p) => p.kind === "conclusion" && p.query.id === query.id,
        );
        if (existing) return existing;
        if (state.pins.length >= 8) return null;
        const pin = {
          id: `finding-${++sequence}`,
          kind: "conclusion",
          title: `Finding · ${query.question}`,
          turnId,
          query,
        };
        publish({ pins: [...state.pins, pin] });
        return pin;
      },
      remove(id) {
        publish({ pins: state.pins.filter((p) => p.id !== id) });
      },
      markdown() {
        if (root.CtrlFVideoReport) return root.CtrlFVideoReport.markdown(root.CtrlFVideoReport.create(state));
        const lines = [
          `# ${state.title.trim() || "Untitled investigation"}`,
          "",
          state.sourceInfo?.id && state.sourceInfo.id !== "demo_parcel"
            ? `${state.sourceInfo.name} · Uploaded source · ${clock(state.sourceInfo.metadata?.duration || 0)}`
            : state.local
            ? "Local file · not uploaded or indexed · no model calls"
            : "Synthetic demo · 18 seconds · preset results · no model calls",
          "",
          `## ${state.groupTitle.trim() || "Key findings"}`,
          "",
        ];
        for (const pin of state.pins) {
          if (pin.kind === "evidence")
            lines.push(
              `- ${clock(pin.frame.t)} — ${pin.frame.caption}`,
              `  Source question: ${pin.query.question}`,
            );
          else {
            lines.push(
              `- ${pin.query.response.answer}`,
              `  Source question: ${pin.query.question}`,
            );
            for (const text of pin.query.response.unresolved)
              lines.push(`  Unresolved: ${text}`);
          }
        }
        if (!state.pins.length) lines.push("No saved findings yet.");
        lines.push(
          "",
          "## Investigation notes",
          "",
          state.note || "No notes yet.",
          "",
          `This investigation: ${state.records.length} questions${state.sourceInfo?.id && state.sourceInfo.id !== "demo_parcel" ? "" : "Preset"}Questions.`,
        );
        return lines.join("\n");
      },
    };
    return store;
  }
  function visiblePins(pins, kind = "all", order = "saved") {
    const result = pins.filter((pin) => kind === "all" || pin.kind === kind);
    if (order === "time")
      result.sort(
        (a, b) => (a.frame?.t ?? Infinity) - (b.frame?.t ?? Infinity),
      );
    return result;
  }
  const api = { createStore, clock, visiblePins };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CtrlFVideoWorkbenchModel = api;
})(typeof window !== "undefined" ? window : globalThis);
