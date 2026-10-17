/* Behavioral regression coverage without a browser dependency or network access. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

class Element {
  constructor(tag = "div") {
    this.tagName = tag;
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.style = {};
    this.listeners = {};
    this.value = "";
    this.hidden = false;
    this.scrollTop = 0;
    this.textContent = "";
    this.firstChild = { textContent: "" };
    this.classes = new Set();
    this.classList = {
      add: (x) => this.classes.add(x),
      remove: (x) => this.classes.delete(x),
      contains: (x) => this.classes.has(x),
      toggle: (x, enabled) => {
        if (enabled) this.classes.add(x);
        else this.classes.delete(x);
      },
    };
  }
  set className(value) {
    this.classes = new Set(value.split(" "));
  }
  get className() {
    return [...this.classes].join(" ");
  }
  append(...nodes) {
    for (const node of nodes) {
      node.parent = this;
      this.children.push(node);
    }
  }
  prepend(node) {
    node.parent = this;
    this.children.unshift(node);
  }
  replaceChildren() {
    this.children = [];
  }
  remove() {
    this.parent.children = this.parent.children.filter((x) => x !== this);
  }
  get firstElementChild() {
    return this.children[0];
  }
  setAttribute(key, value) {
    this.attributes[key] = value;
  }
  getAttribute(key) {
    return this.attributes[key] ?? null;
  }
  removeAttribute(key) {
    delete this.attributes[key];
  }
  addEventListener(name, fn) {
    (this.listeners[name] ??= []).push(fn);
  }
  dispatch(name) {
    for (const fn of this.listeners[name] ?? [])
      fn({ currentTarget: this, preventDefault() {} });
  }
  click() {
    this.dispatch("click");
  }
  focus() {
    this.focused = true;
  }
  getBoundingClientRect() {
    return { top: 0 };
  }
  scrollIntoView() {}
  showModal() { this.open = true; }
  close() { this.open = false; }
  pause() {
    this.paused = true;
  }
  load() {}
  querySelector() {
    return new Element();
  }
}
async function harness(readyState = 1, width = 1440) {
  const ids = new Map();
  const get = (id) => {
    if (!ids.has(id)) ids.set(id, new Element());
    return ids.get(id);
  };
  const sourceSteps = [new Element(), new Element(), new Element()];
  const shell = new Element();
  const player = get("player");
  Object.assign(player, {
    readyState,
    duration: 18,
    currentTime: 0,
    paused: true,
  });
  const walk = (nodes) => nodes.flatMap((n) => [n, ...walk(n.children)]);
  const byClass = (cls) =>
    walk([...ids.values()]).filter((n) => n.classList.contains(cls));
  const document = {
    getElementById: get,
    createElement: (tag) => new Element(tag),
    querySelector: (s) =>
      s === ".source-item span"
        ? get("source-name")
        : s.startsWith("[data-turn=")
          ? byClass("history-task").find(
              (n) => n.dataset.turn === s.split('"')[1],
            )
          : s === ".agent-shell"
            ? shell
            : s.includes("li:first-child")
              ? sourceSteps[0]
              : s.includes("li:nth-child(2)")
                ? sourceSteps[1]
                : s.includes("li:last-child")
                  ? sourceSteps[2]
                  : null,
    querySelectorAll: (s) =>
      s === ".run-steps li"
        ? sourceSteps
        : s === ".history-task"
          ? byClass("history-task")
          : s === ".evidence-button"
            ? byClass("evidence-button")
            : [],
  };
  const context = vm.createContext({
    document,
    history: {replaceState(_state, _title, url) { context.currentRoute = url; }},
    window: {
      innerWidth: width,
      matchMedia: () => ({ matches: true }),
      addEventListener() {},
    },
    navigator: { clipboard: { writeText: async () => {} } },
    fetch: async () => ({ ok: true, json: async () => ({ queries: [] }) }),
    URL: {},
    console,
  });
  vm.runInContext(
    fs.readFileSync(
      path.join(__dirname, "../src/ctrlf_video/static/app.js"),
      "utf8",
    ),
    context,
  );
  await new Promise(setImmediate);
  const run = (source) => vm.runInContext(source, context);
  const answer = (status, events = []) => ({
    question: status,
    response: {
      status,
      answer: status,
      events,
      unresolved: [],
      errors: [],
      followups: [],
    },
  });
  return { get, player, run, shell, answer };
}

test("research entry keeps upload cancellation on the welcome screen and demo access explicit", async () => {
  const h = await harness();
  h.run('demo = { scenarios: [{ id: "first" }] }; window.CtrlFVideoSessionUI.entryReady(true)');
  assert.equal(h.get("research-welcome").hidden, false);
  assert.equal(h.shell.inert, true);
  assert.equal(h.get("welcome-upload").disabled, false);
  let opened = 0;
  h.get("file-input").addEventListener("click", () => opened++);
  h.get("welcome-upload").click();
  h.get("file-input").files = [];
  h.get("file-input").dispatch("change");
  assert.equal(opened, 1);
  assert.equal(h.get("research-welcome").hidden, false);
  h.run('notice("Upload failed. Try again.")');
  assert.match(h.get("welcome-notice").textContent, /Upload failed/);
  h.get("welcome-demos").click();
  assert.equal(h.get("research-welcome").hidden, true);
  assert.equal(h.shell.inert, false);
  assert.equal(h.get("demo-library").open, true);
  h.get("demo-library").close();
  h.get("workspace-demos").click();
  assert.equal(h.get("demo-library").open, true);
});

test("entry connection failure exposes retry while preserving disabled upload", async () => {
  const h = await harness();
  h.get("welcome-upload").disabled = true;
  h.run('window.CtrlFVideoSessionUI.entryFailed(); notice("Workspace unavailable")');
  assert.equal(h.get("welcome-retry").hidden, false);
  assert.equal(h.get("welcome-upload").disabled, true);
  assert.equal(h.get("welcome-notice").textContent, "Workspace unavailable");
});

test("explicit review entry opens the video and questions for a first visit", async () => {
  const h = await harness();
  h.run('window.location = { hash: "#review" }; window.CtrlFVideoSessionUI.entryReady(true)');
  assert.equal(h.get("research-welcome").hidden, true);
  assert.equal(h.shell.inert, false);
});

test("home and resume keep the visible screen aligned with its reload route", async () => {
  const h = await harness();
  h.run('window.CtrlFVideoSessionUI.entryReady(false)');
  h.get("open-welcome").click();
  assert.equal(h.run("currentRoute"), "/#start");
  assert.equal(h.get("research-welcome").hidden, false);
  h.get("welcome-resume").click();
  assert.equal(h.run("currentRoute"), "/#review");
  assert.equal(h.get("research-welcome").hidden, true);
  assert.equal(h.shell.inert, false);
  assert.equal(h.get("skip-link").href, "#question");
});

test("evidence deep link shows the landing after restoration and opens the demo from its final step", async () => {
  const h = await harness();
  let scrolled = 0;
  h.get("evidence-chain").scrollIntoView = () => scrolled++;
  h.run('window.location = { hash: "#evidence-chain" }; demo = { scenarios: [{ id: "first" }] }; window.CtrlFVideoSessionUI.entryReady(false)');
  assert.equal(h.get("research-welcome").hidden, false);
  assert.equal(h.get("welcome-resume").hidden, false);
  assert.equal(h.shell.inert, true);
  assert.equal(scrolled, 1);
  assert.equal(h.get("welcome-proof-demos").disabled, false);
  h.get("welcome-proof-demos").click();
  assert.equal(h.get("research-welcome").hidden, true);
  assert.equal(h.shell.inert, false);
  assert.equal(h.get("demo-library").open, true);
  h.run('window.location.hash = ""; window.CtrlFVideoSessionUI.entryReady(false)');
  assert.equal(h.get("research-welcome").hidden, true);
});

test("cached metadata supports immediate seek; deferred metadata applies a queued seek", async () => {
  let h = await harness();
  h.run("seek(6)");
  assert.equal(h.player.currentTime, 6);
  assert.match(h.get("seek-status").textContent, /00:06/);
  h = await harness(0);
  h.run("seek(10)");
  assert.equal(h.player.currentTime, 0);
  h.player.readyState = 1;
  h.player.dispatch("loadedmetadata");
  assert.equal(h.player.currentTime, 10);
  assert.equal(h.player.paused, true);
});
test("reset after media failure cannot claim readiness; reload updates source with existing tasks", async () => {
  const h = await harness();
  h.player.dispatch("error");
  h.run("newTask()");
  assert.equal(h.get("source-step-state").textContent, "Retry needed");
  assert.equal(h.get("attached-source-state").textContent, "Load failed");
  h.run("turns = 2");
  h.get("reload-video").click();
  assert.equal(h.get("source-step-state").textContent, "Loading");
  h.player.dispatch("loadedmetadata");
  assert.equal(h.get("source-step-state").textContent, "Ready");
});
test("selecting an older task synchronizes the canvas and exposes selected history", async () => {
  const h = await harness();
  h.run(
    `renderAnswer(${JSON.stringify(h.answer("ok", [{ action: "包裹", start: 5, end: 11, evidence: [], summary: "位置" }]))})`,
  );
  h.run(`renderAnswer(${JSON.stringify(h.answer("no_result"))})`);
  assert.equal(h.get("run-state").textContent, "No matching frames");
  const old = h.get("task-list").children[1];
  old.click();
  assert.equal(h.get("run-state").textContent, "Evidence available");
  assert.equal(old.getAttribute("aria-current"), "true");
  assert.equal(h.get("evidence-step-state").textContent, "Select evidence");
});
test("mobile evidence reveal and collapse retain task draft", async () => {
  const h = await harness(1, 375);
  h.get("question").value = "Keep我 任务";
  h.run("seek(6)");
  assert.equal(h.get("toggle-evidence").getAttribute("aria-expanded"), "true");
  assert.equal(h.shell.classList.contains("evidence-open"), true);
  h.get("toggle-evidence").click();
  assert.equal(h.get("question").value, "Keep我 任务");
  assert.equal(h.shell.classList.contains("evidence-open"), false);
});
test("local playback and new task retain unindexed state and disabled question", async () => {
  const h = await harness();
  h.run("setLocalMode(true)");
  h.run("newTask()");
  assert.equal(h.get("question").disabled, true);
  assert.equal(h.get("run-state").textContent, "Not indexed");
  assert.equal(h.get("source-step-state").textContent, "Not indexed");
  assert.equal(h.get("empty-state").hidden, false);
  assert.equal(h.get("restore-demo").hidden, false);
});
test("bounded session history removes the same oldest task as the conversation", async () => {
  const h = await harness();
  for (let i = 0; i < 13; i++)
    h.run(`renderAnswer(${JSON.stringify(h.answer("no_result"))})`);
  assert.equal(h.get("messages").children.length, 12);
  assert.equal(h.get("task-list").children.length, 12);
  assert.equal(
    h.get("task-list").children.at(-1).dataset.turn,
    h.get("messages").children[0].id,
  );
  h.run("newTask()");
  assert.equal(h.get("task-list").children.length, 0);
  assert.equal(h.get("task-count").textContent, "0");
});

test("source rail toggles the open panel and evidence restores its state without clearing the draft", async () => {
  const h = await harness();
  h.run("window.CtrlFVideoWorkbench = {}; investigation = { evidence() {} }");
  h.get("question").value = "KeepCurrentFollow-up";
  const rail = h.get("rail-source");
  assert.equal(rail.getAttribute("aria-expanded"), "true");
  rail.click();
  assert.equal(h.shell.classList.contains("source-collapsed"), true);
  assert.equal(rail.getAttribute("aria-expanded"), "false");
  assert.equal(rail.getAttribute("aria-label"), "Open source");
  rail.click();
  assert.equal(h.shell.classList.contains("source-collapsed"), false);
  assert.equal(rail.getAttribute("aria-expanded"), "true");
  h.get("collapse-source").click();
  assert.equal(h.get("source-launcher").focused, true);
  assert.equal(rail.getAttribute("aria-expanded"), "false");
  h.run("seek(13)");
  assert.equal(h.shell.classList.contains("source-collapsed"), false);
  assert.equal(rail.getAttribute("aria-expanded"), "true");
  assert.equal(rail.getAttribute("aria-label"), "Hide source");
  assert.equal(h.player.currentTime, 13);
  assert.equal(h.get("question").value, "KeepCurrentFollow-up");
});

test("FindingsMap显式Expand小桌面Findings并Keep输入", async () => {
  const h = await harness(1, 1200);
  h.get("question").value = "KeepFollow-up";
  h.run(
    "window.CtrlFVideoWorkbench = { showPanel(tab) { window.lastPanel = tab; } }",
  );
  h.shell.classList.add("inspector-collapsed");
  h.get("rail-findings").click();
  assert.equal(h.run("window.lastPanel"), "findings");
  assert.equal(h.shell.classList.contains("inspector-open"), true);
  assert.equal(h.shell.classList.contains("inspector-collapsed"), false);
  assert.equal(h.get("toggle-inspector").getAttribute("aria-expanded"), "true");
  assert.equal(h.get("inspector-findings-tab").focused, true);
  assert.equal(h.get("question").value, "KeepFollow-up");
});


test("floating agent and finding editor preserve the draft and canvas view", async () => {
  const h = await harness();
  h.run("window.CtrlFVideoWorkbench = { showPanel() {} }; investigation = { fit() { throw Error('Do not move the canvas on panel toggle'); }, choose(id) { window.contextId = id; } }");
  h.get("question").value = "Keep this unfinished question";
  h.get("collapse-agent").click();
  assert.equal(h.shell.classList.contains("chat-collapsed"), true);
  assert.equal(h.get("agent-launcher").focused, true);
  h.get("agent-launcher").click();
  assert.equal(h.shell.classList.contains("chat-collapsed"), false);
  assert.equal(h.get("question").focused, true);
  h.run("openInspector('findings')");
  assert.equal(h.shell.classList.contains("chat-collapsed"), true);
  assert.equal(h.shell.classList.contains("inspector-collapsed"), false);
  h.run("window.CtrlFVideoUI.continueFrom('task-1')");
  assert.equal(h.shell.classList.contains("chat-collapsed"), false);
  assert.equal(h.shell.classList.contains("inspector-collapsed"), true);
  assert.equal(h.run("window.contextId"), "task-1");
  assert.equal(h.get("question").value, "Keep this unfinished question");
});

test("review view exposes video and questions without losing the draft or playback when switching views", async () => {
  const h = await harness();
  h.player.currentTime = 6;
  h.get("question").value = "Keep this unfinished question";
  h.shell.classList.add("chat-collapsed");
  h.shell.classList.add("source-collapsed");
  h.shell.classList.add("source-expanded");
  h.get("rail-review").click();
  assert.equal(h.shell.classList.contains("review-first"), true);
  assert.equal(h.shell.classList.contains("chat-collapsed"), false);
  assert.equal(h.shell.classList.contains("source-collapsed"), false);
  assert.equal(h.shell.classList.contains("source-expanded"), false);
  assert.equal(h.get("rail-review").getAttribute("aria-pressed"), "true");
  h.get("rail-canvas").click();
  assert.equal(h.shell.classList.contains("review-first"), false);
  assert.equal(h.get("rail-canvas").getAttribute("aria-pressed"), "true");
  h.get("rail-review").click();
  assert.equal(h.player.currentTime, 6);
  assert.equal(h.get("question").value, "Keep this unfinished question");
});

test("closing the finding editor in review returns to the visible question panel", async () => {
  const h = await harness();
  h.run("window.CtrlFVideoWorkbench = { showPanel() {} }");
  h.get("rail-review").click();
  h.run("openInspector('findings')");
  assert.equal(h.shell.classList.contains("chat-collapsed"), true);
  h.run("toggleInspector()");
  assert.equal(h.shell.classList.contains("inspector-collapsed"), true);
  assert.equal(h.shell.classList.contains("chat-collapsed"), false);
});

test("explicit locate actions open the canvas while conversation selection stays in review", async () => {
  const h = await harness();
  h.run('var visits = []; investigation = { choose(id) { visits.push(["choose", id]); }, reveal(id) { visits.push(["reveal", id]); } }');
  h.get("rail-review").click();
  h.run('window.CtrlFVideoUI.select("question-1")');
  assert.equal(h.shell.classList.contains("review-first"), true);
  for (const method of ["focusFinding", "locate"]) {
    h.get("rail-review").click();
    h.run(`window.CtrlFVideoUI.${method}("target")`);
    assert.equal(h.shell.classList.contains("review-first"), false);
    assert.equal(h.get("rail-canvas").getAttribute("aria-pressed"), "true");
    assert.equal(h.run('JSON.stringify(visits.slice(-2))'), JSON.stringify([["choose", "target"], ["reveal", "target"]]));
  }
});

test("example-question action cannot dispatch a preset or model request for an uploaded source", async () => {
  const h = await harness();
  h.run('window.CtrlFVideoPersistence = { ask() { throw Error("Do not dispatch an example for a private source"); } }; activeVideo = { id: "uploaded" }');
  h.run('window.CtrlFVideoUI.askDemoQuestion("When is the package at the center?")');
  h.run('activeVideo = null; localMode = true');
  h.run('window.CtrlFVideoUI.askDemoQuestion("When is the package at the center?")');
  assert.equal(h.get("messages").children.length, 0);
});

test("expanding and hiding the floating source retains playback and draft", async () => {
  const h = await harness();
  h.player.currentTime = 10;
  h.get("question").value = "Draft";
  h.get("expand-source").click();
  assert.equal(h.shell.classList.contains("source-expanded"), true);
  h.get("collapse-source").click();
  assert.equal(h.shell.classList.contains("source-expanded"), false);
  assert.equal(h.shell.classList.contains("source-collapsed"), true);
  h.get("source-launcher").click();
  assert.equal(h.shell.classList.contains("source-collapsed"), false);
  assert.equal(h.player.currentTime, 10);
  assert.equal(h.get("question").value, "Draft");
});

test("source library rail opens owned sources without changing the investigation draft or playback", async () => {
  const h = await harness();
  h.run("window.CtrlFVideoPersistence = { library(kind) { window.openedLibrary = kind; } }");
  h.get("open-sources").addEventListener("click", () => h.run('window.CtrlFVideoPersistence.library("videos")'));
  h.get("question").value = "Keep my research question";
  h.player.currentTime = 6;
  h.get("rail-library").click();
  assert.equal(h.run("window.openedLibrary"), "videos");
  assert.equal(h.get("question").value, "Keep my research question");
  assert.equal(h.player.currentTime, 6);
});

test("agent findings navigation preserves the draft and opens the existing finding editor", async () => {
  const h = await harness();
  h.run("window.CtrlFVideoWorkbench = { showPanel(tab) { window.openedPanel = tab; } }");
  h.get("question").value = "Unsent follow-up";
  h.get("agent-findings").click();
  assert.equal(h.run("window.openedPanel"), "findings");
  assert.equal(h.shell.classList.contains("inspector-collapsed"), false);
  assert.equal(h.get("inspector-findings-tab").focused, true);
  assert.equal(h.get("question").value, "Unsent follow-up");
});

test("closing the docked findings editor returns focus to the visible rail control", async () => {
  const h = await harness();
  h.shell.classList.add("fieldnotes");
  h.shell.classList.remove("inspector-collapsed");
  h.get("question").value = "Keep this draft";
  h.run("toggleInspector()");
  assert.equal(h.shell.classList.contains("inspector-collapsed"),true);
  assert.equal(h.get("rail-findings").focused,true);
  assert.notEqual(h.get("toggle-inspector").focused,true);
  assert.equal(h.get("question").value,"Keep this draft");
});

test("unavailable live analysis replaces the inert send affordance with saved-result recovery", async () => {
  const {get, run} = await harness();
  get("question").value = "which team is green ?";
  run('activeVideo={id:"video-A"}; window.CtrlFVideoSessionUI.access(false)');
  assert.equal(get("send-question").hidden, true);
  assert.equal(get("send-question").disabled, true);
  assert.equal(get("composer-unavailable").hidden, false);
  get("question-form").dispatch("submit");
  assert.match(get("composer-feedback").textContent, /Your draft is kept/);
  assert.equal(get("question-shortcuts").classList.contains("review-saved-open"), true);
  assert.equal(get("open-saved-answers").getAttribute("aria-expanded"), "true");
  assert.equal(get("question").value, "which team is green ?");
  get("open-saved-answers").click();
  assert.equal(get("question-shortcuts").classList.contains("review-saved-open"), false);
  run('window.CtrlFVideoSessionUI.access(true)');
  assert.equal(get("composer-unavailable").hidden, true);
  assert.equal(get("send-question").hidden, false);
  assert.equal(get("send-question").disabled, false);
});
