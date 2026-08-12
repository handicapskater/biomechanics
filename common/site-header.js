(function () {
  const host = window.location.hostname.replace(/^www\./, "");

  const comEvidenceRoutes = [
    "/evidence/",
    "/evidence/mobility-comparison/",
    "/evidence/repeated-protocol/",
    "/evidence/transportation/",
    "/evidence/longitudinal/"
  ];

  const menus = {
    "handicapskater.com": {
      brand: "HandicapSkater.com",
      brandHomeControl: true,
      primaryLinks: [
        { href: "/story/", label: "Access Story", match: ["/story/"] },
        {
          key: "story-record",
          label: "Story Record",
          match: ["/story/", "/pain/"],
          menuGroups: [
            {
              links: [
                { href: "/story/#scientific-method", label: "Scientific Method Applied to Mobility", match: [] },
                { href: "/story/#timeline", label: "Timeline", match: [] },
                { href: "/pain/", label: "Walking Is Ballistic", match: ["/pain/"] }
              ]
            }
          ]
        },
        {
          key: "movement",
          label: "Biomechanics",
          match: ["/biomechanics/"],
          menuGroups: [
            {
              links: [
                { href: "/biomechanics/#pelvic-structure", label: "Pelvic Structure", match: [] },
                { href: "/biomechanics/#pelvic-kinematic-chain", label: "Pelvic Kinematic Chain", match: [] },
                { href: "/biomechanics/#movement-planes", label: "3D Movement", match: [] },
                { href: "/biomechanics/#walking-load-path", label: "Walking Load Path", match: [] },
                { href: "/biomechanics/#controlled-rolling", label: "Controlled Rolling", match: [] },
                { href: "/biomechanics/#controlled-propulsion", label: "Controlled Propulsion", match: [] },
                { href: "/biomechanics/#double-push", label: "Double Push", match: [] }
              ]
            }
          ]
        },
        {
          href: "/evidence/strava-gps-skate-maps/",
          label: "Route Explorer",
          match: ["/evidence/strava-gps-skate-maps/"]
        },
        { href: "/access/", label: "Transportation Recognition", match: ["/access/"] },
        {
          key: "more",
          label: "More",
          match: ["/health-ai/", "/platform/", "/videos/", ...comEvidenceRoutes],
          menuGroups: [
            {
              links: [
                {
                  href: "/health-ai/",
                  label: "Mobility Intelligence / Health AI",
                  match: ["/health-ai/"]
                },
                {
                  href: "/platform/",
                  label: "Explore Evidence Observatory",
                  match: ["/platform/", ...comEvidenceRoutes]
                },
                { href: "/videos/", label: "Videos", match: ["/videos/", "/videos/index.html"] },
                {
                  href: "https://handicapskater.org/standards/",
                  label: "Standards & Reviewer Guidance on HandicapSkater.org",
                  match: []
                }
              ]
            }
          ]
        }
      ]
    },

    "handicapskater.org": {
      brand: "HandicapSkater.org",
      primaryLinks: [
        { href: "/", label: "Home", match: ["/"] },
        {
          key: "standards",
          label: "Standards",
          match: ["/standards/", "/non-standard-mobility-aids/"],
          menuGroups: [
            {
              links: [
                { href: "/standards/", label: "Standards Overview", match: ["/standards/"] },
                {
                  href: "/non-standard-mobility-aids/",
                  label: "Mobility-Aid Principles",
                  match: ["/non-standard-mobility-aids/"]
                },
                { href: "/standards/#framework", label: "Individualized Assessment", match: [] }
              ]
            }
          ]
        },
        {
          key: "safety-review",
          label: "Safety Review",
          match: ["/direct-threat-analysis/"],
          menuGroups: [
            {
              links: [
                {
                  href: "/direct-threat-analysis/",
                  label: "Direct-Threat Analysis",
                  match: ["/direct-threat-analysis/"]
                },
                { href: "/direct-threat-analysis/#analysis", label: "Actual Risk", match: [] },
                {
                  href: "/direct-threat-analysis/#environment-specific-review",
                  label: "Environment-Specific Review",
                  match: []
                }
              ]
            }
          ]
        },
        {
          href: "/transportation-accommodation/",
          label: "Transportation",
          match: ["/transportation-accommodation/"]
        },
        {
          key: "evidence-quality",
          label: "Evidence Quality",
          match: ["/evidence-quality/", "/evidence-review/", "/reviewer-guidance/", "/references/"],
          menuGroups: [
            {
              links: [
                {
                  href: "/evidence-review/",
                  label: "Evidence Review Method",
                  match: ["/evidence-review/"]
                },
                {
                  href: "/evidence-quality/",
                  label: "Evidence Quality Overview",
                  match: ["/evidence-quality/"]
                },
                { href: "/references/#sources", label: "Sources and Provenance", match: [] },
                {
                  href: "/evidence-quality/#quality",
                  label: "Sample Size and Missingness",
                  match: []
                },
                {
                  href: "/reviewer-guidance/",
                  label: "Reviewer Guidance",
                  match: ["/reviewer-guidance/"]
                }
              ]
            }
          ]
        },
        {
          key: "more",
          label: "More",
          match: ["/timeline/"],
          menuGroups: [
            {
              links: [
                { href: "/timeline/", label: "DOT / FTA / DOJ Timeline", match: ["/timeline/"] },
                { href: "/references/", label: "References", match: ["/references/"] },
                {
                  href: "https://handicapskater.com/evidence/",
                  label: "N-of-1 Case Study & Evidence on HandicapSkater.com",
                  match: []
                }
              ]
            }
          ]
        }
      ]
    }
  };

  const fallback = menus["handicapskater.com"];
  const config = menus[host] || fallback;

  function isMenuLink(link) {
    return Array.isArray(link.menuGroups) && link.menuGroups.length > 0;
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

  function renderHeaderLabel(label) {
    if (String(label).toLowerCase() === "handicapskater.com") {
      return `<span class="small-caps">handicapskater</span>.com`;
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

  function renderMenuGroup(group, path) {
    const links = Array.isArray(group.links) ? group.links : [];
    const groupLabel = group.label
      ? `<p class="nav-menu-group-label">${group.label}</p>`
      : "";
    const menuLinks = links.map((link) => renderNavLink(link, path)).join("");

    return `<div class="nav-menu-group">${groupLabel}${menuLinks}</div>`;
  }

  function renderNavMenu(item, path) {
    const groups = Array.isArray(item.menuGroups) ? item.menuGroups : [];
    const links = groups.flatMap((group) => (Array.isArray(group.links) ? group.links : []));
    if (links.length === 0) {
      return "";
    }

    const active = linkMatchesPath(item, path) || links.some((link) => linkMatchesPath(link, path));
    const activeClass = active ? " is-active" : "";
    const menuId = `nav-menu-${item.key || "section"}`;
    const groupedClass = groups.some((group) => group.label) ? " nav-more-menu--grouped" : "";
    const menuGroups = groups.map((group) => renderMenuGroup(group, path)).join("");

    return `
      <details class="nav-more${activeClass}">
        <summary class="nav-more-summary" aria-controls="${menuId}">${item.label || "More"}</summary>
        <div class="nav-more-menu${groupedClass}" id="${menuId}">
          ${menuGroups}
        </div>
      </details>
    `;
  }

  function renderPrimaryNav(path) {
    const primaryLinks = Array.isArray(config.primaryLinks) ? config.primaryLinks : [];

    return primaryLinks
        .map((link) => {
          if (isMenuLink(link)) {
            return renderNavMenu(link, path);
          }

          return renderNavLink(link, path);
        })
        .join("");
  }

  function renderEvidenceAuthority(path) {
    if (host !== "handicapskater.com") {
      return "";
    }
    const compatibility = comEvidenceRoutes.includes(path)
      ? " This compatibility view is a synchronized projection; the Observatory remains authoritative."
      : "";
    return `
      <aside class="evidence-authority-strip" aria-label="Scientific evidence authority">
        <span>Scientific evidence authority</span>
        <a href="/platform/">Evidence Observatory</a>${compatibility}
      </aside>
    `;
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

      details.addEventListener("toggle", function () {
        if (!details.open) {
          return;
        }
        header.querySelectorAll(".nav-more[open]").forEach((other) => {
          if (other !== details) {
            other.removeAttribute("open");
          }
        });
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
    const evidenceAuthorityHtml = renderEvidenceAuthority(path);
    const brandCurrent = config.brandHomeControl && path === "/" ? ' aria-current="page"' : "";
    const brandLabel = renderHeaderLabel(config.brand);
    const brandAriaLabel = config.brandHomeControl ? ` aria-label="${config.brand} home"` : "";

    mount.outerHTML = `
      <header class="site-header" data-site-host="${host}">
        <div class="nav-wrap">
          <a class="brand" href="/"${brandCurrent}${brandAriaLabel}>${brandLabel}</a>
          <nav class="site-nav" aria-label="Primary navigation">
            ${primaryNavHtml}
          </nav>
        </div>
      </header>
      ${evidenceAuthorityHtml}
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
