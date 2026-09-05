import {
  pgTable,
  text,
  varchar,
  integer,
  jsonb,
  timestamp,
  boolean,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const rules = pgTable("rules", {
  id: varchar("id", { length: 16 }).primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  naziv: text("naziv").notNull(),
  kategorija: varchar("kategorija", { length: 64 }).notNull(),
  severity: varchar("severity", { length: 32 }).notNull(),
  electionTypes: jsonb("election_types").$type<string[]>().notNull(),
  phases: jsonb("phases").$type<string[]>().notNull().default([]),
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
  aliases: jsonb("aliases").$type<string[]>().default([]),
  informalQueries: jsonb("informal_queries").$type<string[]>().default([]),
  mythCheck: jsonb("myth_check")
    .$type<{ claim: string; verdict: "mit" | "cinjenica" | "zavisi"; explanation: string } | null>()
    .default(null),
  isAutomaticAnnulment: boolean("is_automatic_annulment").generatedAlwaysAs(sql`("severity" = 'ponistavanje')`),
  order: integer("order").default(0),
  reviewStatus: varchar("review_status", { length: 32 }).default("legal_review"),
  publicationStatus: varchar("publication_status", { length: 32 }).default("published"),
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

export const decisionTrees = pgTable("decision_trees", {
  id: varchar("id", { length: 32 }).primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startNodeId: varchar("start_node_id", { length: 64 }).notNull(),
  publicationStatus: varchar("publication_status", { length: 32 }).default("published"),
  reviewStatus: varchar("review_status", { length: 32 }).default("legal_review"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const decisionNodes = pgTable("decision_nodes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  treeId: varchar("tree_id", { length: 32 }).notNull(),
  type: varchar("type", { length: 16 }).notNull(),
  prompt: text("prompt").notNull(),
  options: jsonb("options")
    .$type<{ id: string; label: string; nextNodeId?: string; ruleIds: string[] }[]>()
    .default([]),
  ruleIds: jsonb("rule_ids").$type<string[]>().default([]),
  order: integer("order").default(0),
});

export const datasetVersions = pgTable("dataset_versions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  version: varchar("version", { length: 64 }).notNull().unique(),
  status: varchar("status", { length: 16 }).notNull().default("draft"),
  updatePriority: varchar("update_priority", { length: 16 }).notNull().default("normal"),
  legalReviewDate: date("legal_review_date"),
  manifestHash: varchar("manifest_hash", { length: 128 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  publishedAt: timestamp("published_at"),
  publishedBy: varchar("published_by", { length: 64 }),
}, (table) => ({
  oneActiveDataset: uniqueIndex("dataset_versions_one_active_idx")
    .on(table.status)
    .where(sql`${table.status} = 'active'`),
}));

export const datasetFiles = pgTable("dataset_files", {
  id: varchar("id", { length: 64 }).primaryKey(),
  datasetVersionId: varchar("dataset_version_id", { length: 64 }).notNull(),
  filename: varchar("filename", { length: 160 }).notNull(),
  payload: jsonb("payload").notNull(),
  sha256: varchar("sha256", { length: 128 }).notNull(),
  size: integer("size").notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 32 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: varchar("id", { length: 64 }).primaryKey(),
  actorUserId: varchar("actor_user_id", { length: 64 }),
  action: varchar("action", { length: 64 }).notNull(),
  entityType: varchar("entity_type", { length: 64 }).notNull(),
  entityId: varchar("entity_id", { length: 64 }).notNull(),
  before: jsonb("before"),
  after: jsonb("after"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sources = pgTable("sources", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tier: integer("tier").notNull(),
  type: varchar("type", { length: 32 }).notNull().default("reference"),
  label: text("label").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  order: integer("order").default(0),
  publisher: text("publisher"),
  version: varchar("version", { length: 64 }),
  validFromDate: date("valid_from_date"),
  validUntilDate: date("valid_until_date"),
  status: varchar("status", { length: 32 }).default("active"),
  supersedesId: varchar("supersedes_id", { length: 64 }),
  lastCheckedAt: timestamp("last_checked_at"),
});

export type RuleRow = typeof rules.$inferSelect;
export type NewRuleRow = typeof rules.$inferInsert;
export type CriminalArticleRow = typeof criminalArticles.$inferSelect;
export type SourceRow = typeof sources.$inferSelect;
export type DecisionTreeRow = typeof decisionTrees.$inferSelect;
export type DecisionNodeRow = typeof decisionNodes.$inferSelect;
export type DatasetVersionRow = typeof datasetVersions.$inferSelect;
export type DatasetFileRow = typeof datasetFiles.$inferSelect;
export type AdminUserRow = typeof adminUsers.$inferSelect;
export type AuditLogRow = typeof auditLog.$inferSelect;
