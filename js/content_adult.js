// Neue Inhalte für FinanzGame 2.0: bessere Jobs ab 16, seltene Aktivitäten,
// Lebensentscheidungen (Meilensteine) und Ereignisse für junge Erwachsene.
// Beträge in Franken pro Quartal (Aktivitäten) bzw. einmalig (Ereignisse), vereinfacht.

const ALL = ["nachmittag", "abend", "wochenende"];

export const ADULT_ACTIVITIES = [
  // --- Energie ---
  { id: "playlist_hoeren", name: "Eigene Playlist hören", icon: "🎧", when: ALL, money: 0,
    effects: { energie: 12, zufriedenheit: 3 }, requires: "playlist", lockedInfo: "Stell zuerst eine Playlist zusammen",
    info: "Deine Lieblingslieder, genau für deine Stimmung" },

  // --- Stufe 2 und 3: bessere Jobs ---
  { id: "j_detailhandel", name: "Aushilfe im Detailhandel", icon: "🏪", when: ["nachmittag", "wochenende"], money: 600, minAge: 16, tier: 2,
    effects: { zufriedenheit: 1, wertstiftung: 5, energie: -8, beziehungen: 2 }, info: "Regale füllen und an der Kasse helfen" },
  { id: "j_service", name: "Service im Restaurant", icon: "🍽️", when: ["abend", "wochenende"], money: 700, minAge: 16, tier: 2,
    effects: { zufriedenheit: 2, wertstiftung: 5, energie: -9, beziehungen: 3 }, info: "Mit Trinkgeld" },
  { id: "j_velokurier", name: "Velokurier", icon: "🚴", when: ["nachmittag", "wochenende"], money: 650, minAge: 17, tier: 2,
    effects: { zufriedenheit: 3, wertstiftung: 4, energie: -8 }, info: "Pakete quer durch die Stadt" },
  { id: "j_nachhilfeinstitut", name: "Nachhilfe im Lerninstitut", icon: "🧑‍🏫", when: ["nachmittag", "abend"], money: 900, minAge: 17, tier: 3,
    effects: { zufriedenheit: 3, wertstiftung: 8, energie: -7, beziehungen: 1 }, info: "Mehrere Lernende pro Woche, fester Stundenlohn" },
  { id: "j_event", name: "Eventhilfe an Festivals", icon: "🎪", when: ["wochenende"], money: 900, minAge: 18, tier: 3,
    effects: { zufriedenheit: 5, wertstiftung: 4, energie: -10, beziehungen: 4 }, info: "Aufbau, Bar, Abbau" },
  { id: "j_nachtschicht", name: "Nachtschicht im Lager", icon: "🌙", when: ["abend"], money: 1300, minAge: 18, tier: 3,
    effects: { zufriedenheit: -3, wertstiftung: 3, energie: -14, beziehungen: -2 }, info: "Gut bezahlt, aber anstrengend" },
  { id: "j_socialmedia", name: "Social Media für ein KMU", icon: "📲", when: ["abend", "wochenende"], money: 1100, minAge: 19, tier: 3,
    effects: { zufriedenheit: 4, wertstiftung: 6, energie: -6 }, info: "Posts planen für die Bäckerei im Dorf" },
  { id: "j_webseite", name: "Webseiten bauen (freiberuflich)", icon: "💻", when: ["abend", "wochenende"], money: 1500, minAge: 19, tier: 3,
    effects: { zufriedenheit: 5, wertstiftung: 7, energie: -8 }, requires: "programmieren", lockedInfo: "Braucht den Programmierkurs",
    info: "Kleine Firmen brauchen eine Webseite" },
  { id: "k_programmierkurs", name: "Programmierkurs (Abendkurs)", icon: "⌨️", when: ["abend"], money: -400, minAge: 17, once: true,
    effects: { zufriedenheit: 2, wertstiftung: 2, energie: -5 }, grants: { flag: "programmieren", delay: "next" },
    info: "Ab nächstem Quartal kannst du ab 19 Webseiten bauen." },
  { id: "k_nothelfer", name: "Nothelferkurs", icon: "🩺", when: ["wochenende"], money: -150, minAge: 15, once: true,
    effects: { wertstiftung: 3, energie: -3 }, grants: { flag: "nothelfer", delay: "next" },
    info: "Braucht man auch für den Führerausweis" },
  { id: "j_sanitaet", name: "Sanitätsdienst an Anlässen", icon: "⛑️", when: ["wochenende"], money: 500, minAge: 16, tier: 2,
    effects: { zufriedenheit: 3, wertstiftung: 9, energie: -7, beziehungen: 2 }, requires: "nothelfer", lockedInfo: "Braucht den Nothelferkurs" },
  { id: "j_js_leiten", name: "J+S-Kurse leiten", icon: "🏅", when: ["nachmittag", "wochenende"], money: 800, minAge: 18, tier: 3,
    effects: { zufriedenheit: 5, wertstiftung: 8, energie: -7, beziehungen: 4 }, requires: "a_leiter_kurs", lockedInfo: "Braucht den Leiterkurs" },
  { id: "j_lieferfahrten", name: "Lieferfahrten mit dem Auto", icon: "🚐", when: ["nachmittag", "wochenende"], money: 1200, minAge: 18, tier: 3,
    effects: { zufriedenheit: 1, wertstiftung: 4, energie: -9 }, requires: "fahrausweis", lockedInfo: "Braucht den Führerausweis" },
  { id: "k_fahrstunden", name: "Fahrstunden nehmen", icon: "🚗", when: ["nachmittag", "wochenende"], money: -2500, minAge: 17, once: true,
    effects: { zufriedenheit: 4, energie: -4 }, grants: { flag: "fahrausweis", delay: "next" },
    info: "Theorie, Fahrstunden und Prüfung" },
  { id: "j_teamleitung", name: "Zusatzschicht als Teamleitung", icon: "📋", when: ["abend", "wochenende"], money: 1400, minAge: 20, tier: 3,
    effects: { zufriedenheit: 3, wertstiftung: 6, energie: -10, beziehungen: 2 }, phases: ["arbeit", "job", "akademisch"] },
  { id: "j_hilfsassistenz", name: "Hilfsassistenz an der Hochschule", icon: "🔬", when: ["nachmittag", "abend"], money: 1000, minAge: 19, tier: 3,
    effects: { zufriedenheit: 4, wertstiftung: 6, energie: -6, beziehungen: 2 }, phases: ["studium"] },

  // --- Wertstiftung und Beziehungen für junge Erwachsene ---
  { id: "e_vereinsvorstand", name: "Im Vereinsvorstand mitarbeiten", icon: "🗂️", when: ["abend"], money: 0, minAge: 19,
    effects: { zufriedenheit: 3, wertstiftung: 9, energie: -6, beziehungen: 4 } },
  { id: "e_mentoring", name: "Mentoring für Lernende", icon: "🤝", when: ["abend", "wochenende"], money: 0, minAge: 20,
    effects: { zufriedenheit: 4, wertstiftung: 10, energie: -5, beziehungen: 3 } },
  { id: "e_ausgang", name: "Ausgang am Wochenende", icon: "🪩", when: ["wochenende", "abend"], money: -240, minAge: 16,
    effects: { zufriedenheit: 8, energie: -6, beziehungen: 7 } },
  { id: "e_fitness", name: "Fitnessstudio", icon: "🏋️", when: ["nachmittag", "abend"], money: -180, minAge: 16,
    effects: { zufriedenheit: 4, energie: 5, beziehungen: 1 } },
  { id: "e_staedtetrip", name: "Städtetrip mit Freunden", icon: "🧳", when: ["wochenende"], money: -450, minAge: 18,
    effects: { zufriedenheit: 10, energie: 2, beziehungen: 8 } },
  { id: "e_ferien", name: "Eine Woche Ferien am Meer", icon: "🏖️", when: ["wochenende"], money: -1200, minAge: 18,
    effects: { zufriedenheit: 10, energie: 12, beziehungen: 4 } },
  { id: "e_wg_kochen", name: "Für die WG kochen", icon: "🥘", when: ["abend"], money: -60, minAge: 19,
    effects: { zufriedenheit: 4, wertstiftung: 3, energie: -2, beziehungen: 8 }, requires: "ausgezogen", lockedInfo: "Erst wenn du ausgezogen bist" },
  { id: "e_eltern_besuchen", name: "Eltern zum Essen besuchen", icon: "🏡", when: ["abend", "wochenende"], money: 0, minAge: 19,
    effects: { zufriedenheit: 4, energie: 2, beziehungen: 8 }, requires: "ausgezogen", lockedInfo: "Erst wenn du ausgezogen bist" },
  { id: "e_steuern_lernen", name: "Finanzen und Steuern verstehen", icon: "🧾", when: ["abend", "wochenende"], money: 0, minAge: 17,
    effects: { zufriedenheit: 2, wertstiftung: 2, energie: -3 }, info: "Video, Rechner, Fragen an die Eltern" },

  // --- Seltene Aktivitäten (erscheinen nur ab und zu) ---
  { id: "r_konzertticket", name: "Gratis-Ticket für ein Konzert", icon: "🎟️", when: ["abend", "wochenende"], money: 0, rarity: "selten",
    effects: { zufriedenheit: 10, energie: -2, beziehungen: 6 }, info: "Jemand kann nicht und schenkt dir das Ticket" },
  { id: "r_workshop", name: "Workshop mit einer bekannten Person", icon: "🌟", when: ["wochenende"], money: -50, minAge: 14, rarity: "selten",
    effects: { zufriedenheit: 8, wertstiftung: 6, energie: -3, beziehungen: 3 }, info: "Nur ein paar Plätze frei" },
  { id: "r_praktikum", name: "Praktikum bei der Traumfirma", icon: "🚀", when: ["nachmittag", "wochenende"], money: 1200, minAge: 17, rarity: "sehr selten",
    effects: { zufriedenheit: 10, wertstiftung: 8, energie: -6, beziehungen: 4 }, info: "So eine Chance kommt selten" },
  { id: "r_kunstwerk", name: "Eigenes Bild an einer Ausstellung verkaufen", icon: "🖼️", when: ["wochenende"], money: 800, rarity: "sehr selten",
    effects: { zufriedenheit: 12, wertstiftung: 5, beziehungen: 3 } }
];

export const ADULT_EVENTS = [
  // --- Meilensteine: kommen sicher, sobald das Alter erreicht ist ---
  { id: "m_berufswahl", milestone: true, atAge: 16, phases: ["schule"], icon: "🧭",
    text: "Die Oberstufe ist fertig. Wie geht es für dich weiter?", options: [
      { label: "Lehre beginnen (Lehrlingslohn)", setPhase: "lehre", effects: { zufriedenheit: 4, wertstiftung: 4 } },
      { label: "Gymnasium (kein Lohn, später Studium)", setPhase: "mittelschule", effects: { zufriedenheit: 4 } } ] },
  { id: "m_volljaehrig", milestone: true, atAge: 18, icon: "🎉",
    text: "Du bist 18! Jetzt unterschreibst du Verträge selbst, darfst abstimmen und zahlst ab jetzt Steuern.", options: [
      { label: "Mit dem Freundeskreis feiern (Fr. 100)", money: -100, effects: { zufriedenheit: 6, beziehungen: 6 } },
      { label: "In Ruhe ein Budget aufstellen", effects: { zufriedenheit: 2, wertstiftung: 2 } } ] },
  { id: "m_matura", milestone: true, atAge: 18, phases: ["mittelschule"], icon: "📜",
    text: "Matura bestanden! Studium oder gleich arbeiten?", options: [
      { label: "Studium (bis 22, wenig Geld)", setPhase: "studium", effects: { zufriedenheit: 5, wertstiftung: 3 } },
      { label: "Direkt arbeiten (Job ohne Berufsabschluss)", setPhase: "job", effects: { zufriedenheit: 2 } } ] },
  { id: "m_krankenkasse", milestone: true, atAge: 18, icon: "🏥",
    text: "Ab 19 zahlst du deine Krankenkasse selbst, im Schnitt rund Fr. 326 im Monat. Welche Franchise wählst du?", options: [
      { label: "Franchise Fr. 300 (höhere Prämie)", effects: { zufriedenheit: 1 } },
      { label: "Franchise Fr. 2500 (Fr. 100 weniger Prämie pro Monat)", flag: "franchise_hoch", effects: {} } ] },
  { id: "m_lehrabschluss", milestone: true, atAge: 19, phases: ["lehre"], icon: "🎓",
    text: "Lehrabschluss geschafft! Dein Betrieb möchte dich behalten.", options: [
      { label: "Im Betrieb bleiben", setPhase: "arbeit", effects: { zufriedenheit: 4, beziehungen: 5 } },
      { label: "Neue Stelle suchen, 5 % mehr Lohn", setPhase: "arbeit", incomeBonus: 0.05, effects: { zufriedenheit: 5, energie: -6 } } ] },
  { id: "m_wohnung", milestone: true, atAge: 20, condition: { flag: "ausgezogen", not: true }, icon: "🔑",
    text: "Eine Freundin sucht jemanden für ihre WG. Das Zimmer kostet Fr. 700 im Monat.", options: [
      { label: "In die WG ziehen (Fr. 2100 pro Quartal)", flag: "ausgezogen", addCost: { name: "Miete WG", amount: 2100, interval: "quartal" }, effects: { zufriedenheit: 8, beziehungen: 5 } },
      { label: "Eigene kleine Wohnung (Fr. 3900 pro Quartal)", flag: "ausgezogen", addCost: { name: "Miete Wohnung", amount: 3900, interval: "quartal" }, effects: { zufriedenheit: 10 } },
      { label: "Noch zuhause wohnen bleiben", effects: {} } ] },
  { id: "m_studienabschluss", milestone: true, atAge: 22, phases: ["studium"], icon: "🎓",
    text: "Bachelor geschafft! Du hast zwei Stellenangebote.", options: [
      { label: "Grosse Firma, guter Lohn", setPhase: "akademisch", incomeBonus: 0.1, effects: { zufriedenheit: 4, energie: -6 } },
      { label: "Hilfswerk, weniger Lohn, viel Sinn", setPhase: "akademisch", incomeBonus: -0.15, effects: { zufriedenheit: 6, wertstiftung: 10 } } ] },

  // --- Geld und Verträge ab 18 ---
  { id: "g_kreditkarte", milestone: true, atAge: 19, icon: "💳", text: "Eine Bank bietet dir eine Kreditkarte an, mit Fr. 50 Startbonus.", options: [
    { label: "Annehmen", money: 50, flag: "kreditkarte", effects: { zufriedenheit: 3 } },
    { label: "Ablehnen, die Debitkarte reicht", effects: { wertstiftung: 1 } } ] },
  { id: "g_kreditkarte_rechnung", minAge: 18, condition: { flag: "kreditkarte" }, icon: "🧾", text: "Die Kreditkartenrechnung ist höher als gedacht: Fr. 900.", options: [
    { label: "Ganz bezahlen", money: -900, effects: { zufriedenheit: -2 } },
    { label: "Nur Fr. 90 zahlen, Rest in Raten mit rund 12 % Jahreszins (zusammen Fr. 950)", money: -90, addCost: { name: "Kreditkartenschuld", amount: 215, interval: "quartal", quarters: 4 }, effects: { zufriedenheit: 1 } } ] },
  { id: "g_leasing", milestone: true, atAge: 21, icon: "🚙", text: "Ein Autohändler bietet ein Leasing an: keine Anzahlung, Fr. 390 im Monat für 4 Jahre.", options: [
    { label: "Leasing abschliessen", flag: "auto", addCost: { name: "Leasing", amount: 1170, interval: "quartal", quarters: 16 }, effects: { zufriedenheit: 10, energie: 3 } },
    { label: "Occasion bar kaufen (Fr. 6000)", money: -6000, flag: "auto", effects: { zufriedenheit: 6, energie: 3 } },
    { label: "ÖV und Velo reichen", effects: { wertstiftung: 2 } } ] },
  { id: "g_auto_reifen", minAge: 18, condition: { flag: "auto" }, icon: "🛞", text: "Dein Auto braucht neue Reifen und einen Service.", options: [
    { label: "Machen lassen (Fr. 900)", money: -900 },
    { label: "Noch ein bisschen warten", effects: { zufriedenheit: -4, energie: -3 } } ] },
  { id: "g_ratenkauf", minAge: 18, icon: "📱", text: "Das neue Handy kostet Fr. 1200. Oder 24 Raten à Fr. 59.", options: [
    { label: "Bar bezahlen (Fr. 1200)", money: -1200, effects: { zufriedenheit: 8 } },
    { label: "In Raten (zusammen Fr. 1416)", addCost: { name: "Handy-Raten", amount: 177, interval: "quartal", quarters: 8 }, effects: { zufriedenheit: 8 } },
    { label: "Altes Handy behalten", effects: { zufriedenheit: -2 } } ] },
  { id: "g_betreibung", urgent: true, minAge: 18, condition: { debt: true }, icon: "⚠️", text: "Du hast Rechnungen nicht bezahlt. Jetzt kommt eine Betreibung. Sie steht im Register und stört bei der Wohnungssuche.", options: [
    { label: "Bei der Schuldenberatung Hilfe holen", effects: { zufriedenheit: -3, beziehungen: 2, energie: -2 } },
    { label: "Ignorieren (Gebühren Fr. 150)", money: -150, effects: { zufriedenheit: -8, beziehungen: -4 } } ] },
  { id: "g_steuererklaerung", minAge: 18, icon: "📑", text: "Deine erste Steuererklärung liegt auf dem Tisch. Viele Formulare.", options: [
    { label: "Mit den Eltern ausfüllen", effects: { energie: -4, beziehungen: 3, wertstiftung: 2 } },
    { label: "Steuerberatung bezahlen (Fr. 150)", money: -150 },
    { label: "Liegen lassen (Busse Fr. 200)", money: -200, effects: { zufriedenheit: -4 } } ] },
  { id: "g_saeule3a", minAge: 19, phases: ["arbeit", "job", "akademisch"], icon: "🏦", text: "Deine Bank empfiehlt eine Säule 3a. Einzahlungen kannst du von den Steuern abziehen.", options: [
    { label: "Fr. 2000 in die Säule 3a (dieses Jahr Fr. 2000 weniger steuerbares Einkommen)", money: -2000, savings: 2000, taxDeduction: 2000, effects: { zufriedenheit: 2 } },
    { label: "Jetzt noch nicht", effects: {} } ] },
  { id: "g_krypto", minAge: 18, icon: "🪙", text: "Ein Kollege schwärmt von einer Kryptomünze. Sie sei schon um das Zehnfache gestiegen.", options: [
    { label: "Fr. 1000 investieren", money: -1000, flag: "krypto", effects: { zufriedenheit: 3 } },
    { label: "Lieber nicht", effects: {} } ] },
  { id: "g_krypto_verlust", group: "krypto_ende", minAge: 18, condition: { flag: "krypto" }, icon: "📉", text: "Die Kryptomünze ist um 80 % gefallen. (Gewinne und Verluste mit privatem Vermögen sind in der Schweiz steuerfrei bzw. nicht abziehbar.)", options: [
    { label: "Verkaufen (Fr. 200 zurück)", money: 200, removeFlag: "krypto", effects: { zufriedenheit: -6 } } ] },
  { id: "g_krypto_gewinn", group: "krypto_ende", minAge: 18, condition: { flag: "krypto" }, icon: "📈", text: "Glück gehabt: Die Kryptomünze ist gestiegen.", options: [
    { label: "Verkaufen (Fr. 1800 zurück)", money: 1800, removeFlag: "krypto", effects: { zufriedenheit: 6 } } ] },
  { id: "g_sportwetten", minAge: 18, icon: "🎰", text: "Eine App für Sportwetten schenkt dir Fr. 20 Startguthaben, wenn du Fr. 100 einzahlst.", options: [
    { label: "Einzahlen und wetten", money: -100, effects: { zufriedenheit: 2, energie: -2 } },
    { label: "Löschen", effects: { zufriedenheit: 1 } } ] },
  { id: "g_spende_abo", minAge: 19, icon: "💚", text: "Ein Hilfswerk fragt dich, ob du jeden Monat Fr. 20 spendest.", options: [
    { label: "Ja, monatlich", addCost: { name: "Spende Hilfswerk", amount: 60, interval: "quartal" }, effects: { wertstiftung: 7, zufriedenheit: 2 } },
    { label: "Einmal Fr. 50", money: -50, effects: { wertstiftung: 3 } },
    { label: "Nein, danke", effects: {} } ] },
  { id: "g_lohnangebot", minAge: 20, phases: ["arbeit", "job"], icon: "📈", text: "Ein anderer Betrieb bietet dir 10 % mehr Lohn. Dort kennst du niemanden.", options: [
    { label: "Wechseln", incomeBonus: 0.1, effects: { beziehungen: -4, energie: -4 } },
    { label: "Bleiben", effects: { beziehungen: 3 } } ] },
  { id: "g_weiterbildung", minAge: 20, phases: ["arbeit", "job"], icon: "📚", text: "Eine Weiterbildung zur Teamleitung kostet Fr. 3000 und braucht viele Abende.", options: [
    { label: "Machen (später 10 % mehr Lohn)", money: -3000, incomeBonus: 0.1, effects: { energie: -8, wertstiftung: 4, zufriedenheit: 3 } },
    { label: "Jetzt nicht", effects: {} } ] },
  { id: "g_job_endet", minAge: 19, phases: ["job"], icon: "📦", text: "Dein befristeter Vertrag läuft aus. Bis zum neuen Job fehlt dir ein Monatslohn.", options: [
    { label: "Sofort Neues suchen", money: -1500, effects: { energie: -6, zufriedenheit: -3 } },
    { label: "Zwei Monate Pause", money: -3500, effects: { energie: 8, zufriedenheit: 2 } } ] },
  { id: "g_stipendium", minAge: 18, phases: ["studium"], icon: "🗃️", text: "Du könntest ein Stipendium beantragen. Das Formular ist lang.", options: [
    { label: "Antrag stellen", money: 2000, effects: { energie: -4 } },
    { label: "Lassen", effects: {} } ] },
  { id: "g_semesterpruefung_ok", group: "semester", minAge: 18, phases: ["studium"], condition: { flag: "vorbereitet" }, icon: "📝", text: "Prüfungsphase an der Hochschule. Du hast gut gelernt.", options: [
    { label: "Ruhig schreiben", effects: { zufriedenheit: 8, wertstiftung: 2 } } ] },
  { id: "g_semesterpruefung", group: "semester", minAge: 18, phases: ["studium"], condition: { flag: "vorbereitet", not: true }, icon: "📝", text: "Prüfungsphase an der Hochschule, und du bist knapp dran.", options: [
    { label: "Zwei Wochen durchlernen", effects: { energie: -12, zufriedenheit: 2 } },
    { label: "Eine Prüfung verschieben", effects: { zufriedenheit: -6 } } ] },
  { id: "g_berufsschule_ok", group: "berufsschule", minAge: 16, phases: ["lehre"], condition: { flag: "vorbereitet" }, icon: "🛠️", text: "Prüfung in der Berufsschule. Du hast gelernt.", options: [
    { label: "Ruhig schreiben", effects: { zufriedenheit: 8 } } ] },
  { id: "g_berufsschule", group: "berufsschule", minAge: 16, phases: ["lehre"], condition: { flag: "vorbereitet", not: true }, icon: "🛠️", text: "Morgen ist Prüfung in der Berufsschule, und du hast nicht gelernt.", options: [
    { label: "Bis spät lernen", effects: { energie: -10, zufriedenheit: 2 } },
    { label: "Wird schon gehen", effects: { zufriedenheit: -7 } } ] },
  { id: "g_ueberstunden", minAge: 16, phases: ["lehre", "arbeit", "job"], icon: "⏱️", text: "Im Betrieb ist Hochbetrieb. Die Chefin fragt, ob du Überstunden machst.", options: [
    { label: "Ja (Fr. 300 extra)", money: 300, taxable: true, effects: { energie: -8, wertstiftung: 3, beziehungen: 2 } },
    { label: "Nein, ich brauche Erholung", effects: { energie: 2, beziehungen: -2 } } ] },
  { id: "g_lohnabrechnung", minAge: 19, phases: ["arbeit", "job", "akademisch"], icon: "📄", text: "Auf deiner Lohnabrechnung gehen AHV, Arbeitslosenversicherung und Pensionskasse ab. Netto ist weniger als abgemacht.", options: [
    { label: "Nachfragen und verstehen", effects: { wertstiftung: 2, zufriedenheit: 2, energie: -2 } },
    { label: "Ärgern und weitermachen", effects: { zufriedenheit: -3 } } ] },

  // --- Wohnen ---
  { id: "w_zuhause_eng", minAge: 21, condition: { flag: "ausgezogen", not: true }, icon: "🏠", text: "Zuhause wird es eng. Deine Eltern möchten mehr Kostgeld.", options: [
    { label: "Mehr Kostgeld zahlen (Fr. 600 pro Quartal)", addCost: { name: "Mehr Kostgeld", amount: 600, interval: "quartal" }, effects: { beziehungen: 3 } },
    { label: "Ausziehen in eine WG (Fr. 2100 pro Quartal)", flag: "ausgezogen", addCost: { name: "Miete WG", amount: 2100, interval: "quartal" }, effects: { zufriedenheit: 8, beziehungen: 2 } } ] },
  { id: "w_nebenkosten", minAge: 19, condition: { flag: "ausgezogen" }, icon: "🔥", text: "Die Nebenkostenabrechnung kommt: Fr. 400 Nachzahlung für die Heizung.", options: [
    { label: "Bezahlen", money: -400, effects: { zufriedenheit: -2 } },
    { label: "Nachfragen und Ratenzahlung abmachen", money: -200, addCost: { name: "Nebenkosten-Rate", amount: 200, interval: "quartal", quarters: 1 }, effects: { energie: -2 } } ] },
  { id: "w_wg_streit", minAge: 19, condition: { flag: "ausgezogen" }, icon: "🧽", text: "In der WG gibt es Streit, weil niemand putzt.", options: [
    { label: "Putzplan vorschlagen", effects: { beziehungen: 6, energie: -3, wertstiftung: 3 } },
    { label: "Einfach selbst putzen", effects: { energie: -6, zufriedenheit: -3 } } ] },
  { id: "w_umzug_helfen", minAge: 19, icon: "📦", text: "Jemand aus deinem Freundeskreis zieht um und braucht Hilfe.", options: [
    { label: "Den ganzen Samstag helfen", effects: { beziehungen: 7, energie: -6, wertstiftung: 4 } },
    { label: "Absagen", effects: { beziehungen: -3 } } ] },

  // --- Gesundheit ---
  { id: "k_unfall_hoch", group: "unfall", minAge: 19, condition: { flag: "franchise_hoch" }, icon: "🦴", text: "Du brichst dir beim Sport das Handgelenk. Arzt und Röntgen kosten Fr. 1800. Mit Franchise 2500 zahlst du alles selbst.", options: [
    { label: "Bezahlen (Fr. 1800)", money: -1800, effects: { energie: -6, zufriedenheit: -4 } } ] },
  { id: "k_unfall_tief", group: "unfall", minAge: 19, condition: { flag: "franchise_hoch", not: true }, icon: "🦴", text: "Du brichst dir beim Sport das Handgelenk. Arzt und Röntgen kosten Fr. 1800. Mit Franchise 300 zahlst du nur einen Teil.", options: [
    { label: "Franchise und Selbstbehalt zahlen (Fr. 450)", money: -450, effects: { energie: -6, zufriedenheit: -4 } } ] },

  // --- Beziehungen ---
  { id: "b_verliebt", minAge: 16, icon: "💞", text: "Du hast dich verliebt. Ihr möchtet viel Zeit zusammen verbringen.", options: [
    { label: "Viel Zeit zu zweit (Fr. 200 für Ausflüge)", money: -200, effects: { zufriedenheit: 10, beziehungen: 8, energie: -4 } },
    { label: "Langsam angehen", effects: { zufriedenheit: 4, beziehungen: 4 } } ] },
  { id: "b_ferien_freunde", minAge: 18, icon: "✈️", text: "Dein Freundeskreis plant eine Woche Barcelona. Kosten rund Fr. 900.", options: [
    { label: "Mitkommen", money: -900, effects: { zufriedenheit: 10, beziehungen: 8, energie: 4 } },
    { label: "Absagen und sparen", effects: { beziehungen: -4 } } ] },
  { id: "b_abstimmung", minAge: 18, icon: "🗳️", text: "Am Sonntag ist Abstimmung. Du darfst zum ersten Mal mitentscheiden.", options: [
    { label: "Informieren und abstimmen", effects: { wertstiftung: 4, zufriedenheit: 3, energie: -2 } },
    { label: "Diesmal nicht", effects: {} } ] }
];
