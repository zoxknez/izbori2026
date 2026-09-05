import { describe, expect, it } from "vitest";
import { hasPermission } from "./rbac";

describe("admin RBAC", () => {
  it("content editor može da menja sadržaj, ali ne može direktno da objavi", () => {
    expect(hasPermission("CONTENT_EDITOR", "rules:write")).toBe(true);
    expect(hasPermission("CONTENT_EDITOR", "publish")).toBe(false);
  });

  it("legal editor dobija legalne izmene, ali publish ostaje za super admina", () => {
    expect(hasPermission("LEGAL_EDITOR", "review:write")).toBe(true);
    expect(hasPermission("LEGAL_EDITOR", "publish")).toBe(false);
    expect(hasPermission("SUPER_ADMIN", "publish")).toBe(true);
  });
});
