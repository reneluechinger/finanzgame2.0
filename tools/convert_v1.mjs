// Einmaliges Umbau-Skript: Inhalte aus FinanzGame 1 in das Format von FinanzGame 2.0 bringen.
// Ausführen: node tools/convert_v1.mjs <pfad-zu-v1-config.js>  (schreibt js/content.js)
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const { DEFAULT_CONFIG: v1 } = await import(pathToFileURL(process.argv[2]).href);

const SLOT = { "werktag-nachmittag": "nachmittag", "werktag-abend": "abend", "wochenende-abend": "abend", "wochenende-morgen": "wochenende", "wochenende-nachmittag": "wochenende" };
const LEARN = ["schule", "mittelschule", "lehre", "studium"];
const SCHOOL = ["schule", "mittelschule"];

// id: [ab Alter, bis Alter, Stufe, Phasen]
const AGE = {
  zeitungen: [12, 17, 1], nachhilfe: [14, 25, 2], garten: [13, 25, 2], babysitterkurs: [13, 20], babysitten: [13, 22, 2],
  kuchen: [12, 17, 1], lernen: [12, 25, 0, LEARN],
  a_prospekte: [12, 17, 1], a_autos_waschen: [14, 20, 2], a_einkaufen_senioren: [12, 25, 1], a_hunde_ausfuehren: [12, 21, 1],
  a_flohmarkt: [12, 25, 1], a_bauernhof: [14, 20, 2], a_nachhilfe_deutsch: [14, 25, 2], a_nachhilfe_englisch: [14, 25, 2],
  a_nachhilfe_franz: [14, 25, 2], a_hausaufgabenhilfe: [14, 22, 2], a_technikhilfe: [12, 25, 1], a_schnee_schaufeln: [12, 18, 1],
  a_laub_rechen: [12, 18, 1], a_fenster_putzen: [14, 20, 2], a_hofladen: [14, 20, 2], a_online_verkaufen: [14, 25, 2],
  a_dorffest_servieren: [15, 22, 2], a_pflanzen_hueten: [12, 17, 1], a_katzen_fuettern: [12, 17, 1], a_weihnachtsmarkt_stand: [12, 17, 1],
  a_kindergeburtstag: [13, 18, 1], a_handyhuellen: [12, 17, 1],
  a_jugendverein: [12, 20], a_jugendtreff: [14, 22], a_schulgarten: [12, 15, 0, ["schule"]], a_schuelerrat: [12, 18, 0, SCHOOL],
  a_tafel_helfen: [14, 25], a_kindertraining_helfen: [12, 18], a_plakate_verein: [12, 18], a_pfadi_vorbereiten: [14, 22],
  a_kleidersammlung: [14, 25], a_neue_person_begleiten: [12, 18, 0, SCHOOL], a_deutsch_ueben: [13, 25], a_repair_cafe: [14, 25],
  a_pausenspiele: [12, 15, 0, ["schule"]], a_sponsorenlauf: [13, 20], a_feuerwehr_schnuppern: [12, 17],
  a_kurs_velo: [13, 25], a_velos_flicken: [13, 25, 2], a_kurs_rettung: [15, 25], a_badi_hilfe: [15, 25, 2],
  a_kurs_video: [14, 25], a_videos_verein: [14, 25, 2], a_kurs_hund: [14, 25], a_hundeschule_hilfe: [14, 25, 2],
  a_kurs_leiter: [14, 25], a_kindertraining_leiten: [14, 25, 2],
  a_lerngruppe: [12, 22, 0, LEARN], a_schnupperlehre_planen: [13, 15, 0, ["schule"]], a_berufsberatung: [13, 15, 0, ["schule"]],
  a_zehnfinger: [12, 16], a_znueni_vorbereiten: [12, 19], a_geschwister_betreuen: [12, 20], a_hausaufgaben_geschwister: [12, 20],
  a_tisch_decken: [12, 19], a_auto_saugen: [12, 19], a_geschwister_vorlesen: [12, 18], a_spielplatz_geschwister: [12, 17],
  b_fussball: [12, 16], b_uebernachtung: [12, 17], b_kastanien: [12, 14], b_rodeln: [12, 20], b_aufgaben_zusammen: [12, 22, 0, LEARN],
  b_trampolinhalle: [12, 18], b_konzert: [14, 25], b_billard: [14, 25], b_pfadi: [12, 20], b_vogelhaus: [12, 16]
};

const round10 = x => Math.round(x / 10) * 10;
const activities = v1.activities.map(a => {
  const o = { id: a.id, name: a.name, icon: a.icon };
  o.when = [...new Set(a.when.map(w => SLOT[w]).filter(Boolean))];
  // Beträge gelten neu für ein ganzes Quartal (regelmässig gemacht). Kurse sind einmalig.
  const m = a.money || 0;
  o.money = m > 0 ? round10(m * 10) : m < 0 ? (a.once ? round10(m * 3) : round10(m * 4)) : 0;
  o.effects = a.effects || {};
  const [minAge, maxAge, tier, phases] = AGE[a.id] || [];
  if (minAge && minAge > 12) o.minAge = minAge;
  if (maxAge && maxAge < 25) o.maxAge = maxAge;
  if (tier) o.tier = tier;
  if (phases) o.phases = phases;
  if (a.core) o.core = true;
  if (a.once) o.once = true;
  if (a.requires) { o.requires = a.requires; o.lockedInfo = (a.lockedInfo || "").replace("Woche", "Quartal"); }
  if (a.grants) {
    o.grants = { flag: a.grants.flag, delay: a.grants.delay === "nextWeek" ? "next" : "now" };
    if (a.grants.duration) o.grants.duration = 1;
  }
  if (a.id === "b_playlist") { o.grants = { flag: "playlist", delay: "next" }; o.info = "Danach kannst du deine eigene Playlist hören."; }
  if (a.info) o.info = a.info.replace(/nächste[rn]? Woche/g, "nächstem Quartal").replace("Ab nächstem Quartal", "Ab nächstem Quartal");
  if (a.id === "kuchen") o.info = "Zutaten kaufen, backen, verkaufen";
  if (a.id === "babysitterkurs") o.info = "Ab nächstem Quartal kannst du babysitten.";
  if (a.id === "lernen") { o.name = "Lernen für Schule und Prüfungen"; o.info = "Du bist fürs nächste Quartal gut vorbereitet."; }
  return o;
});

const SCHOOL_RX = /Klasse|Schul|Lehrperson|Pausenplatz|In der Pause|Taschengeld|Referat|Prüfung|[Tt]est |Test\.|Hausaufgab|Projektwoche|Mathe|Znüni|Schülerzeitung|Lernplan|Partnerklasse|Klassenlager|Schulhaus|Schulbuch|Morgen früh ist Schule/;
const HOME_RX = /Eltern|Mutter|Grosi|Geschwister|Schwester|Bruder|Meerschweinchen|Wellensittich|Zimmer|Familie|Haushaltsregel|zuhause|Tante|Verwandt/;
const events = v1.events.map(e => {
  const o = structuredClone(e);
  const t = e.text + " " + e.options.map(x => x.label).join(" ");
  if (/Berufswahl|Schnupperlehre|Berufsinfo/.test(t)) { o.minAge = 13; o.maxAge = 15; o.phases = ["schule"]; }
  else if (/Taschengeld/.test(t)) { o.maxAge = 17; o.phases = SCHOOL; }
  else if (SCHOOL_RX.test(t)) o.maxAge = 18;
  else if (/^c_job_|^c_kunde|^c_trinkgeld|^c_hilfe_umzug/.test(e.id)) o.maxAge = 19;
  else if (/^c_babysit/.test(e.id)) o.maxAge = 22;
  else if (HOME_RX.test(t)) o.maxAge = 21;
  for (const opt of o.options) {
    if (opt.addCost) {
      const f = opt.addCost.interval === "woche" ? 13 : 3;
      opt.addCost = { name: opt.addCost.name, amount: Math.round(opt.addCost.amount * f), interval: "quartal" };
    }
  }
  if (e.id === "streaming") o.text = "Ein Streaming-Dienst bietet ein Abo für Fr. 12 pro Monat an (Fr. 36 pro Quartal).";
  return o;
});

const line = x => "  " + JSON.stringify(x);
writeFileSync(new URL("../js/content.js", import.meta.url),
`// Inhalte aus FinanzGame 1, umgebaut für FinanzGame 2.0 (tools/convert_v1.mjs).
// Ein Spieltag ist ein Quartal. "money" ist der Betrag für das ganze Quartal in Franken.
// Effekte: ungefähr 4 = ↑, 8 = ↑↑, 12 = ↑↑↑. minAge/maxAge: Altersfenster. tier: Stufe eines Jobs (1–3).

export const BASE_ACTIVITIES = [
${activities.map(line).join(",\n")}
];

export const BASE_EVENTS = [
${events.map(line).join(",\n")}
];
`);
console.log(activities.length, "Aktivitäten,", events.length, "Ereignisse");
