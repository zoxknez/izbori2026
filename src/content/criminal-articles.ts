export interface CriminalArticle {
  id: string;
  article: string;
  naziv: string;
  opis: string;
  primer: string;
  nijeDokaz?: string;
  kazna: string;
  order: number;
}

const KZ = "Krivični zakonik Republike Srbije";

export const criminalArticles: CriminalArticle[] = [
  {
    id: "KZ154",
    article: "154",
    naziv: "Povreda prava kandidovanja",
    opis: "Sprečavanje ili ometanje nekoga da bude kandidovan ili da povuče svoju kandidaturu, protivno njegovoj volji.",
    primer: "Nekome se preti ili ga se onemogućava da podnese kandidaturu na koju ima pravo.",
    kazna: "Propisana je krivična sankcija; tačan raspon zavisi od težeg ili lakšeg oblika dela.",
    order: 1,
  },
  {
    id: "KZ155",
    article: "155",
    naziv: "Povreda prava glasanja",
    opis: "Upotreba sile ili pretnje radi prisiljavanja nekoga da glasa, ne glasa, ili glasa za/protiv određenog kandidata ili liste.",
    primer: "„Ako ne izađeš na izbore, izgubićeš posao.“ / „Moraš da glasaš za listu X.“",
    nijeDokaz: "Obično podsećanje ili poziv da se izađe na glasanje, bez pretnje ili prinude.",
    kazna: "Zatvor od tri meseca do tri godine.",
    order: 2,
  },
  {
    id: "KZ156",
    article: "156",
    naziv: "Davanje i primanje mita u vezi sa glasanjem",
    opis: "Nuđenje, davanje ili obećavanje koristi radi glasanja, neglasanja ili glasanja na određeni način, kao i traženje ili primanje takve koristi.",
    primer: "Novac, hrana, gorivo, posao ili druga korist nuđeni u zamenu za glas.",
    nijeDokaz: "Organizovan besplatan prevoz do biračkog mesta, sam po sebi, bez dokazane veze sa traženim glasom.",
    kazna: "Novčana kazna ili zatvor do tri godine; za člana biračkog odbora ili drugo službeno lice u vršenju dužnosti — zatvor od tri meseca do pet godina.",
    order: 3,
  },
  {
    id: "KZ157",
    article: "157",
    naziv: "Zloupotreba prava glasanja",
    opis: "Glasanje umesto drugog lica, ponovljeno glasanje iste osobe, ili korišćenje više od jednog glasačkog listića.",
    primer: "Osoba glasa pod tuđim imenom ili pokušava da glasa drugi put istog dana.",
    kazna: "Novčana kazna ili zatvor do jedne godine; za člana biračkog odbora koji to omogući — novčana kazna ili zatvor do dve godine.",
    order: 4,
  },
  {
    id: "KZ158",
    article: "158",
    naziv: "Sastavljanje netačnih biračkih spiskova",
    opis: "Svesno unošenje netačnih podataka u birački spisak, ili propuštanje unosa podataka koje je lice po dužnosti bilo obavezno da unese.",
    primer: "Namerno upisivanje nepostojećih lica ili brisanje birača koji ispunjava uslove.",
    kazna: "Propisana je krivična sankcija; tačan raspon zavisi od okolnosti dela.",
    order: 5,
  },
  {
    id: "KZ159",
    article: "159",
    naziv: "Sprečavanje održavanja glasanja",
    opis: "Sprečavanje da se glasanje uopšte održi ili nastavi, silom, pretnjom ili drugim protivpravnim sredstvom.",
    primer: "Nasilno prekidanje glasanja ili uništavanje izbornog materijala pre isteka propisanog vremena.",
    kazna: "Propisana je krivična sankcija; tačan raspon zavisi od okolnosti dela.",
    order: 6,
  },
  {
    id: "KZ160",
    article: "160",
    naziv: "Povreda tajnosti glasanja",
    opis: "Otkrivanje ili omogućavanje uvida u to kako je određeni birač glasao, protivno garantovanoj tajnosti glasanja.",
    primer: "Član biračkog odbora namerno gleda ili omogućava drugima da vide kako birač popunjava listić.",
    kazna: "Propisana je krivična sankcija, sa težim oblikom kada delo izvrši član biračkog odbora ili drugo lice u vršenju dužnosti.",
    order: 7,
  },
  {
    id: "KZ161",
    article: "161",
    naziv: "Falsifikovanje rezultata glasanja",
    opis: "Dodavanje ili oduzimanje glasačkih listića ili glasova, ili promena broja glasova, ili objavljivanje neistinitog rezultata od strane člana izbornog organa ili drugog lica u vezi sa glasanjem.",
    primer: "Zapisnik se posle brojanja „doradi“ tako da se brojevi ne poklapaju sa stvarnim prebrojavanjem.",
    kazna: "Zatvor od šest meseci do pet godina.",
    order: 8,
  },
];

export { KZ };
