(function () {
  "use strict";

  const ROOT = "/data/public/evidence-observatory/v1/";
  const CONTRACT = "fsicss_publication_bundle.v1";
  const DESTINATION = "handicapskater.com";
  const RESOURCE_VERSION = "fsi_publication_resource.v1";
  const GRAPH_VERSION = "fsi_publication_graph.v1";
  const requestCache = new Map();

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function safePath(path) {
    return (
      typeof path === "string" &&
      path.length > 0 &&
      !path.startsWith("/") &&
      !path.includes("\\") &&
      !path.split("/").includes("..") &&
      path.endsWith(".json")
    );
  }

  function fetchJson(path) {
    if (!safePath(path)) return Promise.reject(new Error("Unsafe publication path"));
    if (!requestCache.has(path)) {
      requestCache.set(
        path,
        fetch(ROOT + path, { cache: "no-store", credentials: "same-origin" }).then(function (response) {
          if (!response.ok) throw new Error("Publication resource unavailable");
          return response.json();
        })
      );
    }
    return requestCache.get(path);
  }

  function validateManifest(manifest) {
    if (!manifest || manifest.publication_contract_version !== CONTRACT) {
      throw new Error("Unsupported publication contract");
    }
    if (manifest.destination !== DESTINATION || manifest.status !== "ok") {
      throw new Error("Publication destination unavailable");
    }
    if (!Array.isArray(manifest.resources) || !Array.isArray(manifest.graphs)) {
      throw new Error("Publication manifest is incomplete");
    }
    return manifest;
  }

  function entryById(entries, key, id) {
    const entry = entries.find(function (item) {
      return item && item[key] === id;
    });
    if (!entry || !safePath(entry.path)) throw new Error("Publication entry unavailable");
    return entry;
  }

  function resource(manifest, id) {
    const entry = entryById(manifest.resources, "resource_id", id);
    return fetchJson(entry.path).then(function (payload) {
      if (
        !payload ||
        payload.resource_id !== id ||
        payload.destination !== DESTINATION ||
        payload.resource_version !== RESOURCE_VERSION ||
        payload.content_hash !== entry.content_hash
      ) {
        throw new Error("Publication resource contract mismatch");
      }
      return payload;
    });
  }

  function graph(manifest, id) {
    const entry = entryById(manifest.graphs, "graph_id", id);
    return fetchJson(entry.path).then(function (payload) {
      if (
        !payload ||
        payload.graph_id !== id ||
        payload.destination !== DESTINATION ||
        payload.graph_contract_version !== GRAPH_VERSION ||
        payload.content_hash !== entry.content_hash
      ) {
        throw new Error("Publication graph contract mismatch");
      }
      return payload;
    });
  }

  function detailed(value) {
    if (value === null || value === undefined || value === "") return "Unavailable";
    if (Array.isArray(value)) return value.map(detailed).join(" / ");
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  function displayNumber(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "Unavailable";
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "Unavailable";
    const magnitude = Math.abs(numeric);
    const digits = magnitude >= 100 ? 1 : magnitude >= 10 ? 2 : magnitude >= 1 ? 3 : 4;
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(numeric);
  }

  function sampleText(value) {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) return "n=" + value.join(" / ");
    if (typeof value === "object") {
      return Object.keys(value)
        .map(function (key) {
          const item = value[key];
          if (item && typeof item === "object") {
            return key + ": components n=" + item.components + ", FSI n=" + item.fsi;
          }
          return key + ": n=" + item;
        })
        .join("; ");
    }
    return "n=" + value;
  }

  function unavailable(mount, message) {
    mount.replaceChildren();
    mount.dataset.state = "unavailable";
    const note = element("div", "publication-unavailable");
    note.setAttribute("role", "status");
    note.appendChild(element("strong", "", "Evidence snapshot unavailable"));
    note.appendChild(
      element(
        "p",
        "",
        message || "The approved publication bundle could not be loaded. The authored page remains available."
      )
    );
    mount.appendChild(note);
  }

  function renderStatus(mount, manifest) {
    mount.replaceChildren();
    mount.dataset.state = "ready";
    const status = element("div", "publication-status");
    status.setAttribute("role", "status");
    status.appendChild(element("strong", "", "Approved evidence snapshot available"));
    status.appendChild(
      element(
        "p",
        "publication-meta",
        "Data through " + detailed(manifest.data_through_date) + ". Contract " + CONTRACT + "."
      )
    );
    mount.appendChild(status);
  }

  function factValue(fact) {
    if (Array.isArray(fact.value)) {
      return fact.value.map(function (value) {
        return Number.isFinite(Number(value)) ? displayNumber(value) : detailed(value);
      }).join(fact.unit === "date range" ? " → " : " / ");
    }
    return Number.isFinite(Number(fact.value)) ? displayNumber(fact.value) : detailed(fact.value);
  }

  function renderFacts(mount, payload) {
    const facts = payload.approved_values && payload.approved_values.hero_facts;
    if (!Array.isArray(facts) || !facts.length) throw new Error("Approved facts unavailable");
    mount.replaceChildren();
    mount.dataset.state = "ready";
    const grid = element("div", "publication-facts");
    facts.forEach(function (fact) {
      const card = element("article", "publication-fact");
      card.appendChild(element("span", "publication-fact-label", fact.label));
      card.appendChild(
        element(
          "span",
          "publication-fact-value",
          factValue(fact) + (fact.unit && fact.unit !== "date range" && fact.unit !== "accepted dates" ? " " + fact.unit : "")
        )
      );
      const sample = sampleText(fact.sample_count);
      if (sample) card.appendChild(element("span", "publication-fact-meta", sample));
      grid.appendChild(card);
    });
    mount.appendChild(grid);
    mount.appendChild(
      element(
        "p",
        "publication-caption",
        "Values, units, and sample counts are rendered directly from the approved publication bundle."
      )
    );
  }

  function appendList(parent, items, className) {
    if (!Array.isArray(items) || !items.length) return;
    const list = element("ul", className);
    items.forEach(function (item) {
      list.appendChild(element("li", "", item));
    });
    parent.appendChild(list);
  }

  function renderResource(mount, payload) {
    mount.replaceChildren();
    mount.dataset.state = "ready";
    const wrapper = element("div", "publication-resource");
    wrapper.appendChild(element("p", "publication-finding", payload.plain_language_finding));
    wrapper.appendChild(element("p", "publication-meta", payload.evidence_scope));
    const chips = element("div", "publication-chips");
    (payload.units || []).forEach(function (unit) {
      chips.appendChild(element("span", "publication-chip", "Unit: " + unit));
    });
    const samples = sampleText(payload.sample_counts);
    if (samples) chips.appendChild(element("span", "publication-chip", samples));
    chips.appendChild(element("span", "publication-chip", "Data through: " + payload.data_through_date));
    wrapper.appendChild(chips);
    const details = element("details", "publication-details publication-resource-details");
    details.appendChild(element("summary", "", "Open source scope and limitations"));
    const sourceBlock = element("div", "publication-sources");
    sourceBlock.appendChild(element("h3", "", "Source scope"));
    appendList(sourceBlock, payload.source_labels, "publication-source-list");
    details.appendChild(sourceBlock);
    const limitationBlock = element("div", "publication-limitations");
    limitationBlock.appendChild(element("h3", "", "Limitations"));
    appendList(limitationBlock, payload.limitations, "publication-limitation-list");
    details.appendChild(limitationBlock);
    wrapper.appendChild(details);
    mount.appendChild(wrapper);
  }

  function renderIdentities(mount, payload) {
    const values = payload.approved_values || {};
    mount.replaceChildren();
    mount.dataset.state = "ready";
    const grid = element("div", "identity-grid");
    ["fsi", "css", "tensor"].forEach(function (key) {
      const item = values[key];
      if (!item) return;
      const card = element("article", "identity-card");
      card.appendChild(element("h3", "", item.name || key.toUpperCase()));
      if (item.version) card.appendChild(element("p", "publication-meta", "Version: " + item.version));
      if (item.question) card.appendChild(element("p", "", item.question));
      if (item.plain_language) card.appendChild(element("p", "", item.plain_language));
      if (Array.isArray(item.missing_axes) && item.missing_axes.length) {
        card.appendChild(element("p", "publication-meta", "Unavailable axes: " + item.missing_axes.join(", ")));
      }
      grid.appendChild(card);
    });
    mount.appendChild(grid);
  }

  function setBarSize(node, value, maximum) {
    const numeric = Number(value);
    const max = Number(maximum);
    const percent = Number.isFinite(numeric) && Number.isFinite(max) && max > 0 ? (numeric / max) * 100 : 0;
    node.style.setProperty("--bar-size", Math.max(0, Math.min(100, percent)).toFixed(3) + "%");
  }

  function barPanel(series, titleSuffix) {
    const panel = element("section", "publication-graph-panel");
    panel.setAttribute("role", "group");
    panel.setAttribute("aria-label", series.title + (titleSuffix ? " — " + titleSuffix : ""));
    panel.appendChild(element("h3", "", series.title + (titleSuffix ? " — " + titleSuffix : "")));
    panel.appendChild(element("p", "publication-unit", "Unit: " + (series.unit || "not stated")));
    const points = (series.points || []).filter(function (point) {
      return point && point.value !== null && point.value !== undefined && Number.isFinite(Number(point.value));
    });
    const maximum = Math.max.apply(
      null,
      points.map(function (point) {
        return Number(point.value);
      }).concat([0])
    );
    const bars = element("div", "publication-bars");
    points.forEach(function (point) {
      const row = element("div", "publication-bar-row");
      row.appendChild(element("span", "publication-bar-label", point.label || point.id || point.stage));
      const track = element("div", "publication-bar-track");
      const bar = element("div", "publication-bar");
      setBarSize(bar, point.value, maximum);
      bar.setAttribute("aria-hidden", "true");
      track.appendChild(bar);
      const value = element(
        "span",
        "publication-bar-value",
        displayNumber(point.value) + " " + (point.unit || series.unit || "") + (point.sample_count ? " · n=" + point.sample_count : "")
      );
      track.appendChild(value);
      row.appendChild(track);
      bars.appendChild(row);
    });
    if (!points.length) bars.appendChild(element("p", "publication-meta", "No supplied points are available for this panel."));
    panel.appendChild(bars);
    return panel;
  }

  function graphPanels(payload) {
    const panels = element("div", "publication-graph-panels");
    let series = Array.isArray(payload.series) ? payload.series : [];
    if (payload.graph_id === "accepted_triplet_stage_profiles") {
      series = series.filter(function (item) {
        return item.metric === "cumulative_dynamic_shock_per_min";
      }).map(function (item) {
        return Object.assign({}, item, {
          title: "Cumulative dynamic shock per minute",
          unit: "g*s/min"
        });
      });
    }
    if (payload.graph_id === "transport_coupling_profiles") {
      series = series.filter(function (item) {
        return item.series_id === "fsi" || item.series_id === "cumulative_dynamic_shock";
      });
    }
    series.forEach(function (item) {
      panels.appendChild(barPanel(item, item.date || ""));
    });
    return panels;
  }

  function longitudinalPanel(payload, metric, title, unit) {
    const panel = element("section", "publication-graph-panel");
    panel.setAttribute("role", "group");
    panel.setAttribute("aria-label", title);
    panel.appendChild(element("h3", "", title));
    panel.appendChild(element("p", "publication-unit", "Unit: " + unit));
    const rows = (payload.accessible_table || []).filter(function (row) {
      return row && row[metric] !== null && row[metric] !== undefined && Number.isFinite(Number(row[metric]));
    });
    const maximum = Math.max.apply(
      null,
      rows.map(function (row) {
        return Number(row[metric]);
      }).concat([0])
    );
    const byCohort = new Map();
    rows.forEach(function (row) {
      const cohort = row.canonical_cohort || "unknown";
      if (!byCohort.has(cohort)) byCohort.set(cohort, []);
      byCohort.get(cohort).push(row);
    });
    const timeline = element("div", "publication-timeline");
    Array.from(byCohort.keys()).sort().forEach(function (cohort) {
      const cohortRows = byCohort.get(cohort).sort(function (left, right) {
        return String(left.period_start_local).localeCompare(String(right.period_start_local));
      });
      const row = element("div", "publication-timeline-row");
      row.appendChild(element("span", "publication-timeline-label", cohort.replaceAll("_", " ")));
      const bars = element("div", "publication-timeline-bars");
      cohortRows.forEach(function (item) {
        const bar = element("span", "publication-timeline-bar");
        setBarSize(bar, item[metric], maximum);
        bar.tabIndex = 0;
        bar.setAttribute(
          "aria-label",
          cohort.replaceAll("_", " ") + ", " + item.period_start_local + ", " + detailed(item[metric]) + " " + unit
        );
        bar.title = bar.getAttribute("aria-label");
        bars.appendChild(bar);
      });
      row.appendChild(bars);
      timeline.appendChild(row);
    });
    panel.appendChild(timeline);
    return panel;
  }

  function tableModel(payload) {
    if (payload.graph_id === "mobility_output_and_burden") {
      return {
        columns: [
          ["label", "Cohort"],
          ["distance_miles", "Distance (miles)"],
          ["distance_sample_count", "Distance n"],
          ["duration_minutes", "Duration (minutes)"],
          ["absolute_burden", "Observed burden (g*s)"],
          ["burden_sample_count", "Burden n"],
          ["burden_per_mile", "Burden per mile (g*s/mile)"],
          ["functional_output_per_burden", "Miles per g*s"],
          ["data_through_date", "Data through"]
        ],
        rows: payload.accessible_table || []
      };
    }
    if (payload.graph_id === "accepted_triplet_stage_profiles") {
      const rows = [];
      (payload.accessible_table || []).forEach(function (triplet) {
        (triplet.stages || []).forEach(function (stage) {
          const metrics = stage.metrics || {};
          rows.push({
            date: triplet.date,
            stage: stage.label,
            distance: stage.distance && stage.distance.value,
            duration: stage.duration && stage.duration.value,
            vertical: metrics.vertical_dynamic_g_rms && metrics.vertical_dynamic_g_rms.value,
            jerk: metrics.magnitude_jerk_rms_g_per_s && metrics.magnitude_jerk_rms_g_per_s.value,
            spike: metrics.shock_spike_rate_per_min && metrics.shock_spike_rate_per_min.value,
            shock: metrics.cumulative_dynamic_shock_per_min && metrics.cumulative_dynamic_shock_per_min.value,
            quality: stage.quality,
            disclosure: triplet.unequal_distance_disclosure
          });
        });
      });
      return {
        columns: [
          ["date", "Accepted date"],
          ["stage", "Stage"],
          ["distance", "Distance (miles)"],
          ["duration", "Duration (s)"],
          ["vertical", "Vertical RMS (g)"],
          ["jerk", "Jerk RMS (g/s)"],
          ["spike", "Shock rate (count/min)"],
          ["shock", "Cumulative shock (g*s/min)"],
          ["quality", "Quality"],
          ["disclosure", "Distance limitation"]
        ],
        rows: rows
      };
    }
    if (payload.graph_id === "transport_coupling_profiles") {
      const rows = (payload.accessible_table || []).map(function (row) {
        const metrics = row.metrics || {};
        return {
          label: row.label,
          coupling: row.body_coupling_class,
          duration: row.duration_minutes,
          fsi: row.fsi,
          fsiN: row.fsi_sample_count,
          componentN: row.component_sample_count,
          shock: metrics.cumulative_dynamic_shock && metrics.cumulative_dynamic_shock.value,
          vertical: metrics.vertical_dynamic_g_rms && metrics.vertical_dynamic_g_rms.value,
          jerk: metrics.magnitude_jerk_rms_g_per_s && metrics.magnitude_jerk_rms_g_per_s.value,
          spikes: metrics.shock_spike_count && metrics.shock_spike_count.value,
          ratio: metrics.vertical_to_horizontal_dynamic_rms_ratio && metrics.vertical_to_horizontal_dynamic_rms_ratio.value,
          through: row.data_through_date
        };
      });
      return {
        columns: [
          ["label", "Transport cohort"],
          ["coupling", "Body coupling"],
          ["duration", "Duration (minutes)"],
          ["fsi", "FSI (unitless index)"],
          ["fsiN", "FSI n"],
          ["componentN", "Component n"],
          ["shock", "Shock (g*s/min)"],
          ["vertical", "Vertical RMS (g)"],
          ["jerk", "Jerk RMS (g/s)"],
          ["spikes", "Shock rate (count/min)"],
          ["ratio", "Vertical/horizontal ratio"],
          ["through", "Data through"]
        ],
        rows: rows
      };
    }
    return {
      columns: [
        ["canonical_cohort", "Cohort"],
        ["period_start_local", "Period"],
        ["activity_count", "Activities"],
        ["total_distance_miles", "Distance (miles)"],
        ["activity_frequency_per_week", "Activities/week"],
        ["event_count", "Event n"],
        ["source_coverage", "Source scope"],
        ["quality_status", "Quality"],
        ["data_end_date", "Data through"]
      ],
      rows: payload.accessible_table || []
    };
  }

  function renderTable(payload) {
    const model = tableModel(payload);
    const wrap = element("div", "publication-table-wrap");
    const table = element("table", "publication-table");
    table.appendChild(element("caption", "", "Accessible values supplied by the publication graph payload."));
    const head = element("thead");
    const headRow = element("tr");
    model.columns.forEach(function (column) {
      headRow.appendChild(element("th", "", column[1]));
    });
    head.appendChild(headRow);
    table.appendChild(head);
    const body = element("tbody");
    model.rows.forEach(function (row) {
      const tableRow = element("tr");
      model.columns.forEach(function (column) {
        tableRow.appendChild(element("td", "", detailed(row[column[0]])));
      });
      body.appendChild(tableRow);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    return wrap;
  }

  function renderGraph(mount, payload) {
    mount.replaceChildren();
    mount.dataset.state = "ready";
    const figure = element("figure", "publication-graph");
    const header = element("figcaption", "publication-graph-header");
    header.appendChild(element("h2", "publication-graph-title", payload.title));
    header.appendChild(element("p", "publication-finding", payload.interpretation));
    header.appendChild(
      element(
        "p",
        "publication-meta",
        "Data through " + payload.data_through_date + " · Units: " + (payload.units || []).join(", ") +
          " · Samples: " + sampleText(payload.sample_counts)
      )
    );
    header.appendChild(
      element("p", "publication-caption", "Sources: " + (payload.source_labels || []).join("; "))
    );
    if (Array.isArray(payload.limitations) && payload.limitations.length) {
      const visibleLimit = element("div", "notice publication-limitations");
      visibleLimit.appendChild(element("strong", "", "Limitation"));
      visibleLimit.appendChild(element("p", "", payload.limitations[0]));
      header.appendChild(visibleLimit);
    }
    figure.appendChild(header);

    const visual = element("div", "publication-graph-visual");
    visual.setAttribute("role", "img");
    visual.setAttribute("aria-label", payload.alt_text || payload.interpretation);
    if (payload.graph_id === "longitudinal_activity_context") {
      const panels = element("div", "publication-graph-panels");
      panels.appendChild(longitudinalPanel(payload, "total_distance_miles", "Monthly useful distance", "miles"));
      panels.appendChild(longitudinalPanel(payload, "activity_frequency_per_week", "Activity frequency", "activities/week"));
      visual.appendChild(panels);
    } else {
      visual.appendChild(graphPanels(payload));
    }
    figure.appendChild(visual);

    const qualifications = element("div", "publication-meta");
    qualifications.appendChild(element("h3", "", "Interpretation limits"));
    appendList(qualifications, payload.qualifications, "publication-qualification-list");
    figure.appendChild(qualifications);

    const details = element("details", "publication-details");
    details.appendChild(element("summary", "", "Open accessible data table, sources, and limitations"));
    details.appendChild(renderTable(payload));
    const sourceBlock = element("div", "publication-sources");
    sourceBlock.appendChild(element("h3", "", "Source scope"));
    appendList(sourceBlock, payload.source_labels, "publication-source-list");
    details.appendChild(sourceBlock);
    const limitationBlock = element("div", "publication-limitations");
    limitationBlock.appendChild(element("h3", "", "Limitations"));
    appendList(limitationBlock, payload.limitations, "publication-limitation-list");
    details.appendChild(limitationBlock);
    details.appendChild(element("p", "publication-meta", payload.long_description));
    figure.appendChild(details);
    mount.appendChild(figure);
  }

  function loadMounts(manifest) {
    document.querySelectorAll("[data-publication-status]").forEach(function (mount) {
      renderStatus(mount, manifest);
    });
    document.querySelectorAll("[data-publication-facts]").forEach(function (mount) {
      resource(manifest, mount.dataset.publicationFacts)
        .then(function (payload) { renderFacts(mount, payload); })
        .catch(function () { unavailable(mount); });
    });
    document.querySelectorAll("[data-publication-resource]").forEach(function (mount) {
      resource(manifest, mount.dataset.publicationResource)
        .then(function (payload) { renderResource(mount, payload); })
        .catch(function () { unavailable(mount); });
    });
    document.querySelectorAll("[data-publication-identities]").forEach(function (mount) {
      resource(manifest, mount.dataset.publicationIdentities)
        .then(function (payload) { renderIdentities(mount, payload); })
        .catch(function () { unavailable(mount); });
    });
    document.querySelectorAll("[data-publication-graph]").forEach(function (mount) {
      graph(manifest, mount.dataset.publicationGraph)
        .then(function (payload) { renderGraph(mount, payload); })
        .catch(function () { unavailable(mount); });
    });
  }

  function start() {
    fetchJson("manifest.json")
      .then(validateManifest)
      .then(loadMounts)
      .catch(function () {
        document
          .querySelectorAll(
            "[data-publication-status], [data-publication-facts], [data-publication-resource], [data-publication-identities], [data-publication-graph]"
          )
          .forEach(function (mount) { unavailable(mount); });
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
