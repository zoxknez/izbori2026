"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileText, Plus, X, Users, Clock } from "lucide-react";
import type { EvidenceRecord } from "@/lib/domain/simulator/live-types";
import type { SimulationRole } from "@/lib/domain/simulator/types";
import { cn } from "@/lib/utils";
import { useDialogFocus } from "@/components/ui/use-dialog-focus";

interface EvidenceTrayProps {
  isOpen: boolean;
  onClose: () => void;
  evidenceList: EvidenceRecord[];
  currentClock: string;
  currentSimulationTimeMs: number;
  currentRole: SimulationRole;
  selectedLocationId?: string;
  onAddEvidence: (record: EvidenceRecord) => void;
}

const COMMON_LOCATIONS = [
  { id: "entrance", name: "Ulaz / Hodnik" },
  { id: "uv-station", name: "UV stanica" },
  { id: "voter-roll-desk", name: "Sto za birački spisak" },
  { id: "spray-station", name: "Sto za sprej i listiće" },
  { id: "voting-booths", name: "Paravani za glasanje" },
  { id: "ballot-box-station", name: "Glasačka kutija" },
  { id: "board-table", name: "Sto odbora sa materijalom" },
  { id: "observer-area", name: "Zona za posmatrače" },
];

const WITNESS_OPTIONS = [
  "Predsednik biračkog odbora",
  "Član biračkog odbora #1",
  "Član biračkog odbora #2",
  "Akreditovani posmatrač #1",
  "Birač u redu",
  "Prisutni građanin",
];

export function EvidenceTray({
  isOpen,
  onClose,
  evidenceList,
  currentClock,
  currentSimulationTimeMs,
  currentRole,
  selectedLocationId = "voter-roll-desk",
  onAddEvidence,
}: EvidenceTrayProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCustomLocationId, setSelectedCustomLocationId] = useState<string | null>(null);
  const locationId = selectedCustomLocationId ?? selectedLocationId;
  const [factInput, setFactInput] = useState("");
  const [facts, setFacts] = useState<string[]>([]);
  const [assumptionInput, setAssumptionInput] = useState("");
  const [assumptions, setAssumptions] = useState<string[]>([]);
  const [selectedWitnesses, setSelectedWitnesses] = useState<string[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(isOpen, dialogRef, onClose);

  if (!isOpen) return null;

  const handleAddFact = () => {
    if (!factInput.trim()) return;
    setFacts([...facts, factInput.trim()]);
    setFactInput("");
  };

  const handleAddAssumption = () => {
    if (!assumptionInput.trim()) return;
    setAssumptions([...assumptions, assumptionInput.trim()]);
    setAssumptionInput("");
  };

  const toggleWitness = (witness: string) => {
    if (selectedWitnesses.includes(witness)) {
      setSelectedWitnesses(selectedWitnesses.filter((w) => w !== witness));
    } else {
      setSelectedWitnesses([...selectedWitnesses, witness]);
    }
  };

  const handleSaveNote = () => {
    if (facts.length === 0 && assumptions.length === 0) return;

    const newRecord: EvidenceRecord = {
      // Evidence IDs are part of the persisted replay surface. Keep them
      // deterministic instead of coupling them to wall-clock time.
      id: `ev-${currentSimulationTimeMs}-${evidenceList.length + 1}`,
      simulationTimeMs: currentSimulationTimeMs,
      timestamp: currentClock,
      locationId,
      observedFacts: facts,
      assumptions,
      witnesses: selectedWitnesses,
      relatedRuleIds: [],
      createdByRole: currentRole,
      source: "manual",
      completeness: {
        time: true,
        location: Boolean(locationId),
        facts: facts.length > 0,
        witnesses: selectedWitnesses.length > 0,
      },
    };

    onAddEvidence(newRecord);
    // Reset form
    setFacts([]);
    setAssumptions([]);
    setSelectedWitnesses([]);
    setSelectedCustomLocationId(null);
    setIsCreating(false);
  };

  const completenessItems = [
    { label: "Vreme", complete: true },
    { label: "Lokacija", complete: Boolean(locationId) },
    { label: "Činjenice", complete: facts.length > 0 },
    { label: "Svedoci", complete: selectedWitnesses.length > 0 },
  ];
  const completenessCount = completenessItems.filter((item) => item.complete).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-tray-title"
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-brand" />
            <div>
              <h2 id="evidence-tray-title" className="text-base font-bold text-ink">Beležnica dokaza i zapažanja</h2>
              <p className="text-xs text-ink-dim">Dokumentovanje toka i činjenica na biračkom mestu</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-dialog-initial-focus
            className="flex h-8 w-8 items-center justify-center rounded-xl text-ink-dim hover:bg-surface-2 hover:text-ink"
            aria-label="Zatvori beležnicu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isCreating ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-brand/20 bg-brand/5 p-3 text-xs text-brand">
                💡 <strong>Važna proceduralna razlika:</strong> Razdvoj ono što si lično video (činjenice) od sopstvenih pretpostavki ili motiva lica. Kvalitet dokaza u prigovoru zavisi od ove razlike.
              </div>

              <div
                className="rounded-2xl border border-border bg-surface-2/60 p-3"
                aria-label={`Kompletnost zapisa: ${completenessCount} od ${completenessItems.length}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-ink">Kontrolna lista zapisa</span>
                  <span className={cn(
                    "font-mono text-[11px] font-bold",
                    completenessCount === completenessItems.length ? "text-emerald-400" : "text-amber-400",
                  )}>
                    {completenessCount}/{completenessItems.length} kompletno
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {completenessItems.map((item) => (
                    <div
                      key={item.label}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold",
                        item.complete
                          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                          : "border-border bg-surface text-ink-muted",
                      )}
                    >
                      {item.complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5 rounded-full border border-current" />}
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Lokacija i vreme */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-ink">Lokacija zapažanja:</label>
                  <select
                    value={locationId}
                    onChange={(e) => setSelectedCustomLocationId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-ink focus:border-brand focus:outline-none"
                  >
                    {COMMON_LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink">Vreme unosa:</label>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-ink">
                    <Clock className="h-4 w-4 text-brand" />
                    <span className="font-mono font-bold">{currentClock}</span>
                  </div>
                </div>
              </div>

              {/* 1. Činjenice (Observed Facts) */}
              <div>
                <label className="text-xs font-bold text-emerald-400">
                  ✓ Objektivno zapažene činjenice (šta se tačno dogodilo / šta je viđeno):
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    type="text"
                    value={factInput}
                    onChange={(e) => setFactInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFact())}
                    placeholder="Npr. Birač je propušten do paravana bez UV lampe..."
                    className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-ink focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddFact}
                    className="rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/30"
                  >
                    Dodaj
                  </button>
                </div>
                {facts.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {facts.map((fact, idx) => (
                      <li key={idx} className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                        <span>• {fact}</span>
                        <button
                          type="button"
                          onClick={() => setFacts(facts.filter((_, i) => i !== idx))}
                          className="text-ink-dim hover:text-rose-400"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 2. Pretpostavke (Assumptions) */}
              <div>
                <label className="text-xs font-bold text-amber-400">
                  ⚠ Zaključci i pretpostavke (mogući razlozi / interpretacije):
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    type="text"
                    value={assumptionInput}
                    onChange={(e) => setAssumptionInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAssumption())}
                    placeholder="Npr. Član odbora poznaje birača iz zgrade..."
                    className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-ink focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddAssumption}
                    className="rounded-xl bg-amber-500/20 px-3 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/30"
                  >
                    Dodaj
                  </button>
                </div>
                {assumptions.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {assumptions.map((ass, idx) => (
                      <li key={idx} className="flex items-center justify-between rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">
                        <span>• {ass}</span>
                        <button
                          type="button"
                          onClick={() => setAssumptions(assumptions.filter((_, i) => i !== idx))}
                          className="text-ink-dim hover:text-rose-400"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Svedoci */}
              <div>
                <label className="text-xs font-semibold text-ink">Prisutna lica / Svedoci:</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {WITNESS_OPTIONS.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => toggleWitness(w)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-xs transition",
                        selectedWitnesses.includes(w)
                          ? "border-brand bg-brand/15 font-semibold text-brand"
                          : "border-border bg-surface-2 text-ink-dim hover:text-ink",
                      )}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Akcije forme */}
              <div className="mt-2 flex items-center justify-end gap-2 border-t border-border/80 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomLocationId(null);
                    setIsCreating(false);
                  }}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-ink-dim hover:bg-surface-2"
                >
                  Otkaži
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={facts.length === 0 && assumptions.length === 0}
                  className="rounded-xl bg-brand px-4 py-2 text-xs font-bold text-brand-contrast shadow-sm transition hover:opacity-90 disabled:opacity-40"
                >
                  Sačuvaj u beležnicu
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-dim">
                  Ukupno zabeleženih unosa: <strong>{evidenceList.length}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-bold text-brand-contrast shadow-sm transition hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nova zabeleška</span>
                </button>
              </div>

              {evidenceList.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-8 text-center">
                  <FileText className="h-8 w-8 text-ink-muted" />
                  <p className="mt-2 text-sm font-semibold text-ink">Beležnica je prazna</p>
                  <p className="mt-1 max-w-sm text-xs text-ink-dim">
                    Tokom dana možeš zapisivati proceduralne primedbe, uočene nepravilnosti i ponašanja birača ili članova odbora.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {evidenceList.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-2xl border border-border/80 bg-surface-2/40 p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand">{record.timestamp}</span>
                          <span className="rounded bg-surface-2 px-2 py-0.5 text-xs text-ink-dim">
                            {record.locationId}
                          </span>
                        </div>

                        {record.completeness.witnesses && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Potvrđeni svedoci
                          </span>
                        )}
                      </div>

                      {record.observedFacts.length > 0 && (
                        <div className="mt-2 text-xs text-ink">
                          <span className="font-semibold text-emerald-400">Činjenice: </span>
                          {record.observedFacts.join("; ")}
                        </div>
                      )}

                      {record.assumptions.length > 0 && (
                        <div className="mt-1 text-xs text-ink-dim">
                          <span className="font-semibold text-amber-400">Pretpostavka: </span>
                          {record.assumptions.join("; ")}
                        </div>
                      )}

                      {record.witnesses.length > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-muted">
                          <Users className="h-3 w-3" />
                          <span>Svedoci: {record.witnesses.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
