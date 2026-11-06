// Lehrpersonen-Editor: Variante anpassen und als Link teilen
import * as S from "./storage.js";
import { DEFAULT_CONFIG } from "./config.js";

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const WHEN = [["nachmittag", "Nachmittag"], ["abend", "Abend"], ["wochenende", "Wochenende"]];
const RARITIES = [["", "normal"], ["selten", "selten (5 %)"], ["sehr selten", "sehr selten (1 %)"], ["ultra", "ultra-selten (0,1 %)"]];
const TABS = [["allg", "Allgemein"], ["werte", "Werte"], ["phasen", "Lebensphasen"], ["akt", "Aktivitäten"], ["ev", "Ereignisse"], ["fragen", "Kosten & Fragen"], ["teilen", "Teilen"], ["json", "JSON"]];

let savedName = "";
let draft, tab = "allg", onSaveCb, root, dirty = false, openItem = null;

export function renderEditor(el, cfg, onSave) {
  root = el;
  onSaveCb = onSave;
  draft = structuredClone(cfg);
  savedName = cfg.name;
  dirty = false;
  render();
}

function render() {
  root.innerHTML = `
  <div class="screen editor sans">
    <header class="top"><h1 class="logo">Editor für Lehrpersonen</h1>
      <div class="row"><button class="btn ghost" data-e="leave">Zum Spiel</button>
      <button class="btn primary" data-e="save">${dirty ? "Speichern ●" : "Gespeichert"}</button></div></header>
    <nav class="tabs">${TABS.map(([id, n]) => `<button class="${tab === id ? "on" : ""}" data-e="tab" data-tab="${id}">${n}</button>`).join("")}</nav>
    <div id="ed-msg" class="msg"></div>
    <div class="ed-body">${body()}</div>
  </div>`;
  applyFilter();
}

const num = (path, val, label, step = 1) =>
  `<label class="f"><span>${label}</span><input type="number" step="${step}" data-p="${path}" data-t="num" value="${esc(val ?? 0)}"></label>`;
const txt = (path, val, label, cls = "") =>
  `<label class="f ${cls}"><span>${label}</span><input data-p="${path}" value="${esc(val ?? "")}"></label>`;
const listTxt = (path, val, label, kind) =>
  `<label class="f"><span>${label}</span><input data-p="${path}" data-t="${kind}" value="${esc(kind === "agemap" ? Object.entries(val || {}).map(([a, v]) => `${a}:${v}`).join(", ") : (val || []).join(", "))}"></label>`;
const phaseChecks = (path, list) => `<div class="checks">${draft.phases.map(p =>
  `<label class="c"><input type="checkbox" data-p="${path}" data-t="when" data-k="${esc(p.id)}" ${list?.includes(p.id) ? "checked" : ""}> ${esc(p.icon)} ${esc(p.name)}</label>`).join("")}</div>`;
const sel = (path, val, label, options) =>
  `<label class="f"><span>${label}</span><select data-p="${path}">${options.map(([v, n]) => `<option value="${esc(v)}" ${String(val ?? "") === v ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>`;
const chk = (path, val, label) =>
  `<label class="c"><input type="checkbox" data-p="${path}" data-t="bool" ${val ? "checked" : ""}> ${label}</label>`;

function effectInputs(base, effects, key = "effects") {
  return `<div class="effects">${draft.values.filter(v => !v.money).map(v =>
    num(`${base}.${key}.${v.id}`, effects?.[v.id] ?? 0, `${esc(v.icon)} ${esc(v.name)}`)).join("")}</div>`;
}

function body() {
  const d = draft;
  if (tab === "allg") return `
    <section class="card">
      <h2>Spiel</h2>
      ${txt("name", d.name, "Name der Variante (z.B. Klasse 3a)", "wide")}
      <p class="small">Ein neuer Name ergibt eine neue Variante mit eigener Bestenliste. Bei gleichem Name bleiben Spielstände und Bestenliste erhalten.</p>
      <p class="small">Ein Spieltag ist ein Quartal. Lernende wählen ihr Startalter selbst und spielen bis zum Endalter.</p>
      <div class="grid3">
        ${num("minStartAge", d.minStartAge, "Startalter von")}
        ${num("maxStartAge", d.maxStartAge, "Startalter bis")}
        ${num("endAge", d.endAge, "Endalter")}
        ${num("startMoney", d.startMoney, "Startgeld mit 12 (Fr.)")}
        ${num("startMoneyPerYear", d.startMoneyPerYear, "Startgeld pro Jahr älter (Fr.)")}
        ${num("interestPercent", d.interestPercent, "Zins pro Quartal (%)", 0.1)}
        ${num("debtInterestPercent", d.debtInterestPercent, "Schuldzins pro Quartal (%)", 0.1)}
        ${num("lowEnergyLimit", d.lowEnergyLimit, "Müde unter Energie")}
        ${num("energyCostFactor", d.energyCostFactor, "Faktor Energie-Kosten (0.8 = −20 %)", 0.05)}
        ${num("softCap", d.softCap, "Ab diesem Wert langsamer steigen")}
        ${num("offerCount", d.offerCount, "Aktivitäten pro Zeitfenster (0 = alle)")}
        ${num("lockedPreview", d.lockedPreview, "Gesperrte Vorschau pro Zeitfenster")}
      </div>
      ${listTxt("moneyTargets", d.moneyTargets, "Geld-Wert 100 entspricht (Alter:Franken, dazwischen gemittelt)", "agemap")}
      <h3>Steuern (vereinfacht)</h3>
      <div class="grid3">
        ${num("tax.fromAge", d.tax?.fromAge, "Ab Alter")}
        ${num("tax.freeAmount", d.tax?.freeAmount, "Freibetrag pro Jahr (Fr.)")}
        ${num("tax.rate", d.tax?.rate, "Satz (%)", 0.5)}
      </div>
      <h3>Was jedes Quartal automatisch passiert</h3>
      <p class="small">Zusätzlich wirkt die Lebensphase (Reiter «Lebensphasen»).</p>${driftInputs("everyDay")}
    </section>
    <section class="card">
      <h2>Bestenliste</h2>
      ${txt("scriptUrl", d.scriptUrl, "URL der Google-Apps-Script-Web-App (leer = nur lokal)", "wide")}
      <p class="small">Anleitung: siehe README im Projekt, Abschnitt «Bestenliste einrichten».</p>
    </section>
    <section class="card">
      <h2>PIN ändern</h2>
      <label class="f"><span>Neue PIN</span><input id="newpin" type="password" autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck="false"></label>
      <button class="btn ghost" data-e="pin">PIN setzen</button>
    </section>`;

  if (tab === "werte") return `
    <section class="card">
      <h2>Werte</h2>
      <p class="small">Der Geld-Wert wird aus Konto und Sparkonto berechnet. Beim Energie-Wert gilt die Müde-Regel.</p>
      ${d.values.map((v, i) => `
        <div class="item-row">
          ${txt(`values.${i}.icon`, v.icon, "Symbol", "narrow")}
          ${txt(`values.${i}.name`, v.name, "Name")}
          <label class="f narrow"><span>Farbe</span><input type="color" data-p="values.${i}.color" value="${esc(v.color)}"></label>
          ${v.money ? `<span class="tag">Geld-Wert</span>` : num(`values.${i}.start`, v.start ?? 50, "Startwert")}
          ${v.money ? "" : chk(`values.${i}.energy`, v.energy, "Energie-Wert")}
          ${v.money ? "" : `<button class="btn danger" data-e="del-value" data-i="${i}">Entfernen</button>`}
        </div>`).join("")}
      <button class="btn ghost" data-e="add-value">+ Wert hinzufügen</button>
    </section>`;

  if (tab === "phasen") return `
    <section class="card">
      <h2>Lebensphasen (${d.phases.length})</h2>
      <p class="small">Die erste Phase gilt beim Start. Ereignisse wechseln die Phase (z.B. «Lehre beginnen»). Einkommen pro Quartal: als Liste pro Jahr in der Phase (z.B. Lehrjahre) oder nach Alter (12:120, 15:225). Beträge vereinfacht.</p>
      ${d.phases.map((p, i) => `
        <details ${openItem === "p" + i ? "open" : ""} data-open="p${i}">
          <summary>${esc(p.icon)} ${esc(p.name)} <span class="small">(${esc(p.id)})</span></summary>
          ${openItem !== "p" + i ? "" : `<div class="item">
            <div class="grid3">${txt(`phases.${i}.icon`, p.icon, "Symbol")}${txt(`phases.${i}.name`, p.name, "Name")}${txt(`phases.${i}.incomeLabel`, p.incomeLabel, "Einkommen heisst")}</div>
            <div class="grid3">${listTxt(`phases.${i}.income`, p.income, "Einkommen pro Quartal (Liste pro Jahr)", "list")}
              ${listTxt(`phases.${i}.incomeByAge`, p.incomeByAge, "oder nach Alter (Alter:Betrag)", "agemap")}
              ${chk(`phases.${i}.working`, p.working, "Lohn (Lohnerhöhungen wirken)")}</div>
            <div class="grid3">${txt(`phases.${i}.costLabel`, p.costLabel, "Grundkosten heissen")}${num(`phases.${i}.cost`, p.cost, "Grundkosten pro Quartal (Fr.)")}
              ${num(`phases.${i}.costDiscount`, p.costDiscount, "weniger, wenn Merkmal …")}${txt(`phases.${i}.costDiscountFlag`, p.costDiscountFlag, "… Merkmal (z.B. ausgezogen)")}</div>
            <p class="small">Wirkung pro Quartal:</p>${effectInputs(`phases.${i}`, p.drift, "drift")}
            ${i > 0 ? `<button class="btn danger" data-e="del-phase" data-i="${i}">Phase löschen</button>` : ""}
          </div>`}
        </details>`).join("")}
      <button class="btn ghost" data-e="add-phase">+ Lebensphase hinzufügen</button>
    </section>
    <section class="card">
      <h2>Was sich mit dem Alter ändert</h2>
      <p class="small">Wirkung pro Quartal ab einem Alter, z.B. «Noch zuhause» ab 21, solange das Merkmal «ausgezogen» fehlt.</p>
      ${(d.ageDrift || []).map((x, i) => `<div class="opt-box">
        <div class="grid3">${txt(`ageDrift.${i}.label`, x.label, "Name")}${num(`ageDrift.${i}.fromAge`, x.fromAge, "ab Alter")}${num(`ageDrift.${i}.toAge`, x.toAge, "bis Alter (0 = immer)")}
          ${txt(`ageDrift.${i}.ifFlag`, x.ifFlag, "nur mit Merkmal")}${txt(`ageDrift.${i}.ifNotFlag`, x.ifNotFlag, "nur ohne Merkmal")}</div>
        ${effectInputs(`ageDrift.${i}`, x.effects)}
        <button class="btn danger small" data-e="del-agedrift" data-i="${i}">Entfernen</button></div>`).join("")}
      <button class="btn ghost" data-e="add-agedrift">+ Altersregel hinzufügen</button>
    </section>`;

  if (tab === "akt") return `
    <section class="card">
      <h2>Aktivitäten (${d.activities.length})</h2>
      <p class="small">Effekte: ungefähr 4 = ↑, 8 = ↑↑, 12 = ↑↑↑. Geld in Franken für das ganze Quartal, negative Zahl = kostet. Pro Zeitfenster sehen die Lernenden eine Auswahl (Einstellung unter «Allgemein»). Mit «Immer anbieten» ist eine Aktivität jedes Quartal dabei. Jobs mit Stufe 1–3 erscheinen passend zum Alter häufiger (Stufe 1 bis 14, Stufe 2 bis 17, Stufe 3 ab 18).</p>
      ${filterBox()}
      ${d.activities.map((a, i) => `
        <details ${openItem === "a" + i ? "open" : ""} data-open="a${i}">
          <summary>${esc(a.icon)} ${esc(a.name)}</summary>
          ${openItem !== "a" + i ? "" : `<div class="item">
            <div class="grid3">${txt(`activities.${i}.icon`, a.icon, "Symbol")}${txt(`activities.${i}.name`, a.name, "Name")}${num(`activities.${i}.money`, a.money, "Geld (Fr.)")}</div>
            ${effectInputs(`activities.${i}`, a.effects)}
            <p class="small">Wann möglich?</p>
            <div class="checks">${WHEN.map(([k, n]) => `<label class="c"><input type="checkbox" data-p="activities.${i}.when" data-t="when" data-k="${k}" ${a.when?.includes(k) ? "checked" : ""}> ${n}</label>`).join("")}</div>
            <div class="grid3">${num(`activities.${i}.minAge`, a.minAge, "Ab Alter (0 = immer)")}${num(`activities.${i}.maxAge`, a.maxAge, "Bis Alter (0 = immer)")}
              ${sel(`activities.${i}.tier`, a.tier, "Job-Stufe", [["", "kein Job"], ["1", "Stufe 1"], ["2", "Stufe 2"], ["3", "Stufe 3"]])}
              ${sel(`activities.${i}.rarity`, a.rarity, "Seltenheit", RARITIES)}
              ${chk(`activities.${i}.useSavings`, a.useSavings, "Darf Sparkonto brauchen")}</div>
            <p class="small">Nur in diesen Lebensphasen (keine Auswahl = immer):</p>${phaseChecks(`activities.${i}.phases`, a.phases)}
            ${txt(`activities.${i}.info`, a.info, "Hinweis für Lernende (optional)", "wide")}
            <details class="adv"><summary>Erweitert: Freischalten und Verzögerung</summary>
              <div class="grid3">
                ${txt(`activities.${i}.requires`, a.requires, "Braucht Merkmal")}
                ${txt(`activities.${i}.lockedInfo`, a.lockedInfo, "Text, wenn gesperrt")}
                ${chk(`activities.${i}.once`, a.once, "Nur einmal im Spiel")}
                ${chk(`activities.${i}.core`, a.core, "Immer anbieten")}
                ${txt(`activities.${i}.grants.flag`, a.grants?.flag, "Gibt Merkmal")}
                <label class="f"><span>Merkmal wirkt</span><select data-p="activities.${i}.grants.delay">
                  <option value="now" ${a.grants?.delay !== "next" ? "selected" : ""}>sofort</option>
                  <option value="next" ${a.grants?.delay === "next" ? "selected" : ""}>ab nächstem Quartal</option></select></label>
                ${num(`activities.${i}.grants.duration`, a.grants?.duration ?? 0, "Dauer in Quartalen (0 = immer)")}
              </div>
              <p class="small">Beispiel: «Babysitter-Kurs» gibt das Merkmal «babysitter» ab nächstem Quartal, «Babysitten» braucht es. «Playlist zusammenstellen» gibt «playlist» für «Eigene Playlist hören».</p>
            </details>
            <button class="btn danger" data-e="del-act" data-i="${i}">Aktivität löschen</button>
          </div>`}
        </details>`).join("")}
      <button class="btn ghost" data-e="add-act">+ Aktivität hinzufügen</button>
    </section>`;

  if (tab === "ev") return `
    <section class="card">
      <h2>Ereignisse (${d.events.length})</h2>
      <p class="small">In etwa jedem zweiten Quartal passiert ein Ereignis. Jedes kommt höchstens einmal pro Spiel vor. Meilensteine (z.B. Berufswahl mit 16) kommen sicher, sobald das Alter erreicht ist.</p>
      ${filterBox()}
      ${d.events.map((e, i) => `
        <details ${openItem === "e" + i ? "open" : ""} data-open="e${i}">
          <summary>${esc(e.icon)} ${esc(e.text)}</summary>
          ${openItem !== "e" + i ? "" : `<div class="item">
            <div class="grid3">${txt(`events.${i}.icon`, e.icon, "Symbol")}${txt(`events.${i}.text`, e.text, "Text", "wide")}</div>
            <div class="grid3">${num(`events.${i}.minAge`, e.minAge, "Ab Alter (0 = immer)")}${num(`events.${i}.maxAge`, e.maxAge, "Bis Alter (0 = immer)")}
              ${num(`events.${i}.atAge`, e.atAge, "Meilenstein mit Alter")}${chk(`events.${i}.milestone`, e.milestone, "Meilenstein (kommt sicher)")}</div>
            <div class="grid3">${txt(`events.${i}.condition.flag`, e.condition?.flag, "Nur wenn Merkmal (optional)")}
              ${chk(`events.${i}.condition.not`, e.condition?.not, "… wenn Merkmal fehlt")}
              ${chk(`events.${i}.condition.debt`, e.condition?.debt, "Nur bei Schulden")}</div>
            <p class="small">Nur in diesen Lebensphasen (keine Auswahl = immer):</p>${phaseChecks(`events.${i}.phases`, e.phases)}
            ${e.options.map((o, j) => `
              <div class="opt-box">
                <div class="grid3">${txt(`events.${i}.options.${j}.label`, o.label, `Wahl ${j + 1}`, "wide")}
                ${num(`events.${i}.options.${j}.money`, o.money, "Geld (Fr.)")}${num(`events.${i}.options.${j}.savings`, o.savings, "aufs Sparkonto (Fr.)")}</div>
                ${effectInputs(`events.${i}.options.${j}`, o.effects)}
                <details class="adv"><summary>Erweitert: Lebensphase, Merkmal, Lohn, laufende Kosten</summary>
                  <div class="grid3">
                    ${sel(`events.${i}.options.${j}.setPhase`, o.setPhase, "Wechselt in Phase", [["", "–"], ...draft.phases.map(p => [p.id, p.icon + " " + p.name])])}
                    ${txt(`events.${i}.options.${j}.flag`, o.flag, "Gibt Merkmal")}
                    ${txt(`events.${i}.options.${j}.removeFlag`, o.removeFlag, "Entfernt Merkmal")}
                    ${num(`events.${i}.options.${j}.incomeBonus`, o.incomeBonus, "Lohn-Änderung (0.1 = +10 %)", 0.05)}
                    ${txt(`events.${i}.options.${j}.addCost.name`, o.addCost?.name, "Neue Kosten: Name")}
                    ${num(`events.${i}.options.${j}.addCost.amount`, o.addCost?.amount, "Betrag (Fr.)")}
                    ${sel(`events.${i}.options.${j}.addCost.interval`, o.addCost?.interval || "quartal", "Wie oft", [["quartal", "jedes Quartal"], ["jahr", "jedes Jahr"]])}
                    ${num(`events.${i}.options.${j}.addCost.quarters`, o.addCost?.quarters, "Wie lange (Quartale, 0 = immer)")}
                  </div>
                </details>
                ${e.options.length > 1 ? `<button class="btn danger small" data-e="del-opt" data-i="${i}" data-j="${j}">Wahl entfernen</button>` : ""}
              </div>`).join("")}
            ${e.options.length < 3 ? `<button class="btn ghost" data-e="add-opt" data-i="${i}">+ Wahl hinzufügen</button>` : ""}
            <button class="btn danger" data-e="del-ev" data-i="${i}">Ereignis löschen</button>
          </div>`}
        </details>`).join("")}
      <button class="btn ghost" data-e="add-ev">+ Ereignis hinzufügen</button>
    </section>`;

  if (tab === "fragen") return `
    <section class="card">
      <h2>Laufende Kosten</h2>
      <p class="small">Gelten für alle, unabhängig von der Lebensphase. Mit Alter von/bis (0 = immer). Die Grundkosten der Lebensphasen stehen im Reiter «Lebensphasen».</p>
      ${d.costs.map((c, i) => `<div class="item-row">${txt(`costs.${i}.name`, c.name, "Name")}${num(`costs.${i}.amount`, c.amount, "Betrag (Fr.)")}
        ${sel(`costs.${i}.interval`, c.interval || "quartal", "Wie oft", [["quartal", "jedes Quartal"], ["jahr", "einmal im Jahr"]])}
        ${num(`costs.${i}.fromAge`, c.fromAge, "ab Alter")}${num(`costs.${i}.toAge`, c.toAge, "bis Alter")}
        ${num(`costs.${i}.discount`, c.discount, "weniger mit Merkmal (Fr.)")}${txt(`costs.${i}.discountFlag`, c.discountFlag, "Merkmal")}
        <button class="btn danger" data-e="del-cost" data-i="${i}">Entfernen</button></div>`).join("")}
      <button class="btn ghost" data-e="add-cost">+ Kosten hinzufügen</button>
    </section>
    <section class="card">
      <h2>Reflexionsfragen (eine pro Lebensjahr, danach wieder von vorne)</h2>
      ${d.questions.map((q, i) => `<div class="item-row">${txt(`questions.${i}`, q, `Frage ${i + 1}`, "wide")}<button class="btn danger small" data-e="del-q" data-i="${i}">Entfernen</button></div>`).join("")}
      <button class="btn ghost" data-e="add-q">+ Frage hinzufügen</button>
      ${txt("finalQuestion", d.finalQuestion, "Frage in der Lebensbilanz", "wide")}
    </section>`;

  if (tab === "teilen") return `
    <section class="card">
      <h2>Variante mit der Klasse teilen</h2>
      <p>Speichere zuerst deine Änderungen. Dann erzeugst du einen Link. Wer den Link öffnet, spielt mit deiner Variante, auch die Bestenliste ist getrennt pro Variante.</p>
      <button class="btn primary" data-e="link">Link erzeugen</button>
      <textarea id="share" rows="4" readonly placeholder="Hier erscheint der Link"></textarea>
      <button class="btn ghost" data-e="copy">Link kopieren</button>
      <p class="small">Tipp: Den Link als QR-Code oder über die Schulplattform teilen. Ändert sich etwas an der Variante, braucht es einen neuen Link.</p>
    </section>
    <section class="card">
      <h2>Sichern und laden</h2>
      <button class="btn ghost" data-e="download">Variante als Datei herunterladen</button>
      <label class="btn ghost file">Variante aus Datei laden<input type="file" accept=".json,application/json" data-e-file="upload" hidden></label>
      <button class="btn danger" data-e="reset">Auf Standard zurücksetzen</button>
    </section>`;

  if (tab === "json") return `
    <section class="card">
      <h2>Alles als JSON bearbeiten</h2>
      <p class="small">Für Fortgeschrittene. Mit «Übernehmen» wird der Text geprüft.</p>
      <textarea id="json" rows="24" spellcheck="false">${esc(JSON.stringify(d, null, 2))}</textarea>
      <button class="btn primary" data-e="json">Übernehmen</button>
    </section>`;
  return "";
}

let filterText = "";
function filterBox() {
  return `<label class="f wide"><span>Suchen</span><input id="ed-filter" value="${esc(filterText)}" placeholder="Stichwort, z.B. Velo"></label>`;
}
function applyFilter() {
  const q = filterText.toLowerCase();
  root.querySelectorAll("details[data-open]").forEach(d => {
    d.style.display = !q || d.querySelector("summary").textContent.toLowerCase().includes(q) ? "" : "none";
  });
}

function driftInputs(key) {
  return `<div class="effects">${draft.values.filter(v => !v.money).map(v =>
    num(`drift.${key}.${v.id}`, draft.drift?.[key]?.[v.id] ?? 0, `${esc(v.icon)} ${esc(v.name)}`)).join("")}</div>`;
}

function setPath(obj, path, value) {
  const keys = path.split(".");
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (o[k] == null || typeof o[k] !== "object") o[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    o = o[k];
  }
  const last = keys.at(-1);
  if (value === undefined || value === "" || value === 0 && !path.startsWith("tax.") && /effects|drift|savings|duration|Age$|tier|incomeBonus|quarters|discount$|costDiscount$|taxDeduction/.test(path)) delete o[last];
  else o[last] = value;
}

function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

function msg(text, bad = false) {
  const m = root.querySelector("#ed-msg");
  if (!m) return;
  m.textContent = text;
  m.className = "msg " + (bad ? "bad" : "good");
}

function markDirty() {
  dirty = true;
  const b = root.querySelector('[data-e="save"]');
  if (b) b.textContent = "Speichern ●";
}

function cleanup(cfg) {
  // leere Hilfsobjekte entfernen
  for (const a of cfg.activities) {
    if (a.grants && !a.grants.flag) delete a.grants;
    if (!a.requires) delete a.requires;
    a.money = Number(a.money) || 0;
    a.effects = a.effects || {};
  }
  for (const e of cfg.events) {
    if (e.condition && !e.condition.flag && !e.condition.debt) delete e.condition;
    if (e.milestone && !e.atAge) delete e.milestone;
    for (const o of e.options) if (o.addCost && !(o.addCost.name && o.addCost.amount)) delete o.addCost;
    if (!e.phases?.length) delete e.phases;
  }
  for (const a of cfg.activities) {
    if (!a.phases?.length) delete a.phases;
    if (a.tier) a.tier = Number(a.tier);
    if (!a.rarity) delete a.rarity;
  }
  cfg.questions = (cfg.questions || []).filter(q => q != null);
  return cfg;
}

function uniqueId(base, list) {
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12) || "x";
  let id = slug, n = 2;
  while (list.some(x => x.id === id)) id = slug + n++;
  return id;
}

function onInput(ev) {
  const el = ev.target;
  const p = el.dataset.p;
  if (!p) return;
  const t = el.dataset.t;
  if (t === "when") {
    const arr = getPath(draft, p) || [];
    const k = el.dataset.k;
    setPath(draft, p, el.checked ? [...new Set([...arr, k])] : arr.filter(x => x !== k));
  } else if (t === "list") setPath(draft, p, el.value.split(/[,;\s]+/).filter(Boolean).map(Number).filter(Number.isFinite));
  else if (t === "agemap") {
    const map = Object.fromEntries(el.value.split(/[,;]+/).map(x => x.split(":").map(y => y.trim())).filter(([a, v]) => a && Number.isFinite(Number(a)) && Number.isFinite(Number(v))).map(([a, v]) => [a, Number(v)]));
    setPath(draft, p, Object.keys(map).length ? map : undefined);
  } else if (t === "bool") setPath(draft, p, el.checked || undefined);
  else if (t === "num") setPath(draft, p, el.value === "" ? 0 : Number(el.value));
  else setPath(draft, p, el.value);
  markDirty();
}

function structural(fn) {
  fn();
  markDirty();
  render();
}

async function onClick(ev) {
  const sum = ev.target.closest("summary");
  if (sum) {
    ev.preventDefault();
    const det = sum.parentElement;
    if (det.dataset.open) { openItem = det.open ? null : det.dataset.open; render(); return; }
    det.open = !det.open; // innere Details (Erweitert) normal auf- und zuklappen
    return;
  }
  const el = ev.target.closest("[data-e]");
  if (!el) return;
  const i = Number(el.dataset.i), j = Number(el.dataset.j);
  switch (el.dataset.e) {
    case "tab": tab = el.dataset.tab; openItem = null; filterText = ""; render(); break;
    case "leave":
      if (dirty && !confirm("Ungespeicherte Änderungen verwerfen?")) return;
      location.hash = "";
      break;
    case "save": {
      const errors = S.validateConfig(cleanup(draft));
      if (errors.length) return msg(errors.join(" "), true);
      // Neuer Name = neue Variante mit eigener Bestenliste (z.B. für eine weitere Klasse)
      // Auch die erste eigene Anpassung der Standard-Variante bekommt eine eigene Bestenliste
      const renamed = draft.name !== savedName || draft.vid === "std";
      if (renamed) draft.vid = S.newVariantId();
      onSaveCb(structuredClone(draft));
      savedName = draft.name;
      dirty = false;
      render();
      msg(renamed
        ? "Gespeichert als neue Variante mit eigener Bestenliste. Unter «Teilen» einen neuen Link erzeugen."
        : "Gespeichert. Für die Klasse unter «Teilen» einen neuen Link erzeugen.");
      break;
    }
    case "pin": {
      const p = root.querySelector("#newpin").value.trim();
      if (p.length < 4) return msg("Die PIN braucht mindestens 4 Zeichen.", true);
      draft.pinHash = S.pinHash(p);
      markDirty();
      msg("PIN gesetzt. Jetzt speichern.");
      break;
    }
    case "add-value": structural(() => {
      const id = uniqueId("wert" + draft.values.length, draft.values);
      draft.values.push({ id, name: "Neuer Wert", icon: "⭐", color: "#7a6cf0", start: 50 });
    }); break;
    case "del-value": {
      const v = draft.values[i];
      if (!confirm(`Wert «${v.name}» entfernen? Alle Effekte darauf werden gelöscht.`)) return;
      structural(() => {
        draft.values.splice(i, 1);
        for (const a of draft.activities) delete a.effects?.[v.id];
        for (const e of draft.events) for (const o of e.options) delete o.effects?.[v.id];
        for (const k of Object.keys(draft.drift || {})) delete draft.drift[k][v.id];
        for (const p of draft.phases || []) delete p.drift?.[v.id];
        for (const d of draft.ageDrift || []) delete d.effects?.[v.id];
      });
      break;
    }
    case "add-act": structural(() => {
      draft.activities.push({ id: uniqueId("aktivitaet", draft.activities), name: "Neue Aktivität", icon: "✨", when: ["nachmittag"], money: 0, effects: {} });
      openItem = "a" + (draft.activities.length - 1);
    }); break;
    case "del-act": if (confirm("Aktivität löschen?")) structural(() => draft.activities.splice(i, 1)); break;
    case "add-ev": structural(() => {
      draft.events.push({ id: uniqueId("ereignis", draft.events), icon: "❗", text: "Neues Ereignis", options: [{ label: "Wahl 1", effects: {} }, { label: "Wahl 2", effects: {} }] });
      openItem = "e" + (draft.events.length - 1);
    }); break;
    case "del-ev": if (confirm("Ereignis löschen?")) structural(() => draft.events.splice(i, 1)); break;
    case "add-opt": structural(() => draft.events[i].options.push({ label: "Neue Wahl", effects: {} })); break;
    case "del-opt": structural(() => draft.events[i].options.splice(j, 1)); break;
    case "add-cost": structural(() => draft.costs.push({ name: "Neue Kosten", amount: 30, interval: "quartal" })); break;
    case "add-agedrift": structural(() => (draft.ageDrift = draft.ageDrift || []).push({ label: "Neue Regel", fromAge: 18, effects: {} })); break;
    case "del-agedrift": structural(() => draft.ageDrift.splice(i, 1)); break;
    case "add-q": structural(() => draft.questions.push("Neue Frage")); break;
    case "del-q": structural(() => draft.questions.splice(i, 1)); break;
    case "add-phase": structural(() => {
      draft.phases.push({ id: uniqueId("phase", draft.phases), name: "Neue Phase", icon: "⭐", incomeLabel: "Einkommen", income: [0], cost: 0, drift: {} });
      openItem = "p" + (draft.phases.length - 1);
    }); break;
    case "del-phase": {
      const ph = draft.phases[i];
      const used = draft.events.some(e => e.options.some(o => o.setPhase === ph.id));
      if (used) return msg(`Die Phase «${ph.name}» wird noch von einem Ereignis gebraucht. Zuerst dort ändern.`, true);
      if (confirm(`Phase «${ph.name}» löschen?`)) structural(() => draft.phases.splice(i, 1));
      break;
    }
    case "del-cost": structural(() => draft.costs.splice(i, 1)); break;
    case "link": {
      if (dirty) return msg("Bitte zuerst speichern.", true);
      const code = await S.encodeConfig(draft);
      root.querySelector("#share").value = location.origin + location.pathname + "#v=" + code;
      msg("Link erzeugt.");
      break;
    }
    case "copy": {
      const ta = root.querySelector("#share");
      if (!ta.value) return msg("Zuerst einen Link erzeugen.", true);
      try { await navigator.clipboard.writeText(ta.value); msg("Link kopiert."); }
      catch { ta.select(); msg("Bitte den markierten Link kopieren."); }
      break;
    }
    case "download": {
      const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `finanzgame-${(draft.name || "variante").replace(/[^\w-]+/g, "_")}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      break;
    }
    case "reset":
      if (!confirm("Alle Anpassungen verwerfen und die Standard-Variante laden? PIN und Bestenlisten-URL bleiben erhalten.")) return;
      structural(() => { draft = { ...structuredClone(DEFAULT_CONFIG), pinHash: draft.pinHash, scriptUrl: draft.scriptUrl, vid: draft.vid, name: draft.name }; });
      msg("Standard geladen. Jetzt speichern.");
      break;
    case "json": {
      try {
        const parsed = JSON.parse(root.querySelector("#json").value);
        const errors = S.validateConfig(parsed);
        if (errors.length) return msg(errors.join(" "), true);
        structural(() => { draft = parsed; });
        msg("Übernommen. Jetzt speichern.");
      } catch (e) { msg("JSON-Fehler: " + e.message, true); }
      break;
    }
  }
}

async function onChange(ev) {
  const el = ev.target;
  if (el.dataset.eFile === "upload" && el.files[0]) {
    try {
      const parsed = JSON.parse(await el.files[0].text());
      const errors = S.validateConfig(parsed);
      if (errors.length) return msg(errors.join(" "), true);
      structural(() => { draft = parsed; });
      msg("Datei geladen. Jetzt speichern.");
    } catch (e) { msg("Datei konnte nicht gelesen werden: " + e.message, true); }
    return;
  }
  onInput(ev);
}

// Ereignisse einmalig am Dokument anmelden; sie wirken nur im Editor
document.addEventListener("input", ev => { if (ev.target.id === "ed-filter") { filterText = ev.target.value; applyFilter(); } });
document.addEventListener("input", ev => { if (root?.querySelector(".editor") && ev.target.dataset.p && ev.target.type !== "checkbox" && ev.target.tagName !== "SELECT") onInput(ev); });
document.addEventListener("change", ev => { if (root?.querySelector(".editor") && (ev.target.type === "checkbox" || ev.target.tagName === "SELECT" || ev.target.type === "file")) onChange(ev); });
document.addEventListener("click", ev => { if (root?.querySelector(".editor")) onClick(ev); });
