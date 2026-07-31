const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  timeout: 30000,
  use: { baseURL: "http://127.0.0.1:4173" },
  webServer: {
    command: "python3 -m http.server 4173",
    port: 4173,
    reuseExistingServer: true,
  },
  projects: [
    { name: "webkit-390x844", use: { browserName: "webkit", viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: "webkit-430x932", use: { browserName: "webkit", viewport: { width: 430, height: 932 }, hasTouch: true } },
    { name: "webkit-768x1024", use: { browserName: "webkit", viewport: { width: 768, height: 1024 }, hasTouch: true } },
    { name: "webkit-1024x1366", use: { browserName: "webkit", viewport: { width: 1024, height: 1366 }, hasTouch: true } },
    { name: "chromium-desktop", use: { browserName: "chromium", viewport: { width: 1280, height: 900 } } },
  ],
});
