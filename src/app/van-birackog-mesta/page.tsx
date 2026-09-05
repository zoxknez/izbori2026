import Link from "next/link";
import {
  Home,
  Users,
  Clock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ArrowRight,
  EyeOff,
  Mail,
  FileCheck,
  Check,
} from "lucide-react";
import { getAllRules } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { RuleCard } from "@/components/rule-card";

export const revalidate = 3600;

export const metadata = {
  title: "Glasanje van biračkog mesta (kod kuće)",
  description:
    "Kompletan vodič za glasanje kod kuće: ko ima pravo, rokovi do 11:00h, tročlani tim poverenika, tajnost glasanja i crvene zastavice.",
};

const STEPS = [
  {
    step: 1,
    title: "Prijava i evidentiranje birača",
    desc: "Birač (ili član porodice) prijavljuje se komisiji najranije 72h pre izbora, ili biračkom odboru na dan glasanja najkasnije do 11:00 časova. Posle 11:00h nove prijave su ZAKONSKI ZABRANJENE.",
    icon: Clock,
  },
  {
    step: 2,
    title: "Dolazak tima od tri poverenika",
    desc: "Na adresu birača OBAVEZNO dolaze tri člana biračkog odbora imenovana na predlog tri RAZLIČITA ovlašćena predlagača. Dolazak 1 ili 2 člana, ili članova iz iste stranke, je teška nepravilnost.",
    icon: Users,
  },
  {
    step: 3,
    title: "Provera identiteta i UV lampa",
    desc: "Poverenici proveravaju ličnu kartu ili pasoš birača sa fotografijom i JMBG. UV lampom se proverava desni kažiprst da birač već nije glasao, a zatim se sprejiše nakon potpisa.",
    icon: ShieldCheck,
  },
  {
    step: 4,
    title: "Potpisivanje službene Potvrde o glasanju",
    desc: "Birač se svojeručno potpisuje u izvod iz biračkog spiska i na posebnu Potvrdu o biračkom pravu za glasanje van biračkog mesta. Bez ovog potpisa, glas je nevažeći!",
    icon: FileCheck,
  },
  {
    step: 5,
    title: "Tajnost glasanja (Poverenici napuštaju sobu)",
    desc: "Poverenici daju listić biraču i MORAJU napustiti prostoriju dok birač glasa. Strogo je zabranjeno posmatranje, sugerisanje za koga da se glasa ili prisustvo trećih lica iza leđa.",
    icon: EyeOff,
  },
  {
    step: 6,
    title: "Službeni koverat i pečaćenje pred biračem",
    desc: "Birač presavija listić, stavlja ga u poseban neprovidan službeni koverat koji poverenici pečate sigurnosnim pečatom pred biračem. Koverat se nosi nazad na biračko mesto.",
    icon: Mail,
  },
];

export default async function VanBirackogMestaPage() {
  const rules = await getAllRules();
  const vRules = rules.filter((r) => r.kategorija === "van_birackog_mesta");

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 sm:pb-24">
      {/* Top Banner */}
      <section className="border-b border-border-soft bg-gradient-to-b from-surface/80 via-canvas to-canvas py-8 sm:py-14">
        <Container>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand">
              <Home className="h-3.5 w-3.5" />
              <span>Zakon o izboru narodnih poslanika · Čl. 72 i 73</span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Glasanje van biračkog mesta (kod kuće)
            </h1>

            <p className="mt-3 text-base leading-relaxed text-ink-dim sm:text-lg">
              Glasanje kod kuće je zakonom predviđeno isključivo za lica koja iz zdravstvenih razloga
              ne mogu da dođu na biračko mesto. Saznaj tačna pravila, ko sme da dođe kod birača i
              kako sprečiti zloupotrebe.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-faint">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-sev-dozvoljeno" />
                Obavezno tri poverenika iz različitih lista
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-sev-proveri" />
                Rok za prijavu: strogo do 11:00h
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* 1. Three Core Pillars Grid */}
      <Container>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Pillar 1 */}
          <div className="rounded-2xl border border-border/80 bg-surface/80 p-5 sm:p-6 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Home className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-ink">Ko ima pravo na glasanje kod kuće?</h3>
            <p className="mt-2 text-xs leading-relaxed text-ink-dim">
              Isključivo birači koji zbog <strong>teške bolesti, starosti ili invaliditeta</strong> nisu u stanju da lično dođu na biračko mesto.
            </p>
            <div className="mt-3 rounded-lg border border-sev-teska/20 bg-sev-teska/5 p-2 text-[11px] text-sev-teska">
              ❌ Nije dozvoljeno za one koji su na poslu, putu ili iz ličnih razloga ne žele da dođu na BM.
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-2xl border border-border/80 bg-surface/80 p-5 sm:p-6 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sev-proveri/10 text-sev-proveri">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-ink">Rokovi za prijavu (Strogo do 11:00h)</h3>
            <p className="mt-2 text-xs leading-relaxed text-ink-dim">
              Izbornoj komisiji: od 72 časa pre izbora. Biračkom odboru: na dan glasanja <strong>najkasnije do 11:00 časova</strong>.
            </p>
            <div className="mt-3 rounded-lg border border-sev-proveri/20 bg-sev-proveri/5 p-2 text-[11px] text-sev-proveri">
              ⚠️ Prijave primljene posle 11:00 časova su nezakonite i birački odbor ih NE SME prihvatiti!
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-2xl border border-border/80 bg-surface/80 p-5 sm:p-6 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-ink">Pravilo trojice poverenika</h3>
            <p className="mt-2 text-xs leading-relaxed text-ink-dim">
              Kod birača uvek idu <strong>tri člana biračkog odbora</strong>, imenovana na predlog tri <strong>različita ovlašćena predlagača</strong>.
            </p>
            <div className="mt-3 rounded-lg border border-sev-ponistavanje/20 bg-sev-ponistavanje/5 p-2 text-[11px] text-sev-ponistavanje">
              🚨 Ako dođu samo 1 ili 2 člana, ili sva tri iz iste koalicije — to je teška nepravilnost!
            </div>
          </div>
        </div>
      </Container>

      {/* 2. ZLATNO PRAVILO (Major Warning Banner) */}
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-sev-ponistavanje/40 bg-gradient-to-br from-sev-ponistavanje/15 via-surface-2/80 to-surface/90 p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sev-ponistavanje/20 text-sev-ponistavanje">
                <ShieldAlert className="h-7 w-7" />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-sev-ponistavanje/40 bg-sev-ponistavanje/15 px-3 py-0.5 text-xs font-bold text-sev-ponistavanje">
                  ZLATNO PRAVILO · Član 73. ZINP
                </div>
                <h2 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-ink">
                  Bez potpisane potvrde — listić se NE UZIMA U OBZIR!
                </h2>
                <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-ink-dim">
                  Ako se zapečaćeni koverat vrati na biračko mesto, a uz njega <strong>nema svojeručno potpisane Potvrde o biračkom pravu</strong> od strane birača, birački odbor <strong>NE SME</strong> otvoriti taj koverat niti ubaciti listić u glasačku kutiju! Listić se odlaže kao neupotrebljen, a primedba se unosi u zapisnik.
                </p>
              </div>
            </div>

            <Link
              href="/pravila/nema-potpisane-potvrde-kod-kuce"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-sev-ponistavanje px-5 py-3 text-xs font-bold text-canvas hover:bg-sev-ponistavanje/90 transition-colors shadow-lg shadow-sev-ponistavanje/20"
            >
              Pročitaj detaljno pravilo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Container>

      {/* 3. Step-by-Step Procedure Timeline */}
      <Container>
        <div className="rounded-3xl border border-border/80 bg-surface/80 p-6 sm:p-8 lg:p-10 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border-soft">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand">Proceduralni protokol</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
                Kako se zakonito glasa kod kuće (6 koraka)
              </h2>
              <p className="mt-1 text-sm text-ink-dim">
                Propisana procedura od prijave do vraćanja zapečaćenog koverta na biračko mesto.
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              Protokol poverenika
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="relative flex flex-col justify-between rounded-2xl border border-border/80 bg-surface-2/40 p-5 transition-all hover:border-brand/40 hover:bg-surface-2/70"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/15 text-xs font-bold text-brand">
                        0{s.step}
                      </span>
                      <Icon className="h-4.5 w-4.5 text-ink-faint" />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-ink leading-snug">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-ink-dim">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>

      {/* 4. Quick Field Checklist for Board Members Before Team Departs */}
      <Container>
        <div className="rounded-3xl border border-border/80 bg-surface/80 p-6 sm:p-8 shadow-xl">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-brand">Pre polaska sa biračkog mesta</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-ink">
              Kontrola poverenika u 30 sekundi (Za kontrolore na BM)
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-ink-dim">
              Pre nego što troje poverenika napuste prostoriju biračkog mesta, obavezno proveri ove 4 stavke:
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-surface-2/60 p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand/15 text-brand text-xs font-bold mt-0.5">
                1
              </span>
              <div>
                <strong className="text-xs sm:text-sm text-ink font-bold">Tačan broj listića (Ni listić više!):</strong>
                <p className="mt-1 text-xs text-ink-dim leading-relaxed">
                  Ako je prijavljeno npr. 6 birača, poverenici zadužuju TAČNO 6 glasačkih listića. Strogo je zabranjeno nositi &quot;rezervne&quot; listiće na teren!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-surface-2/60 p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand/15 text-brand text-xs font-bold mt-0.5">
                2
              </span>
              <div>
                <strong className="text-xs sm:text-sm text-ink font-bold">Tri člana iz različitih lista:</strong>
                <p className="mt-1 text-xs text-ink-dim leading-relaxed">
                  Proveri ko su poverenici. Ne smeju biti iz iste političke partije ili koalicije. Ako je predlog pristrasan, traži hitnu promenu sastava.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-surface-2/60 p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand/15 text-brand text-xs font-bold mt-0.5">
                3
              </span>
              <div>
                <strong className="text-xs sm:text-sm text-ink font-bold">Ispravna mobilna UV oprema:</strong>
                <p className="mt-1 text-xs text-ink-dim leading-relaxed">
                  Poverenici moraju poneti prenosivu UV lampu na baterije i UV sprej. Glasanje kod kuće bez UV provere i spreja je proceduralni prekršaj.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-surface-2/60 p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand/15 text-brand text-xs font-bold mt-0.5">
                4
              </span>
              <div>
                <strong className="text-xs sm:text-sm text-ink font-bold">Službeni koverti i obrasci potvrda:</strong>
                <p className="mt-1 text-xs text-ink-dim leading-relaxed">
                  Poverenici nose poseban izvod iz biračkog spiska, zvanične neprovidne koverte i obrasce Potvrda o biračkom pravu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* 5. Red Flags Grid (All 9 Specific Irregularities) */}
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-sev-teska">Baza nepravilnosti</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
              Crvene zastavice: Najčešće nepravilnosti ({vRules.length})
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-ink-dim">
              Klikni na bilo koju situaciju da vidiš tačan član zakona i uputstvo šta odmah da preduzmeš.
            </p>
          </div>
          <Link
            href="/pravila?kategorija=van_birackog_mesta"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
          >
            Sve nepravilnosti u bazi
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vRules.map((r) => (
            <RuleCard key={r.id} rule={r} layout="grid" />
          ))}
        </div>
      </Container>
    </div>
  );
}
