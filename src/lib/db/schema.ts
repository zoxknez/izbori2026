import {
  pgTable,
  text,
  varchar,
  integer,
  jsonb,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const rules = pgTable("rules", {
  id: varchar("id", { length: 16 }).primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  naziv: text("naziv").notNull(),
  kategorija: varchar("kategorija", { length: 64 }).notNull(),
  severity: varchar("severity", { length: 32 }).notNull(),
  electionTypes: jsonb("election_types").$type<string[]>().notNull(),
  phase: varchar("phase", { length: 64 }).notNull(),
  summary: text("summary").notNull(),
  legalRule: text("legal_rule").notNull(),
  legalEffect: text("legal_effect"),
  whatToCheck: jsonb("what_to_check").$type<string[]>().default([]),
  controllerActions: jsonb("controller_actions").$type<string[]>().default([]),
  voterActions: jsonb("voter_actions").$type<string[]>().default([]),
  observerActions: jsonb("observer_actions").$type<string[]>().default([]),
  evidenceChecklist: jsonb("evidence_checklist").$type<string[]>().default([]),
  doNotDo: jsonb("do_not_do").$type<string[]>().default([]),
  lawReferences: jsonb("law_references")
    .$type<{ law: string; article: string; url?: string }[]>()
    .default([]),
  sourceUrls: jsonb("source_urls")
    .$type<{ label: string; url: string }[]>()
    .default([]),
  relatedSlugs: jsonb("related_slugs").$type<string[]>().default([]),
  mythCheck: jsonb("myth_check")
    .$type<{ claim: string; verdict: "mit" | "cinjenica" | "zavisi"; explanation: string } | null>()
    .default(null),
  isAutomaticAnnulment: boolean("is_automatic_annulment").default(false),
  order: integer("order").default(0),
  reviewStatus: varchar("review_status", { length: 32 }).default("VERIFIED"),
  lastLegalReview: varchar("last_legal_review", { length: 32 }),
  validFrom: varchar("valid_from", { length: 32 }),
  validUntil: varchar("valid_until", { length: 32 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const criminalArticles = pgTable("criminal_articles", {
  id: varchar("id", { length: 16 }).primaryKey(),
  article: varchar("article", { length: 16 }).notNull(),
  naziv: text("naziv").notNull(),
  opis: text("opis").notNull(),
  primer: text("primer").notNull(),
  nijeDokaz: text("nije_dokaz"),
  kazna: text("kazna").notNull(),
  order: integer("order").default(0),
});

export const sources = pgTable("sources", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tier: integer("tier").notNull(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  order: integer("order").default(0),
});

export type RuleRow = typeof rules.$inferSelect;
export type NewRuleRow = typeof rules.$inferInsert;
export type CriminalArticleRow = typeof criminalArticles.$inferSelect;
export type SourceRow = typeof sources.$inferSelect;
