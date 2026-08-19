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

  await page.goto("http://localhost:3000/landing", { waitUntil: "networkidle" });
  await page.screenshot({ path: "screenshots/01_landing.png", fullPage: true });
  console.log("01_landing");

  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.screenshot({ path: "screenshots/02_login_user.png", fullPage: false });
  console.log("02_login_user");

  await page.click("button:has-text('관리자')");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "screenshots/03_login_admin.png", fullPage: false });
  console.log("03_login_admin");

  // login as test user via localStorage
  await page.evaluate(() => {
    localStorage.setItem(
      "spa.session",
      JSON.stringify({
        name: "김지훈",
        employeeId: "HMG-22045",
        rrnFront: "900101",
        team: "전동화BIZ팀",
        position: "책임",
        loggedInAt: Date.now(),
        isAdmin: false,
      }),
    );
    localStorage.setItem(
      "spa.settings",
      JSON.stringify({
        examDate: "2026-08-15",
        targetLevel: 7,
        aiModel: "claude-opus-5",
        setupCompleted: false,
      }),
    );
  });

  await page.goto("http://localhost:3000/onboarding", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "screenshots/04_onboarding_1.png", fullPage: false });
  await page.click("button:has-text('다음')");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "screenshots/05_onboarding_2.png", fullPage: false });
  await page.click("button:has-text('다음')");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "screenshots/06_onboarding_3.png", fullPage: false });
  console.log("06_onboarding_3");

  await page.evaluate(() => {
    localStorage.setItem(
      "spa.settings",
      JSON.stringify({
        examDate: "2026-08-15",
        targetLevel: 7,
        aiModel: "claude-opus-5",
        setupCompleted: true,
        onboardingSeen: true,
      }),
    );
    const records = [];
    for (let i = 0; i < 12; i++) {
      records.push({
        id: `rec_${i}`,
        questionId: `t${(i % 4) + 1}_00${i + 1}`,
        type: (i % 4) + 1,
        userAnswer: "Sample answer.",
        score: 60 + (i * 3) % 30,
        bookmarked: false,
        createdAt: Date.now() - i * 86400000,
      });
    }
    localStorage.setItem("spa.records", JSON.stringify(records));
  });

  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "screenshots/07_dashboard.png", fullPage: true });
  console.log("07_dashboard");

  await page.goto("http://localhost:3000/study/3", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "screenshots/08_study_type3.png", fullPage: true });
  console.log("08_study_type3");

  await page.goto("http://localhost:3000/mock", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "screenshots/09_mock_list.png", fullPage: true });
  console.log("09_mock_list");

  // login as admin
  await page.evaluate(() => {
    localStorage.setItem(
      "spa.session",
      JSON.stringify({
        name: "관리자",
        employeeId: "12345678",
        rrnFront: "",
        team: "관리팀",
        position: "Admin",
        loggedInAt: Date.now(),
        isAdmin: true,
      }),
    );
  });

  await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "screenshots/10_admin.png", fullPage: true });
  console.log("10_admin");

  await browser.close();
})();
