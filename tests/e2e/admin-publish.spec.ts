import { test, expect } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.describe("authenticated admin publish workflow", () => {
  test.skip(!email || !password, "requires an isolated E2E admin fixture");

  test("publishuje snapshot, a klijent ga validira i aktivira offline", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Lozinka").fill(password!);
    await page.getByRole("button", { name: "Prijavi se" }).click();
    await expect(page).toHaveURL(/\/admin$/);

    const before = await page.request.get("/api/offline-dataset/current");
    expect(before.ok()).toBeTruthy();
    const beforeBody = await before.json() as { version: string };

    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "Objavi trenutni dataset" }).click();
    await expect(page.locator('p[role="status"]')).toContainText("Objavljeno:");

    const after = await page.request.get("/api/offline-dataset/current");
    expect(after.ok()).toBeTruthy();
    const afterBody = await after.json() as { version: string };
    expect(afterBody.version).not.toBe(beforeBody.version);

    await page.goto("/offline");
    await page.getByRole("button", { name: "Preuzmi aktuelni dataset" }).click();
    await expect(page.locator('p[role="status"]')).toContainText(`Dataset ${afterBody.version} je validiran i aktiviran offline.`);
    await expect(page.getByText(afterBody.version, { exact: true })).toBeVisible();
  });
});
