const { test, expect } = require("@playwright/test");

const entries = [
  ["walking", "Why can’t he just walk?", "/pain/", "functional distance"],
  ["rolling", "Why do skates help?", "/biomechanics/", "vertical RMS"],
  ["evidence", "Is there actual evidence?", "/evidence/", "PVC-01"],
  ["transport", "Why aren’t a wheelchair or paratransit enough?", "/access/#transportation-environment", "SilverRide"],
  ["recognition", "Is this legally recognized?", "/access/", "setting-specific"]
];

test("human-first sequence preserves evidence, footer, and responsive layout", async ({ page }, testInfo) => {
  const failures = [];
  page.on("pageerror", error => failures.push(error.message));
  page.on("response", response => {
    if (response.url().startsWith("http://127.0.0.1:4173/") && response.status() >= 400) failures.push(response.url());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Skates are my mobility aid.");
  await expect(page.locator("#motorcycle-skates img")).toBeVisible();
  expect(await page.locator("#motorcycle-skates img").evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  const ids = await page.locator("main > section").evaluateAll(nodes => nodes.map(node => node.id));
  const expected = ["audience-routing", "visual-evidence", "continuity", "pain-function", "core-evidence", "prospective-validation", "hillsdale", "why-controlled-rolling", "recognition", "evidence-observatory", "requested-change"];
  expect(ids.filter(Boolean)).toEqual(expected);
  await expect(page.locator(".core-evidence-card")).toHaveCount(4);
  await expect(page.locator(".home-prospective-details")).not.toHaveAttribute("open");
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
  await expect(page.locator(".home-journey-grid > a")).toHaveCount(6);
  for (const [id, label, href, context] of entries) {
    const trigger = page.locator(`[data-home-journey="${id}"]`);
    await expect(trigger.locator("strong")).toHaveText(label);
    await expect(trigger).toHaveAttribute("href", href);
    await trigger.focus();
    await page.keyboard.press(id === "rolling" ? "Space" : "Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#home-journey-title")).toBeFocused();
    const titleBox = await page.locator("#home-journey-title").boundingBox();
    const headerBox = await page.locator(".site-header").boundingBox();
    expect(titleBox.y).toBeGreaterThanOrEqual(0);
    expect(titleBox.y).toBeGreaterThanOrEqual(Math.max(0, headerBox.y + headerBox.height));
    await expect(page.locator("#home-journey-question")).toHaveValue(new RegExp(context));
    const links = await page.locator("[data-journey-links] a").evaluateAll(nodes => nodes.map(n => n.getAttribute("href")));
    for (const target of links) {
      const url = new URL(target, "http://127.0.0.1:4173/");
      const response = await page.request.get(url.href);
      expect(response.ok(), target).toBe(true);
      if (url.hash) expect(await response.text(), target).toContain(`id="${url.hash.slice(1)}"`);
    }
    await page.locator("#home-journey-panel summary").click();
    await expect(page.locator("#home-journey-panel a[href='https://hs-observatory-324477223314.us-central1.run.app/?view=ask']")).toBeVisible();
    await expect(page.locator("#home-journey-panel")).toContainText("authorized reviewer account");
    await expect(page.locator("#home-journey-panel")).toContainText("this page does not generate one");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(page.locator("#home-journey-panel")).toBeHidden();
  }
  const accommodation = page.locator(".home-journey-accommodation");
  await expect(accommodation.locator("strong")).toHaveText("I need a mobility-aid accommodation");
  await expect(accommodation).toHaveAttribute("href", "https://handicapskater.org/review-tools/#functional-intake");
  await expect(accommodation).not.toHaveAttribute("role", "button");
});

test("PVC drill-down has exactly six governed endpoint rows and remains separate", async ({ page }) => {
  await page.goto("/");
  await page.locator(".home-prospective-details > summary").click();
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
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("question copying preserves context and has an accessible denial fallback", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-home-journey="evidence"]').click();
  await page.locator("#home-journey-panel summary").click();
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", {
    configurable: true, value: { writeText: async text => { window.testCopiedQuestion = text; } }
  }));
  await page.locator("[data-copy-journey]").click();
  expect(await page.evaluate(() => window.testCopiedQuestion)).toBe(await page.locator("#home-journey-question").inputValue());
  await expect(page.locator(".home-journey-feedback")).toContainText("Question copied");
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", {
    configurable: true, value: { writeText: async () => { throw new Error("Denied"); } }
  }));
  await page.locator("[data-copy-journey]").click();
  await expect(page.locator("#home-journey-question")).toBeFocused();
  await expect(page.locator(".home-journey-feedback")).toContainText("Select and copy");
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
  await expect(plain.locator(".home-footer-description")).toBeVisible();
  await context.close();
});
