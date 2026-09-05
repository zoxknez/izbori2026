import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/pravila",
  "/validator",
  "/kontrolor",
  "/rokovi",
  "/prijavi",
  "/izvori",
];

test.describe("public application smoke", () => {
  for (const route of routes) {
    test(`${route} renders successfully`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.ok(), `${route} should return a successful response`).toBeTruthy();
      await expect(page.locator("h1").first()).toBeVisible();
    });
  }

  test("validator and incident flows expose their primary controls", async ({ page }) => {
    await page.goto("/validator");
    await expect(page.getByRole("heading", { name: /Validator zapisnika/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Primer: Ispravan/i })).toBeVisible();

    await page.goto("/prijavi");
    await expect(page.getByRole("heading", { name: /Generator hronologije incidenta/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Sačuvaj na uređaj/i })).toBeVisible();
  });
});
