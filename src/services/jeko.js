// src/services/jeko.js
// ─────────────────────────────────────────────────────────────────────────────
//  Service JEKO Pay-in — Awoundjô
//  Le frontend appelle le backend Railway (proxy),
//  qui lui appelle api.jeko.africa — évite les erreurs CORS navigateur.
//
//  Flux :
//    payWithJeko(options)
//      → POST /api/payments/jeko/init         (backend Railway)
//      → backend → POST api.jeko.africa/partner_api/payment_requests
//      → backend retourne { redirect_url, payment_id }
//      → window.location.href = redirect_url  (redirection Wave/OM/MTN)
// ─────────────────────────────────────────────────────────────────────────────

const BACKEND_URL =
  import.meta?.env?.VITE_API_URL ||
  "https://awoundjo-backend-production-ba8c.up.railway.app";

/**
 * @param {Object}   options
 * @param {Object}   [options.user]          - { name, email, phone }
 * @param {number}   options.amount          - Montant en FCFA (ex: 15000)
 * @param {string}   [options.description]   - Libellé du paiement
 * @param {string}   [options.transactionId] - Référence unique (générée auto si absent)
 * @param {string}   [options.type]          - "adhesion" | "mensualite" (défaut: "adhesion")
 * @param {string}   [options.clientId]      - ID client Awoundjô (pour maj DB)
 * @param {string}   [options.ambassadorId]  - ID ambassadeur (flux ambassadeur)
 * @param {string}   [options.role]          - Rôle ambassadeur (flux pending_payments)
 * @param {Object}   [options.formData]      - Données formulaire (flux ambassadeur)
 * @param {string}   [options.successPath]   - Chemin retour succès (ex: /client/cotisations)
 * @param {string}   [options.failurePath]   - Chemin retour échec
 * @param {Function} options.onSuccess       - Appelé avec (transactionId) avant la redirection
 * @param {Function} options.onError         - Appelé avec ({ message }) en cas d'échec
 */
export async function payWithJeko({
  user          = {},
  amount,
  description   = "Paiement Awoundjô",
  transactionId,
  type          = "adhesion",
  clientId,
  ambassadorId,
  role,
  formData,
  successPath   = "/client/cotisations",
  failurePath   = "/client/cotisations",
  onSuccess,
  onError,
}) {
  const txId =
    transactionId ||
    `AWJ-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const origin = window.location.origin;

  try {
    const res = await fetch(`${BACKEND_URL}/api/payments/jeko/init`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        amount:         Number(amount),
        description,
        transaction_id: txId,
        type,
        client_id:      clientId      || undefined,
        ambassador_id:  ambassadorId  || undefined,
        role:           role          || undefined,
        form_data:      formData      || undefined,
        client_name:    user.name     || "",
        client_email:   user.email    || "",
        client_phone:   user.phone    || "",
        success_url:    `${origin}${successPath}?payment=success&tx=${txId}`,
        failure_url:    `${origin}${failurePath}?payment=failed&tx=${txId}`,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.data?.redirect_url) {
      throw new Error(data.message || "URL de paiement JEKO non reçue");
    }

    // Informer l'UI avant la redirection
    onSuccess?.(txId);

    // Redirection vers Wave / Orange Money / MTN / Djamo
    window.location.href = data.data.redirect_url;

  } catch (err) {
    onError?.({ message: err.message || "Erreur JEKO inattendue." });
  }
}
