// Oneshot Arcade dashboard. Reads ./data/catalog.json, which scripts/build-site.mjs generates.
const $ = (sel, el = document) => el.querySelector(sel);
const STATUS_LABEL = {
  complete: "Complete",
  partial: "Partial",
  failed: "Failed",
  running: "Running",
  queued: "Queued",
  missing: "Not run yet",
};

const state = { view: "matrix", game: null, model: null, hidden: new Set() };
let data;

function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === "class") el.className = value;
    else if (key === "style") el.style.cssText = value;
    else if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
    else if (key === "dataset") Object.assign(el.dataset, value);
    else el.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat()) if (child != null && child !== false) el.append(child);
  return el;
}

// ---------- state <-> URL hash ----------
function readHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  state.view = ["matrix", "game", "model"].includes(params.get("view")) ? params.get("view") : "matrix";
  state.game = params.get("game");
  state.model = params.get("model");
  state.hidden = new Set((params.get("hide") ?? "").split(",").filter(Boolean));
}
function writeHash() {
  const params = new URLSearchParams();
  if (state.view !== "matrix") params.set("view", state.view);
  if (state.view === "game" && state.game) params.set("game", state.game);
  if (state.view === "model" && state.model) params.set("model", state.model);
  if (state.hidden.size) params.set("hide", [...state.hidden].join(","));
  const next = params.toString();
  if (next !== location.hash.slice(1)) history.replaceState(null, "", next ? `#${next}` : location.pathname);
}
function go(patch) {
  Object.assign(state, patch);
  writeHash();
  render();
  if (patch.view) $("#view").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- data helpers ----------
const buildFor = (modelId, gameId) => data.builds.find((b) => b.model === modelId && b.game === gameId);
const gameById = (id) => data.games.find((g) => g.id === id);
const modelById = (id) => data.models.find((m) => m.id === id);
const visibleModels = () => data.models.filter((m) => !state.hidden.has(m.id));
const statusOf = (b) => (b ? b.status : "missing");
const isDone = (b) => b && (b.status === "complete" || b.status === "partial");

function testsLabel(b) {
  if (!b?.tests) return null;
  const { passed = 0, failed = 0 } = b.tests;
  return failed ? `${passed} pass · ${failed} fail` : `${passed} tests`;
}
function durationLabel(b) {
  const m = b?.durationMinutes;
  if (!m) return null;
  return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m` : `${m}m`;
}
function scoreLabel(b) {
  const s = b?.selfScore;
  if (!s || !(s.playability || s.polish || s.fidelity)) return null;
  return `${s.playability ?? "–"} / ${s.polish ?? "–"} / ${s.fidelity ?? "–"}`;
}

// ---------- shared pieces ----------
function statusPill(b) {
  const s = statusOf(b);
  return h("span", { class: `pill pill-${s}` }, STATUS_LABEL[s]);
}
function modelDot(model) {
  return h("i", { class: "dot", style: `--c:${model.color}`, "aria-hidden": "true" });
}
function shot(b, game, { large = false } = {}) {
  const frame = h("div", { class: `shot${large ? " shot-large" : ""}` });
  if (b?.screenshotUrl) {
    frame.append(
      h("img", {
        src: b.screenshotUrl,
        alt: `${game.name} gameplay, ${modelById(b.model)?.label ?? b.model} build`,
        loading: "lazy",
        decoding: "async",
      }),
    );
  } else {
    frame.classList.add("shot-empty");
    frame.append(h("span", { class: "glyph", "aria-hidden": "true" }, game.glyph ?? "◻"));
  }
  return frame;
}
function playButton(b, label = "PLAY") {
  if (!b?.playUrl) {
    const why = isDone(b) ? "NOT BUILT" : b?.status === "running" ? "IN PROGRESS" : b?.status === "queued" ? "QUEUED" : "NO BUILD";
    return h("span", { class: "btn btn-disabled", "aria-disabled": "true" }, why);
  }
  return h("a", { class: "btn btn-play", href: b.playUrl, target: "_blank", rel: "noopener" }, `${label} ↗`);
}
function textLink(href, label) {
  return href ? h("a", { class: "text-link", href, target: "_blank", rel: "noopener" }, `${label} ↗`) : null;
}

// ---------- stats + filters ----------
function renderStats() {
  const done = data.builds.filter(isDone);
  const playable = data.builds.filter((b) => b.playUrl);
  const cells = data.games.length * data.models.length;
  const stat = (value, label) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)));
  $("#stats").replaceChildren(
    stat(data.games.length, "GAMES"),
    stat(data.models.length, "MODELS"),
    stat(`${done.length}/${cells}`, "BUILDS"),
    stat(playable.length, "PLAYABLE"),
    ...(data.builds.some((b) => b.status === "running") ? [stat(data.builds.filter((b) => b.status === "running").length, "RUNNING NOW")] : []),
  );
}
function renderFilters() {
  $("#model-filters").replaceChildren(
    ...data.models.map((m) => {
      const on = !state.hidden.has(m.id);
      const count = data.games.filter((g) => isDone(buildFor(m.id, g.id))).length;
      return h(
        "button",
        {
          type: "button",
          class: `chip${on ? " on" : ""}`,
          "aria-pressed": String(on),
          title: `${m.label}: ${m.harness}, ${m.effort} effort. ${count} of ${data.games.length} games built.`,
          onclick: () => {
            if (on) state.hidden.add(m.id);
            else state.hidden.delete(m.id);
            if (state.hidden.size === data.models.length) state.hidden.delete(m.id);
            writeHash();
            render();
          },
        },
        modelDot(m),
        m.label,
        h("small", {}, `${count}/${data.games.length}`),
      );
    }),
  );
  document.querySelectorAll(".tabs [data-view]").forEach((tab) => {
    const active = tab.dataset.view === state.view;
    tab.setAttribute("aria-selected", String(active));
    tab.classList.toggle("active", active);
  });
}

// ---------- matrix view ----------
function renderMatrix() {
  const models = visibleModels();
  const grid = h("div", {
    class: "matrix",
    role: "table",
    "aria-label": "Games by model",
    style: `--cols:${models.length}`,
  });
  grid.append(
    h("div", { class: "mx-corner", role: "columnheader" }, h("span", {}, "GAME"), h("span", {}, "MODEL →")),
    ...models.map((m) => {
      const count = data.games.filter((g) => isDone(buildFor(m.id, g.id))).length;
      return h(
        "button",
        {
          type: "button",
          class: "mx-model",
          role: "columnheader",
          style: `--c:${m.color}`,
          onclick: () => go({ view: "model", model: m.id }),
          title: `See every ${m.label} build`,
        },
        h("b", {}, m.label),
        h("span", {}, `${m.harness} · ${m.effort}`),
        h("span", { class: "mx-meter", "aria-label": `${count} of ${data.games.length} built` },
          h("i", { style: `width:${(count / data.games.length) * 100}%` })),
      );
    }),
  );
  data.games.forEach((g, i) => {
    grid.append(
      h(
        "div",
        { class: "mx-game", role: "rowheader" },
        h("span", { class: "num" }, String(i + 1).padStart(2, "0")),
        h(
          "div",
          {},
          h("button", { type: "button", class: "mx-game-name", onclick: () => go({ view: "game", game: g.id }) }, g.name),
          h("p", {}, g.genre),
          h("button", { type: "button", class: "text-link", onclick: () => showPrompt(g) }, "BRIEF ↗"),
        ),
      ),
    );
    for (const m of models) {
      const b = buildFor(m.id, g.id);
      const cell = h(
        "button",
        {
          type: "button",
          role: "cell",
          class: `mx-cell status-${statusOf(b)}`,
          style: `--c:${m.color}`,
          "aria-label": `${g.name} by ${m.label}: ${STATUS_LABEL[statusOf(b)]}`,
          onclick: () => (b ? showBuild(b) : null),
          disabled: !b || null,
        },
        shot(b, g),
        h(
          "span",
          { class: "mx-cell-meta" },
          statusPill(b),
          b?.purity === "iterated" ? h("span", { class: "purity-tag", title: "This build had more than one attempt." }, "ITERATED") : null,
          testsLabel(b) ? h("span", { class: "muted" }, testsLabel(b)) : null,
        ),
      );
      grid.append(cell);
    }
  });
  return h("div", { class: "matrix-wrap" }, grid);
}

// ---------- by-game view ----------
function renderByGame() {
  const game = gameById(state.game) ?? data.games[0];
  state.game = game.id;
  const picker = h(
    "div",
    { class: "picker", role: "tablist", "aria-label": "Game" },
    ...data.games.map((g) =>
      h(
        "button",
        {
          type: "button",
          role: "tab",
          class: g.id === game.id ? "active" : null,
          "aria-selected": String(g.id === game.id),
          onclick: () => go({ game: g.id }),
        },
        h("span", { class: "glyph-sm", "aria-hidden": "true" }, g.glyph ?? ""),
        g.name,
        h("small", {}, `${data.models.filter((m) => isDone(buildFor(m.id, g.id))).length}`),
      ),
    ),
  );
  const head = h(
    "div",
    { class: "compare-head" },
    h(
      "div",
      {},
      h("p", { class: "eyebrow" }, game.genre.toUpperCase()),
      h("h2", {}, game.name),
      h("p", { class: "pitch" }, game.pitch),
    ),
    h("button", { type: "button", class: "btn", onclick: () => showPrompt(game) }, "READ THE BRIEF ↗"),
  );
  const cards = visibleModels().map((m) => {
    const b = buildFor(m.id, game.id);
    return h(
      "article",
      { class: `compare-card status-${statusOf(b)}`, style: `--c:${m.color}` },
      h(
        "button",
        { type: "button", class: "card-shot", onclick: () => b && showBuild(b), disabled: !b || null, "aria-label": `Details for ${m.label}` },
        shot(b, game),
      ),
      h(
        "div",
        { class: "card-body" },
        h("div", { class: "card-title" }, modelDot(m), h("b", {}, m.label), statusPill(b)),
        h("p", { class: "muted small" }, `${m.harness} · ${m.effort} effort${b?.purity === "iterated" ? " · iterated" : ""}`),
        b?.summary
          ? h("p", { class: "summary" }, b.summary)
          : h("p", { class: "summary muted" }, b?.notes ?? "This model has not been run on this brief yet."),
        b ? metaList(b, true) : null,
        h(
          "div",
          { class: "card-actions" },
          playButton(b),
          b ? h("button", { type: "button", class: "btn btn-ghost", onclick: () => showBuild(b) }, "DETAILS") : null,
        ),
      ),
    );
  });
  return h("div", {}, picker, head, h("div", { class: "compare-grid" }, cards));
}

// ---------- by-model view ----------
function renderByModel() {
  const model = modelById(state.model) ?? data.models[0];
  state.model = model.id;
  const picker = h(
    "div",
    { class: "picker", role: "tablist", "aria-label": "Model" },
    ...data.models.map((m) =>
      h(
        "button",
        {
          type: "button",
          role: "tab",
          class: m.id === model.id ? "active" : null,
          "aria-selected": String(m.id === model.id),
          style: `--c:${m.color}`,
          onclick: () => go({ model: m.id }),
        },
        modelDot(m),
        m.label,
        h("small", {}, `${data.games.filter((g) => isDone(buildFor(m.id, g.id))).length}`),
      ),
    ),
  );
  const built = data.builds.filter((b) => b.model === model.id);
  const tests = built.reduce((sum, b) => sum + (b.tests?.passed ?? 0), 0);
  const head = h(
    "div",
    { class: "compare-head", style: `--c:${model.color}` },
    h(
      "div",
      {},
      h("p", { class: "eyebrow" }, `${model.vendor ?? ""} · ${model.harness} · ${model.effort} effort`.toUpperCase()),
      h("h2", {}, modelDot(model), model.label),
      h("p", { class: "pitch" }, `${built.filter(isDone).length} of ${data.games.length} briefs built · ${tests} passing tests reported · model id ${model.model}`),
    ),
  );
  const cards = data.games.map((g, i) => {
    const b = buildFor(model.id, g.id);
    return h(
      "article",
      { class: `game-card status-${statusOf(b)}`, style: `--c:${model.color}` },
      h(
        "button",
        { type: "button", class: "card-shot", onclick: () => b && showBuild(b), disabled: !b || null, "aria-label": `Details for ${g.name}` },
        shot(b, g),
        h("span", { class: "num-badge" }, String(i + 1).padStart(2, "0")),
      ),
      h(
        "div",
        { class: "card-body" },
        h("p", { class: "eyebrow" }, g.genre.toUpperCase()),
        h("div", { class: "card-title" }, h("b", {}, g.name), statusPill(b)),
        h("p", { class: "summary" }, b?.summary ?? g.pitch),
        h(
          "div",
          { class: "card-actions" },
          playButton(b),
          h("button", { type: "button", class: "btn btn-ghost", onclick: () => go({ view: "game", game: g.id }) }, "COMPARE"),
        ),
      ),
    );
  });
  return h("div", {}, picker, head, h("div", { class: "game-grid" }, cards));
}

// ---------- build detail ----------
function metaList(b, compact = false) {
  const rows = [
    ["Tests", testsLabel(b)],
    ["Run time", durationLabel(b)],
    ["Self-score", scoreLabel(b) ? `${scoreLabel(b)}  (play / polish / fidelity)` : null],
    ...(compact
      ? []
      : [
          ["Status", STATUS_LABEL[b.status]],
          ["Attempt", b.purity === "iterated" ? "Iterated (more than one attempt)" : "One-shot"],
          ["Date", b.date],
          ["Harness", b.harnessVersion],
          ["Stack", Array.isArray(b.stack) ? b.stack.join(", ") : b.stack],
        ]),
  ].filter(([, v]) => v);
  if (!rows.length) return null;
  return h("dl", { class: compact ? "meta meta-compact" : "meta" }, rows.map(([k, v]) => h("div", {}, h("dt", {}, k), h("dd", {}, v))));
}
const buildDialog = $("#build-dialog");
function showBuild(b) {
  const game = gameById(b.game);
  const model = modelById(b.model);
  const others = data.models.filter((m) => m.id !== b.model && buildFor(m.id, b.game));
  $("#build-body").replaceChildren(
    h(
      "div",
      { class: "sheet-head" },
      h(
        "div",
        {},
        h("p", { class: "eyebrow" }, `${game.genre} · built by`.toUpperCase()),
        h("h2", { id: "build-title" }, game.name, h("span", { class: "by", style: `--c:${model.color}` }, modelDot(model), model.label)),
      ),
      h("button", { type: "button", class: "close", "aria-label": "Close", onclick: () => buildDialog.close() }, "×"),
    ),
    h(
      "div",
      { class: "detail" },
      shot(b, game, { large: true }),
      h(
        "div",
        { class: "detail-side" },
        h("div", { class: "card-title" }, statusPill(b), b.purity === "iterated" ? h("span", { class: "purity-tag" }, "ITERATED") : null),
        b.summary ? h("p", { class: "summary" }, b.summary) : null,
        metaList(b),
        b.notes ? h("p", { class: "notes" }, b.notes) : null,
        h("div", { class: "card-actions" }, playButton(b, "PLAY GAME")),
        h(
          "div",
          { class: "link-row" },
          textLink(b.reportUrl, "ONESHOT REPORT"),
          textLink(b.verificationUrl, "VERIFICATION"),
          textLink(b.readmeUrl, "README"),
          textLink(b.sourceUrl, "SOURCE"),
          h("button", { type: "button", class: "text-link", onclick: () => showPrompt(game) }, "BRIEF ↗"),
        ),
        others.length
          ? h(
              "div",
              { class: "others" },
              h("p", { class: "eyebrow" }, "SAME BRIEF, OTHER MODELS"),
              h(
                "div",
                { class: "other-list" },
                others.map((m) =>
                  h("button", { type: "button", class: "chip on", onclick: () => showBuild(buildFor(m.id, b.game)) }, modelDot(m), m.label),
                ),
                h("button", { type: "button", class: "text-link", onclick: () => { buildDialog.close(); go({ view: "game", game: b.game }); } }, "COMPARE ALL →"),
              ),
            )
          : null,
      ),
    ),
  );
  if (!buildDialog.open) buildDialog.showModal();
}

// ---------- prompt viewer ----------
const promptDialog = $("#prompt-dialog");
let promptRequest;
async function showPrompt(game) {
  const isHarness = !game;
  const url = isHarness ? "./prompts/ONESHOT-HARNESS.md" : `./prompts/games/${encodeURIComponent(game.prompt)}`;
  promptRequest?.abort();
  promptRequest = new AbortController();
  $("#prompt-eyebrow").textContent = isHarness ? "SHARED BY EVERY RUN" : "THE GAME BRIEF · GIVEN VERBATIM TO EVERY MODEL";
  $("#prompt-title").textContent = isHarness ? "The one-shot harness" : game.name;
  $("#prompt-raw").href = url;
  $("#prompt-content").textContent = "Loading…";
  if (buildDialog.open) buildDialog.close();
  promptDialog.showModal();
  try {
    const response = await fetch(url, { signal: promptRequest.signal });
    if (!response.ok) throw new Error(String(response.status));
    $("#prompt-content").textContent = await response.text();
    $(".prompt-body").scrollTop = 0;
  } catch (error) {
    if (error.name !== "AbortError") $("#prompt-content").textContent = "The prompt could not be loaded. Use OPEN MARKDOWN instead.";
  }
}
promptDialog.addEventListener("close", () => promptRequest?.abort());
for (const dialog of [promptDialog, buildDialog]) {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || event.target.closest("[data-close]")) dialog.close();
  });
}
$("#open-harness").addEventListener("click", () => showPrompt(null));
document.querySelectorAll("[data-open-harness]").forEach((el) => el.addEventListener("click", () => showPrompt(null)));
document.querySelectorAll(".tabs [data-view]").forEach((tab) => tab.addEventListener("click", () => go({ view: tab.dataset.view })));

// ---------- boot ----------
function render() {
  renderFilters();
  const view = state.view === "game" ? renderByGame() : state.view === "model" ? renderByModel() : renderMatrix();
  $("#view").replaceChildren(view);
  writeHash();
}
async function boot() {
  try {
    const response = await fetch("./data/catalog.json", { cache: "no-store" });
    if (!response.ok) throw new Error(String(response.status));
    data = await response.json();
  } catch {
    $("#view").replaceChildren(
      h("p", { class: "loading" }, "The catalog could not be loaded. Run `npm run site` and serve the site/ folder."),
    );
    return;
  }
  if (data.repoUrl) $("#repo-link").href = data.repoUrl;
  $("#generated").textContent = `UPDATED ${new Date(data.generatedAt).toISOString().slice(0, 10)}`;
  readHash();
  renderStats();
  render();
}
window.addEventListener("hashchange", () => {
  readHash();
  render();
});
boot();
