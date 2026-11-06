// Standard-Variante von FinanzGame 2.0 «Lebenslauf». Im Lehrpersonen-Editor anpassbar.
// Ein Spieltag ist ein Quartal (3 Monate), 4 Spieltage sind ein Lebensjahr.
// Beträge in Franken, gerundet und vereinfacht. Grössenordnungen:
// - Taschengeld: Budgetberatung Schweiz, Richtlinien Taschengeld 2023/2024 (12–14 J.: Fr. 30–50, ab 15 J.: Fr. 50–100 pro Monat)
// - Lehrlingslohn: lohncheck.ch, «Lehrling» (Durchschnitt Fr. 780 / 930 / 1110 pro Monat im 1. / 2. / 3. Lehrjahr), 2026
// - Krankenkasse: BAG, Prämien 2026, mittlere Monatsprämie junge Erwachsene (19–25) Fr. 326.30
// - Löhne nach Lehre und Studium, Lebenskosten, Steuern: grobe Annahmen ohne Einzelquelle, im Spiel als «vereinfacht» bezeichnet
import { BASE_ACTIVITIES, BASE_EVENTS } from "./content.js";
import { ADULT_ACTIVITIES, ADULT_EVENTS } from "./content_adult.js";

export const DEFAULT_CONFIG = {
  name: "Standard",
  vid: "std",
  contentVersion: 3, // bei neuer Abstimmung erhöhen: gespeicherte Varianten übernehmen die neuen Standardwerte
  offerCount: 8, // so viele Aktivitäten werden pro Zeitfenster angeboten (0 = alle)
  lockedPreview: 2, // so viele gesperrte Aktivitäten («ab 16») werden pro Zeitfenster gezeigt
  pinHash: "",
  scriptUrl: "",
  minStartAge: 12,
  maxStartAge: 16,
  endAge: 25,
  startMoney: 40, // Startgeld mit 12, pro Jahr älter kommt startMoneyPerYear dazu
  startMoneyPerYear: 60,
  // Preisniveau: Aktivitäten bringen und kosten mit 12 nur einen Bruchteil, später ein Mehrfaches
  // (Faktor auf den Betrag in der Liste, dazwischen gemittelt). Kurse und Erwachsenen-Jobs haben feste Beträge.
  priceLevel: { 12: 0.25, 14: 0.45, 16: 0.75, 18: 1.1, 20: 1.5, 22: 1.9, 25: 2.5 },
  // Geld-Wert 100 entspricht diesem Polster (Konto + Sparkonto), je nach Alter. Dazwischen wird gemittelt.
  moneyTargets: { 12: 500, 14: 900, 16: 1800, 18: 5000, 20: 13000, 22: 24000, 25: 45000 },
  interestPercent: 1, // Spiel-Zins pro Quartal auf dem Sparkonto
  debtInterestPercent: 3, // Schuldzins pro Quartal, wenn das Konto im Minus ist
  lowEnergyLimit: 20, // darunter wirken positive Effekte nur halb
  energyCostFactor: 0.8, // negative Energie-Effekte werden damit multipliziert (0.8 = 20 % weniger)
  softCap: 85, // ab diesem Wert steigen Werte langsamer
  tax: { fromAge: 18, freeAmount: 10000, rate: 8 }, // vereinfacht: (Jahreseinkommen − Freibetrag − Säule 3a) × Satz %
  values: [
    { id: "geld", name: "Geld", icon: "💰", color: "#2e9d5b", money: true },
    { id: "zufriedenheit", name: "Zufriedenheit", icon: "😊", color: "#e6a118", start: 50 },
    { id: "wertstiftung", name: "Wertstiftung", icon: "🤝", color: "#8a4fd8", start: 40 },
    { id: "energie", name: "Energie", icon: "⚡", color: "#e2554f", start: 60, energy: true },
    { id: "beziehungen", name: "Beziehungen", icon: "❤️", color: "#2aa3c4", start: 50 }
  ],
  // Was jedes Quartal ohnehin passiert (zusätzlich zur Wirkung der Lebensphase)
  drift: { everyDay: { zufriedenheit: -3, wertstiftung: -3, beziehungen: -3, energie: 8 } },
  // Lebensphasen: Hauptbeschäftigung mit Einkommen, Grundkosten und Wirkung pro Quartal.
  // income: Betrag pro Quartal, als Liste = pro Jahr in dieser Phase (z.B. Lehrjahre). incomeByAge: Betrag ab Alter
  phases: [
    { id: "schule", name: "Oberstufe", icon: "🏫", incomeLabel: "Taschengeld", incomeByAge: { 12: 120, 15: 225 }, costLabel: "Znüni, Kleinkram, Ausgang", cost: 60,
      drift: { energie: -11, beziehungen: 2 } },
    { id: "mittelschule", name: "Gymnasium", icon: "📐", incomeLabel: "Taschengeld", income: [225], costLabel: "Schulmaterial, Ausflüge, Ausgang", cost: 140,
      drift: { energie: -11, beziehungen: 2, zufriedenheit: 1 } },
    { id: "lehre", name: "Lehre", icon: "🛠️", incomeLabel: "Lehrlingslohn", income: [2340, 2790, 3330], costLabel: "Kostgeld, ÖV, Kleider, Freizeit", cost: 1900,
      drift: { energie: -13, wertstiftung: 3, zufriedenheit: 1 } },
    { id: "studium", name: "Studium", icon: "🏛️", incomeLabel: "Unterstützung der Eltern", income: [1500], costLabel: "Semestergebühr, ÖV, Bücher", cost: 1000,
      drift: { energie: -13, zufriedenheit: -1, beziehungen: 2 } },
    { id: "arbeit", name: "Berufsleben", icon: "💼", incomeLabel: "Lohn (netto)", income: [12000], costLabel: "Lebenskosten (Kostgeld, ÖV, Essen, Kleider, Freizeit, Ferien)", cost: 7000, costDiscountFlag: "ausgezogen", costDiscount: 1500, working: true,
      drift: { energie: -13, wertstiftung: 3 } },
    { id: "job", name: "Job ohne Abschluss", icon: "📦", incomeLabel: "Lohn (netto)", income: [10800], costLabel: "Lebenskosten (Kostgeld, ÖV, Essen, Kleider, Freizeit, Ferien)", cost: 7000, costDiscountFlag: "ausgezogen", costDiscount: 1500, working: true,
      drift: { energie: -14, wertstiftung: 2, zufriedenheit: -1 } },
    { id: "akademisch", name: "Beruf nach dem Studium", icon: "💼", incomeLabel: "Lohn (netto)", income: [15000], costLabel: "Lebenskosten (Kostgeld, ÖV, Essen, Kleider, Freizeit, Ferien)", cost: 7000, costDiscountFlag: "ausgezogen", costDiscount: 1500, working: true,
      drift: { energie: -13, wertstiftung: 3 } }
  ],
  // Was sich mit dem Alter ändert, unabhängig von der Lebensphase
  ageDrift: [
    { fromAge: 21, ifNotFlag: "ausgezogen", effects: { zufriedenheit: -2, beziehungen: -1 }, label: "Noch zuhause" }
  ],
  costs: [
    { name: "Handy-Abo (Anteil)", amount: 30, interval: "quartal", toAge: 15 },
    { name: "Handy-Abo", amount: 90, interval: "quartal", fromAge: 16 },
    { name: "Krankenkasse", amount: 980, interval: "quartal", fromAge: 19, discountFlag: "franchise_hoch", discount: 300 }
  ],
  activities: [
    ...BASE_ACTIVITIES,
    ...ADULT_ACTIVITIES.map(a => ({ ...a, fixedMoney: true }))
  ],
  events: [
    ...BASE_EVENTS,
    ...ADULT_EVENTS
  ],
  // Eine Frage pro Lebensjahr (der Reihe nach, danach wieder von vorne) und eine zum Schluss
  questions: [
    "Welche Entscheidung hat dir dieses Jahr am meisten gebracht? Warum?",
    "Welcher Wert war am schwierigsten im Gleichgewicht zu halten?",
    "Wo hast du für andere Wert geschaffen? Hat es dir auch etwas gebracht?",
    "Wofür hast du Geld ausgegeben, das dir im Nachhinein wenig gebracht hat?",
    "Welche neue Möglichkeit hat dich dieses Jahr gereizt, und hast du sie genutzt?",
    "Was hast du gemacht, als deine Energie tief war? Hat es geholfen?",
    "Wie hat dich deine Ausbildung oder Arbeit dieses Jahr verändert?",
    "Welche Kosten haben dich überrascht?",
    "Wem warst du dieses Jahr wichtig, und wer war dir wichtig?",
    "Was würdest du deinem jüngeren Ich raten?"
  ],
  finalQuestion: "Wenn du nochmals mit deinem Startalter beginnen könntest: Was würdest du anders machen?"
};
