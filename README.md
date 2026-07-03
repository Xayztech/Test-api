# 🚀 Machine API — Web Helper Ultra Modern

Platform web helper all-in-one: downloader (YouTube, TikTok, Spotify, Instagram, Facebook, Twitter/X, CapCut, Douyin, Mediafire, dll), pencarian, shortlink, AI chat (Gemini), image tools (remove background, upscale, colorize, dll), dan lebih banyak lagi — dibangun di atas **99 provider** dari `All-api.zip` dengan sistem **fallback otomatis**.

```
creator   : XYCoolcraft
developer : XYCoolcraft
version   : v1.0.0
```

## 📁 Struktur Proyek

```
.
├── machine-api/          # Backend (Node.js v24, CommonJS, Express)
│   ├── server.js         # Entry point Express
│   ├── registry.js       # Peta 99 provider + urutan fallback
│   ├── providers/        # 99 file provider ternormalisasi dari All-api.zip
│   ├── lib/               # response wrapper, key rotator, gemini chat, dll
│   └── .env.example
├── appearance/            # Frontend (HTML/CSS/JS murni, SPA)
│   ├── index.html
│   └── assets/
│       ├── css/style.css
│       ├── js/            # app.js, downloader.js, chat.js, pages.js, dll
│       └── i18n/           # 18 bahasa siap pakai + auto-translate
├── scripts/
│   ├── vps_setup.py       # Setup otomatis VPS (Node, Nginx, PM2, SSL)
│   └── protect.js         # Build produksi ter-obfuscate ke folder dist/
├── install.sh              # Installer VPS interaktif
├── vercel.json
└── package.json
```

## ⚡ Menjalankan Secara Lokal

```bash
npm install
cp machine-api/.env.example machine-api/.env
# isi GEMINI_API_KEY_1, dst di .env
npm start
```

Buka `http://localhost:3000/home/id`.

## 🧠 AI Chat

Menggunakan `@google/genai` resmi dengan model `gemini-3.1-flash-lite`, `safetySettings` di-set `BLOCK_NONE`, dan **rotasi API key otomatis** dari `.env` (`GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, dst — urut, bukan acak) jika satu key limit/error.

## 🌐 Endpoint Utama

| Endpoint | Keterangan |
|---|---|
| `ALL /api/:app/:action` | Semua metode HTTP, contoh: `/api/yt/download?url=...` |
| `ALL /api/ai/chat` | Chat dengan Gemini |
| `ALL /api/detect?url=` | Deteksi platform otomatis dari link |
| `ALL /api/translate` | Terjemahan via Google Translate |
| `ALL /api/shortlink/create` | Buat shortlink |
| `GET /s/:code` | Redirect shortlink |
| `GET /cdn/download` | Proxy download + inject metadata MP3 |
| `GET /health` | Health check |

Lihat halaman **`/docs/id`** di dashboard untuk dokumentasi lengkap dengan contoh kode, daftar kode error, dan format respons.

## 🚀 Deploy ke Vercel

1. Push folder ini ke GitHub.
2. Import di Vercel, `vercel.json` sudah dikonfigurasi.
3. Isi Environment Variables (`GEMINI_API_KEY_1`, dll) di dashboard Vercel.
4. **Catatan Free Tier**: fungsi serverless Vercel Hobby dibatasi durasi eksekusi (di-set 60 detik di `vercel.json`, maksimum yang diizinkan Hobby plan). Untuk proses berat/berdurasi sangat panjang (upscale gambar besar, convert video panjang), gunakan **VPS** via `install.sh` yang mendukung timeout hingga 48 jam.

## 🖥️ Deploy ke VPS (Ubuntu/Debian)

```bash
chmod +x install.sh
./install.sh
# ikuti instruksi: masukkan domain, port, dan pilihan SSL
```

Script ini otomatis: install Node.js v24, PM2, Nginx reverse proxy dengan timeout panjang, dan opsional SSL via Certbot.

## 🔒 Proteksi Source Code

```bash
npm run protect
```

Menghasilkan folder `dist/` berisi source **ter-obfuscate** (control-flow flattening, string encoding, dead-code injection) menggunakan `javascript-obfuscator`. Deploy folder `dist/` ke production, simpan source asli untuk pengembangan.

> Catatan jujur: obfuscation JS mempersulit pembacaan kode, bukan membuatnya 100% mustahil dibaca — ini standar industri untuk kode yang berjalan di browser/Node yang bisa diakses publik. Kombinasi ini + proteksi klik-kanan/devtools di frontend memberikan lapisan perlindungan yang wajar.

## ⚠️ Catatan Provider

- 96 dari 99 provider berhasil dimuat & diverifikasi tanpa error saat `require()`.
- `ai-chatgpt3.js` aslinya berupa script Python (bukan Node.js) — sistem otomatis fallback ke provider AI lain.
- `ytdl2.js` bergantung pada modul lokal (`./function`) yang tidak disertakan dalam `All-api.zip` asli — otomatis fallback ke provider YouTube lain (tersedia ±19 provider YouTube lainnya).
- Beberapa provider gambar (canvas, sharp, ffmpeg) memerlukan native dependency yang lebih optimal di VPS dibanding serverless.

## 📝 Lisensi Konten

Fitur downloader ini murni **teknis** (memanggil API pihak ketiga). Anda bertanggung jawab untuk memastikan penggunaannya sesuai Terms of Service platform terkait dan hukum yang berlaku di wilayah Anda.
