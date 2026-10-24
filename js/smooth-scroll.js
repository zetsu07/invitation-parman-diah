/**
 * smooth-scroll.js — smooth scroll inersia tanpa library.
 *
 * Cara kerja: roda mouse menggeser `target`; posisi aktual mengejar target
 * dengan interpolasi eksponensial (independen dari frame rate).
 * Sengaja TIDAK aktif pada:
 *   - layar sentuh (scroll native sudah berinersia),
 *   - prefers-reduced-motion,
 *   - kontrol yang punya scroll sendiri (textarea/select) atau pinch-zoom (Ctrl+roda).
 * Keyboard & drag scrollbar tetap native; posisi disinkronkan otomatis.
 */
(function (global) {
  "use strict";

  const U = (global.Undangan = global.Undangan || {});

  class SmoothScroll {
    constructor({ ease = 0.1, wheelMultiplier = 1 } = {}) {
      this.ease = ease;
      this.wheelMultiplier = wheelMultiplier;
      this.current = global.scrollY;
      this.target = this.current;
      this.running = false;
      this.locked = false;
      this.raf = 0;
      this.last = 0;

      this.onWheel = this.onWheel.bind(this);
      this.onScroll = this.onScroll.bind(this);
      this.onResize = this.onResize.bind(this);
      this.tick = this.tick.bind(this);
    }

    get limit() {
      return Math.max(0, document.documentElement.scrollHeight - global.innerHeight);
    }

    start() {
      global.addEventListener("wheel", this.onWheel, { passive: false });
      global.addEventListener("scroll", this.onScroll, { passive: true });
      global.addEventListener("resize", this.onResize);
      document.documentElement.classList.add("has-smooth");
      return this;
    }

    stop() {
      global.removeEventListener("wheel", this.onWheel);
      global.removeEventListener("scroll", this.onScroll);
      global.removeEventListener("resize", this.onResize);
      document.documentElement.classList.remove("has-smooth");
      cancelAnimationFrame(this.raf);
      this.running = false;
    }

    lock() {
      this.locked = true;
    }

    unlock() {
      this.locked = false;
      this.current = this.target = global.scrollY;
    }

    onWheel(event) {
      if (this.locked || event.defaultPrevented || event.ctrlKey) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (event.target.closest && event.target.closest("textarea, select, [data-no-smooth]")) return;

      event.preventDefault();
      let delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 32; // baris → px
      else if (event.deltaMode === 2) delta *= global.innerHeight; // halaman → px

      this.target = U.clamp(this.target + delta * this.wheelMultiplier, 0, this.limit);
      this.run();
    }

    onScroll() {
      // Scroll yang berasal dari luar (keyboard, scrollbar, anchor native): ikuti, jangan lawan.
      if (!this.running || Math.abs(global.scrollY - this.current) > 3) {
        this.current = this.target = global.scrollY;
        this.running = false;
        cancelAnimationFrame(this.raf);
      }
    }

    onResize() {
      this.target = U.clamp(this.target, 0, this.limit);
    }

    scrollTo(y) {
      this.target = U.clamp(y, 0, this.limit);
      this.run();
    }

    run() {
      if (this.running) return;
      this.running = true;
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }

    tick(now) {
      const dt = Math.min(64, now - this.last);
      this.last = now;
      const diff = this.target - this.current;

      if (Math.abs(diff) < 0.4) {
        this.current = this.target;
        global.scrollTo({ top: this.current, behavior: "instant" });
        this.running = false;
        return;
      }
      const k = 1 - Math.pow(1 - this.ease, dt / 16.667);
      this.current += diff * k;
      global.scrollTo({ top: this.current, behavior: "instant" });
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  U.SmoothScroll = SmoothScroll;

  /** Aktifkan hanya bila sesuai (mouse/trackpad, bukan reduced-motion). */
  U.createSmoothScroll = function () {
    const finePointer = global.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!finePointer || U.reducedMotion()) return null;
    return new SmoothScroll().start();
  };

  /** Pindah ke elemen; memakai engine bila ada, jika tidak scroll native. */
  U.goTo = function (el, { updateHash = true } = {}) {
    if (!el) return;
    const top = el.getBoundingClientRect().top + global.scrollY;
    if (U.scroll) {
      U.scroll.scrollTo(top);
    } else {
      global.scrollTo({ top, behavior: U.reducedMotion() ? "auto" : "smooth" });
    }
    if (updateHash && el.id) {
      try {
        history.replaceState(null, "", "#" + el.id);
      } catch (_) {
        /* file:// atau iframe sandbox: abaikan */
      }
    }
    el.focus({ preventScroll: true });
  };

  /** Delegasi: semua <a href="#id"> memakai U.goTo. */
  U.initAnchors = function () {
    document.addEventListener("click", (event) => {
      const link = event.target.closest && event.target.closest('a[href^="#"]');
      if (!link || event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const id = link.getAttribute("href").slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      event.preventDefault();
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      U.goTo(target);
    });
  };
})(window);
