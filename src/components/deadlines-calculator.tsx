"use client";

import { useState } from "react";
import { Clock, Calendar, AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DeadlinesCalculator() {
  // Default: Sunday 20:00
  const [closeDate, setCloseDate] = useState(() => {
    const today = new Date();
    const sunday = new Date(today);
    // nearest or current date formatted
    const y = sunday.getFullYear();
    const m = String(sunday.getMonth() + 1).padStart(2, "0");
    const d = String(sunday.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [closeTime, setCloseTime] = useState("20:00");

  const closeTimestamp = new Date(`${closeDate}T${closeTime}:00`);

  // Step 1: 72h to submit objection to OIK/RIK
  const objectionDeadline = new Date(closeTimestamp.getTime() + 72 * 60 * 60 * 1000);

  // Step 2: 72h for commission to decide
  const decisionDeadline = new Date(objectionDeadline.getTime() + 72 * 60 * 60 * 1000);

  // Step 3: 72h to appeal to court
  const courtAppealDeadline = new Date(decisionDeadline.getTime() + 72 * 60 * 60 * 1000);

  // Step 4: 72h for court judgment
  const courtJudgmentDeadline = new Date(courtAppealDeadline.getTime() + 72 * 60 * 60 * 1000);

  function formatDate(d: Date) {
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("sr-RS", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="border-b border-border bg-surface-2/70 px-5 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Clock className="h-4.5 w-4.5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-ink">
                Kalkulator zakonskih rokova (Pravilo 72 časa)
              </h3>
              <p className="text-xs text-ink-dim">
                Unesite tačan momenat zatvaranja biračkog mesta za izračunavanje svih pravnih rokova.
              </p>
            </div>
          </div>
        </div>
      </div>

      <CardBody className="space-y-6 p-5 sm:p-6">
        {/* Input row */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-2 p-3">
          <span className="text-xs font-semibold text-ink">
            Vreme zatvaranja biračkog mesta:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
              className="h-9 rounded-lg border border-border bg-surface px-2.5 text-xs text-ink focus:border-brand focus:outline-none"
            />
            <input
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="h-9 rounded-lg border border-border bg-surface px-2.5 text-xs text-ink focus:border-brand focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setCloseTime("20:00");
            }}
            className="rounded-lg bg-surface px-2.5 py-1.5 text-xs font-semibold text-brand hover:bg-brand/10 transition-colors"
          >
            Postavi na 20:00 (Redovno zatvaranje)
          </button>
        </div>

        {/* Timeline of 72h cycles */}
        <div className="relative space-y-4 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-border sm:before:left-5">
          {/* Step 1: Podnošenje zahteva */}
          <div className="relative flex items-start gap-3 sm:gap-4 pl-8 sm:pl-10">
            <div className="absolute left-2.5 sm:left-3.5 top-1 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-rose-600 ring-4 ring-surface" />
            <div className="flex-1 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  1. Rok za podnošenje prigovora / zahteva za poništavanje
                </span>
                <span className="rounded-full bg-rose-600/10 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                  Prekluzivan rok: 72 časa
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-ink">
                Ističe: {formatDate(objectionDeadline)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-dim">
                Birač (za svoje BM) ili podnosilac proglašene liste (za bilo koje BM) predaje zahtev lokalnoj izbornoj komisiji (OIK/GIK). Prekoračenje ovog roka za samo 1 minut znači automatsko odbacivanje.
              </p>
            </div>
          </div>

          {/* Step 2: Odluka komisije */}
          <div className="relative flex items-start gap-3 sm:gap-4 pl-8 sm:pl-10">
            <div className="absolute left-2.5 sm:left-3.5 top-1 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-amber-500 ring-4 ring-surface" />
            <div className="flex-1 rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  2. Rok za odluku izborne komisije
                </span>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-ink-dim">
                  72 časa od prijema
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-ink">
                Maksimalno do: {formatDate(decisionDeadline)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-dim">
                Lokalna izborna komisija donosi rešenje kojim usvaja zahtev i poništava glasanje, ili ga odbija/odbacuje. Ako ne donese odluku u roku, smatra se da je zahtev odbijen (ćutanje uprave).
              </p>
            </div>
          </div>

          {/* Step 3: Žalba Sudu */}
          <div className="relative flex items-start gap-3 sm:gap-4 pl-8 sm:pl-10">
            <div className="absolute left-2.5 sm:left-3.5 top-1 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-brand ring-4 ring-surface" />
            <div className="flex-1 rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-brand">
                  3. Rok za žalbu Višem sudu / Upravnom sudu
                </span>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-ink-dim">
                  72 časa od prijema rešenja
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-ink">
                Rok za žalbu: 72 časa od dostavljanja negativnog rešenja
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-dim">
                Protiv negativnog rešenja izborne komisije podnosi se žalba nadležnom sudu preko izborne komisije koja je donela rešenje.
              </p>
            </div>
          </div>

          {/* Step 4: Odluka Suda */}
          <div className="relative flex items-start gap-3 sm:gap-4 pl-8 sm:pl-10">
            <div className="absolute left-2.5 sm:left-3.5 top-1 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-emerald-600 ring-4 ring-surface" />
            <div className="flex-1 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  4. Pravosnažna odluka suda
                </span>
                <span className="rounded-full bg-emerald-600/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  72 časa od prijema spisa
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-ink">
                Sudska presuda je KONAČNA i izvršna
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-dim">
                Ako sud usvoji žalbu, poništava glasanje na tom biračkom mestu ili preinačuje odluku komisije. Protiv odluke suda nema daljeg redovnog pravnog leka.
              </p>
            </div>
          </div>
        </div>

        {/* Warning banner */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="text-xs text-ink-dim leading-relaxed">
            <strong className="text-ink">Pravilo računanja rokova:</strong> Rokovi u izbornom postupku računaju se na sate (član 104. ZINP). Ne primenjuju se opšta pravila o neradnim danima — rokovi teku i nedeljom i noću! Podnesak poslat poštom smatra se blagovremenim ako je predat pošti pre isteka roka (preporučena pošiljka sa tačnim vremenom na prijemnom listiću).
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
