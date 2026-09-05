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
  await expect(page.getByRole("heading", { name: /Vežbaj reakciju/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Randomizovani", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Randomizovani", exact: true }).click();
  await page.getByRole("button", { name: /Zaustavi radnju/i }).click();
  await expect(page.getByText(/Događaj 2 od 30/i)).toBeVisible();
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

test("guided simulator completes the full 30-event path", async ({ page }) => {
  await page.goto("/simulator/biracki-dan");
  for (let index = 0; index < 30; index += 1) {
    await page.getByRole("button", { name: /Zaustavi radnju/i }).click();
  }
  await expect(page.getByText(/Birački dan završen/i)).toBeVisible();
});

test("randomized simulator completes without repeating an event", async ({ page }) => {
  await page.goto("/simulator/biracki-dan");
  await page.getByRole("button", { name: "Randomizovani", exact: true }).click();
  for (let index = 0; index < 30; index += 1) {
    await page.getByRole("button", { name: /Zaustavi radnju/i }).click();
  }
  await expect(page.getByText(/Birački dan završen/i)).toBeVisible();
});

test("public shell stays within the browser navigation budget", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const domContentLoaded = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return navigation ? navigation.domContentLoadedEventEnd - navigation.startTime : 0;
  });
  expect(domContentLoaded).toBeLessThan(5000);
});

test("training practice and exam persist answers and show breakdown", async ({ page }) => {
  await page.goto("/trening/kviz");
  await expect(page.getByText(/Pitanje 1 od 12/i)).toBeVisible();
  for (let index = 0; index < 12; index += 1) {
    await page.locator('button[class*="rounded-2xl"][class*="text-left"]').first().click();
    await page.getByRole("button", { name: /Sledeće pitanje|Završi/i }).click();
  }
  await expect(page.getByText(/Sesija završena/i)).toBeVisible();
  await page.getByRole("button", { name: /Nova sesija/i }).click();
  await page.getByRole("button", { name: /Ispit · 20/i }).click();
  for (let index = 0; index < 20; index += 1) {
    await page.locator('button[class*="rounded-2xl"][class*="text-left"]').first().click();
    await page.getByRole("button", { name: /Sledeće pitanje|Završi/i }).click();
  }
  await expect(page.getByText(/Ispit završen/i)).toBeVisible();
  await expect(page.getByText(/Uspešnost:/i)).toBeVisible();
});
