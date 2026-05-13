# 🤖 WhatsApp AI Bot (Groq + Baileys)

Bot WhatsApp sederhana yang membalas pesan otomatis menggunakan AI dari Groq.

---

## 📋 Persyaratan

- **Node.js** versi 18 ke atas → [Download di sini](https://nodejs.org)
- **Akun Groq** (gratis) → [Daftar di sini](https://console.groq.com)
- **WhatsApp** aktif di HP kamu

---

## 🚀 Cara Install & Jalankan

### Langkah 1: Install Node.js
Download dan install Node.js dari https://nodejs.org (pilih versi LTS)

### Langkah 2: Install semua module
Buka terminal/command prompt di folder ini, lalu jalankan:
```
npm install
```

### Langkah 3: Isi API Key Groq
1. Buka file `.env.example`
2. Rename/salin menjadi `.env`
3. Dapatkan API key Groq di: https://console.groq.com/keys
4. Isi file `.env` seperti contoh:

```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PHONE_NUMBER=628xxxxxxxxxx
```

> ⚠️ PHONE_NUMBER diisi nomor WhatsApp kamu, format internasional tanpa + 
> Contoh: 6281234567890 (bukan +6281234567890)

### Langkah 4: Jalankan bot
```
node index.js
```

### Langkah 5: Hubungkan WhatsApp
1. Setelah menjalankan bot, akan muncul **PAIRING CODE** di terminal
2. Buka WhatsApp di HP kamu
3. Ketuk **titik tiga (⋮)** → **Perangkat Tertaut**
4. Ketuk **Tautkan Perangkat**
5. Ketuk **"Tautkan dengan nomor telepon"**
6. Masukkan kode yang muncul di terminal
7. Bot siap digunakan! ✅

---

## 📁 Struktur File

```
whatsapp-bot/
├── index.js          ← File utama bot
├── package.json      ← Konfigurasi project & dependencies
├── .env              ← API key & nomor HP (JANGAN dibagikan!)
├── .env.example      ← Contoh file .env
├── README.md         ← Panduan ini
└── session/          ← Folder sesi login (dibuat otomatis)
```

---

## ⚠️ Catatan Penting

- File `.env` berisi data sensitif, **jangan dibagikan** ke siapapun
- Folder `session/` menyimpan login kamu. Jika dihapus, harus login ulang
- Bot hanya membalas pesan **pribadi**, pesan grup diabaikan
- Jika bot disconnect, akan otomatis reconnect

---

## 🛠️ Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `Cannot find module` | Jalankan `npm install` lagi |
| Pairing code tidak muncul | Pastikan PHONE_NUMBER sudah diisi di .env |
| Bot tidak balas | Periksa GROQ_API_KEY di .env |
| Session error | Hapus folder `session/` dan jalankan ulang |
