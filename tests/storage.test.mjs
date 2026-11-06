// Ausführen mit: node --test tests/storage.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CONFIG } from "../js/config.js";
import * as S from "../js/storage.js";

test("Gespeicherte Variante von vor der Geld-Progression bekommt die neuen Werte", () => {
  const old = structuredClone(DEFAULT_CONFIG);
  old.contentVersion = 1;
  old.name = "Klasse 3a";
  old.vid = "abc123";
  old.startMoney = 150;
  delete old.priceLevel;
  old.phases[0].cost = 0;
  old.moneyTargets = { 12: 400, 25: 25000 };
  old.activities.find(a => a.id === "zeitungen").minAge = 15;
  old.activities.push({ id: "eigene", name: "Eigene Aktivität", icon: "⭐", when: ["abend"], money: 0, effects: {} });
  const c = S.sanitizeConfig(old);
  assert.equal(c.contentVersion, DEFAULT_CONFIG.contentVersion);
  assert.equal(c.startMoney, DEFAULT_CONFIG.startMoney);
  assert.deepEqual(c.priceLevel, DEFAULT_CONFIG.priceLevel);
  assert.equal(c.phases[0].cost, 60);
  assert.deepEqual(c.moneyTargets, DEFAULT_CONFIG.moneyTargets);
  assert.equal(c.activities.find(a => a.id === "zeitungen").minAge, undefined);
  assert.ok(c.activities.some(a => a.id === "eigene"), "eigene Aktivität bleibt");
  assert.equal(c.name, "Klasse 3a");
  assert.equal(c.vid, "abc123");
  assert.deepEqual(S.validateConfig(c), []);
});

test("Aktuelle Variante bleibt unverändert", () => {
  const cur = structuredClone(DEFAULT_CONFIG);
  cur.startMoney = 999;
  assert.equal(S.sanitizeConfig(cur).startMoney, 999);
});
