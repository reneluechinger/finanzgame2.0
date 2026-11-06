// Lokales Speichern und Teilen von Varianten per Link
import { DEFAULT_CONFIG } from "./config.js";

// Eigener Präfix: FinanzGame 1 und 2.0 laufen auf GitHub Pages unter derselben Adresse (gleicher Speicher)
const PREFIX = "finanzgame2:";

function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function set(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; }
}
function remove(key) {
  try { localStorage.removeItem(PREFIX + key); } catch { /* egal */ }
}

// Kurzer, stabiler Hash (cyrb53) für Varianten-ID und PIN
export function hash(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

// Frühere Berechnung der Varianten-ID (aus dem Inhalt). Wird nur noch einmal
// verwendet, um älteren Varianten ihre ID dauerhaft mitzugeben.
function legacyVariantId(cfg) {
  // PIN und Bestenlisten-URL gehören nicht zur Spielvariante
  const { pinHash, scriptUrl, ...rest } = cfg;
  return hash(JSON.stringify(rest)).slice(0, 6);
}

// Die ID bleibt gleich, auch wenn die Lehrperson die Variante später anpasst.
// So bleiben Spielstände und Bestenliste erhalten.
export const variantId = cfg => cfg.vid || legacyVariantId(cfg);

export const newVariantId = () => Math.random().toString(36).slice(2, 8);

// --- Herkunft der Variante: über einen Link geöffnet (Lernende) ---
export const setFromLink = v => set("fromLink", !!v);
// Geräte, die vor diesem Update eine Klassen-Variante gespeichert haben, gelten als Geräte von Lernenden.
// Auf dem eigenen Gerät macht das Speichern im Editor den Zugang wieder sichtbar.
export function isFromLink() {
  const v = get("fromLink", null);
  if (v !== null) return v;
  const stored = get("config");
  return !!stored && stored.vid !== "std" && !!stored.scriptUrl;
}

export const pinHash = pin => hash("finanzgame-pin:" + pin);
export const checkPin = (cfg, pin) => pinHash(pin) === (cfg.pinHash || pinHash("1234"));

// --- Konfiguration ---
export const loadConfig = () => sanitizeConfig(get("config") || structuredClone(DEFAULT_CONFIG));
export const saveConfig = cfg => set("config", cfg);
export const resetConfig = () => remove("config");

// --- Spielstände (einer pro Variante) ---
export const loadGame = variant => get("save:" + variant);
export const saveGame = state => set("save:" + state.variant, state);
export const deleteGame = variant => remove("save:" + variant);
export const lastNickname = () => get("nickname", "");
export const setNickname = n => set("nickname", n);

// --- Abgeschlossene Durchgänge (lokale Bestenliste) ---
export const loadRuns = () => get("runs", []);
export function addRun(run) {
  const runs = loadRuns();
  if (runs.some(r => r.name === run.name && r.variant === run.variant && r.started && r.started === run.started)) return;
  runs.push(run);
  set("runs", runs.slice(-200));
}

// --- Link-Codierung: JSON -> deflate -> base64url ---
function toB64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
const fromB64 = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

async function pipe(bytes, stream) {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function encodeConfig(cfg) {
  // Der PIN-Hash bleibt auf dem Gerät der Lehrperson
  const { pinHash: _, ...full } = cfg;
  const shared = compactDefaults(full);
  const bytes = new TextEncoder().encode(JSON.stringify(shared));
  if ("CompressionStream" in window) {
    try { return "z" + toB64(await pipe(bytes, new CompressionStream("deflate-raw"))); } catch { /* weiter ohne */ }
  }
  return "j" + toB64(bytes);
}

export async function decodeConfig(code) {
  const kind = code[0], bytes = fromB64(code.slice(1));
  const raw = kind === "z" ? await pipe(bytes, new DecompressionStream("deflate-raw")) : bytes;
  return sanitizeConfig(expandDefaults(JSON.parse(new TextDecoder().decode(raw))));
}

// Unveränderte Standard-Inhalte stehen im Link nur als ID. Das hält den Link kurz.
function defaultsById(key) {
  return new Map(sanitizeConfig(structuredClone(DEFAULT_CONFIG))[key].map(x => [x.id, x]));
}
function compactDefaults(cfg) {
  // Vergleich in bereinigter Form, damit gleiche Einträge auch gleich aussehen
  const norm = sanitizeConfig(structuredClone(cfg));
  const out = { ...norm };
  for (const key of ["activities", "events"]) {
    const defs = defaultsById(key);
    out[key] = norm[key].map(x => (defs.has(x.id) && JSON.stringify(defs.get(x.id)) === JSON.stringify(x) ? x.id : x));
  }
  return out;
}
function expandDefaults(cfg) {
  for (const key of ["activities", "events"]) {
    if (!Array.isArray(cfg[key])) continue;
    const defs = defaultsById(key);
    cfg[key] = cfg[key].map(x => (typeof x === "string" ? structuredClone(defs.get(x)) : x)).filter(Boolean);
  }
  return cfg;
}

// Bringt eine Variante (z.B. aus einem fremden Link) in eine sichere Form:
// Zahlen werden Zahlen, Farben echte Farbcodes, Listen echte Listen.
export const SLOT_IDS = ["nachmittag", "abend", "wochenende"];
const RARITIES = ["selten", "sehr selten", "ultra"];

export function sanitizeConfig(cfg) {
  const c = structuredClone(cfg || {});
  const n = (x, lo, hi, d) => { const v = Number(x); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
  const opt = (x, lo, hi) => { const v = Number(x); return Number.isFinite(v) && v !== 0 ? Math.max(lo, Math.min(hi, v)) : undefined; };
  const str = (x, max = 200) => (x == null ? "" : String(x).slice(0, max));
  const strList = x => (Array.isArray(x) ? x.map(v => str(v, 40)).filter(Boolean) : []);
  const D = DEFAULT_CONFIG;
  const prune = o => { for (const k of Object.keys(o)) if (o[k] === undefined || o[k] === "" || (Array.isArray(o[k]) && !o[k].length && k === "phases")) delete o[k]; return o; };
  c.name = str(c.name, 60) || "Standard";
  c.pinHash = str(c.pinHash, 40);
  c.scriptUrl = /^https:\/\/script\.google(usercontent)?\.com\//.test(str(c.scriptUrl, 300)) ? str(c.scriptUrl, 300) : "";
  c.minStartAge = Math.round(n(c.minStartAge, 6, 30, D.minStartAge));
  c.maxStartAge = Math.round(n(c.maxStartAge, c.minStartAge, 30, D.maxStartAge));
  c.endAge = Math.round(n(c.endAge, c.minStartAge + 1, 40, D.endAge));
  c.startMoney = n(c.startMoney, -100000, 1000000, D.startMoney);
  c.startMoneyPerYear = n(c.startMoneyPerYear, 0, 100000, D.startMoneyPerYear);
  const mt = c.moneyTargets && typeof c.moneyTargets === "object" ? c.moneyTargets : D.moneyTargets;
  c.moneyTargets = Object.fromEntries(Object.entries(mt).map(([a, v]) => [String(Math.round(n(a, 0, 100, 12))), n(v, 1, 10000000, 1000)]));
  if (!Object.keys(c.moneyTargets).length) c.moneyTargets = { ...D.moneyTargets };
  const pl = c.priceLevel && typeof c.priceLevel === "object" ? c.priceLevel : D.priceLevel;
  c.priceLevel = Object.fromEntries(Object.entries(pl || {}).map(([a, v]) => [String(Math.round(n(a, 0, 100, 12))), n(v, 0, 100, 1)]));
  c.interestPercent = n(c.interestPercent, 0, 100, D.interestPercent);
  c.debtInterestPercent = n(c.debtInterestPercent, 0, 100, D.debtInterestPercent);
  c.lowEnergyLimit = n(c.lowEnergyLimit, 0, 100, D.lowEnergyLimit);
  c.energyCostFactor = n(c.energyCostFactor, 0, 3, D.energyCostFactor);
  c.softCap = n(c.softCap, 0, 99, D.softCap);
  c.lockedPreview = Math.round(n(c.lockedPreview, 0, 10, D.lockedPreview));
  const t = c.tax && typeof c.tax === "object" ? c.tax : D.tax;
  c.tax = { fromAge: n(t.fromAge, 0, 100, 18), freeAmount: n(t.freeAmount, 0, 10000000, 0), rate: n(t.rate, 0, 100, 0) };
  const effects = e => Object.fromEntries(Object.entries(e && typeof e === "object" ? e : {})
    .map(([k, v]) => [str(k, 40), n(v, -100, 100, 0)]));
  c.values = (Array.isArray(c.values) ? c.values : []).map(v => ({
    ...v, id: str(v.id, 40), name: str(v.name, 40), icon: str(v.icon, 8),
    color: /^#[0-9a-f]{6}$/i.test(v.color) ? v.color : "#7a6cf0",
    ...(v.money ? { money: true } : { start: n(v.start, 0, 100, 50) })
  }));
  c.drift = { everyDay: effects(c.drift?.everyDay) };
  c.phases = (Array.isArray(c.phases) && c.phases.length ? c.phases : structuredClone(D.phases)).map(p => prune({
    id: str(p.id, 40) || "phase", name: str(p.name, 60), icon: str(p.icon, 8), incomeLabel: str(p.incomeLabel, 60),
    income: (Array.isArray(p.income) ? p.income : [p.income ?? 0]).map(x => n(x, 0, 1000000, 0)),
    incomeByAge: p.incomeByAge && typeof p.incomeByAge === "object"
      ? Object.fromEntries(Object.entries(p.incomeByAge).map(([a, v]) => [String(Math.round(n(a, 0, 100, 12))), n(v, 0, 1000000, 0)])) : undefined,
    costLabel: str(p.costLabel, 80), cost: n(p.cost, 0, 1000000, 0),
    costDiscountFlag: str(p.costDiscountFlag, 40) || undefined, costDiscount: opt(p.costDiscount, 0, 1000000),
    working: p.working ? true : undefined, drift: effects(p.drift)
  }));
  c.ageDrift = (Array.isArray(c.ageDrift) ? c.ageDrift : []).map(d => prune({
    fromAge: opt(d.fromAge, 0, 100), toAge: opt(d.toAge, 0, 100), ifFlag: str(d.ifFlag, 40) || undefined,
    ifNotFlag: str(d.ifNotFlag, 40) || undefined, label: str(d.label, 60), effects: effects(d.effects)
  }));
  const costIv = x => (x === "jahr" ? "jahr" : "quartal");
  c.costs = (Array.isArray(c.costs) ? c.costs : []).map(x => prune({
    name: str(x.name, 60), amount: n(x.amount, 0, 1000000, 0), interval: costIv(x.interval),
    fromAge: opt(x.fromAge, 0, 100), toAge: opt(x.toAge, 0, 100),
    discountFlag: str(x.discountFlag, 40) || undefined, discount: opt(x.discount, 0, 1000000)
  }));
  c.activities = (Array.isArray(c.activities) ? c.activities : []).map(a => prune({
    ...a, id: str(a.id, 40), name: str(a.name, 60), icon: str(a.icon, 8), money: n(a.money, -1000000, 1000000, 0),
    when: (Array.isArray(a.when) ? a.when : []).map(w => str(w, 30)).filter(w => SLOT_IDS.includes(w)), effects: effects(a.effects),
    info: str(a.info), lockedInfo: str(a.lockedInfo),
    minAge: opt(a.minAge, 0, 100), maxAge: opt(a.maxAge, 0, 100), tier: opt(a.tier, 1, 3),
    rarity: RARITIES.includes(a.rarity) ? a.rarity : undefined, phases: strList(a.phases), useSavings: a.useSavings ? true : undefined,
    fixedMoney: a.fixedMoney ? true : undefined
  }));
  c.events = (Array.isArray(c.events) ? c.events : []).map(e => prune({
    ...e, id: str(e.id, 40), icon: str(e.icon, 8), text: str(e.text, 300),
    minAge: opt(e.minAge, 0, 100), maxAge: opt(e.maxAge, 0, 100), atAge: opt(e.atAge, 0, 100),
    milestone: e.milestone && e.atAge ? true : undefined, phases: strList(e.phases), urgent: e.urgent ? true : undefined,
    condition: e.condition && typeof e.condition === "object" && (e.condition.flag || e.condition.debt)
      ? prune({ flag: str(e.condition.flag, 40) || undefined, not: e.condition.not ? true : undefined, debt: e.condition.debt ? true : undefined }) : undefined,
    options: (Array.isArray(e.options) ? e.options : []).map(o => prune({
      ...o, label: str(o.label, 120), money: n(o.money, -1000000, 1000000, 0), savings: n(o.savings, 0, 1000000, 0),
      effects: effects(o.effects), setPhase: str(o.setPhase, 40) || undefined, flag: str(o.flag, 40) || undefined,
      removeFlag: str(o.removeFlag, 40) || undefined, incomeBonus: opt(o.incomeBonus, -1, 5),
      taxDeduction: opt(o.taxDeduction, 0, 1000000), taxable: o.taxable ? true : undefined,
      addCost: o.addCost ? prune({ name: str(o.addCost.name, 60), amount: n(o.addCost.amount, 0, 1000000, 0), interval: costIv(o.addCost.interval), quarters: opt(o.addCost.quarters, 1, 400) }) : undefined
    }))
  }));
  c.questions = (Array.isArray(c.questions) ? c.questions : []).map(q => str(q, 300)).filter(Boolean);
  c.finalQuestion = str(c.finalQuestion, 300);
  delete c.days;
  if (!c.vid) c.vid = legacyVariantId(c);
  c.vid = str(c.vid, 12).replace(/[^a-z0-9]/g, "") || "std";
  c.offerCount = Math.round(n(c.offerCount, 0, 50, D.offerCount));
  return migrateContent(c);
}

// Gespeicherte Varianten auf den neuen Stand bringen.
// Ab Version 2 (Geld-Progression): Geld- und Balance-Einstellungen sowie die Standard-Aktivitäten und
// -Ereignisse werden durch die neue Abstimmung ersetzt. Eigene Aktivitäten und Ereignisse bleiben.
const BALANCE_KEYS = ["startMoney", "startMoneyPerYear", "priceLevel", "moneyTargets", "phases", "costs", "drift",
  "softCap", "energyCostFactor", "tax", "ageDrift", "interestPercent", "debtInterestPercent"];
const REMOVED_ACTIVITIES = ["r_spende_israel"];
function migrateContent(c) {
  const target = DEFAULT_CONFIG.contentVersion;
  if ((c.contentVersion || 1) >= target) return c;
  if ((c.contentVersion || 1) < 2) {
    for (const k of BALANCE_KEYS) c[k] = structuredClone(DEFAULT_CONFIG[k]);
    for (const key of ["activities", "events"]) {
      const defs = new Map(DEFAULT_CONFIG[key].map(x => [x.id, x]));
      c[key] = c[key].map(x => (defs.has(x.id) ? structuredClone(defs.get(x.id)) : x));
    }
  }
  // Ab Version 3: entfernte Standard-Aktivitäten auch aus gespeicherten Varianten löschen
  if ((c.contentVersion || 1) < 3) c.activities = c.activities.filter(a => !REMOVED_ACTIVITIES.includes(a.id));
  for (const key of ["activities", "events"]) {
    const have = new Set(c[key].map(x => x.id));
    for (const d of DEFAULT_CONFIG[key]) {
      const existing = c[key].find(x => x.id === d.id);
      if (existing && d.core) existing.core = true;
      if (!have.has(d.id)) c[key].push(structuredClone(d));
    }
  }
  c.contentVersion = target;
  return c;
}

// Prüft eine Konfiguration grob, damit Tippfehler das Spiel nicht zerstören
export function validateConfig(cfg) {
  const errors = [];
  if (!Array.isArray(cfg.values) || cfg.values.length < 2) errors.push("Es braucht mindestens 2 Werte.");
  if (!cfg.values?.some(v => v.money)) errors.push("Ein Wert muss der Geld-Wert sein.");
  const ids = new Set(cfg.values?.map(v => v.id));
  if (ids.size !== cfg.values?.length) errors.push("Zwei Werte haben dieselbe ID.");
  if (!Array.isArray(cfg.activities) || cfg.activities.length < 3) errors.push("Es braucht mindestens 3 Aktivitäten.");
  for (const a of cfg.activities || []) {
    if (!a.id || !a.name) errors.push("Eine Aktivität hat keinen Namen.");
    if (!a.when?.length) errors.push(`«${a.name}» ist keinem Zeitfenster zugeordnet.`);
  }
  for (const e of cfg.events || []) if (!e.options?.length) errors.push(`Ereignis «${e.text}» hat keine Wahlmöglichkeit.`);
  if (!(cfg.endAge > cfg.maxStartAge)) errors.push("Das Endalter muss höher sein als das höchste Startalter.");
  if (!cfg.phases?.length) errors.push("Es braucht mindestens eine Lebensphase.");
  const phaseIds = new Set((cfg.phases || []).map(p => p.id));
  for (const e of cfg.events || []) for (const o of e.options || []) {
    if (o.setPhase && !phaseIds.has(o.setPhase)) errors.push(`Ereignis «${e.text}» wechselt in eine unbekannte Lebensphase «${o.setPhase}».`);
  }
  // Jedes Zeitfenster braucht in jedem Alter eine Aktivität, die immer geht (gratis, ohne Bedingung)
  const names = { nachmittag: "Nachmittag", abend: "Abend", wochenende: "Wochenende" };
  for (const [k, label] of Object.entries(names)) {
    for (let age = cfg.minStartAge; age < cfg.endAge; age++) {
      const ok = (cfg.activities || []).some(a => a.when?.includes(k) && (Number(a.money) || 0) >= 0 && !a.requires && !a.once && !a.rarity
        && !a.phases?.length && (!a.minAge || a.minAge <= age) && (!a.maxAge || a.maxAge >= age));
      if (!ok) { errors.push(`Für «${label}» braucht es mit ${age} Jahren eine Gratis-Aktivität ohne Bedingung.`); break; }
    }
  }
  return errors;
}
