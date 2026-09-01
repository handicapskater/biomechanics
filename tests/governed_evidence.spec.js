const { test, expect } = require("@playwright/test");

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

test("home and case retain compact governed evidence entry points", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".governed-graph-mounted")).toHaveCount(1);
  await page.goto("/case/");
  await expect(page.locator(".governed-graph-mounted")).toHaveCount(3);
  await expect(page.locator(".governed-graph-error")).toHaveCount(0);
});
