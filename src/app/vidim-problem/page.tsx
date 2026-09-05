import { getAllRules } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { ProblemWizard } from "@/components/problem-wizard";

export const revalidate = 3600;

export const metadata = {
  title: "Vidim problem sada",
  description: "Interaktivna dijagnostika izborne nepravilnosti u tri koraka.",
};

export default async function VidimProblemPage() {
  const rules = await getAllRules();

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">Vidim problem sada</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-dim">
        Odgovori na dva kratka pitanja i dobij tačnu pravnu klasifikaciju situacije, šta odmah
        proveriti i šta konkretno da uradiš — u zavisnosti od toga da li si birač, član biračkog
        odbora ili posmatrač.
      </p>
      <div className="mt-8">
        <ProblemWizard rules={rules} />
      </div>
    </Container>
  );
}
