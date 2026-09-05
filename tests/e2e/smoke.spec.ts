import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/pravila",
  "/validator",
  "/kontrolor",
  "/rokovi",
  "/prijavi",
  "/izvori",
  "/trening/kviz",
  "/simulator/biracki-dan",
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

  test("offline dataset endpoint vraća aktivni snapshot", async ({ page }) => {
    const response = await page.request.get("/api/offline-dataset/current");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.version).toBeTruthy();
    expect(body.files).toEqual(expect.arrayContaining([
      expect.objectContaining({ filename: "snapshot.json", sha256: expect.any(String) }),
    ]));
  });

  test("offline shell i service worker su dostupni", async ({ page }) => {
    const [worker, offline] = await Promise.all([
      page.request.get("/sw.js"),
      page.request.get("/offline"),
    ]);
    expect(worker.ok()).toBeTruthy();
    expect(await worker.text()).toContain("LEGAL_DATA_CACHE");
    expect(offline.ok()).toBeTruthy();
  });
});
