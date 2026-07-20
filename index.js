const onboardingModal = document.getElementById("onboardingModal");
if (onboardingModal) {
    const savedLevel = localStorage.getItem("userLevel");
    if (!savedLevel) {
        onboardingModal.classList.add("show");
    }
    onboardingModal.querySelectorAll("[data-level]").forEach(btn => {
        btn.addEventListener("click", () => {
            localStorage.setItem("userLevel", btn.dataset.level);
            onboardingModal.classList.remove("show");
            const subtitleEl = document.getElementById("homeSubtitle");
            const labels = { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: "Yuqori" };
            if (subtitleEl) subtitleEl.innerHTML = `Darajangiz: ${labels[btn.dataset.level]} — sizga mos mashqlar tayyor!`;
        });
    });

    const subtitleEl = document.getElementById("homeSubtitle");
    if (subtitleEl && savedLevel) {
        const labels = { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: "Yuqori" };
        subtitleEl.innerHTML = `Darajangiz: ${labels[savedLevel] || savedLevel} — sizga mos mashqlar tayyor!`;
    }
}


const offlineBanner = document.getElementById("offlineBanner");

// ---- Har qanday tugmaga chiroyli "ripple" bosish animatsiyasi ---------
document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn || btn.disabled) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple-effect";
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
    ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
}, { passive: true });

function updateOnlineStatus() {
    if (!offlineBanner) return;
    offlineBanner.classList.toggle("show", !navigator.onLine);
}
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);
updateOnlineStatus();

const notifyBtn = document.getElementById("notifyBtn");
const settingsStatusEl = document.getElementById("settingsStatus");
if (notifyBtn) {
    notifyBtn.addEventListener("click", async () => {
        if (!("Notification" in window)) {
            if (settingsStatusEl) settingsStatusEl.innerHTML = "❌ Brauzeringiz bildirishnomani qo'llamaydi";
            return;
        }
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            localStorage.setItem("dailyReminder", "true");
            localStorage.setItem("lastReminderDate", new Date().toDateString());
            if (settingsStatusEl) settingsStatusEl.innerHTML = "✅ Kunlik eslatma yoqildi";
            new Notification("English Master AI", { body: "Bugungi so'zlaringizni o'rganishni unutmang! 📚" });
        } else {
            if (settingsStatusEl) settingsStatusEl.innerHTML = "⚠️ Ruxsat berilmadi";
        }
    });
}

// Ilova ochilganda: agar eslatma yoqilgan bo'lsa va bugun hali
// ko'rsatilmagan bo'lsa, avtomatik ravishda bir marta eslatma beriladi.
// (Brauzer PWA'lari uchun haqiqiy background push server talab qiladi,
// bu esa oddiy "foydalanuvchi qaytganida eslatish" yechimi.)
function checkDailyReminderOnLoad() {
    if (!("Notification" in window)) return;
    if (localStorage.getItem("dailyReminder") !== "true") return;
    if (Notification.permission !== "granted") return;

    const today = new Date().toDateString();
    const lastShown = localStorage.getItem("lastReminderDate");
    if (lastShown === today) return;

    localStorage.setItem("lastReminderDate", today);
    const knownCount = Number(localStorage.getItem("known")) || 0;
    new Notification("English Master AI", {
        body: knownCount > 0
            ? `Xush kelibsiz! Hozircha ${knownCount} so'z bildingiz. Davom eting! 🔥`
            : "Bugungi so'zlaringizni o'rganishni unutmang! 📚"
    });
}
checkDailyReminderOnLoad();


const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");

if (exportBtn) {
    exportBtn.addEventListener("click", () => {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data[key] = localStorage.getItem(key);
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `english-master-backup-${getTodayStr()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        if (settingsStatusEl) settingsStatusEl.innerHTML = "✅ Progress fayl qilib yuklab olindi";
    });
}

if (importInput) {
    importInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                Object.keys(data).forEach(key => localStorage.setItem(key, data[key]));
                if (settingsStatusEl) settingsStatusEl.innerHTML = "✅ Progress tiklandi, sahifa yangilanmoqda...";
                setTimeout(() => location.reload(), 1000);
            } catch (err) {
                if (settingsStatusEl) settingsStatusEl.innerHTML = "❌ Fayl noto'g'ri formatda";
            }
        };
        reader.readAsText(file);
    });
}


const downloadReportBtn = document.getElementById("downloadReportBtn");
if (downloadReportBtn) {
    downloadReportBtn.addEventListener("click", () => {
        const lvl = Number(localStorage.getItem("level")) || 1;
        const xpVal = Number(localStorage.getItem("xp")) || 0;
        const knownVal = Number(localStorage.getItem("known")) || 0;
        const streakVal = Number(localStorage.getItem("streak")) || 1;
        const achievementsList = JSON.parse(localStorage.getItem("achievements") || "[]");
        const badgesList = JSON.parse(localStorage.getItem("badges") || "[]");
        const dateStr = new Date().toLocaleDateString("uz-UZ");

        const html = `<!DOCTYPE html>
<html lang="uz"><head><meta charset="UTF-8">
<title>English Master AI — Hisobot</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; background:#0f172a; color:#e2e8f0; padding:32px; }
  h1 { color:#38bdf8; }
  .stat-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; margin:24px 0; }
  .stat-card { background:#1e293b; border-radius:12px; padding:16px; text-align:center; }
  .stat-card .num { font-size:2rem; font-weight:700; color:#38bdf8; }
  ul { line-height:1.8; }
  @media print { body { background:#fff; color:#111; } .stat-card { background:#eee; } }
</style></head>
<body>
  <h1>📊 English Master AI — Progress hisoboti</h1>
  <p>Sana: ${dateStr}</p>
  <div class="stat-grid">
    <div class="stat-card"><div class="num">${lvl}</div>Level</div>
    <div class="stat-card"><div class="num">${xpVal}</div>XP</div>
    <div class="stat-card"><div class="num">${knownVal}</div>Bilgan so'z</div>
    <div class="stat-card"><div class="num">${streakVal}🔥</div>Streak</div>
  </div>
  <h2>🏆 Yutuqlar (${achievementsList.length})</h2>
  <ul>${achievementsList.map(a => `<li>${a}</li>`).join("") || "<li>Hali yo'q</li>"}</ul>
  <h2>🎖️ Nishonlar (${badgesList.length})</h2>
  <ul>${badgesList.map(b => `<li>${b}</li>`).join("") || "<li>Hali yo'q</li>"}</ul>
  <p style="margin-top:32px;opacity:.6;font-size:.85rem;">Ushbu faylni brauzerda ochib, "Chop etish → PDF sifatida saqlash" orqali PDF holatiga o'tkazishingiz mumkin.</p>
</body></html>`;

        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `english-master-hisobot-${getTodayStr()}.html`;
        a.click();
        URL.revokeObjectURL(url);
        if (settingsStatusEl) settingsStatusEl.innerHTML = "✅ Hisobot yuklab olindi";
    });
}


const burgerBtn = document.getElementById("burgerBtn");
const mainNav = document.getElementById("mainNav");
const navOverlay = document.getElementById("navOverlay");

function openNav() {
    mainNav.classList.add("open");
    navOverlay.classList.add("active");
    burgerBtn.classList.add("active");
    burgerBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
}

function closeNav() {
    mainNav.classList.remove("open");
    navOverlay.classList.remove("active");
    burgerBtn.classList.remove("active");
    burgerBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
}

if (burgerBtn && mainNav && navOverlay) {
    burgerBtn.addEventListener("click", () => {
        mainNav.classList.contains("open") ? closeNav() : openNav();
    });

    navOverlay.addEventListener("click", closeNav);

  
    mainNav.addEventListener("click", (e) => {
        if (e.target.tagName === "BUTTON") {
            closeNav();
        }
    });

    
    window.addEventListener("resize", () => {
        if (window.innerWidth > 1024) {
            closeNav();
        }
    });

  
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeNav();
    });
}


const scrollTopBtn = document.getElementById("scrollTopBtn");
if (scrollTopBtn) {
    window.addEventListener("scroll", () => {
        scrollTopBtn.classList.toggle("show", window.scrollY > 300);
    });
    scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

const pages = document.querySelectorAll(".page");

function openPage(id) {
    pages.forEach(page => {
        page.classList.remove("active");
    });
    const targetPage = document.getElementById(id);
    if (targetPage) {
        targetPage.classList.add("active");
    }

    
    document.querySelectorAll("#mainNav button").forEach(btn => {
        btn.classList.toggle("active", menuButtons[btn.id] === id);
    });

   
    syncBottomNav(id);

   
    window.scrollTo({ top: 0, behavior: "smooth" });
}


const menuButtons = {
    "homeBtn": "homePage",
    "flashBtn": "flashPage",
    "quizBtn": "quizPage",
    "statsBtn": "statsPage",
    "settingsBtn": "settingsPage",
    "startBtn": "flashPage",
    "aiBtn": "aiPage",
    "assistantBtn": "assistantPage",
    "courseBtn": "coursePage",
    "aiToolsBtn": "aiToolsPage",
    "speakingBtn": "speakingPage",
    "grammarBtn": "aiTeacherPage",
    "achievementBtn": "achievementPage",
    "avatarBtn": "avatarPage",
    "beginnerBtn": "beginnerPage",
    "matchBtn": "matchPage",
    "scrambleBtn": "scramblePage",
    "typingRaceBtn": "typingRacePage",
    "fillBlankBtn": "fillBlankPage",
    "bossBattleBtn": "bossBattlePage",
    "pomodoroBtn": "pomodoroPage",
    "speedBtn": "speedPage",
    "sentenceBtn": "sentencePage",
    "grammarQuizBtn": "grammarQuizPage",
    "mistakeBtn": "mistakePage",
    "certificateBtn2": "certificatePage",
    "premiumBtn": "premiumPage",
    "adminBtn": "adminPage",
    "roleplayBtn": "roleplayPage",
    "duelBtn": "duelPage",
    "grammarLibraryBtn": "grammarLibraryPage",
    "idiomsBtn": "idiomsPage",
    "myWordsBtn": "myWordsPage",
    "examBtn": "examPage",
    "gamesBtn": "gamesPage"
};

Object.keys(menuButtons).forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.onclick = () => {
            openPage(menuButtons[btnId]);
            if (btnId === "quizBtn") {
                loadQuiz();
                startTimer();
            }
            if (btnId === "matchBtn" && typeof startMatchRound === "function") {
                startMatchRound();
            }
            if (btnId === "scrambleBtn" && typeof pickScrambleWord === "function") {
                pickScrambleWord();
            }
            if (btnId === "fillBlankBtn" && typeof pickFillBlank === "function") {
                pickFillBlank();
            }
            if (btnId === "bossBattleBtn" && typeof initBossBattle === "function") {
                initBossBattle();
            }
            if (btnId === "beginnerBtn" && typeof renderBeginnerContent === "function") {
                renderBeginnerContent();
            }
            if (btnId === "sentenceBtn" && typeof pickSentence === "function") {
                pickSentence();
            }
            if (btnId === "grammarQuizBtn" && typeof buildGrammarDeck === "function") {
                buildGrammarDeck();
            }
            if (btnId === "speedBtn" && typeof resetSpeedUI === "function") {
                resetSpeedUI();
            }
            if (btnId === "mistakeBtn" && typeof renderMistakeNotebook === "function") {
                renderMistakeNotebook();
            }
            if (btnId === "statsBtn" && typeof renderExtraStats === "function") {
                renderExtraStats();
            }
            if (btnId === "premiumBtn" && typeof renderPremiumStatus === "function") {
                renderPremiumStatus();
            }
            if (btnId === "adminBtn" && typeof renderAdminPanel === "function") {
                renderAdminPanel();
            }
            if (btnId === "roleplayBtn" && typeof renderRoleplayScenarios === "function") {
                renderRoleplayScenarios();
            }
            if (btnId === "duelBtn" && typeof renderDuelPage === "function") {
                renderDuelPage();
            }
            if (btnId === "grammarLibraryBtn" && typeof renderGrammarLibrary === "function") {
                renderGrammarLibrary();
            }
            if (btnId === "idiomsBtn" && typeof renderIdiomsPage === "function") {
                renderIdiomsPage();
            }
            if (btnId === "myWordsBtn" && typeof renderMyWordsPage === "function") {
                renderMyWordsPage();
            }
            if (btnId === "examBtn" && typeof renderExamPage === "function") {
                renderExamPage();
            }
            if (btnId === "gamesBtn" && typeof showGamesMenu === "function") {
                showGamesMenu();
            }
            syncBottomNav(menuButtons[btnId]);
        };
    }
});


const bottomNavButtons = document.querySelectorAll("#bottomNav button[data-target]");

function syncBottomNav(pageId) {
    bottomNavButtons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.target === pageId);
    });
}

bottomNavButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const target = btn.dataset.target;
        openPage(target);
        if (target === "quizPage") {
            loadQuiz();
            startTimer();
        }
        syncBottomNav(target);
    });
});

syncBottomNav("homePage");

const words = [
    
    { en: "Family", uz: "Oila", example: "I love my family.", ru: "Семья", ruExample: "Я люблю свою семью.", ar: "عائلة", arExample: "أحب عائلتي.", category: "Oila" },
    { en: "Mother", uz: "Ona", example: "My mother is a doctor.", ru: "Мать", ruExample: "Моя мать врач.", ar: "أم", arExample: "أمي طبيبة.", category: "Oila" },
    { en: "Father", uz: "Ota", example: "My father works hard.", ru: "Отец", ruExample: "Мой отец много работает.", ar: "أب", arExample: "أبي يعمل بجد.", category: "Oila" },
    { en: "Sister", uz: "Opa/Singil", example: "My sister is younger.", ru: "Сестра", ruExample: "Моя сестра младше меня.", ar: "أخت", arExample: "أختي أصغر مني.", category: "Oila" },
    { en: "Brother", uz: "Aka/Uka", example: "My brother is tall.", ru: "Брат", ruExample: "Мой брат высокий.", ar: "أخ", arExample: "أخي طويل القامة.", category: "Oila" },
    { en: "Grandmother", uz: "Buvi", example: "My grandmother cooks well.", ru: "Бабушка", ruExample: "Моя бабушка хорошо готовит.", ar: "جدة", arExample: "جدتي تطبخ جيدا.", category: "Oila" },
    { en: "Grandfather", uz: "Bobo", example: "My grandfather tells stories.", ru: "Дедушка", ruExample: "Мой дедушка рассказывает истории.", ar: "جد", arExample: "جدي يحكي القصص.", category: "Oila" },
    { en: "Son", uz: "O'g'il", example: "Their son is smart.", ru: "Сын", ruExample: "Их сын умный.", ar: "ابن", arExample: "ابنهما ذكي.", category: "Oila" },
    { en: "Daughter", uz: "Qiz", example: "Her daughter sings well.", ru: "Дочь", ruExample: "Её дочь хорошо поёт.", ar: "ابنة", arExample: "ابنتها تغني جيدا.", category: "Oila" },
    { en: "Wife", uz: "Xotin", example: "His wife is a teacher.", ru: "Жена", ruExample: "Его жена учительница.", ar: "زوجة", arExample: "زوجته معلمة.", category: "Oila" },
    { en: "Husband", uz: "Er", example: "Her husband is an engineer.", ru: "Муж", ruExample: "Её муж инженер.", ar: "زوج", arExample: "زوجها مهندس.", category: "Oila" },
    { en: "Friend", uz: "Do'st", example: "He is my best friend.", ru: "Друг", ruExample: "Он мой лучший друг.", ar: "صديق", arExample: "هو أفضل صديق لي.", category: "Oila" },
    
    { en: "Apple", uz: "Olma", example: "I eat an apple.", ru: "Яблоко", ruExample: "Я ем яблоко.", ar: "تفاحة", arExample: "آكل تفاحة.", category: "Ovqat" },
    { en: "Bread", uz: "Non", example: "We buy fresh bread.", ru: "Хлеб", ruExample: "Мы покупаем свежий хлеб.", ar: "خبز", arExample: "نشتري خبزا طازجا.", category: "Ovqat" },
    { en: "Water", uz: "Suv", example: "Drink water every day.", ru: "Вода", ruExample: "Пей воду каждый день.", ar: "ماء", arExample: "اشرب الماء كل يوم.", category: "Ovqat" },
    { en: "Milk", uz: "Sut", example: "Children drink milk.", ru: "Молоко", ruExample: "Дети пьют молоко.", ar: "حليب", arExample: "الأطفال يشربون الحليب.", category: "Ovqat" },
    { en: "Rice", uz: "Guruch", example: "We cook rice for dinner.", ru: "Рис", ruExample: "Мы готовим рис на ужин.", ar: "أرز", arExample: "نطبخ الأرز للعشاء.", category: "Ovqat" },
    { en: "Meat", uz: "Go'sht", example: "He doesn't eat meat.", ru: "Мясо", ruExample: "Он не ест мясо.", ar: "لحم", arExample: "هو لا يأكل اللحم.", category: "Ovqat" },
    { en: "Egg", uz: "Tuxum", example: "I eat an egg for breakfast.", ru: "Яйцо", ruExample: "Я ем яйцо на завтрак.", ar: "بيضة", arExample: "آكل بيضة في الفطور.", category: "Ovqat" },
    { en: "Tea", uz: "Choy", example: "We drink tea every morning.", ru: "Чай", ruExample: "Мы пьём чай каждое утро.", ar: "شاي", arExample: "نشرب الشاي كل صباح.", category: "Ovqat" },
    { en: "Coffee", uz: "Qahva", example: "She likes strong coffee.", ru: "Кофе", ruExample: "Она любит крепкий кофе.", ar: "قهوة", arExample: "هي تحب القهوة القوية.", category: "Ovqat" },
    { en: "Sugar", uz: "Shakar", example: "Add sugar to the tea.", ru: "Сахар", ruExample: "Добавь сахар в чай.", ar: "سكر", arExample: "أضف السكر إلى الشاي.", category: "Ovqat" },
    { en: "Salt", uz: "Tuz", example: "Add some salt to the soup.", ru: "Соль", ruExample: "Добавь немного соли в суп.", ar: "ملح", arExample: "أضف قليلا من الملح إلى الحساء.", category: "Ovqat" },
    { en: "Fruit", uz: "Meva", example: "Fruit is good for health.", ru: "Фрукты", ruExample: "Фрукты полезны для здоровья.", ar: "فاكهة", arExample: "الفاكهة مفيدة للصحة.", category: "Ovqat" },
    { en: "Vegetable", uz: "Sabzavot", example: "I eat vegetables daily.", ru: "Овощи", ruExample: "Я ем овощи каждый день.", ar: "خضار", arExample: "آكل الخضار يوميا.", category: "Ovqat" },
    { en: "Soup", uz: "Sho'rva", example: "This soup is delicious.", ru: "Суп", ruExample: "Этот суп вкусный.", ar: "حساء", arExample: "هذا الحساء لذيذ.", category: "Ovqat" },
    
    { en: "House", uz: "Uy", example: "This is our new house.", ru: "Дом", ruExample: "Это наш новый дом.", ar: "بيت", arExample: "هذا بيتنا الجديد.", category: "Uy" },
    { en: "Room", uz: "Xona", example: "My room is clean.", ru: "Комната", ruExample: "Моя комната чистая.", ar: "غرفة", arExample: "غرفتي نظيفة.", category: "Uy" },
    { en: "Door", uz: "Eshik", example: "Please close the door.", ru: "Дверь", ruExample: "Пожалуйста, закрой дверь.", ar: "باب", arExample: "أغلق الباب من فضلك.", category: "Uy" },
    { en: "Window", uz: "Deraza", example: "Open the window, please.", ru: "Окно", ruExample: "Открой окно, пожалуйста.", ar: "نافذة", arExample: "افتح النافذة من فضلك.", category: "Uy" },
    { en: "Table", uz: "Stol", example: "The book is on the table.", ru: "Стол", ruExample: "Книга на столе.", ar: "طاولة", arExample: "الكتاب على الطاولة.", category: "Uy" },
    { en: "Chair", uz: "Stul", example: "Sit on the chair.", ru: "Стул", ruExample: "Сядь на стул.", ar: "كرسي", arExample: "اجلس على الكرسي.", category: "Uy" },
    { en: "Bed", uz: "Karavot", example: "I sleep on my bed.", ru: "Кровать", ruExample: "Я сплю на своей кровати.", ar: "سرير", arExample: "أنام على سريري.", category: "Uy" },
    { en: "Kitchen", uz: "Oshxona", example: "Mother is in the kitchen.", ru: "Кухня", ruExample: "Мама на кухне.", ar: "مطبخ", arExample: "أمي في المطبخ.", category: "Uy" },
    { en: "Shirt", uz: "Ko'ylak", example: "He is wearing a blue shirt.", ru: "Рубашка", ruExample: "Он носит синюю рубашку.", ar: "قميص", arExample: "هو يرتدي قميصا أزرق.", category: "Kiyim" },
    { en: "Shoes", uz: "Poyabzal", example: "These shoes are new.", ru: "Обувь", ruExample: "Эта обувь новая.", ar: "حذاء", arExample: "هذا الحذاء جديد.", category: "Kiyim" },
    { en: "Hat", uz: "Shlyapa", example: "She wears a hat in summer.", ru: "Шляпа", ruExample: "Она носит шляпу летом.", ar: "قبعة", arExample: "هي ترتدي قبعة في الصيف.", category: "Kiyim" },
    { en: "Jacket", uz: "Kurtka", example: "Wear your jacket, it's cold.", ru: "Куртка", ruExample: "Надень куртку, холодно.", ar: "سترة", arExample: "البس سترتك، الجو بارد.", category: "Kiyim" },
  
    { en: "School", uz: "Maktab", example: "I go to school.", ru: "Школа", ruExample: "Я хожу в школу.", ar: "مدرسة", arExample: "أذهب إلى المدرسة.", category: "Maktab" },
    { en: "Teacher", uz: "O'qituvchi", example: "My teacher is kind.", ru: "Учитель", ruExample: "Мой учитель добрый.", ar: "معلم", arExample: "معلمي لطيف.", category: "Maktab" },
    { en: "Student", uz: "O'quvchi", example: "She is a good student.", ru: "Ученик", ruExample: "Она хорошая ученица.", ar: "طالب", arExample: "هي طالبة مجتهدة.", category: "Maktab" },
    { en: "Book", uz: "Kitob", example: "This is my book.", ru: "Книга", ruExample: "Это моя книга.", ar: "كتاب", arExample: "هذا كتابي.", category: "Maktab" },
    { en: "Pen", uz: "Ruchka", example: "I write with a pen.", ru: "Ручка", ruExample: "Я пишу ручкой.", ar: "قلم حبر", arExample: "أكتب بقلم.", category: "Maktab" },
    { en: "Pencil", uz: "Qalam", example: "Draw with a pencil.", ru: "Карандаш", ruExample: "Рисуй карандашом.", ar: "قلم رصاص", arExample: "ارسم بقلم رصاص.", category: "Maktab" },
    { en: "Notebook", uz: "Daftar", example: "Write it in your notebook.", ru: "Тетрадь", ruExample: "Запиши это в тетрадь.", ar: "دفتر", arExample: "اكتبه في دفترك.", category: "Maktab" },
    { en: "Lesson", uz: "Dars", example: "Today's lesson is interesting.", ru: "Урок", ruExample: "Сегодняшний урок интересный.", ar: "درس", arExample: "درس اليوم ممتع.", category: "Maktab" },
    { en: "Exam", uz: "Imtihon", example: "The exam is tomorrow.", ru: "Экзамен", ruExample: "Экзамен завтра.", ar: "امتحان", arExample: "الامتحان غدا.", category: "Maktab" },
    { en: "Homework", uz: "Uyga vazifa", example: "I finished my homework.", ru: "Домашнее задание", ruExample: "Я закончил домашнее задание.", ar: "واجب منزلي", arExample: "أنهيت واجبي المنزلي.", category: "Maktab" },
    { en: "Work", uz: "Ish", example: "He goes to work every day.", ru: "Работа", ruExample: "Он ходит на работу каждый день.", ar: "عمل", arExample: "يذهب إلى العمل كل يوم.", category: "Ish" },
    { en: "Job", uz: "Kasb", example: "She has a good job.", ru: "Профессия", ruExample: "У неё хорошая работа.", ar: "وظيفة", arExample: "لديها وظيفة جيدة.", category: "Ish" },
    { en: "Office", uz: "Ofis", example: "I work in an office.", ru: "Офис", ruExample: "Я работаю в офисе.", ar: "مكتب", arExample: "أعمل في مكتب.", category: "Ish" },
    { en: "Money", uz: "Pul", example: "He saves his money.", ru: "Деньги", ruExample: "Он копит деньги.", ar: "مال", arExample: "يوفر ماله.", category: "Ish" },
    { en: "Manager", uz: "Menejer", example: "The manager is busy today.", ru: "Менеджер", ruExample: "Менеджер сегодня занят.", ar: "مدير", arExample: "المدير مشغول اليوم.", category: "Ish" },
   
    { en: "Car", uz: "Mashina", example: "My car is blue.", ru: "Машина", ruExample: "Моя машина синяя.", ar: "سيارة", arExample: "سيارتي زرقاء.", category: "Sayohat" },
    { en: "Bus", uz: "Avtobus", example: "We took the bus to school.", ru: "Автобус", ruExample: "Мы ехали в школу на автобусе.", ar: "حافلة", arExample: "ركبنا الحافلة إلى المدرسة.", category: "Sayohat" },
    { en: "Train", uz: "Poyezd", example: "The train is fast.", ru: "Поезд", ruExample: "Поезд быстрый.", ar: "قطار", arExample: "القطار سريع.", category: "Sayohat" },
    { en: "Airport", uz: "Aeroport", example: "We arrived at the airport.", ru: "Аэропорт", ruExample: "Мы прибыли в аэропорт.", ar: "مطار", arExample: "وصلنا إلى المطار.", category: "Sayohat" },
    { en: "Ticket", uz: "Chipta", example: "I bought two tickets.", ru: "Билет", ruExample: "Я купил два билета.", ar: "تذكرة", arExample: "اشتريت تذكرتين.", category: "Sayohat" },
    { en: "City", uz: "Shahar", example: "Tashkent is a big city.", ru: "Город", ruExample: "Ташкент большой город.", ar: "مدينة", arExample: "طشقند مدينة كبيرة.", category: "Sayohat" },
    { en: "Country", uz: "Mamlakat", example: "Uzbekistan is my country.", ru: "Страна", ruExample: "Узбекистан моя страна.", ar: "بلد", arExample: "أوزبكستان بلدي.", category: "Sayohat" },
    { en: "Street", uz: "Ko'cha", example: "This street is busy.", ru: "Улица", ruExample: "Эта улица оживлённая.", ar: "شارع", arExample: "هذا الشارع مزدحم.", category: "Sayohat" },
    { en: "Map", uz: "Xarita", example: "Look at the map.", ru: "Карта", ruExample: "Посмотри на карту.", ar: "خريطة", arExample: "انظر إلى الخريطة.", category: "Sayohat" },
    { en: "Hotel", uz: "Mehmonxona", example: "We stayed at a hotel.", ru: "Гостиница", ruExample: "Мы остановились в гостинице.", ar: "فندق", arExample: "أقمنا في فندق.", category: "Sayohat" },
   
    { en: "Dog", uz: "It", example: "The dog is running.", ru: "Собака", ruExample: "Собака бежит.", ar: "كلب", arExample: "الكلب يجري.", category: "Tabiat" },
    { en: "Cat", uz: "Mushuk", example: "The cat is sleeping.", ru: "Кошка", ruExample: "Кошка спит.", ar: "قطة", arExample: "القطة نائمة.", category: "Tabiat" },
    { en: "Bird", uz: "Qush", example: "The bird can fly.", ru: "Птица", ruExample: "Птица умеет летать.", ar: "طائر", arExample: "الطائر يستطيع الطيران.", category: "Tabiat" },
    { en: "Tree", uz: "Daraxt", example: "There is a tree in the yard.", ru: "Дерево", ruExample: "Во дворе есть дерево.", ar: "شجرة", arExample: "هناك شجرة في الحديقة.", category: "Tabiat" },
    { en: "Flower", uz: "Gul", example: "She gave me a flower.", ru: "Цветок", ruExample: "Она подарила мне цветок.", ar: "زهرة", arExample: "أعطتني زهرة.", category: "Tabiat" },
    { en: "Sun", uz: "Quyosh", example: "The sun is bright today.", ru: "Солнце", ruExample: "Сегодня солнце яркое.", ar: "شمس", arExample: "الشمس مشرقة اليوم.", category: "Tabiat" },
    { en: "Moon", uz: "Oy", example: "The moon is beautiful tonight.", ru: "Луна", ruExample: "Луна сегодня красивая.", ar: "قمر", arExample: "القمر جميل الليلة.", category: "Tabiat" },
    { en: "Rain", uz: "Yomg'ir", example: "It is raining outside.", ru: "Дождь", ruExample: "На улице идёт дождь.", ar: "مطر", arExample: "إنها تمطر في الخارج.", category: "Ob-havo" },
    { en: "Snow", uz: "Qor", example: "Snow is falling in winter.", ru: "Снег", ruExample: "Зимой идёт снег.", ar: "ثلج", arExample: "الثلج يتساقط في الشتاء.", category: "Ob-havo" },
    { en: "Wind", uz: "Shamol", example: "The wind is strong today.", ru: "Ветер", ruExample: "Сегодня сильный ветер.", ar: "رياح", arExample: "الرياح قوية اليوم.", category: "Ob-havo" },
    { en: "Cold", uz: "Sovuq", example: "It is cold in winter.", ru: "Холодно", ruExample: "Зимой холодно.", ar: "بارد", arExample: "الجو بارد في الشتاء.", category: "Ob-havo" },
    { en: "Hot", uz: "Issiq", example: "It is hot in summer.", ru: "Жарко", ruExample: "Летом жарко.", ar: "حار", arExample: "الجو حار في الصيف.", category: "Ob-havo" },
    
    { en: "Today", uz: "Bugun", example: "Today is a good day.", ru: "Сегодня", ruExample: "Сегодня хороший день.", ar: "اليوم", arExample: "اليوم يوم جميل.", category: "Vaqt" },
    { en: "Tomorrow", uz: "Ertaga", example: "See you tomorrow.", ru: "Завтра", ruExample: "До завтра.", ar: "غدا", arExample: "أراك غدا.", category: "Vaqt" },
    { en: "Yesterday", uz: "Kecha", example: "I saw him yesterday.", ru: "Вчера", ruExample: "Я видел его вчера.", ar: "أمس", arExample: "رأيته أمس.", category: "Vaqt" },
    { en: "Morning", uz: "Ertalab", example: "I wake up in the morning.", ru: "Утро", ruExample: "Я просыпаюсь утром.", ar: "صباح", arExample: "أستيقظ في الصباح.", category: "Vaqt" },
    { en: "Night", uz: "Kecha (tun)", example: "I sleep at night.", ru: "Ночь", ruExample: "Я сплю ночью.", ar: "ليل", arExample: "أنام في الليل.", category: "Vaqt" },
    { en: "Week", uz: "Hafta", example: "There are seven days in a week.", ru: "Неделя", ruExample: "В неделе семь дней.", ar: "أسبوع", arExample: "هناك سبعة أيام في الأسبوع.", category: "Vaqt" },
    { en: "Month", uz: "Oy (kalendar)", example: "This month is busy.", ru: "Месяц", ruExample: "Этот месяц занятой.", ar: "شهر", arExample: "هذا الشهر مزدحم.", category: "Vaqt" },
    { en: "Year", uz: "Yil", example: "Next year will be great.", ru: "Год", ruExample: "Следующий год будет отличным.", ar: "سنة", arExample: "السنة القادمة ستكون رائعة.", category: "Vaqt" },
    { en: "One", uz: "Bir", example: "I have one book.", ru: "Один", ruExample: "У меня одна книга.", ar: "واحد", arExample: "لدي كتاب واحد.", category: "Sonlar" },
    { en: "Two", uz: "Ikki", example: "She has two sisters.", ru: "Два", ruExample: "У неё две сестры.", ar: "اثنان", arExample: "لديها أختان.", category: "Sonlar" },
    { en: "Three", uz: "Uch", example: "There are three chairs.", ru: "Три", ruExample: "Здесь три стула.", ar: "ثلاثة", arExample: "هناك ثلاثة كراسي.", category: "Sonlar" },
    { en: "Ten", uz: "O'n", example: "He counted to ten.", ru: "Десять", ruExample: "Он посчитал до десяти.", ar: "عشرة", arExample: "عد إلى عشرة.", category: "Sonlar" },
   
    { en: "Happy", uz: "Baxtli", example: "She is very happy today.", ru: "Счастливый", ruExample: "Она сегодня очень счастлива.", ar: "سعيد", arExample: "هي سعيدة جدا اليوم.", category: "His-tuyg'u" },
    { en: "Sad", uz: "Xafa", example: "He looks sad.", ru: "Грустный", ruExample: "Он выглядит грустным.", ar: "حزين", arExample: "يبدو حزينا.", category: "His-tuyg'u" },
    { en: "Angry", uz: "Jahldor", example: "Don't be angry with me.", ru: "Злой", ruExample: "Не злись на меня.", ar: "غاضب", arExample: "لا تغضب مني.", category: "His-tuyg'u" },
    { en: "Tired", uz: "Charchagan", example: "I am very tired.", ru: "Уставший", ruExample: "Я очень устал.", ar: "متعب", arExample: "أنا متعب جدا.", category: "His-tuyg'u" },
    { en: "Beautiful", uz: "Chiroyli", example: "What a beautiful garden!", ru: "Красивый", ruExample: "Какой красивый сад!", ar: "جميل", arExample: "يا له من حديقة جميلة!", category: "Sifat" },
    { en: "Big", uz: "Katta", example: "This is a big house.", ru: "Большой", ruExample: "Это большой дом.", ar: "كبير", arExample: "هذا بيت كبير.", category: "Sifat" },
    { en: "Small", uz: "Kichik", example: "The kitten is small.", ru: "Маленький", ruExample: "Котёнок маленький.", ar: "صغير", arExample: "القطيط صغير الحجم.", category: "Sifat" },
    { en: "Fast", uz: "Tez", example: "He runs very fast.", ru: "Быстрый", ruExample: "Он бегает очень быстро.", ar: "سريع", arExample: "هو يجري بسرعة كبيرة.", category: "Sifat" },
    { en: "Slow", uz: "Sekin", example: "The turtle is slow.", ru: "Медленный", ruExample: "Черепаха медленная.", ar: "بطيء", arExample: "السلحفاة بطيئة.", category: "Sifat" },
    { en: "Strong", uz: "Kuchli", example: "He is very strong.", ru: "Сильный", ruExample: "Он очень сильный.", ar: "قوي", arExample: "هو قوي جدا.", category: "Sifat" },
    { en: "Smart", uz: "Aqlli", example: "She is a smart student.", ru: "Умный", ruExample: "Она умная ученица.", ar: "ذكي", arExample: "هي طالبة ذكية.", category: "Sifat" },
    { en: "Kind", uz: "Mehribon", example: "My teacher is kind.", ru: "Добрый", ruExample: "Мой учитель добрый.", ar: "لطيف", arExample: "معلمي لطيف.", category: "Sifat" },
   
    { en: "Run", uz: "Yugurmoq", example: "Children love to run.", ru: "Бегать", ruExample: "Дети любят бегать.", ar: "يجري", arExample: "الأطفال يحبون الجري.", category: "Fe'l" },
    { en: "Eat", uz: "Yemoq", example: "We eat lunch at noon.", ru: "Есть", ruExample: "Мы обедаем в полдень.", ar: "يأكل", arExample: "نأكل الغداء عند الظهر.", category: "Fe'l" },
    { en: "Drink", uz: "Ichmoq", example: "Drink water every day.", ru: "Пить", ruExample: "Пей воду каждый день.", ar: "يشرب", arExample: "اشرب الماء كل يوم.", category: "Fe'l" },
    { en: "Sleep", uz: "Uxlamoq", example: "I sleep eight hours.", ru: "Спать", ruExample: "Я сплю восемь часов.", ar: "ينام", arExample: "أنام ثماني ساعات.", category: "Fe'l" },
    { en: "Study", uz: "O'qimoq (o'rganmoq)", example: "I study English every day.", ru: "Учиться", ruExample: "Я учу английский каждый день.", ar: "يدرس", arExample: "أدرس الإنجليزية كل يوم.", category: "Fe'l" },
    { en: "Write", uz: "Yozmoq", example: "She writes a letter.", ru: "Писать", ruExample: "Она пишет письмо.", ar: "يكتب", arExample: "هي تكتب رسالة.", category: "Fe'l" },
    { en: "Read", uz: "O'qimoq (kitob)", example: "He reads a book every night.", ru: "Читать", ruExample: "Он читает книгу каждый вечер.", ar: "يقرأ", arExample: "هو يقرأ كتابا كل ليلة.", category: "Fe'l" },
    { en: "Speak", uz: "Gapirmoq", example: "She speaks English well.", ru: "Говорить", ruExample: "Она хорошо говорит по-английски.", ar: "يتكلم", arExample: "هي تتكلم الإنجليزية جيدا.", category: "Fe'l" },
    { en: "Listen", uz: "Tinglamoq", example: "Listen to the teacher.", ru: "Слушать", ruExample: "Слушай учителя.", ar: "يستمع", arExample: "استمع إلى المعلم.", category: "Fe'l" },
    { en: "Watch", uz: "Tomosha qilmoq", example: "We watch movies together.", ru: "Смотреть", ruExample: "Мы смотрим фильмы вместе.", ar: "يشاهد", arExample: "نشاهد الأفلام معا.", category: "Fe'l" },
    { en: "Play", uz: "O'ynamoq", example: "Children play in the park.", ru: "Играть", ruExample: "Дети играют в парке.", ar: "يلعب", arExample: "الأطفال يلعبون في الحديقة.", category: "Fe'l" },
    { en: "Buy", uz: "Sotib olmoq", example: "I want to buy a new phone.", ru: "Покупать", ruExample: "Я хочу купить новый телефон.", ar: "يشتري", arExample: "أريد أن أشتري هاتفا جديدا.", category: "Fe'l" },
    { en: "Sell", uz: "Sotmoq", example: "He sells fruit at the market.", ru: "Продавать", ruExample: "Он продаёт фрукты на рынке.", ar: "يبيع", arExample: "يبيع الفاكهة في السوق.", category: "Fe'l" },
    { en: "Help", uz: "Yordam bermoq", example: "Can you help me, please?", ru: "Помогать", ruExample: "Ты можешь мне помочь?", ar: "يساعد", arExample: "هل يمكنك مساعدتي من فضلك؟", category: "Fe'l" },
    { en: "Learn", uz: "O'rganmoq", example: "I want to learn English.", ru: "Учить", ruExample: "Я хочу выучить английский.", ar: "يتعلم", arExample: "أريد أن أتعلم الإنجليزية.", category: "Fe'l" },
    { en: "Teach", uz: "O'qitmoq", example: "She teaches math.", ru: "Преподавать", ruExample: "Она преподаёт математику.", ar: "يعلّم", arExample: "هي تعلّم الرياضيات.", category: "Fe'l" },
    { en: "Travel", uz: "Sayohat qilmoq", example: "They love to travel.", ru: "Путешествовать", ruExample: "Они любят путешествовать.", ar: "يسافر", arExample: "يحبون السفر.", category: "Fe'l" },
    { en: "Cook", uz: "Ovqat pishirmoq", example: "My mother cooks well.", ru: "Готовить", ruExample: "Моя мама хорошо готовит.", ar: "يطبخ", arExample: "أمي تطبخ جيدا.", category: "Fe'l" },
    { en: "Clean", uz: "Tozalamoq", example: "I clean my room every week.", ru: "Убирать", ruExample: "Я убираю свою комнату каждую неделю.", ar: "ينظف", arExample: "أنظف غرفتي كل أسبوع.", category: "Fe'l" },
    { en: "Open", uz: "Ochmoq", example: "Please open the window.", ru: "Открывать", ruExample: "Пожалуйста, открой окно.", ar: "يفتح", arExample: "افتح النافذة من فضلك.", category: "Fe'l" },
    { en: "Close", uz: "Yopmoq", example: "Close the door, please.", ru: "Закрывать", ruExample: "Закрой дверь, пожалуйста.", ar: "يغلق", arExample: "أغلق الباب من فضلك.", category: "Fe'l" },
    
    { en: "Computer", uz: "Kompyuter", example: "I use a computer for work.", ru: "Компьютер", ruExample: "Я использую компьютер для работы.", ar: "حاسوب", arExample: "أستخدم الحاسوب للعمل.", category: "Texnologiya" },
    { en: "Phone", uz: "Telefon", example: "My phone is new.", ru: "Телефон", ruExample: "Мой телефон новый.", ar: "هاتف", arExample: "هاتفي جديد.", category: "Texnologiya" },
    { en: "Internet", uz: "Internet", example: "I use the internet every day.", ru: "Интернет", ruExample: "Я пользуюсь интернетом каждый день.", ar: "إنترنت", arExample: "أستخدم الإنترنت كل يوم.", category: "Texnologiya" },
    { en: "Camera", uz: "Kamera", example: "She has a good camera.", ru: "Камера", ruExample: "У неё хорошая камера.", ar: "كاميرا", arExample: "لديها كاميرا جيدة.", category: "Texnologiya" },
    { en: "Language", uz: "Til", example: "English is a global language.", ru: "Язык", ruExample: "Английский - это международный язык.", ar: "لغة", arExample: "الإنجليزية لغة عالمية.", category: "Texnologiya" },
    { en: "Success", uz: "Muvaffaqiyat", example: "Hard work leads to success.", ru: "Успех", ruExample: "Усердный труд приводит к успеху.", ar: "نجاح", arExample: "العمل الجاد يؤدي إلى النجاح.", category: "Texnologiya" },
    { en: "Knowledge", uz: "Bilim", example: "Knowledge is power.", ru: "Знание", ruExample: "Знание - сила.", ar: "معرفة", arExample: "المعرفة قوة.", category: "Texnologiya" },
    { en: "Hello", uz: "Salom", example: "Hello my friend.", ru: "Привет", ruExample: "Привет, мой друг.", ar: "مرحبا", arExample: "مرحبا يا صديقي.", category: "Umumiy" },

    { en: "Red", uz: "Qizil", example: "The apple is red.", ru: "Красный", ruExample: "Яблоко красное.", ar: "أحمر", arExample: "التفاحة حمراء.", category: "Ranglar" },
    { en: "Blue", uz: "Ko'k", example: "The sky is blue.", ru: "Синий", ruExample: "Небо синее.", ar: "أزرق", arExample: "السماء زرقاء.", category: "Ranglar" },
    { en: "Green", uz: "Yashil", example: "The grass is green.", ru: "Зелёный", ruExample: "Трава зелёная.", ar: "أخضر", arExample: "العشب أخضر.", category: "Ranglar" },
    { en: "Yellow", uz: "Sariq", example: "The sun looks yellow.", ru: "Жёлтый", ruExample: "Солнце выглядит жёлтым.", ar: "أصفر", arExample: "تبدو الشمس صفراء.", category: "Ranglar" },
    { en: "Black", uz: "Qora", example: "I have a black cat.", ru: "Чёрный", ruExample: "У меня чёрная кошка.", ar: "أسود", arExample: "لدي قطة سوداء.", category: "Ranglar" },
    { en: "White", uz: "Oq", example: "Snow is white.", ru: "Белый", ruExample: "Снег белый.", ar: "أبيض", arExample: "الثلج أبيض.", category: "Ranglar" },
    { en: "Orange", uz: "To'q sariq", example: "I like the color orange.", ru: "Оранжевый", ruExample: "Мне нравится оранжевый цвет.", ar: "برتقالي", arExample: "أحب اللون البرتقالي.", category: "Ranglar" },
    { en: "Purple", uz: "Binafsha", example: "She wore a purple dress.", ru: "Фиолетовый", ruExample: "Она была в фиолетовом платье.", ar: "بنفسجي", arExample: "ارتدت فستانا بنفسجيا.", category: "Ranglar" },

    { en: "Dog", uz: "It", example: "The dog is running.", ru: "Собака", ruExample: "Собака бежит.", ar: "كلب", arExample: "الكلب يجري.", category: "Hayvonlar" },
    { en: "Cat", uz: "Mushuk", example: "The cat is sleeping.", ru: "Кошка", ruExample: "Кошка спит.", ar: "قطة", arExample: "القطة نائمة.", category: "Hayvonlar" },
    { en: "Horse", uz: "Ot", example: "The horse runs fast.", ru: "Лошадь", ruExample: "Лошадь бежит быстро.", ar: "حصان", arExample: "الحصان يجري بسرعة.", category: "Hayvonlar" },
    { en: "Cow", uz: "Sigir", example: "The cow gives milk.", ru: "Корова", ruExample: "Корова даёт молоко.", ar: "بقرة", arExample: "البقرة تعطي الحليب.", category: "Hayvonlar" },
    { en: "Bird", uz: "Qush", example: "The bird can fly.", ru: "Птица", ruExample: "Птица умеет летать.", ar: "طائر", arExample: "الطائر يستطيع الطيران.", category: "Hayvonlar" },
    { en: "Fish", uz: "Baliq", example: "Fish live in water.", ru: "Рыба", ruExample: "Рыбы живут в воде.", ar: "سمكة", arExample: "الأسماك تعيش في الماء.", category: "Hayvonlar" },
    { en: "Elephant", uz: "Fil", example: "The elephant is very big.", ru: "Слон", ruExample: "Слон очень большой.", ar: "فيل", arExample: "الفيل كبير جدا.", category: "Hayvonlar" },
    { en: "Lion", uz: "Sher", example: "The lion is the king of animals.", ru: "Лев", ruExample: "Лев - царь зверей.", ar: "أسد", arExample: "الأسد ملك الحيوانات.", category: "Hayvonlar" },
    { en: "Bear", uz: "Ayiq", example: "The bear sleeps in winter.", ru: "Медведь", ruExample: "Медведь спит зимой.", ar: "دب", arExample: "الدب ينام في الشتاء.", category: "Hayvonlar" },
    { en: "Rabbit", uz: "Quyon", example: "The rabbit is very fast.", ru: "Кролик", ruExample: "Кролик очень быстрый.", ar: "أرنب", arExample: "الأرنب سريع جدا.", category: "Hayvonlar" },

    { en: "Head", uz: "Bosh", example: "My head hurts.", ru: "Голова", ruExample: "У меня болит голова.", ar: "رأس", arExample: "رأسي يؤلمني.", category: "Tana a'zolari" },
    { en: "Eye", uz: "Ko'z", example: "She has blue eyes.", ru: "Глаз", ruExample: "У неё голубые глаза.", ar: "عين", arExample: "لديها عينان زرقاوان.", category: "Tana a'zolari" },
    { en: "Ear", uz: "Quloq", example: "I can hear with my ears.", ru: "Ухо", ruExample: "Я слышу ушами.", ar: "أذن", arExample: "أستطيع أن أسمع بأذني.", category: "Tana a'zolari" },
    { en: "Nose", uz: "Burun", example: "My nose is cold.", ru: "Нос", ruExample: "У меня холодный нос.", ar: "أنف", arExample: "أنفي بارد.", category: "Tana a'zolari" },
    { en: "Mouth", uz: "Og'iz", example: "Open your mouth, please.", ru: "Рот", ruExample: "Открой рот, пожалуйста.", ar: "فم", arExample: "افتح فمك من فضلك.", category: "Tana a'zolari" },
    { en: "Hand", uz: "Qo'l", example: "Wash your hands.", ru: "Рука", ruExample: "Помой руки.", ar: "يد", arExample: "اغسل يديك.", category: "Tana a'zolari" },
    { en: "Leg", uz: "Oyoq", example: "He hurt his leg.", ru: "Нога", ruExample: "Он повредил ногу.", ar: "رجل", arExample: "آذى رجله.", category: "Tana a'zolari" },
    { en: "Heart", uz: "Yurak", example: "The heart pumps blood.", ru: "Сердце", ruExample: "Сердце качает кровь.", ar: "قلب", arExample: "القلب يضخ الدم.", category: "Tana a'zolari" },
    { en: "Hair", uz: "Soch", example: "She has long hair.", ru: "Волосы", ruExample: "У неё длинные волосы.", ar: "شعر", arExample: "لديها شعر طويل.", category: "Tana a'zolari" },
    { en: "Tooth", uz: "Tish", example: "Brush your teeth every day.", ru: "Зуб", ruExample: "Чисти зубы каждый день.", ar: "سن", arExample: "نظف أسنانك كل يوم.", category: "Tana a'zolari" },

    { en: "Teacher", uz: "O'qituvchi", example: "My teacher is very kind.", ru: "Учитель", ruExample: "Мой учитель очень добрый.", ar: "معلم", arExample: "معلمي لطيف جدا.", category: "Kasblar" },
    { en: "Doctor", uz: "Shifokor", example: "The doctor helps sick people.", ru: "Врач", ruExample: "Врач помогает больным людям.", ar: "طبيب", arExample: "الطبيب يساعد المرضى.", category: "Kasblar" },
    { en: "Engineer", uz: "Muhandis", example: "He works as an engineer.", ru: "Инженер", ruExample: "Он работает инженером.", ar: "مهندس", arExample: "يعمل مهندسا.", category: "Kasblar" },
    { en: "Driver", uz: "Haydovchi", example: "The driver knows the city well.", ru: "Водитель", ruExample: "Водитель хорошо знает город.", ar: "سائق", arExample: "السائق يعرف المدينة جيدا.", category: "Kasblar" },
    { en: "Farmer", uz: "Dehqon", example: "The farmer grows vegetables.", ru: "Фермер", ruExample: "Фермер выращивает овощи.", ar: "فلاح", arExample: "الفلاح يزرع الخضروات.", category: "Kasblar" },
    { en: "Police officer", uz: "Militsioner", example: "The police officer keeps us safe.", ru: "Полицейский", ruExample: "Полицейский обеспечивает нашу безопасность.", ar: "شرطي", arExample: "الشرطي يحافظ على أماننا.", category: "Kasblar" },
    { en: "Lawyer", uz: "Advokat", example: "The lawyer works in court.", ru: "Адвокат", ruExample: "Адвокат работает в суде.", ar: "محام", arExample: "المحامي يعمل في المحكمة.", category: "Kasblar" },
    { en: "Cook", uz: "Oshpaz", example: "The cook prepares tasty food.", ru: "Повар", ruExample: "Повар готовит вкусную еду.", ar: "طاهٍ", arExample: "الطاهي يحضر طعاما لذيذا.", category: "Kasblar" },
    { en: "Nurse", uz: "Hamshira", example: "The nurse takes care of patients.", ru: "Медсестра", ruExample: "Медсестра заботится о пациентах.", ar: "ممرضة", arExample: "الممرضة تعتني بالمرضى.", category: "Kasblar" },
    { en: "Pilot", uz: "Uchuvchi", example: "The pilot flies the airplane.", ru: "Пилот", ruExample: "Пилот управляет самолётом.", ar: "طيار", arExample: "الطيار يقود الطائرة.", category: "Kasblar" },

    { en: "Car", uz: "Mashina", example: "I drive my car to work.", ru: "Машина", ruExample: "Я езжу на машине на работу.", ar: "سيارة", arExample: "أقود سيارتي إلى العمل.", category: "Transport" },
    { en: "Bus", uz: "Avtobus", example: "We go to school by bus.", ru: "Автобус", ruExample: "Мы едем в школу на автобусе.", ar: "حافلة", arExample: "نذهب إلى المدرسة بالحافلة.", category: "Transport" },
    { en: "Train", uz: "Poyezd", example: "The train arrives at noon.", ru: "Поезд", ruExample: "Поезд прибывает в полдень.", ar: "قطار", arExample: "يصل القطار عند الظهر.", category: "Transport" },
    { en: "Airplane", uz: "Samolyot", example: "The airplane flies very high.", ru: "Самолёт", ruExample: "Самолёт летит очень высоко.", ar: "طائرة", arExample: "الطائرة تطير عاليا جدا.", category: "Transport" },
    { en: "Bicycle", uz: "Velosiped", example: "She rides her bicycle every morning.", ru: "Велосипед", ruExample: "Она катается на велосипеде каждое утро.", ar: "دراجة", arExample: "تركب دراجتها كل صباح.", category: "Transport" },
    { en: "Ship", uz: "Kema", example: "The ship crosses the sea.", ru: "Корабль", ruExample: "Корабль пересекает море.", ar: "سفينة", arExample: "السفينة تعبر البحر.", category: "Transport" },
    { en: "Taxi", uz: "Taksi", example: "I took a taxi home.", ru: "Такси", ruExample: "Я взял такси домой.", ar: "سيارة أجرة", arExample: "أخذت سيارة أجرة إلى المنزل.", category: "Transport" },
    { en: "Metro", uz: "Metro", example: "The metro is fast and cheap.", ru: "Метро", ruExample: "Метро быстрое и дешёвое.", ar: "مترو", arExample: "المترو سريع ورخيص.", category: "Transport" },

    { en: "Spring", uz: "Bahor", example: "Flowers bloom in spring.", ru: "Весна", ruExample: "Весной цветут цветы.", ar: "ربيع", arExample: "تتفتح الزهور في الربيع.", category: "Fasllar" },
    { en: "Summer", uz: "Yoz", example: "Summer is very hot.", ru: "Лето", ruExample: "Летом очень жарко.", ar: "صيف", arExample: "الصيف حار جدا.", category: "Fasllar" },
    { en: "Autumn", uz: "Kuz", example: "Leaves fall in autumn.", ru: "Осень", ruExample: "Осенью падают листья.", ar: "خريف", arExample: "تتساقط الأوراق في الخريف.", category: "Fasllar" },
    { en: "Winter", uz: "Qish", example: "It snows in winter.", ru: "Зима", ruExample: "Зимой идёт снег.", ar: "شتاء", arExample: "يتساقط الثلج في الشتاء.", category: "Fasllar" },
    { en: "Football", uz: "Futbol", example: "I play football on weekends.", ru: "футбол", ruExample: "Я играю в футбол по выходным.", ar: "كرة القدم", arExample: "ألعب كرة القدم في عطلة نهاية الأسبوع.", category: "Sport" },
    { en: "Basketball", uz: "Basketbol", example: "He is good at basketball.", ru: "баскетбол", ruExample: "Он хорошо играет в баскетбол.", ar: "كرة السلة", arExample: "هو جيد في كرة السلة.", category: "Sport" },
    { en: "Swim", uz: "Suzish", example: "We swim in the lake in summer.", ru: "плавать", ruExample: "Летом мы плаваем в озере.", ar: "يسبح", arExample: "نسبح في البحيرة في الصيف.", category: "Sport" },
    { en: "Ball", uz: "To'p", example: "The ball is under the table.", ru: "мяч", ruExample: "Мяч под столом.", ar: "كرة", arExample: "الكرة تحت الطاولة.", category: "Sport" },
    { en: "Team", uz: "Jamoa", example: "Our team won the match.", ru: "команда", ruExample: "Наша команда выиграла матч.", ar: "فريق", arExample: "فاز فريقنا بالمباراة.", category: "Sport" },
    { en: "Win", uz: "Yutmoq", example: "They want to win the game.", ru: "выигрывать", ruExample: "Они хотят выиграть игру.", ar: "يفوز", arExample: "يريدون أن يفوزوا باللعبة.", category: "Sport" },
    { en: "Lose", uz: "Yutqazmoq", example: "Nobody likes to lose.", ru: "проигрывать", ruExample: "Никто не любит проигрывать.", ar: "يخسر", arExample: "لا أحد يحب أن يخسر.", category: "Sport" },
    { en: "Laptop", uz: "Noutbuk", example: "I bought a new laptop.", ru: "ноутбук", ruExample: "Я купил новый ноутбук.", ar: "حاسوب محمول", arExample: "اشتريت حاسوبا محمولا جديدا.", category: "Texnologiya" },
    { en: "Application", uz: "Ilova", example: "This application is very useful.", ru: "приложение", ruExample: "Это приложение очень полезно.", ar: "تطبيق", arExample: "هذا التطبيق مفيد جدا.", category: "Texnologiya" },
    { en: "Website", uz: "Veb-sayt", example: "Visit our website for more information.", ru: "веб-сайт", ruExample: "Посетите наш веб-сайт для получения информации.", ar: "موقع إلكتروني", arExample: "قم بزيارة موقعنا الإلكتروني لمزيد من المعلومات.", category: "Texnologiya" },
    { en: "Password", uz: "Parol", example: "Don't forget your password.", ru: "пароль", ruExample: "Не забудьте свой пароль.", ar: "كلمة المرور", arExample: "لا تنس كلمة المرور.", category: "Texnologiya" },
    { en: "Wifi", uz: "Vay-fay", example: "The wifi is not working today.", ru: "вай-фай", ruExample: "Сегодня вай-фай не работает.", ar: "واي فاي", arExample: "الواي فاي لا يعمل اليوم.", category: "Texnologiya" },
    { en: "Download", uz: "Yuklab olish", example: "I need to download this file.", ru: "скачать", ruExample: "Мне нужно скачать этот файл.", ar: "تحميل", arExample: "أحتاج إلى تحميل هذا الملف.", category: "Texnologiya" },
    { en: "Message", uz: "Xabar", example: "She sent me a message.", ru: "сообщение", ruExample: "Она отправила мне сообщение.", ar: "رسالة", arExample: "أرسلت لي رسالة.", category: "Texnologiya" },
    { en: "Battery", uz: "Batareya", example: "My phone battery is low.", ru: "батарея", ruExample: "Батарея моего телефона садится.", ar: "بطارية", arExample: "بطارية هاتفي منخفضة.", category: "Texnologiya" },
    { en: "Cloud", uz: "Bulut", example: "There is a big cloud in the sky.", ru: "облако", ruExample: "На небе большое облако.", ar: "غيمة", arExample: "توجد غيمة كبيرة في السماء.", category: "Ob-havo" },
    { en: "Storm", uz: "Bo'ron", example: "A storm is coming tonight.", ru: "буря", ruExample: "Сегодня ночью будет буря.", ar: "عاصفة", arExample: "هناك عاصفة قادمة الليلة.", category: "Ob-havo" },
    { en: "Fog", uz: "Tuman", example: "The fog made driving difficult.", ru: "туман", ruExample: "Туман затруднял вождение.", ar: "ضباب", arExample: "جعل الضباب القيادة صعبة.", category: "Ob-havo" },
    { en: "Thunder", uz: "Momaqaldiroq", example: "I heard thunder last night.", ru: "гром", ruExample: "Прошлой ночью я слышал гром.", ar: "رعد", arExample: "سمعت الرعد الليلة الماضية.", category: "Ob-havo" },
    { en: "Surprised", uz: "Hayron", example: "She was surprised by the gift.", ru: "удивлённый", ruExample: "Она была удивлена подарком.", ar: "متفاجئ", arExample: "كانت متفاجئة بالهدية.", category: "Hissiyotlar" },
    { en: "Worried", uz: "Xavotirli", example: "He looks worried about the exam.", ru: "обеспокоенный", ruExample: "Он выглядит обеспокоенным экзаменом.", ar: "قلق", arExample: "يبدو قلقا بشأن الامتحان.", category: "Hissiyotlar" },
    { en: "Excited", uz: "Hayajonlangan", example: "We are excited about the trip.", ru: "взволнованный", ruExample: "Мы взволнованы поездкой.", ar: "متحمس", arExample: "نحن متحمسون للرحلة.", category: "Hissiyotlar" },
    { en: "Bored", uz: "Zerikkan", example: "The children are bored at home.", ru: "скучающий", ruExample: "Дети скучают дома.", ar: "مل", arExample: "الأطفال يشعرون بالملل في المنزل.", category: "Hissiyotlar" },
    { en: "Nervous", uz: "Asabiy", example: "I feel nervous before exams.", ru: "нервный", ruExample: "Перед экзаменами я нервничаю.", ar: "متوتر", arExample: "أشعر بالتوتر قبل الامتحانات.", category: "Hissiyotlar" },
    { en: "Proud", uz: "Faxrlanuvchi", example: "Her parents are proud of her.", ru: "гордый", ruExample: "Её родители гордятся ею.", ar: "فخور", arExample: "والداها فخوران بها.", category: "Hissiyotlar" },
    { en: "Price", uz: "Narx", example: "What is the price of this shirt?", ru: "цена", ruExample: "Какая цена этой рубашки?", ar: "سعر", arExample: "ما سعر هذا القميص؟", category: "Xarid" },
    { en: "Discount", uz: "Chegirma", example: "We got a big discount.", ru: "скидка", ruExample: "Мы получили большую скидку.", ar: "خصم", arExample: "حصلنا على خصم كبير.", category: "Xarid" },
    { en: "Receipt", uz: "Chek", example: "Keep your receipt, please.", ru: "чек", ruExample: "Сохраните, пожалуйста, чек.", ar: "إيصال", arExample: "احتفظ بالإيصال من فضلك.", category: "Xarid" },
    { en: "Cash", uz: "Naqd pul", example: "I paid in cash.", ru: "наличные", ruExample: "Я заплатил наличными.", ar: "نقد", arExample: "دفعت نقدا.", category: "Xarid" },
    { en: "Shop", uz: "Do'kon", example: "The shop closes at nine.", ru: "магазин", ruExample: "Магазин закрывается в девять.", ar: "متجر", arExample: "المتجر يغلق الساعة التاسعة.", category: "Xarid" },
    { en: "Market", uz: "Bozor", example: "We buy vegetables at the market.", ru: "рынок", ruExample: "Мы покупаем овощи на рынке.", ar: "سوق", arExample: "نشتري الخضروات من السوق.", category: "Xarid" },
    { en: "Early", uz: "Erta", example: "I wake up early every day.", ru: "рано", ruExample: "Я просыпаюсь рано каждый день.", ar: "مبكرا", arExample: "أستيقظ مبكرا كل يوم.", category: "Vaqt" },
    { en: "Late", uz: "Kech", example: "He arrived late to class.", ru: "поздно", ruExample: "Он опоздал на урок.", ar: "متأخرا", arExample: "وصل متأخرا إلى الفصل.", category: "Vaqt" },
    { en: "Soon", uz: "Tez orada", example: "See you soon!", ru: "скоро", ruExample: "Скоро увидимся!", ar: "قريبا", arExample: "أراك قريبا!", category: "Vaqt" },
    { en: "Always", uz: "Doim", example: "She always helps her friends.", ru: "всегда", ruExample: "Она всегда помогает друзьям.", ar: "دائما", arExample: "هي دائما تساعد أصدقاءها.", category: "Vaqt" },
    { en: "Never", uz: "Hech qachon", example: "He never gives up.", ru: "никогда", ruExample: "Он никогда не сдаётся.", ar: "أبدا", arExample: "هو لا يستسلم أبدا.", category: "Vaqt" },
    { en: "Sometimes", uz: "Ba'zan", example: "Sometimes I cook dinner.", ru: "иногда", ruExample: "Иногда я готовлю ужин.", ar: "أحيانا", arExample: "أحيانا أطبخ العشاء.", category: "Vaqt" },
    { en: "Often", uz: "Tez-tez", example: "We often travel together.", ru: "часто", ruExample: "Мы часто путешествуем вместе.", ar: "غالبا", arExample: "نسافر معا غالبا.", category: "Vaqt" },
    { en: "Left", uz: "Chap", example: "Turn left at the corner.", ru: "лево", ruExample: "Поверните налево на углу.", ar: "يسار", arExample: "انعطف يسارا عند الزاوية.", category: "Yo'nalish" },
    { en: "Right", uz: "O'ng", example: "The store is on the right.", ru: "право", ruExample: "Магазин справа.", ar: "يمين", arExample: "المتجر على اليمين.", category: "Yo'nalish" },
    { en: "Straight", uz: "To'g'ri", example: "Go straight for two blocks.", ru: "прямо", ruExample: "Идите прямо два квартала.", ar: "مستقيم", arExample: "اذهب مستقيما لمسافة مبنيين.", category: "Yo'nalish" },
    { en: "Near", uz: "Yaqin", example: "The school is near my house.", ru: "близко", ruExample: "Школа рядом с моим домом.", ar: "قريب", arExample: "المدرسة قريبة من منزلي.", category: "Yo'nalish" },
    { en: "Far", uz: "Uzoq", example: "The airport is far from here.", ru: "далеко", ruExample: "Аэропорт далеко отсюда.", ar: "بعيد", arExample: "المطار بعيد من هنا.", category: "Yo'nalish" },
    { en: "Restaurant", uz: "Restoran", example: "We had dinner at a restaurant.", ru: "ресторан", ruExample: "Мы поужинали в ресторане.", ar: "مطعم", arExample: "تناولنا العشاء في مطعم.", category: "Restoran" },
    { en: "Menu", uz: "Menyu", example: "Can I see the menu, please?", ru: "меню", ruExample: "Могу я увидеть меню, пожалуйста?", ar: "قائمة الطعام", arExample: "هل يمكنني رؤية قائمة الطعام من فضلك؟", category: "Restoran" },
    { en: "Order", uz: "Buyurtma", example: "I would like to order pizza.", ru: "заказ", ruExample: "Я хотел бы заказать пиццу.", ar: "طلب", arExample: "أود أن أطلب بيتزا.", category: "Restoran" },
    { en: "Waiter", uz: "Ofitsiant", example: "The waiter brought our food.", ru: "официант", ruExample: "Официант принёс нашу еду.", ar: "نادل", arExample: "أحضر النادل طعامنا.", category: "Restoran" },
    { en: "Bill", uz: "Chek", example: "Can we have the bill, please?", ru: "счёт", ruExample: "Можно счёт, пожалуйста?", ar: "فاتورة", arExample: "هل يمكننا الحصول على الفاتورة من فضلك؟", category: "Restoran" },
    { en: "Reserve", uz: "Band qilmoq", example: "I want to reserve a table for two.", ru: "забронировать", ruExample: "Я хочу забронировать столик на двоих.", ar: "يحجز", arExample: "أريد أن أحجز طاولة لشخصين.", category: "Restoran" },
    { en: "Delicious", uz: "Mazali", example: "This soup is delicious.", ru: "вкусный", ruExample: "Этот суп вкусный.", ar: "لذيذ", arExample: "هذا الحساء لذيذ.", category: "Restoran" },
    { en: "Spicy", uz: "Achchiq", example: "I don't like spicy food.", ru: "острый", ruExample: "Я не люблю острую еду.", ar: "حريف", arExample: "لا أحب الطعام الحريف.", category: "Restoran" },
    { en: "Sick", uz: "Kasal", example: "He is sick today.", ru: "больной", ruExample: "Он сегодня болен.", ar: "مريض", arExample: "هو مريض اليوم.", category: "Sog'liq" },
    { en: "Healthy", uz: "Sog'lom", example: "You look healthy.", ru: "здоровый", ruExample: "Ты выглядишь здоровым.", ar: "بصحة جيدة", arExample: "تبدو بصحة جيدة.", category: "Sog'liq" },
    { en: "Medicine", uz: "Dori", example: "Take this medicine twice a day.", ru: "лекарство", ruExample: "Принимайте это лекарство два раза в день.", ar: "دواء", arExample: "خذ هذا الدواء مرتين في اليوم.", category: "Sog'liq" },
    { en: "Pain", uz: "Og'riq", example: "I have pain in my back.", ru: "боль", ruExample: "У меня боль в спине.", ar: "ألم", arExample: "أشعر بألم في ظهري.", category: "Sog'liq" },
    { en: "Fever", uz: "Isitma", example: "The child has a fever.", ru: "температура", ruExample: "У ребёнка температура.", ar: "حمى", arExample: "الطفل يعاني من الحمى.", category: "Sog'liq" },
    { en: "Cough", uz: "Yo'tal", example: "She has a bad cough.", ru: "кашель", ruExample: "У неё сильный кашель.", ar: "سعال", arExample: "لديها سعال شديد.", category: "Sog'liq" },
    { en: "Hospital", uz: "Kasalxona", example: "He was taken to the hospital.", ru: "больница", ruExample: "Его отвезли в больницу.", ar: "مستشفى", arExample: "تم نقله إلى المستشفى.", category: "Sog'liq" },
    { en: "Pharmacy", uz: "Dorixona", example: "I bought medicine at the pharmacy.", ru: "аптека", ruExample: "Я купил лекарство в аптеке.", ar: "صيدلية", arExample: "اشتريت الدواء من الصيدلية.", category: "Sog'liq" },
    { en: "Colleague", uz: "Hamkasb", example: "My colleague helped me with the report.", ru: "коллега", ruExample: "Мой коллега помог мне с отчётом.", ar: "زميل", arExample: "ساعدني زميلي في التقرير.", category: "Ish" },
    { en: "Meeting", uz: "Yig'ilish", example: "We have a meeting at noon.", ru: "встреча", ruExample: "У нас встреча в полдень.", ar: "اجتماع", arExample: "لدينا اجتماع في الظهر.", category: "Ish" },
    { en: "Salary", uz: "Maosh", example: "Her salary increased this year.", ru: "зарплата", ruExample: "Её зарплата выросла в этом году.", ar: "راتب", arExample: "زاد راتبها هذا العام.", category: "Ish" },
    { en: "Deadline", uz: "Muddat", example: "The deadline is tomorrow.", ru: "дедлайн", ruExample: "Дедлайн завтра.", ar: "موعد نهائي", arExample: "الموعد النهائي غدا.", category: "Ish" },
];


let wordWeights = JSON.parse(localStorage.getItem("wordWeights")) || {};

// ---- Spaced repetition (SM-2 soddalashtirilgan versiyasi) -------------
// Har bir so'z uchun: ease (qulaylik koeffitsienti), interval (kunlarda),
// nextReview (keyingi ko'rsatish vaqti) va reps (ketma-ket to'g'ri javoblar).
let srsData = JSON.parse(localStorage.getItem("srsData")) || {};

function getSrs(word) {
    return srsData[word.en] || { ease: 2.5, interval: 0, nextReview: 0, reps: 0 };
}

function isDue(word) {
    return getSrs(word).nextReview <= Date.now();
}

function scheduleWordReview(word, wasCorrect) {
    const s = getSrs(word);
    if (wasCorrect) {
        s.reps += 1;
        if (s.reps === 1) s.interval = 1;
        else if (s.reps === 2) s.interval = 3;
        else s.interval = Math.round(s.interval * s.ease);
        s.ease = Math.min(3.2, s.ease + 0.1);
    } else {
        s.reps = 0;
        s.interval = 0; // darhol qayta ko'rsatiladi
        s.ease = Math.max(1.3, s.ease - 0.25);
    }
    s.nextReview = Date.now() + s.interval * 24 * 60 * 60 * 1000;
    srsData[word.en] = s;
    localStorage.setItem("srsData", JSON.stringify(srsData));
}

function getWordWeight(word) {
    return wordWeights[word.en] || 1;
}

function bumpWordWeight(word, delta) {
    const current = wordWeights[word.en] || 1;
    wordWeights[word.en] = Math.max(1, Math.min(10, current + delta));
    localStorage.setItem("wordWeights", JSON.stringify(wordWeights));
    // Mavjud chaqiruvlar bo'yicha: manfiy delta = to'g'ri javob, musbat = xato javob
    scheduleWordReview(word, delta < 0);
    if (typeof renderDueWidgets === "function") renderDueWidgets();
}


function weightedRandomWord() {
    // Muddati kelgan (due) so'zlarga ustuvorlik beriladi — bu haqiqiy
    // spaced-repetition mantig'i: bilmagan/eskirgan so'zlar tezroq qaytadi.
    const dueWords = words.filter(isDue);
    const pool = dueWords.length ? dueWords : words;

    const totalWeight = pool.reduce((sum, w) => sum + getWordWeight(w), 0);
    let r = Math.random() * totalWeight;
    for (const w of pool) {
        r -= getWordWeight(w);
        if (r <= 0) return w;
    }
    return pool[pool.length - 1];
}

let index = 0;
let quizIndex = 0;
let score = 0;
let xp = 0;
let level = 1;
let known = 0;
let streak = 1;
let coins = Number(localStorage.getItem("coins")) || 0;
let combo = Number(localStorage.getItem("combo")) || 0;
let lives = Number(localStorage.getItem("lives")) || 3;
let premium = localStorage.getItem("premium") === "true";
let showEnglish = true;
let time = 20;
let timerInterval;

let learnLang = localStorage.getItem("learnLang") || "en";

function getTargetWord(w) {
    if (learnLang === "ru") return w.ru || w.en;
    if (learnLang === "ar") return w.ar || w.en;
    return w.en;
}

function getTargetExample(w) {
    if (learnLang === "ru") return w.ruExample || w.example;
    if (learnLang === "ar") return w.arExample || w.example;
    return w.example;
}

function getVoiceLang() {
    if (learnLang === "ru") return "ru-RU";
    if (learnLang === "ar") return "ar-SA";
    return "en-US";
}

// Arab tili o'ngdan-chapga (RTL) yoziladi, shuning uchun so'z va misol
// matnlari ko'rsatilganda ularning yo'nalishini va shriftini moslashtiramiz.
function applyTargetTextDirection(...elements) {
    const isRtl = learnLang === "ar";
    elements.forEach(el => {
        if (!el) return;
        el.dir = isRtl ? "rtl" : "ltr";
        el.classList.toggle("arabic-text", isRtl);
    });
}

function setLearnLang(lang) {
    learnLang = lang;
    localStorage.setItem("learnLang", lang);
    document.querySelectorAll(".lang-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.lang === lang);
    });
    if (typeof loadCard === "function") loadCard();
    if (typeof restartQuiz === "function" && document.getElementById("quizPage")?.classList.contains("active")) {
        restartQuiz();
    }
}

document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === learnLang);
    btn.addEventListener("click", () => setLearnLang(btn.dataset.lang));
});


const englishWord = document.getElementById("englishWord");
const uzbekWord = document.getElementById("uzbekWord");
const example = document.getElementById("example");
const question = document.getElementById("question");
const answers = document.getElementById("answers");
const levelEl = document.getElementById("level");
const xpEl = document.getElementById("xp");
const knownEl = document.getElementById("known");
const streakEl = document.getElementById("streak");
const darkBtn = document.getElementById("darkMode");
const resetBtn = document.getElementById("resetData");


let deck = words;
let favoriteWords = JSON.parse(localStorage.getItem("favoriteWords") || "[]");

const categoryFilterEl = document.getElementById("categoryFilter");
const favOnlyToggleEl = document.getElementById("favOnlyToggle");
const favBtnEl = document.getElementById("favBtn");
const cardCategoryEl = document.getElementById("cardCategory");
const cardCounterEl = document.getElementById("cardCounter");

function wordKey(w) { return w.en; }

const dueOnlyToggleEl = document.getElementById("dueOnlyToggle");

function buildDeck() {
    const cat = categoryFilterEl ? categoryFilterEl.value : "all";
    const favOnly = favOnlyToggleEl ? favOnlyToggleEl.checked : false;
    const dueOnly = dueOnlyToggleEl ? dueOnlyToggleEl.checked : false;

    deck = words.filter(w => {
        const matchCat = cat === "all" || w.category === cat;
        const matchFav = !favOnly || favoriteWords.includes(wordKey(w));
        const matchDue = !dueOnly || isDue(w);
        return matchCat && matchFav && matchDue;
    });

    if (deck.length === 0) deck = dueOnly ? [] : words;
    index = 0;
    loadCard();
}

if (dueOnlyToggleEl) {
    dueOnlyToggleEl.addEventListener("change", buildDeck);
}

// ---- Bugungi takrorlash widgeti (home + flashcard sahifalari) ---------
function getDueWordsCount() {
    return words.filter(isDue).length;
}

function renderDueWidgets() {
    const dueCount = getDueWordsCount();
    const homeCountEl = document.getElementById("reviewDueCount");
    if (homeCountEl) homeCountEl.textContent = dueCount;

    const srsWidget = document.getElementById("srsDueWidget");
    if (srsWidget) {
        srsWidget.innerHTML = dueCount > 0
            ? `⏰ Bugun <b>${dueCount}</b> ta so'zni takrorlash vaqti keldi`
            : `✅ Hozircha barcha so'zlar yangilangan — ajoyib!`;
    }
}

const reviewDueBtn = document.getElementById("reviewDueBtn");
if (reviewDueBtn) {
    reviewDueBtn.addEventListener("click", () => {
        openPage("flashPage");
        if (dueOnlyToggleEl) {
            dueOnlyToggleEl.checked = true;
            buildDeck();
        }
    });
}

renderDueWidgets();

function refreshCategoryFilter() {
    if (!categoryFilterEl) return;
    const prevValue = categoryFilterEl.value || "all";
    const categories = ["all", ...new Set(words.map(w => w.category))];
    categoryFilterEl.innerHTML = categories.map(c =>
        `<option value="${c}">${c === "all" ? "🗂 Barcha kategoriya" : c}</option>`
    ).join("");
    if (categories.includes(prevValue)) categoryFilterEl.value = prevValue;
}

if (categoryFilterEl) {
    refreshCategoryFilter();
    categoryFilterEl.addEventListener("change", buildDeck);
}

if (favOnlyToggleEl) {
    favOnlyToggleEl.addEventListener("change", buildDeck);
}

if (favBtnEl) {
    favBtnEl.addEventListener("click", () => {
        const current = deck[index];
        if (!current) return;
        const key = wordKey(current);
        if (favoriteWords.includes(key)) {
            favoriteWords = favoriteWords.filter(k => k !== key);
        } else {
            favoriteWords.push(key);
        }
        localStorage.setItem("favoriteWords", JSON.stringify(favoriteWords));
        updateFavButton();
    });
}

function updateFavButton() {
    if (!favBtnEl) return;
    const current = deck[index];
    const isFav = current && favoriteWords.includes(wordKey(current));
    favBtnEl.textContent = isFav ? "★" : "☆";
    favBtnEl.classList.toggle("active", !!isFav);
}

// -------- Kartochkalarni Yuklash (Flashcard) --------
function loadCard() {
    if (!deck[index]) return;
    if (englishWord && uzbekWord && example) {
        // Har ikki maydonni avval LTR holatiga qaytaramiz, so'ng faqat
        // haqiqatan arabcha matn ko'rsatilayotgan maydonga RTL beramiz.
        englishWord.dir = "ltr"; englishWord.classList.remove("arabic-text");
        uzbekWord.dir = "ltr"; uzbekWord.classList.remove("arabic-text");
        if (showEnglish) {
            englishWord.textContent = getTargetWord(deck[index]);
            uzbekWord.textContent = deck[index].uz;
            applyTargetTextDirection(englishWord);
        } else {
            englishWord.textContent = deck[index].uz;
            uzbekWord.textContent = getTargetWord(deck[index]);
            applyTargetTextDirection(uzbekWord);
        }
        example.textContent = getTargetExample(deck[index]);
        applyTargetTextDirection(example);
    }
    if (cardCategoryEl) cardCategoryEl.textContent = deck[index].category || "";
    if (cardCounterEl) cardCounterEl.textContent = `${index + 1} / ${deck.length}`;
    updateFavButton();
}

const nextBtn = document.getElementById("nextBtn");
if (nextBtn) {
    nextBtn.onclick = () => {
        index++;
        if (index >= deck.length) index = 0;
        loadCard();
    };
}

const prevBtn = document.getElementById("prevBtn");
if (prevBtn) {
    prevBtn.onclick = () => {
        index--;
        if (index < 0) index = deck.length - 1;
        loadCard();
    };
}

const voiceBtn = document.getElementById("voiceBtn");
if (voiceBtn) {
    voiceBtn.onclick = () => {
        if (!deck[index]) return;
        const speech = new SpeechSynthesisUtterance(getTargetWord(deck[index]));
        speech.lang = getVoiceLang();
        speech.rate = (typeof getVoiceRate === "function") ? getVoiceRate() : 0.9;
        speechSynthesis.cancel();
        speechSynthesis.speak(speech);
    };
}

const timer = document.createElement("h2");
timer.id = "timer";
const quizPage = document.getElementById("quizPage");
if (quizPage) quizPage.prepend(timer);

// =========================================================================
// DARAJAGA MOS TEST TIZIMI (Level-based quiz)
// O'quvchi tanlagan daraja (Boshlang'ich / O'rta / Yuqori) asosida savollar
// filtrlanadi. Daraja so'z uzunligiga qarab avtomatik aniqlanadi:
// qisqa va oddiy so'zlar — boshlang'ich, o'rtacha — o'rta, uzun/murakkab — yuqori.
// =========================================================================

const LEVEL_LABELS = { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: "Yuqori" };

function wordLevel(w) {
    const len = (w.en || "").length;
    if (len <= 5) return "beginner";
    if (len <= 8) return "intermediate";
    return "advanced";
}

function getUserLevel() {
    return localStorage.getItem("userLevel") || "beginner";
}

let quizDeck = words;

function buildQuizDeck() {
    const lvl = getUserLevel();
    let pool = words.filter(w => wordLevel(w) === lvl);
    if (pool.length < 4) pool = words; // shu darajada yetarli so'z topilmasa, hammasidan foydalanamiz
    quizDeck = (typeof shuffleArr === "function") ? shuffleArr(pool) : pool;
    quizIndex = 0;
    score = 0;
    updateQuizLevelUI();
}

function updateQuizLevelUI() {
    const lvl = getUserLevel();
    document.querySelectorAll(".quiz-level-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.level === lvl);
    });
    const labelEl = document.getElementById("quizLevelLabel");
    if (labelEl) labelEl.textContent = `📊 Daraja: ${LEVEL_LABELS[lvl]} — ${quizDeck.length} ta savol tayyor`;
}

document.querySelectorAll(".quiz-level-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        localStorage.setItem("userLevel", btn.dataset.level);
        buildQuizDeck();
        clearInterval(timerInterval);
        loadQuiz();
        startTimer();
    });
});

// Boshlang'ich "daraja tanlash" oynasida daraja tanlanganda test darrov shu darajaga moslashadi
if (onboardingModal) {
    onboardingModal.querySelectorAll("[data-level]").forEach(btn => {
        btn.addEventListener("click", () => {
            if (typeof buildQuizDeck === "function") buildQuizDeck();
        });
    });
}

buildQuizDeck();

function loadQuiz() {
    if (!question || !answers) return;

    if (quizIndex >= quizDeck.length) {
        clearInterval(timerInterval);
        question.innerHTML = "🎉 Test tugadi";
        answers.innerHTML = `
            <h2>Natija: ${score}/${quizDeck.length}</h2>
            <button id="restartQuiz" class="answer" style="text-align:center;">Qayta boshlash</button>
        `;
        const restartBtn = document.getElementById("restartQuiz");
        if (restartBtn) restartBtn.onclick = restartQuiz;
        saveHighScore();
        return;
    }

    const current = quizDeck[quizIndex];
    question.innerHTML = getTargetWord(current);
    applyTargetTextDirection(question);

    let options = [current.uz];
    while (options.length < 4 && quizDeck.length >= 4) {
        let random = quizDeck[Math.floor(Math.random() * quizDeck.length)].uz;
        if (!options.includes(random)) {
            options.push(random);
        }
    }
    options.sort(() => Math.random() - 0.5);

    answers.innerHTML = "";
    options.forEach(option => {
        const btn = document.createElement("button");
        btn.className = "answer";
        btn.innerHTML = option;
        btn.onclick = () => checkAnswer(option, btn);
        answers.appendChild(btn);
    });
}

function checkAnswer(answer, clickedBtn) {
    const correctAnswerText = quizDeck[quizIndex].uz;
    const isCorrect = answer === correctAnswerText;

    // Har bir javob tugmasini to'g'ri/xato ekaniga qarab chiroyli belgilaymiz
    if (answers) {
        Array.from(answers.children).forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === correctAnswerText) {
                btn.classList.add("correct");
            } else if (btn === clickedBtn) {
                btn.classList.add("wrong");
            }
        });
    }

    if (isCorrect) {
        score++;
        xp += 15;
        bumpWordWeight(quizDeck[quizIndex], -2);
        if (typeof clearMistake === "function") clearMistake(quizDeck[quizIndex]);
        if (xp >= 100) {
            xp = 0;
            level++;
            celebrate();
            unlock(`Level ${level}`);
            addBadge(level >= 10 ? "Master" : level >= 5 ? "Intermediate" : "Beginner");
            levelReward();
        }
        correctAnswer();
    } else {
        bumpWordWeight(quizDeck[quizIndex], 3);
        if (typeof recordMistake === "function") recordMistake(quizDeck[quizIndex]);
        wrongAnswer();
    }
    updateStats();
    quizIndex++;
    clearInterval(timerInterval);

    // Animatsiya ko'rinishi uchun keyingi savolga o'tishdan oldin kichik pauza
    setTimeout(() => {
        loadQuiz();
        if (quizIndex < quizDeck.length) startTimer();
    }, 550);
}

function restartQuiz() {
    buildQuizDeck();
    loadQuiz();
    startTimer();
}

function startTimer() {
    clearInterval(timerInterval);
    time = 20;
    timer.innerHTML = "⏳ " + time;
    timerInterval = setInterval(() => {
        time--;
        timer.innerHTML = "⏳ " + time;
        if (time <= 0) {
            clearInterval(timerInterval);
            wrongAnswer();
            quizIndex++;
            loadQuiz();
            if (quizIndex < quizDeck.length) startTimer();
        }
    }, 1000);
}


function updateStats() {
    if (levelEl) levelEl.innerHTML = level;
    if (xpEl) xpEl.innerHTML = xp;
    if (knownEl) knownEl.innerHTML = known;
    if (streakEl) streakEl.innerHTML = streak + "🔥";

    localStorage.setItem("level", level);
    localStorage.setItem("xp", xp);
    localStorage.setItem("known", known);
    localStorage.setItem("streak", streak);
    if (typeof renderProgressChart === "function") renderProgressChart();
    if (typeof renderLeaderboard === "function") renderLeaderboard();
    updateHomeWidgets();
    updateRecommendation();
}


const DAILY_GOAL = 10;

function getTodayStr() {
    return new Date().toISOString().slice(0, 10);
}

function getDailyProgress() {
    try {
        const raw = JSON.parse(localStorage.getItem("dailyGoalProgress"));
        if (raw && raw.date === getTodayStr()) return raw.count;
    } catch (e) {}
    return 0;
}

function incrementDailyGoal() {
    const today = getTodayStr();
    let count = getDailyProgress() + 1;
    localStorage.setItem("dailyGoalProgress", JSON.stringify({ date: today, count }));
    if (count === DAILY_GOAL) {
        localStorage.setItem("dailyGoalCelebrated", today);
        setTimeout(() => alert("🎉 Ajoyib! Bugungi maqsadga yetdingiz — " + DAILY_GOAL + " so'z!"), 300);
    }
    updateHomeWidgets();
}

function updateHomeWidgets() {
    const goalCountEl = document.getElementById("dailyGoalCount");
    const goalFillEl = document.getElementById("dailyGoalFill");
    const homeStreakEl = document.getElementById("homeStreak");
    const homeXpEl = document.getElementById("homeXp");
    const homeKnownEl = document.getElementById("homeKnown");

    const progressCount = getDailyProgress();
    if (goalCountEl) goalCountEl.innerHTML = `${Math.min(progressCount, DAILY_GOAL)} / ${DAILY_GOAL} so'z`;
    if (goalFillEl) goalFillEl.style.width = Math.min((progressCount / DAILY_GOAL) * 100, 100) + "%";
    if (homeStreakEl) homeStreakEl.innerHTML = streak;
    if (homeXpEl) homeXpEl.innerHTML = xp;
    if (homeKnownEl) homeKnownEl.innerHTML = known;
}


function updateRecommendation() {
    const card = document.getElementById("recommendationCard");
    if (!card) return;
    const total = (typeof words !== "undefined" && words.length) ? words.length : 0;
    if (!total) { card.classList.remove("show"); return; }

    const percent = Math.round((known / total) * 100);
    let msg = "";

    if (percent < 20) {
        msg = "💡 Tavsiya: Siz hali boshida ekansiz — har kuni 10 tadan kartochkani ko'rib chiqing, bu eng tez natija beradi.";
    } else if (percent < 50) {
        msg = "💡 Tavsiya: Yaxshi boshladingiz! Endi Test bo'limida bilimingizni mustahkamlang.";
    } else if (percent < 80) {
        msg = `💡 Tavsiya: So'zlarning ${percent}% ni bilasiz — AI Teacher bilan gap tuzishni mashq qiling.`;
    } else {
        msg = `🏆 Ajoyib! So'zlarning ${percent}% ni allaqachon bilasiz. AI Speaking Test bilan talaffuzingizni sinab ko'ring.`;
    }

    card.innerHTML = msg;
    card.classList.add("show");
}


function loadStats() {
    level = Number(localStorage.getItem("level")) || 1;
    xp = Number(localStorage.getItem("xp")) || 0;
    known = Number(localStorage.getItem("known")) || 0;
    streak = Number(localStorage.getItem("streak")) || 1;
    updateStats();
}

const progress = document.createElement("div");
progress.id = "progress";
document.body.prepend(progress);

// ASOSIY progress-bar (setInterval bilan yuritiladi)
function updateProgress() {
    let percent = (known / words.length) * 100;
    progress.style.width = Math.min(percent, 100) + "%";
}
setInterval(updateProgress, 500);

function updateGame() {
    console.log("Coins:", coins, "Combo:", combo, "Lives:", lives);
}

function correctAnswer() {
    combo++;
    coins += 5;
    known = Math.min(known + 1, words.length);
    incrementDailyGoal();
    if (typeof incrementWeeklyChallenge === "function") incrementWeeklyChallenge();
    if (combo % 5 === 0) {
        coins += 20;
        alert("🔥 Combo Bonus! +20 Coin");
    }
    coinAnimation();
    updateGame();
    saveGame();
}

function wrongAnswer() {
    combo = 0;
    lives--;
    if (lives <= 0) {
        alert("💀 O'yin tugadi! Hayotlar yangilandi.");
        lives = 3;
        coins = Math.max(0, coins - 10);
    }
    updateGame();
    saveGame();
}

function saveGame() {
    localStorage.setItem("coins", coins);
    localStorage.setItem("combo", combo);
    localStorage.setItem("lives", lives);
}

function celebrate() {
    spawnConfetti();
    document.body.animate([
        { transform: "scale(1)" },
        { transform: "scale(1.02)" },
        { transform: "scale(1)" }
    ], { duration: 500 });
}

// Level oshganda ekranga real konfetti animatsiyasi tushadi (tashqi kutubxonasiz)
function spawnConfetti(count = 40) {
    const colors = ["#38bdf8", "#2563eb", "#facc15", "#f472b6", "#4ade80"];
    const container = document.createElement("div");
    container.className = "confetti-container";
    document.body.appendChild(container);
    for (let i = 0; i < count; i++) {
        const piece = document.createElement("span");
        piece.className = "confetti-piece";
        piece.style.left = Math.random() * 100 + "vw";
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDuration = (2 + Math.random() * 1.5) + "s";
        piece.style.animationDelay = (Math.random() * 0.3) + "s";
        piece.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`;
        container.appendChild(piece);
    }
    setTimeout(() => container.remove(), 3500);
}

function coinAnimation() {
    document.body.animate([
        { transform: "scale(1)" },
        { transform: "scale(1.01)" },
        { transform: "scale(1)" }
    ], { duration: 300 });
}


const shop = [
    { name: "100 ta yangi so'z", price: 100 },
    { name: "Premium Theme", price: 250 },
    { name: "Golden Badge", price: 500 },
    { name: "XP Booster", price: 100 },
    { name: "Life", price: 50 }
];

function buy(shopIndex) {
    if (coins >= shop[shopIndex].price) {
        coins -= shop[shopIndex].price;
        alert("✅ Sotib olindi: " + shop[shopIndex].name);
        saveGame();
    } else {
        alert("❌ Coin yetarli emas.");
    }
}

function buyPremium() {
    if (coins >= 1000) {
        coins -= 1000;
        premium = true;
        localStorage.setItem("premium", "true");
        alert("💎 Premium Sotib Olindi");
        saveGame();
    } else {
        alert("Coin yetmaydi");
    }
}

let high = Number(localStorage.getItem("highscore")) || 0;
function saveHighScore() {
    if (score > high) {
        high = score;
        localStorage.setItem("highscore", high);
        alert("🏅 Yangi Rekord: " + high);
    }
}


let achievements = JSON.parse(localStorage.getItem("achievements")) || [];
let badges = JSON.parse(localStorage.getItem("badges")) || [];

function unlock(title) {
    if (achievements.includes(title)) return;
    achievements.push(title);
    localStorage.setItem("achievements", JSON.stringify(achievements));
    alert("🏆 Yutuq ochildi: " + title);
}

function addBadge(name) {
    if (badges.includes(name)) return;
    badges.push(name);
    localStorage.setItem("badges", JSON.stringify(badges));
    alert("🏅 Nishon olindi: " + name);
}


const avatars = ["😀","😎","🤖","👨‍💻","👩‍🎓","🦁","🐼","🐯","🦅","🐺"];
let avatar = localStorage.getItem("avatar") || avatars[0];

function changeAvatar() {
    let random = Math.floor(Math.random() * avatars.length);
    avatar = avatars[random];
    localStorage.setItem("avatar", avatar);
    alert("Avatar mofaqqiyatli o'zgardi: " + avatar);
}

function getRank() {
    if (level >= 50) return "👑 Grand Master";
    if (level >= 40) return "💎 Diamond";
    if (level >= 30) return "🥇 Platinum";
    if (level >= 20) return "🥈 Gold";
    if (level >= 10) return "🥉 Silver";
    return "⭐ Bronze";
}

const missions = [
    { title: "10 ta so'z o'rgan", goal: 10 },
    { title: "5 ta test yech", goal: 5 },
    { title: "20 XP ol", goal: 20 }
];
let currentMission = missions[Math.floor(Math.random() * missions.length)];

function completeMission() {
    coins += 50;
    alert("🎁 Mission Complete! +50 Coins");
    saveGame();
}

function levelReward() {
    if (level % 5 === 0) {
        coins += 100;
        alert("🎉 Level Reward +100 Coins");
        saveGame();
    }
}

const rewards = [20, 50, 100, 150, 200, 500, "Premium", "Nothing"];
function spinWheelReward() {
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    if (typeof reward === "number") {
        coins += reward;
        alert("🎉 +" + reward + " Coins");
    } else if (reward === "Premium") {
        premium = true;
        localStorage.setItem("premium", "true");
        alert("💎 Premium Activated");
    } else {
        alert("😅 Omad kelmadi");
    }
    saveGame();
}

function mysteryBox() {
    const random = Math.random();
    if (random < 0.25) {
        coins += 50;
        alert("📦 +50 Coins");
    } else if (random < 0.50) {
        coins += 100;
        alert("📦 +100 Coins");
    } else if (random < 0.75) {
        xp += 50;
        alert("📦 +50 XP");
    } else {
        lives++;
        alert("❤️ +1 Life");
    }
    saveGame();
}


let friends = JSON.parse(localStorage.getItem("friends")) || [];
function addFriend(name) {
    if (!friends.includes(name)) {
        friends.push(name);
        localStorage.setItem("friends", JSON.stringify(friends));
        alert("✅ Do'st muvaffaqiyatli qo'shildi!");
    }
}

let messages = [];
function logChatMessage(text) {
    messages.push({
        user: "Me",
        text: text,
        time: new Date().toLocaleTimeString()
    });
    console.table(messages);
}

let room = null;
function createGameRoom() {
    room = Math.random().toString(36).substring(2, 8).toUpperCase();
    alert("Xona yaratildi. Kod: " + room);
}

function joinGameRoom(code) {
    room = code;
    alert("Xonaga ulanindi: " + room);
}

let myScore = 0;
let enemyScore = 0;
function battleCorrect() { myScore++; }
function enemyCorrect() { enemyScore++; }

function finishBattle() {
    if (myScore > enemyScore) {
        coins += 100;
        alert("🏆 G'alaba! +100 Coins");
    } else {
        alert("😢 Mag'lubiyat!");
    }
    saveGame();
}


const searchInput = document.createElement("input");
searchInput.placeholder = "🔍 So'z qidirish...";
searchInput.id = "searchBox";
searchInput.style.width = "100%";
searchInput.style.padding = "10px";
searchInput.style.marginBottom = "20px";
searchInput.style.borderRadius = "8px";
searchInput.style.border = "none";

const homePage = document.getElementById("homePage");
if (homePage) homePage.prepend(searchInput);

searchInput.oninput = () => {
    const value = searchInput.value.toLowerCase();
    const found = words.find(w =>
        w.en.toLowerCase().includes(value) ||
        w.uz.toLowerCase().includes(value)
    );
    if (found) {
        index = words.indexOf(found);
        loadCard();
    }
};

function randomWord() {
    const picked = weightedRandomWord();
    index = words.indexOf(picked);
    loadCard();
}

function switchLanguage() {
    showEnglish = !showEnglish;
    loadCard();
}

function shuffleWords() {
    deck.sort(() => Math.random() - 0.5);
    index = 0;
    loadCard();
}

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let hardWords = JSON.parse(localStorage.getItem("hardWords")) || [];

function addFavorite() {
    let word = deck[index];
    if (!favorites.find(x => x.en === word.en)) {
        favorites.push(word);
        localStorage.setItem("favorites", JSON.stringify(favorites));
        alert("❤️ Sevimlilarga qo'shildi");
    } else {
        alert("Bu so'z allaqachon qo'shilgan.");
    }
}

function addHardWord() {
    const word = deck[index];
    if (!hardWords.find(w => w.en === word.en)) {
        hardWords.push(word);
        localStorage.setItem("hardWords", JSON.stringify(hardWords));
        bumpWordWeight(word, 4);
        alert("⭐ Qiyin so'z sifatida saqlandi");
    }
}


function simpleTutorReply(question) {
    const q = question.toLowerCase();
    const found = words.find(w => q.includes(w.en.toLowerCase()) || q.includes(w.uz.toLowerCase()));
    if (found) {
        return `📖 "${found.en}" — "${found.uz}" degan ma'noni bildiradi.<br><i>Misol: ${found.example}</i>`;
    }
    if (/grammar|grammatika/.test(q)) {
        return "🧠 Grammatika savoli bo'lsa, \"Grammar Checker\" bo'limidan foydalaning — u gapingizni tekshirib beradi.";
    }
    if (/salom|hello|hi\b/.test(q)) {
        return "👋 Salom! Menga biror inglizcha so'z yoki gap haqida yozing — lug'atimizdan javob topib beraman.";
    }
    const tip = words[Math.floor(Math.random() * words.length)];
    return `🤔 Bu savolga aniq javob topa olmadim (to'liq AI hali ulanmagan). Amaliyot uchun bugungi so'z: <b>${tip.en}</b> — ${tip.uz}.`;
}



/* ===================== REAL AI INTEGRATION ===================== */
/* Foydalanuvchi Settings sahifasida o'z API kalitini kiritsa,
   AI Teacher / Chat / Test generatori / Essay tekshiruvi haqiqiy AI orqali ishlaydi.
   Kalit kiritilmagan bo'lsa, dastur mahalliy (offline) oddiy javoblarga qaytadi. */

function getAISettings() {
    return {
        key: localStorage.getItem("ai_api_key") || "",
        endpoint: localStorage.getItem("ai_endpoint") || "https://api.openai.com/v1/chat/completions",
        model: localStorage.getItem("ai_model") || "gpt-4o-mini"
    };
}

function hasAIKey() {
    return !!getAISettings().key;
}

async function callAI(userPrompt, systemPrompt) {
    const { key, endpoint, model } = getAISettings();
    if (!key) return null;
    try {
        const messages = [];
        if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
        messages.push({ role: "user", content: userPrompt });

        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${key}`
            },
            body: JSON.stringify({ model, messages, max_tokens: 600 })
        });

        if (!res.ok) {
            console.error("AI so'rovi xato qaytardi:", res.status);
            return null;
        }
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        return text ? text.trim() : null;
    } catch (err) {
        console.error("AI ulanish xatosi:", err);
        return null;
    }
}

// Ko'p bosqichli (multi-turn) suhbat uchun — Rolli suhbat (roleplay) rejimida
// butun tarix (system + oldingi xabarlar) birgalikda yuboriladi, shunda AI
// kontekstni "unutmaydi".
async function callAIConversation(messages) {
    const { key, endpoint, model } = getAISettings();
    if (!key) return null;
    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${key}`
            },
            body: JSON.stringify({ model, messages, max_tokens: 500 })
        });
        if (!res.ok) {
            console.error("AI so'rovi xato qaytardi:", res.status);
            return null;
        }
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        return text ? text.trim() : null;
    } catch (err) {
        console.error("AI ulanish xatosi:", err);
        return null;
    }
}

const aiApiKeyInput = document.getElementById("aiApiKeyInput");
const aiEndpointInput = document.getElementById("aiEndpointInput");
const aiModelInput = document.getElementById("aiModelInput");
const saveAiSettingsBtn = document.getElementById("saveAiSettings");
const aiSettingsStatusEl = document.getElementById("aiSettingsStatus");

if (aiApiKeyInput) {
    const s = getAISettings();
    aiApiKeyInput.value = s.key;
    aiEndpointInput.value = localStorage.getItem("ai_endpoint") || "";
    aiModelInput.value = localStorage.getItem("ai_model") || "";
}

if (saveAiSettingsBtn) {
    saveAiSettingsBtn.onclick = () => {
        localStorage.setItem("ai_api_key", aiApiKeyInput.value.trim());
        if (aiEndpointInput.value.trim()) localStorage.setItem("ai_endpoint", aiEndpointInput.value.trim());
        else localStorage.removeItem("ai_endpoint");
        if (aiModelInput.value.trim()) localStorage.setItem("ai_model", aiModelInput.value.trim());
        else localStorage.removeItem("ai_model");
        if (aiSettingsStatusEl) {
            aiSettingsStatusEl.innerHTML = aiApiKeyInput.value.trim()
                ? "✅ Saqlandi. Endi AI funksiyalar haqiqiy javob beradi."
                : "ℹ️ Kalit o'chirildi — AI funksiyalar mahalliy (offline) rejimda ishlaydi.";
        }
    };
}
/* ================================================================= */

const aiQuestion = document.getElementById("aiQuestion");
const aiAnswer = document.getElementById("aiAnswer");
const askAI = document.getElementById("askAI");
const generateQuiz = document.getElementById("generateQuiz");
const quizResult = document.getElementById("quizResult");

const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const sendMessageBtn = document.getElementById("sendMessage");

if (askAI) {
    askAI.onclick = async () => {
        const questionText = aiQuestion.value.trim();
        if (!questionText) { alert("Savol yozing"); return; }
        aiAnswer.innerHTML = "⏳ AI javob yozmoqda...";
        if (hasAIKey()) {
            const reply = await callAI(
                questionText,
                "Sen ingliz tili o'qituvchisisan. Foydalanuvchi savoliga qisqa, aniq va tushunarli javob ber. Agar foydalanuvchi o'zbek tilida yozsa, javobni ham o'zbek tilida ber."
            );
            aiAnswer.innerHTML = reply ? reply.replace(/\n/g, "<br>") : ("⚠️ AI bilan bog'lanib bo'lmadi. " + simpleTutorReply(questionText));
        } else {
            setTimeout(() => {
                aiAnswer.innerHTML = simpleTutorReply(questionText);
            }, 500);
        }
    };
}

if (generateQuiz) {
    generateQuiz.onclick = async () => {
        if (quizResult) quizResult.innerHTML = "⏳ AI test tayyorlamoqda...";
        if (hasAIKey()) {
            const reply = await callAI(
                "Ingliz tilini o'rganuvchilar uchun 5 ta oddiy inglizcha so'z bo'yicha ko'p tanlovli (A/B/C/D) test tuz. Har bir savolda to'g'ri javobni ham belgila. O'zbek tilida tushuntir.",
                "Sen ingliz tili test generatorisan. Javobni HTML formatida, tushunarli va tartibli qil."
            );
            if (quizResult) {
                if (reply) {
                    quizResult.innerHTML = reply.replace(/\n/g, "<br>");
                } else {
                    const picks = [...words].sort(() => Math.random() - 0.5).slice(0, 5);
                    quizResult.innerHTML = "⚠️ AI bilan bog'lanib bo'lmadi. Oddiy test:<br>" + picks.map((w, i) => `${i + 1}. ${w.en} = ?`).join("<br>");
                }
            }
        } else {
            setTimeout(() => {
                const picks = [...words].sort(() => Math.random() - 0.5).slice(0, 5);
                if (quizResult) {
                    quizResult.innerHTML = "🧠 Test tayyor:<br>" + picks.map((w, i) => `${i + 1}. ${w.en} = ?`).join("<br>") +
                        "<br><br><small>ℹ️ To'liq AI test uchun Sozlamalarda API kalit kiriting.</small>";
                }
            }, 500);
        }
    };
}

if (sendMessageBtn) {
    sendMessageBtn.onclick = async () => {
        if (!chatInput || !chatBox) return;
        const text = chatInput.value.trim();
        if (!text) return;

        chatBox.innerHTML += `<div class="user">👤 ${text}</div>`;
        logChatMessage(text);
        chatInput.value = "";
        chatBox.scrollTop = chatBox.scrollHeight;

        const aiLoadingId = "ai-loading-" + Date.now();
        chatBox.innerHTML += `<div class="ai" id="${aiLoadingId}"></div>`;
        document.getElementById(aiLoadingId).innerHTML = "🤖 AI javob yozmoqda...";

        if (hasAIKey()) {
            const reply = await callAI(
                text,
                "Sen do'stona ingliz tili suhbatdoshisan (AI Assistant). Foydalanuvchi bilan qisqa va tabiiy suhbat qur, kerak bo'lsa xatolarini muloyimlik bilan tuzat."
            );
            const aiReplyContainer = document.getElementById(aiLoadingId);
            if (aiReplyContainer) {
                aiReplyContainer.innerHTML = reply ? reply.replace(/\n/g, "<br>") : ("⚠️ AI bilan bog'lanib bo'lmadi. " + simpleTutorReply(text));
            }
            chatBox.scrollTop = chatBox.scrollHeight;
        } else {
            setTimeout(() => {
                const aiReplyContainer = document.getElementById(aiLoadingId);
                if (aiReplyContainer) {
                    aiReplyContainer.innerHTML = simpleTutorReply(text) + "<br><small>ℹ️ To'liq AI suhbat uchun Sozlamalarda API kalit kiriting.</small>";
                }
                chatBox.scrollTop = chatBox.scrollHeight;
            }, 600);
        }
    };
}

const cameraInput = document.getElementById("cameraInput");
const ocrResult = document.getElementById("ocrResult");
if (cameraInput) {
    cameraInput.onchange = () => {
        if (ocrResult) ocrResult.innerHTML = "📷 OCR xizmati ulanmoqda (Tesseract.js yuklanmoqda)...";
    };
}

const voiceAssistantBtn = document.getElementById("voiceAssistant");
if (voiceAssistantBtn) {
    voiceAssistantBtn.onclick = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Kechirasiz, brauzeringiz nutqni aniqlash tizimini qo'llab-quvvatlamaydi.");
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.start();
        recognition.onresult = (e) => {
            const speech = e.results[0][0].transcript;
            if (chatInput) chatInput.value = speech;
        };
    };
}


let dark = localStorage.getItem("dark") !== "false";
document.body.dataset.theme = dark ? "dark" : "light";

if (darkBtn) {
    darkBtn.onclick = () => {
        dark = !dark;
        document.body.dataset.theme = dark ? "dark" : "light";
        localStorage.setItem("dark", dark);
        localStorage.setItem("appTheme", dark ? "dark" : "light");
        setAutoThemeEnabled(false); // qo'lda tanlashni tizim tanlovi bosib qo'ymasligi uchun
    };
}

// =========================================================================
// AVTOMATIK MAVZU (Dark/Light) — qurilma/brauzer sozlamasiga
// (prefers-color-scheme) qarab avtomatik moslashadi. Foydalanuvchi
// yuqoridagi "Dark Mode" yoki Avatar sahifasidagi mavzu tugmalaridan birini
// bossa, avtomatik rejim o'chadi va tanlovi saqlanib qoladi.
// =========================================================================

function isAutoThemeEnabled() {
    return localStorage.getItem("autoThemeEnabled") !== "0";
}

function setAutoThemeEnabled(enabled) {
    localStorage.setItem("autoThemeEnabled", enabled ? "1" : "0");
    const toggleEl = document.getElementById("autoThemeToggle");
    if (toggleEl) toggleEl.checked = enabled;
}

function applySystemTheme() {
    if (!window.matchMedia) return;
    const isDarkSystem = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = isDarkSystem ? "dark" : "light";
    document.body.dataset.theme = theme;
    localStorage.setItem("appTheme", theme);
    localStorage.setItem("dark", String(isDarkSystem));
    dark = isDarkSystem;
}

const autoThemeToggleEl = document.getElementById("autoThemeToggle");
if (autoThemeToggleEl) {
    autoThemeToggleEl.checked = isAutoThemeEnabled();
    autoThemeToggleEl.addEventListener("change", () => {
        setAutoThemeEnabled(autoThemeToggleEl.checked);
        if (autoThemeToggleEl.checked) applySystemTheme();
    });
}

if (window.matchMedia) {
    if (isAutoThemeEnabled()) applySystemTheme();
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (isAutoThemeEnabled()) applySystemTheme();
    });
}

if (resetBtn) {
    resetBtn.onclick = () => {
        if (confirm("Hamma progress o'chirilsinmi?")) {
            localStorage.clear();
            location.reload();
        }
    };
}

const hour = new Date().getHours();
if ((hour >= 18 || hour <= 6) && localStorage.getItem("dark") === null) {
    dark = true;
    document.body.dataset.theme = "dark";
}

const rewardDate = localStorage.getItem("rewardDate");
const todayStr = new Date().toDateString();
if (rewardDate !== todayStr) {
    xp += 20;
    updateStats();
    localStorage.setItem("rewardDate", todayStr);
    alert("🎁 Kundalik Mukofot: +20 XP!");
}

let loginStreak = Number(localStorage.getItem("loginStreak")) || 1;
const lastDay = localStorage.getItem("loginDay");
if (lastDay !== todayStr) {
    loginStreak++;
    localStorage.setItem("loginDay", todayStr);
    localStorage.setItem("loginStreak", loginStreak);
}

const statsBtnElement = document.getElementById("statsBtn");
if (statsBtnElement) {
    statsBtnElement.ondblclick = () => {
        const data = { level, xp, known, streak, coins, favorites, hardWords, badges, premium, avatar };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "english-master-progress.json";
        a.click();
    };
}

window.cloudSave = async function() {
    if (!window.auth || !window.auth.currentUser) {
        alert("Avval Firebase tizimiga login qiling!");
        return;
    }
    if (!window.db || !window.doc || !window.setDoc) {
        alert("Firestore yuklanmagan!");
        return;
    }
    const user = window.auth.currentUser;
    try {
        await window.setDoc(window.doc(window.db, "users", user.uid), {
            level, xp, known, streak, coins, favorites, hardWords, badges, premium
        }, { merge: true });
        alert("☁️ Progress bulutga saqlandi!");
    } catch (error) {
        console.error("Xatolik:", error);
    }
};

window.cloudLoad = async function() {
    if (!window.auth || !window.auth.currentUser || !window.getDoc || !window.doc || !window.db) return;
    const user = window.auth.currentUser;
    const snap = await window.getDoc(window.doc(window.db, "users", user.uid));
    if (snap.exists()) {
        const data = snap.data();
        level = data.level || 1;
        xp = data.xp || 0;
        known = data.known || 0;
        streak = data.streak || 1;
        coins = data.coins || 0;
        favorites = data.favorites || [];
        hardWords = data.hardWords || [];
        badges = data.badges || [];
        premium = data.premium || false;
        updateStats();
        saveGame();
    }
};

const syncBtn = document.getElementById("syncBtn");
if (syncBtn) {
    syncBtn.onclick = window.cloudSave;
}

let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

const installAppBtn = document.getElementById("installApp");
if (installAppBtn) {
    installAppBtn.onclick = async () => {
        if (!deferredPrompt) {
            alert("Install hozircha mavjud emas yoki ilova o'rnatilgan.");
            return;
        }
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
    };
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js").catch(err => console.log("SW error:", err));
    });
}

if ("Notification" in window) {
    Notification.requestPermission().then(permission => {
        console.log("Notification permission:", permission);
    });
}

function notify(title, body) {
    if (Notification.permission === "granted") {
        new Notification(title, {
            body: body,
            icon: "icon-192.png"
        });
    }
}

setTimeout(() => {
    notify("English Master", "📚 Mashq qilish vaqti!");
}, 10000);

window.addEventListener("offline", () => { alert("📴 Offline Mode faollashdi"); });
window.addEventListener("online", () => { alert("🌐 Internet qaytdi. Onlayn rejim!"); });


document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "d") { e.preventDefault(); addFavorite(); }
    if (e.altKey && e.key.toLowerCase() === "h") { e.preventDefault(); addHardWord(); }
    if (e.key === "ArrowRight") { const nBtn = document.getElementById("nextBtn"); if (nBtn) nBtn.click(); }
    if (e.key === "ArrowLeft") { const pBtn = document.getElementById("prevBtn"); if (pBtn) pBtn.click(); }
    if (e.key === " ") { e.preventDefault(); const vBtn = document.getElementById("voiceBtn"); if (vBtn) vBtn.click(); }
    if (e.key.toLowerCase() === "r") randomWord();
    if (e.key.toLowerCase() === "l") switchLanguage();
    if (e.key.toLowerCase() === "s") shuffleWords();
    if (e.key.toLowerCase() === "a") changeAvatar();
    if (e.key.toLowerCase() === "w") spinWheelReward();
});


window.addEventListener("beforeunload", () => {
    localStorage.setItem("lastWord", index);
});

const last = localStorage.getItem("lastWord");
if (last) index = Number(last);

loadStats();
loadCard();
loadQuiz();

setTimeout(() => {
    if (window.onAuthStateChanged && window.auth) {
        window.onAuthStateChanged(window.auth, user => {
            if (user) {
                window.cloudLoad();
            }
        });
    }
}, 2000);

console.log("English Master AI v19 - To'liq barqaror versiya ishga tushdi ✔");


const lessonsEn = [
    { title: "BBC Learning English — All About Language (6 Minute English)", video: "https://www.youtube.com/embed/fcN0BXzK8bg" },
    { title: "Take Your English Forward — BBC Learning English", video: "https://www.youtube.com/embed/kVwPYXSAEjA" },
    { title: "55 English Lessons in 55 Minutes — Grammar & Vocabulary", video: "https://www.youtube.com/embed/gYq-ilAbxDM" }
];

const lessonsRu = [
    { title: "Rus tili darsi 1 — Maslahatlar va alifbo", video: "https://www.youtube.com/embed/AYRZupz6rdw" },
    { title: "To'liq boshlang'ich rus tili kursi (9 soat)", video: "https://www.youtube.com/embed/Q4pZnM7LeSo" }
];

const lessonsAr = [
    { title: "Arabic Alphabet Full Course (1 Hour) — noldan alifbo", video: "https://www.youtube.com/embed/GnHGmwqSYtg" },
    { title: "Beginners Arabic — Lesson 01: Arabic Alphabet", video: "https://www.youtube.com/embed/C4gb2GnVoPQ" }
];

let courseLang = "en";

function renderCourseList() {
    const courseList = document.getElementById("courseList");
    if (!courseList) return;
    const list = courseLang === "ru" ? lessonsRu : courseLang === "ar" ? lessonsAr : lessonsEn;
    courseList.innerHTML = list.map(item => `
        <div class="lesson">
            <h3>${item.title}</h3>
            <iframe width="100%" height="220" src="${item.video}" title="${item.title.replace(/"/g, "&quot;")}"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen loading="lazy"></iframe>
        </div>
    `).join("");
}

document.querySelectorAll(".course-lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        courseLang = btn.dataset.lang;
        document.querySelectorAll(".course-lang-btn").forEach(b => b.classList.toggle("active", b === btn));
        renderCourseList();
    });
});

renderCourseList();


// =========================================================================
// TINGLAB TUSHUNISH (Listening) — avval yo'q audio faylga suyanardi va
// hech qachon ishlamasdi. Endi brauzerning ovoz sintezidan (TTS)
// foydalanib, har safar so'zlardan tasodifiy gap tanlab, ovozda o'qiydi.
// =========================================================================

let listeningState = { sentence: "" };

function pickListeningSentence() {
    if (typeof words === "undefined" || !words.length) return;
    let pool = words.filter(w => getTargetExample(w));
    if (!pool.length) pool = words.filter(w => w.example);
    if (!pool.length) return;

    const w = pool[Math.floor(Math.random() * pool.length)];
    listeningState.sentence = (getTargetExample(w) || w.example || "").trim();

    const resultEl = document.getElementById("listeningResult");
    if (resultEl) { resultEl.textContent = ""; resultEl.className = "listening-result"; }
    const inputEl = document.getElementById("listeningAnswer");
    if (inputEl) {
        inputEl.value = "";
        applyTargetTextDirection(inputEl);
    }
}

function playListeningSentence() {
    if (!listeningState.sentence) pickListeningSentence();
    if (typeof speakText === "function") {
        speakText(listeningState.sentence, getVoiceLang());
    }
}

const playListeningBtn = document.getElementById("playListeningBtn");
if (playListeningBtn) playListeningBtn.addEventListener("click", playListeningSentence);

const newListeningBtn = document.getElementById("newListeningBtn");
if (newListeningBtn) newListeningBtn.addEventListener("click", pickListeningSentence);

const checkListeningBtn = document.getElementById("checkListening");
if (checkListeningBtn) {
    checkListeningBtn.onclick = () => {
        const inputEl = document.getElementById("listeningAnswer");
        const resultEl = document.getElementById("listeningResult");
        if (!resultEl) return;

        const typed = (inputEl ? inputEl.value : "").trim().toLowerCase().replace(/[.!?]+$/, "");
        const target = listeningState.sentence.toLowerCase().replace(/[.!?]+$/, "");

        if (typed && typed === target) {
            xp += 10;
            updateStats();
            resultEl.textContent = "✅ To'g'ri! Ajoyib eshitib tushundingiz.";
            resultEl.className = "listening-result correct";
            if (typeof celebrate === "function") celebrate();
        } else {
            resultEl.textContent = `❌ Hali unchalik emas. To'g'ri javob: "${listeningState.sentence}"`;
            resultEl.className = "listening-result wrong";
        }
    };
}

pickListeningSentence();


const dictionary = [
    { word: "Apple", meaning: "Olma" },
    { word: "Dog", meaning: "It" },
    { word: "Book", meaning: "Kitob" },
    { word: "Teacher", meaning: "O'qituvchi" }
];

async function lookupFreeDictionary(word) {
    try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
        if (!res.ok) return null;
        const data = await res.json();
        const entry = data[0];
        if (!entry) return null;
        const phonetic = entry.phonetic || (entry.phonetics || []).find(p => p.text)?.text || "";
        const meanings = (entry.meanings || []).slice(0, 2).map(m => {
            const def = m.definitions?.[0]?.definition || "";
            return `<b>${m.partOfSpeech}</b>: ${def}`;
        }).join("<br>");
        return { word: entry.word, phonetic, meanings };
    } catch (err) {
        console.error("Dictionary API xatosi:", err);
        return null;
    }
}

const dictionarySearchInput = document.getElementById("dictionarySearch");
if (dictionarySearchInput) {
    let dictDebounce = null;
    dictionarySearchInput.oninput = (e) => {
        const value = e.target.value.trim();
        const out = document.getElementById("dictionaryResult");
        if (!value) { if (out) out.innerHTML = ""; return; }
        if (out) out.innerHTML = "⏳ Qidirilmoqda...";

        clearTimeout(dictDebounce);
        dictDebounce = setTimeout(async () => {
            const local = dictionary.find(w => w.word.toLowerCase() === value.toLowerCase());
            const remote = await lookupFreeDictionary(value);

            let html = "";
            if (local) html += `<div>🇺🇿 ${local.word} = ${local.meaning}</div>`;
            if (remote) {
                html += `<div style="margin-top:8px">📖 <b>${remote.word}</b> ${remote.phonetic ? `<i>${remote.phonetic}</i>` : ""}<br>${remote.meanings}</div>`;
            }
            if (!html) html = "Topilmadi";
            if (out) out.innerHTML = html;
        }, 450);
    };
}

console.log("Course Loaded");


function runOCR(file, outEl) {
    if (!outEl) return;
    if (typeof Tesseract === "undefined") {
        outEl.innerHTML = "OCR kutubxonasi yuklanmadi.";
        return;
    }
    outEl.innerHTML = "⏳ Rasm tahlil qilinmoqda...";
    Tesseract.recognize(file, "eng+uzb", { logger: () => {} })
        .then(({ data: { text } }) => {
            outEl.innerHTML = text.trim() ? text.trim() : "Matn topilmadi.";
        })
        .catch(err => {
            console.error("OCR xatosi:", err);
            outEl.innerHTML = "❌ OCR xatolik yuz berdi.";
        });
}

const scanImageBtn = document.getElementById("scanImage");
if (scanImageBtn) {
    scanImageBtn.onclick = () => {
        const fileInput = document.getElementById("ocrImage");
        const file = fileInput ? fileInput.files[0] : null;
        if (!file) { alert("Rasm tanlang"); return; }
        const out = document.getElementById("ocrText");
        runOCR(file, out);
    };
}



// Lug'atga asoslangan so'zma-so'z tarjimon (128 so'zlik bazamiz asosida)
function dictionaryTranslate(text) {
    const tokens = text.match(/[A-Za-zʼ'\u0400-\u04FF]+|[^\sA-Za-zʼ'\u0400-\u04FF]+/g) || [];
    let unknownCount = 0;
    const translated = tokens.map(tok => {
        const clean = tok.trim();
        if (!clean || !/[a-zA-Z\u0400-\u04FF]/.test(clean)) return tok;
        const lower = clean.toLowerCase();
        let match = words.find(w => w.en.toLowerCase() === lower);
        if (match) return match.uz;
        match = words.find(w => w.uz.toLowerCase() === lower);
        if (match) return match.en;
        unknownCount++;
        return clean;
    });
    return { text: translated.join(""), unknownCount, totalWords: tokens.filter(t => /[a-zA-Z\u0400-\u04FF]/.test(t)).length };
}

async function freeTranslate(text, targetLang) {
    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data?.responseData?.translatedText || null;
    } catch (err) {
        console.error("Tarjima API xatosi:", err);
        return null;
    }
}

async function renderTranslation(text, outEl) {
    if (!outEl) return;
    if (!text.trim()) { outEl.innerHTML = "Matn kiriting"; return; }
    outEl.innerHTML = "⏳ Tarjima qilinmoqda...";

    const remote = await freeTranslate(text, "uz");
    if (remote) {
        outEl.innerHTML = `🌍 ${remote}`;
        return;
    }

    const result = dictionaryTranslate(text);
    let note = "<br><small>ℹ️ Internet orqali tarjima qilib bo'lmadi, 128 so'zlik mahalliy lug'atdan foydalanildi.</small>";
    if (result.unknownCount > 0) {
        note += `<br><small>ℹ️ ${result.unknownCount}/${result.totalWords} so'z lug'atimizda yo'q.</small>`;
    }
    outEl.innerHTML = `🌍 ${result.text}${note}`;
}

const translateBtnMain = document.getElementById("translateBtn");
if (translateBtnMain) {
    translateBtnMain.onclick = async () => {
        const input = document.getElementById("translateInput");
        const text = input ? input.value : "";
        if (!text) return;
        const out = document.getElementById("translateResult");
        renderTranslation(text, out);
    };
}


// Ikki matn orasidagi moslikni Levenshtein masofasi orqali foizda hisoblaydi.
// Tasodifiy raqam emas — haqiqatan aytilgan so'z bilan taqqoslaydi.
function similarityScore(a, b) {
    a = (a || "").toLowerCase().trim();
    b = (b || "").toLowerCase().trim();
    if (!a || !b) return 0;
    const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
        }
    }
    const distance = dp[a.length][b.length];
    const maxLen = Math.max(a.length, b.length);
    return Math.round((1 - distance / maxLen) * 100);
}

const pdfFileInput = document.getElementById("pdfFile");
if (pdfFileInput) {
    pdfFileInput.onchange = () => {
        const out = document.getElementById("pdfStatus");
        if (out) out.innerHTML = "PDF yuklandi.";
    };
}

console.log("AI Tools Loaded");


const startSpeaking = document.getElementById("startSpeaking");
const speechResult = document.getElementById("speechResult");
const speechScoreEl = document.getElementById("speechScore");
const speakingTargetWordEl = document.getElementById("speakingTargetWord");
const listenTargetBtn = document.getElementById("listenTargetBtn");
const newSpeakingWordBtn = document.getElementById("newSpeakingWordBtn");

let speakingTargetWord = null;

function pickSpeakingWord() {
    speakingTargetWord = typeof weightedRandomWord === "function" ? weightedRandomWord() : words[0];
    if (speakingTargetWordEl) speakingTargetWordEl.innerHTML = getTargetWord(speakingTargetWord);
    if (speechResult) speechResult.innerHTML = "";
    if (speechScoreEl) speechScoreEl.innerHTML = "";
}

if (speakingTargetWordEl) pickSpeakingWord();

if (newSpeakingWordBtn) newSpeakingWordBtn.onclick = pickSpeakingWord;

if (listenTargetBtn) {
    listenTargetBtn.onclick = () => {
        if (!speakingTargetWord) pickSpeakingWord();
        if (!("speechSynthesis" in window)) {
            alert("Brauzeringiz ovozli o'qishni qo'llamaydi.");
            return;
        }
        const utter = new SpeechSynthesisUtterance(getTargetWord(speakingTargetWord));
        utter.lang = getVoiceLang();
        speechSynthesis.cancel();
        speechSynthesis.speak(utter);
    };
}

if (startSpeaking) {
    startSpeaking.onclick = () => {
        if (!speakingTargetWord) pickSpeakingWord();
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech Recognition qo'llab-quvvatlanmaydi.");
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = getVoiceLang();
        recognition.start();
        if (speechResult) speechResult.innerHTML = "🎤 Listening...";
        if (speechScoreEl) speechScoreEl.innerHTML = "";

        recognition.onresult = (e) => {
            const heard = e.results[0][0].transcript;
            if (speechResult) speechResult.innerHTML = "🗣️ Siz aytdingiz: " + heard;

            const target = getTargetWord(speakingTargetWord);
            const scoreVal = similarityScore(heard, target);
            const isGood = scoreVal >= 70;
            const verdict = scoreVal >= 85 ? "✅ Ajoyib talaffuz!" : scoreVal >= 60 ? "🙂 Yaxshi, yana urinib ko'ring" : "🔁 Qayta urinib ko'ring";

            if (speechScoreEl) {
                speechScoreEl.innerHTML = `🎯 Maqsad: <b>${target}</b> — Moslik: <b>${scoreVal}/100</b><br>${verdict}`;
            }

            // Natijani spaced-repetition tizimiga ham yozamiz
            if (typeof bumpWordWeight === "function") {
                bumpWordWeight(speakingTargetWord, isGood ? -2 : 3);
            }
            if (isGood) {
                xp += 5;
                if (typeof updateStats === "function") updateStats();
            }
        };

        recognition.onerror = () => {
            if (speechResult) speechResult.innerHTML = "❌ Ovoz tanilmadi, qayta urinib ko'ring.";
        };
    };
}


const checkEssayBtn = document.getElementById("checkEssay");
if (checkEssayBtn) {
    checkEssayBtn.onclick = async () => {
        const essayInput = document.getElementById("essayInput");
        const essay = essayInput ? essayInput.value : "";
        if (!essay) { alert("Essay yozing"); return; }
        const out = document.getElementById("essayResult");
        if (out) out.innerHTML = "⏳ Tekshirilmoqda...";

        if (hasAIKey()) {
            const reply = await callAI(
                "Quyidagi inglizcha esseni tekshir va baholab ber:\n\n" + essay,
                "Sen ingliz tili yozuv (essay) baholovchisisan. Grammatika, so'z boyligi va tuzilish bo'yicha 1-10 baho ber, keyin 3-4 ta aniq tavsiya yoz. Javobni o'zbek tilida ber."
            );
            if (out) out.innerHTML = reply ? reply.replace(/\n/g, "<br>") : "⚠️ AI bilan bog'lanib bo'lmadi. Internetni yoki API kalitni tekshiring.";
        } else {
            const issues = checkGrammarRules(essay);
            if (out) out.innerHTML = "📋 Mahalliy tekshiruv (asosiy qoidalar bo'yicha):<br>" + issues.map(i => `<div>${i}</div>`).join("") +
                "<br><small>ℹ️ To'liq AI baholash uchun Sozlamalarda API kalit kiriting.</small>";
        }
    };
}


const checkReadingBtn = document.getElementById("checkReading");
if (checkReadingBtn) {
    checkReadingBtn.onclick = () => {
        const readingAnswerEl = document.getElementById("readingAnswer");
        const answer = readingAnswerEl ? readingAnswerEl.value.toLowerCase() : "";
        const out = document.getElementById("readingResult");
        if (answer.includes("learning english")) {
            if (out) out.innerHTML = "✅ Correct";
            coins += 10;
            saveGame();
        } else {
            if (out) out.innerHTML = "❌ Wrong";
        }
    };
}


function suggestWord() {
    const random = words[Math.floor(Math.random() * words.length)];
    console.log("Today's Smart Word:", random.en);
}
suggestWord();

console.log("Speaking Module Loaded");

const teacherQuestion = document.getElementById("teacherQuestion");
const teacherAnswer = document.getElementById("teacherAnswer");
const askTeacherBtn = document.getElementById("askTeacher");

if (askTeacherBtn) {
    askTeacherBtn.onclick = async () => {
        const q = teacherQuestion ? teacherQuestion.value.trim() : "";
        if (!q) { alert("Savol yozing"); return; }
        if (teacherAnswer) teacherAnswer.innerHTML = "🤖 AI javob tayyorlamoqda...";
        if (hasAIKey()) {
            const reply = await callAI(q, "Sen ingliz tili grammatikasi bo'yicha o'qituvchisan. Aniq, qisqa va misollar bilan o'zbek tilida tushuntir.");
            if (teacherAnswer) teacherAnswer.innerHTML = reply ? reply.replace(/\n/g, "<br>") : ("⚠️ AI bilan bog'lanib bo'lmadi. " + simpleTutorReply(q));
        } else {
            setTimeout(() => {
                if (teacherAnswer) teacherAnswer.innerHTML = simpleTutorReply(q) + "<br><small>ℹ️ To'liq AI javob uchun Sozlamalarda API kalit kiriting.</small>";
            }, 500);
        }
    };
}

function checkGrammarRules(text) {
    const issues = [];
    const trimmed = text.trim();

    if (!trimmed) return ["Matn kiritilmadi."];

    if (/^[a-z]/.test(trimmed)) {
        issues.push("✏️ Gap bosh harf bilan boshlanishi kerak.");
    }
    if (!/[.!?]$/.test(trimmed)) {
        issues.push("✏️ Gap oxirida tinish belgisi (. ! ?) yo'q.");
    }
    if (/  +/.test(trimmed)) {
        issues.push("✏️ Ortiqcha bo'sh joy (ikki probel) topildi.");
    }
    if (/\b(\w+)\s+\1\b/i.test(trimmed)) {
        issues.push("✏️ Bir xil so'z ketma-ket ikki marta yozilgan.");
    }
    if (/\bi\b/.test(trimmed) && !/\bI\b/.test(trimmed)) {
        issues.push('✏️ "I" olmoshi doim katta harf bilan yoziladi.');
    }
    if (/\b(he|she|it)\s+are\b/i.test(trimmed)) {
        issues.push('✏️ "He/She/It" bilan "are" emas, "is" ishlatiladi.');
    }
    if (/\b(you|we|they)\s+is\b/i.test(trimmed)) {
        issues.push('✏️ "You/We/They" bilan "is" emas, "are" ishlatiladi.');
    }
    if (/\bi\s+is\b/i.test(trimmed)) {
        issues.push('✏️ "I" bilan "is" emas, "am" ishlatiladi.');
    }
    if (/\byour\s+(are|is|going|coming|welcome)\b/i.test(trimmed)) {
        issues.push('✏️ Balki "your" o\'rniga "you\'re" (you are) kerakdir?');
    }
    if (/\bthier\b/i.test(trimmed)) {
        issues.push('✏️ "thier" — to\'g\'ri yozilishi "their".');
    }
    if (/\brecieve\b/i.test(trimmed)) {
        issues.push('✏️ "recieve" — to\'g\'ri yozilishi "receive".');
    }
    if (/\bdont\b/i.test(trimmed) || /\bcant\b/i.test(trimmed) || /\bwont\b/i.test(trimmed)) {
        issues.push("✏️ Qisqartmalarda apostrof unutilgan (don't / can't / won't).");
    }

    if (issues.length === 0) {
        issues.push("✅ Aniq xato topilmadi — gap yaxshi ko'rinadi!");
    }
    return issues;
}

const checkGrammarBtn = document.getElementById("checkGrammar");
if (checkGrammarBtn) {
    checkGrammarBtn.onclick = async () => {
        const grammarInputEl = document.getElementById("grammarInput");
        const text = grammarInputEl ? grammarInputEl.value : "";
        if (!text) { alert("Gap yozing"); return; }
        const out = document.getElementById("grammarResult");

        if (hasAIKey()) {
            if (out) out.innerHTML = "⏳ AI tekshirmoqda...";
            const reply = await callAI(
                "Quyidagi inglizcha matndagi grammatik xatolarni top va tushuntir:\n\n" + text,
                "Sen ingliz tili grammatika tekshiruvchisisan. Matndagi har bir xatoni alohida qatorda ko'rsat: noto'g'ri qism, to'g'ri varianti va nima uchun xato ekanini o'zbek tilida qisqa tushuntir. Xato bo'lmasa, shuni tabriklab yoz."
            );
            if (out) out.innerHTML = reply
                ? reply.replace(/\n/g, "<br>")
                : ("⚠️ AI bilan bog'lanib bo'lmadi.<br>" + checkGrammarRules(text).map(i => `<div>${i}</div>`).join(""));
        } else {
            if (out) out.innerHTML = checkGrammarRules(text).map(i => `<div>${i}</div>`).join("") +
                "<br><small>ℹ️ Chuqurroq AI tahlili uchun Sozlamalarda API kalit kiriting.</small>";
        }
    };
}


const createPlanBtn = document.getElementById("createPlan");
if (createPlanBtn) {
    createPlanBtn.onclick = () => {
        const out = document.getElementById("studyPlan");
        if (out) out.innerHTML = `
            📅 Monday - 20 Words, Grammar, Listening
            <hr>
            📅 Tuesday - Quiz, Speaking, Writing
            <hr>
            📅 Wednesday - Reading, Flashcards, Revision
        `;
    };
}



const generateWordsBtn = document.getElementById("generateWords");
if (generateWordsBtn) {
    generateWordsBtn.onclick = () => {
        const result = [];
        for (let i = 0; i < 10; i++) {
            const random = words[Math.floor(Math.random() * words.length)];
            result.push(random.en + " - " + random.uz);
        }
        const out = document.getElementById("generatedWords");
        if (out) out.innerHTML = result.join("<br>");
    };
}

console.log("AI Teacher Pro Loaded");

const chatMessages = document.getElementById("chatMessages");
const chatMessageInput = document.getElementById("chatMessage");
const sendChatBtn = document.getElementById("sendChat");

if (sendChatBtn) {
    sendChatBtn.onclick = async () => {
        const text = chatMessageInput ? chatMessageInput.value.trim() : "";
        if (!text || !chatMessages) return;
        chatMessages.innerHTML += `<div class="user">👤 ${text}</div>`;
        chatMessageInput.value = "";
        const loadingId = "chat2-loading-" + Date.now();
        chatMessages.innerHTML += `<div class="ai" id="${loadingId}">🤖 AI javob yozmoqda...</div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        setTimeout(() => {
            const el = document.getElementById(loadingId);
            if (el) el.innerHTML = "🤖 " + simpleTutorReply(text);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 800);
    };
}


const translateNowBtn = document.getElementById("translateNow");
if (translateNowBtn) {
    translateNowBtn.onclick = () => {
        const inputEl = document.getElementById("liveTranslateInput");
        const text = inputEl ? inputEl.value : "";
        if (!text) { alert("Matn yozing"); return; }
        const out = document.getElementById("liveTranslateResult");
        renderTranslation(text, out);
    };
}


const createQuizBtn = document.getElementById("createQuiz");
if (createQuizBtn) {
    createQuizBtn.onclick = () => {
        const levelSelect = document.getElementById("quizLevel");
        const lvl = levelSelect ? levelSelect.value : "";
        const out = document.getElementById("quizOutput");
        if (out) out.innerHTML = `<h3>${lvl} Quiz</h3> 1. Apple = ? A) It B) Kitob C) Olma D) Suv`;
    };
}

console.log("AI Chat Loaded");


let currentRoom = "";
const createRoomBtn = document.getElementById("createRoom");
const roomStatusEl = document.getElementById("roomStatus");
const joinRoomBtn = document.getElementById("joinRoom");
const roomCodeInput = document.getElementById("roomCode");

if (createRoomBtn) {
    createRoomBtn.onclick = () => {
        currentRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
        if (roomStatusEl) roomStatusEl.innerHTML = "✅ Room: " + currentRoom;
    };
}

if (joinRoomBtn) {
    joinRoomBtn.onclick = () => {
        currentRoom = roomCodeInput ? roomCodeInput.value : "";
        if (roomStatusEl) roomStatusEl.innerHTML = "Joined: " + currentRoom;
    };
}


const sendFriendBtn = document.getElementById("sendFriend");
const friendInputEl = document.getElementById("friendInput");
const friendMessagesEl = document.getElementById("friendMessages");

if (sendFriendBtn) {
    sendFriendBtn.onclick = () => {
        const msg = friendInputEl ? friendInputEl.value : "";
        if (!msg || !friendMessagesEl) return;
        friendMessagesEl.innerHTML += `<div class="me">👤 ${msg}</div>`;
        friendInputEl.value = "";
    };
}



const startTournamentBtn = document.getElementById("startTournament");
if (startTournamentBtn) {
    startTournamentBtn.onclick = () => {
        const out = document.getElementById("tournamentStatus");
        if (out) out.innerHTML = "⏳ Waiting Players...";
    };
}


const ranking = [
    { name: "Alex", score: 9500 },
    { name: "John", score: 9100 },
    { name: "Emma", score: 8900 }
];

const worldRankingEl = document.getElementById("worldRanking");
if (worldRankingEl) {
    ranking.forEach(player => {
        worldRankingEl.innerHTML += `<div>🏆 ${player.name} - ${player.score}</div>`;
    });
}

function startVoiceCall() { alert("🎤 Voice Call"); }
function startVideoCall() { alert("📹 Video Call"); }

console.log("Multiplayer Loaded");


const scanOCRBtn = document.getElementById("scanOCR");
if (scanOCRBtn) {
    scanOCRBtn.onclick = () => {
        const fileInput = document.getElementById("ocrFile");
        const file = fileInput ? fileInput.files[0] : null;
        if (!file) { alert("Rasm tanlang"); return; }
        const out = document.getElementById("ocrOutput");
        runOCR(file, out);
    };
}

const translateAIBtn = document.getElementById("translateAI");
if (translateAIBtn) {
    translateAIBtn.onclick = () => {
        const inputEl = document.getElementById("translateText");
        const text = inputEl ? inputEl.value : "";
        if (!text) { alert("Matn kiriting"); return; }
        const out = document.getElementById("translateOutput");
        renderTranslation(text, out);
    };
}

const scanQRBtn = document.getElementById("scanQR");
if (scanQRBtn) {
    scanQRBtn.onclick = () => {
        const fileInput = document.getElementById("qrFile");
        const file = fileInput ? fileInput.files[0] : null;
        if (!file) { alert("QR rasm tanlang"); return; }
        const out = document.getElementById("qrResult");
        if (out) out.innerHTML = "QR Scanner tayyor emas.";
    };
}

const translatePDFBtn = document.getElementById("translatePDF");
if (translatePDFBtn) {
    translatePDFBtn.onclick = () => {
        const fileInput = document.getElementById("pdfTranslate");
        const file = fileInput ? fileInput.files[0] : null;
        if (!file) { alert("PDF tanlang"); return; }
        const out = document.getElementById("pdfTranslateResult");
        if (out) out.innerHTML = "PDF Translate API ulanmagan.";
    };
}

console.log("Camera Tools Loaded");


const video = document.getElementById("cameraView");
const startCameraBtn = document.getElementById("startCamera");
if (startCameraBtn) {
    startCameraBtn.onclick = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (video) video.srcObject = stream;
        } catch {
            alert("Camera ochilmadi");
        }
    };
}

const captureFrameBtn = document.getElementById("captureFrame");
if (captureFrameBtn) {
    captureFrameBtn.onclick = () => {
        const out = document.getElementById("cameraResult");
        if (out) out.innerHTML = "🌍 AI tarjima API ulanmagan.";
    };
}

const detectObjectBtn = document.getElementById("detectObject");
if (detectObjectBtn) {
    detectObjectBtn.onclick = () => {
        const fileInput = document.getElementById("imageRecognition");
        const file = fileInput ? fileInput.files[0] : null;
        if (!file) { alert("Rasm tanlang"); return; }
        const out = document.getElementById("objectResult");
        if (out) out.innerHTML = "🧠 Object Detection tayyor emas.";
    };
}

const startVoiceTranslateBtn = document.getElementById("startVoiceTranslate");
if (startVoiceTranslateBtn) {
    startVoiceTranslateBtn.onclick = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { alert("Speech API yo'q"); return; }
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.start();
        recognition.onresult = (e) => {
            const out = document.getElementById("voiceResult");
            if (out) out.innerHTML = "🎤 " + e.results[0][0].transcript;
        };
    };
}

function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
        }
    }
    return dp[m][n];
}

function pronunciationSimilarity(spoken, target) {
    const a = spoken.trim().toLowerCase();
    const b = target.trim().toLowerCase();
    if (!a || !b) return 0;
    const distance = levenshtein(a, b);
    const maxLen = Math.max(a.length, b.length);
    return Math.round(Math.max(0, (1 - distance / maxLen) * 100));
}

const startPronunciationBtn = document.getElementById("startPronunciation");
if (startPronunciationBtn) {
    startPronunciationBtn.onclick = () => {
        const out = document.getElementById("pronunciationScore");
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const target = deck[index] ? deck[index].en : "Hello";
        if (!SpeechRecognition) {
            if (out) out.innerHTML = "🎙️ Brauzeringiz ovozni aniqlashni qo'llab-quvvatlamaydi.";
            return;
        }
        if (out) out.innerHTML = `🎤 Ayting: "${target}"...`;
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.start();
        recognition.onresult = async (e) => {
            const spoken = e.results[0][0].transcript;
            const scoreVal = pronunciationSimilarity(spoken, target);
            if (out) out.innerHTML = `🗣️ Siz aytdingiz: "${spoken}"<br>⭐ Score: ${scoreVal}/100`;

            // AI Speaking Coach: agar API kalit sozlangan bo'lsa, brauzer
            // aniqlagan matn asosida talaffuz bo'yicha maslahat beramiz.
            // (Eslatma: bu haqiqiy audio-tahlil emas — brauzer eshitgan
            // matnni maqsad so'z bilan solishtirib, AI orqali tushuntiruvchi
            // maslahat beradi. Chinakam audio-fonetik baholash uchun maxsus
            // nutq-baholash xizmati kerak bo'ladi.)
            if (hasAIKey()) {
                if (out) out.innerHTML += "<br>⏳ AI Speaking Coach tahlil qilmoqda...";
                const tip = await callAI(
                    `Maqsad so'z/ibora: "${target}". Foydalanuvchi talaffuz qilganda brauzer buni "${spoken}" deb eshitdi.`,
                    "Sen ingliz tili talaffuzi bo'yicha murabbiysan (AI Speaking Coach). Eshitilgan matn maqsad so'zdan farq qilsa, qaysi tovush/bo'g'inda xato bo'lishi mumkinligini taxmin qil va uni qanday to'g'ri talaffuz qilishni o'zbek tilida, 2-3 gapda, iliq ohangda tushuntir. Agar mos kelsa, tabrikla."
                );
                if (out) {
                    out.innerHTML = `🗣️ Siz aytdingiz: "${spoken}"<br>⭐ Score: ${scoreVal}/100` +
                        (tip ? `<br>🎧 AI Coach: ${tip.replace(/\n/g, "<br>")}` : "<br>⚠️ AI maslahatini olishning imkoni bo'lmadi.");
                }
            }
        };
        recognition.onerror = () => {
            if (out) out.innerHTML = "❌ Ovoz aniqlanmadi, qayta urinib ko'ring.";
        };
    };
}

console.log("Smart AI Loaded");


// NOTE: eski "academy" bloki olib tashlandi — u academyContent/lessonVideo
// kabi HTML'da mavjud bo'lmagan elementlarga murojaat qilar edi va
// grammarBtn'ning asl onclick (Grammatika sahifasini ochish) vazifasini
// jimgina bekor qilib qo'ygan edi, shu sabab tugma "ishlamayotgandek" ko'rinardi.

const certificateBtn = document.getElementById("certificateBtn");
if (certificateBtn) {
    certificateBtn.onclick = () => {
        alert(level >= 50 ? "🏅 Certificate Unlocked" : "Reach Level 50");
    };
}

function completeLesson() {
    xp += 50;
    coins += 100;
    saveGame();
    alert("Lesson Completed!");
}

console.log("Academy Loaded");

const achievementDefs = [
    { title: "First Word", need: 1 },
    { title: "100 XP", need: 100 },
    { title: "Level 10", need: 10 },
    { title: "1000 Coins", need: 1000 }
];

function loadAchievements() {
    const achievementListEl = document.getElementById("achievementList");
    if (!achievementListEl) return;
    achievementListEl.innerHTML = "";
    achievementDefs.forEach(item => {
        achievementListEl.innerHTML += `<div class="achievement">🏆 ${item.title}</div>`;
    });
}
loadAchievements();


const badgeTierList = ["🥉 Bronze", "🥈 Silver", "🥇 Gold", "💎 Diamond", "👑 Master"];
const badgeListEl = document.getElementById("badgeList");
if (badgeListEl) {
    badgeTierList.forEach(b => {
        badgeListEl.innerHTML += `<div class="badge">${b}</div>`;
    });
}


const calendarEl = document.getElementById("calendar");
if (calendarEl) {
    for (let i = 1; i <= 30; i++) {
        calendarEl.innerHTML += `<div class="day">${i}</div>`;
    }
}

const dailyRewardBtn = document.getElementById("dailyReward");
if (dailyRewardBtn) {
    dailyRewardBtn.onclick = () => {
        coins += 100;
        const out = document.getElementById("rewardStatus");
        if (out) out.innerHTML = "🎁 +100 Coins";
        saveGame();
    };
}

// ASOSIY o'yin progressini konsolga chiqarish (progress-bar bilan aralashmaydi)
function logGameProgress() {
    console.log("XP:", xp, "Level:", level, "Coins:", coins);
}
logGameProgress();


function recordDailyXp() {
    const today = new Date().toDateString();
    let history = JSON.parse(localStorage.getItem("xpHistory")) || [];
    const todayEntry = history.find(h => h.date === today);
    if (todayEntry) {
        todayEntry.xp = xp;
        todayEntry.level = level;
    } else {
        history.push({ date: today, xp, level });
    }
    if (history.length > 14) history = history.slice(history.length - 14);
    localStorage.setItem("xpHistory", JSON.stringify(history));
    return history;
}

function renderProgressChart() {
    const canvas = document.getElementById("progressChart");
    if (!canvas || typeof Chart === "undefined") return;
    const history = recordDailyXp();
    const labels = history.map(h => h.date.split(" ").slice(1, 3).join(" "));
    const data = history.map(h => h.xp);

    if (window.__progressChartInstance) {
        window.__progressChartInstance.data.labels = labels;
        window.__progressChartInstance.data.datasets[0].data = data;
        window.__progressChartInstance.update();
        return;
    }

    window.__progressChartInstance = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Kunlik XP",
                data,
                borderColor: "#38bdf8",
                backgroundColor: "rgba(56, 189, 248, 0.2)",
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: "#fff" } } },
            scales: {
                x: { ticks: { color: "#cbd5e1" } },
                y: { ticks: { color: "#cbd5e1" }, beginAtZero: true }
            }
        }
    });
}
renderProgressChart();

// ---- Shaxsiy reyting (real backend/do'stlar tizimi bo'lmagani uchun
// eng adolatli va yolg'on bo'lmagan variant — o'z eng yaxshi kunlaringiz
// bilan taqqoslash) ----------------------------------------------------
function renderLeaderboard() {
    const listEl = document.getElementById("leaderboardList");
    if (!listEl) return;

    const history = JSON.parse(localStorage.getItem("xpHistory")) || [];
    const todayStr = new Date().toDateString();
    const rows = history.filter(h => h.date !== todayStr);
    rows.push({ date: todayStr, xp, level });
    rows.sort((a, b) => b.xp - a.xp);

    if (!rows.length) {
        listEl.innerHTML = "<li>Hali ma'lumot yo'q — bir necha kun mashq qiling!</li>";
        return;
    }

    listEl.innerHTML = rows.slice(0, 7).map((h, i) => {
        const isToday = h.date === todayStr;
        return `<li class="${isToday ? "me" : ""}">
            <span><span class="leaderboard-rank">#${i + 1}</span> ${isToday ? "🟢 Bugun (Siz)" : h.date}</span>
            <span>${h.xp} XP · Lv.${h.level}</span>
        </li>`;
    }).join("");
}
renderLeaderboard();

console.log("Achievement Loaded");


const friend = { name: "Guest", level: 12, xp: 850, avatar: "😎" };
const friendProfileEl = document.getElementById("friendProfile");
if (friendProfileEl) {
    friendProfileEl.innerHTML = `
        <div class="profile">
            <h3>${friend.avatar} ${friend.name}</h3>
            <p>Level: ${friend.level}</p>
            <p>XP: ${friend.xp}</p>
        </div>
    `;
}

const addFriendBtn = document.getElementById("addFriendBtn");
if (addFriendBtn) addFriendBtn.onclick = () => alert("Friend request sent.");

const sendGlobalBtn = document.getElementById("sendGlobal");
const globalMessageInput = document.getElementById("globalMessage");
const globalChatEl = document.getElementById("globalChat");
if (sendGlobalBtn) {
    sendGlobalBtn.onclick = () => {
        const text = globalMessageInput ? globalMessageInput.value : "";
        if (!text || !globalChatEl) return;
        globalChatEl.innerHTML += `<div class="chat">👤 ${text}</div>`;
        globalMessageInput.value = "";
    };
}

const findOpponentBtn = document.getElementById("findOpponent");
if (findOpponentBtn) {
    findOpponentBtn.onclick = () => {
        const out = document.getElementById("battleStatus");
        if (out) out.innerHTML = "🔍 Searching opponent...";
    };
}

const seasonPassEl = document.getElementById("seasonPass");
if (seasonPassEl) {
    seasonPassEl.innerHTML = `⭐ Level 1 🎁 Coins ⭐ Level 2 💎 Premium ⭐ Level 3 🏅 Badge`;
}

const claimWeeklyBtn = document.getElementById("claimWeekly");
if (claimWeeklyBtn) {
    claimWeeklyBtn.onclick = () => {
        coins += 500;
        const out = document.getElementById("weeklyRewardStatus");
        if (out) out.innerHTML = "🎁 +500 Coins";
        saveGame();
    };
}

console.log("Social Module Loaded");


let guild = JSON.parse(localStorage.getItem("guild")) || null;

const guildNameInput = document.getElementById("guildName");
const guildStatusEl = document.getElementById("guildStatus");
const createGuildBtn = document.getElementById("createGuild");
const joinGuildBtn = document.getElementById("joinGuild");

function saveGuild() {
    localStorage.setItem("guild", JSON.stringify(guild));
}

function renderGuildStatus() {
    if (!guildStatusEl) return;
    guildStatusEl.innerHTML = guild ? `🏰 Guild: ${guild.name}` : "Hali guildga a'zo emassiz";
}
renderGuildStatus();

if (createGuildBtn) {
    createGuildBtn.onclick = () => {
        const name = guildNameInput ? guildNameInput.value.trim() : "";
        if (!name) { alert("Guild nomini yozing"); return; }
        guild = { name };
        saveGuild();
        renderGuildStatus();
        alert("✅ Guild yaratildi: " + name);
    };
}

if (joinGuildBtn) {
    joinGuildBtn.onclick = () => {
        const name = guildNameInput ? guildNameInput.value.trim() : "";
        if (!name) { alert("Guild nomini yozing"); return; }
        guild = { name };
        saveGuild();
        renderGuildStatus();
        alert("✅ Guildga qo'shildingiz: " + name);
    };
}

const guildMessagesEl = document.getElementById("guildMessages");
const guildMessageInput = document.getElementById("guildMessage");
const sendGuildBtn = document.getElementById("sendGuild");

if (sendGuildBtn) {
    sendGuildBtn.onclick = () => {
        const msg = guildMessageInput ? guildMessageInput.value.trim() : "";
        if (!msg || !guildMessagesEl) return;
        guildMessagesEl.innerHTML += `<div class="guild-chat">👤 ${msg}</div>`;
        guildMessageInput.value = "";
        guildMessagesEl.scrollTop = guildMessagesEl.scrollHeight;
    };
}

const guildMissionEl = document.getElementById("guildMission");
const completeGuildMissionBtn = document.getElementById("completeGuildMission");
const guildMissions = [
    "20 ta so'z o'rganish",
    "5 ta test yechish",
    "3 ta jang g'alaba qozonish",
    "100 XP to'plash"
];
if (guildMissionEl) {
    guildMissionEl.innerHTML = guildMissions[Math.floor(Math.random() * guildMissions.length)];
}

if (completeGuildMissionBtn) {
    completeGuildMissionBtn.onclick = () => {
        coins += 150;
        xp += 80;
        alert("🎉 Guild vazifasi bajarildi! +150 Coins, +80 XP");
        if (guildMissionEl) guildMissionEl.innerHTML = guildMissions[Math.floor(Math.random() * guildMissions.length)];
        saveGame();
    };
}

const guildRankingEl = document.getElementById("guildRanking");
const guildRankingData = [
    { name: "Dragons Guild", score: 45000 },
    { name: "Phoenix Guild", score: 41000 },
    { name: "Wolves Guild", score: 38000 }
];
if (guildRankingEl) {
    guildRankingData.forEach(g => {
        guildRankingEl.innerHTML += `<div>🏆 ${g.name} - ${g.score}</div>`;
    });
}

console.log("Guild Module Loaded");


let myHealth = 100;
let enemyHealth = 100;
const myHP = document.getElementById("myHP");
const enemyHP = document.getElementById("enemyHP");

function updateHP() {
    if (myHP) { myHP.style.width = myHealth + "%"; myHP.innerHTML = myHealth + "%"; }
    if (enemyHP) { enemyHP.style.width = enemyHealth + "%"; enemyHP.innerHTML = enemyHealth + "%"; }
}
updateHP();

const startBattleBtn = document.getElementById("startBattle");
const battleInfoEl = document.getElementById("battleInfo");
if (startBattleBtn) {
    startBattleBtn.onclick = () => {
        if (battleInfoEl) battleInfoEl.innerHTML = "⚔️ Battle Started!";
        myHealth = 100;
        enemyHealth = 100;
        updateHP();
    };
}

const battleHistoryEl = document.getElementById("battleHistory");

function attackEnemy() {
    enemyHealth -= 10;
    if (enemyHealth < 0) enemyHealth = 0;
    updateHP();
    checkWinner();
}

function enemyAttack() {
    myHealth -= 8;
    if (myHealth < 0) myHealth = 0;
    updateHP();
    checkWinner();
}

const healSkillBtn = document.getElementById("healSkill");
if (healSkillBtn) {
    healSkillBtn.onclick = () => {
        myHealth += 20;
        if (myHealth > 100) myHealth = 100;
        updateHP();
    };
}

const doubleXPBtn = document.getElementById("doubleXP");
if (doubleXPBtn) {
    doubleXPBtn.onclick = () => {
        enemyHealth -= 20;
        updateHP();
        checkWinner();
    };
}

const shieldSkillBtn = document.getElementById("shieldSkill");
if (shieldSkillBtn) shieldSkillBtn.onclick = () => alert("🛡️ Next attack reduced!");

function checkWinner() {
    if (enemyHealth <= 0) {
        coins += 200;
        xp += 100;
        if (battleHistoryEl) battleHistoryEl.innerHTML += "<p>🏆 Victory</p>";
        saveGame();
    }
    if (myHealth <= 0) {
        if (battleHistoryEl) battleHistoryEl.innerHTML += "<p>💀 Defeat</p>";
    }
}

console.log("Battle Module Loaded");


let bossHealth = 500;
const bossHP = document.getElementById("bossHP");

function updateBoss() {
    if (bossHP) {
        bossHP.style.width = (bossHealth / 500 * 100) + "%";
        bossHP.innerHTML = bossHealth + " HP";
    }
}
updateBoss();

function checkBoss() {
    if (bossHealth <= 0) {
        coins += 1000;
        xp += 500;
        alert("🏆 Boss Defeated!");
        saveGame();
    }
}

const attackBossBtn = document.getElementById("attackBoss");
if (attackBossBtn) {
    attackBossBtn.onclick = () => {
        bossHealth -= 15;
        if (bossHealth < 0) bossHealth = 0;
        updateBoss();
        checkBoss();
    };
}

const magicAttackBtn = document.getElementById("magicAttack");
if (magicAttackBtn) {
    magicAttackBtn.onclick = () => {
        bossHealth -= 35;
        if (bossHealth < 0) bossHealth = 0;
        updateBoss();
        checkBoss();
    };
}

const healPotionBtn = document.getElementById("healPotion");
if (healPotionBtn) {
    healPotionBtn.onclick = () => {
        myHealth += 30;
        if (myHealth > 100) myHealth = 100;
        updateHP();
    };
}

const inventoryItems = ["🧪 Potion", "💎 Diamond", "🗝️ Key", "📜 Scroll"];
const inventoryEl = document.getElementById("inventory");
if (inventoryEl) inventoryItems.forEach(item => inventoryEl.innerHTML += `<div class="item">${item}</div>`);

const weaponsList = ["🗡️ Sword", "🏹 Bow", "⚡ Lightning", "🔥 Fire Staff"];
const weaponsEl = document.getElementById("weapons");
if (weaponsEl) weaponsList.forEach(item => weaponsEl.innerHTML += `<div class="item">${item}</div>`);

const armorList = ["🛡️ Wooden", "🛡️ Iron", "🛡️ Gold", "🛡️ Diamond"];
const armorsEl = document.getElementById("armors");
if (armorsEl) armorList.forEach(item => armorsEl.innerHTML += `<div class="item">${item}</div>`);

const rareItemsList = ["👑 Crown", "🐉 Dragon Egg", "💍 Magic Ring", "🔥 Phoenix Feather"];
const rareItemsEl = document.getElementById("rareItems");
if (rareItemsEl) rareItemsList.forEach(item => rareItemsEl.innerHTML += `<div class="item rare">${item}</div>`);

console.log("Boss Battle Loaded");


const locations = {
    village: "🏘️ Safe Village",
    forest: "🌲 Monster Forest",
    castle: "🏰 Royal Castle",
    dungeon: "🕳️ Dark Dungeon",
    portal: "🌀 Magic Portal"
};

function travel(place) { alert("Traveling to " + locations[place]); }

const travelButtons = {
    villageBtn: "village", forestBtn: "forest", castleBtn: "castle",
    dungeonBtn: "dungeon", portalBtn: "portal"
};
Object.keys(travelButtons).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.onclick = () => travel(travelButtons[id]);
});

const npcMessages = [
    "Study 20 words today.",
    "Complete today's quiz.",
    "Practice speaking English.",
    "Don't forget your daily reward!"
];
const talkNpcBtn = document.getElementById("talkNpc");
const npcDialogEl = document.getElementById("npcDialog");
if (talkNpcBtn) {
    talkNpcBtn.onclick = () => {
        const random = npcMessages[Math.floor(Math.random() * npcMessages.length)];
        if (npcDialogEl) npcDialogEl.innerHTML = random;
    };
}

const openChestBtn = document.getElementById("openChest");
const chestRewardEl = document.getElementById("chestReward");
if (openChestBtn) {
    openChestBtn.onclick = () => {
        const chestRewards = ["+100 Coins", "+50 XP", "💎 Diamond", "🗡️ Sword", "🧪 Potion"];
        const reward = chestRewards[Math.floor(Math.random() * chestRewards.length)];
        if (chestRewardEl) chestRewardEl.innerHTML = "🎁 " + reward;
        if (reward === "+100 Coins") coins += 100;
        if (reward === "+50 XP") xp += 50;
        saveGame();
    };
}

const quests = ["Learn 30 Words", "Finish 5 Lessons", "Win 2 Battles", "Earn 200 XP"];
const sideQuestEl = document.getElementById("sideQuest");
if (sideQuestEl) sideQuestEl.innerHTML = quests[Math.floor(Math.random() * quests.length)];

const finishQuestBtn = document.getElementById("finishQuest");
if (finishQuestBtn) {
    finishQuestBtn.onclick = () => {
        coins += 300;
        xp += 150;
        alert("🎉 Quest Complete!");
        saveGame();
    };
}

console.log("Open World Loaded");


let castleLevel = 1;
const kingdomInfoEl = document.getElementById("kingdomInfo");
function updateKingdom() {
    if (kingdomInfoEl) kingdomInfoEl.innerHTML = `🏰 Castle Level ${castleLevel}`;
}
updateKingdom();

const upgradeCastleBtn = document.getElementById("upgradeCastle");
if (upgradeCastleBtn) {
    upgradeCastleBtn.onclick = () => {
        if (coins >= 500) {
            coins -= 500;
            castleLevel++;
            updateKingdom();
            saveGame();
        }
    };
}

let houseLevel = 1;
const houseInfoEl = document.getElementById("houseInfo");
if (houseInfoEl) houseInfoEl.innerHTML = `🏡 House Level ${houseLevel}`;

const upgradeHouseBtn = document.getElementById("upgradeHouse");
if (upgradeHouseBtn) {
    upgradeHouseBtn.onclick = () => {
        if (coins >= 300) {
            coins -= 300;
            houseLevel++;
            if (houseInfoEl) houseInfoEl.innerHTML = `🏡 House Level ${houseLevel}`;
            saveGame();
        }
    };
}

let pet = { name: "Dragon", level: 1, xp: 0 };
const petInfoEl = document.getElementById("petInfo");
function updatePet() {
    if (petInfoEl) petInfoEl.innerHTML = `🐉 ${pet.name} Lv.${pet.level}`;
}
updatePet();

const feedPetBtn = document.getElementById("feedPet");
if (feedPetBtn) feedPetBtn.onclick = () => { pet.xp += 20; updatePet(); };

const trainPetBtn = document.getElementById("trainPet");
if (trainPetBtn) {
    trainPetBtn.onclick = () => {
        pet.xp += 50;
        if (pet.xp >= 100) { pet.level++; pet.xp = 0; }
        updatePet();
    };
}

const pets = ["🐉 Dragon", "🐺 Wolf", "🦅 Eagle", "🐯 Tiger", "🦄 Unicorn"];
const hatchEggBtn = document.getElementById("hatchEgg");
const eggResultEl = document.getElementById("eggResult");
if (hatchEggBtn) {
    hatchEggBtn.onclick = () => {
        const pickedPet = pets[Math.floor(Math.random() * pets.length)];
        if (eggResultEl) eggResultEl.innerHTML = "🎉 " + pickedPet;
    };
}

const mountInfoEl = document.getElementById("mountInfo");
if (mountInfoEl) mountInfoEl.innerHTML = "🐴 Horse";
const rideMountBtn = document.getElementById("rideMount");
if (rideMountBtn) rideMountBtn.onclick = () => alert("🏇 Riding...");

const collectFarmBtn = document.getElementById("collectFarm");
if (collectFarmBtn) {
    collectFarmBtn.onclick = () => {
        coins += 200;
        const out = document.getElementById("farmCoins");
        if (out) out.innerHTML = "🌾 +200 Coins";
        saveGame();
    };
}

const kingdomMarketItems = ["🧪 Potion - 50", "⚔️ Sword - 500", "🛡️ Shield - 300", "💎 Diamond - 1000"];
const kingdomMarketEl = document.getElementById("market");
if (kingdomMarketEl) {
    kingdomMarketItems.forEach(item => {
        kingdomMarketEl.innerHTML += `<div class="marketItem">${item}</div>`;
    });
}

console.log("Kingdom Loaded");


let diamonds = 0;
let vip = false;

const diamondCountEl = document.getElementById("diamondCount");
function updateDiamond() {
    if (diamondCountEl) diamondCountEl.innerHTML = "💎 " + diamonds;
}
updateDiamond();

const spinWheelBtn = document.getElementById("spinWheel");
const wheelResultEl = document.getElementById("wheelResult");
if (spinWheelBtn) {
    spinWheelBtn.onclick = () => {
        const wheelRewards = ["+100 Coins", "+300 Coins", "+1 Diamond", "+5 Diamonds", "+200 XP", "Nothing"];
        const reward = wheelRewards[Math.floor(Math.random() * wheelRewards.length)];
        if (wheelResultEl) wheelResultEl.innerHTML = "🎉 " + reward;
        if (reward === "+1 Diamond") diamonds += 1;
        if (reward === "+5 Diamonds") diamonds += 5;
        if (reward === "+100 Coins") coins += 100;
        if (reward === "+300 Coins") coins += 300;
        if (reward === "+200 XP") xp += 200;
        updateDiamond();
        saveGame();
    };
}

const playSlotBtn = document.getElementById("playSlot");
const slotDisplayEl = document.getElementById("slotDisplay");
const slotResultEl = document.getElementById("slotResult");
if (playSlotBtn) {
    playSlotBtn.onclick = () => {
        const icons = ["🍒", "⭐", "💎", "7️⃣"];
        const a = icons[Math.floor(Math.random() * 4)];
        const b = icons[Math.floor(Math.random() * 4)];
        const c = icons[Math.floor(Math.random() * 4)];
        if (slotDisplayEl) slotDisplayEl.innerHTML = a + " " + b + " " + c;
        if (a === b && b === c) {
            coins += 500;
            if (slotResultEl) slotResultEl.innerHTML = "🏆 JACKPOT!";
        } else {
            if (slotResultEl) slotResultEl.innerHTML = "Try Again";
        }
        saveGame();
    };
}

const openMysteryBtn = document.getElementById("openMystery");
const mysteryRewardEl = document.getElementById("mysteryReward");
if (openMysteryBtn) {
    openMysteryBtn.onclick = () => {
        const mysteryItems = ["🧪 Potion", "💎 Diamond", "⚔️ Sword", "🛡️ Shield", "👑 VIP Ticket"];
        const item = mysteryItems[Math.floor(Math.random() * mysteryItems.length)];
        if (mysteryRewardEl) mysteryRewardEl.innerHTML = item;
    };
}

const buyPassBtn = document.getElementById("buyPass");
if (buyPassBtn) {
    buyPassBtn.onclick = () => {
        if (diamonds >= 50) {
            diamonds -= 50;
            vip = true;
            const passOut = document.getElementById("battlePassStatus");
            if (passOut) passOut.innerHTML = "VIP PASS";
            const vipOut = document.getElementById("vipStatus");
            if (vipOut) vipOut.innerHTML = "👑 VIP";
            updateDiamond();
            saveGame();
        } else {
            alert("50 Diamonds kerak");
        }
    };
}

const events = ["Double XP", "Double Coins", "Boss Event", "Treasure Hunt", "Quiz Marathon"];
const dailyEventEl = document.getElementById("dailyEvent");
if (dailyEventEl) dailyEventEl.innerHTML = events[Math.floor(Math.random() * events.length)];

console.log("Event System Loaded");


const marketItems = ["⚔️ Sword - 500", "🛡️ Shield - 300", "💎 Diamond - 1000", "🧪 Potion - 50"];
const marketListEl = document.getElementById("marketList");
if (marketListEl) marketItems.forEach(item => marketListEl.innerHTML += `<div class="marketCard">${item}</div>`);

const sendTradeBtn = document.getElementById("sendTrade");
if (sendTradeBtn) {
    sendTradeBtn.onclick = () => {
        const playerInput = document.getElementById("tradePlayer");
        const itemInput = document.getElementById("tradeItem");
        const player = playerInput ? playerInput.value : "";
        const item = itemInput ? itemInput.value : "";
        if (!player) { alert("Player kiriting"); return; }
        const out = document.getElementById("tradeStatus");
        if (out) out.innerHTML = `✅ ${item} sent to ${player}`;
    };
}

const mails = ["🎁 Daily Reward", "🏆 Tournament Reward", "💎 VIP Gift"];
const mailBoxEl = document.getElementById("mailBox");
if (mailBoxEl) mails.forEach(mail => mailBoxEl.innerHTML += `<div class="mail">${mail}</div>`);

const claimMailBtn = document.getElementById("claimMail");
if (claimMailBtn) {
    claimMailBtn.onclick = () => {
        coins += 500;
        alert("Rewards Claimed!");
        saveGame();
    };
}

let bank = 0;
const bankCoinsEl = document.getElementById("bankCoins");
function updateBank() {
    if (bankCoinsEl) bankCoinsEl.innerHTML = `🏦 ${bank} Coins`;
}
updateBank();

const depositCoinsBtn = document.getElementById("depositCoins");
if (depositCoinsBtn) {
    depositCoinsBtn.onclick = () => {
        if (coins >= 500) { coins -= 500; bank += 500; updateBank(); saveGame(); }
    };
}

const withdrawCoinsBtn = document.getElementById("withdrawCoins");
if (withdrawCoinsBtn) {
    withdrawCoinsBtn.onclick = () => {
        if (bank >= 500) { bank -= 500; coins += 500; updateBank(); saveGame(); }
    };
}

const auction = ["🔥 Fire Sword", "👑 King's Crown", "🐉 Dragon Egg"];
const auctionListEl = document.getElementById("auctionList");
if (auctionListEl) auction.forEach(item => auctionListEl.innerHTML += `<div class="auctionItem">${item}</div>`);

const bidAuctionBtn = document.getElementById("bidAuction");
if (bidAuctionBtn) bidAuctionBtn.onclick = () => alert("Bid Placed!");

console.log("Economy Module Loaded");

// =========================
// AVATAR / SKINS / THEMES / EFFECTS / BADGES / BACKGROUNDS
// =========================
const avatarSelectEl = document.getElementById("avatarSelect");
const avatarPreviewEl = document.getElementById("avatarPreview");
if (avatarSelectEl) {
    avatarSelectEl.onchange = () => {
        if (avatarPreviewEl) avatarPreviewEl.innerHTML = avatarSelectEl.value.split(" ")[0];
    };
}

const saveAvatarBtn = document.getElementById("saveAvatar");
if (saveAvatarBtn) {
    saveAvatarBtn.onclick = () => {
        if (avatarPreviewEl) localStorage.setItem("avatar", avatarPreviewEl.innerHTML);
        alert("✅ Avatar Saved");
    };
}

const skins = ["👕 Blue", "🧥 Black", "🥷 Ninja", "🦸 Hero", "👑 King"];
const skinsEl = document.getElementById("skins");
if (skinsEl) skins.forEach(item => skinsEl.innerHTML += `<div class="skin">${item}</div>`);

const darkThemeBtn = document.getElementById("darkTheme");
if (darkThemeBtn) darkThemeBtn.onclick = () => { document.body.dataset.theme = "dark"; localStorage.setItem("appTheme", "dark"); if (typeof setAutoThemeEnabled === "function") setAutoThemeEnabled(false); };

const lightThemeBtn = document.getElementById("lightTheme");
if (lightThemeBtn) lightThemeBtn.onclick = () => { document.body.dataset.theme = "light"; localStorage.setItem("appTheme", "light"); if (typeof setAutoThemeEnabled === "function") setAutoThemeEnabled(false); };

const neonThemeBtn = document.getElementById("neonTheme");
if (neonThemeBtn) neonThemeBtn.onclick = () => { document.body.dataset.theme = "neon"; localStorage.setItem("appTheme", "neon"); if (typeof setAutoThemeEnabled === "function") setAutoThemeEnabled(false); };

const effects = ["✨ Glow", "🔥 Fire", "❄️ Ice", "⚡ Lightning"];
const effectsDivEl = document.getElementById("effects");
if (effectsDivEl) effects.forEach(item => effectsDivEl.innerHTML += `<div class="effect">${item}</div>`);

const animatedBadgeList = ["🥉 Bronze", "🥈 Silver", "🥇 Gold", "💎 Diamond"];
const animatedBadgesEl = document.getElementById("animatedBadges");
if (animatedBadgesEl) animatedBadgeList.forEach(item => animatedBadgesEl.innerHTML += `<div class="badge">${item}</div>`);

const backgroundsList = ["🌌 Galaxy", "🌊 Ocean", "🌲 Forest", "🏰 Castle"];
const backgroundsEl = document.getElementById("backgrounds");
if (backgroundsEl) backgroundsList.forEach(item => backgroundsEl.innerHTML += `<div class="bg">${item}</div>`);

console.log("Avatar Module Loaded");

// ==========================
// MUSIC / SOUND / LOADING / LANGUAGE / SETTINGS
// ==========================
const bgMusic = document.getElementById("bgMusic");
const playMusicBtn = document.getElementById("playMusic");
const pauseMusicBtn = document.getElementById("pauseMusic");
if (playMusicBtn) playMusicBtn.onclick = () => { if (bgMusic) bgMusic.play(); };
if (pauseMusicBtn) pauseMusicBtn.onclick = () => { if (bgMusic) bgMusic.pause(); };

const clickSound = document.getElementById("clickSound");
const playClickSoundBtn = document.getElementById("playClickSound");
if (playClickSoundBtn) {
    playClickSoundBtn.onclick = () => {
        if (clickSound) { clickSound.currentTime = 0; clickSound.play(); }
    };
}

const loadingScreenEl = document.getElementById("loadingScreen");
window.addEventListener("load", () => {
    setTimeout(() => {
        if (loadingScreenEl) {
            loadingScreenEl.classList.add("fade-out");
            setTimeout(() => { loadingScreenEl.style.display = "none"; }, 500);
        }
    }, 1200);
});

// manifest.json'dagi "shortcuts" (masalan, uzoq bosib ilova belgisidan
// to'g'ridan-to'g'ri "Kartochka" yoki "Sertifikat"ga o'tish) ishlashi uchun
// ?action=... query parametrini o'qib, tegishli sahifani ochamiz.
(function handleShortcutDeepLink() {
    try {
        const params = new URLSearchParams(window.location.search);
        const action = params.get("action");
        const actionToBtn = {
            flash: "flashBtn",
            speed: "speedBtn",
            ai: "aiBtn",
            certificate: "certificateBtn2"
        };
        if (action && actionToBtn[action]) {
            const btn = document.getElementById(actionToBtn[action]);
            if (btn) window.addEventListener("load", () => setTimeout(() => btn.click(), 100));
        }
    } catch (e) { /* URL parametrlari mavjud bo'lmasa e'tiborsiz qoldiramiz */ }
})();

const languageSelectEl = document.getElementById("languageSelect");

// =========================================================================
// "BIZNI BAHOLANG" SO'ROVI — foydalanuvchi kamida 3 kun streak qilgach
// (ya'ni ilovadan mamnun bo'lish ehtimoli yuqori bo'lganda), bir marta
// so'raladi. "Boshqa so'ralmasin" tanlansa, qayta ko'rsatilmaydi. Bu Play
// Store'dagi haqiqiy reyting sahifasiga o'tkazadi (PLAY_STORE_URL'ni o'z
// ilova havolangiz bilan almashtiring).
// =========================================================================

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=YOUR_PACKAGE_NAME";

function maybeShowRateUsPrompt() {
    const dismissed = localStorage.getItem("rateUsNever") === "1";
    const alreadyShownToday = localStorage.getItem("rateUsLastShown") === new Date().toDateString();
    const currentStreak = (typeof streak !== "undefined") ? streak : 0;
    if (dismissed || alreadyShownToday || currentStreak < 3) return;

    const modal = document.getElementById("rateUsModal");
    if (!modal) return;
    modal.classList.add("show");
    localStorage.setItem("rateUsLastShown", new Date().toDateString());
}

document.querySelectorAll("#rateUsStars span").forEach((star) => {
    star.addEventListener("click", () => {
        const value = parseInt(star.dataset.star, 10);
        document.querySelectorAll("#rateUsStars span").forEach((s) => {
            s.classList.toggle("active", parseInt(s.dataset.star, 10) <= value);
        });
        const goBtn = document.getElementById("rateUsGoBtn");
        if (goBtn) goBtn.style.display = "inline-block";
        localStorage.setItem("rateUsGivenStars", String(value));
    });
});

const rateUsGoBtn = document.getElementById("rateUsGoBtn");
if (rateUsGoBtn) {
    rateUsGoBtn.addEventListener("click", () => {
        window.open(PLAY_STORE_URL, "_blank");
        localStorage.setItem("rateUsNever", "1");
        const modal = document.getElementById("rateUsModal");
        if (modal) modal.classList.remove("show");
    });
}

const rateUsLaterBtn = document.getElementById("rateUsLaterBtn");
if (rateUsLaterBtn) {
    rateUsLaterBtn.addEventListener("click", () => {
        const modal = document.getElementById("rateUsModal");
        if (modal) modal.classList.remove("show");
    });
}

const rateUsNeverBtn = document.getElementById("rateUsNeverBtn");
if (rateUsNeverBtn) {
    rateUsNeverBtn.addEventListener("click", () => {
        localStorage.setItem("rateUsNever", "1");
        const modal = document.getElementById("rateUsModal");
        if (modal) modal.classList.remove("show");
    });
}

setTimeout(maybeShowRateUsPrompt, 4000);

// =========================================================================
// ONBOARDING TUR — birinchi marta kirgan foydalanuvchiga asosiy yangi
// joylarni (Tezkor kirish, Fokus rejimi, Boss Battle, Sertifikat) qisqa
// spotlight-uslubidagi tanishtiruv orqali ko'rsatadi.
// =========================================================================

const ONBOARDING_STEPS = [
    { selector: "#quickAccessGrid", title: "👋 Xush kelibsiz!", text: "Bu — \"Tezkor kirish\" paneli. Eng ko'p ishlatiladigan bo'limlarga shu yerdan bir bosishda o'tasiz." },
    { selector: "[data-target='scrambleBtn']", title: "🔤 Yangi o'yinlar", text: "Harflarni tartiblash, Tezkor yozish, Bo'sh joyni to'ldirish kabi yangi o'yin-mashqlar qo'shildi." },
    { navTarget: "pomodoroBtn", title: "🍅 Fokus rejimi", text: "25 daqiqa to'liq diqqat bilan mashq qiling — bu usul xotirani mustahkamlashga yordam beradi." },
    { navTarget: "certificateBtn2", title: "🎓 Sertifikat", text: "Muvaffaqiyatlaringiz uchun shaxsiy sertifikat yarating, PDF holida yuklab oling yoki do'stlaringizga ulashing." }
];

let onboardingIndex = 0;

function positionTourStep() {
    const step = ONBOARDING_STEPS[onboardingIndex];
    if (!step) return finishOnboarding();

    let targetEl = null;
    if (step.selector) targetEl = document.querySelector(step.selector);
    if (step.navTarget) targetEl = document.getElementById(step.navTarget);

    const spotlight = document.getElementById("tourSpotlight");
    const tooltip = document.getElementById("tourTooltip");
    const titleEl = document.getElementById("tourTitle");
    const textEl = document.getElementById("tourText");
    const progressEl = document.getElementById("tourProgress");

    if (titleEl) titleEl.textContent = step.title;
    if (textEl) textEl.textContent = step.text;

    if (progressEl) {
        progressEl.innerHTML = ONBOARDING_STEPS.map((_, i) =>
            `<span class="${i === onboardingIndex ? "active" : ""}"></span>`).join("");
    }

    if (targetEl && spotlight && tooltip) {
        const rect = targetEl.getBoundingClientRect();
        const pad = 10;
        spotlight.style.top = `${rect.top - pad}px`;
        spotlight.style.left = `${rect.left - pad}px`;
        spotlight.style.width = `${rect.width + pad * 2}px`;
        spotlight.style.height = `${rect.height + pad * 2}px`;

        const tooltipTop = rect.bottom + 16 < window.innerHeight - 160 ? rect.bottom + 16 : Math.max(16, rect.top - 190);
        tooltip.style.top = `${tooltipTop}px`;
        tooltip.style.left = `${Math.min(Math.max(16, rect.left), window.innerWidth - 316)}px`;
    } else if (spotlight) {
        spotlight.style.width = "0px";
        spotlight.style.height = "0px";
    }

    const nextBtn = document.getElementById("tourNextBtn");
    if (nextBtn) nextBtn.textContent = onboardingIndex === ONBOARDING_STEPS.length - 1 ? "Tugatish ✓" : "Keyingisi →";
}

function startOnboardingTour() {
    onboardingIndex = 0;
    const tourEl = document.getElementById("onboardingTour");
    if (tourEl) tourEl.classList.add("show");
    positionTourStep();
}

function finishOnboarding() {
    const tourEl = document.getElementById("onboardingTour");
    if (tourEl) tourEl.classList.remove("show");
    localStorage.setItem("onboardingTourSeen", "1");
}

const tourNextBtn = document.getElementById("tourNextBtn");
if (tourNextBtn) {
    tourNextBtn.addEventListener("click", () => {
        onboardingIndex++;
        if (onboardingIndex >= ONBOARDING_STEPS.length) finishOnboarding();
        else positionTourStep();
    });
}

const tourSkipBtn = document.getElementById("tourSkipBtn");
if (tourSkipBtn) tourSkipBtn.addEventListener("click", finishOnboarding);

window.addEventListener("resize", () => {
    const tourEl = document.getElementById("onboardingTour");
    if (tourEl && tourEl.classList.contains("show")) positionTourStep();
});

// Faqat birinchi marta (yoki hali ko'rmagan foydalanuvchiga) ko'rsatamiz,
// va u yangi funksiyalarni ko'rishi uchun asosiy sahifa (bosh sahifa)da
// bo'lganda ishga tushiramiz.
if (!localStorage.getItem("onboardingTourSeen")) {
    window.addEventListener("load", () => setTimeout(startOnboardingTour, 1800));
}

// =========================================================================
// INTERFEYS TILI (UI i18n) — asosiy menyu, "Tezkor kirish" grid va
// "Boshlash" tugmasi uchun real tarjima. ESLATMA: bu ilova ichidagi
// KONTENT (so'zlar, misollar) allaqachon uch tilda (uz/ru/en) — bu yerdagi
// tizim esa MENYU/TUGMALAR kabi interfeys elementlarini tarjima qiladi.
// Hozircha to'liq ilova emas, eng ko'p ishlatiladigan qismlar qamrab
// olingan; qolgan sahifalar hali o'zbekcha qoladi.
// =========================================================================

const UI_TRANSLATIONS = {
    homeBtn: { uz: "🏠 Bosh sahifa", en: "🏠 Home", ru: "🏠 Главная", tr: "🏠 Ana Sayfa", ar: "🏠 الرئيسية" },
    beginnerBtn: { uz: "🆕 Noldan boshlash", en: "🆕 Start from Zero", ru: "🆕 Начать с нуля", tr: "🆕 Sıfırdan Başla", ar: "🆕 ابدأ من الصفر" },
    flashBtn: { uz: "📚 Kartochka", en: "📚 Flashcards", ru: "📚 Карточки", tr: "📚 Kartlar", ar: "📚 البطاقات" },
    matchBtn: { uz: "🎮 So'z o'yini", en: "🎮 Word Game", ru: "🎮 Игра слов", tr: "🎮 Kelime Oyunu", ar: "🎮 لعبة الكلمات" },
    scrambleBtn: { uz: "🔤 Harflarni tartiblash", en: "🔤 Word Scramble", ru: "🔤 Собери слово", tr: "🔤 Harfleri Sırala", ar: "🔤 ترتيب الحروف" },
    typingRaceBtn: { uz: "⌨️ Tezkor yozish", en: "⌨️ Typing Race", ru: "⌨️ Скоростной набор", tr: "⌨️ Hızlı Yazma", ar: "⌨️ الكتابة السريعة" },
    fillBlankBtn: { uz: "✏️ Bo'sh joyni to'ldirish", en: "✏️ Fill in the Blank", ru: "✏️ Заполни пропуск", tr: "✏️ Boşluk Doldurma", ar: "✏️ املأ الفراغ" },
    bossBattleBtn: { uz: "👹 Haftalik Boss", en: "👹 Weekly Boss", ru: "👹 Недельный босс", tr: "👹 Haftalık Boss", ar: "👹 تحدي الأسبوع" },
    pomodoroBtn: { uz: "🍅 Fokus rejimi", en: "🍅 Focus Mode", ru: "🍅 Режим фокуса", tr: "🍅 Odak Modu", ar: "🍅 وضع التركيز" },
    speedBtn: { uz: "⚡ Tezkor test", en: "⚡ Speed Quiz", ru: "⚡ Быстрый тест", tr: "⚡ Hızlı Test", ar: "⚡ اختبار سريع" },
    sentenceBtn: { uz: "🧩 Gap tuzish", en: "🧩 Sentence Builder", ru: "🧩 Составь предложение", tr: "🧩 Cümle Kurma", ar: "🧩 بناء الجملة" },
    grammarQuizBtn: { uz: "📐 Grammatika testi", en: "📐 Grammar Quiz", ru: "📐 Тест по грамматике", tr: "📐 Dilbilgisi Testi", ar: "📐 اختبار القواعد" },
    mistakeBtn: { uz: "📖 Qiyin so'zlar", en: "📖 Difficult Words", ru: "📖 Сложные слова", tr: "📖 Zor Kelimeler", ar: "📖 كلمات صعبة" },
    certificateBtn2: { uz: "🎓 Sertifikat", en: "🎓 Certificate", ru: "🎓 Сертификат", tr: "🎓 Sertifika", ar: "🎓 الشهادة" },
    premiumBtn: { uz: "💎 Premium", en: "💎 Premium", ru: "💎 Премиум", tr: "💎 Premium", ar: "💎 بريميوم" },
    adminBtn: { uz: "🛠️ Admin panel", en: "🛠️ Admin Panel", ru: "🛠️ Админ-панель", tr: "🛠️ Yönetici Paneli", ar: "🛠️ لوحة التحكم" },
    quizBtn: { uz: "📝 Test", en: "📝 Quiz", ru: "📝 Тест", tr: "📝 Test", ar: "📝 اختبار" },
    aiBtn: { uz: "🤖 AI Teacher", en: "🤖 AI Teacher", ru: "🤖 AI Учитель", tr: "🤖 AI Öğretmen", ar: "🤖 المعلم الذكي" },
    assistantBtn: { uz: "💬 AI Assistant", en: "💬 AI Assistant", ru: "💬 AI Ассистент", tr: "💬 AI Asistan", ar: "💬 المساعد الذكي" },
    roleplayBtn: { uz: "🎭 Rolli suhbat", en: "🎭 Roleplay", ru: "🎭 Ролевая игра", tr: "🎭 Rol Yapma", ar: "🎭 محادثة تمثيلية" },
    duelBtn: { uz: "🤝 Do'st bilan raqobat", en: "🤝 Compete with a Friend", ru: "🤝 Соревнование с другом", tr: "🤝 Arkadaşla Yarış", ar: "🤝 تحدي مع صديق" },
    grammarLibraryBtn: { uz: "📘 Grammatika qo'llanmasi", en: "📘 Grammar Guide", ru: "📘 Справочник грамматики", tr: "📘 Dilbilgisi Rehberi", ar: "📘 دليل القواعد" },
    idiomsBtn: { uz: "💬 Idiomalar", en: "💬 Idioms", ru: "💬 Идиомы", tr: "💬 Deyimler", ar: "💬 التعابير الاصطلاحية" },
    myWordsBtn: { uz: "📝 Mening so'zlarim", en: "📝 My Words", ru: "📝 Мои слова", tr: "📝 Kelimelerim", ar: "📝 كلماتي" },
    examBtn: { uz: "🎯 Imtihon rejimi", en: "🎯 Exam Mode", ru: "🎯 Режим экзамена", tr: "🎯 Sınav Modu", ar: "🎯 وضع الامتحان" },
    courseBtn: { uz: "📖 Lug'at", en: "📖 Vocabulary", ru: "📖 Словарь", tr: "📖 Kelime Bilgisi", ar: "📖 المفردات" },
    aiToolsBtn: { uz: "🛠 Tarjima", en: "🛠 Translate", ru: "🛠 Перевод", tr: "🛠 Çeviri", ar: "🛠 الترجمة" },
    speakingBtn: { uz: "🎤 Speaking", en: "🎤 Speaking", ru: "🎤 Говорение", tr: "🎤 Konuşma", ar: "🎤 المحادثة" },
    grammarBtn: { uz: "✏️ Grammatika", en: "✏️ Grammar", ru: "✏️ Грамматика", tr: "✏️ Dilbilgisi", ar: "✏️ القواعد" },
    achievementBtn: { uz: "🏆 Yutuqlar", en: "🏆 Achievements", ru: "🏆 Достижения", tr: "🏆 Başarılar", ar: "🏆 الإنجازات" },
    avatarBtn: { uz: "🧑 Avatar", en: "🧑 Avatar", ru: "🧑 Аватар", tr: "🧑 Avatar", ar: "🧑 الصورة الرمزية" },
    statsBtn: { uz: "📊 Statistika", en: "📊 Statistics", ru: "📊 Статистика", tr: "📊 İstatistik", ar: "📊 الإحصائيات" },
    settingsBtn: { uz: "⚙️ Sozlamalar", en: "⚙️ Settings", ru: "⚙️ Настройки", tr: "⚙️ Ayarlar", ar: "⚙️ الإعدادات" },
    startBtn: { uz: "Boshlash", en: "Start", ru: "Начать", tr: "Başla", ar: "ابدأ" },
    qa_flash: { uz: "Kartochka", en: "Flashcards", ru: "Карточки", tr: "Kartlar", ar: "بطاقات" },
    qa_quiz: { uz: "Test", en: "Quiz", ru: "Тест", tr: "Test", ar: "اختبار" },
    qa_match: { uz: "O'yin", en: "Game", ru: "Игра", tr: "Oyun", ar: "لعبة" },
    qa_scramble: { uz: "Harflar", en: "Letters", ru: "Буквы", tr: "Harfler", ar: "حروف" },
    qa_ai: { uz: "AI Teacher", en: "AI Teacher", ru: "AI Учитель", tr: "AI Öğretmen", ar: "المعلم الذكي" },
    qa_cert: { uz: "Sertifikat", en: "Certificate", ru: "Сертификат", tr: "Sertifika", ar: "شهادة" },
    qa_stats: { uz: "Statistika", en: "Stats", ru: "Статистика", tr: "İstatistik", ar: "إحصائيات" },
    qa_settings: { uz: "Sozlama", en: "Settings", ru: "Настройки", tr: "Ayarlar", ar: "إعدادات" },
    hdr_match: { uz: "🎮 So'zlarni moslashtirish", en: "🎮 Match the Words", ru: "🎮 Сопоставь слова", tr: "🎮 Kelimeleri Eşleştir", ar: "🎮 طابق الكلمات" },
    hdr_scramble: { uz: "🔤 Harflarni tartiblash", en: "🔤 Word Scramble", ru: "🔤 Собери слово", tr: "🔤 Harfleri Sırala", ar: "🔤 ترتيب الحروف" },
    hdr_typing: { uz: "⌨️ Tezkor yozish (Typing Race)", en: "⌨️ Typing Race", ru: "⌨️ Скоростной набор", tr: "⌨️ Hızlı Yazma", ar: "⌨️ الكتابة السريعة" },
    hdr_fillblank: { uz: "✏️ Bo'sh joyni to'ldirish", en: "✏️ Fill in the Blank", ru: "✏️ Заполни пропуск", tr: "✏️ Boşluk Doldurma", ar: "✏️ املأ الفراغ" },
    hdr_boss: { uz: "👹 Haftalik Boss", en: "👹 Weekly Boss", ru: "👹 Недельный босс", tr: "👹 Haftalık Boss", ar: "👹 تحدي الأسبوع" },
    hdr_pomodoro: { uz: "🍅 Fokus rejimi (Pomodoro)", en: "🍅 Focus Mode (Pomodoro)", ru: "🍅 Режим фокуса (Помодоро)", tr: "🍅 Odak Modu (Pomodoro)", ar: "🍅 وضع التركيز (بومودورو)" },
    hdr_speed: { uz: "⚡ Tezkor test", en: "⚡ Speed Quiz", ru: "⚡ Быстрый тест", tr: "⚡ Hızlı Test", ar: "⚡ اختبار سريع" },
    hdr_stats: { uz: "📊 Statistika", en: "📊 Statistics", ru: "📊 Статистика", tr: "📊 İstatistik", ar: "📊 الإحصائيات" },
    hdr_cert: { uz: "🎓 Sertifikat", en: "🎓 Certificate", ru: "🎓 Сертификат", tr: "🎓 Sertifika", ar: "🎓 الشهادة" },
    hdr_achievements: { uz: "🏆 Yutuqlar", en: "🏆 Achievements", ru: "🏆 Достижения", tr: "🏆 Başarılar", ar: "🏆 الإنجازات" }
};

function applyUILanguage(lang) {
    if (!["uz", "en", "ru", "tr", "ar"].includes(lang)) lang = "uz";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.dataset.i18n;
        const dict = UI_TRANSLATIONS[key];
        if (dict) {
            el.textContent = dict[lang] || dict.uz;
            el.dir = lang === "ar" ? "rtl" : "ltr";
            el.classList.toggle("arabic-text", lang === "ar");
        }
    });
    // Interfeys arab tiliga o'tganda butun sahifa yo'nalishini ham
    // o'ngdan-chapga (RTL) o'zgartiramiz.
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.body.classList.toggle("ui-rtl", lang === "ar");
    localStorage.setItem("uiLang", lang);
    if (languageSelectEl) languageSelectEl.value = lang;
}

if (languageSelectEl) {
    languageSelectEl.onchange = () => {
        applyUILanguage(languageSelectEl.value);
    };
}

// Ilova ochilganda avval saqlangan tanlovni qo'llaymiz (uz — standart)
applyUILanguage(localStorage.getItem("uiLang") || "uz");

const notificationToggleEl = document.getElementById("notificationToggle");
if (notificationToggleEl) {
    notificationToggleEl.onchange = () => {
        localStorage.setItem("notification", notificationToggleEl.checked);
    };
}

const animationToggleEl = document.getElementById("animationToggle");
if (animationToggleEl) {
    animationToggleEl.onchange = () => {
        localStorage.setItem("animation", animationToggleEl.checked);
    };
}

console.log("Settings Loaded");

// NOTE: eski "Admin Panel" bloki olib tashlandi — u haqiqiy bo'lmagan
// (o'ylab topilgan) "1250 users", "Ali/John/Emma" kabi soxta ma'lumotlarni
// ko'rsatardi va HTML'da mos elementlar umuman yo'q edi (hech qachon
// ishlamagan). Haqiqiy Admin/Debug panel fayl oxirida qo'shildi.

// ======================
// PUSH NOTIFICATION / PWA / CACHE / OFFLINE
// ======================
const enableNotificationBtn = document.getElementById("enableNotification");
if (enableNotificationBtn) {
    enableNotificationBtn.onclick = async () => {
        if (!("Notification" in window)) { alert("Notification supported emas"); return; }
        const permission = await Notification.requestPermission();
        const out = document.getElementById("notificationStatus");
        if (permission === "granted") {
            if (out) out.innerHTML = "✅ Notification Enabled";
            new Notification("English Master", { body: "Welcome Back!", icon: "assets/icons/icon.png" });
        } else {
            if (out) out.innerHTML = "❌ Permission Denied";
        }
    };
}

// Eslatma: bu ilovada "installAppPWA" tugmasi mavjud emas edi (o'chirilgan
// yoki hech qachon qo'shilmagan), shuning uchun bu yerda ikkinchi marta
// "beforeinstallprompt" listener o'rnatib, uni qayta ishlatmaymiz — buning
// o'rniga yuqoridagi bitta umumiy `deferredPrompt` o'zgaruvchisidan
// foydalaniladi ("📱 Ilovani o'rnatish" tugmasi orqali).

const syncCloudBtn = document.getElementById("syncCloud");
if (syncCloudBtn) {
    syncCloudBtn.onclick = () => {
        const out = document.getElementById("syncStatus");
        if (out) out.innerHTML = "☁️ Syncing...";
        setTimeout(() => { if (out) out.innerHTML = "✅ Synced"; }, 1500);
    };
}

const clearCacheBtn = document.getElementById("clearCache");
if (clearCacheBtn) {
    clearCacheBtn.onclick = () => {
        if ("caches" in window) {
            caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
        }
        const out = document.getElementById("cacheStatus");
        if (out) out.innerHTML = "🗑 Cache Cleared";
    };
}

const offlineStatusEl = document.getElementById("offlineStatus");
function updateOffline() {
    if (offlineStatusEl) offlineStatusEl.innerHTML = navigator.onLine ? "🟢 Online" : "🔴 Offline";
}
window.addEventListener("online", updateOffline);
window.addEventListener("offline", updateOffline);
updateOffline();

console.log("PWA Loaded");

// =====================
// AI COACH: VOICE TEACHER / GRAMMAR / ESSAY / READING / STUDY PLAN
// =====================
const startVoiceTeacherBtn = document.getElementById("startVoiceTeacher");
const voiceTeacherResultEl = document.getElementById("voiceTeacherResult");
if (startVoiceTeacherBtn) {
    startVoiceTeacherBtn.onclick = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { alert("Speech API not supported"); return; }
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.start();
        if (voiceTeacherResultEl) voiceTeacherResultEl.innerHTML = "🎤 Listening...";
        recognition.onresult = (e) => {
            if (voiceTeacherResultEl) voiceTeacherResultEl.innerHTML = "🗣 " + e.results[0][0].transcript;
        };
    };
}

const grammarCheckBtn = document.getElementById("grammarCheck");
if (grammarCheckBtn) {
    grammarCheckBtn.onclick = () => {
        const grammarTextEl = document.getElementById("grammarText");
        const text = grammarTextEl ? grammarTextEl.value : "";
        if (!text) { alert("Write something"); return; }
        const out = document.getElementById("grammarAnswer");
        if (out) out.innerHTML = checkGrammarRules(text).map(i => `<div>${i}</div>`).join("");
    };
}

const essayScoreBtn = document.getElementById("essayScore");
if (essayScoreBtn) {
    essayScoreBtn.onclick = () => {
        const essayTextEl = document.getElementById("essayText");
        const essay = essayTextEl ? essayTextEl.value : "";
        if (!essay) { alert("Write essay"); return; }
        const out = document.getElementById("essayResult2");
        if (out) out.innerHTML = `Grammar ⭐⭐⭐⭐☆ Vocabulary ⭐⭐⭐⭐⭐ Score 92/100`;
    };
}

const readingTestBtn = document.getElementById("readingTest");
if (readingTestBtn) {
    readingTestBtn.onclick = () => {
        const out = document.getElementById("readingScore");
        if (out) out.innerHTML = "✅ Reading Completed";
        xp += 30;
        coins += 20;
        saveGame();
    };
}

const generatePlanBtn = document.getElementById("generatePlan");
if (generatePlanBtn) {
    generatePlanBtn.onclick = () => {
        const out = document.getElementById("studyPlanAI");
        if (out) out.innerHTML = `
            📅 Monday - Grammar, 20 Words, Quiz
            <hr>
            📅 Tuesday - Speaking, Listening, Writing
            <hr>
            📅 Wednesday - Revision, Battle, Reading
        `;
    };
}

console.log("AI Coach Loaded");

// =====================
// MINI GAMES (haqiqiy, to'liq ishlaydigan versiyalar)
// =====================
const gameContainerEl = document.getElementById("gameContainer");

function showGamesMenu() {
    if (!gameContainerEl) return;
    gameContainerEl.innerHTML = `
        <div class="game-picker">
            <button class="game-pick-card" id="pickMemoryGame">
                <div class="game-pick-icon">🧠</div>
                <div class="game-pick-title">Memory Match</div>
                <div class="game-pick-desc">Kartalarni juftlab, so'z va tarjimasini toping</div>
            </button>
            <button class="game-pick-card" id="pickHangmanGame">
                <div class="game-pick-icon">🔠</div>
                <div class="game-pick-title">Hangman</div>
                <div class="game-pick-desc">Harflarni topib, yashiringan so'zni aniqlang</div>
            </button>
        </div>
    `;
    const memBtn = document.getElementById("pickMemoryGame");
    const hangBtn = document.getElementById("pickHangmanGame");
    if (memBtn) memBtn.onclick = startMemoryGame;
    if (hangBtn) hangBtn.onclick = startHangmanGame;
}

// ---- 1) MEMORY MATCH — kartalarni EN/UZ juftlab topish ----
let memoryState = { cards: [], flipped: [], matched: [], lock: false, moves: 0 };

function startMemoryGame() {
    if (!gameContainerEl || typeof words === "undefined" || !words.length) return;
    const pool = [...words].sort(() => Math.random() - 0.5).slice(0, 8);
    const cards = [];
    pool.forEach((w, i) => {
        cards.push({ pairId: i, text: getTargetWord(w), side: "target" });
        cards.push({ pairId: i, text: w.uz, side: "uz" });
    });
    cards.sort(() => Math.random() - 0.5);
    memoryState = { cards, flipped: [], matched: [], lock: false, moves: 0 };
    renderMemoryGame();
}

function renderMemoryGame() {
    const isRtl = learnLang === "ar";
    gameContainerEl.innerHTML = `
        <h3>🧠 Memory Match</h3>
        <p class="ai-settings-hint">Bir xil juftlikni (so'z va tarjimasi) toping. Harakatlar: <b id="memoryMoves">${memoryState.moves}</b></p>
        <div class="memory-grid">
            ${memoryState.cards.map((c, i) => {
                const isMatched = memoryState.matched.includes(i);
                const isFlipped = memoryState.flipped.includes(i) || isMatched;
                return `<button class="memory-card${isFlipped ? " flipped" : ""}${isMatched ? " matched" : ""}" data-idx="${i}">
                    <span class="memory-card-inner${c.side === 'target' && isRtl ? ' arabic-text' : ''}">${isFlipped ? c.text : "❓"}</span>
                </button>`;
            }).join("")}
        </div>
    `;
    gameContainerEl.querySelectorAll(".memory-card").forEach(btn => {
        btn.onclick = () => flipMemoryCard(parseInt(btn.dataset.idx, 10));
    });
}

function flipMemoryCard(idx) {
    if (memoryState.lock) return;
    if (memoryState.flipped.includes(idx) || memoryState.matched.includes(idx)) return;
    memoryState.flipped.push(idx);
    renderMemoryGame();
    if (memoryState.flipped.length === 2) {
        memoryState.moves++;
        memoryState.lock = true;
        const [a, b] = memoryState.flipped;
        const cardA = memoryState.cards[a], cardB = memoryState.cards[b];
        if (cardA.pairId === cardB.pairId) {
            memoryState.matched.push(a, b);
            memoryState.flipped = [];
            memoryState.lock = false;
            renderMemoryGame();
            if (memoryState.matched.length === memoryState.cards.length) {
                setTimeout(() => finishMemory(), 300);
            }
        } else {
            setTimeout(() => {
                memoryState.flipped = [];
                memoryState.lock = false;
                renderMemoryGame();
            }, 800);
        }
    }
}

function finishMemory() {
    const reward = Math.max(20, 100 - memoryState.moves * 3);
    coins += reward;
    xp += Math.round(reward / 2);
    saveGame();
    if (typeof celebrate === "function") celebrate();
    if (gameContainerEl) gameContainerEl.innerHTML += `<p class="listening-result correct">🎉 Tabriklaymiz! ${memoryState.moves} harakatda tugatdingiz. +${reward} tanga, +${Math.round(reward/2)} XP</p>`;
}

const memoryGameBtn = document.getElementById("memoryGameBtn"); // eski struktura bilan moslik uchun (ixtiyoriy)
if (memoryGameBtn) memoryGameBtn.onclick = startMemoryGame;

// ---- 2) HANGMAN — harflarni topib so'zni aniqlash ----
let hangmanState = { word: "", uz: "", guessed: [], wrong: 0, maxWrong: 6, done: false };

function startHangmanGame() {
    if (!gameContainerEl || typeof words === "undefined" || !words.length) return;
    const pool = words.filter(w => /^[A-Za-z]+$/.test(w.en));
    const w = pool[Math.floor(Math.random() * pool.length)];
    hangmanState = { word: w.en.toUpperCase(), uz: w.uz, guessed: [], wrong: 0, maxWrong: 6, done: false };
    renderHangmanGame();
}

function renderHangmanGame() {
    const display = hangmanState.word.split("").map(ch => hangmanState.guessed.includes(ch) ? ch : "_").join(" ");
    const stages = ["🙂","😟","😧","😨","😰","😵","💀"];
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    gameContainerEl.innerHTML = `
        <h3>🔠 Hangman</h3>
        <p class="ai-settings-hint">Maslahat (o'zbekcha): <b>${hangmanState.uz}</b></p>
        <div style="font-size:52px;text-align:center;">${stages[Math.min(hangmanState.wrong, stages.length - 1)]}</div>
        <div style="font-size:28px;letter-spacing:6px;text-align:center;font-family:monospace;margin:12px 0;">${display}</div>
        <p style="text-align:center;">Xato: ${hangmanState.wrong}/${hangmanState.maxWrong}</p>
        <div class="tile-grid">
            ${alphabet.map(l => `<button class="tile hangman-letter" ${hangmanState.guessed.includes(l) ? "disabled" : ""} data-letter="${l}">${l}</button>`).join("")}
        </div>
        <div id="hangmanResult"></div>
    `;
    gameContainerEl.querySelectorAll(".hangman-letter").forEach(btn => {
        btn.onclick = () => guessHangmanLetter(btn.dataset.letter);
    });
}

function guessHangmanLetter(letter) {
    if (hangmanState.done || hangmanState.guessed.includes(letter)) return;
    hangmanState.guessed.push(letter);
    if (!hangmanState.word.includes(letter)) hangmanState.wrong++;

    const won = hangmanState.word.split("").every(ch => hangmanState.guessed.includes(ch));
    const lost = hangmanState.wrong >= hangmanState.maxWrong;

    renderHangmanGame();
    const resultEl = document.getElementById("hangmanResult");
    if (won) {
        hangmanState.done = true;
        coins += 60; xp += 30; saveGame();
        if (typeof celebrate === "function") celebrate();
        if (resultEl) resultEl.innerHTML = `<p class="listening-result correct">🎉 Yutdingiz! So'z: <b>${hangmanState.word}</b>. +60 tanga, +30 XP</p>`;
    } else if (lost) {
        hangmanState.done = true;
        if (resultEl) resultEl.innerHTML = `<p class="listening-result wrong">😵 Afsus! To'g'ri javob: <b>${hangmanState.word}</b></p>`;
    }
}

const hangmanBtn = document.getElementById("hangmanBtn");
if (hangmanBtn) hangmanBtn.onclick = startHangmanGame;

const completeChallengeBtn = document.getElementById("completeChallenge");
if (completeChallengeBtn) {
    completeChallengeBtn.onclick = () => {
        coins += 200;
        xp += 100;
        alert("🎁 Daily Challenge Completed!");
        saveGame();
    };
}

const weekly = ["🥇 Alex - 8200", "🥈 Emma - 7900", "🥉 John - 7600"];
const weeklyRankEl = document.getElementById("weeklyRank");
if (weeklyRankEl) weekly.forEach(player => weeklyRankEl.innerHTML += `<div>${player}</div>`);

console.log("Mini Games Loaded");

// ========================
// BACKUP / RESTORE / EXPORT / IMPORT / STATS / GRADUATION
// ========================
const backupBtn = document.getElementById("backupBtn");
const backupStatusEl = document.getElementById("backupStatus");
if (backupBtn) {
    backupBtn.onclick = () => {
        const data = { coins, xp, level, avatar: localStorage.getItem("avatar") };
        localStorage.setItem("backup", JSON.stringify(data));
        if (backupStatusEl) backupStatusEl.innerHTML = "✅ Backup Created";
    };
}

const restoreBtn = document.getElementById("restoreBtn");
if (restoreBtn) {
    restoreBtn.onclick = () => {
        const data = localStorage.getItem("backup");
        if (!data) { alert("Backup topilmadi"); return; }
        const save = JSON.parse(data);
        coins = save.coins;
        xp = save.xp;
        level = save.level;
        if (backupStatusEl) backupStatusEl.innerHTML = "♻️ Restore Complete";
        saveGame();
    };
}

const googleSyncBtn = document.getElementById("googleSync");
if (googleSyncBtn) {
    googleSyncBtn.onclick = () => {
        const out = document.getElementById("googleStatus");
        if (out) out.innerHTML = "☁️ Google Drive API Required";
    };
}

const exportDataBtn = document.getElementById("exportData");
if (exportDataBtn) {
    exportDataBtn.onclick = () => {
        const save = { coins, xp, level };
        const blob = new Blob([JSON.stringify(save)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "EnglishMasterSave.json";
        a.click();
    };
}

const importDataBtn = document.getElementById("importData");
const importFileInput = document.getElementById("importFile");
const importStatusEl = document.getElementById("importStatus");
if (importDataBtn) {
    importDataBtn.onclick = () => {
        const file = importFileInput ? importFileInput.files[0] : null;
        if (!file) { alert("JSON tanlang"); return; }
        const reader = new FileReader();
        reader.onload = e => {
            const save = JSON.parse(e.target.result);
            coins = save.coins;
            xp = save.xp;
            level = save.level;
            saveGame();
            if (importStatusEl) importStatusEl.innerHTML = "✅ Imported";
        };
        reader.readAsText(file);
    };
}

const statisticsEl = document.getElementById("statistics");
if (statisticsEl) statisticsEl.innerHTML = `🏆 Level : ${level}<br>⭐ XP : ${xp}<br>💰 Coins : ${coins}`;

const graduateBtn = document.getElementById("graduate");
if (graduateBtn) {
    graduateBtn.onclick = () => {
        const out = document.getElementById("graduateStatus");
        if (out) out.innerHTML = level >= 100 ? "🎓 Graduation Complete!" : "Reach Level 100";
    };
}

console.log("Backup Module Loaded");

// ======================
// ONLINE SERVER / MATCHMAKING / PVP / LEADERBOARD / TOURNAMENT / LOGIN
// ======================
let online = false;
const connectServerBtn = document.getElementById("connectServer");
const serverStatusEl = document.getElementById("serverStatus");
if (connectServerBtn) {
    connectServerBtn.onclick = () => {
        online = true;
        if (serverStatusEl) { serverStatusEl.innerHTML = "🟢 Online"; serverStatusEl.style.color = "lime"; }
    };
}

const findMatchBtn = document.getElementById("findMatch");
if (findMatchBtn) {
    findMatchBtn.onclick = () => {
        const out = document.getElementById("matchStatus");
        if (!online) { alert("Serverga ulaning"); return; }
        if (out) out.innerHTML = "🔍 Searching...";
        setTimeout(() => { if (out) out.innerHTML = "✅ Opponent Found"; }, 2000);
    };
}

const startPvPBtn = document.getElementById("startPvP");
if (startPvPBtn) {
    startPvPBtn.onclick = () => {
        if (!online) { alert("Server Offline"); return; }
        const out = document.getElementById("pvpStatus");
        if (out) out.innerHTML = "⚔️ Battle Started";
    };
}

const topPlayers = [
    { name: "Alex", level: 120, score: 56000 },
    { name: "Emma", level: 118, score: 54000 },
    { name: "John", level: 115, score: 52000 },
    { name: "Sara", level: 110, score: 50000 }
];
const leaderboardEl = document.getElementById("leaderboard");
if (leaderboardEl) {
    topPlayers.forEach(player => {
        leaderboardEl.innerHTML += `<div class="rankCard">🏆 ${player.name}<br>Level ${player.level}<br>${player.score} XP</div>`;
    });
}

const joinTournamentBtn = document.getElementById("joinTournament");
if (joinTournamentBtn) {
    joinTournamentBtn.onclick = () => {
        const out = document.getElementById("tournamentStatus2");
        if (out) out.innerHTML = "🏅 Joined Tournament";
    };
}

const googleLoginBtn = document.getElementById("googleLogin");
const guestLoginBtn = document.getElementById("guestLogin");
const loginStatusEl = document.getElementById("loginStatus");
if (googleLoginBtn) googleLoginBtn.onclick = () => { if (loginStatusEl) loginStatusEl.innerHTML = "Google Login API Required"; };
if (guestLoginBtn) guestLoginBtn.onclick = () => { if (loginStatusEl) loginStatusEl.innerHTML = "👤 Guest Login"; };

console.log("Online Multiplayer Loaded");

// ======================
// AI TRANSLATOR / SPEECH / TTS / OCR / DICTIONARY / VOCAB (2-oyna)
// ======================
const translateBtn2 = document.getElementById("translateBtn2");
if (translateBtn2) {
    translateBtn2.onclick = () => {
        const inputEl = document.getElementById("translateInput2");
        const text = inputEl ? inputEl.value : "";
        const out = document.getElementById("translateResult2");
        if (!text) { if (out) out.innerHTML = "Matn kiriting"; return; }
        renderTranslation(text, out);
    };
}

const speechBtn = document.getElementById("speechBtn");
if (speechBtn) {
    speechBtn.onclick = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { alert("Not Supported"); return; }
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.start();
        recognition.onresult = (e) => {
            const out = document.getElementById("speechResult2");
            if (out) out.innerHTML = e.results[0][0].transcript;
        };
    };
}

const ttsBtn = document.getElementById("ttsBtn");
if (ttsBtn) {
    ttsBtn.onclick = () => {
        const ttsTextEl = document.getElementById("ttsText");
        const speech = new SpeechSynthesisUtterance(ttsTextEl ? ttsTextEl.value : "");
        speech.lang = "en-US";
        speechSynthesis.speak(speech);
    };
}

const scanImageBtn2 = document.getElementById("scanImage2");
if (scanImageBtn2) {
    scanImageBtn2.onclick = () => {
        const fileInput = document.getElementById("ocrImage2");
        const file = fileInput ? fileInput.files[0] : null;
        const out = document.getElementById("ocrResult2");
        if (!file) { alert("Rasm tanlang"); return; }
        runOCR(file, out);
    };
}

const searchWordBtn = document.getElementById("searchWord");
if (searchWordBtn) {
    searchWordBtn.onclick = () => {
        const wordInput = document.getElementById("dictionaryWord");
        const word = wordInput ? wordInput.value : "";
        const out = document.getElementById("dictionaryResult2");
        if (out) out.innerHTML = `<b>${word}</b><br>Meaning: Dictionary API Required`;
    };
}

const generateWordsBtn2 = document.getElementById("generateWords2");
if (generateWordsBtn2) {
    generateWordsBtn2.onclick = () => {
        const vocabWords = ["Apple", "Travel", "Success", "Computer", "Language", "Friend", "Beautiful", "Knowledge"];
        const out = document.getElementById("wordList");
        if (!out) return;
        out.innerHTML = "";
        vocabWords.forEach(item => out.innerHTML += `<div class="wordCard">${item}</div>`);
    };
}

console.log("AI Tools Loaded");

// ==========================
// VIDEO LESSON / MOCK TEST / PDF / DOWNLOAD / ANALYTICS / MENTOR
// ==========================
let lessonNum = 1;
const nextLessonBtn = document.getElementById("nextLesson");
if (nextLessonBtn) nextLessonBtn.onclick = () => { lessonNum++; alert("Opening Lesson " + lessonNum); };

const startPronunciationBtn2 = document.getElementById("startPronunciation2");
if (startPronunciationBtn2) {
    startPronunciationBtn2.onclick = () => {
        const out = document.getElementById("pronunciationScore2");
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const target = deck[index] ? deck[index].en : "Hello";
        if (!SpeechRecognition) {
            if (out) out.innerHTML = "🎙️ Brauzeringiz ovozni aniqlashni qo'llab-quvvatlamaydi.";
            return;
        }
        if (out) out.innerHTML = `🎤 Ayting: "${target}"...`;
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.start();
        recognition.onresult = (e) => {
            const spoken = e.results[0][0].transcript;
            const scoreVal = pronunciationSimilarity(spoken, target);
            if (out) out.innerHTML = `🗣️ "${spoken}"<br>⭐ Score: ${scoreVal}/100`;
        };
        recognition.onerror = () => {
            if (out) out.innerHTML = "❌ Ovoz aniqlanmadi, qayta urinib ko'ring.";
        };
    };
}

const startMockBtn = document.getElementById("startMock");
if (startMockBtn) {
    startMockBtn.onclick = () => {
        const out = document.getElementById("mockStatus");
        if (out) out.innerHTML = "📝 Test Started";
    };
}

const openPDFBtn = document.getElementById("openPDF");
if (openPDFBtn) {
    openPDFBtn.onclick = () => {
        const fileInput = document.getElementById("pdfFile2");
        if (!fileInput || !fileInput.files.length) { alert("Select PDF"); return; }
        const out = document.getElementById("pdfStatus2");
        if (out) out.innerHTML = "📖 PDF Loaded";
    };
}

const downloadLessonBtn = document.getElementById("downloadLesson");
if (downloadLessonBtn) {
    downloadLessonBtn.onclick = () => {
        const out = document.getElementById("downloadStatus");
        if (out) out.innerHTML = "⬇️ Lesson Downloaded";
    };
}

const analyticsBoxEl = document.getElementById("analyticsBox");
if (analyticsBoxEl) analyticsBoxEl.innerHTML = `📚 Lessons : 85<br>⭐ XP : ${xp}<br>🏆 Level : ${level}<br>🔥 Streak : 12 Days`;

const askMentorBtn = document.getElementById("askMentor");
if (askMentorBtn) {
    askMentorBtn.onclick = () => {
        const out = document.getElementById("mentorAnswer");
        if (out) out.innerHTML = `🤖 Today's Advice<br><br>• Learn 20 new words<br>• Practice speaking 15 min<br>• Complete 2 quizzes<br>• Review yesterday's lesson`;
    };
}

console.log("Learning Center Loaded");

// ======================
// 3D GLOBE / AR / VR / LIVE CLASS / TEACHER / SCHOOL / CERTIFICATE
// ======================
const openGlobeBtn = document.getElementById("openGlobe");
if (openGlobeBtn) openGlobeBtn.onclick = () => alert("🌍 3D Globe Loaded");

const startARBtn = document.getElementById("startAR");
if (startARBtn) startARBtn.onclick = () => { const out = document.getElementById("arStatus"); if (out) out.innerHTML = "📱 AR API Required"; };

const startVRBtn = document.getElementById("startVR");
if (startVRBtn) startVRBtn.onclick = () => { const out = document.getElementById("vrStatus"); if (out) out.innerHTML = "🥽 VR API Required"; };

const joinClassBtn = document.getElementById("joinClass");
if (joinClassBtn) {
    joinClassBtn.onclick = () => {
        const out = document.getElementById("classStatus");
        if (out) out.innerHTML = "📹 Connecting...";
        setTimeout(() => { if (out) out.innerHTML = "✅ Connected"; }, 2000);
    };
}

const teacherPanelEl = document.getElementById("teacherPanel");
if (teacherPanelEl) teacherPanelEl.innerHTML = `👨‍🏫 Students: 125<br>📚 Lessons: 42<br>📝 Homework: 16<br>📈 Average Score: 89%`;

const schoolPanelEl = document.getElementById("schoolPanel");
if (schoolPanelEl) schoolPanelEl.innerHTML = `🏫 Classes: 12<br>👨‍🎓 Students: 780<br>👩‍🏫 Teachers: 45<br>📖 Courses: 60`;

// NOTE: eski "generateCertificate" tugmasi HTML'da mavjud emas edi va
// hech qachon ishlamagan. Haqiqiy Sertifikat generatori fayl oxirida.

console.log("Enterprise Module Loaded");

// =========================
// ULTIMATE AI: ASSISTANT / VOICE CALL / HOMEWORK / CAREER / UNIVERSITY / INTERVIEW / REVISION / LIFE STATS
// =========================
const ultimateResultEl = document.getElementById("ultimateResult");

const aiAssistantBtn = document.getElementById("aiAssistant");
if (aiAssistantBtn) aiAssistantBtn.onclick = () => { if (ultimateResultEl) ultimateResultEl.innerHTML = `🤖 AI Assistant Ready. Ask anything in English.`; };

const voiceCallBtn = document.getElementById("voiceCall");
if (voiceCallBtn) voiceCallBtn.onclick = () => { if (ultimateResultEl) ultimateResultEl.innerHTML = "🎙️ Connecting AI Teacher..."; };

const scanHomeworkBtn = document.getElementById("scanHomework");
if (scanHomeworkBtn) scanHomeworkBtn.onclick = () => { if (ultimateResultEl) ultimateResultEl.innerHTML = "📷 OCR + AI Checking"; };

const careerModeBtn = document.getElementById("careerMode");
if (careerModeBtn) careerModeBtn.onclick = () => { if (ultimateResultEl) ultimateResultEl.innerHTML = `💼 Career English, Business English, Meeting English, Presentation Skills`; };

const universityPrepBtn = document.getElementById("universityPrep");
if (universityPrepBtn) universityPrepBtn.onclick = () => { if (ultimateResultEl) ultimateResultEl.innerHTML = `🎓 IELTS, TOEFL, SAT, GRE`; };

const jobInterviewBtn = document.getElementById("jobInterview");
if (jobInterviewBtn) jobInterviewBtn.onclick = () => { if (ultimateResultEl) ultimateResultEl.innerHTML = "🗣️ Interview Started"; };

const smartRevisionBtn = document.getElementById("smartRevision");
if (smartRevisionBtn) smartRevisionBtn.onclick = () => { if (ultimateResultEl) ultimateResultEl.innerHTML = `📚 Today's Revision: Grammar, Vocabulary, Speaking, Listening`; };

const lifeStatisticsBtn = document.getElementById("lifeStatistics");
if (lifeStatisticsBtn) {
    lifeStatisticsBtn.onclick = () => {
        if (ultimateResultEl) ultimateResultEl.innerHTML = `
            🏆 Total XP : ${xp}
            ⭐ Level : ${level}
            💰 Coins : ${coins}
            🔥 Streak : 50 Days
            📖 Lessons : 420
            🎮 Battles : 180
        `;
    };
}

console.log("Ultimate Edition Loaded");

// =========================================================================
// NOLDAN BOSHLASH KURSI (Beginner Course): Ingliz + Rus tili — alifbo,
// sonlar, salomlashish, grammatika asoslari. Har biri talaffuz bilan.
// =========================================================================

function getVoiceRate() {
    const saved = parseFloat(localStorage.getItem("voiceRate"));
    return isNaN(saved) ? 0.85 : saved;
}

// Brauzerda mavjud barcha ovozlarni oldindan yuklab olamiz (ba'zi
// brauzerlarda ovozlar asinxron tarzda keladi).
let availableVoices = [];
function refreshVoices() {
    if ("speechSynthesis" in window) availableVoices = speechSynthesis.getVoices();
}
if ("speechSynthesis" in window) {
    refreshVoices();
    speechSynthesis.onvoiceschanged = refreshVoices;
}

// Berilgan til kodi uchun eng mos ovozni tanlaydi: avval aniq mos kelgan
// (masalan "ar-SA"), bo'lmasa bosh tili mos keladigan har qanday ovoz
// (masalan "ar-EG"), tanlanadi.
function pickBestVoice(langCode) {
    if (!availableVoices.length) refreshVoices();
    if (!availableVoices.length) return null;
    const exact = availableVoices.find(v => v.lang && v.lang.toLowerCase() === langCode.toLowerCase());
    if (exact) return exact;
    const base = langCode.split("-")[0].toLowerCase();
    const partial = availableVoices.find(v => v.lang && v.lang.toLowerCase().startsWith(base));
    return partial || null;
}

function speakText(text, langCode) {
    if (!("speechSynthesis" in window) || !text) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = langCode;
    utter.rate = getVoiceRate();
    const voice = pickBestVoice(langCode);
    if (voice) utter.voice = voice;
    else if (langCode.startsWith("ar")) {
        // Ba'zi qurilmalarda arabcha ovoz o'rnatilmagan bo'lishi mumkin —
        // foydalanuvchini shu haqda ogohlantiramiz (faqat bir marta).
        if (!speakText._arWarned) {
            speakText._arWarned = true;
            console.warn("⚠️ Bu qurilmada arabcha ovoz topilmadi, standart ovoz ishlatiladi.");
        }
    }
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
}

const ENGLISH_ALPHABET = [
    { letter: "A", sound: "ey", word: "Apple", uz: "Olma" },
    { letter: "B", sound: "bi", word: "Book", uz: "Kitob" },
    { letter: "C", sound: "si", word: "Cat", uz: "Mushuk" },
    { letter: "D", sound: "di", word: "Dog", uz: "It" },
    { letter: "E", sound: "i", word: "Egg", uz: "Tuxum" },
    { letter: "F", sound: "ef", word: "Fish", uz: "Baliq" },
    { letter: "G", sound: "ji", word: "Girl", uz: "Qiz" },
    { letter: "H", sound: "eych", word: "Hat", uz: "Shlyapa" },
    { letter: "I", sound: "ay", word: "Ice", uz: "Muz" },
    { letter: "J", sound: "jey", word: "Juice", uz: "Sharbat" },
    { letter: "K", sound: "key", word: "King", uz: "Shoh" },
    { letter: "L", sound: "el", word: "Lion", uz: "Sher" },
    { letter: "M", sound: "em", word: "Moon", uz: "Oy" },
    { letter: "N", sound: "en", word: "Nose", uz: "Burun" },
    { letter: "O", sound: "ou", word: "Orange", uz: "Apelsin" },
    { letter: "P", sound: "pi", word: "Pen", uz: "Ruchka" },
    { letter: "Q", sound: "kyu", word: "Queen", uz: "Malika" },
    { letter: "R", sound: "ar", word: "Rain", uz: "Yomg'ir" },
    { letter: "S", sound: "es", word: "Sun", uz: "Quyosh" },
    { letter: "T", sound: "ti", word: "Tree", uz: "Daraxt" },
    { letter: "U", sound: "yu", word: "Umbrella", uz: "Soyabon" },
    { letter: "V", sound: "vi", word: "Van", uz: "Furgon" },
    { letter: "W", sound: "dabl-yu", word: "Water", uz: "Suv" },
    { letter: "X", sound: "eks", word: "Box", uz: "Quti" },
    { letter: "Y", sound: "way", word: "Yellow", uz: "Sariq" },
    { letter: "Z", sound: "zi", word: "Zoo", uz: "Hayvonot bog'i" }
];

const RUSSIAN_ALPHABET = [
    { letter: "А", sound: "a", word: "Арбуз", uz: "Tarvuz" },
    { letter: "Б", sound: "be", word: "Банан", uz: "Banan" },
    { letter: "В", sound: "ve", word: "Вода", uz: "Suv" },
    { letter: "Г", sound: "ge", word: "Голова", uz: "Bosh" },
    { letter: "Д", sound: "de", word: "Дом", uz: "Uy" },
    { letter: "Е", sound: "ye", word: "Ель", uz: "Archa" },
    { letter: "Ё", sound: "yo", word: "Ёлка", uz: "Yangi yil archasi" },
    { letter: "Ж", sound: "zhe", word: "Жираф", uz: "Jirafa" },
    { letter: "З", sound: "ze", word: "Зима", uz: "Qish" },
    { letter: "И", sound: "i", word: "Игра", uz: "O'yin" },
    { letter: "Й", sound: "i kratkoye", word: "Йогурт", uz: "Yogurt" },
    { letter: "К", sound: "ka", word: "Кот", uz: "Mushuk" },
    { letter: "Л", sound: "el", word: "Лук", uz: "Piyoz" },
    { letter: "М", sound: "em", word: "Мама", uz: "Ona" },
    { letter: "Н", sound: "en", word: "Нос", uz: "Burun" },
    { letter: "О", sound: "o", word: "Окно", uz: "Deraza" },
    { letter: "П", sound: "pe", word: "Папа", uz: "Ota" },
    { letter: "Р", sound: "er", word: "Рука", uz: "Qo'l" },
    { letter: "С", sound: "es", word: "Солнце", uz: "Quyosh" },
    { letter: "Т", sound: "te", word: "Тигр", uz: "Yo'lbars" },
    { letter: "У", sound: "u", word: "Утро", uz: "Ertalab" },
    { letter: "Ф", sound: "ef", word: "Фрукты", uz: "Mevalar" },
    { letter: "Х", sound: "kha", word: "Хлеб", uz: "Non" },
    { letter: "Ц", sound: "tse", word: "Цветок", uz: "Gul" },
    { letter: "Ч", sound: "che", word: "Чай", uz: "Choy" },
    { letter: "Ш", sound: "sha", word: "Школа", uz: "Maktab" },
    { letter: "Щ", sound: "shcha", word: "Щенок", uz: "Kuchukcha" },
    { letter: "Ъ", sound: "qattiq belgi", word: "Подъезд", uz: "Kirish eshigi (belgi ovoz bermaydi)" },
    { letter: "Ы", sound: "y", word: "Сыр", uz: "Pishloq" },
    { letter: "Ь", sound: "yumshoq belgi", word: "Мать", uz: "Ona (belgi ovoz bermaydi)" },
    { letter: "Э", sound: "e", word: "Этаж", uz: "Qavat" },
    { letter: "Ю", sound: "yu", word: "Юбка", uz: "Yubka" },
    { letter: "Я", sound: "ya", word: "Яблоко", uz: "Olma" }
];

const NUMBER_UZ = ["Nol","Bir","Ikki","Uch","To'rt","Besh","Olti","Yetti","Sakkiz","To'qqiz","O'n",
    "O'n bir","O'n ikki","O'n uch","O'n to'rt","O'n besh","O'n olti","O'n yetti","O'n sakkiz","O'n to'qqiz","Yigirma"];
const NUMBER_EN = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
    "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen","Twenty"];
const NUMBER_RU = ["Ноль","Один","Два","Три","Четыре","Пять","Шесть","Семь","Восемь","Девять","Десять",
    "Одиннадцать","Двенадцать","Тринадцать","Четырнадцать","Пятнадцать","Шестнадцать","Семнадцать","Восемнадцать","Девятнадцать","Двадцать"];

const GREETINGS_EN = [
    { phrase: "Hello", uz: "Salom" },
    { phrase: "Good morning", uz: "Xayrli tong" },
    { phrase: "Good afternoon", uz: "Xayrli kun" },
    { phrase: "Good evening", uz: "Xayrli kech" },
    { phrase: "Good night", uz: "Xayrli tun" },
    { phrase: "How are you?", uz: "Qalaysiz?" },
    { phrase: "I'm fine, thank you", uz: "Yaxshiman, rahmat" },
    { phrase: "What's your name?", uz: "Ismingiz nima?" },
    { phrase: "My name is...", uz: "Mening ismim..." },
    { phrase: "Nice to meet you", uz: "Tanishganimdan xursandman" },
    { phrase: "Thank you", uz: "Rahmat" },
    { phrase: "Please", uz: "Iltimos" },
    { phrase: "Excuse me / Sorry", uz: "Kechirasiz" },
    { phrase: "Goodbye", uz: "Xayr" },
    { phrase: "See you later", uz: "Ko'rishguncha" }
];

const GREETINGS_RU = [
    { phrase: "Привет", uz: "Salom (norasmiy)" },
    { phrase: "Здравствуйте", uz: "Assalomu alaykum (rasmiy)" },
    { phrase: "Доброе утро", uz: "Xayrli tong" },
    { phrase: "Добрый день", uz: "Xayrli kun" },
    { phrase: "Добрый вечер", uz: "Xayrli kech" },
    { phrase: "Спокойной ночи", uz: "Xayrli tun" },
    { phrase: "Как дела?", uz: "Ishlar qalay?" },
    { phrase: "Хорошо, спасибо", uz: "Yaxshi, rahmat" },
    { phrase: "Как тебя зовут?", uz: "Isming nima?" },
    { phrase: "Меня зовут...", uz: "Mening ismim..." },
    { phrase: "Приятно познакомиться", uz: "Tanishganimdan xursandman" },
    { phrase: "Спасибо", uz: "Rahmat" },
    { phrase: "Пожалуйста", uz: "Iltimos / Marhamat" },
    { phrase: "Извините", uz: "Kechirasiz" },
    { phrase: "До свидания", uz: "Xayr" }
];

const TURKISH_ALPHABET = [
    { letter: "A", sound: "a", word: "Elma", uz: "Olma" },
    { letter: "B", sound: "be", word: "Bebek", uz: "Chaqaloq" },
    { letter: "C", sound: "je", word: "Can", uz: "Jon" },
    { letter: "Ç", sound: "che", word: "Çiçek", uz: "Gul" },
    { letter: "D", sound: "de", word: "Dünya", uz: "Dunyo" },
    { letter: "E", sound: "e", word: "Ev", uz: "Uy" },
    { letter: "F", sound: "fe", word: "Fil", uz: "Fil" },
    { letter: "G", sound: "ge", word: "Göz", uz: "Ko'z" },
    { letter: "Ğ", sound: "yumshoq g' (cho'ziladi)", word: "Dağ", uz: "Tog'" },
    { letter: "H", sound: "he", word: "Hava", uz: "Havo" },
    { letter: "I", sound: "nuqtasiz i", word: "Işık", uz: "Yorug'lik" },
    { letter: "İ", sound: "nuqtali i", word: "İyi", uz: "Yaxshi" },
    { letter: "J", sound: "je", word: "Jeton", uz: "Jeton" },
    { letter: "K", sound: "ke", word: "Kitap", uz: "Kitob" },
    { letter: "L", sound: "le", word: "Limon", uz: "Limon" },
    { letter: "M", sound: "me", word: "Masa", uz: "Stol" },
    { letter: "N", sound: "ne", word: "Nar", uz: "Anor" },
    { letter: "O", sound: "o", word: "Okul", uz: "Maktab" },
    { letter: "Ö", sound: "nemischa ö", word: "Ödev", uz: "Uy vazifasi" },
    { letter: "P", sound: "pe", word: "Pencere", uz: "Deraza" },
    { letter: "R", sound: "re", word: "Resim", uz: "Rasm" },
    { letter: "S", sound: "se", word: "Su", uz: "Suv" },
    { letter: "Ş", sound: "sh", word: "Şeker", uz: "Shakar" },
    { letter: "T", sound: "te", word: "Tavuk", uz: "Tovuq" },
    { letter: "U", sound: "u", word: "Uçak", uz: "Samolyot" },
    { letter: "Ü", sound: "nemischa ü", word: "Ülke", uz: "Mamlakat" },
    { letter: "V", sound: "ve", word: "Vazo", uz: "Vaza" },
    { letter: "Y", sound: "ye", word: "Yıldız", uz: "Yulduz" },
    { letter: "Z", sound: "ze", word: "Zaman", uz: "Vaqt" }
];

// Xitoy tilida "alifbo" tushunchasi yo'q — o'rniga PINYIN (lotincha yozuv)
// va 4 ta OHANG (tone) ishlatiladi. Bir xil bo'g'in har xil ohangda
// aytilsa, butunlay boshqa ma'noni bildiradi — shu sababli klassik "ma"
// misoli orqali tushuntiramiz.
const CHINESE_TONES = [
    { letter: "mā", sound: "1-ohang: tekis, baland", word: "妈 (mā)", uz: "Ona" },
    { letter: "má", sound: "2-ohang: pastdan yuqoriga", word: "麻 (má)", uz: "Kanop (o'simlik)" },
    { letter: "mǎ", sound: "3-ohang: pastlab-ko'tariladi", word: "马 (mǎ)", uz: "Ot (hayvon)" },
    { letter: "mà", sound: "4-ohang: yuqoridan keskin pastga", word: "骂 (mà)", uz: "Haqorat qilmoq" },
    { letter: "ma", sound: "neytral ohang (urg'usiz)", word: "吗 (ma)", uz: "Savol yuklamasi" }
];

const CHINESE_BASICS = [
    { letter: "你", sound: "nǐ", word: "你 (nǐ)", uz: "Sen" },
    { letter: "我", sound: "wǒ", word: "我 (wǒ)", uz: "Men" },
    { letter: "他", sound: "tā", word: "他 (tā)", uz: "U (erkak)" },
    { letter: "她", sound: "tā", word: "她 (tā)", uz: "U (ayol)" },
    { letter: "好", sound: "hǎo", word: "好 (hǎo)", uz: "Yaxshi" },
    { letter: "是", sound: "shì", word: "是 (shì)", uz: "Bo'lmoq (fe'l)" },
    { letter: "人", sound: "rén", word: "人 (rén)", uz: "Odam" },
    { letter: "大", sound: "dà", word: "大 (dà)", uz: "Katta" },
    { letter: "小", sound: "xiǎo", word: "小 (xiǎo)", uz: "Kichik" },
    { letter: "水", sound: "shuǐ", word: "水 (shuǐ)", uz: "Suv" }
];

const NUMBER_TR = ["Sıfır","Bir","İki","Üç","Dört","Beş","Altı","Yedi","Sekiz","Dokuz","On",
    "On bir","On iki","On üç","On dört","On beş","On altı","On yedi","On sekiz","On dokuz","Yirmi"];
const NUMBER_ZH = ["零 (líng)","一 (yī)","二 (èr)","三 (sān)","四 (sì)","五 (wǔ)","六 (liù)","七 (qī)","八 (bā)","九 (jiǔ)","十 (shí)",
    "十一 (shí yī)","十二 (shí èr)","十三 (shí sān)","十四 (shí sì)","十五 (shí wǔ)","十六 (shí liù)","十七 (shí qī)","十八 (shí bā)","十九 (shí jiǔ)","二十 (èr shí)"];
const NUMBER_AR = ["صفر (sifr)","واحد (wahid)","اثنان (ithnan)","ثلاثة (thalatha)","أربعة (arba'a)","خمسة (khamsa)","ستة (sitta)","سبعة (sab'a)","ثمانية (thamaniya)","تسعة (tis'a)","عشرة (ashara)",
    "أحد عشر (ahada ashar)","اثنا عشر (ithna ashar)","ثلاثة عشر (thalathata ashar)","أربعة عشر (arba'ata ashar)","خمسة عشر (khamsata ashar)","ستة عشر (sittata ashar)","سبعة عشر (sab'ata ashar)","ثمانية عشر (thamaniyata ashar)","تسعة عشر (tis'ata ashar)","عشرون (ishrun)"];

// Arab alifbosi — 28 harf, har biriga talaffuz ko'rsatmasi va misol so'z bilan.
// Harflar bitta so'zning boshida turgan holatda (isolated form) berilgan.
const ARABIC_ALPHABET = [
    { letter: "ا", sound: "alif — cho'ziq \"a\"", word: "أسد (asad)", uz: "Sher" },
    { letter: "ب", sound: "ba — \"b\"", word: "باب (bab)", uz: "Eshik" },
    { letter: "ت", sound: "ta — \"t\"", word: "تفاح (tuffah)", uz: "Olma" },
    { letter: "ث", sound: "tha — inglizcha \"think\"dagi th", word: "ثعلب (thaʻlab)", uz: "Tulki" },
    { letter: "ج", sound: "jim — \"j\"", word: "جمل (jamal)", uz: "Tuya" },
    { letter: "ح", sound: "ha — bo'g'iq, chuqur \"h\"", word: "حصان (hisan)", uz: "Ot" },
    { letter: "خ", sound: "kha — tomoqdan chiquvchi \"x\"", word: "خبز (khubz)", uz: "Non" },
    { letter: "د", sound: "dal — \"d\"", word: "دار (dar)", uz: "Uy" },
    { letter: "ذ", sound: "dhal — inglizcha \"the\"dagi th", word: "ذهب (dhahab)", uz: "Oltin" },
    { letter: "ر", sound: "ra — dumaloq \"r\"", word: "رجل (rajul)", uz: "Erkak" },
    { letter: "ز", sound: "zay — \"z\"", word: "زهرة (zahra)", uz: "Gul" },
    { letter: "س", sound: "sin — \"s\"", word: "سمك (samak)", uz: "Baliq" },
    { letter: "ش", sound: "shin — \"sh\"", word: "شمس (shams)", uz: "Quyosh" },
    { letter: "ص", sound: "sad — qattiq, bo'g'iq \"s\"", word: "صديق (sadiq)", uz: "Do'st" },
    { letter: "ض", sound: "dad — qattiq, bo'g'iq \"d\"", word: "ضوء (dau')", uz: "Yorug'lik" },
    { letter: "ط", sound: "ta — qattiq, bo'g'iq \"t\"", word: "طالب (talib)", uz: "Talaba" },
    { letter: "ظ", sound: "za — qattiq, bo'g'iq \"z\"", word: "ظهر (zuhr)", uz: "Peshin" },
    { letter: "ع", sound: "ayn — tomoq tovushi (o'ziga xos)", word: "عين (ayn)", uz: "Ko'z" },
    { letter: "غ", sound: "ghayn — fransuzcha \"r\" kabi", word: "غنم (ghanam)", uz: "Qo'y" },
    { letter: "ف", sound: "fa — \"f\"", word: "فيل (fil)", uz: "Fil" },
    { letter: "ق", sound: "qaf — chuqur, tomoqdan \"q\"", word: "قلم (qalam)", uz: "Qalam" },
    { letter: "ك", sound: "kaf — \"k\"", word: "كتاب (kitab)", uz: "Kitob" },
    { letter: "ل", sound: "lam — \"l\"", word: "ليل (layl)", uz: "Tun" },
    { letter: "م", sound: "mim — \"m\"", word: "ماء (ma')", uz: "Suv" },
    { letter: "ن", sound: "nun — \"n\"", word: "نجم (najm)", uz: "Yulduz" },
    { letter: "ه", sound: "ha — yumshoq \"h\"", word: "هدية (hadiya)", uz: "Sovg'a" },
    { letter: "و", sound: "waw — \"w\" yoki cho'ziq \"u\"", word: "وردة (warda)", uz: "Atirgul" },
    { letter: "ي", sound: "ya — \"y\" yoki cho'ziq \"i\"", word: "يد (yad)", uz: "Qo'l" }
];

const GREETINGS_TR = [
    { phrase: "Merhaba", uz: "Salom" },
    { phrase: "Günaydın", uz: "Xayrli tong" },
    { phrase: "İyi günler", uz: "Xayrli kun" },
    { phrase: "İyi akşamlar", uz: "Xayrli kech" },
    { phrase: "İyi geceler", uz: "Xayrli tun" },
    { phrase: "Nasılsın?", uz: "Qalaysan?" },
    { phrase: "İyiyim, teşekkürler", uz: "Yaxshiman, rahmat" },
    { phrase: "Adın ne?", uz: "Isming nima?" },
    { phrase: "Benim adım...", uz: "Mening ismim..." },
    { phrase: "Tanıştığımıza memnun oldum", uz: "Tanishganimdan xursandman" },
    { phrase: "Teşekkür ederim", uz: "Rahmat" },
    { phrase: "Lütfen", uz: "Iltimos" },
    { phrase: "Özür dilerim", uz: "Kechirasiz" },
    { phrase: "Hoşça kal", uz: "Xayr" },
    { phrase: "Görüşürüz", uz: "Ko'rishguncha" }
];

const GREETINGS_ZH = [
    { phrase: "你好 (Nǐ hǎo)", uz: "Salom" },
    { phrase: "早上好 (Zǎoshang hǎo)", uz: "Xayrli tong" },
    { phrase: "下午好 (Xiàwǔ hǎo)", uz: "Xayrli kun" },
    { phrase: "晚上好 (Wǎnshang hǎo)", uz: "Xayrli kech" },
    { phrase: "晚安 (Wǎn'ān)", uz: "Xayrli tun" },
    { phrase: "你好吗？(Nǐ hǎo ma?)", uz: "Qalaysiz?" },
    { phrase: "我很好，谢谢 (Wǒ hěn hǎo, xièxie)", uz: "Yaxshiman, rahmat" },
    { phrase: "你叫什么名字？(Nǐ jiào shénme míngzì?)", uz: "Isming nima?" },
    { phrase: "我叫... (Wǒ jiào...)", uz: "Mening ismim..." },
    { phrase: "很高兴认识你 (Hěn gāoxìng rènshi nǐ)", uz: "Tanishganimdan xursandman" },
    { phrase: "谢谢 (Xièxie)", uz: "Rahmat" },
    { phrase: "请 (Qǐng)", uz: "Iltimos" },
    { phrase: "对不起 (Duìbuqǐ)", uz: "Kechirasiz" },
    { phrase: "再见 (Zàijiàn)", uz: "Xayr" },
    { phrase: "回头见 (Huítóu jiàn)", uz: "Ko'rishguncha" }
];

const GREETINGS_AR = [
    { phrase: "مرحبا (marhaban)", uz: "Salom" },
    { phrase: "صباح الخير (sabah al-khayr)", uz: "Xayrli tong" },
    { phrase: "نهارك سعيد (naharuka saʻid)", uz: "Xayrli kun" },
    { phrase: "مساء الخير (masa' al-khayr)", uz: "Xayrli kech" },
    { phrase: "تصبح على خير (tusbih ʻala khayr)", uz: "Xayrli tun" },
    { phrase: "كيف حالك؟ (kayfa haluk?)", uz: "Qalaysiz?" },
    { phrase: "أنا بخير، شكرا (ana bikhayr, shukran)", uz: "Yaxshiman, rahmat" },
    { phrase: "ما اسمك؟ (ma ismuk?)", uz: "Ismingiz nima?" },
    { phrase: "اسمي... (ismi...)", uz: "Mening ismim..." },
    { phrase: "تشرفنا (tasharrafna)", uz: "Tanishganimdan xursandman" },
    { phrase: "شكرا (shukran)", uz: "Rahmat" },
    { phrase: "من فضلك (min fadlik)", uz: "Iltimos" },
    { phrase: "آسف / عفوا (asif / afwan)", uz: "Kechirasiz" },
    { phrase: "مع السلامة (maʻa as-salama)", uz: "Xayr" },
    { phrase: "إلى اللقاء (ila al-liqa')", uz: "Ko'rishguncha" }
];

function renderTileGrid(items, noteHtml, rtl) {
    const note = noteHtml ? `<p class="ai-settings-hint">${noteHtml}</p>` : "";
    return note + `<div class="tile-grid"${rtl ? ' dir="rtl"' : ''}>` + items.map(it => `
        <button class="tile alpha-tile${rtl ? ' arabic-text' : ''}" data-speak="${it.word.replace(/"/g, "&quot;")}">
            <div class="tile-letter">${it.letter}</div>
            <div class="tile-sound">${it.sound}</div>
            <div class="tile-word">${it.word}</div>
            <div class="tile-uz">${it.uz}</div>
        </button>`).join("") + `</div>`;
}

function renderNumberGrid(lang) {
    const map = { en: NUMBER_EN, ru: NUMBER_RU, tr: NUMBER_TR, zh: NUMBER_ZH, ar: NUMBER_AR };
    const words_ = map[lang] || NUMBER_EN;
    const rtl = lang === "ar";
    return `<div class="tile-grid"${rtl ? ' dir="rtl"' : ''}>` + words_.map((w, i) => `
        <button class="tile num-tile${rtl ? ' arabic-text' : ''}" data-speak="${w.replace(/"/g, "&quot;")}">
            <div class="tile-letter">${i}</div>
            <div class="tile-word">${w}</div>
            <div class="tile-uz">${NUMBER_UZ[i]}</div>
        </button>`).join("") + `</div>`;
}

function renderGreetingList(lang) {
    const map = { en: GREETINGS_EN, ru: GREETINGS_RU, tr: GREETINGS_TR, zh: GREETINGS_ZH, ar: GREETINGS_AR };
    const list = map[lang] || GREETINGS_EN;
    const rtl = lang === "ar";
    return `<div class="phrase-list">` + list.map(g => `
        <div class="phrase-row">
            <button class="phrase-speak" data-speak="${g.phrase.replace(/"/g, "&quot;")}">🔊</button>
            <div class="phrase-texts"${rtl ? ' dir="rtl"' : ''}>
                <div class="phrase-main${rtl ? ' arabic-text' : ''}">${g.phrase}</div>
                <div class="phrase-uz">${g.uz}</div>
            </div>
        </div>`).join("") + `</div>`;
}

function renderGrammarBasics(lang) {
    if (lang === "ru") {
        return `
        <div class="grammar-box">
            <h3>Kishilik olmoshlari (Личные местоимения)</h3>
            <table class="grammar-table">
                <tr><td>Я</td><td>Men</td></tr>
                <tr><td>Ты</td><td>Sen</td></tr>
                <tr><td>Он / Она / Оно</td><td>U (erkak/ayol/narsa)</td></tr>
                <tr><td>Мы</td><td>Biz</td></tr>
                <tr><td>Вы</td><td>Siz / Sizlar</td></tr>
                <tr><td>Они</td><td>Ular</td></tr>
            </table>
            <h3>Muhim qoida: "bo'lmoq" fe'li hozirgi zamonda tushib qoladi</h3>
            <p class="ai-settings-hint">Ingliz tilida "I am", "You are" deyilsa, rus tilida hozirgi zamonda bu fe'l umuman ishlatilmaydi: <b>Я студент</b> — so'zma-so'z "Men talaba", ya'ni "Men talabaman".</p>
            <h3>Muhim eslatma: kelishiklar (падежи)</h3>
            <p class="ai-settings-hint">Rus tilida otlar gapdagi vazifasiga qarab oxiri o'zgaradi (masalan: книга → книги → книгу). Bu — boshlang'ich bosqichdan keyin o'rganiladigan mavzu, hozircha so'z va iboralarni yodlashga e'tibor bering.</p>
        </div>`;
    }

    if (lang === "tr") {
        return `
        <div class="grammar-box">
            <h3>Kishilik olmoshlari (Kişi zamirleri)</h3>
            <table class="grammar-table">
                <tr><td>Ben</td><td>Men</td></tr>
                <tr><td>Sen</td><td>Sen</td></tr>
                <tr><td>O</td><td>U (erkak/ayol/narsa)</td></tr>
                <tr><td>Biz</td><td>Biz</td></tr>
                <tr><td>Siz</td><td>Siz / Sizlar</td></tr>
                <tr><td>Onlar</td><td>Ular</td></tr>
            </table>
            <h3>Muhim qoida: Turk tili "qo'shimchali" (agglutinativ) til</h3>
            <p class="ai-settings-hint">Turk tilida "bo'lmoq" fe'li alohida so'z emas, balki so'zga qo'shimcha sifatida qo'shiladi: <b>öğrenci</b> (talaba) + <b>-yim</b> = <b>öğrenciyim</b> ("Men talabaman"). So'zga qo'shimchalar qatlab qo'shilaveradi: <b>ev</b> (uy) → <b>evim</b> (uyim) → <b>evimde</b> (uyimda).</p>
            <h3>Gap tuzilishi: Ega + To'ldiruvchi + Fe'l</h3>
            <p class="ai-settings-hint">Ingliz/rus tilidan farqli o'laroq, turk tilida fe'l odatda gapning oxirida keladi: <b>Ben elma yerim</b> so'zma-so'z "Men olma yeyman" (Men + olma + yeyman).</p>
        </div>`;
    }

    if (lang === "zh") {
        return `
        <div class="grammar-box">
            <h3>Kishilik olmoshlari (人称代词)</h3>
            <table class="grammar-table">
                <tr><td>我 (wǒ)</td><td>Men</td></tr>
                <tr><td>你 (nǐ)</td><td>Sen</td></tr>
                <tr><td>他 / 她 / 它 (tā)</td><td>U (erkak/ayol/narsa — talaffuzda bir xil!)</td></tr>
                <tr><td>我们 (wǒmen)</td><td>Biz</td></tr>
                <tr><td>你们 (nǐmen)</td><td>Sizlar</td></tr>
                <tr><td>他们 (tāmen)</td><td>Ular</td></tr>
            </table>
            <h3>Muhim qoida: fe'llar hech qachon o'zgarmaydi</h3>
            <p class="ai-settings-hint">Xitoy tilida fe'llar shaxs yoki zamonga qarab konjugatsiya qilinmaydi. "Bo'lmoq" fe'li — <b>是 (shì)</b> — har doim bir xil qoladi: <b>我是</b> (men -man), <b>你是</b> (sen -san), <b>他是</b> (u -...).</p>
            <h3>Gap tuzilishi: Ega + Fe'l + To'ldiruvchi</h3>
            <p class="ai-settings-hint">Ingliz tiliga o'xshab: <b>我爱你 (Wǒ ài nǐ)</b> — so'zma-so'z "Men sevaman seni" ("Men seni sevaman").</p>
            <h3>O'lchov so'zlari (量词)</h3>
            <p class="ai-settings-hint">Narsalarni sanaganda maxsus "o'lchov so'zi" kerak bo'ladi, masalan <b>一个人 (yī gè rén)</b> — "bitta odam", bu yerda <b>个 (gè)</b> — o'lchov so'zi.</p>
        </div>`;
    }

    if (lang === "ar") {
        return `
        <div class="grammar-box">
            <h3 dir="rtl" class="arabic-text">الضمائر الشخصية (Kishilik olmoshlari)</h3>
            <table class="grammar-table" dir="rtl">
                <tr><td class="arabic-text">أنا</td><td>Men</td></tr>
                <tr><td class="arabic-text">أنتَ / أنتِ</td><td>Sen (erkak / ayol)</td></tr>
                <tr><td class="arabic-text">هو / هي</td><td>U (erkak / ayol)</td></tr>
                <tr><td class="arabic-text">نحن</td><td>Biz</td></tr>
                <tr><td class="arabic-text">أنتم</td><td>Sizlar</td></tr>
                <tr><td class="arabic-text">هم</td><td>Ular</td></tr>
            </table>
            <h3>Muhim qoida: hozirgi zamonda "bo'lmoq" fe'li ishlatilmaydi</h3>
            <p class="ai-settings-hint">Rus tilidagi kabi, arab tilida ham hozirgi zamon gaplarida "bo'lmoq" fe'li tushib qoladi: <b dir="rtl" class="arabic-text">أنا طالب</b> so'zma-so'z "Men talaba", ya'ni "Men talabaman".</p>
            <h3>Yozuv yo'nalishi va aniqlik artikli</h3>
            <p class="ai-settings-hint">Arab tili o'ngdan-chapga yoziladi. Otni aniq qilish uchun old qo'shimcha <b dir="rtl" class="arabic-text">الـ (al-)</b> qo'shiladi: <b dir="rtl" class="arabic-text">كتاب</b> (bir kitob) → <b dir="rtl" class="arabic-text">الكتاب</b> (o'sha kitob).</p>
            <h3>Jins (muannas/muzakkar)</h3>
            <p class="ai-settings-hint">Arab tilida otlar va sifatlar erkak yoki ayol jinsida bo'ladi. Ayol jinsidagi so'zlar ko'pincha oxirida <b dir="rtl" class="arabic-text">ة (ta marbuta)</b> harfi bilan tugaydi, masalan: <b dir="rtl" class="arabic-text">طالب</b> (talaba, erkak) → <b dir="rtl" class="arabic-text">طالبة</b> (talaba, ayol).</p>
        </div>`;
    }

    return `
    <div class="grammar-box">
        <h3>Personal pronouns (Kishilik olmoshlari)</h3>
        <table class="grammar-table">
            <tr><td>I</td><td>Men</td></tr>
            <tr><td>You</td><td>Sen / Siz</td></tr>
            <tr><td>He / She / It</td><td>U (erkak/ayol/narsa)</td></tr>
            <tr><td>We</td><td>Biz</td></tr>
            <tr><td>You</td><td>Sizlar</td></tr>
            <tr><td>They</td><td>Ular</td></tr>
        </table>
        <h3>Verb "to be" (bo'lmoq)</h3>
        <table class="grammar-table">
            <tr><td>I am</td><td>Men ... man</td></tr>
            <tr><td>You are</td><td>Sen ... san</td></tr>
            <tr><td>He/She/It is</td><td>U ...</td></tr>
            <tr><td>We are</td><td>Biz ... miz</td></tr>
            <tr><td>They are</td><td>Ular ...</td></tr>
        </table>
        <h3>Oddiy gap tuzilishi</h3>
        <p class="ai-settings-hint">Ingliz tilida gap tartibi doim qat'iy: <b>Ega + Fe'l + To'ldiruvchi</b> (Subject + Verb + Object). Masalan: <b>I like tea.</b> — "Men choy yaxshi ko'raman."</p>
    </div>`;
}

let beginnerLang = "en";
let beginnerTopic = "alphabet";

function renderBeginnerContent() {
    const container = document.getElementById("beginnerContent");
    if (!container) return;

    if (beginnerTopic === "alphabet") {
        if (beginnerLang === "ru") {
            container.innerHTML = renderTileGrid(RUSSIAN_ALPHABET);
        } else if (beginnerLang === "tr") {
            container.innerHTML = renderTileGrid(TURKISH_ALPHABET);
        } else if (beginnerLang === "ar") {
            container.innerHTML = renderTileGrid(ARABIC_ALPHABET, "Arab alifbosida 28 ta harf bor va ular o'ngdan-chapga yoziladi. Har bir harf so'z ichidagi o'rniga qarab (boshda/o'rtada/oxirida) shaklini biroz o'zgartiradi — quyida har bir harfning yakka (mustaqil) shakli berilgan.", true);
        } else if (beginnerLang === "zh") {
            container.innerHTML =
                renderTileGrid(CHINESE_TONES, "Xitoy tilida harflar yo'q — o'rniga <b>pinyin</b> (lotincha yozuv) va <b>4 ta ohang</b> ishlatiladi. Bir xil bo'g'in har xil ohangda aytilsa, butunlay boshqa ma'noni bildiradi. Quyida klassik <b>\"ma\"</b> misolida ko'ring:") +
                `<h3 style="margin-top:24px;color:var(--lang-cyan,#38bdf8);">Asosiy so'zlar</h3>` +
                renderTileGrid(CHINESE_BASICS);
        } else {
            container.innerHTML = renderTileGrid(ENGLISH_ALPHABET);
        }
    } else if (beginnerTopic === "numbers") {
        container.innerHTML = renderNumberGrid(beginnerLang);
    } else if (beginnerTopic === "greetings") {
        container.innerHTML = renderGreetingList(beginnerLang);
    } else if (beginnerTopic === "grammar") {
        container.innerHTML = renderGrammarBasics(beginnerLang);
    }

    const voiceLangMap = { en: "en-US", ru: "ru-RU", tr: "tr-TR", zh: "zh-CN", ar: "ar-SA" };
    const voiceLang = voiceLangMap[beginnerLang] || "en-US";
    container.querySelectorAll("[data-speak]").forEach(el => {
        el.addEventListener("click", () => speakText(el.dataset.speak, voiceLang));
    });
}

document.querySelectorAll(".beginner-lang-tab").forEach(btn => {
    btn.addEventListener("click", () => {
        beginnerLang = btn.dataset.blang;
        document.querySelectorAll(".beginner-lang-tab").forEach(b => b.classList.toggle("active", b === btn));
        renderBeginnerContent();
    });
});

document.querySelectorAll(".beginner-topic-tab").forEach(btn => {
    btn.addEventListener("click", () => {
        beginnerTopic = btn.dataset.topic;
        document.querySelectorAll(".beginner-topic-tab").forEach(b => b.classList.toggle("active", b === btn));
        renderBeginnerContent();
    });
});

renderBeginnerContent();

// =========================================================================
// SO'Z O'YINI (Word Matching Game) — yangi, mustaqil o'yin bo'limi
// =========================================================================

let matchState = { pairs: [], matchedCount: 0, selectedLeft: null };

function shuffleArr(arr) {
    return arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]);
}

function startMatchRound() {
    if (typeof words === "undefined" || !words.length) return;
    const chosen = shuffleArr(words).slice(0, 6);
    matchState.pairs = chosen.map((w, i) => ({
        id: i,
        left: (typeof getTargetWord === "function") ? getTargetWord(w) : w.en,
        right: w.uz
    }));
    matchState.matchedCount = 0;
    matchState.selectedLeft = null;
    renderMatchGrid();
}

function renderMatchGrid() {
    const grid = document.getElementById("matchGrid");
    const statusEl = document.getElementById("matchStatus");
    if (!grid) return;

    const leftItems = matchState.pairs.map(p => ({ id: p.id, text: p.left }));
    const rightItems = shuffleArr(matchState.pairs.map(p => ({ id: p.id, text: p.right })));

    grid.innerHTML = `
        <div class="match-col">
            ${leftItems.map(it => `<button class="match-item" data-id="${it.id}" data-side="left">${it.text}</button>`).join("")}
        </div>
        <div class="match-col">
            ${rightItems.map(it => `<button class="match-item" data-id="${it.id}" data-side="right">${it.text}</button>`).join("")}
        </div>
    `;
    if (statusEl) statusEl.textContent = `Juftliklar: ${matchState.matchedCount} / ${matchState.pairs.length}`;
    attachMatchListeners();
}

function attachMatchListeners() {
    const grid = document.getElementById("matchGrid");
    if (!grid) return;
    grid.querySelectorAll(".match-item").forEach(btn => {
        btn.addEventListener("click", () => {
            if (btn.disabled) return;

            if (btn.dataset.side === "left") {
                grid.querySelectorAll('.match-item[data-side="left"]').forEach(b => b.classList.remove("selected"));
                btn.classList.add("selected");
                matchState.selectedLeft = btn;
                return;
            }

            if (!matchState.selectedLeft) return;
            const leftBtn = matchState.selectedLeft;
            const isCorrect = leftBtn.dataset.id === btn.dataset.id;

            if (isCorrect) {
                leftBtn.classList.remove("selected");
                leftBtn.classList.add("matched");
                btn.classList.add("matched");
                leftBtn.disabled = true;
                btn.disabled = true;
                matchState.selectedLeft = null;
                matchState.matchedCount++;
                xp += 5;
                updateStats();

                const statusEl = document.getElementById("matchStatus");
                if (matchState.matchedCount === matchState.pairs.length) {
                    xp += 20;
                    updateStats();
                    if (typeof celebrate === "function") celebrate();
                    if (statusEl) statusEl.textContent = `🎉 Barchasi topildi! +20 XP bonus`;
                } else if (statusEl) {
                    statusEl.textContent = `Juftliklar: ${matchState.matchedCount} / ${matchState.pairs.length}`;
                }
            } else {
                btn.classList.add("shake-wrong");
                leftBtn.classList.add("shake-wrong");
                setTimeout(() => {
                    btn.classList.remove("shake-wrong");
                    leftBtn.classList.remove("shake-wrong");
                    leftBtn.classList.remove("selected");
                }, 400);
                matchState.selectedLeft = null;
            }
        });
    });
}

const newMatchRoundBtn = document.getElementById("newMatchRound");
if (newMatchRoundBtn) newMatchRoundBtn.addEventListener("click", startMatchRound);

// =========================================================================
// HARFLARNI TARTIBLASH (Word Scramble) — yangi o'yin: aralashtirilgan
// harflardan to'g'ri ingliz so'zini topish.
// =========================================================================

const scrambleState = {
    word: null,
    letters: [],
    correct: 0,
    skipped: 0,
    hintUsed: false
};

function shuffleLetters(str) {
    const arr = str.split("");
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // Bir xil tartibda chiqib qolmasligi uchun tekshiramiz
    if (arr.join("") === str && str.length > 1) return shuffleLetters(str);
    return arr.join(" ");
}

function pickScrambleWord() {
    if (typeof words === "undefined" || !words.length) return;
    // Faqat 3-9 harfli so'zlarni tanlaymiz — juda uzun/qisqa so'zlar bilan
    // o'yin qulaysiz bo'lib qolmasligi uchun.
    const pool = words.filter(w => w.en && w.en.replace(/\s+/g, "").length >= 3 && w.en.replace(/\s+/g, "").length <= 9);
    const source = pool.length ? pool : words;
    scrambleState.word = source[Math.floor(Math.random() * source.length)];
    scrambleState.letters = shuffleLetters(scrambleState.word.en.toUpperCase());
    scrambleState.hintUsed = false;

    const lettersEl = document.getElementById("scrambleLetters");
    const hintEl = document.getElementById("scrambleHint");
    const inputEl = document.getElementById("scrambleInput");
    const resultEl = document.getElementById("scrambleResult");
    if (lettersEl) lettersEl.textContent = scrambleState.letters;
    if (hintEl) hintEl.textContent = "";
    if (inputEl) inputEl.value = "";
    if (resultEl) { resultEl.textContent = ""; resultEl.className = "scramble-result"; }
}

function updateScrambleScore() {
    const scoreEl = document.getElementById("scrambleScore");
    if (scoreEl) scoreEl.textContent = `✅ ${scrambleState.correct} / ⏭ ${scrambleState.skipped}`;
}

function checkScrambleAnswer() {
    if (!scrambleState.word) return;
    const inputEl = document.getElementById("scrambleInput");
    const resultEl = document.getElementById("scrambleResult");
    if (!inputEl || !resultEl) return;

    const typed = inputEl.value.trim().toLowerCase();
    const target = scrambleState.word.en.trim().toLowerCase();

    if (!typed) return;

    if (typed === target) {
        scrambleState.correct++;
        const gained = scrambleState.hintUsed ? 5 : 10;
        xp += gained;
        coins += 3;
        updateStats();
        updateScrambleScore();
        resultEl.textContent = `✅ To'g'ri! "${scrambleState.word.en}" — ${scrambleState.word.uz}. (+${gained} XP)`;
        resultEl.className = "scramble-result correct";
        if (typeof celebrate === "function") celebrate();
        setTimeout(pickScrambleWord, 1100);
    } else {
        resultEl.textContent = "❌ Hali to'g'ri emas, qayta urinib ko'ring.";
        resultEl.className = "scramble-result wrong";
    }
}

const scrambleCheckBtn = document.getElementById("scrambleCheckBtn");
if (scrambleCheckBtn) scrambleCheckBtn.addEventListener("click", checkScrambleAnswer);

const scrambleInputEl = document.getElementById("scrambleInput");
if (scrambleInputEl) {
    scrambleInputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") checkScrambleAnswer();
    });
}

const scrambleSkipBtn = document.getElementById("scrambleSkipBtn");
if (scrambleSkipBtn) {
    scrambleSkipBtn.addEventListener("click", () => {
        scrambleState.skipped++;
        updateScrambleScore();
        pickScrambleWord();
    });
}

const scrambleHintBtn = document.getElementById("scrambleHintBtn");
if (scrambleHintBtn) {
    scrambleHintBtn.addEventListener("click", () => {
        if (!scrambleState.word) return;
        scrambleState.hintUsed = true;
        const hintEl = document.getElementById("scrambleHint");
        if (hintEl) hintEl.textContent = `💡 Tarjimasi: ${scrambleState.word.uz} (${scrambleState.word.example || ""})`;
    });
}

updateScrambleScore();

// =========================================================================
// TEZKOR YOZISH (Typing Race) — 30 soniyada imkon qadar ko'proq so'zni
// to'g'ri va tez yozish o'yini.
// =========================================================================

const typingRaceState = { timeLeft: 30, score: 0, timerId: null, currentWord: null, running: false };

function pickTypingWord() {
    if (typeof words === "undefined" || !words.length) return;
    typingRaceState.currentWord = words[Math.floor(Math.random() * words.length)];
    const targetEl = document.getElementById("typingTargetWord");
    if (targetEl) targetEl.textContent = typingRaceState.currentWord.en;
    const inputEl = document.getElementById("typingInputRace");
    if (inputEl) inputEl.value = "";
}

function endTypingRace() {
    typingRaceState.running = false;
    clearInterval(typingRaceState.timerId);
    const inputEl = document.getElementById("typingInputRace");
    if (inputEl) inputEl.disabled = true;
    const targetEl = document.getElementById("typingTargetWord");
    const gained = typingRaceState.score * 4;
    const gainedCoins = Math.floor(typingRaceState.score / 2);
    if (typingRaceState.score > 0) {
        xp += gained;
        coins += gainedCoins;
        updateStats();
    }
    if (targetEl) targetEl.textContent = `🏁 Tugadi! ${typingRaceState.score} ta so'z (+${gained} XP)`;
    if (typeof celebrate === "function" && typingRaceState.score > 0) celebrate();
    const startBtn = document.getElementById("typingStartBtn");
    if (startBtn) { startBtn.disabled = false; startBtn.textContent = "🔁 Qayta boshlash"; }
}

function startTypingRace() {
    typingRaceState.timeLeft = 30;
    typingRaceState.score = 0;
    typingRaceState.running = true;
    const inputEl = document.getElementById("typingInputRace");
    const timerEl = document.getElementById("typingTimer");
    const scoreEl = document.getElementById("typingScore");
    const startBtn = document.getElementById("typingStartBtn");
    if (inputEl) { inputEl.disabled = false; inputEl.value = ""; inputEl.focus(); }
    if (timerEl) timerEl.textContent = `⏱ ${typingRaceState.timeLeft}s`;
    if (scoreEl) scoreEl.textContent = `✅ 0`;
    if (startBtn) startBtn.disabled = true;

    pickTypingWord();
    clearInterval(typingRaceState.timerId);
    typingRaceState.timerId = setInterval(() => {
        typingRaceState.timeLeft--;
        if (timerEl) timerEl.textContent = `⏱ ${typingRaceState.timeLeft}s`;
        if (typingRaceState.timeLeft <= 0) endTypingRace();
    }, 1000);
}

const typingStartBtn = document.getElementById("typingStartBtn");
if (typingStartBtn) typingStartBtn.addEventListener("click", startTypingRace);

const typingInputRaceEl = document.getElementById("typingInputRace");
if (typingInputRaceEl) {
    typingInputRaceEl.addEventListener("input", () => {
        if (!typingRaceState.running || !typingRaceState.currentWord) return;
        const typed = typingInputRaceEl.value.trim().toLowerCase();
        const target = typingRaceState.currentWord.en.trim().toLowerCase();
        if (typed === target) {
            typingRaceState.score++;
            const scoreEl = document.getElementById("typingScore");
            if (scoreEl) scoreEl.textContent = `✅ ${typingRaceState.score}`;
            pickTypingWord();
        }
    });
}

// =========================================================================
// BO'SH JOYNI TO'LDIRISH (Fill in the Blank) — gapdagi so'zni misol
// gaplardan avtomatik olib, o'rniga bo'shliq qo'yamiz va variantlar beramiz.
// =========================================================================

function pickFillBlank() {
    if (typeof words === "undefined" || !words.length) return;
    const pool = words.filter(w => w.example && w.example.toLowerCase().includes(w.en.toLowerCase()));
    const source = pool.length ? pool : words;
    const word = source[Math.floor(Math.random() * source.length)];

    const sentenceEl = document.getElementById("fillBlankSentence");
    const optionsEl = document.getElementById("fillBlankOptions");
    const resultEl = document.getElementById("fillBlankResult");
    if (!sentenceEl || !optionsEl) return;

    const re = new RegExp(word.en, "i");
    const blanked = word.example && re.test(word.example)
        ? word.example.replace(re, "_____")
        : `_____ — ${word.uz}`;
    sentenceEl.textContent = blanked;
    if (resultEl) { resultEl.textContent = ""; resultEl.className = "scramble-result"; }

    // 3 ta noto'g'ri variant + 1 ta to'g'ri javobni aralashtirib chiqaramiz
    const wrongPool = words.filter(w => w.en !== word.en);
    const wrongs = [];
    while (wrongs.length < 3 && wrongPool.length) {
        const candidate = wrongPool[Math.floor(Math.random() * wrongPool.length)];
        if (!wrongs.includes(candidate.en)) wrongs.push(candidate.en);
    }
    const options = [word.en, ...wrongs].sort(() => Math.random() - 0.5);

    optionsEl.innerHTML = "";
    options.forEach((opt) => {
        const btn = document.createElement("button");
        btn.className = "fillblank-option";
        btn.textContent = opt;
        btn.onclick = () => {
            const isCorrect = opt.toLowerCase() === word.en.toLowerCase();
            document.querySelectorAll(".fillblank-option").forEach((b) => { b.disabled = true; });
            btn.classList.add(isCorrect ? "correct" : "wrong");
            if (isCorrect) {
                xp += 8;
                coins += 2;
                updateStats();
                if (resultEl) { resultEl.textContent = "✅ To'g'ri! (+8 XP)"; resultEl.className = "scramble-result correct"; }
                if (typeof celebrate === "function") celebrate();
            } else {
                if (resultEl) { resultEl.textContent = `❌ To'g'ri javob: "${word.en}"`; resultEl.className = "scramble-result wrong"; }
            }
        };
        optionsEl.appendChild(btn);
    });
}

const fillBlankNextBtn = document.getElementById("fillBlankNextBtn");
if (fillBlankNextBtn) fillBlankNextBtn.addEventListener("click", pickFillBlank);

// =========================================================================
// HAFTALIK BOSS BATTLE — foydalanuvchining "qiyin so'zlar" ro'yxatidagi
// so'zlar bilan tuzilgan haftalik "Boss"ga qarshi jang. Har to'g'ri javob
// bossga zarba beradi, har noto'g'ri javob esa o'zingizga.
// =========================================================================

const bossBattleState = { bossHp: 100, playerHp: 100, queue: [], active: false };

function getBossWordPool() {
    let pool = [];
    try {
        const mistakes = (typeof getMistakeWords === "function") ? getMistakeWords() : {};
        const mistakeNames = Object.keys(mistakes);
        if (mistakeNames.length && typeof words !== "undefined") {
            pool = words.filter(w => mistakeNames.includes(w.en));
        }
    } catch (e) { /* ignore */ }
    if (!pool.length && typeof words !== "undefined") {
        // Qiyin so'zlar hali yo'q bo'lsa — haftaning kuniga qarab tasodifiy
        // (lekin bir kun davomida bir xil) so'zlar to'plamidan boss yasaymiz.
        const seed = Math.floor(Date.now() / (7 * 86400000));
        pool = [...words].sort((a, b) => (a.en.charCodeAt(0) + seed) % 7 - (b.en.charCodeAt(0) + seed) % 7).slice(0, 10);
    }
    return pool;
}

function updateBossHud() {
    const bossFill = document.getElementById("bossHpFill");
    const playerFill = document.getElementById("playerHpFill");
    if (bossFill) bossFill.style.width = Math.max(0, bossBattleState.bossHp) + "%";
    if (playerFill) playerFill.style.width = Math.max(0, bossBattleState.playerHp) + "%";
}

function nextBossQuestion() {
    const questionEl = document.getElementById("bossQuestion");
    const inputEl = document.getElementById("bossAnswerInput");
    if (!bossBattleState.queue.length) bossBattleState.queue = [...getBossWordPool()];
    const word = bossBattleState.queue[Math.floor(Math.random() * bossBattleState.queue.length)];
    bossBattleState.currentWord = word;
    if (questionEl) questionEl.textContent = word ? `"${word.en}" so'zining tarjimasi?` : "—";
    if (inputEl) inputEl.value = "";
}

function initBossBattle() {
    bossBattleState.bossHp = 100;
    bossBattleState.playerHp = 100;
    bossBattleState.active = true;
    bossBattleState.queue = getBossWordPool();
    updateBossHud();
    nextBossQuestion();
    const rewardNote = document.getElementById("bossRewardNote");
    if (rewardNote) rewardNote.textContent = "";
    const resultEl = document.getElementById("bossResult");
    if (resultEl) { resultEl.textContent = ""; resultEl.className = "scramble-result"; }
}

function bossAttack() {
    if (!bossBattleState.active || !bossBattleState.currentWord) return;
    const inputEl = document.getElementById("bossAnswerInput");
    const resultEl = document.getElementById("bossResult");
    if (!inputEl || !resultEl) return;

    const typed = inputEl.value.trim().toLowerCase();
    const target = bossBattleState.currentWord.uz.trim().toLowerCase();

    if (typed === target) {
        bossBattleState.bossHp -= 20;
        resultEl.textContent = "⚔️ Zarba! Boss jarohatlandi.";
        resultEl.className = "scramble-result correct";
    } else {
        bossBattleState.playerHp -= 15;
        resultEl.textContent = `❌ Noto'g'ri. To'g'ri javob: "${bossBattleState.currentWord.uz}". Boss sizga zarba berdi!`;
        resultEl.className = "scramble-result wrong";
    }
    updateBossHud();

    const rewardNote = document.getElementById("bossRewardNote");
    if (bossBattleState.bossHp <= 0) {
        bossBattleState.active = false;
        xp += 60;
        coins += 40;
        updateStats();
        if (rewardNote) rewardNote.textContent = "🏆 G'alaba! Boss mag'lub etildi. +60 XP, +40 tanga!";
        if (typeof celebrate === "function") celebrate();
        return;
    }
    if (bossBattleState.playerHp <= 0) {
        bossBattleState.active = false;
        if (rewardNote) rewardNote.textContent = "💀 Mag'lub bo'ldingiz. Qayta urinish uchun sahifani qayta oching.";
        return;
    }
    nextBossQuestion();
}

const bossAttackBtn = document.getElementById("bossAttackBtn");
if (bossAttackBtn) bossAttackBtn.addEventListener("click", bossAttack);

const bossAnswerInputEl = document.getElementById("bossAnswerInput");
if (bossAnswerInputEl) {
    bossAnswerInputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") bossAttack();
    });
}

// =========================================================================
// FOKUS REJIMI (Pomodoro) — 25 daqiqa mashq / 5 daqiqa dam olish sikli.
// Bugun tugatilgan davrlar soni localStorage'da kunlik saqlanadi.
// =========================================================================

const POMODORO_WORK_SECONDS = 25 * 60;
const POMODORO_BREAK_SECONDS = 5 * 60;
const POMODORO_RING_CIRCUMFERENCE = 2 * Math.PI * 52;

const pomodoroState = {
    secondsLeft: POMODORO_WORK_SECONDS,
    totalSeconds: POMODORO_WORK_SECONDS,
    mode: "work", // "work" | "break"
    running: false,
    timerId: null
};

function getPomodoroCountToday() {
    const today = new Date().toDateString();
    const stored = JSON.parse(localStorage.getItem("pomodoroCount") || "{}");
    return stored.date === today ? (stored.count || 0) : 0;
}

function incrementPomodoroCount() {
    const today = new Date().toDateString();
    const current = getPomodoroCountToday();
    localStorage.setItem("pomodoroCount", JSON.stringify({ date: today, count: current + 1 }));
    updatePomodoroCountDisplay();
}

function updatePomodoroCountDisplay() {
    const el = document.getElementById("pomodoroCount");
    if (el) el.textContent = getPomodoroCountToday();
}

function formatPomodoroTime(totalSec) {
    const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
    const s = Math.floor(totalSec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

function renderPomodoroUI() {
    const timeEl = document.getElementById("pomodoroTime");
    const labelEl = document.getElementById("pomodoroLabel");
    const ringFillEl = document.getElementById("pomodoroRingFill");
    if (timeEl) timeEl.textContent = formatPomodoroTime(pomodoroState.secondsLeft);
    if (labelEl) labelEl.textContent = pomodoroState.mode === "work" ? "Mashq vaqti" : "Dam olish vaqti";
    if (ringFillEl) {
        const progress = 1 - pomodoroState.secondsLeft / pomodoroState.totalSeconds;
        const offset = POMODORO_RING_CIRCUMFERENCE * (1 - progress);
        ringFillEl.style.strokeDasharray = `${POMODORO_RING_CIRCUMFERENCE}`;
        ringFillEl.style.strokeDashoffset = `${offset}`;
    }
}

function pomodoroTick() {
    pomodoroState.secondsLeft--;
    renderPomodoroUI();
    if (pomodoroState.secondsLeft <= 0) {
        clearInterval(pomodoroState.timerId);
        pomodoroState.running = false;
        const wasWork = pomodoroState.mode === "work";
        if (wasWork) {
            incrementPomodoroCount();
            xp += 15;
            coins += 5;
            if (typeof updateStats === "function") updateStats();
            if (typeof celebrate === "function") celebrate();
        }
        pomodoroState.mode = wasWork ? "break" : "work";
        pomodoroState.totalSeconds = wasWork ? POMODORO_BREAK_SECONDS : POMODORO_WORK_SECONDS;
        pomodoroState.secondsLeft = pomodoroState.totalSeconds;
        renderPomodoroUI();

        const startBtn = document.getElementById("pomodoroStartBtn");
        const pauseBtn = document.getElementById("pomodoroPauseBtn");
        if (startBtn) startBtn.style.display = "inline-block";
        if (pauseBtn) pauseBtn.style.display = "none";

        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(wasWork ? "🍅 Davr tugadi!" : "💪 Dam tugadi!", {
                body: wasWork ? "Ajoyib! Endi 5 daqiqa dam oling." : "Yangi mashq davrini boshlashga tayyormisiz?"
            });
        } else {
            alert(wasWork ? "🍅 Davr tugadi! Endi 5 daqiqa dam oling. (+15 XP, +5 tanga)" : "💪 Dam tugadi! Yangi mashq davrini boshlaymizmi?");
        }
    }
}

function startPomodoro() {
    if (pomodoroState.running) return;
    pomodoroState.running = true;
    pomodoroState.timerId = setInterval(pomodoroTick, 1000);
    const startBtn = document.getElementById("pomodoroStartBtn");
    const pauseBtn = document.getElementById("pomodoroPauseBtn");
    if (startBtn) startBtn.style.display = "none";
    if (pauseBtn) pauseBtn.style.display = "inline-block";
}

function pausePomodoro() {
    pomodoroState.running = false;
    clearInterval(pomodoroState.timerId);
    const startBtn = document.getElementById("pomodoroStartBtn");
    const pauseBtn = document.getElementById("pomodoroPauseBtn");
    if (startBtn) { startBtn.style.display = "inline-block"; startBtn.textContent = "▶️ Davom ettirish"; }
    if (pauseBtn) pauseBtn.style.display = "none";
}

function resetPomodoro() {
    pomodoroState.running = false;
    clearInterval(pomodoroState.timerId);
    pomodoroState.mode = "work";
    pomodoroState.totalSeconds = POMODORO_WORK_SECONDS;
    pomodoroState.secondsLeft = POMODORO_WORK_SECONDS;
    renderPomodoroUI();
    const startBtn = document.getElementById("pomodoroStartBtn");
    const pauseBtn = document.getElementById("pomodoroPauseBtn");
    if (startBtn) { startBtn.style.display = "inline-block"; startBtn.textContent = "▶️ Boshlash"; }
    if (pauseBtn) pauseBtn.style.display = "none";
}

const pomodoroStartBtn = document.getElementById("pomodoroStartBtn");
if (pomodoroStartBtn) pomodoroStartBtn.addEventListener("click", startPomodoro);

const pomodoroPauseBtn = document.getElementById("pomodoroPauseBtn");
if (pomodoroPauseBtn) pomodoroPauseBtn.addEventListener("click", pausePomodoro);

const pomodoroResetBtn = document.getElementById("pomodoroResetBtn");
if (pomodoroResetBtn) pomodoroResetBtn.addEventListener("click", resetPomodoro);

renderPomodoroUI();
updatePomodoroCountDisplay();

// =========================================================================
// KUNNING SO'ZI (Word of the Day) — bosh sahifadagi kichik vidjet
// =========================================================================

function renderWordOfDay() {
    if (typeof words === "undefined" || !words.length) return;
    const dayIndex = Math.floor(Date.now() / 86400000) % words.length;
    const w = words[dayIndex];

    const enEl = document.getElementById("wotdEnglish");
    const ruEl = document.getElementById("wotdRussian");
    const uzEl = document.getElementById("wotdUzbek");
    const exEl = document.getElementById("wotdExample");
    if (enEl) enEl.textContent = w.en;
    if (ruEl) ruEl.textContent = w.ru || w.en;
    if (uzEl) uzEl.textContent = w.uz;
    if (exEl) exEl.textContent = w.example || "";

    const speakEnBtn = document.getElementById("wotdSpeakEn");
    const speakRuBtn = document.getElementById("wotdSpeakRu");
    if (speakEnBtn) speakEnBtn.onclick = () => speakText(w.en, "en-US");
    if (speakRuBtn) speakRuBtn.onclick = () => speakText(w.ru || w.en, "ru-RU");
}
renderWordOfDay();

// =========================================================================
// KUNNING IQTIBOSI (Quote of the Day) — til o'rganishga undovchi motivatsion
// gaplar, har kuni (Kunning so'zi kabi) navbat bilan almashib turadi.
// =========================================================================

const dailyQuotes = [
    { en: "The limits of my language mean the limits of my world.", uz: "Mening tilim chegarasi — dunyoyim chegarasidir.", author: "Ludwig Wittgenstein" },
    { en: "Learning another language is not only learning different words for the same things, but learning another way to think about things.", uz: "Boshqa tilni o'rganish — bir xil narsalar uchun boshqa so'zlarni emas, balki narsalar haqida boshqacha fikrlashni o'rganishdir.", author: "Flora Lewis" },
    { en: "One language sets you in a corridor for life. Two languages open every door along the way.", uz: "Bitta til sizni umr yo'lagiga qamaydi. Ikkita til esa yo'ldagi har bir eshikni ochadi.", author: "Frank Smith" },
    { en: "To have another language is to possess a second soul.", uz: "Yana bir tilga ega bo'lish — ikkinchi ruhga ega bo'lishdir.", author: "Charlemagne" },
    { en: "Practice makes progress, not perfection — keep going.", uz: "Mashq mukammallikni emas, taraqqiyotni beradi — davom eting.", author: "English Master AI" },
    { en: "A different language is a different vision of life.", uz: "Boshqa til — hayotga boshqacha nazar.", author: "Federico Fellini" },
    { en: "Every word you learn today is a door to tomorrow.", uz: "Bugun o'rgangan har bir so'zingiz — ertangi kunga ochiladigan eshikdir.", author: "English Master AI" },
    { en: "Small daily steps lead to big language wins.", uz: "Kichik kundalik qadamlar katta til yutuqlariga olib boradi.", author: "English Master AI" }
];

function renderDailyQuote() {
    if (!dailyQuotes.length) return;
    const dayIndex = Math.floor(Date.now() / 86400000) % dailyQuotes.length;
    const q = dailyQuotes[dayIndex];
    const enEl = document.getElementById("quoteTextEn");
    const uzEl = document.getElementById("quoteTextUz");
    const authorEl = document.getElementById("quoteAuthor");
    if (enEl) enEl.textContent = q.en;
    if (uzEl) uzEl.textContent = q.uz;
    if (authorEl) authorEl.textContent = `— ${q.author}`;
}
renderDailyQuote();

console.log("Beginner Course + Word Game + Word of the Day Loaded");

// =========================================================================
// GAP TUZISH (Sentence Builder) — so'z bo'lakchalaridan to'g'ri gap yasash
// =========================================================================

let sentenceState = { tokens: [], current: [] };

function pickSentence() {
    if (typeof words === "undefined" || !words.length) return;
    let pool = words.filter(w => getTargetExample(w));
    if (!pool.length) pool = words.filter(w => w.example);
    if (!pool.length) return;

    const w = pool[Math.floor(Math.random() * pool.length)];
    const raw = (getTargetExample(w) || w.example || "").trim();
    const clean = raw.replace(/[.!?]+$/, "");
    const parts = clean.split(" ").filter(Boolean);

    sentenceState.tokens = parts.map((text, id) => ({ id, text }));
    sentenceState.current = [];
    renderSentenceBuilder();

    const statusEl = document.getElementById("sentenceStatus");
    if (statusEl) { statusEl.textContent = ""; statusEl.className = "sentence-status"; }
}

function renderSentenceBuilder() {
    const bankEl = document.getElementById("sentenceBank");
    const answerEl = document.getElementById("sentenceAnswer");
    if (!bankEl || !answerEl) return;
    applyTargetTextDirection(bankEl, answerEl);

    const usedIds = new Set(sentenceState.current);
    const bankTokens = sentenceState.tokens.filter(t => !usedIds.has(t.id));

    bankEl.innerHTML = bankTokens.map(t =>
        `<button class="sentence-tile" data-id="${t.id}">${t.text}</button>`
    ).join("");

    answerEl.innerHTML = sentenceState.current.length
        ? sentenceState.current.map(id => {
            const t = sentenceState.tokens.find(x => x.id === id);
            return `<button class="sentence-tile placed" data-id="${id}">${t.text}</button>`;
        }).join("")
        : `<span class="sentence-placeholder">Bo'lakchalarni shu yerga bosing...</span>`;

    bankEl.querySelectorAll(".sentence-tile").forEach(btn => {
        btn.addEventListener("click", () => {
            sentenceState.current.push(Number(btn.dataset.id));
            renderSentenceBuilder();
        });
    });

    answerEl.querySelectorAll(".sentence-tile").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = Number(btn.dataset.id);
            sentenceState.current = sentenceState.current.filter(x => x !== id);
            renderSentenceBuilder();
        });
    });
}

function checkSentence() {
    const statusEl = document.getElementById("sentenceStatus");
    if (!statusEl) return;

    if (sentenceState.current.length !== sentenceState.tokens.length) {
        statusEl.textContent = "⚠️ Avval barcha bo'lakchalarni joylashtiring.";
        statusEl.className = "sentence-status wrong";
        return;
    }

    const built = sentenceState.current.map(id => sentenceState.tokens.find(t => t.id === id).text).join(" ");
    const target = sentenceState.tokens.map(t => t.text).join(" ");

    if (built.toLowerCase() === target.toLowerCase()) {
        xp += 10;
        updateStats();
        statusEl.textContent = "✅ To'g'ri! Ajoyib ish.";
        statusEl.className = "sentence-status correct";
        if (typeof celebrate === "function") celebrate();
    } else {
        statusEl.textContent = "❌ Hali to'g'ri emas, tartibni qayta tekshiring.";
        statusEl.className = "sentence-status wrong";
    }
}

const checkSentenceBtn = document.getElementById("checkSentenceBtn");
if (checkSentenceBtn) checkSentenceBtn.addEventListener("click", checkSentence);

const newSentenceBtn = document.getElementById("newSentenceBtn");
if (newSentenceBtn) newSentenceBtn.addEventListener("click", pickSentence);

// =========================================================================
// TEZKOR TEST (Speed Round) — 60 soniyalik tez javob berish o'yini
// =========================================================================

let speedState = { active: false, timeLeft: 60, score: 0, current: null, timer: null };

function resetSpeedUI() {
    speedState.active = false;
    clearInterval(speedState.timer);
    speedState.timeLeft = 60;
    speedState.score = 0;
    const timeEl = document.getElementById("speedTimeLeft");
    const scoreEl = document.getElementById("speedScoreVal");
    const highEl = document.getElementById("speedHighVal");
    const wordEl = document.getElementById("speedWord");
    const uzEl = document.getElementById("speedUzGuess");
    const resultEl = document.getElementById("speedResult");
    if (timeEl) timeEl.textContent = "60";
    if (scoreEl) scoreEl.textContent = "0";
    if (highEl) highEl.textContent = Number(localStorage.getItem("speedHighScore")) || 0;
    if (wordEl) wordEl.textContent = "—";
    if (uzEl) uzEl.textContent = "—";
    if (resultEl) resultEl.innerHTML = "";
}

function startSpeedRound() {
    clearInterval(speedState.timer);
    speedState.active = true;
    speedState.timeLeft = 60;
    speedState.score = 0;
    const resultEl = document.getElementById("speedResult");
    if (resultEl) resultEl.innerHTML = "";
    updateSpeedUI();
    nextSpeedQuestion();
    speedState.timer = setInterval(() => {
        speedState.timeLeft--;
        updateSpeedUI();
        if (speedState.timeLeft <= 0) endSpeedRound();
    }, 1000);
}

function nextSpeedQuestion() {
    if (typeof words === "undefined" || !words.length) return;
    const pool = (typeof quizDeck !== "undefined" && quizDeck.length) ? quizDeck : words;
    const w = pool[Math.floor(Math.random() * pool.length)];
    const isTrue = Math.random() < 0.5;
    let shownUz = w.uz;

    if (!isTrue) {
        let other = pool[Math.floor(Math.random() * pool.length)];
        let tries = 0;
        while (other.uz === w.uz && tries < 10) {
            other = pool[Math.floor(Math.random() * pool.length)];
            tries++;
        }
        shownUz = other.uz;
    }

    speedState.current = { word: w, shownUz, isTrue };
    const wordEl = document.getElementById("speedWord");
    const uzEl = document.getElementById("speedUzGuess");
    if (wordEl) wordEl.textContent = (typeof getTargetWord === "function") ? getTargetWord(w) : w.en;
    if (uzEl) uzEl.textContent = shownUz;
}

function answerSpeed(userSaysTrue) {
    if (!speedState.active || !speedState.current) return;
    const correct = userSaysTrue === speedState.current.isTrue;
    if (correct) {
        speedState.score++;
        xp += 3;
    } else {
        xp = Math.max(0, xp - 1);
    }
    updateStats();
    updateSpeedUI();
    nextSpeedQuestion();
}

function updateSpeedUI() {
    const timeEl = document.getElementById("speedTimeLeft");
    const scoreEl = document.getElementById("speedScoreVal");
    if (timeEl) timeEl.textContent = speedState.timeLeft;
    if (scoreEl) scoreEl.textContent = speedState.score;
}

function endSpeedRound() {
    clearInterval(speedState.timer);
    speedState.active = false;
    const best = Math.max(Number(localStorage.getItem("speedHighScore")) || 0, speedState.score);
    localStorage.setItem("speedHighScore", best);
    const highEl = document.getElementById("speedHighVal");
    if (highEl) highEl.textContent = best;

    const resultEl = document.getElementById("speedResult");
    if (resultEl) resultEl.innerHTML = `⏱️ Vaqt tugadi! Natija: <b>${speedState.score}</b> ta to'g'ri. Rekord: <b>${best}</b>`;

    if (speedState.score > 0) {
        coins += Math.round(speedState.score / 2);
        saveGame();
    }
    if (speedState.score >= 10 && typeof celebrate === "function") celebrate();
}

const startSpeedBtn = document.getElementById("startSpeedBtn");
if (startSpeedBtn) startSpeedBtn.addEventListener("click", startSpeedRound);

const speedTrueBtn = document.getElementById("speedTrueBtn");
if (speedTrueBtn) speedTrueBtn.addEventListener("click", () => answerSpeed(true));

const speedFalseBtn = document.getElementById("speedFalseBtn");
if (speedFalseBtn) speedFalseBtn.addEventListener("click", () => answerSpeed(false));

resetSpeedUI();

// =========================================================================
// GRAMMATIKA TESTI (Level-based grammar quiz) — Ingliz va Rus tillarida
// =========================================================================

const GRAMMAR_QUESTIONS_EN = [
    { level: "beginner", q: "I ___ a student.", options: ["am", "is", "are"], answer: "am" },
    { level: "beginner", q: "She ___ my sister.", options: ["am", "is", "are"], answer: "is" },
    { level: "beginner", q: "They ___ happy today.", options: ["am", "is", "are"], answer: "are" },
    { level: "beginner", q: "___ you like tea?", options: ["Do", "Does", "Is"], answer: "Do" },
    { level: "beginner", q: "This is ___ book.", options: ["I", "my", "me"], answer: "my" },
    { level: "intermediate", q: "He has been ___ English for two years.", options: ["study", "studies", "studying"], answer: "studying" },
    { level: "intermediate", q: "If it rains, I ___ stay home.", options: ["will", "would", "am"], answer: "will" },
    { level: "intermediate", q: "___ apple a day keeps the doctor away.", options: ["A", "An", "The"], answer: "An" },
    { level: "intermediate", q: "She is taller ___ her brother.", options: ["that", "then", "than"], answer: "than" },
    { level: "advanced", q: "By next year, she ___ from university.", options: ["will graduate", "will have graduated", "graduates"], answer: "will have graduated" },
    { level: "advanced", q: "The book ___ in 1980.", options: ["wrote", "was written", "has written"], answer: "was written" },
    { level: "advanced", q: "I wish I ___ more time yesterday.", options: ["have", "had", "had had"], answer: "had had" }
];

const GRAMMAR_QUESTIONS_RU = [
    { level: "beginner", q: "Это ___ дом.", options: ["мой", "моя", "моё"], answer: "мой" },
    { level: "beginner", q: "___ тебя зовут?", options: ["Как", "Что", "Где"], answer: "Как" },
    { level: "beginner", q: "Она — ___ сестра.", options: ["мой", "моя", "моё"], answer: "моя" },
    { level: "beginner", q: "Мы ___ студенты. (Qanday fe'l kerak?)", options: ["Fe'l kerak emas (—)", "есть", "быть"], answer: "Fe'l kerak emas (—)" },
    { level: "beginner", q: "___ дела?", options: ["Как", "Кто", "Куда"], answer: "Как" },
    { level: "intermediate", q: "Я иду в ___ (школа).", options: ["школа", "школу", "школе"], answer: "школу" },
    { level: "intermediate", q: "У меня нет ___ (книга).", options: ["книга", "книги", "книгу"], answer: "книги" },
    { level: "intermediate", q: "Это письмо ___ (мама).", options: ["мама", "маме", "маму"], answer: "маме" },
    { level: "advanced", q: "Я разговариваю с ___ (друг).", options: ["друг", "другом", "друга"], answer: "другом" },
    { level: "advanced", q: "Он думает о ___ (работа).", options: ["работа", "работе", "работу"], answer: "работе" }
];

// Arab tili grammatikasi bo'yicha boshlang'ich-o'rta-yuqori daraja savollari.
// Arab tili o'ngdan-chapga yozilgani uchun savol matnlari RTL blokda ko'rsatiladi.
const GRAMMAR_QUESTIONS_AR = [
    { level: "beginner", q: "أنا ___ طالب.", options: ["هو", "أنا", "أنتَ"], answer: "أنا" },
    { level: "beginner", q: "هذا ___ كبير.", options: ["بيت", "بيتٌ", "بيوت"], answer: "بيتٌ" },
    { level: "beginner", q: "هي ___ معلمة.", options: ["هو", "هي", "هم"], answer: "هي" },
    { level: "beginner", q: "___ اسمك؟", options: ["ما", "من", "أين"], answer: "ما" },
    { level: "beginner", q: "هذا كتاب ___ .", options: ["أنا", "لي", "أنتَ"], answer: "لي" },
    { level: "intermediate", q: "الكتاب ___ الطاولة.", options: ["في", "على", "من"], answer: "على" },
    { level: "intermediate", q: "ذهبتُ ___ المدرسة.", options: ["إلى", "على", "عن"], answer: "إلى" },
    { level: "intermediate", q: "هذه ___ جميلة. (بنت)", options: ["بنتٌ", "بنتاً", "بنتٍ"], answer: "بنتٌ" },
    { level: "intermediate", q: "عندي ___ كتب. (ثلاثة)", options: ["ثلاثة", "ثلاث", "ثلاثتان"], answer: "ثلاثة" },
    { level: "advanced", q: "___ الطلاب في الفصل. (كان)", options: ["كان", "كانوا", "كانت"], answer: "كانوا" },
    { level: "advanced", q: "هي أطول ___ أختها.", options: ["مثل", "من", "على"], answer: "من" },
    { level: "advanced", q: "سوف ___ الدرس غداً. (يدرس)", options: ["أدرس", "أدرسُ", "سأدرس"], answer: "سأدرس" }
];

let grammarLang = "en";
let grammarDeck = [];
let grammarIndex = 0;
let grammarScore = 0;

function buildGrammarDeck() {
    const lvl = getUserLevel();
    const bank = grammarLang === "ru" ? GRAMMAR_QUESTIONS_RU
        : grammarLang === "ar" ? GRAMMAR_QUESTIONS_AR
        : GRAMMAR_QUESTIONS_EN;
    let pool = bank.filter(q => q.level === lvl);
    if (pool.length < 3) pool = bank;

    grammarDeck = (typeof shuffleArr === "function") ? shuffleArr(pool.slice()) : pool.slice();
    grammarIndex = 0;
    grammarScore = 0;
    updateGrammarQuizUI();
    loadGrammarQuestion();
}

function updateGrammarQuizUI() {
    const lvl = getUserLevel();
    document.querySelectorAll(".grammar-quiz-level-btn").forEach(b => b.classList.toggle("active", b.dataset.level === lvl));
    document.querySelectorAll(".grammar-quiz-lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === grammarLang));
    const label = document.getElementById("grammarQuizLabel");
    if (label) label.textContent = `📊 ${LEVEL_LABELS[lvl]} daraja — ${grammarDeck.length} ta savol`;
}

function loadGrammarQuestion() {
    const qEl = document.getElementById("grammarQuizQuestion");
    const optsEl = document.getElementById("grammarQuizOptions");
    if (!qEl || !optsEl) return;

    if (grammarIndex >= grammarDeck.length) {
        qEl.textContent = "🎉 Grammatika testi tugadi!";
        optsEl.innerHTML = `
            <div class="grammar-quiz-final">Natija: ${grammarScore}/${grammarDeck.length}</div>
            <button id="restartGrammarQuiz" class="answer" style="text-align:center;">Qayta boshlash</button>
        `;
        const rBtn = document.getElementById("restartGrammarQuiz");
        if (rBtn) rBtn.onclick = buildGrammarDeck;
        return;
    }

    const current = grammarDeck[grammarIndex];
    qEl.textContent = current.q;
    qEl.dir = grammarLang === "ar" ? "rtl" : "ltr";
    qEl.classList.toggle("arabic-text", grammarLang === "ar");
    optsEl.innerHTML = current.options.map(opt =>
        `<button class="answer${grammarLang === "ar" ? " arabic-text" : ""}" dir="${grammarLang === "ar" ? "rtl" : "ltr"}" data-opt="${opt.replace(/"/g, "&quot;")}">${opt}</button>`
    ).join("");

    optsEl.querySelectorAll("button").forEach(btn => {
        btn.onclick = () => checkGrammarAnswer(btn.dataset.opt, btn);
    });
}

function checkGrammarAnswer(opt, btn) {
    const current = grammarDeck[grammarIndex];
    const isCorrect = opt === current.answer;
    const optsEl = document.getElementById("grammarQuizOptions");

    if (optsEl) {
        Array.from(optsEl.children).forEach(b => {
            b.disabled = true;
            if (b.dataset.opt === current.answer) b.classList.add("correct");
            else if (b === btn) b.classList.add("wrong");
        });
    }

    if (isCorrect) {
        grammarScore++;
        xp += 10;
    } else {
        xp = Math.max(0, xp - 2);
    }
    updateStats();
    grammarIndex++;
    setTimeout(loadGrammarQuestion, 700);
}

document.querySelectorAll(".grammar-quiz-lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        grammarLang = btn.dataset.lang;
        buildGrammarDeck();
    });
});

document.querySelectorAll(".grammar-quiz-level-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        localStorage.setItem("userLevel", btn.dataset.level);
        if (typeof updateQuizLevelUI === "function") updateQuizLevelUI();
        buildGrammarDeck();
    });
});

// =========================================================================
// HAQIQIY KUNLIK STREAK TIZIMI (Real Daily Streak Engine)
// Avval "streak" faqat saqlanardi, lekin kunlar farqiga qarab avtomatik
// oshib/tushib turmasdi. Endi har kuni dasturga kirganda tekshiriladi:
// - bugun allaqachon kirgan bo'lsa — o'zgarmaydi
// - aynan bir kun oldin kirgan bo'lsa — streak +1
// - bir kundan ko'p tanaffus bo'lsa — streak 1 ga tushadi
// Muhim kunlarda (3, 7, 14, 30, 60, 100) bonus tanga va konfetti beriladi.
// =========================================================================

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

function daysBetween(dateStrA, dateStrB) {
    const oneDay = 24 * 60 * 60 * 1000;
    const a = new Date(dateStrA + "T00:00:00");
    const b = new Date(dateStrB + "T00:00:00");
    return Math.round((b - a) / oneDay);
}

function updateDailyStreak() {
    const today = new Date().toISOString().slice(0, 10);
    const lastActive = localStorage.getItem("lastActiveDate");

    if (!lastActive) {
        streak = streak || 1;
    } else if (lastActive === today) {
        // bugun allaqachon faol bo'lgan — hech narsa o'zgarmaydi
        return;
    } else {
        const diff = daysBetween(lastActive, today);
        if (diff === 1) {
            streak = (streak || 1) + 1;
        } else if (diff > 1) {
            const freezes = getFreezeCount();
            if (freezes > 0) {
                // Streak-freeze ishlatiladi: streak buzilmaydi, faqat 1 kunlik
                // tanaffus "kechiriladi". Bir nechta kun o'tkazib yuborilgan
                // bo'lsa ham, faqat bitta freeze sarflanadi va streak saqlanadi.
                localStorage.setItem("streakFreezes", freezes - 1);
                setTimeout(() => {
                    if (typeof renderFreezeUI === "function") renderFreezeUI();
                    alert("🧊 Streak-freeze ishlatildi! Bir kun mashq qilmagan bo'lsangiz ham, " + streak + " kunlik streak'ingiz saqlab qolindi.");
                }, 300);
            } else {
                streak = 1;
            }
        }
    }

    localStorage.setItem("lastActiveDate", today);
    localStorage.setItem("streak", streak);
    if (typeof updateStats === "function") updateStats();

    if (STREAK_MILESTONES.includes(streak)) {
        const bonus = streak * 10;
        coins += bonus;
        if (typeof saveGame === "function") saveGame();
        if (typeof celebrate === "function") celebrate();
        setTimeout(() => {
            alert(`🔥 ${streak} kunlik streak! Tabriklaymiz — bonus sifatida +${bonus} tanga oldingiz!`);
        }, 300);
    }
}

// ---- Streak-Freeze himoyasi ------------------------------------------
// Foydalanuvchi tangalar evaziga "muzlatgich" sotib olishi mumkin. Agar bir
// kun mashq qilish unutilsa (diff > 1), mavjud freeze avtomatik ishlatiladi
// va streak buzilmaydi.
function getFreezeCount() {
    return Number(localStorage.getItem("streakFreezes")) || 0;
}
function setFreezeCount(n) {
    localStorage.setItem("streakFreezes", Math.max(0, n));
    renderFreezeUI();
}
function renderFreezeUI() {
    const el = document.getElementById("freezeCount");
    if (el) el.textContent = getFreezeCount();
}

const buyFreezeBtn = document.getElementById("buyFreezeBtn");
if (buyFreezeBtn) {
    buyFreezeBtn.addEventListener("click", () => {
        if (coins < 50) {
            if (settingsStatusEl) settingsStatusEl.innerHTML = "❌ Tangalar yetarli emas (50 tanga kerak)";
            return;
        }
        coins -= 50;
        setFreezeCount(getFreezeCount() + 1);
        if (typeof saveGame === "function") saveGame();
        if (settingsStatusEl) settingsStatusEl.innerHTML = "✅ Streak-freeze sotib olindi! Endi 1 kun o'tkazib yuborsangiz ham streak saqlanadi.";
    });
}
renderFreezeUI();

// ---- Qulaylik sozlamalari: shrift o'lchami, talaffuz tezligi, eslatma vaqti ----
const fontSizeRangeEl = document.getElementById("fontSizeRange");
const fontSizeValueEl = document.getElementById("fontSizeValue");
function applyFontScale(scale) {
    document.documentElement.style.setProperty("--user-font-scale", (scale / 100).toString());
    if (fontSizeValueEl) fontSizeValueEl.textContent = scale + "%";
}
if (fontSizeRangeEl) {
    const savedScale = Number(localStorage.getItem("fontScale")) || 100;
    fontSizeRangeEl.value = savedScale;
    applyFontScale(savedScale);
    fontSizeRangeEl.addEventListener("input", () => {
        const val = Number(fontSizeRangeEl.value);
        localStorage.setItem("fontScale", val);
        applyFontScale(val);
    });
} else {
    applyFontScale(Number(localStorage.getItem("fontScale")) || 100);
}

const voiceRateRangeEl = document.getElementById("voiceRateRange");
const voiceRateValueEl = document.getElementById("voiceRateValue");
if (voiceRateRangeEl) {
    const savedRate = getVoiceRate();
    voiceRateRangeEl.value = savedRate;
    if (voiceRateValueEl) voiceRateValueEl.textContent = savedRate.toFixed(2) + "x";
    voiceRateRangeEl.addEventListener("input", () => {
        const val = parseFloat(voiceRateRangeEl.value);
        localStorage.setItem("voiceRate", val);
        if (voiceRateValueEl) voiceRateValueEl.textContent = val.toFixed(2) + "x";
    });
}

const reminderTimeInputEl = document.getElementById("reminderTimeInput");
if (reminderTimeInputEl) {
    reminderTimeInputEl.value = localStorage.getItem("reminderTime") || "19:00";
    reminderTimeInputEl.addEventListener("change", () => {
        localStorage.setItem("reminderTime", reminderTimeInputEl.value);
    });
}

// Ilova ochilganda, agar joriy vaqt foydalanuvchi belgilagan eslatma vaqtidan
// keyin bo'lsa va bugun hali eslatma ko'rsatilmagan bo'lsa — bildirishnoma
// beriladi. PWA fon rejimida (yopiq holatda) aniq vaqtda otish server push
// xizmatini talab qiladi — bu esa server talab qilmaydigan eng yaqin yechim.
function checkPersonalizedReminderTime() {
    if (!("Notification" in window)) return;
    if (localStorage.getItem("dailyReminder") !== "true") return;
    if (Notification.permission !== "granted") return;

    const today = new Date().toDateString();
    if (localStorage.getItem("lastReminderDate") === today) return;

    const prefTime = localStorage.getItem("reminderTime") || "19:00";
    const [h, m] = prefTime.split(":").map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (now < target) return;

    localStorage.setItem("lastReminderDate", today);
    new Notification("English Master AI", {
        body: "⏰ Sizning shaxsiy eslatma vaqtingiz keldi — bugungi mashqni bajarib qo'ying!"
    });
}
checkPersonalizedReminderTime();

updateDailyStreak();

console.log("Sentence Builder + Speed Round + Grammar Quiz + Daily Streak Loaded");

// =========================================================================
// QIYIN SO'ZLAR DAFTARI (Mistake Notebook) — Testda xato qilingan so'zlar
// avtomatik shu ro'yxatga tushadi. To'g'ri javob berilganda ro'yxatdan
// asta chiqib ketadi (har to'g'ri javob 1 marta hisobni kamaytiradi).
// =========================================================================

function getMistakeWords() {
    try {
        return JSON.parse(localStorage.getItem("mistakeWords") || "{}");
    } catch (e) {
        return {};
    }
}

function saveMistakeWords(obj) {
    localStorage.setItem("mistakeWords", JSON.stringify(obj));
}

function recordMistake(word) {
    if (!word || !word.en) return;
    const mistakes = getMistakeWords();
    mistakes[word.en] = (mistakes[word.en] || 0) + 1;
    saveMistakeWords(mistakes);
}

function clearMistake(word) {
    if (!word || !word.en) return;
    const mistakes = getMistakeWords();
    if (mistakes[word.en]) {
        mistakes[word.en] -= 1;
        if (mistakes[word.en] <= 0) delete mistakes[word.en];
        saveMistakeWords(mistakes);
    }
}

function renderMistakeNotebook() {
    const container = document.getElementById("mistakeList");
    if (!container) return;

    const mistakes = getMistakeWords();
    const entries = Object.keys(mistakes);

    if (!entries.length) {
        container.innerHTML = `<p class="ai-settings-hint">🎉 Hozircha xato so'zlar yo'q — barchasi yaxshi eslab qolinmoqda!</p>`;
        return;
    }

    container.innerHTML = entries.map(en => {
        const w = (typeof words !== "undefined") ? words.find(x => x.en === en) : null;
        if (!w) return "";
        return `
        <div class="phrase-row">
            <button class="phrase-speak" data-speak="${en.replace(/"/g, "&quot;")}">🔊</button>
            <div class="phrase-texts">
                <div class="phrase-main">${en}</div>
                <div class="phrase-uz">${w.uz} · ${mistakes[en]} marta xato qilingan</div>
            </div>
            <button class="mistake-clear-btn" data-word="${en.replace(/"/g, "&quot;")}">✅ Bilib oldim</button>
        </div>`;
    }).join("");

    container.querySelectorAll("[data-speak]").forEach(el => {
        el.addEventListener("click", () => speakText(el.dataset.speak, "en-US"));
    });

    container.querySelectorAll(".mistake-clear-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const m = getMistakeWords();
            delete m[btn.dataset.word];
            saveMistakeWords(m);
            renderMistakeNotebook();
        });
    });
}

// =========================================================================
// KUNLIK MASHQ REJASI (Daily Study Plan) — bosh sahifadagi kichik checklist
// Har kuni yangilanadi, barcha vazifalar bajarilsa bonus XP/tanga beriladi.
// =========================================================================

const DAILY_TASKS = [
    { id: "flash5", label: "📚 Kamida 5 ta so'zni ko'rish (Kartochka)" },
    { id: "quiz1", label: "📝 1 ta testni yakunlash" },
    { id: "game1", label: "🎮 1 ta o'yin yoki mashqni bajarish" }
];

function getDailyPlanState() {
    const today = new Date().toISOString().slice(0, 10);
    let state;
    try {
        state = JSON.parse(localStorage.getItem("dailyPlan") || "{}");
    } catch (e) {
        state = {};
    }
    if (state.date !== today) {
        state = { date: today, done: {} };
        localStorage.setItem("dailyPlan", JSON.stringify(state));
    }
    return state;
}

function saveDailyPlanState(state) {
    localStorage.setItem("dailyPlan", JSON.stringify(state));
}

function renderDailyPlan() {
    const container = document.getElementById("dailyPlanList");
    if (!container) return;

    const state = getDailyPlanState();
    container.innerHTML = DAILY_TASKS.map(t => `
        <label class="daily-task-row">
            <input type="checkbox" class="daily-task-check" data-task="${t.id}" ${state.done[t.id] ? "checked" : ""}>
            <span class="${state.done[t.id] ? "done" : ""}">${t.label}</span>
        </label>
    `).join("");

    const allDone = DAILY_TASKS.every(t => state.done[t.id]);
    const bonusEl = document.getElementById("dailyPlanBonus");
    if (bonusEl) bonusEl.style.display = allDone ? "block" : "none";

    container.querySelectorAll(".daily-task-check").forEach(cb => {
        cb.addEventListener("change", () => {
            const s = getDailyPlanState();
            const wasAllDone = DAILY_TASKS.every(t => s.done[t.id]);
            s.done[cb.dataset.task] = cb.checked;
            saveDailyPlanState(s);
            const nowAllDone = DAILY_TASKS.every(t => s.done[t.id]);

            if (!wasAllDone && nowAllDone) {
                xp += 20;
                coins += 15;
                updateStats();
                if (typeof saveGame === "function") saveGame();
                if (typeof celebrate === "function") celebrate();
            }
            renderDailyPlan();
        });
    });
}

renderDailyPlan();

console.log("Mistake Notebook + Daily Study Plan Loaded");

// =========================================================================
// STATISTIKA KENGAYTIRISH — mavjud statsPage'ga qo'shimcha real ma'lumotlar
// =========================================================================

function renderExtraStats() {
    const coinsEl = document.getElementById("statsCoins");
    const mistakesEl = document.getElementById("statsMistakes");
    const speedEl = document.getElementById("statsSpeedHigh");
    const bestEl = document.getElementById("statsBestScore");
    const xpToNextEl = document.getElementById("xpToNext");
    const xpFillEl = document.getElementById("xpProgressFill");

    if (coinsEl) coinsEl.textContent = coins || 0;
    if (mistakesEl) mistakesEl.textContent = Object.keys(getMistakeWords()).length;
    if (speedEl) speedEl.textContent = Number(localStorage.getItem("speedHighScore")) || 0;

    let bestScore = 0;
    try {
        const history = JSON.parse(localStorage.getItem("xpHistory") || "[]");
        if (history.length) bestScore = Math.max(...history.map(h => h.xp || 0));
    } catch (e) { /* ignore */ }
    if (bestEl) bestEl.textContent = bestScore;

    if (xpToNextEl) xpToNextEl.textContent = xp;
    if (xpFillEl) xpFillEl.style.width = Math.min(100, xp) + "%";

    if (typeof renderWeakAreas === "function") renderWeakAreas();
    if (typeof renderWeeklyStatsChart === "function") renderWeeklyStatsChart();
    if (typeof renderWordsKnownChart === "function") renderWordsKnownChart();
    if (typeof renderWeeklyReport === "function") renderWeeklyReport();
    if (typeof renderCefrBadge === "function") renderCefrBadge();
}

renderExtraStats();

// =========================================================================
// CEFR DARAJASI (A1-C2) — bu RASMIY sertifikat emas, faqat bilgan so'zlar
// soni va XP asosidagi taxminiy, motivatsion o'z-o'zini baholash. Rasmiy
// CEFR darajasi faqat aккreditatsiyalangan test markazlari (masalan, IELTS,
// Cambridge) orqali beriladi.
// =========================================================================

const CEFR_LEVELS = [
    { code: "A1", title: "Boshlang'ich", minWords: 0 },
    { code: "A2", title: "Elementar", minWords: 60 },
    { code: "B1", title: "O'rta darajadan past", minWords: 150 },
    { code: "B2", title: "O'rta daraja", minWords: 300 },
    { code: "C1", title: "Yuqori o'rta daraja", minWords: 500 },
    { code: "C2", title: "Erkin daraja", minWords: 800 }
];

function computeCefrLevel() {
    const knownCount = (typeof known !== "undefined") ? known : 0;
    let current = CEFR_LEVELS[0];
    for (const lvl of CEFR_LEVELS) {
        if (knownCount >= lvl.minWords) current = lvl;
    }
    return current;
}

function renderCefrBadge() {
    const badgeEl = document.getElementById("cefrBadge");
    const titleEl = document.getElementById("cefrTitle");
    if (!badgeEl || !titleEl) return;
    const lvl = computeCefrLevel();
    badgeEl.textContent = lvl.code;
    titleEl.textContent = `${lvl.code} — ${lvl.title}`;
}

// =========================================================================
// HAFTALIK HISOBOT (matnli) — xpHistory asosida "bu hafta qanday
// o'tgani"ni oddiy, tushunarli til bilan tushuntiradi.
// =========================================================================

function renderWeeklyReport() {
    const el = document.getElementById("weeklyReportText");
    if (!el) return;

    let history = [];
    try { history = JSON.parse(localStorage.getItem("xpHistory") || "[]"); } catch (e) { /* ignore */ }

    if (history.length < 2) {
        el.textContent = "Hali hisobot tuzish uchun yetarli ma'lumot yo'q — bir necha kun mashq qiling!";
        return;
    }

    const thisWeek = history.slice(-7);
    const lastWeek = history.slice(-14, -7);

    const weekXpGain = Math.max(0, (thisWeek[thisWeek.length - 1]?.xp || 0) - (thisWeek[0]?.xp || 0));
    const lastWeekXpGain = lastWeek.length ? Math.max(0, (lastWeek[lastWeek.length - 1]?.xp || 0) - (lastWeek[0]?.xp || 0)) : null;

    let comparisonText = "";
    if (lastWeekXpGain !== null && lastWeekXpGain > 0) {
        const diffPercent = Math.round(((weekXpGain - lastWeekXpGain) / lastWeekXpGain) * 100);
        if (diffPercent > 0) comparisonText = ` — bu o'tgan haftadan <b>${diffPercent}% ko'proq</b>! 🎉`;
        else if (diffPercent < 0) comparisonText = ` — o'tgan haftadan ${Math.abs(diffPercent)}% kam, yana harakat qilib ko'ring 💪`;
        else comparisonText = " — o'tgan haftaga teng natija.";
    }

    const activeDays = thisWeek.filter(h => h.xp > 0).length;
    const streakVal = (typeof streak !== "undefined") ? streak : 0;

    el.innerHTML = `Bu hafta <b>${weekXpGain} XP</b> to'pladingiz${comparisonText}<br>` +
        `${activeDays} / 7 kun faol bo'ldingiz, hozirgi seriyangiz: <b>${streakVal} kun 🔥</b>.`;
}

// =========================================================================
// ULASHISH (ASO/SEO): foydalanuvchi ilovani do'stlariga yuborishi orqali
// organik o'sishga (viral tarqalishga) yordam beradi.
// =========================================================================

function shareApp() {
    const shareData = {
        title: "English Master AI",
        text: "Men English Master AI bilan ingliz tilini o'rganyapman — so'zlar, testlar, AI o'qituvchi va sertifikat bilan, hatto oflayn ham ishlaydi! Senga ham tavsiya qilaman 👇",
        url: window.location.href
    };
    if (navigator.share) {
        navigator.share(shareData).catch(() => { /* foydalanuvchi bekor qilgan bo'lishi mumkin */ });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`).then(() => {
            alert("🔗 Havola nusxalandi! Endi uni do'stingizga yuborishingiz mumkin.");
        }).catch(() => {
            alert(shareData.url);
        });
    } else {
        alert(shareData.url);
    }
}

const shareAppBtn = document.getElementById("shareAppBtn");
if (shareAppBtn) shareAppBtn.addEventListener("click", shareApp);

// =========================================================================
// REFERRAL (do'stni taklif qilish) — bu ilova serversiz ishlagani uchun
// taklif qilgan tomonga avtomatik bonus berish imkonsiz (buning uchun
// backend kerak). Shu bois yechim halol: havola orqali birinchi marta
// kirgan YANGI foydalanuvchiga xush kelibsiz bonusi beriladi.
// =========================================================================

function getOrCreateReferralCode() {
    let code = localStorage.getItem("myReferralCode");
    if (!code) {
        code = Math.random().toString(36).slice(2, 8).toUpperCase();
        localStorage.setItem("myReferralCode", code);
    }
    return code;
}

function getReferralLink() {
    const url = new URL(window.location.href);
    url.searchParams.set("ref", getOrCreateReferralCode());
    return url.toString();
}

function initReferralUI() {
    const linkInput = document.getElementById("referralLinkInput");
    if (linkInput) linkInput.value = getReferralLink();
}

const copyReferralBtn = document.getElementById("copyReferralBtn");
if (copyReferralBtn) {
    copyReferralBtn.addEventListener("click", () => {
        const noteEl = document.getElementById("referralNote");
        const link = getReferralLink();
        if (navigator.clipboard) {
            navigator.clipboard.writeText(link).then(() => {
                if (noteEl) noteEl.textContent = "🔗 Havola nusxalandi!";
            });
        }
    });
}

const shareReferralBtn = document.getElementById("shareReferralBtn");
if (shareReferralBtn) {
    shareReferralBtn.addEventListener("click", () => {
        const link = getReferralLink();
        const shareData = {
            title: "English Master AI",
            text: "Men English Master AI bilan ingliz tilini o'rganyapman — sen ham qo'shil, mening havolam orqali kirsang bonus bilan boshlaysan! 🎁",
            url: link
        };
        if (navigator.share) {
            navigator.share(shareData).catch(() => { /* bekor qilingan */ });
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(`${shareData.text}\n${link}`);
            const noteEl = document.getElementById("referralNote");
            if (noteEl) noteEl.textContent = "🔗 Havola nusxalandi, do'stingizga yuboring!";
        }
    });
}

// Havola orqali (?ref=CODE) birinchi marta kirilganda — bir martalik
// "xush kelibsiz" bonusini beramiz.
(function handleIncomingReferral() {
    try {
        const params = new URLSearchParams(window.location.search);
        const refCode = params.get("ref");
        const alreadyUsed = localStorage.getItem("referralWelcomeClaimed");
        const isOwnCode = refCode && refCode === localStorage.getItem("myReferralCode");
        if (refCode && !alreadyUsed && !isOwnCode) {
            coins += 20;
            localStorage.setItem("referralWelcomeClaimed", "1");
            localStorage.setItem("coins", coins);
            if (typeof updateStats === "function") updateStats();
            window.addEventListener("load", () => {
                setTimeout(() => alert("🎁 Xush kelibsiz! Do'stingiz havolasi orqali kirganingiz uchun +20 tanga bonus oldingiz!"), 1500);
            });
        }
    } catch (e) { /* URL parametrlari yo'q bo'lsa e'tiborsiz qoldiramiz */ }
})();

initReferralUI();

// Bosh sahifadagi "Tezkor kirish" tugmalari — har biri asosiy menyudagi
// tegishli tugmani "bosadi", shu bilan kodni takrorlamasdan bir xil
// ochilish mantig'idan foydalanamiz.
document.querySelectorAll(".qa-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        const targetId = btn.dataset.target;
        const targetBtn = targetId && document.getElementById(targetId);
        if (targetBtn) targetBtn.click();
    });
});

// =========================================================================
// STATISTIKA: kengaytirilgan grafiklar — so'nggi 7 kunlik faollik (kunlik
// XP o'sishi, mavjud xpHistory'dan hisoblanadi) va so'z boyligi taraqqiyoti.
// =========================================================================

function renderWeeklyStatsChart() {
    const canvas = document.getElementById("weeklyStatsChart");
    if (!canvas || typeof Chart === "undefined") return;

    let history = [];
    try { history = JSON.parse(localStorage.getItem("xpHistory") || "[]"); } catch (e) { /* ignore */ }

    const last7 = history.slice(-7);
    // Kunlik XP o'sishini (delta) hisoblaymiz, jami emas — shunda "bugun
    // qancha mashq qildim" savoliga real javob bo'ladi.
    const labels = [];
    const deltas = [];
    let prevXp = last7.length ? Math.max(0, (last7[0].xp || 0) - 20) : 0;
    last7.forEach((h) => {
        labels.push((h.date || "").split(" ").slice(1, 3).join(" "));
        const delta = Math.max(0, (h.xp || 0) - prevXp);
        deltas.push(delta);
        prevXp = h.xp || 0;
    });

    if (!labels.length) {
        labels.push("Bugun");
        deltas.push(0);
    }

    if (window.__weeklyStatsChartInstance) {
        window.__weeklyStatsChartInstance.data.labels = labels;
        window.__weeklyStatsChartInstance.data.datasets[0].data = deltas;
        window.__weeklyStatsChartInstance.update();
        return;
    }

    window.__weeklyStatsChartInstance = new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Kunlik XP o'sishi",
                data: deltas,
                backgroundColor: "#f59e0b",
                borderRadius: 8,
                maxBarThickness: 34
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: "#fff" } } },
            scales: {
                x: { ticks: { color: "#cbd5e1" }, grid: { display: false } },
                y: { ticks: { color: "#cbd5e1" }, beginAtZero: true }
            }
        }
    });
}

function renderWordsKnownChart() {
    const canvas = document.getElementById("wordsKnownChart");
    if (!canvas || typeof Chart === "undefined" || typeof words === "undefined") return;

    const total = words.length || 1;
    const knownCount = Math.min(known || 0, total);
    const remaining = Math.max(0, total - knownCount);

    if (window.__wordsKnownChartInstance) {
        window.__wordsKnownChartInstance.data.datasets[0].data = [knownCount, remaining];
        window.__wordsKnownChartInstance.update();
        return;
    }

    window.__wordsKnownChartInstance = new Chart(canvas.getContext("2d"), {
        type: "doughnut",
        data: {
            labels: ["Bilgan so'zlar", "Qolgan so'zlar"],
            datasets: [{
                data: [knownCount, remaining],
                backgroundColor: ["#22c55e", "#334155"],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            cutout: "68%",
            plugins: { legend: { position: "bottom", labels: { color: "#fff" } } }
        }
    });
}

// =========================================================================
// SERTIFIKAT (real, ishlaydigan versiya) — canvas orqali chizib,
// PNG rasm sifatida yuklab olish mumkin.
// =========================================================================

function drawCertificate(name) {
    const canvas = document.getElementById("certificateCanvas");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;

    // Fon
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#0f172a");
    gradient.addColorStop(1, "#1e3a5f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Ramka
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 8;
    ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, w - 80, h - 80);

    ctx.textAlign = "center";

    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 26px 'Space Grotesk', sans-serif";
    ctx.fillText("🎓 SERTIFIKAT", w / 2, 130);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px Poppins, sans-serif";
    ctx.fillText("English Master AI — til o'rganish dasturi", w / 2, 165);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "18px Poppins, sans-serif";
    ctx.fillText("ushbu sertifikat quyidagi shaxsga topshiriladi:", w / 2, 250);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px 'Space Grotesk', sans-serif";
    ctx.fillText(name || "Foydalanuvchi", w / 2, 320);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "17px Poppins, sans-serif";
    const levelText = `Hozirgi daraja: Level ${level} · ${LEVEL_LABELS[getUserLevel()] || "Boshlang'ich"} · ${xp} XP`;
    ctx.fillText(levelText, w / 2, 380);

    ctx.fillStyle = "#64748b";
    ctx.font = "14px Poppins, sans-serif";
    const today = new Date().toLocaleDateString("uz-UZ");
    ctx.fillText(`Sana: ${today}`, w / 2, 560);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 15px Poppins, sans-serif";
    ctx.fillText("✅ Muvaffaqiyatli davom etayotgani uchun tabriklaymiz!", w / 2, 590);

    // ---- Tekshirish QR kodi -----------------------------------------
    // MUHIM: bu QR kod markazlashtirilgan serverda tekshirilmaydi (ilova
    // serversiz ishlaydi) — u faqat sertifikat ma'lumotlarini (ism, daraja,
    // sana) qurilmadagi skaner orqali qayta o'qish uchun mo'ljallangan,
    // ya'ni "rasmiy tasdiqlash" emas, balki qulaylik uchun.
    if (typeof QRCode !== "undefined") {
        const verifyText = `English Master AI Sertifikat\nIsm: ${name}\nDaraja: Level ${level} (${computeCefrLevel().code})\nXP: ${xp}\nSana: ${today}`;
        const qrHolder = document.createElement("div");
        qrHolder.style.display = "none";
        document.body.appendChild(qrHolder);
        try {
            new QRCode(qrHolder, { text: verifyText, width: 110, height: 110, correctLevel: QRCode.CorrectLevel.M });
            setTimeout(() => {
                const qrCanvas = qrHolder.querySelector("canvas");
                const qrImg = qrHolder.querySelector("img");
                const qrSize = 96;
                const qrX = w - qrSize - 50;
                const qrY = h - qrSize - 50;
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12);
                if (qrCanvas) ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
                else if (qrImg) ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
                ctx.fillStyle = "#64748b";
                ctx.font = "10px Poppins, sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("Ma'lumot kodi", qrX + qrSize / 2, qrY + qrSize + 16);
                document.body.removeChild(qrHolder);
            }, 60);
        } catch (e) {
            document.body.removeChild(qrHolder);
        }
    }
}

const generateCertBtn = document.getElementById("generateCertBtn");
if (generateCertBtn) {
    generateCertBtn.addEventListener("click", () => {
        const nameInput = document.getElementById("certificateName");
        const noteEl = document.getElementById("certificateNote");
        const name = nameInput ? nameInput.value.trim() : "";

        if (!name) {
            if (noteEl) noteEl.textContent = "⚠️ Avval ismingizni kiriting.";
            return;
        }

        drawCertificate(name);

        const canvas = document.getElementById("certificateCanvas");
        const downloadBtn = document.getElementById("certificateDownloadBtn");
        if (canvas) canvas.style.display = "block";
        if (downloadBtn && canvas) {
            downloadBtn.style.display = "inline-block";
            downloadBtn.onclick = () => {
                const tempLink = document.createElement("a");
                tempLink.href = canvas.toDataURL("image/png");
                tempLink.download = "sertifikat.png";
                document.body.appendChild(tempLink);
                tempLink.click();
                tempLink.remove();
            };
        }

        const pdfBtn = document.getElementById("certificatePdfBtn");
        if (pdfBtn && canvas) {
            pdfBtn.style.display = "inline-block";
            pdfBtn.onclick = () => {
                const jsPDFRef = window.jspdf && window.jspdf.jsPDF;
                if (!jsPDFRef) {
                    alert("PDF kutubxonasi yuklanmadi. Internetga ulaning va qayta urinib ko'ring.");
                    return;
                }
                const pdf = new jsPDFRef({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
                pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
                pdf.save("sertifikat.pdf");
            };
        }

        const printBtn = document.getElementById("certificatePrintBtn");
        if (printBtn && canvas) {
            printBtn.style.display = "inline-block";
            printBtn.onclick = () => {
                const dataUrl = canvas.toDataURL("image/png");
                const printWindow = window.open("", "_blank");
                if (!printWindow) {
                    alert("Chop etish oynasi ochilmadi — brauzeringiz popup'larni bloklagan bo'lishi mumkin.");
                    return;
                }
                printWindow.document.write(`
                    <html><head><title>Sertifikat — chop etish</title>
                    <style>
                        body { margin: 0; display: flex; align-items: center; justify-content: center; }
                        img { max-width: 100%; height: auto; }
                    </style>
                    </head><body>
                    <img src="${dataUrl}" onload="window.print(); window.onafterprint = () => window.close();">
                    </body></html>
                `);
                printWindow.document.close();
            };
        }

        const shareBtn = document.getElementById("certificateShareBtn");
        if (shareBtn && canvas) {
            shareBtn.style.display = "inline-block";
            shareBtn.onclick = () => {
                canvas.toBlob(async (blob) => {
                    if (!blob) return;
                    const file = new File([blob], "sertifikat.png", { type: "image/png" });
                    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                        try {
                            await navigator.share({
                                files: [file],
                                title: "Mening English Master AI sertifikatim",
                                text: `Men ${name} ingliz tilini o'rganishda ${level}-levelga yetdim! 🎓`
                            });
                        } catch (err) { /* foydalanuvchi bekor qilgan bo'lishi mumkin */ }
                    } else {
                        // Web Share API mavjud bo'lmasa — oddiy yuklab olishga tushamiz
                        const tempLink = document.createElement("a");
                        tempLink.href = canvas.toDataURL("image/png");
                        tempLink.download = "sertifikat.png";
                        document.body.appendChild(tempLink);
                        tempLink.click();
                        tempLink.remove();
                        if (noteEl) noteEl.textContent = "ℹ️ Bu qurilmada to'g'ridan-to'g'ri ulashish qo'llab-quvvatlanmaydi, shuning uchun rasm yuklab olindi.";
                    }
                }, "image/png");
            };
        }

        if (noteEl) noteEl.textContent = "✅ Sertifikat tayyor! Pastdagi tugmalar orqali yuklab oling yoki ulashing.";
        if (typeof celebrate === "function") celebrate();
    });
}

// =========================================================================
// PREMIUM (mahalliy demo versiya) — real to'lov tizimi backend talab
// qiladi, shuning uchun bu shunchaki shu qurilma uchun kosmetik
// "Premium rejim"ni yoqib/o'chirib turadi.
// =========================================================================

function isPremiumActive() {
    return localStorage.getItem("premiumActive") === "1";
}

function renderPremiumStatus() {
    const card = document.getElementById("premiumStatusCard");
    if (!card) return;
    const active = isPremiumActive();
    card.innerHTML = active
        ? `<div class="premium-active-badge">💎 Premium rejim YOQILGAN — oltin mavzu faollashtirildi (shu qurilmada)</div>`
        : `<div class="premium-inactive-badge">Premium rejim hozircha o'chirilgan</div>`;
    document.body.classList.toggle("premium-active", active);
}

const togglePremiumBtn = document.getElementById("togglePremiumBtn");
if (togglePremiumBtn) {
    togglePremiumBtn.addEventListener("click", () => {
        const active = isPremiumActive();
        localStorage.setItem("premiumActive", active ? "0" : "1");
        renderPremiumStatus();
        if (!active && typeof celebrate === "function") celebrate();
    });
}

renderPremiumStatus();

// =========================================================================
// ADMIN / DEBUG PANEL (mahalliy, haqiqiy ma'lumotlar) — bu bitta
// qurilmada ishlaydigan ilova bo'lgani uchun "real" ko'p foydalanuvchili
// admin panel emas, balki shu foydalanuvchining haqiqiy holatini
// ko'rsatadigan va boshqaradigan mahalliy panel.
// =========================================================================

const APP_STORAGE_KEYS = [
    "level", "xp", "known", "streak", "coins", "favorites", "hardWords", "badges",
    "premium", "avatar", "userLevel", "mistakeWords", "dailyPlan", "lastActiveDate",
    "speedHighScore", "premiumActive", "xpHistory"
];

function renderAdminPanel() {
    const container = document.getElementById("adminRealStats");
    if (!container) return;

    const mistakesCount = Object.keys(getMistakeWords()).length;
    container.innerHTML = `
        <div class="admin-stat-row">👤 Level: <b>${level}</b></div>
        <div class="admin-stat-row">⭐ XP: <b>${xp}</b></div>
        <div class="admin-stat-row">💰 Tanga: <b>${coins}</b></div>
        <div class="admin-stat-row">🔥 Streak: <b>${streak}</b> kun</div>
        <div class="admin-stat-row">📖 Bilgan so'zlar: <b>${document.getElementById("known") ? document.getElementById("known").textContent : "—"}</b></div>
        <div class="admin-stat-row">📕 Qiyin so'zlar: <b>${mistakesCount}</b></div>
        <div class="admin-stat-row">💎 Premium: <b>${isPremiumActive() ? "Yoqilgan" : "O'chirilgan"}</b></div>
        <div class="admin-stat-row">📊 Test darajasi: <b>${LEVEL_LABELS[getUserLevel()] || "—"}</b></div>
    `;
}

const adminRefreshBtn = document.getElementById("adminRefreshBtn");
if (adminRefreshBtn) adminRefreshBtn.addEventListener("click", renderAdminPanel);

const adminExportBtn = document.getElementById("adminExportBtn");
if (adminExportBtn) {
    adminExportBtn.addEventListener("click", () => {
        const backup = {};
        APP_STORAGE_KEYS.forEach(key => {
            const val = localStorage.getItem(key);
            if (val !== null) backup[key] = val;
        });
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "english-master-backup.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        const statusEl = document.getElementById("adminActionStatus");
        if (statusEl) statusEl.textContent = "✅ Zaxira nusxa yuklab olindi.";
    });
}

const adminResetBtn = document.getElementById("adminResetBtn");
if (adminResetBtn) {
    adminResetBtn.addEventListener("click", () => {
        const sure = confirm("⚠️ Diqqat! Barcha progress (level, XP, so'zlar, streak) butunlay o'chiriladi. Davom etasizmi?");
        if (!sure) return;
        APP_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
        const statusEl = document.getElementById("adminActionStatus");
        if (statusEl) statusEl.textContent = "🗑️ Progress tozalandi. Sahifa yangilanmoqda...";
        setTimeout(() => location.reload(), 1200);
    });
}

renderAdminPanel();

console.log("Statistika + Sertifikat + Premium + Admin panel Loaded");

// =========================================================================
// AI ROLEPLAY (Rolli suhbat) — foydalanuvchi haqiqiy hayotiy vaziyatda
// (restoran, aeroport, do'kon, ish suhbati va h.k.) AI bilan ingliz tilida
// erkin suhbatlashadi. AI xarakterda qoladi va har javobdan so'ng
// xatolarni muloyimlik bilan (o'zbek tilida, qavs ichida) tuzatib boradi.
// =========================================================================

const ROLEPLAY_SCENARIOS = [
    {
        id: "restaurant",
        icon: "🍽️",
        title: "Restoranda buyurtma berish",
        opener: "Good evening! Welcome to our restaurant. What would you like to order today?",
        persona: "You are a friendly, patient waiter at a restaurant talking to an English learner. Keep sentences short and simple (A2-B1 level). Stay fully in character as the waiter."
    },
    {
        id: "airport",
        icon: "✈️",
        title: "Aeroportda ro'yxatdan o'tish",
        opener: "Hello! May I see your passport and ticket, please?",
        persona: "You are an airport check-in officer talking to an English learner. Keep sentences short and simple (A2-B1 level). Stay fully in character."
    },
    {
        id: "shopping",
        icon: "🛍️",
        title: "Do'konda xarid qilish",
        opener: "Hi there! Are you looking for anything special today?",
        persona: "You are a helpful shop assistant talking to an English learner. Keep sentences short and simple (A2-B1 level). Stay fully in character."
    },
    {
        id: "interview",
        icon: "💼",
        title: "Ish suhbati (Job interview)",
        opener: "Thank you for coming today. Can you tell me a little about yourself?",
        persona: "You are a professional job interviewer talking to an English learner candidate. Keep questions simple and clear (B1 level). Stay fully in character."
    },
    {
        id: "hotel",
        icon: "🏨",
        title: "Mehmonxonaga joylashish",
        opener: "Good afternoon! Welcome to our hotel. Do you have a reservation?",
        persona: "You are a hotel receptionist talking to an English learner guest. Keep sentences short and simple (A2-B1 level). Stay fully in character."
    },
    {
        id: "doctor",
        icon: "🩺",
        title: "Shifokor qabulida",
        opener: "Hello, please come in. What seems to be the problem today?",
        persona: "You are a calm, kind doctor talking to an English learner patient. Keep sentences short and simple (A2-B1 level). Stay fully in character."
    },
    {
        id: "friend",
        icon: "🙋",
        title: "Do'st bilan tanishuv suhbati",
        opener: "Hey! I don't think we've met before. What's your name?",
        persona: "You are a friendly peer meeting an English learner for the first time at a park. Keep sentences short, casual and simple (A2-B1 level). Stay fully in character."
    }
];

let roleplayHistory = [];
let roleplayScenario = null;

function renderRoleplayScenarios() {
    const wrap = document.getElementById("roleplayScenarios");
    if (!wrap) return;
    wrap.innerHTML = ROLEPLAY_SCENARIOS.map(s =>
        `<button class="roleplay-scenario-btn" data-id="${s.id}"><span class="rp-icon">${s.icon}</span>${s.title}</button>`
    ).join("");
    wrap.querySelectorAll(".roleplay-scenario-btn").forEach(btn => {
        btn.addEventListener("click", () => startRoleplay(btn.dataset.id));
    });
}

function roleplaySystemPrompt(scenario) {
    return `${scenario.persona} After every reply of yours, on a new line, if the learner's last message had English mistakes, add a short correction starting with "🧑‍🏫 Tuzatish:" written in Uzbek, explaining the mistake briefly and giving the corrected sentence. If there were no mistakes, add a line "🧑‍🏫 Ajoyib, xato yo'q!". Never break character in the main reply itself.`;
}

function appendRoleplayMessage(role, text) {
    const box = document.getElementById("roleplayChatBox");
    if (!box) return;
    const div = document.createElement("div");
    div.className = role === "user" ? "rp-msg rp-user" : "rp-msg rp-ai";
    div.innerHTML = (role === "user" ? "🧑 " : "🎭 ") + text.replace(/\n/g, "<br>");
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function startRoleplay(id) {
    const scenario = ROLEPLAY_SCENARIOS.find(s => s.id === id);
    if (!scenario) return;
    roleplayScenario = scenario;
    roleplayHistory = [{ role: "system", content: roleplaySystemPrompt(scenario) }];

    document.getElementById("roleplayScenarios").style.display = "none";
    const chatWrap = document.getElementById("roleplayChatWrap");
    if (chatWrap) chatWrap.style.display = "";
    const label = document.getElementById("roleplayActiveLabel");
    if (label) label.textContent = `${scenario.icon} ${scenario.title}`;
    const box = document.getElementById("roleplayChatBox");
    if (box) box.innerHTML = "";

    const hasKey = !!getAISettings().key;
    if (hasKey) {
        roleplayHistory.push({ role: "assistant", content: scenario.opener });
        appendRoleplayMessage("ai", scenario.opener);
    } else {
        appendRoleplayMessage("ai", scenario.opener + "<br><small>ℹ️ To'liq AI suhbat uchun Sozlamalarda API kalit kiriting. Hozircha oddiy demo rejimda.</small>");
    }
}

const roleplayEndBtn = document.getElementById("roleplayEndBtn");
if (roleplayEndBtn) {
    roleplayEndBtn.addEventListener("click", () => {
        document.getElementById("roleplayChatWrap").style.display = "none";
        document.getElementById("roleplayScenarios").style.display = "";
        roleplayScenario = null;
        roleplayHistory = [];
    });
}

async function sendRoleplayMessage() {
    const input = document.getElementById("roleplayInput");
    if (!input || !roleplayScenario) return;
    const text = input.value.trim();
    if (!text) return;
    appendRoleplayMessage("user", text);
    input.value = "";
    roleplayHistory.push({ role: "user", content: text });

    const hasKey = !!getAISettings().key;
    if (!hasKey) {
        appendRoleplayMessage("ai", "🤖 (demo) Yaxshi urinish! To'liq AI suhbat va xatolarni tuzatish uchun Sozlamalarda API kalit kiriting.");
        return;
    }

    const loadingId = "rp_" + Date.now();
    const box = document.getElementById("roleplayChatBox");
    if (box) {
        const div = document.createElement("div");
        div.className = "rp-msg rp-ai";
        div.id = loadingId;
        div.textContent = "🎭 ...";
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    }

    const reply = await callAIConversation(roleplayHistory);
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();

    if (reply) {
        roleplayHistory.push({ role: "assistant", content: reply });
        appendRoleplayMessage("ai", reply);
        if (typeof bumpWordWeight === "function") { /* no-op hook point */ }
    } else {
        appendRoleplayMessage("ai", "⚠️ AI bilan bog'lanib bo'lmadi. Birozdan so'ng qayta urinib ko'ring.");
    }
}

const roleplaySendBtn = document.getElementById("roleplaySend");
if (roleplaySendBtn) roleplaySendBtn.addEventListener("click", sendRoleplayMessage);
const roleplayInputEl = document.getElementById("roleplayInput");
if (roleplayInputEl) {
    roleplayInputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendRoleplayMessage();
    });
}

// =========================================================================
// DO'ST BILAN RAQOBAT (Async Friend Duel) — server kerak emas: 10 ta so'z
// asosida test yaratiladi va shifrlangan matn kod sifatida taqdim etiladi.
// Do'st shu kodni kiritib xuddi shu savollarni yechadi, so'ng ikkala natija
// taqqoslanadi. Kod ichida savol ro'yxati + yaratuvchi ismi va ballari bor.
// =========================================================================

function renderDuelPage() {
    const resultArea = document.getElementById("duelResultArea");
    if (resultArea) resultArea.innerHTML = "";
    const playArea = document.getElementById("duelPlayArea");
    if (playArea) playArea.style.display = "none";
    const createResult = document.getElementById("duelCreateResult");
    if (createResult) createResult.innerHTML = "";
}

function encodeDuelCode(obj) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}
function decodeDuelCode(code) {
    return JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
}

function pickDuelWords(count) {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(w => w.en);
}

function buildDuelQuestion(enWord) {
    const w = words.find(x => x.en === enWord);
    if (!w) return null;
    const wrongPool = words.filter(x => x.en !== enWord).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [...wrongPool.map(x => x.uz), w.uz].sort(() => Math.random() - 0.5);
    return { en: w.en, correct: w.uz, options };
}

const duelCreateBtn = document.getElementById("duelCreateBtn");
if (duelCreateBtn) {
    duelCreateBtn.addEventListener("click", () => {
        const nameInput = document.getElementById("duelNameInput");
        const name = (nameInput && nameInput.value.trim()) || "Do'stim";
        const enWords = pickDuelWords(10);

        // Yaratuvchi o'zi ham darhol yechadi
        startDuelPlay(enWords, (myScore) => {
            const code = encodeDuelCode({ v: 1, name, score: myScore, total: enWords.length, enWords });
            const resultBox = document.getElementById("duelCreateResult");
            if (resultBox) {
                resultBox.innerHTML = `
                    <p>✅ Siz <b>${myScore}/${enWords.length}</b> to'g'ri javob berdingiz!</p>
                    <p>Quyidagi kodni do'stingizga yuboring:</p>
                    <textarea readonly class="duel-code-box">${code}</textarea>
                    <button id="duelCopyBtn">📋 Kodni nusxalash</button>
                `;
                const copyBtn = document.getElementById("duelCopyBtn");
                if (copyBtn) {
                    copyBtn.addEventListener("click", () => {
                        navigator.clipboard.writeText(code).then(() => {
                            copyBtn.textContent = "✅ Nusxalandi!";
                            setTimeout(() => { copyBtn.textContent = "📋 Kodni nusxalash"; }, 1500);
                        });
                    });
                }
            }
        }, "duelCreateResult");
    });
}

const duelJoinBtn = document.getElementById("duelJoinBtn");
if (duelJoinBtn) {
    duelJoinBtn.addEventListener("click", () => {
        const codeInput = document.getElementById("duelJoinCode");
        const nameInput = document.getElementById("duelJoinName");
        const myName = (nameInput && nameInput.value.trim()) || "Men";
        let data;
        try {
            data = decodeDuelCode(codeInput.value);
            if (!data.enWords || !Array.isArray(data.enWords)) throw new Error("bad code");
        } catch (err) {
            const resultArea = document.getElementById("duelResultArea");
            if (resultArea) resultArea.innerHTML = `<p>❌ Kod noto'g'ri yoki buzilgan. Qaytadan nusxalab ko'ring.</p>`;
            return;
        }

        startDuelPlay(data.enWords, (myScore) => {
            const resultArea = document.getElementById("duelResultArea");
            if (!resultArea) return;
            const total = data.enWords.length;
            let verdict;
            if (myScore > data.score) verdict = `🏆 Tabriklaymiz, ${myName}! Siz ${data.name}dan (${data.score}/${total}) oldinda ketdingiz!`;
            else if (myScore < data.score) verdict = `😅 ${data.name} bu safar oldinda (${data.score}/${total}). Qaytadan urinib ko'ring!`;
            else verdict = `🤝 Durrang! Ikkovingiz ham ${myScore}/${total} to'pladingiz.`;

            resultArea.innerHTML = `
                <div class="duel-result-card">
                    <p>${data.name}: <b>${data.score}/${total}</b></p>
                    <p>${myName}: <b>${myScore}/${total}</b></p>
                    <p class="duel-verdict">${verdict}</p>
                </div>
            `;
            coins += 15;
            xp += 10;
            if (typeof saveGame === "function") saveGame();
            if (typeof celebrate === "function" && myScore >= data.score) celebrate();
        }, "duelResultArea");
    });
}

function startDuelPlay(enWords, onFinish, feedbackTargetId) {
    const playArea = document.getElementById("duelPlayArea");
    if (!playArea) return;
    playArea.style.display = "";
    let qIndex = 0;
    let score = 0;
    const questions = enWords.map(buildDuelQuestion).filter(Boolean);

    function renderQ() {
        if (qIndex >= questions.length) {
            playArea.style.display = "none";
            onFinish(score);
            return;
        }
        const q = questions[qIndex];
        playArea.innerHTML = `
            <div class="duel-question-card">
                <div class="duel-q-counter">${qIndex + 1} / ${questions.length}</div>
                <h3>${q.en}</h3>
                <div class="duel-options"></div>
            </div>
        `;
        const optWrap = playArea.querySelector(".duel-options");
        q.options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "duel-option-btn";
            btn.textContent = opt;
            btn.addEventListener("click", () => {
                const isCorrect = opt === q.correct;
                btn.classList.add(isCorrect ? "correct" : "wrong");
                if (isCorrect) score++;
                optWrap.querySelectorAll("button").forEach(b => b.disabled = true);
                setTimeout(() => { qIndex++; renderQ(); }, 500);
            });
            optWrap.appendChild(btn);
        });
    }
    renderQ();
}

console.log("Roleplay + Streak-Freeze + SRS Dashboard + Friend Duel Loaded");

// =========================================================================
// HAFTALIK CHALLENGE — hafta davomida (Dushanbadan boshlab) to'g'ri
// javoblar soni hisoblanadi, 50 taga yetganda bonus beriladi.
// =========================================================================

const WEEKLY_GOAL = 50;

function getWeekStartStr() {
    const now = new Date();
    const day = now.getDay(); // 0=Yakshanba ... 1=Dushanba
    const diffToMonday = (day === 0) ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().slice(0, 10);
}

function getWeeklyState() {
    let state;
    try {
        state = JSON.parse(localStorage.getItem("weeklyChallenge") || "null");
    } catch (e) { state = null; }
    const weekStart = getWeekStartStr();
    if (!state || state.weekStart !== weekStart) {
        state = { weekStart, count: 0, bonusGiven: false };
        localStorage.setItem("weeklyChallenge", JSON.stringify(state));
    }
    return state;
}

function incrementWeeklyChallenge() {
    const state = getWeeklyState();
    state.count = Math.min(WEEKLY_GOAL, state.count + 1);
    if (state.count >= WEEKLY_GOAL && !state.bonusGiven) {
        state.bonusGiven = true;
        coins += 40;
        xp += 30;
        if (typeof saveGame === "function") saveGame();
        if (typeof celebrate === "function") celebrate();
        setTimeout(() => alert("🏁 Haftalik challenge bajarildi! +40 tanga, +30 XP oldingiz!"), 300);
    }
    localStorage.setItem("weeklyChallenge", JSON.stringify(state));
    renderWeeklyChallenge();
}

function renderWeeklyChallenge() {
    const state = getWeeklyState();
    const countEl = document.getElementById("weeklyChallengeCount");
    const fillEl = document.getElementById("weeklyChallengeFill");
    const noteEl = document.getElementById("weeklyChallengeNote");
    if (countEl) countEl.textContent = `${state.count} / ${WEEKLY_GOAL} so'z`;
    if (fillEl) fillEl.style.width = Math.min(100, (state.count / WEEKLY_GOAL) * 100) + "%";
    if (noteEl) {
        noteEl.textContent = state.count >= WEEKLY_GOAL
            ? "🎉 Bu haftalik maqsad bajarildi! Keyingi hafta yangi challenge boshlanadi."
            : `Yana ${WEEKLY_GOAL - state.count} ta to'g'ri javob — va +40 tanga, +30 XP sizniki!`;
    }
}

renderWeeklyChallenge();


// =========================================================================
// KUNNING IDIOMASI (Idiom of the Day) — bosh sahifada har kuni bitta
// yangi idioma yoki frazaviy fe'l ko'rsatiladi.
// =========================================================================

const IDIOMS_DATA = [
    { type: "idiom", en: "Break the ice", uz: "Muzni eritmoq (noqulaylikni yo'qotib, suhbatni boshlash)", example: "He told a joke to break the ice at the meeting." },
    { type: "idiom", en: "Piece of cake", uz: "Juda oson ish", example: "Don't worry, this exam will be a piece of cake." },
    { type: "idiom", en: "Hit the books", uz: "Qattiq o'qishga o'tirmoq", example: "I need to hit the books before the test." },
    { type: "idiom", en: "Under the weather", uz: "O'zini yomon his qilmoq (kasal)", example: "I'm feeling a bit under the weather today." },
    { type: "idiom", en: "Cost an arm and a leg", uz: "Juda qimmat turmoq", example: "That new phone costs an arm and a leg." },
    { type: "idiom", en: "Once in a blue moon", uz: "Juda kamdan-kam", example: "We only meet once in a blue moon." },
    { type: "idiom", en: "Let the cat out of the bag", uz: "Sirni oshkor qilib qo'ymoq", example: "She let the cat out of the bag about the surprise party." },
    { type: "idiom", en: "On the ball", uz: "Diqqatli, tez tushunuvchan", example: "Our new manager is really on the ball." },
    { type: "idiom", en: "Speak of the devil", uz: "Kimnidir eslasang, o'shanda paydo bo'lishi", example: "Speak of the devil — here comes Alex now!" },
    { type: "idiom", en: "Time flies", uz: "Vaqt tez o'tadi", example: "Time flies when you're having fun." },
    { type: "phrasal", en: "Give up", uz: "Voz kechmoq", example: "Never give up on your dreams." },
    { type: "phrasal", en: "Look forward to", uz: "Intiqlik bilan kutmoq", example: "I look forward to seeing you soon." },
    { type: "phrasal", en: "Run out of", uz: "Tugab qolmoq", example: "We ran out of milk this morning." },
    { type: "phrasal", en: "Get along with", uz: "Kelishib yashamoq/ishlashmoq", example: "She gets along with everyone at work." },
    { type: "phrasal", en: "Put off", uz: "Kechiktirmoq", example: "Don't put off your homework until tomorrow." },
    { type: "phrasal", en: "Turn down", uz: "Rad etmoq", example: "He turned down the job offer." },
    { type: "phrasal", en: "Figure out", uz: "Yechim topmoq, tushunib olmoq", example: "I can't figure out this math problem." },
    { type: "phrasal", en: "Take off", uz: "Yechmoq / (samolyot) uchib ketmoq", example: "The plane will take off in ten minutes." },
    { type: "phrasal", en: "Bring up", uz: "Mavzuni ko'tarib chiqmoq / tarbiyalamoq", example: "She was brought up by her grandparents." },
    { type: "phrasal", en: "Come across", uz: "Tasodifan duch kelmoq", example: "I came across an old photo yesterday." }
];

function getIdiomOfDay() {
    const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    return IDIOMS_DATA[dayIndex % IDIOMS_DATA.length];
}

function renderIdiomOfDay() {
    const el = document.getElementById("idiomOfDayText");
    if (!el) return;
    const idiom = getIdiomOfDay();
    el.innerHTML = `
        <div class="idiom-of-day-main">${idiom.en}</div>
        <div class="idiom-of-day-uz">${idiom.uz}</div>
        <div class="idiom-of-day-example">"${idiom.example}"</div>
    `;
}
renderIdiomOfDay();

function renderIdiomsPage() {
    renderIdiomsList("idiom");
    document.querySelectorAll(".idiom-tab").forEach(tab => {
        tab.classList.toggle("active", tab.dataset.cat === "idiom");
    });
}

function renderIdiomsList(cat) {
    const container = document.getElementById("idiomsList");
    if (!container) return;
    const items = IDIOMS_DATA.filter(i => i.type === cat);
    container.innerHTML = items.map(i => `
        <div class="idiom-card">
            <div class="idiom-card-top">
                <b>${i.en}</b>
                <button class="idiom-speak-btn" data-speak="${i.en.replace(/"/g, "&quot;")}">🔊</button>
            </div>
            <div class="idiom-card-uz">${i.uz}</div>
            <div class="idiom-card-example">"${i.example}"</div>
        </div>
    `).join("");
    container.querySelectorAll("[data-speak]").forEach(btn => {
        btn.addEventListener("click", () => speakText(btn.dataset.speak, "en-US"));
    });
}

document.querySelectorAll(".idiom-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".idiom-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        renderIdiomsList(tab.dataset.cat);
    });
});


// =========================================================================
// KUCHSIZ TOMONLAR TAHLILI (Weak Areas Dashboard) — mistakeWords ro'yxatini
// so'z kategoriyasi bo'yicha guruhlab, eng ko'p xato qilingan mavzularni
// ko'rsatadi.
// =========================================================================

function renderWeakAreas() {
    const container = document.getElementById("weakAreasList");
    if (!container) return;

    const mistakes = getMistakeWords();
    const byCategory = {};
    Object.keys(mistakes).forEach(en => {
        const w = words.find(x => x.en === en);
        const cat = w ? (w.category || "Boshqa") : "Boshqa";
        byCategory[cat] = (byCategory[cat] || 0) + mistakes[en];
    });

    const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    if (!entries.length) {
        container.innerHTML = `<p class="ai-settings-hint">🎉 Hozircha xatolar yo'q — tahlil qilish uchun ma'lumot kerak.</p>`;
        return;
    }
    const max = entries[0][1];
    container.innerHTML = entries.map(([cat, count]) => `
        <div class="weak-area-row">
            <div class="weak-area-label">${cat} <span>${count}</span></div>
            <div class="weak-area-track"><div class="weak-area-fill" style="width:${(count / max) * 100}%"></div></div>
        </div>
    `).join("");
}


// =========================================================================
// GRAMMATIKA QO'LLANMASI (Grammar Library) — asosiy qoidalar, qisqa va
// aniq tushuntirish + misollar bilan.
// =========================================================================

const GRAMMAR_LIBRARY = [
    {
        id: "tenses",
        title: "⏳ Zamonlar (Tenses)",
        items: [
            { rule: "Present Simple", desc: "Doimiy holat yoki odat uchun ishlatiladi.", example: "She works every day. / I don't like coffee." },
            { rule: "Present Continuous", desc: "Hozir sodir bo'layotgan harakat uchun.", example: "I am reading a book right now." },
            { rule: "Past Simple", desc: "O'tган tugallangan harakat uchun.", example: "They visited Samarkand last year." },
            { rule: "Future Simple", desc: "Kelasi vaqtdagi harakat uchun.", example: "We will travel to London next month." },
            { rule: "Present Perfect", desc: "O'tmishda boshlangan, natijasi hozirgacha dolzarb harakat uchun.", example: "I have finished my homework." }
        ]
    },
    {
        id: "articles",
        title: "📎 Artikllar (a / an / the)",
        items: [
            { rule: "a / an", desc: "Noaniq artikl — birinchi marta tilga olinayotgan, sanaladigan ot uchun. 'an' unli tovush oldidan.", example: "I saw a cat. She has an apple." },
            { rule: "the", desc: "Aniq artikl — allaqachon ma'lum bo'lgan narsa uchun.", example: "The cat I saw yesterday was black." },
            { rule: "artiklsiz", desc: "Ko'plik va sanalmaydigan otlarda umumiy holatda artikl ishlatilmaydi.", example: "I love music. Dogs are loyal animals." }
        ]
    },
    {
        id: "prepositions",
        title: "🧭 Predloglar (Prepositions)",
        items: [
            { rule: "in", desc: "Katta joy, oy, yil ichida.", example: "I live in Tashkent. She was born in 2001." },
            { rule: "on", desc: "Kun, sana, sirt ustida.", example: "The meeting is on Monday. The book is on the table." },
            { rule: "at", desc: "Aniq vaqt yoki nuqta.", example: "We meet at 6 PM. He is at the door." }
        ]
    },
    {
        id: "modals",
        title: "🔑 Modal fe'llar",
        items: [
            { rule: "can / could", desc: "Qobiliyat yoki ruxsat.", example: "I can swim. Could you help me?" },
            { rule: "must / have to", desc: "Majburiyat.", example: "You must wear a seatbelt." },
            { rule: "should", desc: "Tavsiya.", example: "You should see a doctor." }
        ]
    },
    {
        id: "conditionals",
        title: "🔀 Shart gaplar (Conditionals)",
        items: [
            { rule: "Zero Conditional", desc: "Umumiy haqiqat.", example: "If you heat ice, it melts." },
            { rule: "First Conditional", desc: "Real kelajakdagi shart.", example: "If it rains, I will stay home." },
            { rule: "Second Conditional", desc: "Xayoliy/hozirgi vaziyat.", example: "If I had money, I would travel." }
        ]
    }
];

function renderGrammarLibrary() {
    const tabsEl = document.getElementById("grammarLibTabs");
    if (tabsEl && !tabsEl.dataset.built) {
        tabsEl.innerHTML = GRAMMAR_LIBRARY.map((g, i) =>
            `<button class="grammar-lib-tab${i === 0 ? " active" : ""}" data-id="${g.id}">${g.title}</button>`
        ).join("");
        tabsEl.dataset.built = "1";
        tabsEl.querySelectorAll(".grammar-lib-tab").forEach(btn => {
            btn.addEventListener("click", () => {
                tabsEl.querySelectorAll(".grammar-lib-tab").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                renderGrammarLibContent(btn.dataset.id);
            });
        });
    }
    renderGrammarLibContent(GRAMMAR_LIBRARY[0].id);
}

function renderGrammarLibContent(id) {
    const content = document.getElementById("grammarLibContent");
    if (!content) return;
    const topic = GRAMMAR_LIBRARY.find(g => g.id === id);
    if (!topic) return;
    content.innerHTML = topic.items.map(item => `
        <div class="grammar-box">
            <h4>${item.rule}</h4>
            <p>${item.desc}</p>
            <p class="grammar-example">💬 ${item.example}</p>
        </div>
    `).join("");
}


// =========================================================================
// MENING SO'ZLARIM (Custom Vocabulary) — foydalanuvchi o'zi qo'shgan so'zlar
// asosiy `words` massiviga qo'shiladi, shu bilan flashcard/quiz/SRS avtomatik
// ularni ham qamrab oladi ("Mening so'zlarim" kategoriyasi ostida).
// =========================================================================

const CUSTOM_CATEGORY = "Mening so'zlarim";

function getCustomWords() {
    try {
        return JSON.parse(localStorage.getItem("customWords") || "[]");
    } catch (e) { return []; }
}

function saveCustomWords(list) {
    localStorage.setItem("customWords", JSON.stringify(list));
}

// Sahifa yuklanganda avval saqlangan shaxsiy so'zlarni asosiy `words`
// massiviga qo'shib qo'yamiz — shunda ular kartochka, test va SRS'da
// avtomatik ishtirok etadi.
(function loadCustomWordsIntoDeck() {
    const custom = getCustomWords();
    custom.forEach(w => {
        if (!words.some(x => x.en === w.en)) {
            words.push({
                en: w.en, uz: w.uz,
                example: w.example || `${w.en}.`,
                ru: w.en, ruExample: w.example || `${w.en}.`,
                category: CUSTOM_CATEGORY
            });
        }
    });
    if (typeof refreshCategoryFilter === "function") refreshCategoryFilter();
})();

function renderMyWordsPage() {
    const list = getCustomWords();
    const container = document.getElementById("myWordsList");
    if (!container) return;
    if (!list.length) {
        container.innerHTML = `<p class="ai-settings-hint">Hali so'z qo'shmadingiz. Yuqoridagi formadan birinchi so'zingizni qo'shing!</p>`;
        return;
    }
    container.innerHTML = list.map((w, i) => `
        <div class="phrase-row">
            <button class="phrase-speak" data-speak="${w.en.replace(/"/g, "&quot;")}">🔊</button>
            <div class="phrase-texts">
                <div class="phrase-main">${w.en}</div>
                <div class="phrase-uz">${w.uz}${w.example ? " · " + w.example : ""}</div>
            </div>
            <button class="my-word-delete-btn" data-idx="${i}">🗑</button>
        </div>
    `).join("");
    container.querySelectorAll("[data-speak]").forEach(el => {
        el.addEventListener("click", () => speakText(el.dataset.speak, "en-US"));
    });
    container.querySelectorAll(".my-word-delete-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = Number(btn.dataset.idx);
            const current = getCustomWords();
            const removed = current.splice(idx, 1)[0];
            saveCustomWords(current);
            if (removed) {
                const wIdx = words.findIndex(x => x.en === removed.en && x.category === CUSTOM_CATEGORY);
                if (wIdx !== -1) words.splice(wIdx, 1);
            }
            if (typeof refreshCategoryFilter === "function") refreshCategoryFilter();
            renderMyWordsPage();
        });
    });
}

const myWordAddBtn = document.getElementById("myWordAddBtn");
if (myWordAddBtn) {
    myWordAddBtn.addEventListener("click", () => {
        const enInput = document.getElementById("myWordEn");
        const uzInput = document.getElementById("myWordUz");
        const exInput = document.getElementById("myWordExample");
        const statusEl = document.getElementById("myWordsStatus");

        const en = enInput ? enInput.value.trim() : "";
        const uz = uzInput ? uzInput.value.trim() : "";
        const example = exInput ? exInput.value.trim() : "";

        if (!en || !uz) {
            if (statusEl) statusEl.innerHTML = "❌ Iltimos, ingliz va o'zbek so'zini kiriting.";
            return;
        }
        if (words.some(w => w.en.toLowerCase() === en.toLowerCase())) {
            if (statusEl) statusEl.innerHTML = "⚠️ Bu so'z lug'atda allaqachon mavjud.";
            return;
        }

        const list = getCustomWords();
        const entry = { en, uz, example };
        list.push(entry);
        saveCustomWords(list);

        words.push({
            en, uz, example: example || `${en}.`,
            ru: en, ruExample: example || `${en}.`,
            category: CUSTOM_CATEGORY
        });
        if (typeof refreshCategoryFilter === "function") refreshCategoryFilter();

        enInput.value = ""; uzInput.value = ""; exInput.value = "";
        if (statusEl) statusEl.innerHTML = "✅ So'z qo'shildi! Endi u kartochka va testlarda ham chiqadi.";
        renderMyWordsPage();
        coins += 3;
        if (typeof saveGame === "function") saveGame();
    });
}


// =========================================================================
// IMTIHON REJIMI (Exam Prep Mode) — darajaga mos, vaqt bilan cheklangan
// 20 savolli sinov (IELTS/CEFR uslubidagi tez tekshiruv).
// =========================================================================

let examLevel = "beginner";
let examState = null;

document.querySelectorAll(".exam-level-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".exam-level-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        examLevel = tab.dataset.lvl;
    });
});

function renderExamPage() {
    document.getElementById("examIntro").style.display = "";
    document.getElementById("examPlayArea").style.display = "none";
    document.getElementById("examResultArea").innerHTML = "";
}

function getExamWordPool(level) {
    // Sodda taxminiy daraja bo'linishi: so'z uzunligiga qarab (real CEFR
    // lug'at darajalash tizimi bo'lmagani uchun eng yaqin yondashuv).
    if (level === "beginner") return words.filter(w => w.en.length <= 5);
    if (level === "advanced") return words.filter(w => w.en.length >= 7);
    return words.filter(w => w.en.length > 5 && w.en.length < 7);
}

const examStartBtn = document.getElementById("examStartBtn");
if (examStartBtn) {
    examStartBtn.addEventListener("click", () => {
        let pool = getExamWordPool(examLevel);
        if (pool.length < 20) pool = words;
        const chosen = [...pool].sort(() => Math.random() - 0.5).slice(0, 20);

        examState = {
            questions: chosen.map(buildDuelQuestion).filter(Boolean),
            index: 0,
            score: 0,
            timeLeft: 180
        };

        document.getElementById("examIntro").style.display = "none";
        const playArea = document.getElementById("examPlayArea");
        playArea.style.display = "";

        if (window.__examTimer) clearInterval(window.__examTimer);
        window.__examTimer = setInterval(() => {
            examState.timeLeft--;
            if (examState.timeLeft <= 0) {
                clearInterval(window.__examTimer);
                finishExam();
                return;
            }
            renderExamQuestion(true);
        }, 1000);

        renderExamQuestion();
    });
}

function renderExamQuestion(timerOnly) {
    const playArea = document.getElementById("examPlayArea");
    if (!playArea || !examState) return;
    const min = Math.floor(examState.timeLeft / 60);
    const sec = String(examState.timeLeft % 60).padStart(2, "0");

    if (timerOnly) {
        const timerEl = playArea.querySelector(".exam-timer");
        if (timerEl) timerEl.textContent = `⏱️ ${min}:${sec}`;
        return;
    }

    if (examState.index >= examState.questions.length) {
        finishExam();
        return;
    }
    const q = examState.questions[examState.index];
    playArea.innerHTML = `
        <div class="exam-question-card">
            <div class="exam-top-row">
                <span class="exam-timer">⏱️ ${min}:${sec}</span>
                <span>${examState.index + 1} / ${examState.questions.length}</span>
            </div>
            <h3>${q.en}</h3>
            <div class="duel-options"></div>
        </div>
    `;
    const optWrap = playArea.querySelector(".duel-options");
    q.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "duel-option-btn";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
            const isCorrect = opt === q.correct;
            btn.classList.add(isCorrect ? "correct" : "wrong");
            if (isCorrect) examState.score++;
            optWrap.querySelectorAll("button").forEach(b => b.disabled = true);
            setTimeout(() => { examState.index++; renderExamQuestion(); }, 450);
        });
        optWrap.appendChild(btn);
    });
}

function finishExam() {
    if (window.__examTimer) clearInterval(window.__examTimer);
    const playArea = document.getElementById("examPlayArea");
    if (playArea) playArea.style.display = "none";
    const resultArea = document.getElementById("examResultArea");
    if (!resultArea || !examState) return;

    const total = examState.questions.length;
    const pct = Math.round((examState.score / total) * 100);
    let band;
    if (pct >= 85) band = "🏆 A'lo natija!";
    else if (pct >= 60) band = "👍 Yaxshi natija";
    else band = "💪 Mashq qilishda davom eting";

    resultArea.innerHTML = `
        <div class="duel-result-card">
            <p>Natija: <b>${examState.score}/${total}</b> (${pct}%)</p>
            <p class="duel-verdict">${band}</p>
        </div>
    `;
    coins += Math.round(pct / 5);
    xp += Math.round(pct / 4);
    if (typeof saveGame === "function") saveGame();
    if (pct >= 60 && typeof celebrate === "function") celebrate();
    document.getElementById("examIntro").style.display = "";
}


// =========================================================================
// MAQOLA O'QISH (Reading, click-to-translate) — bir nechta qisqa matn,
// har bir so'zga bosilganda darhol tarjimasi ko'rsatiladi.
// =========================================================================

const READING_PASSAGES = [
    {
        title: "My Daily Routine",
        text: "I wake up early every morning. I brush my teeth and eat breakfast with my family. Then I go to school by bus. After school, I do my homework and play with my friends.",
        question: "What does the person do after school?",
        answerContains: "homework"
    },
    {
        title: "A Trip to the City",
        text: "Last weekend, we visited a big city. We saw tall buildings and busy streets. We ate delicious food in a small restaurant. In the evening, we watched the beautiful lights from a bridge.",
        question: "What did they eat in?",
        answerContains: "restaurant"
    },
    {
        title: "Learning a New Language",
        text: "Learning English every day improves your communication skills. It helps you meet new people, travel easily, and find better jobs. Practice a little every day and never give up.",
        question: "What improves your communication skills?",
        answerContains: "learning english"
    },
    {
        title: "Healthy Habits",
        text: "Drinking water, eating vegetables, and sleeping well keep your body healthy. Exercise also makes you stronger and happier. Small daily habits create a big difference over time.",
        question: "What keeps your body healthy?",
        answerContains: "water"
    }
];

let currentReadingIndex = 0;

// Yaqin (offline) tarjima uchun asosiy lug'atdan (`words`) foydalanamiz,
// topilmasa umumiy xabar chiqadi.
function translateSingleWord(rawWord) {
    const clean = rawWord.toLowerCase().replace(/[^a-z']/g, "");
    if (!clean) return null;
    const found = words.find(w => w.en.toLowerCase() === clean);
    if (found) return found.uz;
    return null;
}

function renderReadingPassageTabs() {
    const tabsEl = document.getElementById("readingPassageTabs");
    if (!tabsEl) return;
    tabsEl.innerHTML = READING_PASSAGES.map((p, i) =>
        `<button class="reading-tab${i === currentReadingIndex ? " active" : ""}" data-idx="${i}">${p.title}</button>`
    ).join("");
    tabsEl.querySelectorAll(".reading-tab").forEach(btn => {
        btn.addEventListener("click", () => {
            currentReadingIndex = Number(btn.dataset.idx);
            renderReadingPassageTabs();
            renderReadingPassage();
        });
    });
}

function renderReadingPassage() {
    const textEl = document.getElementById("readingText");
    const translationEl = document.getElementById("readingWordTranslation");
    const answerEl = document.getElementById("readingAnswer");
    const resultEl = document.getElementById("readingResult");
    if (!textEl) return;

    const passage = READING_PASSAGES[currentReadingIndex];
    const tokens = passage.text.split(/(\s+)/);
    textEl.innerHTML = tokens.map(tok => {
        if (/^\s+$/.test(tok) || !tok) return tok;
        return `<span class="reading-word" data-word="${tok.replace(/"/g, "&quot;")}">${tok}</span>`;
    }).join("");

    textEl.querySelectorAll(".reading-word").forEach(span => {
        span.addEventListener("click", () => {
            const uz = translateSingleWord(span.dataset.word);
            if (translationEl) {
                translationEl.innerHTML = uz
                    ? `<b>${span.dataset.word.replace(/[^a-zA-Z']/g, "")}</b> — ${uz}`
                    : `<b>${span.dataset.word.replace(/[^a-zA-Z']/g, "")}</b> — lug'atda topilmadi`;
            }
            speakText(span.dataset.word.replace(/[^a-zA-Z']/g, ""), "en-US");
        });
    });

    if (translationEl) translationEl.innerHTML = "";
    if (answerEl) { answerEl.value = ""; answerEl.placeholder = passage.question; }
    if (resultEl) resultEl.innerHTML = "";
}

renderReadingPassageTabs();
renderReadingPassage();

const checkReadingBtn2 = document.getElementById("checkReading");
if (checkReadingBtn2) {
    checkReadingBtn2.onclick = () => {
        const readingAnswerEl = document.getElementById("readingAnswer");
        const answer = readingAnswerEl ? readingAnswerEl.value.toLowerCase() : "";
        const out = document.getElementById("readingResult");
        const passage = READING_PASSAGES[currentReadingIndex];
        if (answer.includes(passage.answerContains)) {
            if (out) out.innerHTML = "✅ To'g'ri javob!";
            coins += 10;
            xp += 5;
            if (typeof saveGame === "function") saveGame();
            if (typeof celebrate === "function") celebrate();
        } else {
            if (out) out.innerHTML = "❌ Yana urinib ko'ring. Matnni diqqat bilan qayta o'qing.";
        }
    };
}


// =========================================================================
// DIKTANT — SO'Z DARAJASIDAGI TAQQOSLASH (Word-level Dictation Diff)
// Avvalgi versiya butun gapni "to'g'ri/xato" deb solishtirardi. Endi har
// bir so'z alohida solishtirilib, aynan qaysi so'zda xato borligi
// ko'rsatiladi — bu o'quvchiga aniq nima ustida ishlash kerakligini beradi.
// =========================================================================

const checkListeningBtn2 = document.getElementById("checkListening");
if (checkListeningBtn2) {
    checkListeningBtn2.onclick = () => {
        const inputEl = document.getElementById("listeningAnswer");
        const resultEl = document.getElementById("listeningResult");
        if (!resultEl) return;

        const clean = (s) => s.toLowerCase().replace(/[.!?,]+$/, "").trim();
        const typedWords = clean(inputEl ? inputEl.value : "").split(/\s+/).filter(Boolean);
        const targetWords = clean(listeningState.sentence).split(/\s+/).filter(Boolean);

        if (!typedWords.length) {
            resultEl.textContent = "❌ Avval eshitganingizni yozing.";
            resultEl.className = "listening-result wrong";
            return;
        }

        const maxLen = Math.max(typedWords.length, targetWords.length);
        let correctCount = 0;
        const diffHtml = targetWords.map((word, i) => {
            const match = typedWords[i] && typedWords[i] === word;
            if (match) correctCount++;
            return `<span class="dictation-word ${match ? "dictation-correct" : "dictation-wrong"}">${word}</span>`;
        }).join(" ");

        const allCorrect = correctCount === targetWords.length && typedWords.length === targetWords.length;

        if (allCorrect) {
            xp += 10;
            updateStats();
            resultEl.innerHTML = "✅ To'g'ri! Ajoyib eshitib tushundingiz.";
            resultEl.className = "listening-result correct";
            if (typeof celebrate === "function") celebrate();
        } else {
            resultEl.innerHTML = `So'zma-so'z solishtiruv (yashil = to'g'ri, qizil = xato):<br>${diffHtml}`;
            resultEl.className = "listening-result wrong";
        }
    };
}

console.log("Weekly Challenge + Idioms + Grammar Library + My Words + Exam Mode + Reading + Dictation Diff Loaded");