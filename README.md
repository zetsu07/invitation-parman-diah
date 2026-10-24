# Undangan Pernikahan (website statis)

Website undangan pernikahan bergaya **modern clean dark grey** dengan efek **liquid glass**, tombol **running light**, smooth scroll, RSVP, musik, dan amplop digital (QRIS + transfer bank).
Tanpa build, tanpa dependensi npm: cukup HTML + CSS + JavaScript murni, siap di-deploy ke Vercel.

## Struktur

```
undangan-pernikahan/
├── index.html            # struktur halaman + meta tag (edit judul/OG di sini)
├── vercel.json           # header keamanan untuk Vercel
├── css/
│   ├── tokens.css        # warna, font, spasi, radius, motion (design tokens)
│   ├── base.css          # reset, layout, latar ambient, reveal
│   ├── components.css    # glass, tombol running-light, tab, form, dock, toast
│   └── sections.css      # gate, hero, mempelai, acara, RSVP, amplop, footer
├── js/
│   ├── config.js         # ★ SATU-SATUNYA berkas yang perlu Anda edit untuk isi konten
│   ├── ui.js             # utilitas, toast, reveal, dock
│   ├── smooth-scroll.js  # smooth scroll inersia tanpa library
│   ├── hero.js           # foto hero memudar saat scroll
│   ├── event.js          # kartu acara, hitung mundur, kalender (.ics / Google)
│   ├── rsvp.js           # formulir konfirmasi kehadiran
│   ├── gift.js           # amplop digital (tab, salin rekening, unduh QRIS)
│   ├── music.js          # musik YouTube / berkas audio
│   └── app.js            # titik masuk + gate "Buka Undangan"
└── assets/img/           # foto hero, QRIS, favicon
```

## Yang WAJIB Anda ganti (saat ini masih contoh)

Semua ditandai `«GANTI»` di `js/config.js`:

| Bagian | Isi contoh sekarang | Ganti dengan |
|---|---|---|
| Nama, orang tua | Raka / Sinta, dst. | Data mempelai |
| `couple.photo` | `hero-placeholder.svg` | Foto Anda (`assets/img/couple.jpg`, rasio 4:5) atau URL internet |
| `events` | 16 Januari 2027, venue contoh | Tanggal (format ISO + offset), venue, alamat |
| `rsvp.whatsapp` | `620000000000` (tidak valid) | Nomor WhatsApp tujuan, mis. `6281234567890` |
| `gift.qris.image` | `qris-placeholder.svg` (**bukan QRIS asli**) | Simpan QRIS asli sebagai `assets/img/qris.png` lalu ubah path-nya |
| `gift.banks` | nomor `0000000000` | Bank, nomor rekening, nama pemilik |
| `music.youtubeId` | kosong | ID video YouTube (tombol musik muncul setelah diisi) |

Di `index.html`, edit juga `<title>`, `description`, dan `og:title` / `og:description`. Pembaca link seperti WhatsApp tidak menjalankan JavaScript, jadi bagian ini tidak otomatis mengikuti `config.js`.

> **Periksa QRIS dan rekening dua kali sebelum dibagikan**, lalu coba pindai/transfer nominal kecil sendiri.

## Link per tamu

Tambahkan `?to=` di akhir alamat; nama tampil di sampul dan terisi otomatis di form RSVP:

```
https://domain-anda.vercel.app/?to=Budi+%26+Keluarga
```

## RSVP

- **Default (WhatsApp):** tombol membuka WhatsApp ke `rsvp.whatsapp` dengan pesan sudah terisi; tamu masih perlu menekan *kirim*.
- **Google Sheets (opsional):** isi `rsvp.endpoint` dengan URL Web App Apps Script. Data dikirim sebagai JSON. Skrip contoh:

  ```js
  function doPost(e) {
    const d = JSON.parse(e.postData.contents);
    SpreadsheetApp.getActiveSheet()
      .appendRow([new Date(), d.name, d.attendance, d.guests, d.message]);
    return ContentService.createTextOutput("ok");
  }
  ```
  Deploy sebagai *Web app* (Execute as: Me, Who has access: Anyone). Browser tidak bisa membaca balasan dari Apps Script, jadi situs hanya dapat memastikan permintaan terkirim, bukan bahwa baris tersimpan. Cek sheet Anda setelah mencoba sendiri.

## Musik

- `type: "youtube"` + `youtubeId`: musik dimulai saat tamu menekan **Buka Undangan** (syarat autoplay browser). Hanya berfungsi lewat `https://` (situs yang sudah di-deploy), bukan dari `file://`.
- `type: "file"` + `file: "assets/audio/lagu.mp3"`: memakai berkas sendiri.
- Perhatian: kebijakan YouTube meminta pemutar yang terlihat dengan ukuran minimal, sedangkan situs ini menyembunyikannya demi tampilan. Bila ingin aman dari sisi itu, gunakan berkas audio sendiri. Pastikan juga Anda berhak memakai lagunya.

## Jalankan lokal

Cukup buka `index.html` di browser (musik YouTube tidak jalan dari `file://`), atau untuk hasil yang sama dengan produksi:

```bash
python3 -m http.server 8000   # lalu buka http://localhost:8000
```

## Deploy: GitHub → Vercel

```bash
git init
git add .
git commit -m "Undangan pernikahan"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

1. Buka vercel.com → **Add New… → Project** → impor repo tersebut.
2. **Framework Preset: Other.** Kosongkan Build Command dan Output Directory.
3. **Deploy.** Setiap `git push` berikutnya otomatis memperbarui situs.

## Catatan teknis

- Font (Instrument Serif + Hanken Grotesk) dimuat dari Google Fonts; tanpa internet, tampil font cadangan.
- Undangan dipasang `noindex` agar tidak muncul di Google. Hapus `<meta name="robots">` di `index.html` bila ingin sebaliknya.
- Smooth scroll hanya aktif untuk mouse/trackpad; layar sentuh memakai scroll native, dan `prefers-reduced-motion` dihormati.
- Efek kaca memakai `backdrop-filter`; browser tanpa dukungan mendapat latar solid yang tetap terbaca.
- Foto preview saat link dibagikan: setelah punya domain, tambahkan tag `og:image` dengan URL absolut (contoh ada di komentar `index.html`).
# invitation-parman-diah
