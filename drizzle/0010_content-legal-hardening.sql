-- Content hardening: synchronize the DB-backed public dataset with the reviewed
-- canonical rule copy. Each UPDATE is conditional so a later Admin edit is not
-- silently overwritten.

UPDATE "rules"
SET "legal_effect" = $p05$Ako je propust primećen pre pečaćenja, procedura se može sprovesti ispravno; ako je glasanje već počelo, činjenicu treba uneti u zapisnik i odmah obavestiti nadležnu izbornu komisiju.$p05$,
    "controller_actions" = $p05a$["Ako kutija još nije zapečaćena, sprovesti proveru pred prvim biračem i popuniti kontrolni list", "Ako je glasanje već počelo, ne pokušavati naknadnu rekonstrukciju; uneti činjenicu u zapisnik i obavestiti komisiju"]$p05a$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'P05'
  AND "legal_effect" = 'Proceduralna nepravilnost koja slabi kasniju kontrolu ispravnosti kutije.';

UPDATE "rules"
SET "controller_actions" = $p06$["Pre pečaćenja popuniti i potpisati kontrolni list prema propisanoj proceduri", "Ako je kutija već zapečaćena, ne dopisivati podatke naknadno; uneti činjenicu u zapisnik i obavestiti komisiju"]$p06$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'P06'
  AND "controller_actions" = $p06old$["Insistirati da se kontrolni list popuni i potpiše pre pečaćenja kutije", "Zahtevati unos primedbe u zapisnik ako je propušteno"]$p06old$::jsonb;

UPDATE "rules"
SET "controller_actions" = $p07$["Pre pečaćenja obezbediti potpis prvog birača prema propisanoj proceduri", "Ako je kutija već zapečaćena, ne dopisivati potpis naknadno; uneti primedbu u zapisnik"]$p07$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'P07'
  AND "controller_actions" = $p07old$["Zahtevati dopunu potpisa pre pečaćenja kutije", "Uneti primedbu u zapisnik"]$p07old$::jsonb;

UPDATE "rules"
SET "controller_actions" = $p08$["Pre pečaćenja obezbediti potpis najmanje jednog člana odbora prema propisanoj proceduri", "Ako je kutija već zapečaćena, ne dopisivati potpis naknadno; uneti primedbu u zapisnik"]$p08$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'P08'
  AND "controller_actions" = $p08old$["Zahtevati potpis pre pečaćenja kutije", "Uneti primedbu u zapisnik"]$p08old$::jsonb;

UPDATE "rules"
SET "legal_effect" = 'Narušavanje reda na biračkom mestu koje birački odbor treba odmah da otkloni.',
    "updated_at" = NOW()
WHERE "id" = 'P12'
  AND "legal_effect" = 'Prekršajna nepravilnost: narušavanje reda na biračkom mestu.';

UPDATE "rules"
SET "controller_actions" = $i12$["Odbiti izdavanje listića pod tuđim imenom", "Ne ulaziti u fizički sukob niti samostalno zadržavati lice; obavestiti predsednika odbora i pozvati policiju kada okolnosti to zahtevaju"]$i12$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'I12'
  AND "controller_actions" = $i12old$["Odbiti izdavanje listića", "Zadržati lice i pozvati nadležne organe"]$i12old$::jsonb;

UPDATE "rules"
SET "controller_actions" = $t11$["Ako si član odbora, bezbedno evidentiraj navod i obavesti predsednika odbora", "Ako postoji neposredna opasnost, pozovi policiju; ne ulazi u fizičku konfrontaciju"]$t11$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'T11'
  AND "controller_actions" = '[]'::jsonb;

UPDATE "rules"
SET "controller_actions" = $t12$["Ne ulaziti u fizički sukob; obavestiti predsednika odbora i sačuvati činjenice", "Ako postoji neposredna opasnost, pozvati policiju"]$t12$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'T12'
  AND "controller_actions" = '[]'::jsonb;

UPDATE "rules"
SET "controller_actions" = $kg01$["Ne prihvatati niti nuditi korist; zabeležiti šta je ponuđeno i ko je učestvovao", "Bez direktne konfrontacije obavestiti nadležnu izbornu komisiju ili policiju"]$kg01$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'KG01'
  AND "controller_actions" = '[]'::jsonb;

UPDATE "rules"
SET "controller_actions" = $bv01$["Ne dozvoliti iznošenje službenog listića izvan propisanog toka glasanja", "Bez fizičkog sukoba odmah obavestiti predsednika odbora i, prema okolnostima, policiju"]$bv01$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'BV01'
  AND "controller_actions" = '["Sprečiti iznošenje listića sa biračkog mesta", "Odmah obavestiti nadležne organe"]'::jsonb;

UPDATE "rules"
SET "legal_effect" = 'Ozbiljna nepravilnost koja ograničava zakonom predviđeno posmatranje rada biračkog odbora.',
    "updated_at" = NOW()
WHERE "id" = 'N02'
  AND "legal_effect" = 'Ozbiljna nepravilnost; član odbora koji sprečava posmatrača može odgovarati za prekršaj.';

UPDATE "rules"
SET "controller_actions" = $fr01$["Ne menjati originalni materijal; sačuvati tačne brojke, primedbu i prateće dokaze", "Obavestiti nadležnu izbornu komisiju, a kod osnovane sumnje i javno tužilaštvo"]$fr01$::jsonb,
    "updated_at" = NOW()
WHERE "id" = 'FR01'
  AND "controller_actions" = '[]'::jsonb;

INSERT INTO "audit_log" ("id", "actor_user_id", "action", "entity_type", "entity_id", "after")
VALUES
  ('content-hardening-0010-p05', NULL, 'content.hardening', 'rule', 'P05', '{"reason":"legal-safety-review"}'::jsonb),
  ('content-hardening-0010-p06', NULL, 'content.hardening', 'rule', 'P06', '{"reason":"legal-safety-review"}'::jsonb),
  ('content-hardening-0010-p07', NULL, 'content.hardening', 'rule', 'P07', '{"reason":"legal-safety-review"}'::jsonb),
  ('content-hardening-0010-p08', NULL, 'content.hardening', 'rule', 'P08', '{"reason":"legal-safety-review"}'::jsonb),
  ('content-hardening-0010-p12', NULL, 'content.hardening', 'rule', 'P12', '{"reason":"legal-safety-review"}'::jsonb),
  ('content-hardening-0010-i12', NULL, 'content.hardening', 'rule', 'I12', '{"reason":"legal-safety-review"}'::jsonb),
  ('content-hardening-0010-t11', NULL, 'content.hardening', 'rule', 'T11', '{"reason":"legal-safety-review"}'::jsonb),
  ('content-hardening-0010-t12', NULL, 'content.hardening', 'rule', 'T12', '{"reason":"legal-safety-review"}'::jsonb),
  ('content-hardening-0010-kg01', NULL, 'content.hardening', 'rule', 'KG01', '{"reason":"legal-safety-review"}'::jsonb),
  ('content-hardening-0010-bv01', NULL, 'content.hardening', 'rule', 'BV01', '{"reason":"legal-safety-review"}'::jsonb),
  ('content-hardening-0010-n02', NULL, 'content.hardening', 'rule', 'N02', '{"reason":"legal-safety-review"}'::jsonb),
  ('content-hardening-0010-fr01', NULL, 'content.hardening', 'rule', 'FR01', '{"reason":"legal-safety-review"}'::jsonb);
