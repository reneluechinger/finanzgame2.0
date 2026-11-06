import * as E from "./engine.js";
import * as S from "./storage.js";
import { radar, lines } from "./charts.js";
import { submitScore, fetchBoard } from "./leaderboard.js";
import { renderEditor } from "./editor.js";

const app = document.getElementById("app");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fr = n => (n < 0 ? "−" : "") + "Fr. " + Math.abs(n).toLocaleString("de-CH", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).replace(/’/g, "'");

let cfg, variant, state = null;
let activeSlot = null;
let modal = null; // "event" | "spar" | "menu" | null
let unlockedEditor = false;
let chosenAge = null;
let boardAge = "alle";

// ---------- Start ----------
async function init() {
  cfg = S.loadConfig();
  const m = location.hash.match(/^#v=(.+)$/);
  if (m) {
    try {
      const shared = await S.decodeConfig(m[1]);
      if (S.validateConfig(shared).length) throw new Error("ungültig");
      shared.pinHash = cfg.pinHash; // eigene PIN auf diesem Gerät behalten
      cfg = shared;
      S.saveConfig(cfg);
      S.setFromLink(true); // Lernende sehen den Zugang für Lehrpersonen nicht
    } catch {
      alert("Der Link zur Spielvariante ist beschädigt. Es wird die gespeicherte Variante verwendet.");
    }
    history.replaceState(null, "", location.pathname);
  }
  variant = S.variantId(cfg);
  state = S.loadGame(variant);
  if (state && !state.startAge) state = null; // Spielstände aus anderen Versionen nicht verwenden
  route();
}

function route() {
  if (location.hash === "#lehrperson") return showEditor();
  showStart();
}
window.addEventListener("hashchange", () => (location.hash.startsWith("#v=") ? init() : route()));

function save() { if (state) S.saveGame(state); }

const ages = () => Array.from({ length: cfg.maxStartAge - cfg.minStartAge + 1 }, (_, i) => cfg.minStartAge + i);
const quarters = age => (cfg.endAge - age) * 4;
const valueList = () => {
  const names = cfg.values.map(v => v.name);
  return names.length > 1 ? names.slice(0, -1).join(", ") + " und " + names.at(-1) : names.join("");
};

function showStart() {
  modal = null;
  const saved = state && state.status !== "done" ? state : null;
  const done = state && state.status === "done" ? state : null;
  const nick = saved?.nickname || S.lastNickname();
  if (!ages().includes(chosenAge)) chosenAge = cfg.minStartAge;
  app.innerHTML = `
  <div class="screen start">
    <h1 class="logo big">FinanzGame</h1>
    <p class="lead">Dein Leben bis ${esc(cfg.endAge)}, Quartal für Quartal. Halte ${esc(valueList())} im Gleichgewicht.</p>
    ${cfg.name !== "Standard" ? `<p class="variant sans">Variante: <b>${esc(cfg.name)}</b></p>` : ""}
    <div class="card start-card sans">
      ${done ? `
        <p>Das Spiel von <b>${esc(done.nickname)}</b> ist fertig: ${done.history.at(-1)?.score ?? 0} Punkte mit ${esc(cfg.endAge)}.</p>
        <button class="btn primary" data-a="continue">Lebensbilanz ansehen →</button>
        <button class="btn ghost" data-a="new-confirm">Neues Spiel</button>
      ` : saved ? `
        <p>Gespeichertes Spiel von <b>${esc(saved.nickname)}</b>: Du bist ${E.ageAt(saved, Math.min(saved.day, E.totalDays(cfg, saved)))}, Quartal ${Math.min(saved.day, E.totalDays(cfg, saved))} von ${E.totalDays(cfg, saved)}</p>
        <button class="btn primary" data-a="continue">Weiterspielen →</button>
        <button class="btn ghost" data-a="new-confirm">Neu beginnen</button>
      ` : `
        <label for="nick">Dein Spitzname (kein echter Name)</label>
        <input id="nick" maxlength="20" autocomplete="off" value="${esc(nick)}" placeholder="z.B. Sternschnuppe">
        <span class="label">Mit welchem Alter startest du?</span>
        <div class="agepick" role="group" aria-label="Startalter">
          ${ages().map(a => `<button class="age ${a === chosenAge ? "on" : ""}" data-a="age" data-age="${a}" aria-pressed="${a === chosenAge}">${a}</button>`).join("")}
        </div>
        <p class="small">Du spielst bis ${esc(cfg.endAge)}. Das sind ${quarters(chosenAge)} Quartale (ein Spieltag = 3 Monate). Nach jedem Jahr kannst du speichern und später weiterspielen.</p>
        <button class="btn primary" data-a="new">Spiel starten →</button>
      `}
    </div>
    <div class="row sans">
      <button class="btn ghost" data-a="help">So funktioniert's</button>
      <button class="btn ghost" data-a="board">🏆 Bestenliste</button>
    </div>
    ${S.isFromLink() ? "" : `<a class="teacher sans" href="#lehrperson">Für Lehrpersonen</a>`}
  </div>`;
}

// ---------- Spielbildschirm ----------
function showGame() {
  if (!state) return showStart();
  if (state.status === "review") return showReview();
  if (state.status === "done") return showFinal();
  const day = state.day, slots = E.SLOTS, total = E.totalDays(cfg, state);
  if (!activeSlot || !slots.includes(activeSlot)) activeSlot = slots.find(s => !state.plan[s]) || slots[0];
  const vals = E.allValues(cfg, state);
  const planned = slots.some(s => state.plan[s]);
  const preview = planned ? E.previewValues(cfg, state) : null;
  const sc = E.scoreOf(vals);
  const tired = (() => { const id = cfg.values.find(v => v.energy)?.id; return id && state.values[id] < cfg.lowEnergyLimit; })();
  const allSet = slots.every(s => state.plan[s]);
  const lowest = cfg.values.reduce((a, v) => (vals[v.id] < vals[a.id] ? v : a), cfg.values[0]);
  const age = E.ageAt(state), phase = E.phaseOf(cfg, state);

  const acts = E.offeredActivities(cfg, state, activeSlot).map(a => ({ a, st: E.activityStatus(cfg, state, a, activeSlot) })).filter(x => !x.st.hidden);
  const locked = E.lockedActivities(cfg, state, activeSlot);

  app.innerHTML = `
  <div class="screen game">
    <header class="top">
      <button class="logo linkish" data-a="menu" aria-label="Menü">FinanzGame ☰</button>
      <div class="meta sans">
        <span><b>${age} Jahre</b> · ${E.QUARTERS[E.quarterIndex(day)]} · ${esc(phase.icon)} ${esc(phase.name)} · Quartal ${day}/${total}</span>
        <button class="money ${state.konto < 0 ? "neg" : ""}" data-a="spar">Konto <b>${fr(state.konto)}</b> · Sparkonto ${fr(state.spar)}</button>
      </div>
    </header>
    <div class="progress"><i style="width:${(day - 1) / total * 100}%"></i></div>
    <div class="wrap">
      <section class="card radar">
        <h2>Dein Gleichgewicht</h2>
        ${radar(cfg.values, vals, preview)}
        <div class="score-row sans">
          <div><small>Punkte</small><b>${sc.score}</b></div>
          <div class="formula">Ø ${sc.avg} − Ungleichgewicht ${sc.gap}${sc.zeros ? ` − ${sc.zeros * 5} (Wert auf 0)` : ""}<br><span>Je runder die Form, desto mehr Punkte.</span></div>
        </div>
        ${preview ? `<p class="hint">Gestrichelt: So sieht es nach diesem Quartal aus.</p>` : ""}
      </section>
      <section class="side">
        ${state.log.length ? `<div class="log sans">${state.log.map(esc).join(" · ")}</div>` : ""}
        <div class="plan card sans">
          <div class="slot fixed"><small>Hauptsache</small><p>${esc(phase.icon)} ${esc(phase.name)}</p></div>
          ${slots.map(s => {
            const act = cfg.activities.find(a => a.id === state.plan[s]);
            return `<button class="slot ${s === activeSlot ? "now" : ""} ${act ? "on" : ""}" data-a="slot" data-slot="${s}">
              <small>${E.SLOT_NAMES[s]}</small><p>${act ? `${esc(act.icon)} ${esc(act.name)}` : "offen …"}</p></button>`;
          }).join("")}
        </div>
        <h3 class="ask">Was machst du dieses Quartal am ${E.SLOT_NAMES[activeSlot]}?</h3>
        <div class="acts sans">
          ${acts.map(({ a, st }) => `
            <button class="act ${state.plan[activeSlot] === a.id ? "hl" : ""} ${a.rarity ? "rare r-" + esc(a.rarity.replace(" ", "-")) : ""}" data-a="act" data-id="${esc(a.id)}" ${st.ok ? "" : "disabled"}>
              ${a.rarity ? `<span class="badge">✨ ${esc(E.RARITY[a.rarity]?.label)}</span>` : ""}
              <b>${esc(a.icon)} ${esc(a.name)}</b>
              <small>${effectText(a)}</small>
              ${!st.ok ? `<em>🔒 ${esc(st.reason)}</em>` : a.info ? `<em>${esc(a.info)}</em>` : ""}
            </button>`).join("")}
          ${locked.map(a => `
            <div class="act locked" aria-disabled="true">
              <b>🔒 ${esc(a.icon)} ${esc(a.name)}</b>
              <small>${effectText(a)}</small>
              <em>Ab ${esc(a.minAge)} Jahren</em>
            </div>`).join("")}
        </div>
        <p class="tip">${tired ? `⚠️ Du bist müde: Positive Effekte wirken nur halb. Gönn dir Erholung.` :
          `Tipp: ${esc(lowest.icon)} ${esc(lowest.name)} ist gerade am tiefsten.`}</p>
        <button class="btn primary end sans" data-a="end" ${allSet ? "" : "disabled"}>${allSet ? "Quartal beenden →" : "Wähle für jedes Zeitfenster etwas"}</button>
      </section>
    </div>
    ${modal ? renderModal() : ""}
  </div>`;
}

function arrow(d) {
  if (d > 0) return d >= 12 ? "↑↑↑" : d >= 8 ? "↑↑" : "↑";
  return d <= -12 ? "↓↓↓" : d <= -8 ? "↓↓" : "↓";
}

function effectText(a) {
  const parts = [];
  if (a.money) parts.push(`<span class="${a.money > 0 ? "pos" : "neg"}">${a.money > 0 ? "+" : ""}${fr(a.money)}</span>`);
  for (const v of cfg.values) {
    const raw = a.effects?.[v.id];
    if (!raw) continue;
    const d = E.effectiveDelta(cfg, v.id, raw);
    parts.push(`<span class="${d > 0 ? "pos" : "neg"}">${esc(v.name)} ${arrow(d)}</span>`);
  }
  if (a.grants?.delay === "next") parts.push(`<span class="pos">⏳ wirkt ab nächstem Quartal</span>`);
  return parts.join(" · ") || "keine Wirkung";
}

function renderModal() {
  if (modal === "event") {
    const ev = cfg.events.find(e => e.id === state.event);
    if (!ev) { modal = null; return ""; }
    const affordable = E.eventOptionsAffordable(state, ev);
    return `<div class="overlay"><div class="dialog ${ev.milestone ? "milestone" : ""}">
      ${ev.milestone ? `<p class="ms-label sans">Wichtige Entscheidung</p>` : ""}
      <div class="ev-icon">${esc(ev.icon)}</div>
      <p class="ev-text">${esc(ev.text)}</p>
      <div class="ev-opts sans">${ev.options.map((o, i) => `
        <button class="btn opt" data-a="ev" data-i="${i}" ${affordable[i] ? "" : "disabled"}><b>${esc(o.label)}</b><small>${optText(o)}${affordable[i] ? "" : " · Dafür reicht dein Geld nicht"}</small></button>`).join("")}</div>
    </div></div>`;
  }
  if (modal === "spar") {
    const steps = [100, 500, 1000];
    return `<div class="overlay"><div class="dialog sans">
      <h2>💰 Sparkonto</h2>
      <p>Konto: <b>${fr(state.konto)}</b> · Sparkonto: <b>${fr(state.spar)}</b></p>
      <p class="small">Jedes Quartal gibt es ${esc(cfg.interestPercent)} % Zins auf das Sparkonto (Spiel-Zins, auf echten Konten ist er viel tiefer). Geld auf dem Sparkonto kannst du nicht für Aktivitäten ausgeben, es hilft aber bei Notfällen. Ist dein Konto im Minus, zahlst du ${esc(cfg.debtInterestPercent)} % Schuldzins pro Quartal.</p>
      <div class="row">${steps.map(n => `<button class="btn ghost" data-a="sparen" data-n="${n}">+${n} sparen</button>`).join("")}<button class="btn ghost" data-a="sparen-alles">Alles sparen</button></div>
      <div class="row">${steps.map(n => `<button class="btn ghost" data-a="sparen" data-n="${-n}">${n} zurückholen</button>`).join("")}</div>
      <button class="btn primary" data-a="close">Fertig</button>
    </div></div>`;
  }
  if (modal === "menu") {
    return `<div class="overlay"><div class="dialog sans">
      <h2>Menü</h2>
      <p class="small">Dein Spiel wird nach jeder Aktion automatisch gespeichert.</p>
      <button class="btn ghost" data-a="help">So funktioniert's</button>
      <button class="btn ghost" data-a="home">Pause: zum Startbildschirm</button>
      <button class="btn primary" data-a="close">Weiterspielen</button>
    </div></div>`;
  }
  return "";
}

function optText(o) {
  const parts = [];
  if (o.money) parts.push(`${o.money > 0 ? "+" : ""}${fr(o.money)}`);
  if (o.savings) parts.push(`+${fr(o.savings)} aufs Sparkonto`);
  if (o.addCost) parts.push(`neue Kosten: ${fr(o.addCost.amount)} pro ${o.addCost.interval === "jahr" ? "Jahr" : "Quartal"}${o.addCost.quarters ? `, ${o.addCost.quarters} Quartale lang` : ""}`);
  if (o.setPhase) { const p = cfg.phases.find(x => x.id === o.setPhase); if (p) parts.push(`→ ${p.icon} ${p.name}`); }
  if (o.incomeBonus) parts.push(`Lohn ${o.incomeBonus > 0 ? "+" : ""}${Math.round(o.incomeBonus * 100)} %`);
  for (const v of cfg.values) {
    const d = o.effects?.[v.id];
    if (d) parts.push(`${v.name} ${arrow(E.effectiveDelta(cfg, v.id, d))}`);
  }
  return esc(parts.join(" · "));
}

// ---------- Jahresrückblick ----------
function showReview() {
  const year = E.yearOf(state.day - 1);
  const from = (year - 1) * 4 + 1, to = year * 4;
  const hist = state.history.filter(h => h.day >= from && h.day <= to);
  const before = state.history.find(h => h.day === from - 1);
  const ageNow = E.ageAt(state, from), ageNext = ageNow + 1;
  const q = cfg.questions.length ? cfg.questions[(year - 1) % cfg.questions.length] : "";
  const scStart = before ? before.score : null, scEnd = hist.at(-1)?.score ?? 0;
  const unlocks = E.unlocksAtAge(cfg, ageNext);
  const income = state.income[ageNow] || 0;
  const taxNext = cfg.tax && ageNow >= cfg.tax.fromAge ? E.taxFor(cfg, state, income) : null;
  app.innerHTML = `
  <div class="screen review">
    <h1 class="logo">Rückblick: Dein Jahr mit ${ageNow}</h1>
    <div class="grid2">
      <section class="card">
        <h2>So haben sich deine Werte entwickelt</h2>
        ${lines(cfg.values, hist, { from, to, startValues: before?.values, label: d => E.QUARTERS[E.quarterIndex(d)] })}
      </section>
      <section class="card sans">
        <p class="bigscore">${scEnd} <small>Punkte</small></p>
        ${scStart != null ? `<p>${scEnd >= scStart ? "▲" : "▼"} ${Math.abs(scEnd - scStart)} Punkte seit letztem Jahr</p>` : ""}
        <p>Konto ${fr(state.konto)} · Sparkonto ${fr(state.spar)}</p>
        <p>Einkommen in diesem Jahr: ${fr(income)}${taxNext != null ? `<br>Steuerrechnung dafür im neuen Jahr: ${fr(taxNext)} <span class="small">(vereinfacht)</span>` : ""}</p>
        ${topActs(hist)}
      </section>
    </div>
    <section class="card sans next-year">
      <h2>🎂 Bald wirst du ${ageNext}</h2>
      ${unlocks.length ? `<p><b>Neu möglich:</b> ${unlocks.map(a => `${esc(a.icon)} ${esc(a.name)}`).join(" · ")}</p>` : `<p>Keine neuen Aktivitäten, aber vielleicht neue Ereignisse.</p>`}
      ${ageNext === cfg.tax?.fromAge ? `<p>Mit ${ageNext} zahlst du zum ersten Mal Steuern auf dein Einkommen.</p>` : ""}
      ${(cfg.costs || []).filter(c => c.fromAge === ageNext).map(c => `<p>Neu: ${esc(c.name)} ${fr(c.amount)} pro ${c.interval === "jahr" ? "Jahr" : "Quartal"}</p>`).join("")}
    </section>
    <section class="card sans">
      <label for="refl"><b>Nachdenken:</b> ${esc(q)}</label>
      <textarea id="refl" data-key="${year}" rows="3" placeholder="Schreib ein paar Sätze …">${esc(state.reflections[year] || "")}</textarea>
    </section>
    <div class="row sans right">
      <button class="btn ghost" data-a="review-pause">Speichern und beenden</button>
      <button class="btn primary" data-a="review-next">Weiter mit ${ageNext} →</button>
    </div>
  </div>`;
}

function topActs(hist) {
  const count = {};
  hist.forEach(h => h.acts.forEach(id => (count[id] = (count[id] || 0) + 1)));
  const top = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 4);
  if (!top.length) return "";
  return `<p><b>Am häufigsten gewählt:</b></p><ul class="tops">${top.map(([id, n]) => {
    const a = cfg.activities.find(x => x.id === id);
    return `<li>${esc(a?.icon)} ${esc(a?.name || id)} <span>${n}×</span></li>`;
  }).join("")}</ul>`;
}

function saveReflection() {
  const ta = document.getElementById("refl");
  if (ta && state) state.reflections[ta.dataset.key] = ta.value.trim();
}

// ---------- Lebensbilanz mit 25 ----------
function showFinal() {
  const last = state.history.at(-1);
  const vals = last.values;
  const sc = E.scoreOf(vals);
  const total = E.totalDays(cfg, state);
  const years = Math.ceil(total / 4);
  const eventsTaken = state.history.filter(h => h.event).map(h => {
    const ev = cfg.events.find(e => e.id === h.event.id);
    return ev ? `<li${ev.milestone ? ` class="ms"` : ""}>${h.age}: ${esc(ev.icon)} ${esc(ev.text)} → <b>${esc(ev.options[h.event.choice]?.label)}</b></li>` : "";
  });
  const milestones = eventsTaken.filter(x => x.includes('class="ms"')).join("");
  const others = eventsTaken.filter(x => x && !x.includes('class="ms"')).slice(-8).join("");
  const path = (state.phaseLog || []).map(p => { const ph = cfg.phases.find(x => x.id === p.phase); return ph ? `${E.ageAt(state, p.day)}: ${ph.icon} ${ph.name}` : ""; }).join(" → ");
  const paid = Object.entries(state.paid || {}).sort((a, b) => b[1] - a[1]);
  const earned = Object.values(state.income || {}).reduce((a, b) => a + b, 0);
  app.innerHTML = `
  <div class="screen final">
    <header class="top"><h1 class="logo">Deine Lebensbilanz mit ${esc(cfg.endAge)}</h1><span class="sans">${esc(state.nickname)} · Start mit ${esc(state.startAge)} · ${new Date().toLocaleDateString("de-CH")}${cfg.name !== "Standard" ? " · " + esc(cfg.name) : ""}</span></header>
    <div class="grid2">
      <section class="card radar">${radar(cfg.values, vals)}
        <div class="score-row sans"><div><small>Endpunktzahl</small><b>${sc.score}</b></div>
        <div class="formula">Ø ${sc.avg} − Ungleichgewicht ${sc.gap}${sc.zeros ? ` − ${sc.zeros * 5}` : ""}</div></div>
      </section>
      <section class="card sans">
        <h2>Verlauf von ${esc(state.startAge)} bis ${esc(cfg.endAge)}</h2>
        ${lines(cfg.values, state.history, { from: 1, to: total, label: d => (E.quarterIndex(d) === 0 ? String(E.ageAt(state, d)) : null) })}
        <p>Konto ${fr(state.konto)} · Sparkonto ${fr(state.spar)}</p>
        <p class="small">Dein Weg: ${esc(path)}</p>
      </section>
    </div>
    <div class="grid2">
      <section class="card sans">
        <h2>Geld in ${years} Jahren (vereinfacht)</h2>
        <p>Eingenommen: <b>${fr(Math.round(earned))}</b></p>
        <table class="money-t">${paid.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${fr(Math.round(v))}</td></tr>`).join("")}</table>
        ${topActs(state.history)}
      </section>
      <section class="card sans">
        ${milestones ? `<p><b>Deine wichtigen Entscheidungen:</b></p><ul class="evlist">${milestones}</ul>` : ""}
        ${others ? `<p><b>Weitere Entscheidungen (die letzten):</b></p><ul class="evlist">${others}</ul>` : ""}
      </section>
    </div>
    <section class="card sans">
      <h2>Deine Gedanken</h2>
      ${Array.from({ length: years - 1 }, (_, i) => i + 1).map(y => state.reflections[y] ? `<p class="refl-q">Mit ${state.startAge + y - 1}: ${esc(cfg.questions[(y - 1) % cfg.questions.length])}</p><p class="refl-a">${esc(state.reflections[y])}</p>` : "").join("")}
      <label for="refl"><b>${esc(cfg.finalQuestion || cfg.questions.at(-1) || "")}</b></label>
      <textarea id="refl" data-key="final" rows="3">${esc(state.reflections.final || "")}</textarea>
    </section>
    <div class="row sans right noprint">
      ${state.submitted ? `<span class="ok">✓ In der Bestenliste eingetragen</span>` : `<button class="btn ghost" data-a="submit">🏆 Nochmals versuchen</button>`}
      <button class="btn ghost" data-a="print">Drucken / als PDF speichern</button>
      <button class="btn primary" data-a="new-confirm">Neues Spiel</button>
    </div>
    <p class="sans small noprint" id="submit-msg"></p>
  </div>`;
}

let sending = false;
async function submitRun() {
  const run = state;
  if (!run || run.status !== "done" || run.submitted || sending) return;
  sending = true;
  const btn = document.querySelector('[data-a="submit"]');
  if (btn) btn.disabled = true;
  const msgEl = document.getElementById("submit-msg");
  if (msgEl) msgEl.textContent = "Wird in die Bestenliste eingetragen …";
  const last = run.history.at(-1);
  const res = await submitScore(cfg, { name: run.nickname, score: last.score, variant: run.variant, startAge: run.startAge, date: new Date().toISOString(), started: run.started, values: last.values });
  sending = false;
  if (res.online || !cfg.scriptUrl) run.submitted = true;
  if (state === run) save();
  if (state !== run || !document.querySelector(".final")) return;
  showFinal();
  document.getElementById("submit-msg").textContent = res.online
    ? "Eingetragen in die gemeinsame Bestenliste."
    : cfg.scriptUrl ? "Keine Verbindung zur gemeinsamen Liste. Tippe später auf «Nochmals versuchen»." : "Auf diesem Gerät gespeichert.";
}

// ---------- Bestenliste ----------
let boardData = null;
async function showBoard(reload = true) {
  if (reload || !boardData) {
    app.innerHTML = `<div class="screen board"><h1 class="logo">🏆 Bestenliste</h1><div class="card sans"><p>Lade …</p></div></div>`;
    boardData = await fetchBoard(cfg, variant);
  }
  const { online, entries, error } = boardData;
  const shown = boardAge === "alle" ? entries : entries.filter(e => String(e.startAge) === String(boardAge));
  app.innerHTML = `
  <div class="screen board">
    <h1 class="logo">🏆 Bestenliste</h1>
    <p class="sans small">${online ? "Gemeinsame Liste der Klasse" : cfg.scriptUrl ? `Keine Verbindung (${esc(error)}), es werden nur Durchgänge auf diesem Gerät gezeigt.` : "Durchgänge auf diesem Gerät"}${cfg.name !== "Standard" ? ` · Variante ${esc(cfg.name)}` : ""}</p>
    <div class="row sans agefilter" role="group" aria-label="Nach Startalter filtern">
      <span class="small">Startalter:</span>
      ${["alle", ...ages()].map(a => `<button class="age ${String(a) === String(boardAge) ? "on" : ""}" data-a="board-age" data-age="${a}">${a === "alle" ? "Alle" : a}</button>`).join("")}
    </div>
    <div class="card sans">
      ${shown.length ? `<table class="board-t"><thead><tr><th>#</th><th>Spitzname</th><th>Punkte</th><th>Start</th><th>Datum</th></tr></thead><tbody>
        ${shown.map((e, i) => `<tr><td>${i + 1}</td><td>${esc(e.name)}</td><td><b>${esc(e.score)}</b></td><td>${e.startAge ? esc(e.startAge) : "–"}</td><td>${esc(new Date(e.date).toLocaleDateString("de-CH"))}</td></tr>`).join("")}
      </tbody></table>` : `<p>Noch keine Einträge${boardAge !== "alle" ? " mit diesem Startalter" : ""}. Spiel bis ${esc(cfg.endAge)} und trag dich ein!</p>`}
    </div>
    <button class="btn primary sans" data-a="home">Zurück</button>
  </div>`;
}

// ---------- Anleitung ----------
function showHelp() {
  const backTo = state && state.status === "day" ? "continue" : "home";
  const wert = cfg.values.find(v => v.id === "wertstiftung");
  const pct = Math.round((1 - (cfg.energyCostFactor ?? 1)) * 100);
  app.innerHTML = `
  <div class="screen help">
    <h1 class="logo">So funktioniert's</h1>
    <div class="card sans helptext">
      <p><b>Ziel:</b> Du spielst dein Leben von ${esc(cfg.minStartAge)}–${esc(cfg.maxStartAge)} bis ${esc(cfg.endAge)}. Halte alle Werte möglichst hoch und im Gleichgewicht:</p>
      <ul>${cfg.values.map(v => `<li>${esc(v.icon)} <b>${esc(v.name)}</b>${v.money ? ` (Konto + Sparkonto. Wie viel für 100 nötig ist, wächst mit dem Alter: mit ${esc(cfg.minStartAge)} sind es ${fr(Math.round(E.moneyTarget(cfg, cfg.minStartAge)))}, mit ${esc(cfg.endAge - 1)} ${fr(Math.round(E.moneyTarget(cfg, cfg.endAge - 1)))})` : ""}</li>`).join("")}</ul>
      <p><b>Ein Spieltag ist ein Quartal</b> (3 Monate), vier Spieltage sind ein Jahr. Du wählst, was du in dieser Zeit regelmässig machst: am Nachmittag, am Abend und am Wochenende. Die gestrichelte Linie zeigt dir, wie sich deine Werte verändern.</p>
      <p><b>Älter werden:</b> Viele Aktivitäten sind am Anfang gesperrt (🔒 ab 16). Mit jedem Geburtstag kommen neue dazu, und die Jobs werden besser bezahlt. Ausruhen geht immer.</p>
      <p><b>Lebensphasen:</b> Zuerst gehst du in die Oberstufe. Mit 16 wählst du Lehre oder Gymnasium, mit 18 nach dem Gymnasium Studium oder Arbeit. Jede Phase bringt Geld und kostet Energie.</p>
      <p><b>Erwachsen werden:</b> Ab ${esc(cfg.tax?.fromAge ?? 18)} zahlst du Steuern, ab 19 die Krankenkasse selbst. Verträge wie Leasing, Kreditkarte oder Ratenkauf kosten oft mehr, als man denkt. Alle Beträge sind vereinfacht.</p>
      ${wert ? `<p><b>${esc(wert.name)}</b> bedeutet: Du schaffst Nutzen für andere. Manchmal wirst du dafür bezahlt, manchmal nicht.</p>` : ""}
      <p><b>Selten:</b> Manche Aktivitäten tauchen nur ab und zu auf (✨ selten, sehr selten, ultra-selten). Greif zu, wenn es passt.</p>
      <p><b>Energie:</b> Ist sie unter ${esc(cfg.lowEnergyLimit)}, wirken gute Effekte nur halb.${pct > 0 ? ` Energie-Kosten sind in dieser Version um ${pct} % kleiner.` : ""} Hohe Werte steigen langsamer.</p>
      <p><b>Punkte</b> = Durchschnitt aller Werte − halber Abstand zwischen höchstem und tiefstem Wert. Für jeden Wert auf 0 gibt es 5 Punkte Abzug. Wer alles im Gleichgewicht hält, kommt nahe an 100.</p>
      <p><b>Nach jedem Jahr</b> gibt es einen Rückblick. Dort kannst du speichern und später weiterspielen. Alles wird nur auf diesem Gerät gespeichert.</p>
    </div>
    <button class="btn primary sans" data-a="${backTo}">Zurück</button>
  </div>`;
}

// ---------- Lehrpersonen ----------
function showEditor() {
  if (!unlockedEditor) {
    app.innerHTML = `<div class="screen start"><h1 class="logo">Für Lehrpersonen</h1>
      <div class="card start-card sans"><label for="pin">PIN eingeben</label>
      <input id="pin" type="password" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
      <button class="btn primary" data-a="pin">Öffnen</button>
      <p class="small">Standard-PIN beim ersten Mal: 1234. Bitte im Editor ändern.</p>
      <button class="btn ghost" data-a="pin-reset">PIN vergessen?</button>
      <button class="btn ghost" data-a="home">Zurück zum Spiel</button></div></div>`;
    return;
  }
  renderEditor(app, cfg, newCfg => {
    cfg = S.sanitizeConfig(newCfg);
    S.setFromLink(false);
    S.saveConfig(cfg);
    variant = S.variantId(cfg);
    state = S.loadGame(variant);
    if (state && !state.startAge) state = null;
  });
}

function afterDayStart() {
  modal = state.event ? "event" : null;
  activeSlot = null;
  save();
  showGame();
}

app.addEventListener("click", async ev => {
  const el = ev.target.closest("[data-a]");
  if (!el || el.disabled) return;
  const a = el.dataset.a;
  switch (a) {
    case "age": {
      const nick = document.getElementById("nick")?.value;
      chosenAge = Number(el.dataset.age);
      showStart();
      if (nick != null) document.getElementById("nick").value = nick;
      break;
    }
    case "new": {
      const nick = document.getElementById("nick").value.trim().slice(0, 20);
      if (!nick) { document.getElementById("nick").focus(); return; }
      S.setNickname(nick);
      state = E.newGame(cfg, nick, variant, chosenAge);
      afterDayStart();
      break;
    }
    case "new-confirm":
      if (state?.status === "done" ? true : confirm("Wirklich neu beginnen? Der gespeicherte Spielstand wird gelöscht.")) {
        if (state?.status === "done") saveReflection(), save();
        S.deleteGame(variant);
        state = null;
        showStart();
      }
      break;
    case "continue":
      modal = state.event ? "event" : null;
      showGame();
      if (state.status === "done") submitRun();
      break;
    case "home": location.hash = ""; showStart(); break;
    case "help": modal = null; showHelp(); break;
    case "board": boardAge = "alle"; showBoard(); break;
    case "board-age": boardAge = el.dataset.age; showBoard(false); break;
    case "menu": modal = "menu"; showGame(); break;
    case "spar": modal = "spar"; showGame(); break;
    case "close": modal = null; showGame(); break;
    case "sparen": E.transferSavings(state, Number(el.dataset.n)); save(); showGame(); break;
    case "sparen-alles": E.transferSavings(state, Math.max(0, state.konto)); save(); showGame(); break;
    case "slot": activeSlot = el.dataset.slot; showGame(); break;
    case "act": {
      state.plan[activeSlot] = el.dataset.id;
      const next = E.SLOTS.find(s => !state.plan[s]);
      if (next) activeSlot = next;
      save();
      showGame();
      break;
    }
    case "ev": E.chooseEventOption(cfg, state, Number(el.dataset.i)); modal = null; save(); showGame(); break;
    case "end":
      E.endDay(cfg, state);
      if (state.status === "day") afterDayStart();
      else { save(); showGame(); window.scrollTo(0, 0); }
      if (state.status === "done") submitRun();
      break;
    case "review-next": saveReflection(); E.continueAfterReview(cfg, state); afterDayStart(); break;
    case "review-pause": saveReflection(); save(); showStart(); break;
    case "print": saveReflection(); save(); window.print(); break;
    case "submit": saveReflection(); submitRun(); break;
    case "pin-reset":
      if (confirm("PIN auf 1234 zurücksetzen? Deine Variante bleibt erhalten. Die PIN gilt nur auf diesem Gerät.")) {
        cfg.pinHash = "";
        S.saveConfig(cfg);
        alert("Die PIN ist wieder 1234.");
      }
      break;
    case "pin": {
      const pin = document.getElementById("pin").value.trim();
      if (S.checkPin(cfg, pin)) { unlockedEditor = true; showEditor(); }
      else alert("Falsche PIN.");
      break;
    }
  }
});

app.addEventListener("input", ev => {
  if (ev.target.id === "refl" && state) { saveReflection(); save(); }
});

app.addEventListener("keydown", ev => {
  if (ev.key !== "Enter") return;
  if (ev.target.id === "nick") app.querySelector('[data-a="new"]')?.click();
  if (ev.target.id === "pin") app.querySelector('[data-a="pin"]')?.click();
});

init();
