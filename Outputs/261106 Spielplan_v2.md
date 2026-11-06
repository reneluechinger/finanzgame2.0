# FinanzGame 2.0 «Lebenslauf» – Spielplan v2

Basis ist FinanzGame 1 (Repo `reneluechinger/finanzgame`). Komplexität, Design «Balance», fünf Werte, Punkteformel, Editor und Bestenliste bleiben. Neu ist, dass man älter wird.

## 1. Zeitmodell
- **1 Spieltag = 1 Quartal**, 4 Spieltage = 1 Lebensjahr (Frühling, Sommer, Herbst, Winter)
- **Startalter wählen die Lernenden beim Spielstart: 12 bis 16** (Standard 12)
- **Ende immer mit 25.** Start mit 12 ergibt 52 Spieltage, Start mit 16 ergibt 36 Spieltage
- Pro Spieltag **3 Zeitfenster**: Nachmittag, Abend, Wochenende. Die Hauptbeschäftigung (Schule, Lehre, Arbeit) läuft automatisch mit und kostet Energie
- Die 200 Aktivitäten aus v1 bleiben nutzbar: «werktag-nachmittag» wird Nachmittag, «werktag-abend» und «wochenende-abend» werden Abend, «wochenende-morgen» und «wochenende-nachmittag» werden Wochenende
- **Jahresrückblick nach jedem Geburtstag** (statt Wochenrückblick) mit Verlauf und Reflexionsfrage, dort speichern und später weiterspielen. So lässt sich das Spiel über mehrere Lektionen verteilen

## 2. Lebensphasen und Alterseffekte (vereinfacht, Schweizer Verhältnisse)
| Alter | Hauptbeschäftigung | Geld | Neu dazu |
|---|---|---|---|
| 12–14 | Oberstufe | Taschengeld pro Quartal | Handy-Anteil |
| 15/16 | Entscheid per Ereignis: Lehre oder weiterführende Schule | Lehre: Lehrlingslohn, Taschengeld fällt weg. Schule: weiter Taschengeld, später besser bezahlte Jobs | Berufswahl-Ereignisse, Lehrbeginn |
| 18 | Volljährig | | **Steuern** einmal pro Jahr (abhängig vom Einkommen des Jahres), **Kreditkarte, Leasing, Ratenkauf, Betreibung** als Ereignisse |
| 19 | | | **Krankenkasse selbst bezahlen** (Prämie pro Quartal, Wahl der Franchise per Ereignis) |
| 19/20 | Lehrabschluss bzw. Studium/Job | Lohn steigt | Freiwillig **WG oder eigene Wohnung** per Ereignis (Miete als grosse Fixkosten, dafür Zufriedenheit). Wer zuhause bleibt, spart, aber Beziehungen und Zufriedenheit leiden mit der Zeit |

Beträge werden realistisch gerundet, im Spiel mit dem Hinweis «vereinfacht». Ich nenne im Code bei Krankenkasse, Lehrlingslohn und Steuern die Quelle für die Grössenordnung (z.B. BAG Prämienübersicht, Lohnempfehlungen der Berufsverbände). Was ich nicht belegen kann, markiere ich.

**Geld-Wert:** Weil die Beträge mit dem Alter wachsen, misst der Geld-Wert neu das **Finanzpolster im Verhältnis zum Alter** (z.B. 100 = Fr. 300 mit 12, Fr. 3000 mit 18, Fr. 10 000 mit 25). Die genauen Zahlen stimme ich mit der Simulation ab. Schulden ergeben Geld-Wert 0 und den bekannten Abzug.

## 3. Progression der Aktivitäten
- Jede Aktivität bekommt **«ab Alter»** und optional **«bis Alter»** (Spielplatz mit 12 ja, mit 22 nicht mehr) sowie eine **Stufe 1–3**
- Früh erscheinen vor allem Stufe-1-Aktivitäten (Prospekte verteilen, Fr. 15), später bessere (Nachhilfe, Babysitten, Ferienjob, Teilzeitjob, Freelance-Auftrag mit mehr Lohn und mehr Wertstiftung)
- Pro Zeitfenster erscheinen 1–2 **gesperrte Vorschau-Karten** mit Schloss «🔒 ab 16», damit man sieht, worauf man hinarbeitet
- Beim Geburtstag: Hinweis **«Neu freigeschaltet»** mit den neuen Aktivitäten
- Ich ordne den 200 Aktivitäten Alter und Stufe zu und ergänze rund 30 neue für 18–25 (z.B. Teilzeitjob im Detailhandel, Nachtschicht, Weiterbildung, Vereinsvorstand, Freiwilligenarbeit im Ausland)
- **Ausruhen** ist ab Beginn immer wählbar
- Ereignisse bekommen ebenfalls ein Altersfenster. Rund 40 neue Ereignisse für die Erwachsenen-Effekte (Steuererklärung, Franchise wählen, Kreditkarten-Angebot, Leasing-Auto, Handy auf Raten, Betreibung, WG-Angebot, Lehrstellensuche, Lehrabschluss, Führerausweis)

## 4. Energie
- **Energieverbrauch 20 % tiefer:** Alle negativen Energie-Effekte (Aktivitäten, Hauptbeschäftigung, Ereignisse) werden mit 0,8 multipliziert. Der Faktor ist im Editor einstellbar
- Danach Abstimmung mit der Simulation, Ziel wie in v1: ausgewogenes Spiel etwa 80 Punkte, zufälliges etwa 27, einseitiges unter 20

## 5. Playlist
- «Playlist zusammenstellen» schaltet ab dem nächsten Spieltag die Aktivität **«Eigene Playlist hören» 🎧** frei
- Wirkung: **Energie +12 (↑↑↑)**, Zufriedenheit +3, kostet nichts, in allen Zeitfenstern wählbar, wird nach dem Freischalten immer angeboten

## 6. Anpassungen an Oberfläche, Editor, Bestenliste
- Kopfzeile zeigt **Alter, Quartal, Lebensphase** statt «Woche 2, Dienstag»
- Startbildschirm: Spitzname und **Startalter (Regler 12–16)**
- Endauswertung «Mit 25» statt Monatsauswertung, mit Verlauf über alle Jahre, wichtigsten Entscheidungen, bezahlten Steuern und Krankenkasse
- Editor: Felder «ab Alter», «bis Alter», «Stufe» bei Aktivitäten und Ereignissen, Energiefaktor, Altersbereich, Phasen-Beträge
- Bestenliste speichert das Startalter und zeigt Filter nach Startalter (sonst unfair). Das Apps Script bekommt eine Spalte dazu, die Anleitung im README wird ergänzt
- Design: bleibt «Balance». Für die neuen Elemente (Altersanzeige, Schloss-Karten) **keine vier Entwürfe**, ausser du willst das

## 7. Reihenfolge
1. **Stopp: Plan freigeben** (dieses Dokument)
2. v1-Code ins Repo `finanzgame2.0` übernehmen
3. Zeitmodell, Alter, Lebensphasen, Fixkosten, Steuern, Krankenkasse in `engine.js` und `config.js`
4. Altersfenster und Stufen für alle Aktivitäten und Ereignisse, neue Inhalte, Playlist
5. Energie-Faktor, Simulation und Abstimmung der Zahlen, Tests
6. Oberfläche, Editor, Bestenliste, README
7. Prüfung durch separaten Agenten ohne Vorwissen gegen diesen Plan, Test auf iPad-Grösse
8. Commit und Push auf den Branch
