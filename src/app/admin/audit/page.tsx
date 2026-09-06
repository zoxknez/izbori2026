import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { hasPermission, type AdminRole } from "@/lib/domain/admin/rbac";
import { getCurrentAdmin } from "@/lib/domain/admin/server-auth";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (!hasPermission(admin.role as AdminRole, "audit:read")) redirect("/admin");
  const entries = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(100);
  return <main className="mx-auto max-w-6xl px-5 py-12"><p className="text-xs font-bold uppercase tracking-wider text-brand">Admin / audit</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Audit log</h1><p className="mt-3 text-sm text-ink-dim">Append-only poslednjih 100 promena, dostupno samo ulogama sa audit dozvolom.</p><div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-surface"><table className="w-full min-w-[48rem] text-left text-sm"><thead className="border-b border-border text-xs text-ink-faint"><tr><th className="p-3">Vreme</th><th className="p-3">Akcija</th><th className="p-3">Entitet</th><th className="p-3">Aktor</th></tr></thead><tbody className="divide-y divide-border/60">{entries.map((entry) => <tr key={entry.id}><td className="p-3 text-ink-dim">{entry.createdAt?.toISOString() ?? "-"}</td><td className="p-3 font-semibold text-ink">{entry.action}</td><td className="p-3 text-ink-dim">{entry.entityType} · {entry.entityId}</td><td className="p-3 text-ink-dim">{entry.actorUserId ?? "system"}</td></tr>)}</tbody></table></div></main>;
}
