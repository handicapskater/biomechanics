(function () {
  const host = window.location.hostname.replace(/^www\./, "");
  const mount = document.getElementById("site-footer");
  if (!mount) return;

  const footers = {
    "handicapskater.com": `
<footer class="site-footer">
  <div class="footer-inner">
<!--    <nav class="footer-nav" aria-label="Footer navigation">-->
<!--      <a href="/story/">Story</a>-->
<!--      <a href="/healthcare-wearable-mobility/">Healthcare</a>-->
<!--      <a href="/data.html">Data</a>-->
<!--      <a href="/videos/">Videos</a>-->
<!--      <a href="/references.html">References</a>-->
<!--    </nav>-->

    <div class="footer-social" aria-label="Support and social links">
      <a href="https://www.gofundme.com/f/handicapskater-revolutionizing-health-mobility-through-ai" target="_blank" rel="noopener noreferrer">Donate Now</a>
      <a href="http://www.facebook.com/group.php?gid=44036411369" target="_blank" rel="noopener noreferrer">Facebook</a>
      <a href="https://twitter.com/handicapskater" target="_blank" rel="noopener noreferrer">X</a>
      <a href="https://www.youtube.com/channel/UCv8NPazTzuPxE_YM8-MIReQ" target="_blank" rel="noopener noreferrer">YouTube</a>
      <a href="https://rumble.com/c/c-1635644" target="_blank" rel="noopener noreferrer">Rumble</a>
      <a href="https://instagram.com/handicapskater" target="_blank" rel="noopener noreferrer">Instagram</a>
    </div>

    <p class="footer-copy">Copyright © 2004 to 2026 HandicapSkater.</p>
    <p class="footer-description">HandicapSkater.com presents the public case study, wearable mobility evidence, notebooks, outreach, and platform direction.</p>
  </div>
</footer>
`,
    "handicapskater.org": `
<footer class="site-footer">
  <div class="footer-inner">
    <nav class="footer-nav" aria-label="Footer navigation">
      <a href="/">Home</a>
      <a href="/standards.html">Standards</a>
      <a href="/non-traditional-mobility-aids.html">Mobility Review</a>
      <a href="/evidence-standards.html">Evidence</a>
      <a href="/fsi-css-platform.html">FSI/CSS</a>
      <a href="/references.html">References</a>
    </nav>

    <div class="footer-social">
      <a href="https://handicapskater.com/" target="_blank" rel="noopener noreferrer">Case Study</a>
    </div>

    <p class="footer-copy">Copyright © 2004 to 2026 HandicapSkater.org.</p>
    <p class="footer-description">HandicapSkater.org provides standards, review frameworks, and public accessibility guidance. The individual evidence record lives on HandicapSkater.com.</p>
  </div>
</footer>
`
  };

  mount.innerHTML = footers[host] || footers["handicapskater.com"];
})();
