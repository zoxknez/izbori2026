import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("../src/lib/db");
  const {
    rules: rulesTable,
    criminalArticles: criminalArticlesTable,
    sources: sourcesTable,
    decisionTrees: decisionTreesTable,
    decisionNodes: decisionNodesTable,
  } = await import("../src/lib/db/schema");
  const { rules } = await import("../src/content/rules");
  const { criminalArticles } = await import("../src/content/criminal-articles");
  const { sources } = await import("../src/content/sources");
  const { decisionTrees } = await import("../src/content/decision-trees");
  const { assertRulesInvariants } = await import("../src/lib/domain/rules/invariants");
  const { decisionTreeSchema } = await import("../src/lib/domain/decision-trees/types");
  const reviewStatus = process.env.LEGAL_REVIEW_STATUS ?? "legal_review";
  const lastLegalReview = process.env.LEGAL_REVIEW_DATE;

  assertRulesInvariants(rules);
  decisionTrees.forEach((tree) => decisionTreeSchema.parse(tree));

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
        phases: r.phases?.length ? r.phases : [r.phase],
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
        reviewStatus,
        publicationStatus: r.publicationStatus ?? "published",
        lastLegalReview,
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
          phases: r.phases?.length ? r.phases : [r.phase],
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
          reviewStatus,
          publicationStatus: r.publicationStatus ?? "published",
          lastLegalReview,
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
        publisher: s.publisher,
        version: s.version,
        validFromDate: s.validFromDate,
        validUntilDate: s.validUntilDate,
        status: s.status ?? "active",
        supersedesId: s.supersedesId,
      })
      .onConflictDoUpdate({
        target: sourcesTable.id,
        set: {
          tier: s.tier,
          label: s.label,
          url: s.url,
          description: s.description,
          publisher: s.publisher,
          version: s.version,
          validFromDate: s.validFromDate,
          validUntilDate: s.validUntilDate,
          status: s.status ?? "active",
          supersedesId: s.supersedesId,
          lastCheckedAt: new Date(),
        },
      });
  }

  console.log(`Seedujem ${decisionTrees.length} stabala odluka...`);
  for (const tree of decisionTrees) {
    await db
      .insert(decisionTreesTable)
      .values({
        id: tree.id,
        slug: tree.slug,
        title: tree.title,
        description: tree.description,
        startNodeId: tree.startNodeId,
        publicationStatus: tree.publicationStatus,
        reviewStatus: tree.reviewStatus,
        order: tree.order,
      })
      .onConflictDoUpdate({
        target: decisionTreesTable.id,
        set: {
          slug: tree.slug,
          title: tree.title,
          description: tree.description,
          startNodeId: tree.startNodeId,
          publicationStatus: tree.publicationStatus,
          reviewStatus: tree.reviewStatus,
          order: tree.order,
          updatedAt: new Date(),
        },
      });

    for (const node of tree.nodes) {
      await db
        .insert(decisionNodesTable)
        .values({
          id: node.id,
          treeId: tree.id,
          type: node.type,
          prompt: node.prompt,
          options: node.options,
          ruleIds: node.ruleIds,
          order: node.order,
        })
        .onConflictDoUpdate({
          target: decisionNodesTable.id,
          set: {
            treeId: tree.id,
            type: node.type,
            prompt: node.prompt,
            options: node.options,
            ruleIds: node.ruleIds,
            order: node.order,
          },
        });
    }
  }

  console.log("Gotovo.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
