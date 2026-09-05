import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("../src/lib/db");
  const {
    rules: rulesTable,
    criminalArticles: criminalArticlesTable,
    sources: sourcesTable,
  } = await import("../src/lib/db/schema");
  const { rules } = await import("../src/content/rules");
  const { criminalArticles } = await import("../src/content/criminal-articles");
  const { sources } = await import("../src/content/sources");

  console.log(`Seedujem ${rules.length} pravila...`);
  for (const r of rules) {
    await db
      .insert(rulesTable)
      .values({
        id: r.id,
        slug: r.slug,
        naziv: r.naziv,
        kategorija: r.kategorija,
        severity: r.severity,
        electionTypes: r.electionTypes,
        phase: r.phase,
        summary: r.summary,
        legalRule: r.legalRule,
        legalEffect: r.legalEffect,
        whatToCheck: r.whatToCheck,
        controllerActions: r.controllerActions,
        voterActions: r.voterActions,
        observerActions: r.observerActions,
        evidenceChecklist: r.evidenceChecklist,
        doNotDo: r.doNotDo,
        lawReferences: r.lawReferences,
        sourceUrls: r.sourceUrls,
        relatedSlugs: r.relatedSlugs,
        mythCheck: r.mythCheck ?? null,
        isAutomaticAnnulment: r.isAutomaticAnnulment ?? false,
        order: r.order ?? 0,
        reviewStatus: "VERIFIED",
        lastLegalReview: "2026-09-05",
      })
      .onConflictDoUpdate({
        target: rulesTable.id,
        set: {
          slug: r.slug,
          naziv: r.naziv,
          kategorija: r.kategorija,
          severity: r.severity,
          electionTypes: r.electionTypes,
          phase: r.phase,
          summary: r.summary,
          legalRule: r.legalRule,
          legalEffect: r.legalEffect,
          whatToCheck: r.whatToCheck,
          controllerActions: r.controllerActions,
          voterActions: r.voterActions,
          observerActions: r.observerActions,
          evidenceChecklist: r.evidenceChecklist,
          doNotDo: r.doNotDo,
          lawReferences: r.lawReferences,
          sourceUrls: r.sourceUrls,
          relatedSlugs: r.relatedSlugs,
          mythCheck: r.mythCheck ?? null,
          isAutomaticAnnulment: r.isAutomaticAnnulment ?? false,
          order: r.order ?? 0,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`Seedujem ${criminalArticles.length} krivičnih dela...`);
  for (const a of criminalArticles) {
    await db
      .insert(criminalArticlesTable)
      .values({
        id: a.id,
        article: a.article,
        naziv: a.naziv,
        opis: a.opis,
        primer: a.primer,
        nijeDokaz: a.nijeDokaz,
        kazna: a.kazna,
        order: a.order,
      })
      .onConflictDoUpdate({
        target: criminalArticlesTable.id,
        set: {
          article: a.article,
          naziv: a.naziv,
          opis: a.opis,
          primer: a.primer,
          nijeDokaz: a.nijeDokaz,
          kazna: a.kazna,
          order: a.order,
        },
      });
  }

  console.log(`Seedujem ${sources.length} izvora...`);
  for (const s of sources) {
    await db
      .insert(sourcesTable)
      .values({
        id: s.id,
        tier: s.tier,
        label: s.label,
        url: s.url,
        description: s.description,
        order: 0,
      })
      .onConflictDoUpdate({
        target: sourcesTable.id,
        set: {
          tier: s.tier,
          label: s.label,
          url: s.url,
          description: s.description,
        },
      });
  }

  console.log("Gotovo.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
