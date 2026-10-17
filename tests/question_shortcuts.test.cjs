const test = require("node:test");
const assert = require("node:assert/strict");
const helpers = import("../frontend/question-shortcuts.mjs");
const record = (id, overrides = {}) => ({id, query:{id, question:"What is visible?", mode:"real", video_id:"source-A", response:{status:"partial", events:[{evidence:[{t:1}]}]}, ...overrides}});

test("saved answer shortcuts keep only the latest answer to each question on the current source", async () => {
  const {savedAnswersForSource} = await helpers;
  const state={sourceInfo:{id:"source-A"},records:[record("old"),record("wrong-video",{video_id:"source-B"}),record("failed",{question:"Failed?",response:{status:"error",events:[]}}),record("no-evidence",{question:"Absent?",response:{status:"ok",events:[]}}),record("latest"),record("fixture",{mode:"fixture"}),record("pin",{kind:"evidence"})]};
  assert.deepEqual(savedAnswersForSource(state).map(r=>r.id),["latest"]);
  assert.equal(state.records.length,7);
});
test("shortcut labels use the actual question rather than a fabricated answer", async () => {
  const {questionLabel,savedAnswersForSource}=await helpers;
  assert.equal(questionLabel("Within the first 10 seconds, find a readable graphic. What team names and scores does it show? Cite one frame."),"What team names and scores does it show?");
  assert.equal(questionLabel("At 00:01.001, what does the scoreboard show?"),"At 00:01.001, what does the scoreboard show?");
  const state={sourceInfo:{id:"source-A"},records:[1,2,3,4].map(i=>record(String(i),{question:`Question ${i}?`}))};
  assert.deepEqual(savedAnswersForSource(state).map(r=>r.id),["4","3","2"]);
});
