/*
 * Public Lab destination. Change this one value when the canonical hostname
 * completes provisioning; public pages use data-evidence-observatory-link.
 */
(function () {
  const PUBLIC_EVIDENCE_OBSERVATORY_URL = "https://hs-evidence-public-dpnhm5kswq-uc.a.run.app/";
  window.PUBLIC_EVIDENCE_OBSERVATORY_URL = PUBLIC_EVIDENCE_OBSERVATORY_URL;
  function connectObservatoryLinks() {
    document.querySelectorAll("[data-evidence-observatory-link]").forEach((link) => {
      link.href = PUBLIC_EVIDENCE_OBSERVATORY_URL;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", connectObservatoryLinks);
  else connectObservatoryLinks();
})();
