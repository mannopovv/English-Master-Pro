/* =========================================================================
   PRO-ADMIN.JS — Ko'p foydalanuvchili (cloud) admin panel
   =========================================================================
   Bu fayl Firebase (Firestore) orqali ISHLAYDIGAN admin panelni qo'shadi.
   Ishga tushishi uchun O'ZINGIZNING Firebase loyihangiz config kodi kerak:

   1) https://console.firebase.google.com ga kiring (bepul)
   2) Yangi loyiha yarating -> "Web app" qo'shing
   3) Firestore Database ni yoqing (test rejimida boshlasa bo'ladi)
   4) Sizga beriladigan config obyektini nusxalab, ilovada
      Sozlamalar -> "Cloud admin (Firebase)" bo'limiga joylashtiring.

   Config kiritilmagan bo'lsa — bu modul hech narsaga xalaqit bermaydi,
   panel shunchaki "Firebase ulanmagan" deb ko'rsatadi.
   ========================================================================= */

(function () {
    const FIREBASE_SDK_URLS = [
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"
    ];

    let fbLoaded = false;
    let fbApp = null;
    let db = null;

    function getFirebaseConfig() {
        try {
            const raw = localStorage.getItem("firebase_config_json");
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = src;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    async function ensureFirebase() {
        const cfg = getFirebaseConfig();
        if (!cfg) return false;
        if (fbLoaded && db) return true;
        try {
            if (!window.firebase) {
                for (const url of FIREBASE_SDK_URLS) await loadScript(url);
            }
            fbApp = window.firebase.apps && window.firebase.apps.length
                ? window.firebase.app()
                : window.firebase.initializeApp(cfg);
            db = window.firebase.firestore();
            fbLoaded = true;
            return true;
        } catch (err) {
            console.error("Firebase ulanmadi:", err);
            return false;
        }
    }

    function getDeviceId() {
        let id = localStorage.getItem("device_uid");
        if (!id) {
            id = "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
            localStorage.setItem("device_uid", id);
        }
        return id;
    }

    // Shu qurilmadagi statistikani bulutga yozadi (foydalanuvchi nomi bilan)
    async function syncMyStatsToCloud() {
        const ok = await ensureFirebase();
        if (!ok) return { ok: false, reason: "no_config" };
        try {
            const uid = getDeviceId();
            const name = localStorage.getItem("user_display_name") || "Anonim";
            const payload = {
                name,
                level: localStorage.getItem("userLevel") || "-",
                xp: Number(localStorage.getItem("xp") || 0),
                coins: Number(localStorage.getItem("coins") || 0),
                streak: Number(localStorage.getItem("streak") || 0),
                premium: localStorage.getItem("isPremium") === "true",
                updatedAt: new Date().toISOString()
            };
            await db.collection("users").doc(uid).set(payload, { merge: true });
            return { ok: true };
        } catch (err) {
            console.error("Cloud sync xatosi:", err);
            return { ok: false, reason: "error" };
        }
    }

    // Barcha foydalanuvchilarni o'qiydi (XP bo'yicha tartiblangan) — haqiqiy admin ro'yxati
    async function fetchAllUsers() {
        const ok = await ensureFirebase();
        if (!ok) return null;
        try {
            const snap = await db.collection("users").orderBy("xp", "desc").limit(200).get();
            const rows = [];
            snap.forEach((doc) => rows.push({ id: doc.id, ...doc.data() }));
            return rows;
        } catch (err) {
            console.error("Foydalanuvchilarni o'qib bo'lmadi:", err);
            return null;
        }
    }

    async function renderCloudAdminPanel() {
        const container = document.getElementById("cloudAdminContainer");
        if (!container) return;
        const cfg = getFirebaseConfig();
        if (!cfg) {
            container.innerHTML = `<p class="ai-settings-hint">☁️ Firebase ulanmagan. Sozlamalar bo'limida config kiritsangiz, shu yerda BARCHA foydalanuvchilarning haqiqiy statistikasi ko'rinadi.</p>`;
            return;
        }
        container.innerHTML = `<p class="ai-settings-hint">⏳ Yuklanmoqda...</p>`;
        await syncMyStatsToCloud();
        const users = await fetchAllUsers();
        if (!users) {
            container.innerHTML = `<p class="ai-settings-hint">⚠️ Ulanishda xatolik. Firestore qoidalari (rules) va config to'g'riligini tekshiring.</p>`;
            return;
        }
        container.innerHTML = `
            <p class="ai-settings-hint">☁️ Jami foydalanuvchi: <b>${users.length}</b></p>
            <div class="admin-cloud-table-wrap">
                <table class="admin-cloud-table">
                    <thead><tr><th>#</th><th>Ism</th><th>Daraja</th><th>XP</th><th>🔥</th><th>💎</th></tr></thead>
                    <tbody>
                        ${users.map((u, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${(u.name || "Anonim")}</td>
                                <td>${u.level || "-"}</td>
                                <td>${u.xp || 0}</td>
                                <td>${u.streak || 0}</td>
                                <td>${u.premium ? "✅" : "—"}</td>
                            </tr>`).join("")}
                    </tbody>
                </table>
            </div>`;
    }

    window.ProAdmin = { getFirebaseConfig, syncMyStatsToCloud, fetchAllUsers, renderCloudAdminPanel };

    document.addEventListener("DOMContentLoaded", () => {
        const saveBtn = document.getElementById("saveFirebaseConfigBtn");
        const input = document.getElementById("firebaseConfigInput");
        const status = document.getElementById("firebaseConfigStatus");
        if (input) input.value = localStorage.getItem("firebase_config_json") || "";
        if (saveBtn) {
            saveBtn.onclick = () => {
                const val = (input.value || "").trim();
                try {
                    if (val) {
                        JSON.parse(val); // validatsiya
                        localStorage.setItem("firebase_config_json", val);
                        status.textContent = "✅ Saqlandi. Endi Admin panelda cloud ma'lumotlar ko'rinadi.";
                    } else {
                        localStorage.removeItem("firebase_config_json");
                        status.textContent = "ℹ️ Config o'chirildi.";
                    }
                } catch (e) {
                    status.textContent = "❌ JSON noto'g'ri formatda. Firebase konsolidan to'g'ri config'ni nusxalang.";
                }
            };
        }
        const refreshBtn = document.getElementById("cloudAdminRefreshBtn");
        if (refreshBtn) refreshBtn.onclick = renderCloudAdminPanel;
        renderCloudAdminPanel();
    });
})();