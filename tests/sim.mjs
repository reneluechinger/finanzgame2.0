// Spielt sechs Strategien je 30-mal durch (Start mit 12 und mit 16), um die Zahlen abzustimmen: node tests/sim.mjs
import { DEFAULT_CONFIG as cfg } from "../js/config.js";
import * as E from "../js/engine.js";
if (process.env.OVR) Object.assign(cfg, JSON.parse(process.env.OVR));
const only = process.env.ONLY ? process.env.ONLY.split(",") : null;

const seeded = s => () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const gain = (a, id) => (id === "geld" ? (a.money || 0) / 60 : E.effectiveDelta(cfg, id, a.effects?.[id] || 0));
const best = (list, f) => list.reduce((x, y) => (f(y) > f(x) ? y : x), list[0]);
const clone = x => JSON.parse(JSON.stringify(x));

const pickEvent = {
  zufall: (st, ok, rng) => ok[Math.floor(rng() * ok.length)],
  gut: (st, ok) => best(ok, i => { const c = clone(st); E.chooseEventOption(cfg, c, i); return E.currentScore(cfg, c).score * 10 + (c.konto + c.spar) / 1000; })
};

const strategies = {
  nurArbeit: { act: (st, ok) => best(ok, a => a.money || 0), ev: "zufall" },
  nurSpass: { act: (st, ok) => best(ok, a => a.effects?.zufriedenheit || 0), ev: "zufall" },
  zufall: { act: (st, ok, rng) => ok[Math.floor(rng() * ok.length)], ev: "zufall" },
  // Faustregel: Abend immer ausruhen, sonst zufällig
  faustregel: { act: (st, ok, rng, slot) => (slot === "abend" && ok.find(a => a.id === "ausruhen")) || ok[Math.floor(rng() * ok.length)], ev: "zufall" },
  ausgewogen: {
    act: (st, ok) => {
      const v = E.allValues(cfg, st);
      const low = Object.entries(v).sort((a, b) => a[1] - b[1])[0][0];
      return best(ok, a => gain(a, low) * 2 + Object.keys(v).reduce((s, id) => s + gain(a, id), 0) * 0.3);
    }, ev: "zufall"
  },
  // Sehr ausgewogen: wählt mit Blick auf die Vorschau die Aktivität, die die Punkte am meisten hebt
  sehrAusgewogen: {
    act: (st, ok, rng, slot) => best(ok, a => {
      const c = clone(st); c.plan[slot] = a.id;
      const v = E.previewValues(cfg, c);
      return E.scoreOf(v).score + Math.min(...Object.values(v)) * 0.3 + (v.energie > 40 ? 0 : -5);
    }), ev: "gut"
  }
};

const startAges = process.argv[2] ? [Number(process.argv[2])] : [12, 16];
for (const age of startAges) {
  console.log(`--- Start mit ${age} ---`);
  for (const [name, strat] of Object.entries(strategies)) {
    if (only && !only.includes(name)) continue;
    const scores = [], ends = [];
    for (let seed = 1; seed <= 30; seed++) {
      const rng = seeded(seed), st = E.newGame(cfg, "t", "x", age);
      st.started = "sim" + seed;
      E.startDay(cfg, st, rng);
      while (st.status !== "done") {
        if (st.status === "review") { E.continueAfterReview(cfg, st, rng); continue; }
        if (st.event) {
          const ev = cfg.events.find(e => e.id === st.event);
          const ok = E.eventOptionsAffordable(st, ev).map((x, i) => (x ? i : -1)).filter(i => i >= 0);
          E.chooseEventOption(cfg, st, pickEvent[strat.ev](st, ok, rng));
        }
        for (const slot of E.SLOTS) {
          const ok = E.offeredActivities(cfg, st, slot).filter(a => E.activityStatus(cfg, st, a, slot).ok);
          st.plan[slot] = (strat.act(st, ok, rng, slot) || ok[0]).id;
        }
        E.endDay(cfg, st, rng);
      }
      scores.push(st.history.at(-1).score);
      ends.push(st.history.at(-1).values);
    }
    const avg = scores.reduce((a, b) => a + b) / scores.length;
    const meanVals = Object.fromEntries(Object.keys(ends[0]).map(k => [k, Math.round(ends.reduce((s, v) => s + v[k], 0) / ends.length)]));
    console.log(name.padEnd(15), "Ø", avg.toFixed(1).padStart(5), "min", String(Math.min(...scores)).padStart(3), "max", String(Math.max(...scores)).padStart(3), JSON.stringify(meanVals));
  }
}
