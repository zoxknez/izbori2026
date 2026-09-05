"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Vote, Gavel, Eye } from "lucide-react";

const ROLES = [
  { key: "controller", label: "Član odbora", icon: Gavel },
  { key: "voter", label: "Birač", icon: Vote },
  { key: "observer", label: "Posmatrač", icon: Eye },
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
    <div>
      <div className="flex flex-wrap gap-2">
        {available.map((role) => {
          const Icon = role.icon;
          const isActive = active === role.key;
          return (
            <button
              key={role.key}
              type="button"
              onClick={() => setActive(role.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-border bg-surface-2 text-ink-dim hover:text-ink"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {role.label}
            </button>
          );
        })}
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-dim">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
