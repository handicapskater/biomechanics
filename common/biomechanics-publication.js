/*
 * Render-only reader for the governed Biomechanics publication resource.
 * Values are selected and formatted for presentation; scientific effects,
 * intervals, counts, classifications, and rankings are never recomputed here.
 */
(function () {
  "use strict";

  const ROOT = "/data/public/evidence-observatory/v1/";
  const MANIFEST = `${ROOT}manifest.json`;
  const RESOURCE_IDS = ["biomechanics-evidence", "computational-evidence", "repeated-protocol", "transportation"];

  const bindAll = (name, value) => {
    document.querySelectorAll(`[data-bind="${name}"]`).forEach((node) => { node.textContent = value; });
  };
  const fixed = (value, digits) => Number(value).toFixed(digits);
  const signed = (value, digits, unit) => `${value >= 0 ? "+" : "−"}${fixed(Math.abs(value), digits)} ${unit}`;
  const ratio = (count, total) => `${count}/${total} paired dates`;
  const yesNo = (value) => value ? "Yes" : "No";

  function resourceEntry(manifest, resourceId) {
    const entry = (manifest.resources || []).find((item) => item.resource_id === resourceId);
    if (!entry || !/^[a-z0-9-]+\.json$/.test(entry.path || "")) throw new Error(`manifest resource ${resourceId} is unavailable`);
    return entry;
  }

  async function loadResource(entry) {
    const response = await fetch(`${ROOT}${entry.path}`, { credentials: "same-origin" });
    if (!response.ok) throw new Error(`${entry.resource_id} HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.resource_id !== entry.resource_id || payload.content_hash !== entry.content_hash) throw new Error(`${entry.resource_id} failed manifest parity`);
    return payload;
  }

  function coreRows(computational) {
    const band = (computational.approved_values?.bands || []).find((item) => item.offline_rl_lab?.core_confirmatory_evidence);
    const rows = band?.offline_rl_lab?.core_confirmatory_evidence?.rows;
    if (!Array.isArray(rows)) throw new Error("Core Confirmatory rows are unavailable");
    return new Map(rows.map((row) => [row.evidence_id, row]));
  }

  function repeatedRows(repeated) {
    const rows = repeated.approved_values?.repeated_direction_summary;
    if (!Array.isArray(rows)) throw new Error("repeated-protocol rows are unavailable");
    return new Map(rows.map((row) => [row.metric_name, row]));
  }

  function renderDirectionStrip(name, count, total, label) {
    const strip = document.querySelector(`[data-direction-strip="${name}"]`);
    strip.replaceChildren();
    strip.setAttribute("aria-label", `${count} of ${total} paired dates higher during Walking; dates intentionally not published.`);
    for (let index = 0; index < total; index += 1) {
      const mark = document.createElement("span");
      mark.className = index < count ? "direction-mark direction-mark--expected" : "direction-mark direction-mark--other";
      mark.title = `${label} paired observation ${index + 1}: ${index < count ? "expected direction" : "other direction"}`;
      strip.append(mark);
    }
  }

  function renderShockTaxonomy(taxonomy) {
    const list = document.querySelector('[data-bind-list="shock-metrics"]');
    list.replaceChildren();
    taxonomy.distinct_metrics.forEach((metric) => {
      const item = document.createElement("li");
      item.textContent = metric;
      list.append(item);
    });
    bindAll("shock-explanation", taxonomy.explanation);
  }

  function labelMode(value) {
    return value.replaceAll("paratransit_", "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function renderTransportRows(vtb) {
    const tbody = document.querySelector("[data-transport-rows]");
    tbody.replaceChildren();
    Object.entries(vtb.mode_signatures).forEach(([mode, signature]) => {
      const coverageKey = mode === "paratransit_silverride" ? "SilverRide_FrontSeat" : mode;
      const coverage = vtb.mode_coverage[coverageKey];
      const row = document.createElement("tr");
      const values = [
        labelMode(mode),
        `${fixed(signature.medians.rms, 4)} g`,
        `${fixed(signature.medians.jerk_rms, 4)} g/s`,
        `${fixed(signature.medians.p99_9, 4)} g`,
        `${fixed(signature.medians.shock_cluster_rate_per_hour, 2)}/hour`,
        `${fixed(signature.medians.mean_hr_bpm, 1)} bpm`,
        coverage?.support || "Descriptive activity signature",
      ];
      values.forEach((value, index) => {
        const cell = document.createElement(index === 0 ? "th" : "td");
        if (index === 0) cell.scope = "row";
        cell.textContent = value;
        row.append(cell);
      });
      tbody.append(row);
    });
  }

  function renderTransferChain(chain) {
    const list = document.querySelector("[data-transfer-chain]");
    list.replaceChildren();
    chain.forEach((layer) => {
      const item = document.createElement("li");
      item.textContent = layer;
      list.append(item);
    });
  }

  function transportationMetric(transportation, cohort, metric) {
    const row = transportation.approved_values?.accessible_table?.find((item) => item.cohort === cohort);
    return row?.metrics?.[metric];
  }

  function render(resources) {
    const biomechanicsResource = resources.get("biomechanics-evidence");
    const values = biomechanicsResource.approved_values;
    const core = coreRows(resources.get("computational-evidence"));
    const repeated = repeatedRows(resources.get("repeated-protocol"));
    const transportation = resources.get("transportation");
    if (values.contract !== "biomechanics_publication_evidence.v1" || values.scientific_recomputation !== false) throw new Error("unexpected biomechanics publication contract");

    const ib = values.ib01;
    const distanceCore = core.get("triplet_distance_miles_Mall_to_Walk");
    const distanceRepeated = repeated.get("distance_miles");
    bindAll("function-effect", distanceCore.effect.replace("median paired Δ ", ""));
    bindAll("function-replication", ratio(distanceRepeated.walking_lower_than_mall_count, distanceRepeated.paired_date_count));
    bindAll("function-detail", `N=${distanceCore.independent_N} · 95% CI ${distanceCore.CI}`);
    bindAll("vertical-effect", signed(ib.vertical_rms.walking_minus_mall, 5, ib.vertical_rms.unit));
    bindAll("vertical-replication", ratio(ib.vertical_rms.direction_count, ib.vertical_rms.N));
    bindAll("vertical-detail", `Mall ${fixed(ib.vertical_rms.mall_median, 5)} g · Walking ${fixed(ib.vertical_rms.walking_median, 5)} g`);
    bindAll("jerk-effect", signed(ib.magnitude_jerk.walking_minus_mall, 5, ib.magnitude_jerk.unit));
    bindAll("jerk-replication", ratio(ib.magnitude_jerk.direction_count, ib.magnitude_jerk.N));
    bindAll("jerk-detail", `Mall ${fixed(ib.magnitude_jerk.mall_median, 5)} g/s · Walking ${fixed(ib.magnitude_jerk.walking_median, 5)} g/s`);
    bindAll("events-mall", fixed(ib.fixed_reference_event_density.mall_median, 4));
    bindAll("events-walking", fixed(ib.fixed_reference_event_density.walking_median, 4));
    bindAll("events-replication", ratio(ib.fixed_reference_event_density.direction_count, ib.fixed_reference_event_density.N));
    bindAll("mall-distance", `${fixed(distanceRepeated.mall_median, 3)} mi`);
    bindAll("walking-distance", `${fixed(distanceRepeated.walk_median, 3)} mi`);
    bindAll("pt-distance", `${fixed(distanceRepeated.pt_median, 3)} mi`);
    bindAll("mall-vertical", `${fixed(ib.vertical_rms.mall_median, 5)} g`);
    bindAll("walking-vertical", `${fixed(ib.vertical_rms.walking_median, 5)} g`);
    bindAll("mall-jerk", `${fixed(ib.magnitude_jerk.mall_median, 5)} g/s`);
    bindAll("walking-jerk", `${fixed(ib.magnitude_jerk.walking_median, 5)} g/s`);
    bindAll("mall-events", `${fixed(ib.fixed_reference_event_density.mall_median, 4)}/min`);
    bindAll("walking-events", `${fixed(ib.fixed_reference_event_density.walking_median, 4)}/min`);
    renderDirectionStrip("vertical", ib.vertical_rms.direction_count, ib.vertical_rms.N, "Vertical RMS");
    renderDirectionStrip("jerk", ib.magnitude_jerk.direction_count, ib.magnitude_jerk.N, "Magnitude jerk");

    bindAll("pareto-core", `${ib.pareto.core.direction_count}/${ib.pareto.core.N}`);
    bindAll("pareto-shock", `${ib.pareto.with_shock.direction_count}/${ib.pareto.with_shock.N}`);
    const tailBindings = { p90_g: "tail-p90", p95_g: "tail-p95", p99_g: "tail-p99", p99_9_g: "tail-p999" };
    Object.entries(tailBindings).forEach(([metric, target]) => {
      const tail = ib.tails.metrics[metric];
      bindAll(target, signed(tail.walking_minus_mall, 4, tail.unit));
      bindAll(`${target}-replication`, `${tail.direction_count}/${tail.N} higher`);
    });
    renderShockTaxonomy(ib.shock_taxonomy);

    bindAll("pt-effect", signed(ib.pt.distance.median_paired_difference_right_minus_left, 5, "mi"));
    bindAll("pt-replication", ratio(ib.pt.distance.right_higher_count, ib.pt.distance.eligible_N));
    bindAll("pt-classification", ib.pt.classification);
    bindAll("pt-shock-status", ib.pt.shock_rate_temporal_status);
    bindAll("longitudinal-activities", String(ib.longitudinal.activity_N));
    bindAll("longitudinal-dates", String(ib.longitudinal.date_N));
    bindAll("longitudinal-years", `${ib.longitudinal.years[0]}–${ib.longitudinal.years.at(-1)}`);
    bindAll("longitudinal-distance", `${fixed(ib.longitudinal.median_distance_miles, 2)} mi`);

    const vtb = values.vtb01;
    const motorcycle = vtb.mode_signatures.motorcycle;
    const bus = vtb.mode_signatures.paratransit_bus;
    bindAll("motorcycle-rms", `${fixed(motorcycle.medians.rms, 4)} g`);
    bindAll("motorcycle-jerk", `${fixed(motorcycle.medians.jerk_rms, 4)} g/s`);
    bindAll("motorcycle-p99", `${fixed(motorcycle.medians.p99, 4)} g`);
    bindAll("motorcycle-p999", `${fixed(motorcycle.medians.p99_9, 4)} g`);
    bindAll("motorcycle-hr", `${fixed(motorcycle.medians.mean_hr_bpm, 1)} bpm`);
    const motorcycleDose = transportationMetric(transportation, "motorcycle", "cumulative_dynamic_shock");
    bindAll("motorcycle-dose", motorcycleDose ? `${fixed(motorcycleDose.value, 4)} ${motorcycleDose.unit}` : "Unavailable");
    bindAll("motorcycle-context", vtb.mode_coverage.motorcycle.control_context);
    bindAll("bus-jerk", `${fixed(bus.medians.jerk_rms, 4)} g/s`);
    bindAll("bus-clusters", `${fixed(bus.medians.shock_cluster_rate_per_hour, 2)}/hour`);
    bindAll("bus-p999", `${fixed(bus.medians.p99_9, 4)} g`);
    bindAll("bus-hr", `${fixed(bus.medians.mean_hr_bpm, 1)} bpm`);
    bindAll("bus-context", vtb.mode_coverage.paratransit_bus.control_context);
    bindAll("transport-discordance", `${vtb.mechanics_physiology_status}: ${vtb.strongest_discordance}. HR is not pain.`);
    renderTransportRows(vtb);
    const transient = vtb.session_median_transients;
    bindAll("transport-transients", `${transient.session_median_missed_excursion_N}/${transient.transport_event_N}`);
    const front = vtb.mode_coverage.SilverRide_FrontSeat;
    const back = vtb.mode_coverage.SilverRide_BackSeat;
    bindAll("frontseat-coverage", `${front.mechanical_observation_N} sessions / ${front.mechanical_date_N} dates · ${front.support}`);
    bindAll("backseat-coverage", `${back.mechanical_observation_N} sessions / ${back.mechanical_date_N} dates · ${back.support} · ${back.temporal_activity_signature}`);

    const boundaries = values.measurement_boundaries;
    bindAll("boundary-force", yesNo(boundaries.internal_joint_force_measured));
    bindAll("boundary-pain", yesNo(boundaries.pain_identified));
    bindAll("boundary-coupling", yesNo(boundaries.body_coupling_directly_measured));
    const bct = values.bct01;
    renderTransferChain(bct.transfer_chain);
    bindAll("bct-design", bct.recommended_design);
    bindAll("bct-rate", `${bct.sample_rate_hz} Hz`);
    bindAll("bct-range", bct.acceleration_range_g);
    bindAll("bct-timing", `≤${bct.timing_acceptance_ms} ms`);
    bindAll("bct-unit", bct.independent_unit);
    bindAll("bct-status", `${bct.status} · executed: ${yesNo(bct.bct_executed)}`);

    bindAll("resource-contract", values.contract);
    bindAll("resource-recomputation", String(values.scientific_recomputation));
    bindAll("resource-analyses", values.analysis_ids.join(" · "));
    bindAll("resource-hash", biomechanicsResource.content_hash);
    const status = document.querySelector("[data-biomechanics-status]");
    status.textContent = "Governed evidence loaded and manifest-verified.";
    status.classList.add("publication-status--ready");
    document.querySelector("[data-publication-status]").dataset.publicationStatus = "ready";
  }

  async function load() {
    const status = document.querySelector("[data-biomechanics-status]");
    try {
      const response = await fetch(MANIFEST, { credentials: "same-origin" });
      if (!response.ok) throw new Error(`manifest HTTP ${response.status}`);
      const manifest = await response.json();
      if (manifest.destination !== "handicapskater.com" || manifest.publication_contract_version !== "fsicss_publication_bundle.v1") throw new Error("unexpected publication manifest");
      const entries = RESOURCE_IDS.map((resourceId) => resourceEntry(manifest, resourceId));
      const payloads = await Promise.all(entries.map(loadResource));
      render(new Map(entries.map((entry, index) => [entry.resource_id, payloads[index]])));
    } catch (error) {
      status.textContent = `Governed biomechanics evidence is unavailable: ${error.message}`;
      status.classList.add("publication-status--error");
      document.querySelector("[data-publication-status]").dataset.publicationStatus = "error";
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();
