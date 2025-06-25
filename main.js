const TelegramBot = require("node-telegram-bot-api");
const { exec } = require("child_process");
const fs = require("fs");

// === KONFIGURASI ===
const token = "7718612798:AAGa2w4c7ZtDNvx4rZfjqLmbAedW7aOIWwQ"; // Ganti token bot
const adminId = 6713780627; // Ganti ID kamu
const kontakAdmin = "@mensu_premium"; // Ganti username admin
const hargaSewa = "Rp10.000/bulan";
const gopay = "08xxxxxxxx"; // Ganti nomor GoPay

const bot = new TelegramBot(token, { polling: true });

// === CEK PREMIUM ===
function isPremium(userId) {
  if (userId === adminId) return true;
  if (!fs.existsSync("premium.json")) return false;
  const data = JSON.parse(fs.readFileSync("premium.json"));
  const user = data.find((u) => u.id === userId);
  if (!user) return false;
  return new Date(user.expiredAt) > new Date();
}

// === DAPATKAN TANGGAL EXPIRED ===
function getExpireDate(userId) {
  if (userId === adminId) return "∞ (Admin Lifetime)";
  const data = fs.existsSync("premium.json")
    ? JSON.parse(fs.readFileSync("premium.json"))
    : [];
  const user = data.find((u) => u.id === userId);
  if (!user) return "❌ Tidak terdaftar";
  const tanggal = new Date(user.expiredAt);
  return tanggal.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// === SETUJU AKSES ===
function approveUser(userId) {
  const data = fs.existsSync("premium.json")
    ? JSON.parse(fs.readFileSync("premium.json"))
    : [];
  const now = new Date();
  const expired = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const existing = data.find((u) => u.id === userId);
  if (existing) {
    existing.expiredAt = expired.toISOString();
  } else {
    data.push({ id: userId, expiredAt: expired.toISOString() });
  }
  fs.writeFileSync("premium.json", JSON.stringify(data, null, 2));
}

// === /start ===
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Selamat datang! Silakan pilih menu di bawah ini:", {
    reply_markup: {
      keyboard: [
        ["🎬 Generate Akun"],
        ["🔓 Sewa Akses", "🕒 Cek Masa Aktif"],
        ["📞 Hubungi Admin"],
      ],
      resize_keyboard: true,
    },
  });
});

// === Inline tombol khusus untuk bayar ===
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const username = query.from.username || "-";

  if (query.data === "bayar") {
    bot.sendMessage(
      chatId,
      "✅ Permintaan kamu dicatat. Tunggu persetujuan admin.",
    );
    bot.sendMessage(
      adminId,
      `📢 Permintaan Premium:\n👤 @${username}\n🆔 ID: ${userId}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "✅ Setujui Akses", callback_data: `acc_${userId}` }],
          ],
        },
      },
    );
  }

  if (query.data.startsWith("acc_") && userId === adminId) {
    const uid = parseInt(query.data.split("_")[1]);
    approveUser(uid);
    bot.sendMessage(chatId, `✅ Akses untuk ID ${uid} disetujui.`);
    bot.sendMessage(
      uid,
      "✅ Akses kamu telah disetujui. Silakan /start kembali.",
    );
  }

  bot.answerCallbackQuery(query.id);
});

// === RESPON TEXT ===
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;
  const username = msg.from.username || "-";

  if (text === "🎬 Generate Akun") {
    if (!isPremium(userId)) {
      return bot.sendMessage(chatId, "❌ Kamu belum memiliki akses premium.");
    }
    bot.sendMessage(chatId, "⏳ Sedang membuat akun...");
    exec("node index.js", (err, stdout) => {
      if (err) return bot.sendMessage(chatId, "❌ Gagal membuat akun.");
      bot.sendMessage(chatId, `✅ Akun berhasil dibuat:\n\n${stdout}`);
    });
  }

  if (text === "🔓 Sewa Akses") {
    bot.sendMessage(
      chatId,
      `💰 *Sewa Akses Premium*\n\nHarga: *${hargaSewa}*\nBayar ke: *${gopay}*\n\nSetelah bayar, klik tombol di bawah untuk minta akses.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "✅ Saya Sudah Bayar", callback_data: "bayar" }],
            [
              {
                text: "📞 Hubungi Admin",
                url: `https://t.me/${kontakAdmin.replace("@", "")}`,
              },
            ],
          ],
        },
      },
    );
  }

  if (text === "🕒 Cek Masa Aktif") {
    const masa = getExpireDate(userId);
    bot.sendMessage(chatId, `🕒 Masa Aktif Premium kamu:\n\n${masa}`);
  }

  if (text === "📞 Hubungi Admin") {
    bot.sendMessage(chatId, `📞 Hubungi admin di sini:\n${kontakAdmin}`);
  }
});
