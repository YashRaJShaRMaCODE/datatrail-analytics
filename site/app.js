const casesNode = document.querySelector("#cases");
const search = document.querySelector("#search");
const levelFilter = document.querySelector("#level-filter");
const toolFilter = document.querySelector("#tool-filter");
const datasetFilter = document.querySelector("#dataset-filter");
const sortFilter = document.querySelector("#sort-filter");
const savedOnly = document.querySelector("#saved-only");
const resultCount = document.querySelector("#result-count");
const empty = document.querySelector("#empty-state");
const savedList = document.querySelector("#saved-list");
const savedCount = document.querySelector("#saved-count");
const status = document.querySelector("#status");
const listFile = document.querySelector("#list-file");
const storageKey = "data-fieldnotes:saved-v1";
const params = new URLSearchParams(location.search);
const state = {
  query: params.get("q") || "",
  level: params.get("level") || "",
  tool: params.get("tool") || "",
  dataset: params.get("dataset") || "",
  sort: params.get("sort") || "",
  savedOnly: params.get("saved") === "1",
  openCase: params.get("case") || "",
  casebook: null,
  saved: new Set(),
};

search.value = state.query;
savedOnly.checked = state.savedOnly;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com" ? url.href : "";
  } catch {
    return "";
  }
}

function syncUrl() {
  const url = new URL(location.href);
  for (const key of ["q", "level", "tool", "dataset", "sort", "saved", "case"]) url.searchParams.delete(key);
  if (state.query.trim()) url.searchParams.set("q", state.query.trim());
  if (state.level) url.searchParams.set("level", state.level);
  if (state.tool) url.searchParams.set("tool", state.tool);
  if (state.dataset) url.searchParams.set("dataset", state.dataset);
  if (state.sort) url.searchParams.set("sort", state.sort);
  if (state.savedOnly) url.searchParams.set("saved", "1");
  if (state.openCase) url.searchParams.set("case", state.openCase);
  history.replaceState(null, "", url);
}

function setOptions(select, values, firstLabel) {
  const current = select.value;
  select.replaceChildren(new Option(firstLabel, ""));
  [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b)).forEach(value => select.add(new Option(value, value)));
  select.value = [...select.options].some(option => option.value === current) ? current : "";
}

function allProjects() {
  return state.casebook?.projects || [];
}

function saveStorage() {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...state.saved]));
  } catch {
    status.textContent = "Browser storage is unavailable; the reading list may not persist.";
  }
}

function renderSaved() {
  const saved = allProjects().filter(project => state.saved.has(project.slug));
  savedCount.textContent = String(saved.length);
  document.querySelector("#copy-shortlist").disabled = saved.length === 0;
  document.querySelector("#backup-list").disabled = saved.length === 0;
  savedList.replaceChildren();
  if (!saved.length) {
    savedList.append(element("li", "saved-empty", "No saved case studies yet."));
    return;
  }
  saved.forEach(project => {
    const row = element("li");
    const link = element("a", "", project.title);
    const url = new URL(location.href);
    url.search = "";
    url.searchParams.set("case", project.slug);
    link.href = url.href;
    const remove = element("button", "", "Remove");
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${project.title} from saved cases`);
    remove.addEventListener("click", () => toggleSaved(project));
    row.append(link, remove);
    savedList.append(row);
  });
}

function toggleSaved(project) {
  if (state.saved.has(project.slug)) state.saved.delete(project.slug);
  else state.saved.add(project.slug);
  saveStorage();
  renderSaved();
  render();
}

function projectMatches(project) {
  const text = JSON.stringify(project).toLocaleLowerCase();
  return (!state.query.trim() || text.includes(state.query.trim().toLocaleLowerCase()))
    && (!state.level || project.level === state.level)
    && (!state.tool || project.tools.includes(state.tool))
    && window.CasebookLogic.matchesDatasetNote(project, state.dataset)
    && (!state.savedOnly || state.saved.has(project.slug));
}

function addFact(container, label, value) {
  if (value === null || value === undefined || value === "") return;
  const fact = element("span");
  fact.append(element("strong", "", `${label} `), document.createTextNode(value));
  container.append(fact);
}

function renderCase(project) {
  const article = element("article", "case-entry");
  article.setAttribute("role", "listitem");
  article.id = `case-${project.slug}`;
  const level = element("div", `case-level level-${project.level.toLocaleLowerCase()}`);
  const marker = element("span", "level-mark", project.level[0]);
  level.append(marker, document.createTextNode(project.level));

  const content = element("div", "case-content");
  content.append(element("h3", "", project.title));
  content.append(element("p", "case-objective", project.objective || "Project objective is not documented in the notebook."));
  const facts = element("div", "case-facts");
  addFact(facts, "Input rows", project.dataset.rows === null ? "not matched" : project.dataset.rows.toLocaleString("en-IN"));
  addFact(facts, "Columns", project.dataset.columns);
  content.append(facts);

  const tools = element("div", "tool-list");
  project.tools.forEach(tool => tools.append(element("span", "tool-tag", tool)));
  if (tools.childElementCount) content.append(tools);

  const detail = element("details", "case-details");
  detail.open = state.openCase === project.slug;
  const summary = element("summary", "", "Scope, data note & notebook");
  detail.append(summary);
  const detailBody = element("div", "case-detail");
  detailBody.append(element("p", "", `Dataset file: ${project.dataset.name}. The row count is from the bundled CSV and is not a measure of representativeness or analysis quality.`));
  if (project.dataset.rows !== null && project.dataset.rows < 30) {
    detailBody.append(element("p", "data-flag", "Small practice sample — use for method exploration, not broad conclusions."));
  }
  if (project.dataset.raggedRows > 0) {
    detailBody.append(element("p", "data-flag", `${project.dataset.raggedRows} CSV records do not match the header column count; inspect data parsing before interpreting results.`));
  }
  if (project.dataset.rows === null) {
    detailBody.append(element("p", "data-flag", "No bundled CSV was matched to this notebook; verify its data source in the notebook."));
  }
  const notebook = element("a", "", "Read notebook source ↗");
  notebook.href = safeExternalUrl(project.notebook);
  notebook.target = "_blank";
  notebook.rel = "noopener noreferrer";
  detailBody.append(notebook);
  detail.append(detailBody);
  detail.addEventListener("toggle", () => {
    state.openCase = detail.open ? project.slug : "";
    syncUrl();
  });
  content.append(detail);

  const actions = element("div", "case-actions");
  const save = element("button", "", state.saved.has(project.slug) ? "Saved ✓" : "Save +");
  save.type = "button";
  save.setAttribute("aria-pressed", String(state.saved.has(project.slug)));
  save.setAttribute("aria-label", `${state.saved.has(project.slug) ? "Remove" : "Save"} ${project.title}`);
  save.addEventListener("click", () => toggleSaved(project));
  const share = element("button", "", "Copy link");
  share.type = "button";
  share.addEventListener("click", async () => {
    const url = new URL(location.href);
    url.search = "";
    url.searchParams.set("case", project.slug);
    try {
      await navigator.clipboard.writeText(url.href);
      status.textContent = `Link copied: ${project.title}.`;
    } catch {
      status.textContent = "Could not copy. Open the case and copy its address from the browser bar.";
    }
  });
  actions.append(save, share);
  const repoLink = element("a", "", "Notebook ↗");
  repoLink.href = safeExternalUrl(project.notebook);
  repoLink.target = "_blank";
  repoLink.rel = "noopener noreferrer";
  actions.append(repoLink);
  article.append(level, content, actions);
  return article;
}

function render() {
  if (!state.casebook) return;
  const projects = window.CasebookLogic.sortProjects(allProjects().filter(projectMatches), state.sort);
  if (state.openCase && !projects.some(project => project.slug === state.openCase)) state.openCase = "";
  syncUrl();
  const fragment = document.createDocumentFragment();
  projects.forEach(project => fragment.append(renderCase(project)));
  casesNode.replaceChildren(fragment);
  resultCount.textContent = `${projects.length} ${projects.length === 1 ? "study" : "studies"}`;
  empty.hidden = projects.length > 0;
  casesNode.hidden = projects.length === 0;
}

async function copyShortlist() {
  const projects = allProjects().filter(project => state.saved.has(project.slug));
  const markdown = ["# Data Fieldnotes reading list", "", ...projects.map(project => {
    const url = new URL(location.href);
    url.search = "";
    url.searchParams.set("case", project.slug);
    return `- [${project.title}](${url.href}) — ${project.level}`;
  })].join("\n");
  try {
    await navigator.clipboard.writeText(markdown);
    status.textContent = "Saved links copied as Markdown.";
  } catch {
    status.textContent = "Could not copy. Check clipboard permission and try again.";
  }
}

function backupReadingList() {
  const slugs = allProjects().filter(project => state.saved.has(project.slug)).map(project => project.slug);
  if (!slugs.length) return;
  const backup = { format: "data-fieldnotes-reading-list", version: 1, slugs };
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
  const link = element("a");
  link.href = url;
  link.download = "data-fieldnotes-reading-list.json";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  status.textContent = `Downloaded ${slugs.length} saved case ${slugs.length === 1 ? "link" : "links"}.`;
}

async function restoreReadingList(file) {
  if (!file) return;
  listFile.value = "";
  if (file.size > 200_000) {
    status.textContent = "That reading-list backup is too large.";
    return;
  }
  try {
    const backup = JSON.parse(await file.text());
    const merged = window.CasebookLogic.mergeSavedSlugs(state.saved, backup, allProjects().map(project => project.slug));
    if (!merged) throw new Error("unsupported backup");
    const previousValidCount = allProjects().filter(project => state.saved.has(project.slug)).length;
    const added = merged.length - previousValidCount;
    state.saved = new Set(merged);
    saveStorage();
    renderSaved();
    render();
    status.textContent = `Restored ${added} new ${added === 1 ? "case" : "cases"}; existing saved cases kept.`;
  } catch {
    status.textContent = "Could not restore that file. Choose a Data Fieldnotes reading-list backup.";
  }
}

search.addEventListener("input", () => { state.query = search.value; render(); });
levelFilter.addEventListener("change", () => { state.level = levelFilter.value; render(); });
toolFilter.addEventListener("change", () => { state.tool = toolFilter.value; render(); });
datasetFilter.addEventListener("change", () => { state.dataset = datasetFilter.value; render(); });
sortFilter.addEventListener("change", () => { state.sort = sortFilter.value; render(); });
savedOnly.addEventListener("change", () => { state.savedOnly = savedOnly.checked; render(); });
document.querySelector("#clear-filters").addEventListener("click", () => {
  state.query = "";
  state.level = "";
  state.tool = "";
  state.dataset = "";
  state.sort = "";
  state.savedOnly = false;
  search.value = "";
  levelFilter.value = "";
  toolFilter.value = "";
  datasetFilter.value = "";
  sortFilter.value = "";
  savedOnly.checked = false;
  render();
  search.focus();
});
document.querySelector("#copy-shortlist").addEventListener("click", copyShortlist);
document.querySelector("#backup-list").addEventListener("click", backupReadingList);
document.querySelector("#restore-list").addEventListener("click", () => listFile.click());
listFile.addEventListener("change", () => void restoreReadingList(listFile.files?.[0]));
document.querySelector("#print-casebook").addEventListener("click", () => window.print());
document.addEventListener("keydown", event => {
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    search.focus();
  } else if (event.key === "Escape" && document.activeElement === search) {
    state.query = "";
    search.value = "";
    render();
  }
});

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
  if (Array.isArray(saved)) state.saved = new Set(saved.filter(value => typeof value === "string"));
} catch {
  state.saved = new Set();
}

fetch("data/casebook.json")
  .then(response => {
    if (!response.ok) throw new Error("Casebook data could not be loaded");
    return response.json();
  })
  .then(casebook => {
    state.casebook = casebook;
    document.querySelector("#restore-list").disabled = false;
    setOptions(levelFilter, casebook.levels, "All tracks");
    setOptions(toolFilter, casebook.projects.flatMap(project => project.tools), "All tools");
    levelFilter.value = casebook.levels.includes(state.level) ? state.level : "";
    toolFilter.value = [...toolFilter.options].some(option => option.value === state.tool) ? state.tool : "";
    datasetFilter.value = ["", "small", "unmatched", "review"].includes(state.dataset) ? state.dataset : "";
    sortFilter.value = ["", "title", "largest", "smallest"].includes(state.sort) ? state.sort : "";
    if (!levelFilter.value) state.level = "";
    if (!toolFilter.value) state.tool = "";
    if (!datasetFilter.value) state.dataset = "";
    if (!sortFilter.value) state.sort = "";

    const trackCounts = casebook.levels.map(level => [level, casebook.projects.filter(project => project.level === level).length]);
    document.querySelector("#track-counts").replaceChildren(...trackCounts.map(([level, number]) => {
      const row = element("div", "track-row");
      row.append(element("span", "", level), element("strong", "", String(number)));
      return row;
    }));
    const datasets = casebook.projects.filter(project => project.dataset.rows !== null).length;
    document.querySelector("#data-count").textContent = `${casebook.projects.length} notebooks · ${datasets} bundled CSV inputs`;
    renderSaved();
    render();
    if (state.openCase) document.getElementById(`case-${state.openCase}`)?.scrollIntoView({ block: "start" });
  })
  .catch(() => {
    resultCount.textContent = "Casebook data could not be loaded";
    casesNode.replaceChildren(element("p", "method-note", "Run scripts/build_casebook.py to regenerate the catalogue from the notebooks and bundled CSV metadata."));
  });
