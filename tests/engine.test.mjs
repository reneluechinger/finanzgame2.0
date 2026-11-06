// Ausführen mit: node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CONFIG as cfg } from "../js/config.js";
import * as E from "../js/engine.js";

const seeded = s => () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);

function playGame(seed, startAge = 12, choose = () => 0) {
  const rng = seeded(seed), st = E.newGame(cfg, "t", "x", startAge);
  st.started = "test" + seed;
  while (st.status !== "done") {
    if (st.status === "review") { E.continueAfterReview(cfg, st, rng); continue; }
    if (st.event) E.chooseEventOption(cfg, st, choose(st));
    for (const slot of E.SLOTS) {
      const ok = E.offeredActivities(cfg, st, slot).filter(a => E.activityStatus(cfg, st, a, slot).ok);
      st.plan[slot] = ok[Math.floor(rng() * ok.length)].id;
    }
    E.endDay(cfg, st, rng);
  }
  return st;
}

test("Punkteformel: Durchschnitt minus halber Abstand", () => {
  assert.equal(E.scoreOf({ a: 50, b: 50 }).score, 50);
  assert.equal(E.scoreOf({ a: 80, b: 40 }).score, 40);
  assert.equal(E.scoreOf({ a: 100, b: 0 }).score, 0);
});

test("Ein Quartal pro Tag: Start mit 12 dauert 52 Tage, mit 16 sind es 36", () => {
  assert.equal(playGame(1, 12).history.length, 52);
  const st = playGame(2, 16);
  assert.equal(st.history.length, 36);
  assert.equal(st.history.at(-1).age, 24);
});

test("Startalter wird auf den erlaubten Bereich begrenzt", () => {
  assert.equal(E.newGame(cfg, "t", "x", 8).startAge, cfg.minStartAge);
  assert.equal(E.newGame(cfg, "t", "x", 30).startAge, cfg.maxStartAge);
});

test("Alter und Jahresrückblick: nach jedem vierten Quartal", () => {
  const st = E.newGame(cfg, "t", "x", 12);
  assert.equal(E.ageAt(st), 12);
  for (let i = 0; i < 4; i++) {
    st.event = null;
    for (const s of E.SLOTS) st.plan[s] = "ausruhen";
    E.endDay(cfg, st, () => 0.9);
  }
  assert.equal(st.status, "review");
  E.continueAfterReview(cfg, st, () => 0.9);
  assert.equal(E.ageAt(st), 13);
  assert.ok(st.log.some(l => l.includes("13")));
});

test("Mit 16 kommt die Berufswahl als Meilenstein, auch beim Start mit 16", () => {
  const st = E.newGame(cfg, "t", "x", 16);
  assert.equal(st.event, "m_berufswahl");
  E.chooseEventOption(cfg, st, 0);
  assert.equal(st.phase, "lehre");
});

test("Gymnasium führt mit 18 zur Wahl Studium, Studium endet mit 22", () => {
  const st = playGame(3, 14, s => (s.event === "m_berufswahl" ? 1 : 0));
  const phases = st.phaseLog.map(p => p.phase);
  assert.deepEqual(phases, ["schule", "mittelschule", "studium", "akademisch"]);
  const studStart = st.phaseLog.find(p => p.phase === "studium");
  const studEnd = st.phaseLog.find(p => p.phase === "akademisch");
  assert.equal(E.ageAt(st, studStart.day), 18);
  assert.equal(E.ageAt(st, studEnd.day), 22);
});

test("Steuern ab 18 und Krankenkasse ab 19", () => {
  const st = playGame(4, 12);
  assert.ok(st.paid.Steuern > 0, "Steuern bezahlt");
  assert.ok(st.paid.Krankenkasse > 0, "Krankenkasse bezahlt");
  const young = playGame(5, 12);
  assert.equal(E.taxFor(cfg, young, 9000), 0);
  assert.equal(E.taxFor(cfg, { flags: {} }, 60000), 4000);
  assert.equal(E.taxFor(cfg, { flags: {}, deductions: { 20: 2000 } }, 60000, 20), 3840);
});

test("Lehrlingslohn steigt mit jedem Lehrjahr", () => {
  const st = E.newGame(cfg, "t", "x", 16);
  E.chooseEventOption(cfg, st, 0); // Lehre
  st.day = 2;
  assert.equal(E.phaseIncome(cfg, st), 2340);
  st.day = 6;
  assert.equal(E.phaseIncome(cfg, st), 2790);
  st.day = 10;
  assert.equal(E.phaseIncome(cfg, st), 3330);
});

test("Energie-Kosten sind 20 % kleiner", () => {
  assert.equal(E.effectiveDelta(cfg, "energie", -10), -8);
  assert.equal(E.effectiveDelta(cfg, "energie", 10), 10);
  assert.equal(E.effectiveDelta(cfg, "zufriedenheit", -10), -10);
});

test("Aktivitäten nach Alter: gesperrt mit Hinweis, später frei", () => {
  const st = E.newGame(cfg, "t", "x", 12);
  const job = cfg.activities.find(a => a.id === "j_service");
  const s = E.activityStatus(cfg, st, job, "abend");
  assert.equal(s.ok, false);
  assert.equal(s.locked, true);
  assert.match(s.reason, /16/);
  assert.ok(E.lockedActivities(cfg, st, "nachmittag").every(a => a.minAge > 12));
  const st16 = E.newGame(cfg, "t", "x", 16);
  assert.equal(E.activityStatus(cfg, st16, job, "abend").ok, true);
  // Einfache Jobs verschwinden mit dem Alter
  const zeitung = cfg.activities.find(a => a.id === "zeitungen");
  st16.day = 9; // 18 Jahre
  assert.equal(E.activityStatus(cfg, st16, zeitung, "nachmittag").hidden, true);
});

test("Ausruhen ist in jedem Alter und jedem Zeitfenster dabei", () => {
  for (const age of [12, 16]) {
    const st = E.newGame(cfg, "t", "x", age);
    for (let day = 1; day <= E.totalDays(cfg, st); day++) {
      st.day = day;
      for (const slot of E.SLOTS) {
        const a = E.offeredActivities(cfg, st, slot);
        assert.ok(a.some(x => x.id === "ausruhen"), `Alter ${age} Tag ${day} ${slot}`);
        assert.deepEqual(a.map(x => x.id), E.offeredActivities(cfg, st, slot).map(x => x.id));
      }
    }
  }
});

test("Playlist zusammenstellen schaltet «Eigene Playlist hören» frei (+12 Energie)", () => {
  const st = E.newGame(cfg, "t", "x", 12);
  const hoeren = cfg.activities.find(a => a.id === "playlist_hoeren");
  assert.equal(hoeren.effects.energie, 12);
  assert.equal(E.activityStatus(cfg, st, hoeren, "abend").ok, false);
  st.event = null;
  st.plan = { nachmittag: "b_playlist", abend: "ausruhen", wochenende: "familie" };
  E.endDay(cfg, st, () => 0.9);
  assert.equal(E.activityStatus(cfg, st, hoeren, "abend").ok, true);
  assert.ok(E.offeredActivities(cfg, st, "abend").some(a => a.id === "playlist_hoeren"));
});

test("Seltene Aktivitäten erscheinen etwa so oft wie eingestellt", () => {
  const israel = cfg.activities.find(a => a.id === "r_spende_israel");
  const konzert = cfg.activities.find(a => a.id === "r_konzertticket");
  let ultra = 0, selten = 0;
  const N = 200000;
  for (let i = 0; i < N; i++) {
    const st = { started: "s" + i, day: 1 };
    if (E.SLOTS.some(sl => E.rareAppears(st, israel, sl))) ultra++;
    if (E.SLOTS.some(sl => E.rareAppears(st, konzert, sl))) selten++;
    assert.ok(E.SLOTS.filter(sl => E.rareAppears(st, israel, sl)).length <= 1);
  }
  assert.ok(ultra / N > 0.0005 && ultra / N < 0.002, "ultra " + ultra / N);
  assert.ok(selten / N > 0.04 && selten / N < 0.06, "selten " + selten / N);
});

test("Spende an Israel: braucht Fr. 10 000 inkl. Sparkonto, gibt +20 auf die anderen Werte", () => {
  const st = E.newGame(cfg, "t", "x", 12);
  const act = cfg.activities.find(a => a.id === "r_spende_israel");
  st.konto = 1000; st.spar = 8000;
  assert.equal(E.activityStatus(cfg, st, act, "abend").ok, false);
  st.spar = 9000;
  assert.equal(E.activityStatus(cfg, st, act, "abend").ok, true);
  for (const id of ["zufriedenheit", "wertstiftung", "energie", "beziehungen"]) assert.equal(act.effects[id], 20);
});

test("Ereignisse nach Alter: Schulereignisse nicht mehr mit 22", () => {
  for (let s = 1; s <= 30; s++) {
    const st = playGame(s, 14);
    for (const h of st.history.filter(h => h.event)) {
      const ev = cfg.events.find(e => e.id === h.event.id);
      if (ev.maxAge) assert.ok(h.age <= ev.maxAge, `${ev.id} mit ${h.age}`);
      if (ev.minAge) assert.ok(h.age >= ev.minAge, `${ev.id} mit ${h.age}`);
    }
  }
});

test("Ereignisse derselben Gruppe kommen nie beide vor", () => {
  for (let s = 1; s <= 60; s++) {
    const seen = playGame(s).seenEvents;
    assert.ok(!(seen.includes("pruefung") && seen.includes("pruefung_ok")), "Seed " + s);
    assert.ok(!(seen.includes("g_krypto_gewinn") && seen.includes("g_krypto_verlust")), "Seed " + s);
  }
});

test("Leasing läuft 16 Quartale, Schulden kosten Zins", () => {
  const st = E.newGame(cfg, "t", "x", 16);
  st.event = "g_leasing";
  E.chooseEventOption(cfg, st, 0);
  assert.equal(st.extraCosts[0].until, st.day + 16);
  st.konto = -1000; st.spar = 0; st.day = 5; st.event = null;
  E.startDay(cfg, st, () => 0.9);
  assert.ok(st.log.some(l => l.startsWith("Schuldzins")));
});

test("Ereignis-Wahl ohne Deckung ist gesperrt", () => {
  const st = E.newGame(cfg, "t", "x", 12);
  st.konto = 30; st.spar = 0;
  const ev = cfg.events.find(e => e.id === "sneaker");
  assert.deepEqual(E.eventOptionsAffordable(st, ev), [false, true]);
  st.event = "sneaker";
  E.chooseEventOption(cfg, st, 0);
  assert.equal(st.konto, 30);
});

test("Die Auswahl bleibt gleich, wenn man etwas wählt", () => {
  const st = E.newGame(cfg, "t", "x", 12);
  for (let day = 1; day <= 52; day++) {
    st.day = day; st.plan = {};
    for (const slot of E.SLOTS) {
      const before = E.offeredActivities(cfg, st, slot).map(a => a.id);
      st.plan[slot] = before.at(-1);
      assert.deepEqual(E.offeredActivities(cfg, st, slot).map(a => a.id), before);
    }
  }
});

test("Alle Inhalte sind gültig", () => {
  assert.equal(new Set(cfg.activities.map(a => a.id)).size, cfg.activities.length);
  assert.equal(new Set(cfg.events.map(e => e.id)).size, cfg.events.length);
  const flags = new Set([...cfg.activities.filter(a => a.grants).map(a => a.grants.flag), ...cfg.events.flatMap(e => e.options.map(o => o.flag)).filter(Boolean)]);
  for (const a of cfg.activities) {
    if (a.requires) assert.ok(flags.has(a.requires), a.id);
    assert.ok(a.when.length && a.when.every(w => E.SLOTS.includes(w)), a.id);
  }
  const phaseIds = new Set(cfg.phases.map(p => p.id));
  for (const e of cfg.events) for (const o of e.options) if (o.setPhase) assert.ok(phaseIds.has(o.setPhase), e.id);
});

test("Betreibung kommt sicher nach 2 Quartalen mit Schulden (ab 18)", () => {
  const st = E.newGame(cfg, "t", "x", 16);
  st.seenEvents.push(...cfg.events.filter(e => e.milestone).map(e => e.id));
  st.day = 9; st.konto = -2000; st.spar = 0;
  E.startDay(cfg, st, () => 0.9);
  assert.notEqual(st.event, "g_betreibung");
  st.day = 10;
  E.startDay(cfg, st, () => 0.9);
  assert.equal(st.event, "g_betreibung");
});

test("Geld-Wert springt am Geburtstag nicht", () => {
  const st = E.newGame(cfg, "t", "x", 16);
  st.konto = 3000; st.spar = 0;
  const vals = [];
  for (let d = 9; d <= 16; d++) { st.day = d; vals.push(E.moneyValue(cfg, st)); }
  for (let i = 1; i < vals.length; i++) assert.ok(vals[i - 1] - vals[i] <= 15, vals.join(","));
});

test("Ausruhen darf man mehrmals pro Quartal wählen", () => {
  const st = E.newGame(cfg, "t", "x", 12);
  const r = cfg.activities.find(a => a.id === "ausruhen");
  st.plan = { nachmittag: "ausruhen" };
  assert.equal(E.activityStatus(cfg, st, r, "abend").ok, true);
});

test("Kreditkarte und Leasing sind sichere Entscheidungen, Berufswahl vor anderen Meilensteinen", () => {
  for (const id of ["g_kreditkarte", "g_leasing"]) assert.ok(cfg.events.find(e => e.id === id).milestone, id);
  const st = playGame(7, 14, s => (s.event === "m_berufswahl" ? 1 : 0));
  const at18 = st.history.filter(h => h.age === 18 && h.event).map(h => h.event.id);
  assert.equal(at18[0], "m_matura");
});
