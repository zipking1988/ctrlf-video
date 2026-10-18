/* Deterministic deferred-network regressions for durable workspace ownership. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { createStore } = require("../src/ctrlf_video/static/workbench-model.js");
const findingActions = import("../frontend/finding-editor-actions.mjs");
const report = require("../src/ctrlf_video/static/investigation-report.js");
const tick = () => new Promise(setImmediate);
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
const answer = (id, video = "video-A") => ({
  id, question: `Question ${id}`, mode: "real", video_id: video,
  response: { schema_version: "0.1", status: "ok", answer: id, events: [], unresolved: [], errors: [], followups: [], trace: { visible: { segments_reviewed: 1 } } },
});
class Element {
  constructor() {
    this.children = []; this.dataset = {}; this.value = ""; this.hidden = false;
    this.attributes = {}; this.listeners = {}; this.style = {}; this.classes = new Set();
    this.firstChild = { textContent: "" };
    this.classList = { add: x => this.classes.add(x), remove: x => this.classes.delete(x), contains: x => this.classes.has(x), toggle: (x, on) => on ? this.classes.add(x) : this.classes.delete(x) };
  }
  set className(value) { this.classes = new Set(value.split(" ")); }
  get className() { return [...this.classes].join(" "); }
  append(...nodes) { nodes.forEach(n => { n.parent = this; this.children.push(n); }); }
  prepend(node) { node.parent = this; this.children.unshift(node); }
  replaceChildren(...nodes) { this.children = nodes; }
  remove() { this.parent.children = this.parent.children.filter(n => n !== this); }
  get firstElementChild() { return this.children[0]; }
  setAttribute(key, value) { this.attributes[key] = value; }
  getAttribute(key) { return this.attributes[key] ?? null; }
  removeAttribute(key) { delete this.attributes[key]; }
  addEventListener(key, fn) { (this.listeners[key] ||= []).push(fn); }
  close() { this.open = false; }
  showModal() { this.open = true; }
  focus() {}
  load() {}
  pause() { this.paused = true; }
  scrollIntoView() {}
  querySelector() { return new Element(); }
}
async function harness({ state = {}, requests = [], job = "ready", realReady = true, blockers = [], starter = false, empty = false } = {}) {
  const store = createStore(), ids = new Map(), calls = [], answers = [], timers = new Map(), entries = [], uploads = [];
  let seq = 100, timerSeq = 0, ready = false, busy = false, context = null, override = null, now = 0;
  const get = id => { if (!ids.has(id)) ids.set(id, new Element()); return ids.get(id); };
  const desks = new Map([
    ["desk-A", { id: "desk-A", video: "video-A", title: "A", revision: 1, state }],
    ["desk-B", { id: "desk-B", video: "video-B", title: "B", revision: 1, state: {} }],
  ]);
  if (starter) { desks.delete("desk-B"); Object.assign(desks.get("desk-A"), { video: "demo_parcel", title: "Untitled investigation" }); }
  if (empty) desks.clear();
  const videos = new Map([
    ["video-A", { id: "video-A", name: "A.mp4", metadata: { windows: 1 }, bytes: 10, job: { state: job } }],
    ["video-B", { id: "video-B", name: "B.mp4", metadata: { windows: 1 }, bytes: 10, job: { state: "ready" } }],
  ]);
  const requestLists = new Map([["desk-A", requests], ["desk-B", []]]);
  const ui = {
    entryReady: welcome => entries.push(welcome),
    ready: () => ready, busy: value => { busy = value; }, notify: value => { get("notice").textContent = value; },
    snapshot: () => ({ ...store.getSnapshot(), ui: { draft: get("question").value } }),
    currentContext: () => context, showSource() {},
    restore(saved, video) { store.hydrate({ ...saved, sourceInfo: video, local: video.job?.state !== "ready" }); get("question").value = saved.ui?.draft || ""; },
    applySource(video) { store.clear(); store.describe(video); store.source(video.job?.state !== "ready"); get("question").value = ""; },
    restoreDraft: value => { get("question").value = value; },
    answer(query, submittedDraft) {
      answers.push(query); store.record(`task-${++seq}`, query);
      if (submittedDraft !== undefined && get("question").value.trim() === submittedDraft) get("question").value = "";
    },
  };
  const fetch = async (url, options = {}) => {
    const call = { url, method: options.method || "GET", body: options.body && JSON.parse(options.body) };
    calls.push(call);
    const special = override?.(call);
    if (special !== undefined) return special;
    if (url === "/api/session") return response({ csrf: "csrf", owner_id: "owner-A", ttl_hours: 24, real_ready: realReady, blockers });
    if (url === "/api/investigations" && call.method === "GET") return response({ items: [...desks.values()] });
    if (url === "/api/investigations" && call.method === "POST") {
      const desk = { id: "new-demo", video: call.body.video_id, title: call.body.title, revision: 1, state: {} };
      desks.set(desk.id, desk); return response(desk, 201);
    }
    if (url === "/api/videos") return response({ items: [...videos.values()] });
    const video = url.match(/^\/api\/videos\/([^/]+)$/);
    if (video) return response(videos.get(video[1]));
    const req = url.match(/^\/api\/investigations\/([^/]+)\/requests$/);
    if (req) return response({ items: requestLists.get(req[1]) || [] });
    const deskMatch = url.match(/^\/api\/investigations\/([^/]+)$/);
    if (deskMatch) {
      const desk = desks.get(deskMatch[1]);
      if (call.method === "DELETE") { desks.delete(desk.id); return response(null, 204); }
      if (call.method === "PUT") { desk.state = call.body.state; return response({ revision: ++desk.revision }); }
      return response({ ...desk });
    }
    if (url === "/api/chat/prepare") return response({ kind: "ready" });
    throw new Error(`Unexpected request: ${call.method} ${url}`);
  };
  const window = { CtrlFVideoSessionUI: ui, CtrlFVideoWorkbench: store, addEventListener() {} };
  const sandbox = vm.createContext({ window, document: { getElementById: get, createElement: () => new Element(), addEventListener() {} }, fetch,
    Date: class extends Date { static now() { return now; } },
    XMLHttpRequest: class {
      constructor() { this.upload = {}; this.status = 201; this.responseText = JSON.stringify({ id: "uploaded-video" }); }
      open() {}
      setRequestHeader() {}
      send(file) {
        uploads.push(file);
        videos.set("uploaded-video", { id: "uploaded-video", name: file.name, job: { state: "awaiting_configuration" } });
        this.onload();
      }
    },
    localStorage: { getItem: () => "desk-A", setItem() {} }, crypto: { randomUUID: () => `request-${++seq}` },
    setTimeout: (fn, delay) => { const id = ++timerSeq; timers.set(id, { fn, delay }); return id; }, clearTimeout: id => timers.delete(id),
  });
  // Expose closure entry points in the VM only; production source is unchanged.
  const source = fs.readFileSync(require.resolve("../src/ctrlf_video/static/workspace.js"), "utf8")
    .replace("window.CtrlFVideoPersistence={flush,", "window.testWorkspace={start,openDesk,openSource,recover,confirmDelete,showRuntime,get:()=>({current,currentVideo,activeRequest,requestEpoch})}; window.CtrlFVideoPersistence={flush,");
  vm.runInContext(source, sandbox);
  ready = true; await window.testWorkspace.start();
  return { store, get, calls, answers, desks, videos, requestLists, ui, window, timers, entries, uploads,
    get busy() { return busy; }, setContext(value) { context = value; }, setOverride(fn) { override = fn; },
    async timer(delay, {latest=false}={}) { const matching = [...timers].filter(([, timer]) => timer.delay === delay); const entry=latest ? matching.at(-1) : matching[0]; assert.ok(entry, `Missing ${delay}ms timer`); timers.delete(entry[0]); now += delay; entry[1].fn(); await tick(); },
  };
}

test("successful upload saves the previous draft and opens the new investigation", async () => {
  const h = await harness();
  h.get("question").value = "Keep the original draft";
  await h.window.CtrlFVideoPersistence.upload({ name: "recording.mp4", type: "video/mp4", size: 1024 });
  assert.equal(h.uploads.length, 1);
  assert.equal(h.window.testWorkspace.get().current.video, "uploaded-video");
  assert.equal(h.desks.get("desk-A").state.ui.draft, "Keep the original draft");
  assert.match(h.get("notice").textContent, /Upload complete/);
});

test("preflight distinguishes preview mode, blocked sessions and explicitly started analysis", async () => {
  for (const scenario of [
    {realReady:false, blockers:["fixture_mode_no_model_requests"], notice:/Live analysis is disabled.*preview mode/},
    {realReady:false, blockers:["budget_not_approved_or_insufficient"], notice:/blocked for this browser session.*Model setup/},
    {realReady:true, blockers:[], notice:/Ready to start analysis.*Sources.*Start analysis/},
  ]) {
    const h=await harness({...scenario,job:"queued"});
    h.get("question").value="Keep my question";
    h.videos.get("video-A").job={state:"awaiting_configuration"};
    await h.timer(2000);
    assert.match(h.get("notice").textContent,scenario.notice);
    assert.equal(h.get("question").value,"Keep my question");
    assert.equal(h.calls.some(c=>/\/analyze|\/chat/.test(c.url)),false);
  }
});

test("source status identifies the current recording when uploaded names are identical", async () => {
  const h=await harness({job:"awaiting_configuration"});
  for(const video of h.videos.values()) video.name="Same recording.mp4";
  h.get("question").value="Keep this question";
  const before=h.calls.length;
  await h.window.CtrlFVideoPersistence.library("videos");
  const rows=h.get("library-items").children.slice(1);
  assert.match(rows[0].children[0].children[1].textContent,/Current source/);
  assert.ok(!rows[1].children[0].children[1].textContent.includes("Current source"));
  assert.equal(h.get("question").value,"Keep this question");
  assert.ok(h.calls.slice(before).every(c=>c.method==="GET" || c.method==="PUT"));
  assert.equal(h.calls.slice(before).some(c=>/\/analyze|\/chat/.test(c.url)),false);
});

test("prepared example question transfers only as a draft into the new owned investigation", async () => {
  const h=await harness();
  h.get("question").value="Existing private draft";
  await h.window.CtrlFVideoPersistence.upload({name:"Basketball.mp4",type:"video/mp4",size:1024},{initialDraft:"Why does the score decrease?"});
  assert.equal(h.get("question").value,"Why does the score decrease?");
  assert.equal(h.desks.get("desk-A").state.ui.draft,"Existing private draft");
  await h.window.CtrlFVideoPersistence.flush();
  assert.equal(h.desks.get("new-demo").state.ui.draft,"Why does the score decrease?");
  assert.equal(h.store.getSnapshot().records.length,0);
  assert.equal(h.calls.some(c=>/analyze|chat/.test(c.url)),false);
});

test("prepared question does not overwrite text entered while the new desk is saving", async () => {
  const h=await harness(),saving=deferred();let held=false;
  h.setOverride(c=>{if(c.url==="/api/investigations/new-demo" && c.method==="PUT" && !held){held=true;return saving.promise;}});
  const uploading=h.window.CtrlFVideoPersistence.upload({name:"Basketball.mp4",type:"video/mp4",size:1024},{initialDraft:"Prepared question"});
  await tick();assert.equal(held,true);h.get("question").value="Newly typed question";
  saving.resolve(response({revision:2}));await uploading;
  assert.equal(h.get("question").value,"Newly typed question");
});

test("uploaded source creation failure keeps the draft and explains recovery without another upload", async () => {
  const h = await harness();
  h.get("question").value = "Keep the original draft";
  h.setOverride(c => c.url === "/api/investigations" && c.method === "POST"
    ? response({ detail: "workspace_backend_unavailable" }, 503) : undefined);
  await h.window.CtrlFVideoPersistence.upload({ name: "recording.mp4", type: "video/mp4", size: 1024 });
  assert.equal(h.uploads.length, 1);
  assert.equal(h.window.testWorkspace.get().current.id, "desk-A");
  assert.equal(h.get("question").value, "Keep the original draft");
  assert.match(h.get("notice").textContent, /video was uploaded.*Open Sources.*instead of uploading it again/);
});

test("late uploaded source creation failure cannot notify a newer investigation", async () => {
  const h = await harness(), creating = deferred();
  h.setOverride(c => c.url === "/api/investigations" && c.method === "POST" ? creating.promise : undefined);
  const uploading = h.window.CtrlFVideoPersistence.upload({ name: "recording.mp4", type: "video/mp4", size: 1024 }, {initialDraft:"Must not leak to desk B"});
  await tick();
  assert.ok(h.calls.some(c => c.url === "/api/investigations" && c.method === "POST"));
  await h.window.testWorkspace.openDesk("desk-B");
  h.get("question").value = "New investigation draft";
  h.get("notice").textContent = "New investigation notice";
  creating.resolve(response({ detail: "workspace_backend_unavailable" }, 503));
  await uploading;
  assert.equal(h.window.testWorkspace.get().current.id, "desk-B");
  assert.equal(h.get("question").value, "New investigation draft");
  assert.equal(h.get("notice").textContent, "New investigation notice");
});

test("new visitors and untouched demo desks enter through the research welcome without model dispatch", async () => {
  for (const options of [{ empty: true }, { starter: true }]) {
    const h = await harness(options);
    assert.deepEqual(h.entries, [true]);
    assert.ok(h.window.testWorkspace.get().current);
    assert.equal(h.calls.some(c => /analyze|chat|prepare/.test(c.url)), false);
  }
});

test("returning recordings, research context and unsent drafts bypass the welcome screen", async () => {
  for (const options of [{}, { starter: true, state: { ui: { draft: "Keep this question" } } },
    { starter: true, state: { taskBrief: "Complete checkout" } },
    { starter: true, state: { note: "Observation to keep" } },
    { starter: true, state: { title: "My review" } },
    { starter: true, state: { records: [{ id: "task-1", query: answer("saved") }] } }]) {
    const h = await harness(options);
    assert.deepEqual(h.entries, [false]);
    if (options.state?.ui?.draft) assert.equal(h.get("question").value, options.state.ui.draft);
    if (options.state?.taskBrief) assert.equal(h.store.getSnapshot().taskBrief, options.state.taskBrief);
  }
});

test("failed source listing shows an in-dialog error and permits refresh without losing the draft", async () => {
  const h = await harness();
  h.get("question").value = "Keep this unsent question";
  h.setOverride(c => c.url === "/api/videos" ? response({ detail: "source_list_unavailable" }, 503) : undefined);
  await h.window.CtrlFVideoPersistence.library("videos");
  assert.equal(h.get("workspace-library").open, true);
  assert.match(h.get("library-notice").textContent, /source_list_unavailable/);
  assert.equal(typeof h.get("library-refresh").onclick, "function");
  assert.equal(h.get("question").value, "Keep this unsent question");
  h.setOverride(null);
  await h.get("library-refresh").onclick();
  assert.equal(h.get("library-notice").textContent, "");
  assert.equal(h.get("library-items").children.length, 3);
  assert.equal(h.get("question").value, "Keep this unsent question");
});

test("a failed source exposes its error and retained progress without dispatching another attempt", async () => {
  const h = await harness();
  h.videos.get("video-A").job = {state:"failed", error:"model_unknown", completed:1, total:2};
  await h.window.CtrlFVideoPersistence.library("videos");
  const row = h.get("library-items").children[1];
  assert.match(row.children[0].children[1].textContent, /1\/2 windows/);
  assert.match(row.children[0].children.find(c => c.className === "library-job-error").textContent, /model_unknown.*Completed windows are retained/);
  assert.equal(row.children.find(c => c.textContent === "Start analysis").disabled, true);
  assert.equal(h.calls.some(c => c.method === "POST"), false);
});

test("a stale source-list failure cannot replace the current investigation library notice", async () => {
  const h = await harness(), pending = deferred();
  h.setOverride(c => c.url === "/api/videos" ? pending.promise : undefined);
  const oldLibrary = h.window.CtrlFVideoPersistence.library("videos");
  await tick();
  await h.window.CtrlFVideoPersistence.library();
  pending.resolve(response({ detail: "stale_source_failure" }, 503));
  await oldLibrary;
  assert.equal(h.get("library-title").textContent, "Investigations");
  assert.equal(h.get("library-notice").textContent, "");
  assert.equal(h.get("library-items").children.length, 2);
});

for (const { name, resultContext, inputContext, expected } of [
  { name: "completed-result context", resultContext: { task_brief: "", study_type: "ux_research" }, inputContext: {}, expected: { task_brief: "", study_type: "ux_research" } },
  { name: "legacy input-only context", resultContext: {}, inputContext: { task_brief: "Inspect the menu", study_type: "technical_sample" }, expected: { task_brief: "Inspect the menu", study_type: "technical_sample" } },
  { name: "missing legacy context", resultContext: {}, inputContext: {}, expected: { task_brief: "", study_type: null } },
  { name: "result precedence including an empty brief", resultContext: { task_brief: "", study_type: "ux_research" }, inputContext: { task_brief: "Older context", study_type: "technical_sample" }, expected: { task_brief: "", study_type: "ux_research" } },
]) {
  test(`recovery preserves ${name} in saved state and reports`, async () => {
    const request = { id: "recovered-context", state: "done", result: { ...answer("recovered-context"), ...resultContext }, input: { question: "Find the menu", ...inputContext } };
    const h = await harness({ state: { taskBrief: "Current desk context must not replace submission", studyType: "technical_sample" }, requests: [request] });
    const saved = h.desks.get("desk-A").state.records[0].query;
    const exported = report.create(h.store.getSnapshot()).questions[0];
    for (const field of ["task_brief", "study_type"]) {
      assert.equal(saved[field], expected[field]);
      assert.equal(exported[field], expected[field]);
    }
  });
}

test("failed deletion retains the active investigation and subsequent autosave", async () => {
  const h = await harness();
  h.setOverride(c => c.method === "DELETE" ? response({ detail: "delete_failed" }, 500) : undefined);
  h.window.testWorkspace.confirmDelete(h.desks.get("desk-A"), "investigations");
  await h.get("delete-confirm").onclick();
  assert.equal(h.window.testWorkspace.get().current.id, "desk-A");
  h.store.annotate("saved after failed deletion"); await h.window.CtrlFVideoPersistence.flush();
  assert.equal(h.desks.get("desk-A").state.note, "saved after failed deletion");
  assert.equal(h.busy, false);
});

test("navigation drains note and draft edits made while the first save is pending", async () => {
  const h = await harness(), firstSave = deferred(); let saves = 0;
  h.store.annotate("before save"); h.get("question").value = "before draft";
  h.setOverride(c => c.url === "/api/investigations/desk-A" && c.method === "PUT" && ++saves === 1 ? firstSave.promise : undefined);
  const navigation = h.window.testWorkspace.openDesk("desk-B"); await tick();
  h.store.annotate("latest note"); h.get("question").value = "latest draft";
  firstSave.resolve(response({ revision: 2 })); await navigation;
  const writes = h.calls.filter(c => c.url === "/api/investigations/desk-A" && c.method === "PUT");
  assert.equal(writes.length, 2); assert.equal(writes[1].body.revision, 2);
  assert.equal(h.desks.get("desk-A").state.note, "latest note");
  assert.equal(h.desks.get("desk-A").state.ui.draft, "latest draft");
  const lastWrite = h.calls.indexOf(writes[1]);
  const restoreFetch = h.calls.findIndex(c => c.url === "/api/investigations/desk-B" && c.method === "GET");
  assert.ok(lastWrite < restoreFetch); assert.equal(h.window.testWorkspace.get().current.id, "desk-B");
});

test("a failed draining save keeps the edited desk active and preserves its CAS error", async () => {
  const h = await harness(), firstSave = deferred(); let saves = 0;
  h.store.annotate("before save");
  h.setOverride(c => {
    if (c.url !== "/api/investigations/desk-A" || c.method !== "PUT") return;
    return ++saves === 1 ? firstSave.promise : response({ detail: "revision_conflict" }, 409);
  });
  const navigation = h.window.testWorkspace.openDesk("desk-B"); await tick();
  h.store.annotate("latest note"); h.get("question").value = "latest draft";
  firstSave.resolve(response({ revision: 2 }));
  await assert.rejects(navigation, /revision_conflict/);
  assert.equal(h.window.testWorkspace.get().current.id, "desk-A");
  assert.equal(h.store.getSnapshot().note, "latest note"); assert.equal(h.get("question").value, "latest draft");
  assert.equal(h.get("save-state").dataset.state, "error");
});

test("a clean navigation still saves edits made during its target desk GET", async () => {
  const h = await harness(), target = deferred();
  h.setOverride(c => c.url === "/api/investigations/desk-B" && c.method === "GET" ? target.promise : undefined);
  const navigation = h.window.testWorkspace.openDesk("desk-B"); await tick();
  h.store.rename("Latest title"); h.store.annotate("Latest note"); h.get("question").value = "Latest draft";
  target.resolve(response(h.desks.get("desk-B"))); await navigation;
  assert.equal(h.desks.get("desk-A").state.title, "Latest title");
  assert.equal(h.desks.get("desk-A").state.note, "Latest note");
  assert.equal(h.desks.get("desk-A").state.ui.draft, "Latest draft");
  assert.equal(h.window.testWorkspace.get().current.id, "desk-B");
});

test("target video GET remains within the old desk's saving boundary", async () => {
  const h = await harness(), video = deferred();
  h.setOverride(c => c.url === "/api/videos/video-B" ? video.promise : undefined);
  const navigation = h.window.testWorkspace.openDesk("desk-B"); await tick();
  h.store.annotate("Edited during video fetch"); h.get("question").value = "Video fetch draft";
  video.resolve(response(h.videos.get("video-B"))); await navigation;
  assert.equal(h.desks.get("desk-A").state.note, "Edited during video fetch");
  assert.equal(h.desks.get("desk-A").state.ui.draft, "Video fetch draft");
});

test("new-desk POST saves last edits to the old desk before clearing its canvas", async () => {
  const h = await harness(), created = deferred();
  h.setOverride(c => c.url === "/api/investigations" && c.method === "POST" ? created.promise : undefined);
  const navigation = h.window.CtrlFVideoPersistence.newInvestigation(); await tick();
  h.store.annotate("Edited during creation"); h.get("question").value = "Creation draft";
  const desk = { id: "created", video: "video-A", title: "New", state: {}, revision: 1 };
  h.desks.set(desk.id, desk); created.resolve(response(desk, 201)); await navigation;
  assert.equal(h.desks.get("desk-A").state.note, "Edited during creation");
  assert.equal(h.desks.get("desk-A").state.ui.draft, "Creation draft");
  assert.equal(h.window.testWorkspace.get().current.id, "created");
});

test("reopening the same desk does not restore a fetched snapshot older than the final save", async () => {
  const h = await harness(), target = deferred();
  const stale = { ...h.desks.get("desk-A"), state: structuredClone(h.desks.get("desk-A").state) };
  h.setOverride(c => c.url === "/api/investigations/desk-A" && c.method === "GET" ? target.promise : undefined);
  const navigation = h.window.testWorkspace.openDesk("desk-A"); await tick();
  h.store.annotate("Latest same-desk note"); h.get("question").value = "Latest same-desk draft";
  target.resolve(response(stale)); await navigation;
  assert.equal(h.store.getSnapshot().note, "Latest same-desk note");
  assert.equal(h.get("question").value, "Latest same-desk draft");
  assert.equal(h.window.testWorkspace.get().current.revision, h.desks.get("desk-A").revision);
});

test("same-desk reopening still accepts a newer server revision when local state is clean", async () => {
  const h = await harness();
  h.desks.get("desk-A").revision = 2;
  h.desks.get("desk-A").state = { note: "Edited by another tab", ui: { draft: "Server draft" } };
  await h.window.testWorkspace.openDesk("desk-A");
  assert.equal(h.store.getSnapshot().note, "Edited by another tab");
  assert.equal(h.get("question").value, "Server draft");
  assert.equal(h.window.testWorkspace.get().current.revision, 2);
});

test("old-desk edits during request cancellation are saved before navigation restores", async () => {
  const h = await harness({ requests: [{ id: "running", state: "running", input: { question: "Running query" } }] }), cancelled = deferred();
  h.setOverride(c => c.url.endsWith("/cancel") ? cancelled.promise : undefined);
  const navigation = h.window.testWorkspace.openDesk("desk-B"); await tick();
  h.store.annotate("Cancellation note"); h.get("question").value = "Cancellation draft";
  cancelled.resolve(response(answer("cancelled"))); await navigation;
  assert.equal(h.desks.get("desk-A").state.note, "Cancellation note");
  assert.equal(h.desks.get("desk-A").state.ui.draft, "Cancellation draft");
});

test("advancing playback time alone does not cause another draining save", async () => {
  const h = await harness(), first = deferred(); const original = h.ui.snapshot; let time = 1;
  h.ui.snapshot = () => { const state = original(); return { ...state, ui: { ...state.ui, playerTime: time++ } }; };
  h.store.annotate("Durable edit");
  h.setOverride(c => c.url === "/api/investigations/desk-A" && c.method === "PUT" ? first.promise : undefined);
  const saving = h.window.CtrlFVideoPersistence.flush(); await tick();
  first.resolve(response({ revision: 2 })); await saving;
  const writes = h.calls.filter(c => c.url === "/api/investigations/desk-A" && c.method === "PUT");
  assert.equal(writes.length, 1); assert.ok(writes[0].body.state.ui.playerTime > 0);
});

test("settled citation seeks and pauses persist position without another edit", async () => {
  const h = await harness();
  const original = h.ui.snapshot;
  let time = 0;
  h.ui.snapshot = () => { const state = original(); return { ...state, ui: { ...state.ui, playerTime: time } }; };
  await h.window.CtrlFVideoPersistence.flush();
  for (const [event, position] of [["seeked", 6], ["pause", 10]]) {
    time = position;
    h.get("player").listeners[event].forEach(listener => listener());
    await h.timer(500);
    assert.equal(h.desks.get("desk-A").state.ui.playerTime, position);
  }
  h.get("player").listeners.pause.forEach(listener => listener());
  assert.equal(h.timers.size, 0);
});

test("deletion cancels the request before deleting and can create the fallback desk", async () => {
  const h = await harness(), query = deferred();
  h.setOverride(c => c.url === "/api/chat" ? query.promise : c.url.endsWith("/cancel") ? response(answer("cancelled")) : undefined);
  const ask = h.window.CtrlFVideoPersistence.ask("query"); await tick();
  h.window.testWorkspace.confirmDelete(h.desks.get("desk-A"), "investigations");
  await h.get("delete-confirm").onclick();
  const cancelIndex = h.calls.findIndex(c => c.url.endsWith("/cancel"));
  const deleteIndex = h.calls.findIndex(c => c.method === "DELETE");
  assert.ok(cancelIndex >= 0 && cancelIndex < deleteIndex);
  assert.equal(h.window.testWorkspace.get().current.video, "demo_parcel");
  query.resolve(response(answer("late"))); await ask;
  assert.equal(h.answers.length, 0);
  assert.equal(h.busy, false);
});

test("delayed recovery cannot import old answers or overwrite the new desk draft", async () => {
  const h = await harness(), recovery = deferred();
  h.desks.get("desk-B").video = "video-A";
  h.desks.get("desk-B").state.ui = { draft: "B draft" };
  h.setOverride(c => c.url === "/api/investigations/desk-A/requests" ? recovery.promise : undefined);
  const pending = h.window.testWorkspace.recover();
  await h.window.testWorkspace.openDesk("desk-B");
  recovery.resolve(response({ items: [{ id: "old", state: "done", result: answer("old") }] })); await pending;
  assert.equal(h.answers.length, 0); assert.equal(h.get("question").value, "B draft");
  assert.equal(h.window.testWorkspace.get().current.id, "desk-B");
});

test("latest twelve recovery candidates preserve existing turn and finding origin IDs", async () => {
  const records = Array.from({ length: 12 }, (_, j) => ({ id: `task-${j + 2}`, query: answer(`q${j + 2}`) }));
  const pin = { id: "finding-1", kind: "conclusion", turnId: "task-2", query: records[0].query };
  const requests = Array.from({ length: 13 }, (_, j) => ({ id: `q${13 - j}`, state: "done", result: answer(`q${13 - j}`) }));
  const h = await harness({ state: { records, pins: [pin] }, requests });
  assert.equal(h.answers.length, 0);
  assert.deepEqual(h.store.getSnapshot().records.map(r => r.id), records.map(r => r.id));
  assert.equal(h.store.getSnapshot().pins[0].turnId, "task-2");
  await h.window.testWorkspace.recover(); assert.equal(h.answers.length, 0);
});

test("new recovered results preserve drafts, restore the submitted parent and persist immediately", async () => {
  const first = answer("first");
  const h = await harness({ state: { records: [{ id: "task-1", query: first }], ui: { draft: "unsent draft" } } });
  h.requestLists.set("desk-A", [{ id: "second", state: "done", input: { parent_request_id: "first" }, result: answer("second") }]);
  await h.window.testWorkspace.recover();
  assert.equal(h.answers[0].parentTurn, "task-1"); assert.equal(h.get("question").value, "unsent draft");
  assert.ok(h.desks.get("desk-A").state.records.some(r => r.query.id === "second"));
});

test("selection changes while asking do not rewrite the actual parent or next draft", async () => {
  const h = await harness(), query = deferred();
  const parent = answer("first"); parent.response.events=[{start:1,end:2,evidence:[{t:1,uri:"/frame.jpg"}]}];
  h.store.record("task-1", parent); h.setContext(parent);
  h.get("question").value = "submitted";
  h.setOverride(c => c.url === "/api/chat" ? query.promise : undefined);
  const pending = h.window.CtrlFVideoPersistence.ask("submitted"); await tick();
  h.store.record("task-2", answer("other")); h.get("question").value = "next question draft";
  query.resolve(response(answer("completed"))); await pending;
  assert.equal(h.calls.find(c => c.url === "/api/chat").body.parent_request_id, "first");
  assert.equal(h.answers[0].parentTurn, "task-1"); assert.equal(h.get("question").value, "next question draft");
});

test("a failed answer cannot become the parent of the next question", async () => {
  const h=await harness(), failed=answer("failed");
  failed.response.status="error"; h.setContext(failed);
  h.setOverride(c=>c.url==="/api/chat" ? response(answer("new-result")) : undefined);
  await h.window.CtrlFVideoPersistence.ask("What team is visible?");
  assert.equal(h.calls.find(c=>c.url==="/api/chat/prepare").body.parent_request_id,null);
  assert.equal(h.calls.find(c=>c.url==="/api/chat").body.parent_request_id,null);
});

test("unfunded new analysis is explained without creating another failed request", async () => {
  const h=await harness({realReady:false}); h.get("question").value="Keep my question";
  await h.window.CtrlFVideoPersistence.ask("Keep my question");
  assert.equal(h.calls.some(c=>c.url.startsWith("/api/chat")),false);
  assert.match(h.get("notice").textContent,/New analysis is unavailable/);
  assert.equal(h.get("question").value,"Keep my question");
});

test("a fresh root question does not gain a parent from the old selected record", async () => {
  const h = await harness(); h.store.record("task-1", answer("first"));
  h.setOverride(c => c.url === "/api/chat" ? response(answer("root")) : undefined);
  await h.window.CtrlFVideoPersistence.ask("root question");
  assert.equal(h.answers[0].parentTurn, null);
});

test("a pending request survives the polling limit and is available for recovery and cancellation", async () => {
  const h = await harness();
  h.setOverride(c => c.url === "/api/chat" ? response({ kind: "query_control", state: "pending" }) : undefined);
  const ask = h.window.CtrlFVideoPersistence.ask("long query"); await tick();
  // Polling and elapsed feedback can have the same delay; drive the network
  // wait rather than accidentally consuming only the independent UI heartbeat.
  for (let i = 0; i < 15; i++) await h.timer(Math.min(10000, 3000 + i * 500), {latest:true});
  await ask;
  assert.ok(h.window.testWorkspace.get().activeRequest); assert.equal(h.get("resume-query").hidden, false);
  const dispatched = h.calls.filter(c => c.url === "/api/chat").length;
  await h.window.CtrlFVideoPersistence.ask("duplicate");
  assert.equal(h.calls.filter(c => c.url === "/api/chat").length, dispatched);
  h.setOverride(c => c.url.endsWith("/cancel") ? response(answer("cancelled")) : undefined);
  await h.window.testWorkspace.openDesk("desk-B");
  assert.equal(h.window.testWorkspace.get().current.id, "desk-B"); assert.equal(h.window.testWorkspace.get().activeRequest, null);
});

test("a delayed A response cannot stop B's busy indicator or add an A result", async () => {
  const h = await harness(), a = deferred(), b = deferred(); let dispatches = 0;
  h.setOverride(c => c.url === "/api/chat" ? (++dispatches === 1 ? a.promise : b.promise) : c.url.endsWith("/cancel") ? response(answer("cancelled")) : undefined);
  const askA = h.window.CtrlFVideoPersistence.ask("A"); await tick();
  await h.window.testWorkspace.openDesk("desk-B");
  const askB = h.window.CtrlFVideoPersistence.ask("B"); await tick(); assert.equal(h.busy, true);
  a.resolve(response(answer("late-A"))); await askA;
  assert.equal(h.busy, true); assert.equal(h.answers.length, 0);
  b.resolve(response(answer("B-result", "video-B"))); await askB; assert.equal(h.busy, false);
});

test("the latest navigation wins even when an earlier desk fetch resolves last", async () => {
  const h = await harness(), a = deferred();
  h.setOverride(c => c.url === "/api/investigations/desk-A" && c.method === "GET" ? a.promise : undefined);
  const first = h.window.testWorkspace.openDesk("desk-A"); await tick();
  await h.window.testWorkspace.openDesk("desk-B");
  a.resolve(response(h.desks.get("desk-A"))); await first;
  assert.equal(h.window.testWorkspace.get().current.id, "desk-B");
});

test("source selection owns navigation before its source-to-desk lookup completes", async () => {
  const h = await harness(), firstLookup = deferred(), secondLookup = deferred(); let lookups = 0;
  h.setOverride(c => c.url === "/api/investigations" && c.method === "GET" ? (++lookups === 1 ? firstLookup.promise : secondLookup.promise) : undefined);
  const first = h.window.testWorkspace.openSource(h.videos.get("video-A")); await tick();
  const second = h.window.testWorkspace.openSource(h.videos.get("video-B")); await tick();
  firstLookup.resolve(response({ items: [...h.desks.values()] })); await first;
  secondLookup.resolve(response({ items: [...h.desks.values()] })); await second;
  assert.equal(h.window.testWorkspace.get().current.id, "desk-B");
});

test("a watcher rechecks ownership after its awaited save before restoring a source", async () => {
  const h = await harness({ job: "captioning" }), saving = deferred();
  h.store.annotate("unsaved note"); h.videos.get("video-A").job.state = "ready";
  h.setOverride(c => c.method === "PUT" && c.url.endsWith("desk-A") ? saving.promise : undefined);
  await h.timer(2000);
  const switchDesk = h.window.testWorkspace.openDesk("desk-B"); await tick();
  saving.resolve(response({ revision: 2 })); await switchDesk; await tick();
  assert.equal(h.window.testWorkspace.get().currentVideo.id, "video-B");
  assert.equal(h.store.getSnapshot().sourceInfo.id, "video-B");
});

test("reopening a processing source starts a new watcher and enables it when ready", async () => {
  const h = await harness(); h.videos.get("video-B").job.state = "indexing";
  await h.window.testWorkspace.openDesk("desk-B"); h.videos.get("video-B").job.state = "ready";
  await h.timer(2000);
  assert.equal(h.store.getSnapshot().local, false); assert.equal(h.window.testWorkspace.get().currentVideo.job.state, "ready");
});

test("failed or cancelled preflight can be retried in fixture mode; indexed cancellation uses budget-gated analysis", async () => {
  const h = await harness({ realReady: false });
  h.videos.set("video-C", { id: "video-C", name: "C.mp4", bytes: 1, metadata: {}, job: { state: "cancelled" } });
  h.videos.get("video-B").job.state = "cancelled";
  await h.window.CtrlFVideoPersistence.library("videos");
  const rows = h.get("library-items").children;
  const retry = rows.find(r => r.children[0].children[0].textContent === "C.mp4").children.find(b => b.textContent === "Run preflight again");
  assert.ok(retry); assert.notEqual(retry.disabled, true);
  h.setOverride(c => c.url === "/api/videos/video-C/retry" ? response({}, 202) : undefined);
  await retry.onclick(); assert.ok(h.calls.some(c => c.url === "/api/videos/video-C/retry" && c.method === "POST"));
  const analyze = rows.find(r => r.children[0].children[0].textContent === "B.mp4").children.find(b => b.textContent === "Start analysis");
  assert.equal(analyze.disabled, true);
});

// Exercise the real app adapter, rather than mirroring its draft-clear condition.
test("app answers keep edits made while busy and recovery preserves an existing draft", async () => {
  const ids = new Map(), shell = new Element(), steps = [new Element(), new Element(), new Element()];
  const get = id => { if (!ids.has(id)) ids.set(id, new Element()); return ids.get(id); };
  Object.assign(get("player"), { readyState: 1, currentTime: 0, duration: 18, paused: true });
  const doc = { getElementById: get, createElement: () => new Element(),
    querySelector: selector => selector === ".agent-shell" ? shell : selector.includes("li:first-child") ? steps[0] : selector.includes("li:nth-child(2)") ? steps[1] : selector.includes("li:last-child") ? steps[2] : new Element(),
    querySelectorAll: selector => selector === ".run-steps li" ? steps : [],
  };
  const sandbox = vm.createContext({ document: doc, window: { innerWidth: 1440, addEventListener() {}, dispatchEvent() {}, matchMedia: () => ({ matches: true }) },
    fetch: async () => response({ queries: [] }), Event: class {}, URL: {}, navigator: {},
  });
  vm.runInContext(fs.readFileSync(require.resolve("../src/ctrlf_video/static/app.js"), "utf8"), sandbox); await tick();
  vm.runInContext('activeVideo={id:"video-A"}; window.CtrlFVideoSessionUI.busy(true,"Checking your question…")', sandbox);
  assert.equal(get("question-form").attributes["aria-busy"],"true");
  assert.equal(get("composer-feedback").textContent,"Checking your question…");
  assert.equal(get("composer-feedback").hidden,false);
  get("question").value = "next draft";
  vm.runInContext(`window.CtrlFVideoSessionUI.answer(${JSON.stringify(answer("done"))},"submitted")`, sandbox);
  assert.equal(get("question").value, "next draft"); assert.notEqual(get("question").disabled, true);
  vm.runInContext(`window.CtrlFVideoSessionUI.answer(${JSON.stringify(answer("recovered"))})`, sandbox);
  assert.equal(get("question").value, "next draft");
  get("question").value = "submitted";
  vm.runInContext(`window.CtrlFVideoSessionUI.answer(${JSON.stringify(answer("clear"))},"submitted")`, sandbox);
  assert.equal(get("question").value, "");
});

test("task context is captured before awaits and later edits persist independently", async () => {
  const h = await harness(), prepare = deferred();
  h.store.setTaskBrief("Original participant task"); h.store.setStudyType("technical_sample");
  h.setOverride(c => {
    if (c.url === "/api/chat/prepare") return prepare.promise;
    if (c.url === "/api/chat") return response({...answer(c.body.request_id), task_brief:c.body.task_brief,study_type:c.body.study_type});
  });
  const ask = h.window.CtrlFVideoPersistence.ask("What changed?"); await tick();
  h.store.setTaskBrief("Edited while waiting"); h.store.setStudyType("ux_research");
  prepare.resolve(response({kind:"ready"})); await ask;
  const submitted = h.calls.find(c=>c.url==="/api/chat").body;
  assert.equal(submitted.task_brief,"Original participant task");
  assert.equal(submitted.study_type,"technical_sample");
  assert.equal(h.answers[0].task_brief,"Original participant task");
  assert.equal(h.desks.get("desk-A").state.taskBrief,"Edited while waiting");
  await h.window.testWorkspace.openDesk("desk-B");
  assert.equal(h.store.getSnapshot().taskBrief,"");
});

test("explicit finding save confirms only durable writes and preserves conflict recovery", async () => {
  const h = await harness(), { saveFinding } = await findingActions, messages = [];
  h.store.annotate("Durable finding edit");
  await saveFinding(h.window.CtrlFVideoPersistence, message => messages.push(message));
  assert.equal(messages.at(-1), "Finding saved to workspace.");
  assert.equal(h.desks.get("desk-A").state.note, "Durable finding edit");
  assert.equal(await h.window.CtrlFVideoPersistence.flush(), true);

  h.store.annotate("Conflicting edit");
  h.setOverride(c => c.method === "PUT" ? response({ detail: "revision_conflict" }, 409) : undefined);
  await assert.rejects(h.window.CtrlFVideoPersistence.flush(), /revision_conflict/);
  const writes = h.calls.filter(c => c.method === "PUT").length;
  h.store.annotate("Further unsaved edit");
  await saveFinding(h.window.CtrlFVideoPersistence, message => messages.push(message));
  assert.match(messages.at(-1), /^Not saved\./);
  assert.match(h.get("save-state").textContent, /Changed in another window/);
  assert.equal(h.calls.filter(c => c.method === "PUT").length, writes);
  assert.equal(h.desks.get("desk-A").state.note, "Durable finding edit");
});

test("finding save feedback is suppressed once navigation begins, even before the next desk loads", async () => {
  const h = await harness(), { saveFinding } = await findingActions, pending = deferred(), messages = [];
  let first = true;
  h.setOverride(c => {
    if (c.method === "PUT" && first) { first = false; return pending.promise; }
  });
  h.store.annotate("Saved on A");
  const saving = saveFinding(h.window.CtrlFVideoPersistence, message => messages.push(message));
  await tick();
  const navigation = h.window.testWorkspace.openDesk("desk-B");
  pending.resolve(response({ revision: 2 }));
  await saving;
  await navigation;
  assert.equal(h.window.testWorkspace.get().current.id, "desk-B");
  assert.deepEqual(messages, []);
});

test("unavailable finding persistence cannot report a successful save", async () => {
  const { saveFinding } = await findingActions, messages = [];
  await saveFinding(undefined, message => messages.push(message));
  assert.match(messages[0], /^Not saved\./);
});

test("opening a named finding clears a filter that would otherwise select the wrong object", async () => {
  const { openFinding } = await findingActions;
  const { visiblePins } = require("../src/ctrlf_video/static/workbench-model.js");
  const pins = [{ id: "finding-1", kind: "evidence" }, { id: "finding-2", kind: "conclusion" }];
  let filter = "evidence", editingId = "finding-1";
  openFinding("finding-2", value => { editingId = value; }, value => { filter = value; });
  assert.equal(visiblePins(pins, filter).find(pin => pin.id === editingId)?.id, "finding-2");
  assert.equal(filter, "all");
});


test("refreshing model setup updates live access and admission without losing the draft", async () => {
  for (const ready of [true, false]) {
    const h = await harness({realReady: !ready});
    const access = [];
    h.ui.access = value => access.push(value);
    h.get("question").value = "Which team is green?";
    h.setOverride(c => c.url === "/api/session" ? response({csrf:"csrf",owner_id:"owner-A",real_ready:ready,ttl_hours:24})
      : c.url === "/api/runtime/status" ? response({dispatch_prerequisites_met:ready,checks:[],models:[]})
      : c.url === "/api/chat" ? response(answer(c.body.request_id)) : undefined);
    await h.window.testWorkspace.showRuntime();
    assert.deepEqual(access,[ready]);
    assert.equal(h.get("question").value,"Which team is green?");
    assert.equal(h.calls.some(c => c.url === "/api/chat"),false);
    await h.window.CtrlFVideoPersistence.ask("Which team is green?");
    assert.equal(h.calls.some(c => c.url === "/api/chat/prepare"),ready);
  }
});

test("a slow question reports elapsed time without redispatch or clearing new draft text", async () => {
  const h=await harness(), pending=deferred();
  h.setOverride(c=>c.url==="/api/chat" ? pending.promise : undefined);
  h.get("question").value="Who makes the final pass?";
  const asking=h.window.CtrlFVideoPersistence.ask(h.get("question").value);
  await tick();
  h.get("question").value="My next question";
  await h.timer(10000);
  assert.match(h.get("notice").textContent,/10s elapsed/);
  assert.equal(h.calls.filter(c=>c.url==="/api/chat").length,1);
  assert.equal(h.get("question").value,"My next question");
  const call=h.calls.find(c=>c.url==="/api/chat");
  pending.resolve(response(answer(call.body.request_id)));
  await asking;
  assert.equal(h.get("notice").textContent,"");
  assert.equal(h.get("question").value,"My next question");
  assert.equal([...h.timers.values()].some(t=>t.delay===10000),false);
});

test("a delayed question cannot keep announcing progress after another desk opens", async () => {
  const h=await harness(), pending=deferred();
  h.setOverride(c=>c.url==="/api/chat" ? pending.promise : c.url.endsWith("/cancel") ? response({}) : undefined);
  const asking=h.window.CtrlFVideoPersistence.ask("Original question");
  await tick();
  await h.window.testWorkspace.openDesk("desk-B");
  h.get("notice").textContent="New investigation status";
  await h.timer(10000);
  assert.equal(h.get("notice").textContent,"New investigation status");
  const call=h.calls.find(c=>c.url==="/api/chat");
  pending.resolve(response(answer(call.body.request_id)));
  await asking;
  assert.equal(h.answers.length,0);
  assert.equal(h.get("notice").textContent,"New investigation status");
});

test("readiness refresh cannot replace an expired owner beneath an open investigation", async () => {
  const h = await harness({realReady:false});
  const access=[];h.ui.access=value=>access.push(value);
  h.get("question").value="Keep this draft";
  h.setOverride(c=>c.url === "/api/session" ? response({csrf:"new",owner_id:"owner-B",real_ready:true}) : undefined);
  await h.window.testWorkspace.showRuntime();
  assert.deepEqual(access,[]);
  assert.equal(h.get("question").value,"Keep this draft");
  assert.match(h.get("agent-setup-summary").textContent,/session_expired_reload/);
  await h.window.CtrlFVideoPersistence.ask("Keep this draft");
  assert.equal(h.calls.some(c=>c.url==="/api/chat/prepare"),false);
});
