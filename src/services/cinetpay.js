// src/services/cinetpay.js
// ─────────────────────────────────────────────────────────────────────────────
//  Service CinetPay — Awoundjô
//  Nouvelle API CinetPay : authentification JWT + initiation de paiement
//
//  Flux :
//    payWithCinetPay(options)
//      → POST /v1/oauth/login          (obtenir access_token)
//      → POST /v1/payment              (initier paiement → payment_url)
//      → window.open(payment_url)      (redirection vers la page de paiement)
//      → onSuccess(transactionId)      après retour sur return_url
//      → onError({ message })          en cas d'échec
// ─────────────────────────────────────────────────────────────────────────────

const CINETPAY_API_KEY      = import.meta?.env?.VITE_CINETPAY_API_KEY      || "sk_test_LdEkz9cTAzd0HfejlHzBbztz";
const CINETPAY_API_PASSWORD = import.meta?.env?.VITE_CINETPAY_API_PASSWORD || "";
const CINETPAY_BASE_URL     = "https://api-checkout.cinetpay.com/v2";

// ── 1. Obtenir le token JWT ───────────────────────────────────────────────────
async function getAccessToken() {
  const res = await fetch(`${CINETPAY_BASE_URL}/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey:      CINETPAY_API_KEY,
      site_id:     import.meta?.env?.VITE_CINETPAY_SITE_ID || "622448",
    }),
  });

  // Note : certaines versions de l'API retournent directement le token dans la réponse de paiement.
  // Si votre endpoint d'authentification est séparé, utilisez la logique ci-dessous.
  const data = await res.json();
  if (data.code !== 200 || !data.access_token) {
    throw new Error(data.message || "Impossible d'obtenir le token CinetPay");
  }
  return data.access_token;
}

// ── 2. Initier un paiement ────────────────────────────────────────────────────
async function initiatePayment({ accessToken, amount, description, transactionId, user, notifyUrl, returnUrl }) {
  const res = await fetch(`${CINETPAY_BASE_URL}/payment`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      transaction_id:        transactionId,
      amount,
      currency:              "XOF",
      description,
      notify_url:            notifyUrl,
      return_url:            returnUrl,
      customer_name:         user?.name  || "",
      customer_email:        user?.email || "",
      customer_phone_number: user?.phone || "",
      customer_address:      "Abidjan",
      customer_city:         "Abidjan",
      customer_country:      "CI",
      customer_state:        "CI",
      customer_zip_code:     "00225",
      channels:              "ALL",  // Tous les canaux disponibles (MTN, Orange, Moov, etc.)
    }),
  });

  const data = await res.json();
  if (data.code !== 201 && data.code !== 200) {
    throw new Error(data.message || "Impossible d'initier le paiement");
  }
  return data; // Contient payment_url, transaction_id, etc.
}

// ── Fonction principale exportée ──────────────────────────────────────────────
/**
 * @param {Object}   options
 * @param {Object}   [options.user]          - { name, email, phone }
 * @param {number}   options.amount          - Montant en FCFA (≥ 100)
 * @param {string}   [options.description]   - Libellé du paiement
 * @param {string}   [options.transactionId] - Référence unique (générée auto si absent)
 * @param {Function} options.onSuccess       - Appelé avec (transactionId) après initiation
 * @param {Function} options.onError         - Appelé avec ({ message }) en cas d'échec
 */
export async function payWithCinetPay({
  user        = {},
  amount,
  description = "Paiement Awoundjô",
  transactionId,
  onSuccess,
  onError,
}) {
  const txId =
    transactionId ||
    `AWJ-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const backendUrl = import.meta?.env?.VITE_API_URL || "https://awoundjo-backend-production-ba8c.up.railway.app";

  try {
    // ── Étape 1 : Token JWT ──────────────────────────────────────────────────
    let accessToken;
    try {
      accessToken = await getAccessToken();
    } catch {
      // Fallback : certaines API CinetPay n'ont pas d'endpoint auth séparé.
      // Dans ce cas, on passe directement à l'initiation avec la clé API.
      accessToken = null;
    }

    // ── Étape 2 : Initier le paiement ────────────────────────────────────────
    const paymentData = await initiatePayment({
      accessToken,
      amount,
      description,
      transactionId: txId,
      user,
      notifyUrl: `${backendUrl}/api/payments/cinetpay/notify`,
      returnUrl: `${window.location.origin}/client/cotisations?payment=success&tx=${txId}`,
    });

    if (!paymentData.data?.payment_url) {
      throw new Error("URL de paiement non reçue");
    }

    // ── Étape 3 : Redirection vers la page de paiement ──────────────────────
    window.location.href = paymentData.data.payment_url;

    // onSuccess est appelé ici pour que l'UI puisse afficher un état "redirection en cours".
    // La confirmation réelle vient du webhook notify_url côté backend.
    onSuccess?.(txId);

  } catch (err) {
    onError?.({ message: err.message || "Erreur CinetPay inattendue." });
  }
}
