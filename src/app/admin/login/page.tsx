import { loginAction } from "./actions";

export const metadata = { title: "Admin prijava" };

export default function AdminLoginPage() {
  return <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-5 py-12"><form action={loginAction} className="w-full rounded-3xl border border-border bg-surface p-7 shadow-card"><p className="text-xs font-bold uppercase tracking-wider text-brand">Zaštićena zona</p><h1 className="mt-2 text-2xl font-extrabold text-ink">Admin prijava</h1><label className="mt-6 block text-sm font-semibold text-ink">Email<input name="email" type="email" required className="mt-2 h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm" /></label><label className="mt-4 block text-sm font-semibold text-ink">Lozinka<input name="password" type="password" required className="mt-2 h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm" /></label><button className="mt-6 h-11 w-full rounded-xl bg-brand text-sm font-bold text-brand-ink">Prijavi se</button></form></main>;
}
