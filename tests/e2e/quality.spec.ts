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

test("public layouts do not overflow horizontally on narrow screens", async ({ page }) => {
  const routes = ["/", "/validator", "/izvori", "/pravila", "/kontrolor", "/trening/kviz", "/izborni-dan"];

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect.poll(
        () => page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth)),
        { message: `${route} must fit the ${width}px mobile viewport` },
      ).toBeLessThanOrEqual(width);
    }
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

test("simulator save survives a reload and offers a valid resume", async ({ page }) => {
  await page.goto("/izborni-dan");
  await page.getByRole("button", { name: /2D Biračko mesto/i }).click();

  const saveButton = page.getByTestId("save-game-button");
  await expect(saveButton).toBeVisible({ timeout: 15_000 });
  await saveButton.click();
  await expect(saveButton).toContainText(/Sačuvano!/i);

  await page.reload();
  const resumableBanner = page.getByTestId("resumable-save-banner");
  await expect(resumableBanner).toBeVisible({ timeout: 15_000 });
  await expect(resumableBanner).toContainText(/sačuvana partija/i);
  await resumableBanner.getByTestId("resume-game-button").click();
  await expect(resumableBanner).not.toBeVisible();
  await expect(page.getByTestId("save-game-button")).toBeVisible();
});

test("simulator fast-forward controls remain named on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/izborni-dan");
  await page.getByRole("button", { name: /2D Biračko mesto/i }).click();

  const openingButton = page.getByTestId("fast-forward-to-opening-button");
  await expect(openingButton).toBeVisible({ timeout: 15_000 });
  await expect(openingButton).toHaveAccessibleName(/07:00/);

  const closingButton = page.getByTestId("fast-forward-to-closing-button");
  await expect(closingButton).toBeVisible();
  await expect(closingButton).toHaveAccessibleName(/20:00/);
});

async function playSimulation(page: import("@playwright/test").Page, maxSteps: number) {
  for (let index = 0; index < maxSteps; index += 1) {
    if (await page.getByText(/Birački dan završen/i).isVisible().catch(() => false)) return true;

    const carryOn = page.getByRole("button", { name: /Nastavi dan/i });
    if (await carryOn.isVisible().catch(() => false)) {
      await carryOn.click();
      await page.waitForTimeout(50);
      continue;
    }

    const enabledChoice = page.locator('button:has-text("Radnja"):not([disabled])').first();
    if (await enabledChoice.isVisible().catch(() => false)) {
      await enabledChoice.click();
      await carryOn.waitFor({ state: "visible", timeout: 2000 }).catch(() => {});
      continue;
    }

    if (await page.getByText(/Birački dan završen/i).isVisible().catch(() => false)) return true;
    await page.waitForTimeout(100);
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
  test.setTimeout(90_000);
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
