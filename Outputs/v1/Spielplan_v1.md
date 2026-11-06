# Finanzgame «Wertstifter» – Spielplan v1

Arbeitstitel, Name noch offen.

## Zielgruppe und Setting
- Lernende der 3. Oberstufe (ca. 14–15 Jahre), jede Person spielt für sich
- Schul-iPads, Querformat, Touch (grosse Knöpfe, kein Drag & Drop), läuft auch am Laptop
- Kein Login, nur Spitzname

## Lernziel
Geld ist oft die Folge von Nutzen, den man für andere schafft. Wer nur auf einen Wert setzt, verliert das Gleichgewicht.

## Werte (Standard, alle 0–100)
1. **Geld** (Kontostand in Fr. sichtbar, wird für die Punkte auf 0–100 umgerechnet)
2. **Zufriedenheit**
3. **Wertstiftung** (Nutzen für andere, bezahlt oder unbezahlt)
4. **Energie** (Gegenspieler zu Arbeit und Stress)
5. **Beziehungen** (Familie, Freunde)

Werte lassen sich im Lehrpersonen-Editor umbenennen, ergänzen, entfernen.

## Ablauf
- **1 Monat = 4 Wochen = 28 Tage**
- Werktag: Schule fix, 2 Zeitfenster (Nachmittag, Abend)
- Wochenende: 3 Zeitfenster (Morgen, Nachmittag, Abend)
- Pro Zeitfenster eine Aktivität wählen
- Etwa jeden zweiten Tag ein **Zufallsereignis mit 2 Optionen** (z.B. Handy-Display kaputt, Nachbarin fragt nach Hundehüten)
- Nach jeder Woche: **Wochenrückblick** (Verlauf der Werte + 1 Reflexionsfrage), danach weiterspielen oder **zwischenspeichern und beenden**

## Geld-Mechaniken
- Taschengeld jeden Montag
- Laufende Kosten (z.B. Handy-Abo)
- Sparkonto mit kleinem Zins pro Woche
- Investitionen mit Verzögerung (z.B. Kurs → ab nächster Woche besser bezahlte Nebenjobs)

## Beispiel-Aktivitäten (Entwurf)
| Aktivität | Geld | Zufriedenheit | Wertstiftung | Energie | Beziehungen |
|---|---|---|---|---|---|
| Zeitungen austragen | ++ | − | + | − | 0 |
| Nachhilfe geben (bezahlt) | + | + | ++ | − | + |
| Freiwillig im Tierheim | 0 | + | ++ | − | + |
| Freunde treffen | − | ++ | 0 | 0 | ++ |
| Sport | 0 | + | 0 | + | + |
| Gamen / Social Media | 0 | + | − | − | − |
| Der Familie helfen | 0 | 0 | + | − | ++ |
| Shoppen | −− | ++ | 0 | 0 | 0 |
| Ausruhen | 0 | + | 0 | ++ | 0 |
| Kurs besuchen (Investition) | − | 0 | + (später Geld) | − | 0 |

## Punkte
**Punkte = Durchschnitt aller Werte − 0,5 × (höchster Wert − tiefster Wert)**
Fällt ein Wert auf 0: Warnung und Malus, kein Game Over. Formel wird im Spiel erklärt.

## Monatsauswertung
Verlauf aller Werte, wichtigste Entscheidungen, Reflexionsantworten. Speicher- und druckbar (PDF/Bild).

## Speicherung
- Spielstand, Reflexionen und Durchgänge lokal im Browser (localStorage)
- Hinweis: Wird der Browserverlauf gelöscht, ist der Spielstand weg

## Bestenliste
- Online: Google Sheet + Apps Script (Web-App). Gespeichert werden nur Spitzname, Punkte, Datum, Variante
- Offline oder ohne Script: lokale Bestenliste auf dem Gerät
- Lehrperson kann Einträge im Sheet löschen (unpassende Spitznamen)

## Lehrpersonen-Editor
- Zugang mit PIN
- Werte, Aktivitäten, Ereignisse, Taschengeld anpassen
- Erzeugt einen **teilbaren Link** mit der eigenen Variante; Bestenliste getrennt pro Variante

## Hosting
GitHub Pages aus dem Repo `reneluechinger/finanzgame` (Repo öffentlich, keine Schülerdaten im Code)

## Technik
Reines HTML/CSS/JavaScript, keine Abhängigkeiten, kein Build-Schritt.

## Reihenfolge der Umsetzung
1. **Stopp: Plan freigeben** (dieses Dokument)
2. 4 Design-Entwürfe des Spielbildschirms, du wählst einen
3. Spielkern: Tage, Zeitfenster, Aktivitäten, Werte, Punkte, Speichern
4. Ereignisse, Geld-Mechaniken, Wochenrückblick, Monatsauswertung
5. Bestenliste (lokal + Google Sheet) mit Anleitung für Apps Script
6. Lehrpersonen-Editor mit Link
7. Prüfung durch separaten Agenten gegen diesen Plan, Test auf iPad-Grösse
8. GitHub Pages einrichten (Anleitung)
