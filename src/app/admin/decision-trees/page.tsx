import { redirect } from "next/navigation";
import { getDecisionTrees } from "@/lib/data";
import { AdminDecisionTreeEditor } from "@/components/admin-decision-tree-editor";
import { getCurrentAdmin } from "@/lib/domain/admin/server-auth";

export const dynamic = "force-dynamic";

export default async function AdminDecisionTreesPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const trees = await getDecisionTrees();
  return <main className="mx-auto max-w-6xl px-5 py-12"><p className="text-xs font-bold uppercase tracking-wider text-brand">Admin / decision trees</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Editor decision-tree vodiča</h1><p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-dim">Metapodaci i workflow statusi stabala se čuvaju u bazi. Čvorovi se prikazuju iz formalnog grafa kako bi impact i stale propagation ostali proverljivi.</p><div className="mt-8"><AdminDecisionTreeEditor trees={trees} role={admin.role} /></div></main>;
}
