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

  // Pre-populate localStorage to skip setup
  await page.goto("http://localhost:3000/setup", { waitUntil: "networkidle" });
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
    // seed some study records
    const records = [];
    for (let i = 0; i < 12; i++) {
      records.push({
        id: `rec_${i}`,
        questionId: `t${(i % 4) + 1}_00${(i % 9) + 1}`,
        type: ((i % 4) + 1),
        userAnswer: "Sample user answer for the question.",
        score: 50 + (i * 3) % 40,
        feedback: {
          grammarIssues: ["Article usage"],
          vocabularySuggestions: ["Try 'demonstrate'"],
          betterExpressions: ["In my view..."],
          modelAnswer: "Improved version of the answer.",
          estimatedLevel: 6,
          scoreEstimate: 50 + (i * 3) % 40,
          strengths: ["Good length"],
          improvements: ["Use more examples"],
        },
        bookmarked: i % 5 === 0,
        createdAt: Date.now() - i * 86400000,
      });
    }
    localStorage.setItem("spa.records", JSON.stringify(records));
    localStorage.setItem(
      "spa.vocab",
      JSON.stringify([
        { word: "consequently", meaning: "as a result; therefore", example: "I missed the bus consequently I was late.", source: "AI 피드백", addedAt: Date.now() },
        { word: "demonstrate", meaning: "clearly show or prove", example: "The data demonstrates a clear trend.", source: "AI 피드백", addedAt: Date.now() },
        { word: "in my view", meaning: "expressing personal opinion", example: "In my view, this approach works best.", source: "AI 피드백", addedAt: Date.now() },
      ]),
    );
    localStorage.setItem(
      "spa.mockResults",
      JSON.stringify([
        { examId: "mock_001", startedAt: Date.now() - 86400000, finishedAt: Date.now() - 86399000, totalScore: 62, estimatedLevel: 5, type1: {}, type2: {}, type3: {}, type4: {} },
        { examId: "mock_005", startedAt: Date.now() - 43200000, finishedAt: Date.now() - 43199000, totalScore: 70, estimatedLevel: 6, type1: {}, type2: {}, type3: {}, type4: {} },
      ]),
    );
  });

  const pages = [
    { url: "/setup", name: "1_setup" },
    { url: "/dashboard", name: "2_dashboard" },
    { url: "/study/1", name: "3_study_type1" },
    { url: "/study/3", name: "4_study_type3" },
    { url: "/mock", name: "5_mock_list" },
    { url: "/notes", name: "6_notes" },
    { url: "/vocab", name: "7_vocab" },
    { url: "/stats", name: "8_stats" },
  ];

  for (const p of pages) {
    await page.goto(`http://localhost:3000${p.url}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `screenshots/${p.name}.png`, fullPage: true });
    console.log(`Saved ${p.name}.png`);
  }

  await browser.close();
})();
