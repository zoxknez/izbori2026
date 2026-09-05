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
