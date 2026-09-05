import { getAllRules } from "@/lib/data";
import { buildTrainingQuestions } from "@/lib/domain/training/generate-questions";
import { assertTrainingCoverage } from "@/lib/domain/training/coverage";
import { TrainingQuiz } from "@/components/training-quiz";
import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Trening i kviz izbornog dana",
  description: "Offline trening kroz izborna pravila sa adaptivnim ponavljanjem i praćenjem znanja.",
  alternates: { canonical: "/trening/kviz" },
};

export const revalidate = 3600;

export default async function TrainingQuizPage() {
  const rules = await getAllRules();
  const questions = buildTrainingQuestions(rules);
  assertTrainingCoverage(rules, questions);
  return <Container className="py-8 sm:py-12"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-wider text-brand">Trening / Kviz engine</p><h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">Uvežbaj odluke pre izbornog dana</h1><p className="mt-3 text-base leading-relaxed text-ink-dim">Pitanja pokrivaju svako pravilo iz baze prema njegovoj težini. Rezultati i mastery ostaju na uređaju, pa trening radi i kada nema mreže.</p></div><div className="mt-8"><TrainingQuiz questions={questions} /></div></Container>;
}
