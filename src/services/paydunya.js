// src/services/paydunya.js
// ─────────────────────────────────────────────────────────────────────────────
//  Service PayDunya PAR (Paiement Avec Redirection) — Awoundjô
//
//  Le frontend appelle le backend Railway (proxy),
//  qui lui appelle app.paydunya.com — évite les erreurs CORS navigateur.
//
//  Flux PAR :
//    payWithPayDunya(options)
//      → POST /api/payments/paydunya/init-web        (backend Railway)
//      → backend → POST paydunya.com/checkout-invoice/create
//      → PayDunya répond { response_code: "00", response_text: "<url>", token }
//        (response_text = l'URL directe de la page de paiement)
//      → backend retourne { data: { payment_url, transaction_id, token } }
//      → window.location.href = payment_url          (redirection vers PayDunya)
//      → client paie (Orange Money CI / Wave CI / MTN CI / Moov CI)
//      → PayDunya POST IPN (urlencoded) → /api/payments/paydunya/notify
//      → backend vérifie hash SHA-512(MASTER_KEY) + double-check API confirm
//      → backend active client / ambassadeur en DB
//
//  Vérification du statut :
//    checkPayDunyaStatus(invoiceToken)
//      → GET /api/payments/paydunya/check/:token
//      → statuts : "completed" | "pending" | "cancelled" | "failed"
// ─────────────────────────────────────────────────────────────────────────────

const BACKEND_URL =
  import.meta?.env?.VITE_API_URL ||
  "https://awoundjo-backend-production-ba8c.up.railway.app";

/**
 * Initie un paiement PayDunya PAR et redirige le client vers la page de paiement.
 *
 * @param {Object}   options
 * @param {Object}   [options.user]           - { name, email, phone } — pré-remplit la page PayDunya
 * @param {number}   options.amount           - Montant en FCFA (min 100)
 * @param {string}   [options.description]    - Libellé affiché sur la facture PayDunya
 * @param {string}   [options.transactionId]  - Référence unique (générée auto si absent)
 * @param {string}   [options.type]           - "adhesion" | "mensualite" (défaut : "adhesion")
 * @param {string}   [options.clientId]       - UUID du client (flux cotisation portail)
 * @param {string}   [options.ambassadorId]   - UUID de l'ambassadeur (flux diaspora)
 * @param {string}   [options.role]           - Rôle ambassadeur si flux diaspora
 * @param {string}   [options.successUrl]     - URL retour après paiement réussi
 * @param {string}   [options.failedUrl]      - URL retour après annulation / échec
 * @param {string}   [options.token]          - JWT Authorization si route protégée
 * @param {Function} [options.onSuccess]      - Appelé avec (transactionId, invoiceToken) avant la redirection
 * @param {Function} [options.onError]        - Appelé avec ({ message }) en cas d'échec
 */
export async function payWithPayDunya({
  user         = {},
  amount,
  description  = "Cotisation / Adhésion Awoundjô",
  transactionId,
  type         = "adhesion",
  clientId,
  ambassadorId,
  role,
  successUrl,
  failedUrl,
  token,
  onSuccess,
  onError,
}) {
  const txId =
    transactionId ||
    `AWJ-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const origin = window.location.origin;

  try {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BACKEND_URL}/api/payments/paydunya/init-web`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        amount:         Number(amount),
        description,
        transaction_id: txId,
        type,
        client_name:   user.name  || "",
        client_email:  user.email || "",
        client_phone:  user.phone || "",
        client_id:     clientId     || null,
        ambassador_id: ambassadorId || null,
        role:          role         || null,
        // PayDunya redirige ici après paiement (return_url dans la doc)
        success_url: successUrl || `${origin}/client/cotisations?payment=success&tx=${txId}`,
        // PayDunya redirige ici après annulation (cancel_url dans la doc)
        failed_url:  failedUrl  || `${origin}/client/cotisations?payment=cancelled&tx=${txId}`,
      }),
    });

    const data = await res.json();

    // data.data.payment_url = response_text de PayDunya (URL directe page paiement)
    // data.data.token       = token PayDunya pour vérification ultérieure via checkPayDunyaStatus
    if (!res.ok || !data.data?.payment_url) {
      throw new Error(data.error || data.message || "URL de paiement non reçue");
    }

    // Informer l'UI avant la redirection (ex: stocker txId pour polling au retour)
    onSuccess?.(txId, data.data.token);

    // Redirection vers la page PayDunya — le client choisit son opérateur CI
    window.location.href = data.data.payment_url;

  } catch (err) {
    onError?.({ message: err.message || "Erreur PayDunya inattendue." });
  }
}

/**
 * Vérifie manuellement le statut d'une invoice PayDunya.
 * Utile pour poller le résultat côté return_url si l'IPN n'est pas encore arrivé.
 *
 * Endpoint backend : GET /api/payments/paydunya/check/:invoiceToken
 * Endpoint PayDunya : GET /checkout-invoice/confirm/:token
 *
 * @param   {string} invoiceToken  - Token PayDunya (2e argument de onSuccess)
 * @returns {Promise<{ status: string, amount: number, customer: object, receipt_url: string }>}
 *
 * Statuts retournés par PayDunya :
 *   "completed"  → paiement réussi
 *   "pending"    → en attente de confirmation (client n'a pas encore tapé son code)
 *   "cancelled"  → annulé par le client
 *   "failed"     → échec technique
 */
export async function checkPayDunyaStatus(invoiceToken) {
  if (!invoiceToken) throw new Error("invoiceToken requis");

  const res  = await fetch(`${BACKEND_URL}/api/payments/paydunya/check/${invoiceToken}`);
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Erreur vérification PayDunya");

  // Le backend retourne data.data (normalisé via ok())
  return data.data ?? data;
}
