function ensureChromeStylesheet() {
  if (document.querySelector('link[href="/common/css/site-chrome.css"]')) {
    return;
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/common/css/site-chrome.css";
  document.head.appendChild(link);
}

function normalizePath(pathname) {
  if (!pathname || pathname === "/index.html") return "/";
  if (pathname.endsWith("/index.html")) return pathname.replace(/index\.html$/, "");
  return pathname;
}

function renderNavLink(link, path) {
  const external = link.href.startsWith("http");
  const active = !external && link.match.includes(path) ? ' aria-current="page"' : "";
  const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
  const className = external ? ' class="external-link"' : "";
  return `<a${className} href="${link.href}"${active}${attrs}>${link.label}</a>`;
}

function renderSiteHeader(config) {
  ensureChromeStylesheet();
  const path = normalizePath(window.location.pathname);
  const nav = config.links.map((link) => renderNavLink(link, path)).join("");
  const mount = document.getElementById("site-header");
  if (!mount) {
    return;
  }
  mount.outerHTML = `
  <header class="site-header">
    <div class="nav-wrap">
      <a class="brand" href="/">${config.brand}</a>
      <nav class="site-nav" aria-label="Main navigation">${nav}</nav>
    </div>
  </header>`;
}
