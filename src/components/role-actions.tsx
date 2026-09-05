"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Vote, Gavel, Eye } from "lucide-react";

const ROLES = [
  { key: "controller", label: "Član biračkog odbora", shortLabel: "Kontrolor", icon: Gavel },
  { key: "voter", label: "Birač (građanin)", shortLabel: "Birač", icon: Vote },
  { key: "observer", label: "Ovlašćeni posmatrač", shortLabel: "Posmatrač", icon: Eye },
] as const;

type RoleKey = (typeof ROLES)[number]["key"];

export function RoleActions({
  controllerActions,
  voterActions,
  observerActions,
}: {
  controllerActions: string[];
  voterActions: string[];
  observerActions: string[];
}) {
  const data: Record<RoleKey, string[]> = {
    controller: controllerActions,
    voter: voterActions,
    observer: observerActions,
  };

  const available = ROLES.filter((r) => data[r.key].length > 0);
  const [active, setActive] = useState<RoleKey>(available[0]?.key ?? "controller");

  if (available.length === 0) return null;

  const items = data[active];

  return (
    <div className="space-y-4">
      {/* Role selector tabs */}
      <div className="flex flex-wrap gap-2">
        {available.map((role) => {
          const Icon = role.icon;
          const isActive = active === role.key;
          const count = data[role.key].length;

          return (
            <button
              key={role.key}
              type="button"
              onClick={() => setActive(role.key)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-150",
                isActive
                  ? "border-brand/60 bg-brand/15 text-brand shadow-xs"
                  : "border-border/80 bg-surface-2/60 text-ink-dim hover:border-border hover:bg-surface-2 hover:text-ink"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{role.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                  isActive ? "bg-brand/25 text-brand" : "bg-surface text-ink-faint"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Action steps for active role */}
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl border border-border/70 bg-surface-2/40 p-3.5 transition-colors hover:border-border"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-xs font-bold text-brand mt-0.5">
              {i + 1}
            </span>
            <div className="flex-1 text-sm leading-relaxed text-ink">
              {item}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
