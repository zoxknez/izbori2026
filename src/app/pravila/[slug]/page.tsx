import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAllRules, getRuleBySlug, getRulesByIds } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { RuleDetail } from "@/components/rule-detail";

export const revalidate = 3600;

export async function generateStaticParams() {
  const rules = await getAllRules();
  return rules.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rule = await getRuleBySlug(slug);
  if (!rule) return {};
  return {
    title: rule.naziv,
    description: rule.summary,
  };
}

export default async function RuleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rule = await getRuleBySlug(slug);
  if (!rule) notFound();

  const related = await getRulesByIds(
    (await getAllRules()).filter((r) => rule.relatedSlugs.includes(r.slug)).map((r) => r.id)
  );

  return (
    <Container className="py-8 sm:py-12">
      <Link href="/pravila" className="inline-flex items-center gap-1.5 text-sm text-ink-dim hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Nazad na bazu nepravilnosti
      </Link>
      <div className="mt-6">
        <RuleDetail rule={rule} related={related} />
      </div>
    </Container>
  );
}
