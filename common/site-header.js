(function () {
  const links = [
    { href: "/story/", label: "Story", match: ["/", "/story/"] },
    { href: "/healthcare-wearable-mobility/", label: "Healthcare", match: ["/", "/healthcare-wearable-mobility/"] },
    { href: "/data.html", label: "Data", match: ["/data.html"] },
    { href: "/health-ai.html", label: "Health AI", match: ["/health-ai.html"] },
    { href: "/evidence/strava-gps-skate-maps/", label: "GPS Maps", match: ["/evidence/strava-gps-skate-maps/"] },
    { href: "/precedent.html", label: "Precedent", match: ["/precedent.html"] },
    { href: "/videos/", label: "Videos", match: ["/videos/", "/videos/index.html"] },
    { href: "/platform.html", label: "Platform", match: ["/platform.html"] },
    { href: "/standards.html", label: "Standards", match: ["/standards.html"] }
  ];

  function normalizePath(pathname) {
    if (pathname === "/index.html") return "/";
    if (pathname.endsWith("/index.html")) return pathname.replace(/index\.html$/, "");
    return pathname;
  }

  const path = normalizePath(window.location.pathname);
  const navLinks = links.map((link) => {
    const isCurrent = link.match.includes(path);
    const currentAttr = isCurrent ? ' aria-current="page"' : "";
    return `        <a${currentAttr} href="${link.href}">${link.label}</a>`;
  }).join("\n");

  const header = `
  <header class="site-header">
    <div class="nav-wrap">
<!--      <a class="brand" href="/story/">HandicapSkater</a>-->
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
