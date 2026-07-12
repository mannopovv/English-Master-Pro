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
            new Notification("English Master Pro", { body: "Bugungi so'zlaringizni o'rganishni unutmang! 📚" });
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
    new Notification("English Master Pro", {
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
<title>English Master Pro — Hisobot</title>
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
  <h1>📊 English Master Pro — Progress hisoboti</h1>
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
    "speedBtn": "speedPage",
    "sentenceBtn": "sentencePage",
    "grammarQuizBtn": "grammarQuizPage",
    "mistakeBtn": "mistakePage"
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
    
    { en: "Family", uz: "Oila", example: "I love my family.", ru: "Семья", ruExample: "Я люблю свою семью.", category: "Oila" },
    { en: "Mother", uz: "Ona", example: "My mother is a doctor.", ru: "Мать", ruExample: "Моя мать врач.", category: "Oila" },
    { en: "Father", uz: "Ota", example: "My father works hard.", ru: "Отец", ruExample: "Мой отец много работает.", category: "Oila" },
    { en: "Sister", uz: "Opa/Singil", example: "My sister is younger.", ru: "Сестра", ruExample: "Моя сестра младше меня.", category: "Oila" },
    { en: "Brother", uz: "Aka/Uka", example: "My brother is tall.", ru: "Брат", ruExample: "Мой брат высокий.", category: "Oila" },
    { en: "Grandmother", uz: "Buvi", example: "My grandmother cooks well.", ru: "Бабушка", ruExample: "Моя бабушка хорошо готовит.", category: "Oila" },
    { en: "Grandfather", uz: "Bobo", example: "My grandfather tells stories.", ru: "Дедушка", ruExample: "Мой дедушка рассказывает истории.", category: "Oila" },
    { en: "Son", uz: "O'g'il", example: "Their son is smart.", ru: "Сын", ruExample: "Их сын умный.", category: "Oila" },
    { en: "Daughter", uz: "Qiz", example: "Her daughter sings well.", ru: "Дочь", ruExample: "Её дочь хорошо поёт.", category: "Oila" },
    { en: "Wife", uz: "Xotin", example: "His wife is a teacher.", ru: "Жена", ruExample: "Его жена учительница.", category: "Oila" },
    { en: "Husband", uz: "Er", example: "Her husband is an engineer.", ru: "Муж", ruExample: "Её муж инженер.", category: "Oila" },
    { en: "Friend", uz: "Do'st", example: "He is my best friend.", ru: "Друг", ruExample: "Он мой лучший друг.", category: "Oila" },
    
    { en: "Apple", uz: "Olma", example: "I eat an apple.", ru: "Яблоко", ruExample: "Я ем яблоко.", category: "Ovqat" },
    { en: "Bread", uz: "Non", example: "We buy fresh bread.", ru: "Хлеб", ruExample: "Мы покупаем свежий хлеб.", category: "Ovqat" },
    { en: "Water", uz: "Suv", example: "Drink water every day.", ru: "Вода", ruExample: "Пей воду каждый день.", category: "Ovqat" },
    { en: "Milk", uz: "Sut", example: "Children drink milk.", ru: "Молоко", ruExample: "Дети пьют молоко.", category: "Ovqat" },
    { en: "Rice", uz: "Guruch", example: "We cook rice for dinner.", ru: "Рис", ruExample: "Мы готовим рис на ужин.", category: "Ovqat" },
    { en: "Meat", uz: "Go'sht", example: "He doesn't eat meat.", ru: "Мясо", ruExample: "Он не ест мясо.", category: "Ovqat" },
    { en: "Egg", uz: "Tuxum", example: "I eat an egg for breakfast.", ru: "Яйцо", ruExample: "Я ем яйцо на завтрак.", category: "Ovqat" },
    { en: "Tea", uz: "Choy", example: "We drink tea every morning.", ru: "Чай", ruExample: "Мы пьём чай каждое утро.", category: "Ovqat" },
    { en: "Coffee", uz: "Qahva", example: "She likes strong coffee.", ru: "Кофе", ruExample: "Она любит крепкий кофе.", category: "Ovqat" },
    { en: "Sugar", uz: "Shakar", example: "Add sugar to the tea.", ru: "Сахар", ruExample: "Добавь сахар в чай.", category: "Ovqat" },
    { en: "Salt", uz: "Tuz", example: "Add some salt to the soup.", ru: "Соль", ruExample: "Добавь немного соли в суп.", category: "Ovqat" },
    { en: "Fruit", uz: "Meva", example: "Fruit is good for health.", ru: "Фрукты", ruExample: "Фрукты полезны для здоровья.", category: "Ovqat" },
    { en: "Vegetable", uz: "Sabzavot", example: "I eat vegetables daily.", ru: "Овощи", ruExample: "Я ем овощи каждый день.", category: "Ovqat" },
    { en: "Soup", uz: "Sho'rva", example: "This soup is delicious.", ru: "Суп", ruExample: "Этот суп вкусный.", category: "Ovqat" },
    
    { en: "House", uz: "Uy", example: "This is our new house.", ru: "Дом", ruExample: "Это наш новый дом.", category: "Uy" },
    { en: "Room", uz: "Xona", example: "My room is clean.", ru: "Комната", ruExample: "Моя комната чистая.", category: "Uy" },
    { en: "Door", uz: "Eshik", example: "Please close the door.", ru: "Дверь", ruExample: "Пожалуйста, закрой дверь.", category: "Uy" },
    { en: "Window", uz: "Deraza", example: "Open the window, please.", ru: "Окно", ruExample: "Открой окно, пожалуйста.", category: "Uy" },
    { en: "Table", uz: "Stol", example: "The book is on the table.", ru: "Стол", ruExample: "Книга на столе.", category: "Uy" },
    { en: "Chair", uz: "Stul", example: "Sit on the chair.", ru: "Стул", ruExample: "Сядь на стул.", category: "Uy" },
    { en: "Bed", uz: "Karavot", example: "I sleep on my bed.", ru: "Кровать", ruExample: "Я сплю на своей кровати.", category: "Uy" },
    { en: "Kitchen", uz: "Oshxona", example: "Mother is in the kitchen.", ru: "Кухня", ruExample: "Мама на кухне.", category: "Uy" },
    { en: "Shirt", uz: "Ko'ylak", example: "He is wearing a blue shirt.", ru: "Рубашка", ruExample: "Он носит синюю рубашку.", category: "Kiyim" },
    { en: "Shoes", uz: "Poyabzal", example: "These shoes are new.", ru: "Обувь", ruExample: "Эта обувь новая.", category: "Kiyim" },
    { en: "Hat", uz: "Shlyapa", example: "She wears a hat in summer.", ru: "Шляпа", ruExample: "Она носит шляпу летом.", category: "Kiyim" },
    { en: "Jacket", uz: "Kurtka", example: "Wear your jacket, it's cold.", ru: "Куртка", ruExample: "Надень куртку, холодно.", category: "Kiyim" },
  
    { en: "School", uz: "Maktab", example: "I go to school.", ru: "Школа", ruExample: "Я хожу в школу.", category: "Maktab" },
    { en: "Teacher", uz: "O'qituvchi", example: "My teacher is kind.", ru: "Учитель", ruExample: "Мой учитель добрый.", category: "Maktab" },
    { en: "Student", uz: "O'quvchi", example: "She is a good student.", ru: "Ученик", ruExample: "Она хорошая ученица.", category: "Maktab" },
    { en: "Book", uz: "Kitob", example: "This is my book.", ru: "Книга", ruExample: "Это моя книга.", category: "Maktab" },
    { en: "Pen", uz: "Ruchka", example: "I write with a pen.", ru: "Ручка", ruExample: "Я пишу ручкой.", category: "Maktab" },
    { en: "Pencil", uz: "Qalam", example: "Draw with a pencil.", ru: "Карандаш", ruExample: "Рисуй карандашом.", category: "Maktab" },
    { en: "Notebook", uz: "Daftar", example: "Write it in your notebook.", ru: "Тетрадь", ruExample: "Запиши это в тетрадь.", category: "Maktab" },
    { en: "Lesson", uz: "Dars", example: "Today's lesson is interesting.", ru: "Урок", ruExample: "Сегодняшний урок интересный.", category: "Maktab" },
    { en: "Exam", uz: "Imtihon", example: "The exam is tomorrow.", ru: "Экзамен", ruExample: "Экзамен завтра.", category: "Maktab" },
    { en: "Homework", uz: "Uyga vazifa", example: "I finished my homework.", ru: "Домашнее задание", ruExample: "Я закончил домашнее задание.", category: "Maktab" },
    { en: "Work", uz: "Ish", example: "He goes to work every day.", ru: "Работа", ruExample: "Он ходит на работу каждый день.", category: "Ish" },
    { en: "Job", uz: "Kasb", example: "She has a good job.", ru: "Профессия", ruExample: "У неё хорошая работа.", category: "Ish" },
    { en: "Office", uz: "Ofis", example: "I work in an office.", ru: "Офис", ruExample: "Я работаю в офисе.", category: "Ish" },
    { en: "Money", uz: "Pul", example: "He saves his money.", ru: "Деньги", ruExample: "Он копит деньги.", category: "Ish" },
    { en: "Manager", uz: "Menejer", example: "The manager is busy today.", ru: "Менеджер", ruExample: "Менеджер сегодня занят.", category: "Ish" },
   
    { en: "Car", uz: "Mashina", example: "My car is blue.", ru: "Машина", ruExample: "Моя машина синяя.", category: "Sayohat" },
    { en: "Bus", uz: "Avtobus", example: "We took the bus to school.", ru: "Автобус", ruExample: "Мы ехали в школу на автобусе.", category: "Sayohat" },
    { en: "Train", uz: "Poyezd", example: "The train is fast.", ru: "Поезд", ruExample: "Поезд быстрый.", category: "Sayohat" },
    { en: "Airport", uz: "Aeroport", example: "We arrived at the airport.", ru: "Аэропорт", ruExample: "Мы прибыли в аэропорт.", category: "Sayohat" },
    { en: "Ticket", uz: "Chipta", example: "I bought two tickets.", ru: "Билет", ruExample: "Я купил два билета.", category: "Sayohat" },
    { en: "City", uz: "Shahar", example: "Tashkent is a big city.", ru: "Город", ruExample: "Ташкент большой город.", category: "Sayohat" },
    { en: "Country", uz: "Mamlakat", example: "Uzbekistan is my country.", ru: "Страна", ruExample: "Узбекистан моя страна.", category: "Sayohat" },
    { en: "Street", uz: "Ko'cha", example: "This street is busy.", ru: "Улица", ruExample: "Эта улица оживлённая.", category: "Sayohat" },
    { en: "Map", uz: "Xarita", example: "Look at the map.", ru: "Карта", ruExample: "Посмотри на карту.", category: "Sayohat" },
    { en: "Hotel", uz: "Mehmonxona", example: "We stayed at a hotel.", ru: "Гостиница", ruExample: "Мы остановились в гостинице.", category: "Sayohat" },
   
    { en: "Dog", uz: "It", example: "The dog is running.", ru: "Собака", ruExample: "Собака бежит.", category: "Tabiat" },
    { en: "Cat", uz: "Mushuk", example: "The cat is sleeping.", ru: "Кошка", ruExample: "Кошка спит.", category: "Tabiat" },
    { en: "Bird", uz: "Qush", example: "The bird can fly.", ru: "Птица", ruExample: "Птица умеет летать.", category: "Tabiat" },
    { en: "Tree", uz: "Daraxt", example: "There is a tree in the yard.", ru: "Дерево", ruExample: "Во дворе есть дерево.", category: "Tabiat" },
    { en: "Flower", uz: "Gul", example: "She gave me a flower.", ru: "Цветок", ruExample: "Она подарила мне цветок.", category: "Tabiat" },
    { en: "Sun", uz: "Quyosh", example: "The sun is bright today.", ru: "Солнце", ruExample: "Сегодня солнце яркое.", category: "Tabiat" },
    { en: "Moon", uz: "Oy", example: "The moon is beautiful tonight.", ru: "Луна", ruExample: "Луна сегодня красивая.", category: "Tabiat" },
    { en: "Rain", uz: "Yomg'ir", example: "It is raining outside.", ru: "Дождь", ruExample: "На улице идёт дождь.", category: "Ob-havo" },
    { en: "Snow", uz: "Qor", example: "Snow is falling in winter.", ru: "Снег", ruExample: "Зимой идёт снег.", category: "Ob-havo" },
    { en: "Wind", uz: "Shamol", example: "The wind is strong today.", ru: "Ветер", ruExample: "Сегодня сильный ветер.", category: "Ob-havo" },
    { en: "Cold", uz: "Sovuq", example: "It is cold in winter.", ru: "Холодно", ruExample: "Зимой холодно.", category: "Ob-havo" },
    { en: "Hot", uz: "Issiq", example: "It is hot in summer.", ru: "Жарко", ruExample: "Летом жарко.", category: "Ob-havo" },
    
    { en: "Today", uz: "Bugun", example: "Today is a good day.", ru: "Сегодня", ruExample: "Сегодня хороший день.", category: "Vaqt" },
    { en: "Tomorrow", uz: "Ertaga", example: "See you tomorrow.", ru: "Завтра", ruExample: "До завтра.", category: "Vaqt" },
    { en: "Yesterday", uz: "Kecha", example: "I saw him yesterday.", ru: "Вчера", ruExample: "Я видел его вчера.", category: "Vaqt" },
    { en: "Morning", uz: "Ertalab", example: "I wake up in the morning.", ru: "Утро", ruExample: "Я просыпаюсь утром.", category: "Vaqt" },
    { en: "Night", uz: "Kecha (tun)", example: "I sleep at night.", ru: "Ночь", ruExample: "Я сплю ночью.", category: "Vaqt" },
    { en: "Week", uz: "Hafta", example: "There are seven days in a week.", ru: "Неделя", ruExample: "В неделе семь дней.", category: "Vaqt" },
    { en: "Month", uz: "Oy (kalendar)", example: "This month is busy.", ru: "Месяц", ruExample: "Этот месяц занятой.", category: "Vaqt" },
    { en: "Year", uz: "Yil", example: "Next year will be great.", ru: "Год", ruExample: "Следующий год будет отличным.", category: "Vaqt" },
    { en: "One", uz: "Bir", example: "I have one book.", ru: "Один", ruExample: "У меня одна книга.", category: "Sonlar" },
    { en: "Two", uz: "Ikki", example: "She has two sisters.", ru: "Два", ruExample: "У неё две сестры.", category: "Sonlar" },
    { en: "Three", uz: "Uch", example: "There are three chairs.", ru: "Три", ruExample: "Здесь три стула.", category: "Sonlar" },
    { en: "Ten", uz: "O'n", example: "He counted to ten.", ru: "Десять", ruExample: "Он посчитал до десяти.", category: "Sonlar" },
   
    { en: "Happy", uz: "Baxtli", example: "She is very happy today.", ru: "Счастливый", ruExample: "Она сегодня очень счастлива.", category: "His-tuyg'u" },
    { en: "Sad", uz: "Xafa", example: "He looks sad.", ru: "Грустный", ruExample: "Он выглядит грустным.", category: "His-tuyg'u" },
    { en: "Angry", uz: "Jahldor", example: "Don't be angry with me.", ru: "Злой", ruExample: "Не злись на меня.", category: "His-tuyg'u" },
    { en: "Tired", uz: "Charchagan", example: "I am very tired.", ru: "Уставший", ruExample: "Я очень устал.", category: "His-tuyg'u" },
    { en: "Beautiful", uz: "Chiroyli", example: "What a beautiful garden!", ru: "Красивый", ruExample: "Какой красивый сад!", category: "Sifat" },
    { en: "Big", uz: "Katta", example: "This is a big house.", ru: "Большой", ruExample: "Это большой дом.", category: "Sifat" },
    { en: "Small", uz: "Kichik", example: "The kitten is small.", ru: "Маленький", ruExample: "Котёнок маленький.", category: "Sifat" },
    { en: "Fast", uz: "Tez", example: "He runs very fast.", ru: "Быстрый", ruExample: "Он бегает очень быстро.", category: "Sifat" },
    { en: "Slow", uz: "Sekin", example: "The turtle is slow.", ru: "Медленный", ruExample: "Черепаха медленная.", category: "Sifat" },
    { en: "Strong", uz: "Kuchli", example: "He is very strong.", ru: "Сильный", ruExample: "Он очень сильный.", category: "Sifat" },
    { en: "Smart", uz: "Aqlli", example: "She is a smart student.", ru: "Умный", ruExample: "Она умная ученица.", category: "Sifat" },
    { en: "Kind", uz: "Mehribon", example: "My teacher is kind.", ru: "Добрый", ruExample: "Мой учитель добрый.", category: "Sifat" },
   
    { en: "Run", uz: "Yugurmoq", example: "Children love to run.", ru: "Бегать", ruExample: "Дети любят бегать.", category: "Fe'l" },
    { en: "Eat", uz: "Yemoq", example: "We eat lunch at noon.", ru: "Есть", ruExample: "Мы обедаем в полдень.", category: "Fe'l" },
    { en: "Drink", uz: "Ichmoq", example: "Drink water every day.", ru: "Пить", ruExample: "Пей воду каждый день.", category: "Fe'l" },
    { en: "Sleep", uz: "Uxlamoq", example: "I sleep eight hours.", ru: "Спать", ruExample: "Я сплю восемь часов.", category: "Fe'l" },
    { en: "Study", uz: "O'qimoq (o'rganmoq)", example: "I study English every day.", ru: "Учиться", ruExample: "Я учу английский каждый день.", category: "Fe'l" },
    { en: "Write", uz: "Yozmoq", example: "She writes a letter.", ru: "Писать", ruExample: "Она пишет письмо.", category: "Fe'l" },
    { en: "Read", uz: "O'qimoq (kitob)", example: "He reads a book every night.", ru: "Читать", ruExample: "Он читает книгу каждый вечер.", category: "Fe'l" },
    { en: "Speak", uz: "Gapirmoq", example: "She speaks English well.", ru: "Говорить", ruExample: "Она хорошо говорит по-английски.", category: "Fe'l" },
    { en: "Listen", uz: "Tinglamoq", example: "Listen to the teacher.", ru: "Слушать", ruExample: "Слушай учителя.", category: "Fe'l" },
    { en: "Watch", uz: "Tomosha qilmoq", example: "We watch movies together.", ru: "Смотреть", ruExample: "Мы смотрим фильмы вместе.", category: "Fe'l" },
    { en: "Play", uz: "O'ynamoq", example: "Children play in the park.", ru: "Играть", ruExample: "Дети играют в парке.", category: "Fe'l" },
    { en: "Buy", uz: "Sotib olmoq", example: "I want to buy a new phone.", ru: "Покупать", ruExample: "Я хочу купить новый телефон.", category: "Fe'l" },
    { en: "Sell", uz: "Sotmoq", example: "He sells fruit at the market.", ru: "Продавать", ruExample: "Он продаёт фрукты на рынке.", category: "Fe'l" },
    { en: "Help", uz: "Yordam bermoq", example: "Can you help me, please?", ru: "Помогать", ruExample: "Ты можешь мне помочь?", category: "Fe'l" },
    { en: "Learn", uz: "O'rganmoq", example: "I want to learn English.", ru: "Учить", ruExample: "Я хочу выучить английский.", category: "Fe'l" },
    { en: "Teach", uz: "O'qitmoq", example: "She teaches math.", ru: "Преподавать", ruExample: "Она преподаёт математику.", category: "Fe'l" },
    { en: "Travel", uz: "Sayohat qilmoq", example: "They love to travel.", ru: "Путешествовать", ruExample: "Они любят путешествовать.", category: "Fe'l" },
    { en: "Cook", uz: "Ovqat pishirmoq", example: "My mother cooks well.", ru: "Готовить", ruExample: "Моя мама хорошо готовит.", category: "Fe'l" },
    { en: "Clean", uz: "Tozalamoq", example: "I clean my room every week.", ru: "Убирать", ruExample: "Я убираю свою комнату каждую неделю.", category: "Fe'l" },
    { en: "Open", uz: "Ochmoq", example: "Please open the window.", ru: "Открывать", ruExample: "Пожалуйста, открой окно.", category: "Fe'l" },
    { en: "Close", uz: "Yopmoq", example: "Close the door, please.", ru: "Закрывать", ruExample: "Закрой дверь, пожалуйста.", category: "Fe'l" },
    
    { en: "Computer", uz: "Kompyuter", example: "I use a computer for work.", ru: "Компьютер", ruExample: "Я использую компьютер для работы.", category: "Texnologiya" },
    { en: "Phone", uz: "Telefon", example: "My phone is new.", ru: "Телефон", ruExample: "Мой телефон новый.", category: "Texnologiya" },
    { en: "Internet", uz: "Internet", example: "I use the internet every day.", ru: "Интернет", ruExample: "Я пользуюсь интернетом каждый день.", category: "Texnologiya" },
    { en: "Camera", uz: "Kamera", example: "She has a good camera.", ru: "Камера", ruExample: "У неё хорошая камера.", category: "Texnologiya" },
    { en: "Language", uz: "Til", example: "English is a global language.", ru: "Язык", ruExample: "Английский - это международный язык.", category: "Texnologiya" },
    { en: "Success", uz: "Muvaffaqiyat", example: "Hard work leads to success.", ru: "Успех", ruExample: "Усердный труд приводит к успеху.", category: "Texnologiya" },
    { en: "Knowledge", uz: "Bilim", example: "Knowledge is power.", ru: "Знание", ruExample: "Знание - сила.", category: "Texnologiya" },
    { en: "Hello", uz: "Salom", example: "Hello my friend.", ru: "Привет", ruExample: "Привет, мой друг.", category: "Umumiy" }
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
    return w.en;
}

function getTargetExample(w) {
    if (learnLang === "ru") return w.ruExample || w.example;
    return w.example;
}

function getVoiceLang() {
    return learnLang === "ru" ? "ru-RU" : "en-US";
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

function buildDeck() {
    const cat = categoryFilterEl ? categoryFilterEl.value : "all";
    const favOnly = favOnlyToggleEl ? favOnlyToggleEl.checked : false;

    deck = words.filter(w => {
        const matchCat = cat === "all" || w.category === cat;
        const matchFav = !favOnly || favoriteWords.includes(wordKey(w));
        return matchCat && matchFav;
    });

    if (deck.length === 0) deck = words;
    index = 0;
    loadCard();
}

if (categoryFilterEl) {
    const categories = ["all", ...new Set(words.map(w => w.category))];
    categoryFilterEl.innerHTML = categories.map(c =>
        `<option value="${c}">${c === "all" ? "🗂 Barcha kategoriya" : c}</option>`
    ).join("");
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
        if (showEnglish) {
            englishWord.textContent = getTargetWord(deck[index]);
            uzbekWord.textContent = deck[index].uz;
        } else {
            englishWord.textContent = deck[index].uz;
            uzbekWord.textContent = getTargetWord(deck[index]);
        }
        example.textContent = getTargetExample(deck[index]);
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
        speech.rate = 0.9;
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
    };
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

console.log("English Master Pro v19 - To'liq barqaror versiya ishga tushdi ✔");


const lessonsEn = [
    { title: "BBC Learning English — All About Language (6 Minute English)", video: "https://www.youtube.com/embed/fcN0BXzK8bg" },
    { title: "Take Your English Forward — BBC Learning English", video: "https://www.youtube.com/embed/kVwPYXSAEjA" },
    { title: "55 English Lessons in 55 Minutes — Grammar & Vocabulary", video: "https://www.youtube.com/embed/gYq-ilAbxDM" }
];

const lessonsRu = [
    { title: "Rus tili darsi 1 — Maslahatlar va alifbo", video: "https://www.youtube.com/embed/AYRZupz6rdw" },
    { title: "To'liq boshlang'ich rus tili kursi (9 soat)", video: "https://www.youtube.com/embed/Q4pZnM7LeSo" }
];

let courseLang = "en";

function renderCourseList() {
    const courseList = document.getElementById("courseList");
    if (!courseList) return;
    const list = courseLang === "ru" ? lessonsRu : lessonsEn;
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
    const lang = (typeof learnLang !== "undefined") ? learnLang : "en";
    let pool = words.filter(w => (lang === "ru" ? w.ruExample : w.example));
    if (!pool.length) pool = words.filter(w => w.example);
    if (!pool.length) return;

    const w = pool[Math.floor(Math.random() * pool.length)];
    listeningState.sentence = ((lang === "ru" ? w.ruExample : w.example) || w.example || "").trim();

    const resultEl = document.getElementById("listeningResult");
    if (resultEl) { resultEl.textContent = ""; resultEl.className = "listening-result"; }
    const inputEl = document.getElementById("listeningAnswer");
    if (inputEl) inputEl.value = "";
}

function playListeningSentence() {
    if (!listeningState.sentence) pickListeningSentence();
    const lang = (typeof learnLang !== "undefined") ? learnLang : "en";
    if (typeof speakText === "function") {
        speakText(listeningState.sentence, lang === "ru" ? "ru-RU" : "en-US");
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
    checkGrammarBtn.onclick = () => {
        const grammarInputEl = document.getElementById("grammarInput");
        const text = grammarInputEl ? grammarInputEl.value : "";
        if (!text) { alert("Gap yozing"); return; }
        const out = document.getElementById("grammarResult");
        if (out) out.innerHTML = checkGrammarRules(text).map(i => `<div>${i}</div>`).join("");
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
        recognition.onresult = (e) => {
            const spoken = e.results[0][0].transcript;
            const scoreVal = pronunciationSimilarity(spoken, target);
            if (out) out.innerHTML = `🗣️ Siz aytdingiz: "${spoken}"<br>⭐ Score: ${scoreVal}/100`;
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
if (darkThemeBtn) darkThemeBtn.onclick = () => { document.body.dataset.theme = "dark"; localStorage.setItem("appTheme", "dark"); };

const lightThemeBtn = document.getElementById("lightTheme");
if (lightThemeBtn) lightThemeBtn.onclick = () => { document.body.dataset.theme = "light"; localStorage.setItem("appTheme", "light"); };

const neonThemeBtn = document.getElementById("neonTheme");
if (neonThemeBtn) neonThemeBtn.onclick = () => { document.body.dataset.theme = "neon"; localStorage.setItem("appTheme", "neon"); };

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

const languageSelectEl = document.getElementById("languageSelect");
if (languageSelectEl) {
    languageSelectEl.onchange = () => {
        const lang = languageSelectEl.value;
        localStorage.setItem("language", lang);
        alert("Language: " + lang);
    };
}

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

// ==========================
// ADMIN PANEL
// ==========================
const adminStats = document.getElementById("adminStats");
function loadAdminStats() {
    if (!adminStats) return;
    adminStats.innerHTML = `👥 Users: 1250<br>📚 Lessons: 320<br>🏆 Battles: 845<br>💎 Premium: 86`;
}
loadAdminStats();

const users = ["Ali", "John", "Emma", "Alex", "Sara"];
const refreshUsersBtn = document.getElementById("refreshUsers");
const userListEl = document.getElementById("userList");
if (refreshUsersBtn) {
    refreshUsersBtn.onclick = () => {
        if (!userListEl) return;
        userListEl.innerHTML = "";
        users.forEach(user => userListEl.innerHTML += `<div class="adminCard">👤 ${user}</div>`);
    };
}

const sendAnnouncementBtn = document.getElementById("sendAnnouncement");
if (sendAnnouncementBtn) {
    sendAnnouncementBtn.onclick = () => {
        const textInput = document.getElementById("announcementText");
        const text = textInput ? textInput.value : "";
        if (!text) { alert("Announcement yozing"); return; }
        const out = document.getElementById("announcementStatus");
        if (out) out.innerHTML = "✅ Sent Successfully";
    };
}

const banBtn = document.getElementById("banBtn");
const unbanBtn = document.getElementById("unbanBtn");
const banUserInput = document.getElementById("banUser");
const banStatusEl = document.getElementById("banStatus");
if (banBtn) {
    banBtn.onclick = () => {
        const user = banUserInput ? banUserInput.value : "";
        if (banStatusEl) banStatusEl.innerHTML = "🚫 " + user + " banned";
    };
}
if (unbanBtn) {
    unbanBtn.onclick = () => {
        const user = banUserInput ? banUserInput.value : "";
        if (banStatusEl) banStatusEl.innerHTML = "✅ " + user + " unbanned";
    };
}

const feedback = ["Great App", "Need More Lessons", "Add Dark Theme", "Add Multiplayer"];
const feedbackListEl = document.getElementById("feedbackList");
if (feedbackListEl) feedback.forEach(item => feedbackListEl.innerHTML += `<div class="feedback">⭐ ${item}</div>`);

console.log("Admin Panel Loaded");

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

let installPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installPrompt = e;
});

const installAppBtn2 = document.getElementById("installAppPWA");
if (installAppBtn2) {
    installAppBtn2.onclick = async () => {
        const out = document.getElementById("installStatus");
        if (!installPrompt) { if (out) out.innerHTML = "Already Installed"; return; }
        installPrompt.prompt();
    };
}

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
// MINI GAMES
// =====================
const memoryGameBtn = document.getElementById("memoryGameBtn");
const gameContainerEl = document.getElementById("gameContainer");
if (memoryGameBtn) {
    memoryGameBtn.onclick = () => {
        if (gameContainerEl) gameContainerEl.innerHTML = `<h3>🧠 Memory Match</h3><p>Find matching cards.</p><button onclick="finishMemory()">Finish</button>`;
    };
}
function finishMemory() {
    coins += 100;
    xp += 50;
    saveGame();
    alert("🧠 Memory Game Completed!");
}

const typingGameBtn = document.getElementById("typingGameBtn");
if (typingGameBtn) {
    typingGameBtn.onclick = () => {
        if (gameContainerEl) gameContainerEl.innerHTML = `
            <h3>⌨️ Typing Test</h3><p>Type:</p><b>English Master Pro</b>
            <input id="typingInput"><button onclick="checkTyping()">Check</button>
        `;
    };
}
function checkTyping() {
    const value = document.getElementById("typingInput").value;
    alert(value === "English Master Pro" ? "Perfect!" : "Try Again");
    coins += 100;
    xp += 40;
    saveGame();
}

const wordPuzzleBtn = document.getElementById("wordPuzzleBtn");
if (wordPuzzleBtn) {
    wordPuzzleBtn.onclick = () => {
        if (gameContainerEl) gameContainerEl.innerHTML = `
            <h3>🔤 Word Puzzle</h3><p>Unscramble:</p><b>LPPAE</b>
            <input id="wordAnswer"><button onclick="checkPuzzle()">Check</button>
        `;
    };
}
function checkPuzzle() {
    const answer = document.getElementById("wordAnswer").value.toLowerCase();
    alert(answer === "apple" ? "Correct!" : "Wrong!");
    coins += 80;
    xp += 30;
    saveGame();
}

const hangmanBtn = document.getElementById("hangmanBtn");
if (hangmanBtn) {
    hangmanBtn.onclick = () => {
        if (gameContainerEl) gameContainerEl.innerHTML = `<h3>🔠 Hangman</h3><p>Word:</p><b>C _ T</b><button onclick="finishHangman()">Guess CAT</button>`;
    };
}
function finishHangman() {
    coins += 70;
    xp += 20;
    saveGame();
    alert("You Win!");
}

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

const generateCertificateBtn = document.getElementById("generateCertificate");
if (generateCertificateBtn) {
    generateCertificateBtn.onclick = () => {
        const out = document.getElementById("certificateStatus");
        if (out) out.innerHTML = "🏅 Certificate Generated";
    };
}

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

function speakText(text, langCode) {
    if (!("speechSynthesis" in window) || !text) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = langCode;
    utter.rate = 0.85;
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

function renderTileGrid(items) {
    return `<div class="tile-grid">` + items.map(it => `
        <button class="tile alpha-tile" data-speak="${it.word.replace(/"/g, "&quot;")}">
            <div class="tile-letter">${it.letter}</div>
            <div class="tile-sound">/${it.sound}/</div>
            <div class="tile-word">${it.word}</div>
            <div class="tile-uz">${it.uz}</div>
        </button>`).join("") + `</div>`;
}

function renderNumberGrid(lang) {
    const words_ = lang === "ru" ? NUMBER_RU : NUMBER_EN;
    return `<div class="tile-grid">` + words_.map((w, i) => `
        <button class="tile num-tile" data-speak="${w}">
            <div class="tile-letter">${i}</div>
            <div class="tile-word">${w}</div>
            <div class="tile-uz">${NUMBER_UZ[i]}</div>
        </button>`).join("") + `</div>`;
}

function renderGreetingList(lang) {
    const list = lang === "ru" ? GREETINGS_RU : GREETINGS_EN;
    return `<div class="phrase-list">` + list.map(g => `
        <div class="phrase-row">
            <button class="phrase-speak" data-speak="${g.phrase.replace(/"/g, "&quot;")}">🔊</button>
            <div class="phrase-texts">
                <div class="phrase-main">${g.phrase}</div>
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
        container.innerHTML = renderTileGrid(beginnerLang === "ru" ? RUSSIAN_ALPHABET : ENGLISH_ALPHABET);
    } else if (beginnerTopic === "numbers") {
        container.innerHTML = renderNumberGrid(beginnerLang);
    } else if (beginnerTopic === "greetings") {
        container.innerHTML = renderGreetingList(beginnerLang);
    } else if (beginnerTopic === "grammar") {
        container.innerHTML = renderGrammarBasics(beginnerLang);
    }

    const voiceLang = beginnerLang === "ru" ? "ru-RU" : "en-US";
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

console.log("Beginner Course + Word Game + Word of the Day Loaded");

// =========================================================================
// GAP TUZISH (Sentence Builder) — so'z bo'lakchalaridan to'g'ri gap yasash
// =========================================================================

let sentenceState = { tokens: [], current: [] };

function pickSentence() {
    if (typeof words === "undefined" || !words.length) return;
    const lang = (typeof learnLang !== "undefined") ? learnLang : "en";
    let pool = words.filter(w => (lang === "ru" ? w.ruExample : w.example));
    if (!pool.length) pool = words.filter(w => w.example);
    if (!pool.length) return;

    const w = pool[Math.floor(Math.random() * pool.length)];
    const raw = ((lang === "ru" ? w.ruExample : w.example) || w.example || "").trim();
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

let grammarLang = "en";
let grammarDeck = [];
let grammarIndex = 0;
let grammarScore = 0;

function buildGrammarDeck() {
    const lvl = getUserLevel();
    const bank = grammarLang === "ru" ? GRAMMAR_QUESTIONS_RU : GRAMMAR_QUESTIONS_EN;
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
    optsEl.innerHTML = current.options.map(opt =>
        `<button class="answer" data-opt="${opt.replace(/"/g, "&quot;")}">${opt}</button>`
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
            streak = 1;
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