(function () {
  const links = [
    { href: "/story/", label: "Story", match: ["/", "/story/"] },
    { href: "/data.html", label: "Data", match: ["/data.html"] },
    { href: "/health-ai.html", label: "Health AI", match: ["/health-ai.html"] },
    { href: "/evidence/strava-gps-skate-maps/", label: "GPS Maps", match: ["/evidence/strava-gps-skate-maps/"] },
    { href: "/precedent.html", label: "Precedent", match: ["/precedent.html"] },
    { href: "/videos/", label: "Videos", match: ["/videos/", "/videos/index.html"] },
    { href: "/platform.html", label: ".com Platform", match: ["/platform.html"] },
    { href: "/standards.html", label: ".org Standards", match: ["/standards.html"] }
  ];

  const rawPath = window.location.pathname;
  const path = rawPath.endsWith("/index.html")
    ? rawPath.replace(/index\.html$/, "")
    : rawPath;

  const navLinks = links.map((link) => {
    const isCurrent = link.match.includes(path);
    const currentAttr = isCurrent ? ' aria-current="page"' : "";
    return `        <a${currentAttr} href="${link.href}">${link.label}</a>`;
  }).join("\n");

  const header = `
  <header class="site-header">
    <div class="nav-wrap">
      <a class="brand" href="/story/">HandicapSkater</a>
      <nav class="site-nav" aria-label="Main navigation">
${navLinks}
      </nav>
    </div>
  </header>`;

  const mount = document.getElementById("site-header");
  if (mount) {
    mount.outerHTML = header;
  }
})();
