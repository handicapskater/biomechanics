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
    if (!safePath(entry.artifact_path)) return Promise.reject(new Error("Publication graph artifact unavailable"));
    return fetchJson(entry.artifact_path).then(function (payload) {
      if (
        !payload ||
        payload.graph_id !== id ||
        payload.destination !== DESTINATION ||
        entry.destination !== DESTINATION ||
        entry.page !== payload.intended_route ||
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

  function renderHypothesisRegistry(mount, payload) {
    const values = payload.approved_values || {};
    const hypotheses = values.canonical_hypotheses;
    if (!Array.isArray(hypotheses) || hypotheses.map(function (item) { return item.hypothesis_id; }).join(",") !== "H1,H2,H3,H4,H5,H6") {
      throw new Error("Canonical hypothesis registry unavailable");
    }
    mount.replaceChildren();
    mount.dataset.state = "ready";
    const wrapper = element("div", "publication-hypothesis-registry");
    wrapper.appendChild(element("p", "publication-finding", payload.plain_language_finding));
    wrapper.appendChild(element("p", "publication-meta", "Registry " + values.registry_version + " · " + payload.evidence_scope));
    const grid = element("div", "publication-hypothesis-grid");
    hypotheses.forEach(function (hypothesis) {
      const card = element("article", "publication-hypothesis-card");
      card.appendChild(element("p", "publication-hypothesis-id", hypothesis.hypothesis_id + " · " + hypothesis.review_status));
      card.appendChild(element("h3", "", hypothesis.title));
      card.appendChild(element("p", "publication-question", hypothesis.scientific_question));
      card.appendChild(element("p", "", hypothesis.background));
      const cohorts = element("div", "publication-chips");
      (hypothesis.comparison_cohorts || []).forEach(function (cohort) { cohorts.appendChild(element("span", "publication-chip", "Cohort: " + String(cohort).replaceAll("_", " "))); });
      card.appendChild(cohorts);
      const metrics = element("div", "publication-chips");
      (hypothesis.primary_metrics || []).forEach(function (metric) { metrics.appendChild(element("span", "publication-chip", "Primary: " + metric)); });
      (hypothesis.derived_metrics || []).forEach(function (metric) { metrics.appendChild(element("span", "publication-chip", "Derived: " + metric)); });
      card.appendChild(metrics);
      const conclusions = element("div", "publication-conclusion-grid");
      [
        ["Observed Result", hypothesis.observed_result],
        ["Integrated Interpretation", hypothesis.integrated_interpretation],
        ["Scope", hypothesis.scope],
        ["Accommodation Relevance", hypothesis.accommodation_relevance]
      ].forEach(function (section) {
        const block = element("section", "");
        block.appendChild(element("h4", "", section[0]));
        block.appendChild(element("p", "", section[1]));
        conclusions.appendChild(block);
      });
      card.appendChild(conclusions);
      card.appendChild(element("h4", "", "Publication figures"));
      appendList(card, (hypothesis.publication_figure_ids || []).map(function (figureId) { return String(figureId).replaceAll("_", " ") + " · " + figureId; }), "publication-source-list publication-figure-index");
      const details = element("details", "publication-details");
      details.appendChild(element("summary", "", "Open protocol, figures, interpretation, and limitations"));
      [
        ["Inclusion rules", hypothesis.inclusion_rules],
        ["Exclusion rules", hypothesis.exclusion_rules],
        ["Statistical strategy", hypothesis.statistical_strategy],
        ["Interpretation rules", hypothesis.interpretation_rules],
        ["Limitations", hypothesis.limitations]
      ].forEach(function (section) {
        details.appendChild(element("h4", "", section[0]));
        appendList(details, section[1], "publication-source-list");
      });
      details.appendChild(element("h4", "", "Required figures"));
      appendList(details, (hypothesis.required_figures || []).map(function (figure) {
        return "Level " + figure.level + " · " + String(figure.figure_type).replaceAll("_", " ") + " · " + (figure.metrics || []).join(", ");
      }), "publication-source-list");
      details.appendChild(element("p", "", "Scientific relevance: " + hypothesis.scientific_relevance));
      details.appendChild(element("h4", "", "Provenance"));
      details.appendChild(element("pre", "publication-provenance", JSON.stringify(hypothesis.provenance || {}, null, 2)));
      details.appendChild(element("p", "", "Review status: " + hypothesis.review_status));
      card.appendChild(details);
      grid.appendChild(card);
    });
    wrapper.appendChild(grid);
    const interpretation = element("section", "publication-registry-interpretation");
    interpretation.appendChild(element("h3", "", "Required conclusion order"));
    const ordered = element("ol", "publication-source-list");
    (values.conclusion_contract || []).forEach(function (item) {
      ordered.appendChild(element("li", "", item.label + ": " + item.rule));
    });
    interpretation.appendChild(ordered);
    interpretation.appendChild(element("h3", "", "Prohibited conclusions"));
    appendList(interpretation, values.prohibited_conclusions, "publication-limitation-list");
    wrapper.appendChild(interpretation);
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
      row.appendChild(element("span", "publication-bar-label", point.label || point.id || point.stage || point.date || "Observed value"));
      const track = element("div", "publication-bar-track");
      const bar = element("div", "publication-bar");
      if (Number(point.value) < 0) {
        setBarSize(bar, Math.abs(Number(point.value)), Math.max(maximum, Math.abs(Number(point.value))));
        bar.classList.add("publication-bar-negative");
      } else {
        setBarSize(bar, point.value, maximum);
      }
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
      if (Array.isArray(item.series) && item.series.length) {
        item.series.forEach(function (nested) {
          panels.appendChild(barPanel({ title: item.title + " · " + (nested.label || nested.id), unit: item.unit, points: nested.points || [] }, ""));
        });
      } else {
        panels.appendChild(barPanel(item, item.date || ""));
      }
    });
    return panels;
  }

  function percentage(value) { return (Number(value) * 100).toFixed(1) + "%"; }
  function percentagePoints(value) { return (Number(value) * 100).toFixed(1) + " pp"; }
  function taskLabel(value) {
    return ({ walking_vs_mall: "Walking vs Mall", walking_vs_pt: "Walking vs PT", walking_vs_fns_sns: "Walking vs FNS/SNS" })[value] || String(value || "").replaceAll("_", " ");
  }
  function modelLabel(value) {
    return ({ logistic_regression: "Logistic regression", random_forest: "Random forest", linear_discriminant: "Linear discriminant", gradient_boosted_trees: "Gradient boosted trees" })[value] || String(value || "").replaceAll("_", " ");
  }
  function svgText(svg, x, y, text, className, anchor) {
    const node = svgNode("text", { x: x, y: y, class: className || "publication-axis-label", "text-anchor": anchor || "start" });
    node.textContent = text;
    svg.appendChild(node);
  }
  function scientificPlot(rows, options) {
    const width = options.width || 720, left = options.left || 168, right = 34, top = 28, rowHeight = options.rowHeight || 34, bottom = 44;
    const height = top + rows.length * rowHeight + bottom;
    const svg = svgNode("svg", { viewBox: "0 0 " + width + " " + height, class: "publication-ml-chart", role: "img", "aria-label": options.ariaLabel, "data-left-margin": left, "data-visual-row-count": rows.length });
    const scale = function (value) { return left + ((value - options.min) / (options.max - options.min || 1)) * (width - left - right); };
    (options.ticks || []).forEach(function (tick) {
      const x = scale(tick);
      svg.appendChild(svgNode("line", { x1: x, x2: x, y1: top - 12, y2: height - bottom + 4, class: "publication-grid-line" }));
      svgText(svg, x, height - 13, options.format(tick), "publication-axis-label", "middle");
    });
    if (options.reference !== undefined) svg.appendChild(svgNode("line", { x1: scale(options.reference), x2: scale(options.reference), y1: top - 14, y2: height - bottom + 4, class: options.reference === 0 ? "publication-zero-line" : "publication-null-line" }));
    rows.forEach(function (row, index) {
      const y = top + index * rowHeight + 8;
      svgText(svg, left - 12, y + 4, row.label, "publication-ml-label", "end");
      if (row.stem) svg.appendChild(svgNode("line", { x1: scale(0), x2: scale(row.value), y1: y, y2: y, class: "publication-range-line" }));
      if (row.range) svg.appendChild(svgNode("line", { x1: scale(row.range.min), x2: scale(row.range.max), y1: y, y2: y, class: "publication-range-line" }));
      if (Number.isFinite(row.nullValue) && Number.isFinite(row.value)) svg.appendChild(svgNode("line", { x1: scale(row.nullValue), x2: scale(row.value), y1: y, y2: y, class: "publication-dumbbell-line" }));
      if (Number.isFinite(row.nullValue)) svg.appendChild(svgNode("circle", { cx: scale(row.nullValue), cy: y, r: 5, class: "publication-null-dot" }));
      (row.points || []).forEach(function (point, pointIndex) {
        const dot = svgNode("circle", { cx: scale(point.value), cy: y + (pointIndex - 1.5) * 3.2, r: 3, class: "publication-model-dot" });
        const title = svgNode("title", {}); title.textContent = point.label + ": " + percentage(point.value) + (Number.isFinite(point.date_grouped_balanced_accuracy) ? "; date-grouped " + percentage(point.date_grouped_balanced_accuracy) : ""); dot.appendChild(title); svg.appendChild(dot);
      });
      if (Number.isFinite(row.value)) {
        const dot = svgNode("circle", { cx: scale(row.value), cy: y, r: row.range ? 6 : 5, class: row.decision === "fail_to_reject" ? "publication-observed-dot publication-nonreject-dot" : "publication-observed-dot" });
        const title = svgNode("title", {}); title.textContent = row.detail || options.format(row.value); dot.appendChild(title); svg.appendChild(dot);
      }
    });
    svgText(svg, (left + width - right) / 2, height - 1, options.axisLabel, "publication-axis-title", "middle");
    return svg;
  }
  function mlValidationPanels(payload) {
    const panel = element("section", "publication-ml-panel");
    const visual = payload.visual;
    if (!visual || visual.visual_contract_version !== "hypothesis_ml_scientific_figure.v1.0.0") throw new Error("Missing scientific visual contract: " + payload.graph_id);
    const baOptions = { min: visual.x_axis.min, max: visual.x_axis.max, ticks: [.4, .5, .6, .7, .8, .9, 1], format: percentage, axisLabel: "Held-out balanced accuracy" };
    if (payload.graph_type === "grouped_score_dot_plot") {
      const grid = element("div", "publication-ml-small-multiples");
      visual.groups.forEach(function (group) { const section = element("section", "publication-ml-multiple"); section.appendChild(element("h3", "", group.label)); section.appendChild(scientificPlot(group.tiers.map(function (row) { return { label: row.label, value: row.observed.median, range: row.observed, points: row.model_points, nullValue: row.null_median, detail: "Median " + percentage(row.observed.median) + "; range " + percentage(row.observed.min) + "–" + percentage(row.observed.max) }; }), Object.assign({ width: 560, left: 160, ariaLabel: group.label + " feature-tier model distributions" }, baOptions))); grid.appendChild(section); }); panel.appendChild(grid);
    } else if (payload.graph_type === "observed_null_dumbbell") {
      const isTransport = visual.layout === "model_dumbbell";
      const plotRows = visual.rows.map(function (row) { return isTransport ? { label: row.label, value: row.observed, nullValue: row.null_median, decision: row.decision, detail: percentage(row.observed) + " observed; " + percentage(row.null_median) + " null; " + row.decision } : { label: row.label, value: row.observed.median, range: row.observed, points: row.model_points, nullValue: row.null_median, detail: "Median " + percentage(row.observed.median) }; });
      if (isTransport) panel.appendChild(element("p", "publication-ml-subtitle", visual.decision_counts_all_tiers.reject + "/20 model-tier combinations reject · " + visual.decision_counts_all_tiers.fail_to_reject + "/20 fail to reject · primary visual: baseline tier"));
      panel.appendChild(scientificPlot(plotRows, Object.assign({ ariaLabel: isTransport ? "Observed versus permutation null for four transportation models" : "Mechanical-only model distributions for three H1 tasks" }, baOptions)));
    } else if (payload.graph_type === "grouped_point_range") {
      panel.appendChild(element("p", "publication-ml-subtitle", visual.inference.requested_permutations + " permutations · " + visual.inference.date_cluster_bootstraps + " date-cluster bootstraps · " + visual.inference.rejected_null_n + "/" + visual.inference.tested_null_n + " task-model nulls rejected · p=" + visual.inference.empirical_p.toFixed(3)));
      panel.appendChild(element("p", "publication-ml-subtitle", "Strict features: " + visual.strict_features.join(" · ") + ". No duration, distance, cumulative, count, or rate features."));
      panel.appendChild(scientificPlot(visual.rows.map(function (row) { return { label: row.label, value: row.observed.median, range: row.observed, points: row.model_points, nullValue: row.null_median, detail: "Median " + percentage(row.observed.median) + "; range " + percentage(row.observed.min) + "–" + percentage(row.observed.max) }; }), Object.assign({ ariaLabel: "Exposure-length-blind model distributions and permutation nulls" }, baOptions)));
    } else if (payload.graph_type === "diverging_increment_bar") {
      panel.appendChild(element("p", "publication-ml-subtitle", "MIXED / INCONCLUSIVE incremental value. Positive values improve on baseline; negative values are worse."));
      const grid = element("div", "publication-ml-small-multiples publication-ml-context-grid"); const bound = visual.x_axis.max_pp / 100;
      visual.groups.forEach(function (group) { const section = element("section", "publication-ml-multiple"); section.appendChild(element("h3", "", group.label)); section.appendChild(scientificPlot(group.tiers.map(function (row) { return { label: row.label, value: row.incremental_balanced_accuracy, stem: true, detail: percentagePoints(row.incremental_balanced_accuracy) }; }), { width: 560, left: 160, min: -bound, max: bound, ticks: [-bound, 0, bound], reference: 0, format: percentagePoints, axisLabel: "Incremental balanced accuracy", ariaLabel: group.label + " signed incremental balanced accuracy" })); grid.appendChild(section); }); panel.appendChild(grid);
    } else if (payload.graph_type === "feature_stability_frequency") {
      const maximum = Math.max.apply(null, visual.rows.map(function (row) { return row.top_three_fold_appearances; }));
      panel.appendChild(element("p", "publication-ml-subtitle", "Frequency of appearing among fold-level top-three features. Feature importance does not identify effect size."));
      panel.appendChild(scientificPlot(visual.rows.map(function (row) { return { label: row.label + " · " + row.domain, value: row.top_three_fold_appearances, stem: true, detail: row.top_three_fold_appearances + " fold-level top-three appearances; " + row.domain }; }), { min: 0, max: maximum * 1.08, ticks: [0, Math.round(maximum / 2), maximum], format: function (value) { return String(Math.round(value)); }, axisLabel: "Fold-level top-three appearances", ariaLabel: "Ranked feature stability frequency by scientific domain" }));
    } else {
      throw new Error("Unsupported ML graph type: " + payload.graph_type);
    }
    return panel;
  }

  function svgNode(tag, attributes) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attributes || {}).forEach(function (key) { node.setAttribute(key, attributes[key]); });
    return node;
  }

  function linePanel(title, unit, groups) {
    const panel = element("section", "publication-graph-panel publication-line-panel");
    panel.appendChild(element("h3", "", title));
    panel.appendChild(element("p", "publication-unit", "Unit: " + unit));
    const all = groups.flatMap(function (group) { return group.points || []; }).filter(function (point) {
      return point && Number.isFinite(Number(point.value)) && Number.isFinite(Date.parse(String(point.date)));
    }).sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
    if (!all.length) return panel;
    const width = 760, height = 340, left = 72, right = 22, top = 22, bottom = 58;
    const values = all.map(function (point) { return Number(point.value); });
    const min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    const dates = Array.from(new Set(all.map(function (point) { return String(point.date); }))).sort();
    const times = dates.map(Date.parse), firstTime = Math.min.apply(null, times), lastTime = Math.max.apply(null, times);
    const x = function (date) { return left + ((Date.parse(String(date)) - firstTime) / (lastTime - firstTime || 1)) * (width - left - right); };
    const y = function (value) { return top + (1 - (Number(value) - min) / (max - min || 1)) * (height - top - bottom); };
    const svg = svgNode("svg", { viewBox: "0 0 " + width + " " + height, class: "publication-line-chart", role: "img", "aria-label": title + " by accepted date", "data-date-min": dates[0], "data-date-max": dates[dates.length - 1] });
    [0, 0.25, 0.5, 0.75, 1].forEach(function (ratio) {
      const yy = top + ratio * (height - top - bottom);
      svg.appendChild(svgNode("line", { x1: left, x2: width - right, y1: yy, y2: yy, class: "publication-grid-line" }));
      const label = svgNode("text", { x: left - 10, y: yy + 4, class: "publication-axis-label", "text-anchor": "end" });
      label.textContent = displayNumber(max - ratio * (max - min)); svg.appendChild(label);
    });
    [dates[0], dates[Math.floor((dates.length - 1) / 2)], dates[dates.length - 1]].forEach(function (date, index) {
      const label = svgNode("text", { x: x(date), y: height - 18, class: "publication-axis-label", "text-anchor": index === 0 ? "start" : index === 2 ? "end" : "middle" });
      label.textContent = date; svg.appendChild(label);
    });
    groups.forEach(function (group, index) {
      const points = (group.points || []).filter(function (point) { return Number.isFinite(Number(point.value)) && Number.isFinite(Date.parse(String(point.date))); }).sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
      if (!group.rawOnly) {
        const polyline = svgNode("polyline", { points: points.map(function (point) { return x(point.date) + "," + y(point.value); }).join(" "), class: "publication-series publication-series-" + (index % 4), fill: "none" });
        svg.appendChild(polyline);
      }
      const trend = (group.trendPoints || []).filter(function (point) { return Number.isFinite(Number(point.value)) && Number.isFinite(Date.parse(String(point.date))); }).sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
      if (trend.length > 1) {
        svg.appendChild(svgNode("polyline", { points: trend.map(function (point) { return x(point.date) + "," + y(point.value); }).join(" "), class: "publication-trend publication-series-" + (index % 4), fill: "none" }));
      }
      points.forEach(function (point) {
        const dot = svgNode("circle", { cx: x(point.date), cy: y(point.value), r: all.length > 120 ? 2 : 3.5, class: "publication-point publication-series-" + (index % 4), tabindex: "0" });
        dot.setAttribute("aria-label", group.label + ", " + point.date + ", " + displayNumber(point.value) + " " + unit);
        const title = svgNode("title"); title.textContent = dot.getAttribute("aria-label"); dot.appendChild(title);
        svg.appendChild(dot);
      });
    });
    panel.appendChild(svg);
    const legend = element("div", "publication-line-legend");
    groups.forEach(function (group, index) { legend.appendChild(element("span", "publication-legend-item publication-legend-" + (index % 4), group.label)); });
    panel.appendChild(legend);
    return panel;
  }

  function pairedDatePanels(payload) {
    const panels = element("div", "publication-graph-panels publication-graph-panels-single");
    (payload.panels || []).forEach(function (series) {
      const pairs = series.pairs || [];
      panels.appendChild(linePanel(series.title, series.unit, [
        { label: "Mall", points: pairs.map(function (p) { return { date: p.date, value: p.reference_value }; }) },
        { label: "Walk", points: pairs.map(function (p) { return { date: p.date, value: p.comparison_value }; }) }
      ]));
    });
    return panels;
  }

  function tripletTimeline(payload) {
    const metrics = [
      ["distance", "Actual authoritative distance", "miles"], ["duration", "Duration", "seconds"],
      ["cumulative_dynamic_shock_per_min", "Cumulative dynamic shock", "g*s/min"],
      ["magnitude_dynamic_g_rms", "Dynamic acceleration RMS", "g"], ["magnitude_jerk_rms_g_per_s", "Jerk RMS", "g/s"],
      ["mean_hr_bpm", "Heart rate", "bpm"], ["rmssd_ms", "Session RMSSD", "ms"], ["fsi", "Persisted FSI", "unitless index"]
    ];
    const wrapper = element("div", "publication-metric-view");
    const select = element("select", "publication-metric-select");
    select.setAttribute("aria-label", "Select experiment metric");
    metrics.forEach(function (metric) { const option = element("option", "", metric[1]); option.value = metric[0]; select.appendChild(option); });
    const chart = element("div", "publication-selected-chart");
    function draw() {
      chart.replaceChildren();
      const metric = metrics.find(function (item) { return item[0] === select.value; }) || metrics[0];
      const groups = ["mall", "walk", "pt"].map(function (role) {
        return { label: role === "pt" ? "PT" : role[0].toUpperCase() + role.slice(1), points: (payload.accessible_table || []).map(function (triplet) {
          const stage = (triplet.stages || []).find(function (item) { return String(item.label || item.sequence_role || "").toLowerCase().includes(role); });
          if (!stage) return null;
          const source = metric[0] === "distance" ? stage.distance : metric[0] === "duration" ? stage.duration : metric[0] === "fsi" ? stage.fsi : (stage.metrics || {})[metric[0]];
          return source && source.value !== undefined ? { date: triplet.date, value: source.value } : null;
        }).filter(Boolean) };
      });
      chart.appendChild(linePanel(metric[1], metric[2], groups));
    }
    select.addEventListener("change", draw);
    wrapper.appendChild(select); wrapper.appendChild(chart); draw();
    return wrapper;
  }

  function functionalTimeline(payload) {
    const panels = element("div", "publication-graph-panels");
    [["distance_miles", "Actual authoritative distance", "miles"], ["duration_seconds", "Duration", "seconds"]].forEach(function (metric) {
      const groups = ["mall", "walk", "pt"].map(function (role) {
        return { label: role === "pt" ? "PT" : role[0].toUpperCase() + role.slice(1), points: (payload.accessible_table || []).filter(function (row) { return String(row.sequence_role).toLowerCase().includes(role); }).map(function (row) { return { date: row.date, value: row[metric[0]] }; }) };
      });
      panels.appendChild(linePanel(metric[1], metric[2], groups));
    });
    return panels;
  }

  function longitudinalTimeline(payload) {
    const panels = element("div", "publication-graph-panels publication-graph-panels-single");
    function rollingMedian(points, window) {
      const ordered = points.slice().sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
      return ordered.map(function (point, index) {
        const values = ordered.slice(Math.max(0, index - window + 1), index + 1).map(function (item) { return Number(item.value); }).sort(function (a, b) { return a - b; });
        if (!values.length) return null;
        const middle = Math.floor(values.length / 2);
        return { date: point.date, value: values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2 };
      }).filter(Boolean);
    }
    function panelGroups(panelIndex) {
      const source = payload.panels && payload.panels[panelIndex] && payload.panels[panelIndex].series;
      return (Array.isArray(source) ? source : []).filter(function (series) { return ["FNS", "SNS", "XMS"].includes(series.label); }).map(function (series) {
        const points = (series.points || []).map(function (point) { return { date: point.date, value: point.value }; }).filter(function (point) { return Number.isFinite(Number(point.value)); });
        return { label: series.label, points: points, rawOnly: true, trendPoints: rollingMedian(points, 9) };
      });
    }
    panels.appendChild(linePanel("Recorded distance", "miles", panelGroups(0)));
    const details = element("details", "publication-details publication-duration-detail");
    details.appendChild(element("summary", "", "Show duration timeline"));
    details.appendChild(linePanel("Recorded duration", "minutes", panelGroups(1).map(function (group) { return { label: group.label, rawOnly: true, points: group.points.map(function (point) { return { date: point.date, value: Number(point.value) / 60 }; }), trendPoints: group.trendPoints.map(function (point) { return { date: point.date, value: Number(point.value) / 60 }; }) }; })));
    panels.appendChild(details);
    return panels;
  }

  function distributionPanels(payload) {
    const wrapper = element("div", "publication-metric-view");
    const select = element("select", "publication-metric-select");
    select.setAttribute("aria-label", "Select transportation burden metric");
    (payload.series || []).forEach(function (series, index) { const option = element("option", "", series.title); option.value = String(index); select.appendChild(option); });
    const chart = element("div", "publication-selected-chart");
    function draw() {
      chart.replaceChildren();
      const series = (payload.series || [])[Number(select.value) || 0];
      if (!series) return;
      const panel = element("section", "publication-graph-panel publication-distribution-panel");
      panel.appendChild(element("h3", "", series.title)); panel.appendChild(element("p", "publication-unit", "Unit: " + series.unit));
      const supported = new Set(["ParaTransit bus", "ParaTransit van", "ParaTransit sedan/taxi", "SilverRide"]);
      const points = (series.points || []).filter(function (point) { return supported.has(point.label); });
      const metricFields = {
        "Cumulative Shock": "cumulative_dynamic_shock",
        "Duration-normalized Cumulative Shock": "cumulative_dynamic_shock_per_min",
        "Jerk RMS": "jerk_rms_g_per_s",
        "Mean HR": "kubios_mean_hr_bpm",
        "RMSSD": "kubios_rmssd_ms",
        "SDNN": "kubios_sdnn_ms",
        "Shock Spike Rate": "shock_spike_rate_per_min",
        "Vertical RMS": "vertical_dynamic_g_rms",
        "Ride duration": "event_duration_seconds"
      };
      const field = metricFields[series.title];
      const labelFor = { paratransit_bus: "ParaTransit bus", paratransit_van: "ParaTransit van", paratransit_sedan_or_taxi: "ParaTransit sedan/taxi", paratransit_silverride: "SilverRide" };
      const raw = (payload.accessible_table || []).filter(function (row) { return supported.has(labelFor[row.canonical_cohort]); });
      const rawValue = function (row) { const value = field ? row[field] : null; return series.title === "Ride duration" && Number.isFinite(Number(value)) ? Number(value) / 60 : value; };
      const values = raw.map(rawValue).concat(points.flatMap(function (point) { return [point.q1, point.value, point.q3]; })).map(Number).filter(Number.isFinite);
      if (!values.length) return;
      const min = Math.min.apply(null, values), max = Math.max.apply(null, values), padding = (max - min || Math.max(1, Math.abs(max) * 0.05)) * 0.05;
      const domainMin = Math.max(0, min - padding), domainMax = max + padding, width = 820, rowHeight = 48, top = 18, left = 170, right = 112;
      const plotWidth = width - left - right, x = function (value) { return left + ((Number(value) - domainMin) / (domainMax - domainMin || 1)) * plotWidth; };
      const clipId = "transport-clip-" + String(series.title).replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      const svg = svgNode("svg", { viewBox: "0 0 " + width + " " + (top + rowHeight * points.length + 20), class: "publication-distribution-chart", role: "img", "aria-label": series.title + " transportation distribution" });
      const defs = svgNode("defs"); defs.appendChild(svgNode("clipPath", { id: clipId })); defs.firstChild.appendChild(svgNode("rect", { x: left, y: 0, width: plotWidth, height: top + rowHeight * points.length + 20 })); svg.appendChild(defs);
      points.forEach(function (point, index) {
        const y = top + index * rowHeight + 18, cohortRaw = raw.filter(function (row) { return labelFor[row.canonical_cohort] === point.label && Number.isFinite(Number(rawValue(row))); }), rawValues = cohortRaw.map(rawValue).map(Number), whiskerMin = Math.min.apply(null, rawValues.concat([Number(point.q1)])), whiskerMax = Math.max.apply(null, rawValues.concat([Number(point.q3)]));
        svg.appendChild(svgNode("text", { x: 4, y: y + 4, class: "publication-axis-label" })).textContent = point.label;
        const group = svgNode("g", { "clip-path": "url(#" + clipId + ")" });
        group.appendChild(svgNode("line", { x1: x(whiskerMin), x2: x(whiskerMax), y1: y, y2: y, class: "publication-whisker" }));
        group.appendChild(svgNode("rect", { x: x(point.q1), y: y - 9, width: Math.max(1, x(point.q3) - x(point.q1)), height: 18, class: "publication-box" }));
        group.appendChild(svgNode("line", { x1: x(point.value), x2: x(point.value), y1: y - 12, y2: y + 12, class: "publication-median-line" }));
        cohortRaw.forEach(function (row) { const value = Number(rawValue(row)); const circle = svgNode("circle", { cx: x(value), cy: y, r: 4, class: "publication-raw-point-svg", tabindex: "0" }); const label = labelFor[row.canonical_cohort] + ", " + series.title + ": " + displayNumber(value) + " " + series.unit + (row.event_date_local ? ", date " + row.event_date_local : "") + (row.mobility_event_id ? ", session " + row.mobility_event_id : ""); circle.setAttribute("aria-label", label); const title = svgNode("title"); title.textContent = label; circle.appendChild(title); group.appendChild(circle); });
        svg.appendChild(group);
        const valueLabel = svgNode("text", { x: width - right + 8, y: y + 4, class: "publication-axis-label" }); valueLabel.textContent = displayNumber(point.value) + " · n=" + point.sample_count; svg.appendChild(valueLabel);
      });
      panel.appendChild(svg);
      chart.appendChild(panel);
    }
    select.addEventListener("change", draw); wrapper.appendChild(select); wrapper.appendChild(chart); draw(); return wrapper;
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
    const genericRows = payload.accessible_table || [];
    const genericColumns = genericRows.length && genericRows[0] && typeof genericRows[0] === "object"
      ? Object.keys(genericRows[0]).map(function (key) { return [key, key.replaceAll("_", " ")]; })
      : [];
    return {
      columns: genericColumns,
      rows: genericRows
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

  function coverageBarChart(title, question, rows, valueLabel) {
    const panel = element("section", "coverage-overview-panel");
    panel.appendChild(element("h3", "", title));
    panel.appendChild(element("p", "publication-meta", question));
    const maximum = Math.max.apply(null, rows.map(function (row) { return row.value; }).concat([1]));
    const bars = element("div", "coverage-overview-bars");
    rows.slice().sort(function (left, right) { return right.value - left.value; }).forEach(function (row) {
      const item = element("div", "coverage-overview-row");
      item.appendChild(element("span", "coverage-overview-label", row.label));
      const track = element("span", "coverage-overview-track");
      const fill = element("i", "");
      fill.style.width = ((row.value / maximum) * 100).toFixed(2) + "%";
      track.appendChild(fill);
      item.appendChild(track);
      item.appendChild(element("strong", "", displayNumber(row.value) + (row.percent !== undefined ? " · " + displayNumber(row.percent) + "%" : "")));
      bars.appendChild(item);
    });
    panel.appendChild(bars);
    panel.appendChild(element("p", "coverage-overview-unit", valueLabel));
    return panel;
  }

  function renderCoverageOverview(mount, payload, longitudinal) {
    const matrix = payload.matrix || payload.accessible_table || [];
    const episodic = matrix.filter(function (row) { return row.domain === "episodic_metric"; });
    const scientific = matrix.filter(function (row) { return row.domain === "scientific_input" || row.domain === "scientific_persistence"; });
    const sumMetric = function (metric) { return episodic.filter(function (row) { return row.metric === metric; }).reduce(function (total, row) { return total + Number(row.available_count || 0); }, 0); };
    const findCount = function (domain, key, metric) {
      const row = scientific.find(function (item) { return item.domain === domain && item.key === key && (!metric || item.metric === metric); });
      return row ? Number(row.available_count || 0) : 0;
    };
    const cohorts = longitudinal && longitudinal.approved_values && Array.isArray(longitudinal.approved_values.all_time_cohorts) ? longitudinal.approved_values.all_time_cohorts : [];
    const sourceRows = [
      { label: "WHOOP", value: cohorts.reduce(function (total, row) { return total + Number(row.whoop_event_count || 0); }, 0) },
      { label: "Strava", value: cohorts.reduce(function (total, row) { return total + Number(row.strava_event_count || 0); }, 0) },
      { label: "Polar H10 / Kubios", value: findCount("scientific_input", "episodic_metrics") }
    ].filter(function (row) { return row.value > 0; });
    const metricRows = [
      { label: "Heart Rate", value: sumMetric("mean_hr_bpm") },
      { label: "HRV / RMSSD", value: sumMetric("rmssd_ms") },
      { label: "ACC / Motion", value: sumMetric("vertical_dynamic_g_rms") },
      { label: "Shock / Jerk", value: Math.max(sumMetric("magnitude_jerk_rms_g_per_s"), sumMetric("cumulative_dynamic_shock_per_min")) },
      { label: "Duration", value: findCount("scientific_input", "effective_event") },
      { label: "Distance / Speed", value: findCount("scientific_input", "distance_authority") },
      { label: "FSI", value: findCount("scientific_persistence", "fsi_tensor_v0_3", "fsi") },
      { label: "CSS", value: findCount("scientific_persistence", "css_cohort_review", "css") },
      { label: "Context / Cohort", value: findCount("scientific_persistence", "cohort_context") }
    ].filter(function (row) { return row.value > 0; });
    const longitudinalEvents = cohorts.reduce(function (total, row) { return total + Number(row.event_count || 0); }, 0);
    const episodicSessions = findCount("scientific_input", "episodic_metrics");

    mount.replaceChildren();
    mount.dataset.state = "ready";
    const section = element("section", "coverage-overview");
    const header = element("header", "coverage-overview-header");
    header.appendChild(element("p", "eyebrow", "Evidence map"));
    header.appendChild(element("h2", "", "Complementary source and metric coverage"));
    header.appendChild(element("p", "", "Longitudinal evidence provides repetition; episodic sensors provide measurement depth."));
    section.appendChild(header);
    const stats = element("div", "coverage-overview-stats");
    [
      [longitudinalEvents, "Longitudinal events"],
      [episodicSessions, "Episodic sensor sessions"],
      [sourceRows.length, "Evidence source families"],
      [cohorts.length, "Canonical cohorts"]
    ].forEach(function (stat) { const card = element("article", ""); card.appendChild(element("strong", "", displayNumber(stat[0]))); card.appendChild(element("span", "", stat[1])); stats.appendChild(card); });
    section.appendChild(stats);
    const charts = element("div", "coverage-overview-charts");
    charts.appendChild(coverageBarChart("Evidence Source Coverage", "Where does the evidence come from, and how much does each source contribute?", sourceRows, "Published usable event/session counts; sources can overlap on the same canonical event."));
    charts.appendChild(coverageBarChart("Metric Coverage", "Which dimensions of physiology, biomechanics, mobility, and context are represented?", metricRows, "Published observations containing the represented metric family."));
    section.appendChild(charts);
    section.appendChild(element("p", "coverage-overview-interpretation", "Evidence sources provide complementary coverage: WHOOP establishes longitudinal physiological patterns, Polar H10/Kubios adds high-resolution session HRV and motion measurements, and Strava characterizes functional distance, duration, and route context supporting the scientific graphs below."));
    section.appendChild(element("p", "publication-meta", "Data through " + payload.data_through_date + ". Counts are derived in the browser from the approved publication resources; no scientific metric is recomputed."));
    mount.appendChild(section);
  }

  function renderGraph(mount, payload) {
    mount.replaceChildren();
    mount.dataset.state = "ready";
    const figure = element("figure", "publication-graph");
    const header = element("figcaption", "publication-graph-header");
    header.appendChild(element("h2", "publication-graph-title", payload.title));
    if (payload.question) header.appendChild(element("p", "publication-question", "Question: " + payload.question));
    header.appendChild(element("p", "publication-finding", "Finding: " + (payload.finding || payload.interpretation)));
    if (payload.functional_meaning) header.appendChild(element("p", "publication-functional-meaning", "Functional meaning: " + payload.functional_meaning));
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
    if (payload.repeatability && (Array.isArray(payload.repeatability) ? payload.repeatability.length : Object.keys(payload.repeatability).length)) {
      header.appendChild(element("p", "publication-meta", "Repeatability: see the labeled summary and accessible canonical rows below."));
    }
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
    if (payload.graph_id === "walking_vs_mall_accumulated_mechanical_load" || payload.graph_id === "walking_vs_mall_dynamic_acceleration" || payload.graph_id === "walking_vs_mall_jerk") {
      visual.appendChild(pairedDatePanels(payload));
    } else if (payload.graph_id === "accepted_triplet_stage_profiles") {
      visual.appendChild(tripletTimeline(payload));
    } else if (payload.graph_id === "triplet_functional_output_context") {
      visual.appendChild(functionalTimeline(payload));
    } else if (payload.graph_id === "fns_sns_longitudinal_functional_capacity") {
      visual.appendChild(longitudinalTimeline(payload));
    } else if (payload.graph_id === "transportation_body_coupling_comparison") {
      visual.appendChild(distributionPanels(payload));
    } else if (payload.graph_type === "similarity_matrix" || payload.graph_type === "coverage_matrix") {
      visual.appendChild(renderTable(payload));
    } else if (
      payload.graph_type === "grouped_point_range" ||
      payload.graph_type === "grouped_score_dot_plot" ||
      payload.graph_type === "observed_null_dumbbell" ||
      payload.graph_type === "diverging_increment_bar" ||
      payload.graph_type === "feature_stability_frequency"
    ) {
      visual.appendChild(mlValidationPanels(payload));
    } else if (["aligned_dot_panels", "distribution_panels", "functional_output_burden_panels", "paired_date_dumbbells", "paired_delta_panels", "return_profile_panels", "stage_small_multiples", "time_series_small_multiples"].includes(payload.graph_type)) {
      visual.appendChild(graphPanels(payload));
    } else {
      throw new Error("Unsupported publication graph type: " + payload.graph_type);
    }
    figure.appendChild(visual);

    if (payload.planned_comparator) {
      const planned = element("aside", "publication-planned-comparator");
      planned.appendChild(element("strong", "", payload.planned_comparator.label + " — PLANNED COMPARATOR"));
      planned.appendChild(element("p", "publication-planned-status", payload.planned_comparator.status));
      planned.appendChild(element("p", "", payload.planned_comparator.research_question));
      planned.appendChild(element("p", "publication-meta", "No measured value or zero bar is shown. " + payload.planned_comparator.limitation));
      figure.appendChild(planned);
    }

    const inspect = element("a", "publication-inspect-link", "Inspect in Evidence Observatory");
    const inspectTargets = {
      walking_vs_mall_accumulated_mechanical_load: "/evidence/mobility-comparison/#mobility-graph",
      triplet_functional_output_context: "/evidence/mobility-comparison/#functional-output",
      accepted_triplet_stage_profiles: "/evidence/repeated-protocol/",
      transportation_body_coupling_comparison: "/evidence/transportation/#transport-graph",
      fns_sns_longitudinal_functional_capacity: "/evidence/longitudinal/#longitudinal-graph",
    };
    inspect.href = inspectTargets[payload.graph_id] || "/evidence/";
    figure.appendChild(inspect);

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
    document.querySelectorAll("[data-publication-hypothesis-registry]").forEach(function (mount) {
      resource(manifest, mount.dataset.publicationHypothesisRegistry)
        .then(function (payload) { renderHypothesisRegistry(mount, payload); })
        .catch(function () { unavailable(mount); });
    });
    document.querySelectorAll("[data-publication-identities]").forEach(function (mount) {
      resource(manifest, mount.dataset.publicationIdentities)
        .then(function (payload) { renderIdentities(mount, payload); })
        .catch(function () { unavailable(mount); });
    });
    document.querySelectorAll("[data-publication-graph]").forEach(function (mount) {
      const graphId = mount.dataset.publicationGraph;
      graph(manifest, graphId)
        .then(function (payload) {
          if (graphId === "source_metric_coverage_matrix") {
            return resource(manifest, "longitudinal").then(function (longitudinal) { renderCoverageOverview(mount, payload, longitudinal); });
          }
          renderGraph(mount, payload);
        })
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
            "[data-publication-status], [data-publication-facts], [data-publication-resource], [data-publication-hypothesis-registry], [data-publication-identities], [data-publication-graph]"
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
