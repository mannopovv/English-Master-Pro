/* =========================================================================
   PRO-TELEGRAM.JS — Telegram bot orqali natija/eslatma yuborish
   =========================================================================
   Ishlashi uchun SIZGA kerak:
   1) Telegram'da @BotFather ga /newbot yuboring -> Bot Token oling
   2) O'z Chat ID'ingizni bilish uchun @userinfobot ga yozing (u sizga
      raqamli ID qaytaradi)
   3) Sozlamalar -> "Telegram bot" bo'limiga Token va Chat ID'ni kiriting

   Bular kiritilmagan bo'lsa — tugmalar "sozlanmagan" deb ko'rsatadi,
   hech narsani buzmaydi.
   ========================================================================= */

(function () {
    function getTelegramConfig() {
        return {
            token: localStorage.getItem("tg_bot_token") || "",
            chatId: localStorage.getItem("tg_chat_id") || ""
        };
    }

    async function sendTelegramMessage(text) {
        const { token, chatId } = getTelegramConfig();
        if (!token || !chatId) return { ok: false, reason: "no_config" };
        try {
            const url = `https://api.telegram.org/bot${token}/sendMessage`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" })
            });
            const data = await res.json();
            return { ok: !!data.ok, data };
        } catch (err) {
            console.error("Telegram xatosi:", err);
            return { ok: false, reason: "error" };
        }
    }

    function buildProgressMessage() {
        const xp = localStorage.getItem("xp") || 0;
        const streak = localStorage.getItem("streak") || 0;
        const level = localStorage.getItem("userLevel") || "-";
        const name = localStorage.getItem("user_display_name") || "Foydalanuvchi";
        return `📊 <b>English Master AI — Progress</b>\n👤 ${name}\n⭐ XP: ${xp}\n🔥 Streak: ${streak} kun\n📈 Daraja: ${level}`;
    }

    async function sendMyProgress() {
        const statusEl = document.getElementById("telegramSendStatus");
        if (statusEl) statusEl.textContent = "⏳ Yuborilmoqda...";
        const res = await sendTelegramMessage(buildProgressMessage());
        if (statusEl) {
            statusEl.textContent = res.ok
                ? "✅ Yuborildi! Telegramni tekshiring."
                : (res.reason === "no_config"
                    ? "⚠️ Avval Token va Chat ID kiriting."
                    : "❌ Yuborib bo'lmadi. Token/Chat ID to'g'riligini tekshiring.");
        }
    }

    window.ProTelegram = { sendTelegramMessage, sendMyProgress, getTelegramConfig };

    document.addEventListener("DOMContentLoaded", () => {
        const cfg = getTelegramConfig();
        const tokenIn = document.getElementById("tgBotTokenInput");
        const chatIn = document.getElementById("tgChatIdInput");
        if (tokenIn) tokenIn.value = cfg.token;
        if (chatIn) chatIn.value = cfg.chatId;

        const saveBtn = document.getElementById("saveTelegramConfigBtn");
        if (saveBtn) {
            saveBtn.onclick = () => {
                const t = tokenIn.value.trim();
                const c = chatIn.value.trim();
                if (t) localStorage.setItem("tg_bot_token", t); else localStorage.removeItem("tg_bot_token");
                if (c) localStorage.setItem("tg_chat_id", c); else localStorage.removeItem("tg_chat_id");
                document.getElementById("telegramConfigStatus").textContent = "✅ Saqlandi.";
            };
        }
        const sendBtn = document.getElementById("sendTelegramProgressBtn");
        if (sendBtn) sendBtn.onclick = sendMyProgress;
    });
})();