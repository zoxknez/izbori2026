"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bot,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ZMAI_ORIGIN = "https://zmai.crta.rs";

export function ZmaiEmbed() {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Detekcija dužeg učitavanja (moguća CSP / frame-ancestors restrikcija)
  useEffect(() => {
    setIsLoading(true);
    setLoadTimedOut(false);

    const timer = setTimeout(() => {
      // Ako nakon 7 sekundi još uvek nije okinut onLoad, ponudi brzi fallback
      setLoadTimedOut(true);
    }, 7000);

    return () => clearTimeout(timer);
  }, [iframeKey]);

  const handleRefresh = () => {
    setIsLoading(true);
    setLoadTimedOut(false);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="flex h-[calc(100dvh-7rem)] sm:h-[calc(100dvh-3.5rem)] w-full flex-col overflow-hidden bg-canvas">
      {/* 1. MINIMALNI KONTROLNI HEADER */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-surface/90 px-4 py-2.5 backdrop-blur sm:px-6">
        {/* Leva strana: Naslov i bedž sa jasnom atribucijom */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-400 shadow-sm shrink-0">
            <Bot className="h-5 w-5 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-ink tracking-tight">
                ZmAI - CRTA izborni asistent
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-400">
                <Sparkles className="h-3 w-3" />
                AI servis
              </span>
            </div>
            <p className="text-[11px] text-ink-dim flex items-center gap-1.5">
              <span>AI asistent za pitanja o izbornom procesu</span>
              <span className="text-border-strong">•</span>
              <span className="font-medium text-ink-faint">Razvija <strong>CRTA</strong></span>
            </p>
          </div>
        </div>

        {/* Desna strana: Status i akcije */}
        <div className="flex items-center gap-2">
          {/* Status indikator */}
          <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface-2/60 px-2.5 py-1 text-[11px] text-ink-dim">
            {isLoading ? (
              <>
                <div className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                <span>Povezivanje...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Uživo sa zmai.crta.rs</span>
              </>
            )}
          </div>

          {/* Pomoć / Uputstvo */}
          <button
            type="button"
            onClick={() => setShowHelp((prev) => !prev)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl border transition-all text-xs",
              showHelp
                ? "border-sky-500/50 bg-sky-500/20 text-sky-400"
                : "border-border bg-surface-2 text-ink-dim hover:text-ink hover:border-border-strong"
            )}
            title="Informacije o prikazu i bezbednosnim polisama"
            aria-label="Pomoć i tehničke informacije"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Osveži iframe */}
          <button
            type="button"
            onClick={handleRefresh}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-surface-2 text-ink-dim hover:text-ink hover:border-brand/50 transition-all text-xs"
            title="Ponovo učitaj ZmAI"
            aria-label="Ponovo učitaj ZmAI asistent"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* Otvori u novom tabu */}
          <a
            href={ZMAI_ORIGIN}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-brand/40 bg-brand/10 px-3 text-xs font-bold text-brand hover:bg-brand/20 hover:border-brand/60 transition-all shadow-sm"
            title="Otvori originalni ZmAI na zvaničnom domenu zmai.crta.rs"
          >
            <span>Otvori u novom tabu</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-80" />
          </a>
        </div>
      </div>

      {/* 2. TEHNIČKA NAPOMENA / FALLBACK BANER */}
      {(showHelp || loadTimedOut) && (
        <div className="border-b border-border/80 bg-surface-2/95 px-4 py-3 text-xs text-ink transition-all">
          <div className="mx-auto flex max-w-5xl flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-ink">
                  Prikaz originalnog servisa <code className="rounded bg-surface px-1 py-0.5 text-sky-300 font-mono text-[11px]">{ZMAI_ORIGIN}</code>
                </p>
                <p className="text-ink-dim leading-relaxed">
                  Ako vaš pregledač blokira prikaz usled zaštite od ugnježdavanja (CSP / frame-ancestors), kliknite na dugme desno za nesmetano korišćenje u punom prozoru.
                </p>
                <p className="text-[11px] text-ink-faint font-mono">
                  Zahtev za embed: <span className="text-brand">frame-ancestors &apos;self&apos; https://izborilegalnost.vercel.app;</span>
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <a
                href={ZMAI_ORIGIN}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-brand-ink hover:opacity-90 shadow-sm"
              >
                Otvori zmai.crta.rs
              </a>
              {showHelp && (
                <button
                  type="button"
                  onClick={() => setShowHelp(false)}
                  className="rounded-xl border border-border px-2.5 py-1.5 text-xs font-medium text-ink-dim hover:text-ink hover:bg-surface"
                >
                  Sakrij
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. GLAVNA ZONA ZA IFRAME I SKELETON */}
      <div className="relative flex-1 w-full overflow-hidden bg-surface">
        {/* Loading Skeleton dok se zmai.crta.rs učitava */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-canvas/95 p-6 backdrop-blur-sm">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-500/40 bg-sky-500/10 text-sky-400 shadow-xl">
              <Bot className="h-8 w-8 animate-bounce" />
              <div className="absolute -inset-1 rounded-2xl bg-sky-500/20 blur-md -z-10 animate-pulse" />
            </div>

            <div className="text-center space-y-1.5 max-w-sm">
              <h2 className="text-sm font-bold text-ink">
                Učitavanje ZmAI asistenta...
              </h2>
              <p className="text-xs text-ink-dim">
                Uspostavljanje bezbedne veze sa zvaničnim servisom <span className="text-sky-400 font-medium">zmai.crta.rs</span>
              </p>
            </div>

            {/* Simulirani animirani skeleton redovi */}
            <div className="w-full max-w-md space-y-2.5 mt-2 opacity-60">
              <div className="h-10 w-3/4 rounded-xl bg-surface-2 animate-pulse" />
              <div className="h-14 w-full rounded-xl bg-surface-2 animate-pulse delay-75" />
              <div className="h-10 w-1/2 rounded-xl bg-surface-2 animate-pulse delay-150" />
            </div>

            {/* Brzi link ako se oduži */}
            {loadTimedOut && (
              <div className="mt-4 flex flex-col items-center gap-2 animate-fade-in">
                <p className="text-xs text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Učitavanje traje duže nego obično?</span>
                </p>
                <a
                  href={ZMAI_ORIGIN}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-border bg-surface-2 px-3.5 py-1.5 text-xs font-semibold text-ink hover:text-brand hover:border-brand/40 shadow-sm"
                >
                  Otvori direktno na zmai.crta.rs →
                </a>
              </div>
            )}
          </div>
        )}

        {/* Originalni ZmAI iframe */}
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={ZMAI_ORIGIN}
          title="ZmAI - CRTA izborni asistent"
          className={cn(
            "h-full w-full border-0 bg-transparent transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          allow="clipboard-read; clipboard-write"
          loading="eager"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}
