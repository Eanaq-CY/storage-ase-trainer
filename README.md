# Storage ASE Trainer

Unabhängige Lernplattform zur Vorbereitung auf die HPE-Storage-ASE-Prüfungen:

- **HPE0-J82 – HPE Storage Architect** (HPE ASE – Storage Architect)
- **HPE0-J83 – HPE Storage Integrator Solutions** (HPE ASE – Storage Integrator Solutions)
- optional **HPE0-J81 – HPE Storage Fundamentals** (ATP, Vorstufe)

## Lernmethoden

| Modus | Inhalt |
|---|---|
| Lernkapitel | 22 Kapitel entlang der offiziellen Prüfungsziele, mit sinngemäß zusammengefassten HPE-Aussagen und Quellenlinks |
| Karteikarten | Leitner-System mit 5 Fächern, Themenauswahl, Tastatursteuerung |
| Quiz | über 400 Fragen (Einfach-/Mehrfachauswahl, Zuordnungen, Rechenaufgaben) mit Erklärung und Quelle |
| Prüfungsfokus | Detailthemen mit hoher Prüfungsrelevanz (DSCC-Services, B10000-Hardwareregeln, StoreOnce, Zerto, VM Essentials …) |
| Zuordnen | Klick-Spiel für Begriffe und Definitionen |
| Lückentext | Merksätze zum Ergänzen, optional mit Wortbank |
| Fallstudien | Kundenszenarien für Bewertung, Sizing und Validierung |
| Sizing-Rechner | RAID-/Kapazitäts-, IOPS-, Wachstums-, Snapshot-, Replikations- und Verfügbarkeitsrechner sowie Übungsaufgaben |
| Prüfungsmodus | Realistische Simulation (Fragenzahl, Zeit, Bestehensgrenze, Gewichtung nach Prüfungsbereichen) mit Auswertung |
| Fehlertraining, Glossar, Spickzettel, Fortschritt | Wiederholung, Begriffe DE/EN, Kompaktübersicht zum Drucken, Statistik mit Export/Import |

Der Lernfortschritt wird ausschließlich lokal im Browser gespeichert (localStorage).

## Lokal starten

Die Seite ist rein statisch (HTML, CSS, JavaScript ohne Abhängigkeiten):

```bash
python -m http.server 8000
```

Danach `http://localhost:8000` öffnen.

## Quellen

Die Inhalte basieren auf öffentlich verfügbaren HPE-Dokumenten, u. a. den Exam Preparation Guides HPE0-J81/J82/J83, den QuickSpecs zu HPE Alletra Storage MP B10000, HPE MSA Gen7 und HPE StoreOnce, dem B10000-Architektur-Whitepaper, der B10000-CLI-Referenz, der Data-Ops-Manager-Dokumentation sowie HPE-Pressemitteilungen (Stand November 2026). Eine Liste mit Links findet sich auf der Seite unter „Prüfungsinfos & Quellen“.

## Hinweis

Dies ist eine **unabhängige Lernhilfe**. Sie wurde nicht von Hewlett Packard Enterprise erstellt, geprüft oder autorisiert. Alle Fragen sind eigene Formulierungen auf Basis öffentlicher Dokumentation und **keine** Originalfragen aus der Prüfung. HPE, Alletra, StoreOnce, StoreEver, InfoSight, GreenLake, Zerto und weitere Namen sind Marken der jeweiligen Inhaber. Maßgeblich sind stets die aktuellen offiziellen HPE-Dokumente.
