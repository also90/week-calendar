# week-calendar

Ein HABPanel-Widget für openHAB, das die Termine der aktuellen Woche (Mo–So) aus mehreren ICS-Kalendern anzeigt: Nextcloud, Google oder jede andere iCal-Adresse. Getestet mit openHAB 5.2.

- 7 Spalten mit Kalenderwoche und Legende, der heutige Tag ist hervorgehoben
- Buttons ‹ Heute › zum Blättern: standardmäßig 4 Wochen zurück und 12 voraus (`WEEKS_BACK` / `WEEKS_AHEAD` in der Regel)
- ein Farbbalken je Kalender, Uhrzeit, Titel und Ort
- wiederkehrende Termine (RRULE) und verschobene Einzeltermine (RECURRENCE-ID)
- ganztägige und mehrtägige Termine
- Nextcloud-Kontaktgeburtstage per Login mit App-Passwort

## Funktionsweise

```
ICS-Kalender ──► JS-Regel (automation/js/week-calendar.js, ical.js)
                       │  alle 15 min, nach Mitternacht, beim Start, per Refresh-Item
                       ▼
                 String-Item WeekCalendar_Json   (alle Wochen als JSON)
                       ▼
                 HABPanel-Widget (widget/week-calendar.json lädt html/week-calendar/*.js + *.html)
```

Statt wie früher 4 Items pro Tag und Kalender gibt es nur noch ein Item. Die Regel holt die Kalender, löst die Wiederholungen auf und schreibt alle Wochen des Bereichs hinein. Das Widget zeigt sie nur noch an und blättert direkt im Browser, ohne neu zu laden.

## Voraussetzungen

- openHAB mit den Add-ons **JavaScript Scripting** (`jsscripting`) und **HABPanel**
- `npm` auf dem openHAB-Host, um `ical.js` zu installieren

## Installation

Die Pfade gelten für eine apt-/Paket-Installation (`/etc/openhab`). Bei Docker oder manuellen Installationen ist es entsprechend `conf/…`.

1. **ical.js installieren**
   ```bash
   cd /etc/openhab/automation/js
   npm install ical.js@2
   ```

2. **Dateien kopieren**
   ```bash
   cp items/week-calendar.items              /etc/openhab/items/
   cp automation/js/week-calendar.js         /etc/openhab/automation/js/
   mkdir -p /etc/openhab/html/week-calendar
   cp html/week-calendar/week-calendar.*     /etc/openhab/html/week-calendar/
   ```

3. **Kalender eintragen:** im `CALENDARS`-Array oben in `automation/js/week-calendar.js`, mit `name`, `color` und `url`. Kalender ohne `url` werden übersprungen.

   | Quelle | URL |
   |---|---|
   | Nextcloud (öffentlich geteilt) | Kalender → Teilen → Link teilen → „Abonnement-Link kopieren“, ergibt `https://<cloud>/remote.php/dav/public-calendars/<token>?export` |
   | Nextcloud (privat, z. B. Kontaktgeburtstage) | `https://<cloud>/remote.php/dav/calendars/<user>/contact_birthdays/?export` mit `user` und `passwordFile` |
   | Google | Kalendereinstellungen → „Privatadresse im iCal-Format“ |
   | `webcal://…` | wird automatisch zu `https://…` |

   **Login:** Lege in Nextcloud unter Persönliche Einstellungen → Sicherheit ein App-Passwort an und schreibe es in die Datei aus `passwordFile`:
   ```bash
   echo 'APP-PASSWORT' > /etc/openhab/automation/js/week-calendar.secret
   chmod 640 /etc/openhab/automation/js/week-calendar.secret
   ```
   Als `user` trägst du den Nextcloud-**Login-Namen** ein. Achte auf Groß- und Kleinschreibung, sonst lehnt Nextcloud die Anmeldung mit 401 ab.

4. **Widget importieren:** HABPanel → Einstellungen → Widgets → „Import from file“ → `widget/week-calendar.json`. Danach legst du es auf einem Dashboard an, am besten in voller Breite.
   Das Widget selbst ist nur ein kleiner Lader. Aussehen und Logik liegen in `html/week-calendar/` und werden ohne Browser-Cache geladen. Änderungen dort sind nach einem Neuladen der Seite sichtbar, ohne erneuten Import.

5. **Testen:** `WeekCalendar_Refresh` auf ON schalten. Der Schalter bleibt an, solange geladen wird, und geht danach von selbst auf OFF. Im `openhab.log` erscheint dann
   `Wochenkalender KW 46 aktualisiert (17 Wochen, 5 Kalender, 0 Fehler)`.
   Kann ein Kalender nicht geladen werden, steht eine Warnung im Log und das Widget zeigt oben „Fehler: <Name>“.

## Widget-Einstellungen

| Einstellung | Standard |
|---|---|
| JSON-Item | `WeekCalendar_Json` |
| Akzentfarbe (heute/Titel) | `#4fc3f7` |
| Schriftgröße (px) | 14 |
| Ort anzeigen | an |
| Legende anzeigen | an |

## Format von WeekCalendar_Json

```json
{
  "updated": "08:15",
  "current": 4,
  "calendars": [{ "name": "Familie", "color": "#4fc3f7" }],
  "errors": [],
  "weeks": [
    { "offset": 0, "week": 48, "from": "23.11.", "to": "29.11.",
      "days": [
        { "date": "2026-11-24", "label": "Di", "day": "24.11.",
          "events": [{ "cal": "Familie", "color": "#4fc3f7", "title": "Papiertonne",
                       "loc": "", "time": "ganztägig", "allDay": true }] }
      ] }
  ]
}
```

`current` ist der Index der aktuellen Woche in `weeks`, `offset` gibt den Abstand zur aktuellen Woche an.

**Tipp:** Wenn deine Persistenz alle Items speichert (z. B. InfluxDB mit `*`), schließe `WeekCalendar_Json` aus. Sonst landet bei jedem Lauf ein JSON von etwa 15 KB in der Datenbank.

Das Item lässt sich auch in anderen Oberflächen wie der Main UI verwenden.

## Danksagung

Inspiriert vom Widget [calendar-five-events](https://github.com/davorf/calendar-five-events) von davorf.
