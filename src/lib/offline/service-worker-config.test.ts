import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { serviceWorkerConfig } from "./service-worker-config";

describe("service worker lifecycle policy", () => {
  it("does not enable automatic registration or reload-on-online", () => {
    expect(serviceWorkerConfig.register).toBe(false);
    expect(serviceWorkerConfig.reloadOnOnline).toBe(false);
  });

  it("osvežava shell u pozadini kada vraća postojeći keš", () => {
    const worker = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
    expect(worker).toContain("event.waitUntil(refresh.catch");
    expect(worker).not.toContain("event.respondWith(fetch(request).then");
  });
});
