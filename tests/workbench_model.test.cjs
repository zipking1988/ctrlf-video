const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createStore,
  visiblePins,
} = require("../src/ctrlf_video/static/workbench-model.js");
const frames = [
  { uri: "/media/demo_parcel/frames/0.jpg", t: 0, caption: "Package on the left" },
  { uri: "/media/demo_parcel/frames/13.jpg", t: 13, caption: "Package on the right" },
];
const query = {
  id: "compare",
  question: "对比前后位置",
  response: {
    status: "partial",
    answer: "可确认位置, 不能确认连续移动.",
    unresolved: ["搬运者Unknown"],
    events: [{ evidence: frames }],
  },
};
test("subscriptions return stable snapshots and selection can revisit earlier questions", () => {
  const s = createStore();
  const snapshot = s.getSnapshot();
  assert.equal(s.getSnapshot(), snapshot);
  let calls = 0;
  const off = s.subscribe(() => calls++);
  s.record("one", query);
  s.record("two", { ...query, id: "other" });
  s.select("one");
  assert.equal(s.getSnapshot().selectedId, "one");
  assert.equal(calls, 3);
  off();
  s.rename("Investigation");
  assert.equal(calls, 3);
});
test("evidence deduplication preserves references and rejects forged timestamps or sources", () => {
  const s = createStore();
  const first = s.pinFrame("one", query, frames[0]);
  assert.ok(first);
  assert.equal(s.pinFrame("two", query, frames[0]), first);
  assert.equal(s.getSnapshot().pins.length, 1);
  assert.equal(s.pinFrame("one", query, { ...frames[0], t: 11 }), null);
  assert.equal(
    s.pinFrame("one", query, { ...frames[0], uri: "file:///private.mp4" }),
    null,
  );
});
test("partial findings export unresolved details; failures and no results cannot become facts", () => {
  const s = createStore();
  s.rename("位置Investigation");
  s.group("前后核对");
  s.annotate("下一步核实搬运者");
  s.record("one", query);
  s.pinFrame("one", query, frames[1]);
  s.pinConclusion("one", query);
  const md = s.markdown();
  assert.match(md, /位置Investigation/);
  assert.match(md, /前后核对/);
  assert.match(md, /00:13/);
  assert.match(md, /Unresolved: 搬运者Unknown/);
  assert.match(md, /preset results/);
  assert.match(md, /下一步核实搬运者/);
  assert.equal(
    s.pinConclusion("one", {
      ...query,
      response: { ...query.response, status: "error" },
    }),
    null,
  );
});
test("finding limits and reset retain no stale references; local playback cannot use demo evidence", () => {
  const s = createStore();
  for (let i = 0; i < 8; i++)
    assert.ok(s.pinConclusion("one", { ...query, id: String(i) }));
  assert.equal(s.pinFrame("one", query, frames[0]), null);
  s.remove(s.getSnapshot().pins[0].id);
  assert.ok(s.pinFrame("one", query, frames[0]));
  s.source(true);
  s.clear();
  assert.equal(s.getSnapshot().local, true);
  assert.deepEqual(s.getSnapshot().pins, []);
  assert.equal(s.pinFrame("one", query, frames[0]), null);
  assert.equal(s.pinConclusion("one", query), null);
  assert.match(s.markdown(), /Local file/);
  assert.doesNotMatch(s.markdown(), /Synthetic demo/);
});
test("only twelve recent questions are retained while findings preserve their source snapshots", () => {
  const s = createStore();
  s.record("old", query);
  s.pinConclusion("old", query);
  for (let i = 0; i < 13; i++) s.record("turn-" + i, query);
  assert.equal(s.getSnapshot().records.length, 12);
  assert.equal(
    s.getSnapshot().records.some((r) => r.id === "old"),
    false,
  );
  assert.equal(s.getSnapshot().pins[0].turnId, "old");
  assert.equal(
    s.getSnapshot().pins[0].query.response.unresolved[0],
    "搬运者Unknown",
  );
});

test("panel navigation preserves investigation data and resets to the findings editor", () => {
  const s = createStore();
  s.record("one", query);
  s.pinFrame("one", query, frames[0]);
  s.annotate("核实连续性");
  const previous = s.getSnapshot();
  s.showPanel("findings");
  assert.equal(s.getSnapshot().inspectorTab, "findings");
  assert.equal(s.getSnapshot().records, previous.records);
  assert.equal(s.getSnapshot().pins, previous.pins);
  assert.equal(s.getSnapshot().selectedId, "one");
  assert.equal(s.getSnapshot().note, "核实连续性");
  const valid = s.getSnapshot();
  s.showPanel("unknown");
  assert.equal(s.getSnapshot(), valid);
  s.clear();
  assert.equal(s.getSnapshot().inspectorTab, "findings");
});

test("filtering and time sorting preserve sources without mutating the collection", () => {
  const s = createStore();
  const later = s.pinFrame("one", query, frames[1]);
  const conclusion = s.pinConclusion("one", query);
  const earlier = s.pinFrame("one", query, frames[0]);
  const original = s.getSnapshot().pins;
  assert.deepEqual(visiblePins(original, "evidence", "time"), [earlier, later]);
  assert.deepEqual(visiblePins(original, "conclusion", "time"), [conclusion]);
  assert.deepEqual(visiblePins(original, "all", "time"), [
    earlier,
    later,
    conclusion,
  ]);
  assert.deepEqual(visiblePins(original, "all", "saved"), [
    later,
    conclusion,
    earlier,
  ]);
  assert.deepEqual(original, [later, conclusion, earlier]);
  assert.equal(visiblePins(original, "evidence", "time")[0].query, query);
  assert.deepEqual(visiblePins([], "evidence", "time"), []);
});

test("research context and structured findings survive restore without changing evidence", () => {
  const s = createStore();
  s.setTaskBrief("Invite a teammate"); s.setStudyType("technical_sample");
  const pin = s.pinConclusion("task-1", query);
  const evidence = JSON.stringify(pin.query);
  s.editFinding(pin.id, "observation", "An error message is visible.");
  s.editFinding(pin.id, "interpretation", "The message may be unclear.");
  s.editFinding(pin.id, "openQuestions", "Does the next attempt succeed?");
  s.editFinding(pin.id, "query", "tampered");
  const restored = createStore(); restored.hydrate(JSON.parse(JSON.stringify(s.getSnapshot())));
  assert.equal(restored.getSnapshot().taskBrief, "Invite a teammate");
  assert.equal(restored.getSnapshot().studyType, "technical_sample");
  assert.equal(restored.getSnapshot().pins[0].research.interpretation, "The message may be unclear.");
  assert.equal(JSON.stringify(restored.getSnapshot().pins[0].query), evidence);
  restored.clear(); assert.equal(restored.getSnapshot().taskBrief, "");
  assert.equal(restored.getSnapshot().studyType, "ux_research");
});

test("finding title edits preserve source evidence and persist across hydration", () => {
  const s = createStore();
  s.record("task-1", query);
  const pin = s.pinConclusion("task-1", query);
  const originalQuery = pin.query;
  s.renameFinding(pin.id, "Package visible at center");
  s.editFinding(pin.id, "observation", "Visible in two sampled frames.");
  assert.equal(s.getSnapshot().pins[0].title, "Package visible at center");
  assert.equal(s.getSnapshot().pins[0].query, originalQuery);
  const restored = createStore();
  restored.hydrate(JSON.parse(JSON.stringify(s.getSnapshot())));
  assert.equal(restored.getSnapshot().pins[0].title, "Package visible at center");
  assert.equal(restored.getSnapshot().pins[0].research.observation, "Visible in two sampled frames.");
  s.renameFinding(pin.id, "x".repeat(250));
  assert.equal(s.getSnapshot().pins[0].title.length, 200);
});
