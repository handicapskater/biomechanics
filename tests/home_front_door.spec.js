const { test, expect } = require("@playwright/test");
test.beforeEach(async ({page}) => {
  await page.route('https://hs-portal-324477223314.us-central1.run.app/**', route => route.abort());
});

const entries = [
  ["walking", "Why can’t he just walk?", "/pain/", "functional distance"],
  ["rolling", "Why do skates help?", "/biomechanics/", "vertical RMS"],
  ["evidence", "Is there actual evidence?", "/evidence/", "PVC-01"],
  ["recognition", "Is this legally recognized?", "/access/", "setting-specific"]
];

test("human-first sequence preserves evidence, footer, and responsive layout", async ({ page }, testInfo) => {
  const failures = [];
  page.on("pageerror", error => failures.push(error.message));
  page.on("response", response => {
    if (response.url().startsWith("http://127.0.0.1:4173/") && response.status() >= 400) failures.push(response.url());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Walking disables me. Skates give me mobility.");
  await expect(page.locator("#motorcycle-skates img")).toBeVisible();
  await expect(page.locator('.home-hook-answer a[href="/pain/"]')).toHaveCSS("color", "rgb(255, 220, 150)");
  expect(await page.locator("#motorcycle-skates img").evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  const ids = await page.locator("main > section").evaluateAll(nodes => nodes.map(node => node.id));
  expect(ids.filter(Boolean)).toEqual(["audience-routing"]);
  await expect(page.locator(".core-evidence-card, .home-prospective-details")).toHaveCount(0);
  const source = await (await page.request.get("/")).text();
  for (const id of ["visual-evidence", "continuity", "pain-function", "core-evidence", "prospective-validation", "hillsdale", "why-controlled-rolling", "recognition", "evidence-observatory", "requested-change"]) {
    expect(source).toContain(`id="${id}"`);
    await expect(page.locator(`#${id}`)).toHaveCount(0);
  }
  await expect(page.locator(".home-footer-description")).toContainText("separates physiologic burden, mechanical motion exposure, and body coupling");
  await expect(page.locator(".home-footer-social a")).toHaveCount(6);
  await expect(page.locator(".home-footer-donate")).toHaveText("Donation");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("homepage-full.png"), fullPage: true });
  await page.screenshot({ path: testInfo.outputPath("homepage-opening.png") });
  expect(failures).toEqual([]);
});

test("all six journeys retain context, destinations, keyboard access, and source boundaries", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main .home-journey-grid > a")).toHaveCount(6);
  for (const [id, label, href, context] of entries) {
    const trigger = page.locator(`main [data-home-journey="${id}"]`);
    await expect(trigger.locator("strong")).toHaveText(label);
    await expect(trigger).toHaveAttribute("href", href);
    await trigger.focus();
    await page.keyboard.press(id === "rolling" ? "Space" : "Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#home-journey-title")).toBeFocused();
    const titleBox = await page.locator("#home-journey-title").boundingBox();
    const headerBox = await page.locator(".guided-modal-header").boundingBox();
    expect(titleBox.y).toBeGreaterThanOrEqual(0);
    expect(titleBox.y).toBeGreaterThanOrEqual(Math.max(0, headerBox.y + headerBox.height));
    await expect(page.locator("[data-journey-context]")).not.toBeEmpty();
    const links = await page.locator("[data-journey-links] a").evaluateAll(nodes => nodes.map(n => n.getAttribute("href")));
    for (const target of links) {
      const url = new URL(target, "http://127.0.0.1:4173/");
      const response = await page.request.get(url.href);
      expect(response.ok(), target).toBe(true);
      if (url.hash) expect(await response.text(), target).toContain(`id="${url.hash.slice(1)}"`);
    }
    await expect(page.locator("[data-demo-signin]")).toBeVisible();
    await expect(page.locator("#home-journey-panel")).not.toContainText("Ask Evidence");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(page.locator("#home-journey-panel")).toBeHidden();
  }
  const accommodation = page.locator("main .home-journey-accommodation");
  await expect(accommodation.locator("strong")).toHaveText("I need a mobility-aid accommodation");
  await expect(accommodation).toHaveAttribute("href", "https://handicapskater.org/review-tools/");
  await expect(accommodation).not.toHaveAttribute("role", "button");
});

test("evidence destination has exactly six governed endpoint rows and remains separate", async ({ page }) => {
  await page.goto("/evidence/#prospective-validation");
  const region = page.locator("[data-pvc01-content]");
  await expect(region.locator("tbody tr")).toHaveCount(6);
  await expect(region).toContainText("No family-level success threshold was frozen");
  await expect(region).toContainText("CHEST_SHOCK_NOT_PELVIC_LOAD");
  const data = await (await page.request.get("/data/public/evidence-observatory/v1/biomechanics-evidence.json")).json();
  for (const [index, finding] of data.approved_values.pvc01.findings.entries()) {
    const row = region.locator("tbody tr").nth(index);
    await expect(row).toContainText(finding.values.direction_display);
    await expect(row).toContainText(finding.values.effect.toFixed(5));
    await expect(row).toContainText(finding.classification);
  }
  // The unchanged Evidence page contains other wide graphs; check the PVC
  // table's own containment here. Homepage overflow is checked above.
  await expect(region.locator(".biomechanics-table-wrap")).toHaveCSS("overflow-x", "auto");
});

test("lifelong entry is honest about CX availability and never invokes private Ask", async ({ page }, testInfo) => {
  const requests = [];
  page.on("request", request => requests.push(request.url()));
  await page.goto("/");
  const trigger = page.locator('main [data-home-journey="lifelong"]');
  await expect(trigger.locator("strong")).toHaveText("What does this mean for lifelong mobility?");
  await expect(trigger).toHaveAttribute("data-cx-entry-intent", "HOMEPAGE_LIFELONG_MOBILITY");
  await expect(trigger).toHaveAttribute("href", "/lifelong-mobility/");
  await trigger.focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#home-journey-title")).toBeFocused();
  await expect(page.locator("[data-demo-signin]")).toBeVisible();
  await expect(page.locator("#home-journey-panel details")).toHaveCount(0);
  await expect(page.locator("[data-journey-links] a")).toHaveCount(6);
  await expect(page.locator("[data-journey-context]")).toContainText("preserving useful function");
  await expect(page.locator(".home-hero")).not.toContainText("lifespan");
  await expect(page.locator(".home-hero")).toContainText("Shop. Skate. Ride. Continuous mobility.");
  expect((await page.locator(".home-hero").innerText()).split(/\s+/).length).toBeLessThan(178);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("lifelong-menu.png"), fullPage: true });
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.locator('main [data-home-journey="evidence"]').click();
  await expect(page.locator("#home-journey-panel details")).toHaveCount(0);
  expect(requests.some(url => /hs-observatory|ces\.googleapis|\/rag\//.test(url))).toBe(false);
});

test("lifelong reading fallback keeps boundaries, six choices and working public handoffs", async ({ page }, testInfo) => {
  await page.goto("/lifelong-mobility/");
  await expect(page.locator(".home-journey-grid a")).toHaveCount(6);
  for (const anchor of ["walking", "skating", "measured", "lifetime", "evidence"]) {
    await page.locator(`.home-journey-grid a[href="#${anchor}"]`).click();
    await expect(page.locator(`#${anchor}`)).toBeVisible();
  }
  await expect(page.locator("#evidence li")).toHaveCount(6);
  await expect(page.locator("#evidence li").last()).toContainText("1/5");
  await expect(page.locator("#evidence")).toContainText("No family-level success threshold");
  await expect(page.locator("#lifetime")).toContainText("No longevity benefit");
  await expect(page.locator("#walking")).toContainText("Kinematics");
  await expect(page.locator("#walking")).toContainText("Kinetics");
  await expect(page.locator("#measured")).toContainText("does not directly measure ground-reaction force");
  await expect(page.locator("#evaluation a.button")).toHaveAttribute("href", "https://handicapskater.org/review-tools/");
  expect(await page.locator('a[href*="/nsmaep/"], a[href*="?view=ask"]').count()).toBe(0);
  const targets = await page.locator('main a[href^="/"]').evaluateAll(nodes => nodes.map(n => n.getAttribute("href")));
  for (const target of new Set(targets)) {
    const response = await page.request.get(target);
    expect(response.ok(), target).toBe(true);
    const hash = new URL(target, "http://127.0.0.1:4173").hash;
    if (hash) expect(await response.text()).toContain(`id="${hash.slice(1)}"`);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("lifelong-reading.png"), fullPage: true });
});

test("guided sign-in preserves topic without exposing private Ask Evidence", async ({ page }) => {
  await page.goto("/");
  await page.locator('main [data-home-journey="evidence"]').click();
  const url = new URL(await page.locator('[data-demo-signin]').getAttribute('href'));
  expect(url.origin).toBe('https://hs-portal-324477223314.us-central1.run.app');
  expect(url.searchParams.get('return_to')).toContain('journey=evidence');
  await expect(page.locator('#home-journey-panel')).not.toContainText('Ask Evidence');
});

test("no-JavaScript routes and reduced motion remain usable", async ({ browser, browserName, page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  // WebKit follows macOS's default preference: Option+Tab includes links.
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  const context = await browser.newContext({ javaScriptEnabled: false });
  const plain = await context.newPage();
  await plain.goto("http://127.0.0.1:4173/");
  await expect(plain.locator(".home-journey-grid a")).toHaveCount(6);
  await expect(plain.locator(".home-journey-grid a").first()).not.toHaveAttribute("role", "button");
  await expect(plain.locator("#site-footer")).toHaveCount(1);
  await context.close();
});
