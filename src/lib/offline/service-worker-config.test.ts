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

  it("briše zastarele keševe pri aktivaciji i drži imena usklađena sa konfiguracijom", () => {
    const worker = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
    expect(worker).toContain("caches.delete(key)");
    expect(worker).toContain(serviceWorkerConfig.shellCache);
    expect(worker).toContain(serviceWorkerConfig.legalDataCache);
  });

  it("nikada ne kešira admin i auth odgovore", () => {
    const worker = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
    expect(worker).toContain('url.pathname.startsWith("/admin")');
    expect(worker).toContain('url.pathname.startsWith("/api/admin")');
    expect(worker).toContain('url.pathname.startsWith("/api/auth")');
  });

  it("precache-uje ključne offline rute uključujući simulator i trening", () => {
    const worker = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
    for (const route of ["/vidim-problem", "/kontrolor", "/prijavi", "/izvori", "/trening/kviz", "/simulator/biracki-dan", "/offline"]) {
      expect(worker).toContain(`"${route}"`);
    }
  });
});
