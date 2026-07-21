/* =========================================================================
   PRO-PAYMENT.JS — Payme / Click / Stripe orqali Premium sotib olish
   =========================================================================
   MUHIM: Bu fayl sizga chinakam ishlaydigan CHECKOUT HAVOLASINI yaratib
   beradi (Payme/Click/Stripe'ning o'zi tomonidan ochiladigan to'lov
   sahifasi). Lekin "to'lov muvaffaqiyatli o'tdi" degan tasdiqni ISHONCHLI
   tekshirish uchun odatda SERVER (webhook) kerak bo'ladi — bu qism
   backendsiz qilib bo'lmaydi va xavfsiz emas.

   Shu sababli quyidagi oqim ishlatiladi:
   1) Foydalanuvchi "Premium sotib olish" bosadi
   2) Payme/Click/Stripe checkout sahifasi ochiladi (haqiqiy to'lov,
      sizning merchant/Stripe hisobingizga tushadi)
   3) Foydalanuvchi to'lovni tugatgach ilovaga qaytadi va "To'lovni
      tasdiqlayman" tugmasini bosadi -> Premium mahalliy yoqiladi.

   Bu — "sharaf tizimi" (honor system), ya'ni real production uchun YETARLI
   EMAS (birov to'lamasdan ham tasdiqlab qo'yishi mumkin). Haqiqiy xavfsiz
   tizim uchun kichik backend (Node/Express yoki Firebase Functions) kerak
   bo'ladi — xohlasangiz buni ham keyingi qadamda quramiz.

   STRIPE HAQIDA: Stripe'ning maxfiy (secret) kalitini hech qachon
   frontend kodga qo'yib bo'lmaydi (xavfsizlik uchun) — shu sabab bu yerda
   Stripe API emas, Stripe DASHBOARD'da tayyor yaratiladigan "Payment Link"
   (kod yozmasdan yaratiladigan to'lov havolasi) ishlatiladi:
   1) https://dashboard.stripe.com/payment-links -> "+ New" bosing
   2) Mahsulot narxini kiriting -> havola yarating (https://buy.stripe.com/...)
   3) Shu havolani Sozlamalar -> "To'lov" bo'limiga joylashtiring

   SOZLASH: Sozlamalar -> "To'lov (Payme/Click/Stripe)" bo'limida:
   - Payme Merchant ID
   - Click Merchant ID + Service ID
   - Stripe Payment Link (https://buy.stripe.com/...)
   shularni kiriting.
   ========================================================================= */

(function () {
    const PREMIUM_PRICE_UZS = 29000; // standart narx, xohlasangiz o'zgartiring

    function getPaymentConfig() {
        return {
            paymeMerchantId: localStorage.getItem("payme_merchant_id") || "",
            clickMerchantId: localStorage.getItem("click_merchant_id") || "",
            clickServiceId: localStorage.getItem("click_service_id") || "",
            stripePaymentLink: localStorage.getItem("stripe_payment_link") || "",
            price: Number(localStorage.getItem("premium_price_uzs") || PREMIUM_PRICE_UZS)
        };
    }

    function makeOrderId() {
        return "ord_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    // Payme checkout havolasi: https://checkout.paycom.uz/{base64(...)}
    function buildPaymeLink(orderId, amountUzs) {
        const { paymeMerchantId } = getPaymentConfig();
        if (!paymeMerchantId) return null;
        const amountTiyin = Math.round(amountUzs * 100);
        const params = `m=${paymeMerchantId};ac.order_id=${orderId};a=${amountTiyin}`;
        const encoded = btoa(params);
        return `https://checkout.paycom.uz/${encoded}`;
    }

    // Click checkout havolasi
    function buildClickLink(orderId, amountUzs) {
        const { clickMerchantId, clickServiceId } = getPaymentConfig();
        if (!clickMerchantId || !clickServiceId) return null;
        const returnUrl = encodeURIComponent(window.location.href);
        return `https://my.click.uz/services/pay?service_id=${clickServiceId}` +
            `&merchant_id=${clickMerchantId}&amount=${amountUzs}` +
            `&transaction_param=${orderId}&return_url=${returnUrl}`;
    }

    // Stripe Payment Link — narx Stripe Dashboard'da o'rnatilgan bo'ladi
    // (Payment Link narxni URL orqali qabul qilmaydi). "client_reference_id"
    // parametri orqali qaysi buyurtma to'langanini keyinchalik Stripe
    // Dashboard'da topish mumkin.
    function buildStripeLink(orderId) {
        const { stripePaymentLink } = getPaymentConfig();
        if (!stripePaymentLink) return null;
        const sep = stripePaymentLink.includes("?") ? "&" : "?";
        return `${stripePaymentLink}${sep}client_reference_id=${encodeURIComponent(orderId)}`;
    }

    function startCheckout(provider) {
        const { price } = getPaymentConfig();
        const orderId = makeOrderId();
        localStorage.setItem("pending_order_id", orderId);
        localStorage.setItem("pending_order_provider", provider);

        let link;
        if (provider === "payme") link = buildPaymeLink(orderId, price);
        else if (provider === "click") link = buildClickLink(orderId, price);
        else link = buildStripeLink(orderId);

        if (!link) {
            const label = provider === "payme" ? "Payme" : provider === "click" ? "Click" : "Stripe";
            alert(`⚠️ ${label} sozlanmagan. Sozlamalar -> To'lov bo'limida kiriting.`);
            return;
        }
        window.open(link, "_blank");
        renderPaymentPanel();
    }

    function confirmPayment() {
        const orderId = localStorage.getItem("pending_order_id");
        if (!orderId) {
            alert("Avval to'lovni boshlang.");
            return;
        }
        localStorage.setItem("isPremium", "true");
        localStorage.setItem("premium_order_id", orderId);
        localStorage.removeItem("pending_order_id");
        if (typeof window.ProAdmin?.syncMyStatsToCloud === "function") {
            window.ProAdmin.syncMyStatsToCloud();
        }
        renderPaymentPanel();
        alert("✅ Premium yoqildi. Rahmat!");
    }

    function renderPaymentPanel() {
        const el = document.getElementById("paymentPanelContainer");
        if (!el) return;
        const { price, paymeMerchantId, clickMerchantId, stripePaymentLink } = getPaymentConfig();
        const isPremium = localStorage.getItem("isPremium") === "true";
        const pending = localStorage.getItem("pending_order_id");

        if (isPremium) {
            el.innerHTML = `<p class="ai-settings-hint">💎 Premium faol. Rahmat!</p>`;
            return;
        }

        el.innerHTML = `
            <p class="ai-settings-hint">Premium narxi: <b>${price.toLocaleString()} so'm</b> (Stripe uchun narx Stripe Dashboard'dagi Payment Link'da belgilanadi)</p>
            <div class="payment-btn-row">
                <button id="payWithPayme" ${!paymeMerchantId ? "disabled" : ""}>💳 Payme orqali to'lash</button>
                <button id="payWithClick" ${!clickMerchantId ? "disabled" : ""}>💳 Click orqali to'lash</button>
                <button id="payWithStripe" ${!stripePaymentLink ? "disabled" : ""}>💳 Stripe orqali to'lash</button>
            </div>
            ${pending ? `<button id="confirmPaymentBtn" class="confirm-payment-btn">✅ To'lovni tasdiqlayman (buyurtma: ${pending})</button>
            <p class="ai-settings-hint">⚠️ Diqqat: bu — sharaf tizimi, real loyihada server orqali tekshirilishi kerak.</p>` : ""}
            ${(!paymeMerchantId && !clickMerchantId && !stripePaymentLink) ? `<p class="ai-settings-hint">ℹ️ Hali hech qanday to'lov usuli sozlanmagan — Sozlamalar bo'limiga qarang.</p>` : ""}
        `;

        const p = document.getElementById("payWithPayme");
        const c = document.getElementById("payWithClick");
        const s = document.getElementById("payWithStripe");
        const conf = document.getElementById("confirmPaymentBtn");
        if (p) p.onclick = () => startCheckout("payme");
        if (c) c.onclick = () => startCheckout("click");
        if (s) s.onclick = () => startCheckout("stripe");
        if (conf) conf.onclick = confirmPayment;
    }

    window.ProPayment = { startCheckout, confirmPayment, renderPaymentPanel, getPaymentConfig };

    document.addEventListener("DOMContentLoaded", () => {
        const saveBtn = document.getElementById("savePaymentConfigBtn");
        if (saveBtn) {
            saveBtn.onclick = () => {
                const pMerch = document.getElementById("paymeMerchantInput").value.trim();
                const cMerch = document.getElementById("clickMerchantInput").value.trim();
                const cService = document.getElementById("clickServiceInput").value.trim();
                const stripeLink = document.getElementById("stripePaymentLinkInput").value.trim();
                const price = document.getElementById("premiumPriceInput").value.trim();
                if (pMerch) localStorage.setItem("payme_merchant_id", pMerch); else localStorage.removeItem("payme_merchant_id");
                if (cMerch) localStorage.setItem("click_merchant_id", cMerch); else localStorage.removeItem("click_merchant_id");
                if (cService) localStorage.setItem("click_service_id", cService); else localStorage.removeItem("click_service_id");
                if (stripeLink) localStorage.setItem("stripe_payment_link", stripeLink); else localStorage.removeItem("stripe_payment_link");
                if (price) localStorage.setItem("premium_price_uzs", price); else localStorage.removeItem("premium_price_uzs");
                document.getElementById("paymentConfigStatus").textContent = "✅ Saqlandi.";
                renderPaymentPanel();
            };
        }
        const cfg = getPaymentConfig();
        const pIn = document.getElementById("paymeMerchantInput");
        const cIn = document.getElementById("clickMerchantInput");
        const sIn = document.getElementById("clickServiceInput");
        const stripeIn = document.getElementById("stripePaymentLinkInput");
        const priceIn = document.getElementById("premiumPriceInput");
        if (pIn) pIn.value = cfg.paymeMerchantId;
        if (cIn) cIn.value = cfg.clickMerchantId;
        if (sIn) sIn.value = cfg.clickServiceId;
        if (stripeIn) stripeIn.value = cfg.stripePaymentLink;
        if (priceIn) priceIn.value = cfg.price;

        renderPaymentPanel();
    });
})();