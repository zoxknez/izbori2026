"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Calculator,
  FileSpreadsheet,
  ShieldAlert,
  ArrowRight,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ListaGlasova {
  id: string;
  naziv: string;
  glasova: string;
}

function toInt(v: string): number | null {
  if (v.trim() === "") return null;
  if (!/^\d+$/.test(v.trim())) return null;
  return parseInt(v, 10);
}

function Field({
  code,
  label,
  hint,
  value,
  onChange,
}: {
  code: string;
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const parsed = toInt(value);
  const invalid = value !== "" && parsed === null;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-surface/90 p-3 sm:p-4 transition-all focus-within:border-brand/60 focus-within:ring-2 focus-within:ring-brand/20">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs sm:text-sm font-bold text-ink">{label}</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-2 border border-border/60 text-xs font-mono font-bold text-brand">
            {code}
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-tight text-ink-faint">{hint}</p>
      </div>

      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className={cn(
          "mt-3 h-11 w-full rounded-lg border bg-surface-2/60 px-3 text-base font-semibold font-mono text-ink transition-colors focus:bg-surface focus:outline-none",
          invalid
            ? "border-sev-teska focus:border-sev-teska"
            : "border-border/80 focus:border-brand/60"
        )}
      />
    </div>
  );
}

export function ZapisnikValidator() {
  const [bmBroj, setBmBroj] = useState("");
  const [opstina, setOpstina] = useState("");
  const [R, setR] = useState(""); // primljeno
  const [U, setU] = useState(""); // neupotrebljeno
  const [G, setG] = useState(""); // glasalo (birači)
  const [B, setB] = useState(""); // u kutiji
  const [N, setN] = useState(""); // nevažeći
  const [V, setV] = useState(""); // važeći
  const [liste, setListe] = useState<ListaGlasova[]>([
    { id: "1", naziv: "Lista 1", glasova: "" },
    { id: "2", naziv: "Lista 2", glasova: "" },
  ]);
  const [copied, setCopied] = useState(false);

  const values = useMemo(
    () => ({
      R: toInt(R),
      U: toInt(U),
      G: toInt(G),
      B: toInt(B),
      N: toInt(N),
      V: toInt(V),
      liste: liste.map((l) => toInt(l.glasova)),
    }),
    [R, U, G, B, N, V, liste]
  );

  const hasAnyInput = R !== "" || U !== "" || G !== "" || B !== "" || N !== "" || V !== "";

  // Check 1: Pravilo A (B <= G) - Čl. 116 ZINP (automatsko poništavanje)
  const isRuleACheckable = values.B !== null && values.G !== null;
  const diffA = isRuleACheckable ? (values.B! - values.G!) : 0;
  const ruleAOk = isRuleACheckable ? values.B! <= values.G! : null;

  // Check 2: Pravilo B (U + B <= R) - Čl. 116 ZINP (automatsko poništavanje)
  const isRuleBCheckable = values.U !== null && values.B !== null && values.R !== null;
  const sumUB = isRuleBCheckable ? (values.U! + values.B!) : 0;
  const diffB = isRuleBCheckable ? (sumUB - values.R!) : 0;
  const ruleBOk = isRuleBCheckable ? sumUB <= values.R! : null;

  // Check 3: Pravilo C (N + V === B) - Računsko poklapanje u kutiji
  const isRuleCCheckable = values.N !== null && values.V !== null && values.B !== null;
  const sumNV = isRuleCCheckable ? (values.N! + values.V!) : 0;
  const diffC = isRuleCCheckable ? (sumNV - values.B!) : 0;
  const ruleCOk = isRuleCCheckable ? sumNV === values.B! : null;

  // Check 4: Pravilo D (Zbir lista === V)
  const hasAllListValues = values.liste.length > 0 && values.liste.every((v) => v !== null);
  const sumListe = hasAllListValues ? values.liste.reduce((a, b) => a! + b!, 0) : null;
  const isRuleDCheckable = sumListe !== null && values.V !== null;
  const diffD = isRuleDCheckable ? (sumListe! - values.V!) : 0;
  const ruleDOk = isRuleDCheckable ? sumListe === values.V! : null;

  // Overall Status
  const isAnnulmentFail = ruleAOk === false || ruleBOk === false;
  const isCalculationFail = ruleCOk === false || ruleDOk === false;
  const allEvaluated = ruleAOk !== null && ruleBOk !== null && ruleCOk !== null && ruleDOk !== null;
  const isEverythingValid = allEvaluated && ruleAOk && ruleBOk && ruleCOk && ruleDOk;

  function loadValidDemo() {
    setR("1000");
    setU("350");
    setG("650");
    setB("650");
    setN("15");
    setV("635");
    setListe([
      { id: "1", naziv: "Lista 1", glasova: "385" },
      { id: "2", naziv: "Lista 2", glasova: "250" },
    ]);
  }

  function loadAnnulmentDemo() {
    setR("1000");
    setU("350");
    setG("646"); // 646 glasalo
    setB("650"); // 650 u kutiji -> 4 listića viška!
    setN("15");
    setV("635");
    setListe([
      { id: "1", naziv: "Lista 1", glasova: "385" },
      { id: "2", naziv: "Lista 2", glasova: "250" },
    ]);
  }

  function handleReset() {
    setBmBroj("");
    setOpstina("");
    setR("");
    setU("");
    setG("");
    setB("");
    setN("");
    setV("");
    setListe([
      { id: "1", naziv: "Lista 1", glasova: "" },
      { id: "2", naziv: "Lista 2", glasova: "" },
    ]);
  }

  function handleCopyReport() {
    let text = `🗳️ IZVEŠTAJ VALIDATORA ZAPISNIKA\n`;
    if (opstina || bmBroj) {
      text += `Mesto: ${opstina || "/"}, Biračko mesto br: ${bmBroj || "/"}\n`;
    }
    text += `------------------------------------\n`;
    text += `Primljeno listića (R): ${R || 0}\n`;
    text += `Neupotrebljeno listića (U): ${U || 0}\n`;
    text += `Birača glasalo (G): ${G || 0}\n`;
    text += `Listića u kutiji (B): ${B || 0}\n`;
    text += `Važećih listića (V): ${V || 0}\n`;
    text += `Nevažećih listića (N): ${N || 0}\n`;
    text += `------------------------------------\n`;

    if (isAnnulmentFail) {
      text += `🚨 STATUS: AUTOMATSKO PONIŠTAVANJE (Čl. 116 ZINP)\n`;
      if (ruleAOk === false) text += `- Pravilo A: Višak od ${diffA} listića u kutiji u odnosu na broj birača!\n`;
      if (ruleBOk === false) text += `- Pravilo B: Zbir (U+B) premašuje primljene za ${diffB} listića!\n`;
    } else if (isCalculationFail) {
      text += `⚠️ STATUS: RAČUNSKO NESLAGANJE\n`;
      if (ruleCOk === false) text += `- Pravilo C: Važeći + nevažeći se ne slažu sa kutijom (razlika: ${diffC})!\n`;
      if (ruleDOk === false) text += `- Pravilo D: Zbir lista (${sumListe}) se ne slaže sa važećim (${V})!\n`;
    } else if (isEverythingValid) {
      text += `✅ STATUS: ZAPISNIK JE MATEMATIČKI ISPRAVAN\n`;
    } else {
      text += `STATUS: Nepotpuni podaci\n`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function addLista() {
    setListe((prev) => [
      ...prev,
      { id: crypto.randomUUID(), naziv: `Lista ${prev.length + 1}`, glasova: "" },
    ]);
  }

  function removeLista(id: string) {
    setListe((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12 items-start">
      {/* LEFT COLUMN: Data Entry Form (7 cols) */}
      <div className="space-y-6 lg:col-span-7">
        <div className="rounded-3xl border border-border/80 bg-surface/80 p-5 sm:p-7 shadow-xl backdrop-blur-md">
          {/* Header and demo presets */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border-soft pb-5">
            <div>
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-brand" />
                Podaci sa biračkog mesta
              </h2>
              <p className="mt-0.5 text-xs text-ink-dim">
                Unesi brojeve iz zapisnika o radu biračkog odbora.
              </p>
            </div>

            {/* Quick Demo Previews */}
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
              <button
                type="button"
                onClick={loadValidDemo}
                className="rounded-lg border border-sev-dozvoljeno/30 bg-sev-dozvoljeno/10 px-2.5 py-1 text-[11px] font-semibold text-sev-dozvoljeno hover:bg-sev-dozvoljeno/20 transition-colors"
                title="Popuni primer ispravnog zapisnika"
              >
                Primer: Ispravan
              </button>
              <button
                type="button"
                onClick={loadAnnulmentDemo}
                className="rounded-lg border border-sev-ponistavanje/30 bg-sev-ponistavanje/10 px-2.5 py-1 text-[11px] font-semibold text-sev-ponistavanje hover:bg-sev-ponistavanje/20 transition-colors"
                title="Popuni primer sa viškom listića"
              >
                Primer: Poništavanje
              </button>
              {hasAnyInput && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg border border-border/80 bg-surface-2 p-1 text-ink-faint hover:text-ink transition-colors"
                  title="Obriši sve"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Polling Station details (optional) */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-dim">Opština / Grad (opciono):</label>
              <input
                value={opstina}
                onChange={(e) => setOpstina(e.target.value)}
                placeholder="npr. Novi Sad, Čukarica..."
                className="mt-1 h-9 w-full rounded-lg border border-border/80 bg-surface-2/60 px-3 text-xs text-ink placeholder:text-ink-faint focus:border-brand/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-dim">Broj biračkog mesta:</label>
              <input
                value={bmBroj}
                onChange={(e) => setBmBroj(e.target.value)}
                placeholder="npr. BM 14"
                className="mt-1 h-9 w-full rounded-lg border border-border/80 bg-surface-2/60 px-3 text-xs text-ink placeholder:text-ink-faint focus:border-brand/60 focus:outline-none"
              />
            </div>
          </div>

          {/* 6 Official Metric Fields */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Field
              code="R"
              label="Primljeno listića"
              hint="Ukupno zaduženo od izborne komisije"
              value={R}
              onChange={setR}
            />
            <Field
              code="U"
              label="Neupotrebljeni listići"
              hint="Prebrojano i zapakovano PRE otvaranja kutije"
              value={U}
              onChange={setU}
            />
            <Field
              code="G"
              label="Birača glasalo"
              hint="Zbir potpisa u spisku i na evidenciji van BM"
              value={G}
              onChange={setG}
            />
            <Field
              code="B"
              label="Listića u kutiji"
              hint="Ukupno izvađeno iz glasačke kutije"
              value={B}
              onChange={setB}
            />
            <Field
              code="V"
              label="Važećih listića"
              hint="Sa jasno zaokruženim jednim kandidatom/listom"
              value={V}
              onChange={setV}
            />
            <Field
              code="N"
              label="Nevažećih listića"
              hint="Prazni, precrtani ili nejasni listići"
              value={N}
              onChange={setN}
            />
          </div>

          {/* Votes per list section */}
          <div className="mt-7 rounded-2xl border border-border/80 bg-surface-2/40 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-soft pb-3">
              <div>
                <h3 className="text-sm font-bold text-ink">Glasovi po izbornim listama</h3>
                <p className="text-[11px] text-ink-faint">Zbir glasova lista mora se poklopiti sa brojem važećih listića (V).</p>
              </div>

              {/* Live list sum counter */}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-mono font-bold",
                    sumListe === null || values.V === null
                      ? "bg-surface-2 text-ink-faint"
                      : sumListe === values.V
                      ? "bg-sev-dozvoljeno/15 text-sev-dozvoljeno border border-sev-dozvoljeno/30"
                      : "bg-sev-teska/15 text-sev-teska border border-sev-teska/30"
                  )}
                >
                  Zbir: {sumListe ?? 0} / V: {values.V ?? 0}
                </span>

                <button
                  type="button"
                  onClick={addLista}
                  className="inline-flex items-center gap-1 rounded-lg border border-brand/40 bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand hover:bg-brand/20 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Dodaj listu
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
              {liste.map((l, idx) => (
                <div key={l.id} className="flex items-center gap-2">
                  <span className="w-6 text-center text-xs font-mono text-ink-faint">{idx + 1}.</span>
                  <input
                    value={l.naziv}
                    onChange={(e) =>
                      setListe((prev) =>
                        prev.map((p) => (p.id === l.id ? { ...p, naziv: e.target.value } : p))
                      )
                    }
                    placeholder="Naziv liste"
                    className="h-10 flex-1 rounded-xl border border-border/80 bg-surface px-3 text-xs font-medium text-ink focus:border-brand/60 focus:outline-none"
                  />
                  <input
                    inputMode="numeric"
                    placeholder="0"
                    value={l.glasova}
                    onChange={(e) =>
                      setListe((prev) =>
                        prev.map((p) => (p.id === l.id ? { ...p, glasova: e.target.value } : p))
                      )
                    }
                    className="h-10 w-28 shrink-0 rounded-xl border border-border/80 bg-surface px-3 text-sm font-semibold font-mono text-ink focus:border-brand/60 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeLista(l.id)}
                    disabled={liste.length <= 1}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-faint hover:bg-sev-teska/10 hover:text-sev-teska disabled:opacity-20 transition-colors"
                    title="Ukloni listu"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Diagnostic Results & Verdict (5 cols) */}
      <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-20">
        {/* 1. Executive Verdict Banner */}
        <div
          className={cn(
            "rounded-3xl border p-6 shadow-2xl transition-all backdrop-blur-md",
            !hasAnyInput
              ? "border-border/80 bg-surface/80"
              : isAnnulmentFail
              ? "border-sev-ponistavanje/50 bg-gradient-to-br from-sev-ponistavanje/15 via-surface-2/90 to-surface/90 text-ink"
              : isCalculationFail
              ? "border-sev-proveri/50 bg-gradient-to-br from-sev-proveri/15 via-surface-2/90 to-surface/90 text-ink"
              : isEverythingValid
              ? "border-sev-dozvoljeno/50 bg-gradient-to-br from-sev-dozvoljeno/15 via-surface-2/90 to-surface/90 text-ink"
              : "border-border/80 bg-surface/80"
          )}
        >
          <div className="flex items-start gap-3.5">
            {!hasAnyInput ? (
              <Calculator className="h-6 w-6 text-brand shrink-0 mt-0.5" />
            ) : isAnnulmentFail ? (
              <ShieldAlert className="h-7 w-7 text-sev-ponistavanje shrink-0 mt-0.5 animate-pulse" />
            ) : isCalculationFail ? (
              <AlertTriangle className="h-6 w-6 text-sev-proveri shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-sev-dozvoljeno shrink-0 mt-0.5" />
            )}

            <div>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                {!hasAnyInput
                  ? "Čeka se unos podataka"
                  : isAnnulmentFail
                  ? "ZAKONSKO PONIŠTAVANJE BIRAČKOG MESTA"
                  : isCalculationFail
                  ? "RAČUNSKO NESLAGANJE U ZAPISNIKU"
                  : "ZAPISNIK JE MATEMATIČKI ISPRAVAN"}
              </h3>

              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-ink-dim">
                {!hasAnyInput
                  ? "Unesi brojeve u levu kolonu ili klikni na demo primer za automatsku forenziku."
                  : isAnnulmentFail
                  ? "Uočeno je zakonsko neslaganje po čl. 116 ZINP. Glasanje se po sili zakona poništava po službenoj dužnosti. Član odbora NE SME potpisati zapisnik bez unosa primedbe!"
                  : isCalculationFail
                  ? "Brojevi se logički ne poklapaju. Odbor mora ponovo prebrojati listiće pre zaključivanja zapisnika."
                  : "Sve četiri kontrolne provere prolaze. Brojevi u kutiji i na listama se u potpunosti slažu sa biračkim spiskom."}
              </p>

              {/* Action Buttons in Verdict */}
              {hasAnyInput && (
                <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-border-soft">
                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-surface-2 px-3 text-xs font-semibold text-ink hover:border-brand/40 hover:text-brand transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-sev-dozvoljeno" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Izveštaj kopiran!" : "Kopiraj izveštaj za štab"}
                  </button>

                  {isAnnulmentFail && (
                    <Link
                      href="/prijavi?rule=neslaganje-brojeva-u-zapisniku"
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-sev-ponistavanje px-3 text-xs font-bold text-canvas hover:bg-sev-ponistavanje/90 transition-colors"
                    >
                      Prijavi incident
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Detailed Checks List */}
        <div className="space-y-3">
          {/* Rule A */}
          <div
            className={cn(
              "rounded-2xl border p-4 sm:p-5 transition-all",
              ruleAOk === null
                ? "border-border/80 bg-surface/70"
                : ruleAOk
                ? "border-sev-dozvoljeno/30 bg-sev-dozvoljeno/[0.04]"
                : "border-sev-ponistavanje/40 bg-sev-ponistavanje/[0.06]"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {ruleAOk === null ? (
                  <span className="h-2 w-2 rounded-full bg-border" />
                ) : ruleAOk ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-sev-dozvoljeno shrink-0" />
                ) : (
                  <XCircle className="h-4.5 w-4.5 text-sev-ponistavanje shrink-0" />
                )}
                <h4 className="text-xs sm:text-sm font-bold text-ink">
                  Pravilo A · Višak listića u kutiji
                </h4>
              </div>

              <span className="font-mono text-[11px] font-bold text-ink-faint">B ≤ G</span>
            </div>

            <div className="mt-2 text-xs leading-relaxed text-ink-dim">
              {ruleAOk === null ? (
                <span>Unesi broj birača koji su glasali (G) i listića u kutiji (B).</span>
              ) : ruleAOk ? (
                <span className="text-sev-dozvoljeno font-medium">
                  Ispravno: {values.B} listića u kutiji ≤ {values.G} birača koji su glasali. Nema viška listića.
                </span>
              ) : (
                <div className="space-y-1 text-sev-ponistavanje">
                  <p className="font-bold">
                    🚨 KRŠENJE: {values.B} u kutiji &gt; {values.G} glasalo (VIŠAK OD {diffA} LISTIĆA!)
                  </p>
                  <p className="text-[11px] text-ink-dim">
                    Zakon o izboru narodnih poslanika (čl. 116): ako je broj listića u kutiji veći od broja birača koji su se potpisali, glasanje na tom biračkom mestu se poništava!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Rule B */}
          <div
            className={cn(
              "rounded-2xl border p-4 sm:p-5 transition-all",
              ruleBOk === null
                ? "border-border/80 bg-surface/70"
                : ruleBOk
                ? "border-sev-dozvoljeno/30 bg-sev-dozvoljeno/[0.04]"
                : "border-sev-ponistavanje/40 bg-sev-ponistavanje/[0.06]"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {ruleBOk === null ? (
                  <span className="h-2 w-2 rounded-full bg-border" />
                ) : ruleBOk ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-sev-dozvoljeno shrink-0" />
                ) : (
                  <XCircle className="h-4.5 w-4.5 text-sev-ponistavanje shrink-0" />
                )}
                <h4 className="text-xs sm:text-sm font-bold text-ink">
                  Pravilo B · Neupotrebljeni + kutija vs. Primljeno
                </h4>
              </div>

              <span className="font-mono text-[11px] font-bold text-ink-faint">U + B ≤ R</span>
            </div>

            <div className="mt-2 text-xs leading-relaxed text-ink-dim">
              {ruleBOk === null ? (
                <span>Unesi primljene (R), neupotrebljene (U) i listiće u kutiji (B).</span>
              ) : ruleBOk ? (
                <span className="text-sev-dozvoljeno font-medium">
                  Ispravno: {sumUB} listića (U: {values.U} + B: {values.B}) ≤ {values.R} primljenih listića.
                </span>
              ) : (
                <div className="space-y-1 text-sev-ponistavanje">
                  <p className="font-bold">
                    🚨 KRŠENJE: Zbir ({sumUB}) premašuje primljenih {values.R} za {diffB} listića!
                  </p>
                  <p className="text-[11px] text-ink-dim">
                    Zakon o izboru narodnih poslanika (čl. 116): ako je zbir veći od ukupno primljenih, pojavili su se fiktivni listići — razlog za automatsko poništavanje!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Rule C */}
          <div
            className={cn(
              "rounded-2xl border p-4 sm:p-5 transition-all",
              ruleCOk === null
                ? "border-border/80 bg-surface/70"
                : ruleCOk
                ? "border-sev-dozvoljeno/30 bg-sev-dozvoljeno/[0.04]"
                : "border-sev-proveri/40 bg-sev-proveri/[0.06]"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {ruleCOk === null ? (
                  <span className="h-2 w-2 rounded-full bg-border" />
                ) : ruleCOk ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-sev-dozvoljeno shrink-0" />
                ) : (
                  <AlertTriangle className="h-4.5 w-4.5 text-sev-proveri shrink-0" />
                )}
                <h4 className="text-xs sm:text-sm font-bold text-ink">
                  Pravilo C · Važeći + Nevažeći jednaki kutiji
                </h4>
              </div>

              <span className="font-mono text-[11px] font-bold text-ink-faint">V + N = B</span>
            </div>

            <div className="mt-2 text-xs leading-relaxed text-ink-dim">
              {ruleCOk === null ? (
                <span>Unesi važeće (V), nevažeće (N) i listiće u kutiji (B).</span>
              ) : ruleCOk ? (
                <span className="text-sev-dozvoljeno font-medium">
                  Ispravno: {values.V} (važećih) + {values.N} (nevažećih) = {values.B} u kutiji.
                </span>
              ) : (
                <div className="space-y-1 text-sev-proveri">
                  <p className="font-bold">
                    ⚠️ NESLAGANJE: Zbir važećih i nevažećih ({sumNV}) se ne slaže sa kutijom ({values.B})!
                  </p>
                  <p className="text-[11px] text-ink-dim">
                    Razlika iznosi {diffC > 0 ? `+${diffC}` : diffC} listića. Odbor mora ponovo prebrojati listiće iz kutije pre unošenja u zapisnik.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Rule D */}
          <div
            className={cn(
              "rounded-2xl border p-4 sm:p-5 transition-all",
              ruleDOk === null
                ? "border-border/80 bg-surface/70"
                : ruleDOk
                ? "border-sev-dozvoljeno/30 bg-sev-dozvoljeno/[0.04]"
                : "border-sev-proveri/40 bg-sev-proveri/[0.06]"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {ruleDOk === null ? (
                  <span className="h-2 w-2 rounded-full bg-border" />
                ) : ruleDOk ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-sev-dozvoljeno shrink-0" />
                ) : (
                  <AlertTriangle className="h-4.5 w-4.5 text-sev-proveri shrink-0" />
                )}
                <h4 className="text-xs sm:text-sm font-bold text-ink">
                  Pravilo D · Zbir glasova lista jednak važećim
                </h4>
              </div>

              <span className="font-mono text-[11px] font-bold text-ink-faint">Σ Liste = V</span>
            </div>

            <div className="mt-2 text-xs leading-relaxed text-ink-dim">
              {ruleDOk === null ? (
                <span>Unesi glasove po izbornim listama i ukupan broj važećih (V).</span>
              ) : ruleDOk ? (
                <span className="text-sev-dozvoljeno font-medium">
                  Ispravno: Zbir unetih glasova svih lista ({sumListe}) tačno daje {values.V} važećih listića.
                </span>
              ) : (
                <div className="space-y-1 text-sev-proveri">
                  <p className="font-bold">
                    ⚠️ NESLAGANJE: Zbir lista ({sumListe}) se razlikuje od važećih listića ({values.V})!
                  </p>
                  <p className="text-[11px] text-ink-dim">
                    Razlika iznosi {diffD > 0 ? `+${diffD}` : diffD} glasova. Prekontrolisati zbir pojedinačnih lista.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
