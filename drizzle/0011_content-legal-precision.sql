-- Content precision: clarify the legal effect of the home-voting deadline,
-- the unsigned-envelope consequence, and the conditional criminal-law
-- references for the "bugarski voz" pattern.

UPDATE "rules"
SET "legal_rule" = $bv01rule$Iznošenje službenog glasačkog listića izvan propisanog toka je ozbiljna izborna nepravilnost. Krivična kvalifikacija zavisi od dokazanih radnji, kao što su glasanje više puta, korišćenje više listića, povreda tajnosti ili menjanje rezultata.$bv01rule$,
    "legal_effect" = $bv01effect$Ozbiljna sumnja na organizovanu izbornu manipulaciju; moguće krivičnopravne posledice procenjuju nadležni organi prema konkretnim dokazima.$bv01effect$,
    "controller_actions" = $bv01actions$["Ne ulaziti u fizički sukob; obavestiti predsednika odbora i zahtevati da se činjenice unesu u zapisnik", "Prema okolnostima obavestiti nadležnu izbornu komisiju ili policiju"]$bv01actions$::jsonb,
    "law_references" = $bv01refs$[
      {"law":"Zakon o izboru narodnih poslanika","article":"čl. 87–99 (opšti tok glasanja)","url":"https://www.rik.parlament.gov.rs/tekst/sr/61/zakoni.php"},
      {"law":"Krivični zakonik Republike Srbije","article":"čl. 157 · Zloupotreba prava glasanja","url":"https://reg.pravno-informacioni-sistem.rs/api/viewdoc?doctype=reg&regactid=437844&uuid=f9f75050-d16f-484a-acad-4be0f1a5bcf5"},
      {"law":"Krivični zakonik Republike Srbije","article":"čl. 160 · Povreda tajnosti glasanja","url":"https://reg.pravno-informacioni-sistem.rs/api/viewdoc?doctype=reg&regactid=437844&uuid=f9f75050-d16f-484a-acad-4be0f1a5bcf5"},
      {"law":"Krivični zakonik Republike Srbije","article":"čl. 161 · Falsifikovanje rezultata glasanja","url":"https://reg.pravno-informacioni-sistem.rs/api/viewdoc?doctype=reg&regactid=437844&uuid=f9f75050-d16f-484a-acad-4be0f1a5bcf5"}
    ]$bv01refs$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'BV01'
  AND "legal_rule" = 'Iznošenje službenog glasačkog listića van propisanog toka glasanja i njegovo korišćenje van biračkog mesta je protivzakonito.';

UPDATE "decision_trees"
SET "description" = 'Odredite da li neslaganje zahteva ponovno brojanje ili predstavlja zakonski osnov za poništavanje po službenoj dužnosti.',
    "updated_at" = NOW()
WHERE "id" = 'DT03'
  AND "description" = 'Odredite da li neslaganje zahteva ponovno brojanje ili ukazuje na automatsko poništavanje.';

INSERT INTO "audit_log" ("id", "actor_user_id", "action", "entity_type", "entity_id", "after")
VALUES
  ('content-precision-0011-bv01', NULL, 'content.legal_precision', 'rule', 'BV01', '{"reason":"official-law-source-review"}'::jsonb),
  ('content-precision-0011-dt03', NULL, 'content.legal_precision', 'decision_tree', 'DT03', '{"reason":"official-law-source-review"}'::jsonb);
