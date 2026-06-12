(function () {
  const links = [
    { href: "/", label: "Home", match: ["/"] },
    { href: "/story/", label: "Story", match: ["/story/"] },
    { href: "/healthcare-wearable-mobility/", label: "Healthcare", match: ["/healthcare-wearable-mobility/"] },
    { href: "/data.html", label: "Data", match: ["/data.html"] },
    { href: "/health-ai.html", label: "Health AI", match: ["/health-ai.html"] },
    { href: "/platform.html", label: "Platform", match: ["/platform.html"] },
    { href: "/videos/", label: "Videos", match: ["/videos/", "/videos/index.html"] },
    { href: "/evidence/strava-gps-skate-maps/", label: "GPS Maps", match: ["/evidence/strava-gps-skate-maps/"] },
    { href: "/precedent.html", label: "Precedent", match: ["/precedent.html"] },
    { href: "https://handicapskater.org/", label: "Standards", match: [] }
  ];

  function normalizePath(pathname) {
    if (pathname === "/index.html") return "/";
    if (pathname.endsWith("/index.html")) return pathname.replace(/index\.html$/, "");
    return pathname;
  }

  const path = normalizePath(window.location.pathname);
  const navLinks = links.map((link) => {
    const external = link.href.startsWith("http");
    const active = !external && link.match.includes(path) ? ' aria-current="page"' : "";
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    const externalClass = external ? " external-link" : "";
    return `<a class="nav-link${externalClass}" href="${link.href}"${active}${attrs}>${link.label}</a>`;
  }).join("");

  const header = `
  <header class="site-header">
    <div class="nav-wrap">
      <a class="brand" href="/">HandicapSkater.com</a>
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
