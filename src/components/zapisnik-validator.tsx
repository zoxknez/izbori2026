"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, CircleCheck, CircleX, Calculator } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ListaGlasova {
  id: string;
  naziv: string;
  glasova: string;
}

function toInt(v: string): number | null {
  if (v.trim() === "") return 0;
  if (!/^\d+$/.test(v.trim())) return null;
  return parseInt(v, 10);
}

function Field({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const parsed = toInt(value);
  const invalid = value !== "" && parsed === null;
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className={cn(
          "mt-1.5 h-11 w-full rounded-xl border bg-surface px-3.5 text-sm text-ink focus:outline-none focus:ring-2",
          invalid
            ? "border-sev-teska/50 focus:ring-sev-teska/20"
            : "border-border focus:border-brand/50 focus:ring-brand/20"
        )}
      />
      <span className="mt-1 block text-xs text-ink-faint">{hint}</span>
    </label>
  );
}

function ResultRow({
  ok,
  title,
  formula,
  explanation,
  legal,
}: {
  ok: boolean | null;
  title: string;
  formula: string;
  explanation: string;
  legal: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4",
        ok === null
          ? "border-border bg-surface-2"
          : ok
          ? "border-sev-dozvoljeno/30 bg-sev-dozvoljeno/[0.06]"
          : "border-sev-ponistavanje/30 bg-sev-ponistavanje/[0.06]"
      )}
    >
      {ok === null ? (
        <Calculator className="mt-0.5 h-5 w-5 shrink-0 text-ink-faint" />
      ) : ok ? (
        <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-sev-dozvoljeno" />
      ) : (
        <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-sev-ponistavanje" />
      )}
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-0.5 font-mono text-xs text-ink-faint">{formula}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">
          {ok === false ? explanation : ok === true ? "Provera prolazi — nema neslaganja po ovom pravilu." : "Unesi brojeve da vidiš rezultat."}
        </p>
        {ok === false && <p className="mt-1.5 text-xs font-medium text-sev-ponistavanje">{legal}</p>}
      </div>
    </div>
  );
}

export function ZapisnikValidator() {
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

  const allEntered = R !== "" || U !== "" || G !== "" || B !== "" || N !== "" || V !== "";
  const hasInvalid = Object.values(values).some((v) => (Array.isArray(v) ? v.some((x) => x === null) : v === null));

  const ruleA = allEntered && !hasInvalid && values.B !== null && values.G !== null ? values.B <= values.G : null;
  const ruleB =
    allEntered && !hasInvalid && values.U !== null && values.B !== null && values.R !== null
      ? values.U + values.B <= values.R
      : null;
  const ruleC =
    allEntered && !hasInvalid && values.N !== null && values.V !== null && values.B !== null
      ? values.N + values.V === values.B
      : null;
  const sumListe = values.liste.every((v) => v !== null) ? values.liste.reduce((a, b) => a + (b ?? 0), 0) : null;
  const ruleD = allEntered && !hasInvalid && sumListe !== null && values.V !== null ? sumListe === values.V : null;

  const anyFail = [ruleA, ruleB, ruleC, ruleD].some((r) => r === false);

  function addLista() {
    setListe((prev) => [...prev, { id: crypto.randomUUID(), naziv: `Lista ${prev.length + 1}`, glasova: "" }]);
  }
  function removeLista(id: string) {
    setListe((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-bold">Podaci sa biračkog mesta</h2>
          <p className="mt-1 text-sm text-ink-dim">Unesi brojeve tačno onako kako stoje u zapisniku.</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Primljeno listića (R)" hint="Ukupno primljeno od komisije" value={R} onChange={setR} />
            <Field label="Neupotrebljeno (U)" hint="Ostalo neiskorišćeno" value={U} onChange={setU} />
            <Field label="Birača glasalo (G)" hint="Prema potpisima u izvodu" value={G} onChange={setG} />
            <Field label="Listića u kutiji (B)" hint="Prebrojano pri otvaranju" value={B} onChange={setB} />
            <Field label="Nevažećih (N)" hint="Od listića u kutiji" value={N} onChange={setN} />
            <Field label="Važećih (V)" hint="Od listića u kutiji" value={V} onChange={setV} />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">Glasovi po listama</span>
              <button
                onClick={addLista}
                className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Dodaj listu
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {liste.map((l) => (
                <div key={l.id} className="flex items-center gap-2">
                  <input
                    value={l.naziv}
                    onChange={(e) =>
                      setListe((prev) => prev.map((p) => (p.id === l.id ? { ...p, naziv: e.target.value } : p)))
                    }
                    className="h-10 w-32 shrink-0 rounded-lg border border-border bg-surface px-3 text-sm text-ink focus:border-brand/50 focus:outline-none"
                  />
                  <input
                    inputMode="numeric"
                    placeholder="0"
                    value={l.glasova}
                    onChange={(e) =>
                      setListe((prev) => prev.map((p) => (p.id === l.id ? { ...p, glasova: e.target.value } : p)))
                    }
                    className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-ink focus:border-brand/50 focus:outline-none"
                  />
                  <button
                    onClick={() => removeLista(l.id)}
                    disabled={liste.length <= 1}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-surface-2 hover:text-sev-teska disabled:opacity-30"
                    aria-label={`Ukloni ${l.naziv}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
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
            }}
            className="w-full"
          >
            Resetuj sve podatke
          </Button>
        </CardBody>
      </Card>

      <div className="space-y-3">
        {anyFail && (
          <div className="rounded-xl border border-sev-ponistavanje/40 bg-sev-ponistavanje/10 p-4">
            <p className="font-bold text-sev-ponistavanje">🚨 Uočeno je automatsko zakonsko neslaganje</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-dim">
              Bar jedno pravilo nije prošlo proveru. Proveri unete brojeve, a ako su tačni — ovo je
              zakonski osnov za poništavanje glasanja na biračkom mestu po službenoj dužnosti.
            </p>
          </div>
        )}
        <ResultRow
          ok={ruleA}
          title="Pravilo A — Listića u kutiji ne sme biti više nego birača"
          formula="B ≤ G"
          explanation="Broj listića u kutiji veći je od broja birača koji su glasali."
          legal="Zakonski osnov za poništavanje glasanja po službenoj dužnosti (ZINP, čl. 116)."
        />
        <ResultRow
          ok={ruleB}
          title="Pravilo B — Neupotrebljeni + kutija ne sme biti više od primljenih"
          formula="U + B ≤ R"
          explanation="Zbir neupotrebljenih listića i listića iz kutije veći je od broja primljenih listića."
          legal="Zakonski osnov za poništavanje glasanja po službenoj dužnosti (ZINP, čl. 116)."
        />
        <ResultRow
          ok={ruleC}
          title="Pravilo C — Važeći + nevažeći moraju biti jednaki broju listića u kutiji"
          formula="N + V = B"
          explanation="Zbir važećih i nevažećih listića ne odgovara broju listića pronađenih u kutiji."
          legal="Logičko-računska greška — proveriti razvrstavanje listića pre zaključivanja zapisnika."
        />
        <ResultRow
          ok={ruleD}
          title="Pravilo D — Zbir glasova po listama mora biti jednak broju važećih"
          formula="Σ (L1..Ln) = V"
          explanation="Zbir glasova svih lista ne odgovara ukupnom broju važećih listića."
          legal="Logičko-računska greška — prebrojati glasove po listama ponovo pre potpisivanja zapisnika."
        />
      </div>
    </div>
  );
}
