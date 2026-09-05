import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border-soft pb-24 sm:pb-10">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-semibold text-ink">Izborna kontrola</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim">
              Nezavisan građanski vodič za prepoznavanje izbornih nepravilnosti u Srbiji. Nije
              povezan ni sa jednom političkom strankom ili organom vlasti.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Pravni presek</p>
            <p className="mt-2 text-sm text-ink-dim">Propisi provereni: 5. septembar 2026.</p>
            <p className="mt-1 text-sm text-ink-dim">
              <Link href="/izvori" className="underline decoration-border-soft underline-offset-4 hover:text-brand">
                Pogledaj sve zvanične izvore →
              </Link>
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Napomena</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim">
              Ovo nije pravni savet. Za konkretan slučaj obrati se lokalnoj izbornoj komisiji,
              advokatu ili nadležnom tužilaštvu.
            </p>
          </div>
        </div>
        <p className="mt-8 border-t border-border-soft pt-6 text-xs text-ink-faint">
          Podaci se čuvaju lokalno na tvom uređaju. Bez naloga, bez praćenja, bez javne baze
          optuženih lica.
        </p>
      </div>
    </footer>
  );
}
