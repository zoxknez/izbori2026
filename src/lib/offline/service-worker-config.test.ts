import { describe, expect, it } from "vitest";
import { serviceWorkerConfig } from "./service-worker-config";

describe("service worker lifecycle policy", () => {
  it("does not enable automatic registration or reload-on-online", () => {
    expect(serviceWorkerConfig.register).toBe(false);
    expect(serviceWorkerConfig.reloadOnOnline).toBe(false);
  });
});
