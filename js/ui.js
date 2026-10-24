/**
 * ui.js — utilitas bersama & perilaku UI generik
 * (DOM builder aman, toast, reveal, kilau glass, dock, ikon)
 */
(function (global) {
  "use strict";

  const U = (global.Undangan = global.Undangan || {});

  U.$ = (selector, root = document) => root.querySelector(selector);
  U.$$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  U.clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  U.reducedMotion = () => global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /**
   * Pembuat elemen DOM yang aman: teks selalu lewat textContent/TextNode,
   * sehingga konten dari config / URL tidak pernah diparse sebagai HTML.
   */
  U.h = function (tag, attrs, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (value === false || value == null) return;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else node.setAttribute(key, value === true ? "" : String(value));
    });
    children.flat().forEach((child) => {
      if (child == null || child === false) return;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    });
    return node;
  };

  /* Ikon inline (string statis milik kode ini, bukan input pengguna) */
  const ICONS = {
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg>',
  };
  U.icon = function (name) {
    const tpl = document.createElement("template");
    tpl.innerHTML = ICONS[name] || "";
    return tpl.content.firstElementChild;
  };

  /* ---------- Toast ---------- */
  let toastTimer = 0;
  U.toast = function (message, duration = 2800) {
    const el = U.$("#toast");
    if (!el) return;
    clearTimeout(toastTimer);
    el.textContent = message;
    el.classList.add("is-show");
    toastTimer = setTimeout(() => el.classList.remove("is-show"), duration);
  };

  /* ---------- Reveal saat masuk viewport ---------- */
  U.initReveal = function () {
    const items = U.$$(".reveal");
    if (!("IntersectionObserver" in global) || U.reducedMotion()) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    );
    items.forEach((el) => io.observe(el));
  };

  /* ---------- Kilau spekular glass mengikuti kursor ---------- */
  U.initGlassPointer = function () {
    if (!global.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    let last = null;
    document.addEventListener(
      "pointermove",
      (event) => {
        const card = event.target.closest && event.target.closest(".glass");
        if (!card) return;
        last = { card, x: event.clientX, y: event.clientY };
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const rect = last.card.getBoundingClientRect();
          last.card.style.setProperty("--mx", last.x - rect.left + "px");
          last.card.style.setProperty("--my", last.y - rect.top + "px");
        });
      },
      { passive: true }
    );
  };

  /* ---------- Dock: tandai bagian aktif ---------- */
  U.initDock = function () {
    const dock = U.$("#dock");
    if (!dock) return;
    const links = U.$$(".dock__link", dock);
    const targets = links.map((a) => U.$(a.getAttribute("href")));

    const setActive = (index) => {
      dock.style.setProperty("--i", index);
      links.forEach((a, i) => {
        if (i === index) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
    };
    setActive(0);
    if (!("IntersectionObserver" in global)) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(targets.indexOf(entry.target));
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    targets.forEach((t) => t && io.observe(t));
  };
})(window);
