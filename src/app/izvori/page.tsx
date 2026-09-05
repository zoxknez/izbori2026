import { ExternalLink } from "lucide-react";
import { getSources } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";

export const revalidate = 3600;

export const metadata = {
  title: "Izvori",
  description: "Zvanični i institucionalni izvori na koje se oslanja ovaj vodič.",
};

const TIER_LABEL: Record<number, string> = {
  1: "Tier 1 — normativni i zvanični izvori",
  2: "Tier 2 — pravna i institucionalna analiza",
  3: "Tier 3 — monitoring i posmatračke misije",
};

export default async function IzvoriPage() {
  const sources = await getSources();
  const grouped = sources.reduce<Record<number, typeof sources>>((acc, s) => {
    (acc[s.tier] ??= []).push(s);
    return acc;
  }, {});

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">Izvori</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-dim">
        Ovaj vodič se oslanja isključivo na zvanične propise, institucionalne izvore i
        akreditovane posmatračke misije — nikada na pojedinačnu političku stranku kao jedini
        izvor za pravnu klasifikaciju.
      </p>

      <div className="mt-8 space-y-8">
        {Object.entries(grouped).map(([tier, items]) => (
          <div key={tier}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
              {TIER_LABEL[Number(tier)] ?? `Tier ${tier}`}
            </h2>
            <div className="mt-3 space-y-3">
              {items.map((s) => (
                <Card key={s.id}>
                  <CardBody className="pt-5">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start justify-between gap-3 group"
                    >
                      <div>
                        <p className="font-semibold text-ink group-hover:text-brand">{s.label}</p>
                        {s.description && (
                          <p className="mt-1 text-sm leading-relaxed text-ink-dim">{s.description}</p>
                        )}
                      </div>
                      <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-ink-faint group-hover:text-brand" />
                    </a>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
