import { expect, test } from "@playwright/test";
import { encode } from "next-auth/jwt";

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

  test("admin mutacije ostaju zatvorene bez sesije", async ({ page }) => {
    const admin = await page.request.get("/admin", { maxRedirects: 0 });
    expect(admin.status()).toBe(302);
    expect(admin.headers().location).toContain("/admin/login");
    const editor = await page.request.get("/admin/rules", { maxRedirects: 0 });
    expect(editor.status()).toBe(302);
    expect(editor.headers().location).toContain("/admin/login");
    const sourceEditor = await page.request.get("/admin/sources", { maxRedirects: 0 });
    expect(sourceEditor.status()).toBe(302);
    expect(sourceEditor.headers().location).toContain("/admin/login");
    const treeEditor = await page.request.get("/admin/decision-trees", { maxRedirects: 0 });
    expect(treeEditor.status()).toBe(302);
    expect(treeEditor.headers().location).toContain("/admin/login");
    const audit = await page.request.get("/admin/audit", { maxRedirects: 0 });
    expect(audit.status()).toBe(302);
    expect(audit.headers().location).toContain("/admin/login");
    const rules = await page.request.patch("/api/admin/rules/P01", { data: { summary: "neovlašćena izmena" } });
    expect(rules.status()).toBe(401);
    const sources = await page.request.patch("/api/admin/sources/rik-zakoni", { data: { status: "superseded" } });
    expect(sources.status()).toBe(401);
    const trees = await page.request.patch("/api/admin/decision-trees/DT01", { data: { title: "unauthorized" } });
    expect(trees.status()).toBe(401);
    const publish = await page.request.post("/api/admin/publish", { data: {} });
    expect(publish.status()).toBe(401);
  });

  test("sesija bez aktivnog naloga ne može da zaobiđe server-side admin proveru", async ({ page }) => {
    const token = await encode({
      token: { sub: "e2e-content-editor", email: "e2e-content@example.test", role: "CONTENT_EDITOR" },
      secret: "local-e2e-only-secret",
      salt: "authjs.session-token",
    });
    await page.context().addCookies([{ name: "authjs.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true, secure: false }]);
    const publish = await page.request.post("/api/admin/publish", { data: {} });
    expect(publish.status()).toBe(401);
  });

  test("potpisan JWT bez aktivnog DB naloga ne otvara admin prikaze", async ({ page }) => {
    const token = await encode({
      token: { sub: "e2e-super-admin", email: "e2e-admin@example.test", role: "SUPER_ADMIN" },
      secret: "local-e2e-only-secret",
      salt: "authjs.session-token",
    });
    await page.context().addCookies([{ name: "authjs.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true, secure: false }]);
    for (const route of ["/admin", "/admin/rules", "/admin/sources", "/admin/decision-trees", "/admin/audit"]) {
      const response = await page.goto(route);
      expect(response?.url(), `${route} should redirect stale sessions`).toContain("/admin/login");
      await expect(page.locator("h1")).toHaveText("Admin prijava");
    }
    const invalidPublish = await page.request.post("/api/admin/publish", { data: { snapshot: { schemaVersion: 1 } } });
    expect(invalidPublish.status()).toBe(401);
  });
});
