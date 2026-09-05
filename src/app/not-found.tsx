import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">Stranica nije pronađena</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-dim">
        Proverite adresu ili se vratite na početnu stranicu.
      </p>
      <Link href="/" className="mt-6 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink">
        Na početnu
      </Link>
    </main>
  );
}
