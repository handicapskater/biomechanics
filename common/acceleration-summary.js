(function () {
  "use strict";
  const artifact = "https://evidence.handicapskater.com/review-data/apple_silicon_acceleration_summary.json";
  function make(tag, className, value) { const node = document.createElement(tag); if (className) node.className = className; if (value !== undefined) node.textContent = value; return node; }
  function render(mount, payload) {
    const rows = payload && payload.benchmark_stages && payload.benchmark_stages.ACC && payload.benchmark_stages.ACC.measured_performance;
    const mlx = Array.isArray(rows) && rows.find(function (row) { return row.backend === "MLX"; });
    const coverage = payload && payload.real_data_coverage && payload.real_data_coverage.acc;
    if (!mlx || !coverage || !Array.isArray(payload.canonical_only_operations)) throw new Error("Incomplete approved acceleration summary");
    mount.replaceChildren(); mount.append(make("p", "eyebrow", "Engineering validation")); mount.append(make("h3", "", "Validated Apple Silicon acceleration"));
    mount.append(make("p", "", mlx.speedup_vs_numpy.toFixed(2) + "x MLX for the full ACC workload on released real data. Canonical scientific fallback remains preserved."));
    mount.append(make("p", "publication-meta", coverage.sessions + " sessions · " + coverage.dates + " dates · " + coverage.five_second_windows.toLocaleString() + " ACC windows"));
    const link = make("a", "", "Inspect validation boundaries and parity in the Evidence Observatory"); link.href = "https://evidence.handicapskater.com/#apple-silicon-acceleration"; mount.append(link);
  }
  function start() { document.querySelectorAll("[data-acceleration-summary-card]").forEach(function (mount) { fetch(artifact).then(function (response) { return response.ok ? response.json() : Promise.reject(new Error("Unavailable")); }).then(function (payload) { render(mount, payload); }).catch(function () { mount.replaceChildren(); const link = make("a", "", "Open Apple Silicon validation in the Evidence Observatory"); link.href = "https://evidence.handicapskater.com/#apple-silicon-acceleration"; mount.append(link); }); }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
