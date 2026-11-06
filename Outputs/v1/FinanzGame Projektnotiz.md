---
typ: plan
erstellt: 2026-10-27
aktualisiert: 2026-10-27
quelle: claude
status: fertig
tags:
 - finanzgame
 - unterricht
 - wertstiftung
---

# FinanzGame

Browserspiel für die 3. Oberstufe. Lernende spielen 28 Tage und halten Geld, Zufriedenheit, Wertstiftung, Energie und Beziehungen im Gleichgewicht.

## Stand
- Spielbar, Design D «Balance» (Fünfeck mit Vorschau)
- Code im GitHub-Repo `reneluechinger/finanzgame`, Branch `claude/amazing-dijkstra-7i6n8j`
- Ein separater Prüfagent hat das Spiel getestet, alle 10 Befunde sind behoben

## Entscheidungen aus dem Interview
- Einzelspiel auf Schul-iPads, Spitzname statt Login
- 1 Monat, Speichern nach jeder Woche
- Werktag 2 Zeitfenster, Wochenende 3, Schule fix
- Ereignis etwa jeden zweiten Tag, mit Entscheidung
- Taschengeld, laufende Kosten, Sparkonto mit Zins, verzögerte Effekte (Babysitter-Kurs)
- Punkte = Durchschnitt − halber Abstand höchster/tiefster Wert, Malus bei 0
- Wochenrückblick mit Reflexionsfrage, druckbare Monatsauswertung
- Bestenliste über Google Sheet und Apps Script, sonst lokal
- Editor mit PIN, Varianten als Link teilbar

## Offene Schritte
1. Branch nach `main` übernehmen, Repo öffentlich stellen, GitHub Pages einschalten
2. Google Sheet mit Apps Script anlegen, URL im Editor eintragen
3. Eigene PIN setzen, Link für die Klasse erzeugen
4. Testlauf mit einer Klasse, Rückmeldungen sammeln

Anleitung: README.md im Repo.
