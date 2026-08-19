const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    headless: true,
    args: ["--no-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("console", (msg) => console.log(`[browser ${msg.type()}]`, msg.text()));
  page.on("pageerror", (err) => console.log(`[pageerror]`, err.message));

  await page.goto("http://localhost:3000/setup");
  await page.evaluate(() => {
    localStorage.setItem(
      "spa.settings",
      JSON.stringify({
        examDate: "2026-08-15",
        targetLevel: 6,
        hchatEndpoint: "",
        hchatApiKey: "",
        setupCompleted: true,
      }),
    );
  });

  await page.goto("http://localhost:3000/study/1");
  await page.waitForTimeout(3000);

  await browser.close();
})();
