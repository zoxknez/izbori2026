import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_INCIDENT, generateChronology } from "./incident";

test("generateChronology includes the core location and incident facts", () => {
  const result = generateChronology({
    ...EMPTY_INCIDENT,
    opstina: "Novi Sad",
    brojMesta: "42",
    datum: "2026-09-05",
    vreme: "14:20",
    staSamVideo: "Lice je ušlo iza paravana sa dva listića.",
    propis: "ZINP čl. 93",
  });

  assert.match(result, /Novi Sad/);
  assert.match(result, /biračkom mestu br\. 42/);
  assert.match(result, /14:20/);
  assert.match(result, /Lice je ušlo iza paravana/);
  assert.match(result, /ZINP čl\. 93/);
});

test("generateChronology remains usable when optional details are empty", () => {
  const result = generateChronology(EMPTY_INCIDENT);

  assert.match(result, /datum\/vreme nije uneto/);
  assert.match(result, /biračko mesto nije uneto/);
  assert.match(result, /Birački odbor je o događaju upozoren/);
  assert.doesNotMatch(result, /Relevantan propis:/);
});
