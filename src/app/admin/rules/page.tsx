import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { getAllRules } from "@/lib/data";
import { AdminRuleEditor } from "@/components/admin-rule-editor";

export const dynamic = "force-dynamic";

export default async function AdminRulesPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  const rules = await getAllRules();
  return <main className="mx-auto max-w-6xl px-5 py-12"><p className="text-xs font-bold uppercase tracking-wider text-brand">Admin / content editor</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Editor pravila</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-dim">Izmene se čuvaju server-side uz RBAC i audit zapis. Za javnu/offline verziju i dalje je potreban validiran publish dataset-a.</p><div className="mt-8"><AdminRuleEditor rules={rules} role={session.user.role} /></div></main>;
}
