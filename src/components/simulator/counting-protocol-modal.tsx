"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Gavel,
  Eye,
  Info,
  PenTool,
  ShieldAlert,
  ShieldCheck,
  Vote,
  X,
} from "lucide-react";
import type { SimulationRole } from "@/lib/domain/simulator/types";
import {
  evaluateCountingSession,
  type CountingSession,
} from "@/lib/domain/simulator/counting-session";
import { ROLE_CONFIGS } from "@/lib/domain/simulator/role-permissions";
import { cn } from "@/lib/utils";

interface CountingProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: CountingSession;
  currentRole: SimulationRole;
  onUpdateSession: (updated: CountingSession) => void;
}

export function CountingProtocolModal({
  isOpen,
  onClose,
  session,
  currentRole,
  onUpdateSession,
}: CountingProtocolModalProps) {
  const [activeTab, setActiveTab] = useState<"numbers" | "forensics" | "objections">("numbers");
  const [objectionText, setObjectionText] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Stroga evaluacija isključivo kroz domenski results-validator
  const evaluation = useMemo(() => evaluateCountingSession(session), [session]);
  const { countingResult, forensicsResult } = evaluation;

  if (!isOpen) return null;

  const roleConfig = ROLE_CONFIGS[currentRole];

  const handleSignProtocol = () => {
    const updated: CountingSession = {
      ...session,
      isProtocolSigned: true,
      signedByAtLeastThree: true,
      signedByMembers: [
        ...session.signedByMembers,
        `Član BO (${roleConfig.shortLabel})`,
        "Predsednik BO",
        "Zamenik predsednika BO",
      ],
    };
    onUpdateSession(updated);
    setStatusMessage("Zapisnik o radu biračkog odbora je uspešno overen i potpisan.");
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleAddObjection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!objectionText.trim()) return;

    const newObjection = {
      id: `obj-${Date.now()}`,
      role: currentRole,
      authorLabel: roleConfig.label,
      text: objectionText.trim(),
      timestamp: new Date().toLocaleTimeString("sr-RS", { hour: "2-digit", minute: "2-digit" }),
    };

    const updated: CountingSession = {
      ...session,
      objections: [...session.objections, newObjection],
    };
    onUpdateSession(updated);
    setObjectionText("");
    setStatusMessage("Primedba je uneta u zvanični Zapisnik o radu biračkog odbora.");
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div
      data-testid="counting-protocol-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-md"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-border bg-surface p-5 sm:p-6 shadow-2xl overflow-y-auto">
        {/* 1. Header */}
        <div className="flex items-start justify-between border-b border-border/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-bold text-ink sm:text-xl">
                Zapisnik o radu biračkog odbora (Brojanje glasova)
              </h2>
            </div>
            <p className="mt-1 text-xs text-ink-dim">
              Biračko mesto br. 14 • Utvrđivanje rezultata glasanja po Zakonu o izboru narodnih poslanika
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-ink">
              {currentRole === "clan_odbora" && <Gavel className="h-3.5 w-3.5 text-brand" />}
              {currentRole === "posmatrac" && <Eye className="h-3.5 w-3.5 text-sky-400" />}
              {currentRole === "birac" && <Vote className="h-3.5 w-3.5 text-emerald-400" />}
              <span>{roleConfig.shortLabel}</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-ink-dim hover:bg-surface-2 hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Notifikacija o statusu */}
        {statusMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* 2. Glavni status bar zakonitosti (Results Validator live evaluation) */}
        <div className="mt-4 rounded-2xl border p-4 transition-all duration-300">
          {forensicsResult.status === "annulment" ? (
            <div className="flex flex-col gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4">
              <div className="flex items-center gap-2 font-bold text-rose-400 text-sm">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                <span>{forensicsResult.title} ({forensicsResult.article})</span>
              </div>
              <ul className="list-disc pl-5 text-xs text-rose-300 space-y-1">
                {forensicsResult.findings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <p className="text-[11px] text-rose-400/90 font-medium">
                Izborna komisija po službenoj dužnosti poništava glasanje na ovom biračkom mestu.
              </p>
            </div>
          ) : forensicsResult.status === "heavy_error" ? (
            <div className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-300">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-amber-400 text-sm">{forensicsResult.title}: </span>
                <span>{forensicsResult.findings.join("; ")}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-sm">Sve zakonske i matematičke provere su uspešne! </span>
                <span className="text-emerald-300/90">Brojevi su logičko-računski usaglašeni i kontrolni list je potpun.</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Tabovi */}
        <div className="mt-4 flex border-b border-border/80">
          <button
            type="button"
            onClick={() => setActiveTab("numbers")}
            className={cn(
              "px-4 py-2 text-xs font-bold transition border-b-2",
              activeTab === "numbers"
                ? "border-brand text-brand"
                : "border-transparent text-ink-dim hover:text-ink",
            )}
          >
            1. Rubrike i Pravila (A–D)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("forensics")}
            className={cn(
              "px-4 py-2 text-xs font-bold transition border-b-2",
              activeTab === "forensics"
                ? "border-brand text-brand"
                : "border-transparent text-ink-dim hover:text-ink",
            )}
          >
            2. Kontrolni list i Forenzika
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("objections")}
            className={cn(
              "px-4 py-2 text-xs font-bold transition border-b-2",
              activeTab === "objections"
                ? "border-brand text-brand"
                : "border-transparent text-ink-dim hover:text-ink",
            )}
          >
            3. Primedbe i Potpisi ({session.objections.length})
          </button>
        </div>

        {/* 4. Sadržaj aktivnog taba */}
        <div className="mt-4 flex-1">
          {activeTab === "numbers" && (
            <div className="flex flex-col gap-4">
              {/* Mreža rubrika */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-border bg-surface-2/60 p-3">
                  <span className="text-[10px] font-bold text-ink-dim uppercase">Rubrika 1 (R)</span>
                  <div className="mt-1 text-base font-bold text-ink">{session.receivedBallots}</div>
                  <span className="text-[10px] text-ink-dim">Primljeni listići</span>
                </div>

                <div className="rounded-2xl border border-border bg-surface-2/60 p-3">
                  <span className="text-[10px] font-bold text-ink-dim uppercase">Rubrika 2 (U)</span>
                  <div className="mt-1 text-base font-bold text-ink">{session.unusedBallots ?? "—"}</div>
                  <span className="text-[10px] text-ink-dim">Neupotrebljeni listići</span>
                </div>

                <div className="rounded-2xl border border-border bg-surface-2/60 p-3">
                  <span className="text-[10px] font-bold text-ink-dim uppercase">Rubrika 3 (G)</span>
                  <div className="mt-1 text-base font-bold text-ink">{session.votersTurnout ?? "—"}</div>
                  <span className="text-[10px] text-ink-dim">Glasalo birača (u spisku)</span>
                </div>

                <div className="rounded-2xl border border-border bg-surface-2/60 p-3">
                  <span className="text-[10px] font-bold text-ink-dim uppercase">Rubrika 4 (B)</span>
                  <div className="mt-1 text-base font-bold text-ink">{session.ballotsInBox ?? "—"}</div>
                  <span className="text-[10px] text-ink-dim">Listići u kutiji</span>
                </div>

                <div className="rounded-2xl border border-border bg-surface-2/60 p-3">
                  <span className="text-[10px] font-bold text-ink-dim uppercase">Rubrika 5 (N)</span>
                  <div className="mt-1 text-base font-bold text-ink">{session.invalidBallots ?? "—"}</div>
                  <span className="text-[10px] text-ink-dim">Nevažeći listići</span>
                </div>

                <div className="rounded-2xl border border-border bg-surface-2/60 p-3">
                  <span className="text-[10px] font-bold text-ink-dim uppercase">Rubrika 6 (V)</span>
                  <div className="mt-1 text-base font-bold text-ink">{session.validBallots ?? "—"}</div>
                  <span className="text-[10px] text-ink-dim">Važeći listići</span>
                </div>

                <div className="col-span-2 rounded-2xl border border-border bg-surface-2/60 p-3">
                  <span className="text-[10px] font-bold text-ink-dim uppercase">Rubrika 7: Glasovi po listama</span>
                  <div className="mt-1 flex gap-4 text-xs font-semibold text-ink">
                    <span>Lista 1: {session.listVotes[0]}</span>
                    <span>Lista 2: {session.listVotes[1]}</span>
                    <span>Lista 3: {session.listVotes[2]}</span>
                  </div>
                  <span className="text-[10px] text-ink-dim">Zbir glasova: {session.validBallots}</span>
                </div>
              </div>

              {/* 4 Kontrolna pravila (A, B, C, D) */}
              <div className="rounded-2xl border border-border bg-surface-2/40 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-dim">
                  Zakonske matematičke kontrole (ZINP)
                </h4>
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {/* Pravilo A */}
                  <div className="flex items-center justify-between rounded-xl border border-border/80 bg-surface p-3">
                    <div>
                      <div className="text-xs font-bold text-ink">Pravilo A: B ≤ G</div>
                      <div className="text-[11px] text-ink-dim">Kutija ({session.ballotsInBox}) ≤ Potpisi ({session.votersTurnout})</div>
                    </div>
                    {countingResult.ruleA.ok ? (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                        ✓ Ispravno
                      </span>
                    ) : (
                      <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-400">
                        ⚠ Poništavanje (B &gt; G)
                      </span>
                    )}
                  </div>

                  {/* Pravilo B */}
                  <div className="flex items-center justify-between rounded-xl border border-border/80 bg-surface p-3">
                    <div>
                      <div className="text-xs font-bold text-ink">Pravilo B: U + B == R</div>
                      <div className="text-[11px] text-ink-dim">
                        {session.unusedBallots} + {session.ballotsInBox} = {(session.unusedBallots ?? 0) + (session.ballotsInBox ?? 0)} (R: {session.receivedBallots})
                      </div>
                    </div>
                    {countingResult.ruleB.ok && countingResult.ruleB.difference === 0 ? (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                        ✓ Ispravno
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-400">
                        Razlika: {countingResult.ruleB.difference}
                      </span>
                    )}
                  </div>

                  {/* Pravilo C */}
                  <div className="flex items-center justify-between rounded-xl border border-border/80 bg-surface p-3">
                    <div>
                      <div className="text-xs font-bold text-ink">Pravilo C: V + N == B</div>
                      <div className="text-[11px] text-ink-dim">
                        {session.validBallots} + {session.invalidBallots} = {(session.validBallots ?? 0) + (session.invalidBallots ?? 0)}
                      </div>
                    </div>
                    {countingResult.ruleC.ok ? (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                        ✓ Ispravno
                      </span>
                    ) : (
                      <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-400">
                        Neusaglašeno
                      </span>
                    )}
                  </div>

                  {/* Pravilo D */}
                  <div className="flex items-center justify-between rounded-xl border border-border/80 bg-surface p-3">
                    <div>
                      <div className="text-xs font-bold text-ink">Pravilo D: Suma lista == V</div>
                      <div className="text-[11px] text-ink-dim">Zbir glasova svih lista jednak važećim</div>
                    </div>
                    {countingResult.ruleD.ok ? (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                        ✓ Ispravno
                      </span>
                    ) : (
                      <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-400">
                        Neusaglašeno
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "forensics" && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-border bg-surface-2/50 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wide text-ink-dim">
                  Status kontrolnog lista u kutiji (Član 116. ZINP)
                </h4>
                <div className="mt-3 flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-surface p-3">
                    <span>Kontrolni list pronađen u glasačkoj kutiji</span>
                    <span className={session.controlListPresent ? "font-bold text-emerald-400" : "font-bold text-rose-400"}>
                      {session.controlListPresent ? "Da" : "Ne (Razlog za poništavanje)"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-surface p-3">
                    <span>Kontrolni list uredno popunjen pre otvaranja</span>
                    <span className={session.controlListCompleted ? "font-bold text-emerald-400" : "font-bold text-rose-400"}>
                      {session.controlListCompleted ? "Da" : "Ne"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-surface p-3">
                    <span>Potpis prvog birača na kontrolnom listu</span>
                    <span className={session.controlListSignedByFirstVoter ? "font-bold text-emerald-400" : "font-bold text-rose-400"}>
                      {session.controlListSignedByFirstVoter ? "Potpisan" : "Nedostaje potpis (PONIŠTAVANJE!)"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-surface p-3">
                    <span>Potpis člana biračkog odbora na kontrolnom listu</span>
                    <span className={session.controlListSignedByBoardMember ? "font-bold text-emerald-400" : "font-bold text-rose-400"}>
                      {session.controlListSignedByBoardMember ? "Potpisan" : "Nedostaje potpis"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "objections" && (
            <div className="flex flex-col gap-4">
              {/* Lista postojećih primedbi */}
              <div className="rounded-2xl border border-border bg-surface-2/50 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wide text-ink-dim">
                  Unose se primedbe posmatrača i članova odbora:
                </h4>
                {session.objections.length === 0 ? (
                  <p className="mt-2 text-xs text-ink-dim italic">
                    Nema unetih primedbi na Zapisnik o radu biračkog odbora.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-col gap-2">
                    {session.objections.map((obj) => (
                      <div key={obj.id} className="rounded-xl border border-border bg-surface p-3 text-xs">
                        <div className="flex items-center justify-between font-bold text-ink">
                          <span>{obj.authorLabel}</span>
                          <span className="text-[10px] text-ink-dim">{obj.timestamp}</span>
                        </div>
                        <p className="mt-1 text-ink-dim">{obj.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Forma za unošenje primedbe posmatrača / birača */}
              <form onSubmit={handleAddObjection} className="flex flex-col gap-2">
                <label className="text-xs font-bold text-ink">
                  Podnesi zvaničnu primedbu ({roleConfig.shortLabel}):
                </label>
                <textarea
                  value={objectionText}
                  onChange={(e) => setObjectionText(e.target.value)}
                  placeholder="Navedite konkretnu primedbu na proceduru prebrojavanja ili kontrolni list..."
                  className="rounded-2xl border border-border bg-surface p-3 text-xs text-ink focus:border-brand focus:outline-none"
                  rows={2}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!objectionText.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-surface-2 px-4 py-2 text-xs font-bold text-ink hover:border-brand/40 disabled:opacity-50"
                  >
                    <span>Upiši primedbu u zapisnik</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* 5. Footer sa akcijom potpisivanja */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/80 pt-4">
          <div className="flex items-center gap-2">
            {session.isProtocolSigned ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Zapisnik je potpisan i overen</span>
              </span>
            ) : (
              <span className="text-xs text-ink-dim">
                Zapisnik čeka overu članova biračkog odbora pre predaje komisiji.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-ink hover:bg-surface-2"
            >
              Zatvori
            </button>

            {currentRole === "clan_odbora" && !session.isProtocolSigned && (
              <button
                type="button"
                data-testid="sign-protocol-button"
                onClick={handleSignProtocol}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2 text-xs font-bold text-brand-contrast shadow-sm hover:opacity-90"
              >
                <PenTool className="h-3.5 w-3.5" />
                <span>Potpiši i overi zapisnik (Član BO)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
