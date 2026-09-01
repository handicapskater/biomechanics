/*
 * Case-site presentation of the static, governed Evidence Observatory bundle.
 * This file deliberately renders supplied values only; it does not calculate
 * scientific values, query private services, or provide a RAG surface.
 */
(function () {
  "use strict";

  const BUNDLE_ROOT = "/data/public/evidence-observatory/v1/";
  const MANIFEST_PATH = `${BUNDLE_ROOT}manifest.json`;
  const CONTRACT = "fsi_publication_graph.v1";

  const text = (value) => (value === undefined || value === null ? "—" : String(value));
  const titleize = (value) => text(value).replaceAll("_", " ");
  const number = (value) => typeof value === "number" && Number.isFinite(value);

  function labLink() {
    const link = document.createElement("a");
    link.dataset.evidenceObservatoryLink = "";
    link.textContent = "Open in Evidence Lab";
    return link;
  }

  function appendText(parent, tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = value;
    parent.append(element);
    return element;
  }

  function directRows(payload) {
    if (Array.isArray(payload.visual?.rows) && payload.visual.rows.length) return payload.visual.rows;
    if (Array.isArray(payload.visual?.groups)) {
      return payload.visual.groups.flatMap((group) => (group.tiers || group.rows || []).map((row) => ({ ...row, group: row.group || group.label })));
    }
    if (Array.isArray(payload.series)) {
      return payload.series.flatMap((series) => (series.points || []).map((point) => ({ ...point, series: series.label || series.name })));
    }
    return (payload.accessible_table || []).slice(0, 12);
  }

  function rowLabel(row, index) {
    return text(row.label || row.metric_label || row.metric || row.cohort || row.date || row.task || row.sequence_role || row.series || `Record ${index + 1}`);
  }

  function rowValue(row) {
    const candidates = [
      row.value, row.median, row.observed?.median, row.incremental_balanced_accuracy,
      row.date_grouped_balanced_accuracy, row.best_held_out_balanced_accuracy,
      row.distance_miles, row.duration_minutes, row.effect,
    ];
    return candidates.find(number);
  }

  function renderVisual(payload) {
    const figure = document.createElement("figure");
    figure.className = "governed-graph-visual";
    const caption = document.createElement("figcaption");
    caption.textContent = payload.alt_text || payload.long_description || payload.title;
    figure.append(caption);

    const rows = directRows(payload).map((row, index) => ({ row, index, value: rowValue(row) })).filter((item) => number(item.value)).slice(0, 12);
    if (!rows.length) {
      appendText(figure, "p", "governed-graph-visual-note", "The canonical graph is represented below by its complete accessible table.");
      return figure;
    }
    const maximum = Math.max(...rows.map((item) => Math.abs(item.value)), 1);
    const list = document.createElement("ul");
    list.className = "governed-graph-bars";
    rows.forEach(({ row, index, value }) => {
      const item = document.createElement("li");
      const label = appendText(item, "span", "governed-graph-bar-label", rowLabel(row, index));
      label.title = rowLabel(row, index);
      const track = document.createElement("span");
      track.className = "governed-graph-bar-track";
      const bar = document.createElement("span");
      bar.className = "governed-graph-bar";
      bar.style.width = `${Math.max(2, Math.abs(value) / maximum * 100)}%`;
      track.append(bar);
      const unit = row.unit ? ` ${row.unit}` : "";
      appendText(item, "output", "governed-graph-bar-value", `${value}${unit}`);
      item.append(track);
      list.append(item);
    });
    figure.append(list);
    return figure;
  }

  function scalar(value) {
    return typeof value === "object" ? JSON.stringify(value) : text(value);
  }

  function renderTable(payload) {
    const details = document.createElement("details");
    details.className = "governed-graph-details";
    appendText(details, "summary", "", "View accessible data");
    const rows = payload.accessible_table || [];
    if (!rows.length) {
      appendText(details, "p", "", "No accessible rows were supplied in the canonical graph payload.");
      return details;
    }
    const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    const wrap = document.createElement("div");
    wrap.className = "governed-graph-table-wrap";
    const table = document.createElement("table");
    table.className = "governed-graph-table";
    const head = table.createTHead().insertRow();
    keys.forEach((key) => appendText(head, "th", "", titleize(key)));
    const body = table.createTBody();
    rows.forEach((row) => {
      const tr = body.insertRow();
      keys.forEach((key) => appendText(tr, "td", "", scalar(row[key])));
    });
    wrap.append(table);
    details.append(wrap);
    return details;
  }

  function renderProvenance(payload, entry) {
    const details = document.createElement("details");
    details.className = "governed-graph-details";
    appendText(details, "summary", "", "Provenance and limitations");
    const list = document.createElement("ul");
    const contracts = (payload.source_contracts || []).map((item) => `${item.contract} (${item.version})`).join("; ") || "not supplied";
    const formulas = (payload.formula_identities || []).join("; ") || "not supplied";
    [
      ["Canonical graph", payload.graph_id],
      ["Graph content hash", entry.content_hash || payload.content_hash],
      ["Data through", payload.data_through_date],
      ["Source contracts", contracts],
      ["Formula identities", formulas],
      ["Limitation", payload.limitation || (payload.limitations || []).join("; ") || "See canonical payload"],
    ].forEach(([label, value]) => {
      const item = document.createElement("li");
      const strong = document.createElement("strong");
      strong.textContent = `${label}: `;
      item.append(strong, document.createTextNode(text(value)));
      list.append(item);
    });
    details.append(list);
    return details;
  }

  function renderMount(mount, payload, entry) {
    mount.replaceChildren();
    mount.classList.add("governed-graph-mounted");
    const header = document.createElement("header");
    header.className = "governed-graph-header";
    appendText(header, "p", "eyebrow", `Governed graph · ${payload.graph_id}`);
    appendText(header, mount.dataset.governedGraphHeading || "h3", "", payload.title);
    appendText(header, "p", "governed-graph-finding", payload.finding || payload.interpretation || payload.question || "See the canonical accessible data below.");
    mount.append(header, renderVisual(payload), renderTable(payload), renderProvenance(payload, entry));
    const actions = document.createElement("p");
    actions.className = "governed-graph-actions";
    actions.append(labLink());
    mount.append(actions);
    window.connectEvidenceObservatoryLinks?.();
  }

  async function load() {
    const mounts = [...document.querySelectorAll("[data-governed-graph]")];
    if (!mounts.length) return;
    let manifest;
    try {
      const response = await fetch(MANIFEST_PATH, { credentials: "same-origin" });
      if (!response.ok) throw new Error(`manifest HTTP ${response.status}`);
      manifest = await response.json();
      if (manifest.destination !== "handicapskater.com" || !Array.isArray(manifest.graphs)) throw new Error("unexpected governed bundle contract");
    } catch (error) {
      mounts.forEach((mount) => appendText(mount, "p", "governed-graph-error", `Governed evidence is unavailable: ${error.message}`));
      return;
    }
    const graphEntries = new Map(manifest.graphs.map((entry) => [entry.graph_id, entry]));
    await Promise.all(mounts.map(async (mount) => {
      const graphId = mount.dataset.governedGraph;
      const entry = graphEntries.get(graphId);
      try {
        if (!entry || !/^graphs\/[a-z0-9_-]+\.json$/.test(entry.artifact_path || "")) throw new Error(`canonical graph ${graphId} is absent`);
        const response = await fetch(`${BUNDLE_ROOT}${entry.artifact_path}`, { credentials: "same-origin" });
        if (!response.ok) throw new Error(`graph HTTP ${response.status}`);
        const payload = await response.json();
        if (payload.graph_contract_version !== CONTRACT || payload.graph_id !== graphId || payload.content_hash !== entry.content_hash) throw new Error(`canonical graph ${graphId} failed contract validation`);
        renderMount(mount, payload, entry);
      } catch (error) {
        mount.replaceChildren();
        appendText(mount, "p", "governed-graph-error", `Governed graph unavailable: ${error.message}`);
      }
    }));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();
