/**
 * rsvp.js — formulir konfirmasi kehadiran.
 *
 * Pengiriman:
 *   - mode "whatsapp": membuka wa.me dengan pesan terisi (butuh rsvp.whatsapp).
 *   - mode "endpoint": POST JSON ke rsvp.endpoint (mis. Google Apps Script).
 *   - mode "none"    : form dinonaktifkan dengan pesan yang jelas (tidak ada tombol "mati" tanpa penjelasan).
 */
(function (global) {
  "use strict";

  const U = (global.Undangan = global.Undangan || {});

  const NAME_RE = /^[\p{L}\p{M}0-9 .,'’\-]+$/u;
  const MAX_MESSAGE = 300;
  const WA_RE = /^\d{8,15}$/;
  const ENDPOINT_TIMEOUT_MS = 12000;

  // Buang karakter kontrol (kecuali baris baru) dan rapikan baris kosong berlebihan
  const cleanMessage = (text) =>
    String(text || "")
      .replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .replace(/\r\n?/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  const cleanName = (text) => String(text || "").replace(/\s+/g, " ").trim();

  /** Murni (tanpa DOM) agar mudah diuji. */
  function validate(values, maxGuests) {
    const errors = {};
    const name = cleanName(values.name);
    const message = cleanMessage(values.message);

    if (!name) errors.name = "Nama wajib diisi.";
    else if (name.length < 2) errors.name = "Nama terlalu pendek (minimal 2 karakter).";
    else if (name.length > 60) errors.name = "Nama terlalu panjang (maksimal 60 karakter).";
    else if (!NAME_RE.test(name)) errors.name = "Gunakan huruf, angka, spasi, titik, koma, atau tanda hubung saja.";

    if (values.attendance !== "yes" && values.attendance !== "no") {
      errors.attendance = "Pilih salah satu: hadir atau berhalangan.";
    }

    let guests = 0;
    if (values.attendance === "yes") {
      guests = parseInt(values.guests, 10);
      if (!(guests >= 1 && guests <= maxGuests)) errors.guests = `Jumlah tamu harus 1–${maxGuests}.`;
    }

    if (message.length > MAX_MESSAGE) errors.message = `Ucapan maksimal ${MAX_MESSAGE} karakter.`;

    return { errors, data: { name, attendance: values.attendance, guests, message } };
  }

  function buildWhatsAppMessage(data) {
    const status = data.attendance === "yes" ? `Hadir (${data.guests} orang)` : "Tidak dapat hadir";
    const lines = [`Halo, saya ${data.name}.`, `Konfirmasi kehadiran: ${status}.`];
    if (data.message) lines.push("", `Ucapan: ${data.message}`);
    return lines.join("\n");
  }

  U.rsvp = { validate, buildWhatsAppMessage };

  U.initRsvp = function (cfg, options) {
    const form = U.$("#rsvp-form");
    if (!form) return;
    const rsvp = cfg.rsvp || {};
    const guestName = (options && options.guestName) || "";

    const el = {
      name: U.$("#rsvp-name"),
      guests: U.$("#rsvp-guests"),
      guestsField: U.$("#rsvp-guests-field"),
      message: U.$("#rsvp-message"),
      counter: U.$("#rsvp-counter"),
      attendance: U.$("#rsvp-attendance"),
      submit: U.$("#rsvp-submit"),
      note: U.$("#rsvp-note"),
      formError: U.$("#rsvp-form-error"),
      done: U.$("#rsvp-done"),
      doneTitle: U.$("#rsvp-done-title"),
      doneText: U.$("#rsvp-done-text"),
      waLink: U.$("#rsvp-wa-link"),
      reset: U.$("#rsvp-reset"),
      error: {
        name: U.$("#rsvp-name-error"),
        attendance: U.$("#rsvp-attendance-error"),
        message: U.$("#rsvp-message-error"),
      },
    };

    const maxGuests = U.clamp(parseInt(rsvp.maxGuests, 10) || 5, 1, 20);
    for (let i = 1; i <= maxGuests; i++) {
      el.guests.append(U.h("option", { value: i, text: `${i} orang` }));
    }
    if (guestName) el.name.value = guestName;

    const waNumber = String(rsvp.whatsapp || "").replace(/\D/g, "");
    const endpoint = /^https:\/\//i.test(rsvp.endpoint || "") ? rsvp.endpoint : "";
    const mode = endpoint ? "endpoint" : WA_RE.test(waNumber) ? "whatsapp" : "none";

    if (mode === "whatsapp") el.note.textContent = "Konfirmasi dikirim lewat WhatsApp ke mempelai.";
    else if (mode === "endpoint") el.note.textContent = "Konfirmasi dikirim langsung ke mempelai.";
    else {
      el.note.textContent = "Pengiriman RSVP belum diaktifkan oleh pemilik undangan.";
      el.submit.disabled = true;
    }

    /* ----- helpers tampilan ----- */
    const readValues = () => {
      const checked = form.querySelector('input[name="attendance"]:checked');
      return {
        name: el.name.value,
        attendance: checked ? checked.value : "",
        guests: el.guests.value,
        message: el.message.value,
      };
    };

    const setError = (field, message) => {
      if (field === "attendance") {
        el.attendance.dataset.invalid = message ? "true" : "false";
        el.error.attendance.textContent = message || "";
        return;
      }
      const input = field === "name" ? el.name : el.message;
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
      el.error[field].textContent = message || "";
    };

    const showFormError = (message) => {
      el.formError.textContent = message;
      el.formError.hidden = !message;
    };

    const setBusy = (busy) => {
      el.submit.setAttribute("aria-busy", busy ? "true" : "false");
      el.submit.disabled = busy || mode === "none";
      el.submit.querySelector(".btn__label").textContent = busy ? "Mengirim…" : "Kirim Konfirmasi";
    };

    const showDone = (data, waUrl) => {
      const yes = data.attendance === "yes";
      el.doneTitle.textContent = `Terima kasih, ${data.name}`;
      if (mode === "whatsapp") {
        el.doneText.textContent =
          "WhatsApp dibuka dengan pesan konfirmasi Anda. Tekan tombol kirim di WhatsApp untuk menyelesaikan. " +
          "Bila tidak terbuka otomatis, gunakan tombol di bawah.";
        el.waLink.href = waUrl;
        el.waLink.hidden = false;
      } else {
        el.doneText.textContent = yes
          ? "Konfirmasi Anda telah dikirim. Sampai jumpa di hari bahagia kami!"
          : "Konfirmasi Anda telah dikirim. Terima kasih telah mengabari, doa Anda sangat berarti bagi kami.";
        el.waLink.hidden = true;
      }
      form.hidden = true;
      el.done.hidden = false;
      el.done.focus({ preventScroll: true });
    };

    /* ----- interaksi ----- */
    form.querySelectorAll('input[name="attendance"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        el.guestsField.hidden = radio.value !== "yes" || !radio.checked;
        setError("attendance", "");
      });
    });

    el.name.addEventListener("input", () => {
      if (el.name.getAttribute("aria-invalid") === "true" && !validate(readValues(), maxGuests).errors.name) setError("name", "");
    });

    el.message.addEventListener("input", () => {
      el.counter.textContent = `${el.message.value.length}/${MAX_MESSAGE}`;
      if (el.message.getAttribute("aria-invalid") === "true") setError("message", "");
    });
    el.counter.textContent = `${el.message.value.length}/${MAX_MESSAGE}`;

    el.reset.addEventListener("click", () => {
      el.done.hidden = true;
      form.hidden = false;
      showFormError("");
      el.name.focus();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (el.submit.getAttribute("aria-busy") === "true" || mode === "none") return;
      showFormError("");

      const { errors, data } = validate(readValues(), maxGuests);
      setError("name", errors.name);
      setError("attendance", errors.attendance);
      setError("message", errors.message);

      const firstInvalid = errors.name
        ? el.name
        : errors.attendance
        ? form.querySelector('input[name="attendance"]')
        : errors.message || errors.guests
        ? el.message
        : null;
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      if (mode === "whatsapp") {
        const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(buildWhatsAppMessage(data))}`;
        global.open(url, "_blank", "noopener");
        showDone(data, url);
        return;
      }

      // mode endpoint
      setBusy(true);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ENDPOINT_TIMEOUT_MS);
      try {
        await fetch(endpoint, {
          method: "POST",
          mode: "no-cors", // Apps Script tidak mengirim header CORS; respons tidak dapat dibaca
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(Object.assign({}, data, { submittedAt: new Date().toISOString() })),
          signal: controller.signal,
        });
        showDone(data, "");
      } catch (err) {
        showFormError(
          err && err.name === "AbortError"
            ? "Pengiriman terlalu lama. Periksa koneksi Anda lalu coba lagi."
            : "Gagal mengirim konfirmasi. Periksa koneksi Anda lalu coba lagi."
        );
      } finally {
        clearTimeout(timer);
        setBusy(false);
      }
    });
  };
})(window);
