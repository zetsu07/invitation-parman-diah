/**
 * ============================================================
 *  KONFIGURASI UNDANGAN  —  edit HANYA berkas ini untuk isi konten
 * ============================================================
 *  Semua nilai bertanda  «GANTI»  adalah CONTOH / PLACEHOLDER.
 *  Setelah deploy, ganti semuanya dengan data asli Anda.
 *
 *  Catatan: judul & meta tag untuk preview link (WhatsApp, dsb.)
 *  ada di <head> index.html dan harus diedit manual di sana,
 *  karena pembaca link (crawler) tidak menjalankan JavaScript.
 */
window.INVITATION_CONFIG = {
  /* ---------- Mempelai ---------- */
  couple: {
    groom: {
      nick: "Parman",                                   // «GANTI» nama panggilan (disarankan ≤ 8 huruf)
      full: "Suparman",                           // «GANTI» nama lengkap
      role: "Putra ke-3 dari",
      parents: "Bapak Sodik\n& Ibu Sainah", // «GANTI» (\n = baris baru)
    },
    bride: {
      nick: "Diah",                                  // «GANTI»
      full: "Halimahtusadiah",                         // «GANTI»
      role: "Putri ke-3 dari",
      parents: "Bapak Asep\n& Ibu Yanti",         // «GANTI»
    },
    /* Sumber foto hero. Bisa file lokal ("assets/img/couple.jpg")
       atau URL internet ("https://..."). Rasio terbaik 4:5 (potret). */
    photo: "https://myimgs.org/storage/images/66597/Couple.png",         // «GANTI» foto mempelai
    photoAlt: "Foto Parman dan Diah",
  },

  /* ---------- Teks pembuka ---------- */
  intro: {
    title: "Dua cerita, satu langkah yang sama.",
    text:
      "Dengan penuh syukur, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan " +
      "memberikan doa restu pada hari bahagia kami.",
  },

  /* ---------- Acara ---------- */
  timeZone: "Asia/Jakarta",    // zona waktu IANA (WIB: Asia/Jakarta, WITA: Asia/Makassar, WIT: Asia/Jayapura)
  timeZoneLabel: "WIB",
  events: [
    {
      id: "akad",
      title: "Akad Nikah",
      start: "2026-08-28T08:00:00+07:00",             // «GANTI» format ISO + offset zona waktu
      end: "2026-08-28T10:00:00+07:00",
      venue: "Kantor Urusan Agama Leuwiliang",                  // «GANTI»
      address: "Jl. Raya Karehkel. Perumahan Permata Green Land",    // «GANTI»
      mapsUrl: "https://maps.app.goo.gl/XXJFs9PdoFK6ep2WA",   // opsional: tempel link Google Maps. Jika kosong, dibuat otomatis dari venue + alamat.
    },
    {
      id: "resepsi",
      title: "Resepsi",
      start: "2026-11-07T08:00:00+07:00",             // «GANTI»
      end: "2026-11-07T23:00:00+07:00",
      venue: "Kalong Babakan Area",                   // «GANTI»
      address: "Jl. Kalong Babakan RT 03/RW 11 No.12",    // «GANTI»
      mapsUrl: "https://maps.app.goo.gl/HaYSxM9dAvM93Lqg8",
    },
  ],

  /* ---------- RSVP ----------
     Mode 1 (default): konfirmasi dikirim lewat WhatsApp ke nomor di bawah.
     Mode 2: isi `endpoint` (mis. Google Apps Script Web App) → data di-POST
             sebagai JSON; WhatsApp tidak dibuka. */
  rsvp: {
    whatsapp: "6281289084869",   // «GANTI» nomor tujuan, format internasional tanpa "+" / "0" depan (contoh: 6281234567890)
    endpoint: "",               // opsional, lihat README
    maxGuests: 5,
  },

  /* ---------- Amplop digital ---------- */
  gift: {
    qris: {
      image: "https://myimgs.org/storage/images/66606/QRIS.png",       // «GANTI» ke "assets/img/qris.png" (gambar QRIS asli)
      alt: "Kode QRIS untuk amplop digital",
    },
    banks: [
      { bank: "BCA",     number: "0050742415", holder: "Suparman/Parman" }, // «GANTI»
      { bank: "E Wallet DANA", number: "085810863700", holder: "Suparman/Parman" }, // «GANTI»
    ],
  },

  /* ---------- Musik ----------
     type "youtube": isi youtubeId (bagian setelah "v=" di link YouTube).
     type "file"   : isi file, mis. "assets/audio/lagu.mp3".
     Selama belum diisi, tombol musik TIDAK ditampilkan. */
  music: {
    type: "youtube",
    youtubeId: "J_s1WqHa5qA",              // «ISI» contoh: "dQw4w9WgXcQ"
    file: "",
    volume: 85,                 // 0–100
  },

  /* ---------- Penutup ---------- */
  closing:
    "Merupakan kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i " +
    "berkenan hadir dan memberikan doa restu. Terima kasih.",
      credit: {
    prefix: "Created And Design by",
    name: "Ekha Shaputra",
    url: "",
  },
};
