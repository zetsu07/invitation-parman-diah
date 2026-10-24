/**
 * app.js — titik masuk: mengikat konfigurasi ke halaman, menyalakan modul,
 * dan mengatur gate "Buka Undangan".
 */
(function (global) {
  "use strict";

  const U = global.Undangan;
  const cfg = global.INVITATION_CONFIG;
  const html = document.documentElement;

  /** Nama tamu dari ?to=Nama+Tamu — selalu disisipkan sebagai teks (bukan HTML). */
  function readGuestName() {
    try {
      const raw = new URLSearchParams(global.location.search).get("to") || "";
      return raw.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
    } catch (_) {
      return "";
    }
  }

  function bind(key, value) {
    U.$$(`[data-bind="${key}"]`).forEach((node) => (node.textContent = value));
  }

  function bindContent() {
    const { groom = {}, bride = {} } = cfg.couple || {};
    const initial = (text) => (Array.from(String(text || "?"))[0] || "?").toUpperCase();

    bind("groom-nick", groom.nick || "");
    bind("bride-nick", bride.nick || "");
    bind("groom-full", groom.full || "");
    bind("bride-full", bride.full || "");
    bind("groom-role", groom.role || "");
    bind("bride-role", bride.role || "");
    bind("groom-parents", groom.parents || "");
    bind("bride-parents", bride.parents || "");
    bind("groom-initial", initial(groom.nick || groom.full));
    bind("bride-initial", initial(bride.nick || bride.full));
    bind("intro-title", (cfg.intro && cfg.intro.title) || "");
    bind("intro-text", (cfg.intro && cfg.intro.text) || "");
    bind("closing", cfg.closing || "");

    document.title = `Undangan Pernikahan ${groom.nick || ""} & ${bride.nick || ""}`.replace(/\s+&\s*$/, "");

    // Skala ukuran nama hero agar nama panjang tidak meluap
    const a = Array.from(groom.nick || "").length;
    const b = Array.from(bride.nick || "").length;
    const hero = U.$("[data-hero]");
    hero.style.setProperty("--name-max", Math.max(a, b, 3));
    hero.style.setProperty("--name-sum", Math.max(a + b + 2, 6));
  }
    function renderCredit() {
    const node = U.$("#credit");
    const credit = cfg.credit || {};
    const name = String(credit.name || "").trim();
    if (!node || !name) return;
    const prefix = String(credit.prefix || "Created by").trim();
    const label = /^https?:\/\//i.test(credit.url || "")
      ? U.h("a", { href: credit.url, target: "_blank", rel: "noopener noreferrer", text: name })
      : U.h("span", { text: name });
    node.replaceChildren(`${prefix} `, label);
    node.hidden = false;
  }
  function setInert(node, value) {
    if (!node) return;
    if (value) node.setAttribute("inert", "");
    else node.removeAttribute("inert");
  }

  function initGate(music) {
    const gate = U.$("#gate");
    const openButton = U.$("#gate-open");
    const main = U.$("#main");
    const dock = U.$("#dock");
    const musicButton = U.$("#music-toggle");
    let opened = false;

    // Selama gate tampil: konten di belakangnya tidak dapat difokus / dibaca pembaca layar
    [main, dock, musicButton].forEach((node) => setInert(node, true));
    html.classList.add("is-locked");
    if (U.scroll) U.scroll.lock();
    openButton.focus({ preventScroll: true });

    function open() {
      if (opened) return;
      opened = true;

      html.classList.remove("is-locked");
      html.classList.add("is-opened");
      global.scrollTo(0, 0);
      if (U.scroll) U.scroll.unlock();

      [main, dock, musicButton].forEach((node) => setInert(node, false));
      dock.classList.add("is-visible");

      gate.classList.add("is-open");
      setInert(gate, true);
      gate.setAttribute("aria-hidden", "true");
      setTimeout(() => (gate.hidden = true), U.reducedMotion() ? 0 : 1200);

      music.start(); // dalam handler klik → memenuhi syarat autoplay
      main.focus({ preventScroll: true });
    }

    openButton.addEventListener("click", open);
  }

  function boot() {
    if (!U || !cfg) {
      console.error("[undangan] config.js / ui.js gagal dimuat.");
      return;
    }
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    global.scrollTo(0, 0);

    try {
      const guest = readGuestName();
      bindContent();
      if (guest) U.$("#guest-name").textContent = guest;

      const events = U.initEvents(cfg) || [];
      if (events.length) U.$("#hero-date").textContent = U.formatLongDate(events[0].start, cfg.timeZone);

      U.initGift(cfg);
      U.initRsvp(cfg, { guestName: guest });
      U.initHero(cfg);
      U.initReveal();
      U.initGlassPointer();
      U.initDock();
      renderCredit();
      U.scroll = U.createSmoothScroll();
      U.initAnchors();

      initGate(U.initMusic(cfg));
    } catch (error) {
      // Jangan biarkan satu kegagalan membuat undangan kosong / terkunci
      console.error("[undangan] Gagal menginisialisasi:", error);
      html.classList.remove("is-locked");
      html.classList.add("is-opened");
      U.$$(".reveal").forEach((node) => node.classList.add("is-in"));
      const gate = U.$("#gate");
      if (gate) gate.hidden = true;
      ["#main", "#dock"].forEach((selector) => setInert(U.$(selector), false));
    }
  }

  boot();
})(window);
