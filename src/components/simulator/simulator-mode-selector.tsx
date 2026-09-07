"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LayoutList, Gamepad2 } from "lucide-react";
import { SimulationGame } from "@/components/simulation-game";
import type { SimulationRole } from "@/lib/domain/simulator/types";
import { ROLE_CONFIGS } from "@/lib/domain/simulator/role-permissions";
import { cn } from "@/lib/utils";

// SSR-safe dinamičko učitavanje Phaser 4 simulatora unutar Client Component granice
const DynamicGameSimulatorShell = dynamic(
  () => import("./game-simulator-shell").then((mod) => mod.GameSimulatorShell),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-border/80 bg-surface p-8 text-center shadow-lg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="mt-4 text-sm font-semibold text-ink">Učitavanje 2D simulatora biračkog mesta...</p>
        <p className="mt-1 text-xs text-ink-dim">Phaser 4 & XState runtime</p>
      </div>
    ),
  },
);

export function SimulatorModeSelector() {
  const [mode, setMode] = useState<"classic" | "game_2d">("classic");
  const [selectedRole, setSelectedRole] = useState<SimulationRole>("clan_odbora");

  return (
    <div className="flex flex-col gap-6">
      {/* Prekidač režima prikaza */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-2 shadow-sm">
        <div className="flex items-center gap-2 px-2 text-xs font-semibold text-ink-dim">
          <span>Režim simulatora:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Režim prikaza */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMode("classic")}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition",
                mode === "classic"
                  ? "bg-brand text-brand-contrast shadow-sm"
                  : "text-ink-dim hover:bg-surface-2 hover:text-ink",
              )}
            >
              <LayoutList className="h-4 w-4" />
              <span>Klasične kartice</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("game_2d")}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition",
                mode === "game_2d"
                  ? "bg-brand text-brand-contrast shadow-sm"
                  : "text-ink-dim hover:bg-surface-2 hover:text-ink",
              )}
            >
              <Gamepad2 className="h-4 w-4" />
              <span>2D Biračko mesto</span>
            </button>
          </div>

          {/* Izbor početne uloge za 2D simulator */}
          {mode === "game_2d" && (
            <div className="flex items-center gap-1 border-t sm:border-t-0 sm:border-l border-border sm:pl-3 pt-2 sm:pt-0">
              <span className="text-xs text-ink-dim font-medium mr-1">Uloga:</span>
              {(["clan_odbora", "posmatrac", "birac"] as const).map((r) => {
                const cfg = ROLE_CONFIGS[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                      selectedRole === r
                        ? "bg-surface-2 text-brand border border-brand/40 shadow-sm"
                        : "text-ink-dim hover:text-ink hover:bg-surface-2/60",
                    )}
                  >
                    {cfg.shortLabel}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Prikaz izabranog režima */}
      {mode === "classic" ? (
        <SimulationGame />
      ) : (
        <DynamicGameSimulatorShell key={selectedRole} initialRole={selectedRole} />
      )}
    </div>
  );
}
