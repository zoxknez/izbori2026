"use client";

import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { createGameConfig } from "@/game/config";
import { BootScene } from "@/game/scenes/BootScene";
import { PollingStationScene } from "@/game/scenes/PollingStationScene";
import { CountingScene } from "@/game/scenes/CountingScene";
import type { GameBridge } from "@/game/bridge/game-bridge";

interface GameCanvasProps {
  bridge: GameBridge;
  seed?: number;
}

export function GameCanvas({ bridge, seed }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    // Prilagođena BootScene koja automatski prenosi bridge i seed na sledeće scene
    class InjectedBootScene extends BootScene {
      init() {
        super.init({ bridge, seed });
      }
    }

    const config = createGameConfig({
      parent: containerRef.current,
      scenes: [InjectedBootScene, PollingStationScene, CountingScene],
    });

    const game = new Phaser.Game(config);
    gameRef.current = game;

    const unsubSwitch = bridge.on("SWITCH_SCENE", ({ sceneKey }) => {
      if (gameRef.current) {
        const currentActive = gameRef.current.scene.getScenes(true);
        for (const s of currentActive) {
          if (s.scene.key !== sceneKey) {
            gameRef.current.scene.stop(s.scene.key);
          }
        }
        gameRef.current.scene.start(sceneKey, { bridge, seed });
      }
    });

    const handleVisibilityChange = () => {
      if (!gameRef.current) return;
      if (document.visibilityState === "hidden") {
        gameRef.current.loop.pause();
      } else {
        gameRef.current.loop.resume();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      unsubSwitch();
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [bridge]);

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80 bg-[#0b101b] shadow-2xl"
      id="phaser-game-container"
    />
  );
}
