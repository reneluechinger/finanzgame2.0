# FinanzGame 2.0 «Lebenslauf»

Ein Browserspiel für die Oberstufe. Lernende spielen ihr Leben vom gewählten Startalter (12 bis 16) bis 25. **Ein Spieltag ist ein Quartal**, vier Spieltage sind ein Jahr. Jedes Quartal wählen sie, was sie in ihrer freien Zeit regelmässig machen. Ziel ist, fünf Werte möglichst hoch und im Gleichgewicht zu halten: **Geld, Zufriedenheit, Wertstiftung, Energie und Beziehungen**.

Kernidee: Geld ist oft die Folge von Nutzen, den man für andere schafft. Wer nur auf einen Wert setzt, verliert Punkte. Mit dem Älterwerden kommen neue Möglichkeiten und neue Pflichten dazu.

- Läuft im Browser, optimiert für iPads im Querformat, funktioniert auch im Hochformat und am Laptop
- Kein Login. Spielstand, Reflexionen und Durchgänge bleiben im Browser des Geräts
- Optionale gemeinsame Bestenliste über ein Google Sheet, filterbar nach Startalter
- Editor für Lehrpersonen: Werte, Lebensphasen, Aktivitäten, Ereignisse, Kosten und Fragen anpassen und als Link teilen

## Was neu ist gegenüber FinanzGame 1

- **Älter werden:** Startalter 12–16, Ende mit 25. Start mit 12 = 52 Quartale, Start mit 16 = 36 Quartale
- **Lebensphasen:** Oberstufe → mit 16 Lehre oder Gymnasium → mit 18 nach dem Gymnasium Studium (bis 22) oder Job → Berufsleben. Jede Phase bringt Einkommen (Taschengeld, Lehrlingslohn, Lohn) und Grundkosten
- **Erwachsenen-Effekte:** Steuern ab 18 (einmal pro Jahr auf das Einkommen des Vorjahres), Krankenkasse ab 19 mit Wahl der Franchise (Entscheid mit 18), Kreditkarte (sicher mit 19), Leasing (sicher mit 21), Ratenkauf, Betreibung (sicher nach 2 Quartalen mit Schulden), Säule 3a, Krypto, freiwilliger Auszug in WG oder Wohnung ab 20
- **Progression:** Aktivitäten sind nach Alter freigeschaltet. Gesperrte erscheinen als Vorschau («🔒 ab 16»). Jobs haben Stufen 1–3: zuerst einfache, später besser bezahlte. Im Jahresrückblick steht, was mit dem nächsten Geburtstag neu dazukommt. Ausruhen geht immer
- **Seltenheit:** Manche Aktivitäten tauchen nur selten auf: selten (5 %), sehr selten (1 %), ultra-selten (0,1 %), jeweils pro Quartal. «Geld an Israel spenden» ist ultra-selten (bei 52 Quartalen in etwa jedem 20. Spiel), kostet Fr. 10 000 (auch vom Sparkonto) und gibt +20 auf alle anderen Werte
- **Geld-Progression:** Mit 12 startet man mit Fr. 40, Jobs bringen wenig (z.B. Hunde ausführen etwa Fr. 40 pro Quartal) und Ausgaben kosten wenig. Ein Preisniveau nach Alter (Faktor 0,25 mit 12 bis 2,5 mit 25) lässt Einnahmen und Ausgaben der Aktivitäten mit dem Alter steigen. Dazu kommen grössere Fixkosten: Lebenskosten in der Lehre Fr. 1900 und im Berufsleben Fr. 7000 pro Quartal, Krankenkasse, Steuern, Miete. Kurse und Erwachsenen-Jobs haben feste Beträge
- **Energie:** Alle Energie-Kosten sind 20 % kleiner (im Editor einstellbar)
- **Playlist:** «Playlist zusammenstellen» schaltet «Eigene Playlist hören» frei (Energie ↑↑↑, +12)
- **Nach jedem Jahr** statt nach jeder Woche ein Rückblick mit Reflexionsfrage und Speichern
- **Lebensbilanz mit 25:** Verlauf, Weg (Lehre, Studium …), bezahlte Steuern, Krankenkasse, Miete und die wichtigen Entscheidungen

## So läuft ein Spiel

1. Spitzname eingeben (kein echter Name) und Startalter wählen
2. Jedes Quartal: Nachmittag, Abend und Wochenende belegen. Die Hauptsache (Schule, Lehre, Studium, Arbeit) läuft automatisch mit
3. Die gestrichelte Linie im Fünfeck zeigt, wie sich die Werte nach dem Quartal verändern
4. In etwa jedem zweiten Quartal passiert ein Ereignis mit einer Entscheidung. Wichtige Entscheidungen (Berufswahl, Matura, Krankenkasse, Wohnung) kommen sicher zum passenden Alter
5. Nach jedem Jahr: Rückblick mit Verlauf und Reflexionsfrage. Hier kann man speichern und später weiterspielen
6. Mit 25: Lebensbilanz, druckbar oder als PDF speicherbar. Der Eintrag in die Bestenliste passiert automatisch

**Punkte** = Durchschnitt aller Werte − halber Abstand zwischen höchstem und tiefstem Wert. Für jeden Wert auf 0 gibt es 5 Punkte Abzug. Der **Geld-Wert** misst das Polster (Konto + Sparkonto) im Verhältnis zum Alter: 100 entspricht mit 12 etwa Fr. 500, mit 16 Fr. 1800, mit 18 Fr. 5000, mit 24 rund Fr. 38 000 (pro Quartal gemittelt, damit es am Geburtstag keinen Sprung gibt).

Testläufe (`node tests/sim.mjs`, je 30 Spiele, Start mit 12 bzw. 16): sehr ausgewogenes Spiel etwa 94–95 Punkte, Faustregel «Abend immer ausruhen, sonst zufällig» 81–90, einfache Strategie 80–87, zufällig 28–33, nur Arbeit oder nur Spass unter 25. Wer studiert, hat bis 22 deutlich weniger Geld; wer im Studium auszieht, verschuldet sich.

## Beträge und Quellen (vereinfacht)

| Was | Im Spiel | Grundlage |
|---|---|---|
| Taschengeld | Fr. 40 pro Monat bis 14, Fr. 75 ab 15 | Budgetberatung Schweiz, Richtlinien Taschengeld 2023/2024 (Fr. 30–50 bzw. 50–100) |
| Lehrlingslohn | Fr. 780 / 930 / 1110 pro Monat | lohncheck.ch, «Lehrling», Durchschnitt pro Lehrjahr (2026) |
| Krankenkasse ab 19 | rund Fr. 326 pro Monat, mit Franchise 2500 Fr. 100 weniger | BAG, Prämien 2026, mittlere Prämie junge Erwachsene Fr. 326.30 |
| Lohn nach Lehre / Studium / Job, Lebenskosten, Steuersatz, Miete | Fr. 4000 / 5000 / 3600 netto pro Monat, rund Fr. 2300 Lebenskosten (Lehre Fr. 630), 8 % über Fr. 10 000 (Säule 3a im Jahr der Einzahlung abziehbar) | grobe Annahmen ohne Einzelquelle |

## Schritt 1: Spiel online stellen (GitHub Pages)

1. Auf GitHub das Repository öffnen: **Settings → General**. Ganz unten bei «Danger Zone» die Sichtbarkeit auf **Public** stellen (bei einem Gratis-Konto nötig). Im Code sind keine Daten von Lernenden.
2. **Settings → Pages**. Bei «Source» **Deploy from a branch** wählen, dann den Branch (z.B. `main`) und den Ordner `/ (root)`. Speichern.
3. Nach ein bis zwei Minuten steht oben die Adresse, z.B. `https://reneluechinger.github.io/finanzgame2.0/`. Diesen Link bekommen die Lernenden.

## Schritt 2: Bestenliste einrichten (optional)

Ohne diesen Schritt zeigt jedes Gerät nur die eigenen Durchgänge.

1. Neues Google Sheet anlegen, z.B. «FinanzGame 2.0 Bestenliste». (Das Script von FinanzGame 1 funktioniert auch, zeigt aber kein Startalter. Am besten das neue `apps-script/Code.gs` verwenden.)
2. Im Sheet: **Erweiterungen → Apps Script**.
3. Den Inhalt von `apps-script/Code.gs` in das Fenster kopieren (vorhandenen Code ersetzen) und speichern.
4. **Bereitstellen → Neue Bereitstellung**. Beim Zahnrad «Web-App» wählen.
   - Ausführen als: **Ich**
   - Zugriff: **Jeder**

   Aus Sicherheitsgründen akzeptiert das Spiel nur Adressen, die mit `https://script.google.com/` beginnen.
5. **Bereitstellen** klicken, Google-Konto autorisieren. Die angezeigte **Web-App-URL** kopieren (endet auf `/exec`).
6. Im Spiel unten auf **Für Lehrpersonen** tippen, PIN eingeben, Reiter **Allgemein**, URL bei «Bestenliste» einfügen, **Speichern**.
7. Reiter **Teilen → Link erzeugen** und diesen Link der Klasse geben. Nur wer den Link mindestens einmal öffnet, schreibt in die gemeinsame Liste. Wer nur die normale Adresse ohne Link öffnet, spielt ohne gemeinsame Bestenliste.

**Script aktualisieren** (wenn sich `apps-script/Code.gs` geändert hat): Im Apps-Script-Fenster den Code ersetzen und speichern. Dann **Bereitstellen → Bereitstellungen verwalten**, beim Stift-Symbol **Version: Neue Version** wählen und **Bereitstellen**. Die URL bleibt gleich, im Spiel muss nichts geändert werden.

Unpassende Spitznamen löschst du direkt im Sheet (Zeile löschen).

## Schritt 3: Eigene Variante erstellen

1. Im Spiel auf **Für Lehrpersonen** tippen. Die Standard-PIN ist **1234**. Bitte unter **Allgemein → PIN ändern** eine eigene setzen.
   Auf Geräten, die das Spiel über den Klassen-Link geöffnet haben, ist «Für Lehrpersonen» ausgeblendet. Dort erreichst du den Editor, indem du an die Adresse `#lehrperson` anhängst, z.B. `https://reneluechinger.github.io/finanzgame2.0/#lehrperson`.
2. Anpassen:
   - **Werte**: umbenennen, Symbol und Farbe ändern, neue Werte hinzufügen oder entfernen. Der Geld-Wert bleibt immer.
   - **Lebensphasen**: Einkommen (pro Lehrjahr oder nach Alter), Grundkosten und Wirkung pro Quartal.
   - **Aktivitäten**: Wirkung, Grundbetrag Geld pro Quartal (darunter steht, was daraus mit 12, 14, 16 … im Spiel wird), Zeitfenster, Altersfenster (ab/bis), Job-Stufe, Seltenheit, Lebensphasen. «Immer anbieten» zeigt sie jedes Quartal. Unter «Erweitert» lassen sich Aktivitäten freischalten (Beispiel: Babysitter-Kurs schaltet ab nächstem Quartal Babysitten frei).
   - **Ereignisse**: Text, bis zu drei Wahlmöglichkeiten, Altersfenster, Meilenstein mit Alter. Eine Wahl kann die Lebensphase wechseln, ein Merkmal setzen, den Lohn ändern oder laufende Kosten auslösen.
   - **Kosten & Fragen**: Kosten nach Alter (z.B. Krankenkasse ab 19), Reflexionsfragen pro Jahr und die Schlussfrage. Steuern unter «Allgemein».
3. **Speichern**, dann **Teilen → Link erzeugen**. Jeder Variantenname hat eine eigene Bestenliste. Für eine weitere Klasse also einfach den Namen ändern (z.B. «Klasse 3sb») und speichern. Bleibt der Name gleich, bleiben Spielstände und Bestenliste erhalten, auch wenn du Aktivitäten änderst.

Hinweis: Änderungen wirken nur auf dem eigenen Gerät, bis du den neuen Link teilst. Der Link enthält die ganze Variante, darum ist er lang. Tipp: als QR-Code oder über die Schulplattform verteilen.

## Datenschutz

- Kein Login, keine Namen, keine E-Mail-Adressen
- Spielstand und Reflexionsantworten bleiben auf dem Gerät. Wird der Browserverlauf gelöscht, sind sie weg
- In die Bestenliste gehen nur Spitzname, Punkte, Datum, Variante, Startalter und Endwerte
- Spielstände von FinanzGame 1 und 2.0 sind getrennt gespeichert, auch wenn beide unter derselben Adresse laufen
- Die PIN schützt den Editor vor Neugier, sie ist kein Sicherheitsmerkmal. PIN vergessen: Auf dem PIN-Bildschirm «PIN vergessen?» tippen, dann gilt wieder 1234. Die Variante bleibt erhalten.

## Für Entwicklerinnen und Entwickler

Reines HTML, CSS und JavaScript (ES-Module), keine Abhängigkeiten, kein Build-Schritt.

```
index.html          Einstieg
css/style.css       Gestaltung (Design «Balance»)
js/config.js        Standard-Variante: Alter, Lebensphasen, Kosten, Steuern, Werte, Fragen
js/content.js       200 Aktivitäten und 200 Ereignisse aus FinanzGame 1, umgebaut (Alter, Quartal); mit den neuen Inhalten 231 Aktivitäten und 239 Ereignisse
js/content_adult.js neue Jobs, seltene Aktivitäten, Meilensteine und Ereignisse für junge Erwachsene
tools/convert_v1.mjs einmaliges Umbau-Skript für die Inhalte aus FinanzGame 1
js/engine.js        Spiellogik ohne Oberfläche
js/app.js           Bildschirme und Bedienung
js/editor.js        Editor für Lehrpersonen
js/charts.js        Fünfeck und Verlaufsdiagramm (SVG)
js/storage.js       localStorage, Link-Codierung, Prüfung von Varianten
js/leaderboard.js   Bestenliste (Apps Script oder lokal)
apps-script/Code.gs Google-Apps-Script für die Bestenliste
tests/              Tests der Spiellogik und Simulation zum Abstimmen
```

Lokal starten: `python3 -m http.server` im Projektordner, dann `http://localhost:8000` öffnen (ES-Module laufen nicht über `file://`).

Tests: `node --test tests/engine.test.mjs tests/storage.test.mjs`
Abstimmung der Zahlen: `node tests/sim.mjs` spielt fünf Strategien je 30-mal durch (Start mit 12 und mit 16).
