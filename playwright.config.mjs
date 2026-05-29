import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:8788",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "bash build.sh && npx -y wrangler pages dev dist --port=8788 --compatibility-date=2026-01-01",
    url: "http://127.0.0.1:8788/t/demo",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
