(() => {
  "use strict";
  const escape = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  document.addEventListener("DOMContentLoaded", async () => {
    const target = document.querySelector("[data-pvc01-content]");
    if (!target) return;
    const root = "/data/public/evidence-observatory/v1/";
    try {
      const manifestResponse = await fetch(`${root}manifest.json`);
      if (!manifestResponse.ok) throw new Error("Publication manifest unavailable");
      const manifest = await manifestResponse.json();
      const entry = manifest.resources.find(row => row.resource_id === "biomechanics-evidence");
      if (!entry || entry.path !== "biomechanics-evidence.json") throw new Error("Governed resource missing");
      const response = await fetch(`${root}${entry.path}`);
      if (!response.ok) throw new Error("Evidence unavailable");
      const resource = await response.json();
      if (resource.content_hash !== entry.content_hash) throw new Error("Manifest parity mismatch");
      const pvc = resource.approved_values.pvc01;
      if (pvc?.scientific_recomputation !== false || pvc.findings.length !== 6) throw new Error("Six governed endpoints required");
      target.innerHTML = `<p><strong>PROSPECTIVE_POST_LOCK</strong> · Dates: ${pvc.findings[0].values.dates.map(escape).join(", ")}</p>
        <div class="biomechanics-table-wrap" role="region" aria-label="Prospective endpoint results" tabindex="0"><table><caption>Frozen PVC-01 endpoints; median target-minus-source effect</caption><thead><tr><th scope="col">Endpoint</th><th scope="col">N</th><th scope="col">Frozen direction</th><th scope="col">Direction count</th><th scope="col">Effect</th><th scope="col">Interpretation</th></tr></thead><tbody>${pvc.findings.map(row => `<tr><th scope="row">${escape(row.values.contrast)} ${escape(row.values.metric.replaceAll("_", " "))}</th><td>${row.values.n}</td><td>${escape(row.values.expected_direction)}</td><td><strong>${escape(row.values.direction_display)}</strong></td><td>${row.values.effect.toFixed(5)} ${escape(row.values.unit)}</td><td>${escape(row.classification)}</td></tr>`).join("")}</tbody></table></div>
        <p>No family-level success threshold was frozen. These are endpoint-specific prospective results; historical Core values and denominators remain separate.</p>
        <p><strong>CHEST_SHOCK_NOT_PELVIC_LOAD.</strong> ${escape(pvc.measurement_boundary)} PT shock non-replication does not negate PT functional distance.</p>
        <details><summary>Intervals and frozen provenance</summary>${pvc.findings.map(row => `<p><strong>${escape(row.values.contrast)} ${escape(row.values.metric)}</strong>: bootstrap 95% interval ${row.values.bootstrap_95_ci.map(escape).join(" to ")} ${escape(row.values.unit)}. Exact one-sided sign p=${row.values.exact_sign_inference.one_sided_exact_p}; paired randomization p=${row.values.paired_randomization.p_value}. Source SHA-256: <code>${escape(row.source_hash)}</code>; frozen contract SHA-256: <code>${escape(row.values.contract_sha256)}</code>.</p>`).join("")}</details>`;
    } catch (error) { target.textContent = `Prospective evidence unavailable: ${error.message}`; }
  });
})();
