import { describe, expect, it } from "vitest";
import { resolveAdminRecord } from "./identity";

describe("server-side admin identity resolution", () => {
  it("accepts only active users with a known role", () => {
    expect(resolveAdminRecord({ id: "a1", email: "admin@example.test", role: "SUPER_ADMIN", isActive: true })).toEqual({
      id: "a1",
      email: "admin@example.test",
      role: "SUPER_ADMIN",
    });
    expect(resolveAdminRecord({ id: "a2", email: "disabled@example.test", role: "SUPER_ADMIN", isActive: false })).toBeNull();
    expect(resolveAdminRecord({ id: "a3", email: "unknown@example.test", role: "OWNER", isActive: true })).toBeNull();
  });
});
