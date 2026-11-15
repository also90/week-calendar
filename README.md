# week-calendar

A HABPanel widget for openHAB that shows the events of the current week (Mon–Sun) from several ICS calendars: Nextcloud, Google or any other iCal URL. Tested with openHAB 5.2.

- 7 columns with calendar week and legend, today is highlighted
- ‹ Today › buttons to browse weeks: 4 weeks back and 12 ahead by default (`WEEKS_BACK` / `WEEKS_AHEAD` in the rule)
- one color bar per calendar, plus time, title and location
- recurring events (RRULE) and moved single occurrences (RECURRENCE-ID)
- all-day and multi-day events
- Nextcloud contact birthdays via login with an app password

The widget labels and log messages are in German (e.g. „Heute“, „ganztägig“, „KW“).

## How it works

```
ICS calendars ──► JS rule (automation/js/week-calendar.js, ical.js)
                        │  every 15 min, after midnight, on startup, via refresh item
                        ▼
                  String item WeekCalendar_Json   (all weeks as JSON)
                        ▼
                  HABPanel widget (widget/week-calendar.json loads html/week-calendar/*.js + *.html)
```

The old version needed 4 items per day and calendar; now there is a single item. The rule fetches the calendars, expands recurrences and writes all weeks of the range into the item. The widget only displays them and switches weeks directly in the browser, without reloading.

## Requirements

- openHAB with the **JavaScript Scripting** (`jsscripting`) and **HABPanel** add-ons
- `npm` on the openHAB host to install `ical.js`

## Installation

The paths below are for an apt/package installation (`/etc/openhab`). For Docker or manual installations use `conf/…` instead.

1. **Install ical.js**
   ```bash
   cd /etc/openhab/automation/js
   npm install ical.js@2
   ```

2. **Copy the files**
   ```bash
   cp items/week-calendar.items              /etc/openhab/items/
   cp automation/js/week-calendar.js         /etc/openhab/automation/js/
   mkdir -p /etc/openhab/html/week-calendar
   cp html/week-calendar/week-calendar.*     /etc/openhab/html/week-calendar/
   ```

3. **Add your calendars** to the `CALENDARS` array at the top of `automation/js/week-calendar.js`, each with `name`, `color` and `url`. Calendars without a `url` are skipped.

   | Source | URL |
   |---|---|
   | Nextcloud (shared publicly) | Calendar → Share → Share link → “Copy subscription link”, which gives `https://<cloud>/remote.php/dav/public-calendars/<token>?export` |
   | Nextcloud (private, e.g. contact birthdays) | `https://<cloud>/remote.php/dav/calendars/<user>/contact_birthdays/?export` with `user` and `passwordFile` |
   | Google | Calendar settings → “Secret address in iCal format” |
   | `webcal://…` | converted to `https://…` automatically |

   **Login:** In Nextcloud, create an app password under Personal settings → Security and write it to the file set in `passwordFile`:
   ```bash
   echo 'APP-PASSWORD' > /etc/openhab/automation/js/week-calendar.secret
   chmod 640 /etc/openhab/automation/js/week-calendar.secret
   ```
   Set `user` to your Nextcloud **login name**. Upper and lower case matter; otherwise Nextcloud rejects the login with a 401.

4. **Import the widget:** HABPanel → Settings → Widgets → “Import from file” → `widget/week-calendar.json`. Then add it to a dashboard, ideally at full width.
   The widget itself is only a small loader. Layout and logic live in `html/week-calendar/` and are loaded bypassing the browser cache, so changes there show up after a page reload, without importing again.

5. **Test:** Switch `WeekCalendar_Refresh` to ON. The switch stays on while loading and turns OFF by itself when done. `openhab.log` then shows
   `Wochenkalender KW 46 aktualisiert (17 Wochen, 5 Kalender, 0 Fehler)`.
   If a calendar cannot be loaded, the log shows a warning and the widget shows „Fehler: <name>“ at the top.

## Widget settings

| Setting | Default |
|---|---|
| JSON item | `WeekCalendar_Json` |
| Accent color (today/title) | `#4fc3f7` |
| Font size (px) | 14 |
| Show location | on |
| Show legend | on |

## Format of WeekCalendar_Json

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

`current` is the index of the current week in `weeks`; `offset` is the distance to the current week. For older widget versions, the JSON also contains the current week at the top level (`week`, `from`, `to`, `days`).

**Tip:** If your persistence stores all items (e.g. InfluxDB with `*`), exclude `WeekCalendar_Json`. Otherwise every run writes about 15 KB of JSON to the database.

The item can also be used in other UIs such as the Main UI.

## Credits

Inspired by the [calendar-five-events](https://github.com/davorf/calendar-five-events) widget by davorf.
