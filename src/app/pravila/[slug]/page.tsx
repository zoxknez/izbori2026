import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getAllRules, getRuleBySlug } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { RuleDetail } from "@/components/rule-detail";

export const revalidate = 3600;

export async function generateStaticParams() {
  const rules = await getAllRules();
  return rules.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const rule = await getRuleBySlug(slug);
  if (!rule) return {};
  return {
    title: rule.naziv,
    description: rule.summary,
    alternates: { canonical: `/pravila/${rule.slug}` },
  };
}

export default async function RuleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const allRules = await getAllRules();
  const rule = allRules.find((item) => item.slug === slug);
  if (!rule) notFound();

  const related = allRules.filter((item) => rule.relatedSlugs.includes(item.slug));

  return (
    <Container className="py-8 sm:py-12">
      <Link
        href="/pravila"
        className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-surface-2/60 px-3.5 py-2 text-xs font-semibold text-ink-dim hover:border-brand/40 hover:bg-surface-2 hover:text-brand transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Nazad na bazu nepravilnosti
      </Link>
      <div className="mt-6">
        <RuleDetail rule={rule} related={related} />
      </div>
    </Container>
  );
}
