-- Normalize typographic dashes in DB-backed public content so the live app
-- matches the source copy and the requested plain-hyphen style.

UPDATE "rules"
SET "naziv" = replace(replace("naziv", '—', '-'), '–', '-'),
    "summary" = replace(replace("summary", '—', '-'), '–', '-'),
    "legal_rule" = replace(replace("legal_rule", '—', '-'), '–', '-'),
    "legal_effect" = replace(replace("legal_effect", '—', '-'), '–', '-'),
    "what_to_check" = replace(replace("what_to_check"::text, '—', '-'), '–', '-')::jsonb,
    "controller_actions" = replace(replace("controller_actions"::text, '—', '-'), '–', '-')::jsonb,
    "voter_actions" = replace(replace("voter_actions"::text, '—', '-'), '–', '-')::jsonb,
    "observer_actions" = replace(replace("observer_actions"::text, '—', '-'), '–', '-')::jsonb,
    "evidence_checklist" = replace(replace("evidence_checklist"::text, '—', '-'), '–', '-')::jsonb,
    "do_not_do" = replace(replace("do_not_do"::text, '—', '-'), '–', '-')::jsonb,
    "law_references" = replace(replace("law_references"::text, '—', '-'), '–', '-')::jsonb,
    "source_urls" = replace(replace("source_urls"::text, '—', '-'), '–', '-')::jsonb,
    "related_slugs" = replace(replace("related_slugs"::text, '—', '-'), '–', '-')::jsonb,
    "aliases" = replace(replace("aliases"::text, '—', '-'), '–', '-')::jsonb,
    "informal_queries" = replace(replace("informal_queries"::text, '—', '-'), '–', '-')::jsonb,
    "myth_check" = replace(replace("myth_check"::text, '—', '-'), '–', '-')::jsonb,
    "updated_at" = NOW();

UPDATE "sources"
SET "label" = replace(replace("label", '—', '-'), '–', '-'),
    "description" = replace(replace("description", '—', '-'), '–', '-'),
    "version" = replace(replace("version", '—', '-'), '–', '-');

UPDATE "criminal_articles"
SET "naziv" = replace(replace("naziv", '—', '-'), '–', '-'),
    "opis" = replace(replace("opis", '—', '-'), '–', '-'),
    "primer" = replace(replace("primer", '—', '-'), '–', '-'),
    "nije_dokaz" = replace(replace("nije_dokaz", '—', '-'), '–', '-'),
    "kazna" = replace(replace("kazna", '—', '-'), '–', '-');

UPDATE "decision_trees"
SET "title" = replace(replace("title", '—', '-'), '–', '-'),
    "description" = replace(replace("description", '—', '-'), '–', '-'),
    "updated_at" = NOW();

UPDATE "decision_nodes"
SET "prompt" = replace(replace("prompt", '—', '-'), '–', '-'),
    "options" = replace(replace("options"::text, '—', '-'), '–', '-')::jsonb,
    "rule_ids" = replace(replace("rule_ids"::text, '—', '-'), '–', '-')::jsonb;

INSERT INTO "audit_log" ("id", "actor_user_id", "action", "entity_type", "entity_id", "after")
VALUES
  ('content-format-0012-dashes', NULL, 'content.format_normalization', 'content', 'public-content', '{"reason":"plain-hyphen-normalization"}'::jsonb)
ON CONFLICT ("id") DO NOTHING;
