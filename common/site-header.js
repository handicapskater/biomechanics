(function () {
  const host = window.location.hostname.replace(/^www\./, "");

  const config = {
      brand: "HandicapSkater.com",
      primaryLinks: [
        { href: "/case/", label: "Case", match: ["/case/"] },
        { href: "/biomechanics/", label: "Biomechanics", match: ["/biomechanics/"] },
        { href: "/story/", label: "Story", match: ["/story/"] },
        { href: "/evidence/strava-gps-skate-maps/", label: "Routes", match: ["/evidence/strava-gps-skate-maps/"] },
        { href: "/access/", label: "Record", match: ["/access/"] },
        {
          href: "/evidence/",
          label: "Evidence",
          match: ["/platform/", "/evidence/", "/evidence/mobility-comparison/", "/evidence/repeated-protocol/", "/evidence/transportation/", "/evidence/longitudinal/"],
          children: [
            { href: "/evidence/", label: "Evidence Brief", match: ["/evidence/"] },
            { href: "/platform/", label: "Full Observatory", match: ["/platform/"] },
            { href: "/evidence/mobility-comparison/", label: "Walking Mechanical Load", match: ["/evidence/mobility-comparison/"] },
            { href: "/evidence/repeated-protocol/", label: "Perturbation & Recovery", match: ["/evidence/repeated-protocol/"] },
            { href: "/evidence/transportation/", label: "Transportation Body Coupling", match: ["/evidence/transportation/"] },
            { href: "/evidence/longitudinal/", label: "Longitudinal Capacity", match: ["/evidence/longitudinal/"] }
          ]
        },
        { href: "https://handicapskater.org/", label: "Standard", match: [] }
      ]
  };

  function normalizePath(pathname) {
    if (!pathname || pathname === "/index.html" || pathname === "/index.htm") {
      return "/";
    }

    if (pathname.endsWith("/index.html")) {
      return pathname.replace(/index\.html$/, "");
    }

    if (pathname.endsWith("/index.htm")) {
      return pathname.replace(/index\.htm$/, "");
    }

    return pathname;
  }

  function linkMatchesPath(link, path) {
    const href = link.href || "";
    const match = Array.isArray(link.match) ? link.match : [];

    if (href.startsWith("http")) {
      return false;
    }

    return match.includes(path);
  }

  function renderHeaderLabel(label) {
    if (String(label).toLowerCase() === "handicapskater.com") {
      return "HandicapSkater.com";
    }

    if (String(label).toLowerCase() === "handicapskater.org") {
      return `<span class="small-caps">handicapskater</span>.org`;
    }

    if (String(label).toLowerCase() === "handicapskater") {
      return `<span class="small-caps">handicapskater</span>`;
    }

    return label;
  }

  function renderNavLink(link, path) {
    const href = link.href || "#";
    const label = link.label || "";
    const external = href.startsWith("http");
    const active = linkMatchesPath(link, path) ? ' aria-current="page"' : "";
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    const className = external ? ' class="nav-link external-link"' : ' class="nav-link"';

    // return `<a${className} href="${href}"${active}${attrs}>${label}</a>`;
    const renderedLabel = renderHeaderLabel(label);

    return `<a${className} href="${href}"${active}${attrs}>${renderedLabel}</a>`;
  }

  function renderPrimaryNav(path) {
    return config.primaryLinks.map((link) => {
      if (!Array.isArray(link.children)) {
        return renderNavLink(link, path);
      }

      const active = linkMatchesPath(link, path) ? ' aria-current="page"' : "";
      const children = link.children.map((child) => renderNavLink(child, path)).join("");
      return `<details class="nav-dropdown">
        <summary${active}>${renderHeaderLabel(link.label)}</summary>
        <div class="nav-dropdown-menu">${children}</div>
      </details>`;
    }).join("");
  }

  function renderSiteHeader() {
    const mount = document.getElementById("site-header");
    if (!mount) {
      return;
    }

    const path = normalizePath(window.location.pathname);
    const primaryNavHtml = renderPrimaryNav(path);
    const brandLabel = renderHeaderLabel(config.brand);
    const brandCurrent = path === "/" ? ' aria-current="page"' : "";

    mount.outerHTML = `
      <header class="site-header" data-site-host="${host}">
        <div class="nav-wrap">
          <a class="brand" href="/" aria-label="${config.brand}"${brandCurrent}>${brandLabel}</a>
          <nav class="site-nav" aria-label="Primary navigation">
            ${primaryNavHtml}
          </nav>
        </div>
      </header>
    `;

  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderSiteHeader);
  } else {
    renderSiteHeader();
  }
})();

function normalizeSectionAlternation() {
  const sections = Array.from(document.querySelectorAll("main > section.section"));

  sections.forEach((section, index) => {
    section.classList.toggle("alt", index % 2 === 1);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", normalizeSectionAlternation);
} else {
  normalizeSectionAlternation();
}
