"use client";

import { useState } from "react";
import { Copy, Check, Trash2, FileDown } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EMPTY_INCIDENT, generateChronology, type IncidentData } from "@/lib/incident";
import { PHASE_META, PHASE_ORDER } from "@/lib/phases";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "izborna-kontrola:incidenti";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20";
const textareaClass =
  "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20";
const selectClass = inputClass;

export function IncidentForm() {
  const [data, setData] = useState<IncidentData>(EMPTY_INCIDENT);
  const [saved, setSaved] = useState<{ id: string; createdAt: string; data: IncidentData }[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [copied, setCopied] = useState(false);

  function update<K extends keyof IncidentData>(key: K, value: IncidentData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  const chronology = generateChronology(data);

  function saveLocally() {
    const entry = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), data };
    const next = [entry, ...saved].slice(0, 30);
    setSaved(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* skladište nedostupno, hronologija je i dalje vidljiva na ekranu */
    }
  }

  function removeSaved(id: string) {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* skladište nedostupno */
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(chronology);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard nedostupan, tekst je i dalje selektovan u polju ispod */
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardBody className="space-y-4 pt-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Vrsta izbora">
              <select
                className={selectClass}
                value={data.vrstaIzbora}
                onChange={(e) => update("vrstaIzbora", e.target.value)}
              >
                <option value="narodni_poslanici">Narodni poslanici</option>
                <option value="predsednik">Predsednik Republike</option>
                <option value="lokalni">Lokalni izbori</option>
              </select>
            </Field>
            <Field label="Moja uloga">
              <select className={selectClass} value={data.uloga} onChange={(e) => update("uloga", e.target.value)}>
                <option value="birač">Birač</option>
                <option value="član biračkog odbora">Član biračkog odbora</option>
                <option value="akreditovani posmatrač">Akreditovani posmatrač</option>
              </select>
            </Field>
            <Field label="Opština/grad">
              <input
                className={inputClass}
                value={data.opstina}
                onChange={(e) => update("opstina", e.target.value)}
                placeholder="npr. Novi Sad"
              />
            </Field>
            <Field label="Broj biračkog mesta">
              <input
                className={inputClass}
                value={data.brojMesta}
                onChange={(e) => update("brojMesta", e.target.value)}
                placeholder="npr. 24"
              />
            </Field>
            <Field label="Datum">
              <input type="date" className={inputClass} value={data.datum} onChange={(e) => update("datum", e.target.value)} />
            </Field>
            <Field label="Vreme događaja">
              <input type="time" className={inputClass} value={data.vreme} onChange={(e) => update("vreme", e.target.value)} />
            </Field>
          </div>

          <Field label="Faza procesa">
            <select className={selectClass} value={data.faza} onChange={(e) => update("faza", e.target.value)}>
              {PHASE_ORDER.map((p) => (
                <option key={p} value={p}>
                  {PHASE_META[p]?.label ?? p}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Šta sam neposredno video/la">
            <textarea
              rows={3}
              className={textareaClass}
              value={data.staSamVideo}
              onChange={(e) => update("staSamVideo", e.target.value)}
              placeholder="Opiši samo ono što si lično video/la, ne pretpostavke."
            />
          </Field>

          <Field label="Koja radnja je sporna">
            <textarea
              rows={2}
              className={textareaClass}
              value={data.spornaRadnja}
              onChange={(e) => update("spornaRadnja", e.target.value)}
            />
          </Field>

          <Field label="Ko je mogao da vidi događaj">
            <textarea
              rows={2}
              className={textareaClass}
              value={data.koJeVideo}
              onChange={(e) => update("koJeVideo", e.target.value)}
              placeholder="Svedoci, članovi odbora, posmatrači..."
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Odbor upozoren?">
              <select
                className={selectClass}
                value={data.odborUpozoren}
                onChange={(e) => update("odborUpozoren", e.target.value as IncidentData["odborUpozoren"])}
              >
                <option value="nije primenljivo">Nije primenljivo</option>
                <option value="da">Da</option>
                <option value="ne">Ne</option>
              </select>
            </Field>
            <Field label="Nepravilnost prestala?">
              <select
                className={selectClass}
                value={data.nepravilnostPrestala}
                onChange={(e) => update("nepravilnostPrestala", e.target.value as IncidentData["nepravilnostPrestala"])}
              >
                <option value="nije primenljivo">Nije primenljivo</option>
                <option value="da">Da</option>
                <option value="ne">Ne</option>
              </select>
            </Field>
            <Field label="Primedba tražena?">
              <select
                className={selectClass}
                value={data.primedbaTrazena}
                onChange={(e) => update("primedbaTrazena", e.target.value as IncidentData["primedbaTrazena"])}
              >
                <option value="nije primenljivo">Nije primenljivo</option>
                <option value="da">Da</option>
                <option value="ne">Ne</option>
              </select>
            </Field>
          </div>

          <Field label="Relevantan propis (opciono)">
            <input
              className={inputClass}
              value={data.propis}
              onChange={(e) => update("propis", e.target.value)}
              placeholder="npr. ZINP, čl. 93"
            />
          </Field>

          <Field label="Dodatna napomena (opciono)">
            <textarea rows={2} className={textareaClass} value={data.napomena} onChange={(e) => update("napomena", e.target.value)} />
          </Field>
        </CardBody>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardBody className="pt-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
              Generisana hronologija
            </h2>
            <textarea
              readOnly
              value={chronology}
              rows={12}
              className="mt-3 w-full resize-none rounded-xl border border-border bg-surface-2 p-4 font-mono text-[13px] leading-relaxed text-ink"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={copy}>
                {copied ? <Check className="h-4 w-4 text-sev-dozvoljeno" /> : <Copy className="h-4 w-4" />}
                {copied ? "Kopirano" : "Kopiraj tekst"}
              </Button>
              <Button variant="primary" size="sm" onClick={saveLocally}>
                <FileDown className="h-4 w-4" />
                Sačuvaj lokalno na uređaju
              </Button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-faint">
              Ništa od ovoga se ne šalje na server. Hronologija se generiše i čuva isključivo u
              tvom pregledaču. Ne savetujemo fotografisanje unutrašnjosti biračkog mesta radi
              dokazivanja.
            </p>
          </CardBody>
        </Card>

        {saved.length > 0 && (
          <Card>
            <CardBody className="pt-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
                Sačuvano na ovom uređaju ({saved.length})
              </h2>
              <ul className="mt-3 space-y-2">
                {saved.map((s) => (
                  <li
                    key={s.id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm"
                    )}
                  >
                    <span className="truncate text-ink-dim">
                      {new Date(s.createdAt).toLocaleString("sr-RS")} · {s.data.opstina || "bez opštine"} BM{" "}
                      {s.data.brojMesta || "?"}
                    </span>
                    <button
                      onClick={() => removeSaved(s.id)}
                      className="shrink-0 text-ink-faint hover:text-sev-teska"
                      aria-label="Obriši zapis"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
