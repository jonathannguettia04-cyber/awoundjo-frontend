// src/services/cinetpay.js
// ─────────────────────────────────────────────────────────────────────────────
//  Service CinetPay — Awoundjô
//  Charge le SDK CinetPay v2 dynamiquement et ouvre la popup de paiement.
//  Utilisé par AdhesionForm.jsx et tout autre composant qui appelle payWithCinetPay().
//
//  Flux :
//    payWithCinetPay(options)
//      → charge le script SDK si absent
//      → appelle CinetPay.init()  (popup)
//      → onSuccess(data, transactionId)  quand le paiement est accepté
//      → onError({ message })            en cas d'échec / annulation
// ─────────────────────────────────────────────────────────────────────────────

const CINETPAY_API_KEY = "12662532135d276e2265ca35.50646383";
const CINETPAY_SITE_ID = "622448";
const SDK_URL          = "https://cdn.cinetpay.com/seamless/main.js";

// ── Charge le SDK une seule fois ─────────────────────────────────────────────
function loadSDK() {
  return new Promise((resolve, reject) => {
    if (window.CinetPay) return resolve();

    const existing = document.querySelector(`script[src="${SDK_URL}"]`);
    if (existing) {
      existing.addEventListener("load",  resolve);
      existing.addEventListener("error", reject);
      return;
    }

    const script  = document.createElement("script");
    script.src    = SDK_URL;
    script.async  = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Impossible de charger le SDK CinetPay"));
    document.head.appendChild(script);
  });
}

// ── Fonction principale exportée ─────────────────────────────────────────────
/**
 * @param {Object}   options
 * @param {Object}   options.user          - { name, email, phone }
 * @param {number}   options.amount        - Montant en FCFA (≥ 100)
 * @param {string}   options.description   - Libellé affiché dans la popup
 * @param {string}   [options.transactionId] - Référence unique (générée auto si absent)
 * @param {Function} options.onSuccess     - Appelé avec (data, transactionId) si ACCEPTED
 * @param {Function} options.onError       - Appelé avec ({ message }) si échec / annulation
 */
export async function payWithCinetPay({
  user        = {},
  amount,
  description = "Paiement Awoundjô",
  transactionId,
  onSuccess,
  onError,
}) {
  // Générer un txId unique si non fourni
  const txId = transactionId
    || `AWJ-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  try {
    await loadSDK();
  } catch (e) {
    onError?.({ message: "SDK CinetPay indisponible. Vérifiez votre connexion." });
    return;
  }

  if (!window.CinetPay || typeof window.CinetPay.init !== "function") {
    onError?.({ message: "SDK CinetPay non initialisé." });
    return;
  }

  window.CinetPay.init({
    apikey:         CINETPAY_API_KEY,
    site_id:        CINETPAY_SITE_ID,
    notify_url:     `${getBackendUrl()}/api/payments/cinetpay/notify`,
    mode:           "PRODUCTION",          // "TEST" pour les tests sandbox
    currency:       "XOF",
    amount,
    transaction_id: txId,
    description,
    customer_name:         user.name  || "",
    customer_surname:      "",
    customer_email:        user.email || "",
    customer_phone_number: user.phone || "",
    customer_address:      "Abidjan",
    customer_city:         "Abidjan",
    customer_country:      "CI",
    customer_state:        "CI",
    customer_zip_code:     "00225",

    // ── Paiement accepté ──────────────────────────────────────────────────
    close_after_payment: true,
    onClose: () => {
      // La popup s'est fermée sans confirmation explicite → traité dans onError
    },
  });

  // ── Écouter les événements du SDK ────────────────────────────────────────
  window.CinetPay.waitResponse(function (data) {
    if (data.status === "ACCEPTED") {
      onSuccess?.(data, txId);
    } else {
      onError?.({
        message: data.message || `Paiement ${data.status || "non abouti"}.`,
        data,
      });
    }
  });

  window.CinetPay.onError(function (data) {
    onError?.({
      message: data?.message || "Erreur CinetPay inattendue.",
      data,
    });
  });
}

// ── Helpers internes ─────────────────────────────────────────────────────────
function getBackendUrl() {
  // Priorité : variable d'environnement Vite, sinon URL Railway par défaut
  return (
    import.meta?.env?.VITE_API_URL ||
    "https://awoundjo-backend-production-ba8c.up.railway.app"
  );
}
