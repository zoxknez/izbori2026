"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  RotateCcw,
  ShieldAlert,
  Clock,
  ChevronRight,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { readChecklist, removeStoredValue, writeChecklist } from "@/lib/storage";

interface ChecklistItem {
  id: string;
  phase: "pre" | "glasanje" | "brojanje" | "zapisnik";
  title: string;
  desc: string;
  critical?: boolean;
  ruleSlug?: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Faza 1: Pre otvaranja
  {
    id: "pre_1",
    phase: "pre",
    title: "Prisustvo i provera kvoruma",
    desc: "Birački odbor mora biti u punom sastavu u 06:00. Proveri akreditacije svih prisutnih lica.",
  },
  {
    id: "pre_2",
    phase: "pre",
    title: "Prebrojavanje primljenog materijala",
    desc: "Izbroj glasačke listiće i uveri se da se broj slaže sa brojem u primopredajnom protokolu.",
    critical: true,
  },
  {
    id: "pre_3",
    phase: "pre",
    title: "Provera ispravnosti UV lampe i spreja",
    desc: "Isprobaj UV lampu u utičnici/baterijama i proveri da li UV sprej ostavlja nevidljiv trag vidljiv pod lampom.",
  },
  {
    id: "pre_4",
    phase: "pre",
    title: "Pregled prazne glasačke kutije pred prvim biračem",
    desc: "Kutija mora biti potpuno prazna. Ovo mora posvedočiti prvi birač koji uđe na BM.",
    critical: true,
  },
  {
    id: "pre_5",
    phase: "pre",
    title: "Popunjavanje i ubacivanje Kontrolnog lista",
    desc: "Kontrolni list potpisuje prvi birač i najmanje jedan član BO. Obavezno se ubacuje pre pečaćenja!",
    critical: true,
    ruleSlug: "kontrolni-list-nije-popunjen",
  },
  {
    id: "pre_6",
    phase: "pre",
    title: "Propisno pečaćenje glasačke kutije",
    desc: "Kutija se pečati sigurnosnim trakama u prisustvu prvog birača. Brojevi traka se beleže.",
    critical: true,
    ruleSlug: "ostecena-ili-nepecacena-kutija",
  },
  {
    id: "pre_7",
    phase: "pre",
    title: "Postavljanje paravana za tajnost",
    desc: "Paravani moraju biti okrenuti tako da niko ne može videti kako birač zaokružuje listić.",
  },

  // Faza 2: Tok glasanja
  {
    id: "vote_1",
    phase: "glasanje",
    title: "UV provera pre svakog glasanja",
    desc: "Svaki birač mora prvo pružiti desni kažiprst pod UV lampu radi provere da već nije glasao.",
    critical: true,
  },
  {
    id: "vote_2",
    phase: "glasanje",
    title: "Utvrđivanje identiteta važećim dokumentom",
    desc: "Lična karta ili pasoš sa slikom i JMBG. Vozačka dozvola i zdravstvena knjižica nisu dovoljne.",
  },
  {
    id: "vote_3",
    phase: "glasanje",
    title: "Zaokruživanje rednog broja i svojeručni potpis",
    desc: "Birač se lično potpisuje u izvod iz biračkog spiska. Potpisivanje umesto drugog je krivično delo.",
    critical: true,
    ruleSlug: "glasanje-umesto-drugog-lica",
  },
  {
    id: "vote_4",
    phase: "glasanje",
    title: "Obeležavanje UV sprejom",
    desc: "Prst birača se sprejiše nakon potpisa, a PRE uručivanja glasačkog listića.",
  },
  {
    id: "vote_5",
    phase: "glasanje",
    title: "Uručivanje tačno JEDNOG listića",
    desc: "Nikada se ne sme uručiti više od jednog listića istom biraču.",
    critical: true,
  },
  {
    id: "vote_6",
    phase: "glasanje",
    title: "Samostalno glasanje i tajnost iza paravana",
    desc: "Strogo je zabranjeno prisustvo drugih lica iza paravana, fotografisanje listića i telefoni.",
    critical: true,
    ruleSlug: "fotografisanje-glasackog-listica",
  },
  {
    id: "vote_7",
    phase: "glasanje",
    title: "Poverenici za glasanje van biračkog mesta",
    desc: "Tri poverenika iz različitih lista nose tačan broj listića prema evidenciji prijavljenih.",
    ruleSlug: "poverenici-glasanje-van-bm-procedura",
  },

  // Faza 3: Zatvaranje i brojanje
  {
    id: "close_1",
    phase: "brojanje",
    title: "Omogućavanje glasanja svima u redu u 20:00",
    desc: "Svim biračima koji su u 20:00 zatečeni na biračkom mestu ili u redu ispred MORA se omogućiti glasanje.",
    critical: true,
    ruleSlug: "onemogucavanje-glasanja-zatecenim-biracima",
  },
  {
    id: "close_2",
    phase: "brojanje",
    title: "Zatvaranje vrata i udaljavanje neovlašćenih lica",
    desc: "Nakon poslednjeg birača zaključavaju se vrata. Na BM ostaju samo članovi BO i posmatrači.",
  },
  {
    id: "close_3",
    phase: "brojanje",
    title: "Prebrojavanje i pakovanje NEUPOTREBLJENIH listića",
    desc: "Ovo se radi PRVO, PRE bilo kakvog otvaranja glasačke kutije! Spakovati u koverat i zapečatiti.",
    critical: true,
  },
  {
    id: "close_4",
    phase: "brojanje",
    title: "Utvrđivanje broja birača koji su glasali",
    desc: "Broj se dobija isključivo sabiranjem potpisa u biračkom spisku i evidenciji glasanja van BM.",
    critical: true,
  },
  {
    id: "close_5",
    phase: "brojanje",
    title: "Otvaranje kutije i pronalazak Kontrolnog lista",
    desc: "Kutija se otvara tek sada. Prvo se pronalazi kontrolni list i proverava ispravnost.",
    critical: true,
    ruleSlug: "kontrolni-list-nije-pronadjen-u-kutiji",
  },
  {
    id: "close_6",
    phase: "brojanje",
    title: "Razvrstavanje na važeće i nevažeće listiće",
    desc: "Svi članovi odbora moraju imati jasan uvid u svaki listić. Pravila nevažećih su striktna.",
  },

  // Faza 4: Zapisnik
  {
    id: "rec_1",
    phase: "zapisnik",
    title: "Matematička kontrola brojeva",
    desc: "Zbir važećih i nevažećih mora tačno odgovarati broju listića u kutiji. Upotrebi Validator!",
    critical: true,
  },
  {
    id: "rec_2",
    phase: "zapisnik",
    title: "Upisivanje primedbi kontrolora u zapisnik",
    desc: "Predsednik BO NE SME odbiti upis primedbe! Ako odbije, to je teška nepravilnost.",
    critical: true,
  },
  {
    id: "rec_3",
    phase: "zapisnik",
    title: "Potpisivanje zapisnika (samo istinitog!)",
    desc: "Potpisuješ zapisnik tek kada se uveriš da su brojevi tačni i sve primedbe unete.",
    critical: true,
  },
  {
    id: "rec_4",
    phase: "zapisnik",
    title: "Preuzimanje primerka zapisnika i javno isticanje",
    desc: "Jedan primerak se odmah lepi na ulazna vrata biračkog mesta, a članovi uzimaju kopije.",
  },
];

const PHASES = [
  { key: "all", label: "Sve provere", icon: Clock },
  { key: "pre", label: "1. Pre otvaranja (06–07h)", icon: Clock },
  { key: "glasanje", label: "2. Tok glasanja (07–20h)", icon: Clock },
  { key: "brojanje", label: "3. Zatvaranje i brojanje", icon: Clock },
  { key: "zapisnik", label: "4. Zapisnik i pakovanje", icon: Clock },
] as const;

export function ControllerChecklist() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [activePhase, setActivePhase] = useState<string>("all");
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("izbori_kontrolor_checklist_v1");
      if (saved) {
        // Hydration-safe localStorage rehydration; this runs only in the browser.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCompleted(readChecklist("izbori_kontrolor_checklist_v1"));
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  // Save to localStorage
  function toggleItem(id: string) {
    const next = { ...completed, [id]: !completed[id] };
    setCompleted(next);
    writeChecklist("izbori_kontrolor_checklist_v1", next);
  }

  function handleReset() {
    if (window.confirm("Da li sigurno želiš da resetuješ sve čekirane stavke na kontrolnoj listi?")) {
      setCompleted({});
      removeStoredValue("izbori_kontrolor_checklist_v1");
    }
  }

  function handleCopySummary() {
    const total = CHECKLIST_ITEMS.length;
    const doneCount = Object.values(completed).filter(Boolean).length;
    const remaining = CHECKLIST_ITEMS.filter((i) => !completed[i.id]);

    let text = `📋 IZVEŠTAJ KONTROLORA - KONTROLNA LISTA\n`;
    text += `Napredak: ${doneCount}/${total} provera (${Math.round((doneCount / total) * 100)}%)\n\n`;
    if (remaining.length > 0) {
      text += `Preostale / Neurađene stavke:\n`;
      remaining.forEach((r) => {
        text += `- ${r.critical ? "🚨 " : ""}${r.title}\n`;
      });
    } else {
      text += `✅ Sve provere uspešno završene!\n`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const total = CHECKLIST_ITEMS.length;
  const doneCount = mounted ? Object.values(completed).filter(Boolean).length : 0;
  const percent = Math.round((doneCount / total) * 100);

  const displayedItems = activePhase === "all"
    ? CHECKLIST_ITEMS
    : CHECKLIST_ITEMS.filter((i) => i.phase === activePhase);

  return (
    <div className="space-y-6">
      {/* Progress and status header */}
      <div className="rounded-3xl border border-brand/30 bg-gradient-to-br from-surface-2/90 via-surface/80 to-surface/90 p-5 sm:p-7 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <Sparkles className="h-3.5 w-3.5" />
              Lokalno snimanje · Bez mrežnog čuvanja
            </div>
            <h2 className="mt-2.5 text-xl sm:text-2xl font-bold tracking-tight text-ink">
              Interaktivni protokol kontrolora
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-ink-dim">
              Označavaj korake kako se odvijaju na tvom biračkom mestu. Stanje ostaje sačuvano i nakon osvežavanja.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-surface-2 px-3 text-xs font-semibold text-ink hover:border-brand/40 hover:text-brand transition-colors"
              title="Kopiraj status za slanje štabu"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-sev-dozvoljeno" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Kopirano!" : "Kopiraj status"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-surface-2 px-3 text-xs font-semibold text-ink-faint hover:text-sev-teska hover:border-sev-teska/40 transition-colors"
              title="Resetuj listu"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-ink">
              Završeno: <strong>{doneCount}</strong> od <strong>{total}</strong> provera
            </span>
            <span className="font-bold text-brand">{percent}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2 border border-border/60">
            <div
              className="h-full bg-gradient-to-r from-brand via-teal-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Phase filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {PHASES.map((p) => {
          const isActive = activePhase === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setActivePhase(p.key)}
              className={cn(
                "shrink-0 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-150",
                isActive
                  ? "border-brand/60 bg-brand/15 text-brand shadow-xs"
                  : "border-border/80 bg-surface-2/60 text-ink-dim hover:border-border hover:bg-surface-2 hover:text-ink"
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {displayedItems.map((item) => {
          const isDone = Boolean(completed[item.id]);

          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggleItem(item.id);
                }
              }}
              role="button"
              tabIndex={0}
              aria-pressed={isDone}
              className={cn(
                "group flex cursor-pointer items-start gap-4 rounded-2xl border p-4 sm:p-5 transition-all duration-150 select-none",
                isDone
                  ? "border-sev-dozvoljeno/30 bg-sev-dozvoljeno/[0.04] opacity-80"
                  : item.critical
                  ? "border-sev-ponistavanje/30 bg-surface/90 hover:border-sev-ponistavanje/60 hover:bg-surface-2"
                  : "border-border/80 bg-surface/80 hover:border-brand/40 hover:bg-surface-2"
              )}
            >
              {/* Checkbox Icon */}
              <span
                className="mt-0.5 shrink-0 text-ink-faint transition-colors group-hover:text-ink"
                aria-hidden="true"
              >
                {isDone ? (
                  <CheckCircle2 className="h-6 w-6 text-sev-dozvoljeno" />
                ) : (
                  <Circle className="h-6 w-6 text-border group-hover:text-ink-dim" />
                )}
              </span>

              {/* Text content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className={cn(
                      "text-sm font-bold text-ink transition-colors",
                      isDone && "line-through text-ink-faint"
                    )}
                  >
                    {item.title}
                  </h3>

                  {item.critical && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-sev-ponistavanje/30 bg-sev-ponistavanje/10 px-2 py-0.5 text-[10px] font-bold text-sev-ponistavanje">
                      <ShieldAlert className="h-3 w-3" /> KRITIČNO
                    </span>
                  )}
                </div>

                <p
                  className={cn(
                    "mt-1 text-xs leading-relaxed text-ink-dim",
                    isDone && "text-ink-faint"
                  )}
                >
                  {item.desc}
                </p>

                {item.ruleSlug && (
                  <div className="mt-2.5">
                    <Link
                      href={`/pravila/${item.ruleSlug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
                    >
                      Pogledaj tačan postupak u slučaju problema
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
