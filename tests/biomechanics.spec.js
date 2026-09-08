const { test, expect } = require("@playwright/test");

test("biomechanics page renders governed values and reviewer-first boundaries", async ({ page }) => {
  await page.goto("/biomechanics/");
  await expect(page.locator("[data-publication-status]")).toHaveAttribute("data-publication-status", "ready", { timeout: 20000 });
  const resource = await page.evaluate(async () => (await fetch("/data/public/evidence-observatory/v1/biomechanics-evidence.json")).json());
  const values = resource.approved_values;

  await expect(page.getByRole("heading", { name: /Walking is the ballistic mobility perturbation/ })).toBeVisible();
  await expect(page.locator("[data-evidence-card]")).toHaveCount(4);
  await expect(page.locator('[data-bind="vertical-effect"]').first()).toHaveText(`+${values.ib01.vertical_rms.walking_minus_mall.toFixed(5)} ${values.ib01.vertical_rms.unit}`);
  await expect(page.locator('[data-bind="jerk-effect"]').first()).toHaveText(`+${values.ib01.magnitude_jerk.walking_minus_mall.toFixed(5)} ${values.ib01.magnitude_jerk.unit}`);
  await expect(page.locator('[data-bind="vertical-replication"]').first()).toHaveText(`${values.ib01.vertical_rms.direction_count}/${values.ib01.vertical_rms.N} paired dates`);
  await expect(page.locator('[data-bind="events-mall"]')).toHaveText(values.ib01.fixed_reference_event_density.mall_median.toFixed(4));
  await expect(page.locator('[data-bind="events-walking"]')).toHaveText(values.ib01.fixed_reference_event_density.walking_median.toFixed(4));
  await expect(page.locator('[data-bind="pareto-core"]')).toHaveText(`${values.ib01.pareto.core.direction_count}/${values.ib01.pareto.core.N}`);
  await expect(page.locator('[data-bind="pareto-shock"]')).toHaveText(`${values.ib01.pareto.with_shock.direction_count}/${values.ib01.pareto.with_shock.N}`);
  await expect(page.locator('[data-bind="pt-classification"]')).toHaveText(values.ib01.pt.classification);
  await expect(page.locator('[data-bind="transport-transients"]')).toHaveText(`${values.vtb01.session_median_transients.session_median_missed_excursion_N}/${values.vtb01.session_median_transients.transport_event_N}`);
  await expect(page.locator('[data-bind="backseat-coverage"]')).toContainText(values.vtb01.mode_coverage.SilverRide_BackSeat.support);
  await expect(page.locator('[data-bind="bct-status"]')).toContainText(values.bct01.status);
  await expect(page.locator('[data-bind="boundary-force"]')).toHaveText("No");
  await expect(page.locator('[data-bind="boundary-pain"]')).toHaveText("No");
  await expect(page.locator('[data-bind="boundary-coupling"]')).toHaveText("No");
  await expect(page.getByRole("link", { name: "Open Evidence Observatory" })).toHaveAttribute("href", "https://evidence.handicapskater.com/");
});

test("paired direction strips expose all governed observations without private dates", async ({ page }) => {
  await page.goto("/biomechanics/");
  await expect(page.locator("[data-publication-status]")).toHaveAttribute("data-publication-status", "ready", { timeout: 20000 });
  const resource = await page.evaluate(async () => (await fetch("/data/public/evidence-observatory/v1/biomechanics-evidence.json")).json());
  const ib = resource.approved_values.ib01;
  await expect(page.locator('[data-direction-strip="vertical"] .direction-mark')).toHaveCount(ib.vertical_rms.N);
  await expect(page.locator('[data-direction-strip="vertical"] .direction-mark--expected')).toHaveCount(ib.vertical_rms.direction_count);
  await expect(page.locator('[data-direction-strip="jerk"] .direction-mark')).toHaveCount(ib.magnitude_jerk.N);
  await expect(page.locator('[data-direction-strip="jerk"]')).toHaveAttribute("aria-label", /dates intentionally not published/);
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 1366 },
  { width: 1280, height: 900 },
]) {
  test(`biomechanics layout has no page overflow at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/biomechanics/");
    await expect(page.locator("[data-publication-status]")).toHaveAttribute("data-publication-status", "ready", { timeout: 20000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.locator("[data-evidence-card='function']")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Motion alone does not define burden" })).toBeVisible();
  });
}
