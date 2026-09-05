"use client";

import { useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";

export function DeadlinesCalculator() {
  // Generic calculator: the legal trigger differs by remedy.
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const sunday = new Date(today);
    // nearest or current date formatted
    const y = sunday.getFullYear();
    const m = String(sunday.getMonth() + 1).padStart(2, "0");
    const d = String(sunday.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [startTime, setStartTime] = useState("20:00");

  const startTimestamp = new Date(`${startDate}T${startTime}:00`);

  // Step 1: 72h to submit objection to OIK/RIK
  const objectionDeadline = new Date(startTimestamp.getTime() + 72 * 60 * 60 * 1000);

  // Step 2: 72h for commission to decide
  const decisionDeadline = new Date(objectionDeadline.getTime() + 72 * 60 * 60 * 1000);

  // Step 3: 72h to appeal to court
  const courtAppealDeadline = new Date(decisionDeadline.getTime() + 72 * 60 * 60 * 1000);

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
                Orijentacioni kalkulator roka od 72 časa
              </h3>
              <p className="text-xs text-ink-dim">
                Unesite početni momenat relevantan za konkretan rok, pa proverite merodavni propis i prijem dokumenta.
              </p>
            </div>
          </div>
        </div>
      </div>

      <CardBody className="space-y-6 p-5 sm:p-6">
        {/* Input row */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-2 p-3">
          <span className="text-xs font-semibold text-ink">
            Početni momenat roka:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 rounded-lg border border-border bg-surface px-2.5 text-xs text-ink focus:border-brand focus:outline-none"
            />
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-9 rounded-lg border border-border bg-surface px-2.5 text-xs text-ink focus:border-brand focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setStartTime("20:00");
            }}
            className="rounded-lg bg-surface px-2.5 py-1.5 text-xs font-semibold text-brand hover:bg-brand/10 transition-colors"
          >
            Postavi vreme na 20:00
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
                1. Zahtev za poništavanje glasanja
                </span>
                <span className="rounded-full bg-rose-600/10 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                  Prekluzivan rok: 72 časa
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-ink">
                Ističe: {formatDate(objectionDeadline)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-dim">
                Po članu 148. ZINP, zahtev se podnosi u roku od 72 časa od zatvaranja biračkog mesta; birač ga podnosi za BM na kom je upisan, a proglašena izborna lista za bilo koje BM zbog nepravilnosti tokom glasanja.
              </p>
            </div>
          </div>

          {/* Step 2: Odluka komisije */}
          <div className="relative flex items-start gap-3 sm:gap-4 pl-8 sm:pl-10">
            <div className="absolute left-2.5 sm:left-3.5 top-1 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-amber-500 ring-4 ring-surface" />
            <div className="flex-1 rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  2. Rok za odluku po zahtevu
                </span>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-ink-dim">
                  72 časa od prijema
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-ink">
                Maksimalno do: {formatDate(decisionDeadline)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-dim">
                Nadležna izborna komisija odlučuje o zahtevu u roku od 72 časa od njegovog prijema i objavljuje rešenje. Nadležnost zavisi od toga da li se glasa u zemlji ili u inostranstvu.
              </p>
            </div>
          </div>

          {/* Step 3: Žalba Sudu */}
          <div className="relative flex items-start gap-3 sm:gap-4 pl-8 sm:pl-10">
            <div className="absolute left-2.5 sm:left-3.5 top-1 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-brand ring-4 ring-surface" />
            <div className="flex-1 rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-brand">
                  3. Rok za žalbu Upravnom sudu
                </span>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-ink-dim">
                  72 časa od prijema rešenja
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-ink">
                Orijentaciono: 72 časa od unetog početnog momenta
              </p>
              <p className="mt-2 rounded-lg bg-brand/5 px-2.5 py-2 text-xs font-semibold text-brand">
                Okvirni krajnji termin: {formatDate(courtAppealDeadline)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-dim">
                U postupku po prigovoru, žalba Upravnom sudu podnosi se u roku od 72 časa od objavljivanja rešenja Republičke izborne komisije, preko RIK-a (čl. 156. ZINP).
              </p>
            </div>
          </div>

          {/* Step 4: Odluka Suda */}
          <div className="relative flex items-start gap-3 sm:gap-4 pl-8 sm:pl-10">
            <div className="absolute left-2.5 sm:left-3.5 top-1 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-emerald-600 ring-4 ring-surface" />
            <div className="flex-1 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  4. Odluka Upravnog suda
                </span>
                <span className="rounded-full bg-emerald-600/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  72 časa od prijema spisa
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-ink">
                Odluka u roku od 72 časa od prijema žalbe sa spisima
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-dim">
                Upravni sud odlučuje po žalbi u roku od 72 časa od prijema žalbe sa spisima; odluka doneta u ovom postupku je pravnosnažna.
              </p>
            </div>
          </div>
        </div>

        {/* Warning banner */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="text-xs text-ink-dim leading-relaxed">
                <strong className="text-ink">Važno:</strong> Ovo je samo računanje 72 časa od unetog početka, a ne utvrđivanje da li se taj rok primenjuje na vaš slučaj. Početak roka, način dostavljanja, nadležni organ i pravni lek proverite u važećem propisu ili sa pravnikom. Sačuvajte dokaz o predaji sa tačnim vremenom.
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
