(function () {
  const host = window.location.hostname.replace(/^www\./, "");

  const menus = {
    "handicapskater.com": {
      brand: "HandicapSkater.com",
      primaryLinks: [
        { href: "/", label: "Home", match: ["/"] },
        { href: "/story/", label: "Story", match: ["/story/"] },
        { href: "/healthcare-wearable-mobility/", label: "Health AI", match: ["/healthcare-wearable-mobility/"] },
        { href: "/data.html", label: "Data", match: ["/data.html"] },
        { href: "/paratransit-burden.html", label: "Transit", match: ["/paratransit-burden.html"] },
        { href: "/platform.html", label: "Platform", match: ["/platform.html"] }
      ],
      moreLinks: [
        { href: "/videos/", label: "Videos", match: ["/videos/", "/videos/index.html"] },
        { href: "/evidence/strava-gps-skate-maps/", label: "GPS Maps", match: ["/evidence/strava-gps-skate-maps/"] },
        { href: "/precedent.html", label: "Precedent", match: ["/precedent.html"] },
        // { href: "/references.htm", label: "References", match: ["/references.htm", "/references.html"] },
        // { href: "/index.htm", label: "Legacy Site", match: ["/index.htm"] },
        { href: "https://handicapskater.org/", label: "Standards", match: [] }
      ]
    },

    "handicapskater.org": {
      brand: "HandicapSkater.org",
      primaryLinks: [
        { href: "/", label: "Home", match: ["/"] },
        { href: "/standards.html", label: "Standards", match: ["/standards.html"] },
        { href: "/non-traditional-mobility-aids.html", label: "Mobility Review", match: ["/non-traditional-mobility-aids.html"] },
        { href: "/transportation-accommodation.html", label: "Transport", match: ["/transportation-accommodation.html"] },
        { href: "/evidence-standards.html", label: "Evidence", match: ["/evidence-standards.html"] },
        { href: "/accommodation-framework.html", label: "Framework", match: ["/accommodation-framework.html"] }
      ],
      moreLinks: [
        { href: "/federal-timeline.html", label: "Timeline", match: ["/federal-timeline.html"] },
        { href: "/direct-threat-analysis.html", label: "Direct Threat", match: ["/direct-threat-analysis.html"] },
        { href: "/reviewer-guidance.html", label: "Reviewer Guidance", match: ["/reviewer-guidance.html"] },
        { href: "/fsi-css-platform.html", label: "FSI/CSS", match: ["/fsi-css-platform.html"] },
        { href: "/public-record.html", label: "Public Record", match: ["/public-record.html"] },
        { href: "/references.html", label: "References", match: ["/references.html", "/references.htm"] },
        { href: "https://handicapskater.com/", label: "Case Study", match: [] }
      ]
    }
  };

  const fallback = menus["handicapskater.com"];
  const config = menus[host] || fallback;

  function ensureChromeStylesheet() {
    const href = "/common/css/site-chrome.css";
    if (document.querySelector('link[href="' + href + '"]')) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function normalizePath(pathname) {
    if (!pathname || pathname === "/index.html" || pathname === "/index.htm") return "/";
    if (pathname.endsWith("/index.html")) return pathname.replace(/index\.html$/, "");
    if (pathname.endsWith("/index.htm")) return pathname.replace(/index\.htm$/, "");
    return pathname;
  }

  function isExternal(link) {
    return /^https?:\/\//i.test(link.href);
  }

  function isActive(link, path) {
    if (isExternal(link)) return false;
    return link.match.includes(path);
  }

  function renderNavLink(link, path) {
    const external = isExternal(link);
    const active = isActive(link, path) ? ' aria-current="page"' : "";
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    const className = external ? ' class="external-link"' : "";
    return `<a${className} href="${link.href}"${active}${attrs}>${link.label}</a>`;
  }

  function renderMoreMenu(links, path) {
    const active = links.some((link) => isActive(link, path));
    const activeClass = active ? " is-active" : "";
    const menuLinks = links.map((link) => renderNavLink(link, path)).join("");

    return `
      <details class="hs-more${activeClass}">
        <summary class="hs-more-summary">More</summary>
        <div class="hs-more-menu">
          ${menuLinks}
        </div>
      </details>
    `;
  }

  function renderSiteHeader() {
    ensureChromeStylesheet();

    const mount = document.getElementById("site-header");
    if (!mount) return;

    const path = normalizePath(window.location.pathname);
    const primaryNav = config.primaryLinks.map((link) => renderNavLink(link, path)).join("");
    const moreNav = renderMoreMenu(config.moreLinks, path);

    mount.outerHTML = `
      <header class="site-header" data-site-host="${host}">
        <div class="nav-wrap">
          <a class="brand" href="/">${config.brand}</a>
          <nav class="site-nav" aria-label="Main navigation">
            ${primaryNav}
            ${moreNav}
          </nav>
        </div>
      </header>
    `;
    wireMoreMenuCloseBehavior();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderSiteHeader);
  } else {
    renderSiteHeader();
  }

})();

function wireMoreMenuCloseBehavior() {
  const details = document.querySelector(".hs-more");
  if (!details) return;

  const summary = details.querySelector(".hs-more-summary");
  const menu = details.querySelector(".hs-more-menu");
  if (!summary || !menu) return;

  function closeMoreMenu() {
    details.removeAttribute("open");
  }

  document.addEventListener("pointerdown", function (event) {
    if (details.open && !details.contains(event.target)) {
      closeMoreMenu();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && details.open) {
      closeMoreMenu();
      summary.focus();
    }
  });

  document.addEventListener("focusin", function (event) {
    if (details.open && !details.contains(event.target)) {
      closeMoreMenu();
    }
  });

  menu.addEventListener("click", function (event) {
    if (event.target.closest("a")) {
      closeMoreMenu();
    }
  });

  window.addEventListener("scroll", function () {
    if (details.open) closeMoreMenu();
  }, { passive: true });

  window.addEventListener("resize", closeMoreMenu);
}