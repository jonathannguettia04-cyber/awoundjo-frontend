// src/services/cinetpay.js
// ─────────────────────────────────────────────────────────────────────────────
//  Service CinetPay — Awoundjô
//  API CinetPay v1.0  |  Base URL : https://api.cinetpay.net
//
//  Flux :
//    payWithCinetPay(options)
//      → POST /v1/auth                  { api_key, api_password } → access_token
//      → POST /v1/payment/web           { Authorization: Bearer <token>, ...payload }
//      → window.location.href = payment_url   (redirection vers page CinetPay)
//      → notify_url (webhook backend)   confirmation réelle côté serveur
// ─────────────────────────────────────────────────────────────────────────────

const CINETPAY_API_KEY      = import.meta?.env?.VITE_CINETPAY_API_KEY      || "";
const CINETPAY_API_PASSWORD = import.meta?.env?.VITE_CINETPAY_API_PASSWORD  || "";
const CINETPAY_BASE_URL     = "https://api.cinetpay.net/v1";

// ── Étape 1 : Authentification — obtenir le token JWT ─────────────────────────
async function getAccessToken() {
  const res = await fetch(`${CINETPAY_BASE_URL}/auth`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      api_key:      CINETPAY_API_KEY,
      api_password: CINETPAY_API_PASSWORD,
    }),
  });

  const data = await res.json();

  if (data.code !== 200 || !data.access_token) {
    throw new Error(data.message || "Authentification CinetPay échouée");
  }

  return data.access_token; // token Bearer, expire dans data.expires_in secondes
}

// ── Étape 2 : Initier le paiement web ─────────────────────────────────────────
async function initiatePayment({
  accessToken,
  amount,
  designation,
  merchantTransactionId,
  user,
  notifyUrl,
  successUrl,
  failedUrl,
}) {
  // Séparer le nom complet en prénom / nom
  const nameParts = (user?.name || "").trim().split(" ");
  const firstName = nameParts[0] || "";
  const lastName  = nameParts.slice(1).join(" ") || firstName;

  const payload = {
    currency:                "XOF",
    amount:                  Number(amount),
    merchant_transaction_id: merchantTransactionId,
    designation,
    notify_url:              notifyUrl,
    success_url:             successUrl,
    failed_url:              failedUrl,
    lang:                    "fr",
    client_first_name:       firstName,
    client_last_name:        lastName,
    client_phone_number:     user?.phone || "",
    client_email:            user?.email || "",
    direct_pay:              false,
  };

  const res = await fetch(`${CINETPAY_BASE_URL}/payment/web`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (data.code !== 200 && data.code !== 201) {
    throw new Error(data.message || `Erreur CinetPay (code: ${data.code})`);
  }

  return data;
}

// ── Fonction principale exportée ──────────────────────────────────────────────
/**
 * @param {Object}   options
 * @param {Object}   [options.user]          - { name, email, phone }
 * @param {number}   options.amount          - Montant en FCFA (ex: 15000)
 * @param {string}   [options.description]   - Libellé affiché sur la page CinetPay
 * @param {string}   [options.transactionId] - Référence unique (générée auto si absent)
 * @param {Function} options.onSuccess       - Appelé avec (transactionId) juste avant la redirection
 * @param {Function} options.onError         - Appelé avec ({ message }) en cas d'échec
 */
export async function payWithCinetPay({
  user         = {},
  amount,
  description  = "Paiement Awoundjô",
  transactionId,
  onSuccess,
  onError,
}) {
  const txId =
    transactionId ||
    `AWJ-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const backendUrl =
    import.meta?.env?.VITE_API_URL ||
    "https://awoundjo-backend-production-ba8c.up.railway.app";

  const origin = window.location.origin;

  try {
    // ── 1. Obtenir le token ──────────────────────────────────────────────────
    const accessToken = await getAccessToken();

    // ── 2. Initier le paiement ───────────────────────────────────────────────
    const paymentData = await initiatePayment({
      accessToken,
      amount,
      designation:           description,
      merchantTransactionId: txId,
      user,
      notifyUrl:  `${backendUrl}/api/payments/cinetpay/notify`,
      successUrl: `${origin}/client/cotisations?payment=success&tx=${txId}`,
      failedUrl:  `${origin}/diaspora/register-pays?payment=failed&tx=${txId}`,
    });

    if (!paymentData.data?.payment_url) {
      throw new Error("URL de paiement non reçue de CinetPay");
    }

    // ── 3. Informer l'UI puis rediriger ──────────────────────────────────────
    onSuccess?.(txId);
    window.location.href = paymentData.data.payment_url;

  } catch (err) {
    onError?.({ message: err.message || "Erreur CinetPay inattendue." });
  }
}
