import { describe, expect, it, vi } from "vitest";
import { createGameBridge } from "./game-bridge";

describe("Milestone 1: GameBridge instance-scoped event bus", () => {
  it("emit šalje podatke pretplaćenim listenerima", () => {
    const bridge = createGameBridge();
    const handler = vi.fn();

    bridge.on("HOTSPOT_CLICKED", handler);
    bridge.emit("HOTSPOT_CLICKED", {
      hotspotId: "uv-lamp",
      locationId: "uv-station",
      title: "UV provera",
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      hotspotId: "uv-lamp",
      locationId: "uv-station",
      title: "UV provera",
    });
  });

  it("odjavljivanje (unsubscribe) sprečava dalje pozive", () => {
    const bridge = createGameBridge();
    const handler = vi.fn();

    const unsub = bridge.on("HOTSPOT_HOVERED", handler);
    bridge.emit("HOTSPOT_HOVERED", { hotspotId: "box-1" });
    expect(handler).toHaveBeenCalledTimes(1);

    unsub();
    bridge.emit("HOTSPOT_HOVERED", { hotspotId: "box-2" });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("destroy uklanja sve listenere i sprečava curenje memorije", () => {
    const bridge = createGameBridge();
    const handler = vi.fn();

    bridge.on("WORLD_READY", handler);
    bridge.destroy();

    bridge.emit("WORLD_READY", { width: 1024, height: 576 });
    expect(handler).not.toHaveBeenCalled();
  });
});
