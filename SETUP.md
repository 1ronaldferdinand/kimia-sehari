# Panduan Setup Kimia Sehari (Dari 0 ke Vercel, Telegram, dan Make.com)

Panduan ini menjelaskan langkah demi langkah untuk menjalankan pipeline otomatis **Kimia Sehari** mulai dari pembuatan kunci API, konfigurasi Bot Telegram, pembuatan Webhook Make.com, hingga deploy ke Vercel.

---

## Struktur Proyek

Pastikan file di folder proyek kamu sudah tersusun seperti ini:

```text
kimiasehari/
├── api/
│   └── cron.js          # Serverless function utama (Gemini + Make + Telegram + Anti-Duplikat)
├── scripts/
│   └── run-local.js     # Runner untuk mengetes cron langsung di komputer lokal
├── .env.example         # Template variabel environment lokal
├── .gitignore           # Mengabaikan file sensitif (.env, .vercel, node_modules)
├── brief.md             # Dokumen arsitektur & ringkasan proyek
├── package.json         # Konfigurasi project Node.js (ES Module)
├── SETUP.md             # Panduan setup dari 0 (dokumen ini)
└── vercel.json          # Jadwal Vercel Cron & batas durasi 60 detik
```

---

## Tahap 1: Ambil API Key Google Gemini

1. Buka [Google AI Studio](https://aistudio.google.com/app/apikey) dan login dengan akun Google kamu.
2. Klik tombol **Create API key**.
3. Pilih project Google Cloud yang ada atau pilih **Create API key in new project**.
4. Salin API key yang muncul dan simpan di catatan sementara sebagai `GEMINI_API_KEY`.

---

## Tahap 2: Buat Bot Telegram & Ambil Chat ID

Bot ini dipakai untuk mengirim laporan harian dan preview konten (Topik, Hook, Penjelasan, Visual, dan Caption) langsung ke Telegram kamu.

### 1. Buat Bot dan Ambil `TELEGRAM_BOT_TOKEN`
1. Buka aplikasi Telegram, cari akun resmi **@BotFather** (pastikan ada centang biru).
2. Kirim pesan `/start`, lalu kirim perintah `/newbot`.
3. Masukkan **nama tampilan bot** (contoh: `Kimia Sehari Bot`).
4. Masukkan **username bot** yang diakhiri kata `bot` (contoh: `kimiasehari_auto_bot`).
5. BotFather akan memberikan token HTTP API seperti ini:
   `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
6. Salin token tersebut dan simpan sebagai `TELEGRAM_BOT_TOKEN`.

### 2. Ambil `TELEGRAM_CHAT_ID` Kamu
1. Klik link bot yang baru kamu buat dari balasan BotFather, lalu klik **Start** (atau kirim pesan `/start` maupun teks bebas seperti `Halo` ke bot tersebut).
2. Buka browser dan akses URL berikut (ganti `<TOKEN_BOT_KAMU>` dengan token dari langkah sebelumnya):
   ```text
   https://api.telegram.org/bot<TOKEN_BOT_KAMU>/getUpdates
   ```
3. Cari bagian `"chat":{"id":...}` pada hasil JSON yang tampil di layar:
   ```json
   "chat": {
     "id": 987654321,
     "first_name": "NamaKamu",
     "type": "private"
   }
   ```
4. Salin angka pada `"id"` tersebut (misal: `987654321`) dan simpan sebagai `TELEGRAM_CHAT_ID`.
   *(Catatan: Jika hasilnya masih `"result": []`, kirim ulang 1 pesan teks ke bot kamu lalu refresh halaman browser).*

---

## Tahap 3: Setup Webhook di Make.com

Make.com bertugas menerima JSON hasil riset dari Vercel untuk diteruskan ke generator visual/video (Canva, Creatomate, atau Google Sheets) serta mempublikasikannya ke Instagram Reels & TikTok.

### 1. Buat Custom Webhook
1. Login ke [Make.com](https://www.make.com/).
2. Klik **Scenarios** di menu kiri, lalu klik **Create a new scenario** di kanan atas.
3. Klik tombol **`+`** besar di tengah layar, cari dan pilih modul **Webhooks**.
4. Pilih **Custom webhook**.
5. Klik tombol **Add**, beri nama webhook (contoh: `Kimia Sehari Vercel Trigger`), lalu klik **Save**.
6. Make.com akan menampilkan alamat URL seperti:
   `https://hook.eu2.make.com/abcdefghijklmnop123456`
7. Klik **Copy address to clipboard** dan simpan URL tersebut sebagai `MAKE_WEBHOOK_URL`.
8. **Penting:** Biarkan skenario Make.com tetap terbuka pada status *"Listening for data..."* agar nanti saat tes pertama dari Vercel, Make.com langsung mengenali struktur JSON-nya.

---

## Tahap 4: Push Kode ke GitHub & Deploy ke Vercel

### 1. Push ke Repository GitHub
Jika proyek ini belum terhubung ke repository GitHub, jalankan perintah berikut di terminal:

```bash
git add .
git commit -m "Initial implementation of Kimia Sehari automation pipeline"
git branch -M main
git remote add origin https://github.com/<username-github-kamu>/kimia-sehari.git
git push -u origin main
```

### 2. Import Project di Vercel
1. Login ke [Vercel Dashboard](https://vercel.com/dashboard).
2. Klik tombol **Add New...** -> **Project**.
3. Pada daftar **Import Git Repository**, cari repository `kimia-sehari` kamu dan klik **Import**.
4. Biarkan **Framework Preset** pada pilihan **Other** dan **Root Directory** tetap `./`.

### 3. Masukkan Environment Variables di Vercel
Sebelum klik tombol Deploy, buka bagian **Environment Variables** dan tambahkan variabel berikut satu per satu:

| Key | Value | Wajib? |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | API Key dari Google AI Studio | Wajib |
| `MAKE_WEBHOOK_URL` | URL Custom Webhook dari Make.com | Wajib (jika pakai Make.com) |
| `TELEGRAM_BOT_TOKEN` | Token bot dari `@BotFather` | Wajib (jika pakai Telegram) |
| `TELEGRAM_CHAT_ID` | Angka Chat ID Telegram kamu | Wajib (jika pakai Telegram) |
| `CRON_SECRET` | Kosongkan dulu saat tes awal (lihat Tahap 6) | Opsional |
| `UPSTASH_REDIS_REST_URL` | URL REST Redis untuk riwayat anti-duplikat (lihat Tahap 7) | Opsional |
| `UPSTASH_REDIS_REST_TOKEN` | Token REST Redis dari Upstash (lihat Tahap 7) | Opsional |

5. Klik tombol **Deploy** dan tunggu sekitar 15 sampai 30 detik hingga proses selesai.
6. Setelah selesai, kamu akan mendapatkan domain publik seperti:
   `https://kimia-sehari.vercel.app`

---

## Tahap 5: Uji Coba Pertama & Mapping Data di Make.com

1. Pastikan di layar skenario Make.com kamu, modul **Custom Webhook** sedang berputar menunggu data (*"Stop" / "Redetermine data structure"*).
2. Buka tab baru di browser, lalu akses endpoint cron kamu secara langsung:
   ```text
   https://<nama-project-kamu>.vercel.app/api/cron
   ```
3. Dalam beberapa detik:
   - Browser akan menampilkan respons JSON `{"success": true, "message": "Pipeline Kimia Sehari berhasil dieksekusi!", "data": {...}}`.
   - Bot Telegram kamu akan langsung mengirimkan pesan notifikasi berisi Topik, Hook, Penjelasan, Visual, dan Caption.
   - Modul Webhook di Make.com akan berubah menjadi centang hijau **Successfully determined**.

### Struktur Data yang Diterima Make.com
Setelah status Webhook menjadi **Successfully determined**, jika struktur datanya berasal dari versi lama, klik kanan modul Webhook -> pilih **Redetermine data structure** -> lalu panggil sekali lagi URL `/api/cron` di browser agar variabel video terbaru ikut terbaca.

Variabel yang dikirim oleh Vercel ke Make.com:
- `payload.topik` -> Judul topik kimia harian
- `payload.hook` -> Narasi pembuka (Adegan 1: Makro)
- `payload.penjelasan` -> Narasi penjelasan sains (Adegan 2: Zoom Mikroskop/Molekuler)
- `payload.kesimpulan` -> Narasi penutup singkat (Adegan 3: Kesimpulan)
- `payload.images.scene_1_macro` -> URL Gambar AI Gratis Adegan 1 (Aktivitas/Objek Nyata)
- `payload.images.scene_2_microscope` -> URL Gambar AI Gratis Adegan 2 (Zoom Mikroskop/Molekul)
- `payload.images.scene_3_outro` -> URL Gambar AI Gratis Adegan 3 (Kesimpulan Visual)
- `payload.json2video_json_string` -> Konfigurasi JSON lengkap siap pakai untuk modul **JSON2Video**
- `payload.caption` -> Caption lengkap beserta hashtag

---

### Cara Render Video Otomatis Gratis (Pollinations AI + JSON2Video di Make.com)

Solusi ini menggabungkan **Pollinations AI** (generator ilustrasi 3 adegan Makro -> Mikroskop -> Kesimpulan yang 100% gratis tanpa API key) dengan **JSON2Video** (kuota gratis 600 detik video, sudah termasuk animasi kamera *Zoom-In*, suara narator Bahasa Indonesia, dan *subtitle* otomatis):

#### 1. Ambil API Key Gratis JSON2Video
1. Daftar akun gratis di [json2video.com](https://json2video.com/).
2. Masuk ke menu **API Keys** di dashboard JSON2Video, lalu salin **API Key** kamu.

#### 2. Pasang Modul JSON2Video di Make.com
1. Di sebelah kanan modul **Custom Webhook** pada Make.com, klik tanda **`+`**, cari aplikasi **JSON2Video**.
2. Pilih aksi **Create a Movie from JSON** (atau jika belum ada, gunakan modul **HTTP -> Make a request** ke `https://api.json2video.com/v2/movies`).
3. Jika menggunakan modul resmi **JSON2Video (Create a Movie from JSON)**:
   - Hubungkan akun dengan memasukkan API Key JSON2Video kamu.
   - Pada kolom **Movie JSON**, cukup masukkan 1 variabel dari Webhook:
     `payload.json2video_json_string`
   - Klik **OK**.
4. Tambahkan modul kedua dari JSON2Video tepat di sebelahnya: **Wait for a Movie to Render**:
   - Pada kolom **Project ID**, pilih variabel `project` yang keluar dari modul JSON2Video pertama.
   - Modul ini akan menunggu sekitar 20 sampai 40 detik sampai file `.mp4` selesai dibuat dan mengeluarkan variabel **`movie.url`** (link video `.mp4` yang sudah jadi).

#### 3. Kirim Video `.mp4` ke Telegram & Auto-Post ke Instagram Reels
1. Klik tanda **`+`** setelah modul *Wait for a Movie to Render*.
2. Untuk mengirim ke Telegram: pilih **HTTP / Telegram Bot -> Send a Video** dengan `video` diisi `{{3.movie.url}}` dan `caption` diisi `{{1.payload.caption}}`.
3. Untuk **Auto-Post ke Instagram Reels**:
   - **Syarat wajib dari Meta:**
     1. Ubah akun Instagram kamu menjadi akun **Professional (Creator / Business)** melalui menu *Settings -> Account type and tools -> Switch to professional account*.
     2. Hubungkan akun Instagram tersebut ke sebuah **Facebook Page (Halaman Facebook)** melalui menu *Edit Profile -> Page / Halaman* di Instagram.
   - Di Make.com, klik tanda **`+`** di ujung skenario -> pilih **Instagram for Business (Facebook Login)** -> pilih **Create a Reel Post**.
   - Klik **Add Connection** dan login ke akun Facebook yang terhubung dengan Instagram tersebut.
   - Isi konfigurasi modulnya:
     - **Page:** Pilih akun Instagram Kimia Sehari
     - **Video URL:** `{{3.movie.url}}`
     - **Caption:** `{{1.payload.caption}}`
     - **Share to Feed:** `Yes`

Setelah semua modul di Make.com terhubung:
1. Klik ikon **Save** (simpan) di bawah layar Make.com.
2. Aktifkan toggle **Scheduling** di pojok kiri bawah menjadi **ON** (`Immediately as data arrives`).

---

## Tahap 6: Jadwal Cron & Pengamanan Endpoint (Opsional tapi Disarankan)

### Jadwal Otomatis (`vercel.json`)
Di dalam file `vercel.json`, jadwal cron diatur ke `"0 6 * * *"`, artinya berjalan otomatis setiap hari pukul **06:00 UTC** (atau pukul **13:00 WIB**).
Jika kamu ingin mengubah jam tayangnya, cukup sesuaikan format UTC-nya:
- Pukul 07:00 WIB (00:00 UTC): `"0 0 * * *"`
- Pukul 09:00 WIB (02:00 UTC): `"0 2 * * *"`
- Pukul 19:00 WIB (12:00 UTC): `"0 12 * * *"`

### Mengunci Endpoint dengan `CRON_SECRET`
Setelah kamu selesai melakukan tes manual lewat browser dan yakin semuanya berjalan lancar, kamu bisa mengunci URL `/api/cron` agar tidak bisa dibuka oleh orang lain:
1. Buka dashboard project kamu di Vercel -> **Settings** -> **Environment Variables**.
2. Tambahkan variabel baru:
   - **Key:** `CRON_SECRET`
   - **Value:** Kata sandi acak buatanmu (minimal 16 karakter, contoh: `kimiaSehariSecret2026xyz`)
3. Klik **Save**, lalu masuk ke tab **Deployments** dan klik **Redeploy** pada deployment terakhir agar variabel aktif.
4. Saat jadwal harian berjalan, Vercel Cron akan otomatis mengirimkan header `Authorization: Bearer <CRON_SECRET>`, sedangkan akses liar dari browser luar tanpa header tersebut akan ditolak dengan status `401 Unauthorized`.

---

## Tahap 7: Pencegahan Topik Duplikat & Uji Coba Lokal

### 1. Cara Kerja Anti-Duplikat Otomatis (2 Lapis)
Agar Gemini tidak mengulang topik populer yang sama terus-menerus (seperti bau hujan atau tempe), `api/cron.js` sudah dilengkapi dua mekanisme:
- **Lapis 1 (Otomatis Aktif Tanpa Database):** Setiap tanggal di kalender dipetakan secara deterministik ke kombinasi 12 kategori kimia alam dan 10 sudut pandang keseharian yang berbeda.
- **Lapis 2 (Opsional dengan Upstash Redis Gratis):** Menyimpan 50 judul topik terakhir yang sudah pernah tayang dan memasukkannya ke daftar larangan prompt Gemini setiap hari.
  - Cara mengaktifkannya: Di dashboard project Vercel kamu, buka tab **Storage** -> **Create Database** -> pilih **Upstash Redis** (Gratis), lalu hubungkan ke project ini. Vercel akan otomatis mengisi `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` tanpa perlu instalasi package tambahan.

### 2. Menjalankan Tes Langsung di Komputer Lokal
Kamu bisa mengetes script kapan saja dari terminal komputermu sebelum push ke GitHub:
1. Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
2. Isi nilai `GEMINI_API_KEY` (dan variabel lainnya jika ingin mengetes pengiriman ke Telegram/Make.com) di dalam file `.env`.
3. Jalankan perintah berikut (menggunakan fitur pembacaan `.env` bawaan Node.js 20+ tanpa perlu `npm install`):
   ```bash
   npm run local
   ```

