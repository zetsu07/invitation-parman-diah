/**
 * music.js — musik latar dari YouTube (IFrame API) atau berkas audio sendiri.
 * Dimulai hanya setelah klik "Buka Undangan" (syarat autoplay browser).
 * Bila belum dikonfigurasi atau gagal dimuat, tombol musik disembunyikan.
 */
(function (global) {
  "use strict";

  const U = (global.Undangan = global.Undangan || {});
  const YT_API = "https://www.youtube.com/iframe_api";
  const YT_ID_RE = /^[\w-]{11}$/;
  const API_TIMEOUT_MS = 8000;

  U.initMusic = function (cfg) {
    const music = cfg.music || {};
    const button = U.$("#music-toggle");
    if (!button) return { start() {}, available: false };

    const type = music.type === "file" ? "file" : "youtube";
    const youtubeId = String(music.youtubeId || "").trim();
    const file = String(music.file || "").trim();
    const volume = U.clamp(Number(music.volume) || 50, 0, 100);

    const configured = type === "youtube" ? YT_ID_RE.test(youtubeId) : !!file;
    if (!configured) return { start() {}, available: false }; // tombol tetap hidden

    let controller = null; // { play(), pause() }
    let playing = false;
    let started = false;

    const setPlaying = (value) => {
      playing = value;
      button.setAttribute("aria-pressed", String(value));
      button.setAttribute("aria-label", value ? "Jeda musik" : "Putar musik");
    };

    const fail = (message) => {
      button.hidden = true;
      button.classList.remove("is-visible");
      if (message) U.toast(message, 4000);
    };

    button.addEventListener("click", () => {
      if (!controller) return;
      if (playing) controller.pause();
      else controller.play();
    });

    /* ----- Berkas audio sendiri ----- */
    function startFile() {
      const audio = new Audio(file);
      audio.loop = true;
      audio.volume = volume / 100;
      audio.addEventListener("play", () => setPlaying(true));
      audio.addEventListener("pause", () => setPlaying(false));
      audio.addEventListener("error", () => fail("Musik tidak dapat dimuat."));
      controller = { play: () => audio.play().catch(() => setPlaying(false)), pause: () => audio.pause() };
      controller.play();
    }

    /* ----- YouTube ----- */
    function startYouTube() {
      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled) fail("Musik tidak dapat dimuat. Periksa koneksi internet Anda.");
      }, API_TIMEOUT_MS);

      const build = () => {
        settled = true;
        clearTimeout(timeout);
        // eslint-disable-next-line no-new
        new global.YT.Player("yt-player", {
          width: "200",
          height: "200",
          videoId: youtubeId,
          playerVars: { autoplay: 1, controls: 0, loop: 1, playlist: youtubeId, playsinline: 1, rel: 0, modestbranding: 1 },
          events: {
            onReady: (e) => {
              e.target.setVolume(volume);
              controller = { play: () => e.target.playVideo(), pause: () => e.target.pauseVideo() };
              e.target.playVideo();
              // Bila autoplay diblokir browser, beri tahu pengguna alih-alih diam saja
              setTimeout(() => {
                if (!playing) U.toast("Ketuk tombol musik untuk memutar lagu.", 3600);
              }, 2500);
            },
            onStateChange: (e) => {
              const S = global.YT.PlayerState;
              if (e.data === S.PLAYING) setPlaying(true);
              else if (e.data === S.PAUSED) setPlaying(false);
              else if (e.data === S.ENDED) e.target.playVideo(); // cadangan untuk loop
            },
            onError: () => fail("Video musik tidak dapat diputar (mungkin dibatasi pemiliknya)."),
          },
        });
      };

      if (global.YT && global.YT.Player) {
        build();
        return;
      }
      const previous = global.onYouTubeIframeAPIReady;
      global.onYouTubeIframeAPIReady = () => {
        if (typeof previous === "function") previous();
        build();
      };
      const script = U.h("script", { src: YT_API, async: true });
      script.addEventListener("error", () => {
        settled = true;
        clearTimeout(timeout);
        fail("Musik tidak dapat dimuat. Periksa koneksi internet Anda.");
      });
      document.head.append(script);
    }

    return {
      available: true,
      start() {
        if (started) return;
        started = true;
        button.hidden = false;
        requestAnimationFrame(() => button.classList.add("is-visible"));
        if (type === "file") startFile();
        else startYouTube();
      },
    };
  };
})(window);
