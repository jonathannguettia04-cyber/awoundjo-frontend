// src/services/cinetpay.js
// ─────────────────────────────────────────────────────────────
//  Service paiement CinetPay — Awoundjô
//  Ouvre la page de paiement dans un NOUVEL ONGLET
//  via l'API REST CinetPay (pas le SDK popup)
// ─────────────────────────────────────────────────────────────

const API_URL     = import.meta.env.VITE_API_URL || "http://localhost:3001";
const APIKEY      = import.meta.env.VITE_CINETPAY_API_KEY;
const SITE_ID     = import.meta.env.VITE_CINETPAY_SITE_ID;
const NOTIFY_URL  = `${API_URL}/api/payments/cinetpay/notify`;
const RETURN_URL  = `${window.location.origin}/client/cotisations?payment=success`;
const CANCEL_URL  = `${window.location.origin}/client/cotisations?payment=cancelled`;

/**
 * Génère un lien de paiement CinetPay et l'ouvre dans un nouvel onglet.
 *
 * @param {Object}   user          - { name, email, phone }
 * @param {number}   amount        - Montant en XOF (ex: 15000)
 * @param {string}   description   - Description affichée sur la page de paiement
 * @param {string}   transactionId - Identifiant unique (ex: `AWJ-${Date.now()}`)
 * @param {Function} onSuccess     - Callback appelé après génération du lien → (txId)
 * @param {Function} onError       - Callback appelé en cas d'erreur → ({ message })
 */
export async function payWithCinetPay({
  user,
  amount = 15000,
  description = "Cotisation mensuelle Awoundjô",
  transactionId,
  onSuccess,
  onError,
}) {
  const txId =
    transactionId ||
    `AWJ-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  try {
    // ── 1. Appel API CinetPay pour générer le lien de paiement ──────────────
    const res = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey:                APIKEY,
        site_id:               SITE_ID,
        transaction_id:        txId,
        amount:                amount,
        currency:              "XOF",
        channels:              "ALL",
        description:           description,
        notify_url:            NOTIFY_URL,
        return_url:            RETURN_URL,
        cancel_url:            CANCEL_URL,
        customer_name:         user.name  || "",
        customer_email:        user.email || "client@awoundjo.ci",
        customer_phone_number: user.phone || "",
        customer_country:      "CI",
        customer_state:        "CI",
        customer_city:         "Abidjan",
        customer_zip_code:     "00225",
      }),
    });

    const data = await res.json();
    console.log("[CinetPay] réponse API :", data);

    // ── 2. Vérifier la réponse ───────────────────────────────────────────────
    if (data.code !== "201" && data.code !== 201) {
      console.error("[CinetPay] Erreur API :", data);
      onError?.({ message: data.message || "Erreur lors de la création du paiement." });
      return;
    }

    const paymentUrl = data.data?.payment_url;
    if (!paymentUrl) {
      onError?.({ message: "Lien de paiement introuvable dans la réponse CinetPay." });
      return;
    }

    // ── 3. Ouvrir la page de paiement dans un nouvel onglet ─────────────────
    window.open(paymentUrl, "_blank");

    // ── 4. Notifier le composant que le lien a bien été ouvert ──────────────
    onSuccess?.(data, txId);

  } catch (err) {
    console.error("[CinetPay] Erreur réseau :", err.message);
    onError?.({ message: "Impossible de contacter CinetPay. Vérifiez votre connexion." });
  }
}
