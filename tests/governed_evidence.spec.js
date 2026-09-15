const { test, expect } = require("@playwright/test");

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('handicapskater_welcome_modal', JSON.stringify({suppressAutoOpen:true, suppressedAt:Date.now(), version:2})));
});

test("evidence brief renders the selected governed bundle with accessible tables", async ({ page }) => {
  await page.goto("/evidence/");
  await expect(page.locator(".governed-graph-mounted")).toHaveCount(10);
  await expect(page.locator('[data-governed-graph="h1_mechanical_only_validation"]')).toContainText("H1 mechanical-only replication");
  await expect(page.locator('[data-governed-graph="fns_sns_longitudinal_functional_capacity"]')).toContainText("FNS/SNS Sustained-Skating Capacity");
  await expect(page.locator('[data-governed-graph="h1_mechanical_only_validation"] details').first()).toContainText("View accessible data");
  await page.getByText("Transportation body-coupling denominator layers", { exact: true }).click();
  await expect(page.locator('[data-governed-graph="transportation_body_coupling_comparison"]')).toContainText("EPISODIC BODY-COUPLING / COMPONENT SUPPORT");
  await expect(page.locator('[data-governed-graph="h1_mechanical_only_validation"] a[data-evidence-observatory-link]')).toHaveAttribute("href", "https://evidence.handicapskater.com/");
  await expect(page.locator(".governed-graph-error")).toHaveCount(0);
});

test("evidence brief renders governed mobility biomechanics without recomputation", async ({ page }) => {
  await page.goto("/evidence/");
  const section = page.locator("#mobility-biomechanics-evidence");
  await expect(section).toContainText("Mobility biomechanics evidence");
  await expect(section).toContainText("+0.08486 g");
  await expect(section).toContainText("+0.63704 g/s");
  await expect(section).toContainText("44/44 expected direction");
  await expect(section).toContainText("25/25 paired dates");
  await expect(section).toContainText("43/43");
  await expect(section).toContainText("PT_DISTINCT_FUNCTIONAL_SKATING_STATE");
  await expect(section).toContainText("598 activities");
  await expect(section).toContainText("33/45 aligned transport events");
  await expect(section).toContainText("CASE_CONTEXT_ONLY");
  await expect(section).toContainText("DESIGN ONLY — NOT YET EXECUTED");
  await expect(section).toContainText("scientific_recomputation=false");
  await expect(section.locator(".biomechanics-evidence-error")).toHaveCount(0);
});

test("biomechanics remains the restored movement-context experience", async ({ page }) => {
  await page.goto("/biomechanics/");
  await expect(page.getByRole("heading", { name: "Walking and Controlled Inline Skating" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "A Functional Movement Hypothesis" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "A Step Travels Through a Linked Mechanical Chain" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mechanical Exposure Is Not the Same as Functional Burden" })).toBeVisible();
  await expect(page.locator("script[src='/common/evidence-biomechanics.js']")).toHaveCount(0);
});

test("evidence biomechanics remains responsive without document overflow", async ({ page }) => {
  await page.goto("/evidence/");
  const section = page.locator("#mobility-biomechanics-evidence");
  await expect(section.locator("[data-biomechanics-content]")).toBeVisible();
  await expect(section.locator(".biomechanics-evidence-card")).toHaveCount(4);
  await expect(section.locator(".biomechanics-table-wrap")).toHaveCSS("overflow-x", "auto");
});

test("health AI presents the connected governed architecture without overflow", async ({ page }) => {
  await page.goto("/health-ai/");
  const architecture = page.locator("#explainable-architecture");
  await expect(architecture.getByRole("heading", { name: "One Governed Pipeline, from Telemetry to Inspectable Evidence" })).toBeVisible();
  await expect(architecture.locator(".connected-ai-flow li")).toHaveCount(10);
  await expect(architecture.locator(".connected-ai-flow")).toContainText("Fractal Stability Index");
  await expect(architecture.locator(".connected-ai-flow")).toContainText("Cohort Similarity Score");
  await expect(architecture.locator(".connected-ai-flow")).toContainText("Evidence Registry");
  await expect(architecture.locator(".connected-ai-flow")).toContainText("RL01–RL10");
  await expect(architecture).toContainText("not a deployed clinical policy");
  await expect(architecture.locator("ol")).toHaveAttribute("aria-label", /Connected AI architecture/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("home and case retain compact governed evidence entry points", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".core-evidence-card")).toHaveCount(0);
  await expect(page.locator('main [data-home-journey="evidence"]')).toBeVisible();
  await expect(page.locator(".governed-graph-error")).toHaveCount(0);
  await page.goto("/case/");
  await expect(page.locator(".governed-graph-mounted")).toHaveCount(3);
  await expect(page.locator(".governed-graph-error")).toHaveCount(0);
});

test("home retains lower evidence in source while guiding visitors to visible evidence pages", async ({ page }) => {
  await page.goto("/");
  const positions = await page.locator("main > section").evaluateAll((sections) =>
    sections.map((section) => section.id)
  );
  expect(positions).toEqual(["", "audience-routing"]);
  const source = await (await page.request.get("/")).text();
  for (const id of ["visual-evidence", "continuity", "pain-function", "core-evidence", "hillsdale", "why-controlled-rolling"]) {
    expect(source).toContain(`id="${id}"`);
  }
  await page.locator('main [data-home-journey="evidence"]').click();
  await expect(page.locator('[data-journey-links] a[href="/evidence/#mobility-biomechanics-evidence"]')).toBeVisible();
  await expect(page.locator('[data-journey-links] a[href="/evidence/longitudinal/"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("case orientation and evidence opening preserve progressive disclosure", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#pain-function")).toHaveCount(0);
  await expect(page.locator('main [data-home-journey="walking"]')).toHaveAttribute("href", "/pain/");
  await expect(page.locator('main [data-home-journey="recognition"]')).toHaveAttribute("href", "/access/");

  await page.goto("/evidence/");
  const outcomes = page.locator("#evidence-outcomes");
  await expect(outcomes).toContainText("What does the evidence show?");
  await expect(outcomes).toContainText("Walking provides far less functional mobility");
  await expect(outcomes.locator("details")).toContainText("How the evidence is built");
  await expect(outcomes).toContainText("governed longitudinal N-of-1 data-science project");

  await page.goto("/access/");
  await expect(page.locator("#access-orientation")).toContainText("what is requested");
  await expect(page.locator("#access-orientation")).toContainText("not rejected solely by category or appearance");

  await page.goto("/pleadings.htm");
  await expect(page.locator('[role="note"]')).toContainText("Historical archive");
});
