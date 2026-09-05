import Link from "next/link";
import { ShieldCheck, Lock } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-surface/50 pb-24 sm:pb-12 text-xs">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:gap-10 lg:grid-cols-5">
          {/* Column 1: Brand & Mission (Full width on mobile/tablet, span 2 on lg) */}
          <div className="col-span-2 space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand shrink-0">
                <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-base font-extrabold text-ink tracking-tight">
                  Izborna kontrola
                </span>
                <span className="ml-2 rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold text-brand">
                  2026
                </span>
              </div>
            </div>

            <p className="max-w-xl text-xs leading-relaxed text-ink-dim">
              Nezavisna građanska platforma za prepoznavanje, dokumentovanje i pravno procesuiranje izbornih nepravilnosti. Nije povezana ni sa jednim organom vlasti niti političkom partijom.
            </p>

            <div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                <span>Lokalna obrada · Podaci se ne šalju na server</span>
              </div>
            </div>

            <p className="max-w-xl text-[11px] text-ink-faint leading-relaxed">
              Poslednja verifikacija propisa: <strong className="text-ink">Septembar 2026.</strong> Usaglašeno sa Zakonom o izboru narodnih poslanika i aktuelnim uputstvima RIK-a.
            </p>
          </div>

          {/* Column 2: Operativni alati */}
          <div className="col-span-1 space-y-3">
            <p className="font-bold uppercase tracking-wider text-ink text-[11px]">
              Operativni alati
            </p>
            <ul className="space-y-2.5 text-ink-dim">
              <li>
                <Link href="/kontrolor" className="hover:text-brand transition-colors">
                  Checklista za kontrolore
                </Link>
              </li>
              <li>
                <Link href="/validator" className="hover:text-brand transition-colors">
                  Validator zapisnika (Čl. 116)
                </Link>
              </li>
              <li>
                <Link href="/van-birackog-mesta" className="hover:text-brand transition-colors">
                  Glasanje van biračkog mesta
                </Link>
              </li>
              <li>
                <Link href="/prijavi" className="hover:text-brand transition-colors">
                  Generator hronologije incidenta
                </Link>
              </li>
              <li>
                <Link href="/vidim-problem" className="font-semibold text-rose-600 dark:text-rose-400 hover:underline">
                  Hitno: Vidim problem sada
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Baza znanja & Propisi */}
          <div className="col-span-1 space-y-3">
            <p className="font-bold uppercase tracking-wider text-ink text-[11px]">
              Baza znanja i propisi
            </p>
            <ul className="space-y-2.5 text-ink-dim">
              <li>
                <Link href="/pravila" className="hover:text-brand transition-colors">
                  Baza svih nepravilnosti
                </Link>
              </li>
              <li>
                <Link href="/krivicna-dela" className="hover:text-brand transition-colors">
                  Krivična dela protiv izbora
                </Link>
              </li>
              <li>
                <Link href="/mit-ili-cinjenica" className="hover:text-brand transition-colors">
                  Mit ili činjenica (Kviz)
                </Link>
              </li>
              <li>
                <Link href="/rokovi" className="hover:text-brand transition-colors">
                  Kalkulator rokova od 72h
                </Link>
              </li>
              <li>
                <Link href="/izvori" className="hover:text-brand transition-colors">
                  Zvanični izvori i propisi RIK-a
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Hitni brojevi i institucije */}
          <div className="col-span-2 space-y-3 rounded-2xl border border-border/60 bg-surface/40 p-4 sm:border-0 sm:bg-transparent sm:p-0 lg:col-span-1">
            <p className="font-bold uppercase tracking-wider text-ink text-[11px]">
              Hitni kontakti i prijava
            </p>
            <ul className="space-y-2.5 text-ink-dim">
              <li className="flex items-center justify-between gap-2">
                <span>Policija (Incidenti/Krivična dela)</span>
                <span className="font-mono font-bold text-ink shrink-0">192</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span>Republička izborna komisija</span>
                <a
                  href="https://www.rik.parlament.gov.rs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand hover:underline inline-flex items-center gap-0.5 shrink-0"
                >
                  rik.parlament.gov.rs
                </a>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span>CRTA posmatračka misija</span>
                <a
                  href="https://crta.rs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand hover:underline inline-flex items-center gap-0.5 shrink-0"
                >
                  crta.rs
                </a>
              </li>
              <li className="pt-2 border-t border-border/60 text-[11px] text-ink-faint leading-tight">
                U slučaju fizičkog nasilja ili kupovine glasova na terenu, odmah obavestite policiju na 192 pre unosa primedbe u Zapisnik.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & disclaimer */}
        <div className="mt-12 flex flex-col gap-3 border-t border-border/80 pt-6 sm:flex-row sm:items-center sm:justify-between text-ink-faint text-[11px]">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Sistem je operativan za izbore u Republici Srbiji. Otvorenog koda za slobodnu upotrebu.</span>
          </div>

          <p className="text-[10px] leading-relaxed sm:text-right max-w-md">
            Ovaj portal pruža edukativne i pravno-informativne podatke i ne predstavlja formalno pravno zastupanje. Za podnošenje zvaničnih tužbi obratite se advokatu.
          </p>
        </div>
      </div>
    </footer>
  );
}
