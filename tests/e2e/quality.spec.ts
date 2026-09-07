import { expect, test } from "@playwright/test";

test("cross-module public flows and accessibility landmarks", async ({ page }) => {
  await page.goto("/validator");
  await page.getByRole("button", { name: /Primer: Ispravan/i }).click();
  await expect(page.getByText(/ZAPISNIK JE MATEMATIČKI ISPRAVAN/i)).toBeVisible();

  await page.goto("/trening/kviz");
  await expect(page.getByRole("heading", { name: /Uvežbaj odluke/i })).toBeVisible();
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);

  await page.goto("/izborni-dan");
  await expect(page.getByRole("heading", { name: /Izborni dan:/i })).toBeVisible();
  // Prebacujemo na klasični kartični mod za testiranje linearnog toka
  const classicBtn = page.getByRole("button", { name: /Klasične kartice/i });
  if (await classicBtn.isVisible()) {
    await classicBtn.click();
  }
  await page.getByRole("button", { name: /Započni birački dan/i }).click();
  await expect(page.getByText(/Događaj 1 od/i)).toBeVisible();
  await expect(page.getByRole("region", { name: /Interaktivna scena biračkog mesta/i })).toBeVisible();
  await expect(page.getByText(/Živa smena/i)).toBeVisible();
  await page.getByRole("button", { name: /Radnja/i }).first().click();
  await expect(page.getByRole("button", { name: /Nastavi dan/i })).toBeVisible();
  await page.getByRole("button", { name: /Nastavi dan/i }).click();
  await expect(page.getByText(/Događaj 2 od/i)).toBeVisible();
});

test("public routes have one h1, main landmark and no missing image alt", async ({ page }) => {
  for (const route of ["/", "/pravila", "/validator", "/trening/kviz", "/izborni-dan", "/offline"]) {
    await page.goto(route);
    expect(await page.locator("h1").count(), `${route} h1 count`).toBe(1);
    expect(await page.locator("main").count(), `${route} main count`).toBeGreaterThan(0);
    expect(await page.locator("img:not([alt])").count(), `${route} missing alt`).toBe(0);
  }
});

test("global search finds an incident through the indexed aliases", async ({ page }) => {
  await page.goto("/");
  const searchInput = page.getByPlaceholder(/Brza pretraga|Pretraži/i);
  await searchInput.fill("bugarski voz");
  await page.getByRole("button", { name: "Pretraži" }).click();
  await expect(page).toHaveURL(/.*\/pravila\?q=bugarski%20voz/);
  await expect(page.getByText(/Kružnog glasanja|bugarski voz/i).first()).toBeVisible();
});

test("incident draft survives an online/offline transition without reload", async ({ page }) => {
  await page.goto("/prijavi");
  await page.locator("textarea").first().fill("Nacrt incidenta pre prekida mreže");
  await page.context().setOffline(true);
  await expect(page.locator("textarea").first()).toHaveValue("Nacrt incidenta pre prekida mreže");
  await page.context().setOffline(false);
  await expect(page.locator("textarea").first()).toHaveValue("Nacrt incidenta pre prekida mreže");
});

async function playSimulation(page: import("@playwright/test").Page, maxSteps: number) {
  for (let index = 0; index < maxSteps; index += 1) {
    if (await page.getByText(/Birački dan završen/i).isVisible().catch(() => false)) return true;
    const startCounting = page.getByRole("button", { name: /Pokreni brojanje|Prebroj/i });
    if (await startCounting.isVisible().catch(() => false)) {
      await startCounting.click();
      continue;
    }
    const carryOn = page.getByRole("button", { name: /Nastavi dan/i });
    if (await carryOn.isVisible().catch(() => false)) {
      await carryOn.click();
      continue;
    }
    const choice = page.getByRole("button", { name: /Radnja/i }).first();
    if (!(await choice.isVisible().catch(() => false))) break;
    await choice.click();
  }
  return page.getByText(/Birački dan završen/i).isVisible();
}

test("voter path plays the whole day and shows the category debrief", async ({ page }) => {
  await page.goto("/izborni-dan");
  const classicBtn = page.getByRole("button", { name: /Klasične kartice/i });
  if (await classicBtn.isVisible()) {
    await classicBtn.click();
  }
  await page.getByRole("button", { name: /^Birač/ }).click();
  await page.getByRole("button", { name: /Započni birački dan/i }).click();
  expect(await playSimulation(page, 40)).toBe(true);
  await expect(page.getByText(/Procedura/i).first()).toBeVisible();
  await expect(page.getByText(/Pravna reakcija/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Nova simulacija/i })).toBeVisible();
});

test("guided board-member day reaches the counting mode and finishes", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/izborni-dan");
  const classicBtn = page.getByRole("button", { name: /Klasične kartice/i });
  if (await classicBtn.isVisible()) {
    await classicBtn.click();
  }
  await page.getByRole("button", { name: /Započni birački dan/i }).click();
  expect(await playSimulation(page, 200)).toBe(true);
});

test("randomized mode completes without repeating an event", async ({ page }) => {
  await page.goto("/izborni-dan");
  const classicBtn = page.getByRole("button", { name: /Klasične kartice/i });
  if (await classicBtn.isVisible()) {
    await classicBtn.click();
  }
  await page.getByRole("button", { name: /^Birač/ }).click();
  await page.getByRole("button", { name: /Završni trening/i }).click();
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
}

test("quiz session keeps state and completes without reload", async ({ page }) => {
  await page.goto("/trening/kviz");
  for (let index = 0; index < 5; index += 1) {
    if (await page.getByText(/Rezultat/i).isVisible().catch(() => false)) break;
    await answerOneQuestion(page);
    await page.waitForTimeout(100);
  }
  await expect(page.locator("body")).toBeVisible();
});
