// src/services/cinetpay.js
// ─────────────────────────────────────────────────────────────
//  Service paiement CinetPay — Awoundjô
//  API KEY : 12662532135d276e2265ca35.50646383
//  SITE ID : 622448
//  Mode    : TEST (changer en PRODUCTION au déploiement)
// ─────────────────────────────────────────────────────────────

const CINETPAY_CONFIG = {
  apikey:     "12662532135d276e2265ca35.50646383",
  site_id:    622448,   // ← nombre, pas string
  notify_url: `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/payments/cinetpay/notify`,
  mode:       "PRODUCTION",
};

const SDK_URL = "https://cdn.cinetpay.com/seamless/main.js";

/**
 * Injecte le script CinetPay dans le DOM puis attend que
 * window.CinetPay soit disponible (max 10 secondes).
 */
function loadCinetPaySDK() {
  return new Promise((resolve, reject) => {
    // Déjà prêt ?
    if (window.CinetPay) {
      resolve();
      return;
    }

    // Script déjà en cours d'injection → attendre seulement
    const existing = document.getElementById("cinetpay-sdk");
    if (!existing) {
      const script = document.createElement("script");
      script.id  = "cinetpay-sdk";
      script.src = SDK_URL;
      document.head.appendChild(script);
    }

    const start = Date.now();
    const interval = setInterval(() => {
      if (window.CinetPay) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > 10000) {
        clearInterval(interval);
        reject(new Error(
          "Le SDK CinetPay n'a pas pu se charger. " +
          "Vérifiez votre connexion ou les paramètres CSP de Vercel."
        ));
      }
    }, 100);
  });
}

/**
 * Lance le popup de paiement CinetPay.
 *
 * @param {Object}   user          - { name, email, phone }
 * @param {number}   amount        - Montant en XOF (ex: 15000)
 * @param {string}   description   - Description affichée dans le popup
 * @param {string}   transactionId - Identifiant unique (ex: `AWJ-${Date.now()}`)
 * @param {Function} onSuccess     - Callback appelé si paiement accepté → (data, txId)
 * @param {Function} onError       - Callback appelé en cas d'erreur → ({ message, data? })
 */
export async function payWithCinetPay({
  user,
  amount = 15000,
  description = "Adhésion Awoundjô",
  transactionId,
  onSuccess,
  onError,
}) {
  try {
    await loadCinetPaySDK();
  } catch (err) {
    console.error("[CinetPay]", err.message);
    onError?.({ message: err.message });
    return;
  }

  const txId =
    transactionId ||
    `AWJ-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  window.CinetPay.setConfig({
    apikey:     CINETPAY_CONFIG.apikey,
    site_id:    CINETPAY_CONFIG.site_id,
    notify_url: CINETPAY_CONFIG.notify_url,
    mode:       CINETPAY_CONFIG.mode,
  });

  window.CinetPay.getCheckout({
    transaction_id:        txId,
    amount:                amount,
    currency:              "XOF",
    channels:              "ALL",
    description:           description,
    customer_name:         user.name  || "",
    customer_email:        user.email || "",
    customer_phone_number: user.phone || "",
    customer_country:      "CI",
    customer_state:        "CI",
    customer_city:         "Abidjan",
    customer_zip_code:     "00225",
  });

  window.CinetPay.waitResponse(function (data) {
    if (data.status === "ACCEPTED") {
      onSuccess?.(data, txId);
    } else {
      onError?.({ message: "Paiement refusé ou annulé.", data });
    }
  });

  window.CinetPay.onError(function (data) {
    console.error("[CinetPay] Erreur :", data);
    onError?.({ message: "Une erreur est survenue lors du paiement.", data });
  });
}
