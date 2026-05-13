import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";
import axios from "axios";
import dotenv from "dotenv";
import pino from "pino";
import { Boom } from "@hapi/boom";
import { existsSync, mkdirSync } from "fs";

// Load environment variables dari file .env
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const PHONE_NUMBER = process.env.PHONE_NUMBER;

// Folder untuk menyimpan sesi login
const SESSION_FOLDER = "./session";
if (!existsSync(SESSION_FOLDER)) {
  mkdirSync(SESSION_FOLDER, { recursive: true });
}

// Fungsi untuk mendapatkan balasan dari Groq AI
async function getGroqReply(userMessage) {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content:
              "Kamu adalah asisten WhatsApp yang ramah dan helpful. Jawab dengan singkat, padat, dan jelas dalam bahasa yang sama dengan pengguna.",
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("❌ Error dari Groq API:", error.message);
    return "Maaf, saya sedang mengalami gangguan. Coba lagi nanti ya!";
  }
}

// Fungsi utama untuk menjalankan bot
async function startBot() {
  // Load/buat state autentikasi dari folder session
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER);

  // Ambil versi Baileys terbaru
  const { version } = await fetchLatestBaileysVersion();
  console.log(`📦 Menggunakan Baileys versi: ${version.join(".")}`);

  // Buat koneksi WhatsApp
  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }), // Sembunyikan log yang tidak perlu
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
    },
    printQRInTerminal: false, // Kita pakai pairing code, bukan QR
    browser: ["WhatsApp AI Bot", "Chrome", "1.0.0"],
  });

  // Jika belum login, minta pairing code
  if (!sock.authState.creds.registered) {
    if (!PHONE_NUMBER) {
      console.error("❌ PHONE_NUMBER belum diisi di file .env!");
      process.exit(1);
    }

    // Tunggu sebentar sebelum meminta pairing code
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const code = await sock.requestPairingCode(PHONE_NUMBER);
    console.log("\n==========================================");
    console.log(`🔑 PAIRING CODE kamu: ${code}`);
    console.log("==========================================");
    console.log("📱 Cara pakai:");
    console.log("   1. Buka WhatsApp di HP kamu");
    console.log("   2. Ketuk titik tiga > Perangkat Tertaut");
    console.log("   3. Ketuk Tautkan Perangkat");
    console.log("   4. Ketuk 'Tautkan dengan nomor telepon'");
    console.log(`   5. Masukkan kode: ${code}`);
    console.log("==========================================\n");
  }

  // Event: Update koneksi
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const shouldReconnect =
        new Boom(lastDisconnect?.error)?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("🔌 Koneksi terputus.");

      if (shouldReconnect) {
        console.log("🔄 Mencoba reconnect...");
        startBot(); // Reconnect otomatis
      } else {
        console.log("🚪 Keluar dari WhatsApp. Hapus folder session dan jalankan ulang.");
      }
    } else if (connection === "open") {
      console.log("\n✅ Bot berhasil terhubung ke WhatsApp!");
      console.log("🤖 Bot siap menerima pesan...\n");
    } else if (connection === "connecting") {
      console.log("⏳ Menghubungkan ke WhatsApp...");
    }
  });

  // Event: Simpan kredensial saat ada perubahan
  sock.ev.on("creds.update", saveCreds);

  // Event: Menerima pesan baru
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    // Hanya proses pesan baru (bukan history)
    if (type !== "notify") return;

    for (const msg of messages) {
      // Abaikan pesan dari bot sendiri
      if (msg.key.fromMe) continue;

      const jid = msg.key.remoteJid;

      // ❌ Abaikan pesan dari grup
      if (jid.endsWith("@g.us")) {
        console.log(`[GRUP DIABAIKAN] ${jid}`);
        continue;
      }

      // ✅ Hanya proses pesan pribadi
      if (jid.endsWith("@s.whatsapp.net")) {
        // Ambil isi pesan teks
        const userMessage =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          null;

        if (!userMessage) continue; // Abaikan jika bukan pesan teks

        const senderNumber = jid.replace("@s.whatsapp.net", "");
        console.log(`📩 Pesan dari ${senderNumber}: ${userMessage}`);

        try {
          // Tampilkan indikator "sedang mengetik..."
          await sock.sendPresenceUpdate("composing", jid);

          // Dapatkan balasan dari AI
          const aiReply = await getGroqReply(userMessage);

          // Kirim balasan
          await sock.sendMessage(jid, { text: aiReply });

          // Hentikan indikator mengetik
          await sock.sendPresenceUpdate("paused", jid);

          console.log(`✅ Balas ke ${senderNumber}: ${aiReply}\n`);
        } catch (error) {
          console.error("❌ Gagal mengirim pesan:", error.message);
        }
      }
    }
  });
}

// Jalankan bot
console.log("🚀 Memulai WhatsApp AI Bot...");
startBot().catch((err) => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});
