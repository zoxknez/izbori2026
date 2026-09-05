import Link from "next/link";
import { getAllRules } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { RuleCard } from "@/components/rule-card";

export const revalidate = 3600;

export const metadata = {
  title: "Glasanje van biračkog mesta",
  description: "Poseban vodič za glasanje kod kuće zbog bolesti, starosti ili invaliditeta: ko ima pravo, ko sprovodi postupak i najčešće nepravilnosti.",
};

export default async function VanBirackogMestaPage() {
  const rules = await getAllRules();
  const vRules = rules.filter((r) => r.kategorija === "van_birackog_mesta");

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">Glasanje van biračkog mesta</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-dim">
        Pravo na glasanje van biračkog mesta imaju birači koji zbog teške bolesti, starosti ili
        invaliditeta ne mogu doći do biračkog mesta.
      </p>

      <Card className="mt-8">
        <CardBody className="space-y-4 pt-5">
          <div>
            <p className="text-sm font-semibold text-ink-faint">KO MOŽE DA ZATRAŽI</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-dim">
              Birač koji zbog teške bolesti, starosti ili invaliditeta ne može da glasa na
              biračkom mestu.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-faint">KADA SE PRIJAVLJUJE</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-dim">
              Lokalna izborna komisija može biti obaveštena najranije 72 časa pre dana glasanja i
              najkasnije do 11:00 na dan glasanja; birački odbor se obaveštava na dan glasanja do
              11:00.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-faint">KO DOLAZI KOD BIRAČA</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-dim">
              Tri člana biračkog odbora, imenovana na predlog različitih ovlašćenih predlagača.
              Proveravaju identitet i sprovode UV proveru, birač potpisuje potvrdu, dobija sprej, a
              zatim poverenici napuštaju prostoriju dok birač samostalno glasa.
            </p>
          </div>
        </CardBody>
      </Card>

      <h2 className="mt-10 text-lg font-bold text-ink">Crvene zastavice</h2>
      <p className="mt-1 text-sm text-ink-dim">
        Situacije koje treba odmah proveriti i, ako se potvrde, evidentirati.
      </p>
      <div className="mt-4 space-y-3">
        {vRules.map((r) => (
          <RuleCard key={r.id} rule={r} />
        ))}
      </div>

      <p className="mt-8 text-sm text-ink-dim">
        Opšte pravilo: ako nema potpisane potvrde o pravu glasanja van biračkog mesta, listić
        se ne ubacuje u kutiju. Vidi{" "}
        <Link href="/pravila/nema-potpisane-potvrde-kod-kuce" className="text-brand hover:underline">
          detaljno objašnjenje
        </Link>
        .
      </p>
    </Container>
  );
}
