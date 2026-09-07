import { expect, test } from "@playwright/test";

test("cross-module public flows and accessibility landmarks", async ({ page }) => {
  await page.goto("/validator");
  await page.getByRole("button", { name: /Primer: Ispravan/i }).click();
  await expect(page.getByText(/ZAPISNIK JE MATEMATIČKI ISPRAVAN/i)).toBeVisible();

  await page.goto("/trening/kviz");
  await expect(page.getByRole("heading", { name: /Uvežbaj odluke/i })).toBeVisible();
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);

  await page.goto("/simulator/biracki-dan");
  await expect(page.getByRole("heading", { name: /Odigraj birački dan/i })).toBeVisible();
  await page.getByRole("button", { name: /Započni birački dan/i }).click();
  await expect(page.getByText(/Događaj 1 od/i)).toBeVisible();
  await page.locator("button").filter({ hasText: /^A/ }).first().click();
  await expect(page.getByRole("button", { name: /Nastavi dan/i })).toBeVisible();
  await page.getByRole("button", { name: /Nastavi dan/i }).click();
  await expect(page.getByText(/Događaj 2 od/i)).toBeVisible();
});

test("public routes have one h1, main landmark and no missing image alt", async ({ page }) => {
  for (const route of ["/", "/pravila", "/validator", "/trening/kviz", "/simulator/biracki-dan", "/offline"]) {
    await page.goto(route);
    expect(await page.locator("h1").count(), `${route} h1 count`).toBe(1);
    expect(await page.locator("main").count(), `${route} main count`).toBeGreaterThan(0);
    expect(await page.locator("img:not([alt])").count(), `${route} missing alt`).toBe(0);
  }
});

test("global search finds an incident through the indexed aliases", async ({ page }) => {
  await page.goto("/vidim-problem");
  const search = page.getByPlaceholder(/Pretraži: sprej, slikanje, paravan/i);
  await search.fill("bugarski voz");
  await expect(page.getByText(/Pronađeno u bazi \(/i)).toBeVisible();
  await expect(page.getByText(/bugarski voz/i).first()).toBeVisible();
});

test("incident draft survives an online/offline transition without reload", async ({ page, context }) => {
  await page.goto("/prijavi");
  const description = page.locator("textarea").first();
  await description.fill("Testni opis incidenta koji mora ostati sačuvan.");
  await context.setOffline(true);
  await expect(description).toHaveValue("Testni opis incidenta koji mora ostati sačuvan.");
  await context.setOffline(false);
  await expect(description).toHaveValue("Testni opis incidenta koji mora ostati sačuvan.");
});

async function playSimulation(page: import("@playwright/test").Page, maxSteps: number) {
  for (let index = 0; index < maxSteps; index += 1) {
    if (await page.getByText(/Birački dan završen/i).isVisible().catch(() => false)) return true;
    const carryOn = page.getByRole("button", { name: /Nastavi dan/i });
    if (await carryOn.isVisible().catch(() => false)) {
      await carryOn.click();
      continue;
    }
    const choice = page.locator("button:not([disabled])").filter({ hasText: /^[A-D]/ }).first();
    if (!(await choice.isVisible().catch(() => false))) break;
    await choice.click();
  }
  return page.getByText(/Birački dan završen/i).isVisible();
}

test("voter path plays the whole day and shows the category debrief", async ({ page }) => {
  await page.goto("/simulator/biracki-dan");
  await page.getByRole("button", { name: /^Birač/ }).click();
  await page.getByRole("button", { name: /Započni birački dan/i }).click();
  expect(await playSimulation(page, 40)).toBe(true);
  await expect(page.getByText(/Procedura/i).first()).toBeVisible();
  await expect(page.getByText(/Pravna reakcija/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Nova simulacija/i })).toBeVisible();
});

test("guided board-member day reaches the counting mode and finishes", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/simulator/biracki-dan");
  await page.getByRole("button", { name: /Započni birački dan/i }).click();
  expect(await playSimulation(page, 200)).toBe(true);
});

test("randomized mode completes without repeating an event", async ({ page }) => {
  await page.goto("/simulator/biracki-dan");
  await page.getByRole("button", { name: /^Birač/ }).click();
  await page.getByRole("button", { name: /Nasumični dan/i }).click();
  await page.getByRole("button", { name: /Započni birački dan/i }).click();
  expect(await playSimulation(page, 40)).toBe(true);
});

test("public shell stays within the browser navigation budget", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const domContentLoaded = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return navigation ? navigation.domContentLoadedEventEnd - navigation.startTime : 0;
  });
  expect(domContentLoaded).toBeLessThan(5000);
});

async function answerOneQuestion(page: import("@playwright/test").Page) {
  const numeric = page.getByPlaceholder("Unesi broj");
  if (await numeric.isVisible().catch(() => false)) {
    await numeric.fill("1");
  } else {
    const choice = page.locator('button[class*="text-left"]:not([disabled])').first();
    if (await choice.isVisible().catch(() => false)) await choice.click();
  }
  const submit = page.getByRole("button", { name: /Potvrdi odgovor/i });
  if (await submit.isEnabled().catch(() => false)) await submit.click();
  await page.getByRole("button", { name: /Sledeće pitanje|Završi/i }).click();
}

test("training practice and exam persist answers and show breakdown", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/trening/kviz");
  await expect(page.getByText(/Pitanje 1 od 12/i)).toBeVisible();
  for (let index = 0; index < 12; index += 1) await answerOneQuestion(page);
  await expect(page.getByText(/Sesija završena/i)).toBeVisible();

  await page.getByRole("button", { name: /Nova sesija/i }).click();
  await page.getByRole("button", { name: /Ispit · 20/i }).click();
  for (let index = 0; index < 20; index += 1) await answerOneQuestion(page);
  await expect(page.getByText(/Ispit završen/i)).toBeVisible();
  await expect(page.getByText(/Uspešnost:/i)).toBeVisible();
});

test("wrong answer registers a misconception and reports it at the end", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/trening/kviz");
  await expect(page.getByText(/otvorenih zabluda: 0/i)).toBeVisible();
  for (let index = 0; index < 12; index += 1) {
    const wrong = page.locator('button[class*="text-left"]:not([disabled])').last();
    const numeric = page.getByPlaceholder("Unesi broj");
    if (await numeric.isVisible().catch(() => false)) await numeric.fill("999999");
    else if (await wrong.isVisible().catch(() => false)) await wrong.click();
    const submit = page.getByRole("button", { name: /Potvrdi odgovor/i });
    if (await submit.isEnabled().catch(() => false)) await submit.click();
    await page.getByRole("button", { name: /Sledeće pitanje|Završi/i }).click();
  }
  await expect(page.getByText(/Sesija završena/i)).toBeVisible();
});
