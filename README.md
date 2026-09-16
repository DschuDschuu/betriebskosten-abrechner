# Betriebskosten-Abrechner

Betriebskosten eines Mehrfamilienhauses einmal erfassen, nach Umlageschlüssel
automatisch auf die Wohnungen verteilen und für jeden Mieter ein druckfertiges
Abrechnungsblatt ausgeben.

**Live:** https://dschudschuu.github.io/betriebskosten-abrechner/

Eine einzelne HTML-Datei ohne Server und ohne Abhängigkeiten. Alles rechnet im
Browser; es wird nichts hochgeladen.

---

## Bedienung

Die Eingabe läuft in fünf aufklappbaren Schritten. Es ist immer nur einer
offen; beim Öffnen des nächsten klappt der vorige zu und zeigt in der Kopfzeile
eine Kurzfassung.

| Schritt | Inhalt |
|---|---|
| 1 Objekt & Abrechnungszeitraum | Zeitraum, Anschrift, Vermieter, Zahlungshinweis |
| 2 Einheiten im Haus | alle Wohnungen mit Fläche, Personen, Einheitenzahl |
| 3 Kostenpositionen | Gesamtkosten des Hauses je Position und Umlageschlüssel |
| 4 Mieter & Vorauszahlungen | Daten der gerade gewählten Wohnung |
| 5 Verteilungsübersicht | Kontrollblatt: wer trägt welchen Anteil |

Zwischen den Wohnungen wird über die Leiste unter der Kopfzeile gewechselt.
Dort steht bei jeder Wohnung gleich ihr Ergebnis, alle Salden sind also ohne
Umschalten sichtbar.

**Drucken:** Reiter *Abrechnungsblatt* → *Diese Wohnung drucken* oder
*Alle Blätter drucken* (alle Mieter hintereinander mit Seitenumbruch, ein PDF
für den ganzen Jahrgang). Im Druckdialog als Ziel „Als PDF speichern“ bzw. auf
dem iPad im Teilen-Menü „Drucken“ wählen.

### Auf dem iPad

Seite in Safari öffnen → Teilen → *Zum Home-Bildschirm*. Danach startet sie wie
eine App im eigenen Fenster und funktioniert auch ohne Netz.

---

## Umlageschlüssel

| Schlüssel | Verteilung nach | Zeitanteil |
|---|---|---|
| Wohnfläche | m² der Wohnung an der Gesamtfläche | ja |
| Personenzahl | gemeldete Personen | ja |
| Wohneinheiten | Einheiten je Wohnung | ja |
| Verbrauch | gemessene Menge je Wohnung (Zähler) | nein |
| Direktzuordnung | Betrag wird der Wohnung unverändert zugeschrieben | nein |

Der **Zeitanteil** greift, wenn eine Wohnung nur einen Teil des Zeitraums
bewohnt war: Anteil × Nutzungstage ÷ Tage im Abrechnungszeitraum. Auf Verbrauch
wirkt er nicht, weil ein Zähler den Zeitraum bereits abbildet.

### Belegzeilen

Jede Position lässt sich über *Belege aufschlüsseln* in Einzelposten zerlegen –
Bezeichnung, Zeitraum, Menge, Einheit, Preis je Einheit. Sind Menge und Preis
gefüllt, rechnet sich der Betrag, sonst wird er direkt eingetragen.

- Heizung: `Heizöllieferung 18.02. · 3.200 l × 0,98 €`
- Müll: `Restmülltonne 312 €`, `Biotonne 186 €`, `Papiertonne 122 €`
- Grundsteuer: `versiegelte Fläche 210 m² × 2,10 €`

Sobald Belegzeilen vorhanden sind, **werden die Gesamtkosten daraus gebildet** –
das Eingabefeld weicht der berechneten Summe, damit beides nicht auseinander
laufen kann. Die Aufschlüsselung erscheint eingerückt im Abrechnungsblatt;
abschaltbar über den Haken in Schritt 1. Umgelegt wird immer die Position als
Ganzes nach ihrem Umlageschlüssel, nicht die einzelne Belegzeile.

---

## Was das Programm bewusst nicht prüft

**Umlagefähigkeit.** Ob eine Position überhaupt auf den Mieter umgelegt werden
darf, entscheidet die eintragende Person. Verwaltungskosten, Instandhaltung und
Reparaturen gehören nach § 1 Abs. 2 BetrKV nicht in die Abrechnung.

**Leerstand.** Eine Einheit kann als *nicht abrechnen* markiert werden. Sie
zählt weiter in die Umlageschlüssel hinein, bekommt aber kein Blatt; ihr Anteil
steht in der Verteilungsübersicht als **Vermieteranteil**. Das ist der Punkt,
an dem solche Abrechnungen sonst falsch werden: Ließe man die leere Wohnung
einfach weg, zahlten die übrigen Mieter deren Anteil mit.

Das Blatt weist die Einwendungsfrist nach § 556 Abs. 3 Satz 5 BGB aus.
Rechtsberatung ist das Programm nicht.

---

## Daten

Alles bleibt auf dem Gerät. Eingaben werden laufend im `localStorage` des
Browsers gesichert, benannte Abrechnungen ebenso.

**Das ist keine Sicherung.** iOS/Safari räumt den Speicher von Websites auf,
die längere Zeit nicht geöffnet wurden – als App auf dem Home-Bildschirm ist
das entschärft, aber nicht ausgeschlossen. Ein geleerter Browser-Cache löscht
die Daten ebenfalls.

Der verlässliche Weg ist **Als Datei sichern**: Das legt die ganze Abrechnung
als `.json` ab (iPad: in „Dateien“). **Datei laden** holt sie zurück – auch auf
einem anderen Gerät. Am Ende einer Abrechnung einmal exportieren.

Exporte enthalten Namen und Anschriften von Mietern. `.gitignore` hält `*.json`
deshalb aus dem Repository heraus; das bitte nicht aufweichen.

---

## Deployment

GitHub Pages aus `main` / root. Änderungen gehen per `git push` live, Pages
baut ein bis zwei Minuten.

Der Service Worker arbeitet **network-first**: online kommt immer die aktuelle
Fassung, offline die zuletzt gespeicherte. Werden Dateien aus der `FILES`-Liste
in `sw.js` geändert oder hinzugefügt, dort `CACHE` hochzählen (aktuell `v1`).

Rollback: `git revert HEAD && git push`.

### Warum `cache: "reload"` im Service Worker

GitHub Pages liefert alles mit `Cache-Control: max-age=600`. Ein normaler
`fetch()` im Service Worker wird deshalb bis zu zehn Minuten aus dem HTTP-Cache
des Browsers bedient – Updates kämen verspätet an, obwohl die Strategie
network-first ist. Der Request wird darum frisch aus der URL gebaut. Beim
Ändern des `fetch`-Handlers daran denken.

---

## Technik

Eine Datei, `index.html`, ohne Build-Schritt. Schriften kommen von Google
Fonts; ohne Netz fällt die Seite auf Systemschriften zurück und bleibt voll
bedienbar.

**Rundung.** Kostenanteile werden je Position centgenau verteilt: abrunden,
dann die Restcents an die Einheiten mit dem größten Nachkommaanteil. Sonst
ergäbe die Summe der gerundeten Einzelanteile nicht wieder die Gesamtkosten und
im Blatt stünde eine Differenz von ein bis zwei Cent. Die Stelle ist
`distribute()`.

**Migration.** `migrate()` überführt Dateien aus der früheren Ein-Wohnungs-
Fassung: Die damalige Wohnung wird Einheit 1, aus der Differenz zur damaligen
Gesamtfläche entsteht eine Einheit „Übrige Einheiten“ (nicht abrechnen), damit
die Beträge exakt gleich bleiben.

**PDF-Belege** (`assets`, `sample`) funktionieren nur in der Claude-Artifact-
Fassung, nicht hier auf GitHub Pages – dort fehlen Ablage und Auswertung. Die
Knöpfe erscheinen deshalb gar nicht erst. Gescannte PDFs ohne Textebene lassen
sich ohnehin nicht auslesen.

**Riskanteste Stelle:** `distribute()` – sie entscheidet über jeden Euro auf
jedem Mieterblatt. Gegenprobe ist immer Schritt 5: Die Spaltensumme muss den
Gesamtkosten entsprechen, und was nicht auf Mieter entfällt, muss sich durch
Leerstand oder Teilzeiträume erklären lassen.

Vor jedem Push gilt das Verständnis-Quiz aus der Team-Policy.
