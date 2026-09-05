import { auth } from "../../../auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  return <main className="mx-auto max-w-5xl px-5 py-12"><p className="text-xs font-bold uppercase tracking-wider text-brand">Admin / dependency-aware content</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Kontrolna tabla</h1><p className="mt-3 text-sm text-ink-dim">Prijavljen: <strong>{session.user.email}</strong> · uloga: <strong>{session.user.role}</strong></p><div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-surface p-5"><p className="text-xs text-ink-faint">Objava</p><p className="mt-2 text-lg font-bold text-ink">Publish gate aktivan</p></div><div className="rounded-2xl border border-border bg-surface p-5"><p className="text-xs text-ink-faint">Dataset</p><p className="mt-2 text-lg font-bold text-ink">Hash + cross-reference</p></div><div className="rounded-2xl border border-border bg-surface p-5"><p className="text-xs text-ink-faint">Audit</p><p className="mt-2 text-lg font-bold text-ink">Append-only log</p></div></div></main>;
}
