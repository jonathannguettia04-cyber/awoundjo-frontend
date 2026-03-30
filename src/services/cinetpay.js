// src/services/cinetpay.js
// ─────────────────────────────────────────────────────────────────────────────
//  Service CinetPay — Awoundjô
//  Le frontend appelle le backend Railway (proxy),
//  qui lui appelle api.cinetpay.net — évite les erreurs CORS navigateur.
//
//  Flux :
//    payWithCinetPay(options)
//      → POST /api/payments/cinetpay/init-web   (backend Railway)
//      → backend → POST api.cinetpay.net/v1/auth + /v1/payment/web
//      → backend retourne { payment_url }
//      → window.location.href = payment_url     (redirection)
// ─────────────────────────────────────────────────────────────────────────────

const BACKEND_URL =
  import.meta?.env?.VITE_API_URL ||
  "https://awoundjo-backend-production-ba8c.up.railway.app";

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

  const origin = window.location.origin;

  try {
    const res = await fetch(`${BACKEND_URL}/api/payments/cinetpay/init-web`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        amount:         Number(amount),
        description,
        transaction_id: txId,
        client_name:    user.name  || "",
        client_email:   user.email || "",
        client_phone:   user.phone || "",
        success_url:    `${origin}/client/cotisations?payment=success&tx=${txId}`,
        failed_url:     `${origin}/diaspora/register-pays?payment=failed&tx=${txId}`,
        notify_url:     `${BACKEND_URL}/api/payments/cinetpay/notify`,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.data?.payment_url) {
      throw new Error(data.message || "URL de paiement non reçue");
    }

    // Informer l'UI avant la redirection
    onSuccess?.(txId);

    // Redirection vers la page CinetPay
    window.location.href = data.data.payment_url;

  } catch (err) {
    onError?.({ message: err.message || "Erreur CinetPay inattendue." });
  }
}
