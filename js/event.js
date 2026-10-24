/**
 * event.js — kartu acara, hitung mundur, dan simpan ke kalender (Google + .ics)
 */
(function (global) {
  "use strict";

  const U = (global.Undangan = global.Undangan || {});

  /* ---------- Format tanggal (Indonesia, zona waktu dari config) ---------- */
  function makeFormatter(options, timeZone) {
    try {
      return new Intl.DateTimeFormat("id-ID", Object.assign({}, options, { timeZone }));
    } catch (_) {
      return new Intl.DateTimeFormat("id-ID", options); // zona waktu tidak valid → pakai zona perangkat
    }
  }

  U.formatLongDate = function (date, timeZone) {
    return makeFormatter({ weekday: "long", day: "numeric", month: "long", year: "numeric" }, timeZone).format(date);
  };

  /* ---------- Kalender ---------- */
  const toUtcStamp = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const icsEscape = (text) =>
    String(text || "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");

  // RFC 5545: baris maksimal ±75 oktet → lipat dengan CRLF + spasi
  function icsFold(line) {
    const parts = [];
    let rest = line;
    while (rest.length > 70) {
      parts.push(rest.slice(0, 70));
      rest = " " + rest.slice(70);
    }
    parts.push(rest);
    return parts.join("\r\n");
  }

  function buildIcs(ev, description) {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Undangan Pernikahan//ID",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${ev.id}-${toUtcStamp(ev.start)}@undangan-pernikahan`,
      `DTSTAMP:${toUtcStamp(new Date())}`,
      `DTSTART:${toUtcStamp(ev.start)}`,
      `DTEND:${toUtcStamp(ev.end)}`,
      `SUMMARY:${icsEscape(ev.title)}`,
      `LOCATION:${icsEscape(ev.location)}`,
      `DESCRIPTION:${icsEscape(description)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    return lines.map(icsFold).join("\r\n") + "\r\n";
  }

  function googleCalendarUrl(ev, description) {
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: ev.title,
      dates: `${toUtcStamp(ev.start)}/${toUtcStamp(ev.end)}`,
      details: description,
      location: ev.location,
    });
    return "https://calendar.google.com/calendar/render?" + params.toString();
  }

  function downloadText(filename, text, mime) {
    const url = URL.createObjectURL(new Blob([text], { type: mime }));
    const a = U.h("a", { href: url, download: filename });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  U.calendar = { buildIcs, googleCalendarUrl };

  /* ---------- Normalisasi data acara ---------- */
  function normalise(raw) {
    const start = new Date(raw.start);
    if (isNaN(start)) return { valid: false, raw };
    let end = new Date(raw.end);
    if (isNaN(end) || end <= start) end = new Date(start.getTime() + 2 * 3600 * 1000);
    const venue = String(raw.venue || "").trim();
    const address = String(raw.address || "").trim();
    const mapsUrl = /^https?:\/\//i.test(raw.mapsUrl || "")
      ? raw.mapsUrl
      : "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent([venue, address].filter(Boolean).join(", "));
    return {
      valid: true,
      id: String(raw.id || "acara").replace(/[^\w-]/g, ""),
      title: String(raw.title || "Acara"),
      start,
      end,
      venue,
      address,
      location: [venue, address].filter(Boolean).join(", "),
      mapsUrl,
    };
  }

  /* ---------- Hitung mundur ---------- */
  function initCountdown(start, end) {
    const root = U.$("#countdown");
    if (!root) return;
    const state = U.$("#countdown-state");
    const cells = U.$$(".countdown__cell", root);
    const num = {};
    U.$$("[data-unit]", root).forEach((n) => (num[n.dataset.unit] = n));
    const pad = (n) => String(n).padStart(2, "0");

    const render = () => {
      const now = Date.now();
      const diff = start.getTime() - now;
      if (diff <= 0) {
        cells.forEach((c) => (c.hidden = true));
        state.hidden = false;
        state.textContent = now < end.getTime() ? "Acara sedang berlangsung" : "Terima kasih atas doa dan kehadiran Anda";
        return false;
      }
      const total = Math.floor(diff / 1000);
      num.days.textContent = pad(Math.floor(total / 86400));
      num.hours.textContent = pad(Math.floor((total % 86400) / 3600));
      num.minutes.textContent = pad(Math.floor((total % 3600) / 60));
      num.seconds.textContent = pad(total % 60);
      return true;
    };

    if (render()) {
      const timer = setInterval(() => {
        if (!render()) clearInterval(timer);
      }, 1000);
    }
  }

  /* ---------- Render ---------- */
  U.initEvents = function (cfg) {
    const list = U.$("#event-list");
    if (!list) return;
    const tz = cfg.timeZone || "Asia/Jakarta";
    const tzLabel = cfg.timeZoneLabel || "WIB";
    const fmt = {
      day: makeFormatter({ day: "2-digit" }, tz),
      month: makeFormatter({ month: "short" }, tz),
      time: makeFormatter({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }, tz),
    };
    const couple = cfg.couple || {};
    const names = [couple.groom && couple.groom.nick, couple.bride && couple.bride.nick].filter(Boolean).join(" & ");

    const events = (cfg.events || []).map(normalise);
    const valid = events.filter((e) => e.valid);

    if (!events.length) {
      list.append(U.h("p", { class: "event-empty glass reveal", text: "Jadwal acara akan segera diumumkan." }));
    }

    events.forEach((ev, index) => {
      if (!ev.valid) {
        console.warn("[undangan] Tanggal acara tidak valid, dilewati:", ev.raw);
        return;
      }
      const description = `Undangan pernikahan ${names}. ${ev.location}`.trim();
      const titleId = `event-title-${index}`;

      const actions = U.h(
        "div",
        { class: "event__actions" },
        U.h("a", { class: "btn btn--sm", href: ev.mapsUrl, target: "_blank", rel: "noopener noreferrer" }, U.icon("pin"), "Buka Peta"),
        U.h(
          "a",
          {
            class: "btn btn--quiet",
            href: googleCalendarUrl(ev, description),
            target: "_blank",
            rel: "noopener noreferrer",
            "aria-label": `Simpan ${ev.title} ke Google Kalender (tab baru)`,
          },
          U.icon("calendar"),
          "Google Kalender"
        )
      );
      const icsBtn = U.h("button", { class: "btn btn--quiet", type: "button", "aria-label": `Unduh berkas kalender ${ev.title}` }, U.icon("download"), "Berkas .ics");
      icsBtn.addEventListener("click", () => {
        downloadText(`${ev.id}.ics`, buildIcs(ev, description), "text/calendar;charset=utf-8");
        U.toast("Berkas kalender diunduh");
      });
      actions.append(icsBtn);

      list.append(
        U.h(
          "article",
          { class: "event glass reveal", style: `--i:${index}`, "aria-labelledby": titleId },
          U.h(
            "div",
            { class: "event__date", "aria-hidden": "true" },
            U.h("span", { class: "event__day", text: fmt.day.format(ev.start) }),
            U.h("span", { class: "event__month", text: fmt.month.format(ev.start) })
          ),
          U.h(
            "div",
            { class: "event__body" },
            U.h("h3", { class: "event__title", id: titleId, text: ev.title }),
            U.h("p", { class: "event__weekday", text: U.formatLongDate(ev.start, tz) }),
            U.h(
              "ul",
              { class: "event__meta" },
              U.h("li", {}, U.h("strong", { text: `${fmt.time.format(ev.start)} – ${fmt.time.format(ev.end)} ${tzLabel}` })),
              ev.venue && U.h("li", { text: ev.venue }),
              ev.address && U.h("li", { text: ev.address })
            ),
            actions
          )
        )
      );
    });

    if (valid.length) {
      initCountdown(valid[0].start, valid[valid.length - 1].end);
    } else {
      const countdown = U.$("#countdown");
      if (countdown) countdown.hidden = true;
    }
    return valid;
  };
})(window);
