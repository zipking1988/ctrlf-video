"use strict";
const $ = (id) => document.getElementById(id);
const player = $("player");
let demo = null;
let activeVideo = null;
let realBusy = false;
let localUrl = null;
let localMode = false;
let mediaReady = false;
let mediaFailed = false;
let pendingSeek = null;
let pendingSeekRestore = false;
let pendingSeekTrigger = null;
let turns = 0;
let taskSequence = 0;
let lastQueryId = null;
let evidenceReturnFocus = null;
let investigation = null;

function setSourceOpen(open) {
  document
    .querySelector(".agent-shell")
    .classList.toggle("source-collapsed", !open);
  $("rail-source").setAttribute("aria-expanded", String(open));
  $("rail-source").setAttribute("aria-label", open ? "Hide source" : "Open source");
  $("rail-source").title = open ? "Hide player" : "Show player";
}

function showEvidence(open, trigger = document.activeElement) {
  if (window.CtrlFVideoWorkbench) {
    $("evidence-canvas").hidden = false;
    if (open) setSourceOpen(true);
    $("source-dock").classList.toggle("evidence-focused", open);
    return;
  }
  if (investigation) {
    const viewer = $("evidence-canvas");
    const wasOpen = !viewer.hidden;
    if (open && trigger?.isConnected) evidenceReturnFocus = trigger;
    viewer.hidden = !open;
    $("toggle-evidence").setAttribute("aria-expanded", String(open));
    if (!open && wasOpen && evidenceReturnFocus?.isConnected)
      evidenceReturnFocus.focus({ preventScroll: true });
    return;
  }
  const shell = document.querySelector(".agent-shell");
  const wasOpen = shell.classList.contains("evidence-open");
  const mobile = window.innerWidth < 900;
  if (mobile && open && !wasOpen) evidenceReturnFocus = trigger;
  shell.classList.toggle("evidence-open", open);
  $("toggle-evidence").setAttribute("aria-expanded", String(open));
  $("toggle-evidence").firstChild.textContent = open
    ? "Back to questions "
    : "View video ";
  if (mobile && open && !wasOpen) {
    $("toggle-evidence").focus({ preventScroll: true });
  } else if (mobile && !open && wasOpen) {
    const target = evidenceReturnFocus;
    evidenceReturnFocus = null;
    if (target?.isConnected !== false && target?.focus && !target.disabled) {
      target.focus({ preventScroll: true });
    } else {
      (localMode ? $("toggle-evidence") : $("question")).focus({
        preventScroll: true,
      });
    }
  }
}
function resetContext() {
  $("run-state").textContent = localMode ? "Not indexed" : "Awaiting task";
  updateMediaContext();
  $("result-step").textContent = localMode
    ? "Video retrieval unavailable"
    : "Match a preset example";
  $("result-step-state").textContent = localMode ? "Unavailable" : "Awaiting match";
  $("evidence-step").textContent = localMode
    ? "No retrieved evidence for this file"
    : "Frames linked to timestamps";
  $("evidence-step-state").textContent = localMode ? "Unavailable" : "Select evidence";
  document.querySelectorAll(".run-steps li").forEach((item, index) => {
    if (index > 0) item.classList.remove("complete");
  });
}

function updateMediaContext() {
  if (activeVideo) {
    const ready = activeVideo.job?.state === "ready";
    $("attached-source-state").textContent = mediaFailed ? "Playback failed" : ready ? "Index ready" : "Uploaded · awaiting analysis";
    $("source-step").textContent = activeVideo.name;
    $("source-step-state").textContent = ready ? "Ready" : "Not ready";
    return;
  }
  $("source-step").textContent = mediaFailed
    ? "Video failed to load"
    : !mediaReady
      ? "Loading video"
      : localMode
        ? "Browser playback only"
        : "Synthetic video loaded";
  $("source-step-state").textContent = mediaFailed
    ? "Retry needed"
    : !mediaReady
      ? "Loading"
      : localMode
        ? "Not indexed"
        : "Ready";
  $("attached-source-state").textContent = mediaFailed
    ? "Load failed"
    : !mediaReady
      ? "Loading"
      : localMode
        ? "Local playback · not indexed"
        : "Loaded · 18 seconds";
  document
    .querySelector(".run-steps li:first-child")
    .classList.toggle("complete", mediaReady && !mediaFailed && !localMode);
}
const stateLabels = {
  ok: "Evidence available",
  partial: "Partially verified",
  no_result: "No matching frames",
  error: "Search incomplete",
};
function selectTask(data, historyButton) {
  window.CtrlFVideoWorkbench?.select(
    historyButton.dataset.sourceTurn || historyButton.dataset.turn,
  );
  document.querySelectorAll(".history-task").forEach((item) => {
    const active = item === historyButton;
    item.classList.toggle("active", active);
    item.setAttribute("aria-current", active ? "true" : "false");
  });
  document.querySelectorAll(".turn").forEach((item) => {
    item.classList.toggle("selected", item.id === historyButton.dataset.turn);
  });
  $("run-state").textContent = stateLabels[data.status];
  $("result-step").textContent = activeVideo ? "Model retrieval and visual review" : "Matched a preset demo";
  $("result-step-state").textContent = "Matched";
  document
    .querySelector(".run-steps li:nth-child(2)")
    .classList.add("complete");
  $("evidence-step").textContent = data.events.length
    ? `${data.events.length} events available to replay`
    : "This example has no event to replay";
  $("evidence-step-state").textContent = data.events.length
    ? "Select evidence"
    : "No evidence";
  document
    .querySelector(".run-steps li:last-child")
    .classList.remove("complete");
}

const clock = (seconds) => {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};
function announce(message) {
  $("announcement").textContent = message;
}
function notice(message) {
  $("form-notice").textContent = message;
  $("form-notice").hidden = !message;
}
function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function button(label, className, action) {
  const element = node("button", className, label);
  element.type = "button";
  element.addEventListener("click", action);
  return element;
}
function updateSend() {
  $("send-question").disabled =
    !demo || localMode || realBusy || !$("question").value.trim();
}
function seek(seconds, trigger = document.activeElement) {
  if (!Number.isFinite(seconds) || seconds < 0 || (mediaReady && seconds > player.duration)) return;
  if (mediaFailed) {
    announce("Cannot seek. Reload the video first.");
    $("seek-status").textContent = "Cannot seek. Reload the video first.";
    return;
  }
  if (!mediaReady) {
    pendingSeek = seconds;
    pendingSeekTrigger = trigger;
    announce("Video is loading; it will seek to the selected frame when ready.");
    return;
  }
  const wasPaused = player.paused;
  player.currentTime = seconds;
  if (wasPaused) player.pause();
  if (investigation) {
    if (!trigger?.closest?.(".turn")) investigation.evidence(null);
    showEvidence(true, trigger);
  }
  if (!investigation && window.innerWidth < 900) {
    showEvidence(true, trigger);
    player.scrollIntoView({
      block: "center",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }
  $("seek-status").textContent =
    `Seeked to ${clock(seconds)} · ${wasPaused ? "paused" : "playing"}`;
  announce($("seek-status").textContent);
  $("evidence-step").textContent = `Seeked to ${clock(seconds)}`;
  $("evidence-step-state").textContent = "Seeked to";
  document.querySelector(".run-steps li:last-child").classList.add("complete");
}
function updateTime() {
  if (investigation && mediaReady)
    $("seek-status").textContent =
      `Current ${clock(player.currentTime)} · ${player.paused ? "Paused" : "Playing"}`;
  $("playback-time").textContent =
    `${clock(player.currentTime)} / ${clock(player.duration)}`;
  const percent = player.duration
    ? (player.currentTime / player.duration) * 100
    : 0;
  $("playhead").style.transform = `scaleX(${Math.min(percent, 100) / 100})`;
  const start = player.currentTime < 5 ? 0 : player.currentTime < 11 ? 5 : 11;
  document.querySelectorAll(".chapter,.segment").forEach((element) => {
    const activeTime = element.classList.contains("segment")
      ? start === 5
        ? 6
        : start === 11
          ? 13
          : 0
      : start;
    const active = !localMode && Number(element.dataset.time) === activeTime;
    element.classList.toggle("active", active);
    element.setAttribute("aria-current", active ? "time" : "false");
  });
}
function renderAnswer(query) {
  if ((activeVideo && (query.mode !== "real" || query.video_id !== activeVideo.id)) || (!activeVideo && query.mode === "real")) return;
  if (localMode || !demo) return;
  if (++turns > 12) {
    const oldestId = $("messages").firstElementChild?.id;
    if (oldestId) document.querySelector(`[data-turn="${oldestId}"]`)?.remove();
    $("messages").firstElementChild?.remove();
  }
  const data = query.response;
  $("suggestions").hidden = true;
  const more = node("details", "response-details");
  more.append(node("summary", "", "More evidence and references"));
  const turn = node("article", "turn question-node");
  turn.id = query.savedTurn || `task-${++taskSequence}`;
  taskSequence = Math.max(taskSequence, Number(turn.id.split("-")[1]) || 0);
  turn.dataset.kind = "question";
  turn.append(node("p", "question-bubble", query.question));
  const label = node("div", "answer-label", "CtrlF Video");
  label.append(
    node(
      "span",
      "fixture-tag",
      query.mode === "real" ? (query.usedContext ? "Evidence follow-up · context retained" : "Model analysis") : query.usedContext ? "Preset follow-up · context retained" : "Synthetic demo · no model calls",
    ),
  );
  turn.append(label, node("p", "answer-text", data.answer));
  turn.append(
    node("span", `answer-status ${data.status}`, stateLabels[data.status]),
  );
  const eventCluster =
    data.events.length > 1 ? node("div", "event-cluster") : turn;
  if (eventCluster !== turn) turn.append(eventCluster);
  data.events.forEach((event) => {
    const row = node("section", "event");
    row.append(node("h3", "event-heading", event.action));
    const toolbar = node("div", "event-toolbar");
    toolbar.append(
      button(
        `${clock(event.start)}–${clock(event.end)}`,
        "seek-button",
        (clickEvent) => {
          selectTask(data, historyButton);
          investigation?.choose(turn.id);
          investigation?.evidence(query);
          seek(event.start, clickEvent.currentTarget);
        },
      ),
      node("span", "support-label", query.mode === "real" ? "Visual evidence · check boundaries" : "Preset example · supported by frames"),
    );
    row.append(toolbar);
    const evidence = node("div", "evidence-grid");
    event.evidence.forEach((frame, index) => {
      const frameButton = button("", "evidence-button", () => {
        selectTask(data, historyButton);
        investigation?.choose(turn.id);
        investigation?.evidence(query);
        document.querySelectorAll(".evidence-button").forEach((item) => {
          const selected = item === frameButton;
          item.classList.toggle("selected", selected);
          item.setAttribute("aria-pressed", String(selected));
        });
        seek(frame.t, frameButton);
      });
      frameButton.setAttribute("aria-pressed", "false");
      frameButton.setAttribute("aria-label", `Seek to evidence frame ${clock(frame.t)}`);
      const image = document.createElement("img");
      image.src = frame.uri;
      image.alt = frame.caption;
      image.loading = "lazy";
      const caption = node("span", "evidence-caption", clock(frame.t));
      caption.append(node("span", "", "View frame ↗"));
      frameButton.append(image, caption);
      if (
        index === 0 ||
        ["objects", "tape", "lighting", "offscreen"].includes(query.id)
      )
        evidence.append(frameButton);
      else more.append(frameButton);
    });
    row.append(evidence, node("p", "event-summary", event.summary));
    more.append(
      button("Copy timestamp reference", "text-button", async (eventClick) => {
        const trigger = eventClick.currentTarget;
        try {
          await navigator.clipboard.writeText(
            `${query.mode === "real" ? activeVideo?.name || query.video_id : "Synthetic demo: "+demo.video.title} ${clock(event.start)}–${clock(event.end)} — ${event.action}`,
          );
          trigger.textContent = "Copied";
          announce("Source timestamp copied.");
        } catch {
          notice("Clipboard unavailable. Copy the timestamp from structured results. ");
        }
      }),
    );
    eventCluster.append(row);
  });
  if (data.unresolved.length) {
    const unresolved = node("div", "unresolved");
    unresolved.append(node("strong", "", "Unresolved"));
    data.unresolved.forEach((text) => unresolved.append(node("p", "", text)));
    (investigation ? more : turn).append(unresolved);
  }
  if (data.errors.length) {
    turn.append(
      node("p", "trace-note", data.errors[0].message),
      button("Choose another example", "text-button", () => {
        $("question").focus();
        notice("Try: When is the package at the center?");
      }),
    );
  } else {
    turn.append(
      node(
        "p",
        "trace-note",
        query.mode === "real" ? `Retrieval and review · ${data.trace.visible.segments_reviewed} segments` : "Demo review scope: 00:00–00:18 · No audio · not a live model evaluation",
      ),
    );
  }
  const details = node("details", "response-details");
  details.append(
    node("summary", "", "View structured result"),
    node("pre", "", JSON.stringify(data, null, 2)),
  );
  more.append(details);
  const actions = node("div", "response-actions");
  data.followups.forEach((question) =>
    actions.append(
      button(question, "text-button", () => {
        investigation?.choose(turn.id);
        ask(question);
      }),
    ),
  );
  more.append(actions);
  turn.append(more);
  $("empty-state").hidden = true;
  $("messages").append(turn);
  const historyButton = button(query.question, "history-task", () => {
    if (!investigation)
      turn.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    selectTask(data, historyButton);
  });
  historyButton.dataset.turn = turn.id;
  historyButton.title = query.question;
  $("task-list").prepend(historyButton);
  $("history-empty").hidden = true;
  $("task-count").textContent = $("messages").children.length;
  selectTask(data, historyButton);
  const chatContent = $("chat-content");
  if (!investigation) chatContent.scrollTop = chatContent.scrollHeight;
  window.CtrlFVideoWorkbench?.record(turn.id, query);
  investigation?.register(turn, query, historyButton);
  announce(`${query.mode === "real" ? "Answer" : "Preset answer"}: ${stateLabels[data.status]}.${data.answer}`);
}
function ask(question) {
  if (localMode || realBusy) return;
  if (activeVideo) { window.CtrlFVideoPersistence?.ask(question); return; }
  const scoped = investigation?.context();
  const contextId = investigation ? scoped?.query.id || null : lastQueryId;
  const normalized = (value) => value.replace(/[\s??.!!]/g, "");
  const resolved = window.CtrlFVideoDemoConversation
    ? window.CtrlFVideoDemoConversation.resolve(
        question,
        demo?.queries || [],
        contextId,
      )
    : {
        query: demo?.queries.find(
          (item) => normalized(item.question) === normalized(question),
        ),
        usedContext: false,
      };
  if (!resolved.query) {
    const parcelContext = ["center", "right", "person"].includes(contextId);
    const supported = scoped?.query.suggested_replies || [];
    notice(
      supported.length
        ? `Available follow-ups${supported.map((label) => `“${label}”`).join(", ")}. Draft preserved.`
        : parcelContext
          ? "This follow-up is unavailable. The demo supports“What happened next?”“Who moved it?”or a full example question; your draft is preserved."
          : contextId
            ? "This follow-up does not match the current context. Try a full question such as“When is the package at the center?”. Draft preserved."
            : "Start with a full example question such as“When is the package at the center?”.You can follow up after the answer. Your draft is preserved.",
    );
    announce("This question is outside the demo examples. No model was called.");
    return;
  }
  notice("");
  lastQueryId = resolved.query.id;
  renderAnswer({
    ...resolved.query,
    task_brief: window.CtrlFVideoWorkbench?.getSnapshot().taskBrief || "",
    study_type: window.CtrlFVideoWorkbench?.getSnapshot().studyType || "ux_research",
    question,
    usedContext: resolved.usedContext,
    parentTurn: scoped?.turn.id || null,
  });
  $("question").value = "";
  updateSend();
  $("question").focus();
}
function clearChat() {
  evidenceReturnFocus = null;
  investigation?.clear();
  window.CtrlFVideoWorkbench?.clear();
  $("board-artifacts").replaceChildren();
  $("messages").replaceChildren();
  $("empty-state").hidden = false;
  $("question").value = "";
  turns = 0;
  taskSequence = 0;
  $("demo-current").hidden = true;
  lastQueryId = null;
  $("task-list").replaceChildren();
  $("task-count").textContent = "0";
  $("history-empty").hidden = false;
  $("suggestions").hidden = localMode;
  resetContext();
  notice("");
  updateSend();
}
function openDemoLibrary() {
  if (demo?.scenarios?.length) $("demo-library").showModal();
}
async function startScenario(id) {
  if (activeVideo) { await window.CtrlFVideoPersistence?.openDemo(); if (activeVideo) return; }
  const scenario = demo?.scenarios?.find((item) => item.id === id);
  let seeds;
  try {
    seeds = window.CtrlFVideoDemoConversation.materialize(
      scenario,
      demo.queries,
    );
  } catch {
    announce("Could not load this demo. Choose another path.");
    return;
  }
  if (localMode) $("restore-demo").click();
  $("demo-library").close();
  player.pause();
  pendingSeek = null;
  pendingSeekTrigger = null;
  if (mediaReady) player.currentTime = 0;
  showEvidence(false);
  clearChat();
  const turnIds = [];
  for (const seed of seeds) {
    renderAnswer({
      ...seed,
      parentTurn: seed.parentIndex === null ? null : turnIds[seed.parentIndex],
    });
    turnIds.push(`task-${taskSequence}`);
    lastQueryId = seed.id;
  }
  investigation?.arrange(scenario.layout || "threads");
  $("demo-current").textContent = `${scenario.title} · ${seeds.length} preset questions`;
  $("demo-current").hidden = false;
  window.CtrlFVideoWorkbench?.rename(`${scenario.title}Investigation`);
  if (window.CtrlFVideoWorkbench && window.innerWidth < 1400) {
    $("zoom-reset").click();
    investigation.choose(turnIds[0]);
    investigation.reveal(turnIds[0]);
  }
  $("question").focus();
  announce(
    `Loaded${scenario.title}, ${seeds.length}preset questions loaded. Select a card to follow up.`,
  );
}
function renderScenarios() {
  if (!demo.scenarios?.length) return;
  const list = $("demo-scenarios");
  list.replaceChildren();
  demo.scenarios.forEach((scenario, index) => {
    const entry = button("", "demo-scenario", () => startScenario(scenario.id));
    entry.setAttribute("aria-label", `Load demo: ${scenario.title}`);
    entry.append(
      node("span", "demo-scenario-number", String(index + 1).padStart(2, "0")),
      node("strong", "", scenario.title),
      node("p", "", scenario.description),
      node(
        "span",
        "demo-scenario-focus",
        `${scenario.focus} · ${scenario.steps.length} questions`,
      ),
    );
    list.append(entry);
  });
  $("open-demos").disabled = false;
  $("demo-library-empty").disabled = false;
}
$("open-demos").addEventListener("click", openDemoLibrary);
$("demo-library-empty").addEventListener("click", openDemoLibrary);
$("close-demos").addEventListener("click", () => $("demo-library").close());
function setLocalMode(enabled) {
  localMode = enabled;
  window.CtrlFVideoWorkbench?.source(enabled);
  $("source-dock").classList.toggle("local-source", enabled);
  investigation?.source(enabled);
  $("mode-label").textContent = enabled ? "Local playback" : "Demo mode";
  $("demo-notice-text").textContent = enabled
    ? "Local playback only. The file is not uploaded, indexed or sent to a model."
    : "Synthetic video with preset answers and follow-ups. No uploads or model calls.";
  $("restore-demo").hidden = !enabled;
  $("suggestions").hidden = enabled;
  $("composer-mode-text").textContent = enabled
    ? "Local playback · not indexed"
    : "Synthetic demo · no model calls";
  $("demo-timeline").hidden = enabled;
  $("segments").hidden = enabled;
  $("frame-heading").hidden = enabled;
  $("empty-eyebrow").textContent = enabled ? "Local playback only" : "Synthetic demo loaded";
  $("local-note").hidden = !enabled;
  $("video-watermark").hidden = enabled;
  $("question").disabled = enabled;
  $("question").placeholder = enabled
    ? "This video is not indexed. Questions are unavailable."
    : "Ask a follow-up or give the agent a task…";
  document.querySelectorAll("[data-query]").forEach((element) => {
    element.disabled = enabled || !demo;
  });
  $("video-state").textContent = enabled ? "Local playback only" : "Demo source";
  document.querySelector(".source-item span").textContent = enabled
    ? "Local video · not indexed"
    : "Package positions demo";
  $("attached-source-state").textContent = enabled
    ? "Local playback · not indexed"
    : "Loaded · 18 seconds";
  $("empty-state").querySelector(investigation ? "h1" : "h2").textContent =
    enabled
      ? "Source opened; not indexed."
      : investigation
        ? "Start with a question."
        : "What would you like to find?";
  $("empty-state").querySelector(".task-intro > p").textContent = enabled
    ? "Play your file or return to the synthetic demo."
    : investigation
      ? "Evidence stays connected here. Ask, review and build a finding."
      : "Ask about the package position, then follow up.";
  $("video-state").title = enabled ? "Not uploaded or analyzed" : "Public synthetic source";
  $("seek-status").textContent = enabled
    ? "Not uploaded or analyzed · browser playback only"
    : "Click a timestamp or evidence frame to seek";
  clearChat();
  if (enabled) {
    notice("Local video opened. Indexing and questions are unavailable; return to the demo to try evidence links.");
  }
}
function setChatOpen(open, focus = false) {
  const shell = document.querySelector(".agent-shell");
  shell.classList.toggle("chat-collapsed", !open);
  $("agent-launcher").setAttribute("aria-expanded", String(open));
  if (open) {
    shell.classList.add("inspector-collapsed");
    syncInspectorToggle();
  }
  if (focus) (open ? $("question") : $("agent-launcher")).focus();
}
function toggleInspector() {
  const shell = document.querySelector(".agent-shell");
  if (shell.classList.contains("inspector-collapsed")) {
    openInspector("findings");
  } else {
    shell.classList.add("inspector-collapsed");
    syncInspectorToggle();
    $("toggle-inspector").focus();
  }
}
function syncInspectorToggle() {
  $("toggle-inspector").setAttribute("aria-expanded", String(!document.querySelector(".agent-shell").classList.contains("inspector-collapsed")));
}
syncInspectorToggle();
window.addEventListener("resize", syncInspectorToggle);
$("chat-content").addEventListener("dragover", (event) => {
  if (
    Array.from(event.dataTransfer.types).includes(
      "application/x-ctrlf-video-evidence",
    )
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    $("chat-content").classList.add("drop-ready");
  }
});
$("chat-content").addEventListener("dragleave", () =>
  $("chat-content").classList.remove("drop-ready"),
);
$("chat-content").addEventListener("drop", (event) => {
  $("chat-content").classList.remove("drop-ready");
  const payload = event.dataTransfer.getData(
    "application/x-ctrlf-video-evidence",
  );
  if (!payload) return;
  event.preventDefault();
  try {
    const reference = JSON.parse(payload);
    const record = window.CtrlFVideoWorkbench?.getSnapshot().records.find(
      (record) => record.id === reference.turnId,
    );
    const frame = record?.query.response.events
      .flatMap((event) => event.evidence)
      .find((frame) => frame.uri === reference.uri && frame.t === reference.t);
    if (frame)
      placeFinding(
        window.CtrlFVideoWorkbench.pinFrame(record.id, record.query, frame),
      );
  } catch {
    announce("Use the save button on a supporting frame to save it.");
  }
});
function placeFinding(pin) {
  if (!pin || !investigation) return null;
  if (document.getElementById(pin.id)) {
    investigation.choose(pin.id);
    investigation.reveal(pin.id);
    return pin;
  }
  const card = node("article", `turn ${pin.kind}-node`);
  card.id = pin.id;
  card.dataset.kind = pin.kind;
  card.append(node("p", "question-bubble", pin.title));
  if (pin.kind === "evidence") {
    const frameButton = button("", "evidence-button", () => {
      investigation.evidence(pin.query);
      seek(pin.frame.t, frameButton);
    });
    frameButton.setAttribute(
      "aria-label",
      `Replay canvas evidence ${clock(pin.frame.t)}`,
    );
    const image = document.createElement("img");
    image.src = pin.frame.uri;
    image.alt = pin.frame.caption;
    frameButton.append(
      image,
      node("span", "evidence-caption", clock(pin.frame.t)),
    );
    card.append(frameButton, node("p", "artifact-caption", pin.frame.caption));
  } else {
    card.append(node("p", "answer-text", pin.query.response.answer));
    pin.query.response.unresolved.forEach((text) =>
      card.append(node("p", "artifact-unresolved", text)),
    );
  }
  card.append(node("p", "artifact-source", `Source: ${pin.query.question}`));
  card.append(
    button("Remove from findings", "text-button", () => removeFinding(pin.id)),
  );
  $("board-artifacts").append(card);
  const history = node("button", "");
  history.dataset.turn = card.id;
  history.dataset.sourceTurn = pin.turnId;
  investigation.register(
    card,
    {
      ...pin.query,
      question: pin.title,
      kind: pin.kind,
    mode: pin.query.mode,
    video_id: pin.query.video_id,
      sourceTurn: pin.turnId,
      parentTurn: pin.turnId,
    },
    history,
  );
  announce(
    `Saved ${pin.kind === "evidence" ? "Evidence frame" : "Finding"}, Move it on the canvas.`,
  );
  return pin;
}
function removeFinding(id) {
  const source = window.CtrlFVideoWorkbench?.getSnapshot().pins.find(
    (pin) => pin.id === id,
  )?.turnId;
  document.getElementById(id)?.remove();
  investigation?.remove(id);
  window.CtrlFVideoWorkbench?.remove(id);
  if (source) investigation?.choose(source);
  announce("Removed from findings; you can save it again.");
}
window.CtrlFVideoUI = {
  select: (id) => {
    investigation?.choose(id);
    investigation?.reveal(id);
  },
  seek: (seconds, query) => {
    seek(seconds);
    investigation?.evidence(query);
  },
  saveEvidence: (id, query, frame) =>
    placeFinding(window.CtrlFVideoWorkbench?.pinFrame(id, query, frame)),
  saveConclusion: (id, query) =>
    placeFinding(window.CtrlFVideoWorkbench?.pinConclusion(id, query)),
  focusFinding: (id) => {
    investigation?.choose(id);
    investigation?.reveal(id);
  },
  removeFinding,
  toggleInspector,
  demos: openDemoLibrary,
  openInspector,
  toggleSource: () => $("rail-source").click(),
  canvas: () => $("rail-canvas").click(),
  openLocal: () => $("open-local").click(),
  newTask,
  continueFrom: (id) => {
    setChatOpen(true);
    investigation?.choose(id);
    $("question").focus();
  },
};
function openInspector(tab = "context") {
  setChatOpen(false);
  window.CtrlFVideoWorkbench?.showPanel(tab);
  const shell = document.querySelector(".agent-shell");
  shell.classList.remove("inspector-collapsed");
  if (window.innerWidth < 1600) shell.classList.add("inspector-open");
  syncInspectorToggle();
  $(
    tab === "findings" ? "inspector-findings-tab" : "inspector-context-tab",
  ).focus();
}
document.querySelector(".skip-link")?.addEventListener("click", event => {
  event.preventDefault();
  setChatOpen(true, true);
});
$("agent-launcher").addEventListener("click", () => setChatOpen(document.querySelector(".agent-shell").classList.contains("chat-collapsed"), true));
$("collapse-agent").addEventListener("click", () => setChatOpen(false, true));
$("source-launcher").addEventListener("click", () => { setSourceOpen(true); $("expand-source").focus(); });
function setSourceExpanded(expanded) {
  document.querySelector(".agent-shell").classList.toggle("source-expanded", expanded);
  $("expand-source").setAttribute("aria-expanded", String(expanded));
  $("expand-source").setAttribute("aria-label", expanded ? "Shrink source player" : "Expand source player");
  $("expand-source").textContent = expanded ? "Shrink" : "Expand";
}
$("expand-source").addEventListener("click", () => setSourceExpanded(!document.querySelector(".agent-shell").classList.contains("source-expanded")));
$("source-dock").addEventListener("keydown", event => {
  if (event.key === "Escape") { setSourceExpanded(false); $("expand-source").focus(); }
});
$("rail-findings").addEventListener("click", () => openInspector("findings"));
$("toggle-inspector").addEventListener("click", toggleInspector);
$("collapse-source").addEventListener("click", () => {
  setSourceExpanded(false);
  setSourceOpen(false);
  $("source-launcher").focus();
});
$("rail-source").addEventListener("click", () =>
  setSourceOpen(
    document
      .querySelector(".agent-shell")
      .classList.contains("source-collapsed"),
  ),
);
setSourceOpen(
  !document
    .querySelector(".agent-shell")
    .classList.contains("source-collapsed"),
);
$("question-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!$("send-question").disabled) ask($("question").value.trim());
});
$("question").addEventListener("input", updateSend);
$("question").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    $("question-form").requestSubmit();
  }
});
document.querySelectorAll("[data-query]").forEach((element) =>
  element.addEventListener("click", () => {
    const query = demo?.queries.find(
      (item) => item.id === element.dataset.query,
    );
    if (query) ask(query.question);
  }),
);
document
  .querySelectorAll("[data-time]")
  .forEach((element) =>
    element.addEventListener("click", () => seek(Number(element.dataset.time))),
  );
function newTask() {
  setChatOpen(true);
  if (window.CtrlFVideoPersistence) { window.CtrlFVideoPersistence.newInvestigation(); return; }
  clearChat();
  if (localMode) {
    notice("This video is for local playback. Return to the demo to ask questions.");
  }
  showEvidence(false);
  if (!localMode) $("question").focus();
  announce("Demo conversation reset.");
}
$("reset-chat").addEventListener("click", newTask);
$("mobile-reset").addEventListener("click", newTask);
$("toggle-evidence").addEventListener("click", () => {
  const open = $("toggle-evidence").getAttribute("aria-expanded") !== "true";
  showEvidence(open);
  if (!open) $("question").scrollIntoView({ block: "center" });
});
["open-local", "attach-local"].forEach((id) => {
  $(id).addEventListener("click", () => $("file-input").click());
});
$("rail-video").addEventListener("click", () => {
  investigation?.evidence(null);
  showEvidence(true);
  player.focus();
});
$("file-input").addEventListener("change", () => {
  const file = $("file-input").files[0];
  if (file) window.CtrlFVideoPersistence?.upload(file);
  $("file-input").value = "";
});
$("restore-demo").addEventListener("click", () => {
  if (activeVideo) { window.CtrlFVideoPersistence?.openDemo(); return; }
  player.pause();
  if (localUrl) URL.revokeObjectURL(localUrl);
  localUrl = null;
  mediaReady = false;
  mediaFailed = false;
  pendingSeek = null;
  player.src = "/demo/video";
  player.preload = "auto";
  player.poster = "/media/demo_parcel/frames/0.jpg";
  player.load();
  setLocalMode(false);
  $("video-heading").textContent = "Package positions · Synthetic demo";
  $("attached-source-name").textContent = "Package positions demo.mp4";
  $("video-meta").textContent = "18 seconds · 1600 × 900 · No audio";
  $("file-input").value = "";
  showEvidence(false);
  announce("Returned to the demo. Your local file was not uploaded.");
});
function mediaLoaded() {
  mediaReady = true;
  mediaFailed = false;
  $("reload-video").hidden = true;
  updateMediaContext();
  if (localMode || activeVideo)
    $("video-meta").textContent =
      `${clock(player.duration)} · ${player.videoWidth} × ${player.videoHeight} · ${activeVideo?.job?.state === "ready" ? "Indexed" : "Not indexed"}`;
  if (pendingSeek !== null) {
    const seconds = pendingSeek;
    const trigger = pendingSeekTrigger;
    pendingSeek = null;
    pendingSeekTrigger = null;
    if (pendingSeekRestore) { player.currentTime = seconds; player.pause(); pendingSeekRestore = false; }
    else seek(seconds, trigger);
  }
  updateTime();
}
player.addEventListener("loadedmetadata", mediaLoaded);
if (player.readyState >= 1) mediaLoaded();
else updateMediaContext();
player.addEventListener("error", () => {
  mediaReady = false;
  mediaFailed = true;
  updateMediaContext();
  pendingSeek = null;
  $("seek-status").textContent =
    "Cannot play video. Reload or choose a browser-supported format.";
  $("reload-video").hidden = false;
  announce($("seek-status").textContent);
});
$("reload-video").addEventListener("click", () => {
  mediaFailed = false;
  mediaReady = false;
  updateMediaContext();
  player.load();
  $("seek-status").textContent = "Reloading video…";
});
player.addEventListener("timeupdate", updateTime);
player.addEventListener("play", updateTime);
player.addEventListener("pause", updateTime);
window.addEventListener("beforeunload", () => {
  if (localUrl) URL.revokeObjectURL(localUrl);
});
document.querySelectorAll("[data-query]").forEach((element) => {
  element.disabled = true;
});
if (window.CtrlFVideoCanvas)
  investigation = window.CtrlFVideoCanvas.start({
    select: selectTask,
    ask,
    announce,
    close: () => showEvidence(false),
  });
fetch("/demo/catalog")
  .then((response) => {
    if (!response.ok) throw new Error("catalog");
    return response.json();
  })
  .then((data) => {
    demo = data;
    renderScenarios();
    document.querySelectorAll("[data-query]").forEach((element) => {
      element.disabled = localMode;
    });
    updateSend();
    window.dispatchEvent(new Event("ctrlf-video-catalog-ready"));
  })
  .catch(() => {
    notice("Demo data unavailable. Reload to retry.");
    announce("Demo data failed to load.");
  });

window.CtrlFVideoSessionUI = {
  snapshot: () => ({ ...window.CtrlFVideoWorkbench.getSnapshot(), canvas: investigation?.snapshot(),
    ui: { sourceOpen: !document.querySelector(".agent-shell").classList.contains("source-collapsed"),
      inspectorOpen: !document.querySelector(".agent-shell").classList.contains("inspector-collapsed"),
      chatOpen: !document.querySelector(".agent-shell").classList.contains("chat-collapsed"),
      playerTime: player.currentTime, draft: $("question").value } }),
  renameSource(name) {
    if(!activeVideo) return;
    activeVideo={...activeVideo,name};
    $("video-heading").textContent=name;$("attached-source-name").textContent=name;
    window.CtrlFVideoWorkbench.describe(activeVideo);
  },
  showSource: () => setSourceOpen(true),
  restoreDraft(value) { $("question").value = value; updateSend(); },
  currentContext: () => investigation?.context()?.query || null,
  ready: () => !!demo,
  busy(value) { realBusy = value; updateSend(); },
  clear: clearChat,
  notify: notice,
  answer(query, submittedDraft) {
    renderAnswer(query);
    if (submittedDraft !== undefined && $("question").value.trim() === submittedDraft)
      $("question").value = "";
    updateSend();
  },
  applySource(video) {
    $("resume-query").hidden = true;
    activeVideo = video?.id === "demo_parcel" ? null : video;
    player.pause(); mediaReady = false; mediaFailed = false; pendingSeek = null;
    if (activeVideo) {
      setLocalMode(true);
      player.src = `/media/${video.id}/video`; player.removeAttribute("poster");
      localMode = video.job?.state !== "ready";
      window.CtrlFVideoWorkbench.source(localMode);
      window.CtrlFVideoWorkbench.describe(video);
      $("question").disabled = localMode;
      $("question").placeholder = localMode ? "Source analysis is incomplete." : "Ask a follow-up or give the agent a task…";
      $("video-heading").textContent = video.name;
      $("attached-source-name").textContent = video.name;
      $("mode-label").textContent = "Uploaded source";
      $("video-state").textContent = localMode ? "Uploaded" : "Index ready";
      $("video-state").title = "Private source · saved in this workspace";
      $("empty-eyebrow").textContent = "Uploaded source";
      $("canvas-hint").textContent = localMode ? "Source saved · questions available after analysis" : "Drag the background to pan · Ctrl / ⌘ + Scroll to zoom";
      $("composer-mode-text").textContent = video.job?.state === "ready" ? "Model analysis · evidence questions" : "Uploaded source · awaiting analysis";
      $("source-thumbnail").hidden = !video.metadata?.preview?.length;
      if (video.metadata?.preview?.[0]) $("source-thumbnail").src = video.metadata.preview[0].uri;
      $("demo-notice-text").textContent = "Source saved in this workspace. Model analysis requires configured services and approved budgets.";
      $("local-note").textContent = "Uploaded to this workspace. Each source has its own investigation and evidence.";
      $("restore-demo").hidden = false;
      $("suggestions").hidden = true;
      $("empty-state").querySelector("h1").textContent = localMode ? "Source saved; awaiting analysis." : "Investigate this recording.";
      $("empty-state").querySelector(".task-intro > p").textContent = localMode ? "Check progress in Sources; analysis requires configuration." : "Ask, replay evidence and follow up from any question.";
      notice("");
    } else {
      setLocalMode(false); player.src = "/demo/video"; player.poster = "/media/demo_parcel/frames/0.jpg";
      $("video-heading").textContent = "Package positions · Synthetic demo";
      $("attached-source-name").textContent = "Package positions demo.mp4";
      $("source-thumbnail").src = "/media/demo_parcel/frames/0.jpg";
      $("source-thumbnail").hidden = false;
      window.CtrlFVideoWorkbench.describe({id:"demo_parcel",name:"Package positions · Synthetic demo",metadata:{duration:18,audio:false}});
    }
    player.load(); updateSend();
  },
  restore(saved, video) {
    this.applySource(video);
    for (const record of saved.records || []) renderAnswer({ ...record.query, savedTurn: record.id });
    window.CtrlFVideoWorkbench.hydrate({ ...saved, local: localMode, sourceInfo: video });
    for (const pin of saved.pins || []) placeFinding(pin);
    if (saved.selectedId) investigation?.choose(saved.selectedId);
    investigation?.restore(saved.canvas);
    if (saved.ui) {
      setSourceOpen(saved.ui.sourceOpen !== false);
      setChatOpen(saved.ui.chatOpen !== false);
      document.querySelector(".agent-shell").classList.toggle("inspector-collapsed", saved.ui.chatOpen === undefined || saved.ui.inspectorOpen === false);
      syncInspectorToggle();
      $("question").value = saved.ui.draft || ""; updateSend();
      if (saved.ui.playerTime > 0) { pendingSeek = saved.ui.playerTime; pendingSeekRestore = true; }
    }
  },
};
