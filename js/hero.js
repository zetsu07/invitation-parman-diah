/**
 * hero.js — foto hero: memudar transparan saat di-scroll + fallback sumber foto.
 * Progres scroll (0..1) disimpan di CSS variable --p; semua efek dihitung di CSS
 * (opacity & transform saja, ramah GPU).
 */
(function (global) {
  "use strict";

  const U = (global.Undangan = global.Undangan || {});
  const FALLBACK_PHOTO = "assets/img/hero-placeholder.svg";

  U.initHero = function (cfg) {
    const hero = U.$("[data-hero]");
    const img = U.$("#hero-img");
    if (!hero) return;

    if (img) {
      const { photo, photoAlt } = cfg.couple || {};
      if (photoAlt) img.alt = photoAlt;
      // Jika foto kustom gagal dimuat (path salah / URL mati), pakai placeholder agar tidak ada gambar rusak.
      img.addEventListener("error", () => {
        if (!img.src.endsWith(FALLBACK_PHOTO)) img.src = FALLBACK_PHOTO;
      });
      if (photo) img.src = photo;
    }

    let queued = false;
    const update = () => {
      queued = false;
      const range = hero.offsetHeight - global.innerHeight;
      const progress = range > 0 ? U.clamp(-hero.getBoundingClientRect().top / range, 0, 1) : 0;
      hero.style.setProperty("--p", progress.toFixed(4));
    };
    const request = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };

    global.addEventListener("scroll", request, { passive: true });
    global.addEventListener("resize", request);
    update();
  };
})(window);
