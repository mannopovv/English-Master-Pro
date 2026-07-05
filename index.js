const pages = document.querySelectorAll(".page");
 
function openPage(id) {
    pages.forEach(page => {
        page.classList.remove("active");
    });
    const targetPage = document.getElementById(id);
    if (targetPage) {
        targetPage.classList.add("active");
    }
}
 
// Menyu tugmalariga hodisalarni ulash
const menuButtons = {
    "homeBtn": "homePage",
    "flashBtn": "flashPage",
    "quizBtn": "quizPage",
    "statsBtn": "statsPage",
    "settingsBtn": "settingsPage",
    "startBtn": "flashPage",
    "aiBtn": "aiPage",
    "assistantBtn": "assistantPage"
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
        };
    }
});
 
// -------- Ma'lumotlar bazasi (So'zlar) --------
const words = [
    { en: "Hello", uz: "Salom", example: "Hello my friend." },
    { en: "Apple", uz: "Olma", example: "I eat an apple." },
    { en: "Dog", uz: "It", example: "The dog is running." },
    { en: "Book", uz: "Kitob", example: "This is my book." },
    { en: "School", uz: "Maktab", example: "I go to school." },
    { en: "Teacher", uz: "O'qituvchi", example: "My teacher is kind." },
    { en: "Water", uz: "Suv", example: "Drink water every day." },
    { en: "Car", uz: "Mashina", example: "My car is blue." }
];
 
// -------- Global O'zgaruvchilar --------
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
 
// -------- DOM Elementlar --------
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
 
// -------- Kartochkalarni Yuklash (Flashcard) --------
function loadCard() {
    if (!words[index]) return;
    if (englishWord && uzbekWord && example) {
        if (showEnglish) {
            englishWord.textContent = words[index].en;
            uzbekWord.textContent = words[index].uz;
        } else {
            englishWord.textContent = words[index].uz;
            uzbekWord.textContent = words[index].en;
        }
        example.textContent = words[index].example;
    }
}
 
const nextBtn = document.getElementById("nextBtn");
if (nextBtn) {
    nextBtn.onclick = () => {
        index++;
        if (index >= words.length) index = 0;
        loadCard();
    };
}
 
const prevBtn = document.getElementById("prevBtn");
if (prevBtn) {
    prevBtn.onclick = () => {
        index--;
        if (index < 0) index = words.length - 1;
        loadCard();
    };
}
 
const voiceBtn = document.getElementById("voiceBtn");
if (voiceBtn) {
    voiceBtn.onclick = () => {
        if (!words[index]) return;
        const speech = new SpeechSynthesisUtterance(words[index].en);
        speech.lang = "en-US";
        speech.rate = 0.9;
        speechSynthesis.cancel();
        speechSynthesis.speak(speech);
    };
}
 
// =========================================
// TEST TIZIMI (QUIZ SYSTEM)
// =========================================
const timer = document.createElement("h2");
timer.id = "timer";
const quizPage = document.getElementById("quizPage");
if (quizPage) quizPage.prepend(timer);
 
function loadQuiz() {
    if (!question || !answers) return;
 
    if (quizIndex >= words.length) {
        clearInterval(timerInterval);
        question.innerHTML = "🎉 Test tugadi";
        answers.innerHTML = `
            <h2>Natija: ${score}/${words.length}</h2>
            <button id="restartQuiz" class="answer" style="text-align:center;">Qayta boshlash</button>
        `;
        const restartBtn = document.getElementById("restartQuiz");
        if (restartBtn) restartBtn.onclick = restartQuiz;
        saveHighScore();
        return;
    }
 
    const current = words[quizIndex];
    question.innerHTML = current.en;
 
    let options = [current.uz];
    while (options.length < 4) {
        let random = words[Math.floor(Math.random() * words.length)].uz;
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
        btn.onclick = () => checkAnswer(option);
        answers.appendChild(btn);
    });
}
 
function checkAnswer(answer) {
    if (answer === words[quizIndex].uz) {
        score++;
        xp += 15;
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
        wrongAnswer();
    }
    updateStats();
    quizIndex++;
    clearInterval(timerInterval);
    loadQuiz();
    if (quizIndex < words.length) startTimer();
}
 
function restartQuiz() {
    quizIndex = 0;
    score = 0;
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
            if (quizIndex < words.length) startTimer();
        }
    }, 1000);
}
 
// =========================================
// STATISTIKA VA PROGRESS
// =========================================
function updateStats() {
    if (levelEl) levelEl.innerHTML = level;
    if (xpEl) xpEl.innerHTML = xp;
    if (knownEl) knownEl.innerHTML = known;
    if (streakEl) streakEl.innerHTML = streak + "🔥";
 
    localStorage.setItem("level", level);
    localStorage.setItem("xp", xp);
    localStorage.setItem("known", known);
    localStorage.setItem("streak", streak);
}
 
// ASOSIY o'yin statistikasini yuklash (localStorage'dan)
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
 
// =========================================
// O'YIN TIZIMI, COIN VA SINOVLAR
// =========================================
function updateGame() {
    console.log("Coins:", coins, "Combo:", combo, "Lives:", lives);
}
 
function correctAnswer() {
    combo++;
    coins += 5;
    known = Math.min(known + 1, words.length);
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
    document.body.animate([
        { transform: "scale(1)" },
        { transform: "scale(1.02)" },
        { transform: "scale(1)" }
    ], { duration: 500 });
}
 
function coinAnimation() {
    document.body.animate([
        { transform: "scale(1)" },
        { transform: "scale(1.01)" },
        { transform: "scale(1)" }
    ], { duration: 300 });
}
 
// =========================================
// DO'KON TIZIMI (SHOP SYSTEM)
// =========================================
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
 
// Holat (state) massivlari — localStorage bilan ishlaydi
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
 
// =========================================
// GAMIFIKATSIYA (AVATAR, RANK, MISSIONS)
// =========================================
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
 
// =========================================
// DO'STLAR VA ONLAYN TIZIM (MULTIPLAYER)
// =========================================
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
 
// =========================================
// QIDIRUV VA QO'SHIMCHA FUNKSIYALAR
// =========================================
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
    index = Math.floor(Math.random() * words.length);
    loadCard();
}
 
function switchLanguage() {
    showEnglish = !showEnglish;
    loadCard();
}
 
function shuffleWords() {
    words.sort(() => Math.random() - 0.5);
    index = 0;
    loadCard();
}
 
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let hardWords = JSON.parse(localStorage.getItem("hardWords")) || [];
 
function addFavorite() {
    let word = words[index];
    if (!favorites.find(x => x.en === word.en)) {
        favorites.push(word);
        localStorage.setItem("favorites", JSON.stringify(favorites));
        alert("❤️ Sevimlilarga qo'shildi");
    } else {
        alert("Bu so'z allaqachon qo'shilgan.");
    }
}
 
function addHardWord() {
    const word = words[index];
    if (!hardWords.find(w => w.en === word.en)) {
        hardWords.push(word);
        localStorage.setItem("hardWords", JSON.stringify(hardWords));
        alert("⭐ Qiyin so'z sifatida saqlandi");
    }
}
 
// =========================================
// SUN'IY INTELLEKT BO'LIMI (AI CHAT)
// =========================================
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
        setTimeout(() => {
            aiAnswer.innerHTML = "🤖 Sun'iy intellekt integratsiyasi faollashtirilmoqda. API kalitini sozlang.";
        }, 1500);
    };
}
 
if (generateQuiz) {
    generateQuiz.onclick = () => {
        if (quizResult) quizResult.innerHTML = "⏳ AI test tayyorlamoqda...";
        setTimeout(() => {
            if (quizResult) quizResult.innerHTML = "🧠 Test muvaffaqiyatli yaratildi (Hozircha demo rejimida).";
        }, 1500);
    };
}
 
if (sendMessageBtn) {
    sendMessageBtn.onclick = () => {
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
 
        setTimeout(() => {
            const aiReplyContainer = document.getElementById(aiLoadingId);
            if (aiReplyContainer) {
                aiReplyContainer.innerHTML = "🤖 Men sizning shaxsiy o'qituvchingizman. Savolingiz qabul qilindi!";
            }
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 1500);
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
 
// =========================================
// SOZLAMALAR VA BULUTLI TIZIM (FIREBASE)
// =========================================
let dark = localStorage.getItem("dark") === "true";
if (dark) document.body.classList.add("dark");
 
if (darkBtn) {
    darkBtn.onclick = () => {
        document.body.classList.toggle("dark");
        dark = document.body.classList.contains("dark");
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
if (hour >= 18 || hour <= 6) {
    document.body.classList.add("dark");
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
 
// =========================================
// PWA, SERVICE WORKER VA BILDIRISHNOMALAR
// =========================================
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
 
// =========================================
// KLAVIATURA STRATEGIYALARI (SHORTCUTS)
// =========================================
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
 
// -------- Dasturni Ilk Ishga Tushirish --------
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
 
// ==========================
// VIDEO LESSONS
// ==========================
const lessons = [
    { title: "Lesson 1", video: "https://www.youtube.com/embed/VIDEO_ID" },
    { title: "Lesson 2", video: "https://www.youtube.com/embed/VIDEO_ID" }
];
 
const courseList = document.getElementById("courseList");
if (courseList) {
    lessons.forEach(item => {
        courseList.innerHTML += `
            <div class="lesson">
                <h3>${item.title}</h3>
                <iframe width="350" height="200" src="${item.video}" allowfullscreen></iframe>
            </div>
        `;
    });
}
 
// ==========================
// LISTENING
// ==========================
const checkListeningBtn = document.getElementById("checkListening");
if (checkListeningBtn) {
    checkListeningBtn.onclick = () => {
        const listeningAnswerEl = document.getElementById("listeningAnswer");
        const text = listeningAnswerEl ? listeningAnswerEl.value.toLowerCase() : "";
        if (text.includes("hello")) {
            alert("✅ Correct");
            coins += 20;
            saveGame();
        } else {
            alert("❌ Wrong");
        }
    };
}
 
// ==========================
// DICTIONARY
// ==========================
const dictionary = [
    { word: "Apple", meaning: "Olma" },
    { word: "Dog", meaning: "It" },
    { word: "Book", meaning: "Kitob" },
    { word: "Teacher", meaning: "O'qituvchi" }
];
 
const dictionarySearchInput = document.getElementById("dictionarySearch");
if (dictionarySearchInput) {
    dictionarySearchInput.oninput = (e) => {
        const value = e.target.value.toLowerCase();
        const result = dictionary.find(w => w.word.toLowerCase() === value);
        const out = document.getElementById("dictionaryResult");
        if (out) out.innerHTML = result ? `${result.word} = ${result.meaning}` : "Topilmadi";
    };
}
 
console.log("Course Loaded");
 
// ==========================
// OCR
// ==========================
const scanImageBtn = document.getElementById("scanImage");
if (scanImageBtn) {
    scanImageBtn.onclick = () => {
        const fileInput = document.getElementById("ocrImage");
        const file = fileInput ? fileInput.files[0] : null;
        if (!file) { alert("Rasm tanlang"); return; }
        const out = document.getElementById("ocrText");
        if (out) out.innerHTML = "OCR tayyor emas.";
    };
}
 
// ==========================
// TRANSLATE
// ==========================
const translateBtnMain = document.getElementById("translateBtn");
if (translateBtnMain) {
    translateBtnMain.onclick = async () => {
        const input = document.getElementById("translateInput");
        const text = input ? input.value : "";
        if (!text) return;
        const out = document.getElementById("translateResult");
        if (out) out.innerHTML = "Tarjima API ulanmagan.";
    };
}
 
// ==========================
// SPEAKING SCORE
// ==========================
function pronunciationScoreDemo() {
    const scoreVal = Math.floor(Math.random() * 41) + 60;
    alert("🎤 Speaking Score: " + scoreVal + "/100");
}
 
// ==========================
// PDF
// ==========================
const pdfFileInput = document.getElementById("pdfFile");
if (pdfFileInput) {
    pdfFileInput.onchange = () => {
        const out = document.getElementById("pdfStatus");
        if (out) out.innerHTML = "PDF yuklandi.";
    };
}
 
console.log("AI Tools Loaded");
 
// ======================
// AI SPEAKING TEST
// ======================
const startSpeaking = document.getElementById("startSpeaking");
const speechResult = document.getElementById("speechResult");
 
if (startSpeaking) {
    startSpeaking.onclick = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech Recognition qo'llab-quvvatlanmaydi.");
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.start();
        if (speechResult) speechResult.innerHTML = "🎤 Listening...";
        recognition.onresult = (e) => {
            const text = e.results[0][0].transcript;
            if (speechResult) speechResult.innerHTML = "🗣️ You said: " + text;
        };
    };
}
 
// ======================
// ESSAY CHECKER
// ======================
const checkEssayBtn = document.getElementById("checkEssay");
if (checkEssayBtn) {
    checkEssayBtn.onclick = async () => {
        const essayInput = document.getElementById("essayInput");
        const essay = essayInput ? essayInput.value : "";
        if (!essay) { alert("Essay yozing"); return; }
        const out = document.getElementById("essayResult");
        if (out) out.innerHTML = "🤖 AI tekshiruvi uchun API ulanmagan.";
    };
}
 
// ======================
// READING TEST
// ======================
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
 
// ======================
// SMART VOCABULARY
// ======================
function suggestWord() {
    const random = words[Math.floor(Math.random() * words.length)];
    console.log("Today's Smart Word:", random.en);
}
suggestWord();
 
console.log("Speaking Module Loaded");
 
// ==========================
// AI TEACHER
// ==========================
const teacherQuestion = document.getElementById("teacherQuestion");
const teacherAnswer = document.getElementById("teacherAnswer");
const askTeacherBtn = document.getElementById("askTeacher");
 
if (askTeacherBtn) {
    askTeacherBtn.onclick = async () => {
        const q = teacherQuestion ? teacherQuestion.value.trim() : "";
        if (!q) { alert("Savol yozing"); return; }
        if (teacherAnswer) teacherAnswer.innerHTML = "🤖 AI javob tayyorlamoqda...";
    };
}
 
// ==========================
// GRAMMAR
// ==========================
const checkGrammarBtn = document.getElementById("checkGrammar");
if (checkGrammarBtn) {
    checkGrammarBtn.onclick = () => {
        const grammarInputEl = document.getElementById("grammarInput");
        const text = grammarInputEl ? grammarInputEl.value : "";
        if (!text) { alert("Gap yozing"); return; }
        const out = document.getElementById("grammarResult");
        if (out) out.innerHTML = "Grammar API ulanmagan.";
    };
}
 
// ==========================
// STUDY PLAN
// ==========================
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
 
// ==========================
// VOCABULARY GENERATOR
// ==========================
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
 
// =======================
// AI CHAT (2-oynasi)
// =======================
const chatMessages = document.getElementById("chatMessages");
const chatMessageInput = document.getElementById("chatMessage");
const sendChatBtn = document.getElementById("sendChat");
 
if (sendChatBtn) {
    sendChatBtn.onclick = async () => {
        const text = chatMessageInput ? chatMessageInput.value.trim() : "";
        if (!text || !chatMessages) return;
        chatMessages.innerHTML += `<div class="user">👤 ${text}</div>`;
        chatMessageInput.value = "";
        chatMessages.innerHTML += `<div class="ai">🤖 AI javob yozmoqda...</div>`;
    };
}
 
// =======================
// LIVE TRANSLATOR
// =======================
const translateNowBtn = document.getElementById("translateNow");
if (translateNowBtn) {
    translateNowBtn.onclick = () => {
        const inputEl = document.getElementById("liveTranslateInput");
        const text = inputEl ? inputEl.value : "";
        if (!text) { alert("Matn yozing"); return; }
        const out = document.getElementById("liveTranslateResult");
        if (out) out.innerHTML = "Tarjima API ulanmagan.";
    };
}
 
// =======================
// QUIZ CREATOR
// =======================
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
 
// ==========================
// ROOM
// ==========================
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
 
// ==========================
// FRIEND CHAT
// ==========================
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
 
// ==========================
// TOURNAMENT
// ==========================
const startTournamentBtn = document.getElementById("startTournament");
if (startTournamentBtn) {
    startTournamentBtn.onclick = () => {
        const out = document.getElementById("tournamentStatus");
        if (out) out.innerHTML = "⏳ Waiting Players...";
    };
}
 
// ==========================
// WORLD RANKING
// ==========================
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
 
// ==========================
// CAMERA / QR / PDF TRANSLATE
// ==========================
const scanOCRBtn = document.getElementById("scanOCR");
if (scanOCRBtn) {
    scanOCRBtn.onclick = () => {
        const fileInput = document.getElementById("ocrFile");
        const file = fileInput ? fileInput.files[0] : null;
        if (!file) { alert("Rasm tanlang"); return; }
        const out = document.getElementById("ocrOutput");
        if (out) out.innerHTML = "📄 OCR tayyor emas.";
    };
}
 
const translateAIBtn = document.getElementById("translateAI");
if (translateAIBtn) {
    translateAIBtn.onclick = () => {
        const inputEl = document.getElementById("translateText");
        const text = inputEl ? inputEl.value : "";
        if (!text) { alert("Matn kiriting"); return; }
        const out = document.getElementById("translateOutput");
        if (out) out.innerHTML = "🌍 AI Translation API ulanmagan.";
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
 
// ==========================
// CAMERA VIEW
// ==========================
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
 
const startPronunciationBtn = document.getElementById("startPronunciation");
if (startPronunciationBtn) {
    startPronunciationBtn.onclick = () => {
        const scoreVal = Math.floor(Math.random() * 21) + 80;
        const out = document.getElementById("pronunciationScore");
        if (out) out.innerHTML = "⭐ Score: " + scoreVal + "/100";
    };
}
 
console.log("Smart AI Loaded");
 
// ==========================
// ACADEMY / COURSE DATA
// ==========================
const academy = {
    ielts: { title: "IELTS Course", video: "https://www.youtube.com/embed/VIDEO_ID" },
    grammar: { title: "Grammar Course", video: "https://www.youtube.com/embed/VIDEO_ID" },
    listening: { title: "Listening Course", video: "https://www.youtube.com/embed/VIDEO_ID" },
    writing: { title: "Writing Course", video: "https://www.youtube.com/embed/VIDEO_ID" }
};
 
const academyContent = document.getElementById("academyContent");
const lessonVideo = document.getElementById("lessonVideo");
 
function openCourse(name) {
    const item = academy[name];
    if (academyContent) academyContent.innerHTML = `<h2>${item.title}</h2><p>Complete every lesson to unlock rewards.</p>`;
    if (lessonVideo) lessonVideo.src = item.video;
}
 
const ieltsBtn = document.getElementById("ieltsBtn");
if (ieltsBtn) ieltsBtn.onclick = () => openCourse("ielts");
 
const grammarBtn = document.getElementById("grammarBtn");
if (grammarBtn) grammarBtn.onclick = () => openCourse("grammar");
 
const listeningBtn = document.getElementById("listeningBtn");
if (listeningBtn) listeningBtn.onclick = () => openCourse("listening");
 
const writingBtn = document.getElementById("writingBtn");
if (writingBtn) writingBtn.onclick = () => openCourse("writing");
 
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
 
// =========================
// ACHIEVEMENTS DISPLAY
// =========================
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
 
// =========================
// BADGES DISPLAY
// =========================
const badgeTierList = ["🥉 Bronze", "🥈 Silver", "🥇 Gold", "💎 Diamond", "👑 Master"];
const badgeListEl = document.getElementById("badgeList");
if (badgeListEl) {
    badgeTierList.forEach(b => {
        badgeListEl.innerHTML += `<div class="badge">${b}</div>`;
    });
}
 
// =========================
// CALENDAR
// =========================
const calendarEl = document.getElementById("calendar");
if (calendarEl) {
    for (let i = 1; i <= 30; i++) {
        calendarEl.innerHTML += `<div class="day">${i}</div>`;
    }
}
 
// =========================
// DAILY REWARD
// =========================
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
 
console.log("Achievement Loaded");
 
// ==========================
// FRIEND PROFILE
// ==========================
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
 
// ==========================
// BATTLE SYSTEM
// ==========================
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
 
// ==========================
// BOSS
// ==========================
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
 
// ======================
// MAP / OPEN WORLD
// ======================
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
 
// ==========================
// KINGDOM
// ==========================
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
 
// =====================
// LUCKY WHEEL / SLOT / MYSTERY BOX / VIP
// =====================
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
 
// =========================
// GLOBAL MARKET / TRADE / MAIL / BANK / AUCTION
// =========================
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
if (darkThemeBtn) darkThemeBtn.onclick = () => { document.body.dataset.theme = "dark"; };
 
const lightThemeBtn = document.getElementById("lightTheme");
if (lightThemeBtn) lightThemeBtn.onclick = () => { document.body.dataset.theme = "light"; };
 
const neonThemeBtn = document.getElementById("neonTheme");
if (neonThemeBtn) neonThemeBtn.onclick = () => { document.body.dataset.theme = "neon"; };
 
const effects = ["✨ Glow", "🔥 Fire", "❄️ Ice", "⚡ Lightning"];
const effectsDivEl = document.getElementById("effectsDiv");
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
        if (loadingScreenEl) loadingScreenEl.style.display = "none";
    }, 2000);
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
 
const installAppBtn2 = document.getElementById("installApp");
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
        if (out) out.innerHTML = "🤖 Grammar AI API required.";
    };
}
 
const essayScoreBtn = document.getElementById("essayScore");
if (essayScoreBtn) {
    essayScoreBtn.onclick = () => {
        const essayTextEl = document.getElementById("essayText");
        const essay = essayTextEl ? essayTextEl.value : "";
        if (!essay) { alert("Write essay"); return; }
        const out = document.getElementById("essayResult");
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
        const out = document.getElementById("tournamentStatus");
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
const translateBtn2 = document.getElementById("translateBtn");
if (translateBtn2) {
    translateBtn2.onclick = () => {
        const out = document.getElementById("translateResult");
        if (out) out.innerHTML = "🤖 AI Translation API Required";
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
            const out = document.getElementById("speechResult");
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
 
const scanImageBtn2 = document.getElementById("scanImage");
if (scanImageBtn2) {
    scanImageBtn2.onclick = () => {
        const out = document.getElementById("ocrResult");
        if (out) out.innerHTML = "📷 OCR API Required";
    };
}
 
const searchWordBtn = document.getElementById("searchWord");
if (searchWordBtn) {
    searchWordBtn.onclick = () => {
        const wordInput = document.getElementById("dictionaryWord");
        const word = wordInput ? wordInput.value : "";
        const out = document.getElementById("dictionaryResult");
        if (out) out.innerHTML = `<b>${word}</b><br>Meaning: Dictionary API Required`;
    };
}
 
const generateWordsBtn2 = document.getElementById("generateWords");
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
 
const startPronunciationBtn2 = document.getElementById("startPronunciation");
if (startPronunciationBtn2) {
    startPronunciationBtn2.onclick = () => {
        const out = document.getElementById("pronunciationScore");
        if (out) out.innerHTML = "🎤 Listening...";
        setTimeout(() => { if (out) out.innerHTML = "⭐ Score: 92/100"; }, 2000);
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
        const fileInput = document.getElementById("pdfFile");
        if (!fileInput || !fileInput.files.length) { alert("Select PDF"); return; }
        const out = document.getElementById("pdfStatus");
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