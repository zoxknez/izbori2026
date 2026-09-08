"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LayoutList, Gamepad2 } from "lucide-react";
import { SimulationGame } from "@/components/simulation-game";
import type { SimulationRole } from "@/lib/domain/simulator/types";
import { ROLE_CONFIGS } from "@/lib/domain/simulator/role-permissions";
import { SIMULATOR_CHOICE_COUNT, SIMULATOR_EVENT_COUNT } from "@/lib/domain/simulator/seed-events";
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
  // 2D režim je primarni (preporučeni) doživljaj
  const [mode, setMode] = useState<"classic" | "game_2d">("game_2d");
  const [selectedRole, setSelectedRole] = useState<SimulationRole>("clan_odbora");
  const [gameMode, setGameMode] = useState<"guided" | "realistic" | "stress">("guided");
  const [retryEventIds, setRetryEventIds] = useState<string[] | undefined>();

  return (
    <div className="flex flex-col gap-6">
      {/* Glavni prekidač režima prikaza sa visokom vidljivošću */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-surface via-surface to-surface-2 p-3 sm:p-4 shadow-xl">
        {/* Pozadinski suptilni sjaj */}
        <div className="pointer-events-none absolute -top-24 left-1/4 h-48 w-96 -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-48 w-96 translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-brand animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-ink">
                Režim rada simulatora
              </span>
              <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand ring-1 ring-brand/30">
                Izbori 2026
              </span>
            </div>

            {/* Brzi izbor uloge i težine simulacije kada je aktivan 2D režim */}
            {mode === "game_2d" && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Režim težine / pritiska */}
                <div className="flex items-center gap-1 rounded-2xl bg-surface-2/80 p-1 border border-border/70 text-xs">
                  <span className="px-2 text-[11px] font-semibold text-ink-dim hidden lg:inline">
                    Pritisak:
                  </span>
                  {(
                    [
                      { id: "guided", label: "Vođeni", desc: "Saveti i duže vreme" },
                      { id: "realistic", label: "Realističan", desc: "ZINP tajminzi" },
                      { id: "stress", label: "Stres", desc: "Visok pritisak" },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setGameMode(m.id);
                        setRetryEventIds(undefined);
                      }}
                      aria-pressed={gameMode === m.id}
                      className={cn(
                        "rounded-xl px-2.5 py-1 text-xs font-semibold transition-all",
                        gameMode === m.id
                          ? "bg-surface text-ink font-bold shadow-sm ring-1 ring-border"
                          : "text-ink-dim hover:text-ink",
                      )}
                      title={m.desc}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Perspektiva uloge */}
                <div className="flex items-center gap-1.5 rounded-2xl bg-surface-2/80 p-1 border border-border/70">
                  <span className="px-2 text-[11px] font-semibold text-ink-dim hidden md:inline">
                    Perspektiva:
                  </span>
                  {(["clan_odbora", "posmatrac", "birac"] as const).map((r) => {
                    const cfg = ROLE_CONFIGS[r];
                    const isSel = selectedRole === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setSelectedRole(r);
                          setRetryEventIds(undefined);
                        }}
                        aria-pressed={isSel}
                        className={cn(
                          "rounded-xl px-2.5 py-1 text-xs font-semibold transition-all",
                          isSel
                            ? "bg-brand text-brand-ink font-bold shadow-sm"
                            : "text-ink-dim hover:text-ink hover:bg-surface",
                        )}
                      >
                        {cfg.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Dve istaknute opcije u obliku interaktivnih kartica */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* 1. Primarni 2D režim */}
            <button
              type="button"
              onClick={() => {
                setMode("game_2d");
                setRetryEventIds(undefined);
              }}
              aria-pressed={mode === "game_2d"}
              className={cn(
                "group relative flex flex-col items-start gap-2.5 rounded-2xl p-4 text-left transition-all duration-200",
                mode === "game_2d"
                  ? "border-2 border-brand bg-brand/10 shadow-lg shadow-brand/10 ring-2 ring-brand/30"
                  : "border border-border/80 bg-surface-2/50 hover:border-border hover:bg-surface-2 hover:shadow-md",
              )}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition",
                      mode === "game_2d"
                        ? "bg-brand text-brand-ink shadow-sm"
                        : "bg-surface text-ink-dim group-hover:text-ink",
                    )}
                  >
                    <Gamepad2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink">2D Biračko mesto</span>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/40">
                        ★ PREPORUČENO
                      </span>
                    </div>
                    <span className="text-[11px] text-ink-dim font-mono">Phaser 4.2.1 • 60 FPS WebGL</span>
                  </div>
                </div>

                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold",
                    mode === "game_2d"
                      ? "border-brand bg-brand text-brand-ink"
                      : "border-border text-transparent",
                  )}
                >
                  ✓
                </div>
              </div>

              <p className="text-xs leading-relaxed text-ink-dim">
                Prostorna simulacija biračkog mesta uživo. Kretanje birača, {SIMULATOR_EVENT_COUNT} interaktivnih incidenata i {SIMULATOR_CHOICE_COUNT} proceduralnih odluka na stanicama, kontrola brzine toka i noćno brojanje glasova uz Zapisnik.
              </p>
            </button>

            {/* 2. Klasični režim kartica */}
            <button
              type="button"
              onClick={() => {
                setMode("classic");
                setRetryEventIds(undefined);
              }}
              aria-pressed={mode === "classic"}
              className={cn(
                "group relative flex flex-col items-start gap-2.5 rounded-2xl p-4 text-left transition-all duration-200",
                mode === "classic"
                  ? "border-2 border-brand bg-brand/10 shadow-lg shadow-brand/10 ring-2 ring-brand/30"
                  : "border border-border/80 bg-surface-2/50 hover:border-border hover:bg-surface-2 hover:shadow-md",
              )}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition",
                      mode === "classic"
                        ? "bg-brand text-brand-ink shadow-sm"
                        : "bg-surface text-ink-dim group-hover:text-ink",
                    )}
                  >
                    <LayoutList className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink">Klasične kartice</span>
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-ink-dim">
                        Tekstualni mod
                      </span>
                    </div>
                    <span className="text-[11px] text-ink-dim font-mono">Linearni tok situacija</span>
                  </div>
                </div>

                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold",
                    mode === "classic"
                      ? "border-brand bg-brand text-brand-ink"
                      : "border-border text-transparent",
                  )}
                >
                  ✓
                </div>
              </div>

              <p className="text-xs leading-relaxed text-ink-dim">
                Format sa karticama situacija i odlukama korak-po-korak. Idealan za fokusiran prolaz kroz pravne članove, bodovni pregled i teorijsku analizu pojedinačnih izbornih radnji.
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Prikaz izabranog režima */}
      {mode === "classic" ? (
        <SimulationGame />
      ) : (
        <DynamicGameSimulatorShell
          key={`${selectedRole}-${gameMode}-${retryEventIds?.join("|") ?? "full"}`}
          initialRole={selectedRole}
          initialMode={gameMode}
          initialOnlyEventIds={retryEventIds}
          onRetryMistakes={setRetryEventIds}
        />
      )}
    </div>
  );
}
