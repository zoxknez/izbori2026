"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  Copy,
  Check,
  Trash2,
  FileDown,
  Clock,
  Share2,
  AlertTriangle,
  FileText,
  RotateCcw,
  CheckCircle2,
  Info,
  ShieldCheck,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EMPTY_INCIDENT, generateChronology, type IncidentData } from "@/lib/incident";
import { PHASE_META, PHASE_ORDER } from "@/lib/phases";
import { rules } from "@/content/rules";
import { criminalArticles } from "@/content/criminal-articles";
import { cn } from "@/lib/utils";
import {
  readSavedIncidentsOffline,
  removeSavedIncidentsOffline,
  writeSavedIncidentsOffline,
  type SavedIncident,
} from "@/lib/storage";

const STORAGE_KEY = "izborna-kontrola:incidenti";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="block">
      <div className="flex items-center justify-between">
        <legend className="text-sm font-semibold text-ink">{label}</legend>
        {hint && <span className="text-xs text-ink-faint">{hint}</span>}
      </div>
      <div className="mt-1.5">{children}</div>
    </fieldset>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors";
const textareaClass =
  "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors";

export function IncidentForm() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<IncidentData>(EMPTY_INCIDENT);
  const [loadedRuleTitle, setLoadedRuleTitle] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedIncident[]>([]);
  const [, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    void readSavedIncidentsOffline(STORAGE_KEY).then((incidents) => {
      startTransition(() => setSaved(incidents));
    });
  }, [startTransition]);

  // Parse search params if user navigated from rules or criminal codes
  useEffect(() => {
    const ruleParam = searchParams.get("rule");
    if (!ruleParam) return;

    if (ruleParam.startsWith("krivicno-delo-clan-")) {
      const articleStr = ruleParam.replace("krivicno-delo-clan-", "");
      const art = criminalArticles.find((a) => a.article === articleStr);
      if (art) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setData((prev) => ({
          ...prev,
          spornaRadnja: `Sumnja na krivično delo: ${art.naziv} (čl. ${art.article} Krivičnog zakonika)`,
          propis: `Krivični zakonik Republike Srbije, član ${art.article} (${art.naziv})`,
          faza: "glasanje",
        }));
        setLoadedRuleTitle(`Član ${art.article} KZ: ${art.naziv}`);
      }
    } else {
      const found = rules.find((r) => r.slug === ruleParam);
      if (found) {
        const legalBasisText = found.lawReferences?.length
          ? found.lawReferences.map((lr) => `${lr.law}, ${lr.article}`).join("; ")
          : "";
        setData((prev) => ({
          ...prev,
          spornaRadnja: found.naziv,
          propis: legalBasisText,
          faza: found.phase,
        }));
        setLoadedRuleTitle(found.naziv);
      }
    }
  }, [searchParams]);

  function update<K extends keyof IncidentData>(key: K, value: IncidentData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function setNow() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    setData((d) => ({
      ...d,
      datum: `${year}-${month}-${day}`,
      vreme: `${hours}:${minutes}`,
    }));
  }

  function resetForm() {
    if (window.confirm("Da li sigurno želiš da isprazniš formu?")) {
      setData(EMPTY_INCIDENT);
      setLoadedRuleTitle(null);
    }
  }

  const chronology = generateChronology(data);

  async function saveLocally() {
    const entry = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), data };
    const next = [entry, ...saved].slice(0, 30);
    setSaved(next);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    if (!(await writeSavedIncidentsOffline(STORAGE_KEY, next))) setSaveSuccess(false);
  }

  async function removeSaved(id: string) {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    await writeSavedIncidentsOffline(STORAGE_KEY, next);
  }

  function clearAllSaved() {
    if (window.confirm("Da li sigurno želiš da obrišeš sve sačuvane incidente sa ovog uređaja?")) {
      setSaved([]);
      void removeSavedIncidentsOffline(STORAGE_KEY);
    }
  }

  function loadSavedEntry(entryData: IncidentData) {
    setData(entryData);
    setLoadedRuleTitle(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(chronology);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback */
    }
  }

  function downloadTxt() {
    const blob = new Blob([chronology], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const bm = data.brojMesta ? `BM-${data.brojMesta}` : "BM-nepoznato";
    const dt = data.datum || "datum";
    a.download = `incident-${bm}-${dt}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function shareNativeOrWhatsapp() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: `Primedba BM ${data.brojMesta || ""}`,
          text: chronology,
        })
        .catch(() => {
          /* korisnik odustao */
        });
    } else {
      const text = encodeURIComponent(chronology);
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    }
  }

  return (
    <div className="space-y-6">
      {/* Loaded rule banner */}
      {loadedRuleTitle && (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-brand/30 bg-brand/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                Učitan pravni osnov iz baze
              </p>
              <p className="mt-0.5 text-sm font-medium text-ink">
                {loadedRuleTitle}
              </p>
              <p className="mt-1 text-xs text-ink-dim">
                Polja <em>Sporna radnja</em>, <em>Relevantan propis</em> i <em>Faza</em> su automatski pripremljena.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLoadedRuleTitle(null)}
            className="text-xs font-medium text-ink-faint hover:text-ink"
          >
            Zatvori
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: FORM INPUTS (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* SECTION 1: LOKACIJA I VREME */}
          <Card className="overflow-hidden shadow-sm">
            <div className="border-b border-border bg-surface-2/70 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand">
                  1
                </span>
                <h2 className="text-sm font-bold text-ink">
                  Lokacija, Vreme i Uloga
                </h2>
              </div>
            </div>
            <CardBody className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Vrsta izbora">
                  <select
                    className={inputClass}
                    value={data.vrstaIzbora}
                    onChange={(e) => update("vrstaIzbora", e.target.value)}
                  >
                    <option value="narodni_poslanici">Narodni poslanici (Parlamentarni)</option>
                    <option value="predsednik">Predsednik Republike</option>
                    <option value="lokalni">Lokalni / Pokrajinski izbori</option>
                  </select>
                </Field>
                <Field label="Moja uloga na biračkom mestu">
                  <select
                    className={inputClass}
                    value={data.uloga}
                    onChange={(e) => update("uloga", e.target.value)}
                  >
                    <option value="član biračkog odbora">Član biračkog odbora (Kontrolor)</option>
                    <option value="birač">Birač / Građanin</option>
                    <option value="akreditovani posmatrač">Akreditovani posmatrač</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Opština / Grad">
                  <input
                    className={inputClass}
                    value={data.opstina}
                    onChange={(e) => update("opstina", e.target.value)}
                    placeholder="npr. Novi Sad - Stari Grad"
                  />
                </Field>
                <Field label="Broj biračkog mesta">
                  <input
                    className={inputClass}
                    value={data.brojMesta}
                    onChange={(e) => update("brojMesta", e.target.value)}
                    placeholder="npr. 42"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Datum događaja">
                  <input
                    type="date"
                    className={inputClass}
                    value={data.datum}
                    onChange={(e) => update("datum", e.target.value)}
                  />
                </Field>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink">Vreme događaja</span>
                    <button
                      type="button"
                      onClick={setNow}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Postavi sad
                    </button>
                  </div>
                  <div className="mt-1.5">
                    <input
                      type="time"
                      className={inputClass}
                      value={data.vreme}
                      onChange={(e) => update("vreme", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Field label="Faza izbornog dana u kojoj se incident desio">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PHASE_ORDER.map((p) => {
                    const active = data.faza === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => update("faza", p)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-xl border p-2.5 text-center text-xs font-medium transition-all",
                          active
                            ? "border-brand bg-brand/10 font-bold text-brand ring-2 ring-brand/20"
                            : "border-border bg-surface text-ink-dim hover:border-border-strong hover:bg-surface-2"
                        )}
                      >
                        {PHASE_META[p]?.label ?? p}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </CardBody>
          </Card>

          {/* SECTION 2: OPIS DOGAĐAJA */}
          <Card className="overflow-hidden shadow-sm">
            <div className="border-b border-border bg-surface-2/70 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand">
                  2
                </span>
                <h2 className="text-sm font-bold text-ink">
                  Šta se tačno dogodilo? (Činjenični opis)
                </h2>
              </div>
            </div>
            <CardBody className="space-y-4 p-5">
              <Field
                label="Šta sam neposredno video/la"
                hint="Opiši lično zapažanje, bez pretpostavki"
              >
                <textarea
                  rows={3}
                  className={textareaClass}
                  value={data.staSamVideo}
                  onChange={(e) => update("staSamVideo", e.target.value)}
                  placeholder="Primer: U 14:20 nepoznato lice je ušlo iza paravana sa dva glasačka listića i zadržalo se duže od 3 minuta..."
                />
              </Field>

              <Field
                label="Koja radnja je sporna (predmet povrede)"
                hint="Sažeto označi nepravilnost"
              >
                <textarea
                  rows={2}
                  className={textareaClass}
                  value={data.spornaRadnja}
                  onChange={(e) => update("spornaRadnja", e.target.value)}
                  placeholder="Primer: Narušavanje tajnosti glasanja / glasanje van paravana / prisustvo neovlašćenih lica"
                />
              </Field>

              <Field
                label="Ko je sve mogao da vidi ili potvrdi događaj"
                hint="Svedoci, posmatrači, članovi odbora"
              >
                <input
                  className={inputClass}
                  value={data.koJeVideo}
                  onChange={(e) => update("koJeVideo", e.target.value)}
                  placeholder="npr. Prisutni članovi biračkog odbora iz opozicije, posmatrač CRTA..."
                />
              </Field>
            </CardBody>
          </Card>

          {/* SECTION 3: REAKCIJA ODBORA I PRAVNI OSNOV */}
          <Card className="overflow-hidden shadow-sm">
            <div className="border-b border-border bg-surface-2/70 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand">
                  3
                </span>
                <h2 className="text-sm font-bold text-ink">
                  Reakcija odbora i Pravni osnov
                </h2>
              </div>
            </div>
            <CardBody className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Odbor upozoren?">
                  <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface-2 p-1 text-xs">
                    {(["da", "ne", "nije primenljivo"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => update("odborUpozoren", opt)}
                        className={cn(
                          "rounded-lg py-1.5 font-medium capitalize transition-all",
                          data.odborUpozoren === opt
                            ? "bg-surface text-ink font-bold shadow-sm"
                            : "text-ink-faint hover:text-ink"
                        )}
                      >
                        {opt === "nije primenljivo" ? "N/P" : opt}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Nepravilnost prestala?">
                  <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface-2 p-1 text-xs">
                    {(["da", "ne", "nije primenljivo"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => update("nepravilnostPrestala", opt)}
                        className={cn(
                          "rounded-lg py-1.5 font-medium capitalize transition-all",
                          data.nepravilnostPrestala === opt
                            ? "bg-surface text-ink font-bold shadow-sm"
                            : "text-ink-faint hover:text-ink"
                        )}
                      >
                        {opt === "nije primenljivo" ? "N/P" : opt}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Primedba u zapisnik?">
                  <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface-2 p-1 text-xs">
                    {(["da", "ne", "nije primenljivo"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => update("primedbaTrazena", opt)}
                        className={cn(
                          "rounded-lg py-1.5 font-medium capitalize transition-all",
                          data.primedbaTrazena === opt
                            ? "bg-surface text-ink font-bold shadow-sm"
                            : "text-ink-faint hover:text-ink"
                        )}
                      >
                        {opt === "nije primenljivo" ? "N/P" : opt}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <Field
                label="Relevantan propis ili član zakona (opciono)"
                hint="Član ZINP ili Krivičnog zakonika"
              >
                <input
                  className={inputClass}
                  value={data.propis}
                  onChange={(e) => update("propis", e.target.value)}
                  placeholder="npr. ZINP čl. 93 st. 2 ili KZ čl. 156"
                />
              </Field>

              <Field label="Dodatna napomena (opciono)">
                <textarea
                  rows={2}
                  className={textareaClass}
                  value={data.napomena}
                  onChange={(e) => update("napomena", e.target.value)}
                  placeholder="Bilo kakve dodatne okolnosti (npr. intervencija policije, odbijanje predsednika da potpiše...)"
                />
              </Field>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-faint hover:text-sev-teska"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Isprazni formu
                </button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* RIGHT COLUMN: GENERATED CHRONOLOGY & ACTIONS (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          <Card className="sticky top-24 overflow-hidden shadow-md ring-1 ring-border/50">
            <div className="flex items-center justify-between border-b border-border bg-surface-2/80 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                  Službena zabeleška / Hronologija
                </h3>
              </div>
              <span className="rounded-full bg-sev-dozvoljeno/10 px-2 py-0.5 text-[11px] font-bold text-sev-dozvoljeno">
                Spremno za zapisnik
              </span>
            </div>

            <CardBody className="space-y-4 p-5">
              {/* Document display preview */}
              <div className="relative rounded-xl border border-border/80 bg-surface p-4 shadow-inner">
                <div className="mb-2 flex items-center justify-between border-b border-border/60 pb-2 text-[11px] font-semibold text-ink-faint uppercase tracking-wider">
                  <span>Izborna Nepravilnost</span>
                  <span>{data.opstina || "Srbija"} · BM {data.brojMesta || "—"}</span>
                </div>
                <pre className="max-h-[380px] overflow-y-auto whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed text-ink selection:bg-brand/20">
                  {chronology}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={copy}
                  className="w-full justify-center text-xs font-semibold"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-sev-dozvoljeno" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Kopirano!" : "Kopiraj tekst"}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={downloadTxt}
                  className="w-full justify-center text-xs font-semibold"
                >
                  <FileDown className="h-4 w-4" />
                  Preuzmi .txt
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={shareNativeOrWhatsapp}
                  className="w-full justify-center text-xs font-semibold"
                >
                  <Share2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Pošalji na WhatsApp
                </Button>

                <Button
                  variant={saveSuccess ? "secondary" : "primary"}
                  size="sm"
                  onClick={saveLocally}
                  className="w-full justify-center text-xs font-semibold"
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-sev-dozvoljeno" />
                      Sačuvano!
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Sačuvaj na uređaju
                    </>
                  )}
                </Button>
              </div>

              {/* Legal Warning Box */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs text-ink-dim">
                <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Važna napomena za kontrolore</span>
                </div>
                <p className="mt-1 leading-relaxed">
                  Zahtevajte da se ova beleška unese u <strong>Zapisnik o radu biračkog odbora</strong> u odeljku za primedbe pre potpisivanja. Ako predsednik odbora odbije unos, to takođe navedite u primedbi pre nego što potpišete zapisnik uz izdvojeno mišljenje.
                </p>
              </div>
            </CardBody>
          </Card>

          {/* SAVED INCIDENTS LIST */}
          {saved.length > 0 && (
            <Card className="overflow-hidden shadow-sm">
              <div className="flex items-center justify-between border-b border-border bg-surface-2/70 px-5 py-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                  Sačuvani incidenti na uređaju ({saved.length})
                </h3>
                <button
                  onClick={clearAllSaved}
                  className="text-xs text-ink-faint hover:text-sev-teska"
                >
                  Obriši sve
                </button>
              </div>
              <CardBody className="p-3">
                <div className="max-h-[320px] space-y-2 overflow-y-auto">
                  {saved.map((s) => (
                    <div
                      key={s.id}
                      className="group flex flex-col gap-2 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-brand/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] font-bold text-ink">
                              BM {s.data.brojMesta || "?"}
                            </span>
                            <span className="text-xs font-medium text-ink-dim">
                              {s.data.opstina || "Bez opštine"}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-1 text-xs text-ink-faint">
                            {s.data.spornaRadnja || s.data.staSamVideo || "Nema opisa radnje"}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] text-ink-faint">
                          {new Date(s.createdAt).toLocaleTimeString("sr-RS", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                        <button
                          onClick={() => loadSavedEntry(s.data)}
                          className="font-semibold text-brand hover:underline"
                        >
                          Učitaj u formu
                        </button>
                        <button
                          onClick={() => removeSaved(s.id)}
                          className="text-ink-faint hover:text-sev-teska"
                          aria-label="Obriši zapis"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
