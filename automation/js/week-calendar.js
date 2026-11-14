/**
 * Week Calendar – lädt ICS-Kalender und schreibt die Termine der aktuellen Woche
 * (Mo 00:00 – So 24:00) plus WEEKS_BACK/WEEKS_AHEAD Wochen als JSON in das Item WeekCalendar_Json.
 * Wiederkehrende Termine (RRULE) und Ausnahmen (RECURRENCE-ID) werden über ical.js aufgelöst.
 *
 * Anzeige: HABPanel-Widget "Week Calendar" + html/week-calendar/week-calendar.js
 */
// CommonJS-Build direkt laden (GraalJS ignoriert das "exports"-Feld der package.json)
const ICAL = require('ical.js/dist/ical.es5.cjs');

// ---------------------------------------------------------------------------
// Konfiguration: bis zu beliebig viele Kalender. url = ICS-Adresse (https://… oder webcal://…).
// Mit Login (z. B. privater Nextcloud-Kalender): user + passwordFile (oder password) setzen.
// Kalender ohne url werden übersprungen.
// ---------------------------------------------------------------------------
const CALENDARS = [
  // Öffentlicher Nextcloud-Link: Kalender -> Teilen -> Link teilen -> "Abonnement-Link kopieren" + "?export"
  { name: 'Familie', color: '#4fc3f7', url: '' },  // z. B. https://cloud.example.com/remote.php/dav/public-calendars/TOKEN?export
  // Google: Einstellungen -> Kalender -> "Privatadresse im iCal-Format"
  { name: 'Alex',    color: '#81c784', url: '' },
  { name: 'Deli',    color: '#ffb74d', url: '' },
  { name: 'Nina',    color: '#f06292', url: '' },
  // Nextcloud Kontakt-Geburtstage: nicht öffentlich teilbar -> Login mit App-Passwort aus passwordFile
  { name: 'Geburtstage', color: '#ba68c8', url: '',  // https://cloud.example.com/remote.php/dav/calendars/USER/contact_birthdays/?export
    user: 'USER', passwordFile: '/etc/openhab/automation/js/week-calendar.secret' },
];

// Liest ein Passwort aus einer Datei (erste Zeile, ohne Leerzeichen); leer wenn nicht vorhanden
function readSecret(path) {
  const Files = Java.type('java.nio.file.Files');
  const Paths = Java.type('java.nio.file.Paths');
  const p = Paths.get(path);
  if (!Files.exists(p)) return '';
  return ('' + Files.readString(p)).split('\n')[0].trim();
}

const TARGET_ITEM = 'WeekCalendar_Json';
const HTTP_TIMEOUT_MS = 20000;
const MAX_RECURRENCE_STEPS = 5000;
// Wochen, die im Widget per Vor/Zurück erreichbar sind
const WEEKS_BACK = 4;
const WEEKS_AHEAD = 12;
const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function hm(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }

function startOfWeek(now) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = (d.getDay() + 6) % 7; // Mo=0 … So=6
  d.setDate(d.getDate() - dow);
  return d;
}

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function fetchIcs(cal) {
  const url = cal.url.replace(/^webcal:\/\//i, 'https://');
  let body;
  if (cal.user) {
    const password = cal.passwordFile ? readSecret(cal.passwordFile) : (cal.password || '');
    if (!password) throw new Error('kein Passwort (' + (cal.passwordFile || 'password') + ')');
    const HashMap = Java.type('java.util.HashMap');
    const Base64 = Java.type('java.util.Base64');
    const JString = Java.type('java.lang.String');
    const headers = new HashMap();
    const token = Base64.getEncoder().encodeToString(new JString(cal.user + ':' + password).getBytes('UTF-8'));
    headers.put('Authorization', 'Basic ' + token);
    body = actions.HTTP.sendHttpGetRequest(url, headers, HTTP_TIMEOUT_MS);
  } else {
    body = actions.HTTP.sendHttpGetRequest(url, HTTP_TIMEOUT_MS);
  }
  if (!body) throw new Error('leere Antwort');
  return '' + body;
}

// ICAL.Time -> JS Date (ganztägige Termine als lokale Mitternacht)
function toDate(t) {
  if (t.isDate) return new Date(t.year, t.month - 1, t.day);
  return t.toJSDate();
}

function collectEvents(cal, ics, weekStart, weekEnd) {
  const comp = new ICAL.Component(ICAL.parse(ics));
  comp.getAllSubcomponents('vtimezone').forEach(function (vtz) {
    try { ICAL.TimezoneService.register(vtz); } catch (e) { /* bereits registriert */ }
  });

  const vevents = comp.getAllSubcomponents('vevent');
  const masters = {};
  const exceptions = [];
  vevents.forEach(function (ve) {
    const ev = new ICAL.Event(ve);
    if (ev.isRecurrenceException()) exceptions.push(ev);
    else masters[ev.uid] = ev;
  });
  exceptions.forEach(function (ex) {
    const m = masters[ex.uid];
    if (m) m.relateException(ex);
    else masters[ex.uid + '#' + ex.recurrenceId.toString()] = ex; // verwaiste Ausnahme als Einzeltermin
  });

  const out = [];
  function push(ev, start, end) {
    const s = toDate(start);
    let e = end ? toDate(end) : new Date(s.getTime() + (start.isDate ? 86400000 : 0));
    if (e <= s && start.isDate) e = new Date(s.getTime() + 86400000);
    if (s < weekEnd && (e > weekStart || (e.getTime() === s.getTime() && s >= weekStart))) {
      const status = (ev.component.getFirstPropertyValue('status') || '').toUpperCase();
      if (status === 'CANCELLED') return;
      out.push({
        cal: cal.name,
        color: cal.color,
        title: ev.summary || '(ohne Titel)',
        loc: ev.location || '',
        allDay: !!start.isDate,
        start: s,
        end: e,
      });
    }
  }

  Object.keys(masters).forEach(function (k) {
    const ev = masters[k];
    if (!ev.startDate) return;
    if (ev.isRecurring()) {
      const it = ev.iterator();
      let next;
      let steps = 0;
      while ((next = it.next()) && steps++ < MAX_RECURRENCE_STEPS) {
        if (toDate(next) >= weekEnd) break;
        const d = ev.getOccurrenceDetails(next);
        push(d.item, d.startDate, d.endDate);
      }
    } else {
      push(ev, ev.startDate, ev.endDate);
    }
  });
  return out;
}

function updateWeekCalendar() {
  const now = new Date();
  const currentWeekStart = startOfWeek(now);
  const rangeStart = new Date(currentWeekStart);
  rangeStart.setDate(rangeStart.getDate() - 7 * WEEKS_BACK);
  const totalDays = 7 * (WEEKS_BACK + 1 + WEEKS_AHEAD);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + totalDays);

  // alle Tage des Bereichs (Mo der ersten bis So der letzten Woche)
  const days = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + i);
    const dEnd = new Date(d);
    dEnd.setDate(dEnd.getDate() + 1);
    days.push({ date: ymd(d), label: DAY_LABELS[i % 7], day: pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.', events: [], _start: d, _end: dEnd });
  }

  const errors = [];
  const calendars = [];
  CALENDARS.filter(function (c) { return c.url; }).forEach(function (cal) {
    calendars.push({ name: cal.name, color: cal.color });
    try {
      const events = collectEvents(cal, fetchIcs(cal), rangeStart, rangeEnd);
      events.forEach(function (ev) {
        days.forEach(function (day) {
          const dStart = day._start, dEnd = day._end;
          const overlaps = ev.start < dEnd && (ev.end > dStart || (ev.end.getTime() === ev.start.getTime() && ev.start >= dStart));
          if (!overlaps) return;
          let time;
          if (ev.allDay || (ev.start <= dStart && ev.end >= dEnd)) time = 'ganztägig';
          else if (ev.start >= dStart && ev.end <= dEnd) time = hm(ev.start) + (ev.end > ev.start ? ' – ' + hm(ev.end) : '');
          else if (ev.start >= dStart) time = 'ab ' + hm(ev.start);
          else time = 'bis ' + hm(ev.end);
          day.events.push({
            cal: ev.cal, color: ev.color, title: ev.title, loc: ev.loc, time: time,
            allDay: time === 'ganztägig',
            sort: (time === 'ganztägig' || ev.start < dStart) ? 0 : ev.start.getTime(),
          });
        });
      });
    } catch (e) {
      console.warn('Kalender "' + cal.name + '" konnte nicht geladen werden: ' + e);
      errors.push(cal.name);
    }
  });

  days.forEach(function (day) {
    day.events.sort(function (a, b) { return a.sort - b.sort || a.title.localeCompare(b.title); });
    day.events.forEach(function (e) { delete e.sort; });
    delete day._start;
    delete day._end;
  });

  // in Wochen aufteilen; offset 0 = aktuelle Woche
  const weeks = [];
  for (let w = 0; w * 7 < days.length; w++) {
    const wd = days.slice(w * 7, w * 7 + 7);
    const monday = new Date(rangeStart);
    monday.setDate(monday.getDate() + w * 7);
    weeks.push({ offset: w - WEEKS_BACK, week: isoWeek(monday), from: wd[0].day, to: wd[6].day, days: wd });
  }

  const result = {
    updated: hm(now),
    current: WEEKS_BACK, // Index der aktuellen Woche in weeks[]
    calendars: calendars,
    errors: errors,
    weeks: weeks,
    // aktuelle Woche zusätzlich im alten Format (für ältere/gecachte Widget-Versionen)
    week: weeks[WEEKS_BACK].week,
    from: weeks[WEEKS_BACK].from,
    to: weeks[WEEKS_BACK].to,
    days: weeks[WEEKS_BACK].days,
  };
  items.getItem(TARGET_ITEM).postUpdate(JSON.stringify(result));
  console.info('Wochenkalender KW ' + isoWeek(currentWeekStart) + ' aktualisiert (' + weeks.length + ' Wochen, ' + calendars.length + ' Kalender, ' + errors.length + ' Fehler)');
}

rules.JSRule({
  name: 'Week Calendar aktualisieren',
  description: 'Lädt die ICS-Kalender und schreibt die aktuelle Woche nach ' + TARGET_ITEM,
  id: 'week-calendar-update',
  triggers: [
    triggers.GenericCronTrigger('0 0/15 * * * ?'),
    triggers.GenericCronTrigger('5 0 0 * * ?'),
    triggers.ItemCommandTrigger('WeekCalendar_Refresh', 'ON'),
    triggers.SystemStartlevelTrigger(100),
  ],
  execute: function () {
    const refresh = items.getItem('WeekCalendar_Refresh', true);
    if (refresh) refresh.postUpdate('ON'); // Rückmeldung im UI: lädt gerade
    try {
      updateWeekCalendar();
    } catch (e) {
      console.error('Week Calendar Fehler: ' + e);
    } finally {
      if (refresh) refresh.postUpdate('OFF');
    }
  },
});
