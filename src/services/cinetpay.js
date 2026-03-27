// src/services/cinetpay.js
// ─────────────────────────────────────────────────────────────
//  Service paiement CinetPay — Awoundjô
//  API KEY : 12662532135d276e2265ca35.50646383
//  SITE ID : 622448
//  Mode    : TEST (changer en PRODUCTION au déploiement)
// ─────────────────────────────────────────────────────────────

const CINETPAY_CONFIG = {
  apikey:     "12662532135d276e2265ca35.50646383",
  site_id:    622448,
  notify_url: `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/diaspora/cinetpay/notify`,
  mode:       "TEST", // ← changer en "PRODUCTION" au lancement
};

/**
 * Attend que window.CinetPay soit disponible (max 10 secondes).
 * Résout si OK, rejette si timeout.
 */
function waitForSDK(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (window.CinetPay) {
      resolve();
      return;
    }

    const start = Date.now();
    const interval = setInterval(() => {
      if (window.CinetPay) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error("SDK CinetPay introuvable après 10 secondes. Vérifiez index.html."));
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
 * @param {Function} onSuccess     - Callback appelé si paiement accepté
 * @param {Function} onError       - Callback appelé en cas d'erreur
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
    await waitForSDK();
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
    channels:              "ALL",       // Mobile Money + Wave + CB
    description:           description,
    customer_name:         user.name   || "",
    customer_email:        user.email  || "",
    customer_phone_number: user.phone  || "",
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
