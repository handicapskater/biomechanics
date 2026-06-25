(function () {
  const host = window.location.hostname.replace(/^www\./, "");

  const menus = {
    "handicapskater.com": {
      brand: "HandicapSkater.com",
      primaryLinks: [
        { href: "/", label: "Home", match: ["/"] },
        {
          href: "/healthcare-wearable-mobility/",
          label: "Health AI",
          match: ["/healthcare-wearable-mobility/"]
        },
        { href: "/story/", label: "Story", match: ["/story/"] },
        { href: "/biomechanics/", label: "Biomechanics", match: ["/biomechanics/"] },

        /*
          Keep Evidence focused on the evidence/data route only.
          Do not include /videos/, /precedent.html, or other More routes here,
          or Evidence will highlight when a More menu page is active.
        */
        {
          href: "/data.html",
          label: "Evidence",
          match: ["/data.html"]
        },

        { href: "/platform.html", label: "Platform", match: ["/platform.html"] },
        { href: "https://handicapskater.org/", label: "Standards", match: [] },

        /*
          More appears only because this object exists.
          Remove this object if you want More hidden.
        */
        { key: "more", label: "More" }
      ],
      moreLinks: [
        {
          href: "/evidence/strava-gps-skate-maps/",
          label: "Strava Maps",
          match: ["/evidence/strava-gps-skate-maps/"]
        },
        {
          href: "/paratransit-burden.html",
          label: "Transportation",
          match: ["/paratransit-burden.html"]
        },
        {
          href: "/videos/",
          label: "Videos",
          match: ["/videos/", "/videos/index.html"]
        },
        {
          href: "/precedent.html",
          label: "Public Review",
          match: ["/precedent.html"]
        }
      ]
    },

    "handicapskater.org": {
      brand: "HandicapSkater.org",
      primaryLinks: [
        { href: "/", label: "Home", match: ["/"] },
        { href: "/standards.html", label: "Standards", match: ["/standards.html"] },
        {
          href: "/transportation-accommodation.html",
          label: "Transportation",
          match: ["/transportation-accommodation.html"]
        },
        { href: "/evidence-standards.html", label: "Evidence", match: ["/evidence-standards.html"] },
        { href: "/reviewer-guidance.html", label: "Reviewers", match: ["/reviewer-guidance.html"] },
        { href: "/fsi-css-platform.html", label: "Platform", match: ["/fsi-css-platform.html"] },

        /*
          More appears only because this object exists.
          Remove this object if you want More hidden.
        */
        { key: "more", label: "More" }
      ],
      moreLinks: [
        {
          href: "/non-standard-mobility-aids.html",
          label: "Mobility Review",
          match: ["/non-standard-mobility-aids.html"]
        },
        {
          href: "/accommodation-framework.html",
          label: "Framework",
          match: ["/accommodation-framework.html"]
        },
        {
          href: "/dot-fta-doj-timeline.html",
          label: "Timeline",
          match: ["/dot-fta-doj-timeline.html"]
        },
        {
          href: "/direct-threat-analysis.html",
          label: "Direct Threat",
          match: ["/direct-threat-analysis.html"]
        },
        {
          href: "/public-record.html",
          label: "Public Record",
          match: ["/public-record.html"]
        },
        {
          href: "/references.html",
          label: "References",
          match: ["/references.html"]
        },
        {
          href: "https://handicapskater.com/",
          label: "Case Study",
          match: []
        }
      ]
    }
  };

  const fallback = menus["handicapskater.com"];
  const config = menus[host] || fallback;

  function isMoreLink(link) {
    const key = String(link.key || link.id || link.label || "")
        .trim()
        .toLowerCase();

    return key === "more";
  }

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

  function renderNavLink(link, path) {
    const href = link.href || "#";
    const label = link.label || "";
    const external = href.startsWith("http");
    const active = linkMatchesPath(link, path) ? ' aria-current="page"' : "";
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    const className = external ? ' class="nav-link external-link"' : ' class="nav-link"';

    return `<a${className} href="${href}"${active}${attrs}>${label}</a>`;
  }

  function renderMoreMenu(label, links, path) {
    if (!Array.isArray(links) || links.length === 0) {
      return "";
    }

    const active = links.some((link) => linkMatchesPath(link, path));
    const activeClass = active ? " is-active" : "";
    const menuLinks = links.map((link) => renderNavLink(link, path)).join("");

    return `
      <details class="nav-more${activeClass}">
        <summary class="nav-more-summary">${label || "More"}</summary>
        <div class="nav-more-menu">
          ${menuLinks}
        </div>
      </details>
    `;
  }

  function renderPrimaryNav(path) {
    const primaryLinks = Array.isArray(config.primaryLinks) ? config.primaryLinks : [];
    const moreLinks = Array.isArray(config.moreLinks) ? config.moreLinks : [];
    const moreConfig = primaryLinks.find(isMoreLink);
    const shouldRenderMore = Boolean(moreConfig) && moreLinks.length > 0;

    return primaryLinks
        .map((link) => {
          if (isMoreLink(link)) {
            if (!shouldRenderMore) {
              return "";
            }

            return renderMoreMenu(link.label || "More", moreLinks, path);
          }

          return renderNavLink(link, path);
        })
        .join("");
  }

  function closeAllMoreMenus(root) {
    const scope = root || document;

    scope.querySelectorAll(".nav-more[open]").forEach((details) => {
      details.removeAttribute("open");
    });
  }

  function wireMoreMenuCloseBehavior(root) {
    const header = root || document;

    header.querySelectorAll(".nav-more").forEach((details) => {
      const summary = details.querySelector(".nav-more-summary");
      const menu = details.querySelector(".nav-more-menu");

      if (!summary || !menu) {
        return;
      }

      menu.addEventListener("click", function (event) {
        if (event.target.closest("a")) {
          details.removeAttribute("open");
        }
      });
    });

    document.addEventListener("pointerdown", function (event) {
      const openMenu = document.querySelector(".nav-more[open]");

      if (!openMenu) {
        return;
      }

      if (!openMenu.contains(event.target)) {
        openMenu.removeAttribute("open");
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") {
        return;
      }

      const openMenu = document.querySelector(".nav-more[open]");
      if (!openMenu) {
        return;
      }

      const summary = openMenu.querySelector(".nav-more-summary");
      openMenu.removeAttribute("open");

      if (summary) {
        summary.focus();
      }
    });

    document.addEventListener("focusin", function (event) {
      const openMenu = document.querySelector(".nav-more[open]");

      if (!openMenu) {
        return;
      }

      if (!openMenu.contains(event.target)) {
        openMenu.removeAttribute("open");
      }
    });

    window.addEventListener(
        "scroll",
        function () {
          closeAllMoreMenus(document);
        },
        { passive: true }
    );

    window.addEventListener("resize", function () {
      closeAllMoreMenus(document);
    });
  }

  function renderSiteHeader() {
    const mount = document.getElementById("site-header");
    if (!mount) {
      return;
    }

    const path = normalizePath(window.location.pathname);
    const primaryNavHtml = renderPrimaryNav(path);

    mount.outerHTML = `
      <header class="site-header" data-site-host="${host}">
        <div class="nav-wrap">
          <a class="brand" href="/">${config.brand}</a>
          <nav class="site-nav" aria-label="Primary navigation">
            ${primaryNavHtml}
          </nav>
        </div>
      </header>
    `;

    const header = document.querySelector(".site-header[data-site-host]");
    if (header) {
      wireMoreMenuCloseBehavior(header);
    }
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