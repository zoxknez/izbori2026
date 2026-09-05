"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-brand">Došlo je do greške</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">Stranica trenutno nije dostupna</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-dim">
        Pokušajte ponovo. Ako se problem ponavlja, proverite da li je sadržaj aplikacije ažuriran.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink"
      >
        Pokušaj ponovo
      </button>
    </main>
  );
}
