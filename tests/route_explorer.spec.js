const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

const explorer = "/evidence/strava-gps-skate-maps/#route-browser";

test("loads the embedded manifest and filters immediately", async ({ page }) => {
  await page.goto(explorer);
  await expect(page.locator("#route-browser-summary")).toContainText("route maps shown");
  await expect(page.locator("#route-select option")).toHaveCount(542);

  await page.locator("#route-search").fill("Xmas FNS");
  await expect(page.locator("#route-browser-summary")).toContainText("1 of 542");
  await expect(page.locator("#route-select option")).toHaveCount(1);
});

test("year and route-type filters update the native select", async ({ page }) => {
  await page.goto(explorer);
  await page.locator("#route-year").selectOption("2020");
  await page.locator("#route-type").selectOption("ENS");
  await expect(page.locator("#route-select option")).toHaveCount(1);
  await expect(page.locator("#route-select option").first()).toContainText("ENS");
});

test("selection preserves encoded filename and preview fallback", async ({ page }) => {
  await page.goto(explorer);
  await page.locator("#route-search").fill("Xmas FNS");
  const value = await page.locator("#route-select option").first().getAttribute("value");
  await page.locator("#route-select").selectOption(value);

  const expected = "/maps/20201225-20_36_26-Xmas%20FNS-4517973252.html?v=mobilefix1";
  await expect(page.locator("#selected-route-title")).toContainText("Xmas FNS");
  await expect(page.locator("#route-map-frame")).toHaveAttribute("src", expected);
  await expect(page.locator("#selected-route-open")).toHaveAttribute("href", expected);
  await expect(page.locator("#selected-route-open")).toBeVisible();
});

test("weather failure keeps direct route links usable", async ({ page }) => {
  await page.route("**/strava_routes_weather_conditions_9pm_midnight.json", (route) => route.abort());
  await page.goto(explorer);
  await expect(page.locator("#weather-summary-text")).toContainText("could not be loaded");
  await expect(page.locator("#route-map-list a")).toHaveCount(542);
});

test("missing embedded manifest shows a clear fallback", async ({ page }) => {
  const source = fs.readFileSync(
    path.join(__dirname, "../evidence/strava-gps-skate-maps/index.html"),
    "utf8"
  );
  const withoutRoutes = source.replace(
    /(<ol id="route-map-list">)[\s\S]*?(<\/ol>)/,
    "$1$2"
  );
  await page.route("**/evidence/strava-gps-skate-maps/", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: withoutRoutes })
  );
  await page.goto(explorer);
  await expect(page.locator("#route-browser-summary")).toContainText(
    "Enhanced route data is unavailable"
  );
});

test("iframe failure keeps the exact full-map link", async ({ page }) => {
  await page.goto(explorer);
  await page.locator("#route-search").fill("Xmas FNS");
  const value = await page.locator("#route-select option").first().getAttribute("value");
  await page.locator("#route-select").selectOption(value);
  await page.locator("#route-map-frame").dispatchEvent("error");
  await expect(page.locator("#selected-route-help")).toContainText("could not be confirmed");
  await expect(page.locator("#selected-route-open")).toHaveAttribute(
    "href",
    "/maps/20201225-20_36_26-Xmas%20FNS-4517973252.html?v=mobilefix1"
  );
});

test("preview survives rotation without horizontal overflow", async ({ page, browserName }) => {
  await page.goto(explorer);
  await page.locator("#route-search").fill("Xmas FNS");
  const value = await page.locator("#route-select option").first().getAttribute("value");
  await page.locator("#route-select").selectOption(value);
  const initial = page.viewportSize();
  await page.setViewportSize({ width: initial.height, height: initial.width });
  await page.waitForTimeout(250);
  const frame = page.locator("#route-map-frame");
  await expect(frame).toBeVisible();
  expect((await frame.boundingBox()).height).toBeGreaterThanOrEqual(360);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  if (browserName === "webkit") {
    expect(await frame.evaluate((node) => getComputedStyle(node).pointerEvents)).toBe("none");
  }
});

test("raw archive works without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(explorer);
  await expect(page.locator("#route-map-list a")).toHaveCount(542);
  await expect(page.locator("#route-browser-summary")).not.toContainText("Loading route maps");
  await context.close();
});
