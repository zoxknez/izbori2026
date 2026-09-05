# Izborna kontrola

Interaktivni građanski vodič za prepoznavanje, dokumentovanje i prijavljivanje izbornih
nepravilnosti u Srbiji. Next.js (App Router) + Tailwind CSS v4 + Drizzle ORM + Neon Postgres.

## Sadržaj

- **Vidim problem sada** (`/vidim-problem`) — dijagnostika u 3 koraka
- **Baza nepravilnosti** (`/pravila`) — 66 situacija sa filterima po fazi/kategoriji/težini
- **Validator zapisnika** (`/validator`) — matematička kontrola brojeva iz zapisnika
- **Kontrolor** (`/kontrolor`) — propisani tok glasanja i brojanja
- **Glasanje van biračkog mesta**, **Krivična dela**, **Mit ili činjenica**, **Rokovi**,
  **Prijavi incident** (generator hronologije, čuva se samo lokalno u pregledaču), **Izvori**
- **Trening / Kviz** (`/trening/kviz`) — 193 coverage pitanja sa offline mastery stanjem
- **Simulator biračkog dana** (`/simulator/biracki-dan`) — 30 događaja i 80 odluka

Sadržaj pravila (`src/content/rules.ts`) živi u Neon Postgres bazi (tabele `rules`,
`criminal_articles`, `sources` — vidi `src/lib/db/schema.ts`). Aplikacija je server-rendered uz
ISR (revalidate 1h), pa je i dalje brza bez obzira na bazu.

## Pokretanje lokalno

```bash
npm install
npm run dev
```

Aplikaciji je potreban `DATABASE_URL` u `.env.local` (Neon connection string, već podešen).
Za produkcioni Auth.js potreban je i `AUTH_SECRET`.

## Menjanje sadržaja pravila

1. Za lokalni/dev bootstrap izmeni `src/content/rules.ts` (ili druge seed izvore).
2. Pokreni `npx drizzle-kit migrate`, zatim `npm run dataset:snapshot`.
3. `scripts/seed.ts` je namenjen samo svežoj lokalnoj/dev bazi. Nakon prve uspešne Admin objave
   ne pokretati ga nad produkcionim Neon-om; produkcija se menja kroz publish API koji validira
   snapshot i upisuje audit log.

Ako menjaš šemu (`src/lib/db/schema.ts`), generiši migraciju sa
`npx drizzle-kit generate --name opis-izmene`, proveri SQL, pa pokreni `npx drizzle-kit migrate`.

## Deploy na Vercel

1. Push-uj repo na GitHub
2. Import u Vercel (New Project → izaberi repo)
3. U Vercel → Settings → Environment Variables dodaj `DATABASE_URL` (isti Neon connection
   string iz `.env.local`)
4. Deploy — Vercel automatski prepoznaje Next.js build (`next build`)

Neon i Vercel rade odlično zajedno preko `@neondatabase/serverless` HTTP drajvera koji ovaj
projekat već koristi — nema potrebe za connection pooling podešavanjima na strani aplikacije.

## Napomena

Ovo nije pravni savet. Sadržaj je zasnovan na javno dostupnim izbornim zakonima Republike Srbije
i izveštajima akreditovanih posmatračkih misija (pravni presek: 5. septembar 2026). Pre korišćenja
proveriti najnovije izmene propisa i uputstva RIK-a. Za konkretan slučaj obratiti se lokalnoj izbornoj
komisiji, advokatu ili nadležnom tužilaštvu.
