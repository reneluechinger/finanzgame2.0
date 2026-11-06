// Spiellogik ohne Oberfläche. Alle Funktionen verändern den übergebenen Zustand.
// Ein Spieltag ist ein Quartal, 4 Spieltage sind ein Lebensjahr.

export const SLOTS = ["nachmittag", "abend", "wochenende"];
export const SLOT_NAMES = { nachmittag: "Nachmittag", abend: "Abend", wochenende: "Wochenende" };
export const QUARTERS = ["Frühling", "Sommer", "Herbst", "Winter"];
export const RARITY = {
  selten: { chance: 0.05, label: "Selten" },
  "sehr selten": { chance: 0.01, label: "Sehr selten" },
  ultra: { chance: 0.001, label: "Ultra-selten" }
};

const clamp = (x, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, x));
const round1 = x => Math.round(x * 10) / 10;
const round10 = x => Math.round(x / 10) * 10;

export const slotsFor = () => SLOTS;
export const totalDays = (cfg, state) => Math.max(1, (cfg.endAge - state.startAge) * 4);
export const ageAt = (state, day = state.day) => state.startAge + Math.floor((day - 1) / 4);
export const quarterIndex = day => (day - 1) % 4;
export const yearOf = day => Math.ceil(day / 4);
export const isYearEnd = day => day % 4 === 0;

export function phaseOf(cfg, state) {
  return cfg.phases.find(p => p.id === state.phase) || cfg.phases[0];
}

// Geld-Wert 100 entspricht je nach Alter einem anderen Polster (linear zwischen den Stützwerten)
export function moneyTarget(cfg, age) {
  const pts = Object.entries(cfg.moneyTargets || { 12: 300 }).map(([a, v]) => [Number(a), Number(v)]).sort((a, b) => a[0] - b[0]);
  if (age <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [a0, v0] = pts[i - 1], [a1, v1] = pts[i];
    if (age <= a1) return v0 + (v1 - v0) * (age - a0) / (a1 - a0);
  }
  return pts.at(-1)[1];
}

export function moneyValue(cfg, state) {
  const age = ageAt(state, Math.min(state.day, totalDays(cfg, state)));
  return clamp(Math.round((state.konto + state.spar) / moneyTarget(cfg, age) * 100));
}

export function allValues(cfg, state, raw = state.values) {
  const out = {};
  for (const v of cfg.values) out[v.id] = v.money ? moneyValue(cfg, state) : clamp(Math.round(raw[v.id] ?? 0));
  return out;
}

export function scoreOf(values) {
  const arr = Object.values(values);
  if (!arr.length) return { score: 0, avg: 0, gap: 0, zeros: 0 };
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  const gap = Math.max(...arr) - Math.min(...arr);
  const zeros = arr.filter(v => v <= 0).length;
  const score = clamp(Math.round(avg - 0.5 * gap - 5 * zeros));
  const avgR = Math.round(avg);
  const shownGap = score > 0 ? avgR - score - 5 * zeros : Math.round(gap * 0.5);
  return { score, avg: avgR, gap: shownGap, zeros };
}

export function newGame(cfg, nickname, variant, startAge = cfg.minStartAge) {
  startAge = Math.round(clamp(Number(startAge) || cfg.minStartAge, cfg.minStartAge, Math.min(cfg.maxStartAge, cfg.endAge - 1)));
  const values = {};
  for (const v of cfg.values) if (!v.money) values[v.id] = v.start ?? 50;
  const state = {
    variant, nickname, startAge, day: 1,
    konto: (cfg.startMoney || 0) + (startAge - 12) * (cfg.startMoneyPerYear || 0), spar: 0, values,
    phase: cfg.phases[0]?.id, phaseSince: 1, phaseLog: [{ day: 1, phase: cfg.phases[0]?.id }], incomeBonus: 0,
    flags: {}, extraCosts: [], plan: {}, history: [], reflections: {}, income: {}, paid: {},
    seenEvents: [], log: [], event: null, status: "day", started: new Date().toISOString()
  };
  startDay(cfg, state);
  return state;
}

export function flagActive(state, flag) {
  const f = state.flags[flag];
  return !!f && state.day >= f.from && (f.until == null || state.day <= f.until);
}

function energyId(cfg) {
  return cfg.values.find(v => v.energy)?.id;
}

// So stark wirkt ein Effekt wirklich: negative Energie-Effekte sind um energyCostFactor kleiner
export function effectiveDelta(cfg, id, d) {
  return d < 0 && id === energyId(cfg) ? d * (cfg.energyCostFactor ?? 1) : d;
}

function applyEffects(cfg, state, effects = {}, factor = 1) {
  const cap = cfg.softCap ?? 70;
  for (const [id, raw] of Object.entries(effects)) {
    if (!(id in state.values)) continue;
    const d = effectiveDelta(cfg, id, raw);
    const v = state.values[id];
    // Hohe Werte steigen langsamer (ab softCap abnehmend)
    const f = d > 0 ? factor * (v < cap ? 1 : Math.max(0, (100 - v) / (100 - cap))) : 1;
    state.values[id] = clamp(v + d * f);
  }
}

function isTired(cfg, state) {
  const id = energyId(cfg);
  return !!id && state.values[id] < cfg.lowEnergyLimit;
}

function addIncome(state, amount) {
  const age = ageAt(state);
  state.income[age] = round1((state.income[age] || 0) + amount);
}
function addPaid(state, name, amount) {
  state.paid[name] = round1((state.paid[name] || 0) + amount);
}

// Einkommen der Lebensphase in diesem Quartal
export function phaseIncome(cfg, state) {
  const p = phaseOf(cfg, state);
  const age = ageAt(state);
  let base = 0;
  if (p.incomeByAge) {
    for (const [a, v] of Object.entries(p.incomeByAge).sort((x, y) => x[0] - y[0])) if (age >= Number(a)) base = Number(v);
  } else {
    const list = Array.isArray(p.income) ? p.income : [p.income || 0];
    const year = Math.floor((state.day - (state.phaseSince || 1)) / 4);
    base = Number(list[Math.min(year, list.length - 1)]) || 0;
  }
  return Math.round(p.working ? base * (1 + (state.incomeBonus || 0)) : base);
}

export function taxFor(cfg, state, income) {
  const t = cfg.tax;
  if (!t) return 0;
  const deduction = state.flags.saeule3a ? (t.saeule3aDeduction || 0) : 0;
  return Math.max(0, round10((income - (t.freeAmount || 0) - deduction) * (t.rate || 0) / 100));
}

// Wird zu Beginn jedes Quartals aufgerufen: Geburtstag, Steuern, Zins, Einkommen, Kosten, Ereignis
export function startDay(cfg, state, rng = Math.random) {
  state.log = [];
  state.plan = {};
  const age = ageAt(state);
  const q = quarterIndex(state.day);
  if (state.day > 1 && q === 0) {
    state.log.push(`🎂 Du bist jetzt ${age}.`);
    const prev = age - 1;
    if (cfg.tax && prev >= cfg.tax.fromAge) {
      const t = taxFor(cfg, state, state.income[prev] || 0);
      if (t > 0) { pay(state, t); addPaid(state, "Steuern", t); }
      state.log.push(`Steuern für das Jahr mit ${prev}: −Fr. ${t}`);
    }
  }
  if (state.day > 1) {
    if (state.spar > 0 && cfg.interestPercent) {
      const z = round1(state.spar * cfg.interestPercent / 100);
      state.spar = round1(state.spar + z);
      state.log.push(`Zins Sparkonto: +Fr. ${z.toFixed(2)}`);
    }
    if (state.konto < 0 && cfg.debtInterestPercent) {
      const z = round1(-state.konto * cfg.debtInterestPercent / 100);
      state.konto = round1(state.konto - z);
      addPaid(state, "Schuldzins", z);
      state.log.push(`Schuldzins: −Fr. ${z.toFixed(2)}`);
    }
  }
  const p = phaseOf(cfg, state);
  const inc = phaseIncome(cfg, state);
  if (inc) {
    state.konto = round1(state.konto + inc);
    addIncome(state, inc);
    state.log.push(`${p.incomeLabel || "Einkommen"}: +Fr. ${inc}`);
  }
  const pcost = Math.max(0, (p.cost || 0) - (p.costDiscountFlag && state.flags[p.costDiscountFlag] ? p.costDiscount || 0 : 0));
  if (pcost) {
    pay(state, pcost);
    addPaid(state, p.costLabel || "Lebenskosten", pcost);
    state.log.push(`${p.costLabel || "Lebenskosten"}: −Fr. ${pcost}`);
  }
  for (const c of cfg.costs || []) {
    if ((c.fromAge && age < c.fromAge) || (c.toAge && age > c.toAge)) continue;
    if (c.interval === "jahr" && q !== 0) continue;
    const amount = Math.max(0, c.amount - (c.discountFlag && state.flags[c.discountFlag] ? c.discount || 0 : 0));
    if (!amount) continue;
    pay(state, amount);
    addPaid(state, c.name, amount);
    state.log.push(`${c.name}: −Fr. ${amount}`);
  }
  for (const c of state.extraCosts) {
    if (state.day < c.added || (c.until && state.day > c.until)) continue;
    if (c.interval === "jahr" && (state.day - c.added) % 4 !== 0) continue;
    pay(state, c.amount);
    addPaid(state, c.name, c.amount);
    state.log.push(`${c.name}: −Fr. ${c.amount}`);
  }
  state.event = pickEvent(cfg, state, rng);
}

function pickEvent(cfg, state, rng) {
  const age = ageAt(state);
  const seen = id => state.seenEvents.includes(id);
  const inAge = e => (!e.minAge || age >= e.minAge) && (!e.maxAge || age <= e.maxAge);
  const okPhase = e => !e.phases?.length || e.phases.includes(state.phase);
  // Meilensteine zuerst: Sie kommen sicher, sobald das Alter erreicht ist
  const milestones = (cfg.events || []).filter(e => e.milestone && e.atAge && age >= e.atAge && !seen(e.id) && okPhase(e) && conditionOk(state, e.condition))
    .sort((a, b) => a.atAge - b.atAge);
  if (milestones.length) return milestones[0].id;
  if (state.day === 1 || rng() >= 0.5) return null;
  const seenGroups = cfg.events.filter(e => e.group && seen(e.id)).map(e => e.group);
  const pool = (cfg.events || []).filter(e => !e.milestone && !seen(e.id) && !(e.group && seenGroups.includes(e.group))
    && inAge(e) && okPhase(e) && conditionOk(state, e.condition));
  return pool.length ? pool[Math.floor(rng() * pool.length)].id : null;
}

function conditionOk(state, cond) {
  if (!cond) return true;
  if (cond.debt && state.konto + state.spar >= 0) return false;
  if (!cond.flag) return true;
  return cond.not ? !flagActive(state, cond.flag) : flagActive(state, cond.flag);
}

// Bezahlen: zuerst Konto, dann Sparkonto, Rest als Minus auf dem Konto
function pay(state, amount) {
  state.konto = round1(state.konto - amount);
  if (state.konto < 0 && state.spar > 0) {
    const take = Math.min(state.spar, -state.konto);
    state.spar = round1(state.spar - take);
    state.konto = round1(state.konto + take);
  }
}

export function eventOptionsAffordable(state, ev) {
  const cash = state.konto + state.spar;
  const ok = ev.options.map(o => !(o.money < 0) || cash + o.money >= 0);
  if (!ok.some(Boolean)) {
    const cheapest = ev.options.reduce((best, o, i) => ((o.money || 0) > (ev.options[best].money || 0) ? i : best), 0);
    ok[cheapest] = true;
  }
  return ok;
}

export function chooseEventOption(cfg, state, index) {
  const ev = cfg.events.find(e => e.id === state.event);
  if (!ev) return;
  const opt = ev.options[index];
  if (!opt || !eventOptionsAffordable(state, ev)[index]) return;
  if (opt.money) {
    if (opt.money < 0) pay(state, -opt.money);
    else { state.konto = round1(state.konto + opt.money); addIncome(state, opt.money); }
  }
  if (opt.savings) state.spar = round1(state.spar + opt.savings);
  if (opt.addCost) {
    const c = { ...opt.addCost, added: state.day + 1 };
    if (c.quarters) c.until = state.day + c.quarters;
    state.extraCosts.push(c);
  }
  if (opt.flag) state.flags[opt.flag] = { from: state.day, until: null };
  if (opt.removeFlag) delete state.flags[opt.removeFlag];
  if (opt.incomeBonus) state.incomeBonus = round1((state.incomeBonus || 0) * 100 + opt.incomeBonus * 100) / 100;
  if (opt.setPhase && cfg.phases.some(p => p.id === opt.setPhase)) {
    state.phase = opt.setPhase;
    state.phaseSince = state.day + 1;
    state.phaseLog.push({ day: state.day, phase: opt.setPhase });
  }
  applyEffects(cfg, state, opt.effects);
  state.seenEvents.push(ev.id);
  state.eventToday = { id: ev.id, choice: index };
  state.event = null;
}

const fitsSlot = (act, slot) => act.when?.includes(slot);
const inAgeRange = (act, age) => (!act.minAge || age >= act.minAge) && (!act.maxAge || age <= act.maxAge);
const phaseFits = (act, state) => !act.phases?.length || act.phases.includes(state.phase);

// Status einer Aktivität für das aktuelle Zeitfenster
export function activityStatus(cfg, state, act, slot) {
  const age = ageAt(state);
  if (!fitsSlot(act, slot) || !phaseFits(act, state) || (act.maxAge && age > act.maxAge)) return { ok: false, hidden: true };
  if (act.minAge && age < act.minAge) return { ok: false, locked: true, reason: `ab ${act.minAge} Jahren` };
  if (act.requires && !flagActive(state, act.requires)) return { ok: false, reason: act.lockedInfo || "Noch nicht freigeschaltet" };
  if (act.once && state.history.some(h => h.acts.includes(act.id))) return { ok: false, reason: "Schon erledigt" };
  const planned = Object.entries(state.plan).filter(([s]) => s !== slot).map(([, id]) => id);
  if (planned.includes(act.id)) return { ok: false, reason: "Dieses Quartal schon gewählt" };
  if (act.money < 0) {
    const spent = planned.map(id => cfg.activities.find(a => a.id === id)).reduce((s, a) => s + Math.min(0, a?.money || 0), 0);
    const cash = state.konto + (act.useSavings ? state.spar : 0);
    if (cash + spent + act.money < 0) return { ok: false, reason: act.useSavings ? "Zu wenig Geld auf Konto und Sparkonto" : "Zu wenig Geld auf dem Konto" };
  }
  return { ok: true };
}

function seededRng(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// Welche Job-Stufe passt zum Alter: früh einfache Jobs, später bessere
export const expectedTier = age => (age < 15 ? 1 : age < 18 ? 2 : 3);

// Seltene Aktivitäten erscheinen nur, wenn das Los für diesen Tag und dieses Zeitfenster passt
export function rareAppears(state, act, slot) {
  const r = RARITY[act.rarity];
  if (!r) return true;
  return seededRng(`${state.started}|${state.day}|${slot}|${act.id}`)() < r.chance;
}

// Aktivitäten, die in diesem Quartal in diesem Zeitfenster angeboten werden.
// Immer dabei: die gewählte, alle mit "core", freigeschaltete (requires) und seltene, die gerade aufgetaucht sind.
export function offeredActivities(cfg, state, slot) {
  const age = ageAt(state);
  const done = id => state.history.some(h => h.acts.includes(id));
  const pool = cfg.activities.filter(a => fitsSlot(a, slot) && inAgeRange(a, age) && phaseFits(a, state)
    && !(a.once && done(a.id)) && rareAppears(state, a, slot));
  const limit = cfg.offerCount || 0;
  const must = pool.filter(a => a.core || a.rarity || (a.requires && flagActive(state, a.requires)));
  let rest = pool.filter(a => !must.includes(a));
  if (limit && pool.length > limit) {
    // Gewichtetes Mischen: Jobs der passenden Stufe kommen häufiger
    const rng = seededRng(`${state.started}|${state.day}|${slot}`);
    const exp = expectedTier(age);
    const weight = a => (a.tier ? (a.tier === exp ? 3 : 1) : 2);
    rest = rest.map(a => ({ a, k: Math.pow(rng(), 1 / weight(a)) })).sort((x, y) => y.k - x.k).map(x => x.a);
    rest = rest.slice(0, Math.max(0, limit - must.length));
  }
  const chosen = [...must, ...rest];
  if (!chosen.some(a => (a.money || 0) >= 0 && !a.requires)) {
    const free = pool.find(a => (a.money || 0) >= 0 && !a.requires);
    if (free) chosen.push(free);
  }
  const picked = pool.find(a => a.id === state.plan[slot]);
  if (picked && !chosen.includes(picked)) chosen.push(picked);
  // Seltene zuerst, dann in der Reihenfolge der Liste
  return pool.filter(a => chosen.includes(a)).sort((x, y) => (y.rarity ? 1 : 0) - (x.rarity ? 1 : 0));
}

// Gesperrte Vorschau: Aktivitäten, die bald freigeschaltet werden (nicht die seltenen)
export function lockedActivities(cfg, state, slot) {
  const n = cfg.lockedPreview ?? 2;
  if (!n) return [];
  const age = ageAt(state);
  const list = cfg.activities.filter(a => fitsSlot(a, slot) && a.minAge > age && a.minAge < cfg.endAge && !a.rarity
    && (!a.phases?.length || a.phases.includes(state.phase)));
  if (!list.length) return [];
  const rng = seededRng(`${state.started}|lock|${state.day}|${slot}`);
  const next = Math.min(...list.map(a => a.minAge));
  const near = list.filter(a => a.minAge <= next + 1).map(a => ({ a, k: rng() + (a.minAge - next) })).sort((x, y) => x.k - y.k);
  return near.slice(0, n).map(x => x.a);
}

// Was mit einem bestimmten Alter neu dazukommt (für den Jahresrückblick)
export function unlocksAtAge(cfg, age) {
  return cfg.activities.filter(a => a.minAge === age && !a.rarity && !a.requires);
}

function simulateDay(cfg, state) {
  const tired = isTired(cfg, state);
  const factor = tired ? 0.5 : 1;
  // Zuerst der Alltag (Schule, Arbeit, Älterwerden), dann die eigenen Aktivitäten
  applyEffects(cfg, state, cfg.drift?.everyDay);
  applyEffects(cfg, state, phaseOf(cfg, state).drift);
  const age = ageAt(state);
  for (const d of cfg.ageDrift || []) {
    if ((d.fromAge && age < d.fromAge) || (d.toAge && age > d.toAge)) continue;
    if (d.ifFlag && !state.flags[d.ifFlag]) continue;
    if (d.ifNotFlag && state.flags[d.ifNotFlag]) continue;
    applyEffects(cfg, state, d.effects);
  }
  for (const slot of SLOTS) {
    const act = cfg.activities.find(a => a.id === state.plan[slot]);
    if (!act) continue;
    if (act.money) {
      if (act.money < 0) pay(state, -act.money);
      else { const m = round1(act.money * factor); state.konto = round1(state.konto + m); addIncome(state, m); }
    }
    applyEffects(cfg, state, act.effects, factor);
  }
  return tired;
}

export function previewValues(cfg, state) {
  const copy = JSON.parse(JSON.stringify(state));
  simulateDay(cfg, copy);
  return allValues(cfg, copy);
}

export function endDay(cfg, state, rng = Math.random) {
  const acts = SLOTS.map(s => state.plan[s]).filter(Boolean);
  const tired = simulateDay(cfg, state);
  for (const id of acts) {
    const act = cfg.activities.find(a => a.id === id);
    if (act?.grants?.flag) {
      const from = act.grants.delay === "next" ? state.day + 1 : state.day;
      state.flags[act.grants.flag] = { from, until: act.grants.duration ? state.day + act.grants.duration : null };
    }
  }
  const vals = allValues(cfg, state);
  state.history.push({
    day: state.day, age: ageAt(state), phase: state.phase, acts, values: vals, score: scoreOf(vals).score,
    konto: state.konto, spar: state.spar, event: state.eventToday || null, tired
  });
  state.eventToday = null;
  const finishedYear = isYearEnd(state.day);
  state.day += 1;
  if (state.day > totalDays(cfg, state)) {
    state.status = "done";
  } else if (finishedYear) state.status = "review";
  else { state.status = "day"; startDay(cfg, state, rng); }
}

export function continueAfterReview(cfg, state, rng = Math.random) {
  state.status = "day";
  startDay(cfg, state, rng);
}

export function transferSavings(state, amount) {
  if (amount > 0) amount = Math.min(amount, Math.max(0, state.konto));
  else amount = -Math.min(-amount, state.spar);
  state.konto = round1(state.konto - amount);
  state.spar = round1(state.spar + amount);
  return amount;
}

export function currentScore(cfg, state) {
  return scoreOf(allValues(cfg, state));
}
