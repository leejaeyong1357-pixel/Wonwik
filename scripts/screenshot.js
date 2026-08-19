const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    headless: true,
    args: ["--no-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.screenshot({ path: "screenshots/home.png", fullPage: true });
  console.log("Saved home.png");

  await page.goto("http://localhost:3000/chart-demo", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "screenshots/chart-demo.png", fullPage: true });
  console.log("Saved chart-demo.png");

  await browser.close();
})();
