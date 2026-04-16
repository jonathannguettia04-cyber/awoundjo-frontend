// src/pages/client/ClientCotisations.jsx
import { useState, useEffect } from "react";
import { clientContribAPI } from "../../clientApi";

const C = {
  primary: "#059669", primaryL: "#ECFDF5",
  blue:    "#1B4FD8", blueL:    "#EEF2FF",
  gold:    "#D97706", goldL:    "#FFFBEB",
  red:     "#DC2626", redL:     "#FEF2F2",
  slate:   "#64748B", dark:     "#0F172A",
  border:  "#E2E8F0", bg:       "#F8FAFC",
  cinet:   "#0072C6", cinetL:   "#EFF6FF",
  pdunya:  "#00B09B", pdunyaL:  "#E6F7F5",
};

const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" })
  : "—";

const PLAN_PRICES = {
  BASIQUE:     5000,
  ESSENTIELLE: 10000,
  IVOIRIENNE:  15000,
  TURQUOISE:   35000,
};

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16,
      border: `1px solid ${C.border}`,
      boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
      padding: 20, ...style,
    }}>
      {children}
    </div>
  );
}

function Badge({ label, color, bg }) {
  return (
    <span style={{
      background: bg, color, padding: "3px 12px",
      borderRadius: 999, fontSize: 11, fontWeight: 700,
    }}>
      {label}
    </span>
  );
}

function Loader() {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:"48px 0" }}>
      <div style={{
        width: 36, height: 36,
        border: `3px solid ${C.primaryL}`,
        borderTop: `3px solid ${C.primary}`,
        borderRadius: "50%",
        animation: "spin .8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function statusStyle(status) {
  if (status === "payé"    || status === "paid")    return { color: C.primary, bg: C.primaryL, label: "✅ Payé"        };
  if (status === "attente" || status === "pending") return { color: C.gold,    bg: C.goldL,    label: "⏳ En attente"  };
  if (status === "retard"  || status === "overdue") return { color: C.red,     bg: C.redL,     label: "🔴 En retard"   };
  return                                                    { color: C.slate,  bg: C.bg,       label: status           };
}

// ── Écran bloquant si validation en cours ────────────────────────────────────
function ValidationPendingScreen({ client }) {
  return (
    <div style={{ padding: "20px 16px", maxWidth: 560, margin: "0 auto" }}>
      <Card style={{ textAlign: "center", padding: "40px 28px" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
        <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 900, color: C.dark }}>
          Compte en attente de validation
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: C.slate, lineHeight: 1.6 }}>
          Votre compte a bien été créé. Un administrateur doit le valider avant
          que vous puissiez effectuer votre paiement d'adhésion.
        </p>
        <div style={{ background: C.goldL, border: `1.5px solid ${C.gold}44`, borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: C.gold, fontWeight: 700 }}>Numéro mutualiste</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.dark, fontFamily: "monospace" }}>
            {client?.mutual_number || "—"}
          </p>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: C.slate }}>
          Vous recevrez une notification dès que votre compte sera validé.
        </p>
      </Card>
    </div>
  );
}

function ValidationRejectedScreen() {
  return (
    <div style={{ padding: "20px 16px", maxWidth: 560, margin: "0 auto" }}>
      <Card style={{ textAlign: "center", padding: "40px 28px" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
        <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 900, color: C.red }}>
          Compte refusé
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: C.slate, lineHeight: 1.6 }}>
          Votre demande d'adhésion a été refusée par l'administration.
          Contactez-nous pour plus d'informations.
        </p>
        <a href="tel:+22500000000" style={{
          display: "inline-block", padding: "10px 24px",
          background: C.primary, color: "#fff",
          borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: "none",
        }}>
          📞 Contacter le support
        </a>
      </Card>
    </div>
  );
}

export default function ClientCotisations() {
  const [client,      setClient]      = useState(null);
  const [cotisations, setCotisations] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [payLoading,  setPayLoading]  = useState(false);
  const [payError,    setPayError]    = useState("");
  const [payStatus,   setPayStatus]   = useState(null); // "success" | "failed" | null
  const [payMethod,   setPayMethod]   = useState("cinetpay"); // "cinetpay" | "paydunya"

  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const tx      = params.get("tx");

    if (payment === "success") {
      setPayStatus("success");
      if (tx) {
        clientContribAPI.confirm({ transaction_id: tx }).catch(() => {});
      }
    } else if (payment === "failed") {
      setPayStatus("failed");
    }

    if (payment) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    const token   = localStorage.getItem("client_token");
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    Promise.all([
  fetch(`${BASE}/api/client/profile`,       { headers }).then(r => r.json()),
  fetch(`${BASE}/api/client/contributions`, { headers }).then(r => r.json()),
]).then(([me, cots]) => {
  setClient(me.data || me);
  setCotisations(cots.data?.payments || []);
}).catch(() => {
  // Données de démo
  setClient({
    name: "Jean Koua", mutual_number: "AWJ-2024-0042",
    plan: "IVOIRIENNE", status: "actif",
    status_validation: "approved", status_payment: "paid",
    monthly_amount: 15000,
  });
  setCotisations([
    { id:1, created_at:"2024-12-05", amount:15000, status:"paid",    paid_at:"2024-12-05", payment_method:"cinetpay" },
    { id:2, created_at:"2025-01-07", amount:15000, status:"paid",    paid_at:"2025-01-07", payment_method:"cinetpay" },
    { id:3, created_at:"2025-02-04", amount:15000, status:"paid",    paid_at:"2025-02-04", payment_method:"cinetpay" },
    { id:4, created_at:"2025-03-01", amount:15000, status:"pending", paid_at:null,         payment_method:null       },
  ]);
}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  // ── Gardes validation ────────────────────────────────────────────────────
  if (client?.status_validation === "pending") {
    return <ValidationPendingScreen client={client} />;
  }
  if (client?.status_validation === "rejected") {
    return <ValidationRejectedScreen />;
  }

  const plan    = client?.plan || "IVOIRIENNE";
  const monthly = client?.monthly_amount ?? PLAN_PRICES[plan] ?? 15000;
  const pending   = cotisations.find(c => c.status === "attente" || c.status === "pending");
  const paidCount = cotisations.filter(c => c.status === "payé" || c.status === "paid").length;
  const totalPaid = cotisations
    .filter(c => c.status === "payé" || c.status === "paid")
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const now          = new Date();
  const currentMonth = now.getMonth();
  const currentYear  = now.getFullYear();

  const firstPaid = cotisations
    .filter(c => c.status === "payé" || c.status === "paid")
    .sort((a, b) => new Date(a.paid_at) - new Date(b.paid_at))[0];

  let monthsAhead = 0;
  if (firstPaid && paidCount > 0) {
    const start = new Date(firstPaid.paid_at);
    const monthsElapsed =
      (currentYear - start.getFullYear()) * 12 + (currentMonth - start.getMonth()) + 1;
    monthsAhead = paidCount - monthsElapsed;
  }

  const isUpToDate = !pending && paidCount > 0;

  // ── Déclencheur paiement CinetPay — appel direct à /api/payments/cinetpay/init-web
  const handleCinetPay = async () => {
    setPayError("");
    setPayStatus(null);
    setPayLoading(true);

    try {
      const token   = localStorage.getItem("client_token");
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const amount  = pending?.amount || monthly;

      // ── Étape 1 : pré-enregistrer via /api/payments/init ─────────────
      // (optionnel si tu veux tracer côté backend avant redirection)
      // Pour le portail client on appelle init-web directement

      const txId = `AWJ-CLI-${Date.now()}`;

      const initRes = await fetch(`${BASE}/api/payments/cinetpay/init-web`, {
        method:  "POST",
        headers,
        body: JSON.stringify({
          amount,
          transaction_id: txId,
          description:    `Cotisation Awoundjô — ${client?.name || ""} (${client?.mutual_number || ""})`,
          client_name:    client?.name  || "Client",
          client_email:   client?.email || "client@awoundjo.ci",
          client_phone:   client?.phone || "",
          success_url: `${window.location.origin}/client/cotisations?payment=success&tx=${txId}`,
          failed_url:  `${window.location.origin}/client/cotisations?payment=failed`,
          notify_url:  `${BASE}/api/payments/cinetpay/notify`,
        }),
      });

      const initData = await initRes.json();

      // ── Lire payment_url — double .data géré ─────────────────────────
      const paymentUrl =
        initData?.data?.payment_url   ||
        initData?.payment_url          ||
        null;

      if (!paymentUrl) {
        console.error("[ClientCotisations] réponse init-web :", initData);
        throw new Error(initData?.error || "URL de paiement non reçue du serveur");
      }

      // Redirection vers la page de paiement CinetPay
      window.location.href = paymentUrl;

    } catch (e) {
      setPayError(e.message || "Le paiement a échoué. Veuillez réessayer.");
      setPayLoading(false);
    }
  };


  // ── Déclencheur paiement PayDunya ─────────────────────────────────────────
  const handlePayDunya = async () => {
    setPayError("");
    setPayStatus(null);
    setPayLoading(true);

    try {
      const token   = localStorage.getItem("client_token");
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const amount  = pending?.amount || monthly;
      const txId    = `AWJ-CLI-PD-${Date.now()}`;

      const initRes = await fetch(`${BASE}/api/payments/paydunya/init-web`, {
        method:  "POST",
        headers,
        body: JSON.stringify({
          amount,
          transaction_id: txId,
          description:    `Cotisation Awoundjô — ${client?.name || ""} (${client?.mutual_number || ""})`,
          client_id:      client?.id    || undefined,
          client_name:    client?.name  || "Client",
          client_email:   client?.email || "client@awoundjo.ci",
          client_phone:   client?.phone || "",
          type:           "mensualite",
          success_url: `${window.location.origin}/client/cotisations?payment=success&tx=${txId}`,
          cancel_url:  `${window.location.origin}/client/cotisations?payment=failed`,
          return_url:  `${window.location.origin}/client/cotisations?payment=success&tx=${txId}`,
          notify_url:  `${BASE}/api/payments/paydunya/notify`,
        }),
      });

      const initData = await initRes.json();
      const paymentUrl =
        initData?.data?.payment_url ||
        initData?.payment_url       ||
        null;

      if (!paymentUrl) {
        console.error("[ClientCotisations] PayDunya réponse:", initData);
        throw new Error(initData?.error || "URL de paiement PayDunya non reçue");
      }

      window.location.href = paymentUrl;

    } catch (e) {
      setPayError(e.message || "Le paiement PayDunya a échoué. Veuillez réessayer.");
      setPayLoading(false);
    }
  };

  const handlePay = () => payMethod === "paydunya" ? handlePayDunya() : handleCinetPay();

  return (
    <div style={{ padding: "20px 16px", maxWidth: 720, margin: "0 auto" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Bannière retour CinetPay ─────────────────────────────────── */}
      {payStatus === "success" && (
        <div style={{
          marginBottom: 20, padding: "14px 18px", borderRadius: 12,
          background: C.primaryL, border: `1.5px solid ${C.primary}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 22 }}>✅</span>
          <div>
            <p style={{ margin: 0, fontWeight: 800, color: C.primary, fontSize: 14 }}>Paiement confirmé !</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.primary }}>
              Votre cotisation a bien été enregistrée.
            </p>
          </div>
          <button onClick={() => setPayStatus(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.primary }}>
            ✕
          </button>
        </div>
      )}

      {payStatus === "failed" && (
        <div style={{
          marginBottom: 20, padding: "14px 18px", borderRadius: 12,
          background: C.redL, border: `1.5px solid ${C.red}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 22 }}>❌</span>
          <div>
            <p style={{ margin: 0, fontWeight: 800, color: C.red, fontSize: 14 }}>Paiement annulé ou refusé</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.red }}>
              Votre paiement n'a pas abouti. Vous pouvez réessayer ci-dessous.
            </p>
          </div>
          <button onClick={() => setPayStatus(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.red }}>
            ✕
          </button>
        </div>
      )}

      {/* ── Carte identité client ───────────────────────────────── */}
      <Card style={{ marginBottom: 20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: C.dark }}>{client?.name}</p>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: C.slate, fontFamily: "monospace" }}>
            {client?.mutual_number}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Badge label={`Plan ${plan}`}            color={C.primary} bg={C.primaryL} />
          <Badge label={fmt(monthly) + " / mois"}  color={C.blue}    bg={C.blueL}    />
        </div>
      </Card>

      {/* ── Cartes résumé ───────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { icon: "✅", label: "Total payé",    value: fmt(totalPaid),                                        color: C.primary, bg: C.primaryL },
          { icon: "📅", label: "Mensualité",    value: fmt(monthly),                                          color: C.blue,    bg: C.blueL    },
          { icon: "🧾", label: "Paiements",     value: `${paidCount} / ${cotisations.length}`,               color: C.gold,    bg: C.goldL    },
          { icon: "⏩", label: "Mois d'avance", value: monthsAhead > 0 ? `+${monthsAhead} mois` : "À jour",
            color: monthsAhead > 0 ? C.primary : C.slate,
            bg:    monthsAhead > 0 ? C.primaryL : C.bg },
        ].map(s => (
          <Card key={s.label} style={{ textAlign: "center", padding: "16px 12px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 28 }}>{s.icon}</p>
            <p style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 11, color: C.slate, fontWeight: 600 }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* ── Bloc paiement — CinetPay + PayDunya ──────────────────── */}
      <Card style={{
        marginBottom: 20,
        border: `2px solid ${isUpToDate ? C.primary : (payMethod === "paydunya" ? C.pdunya : C.cinet)}`,
        background: isUpToDate ? C.primaryL : (payMethod === "paydunya" ? C.pdunyaL : C.cinetL),
      }}>

        {/* Montant + badge à jour */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, color: C.slate, fontWeight: 600 }}>
            {isUpToDate ? "COTISATION — PAYER EN AVANCE" : "COTISATION EN COURS"}
          </p>

          {isUpToDate && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.primary, borderRadius: 20, padding: "4px 12px", marginBottom: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>À JOUR</span>
            </div>
          )}

          {pending && (
            <p style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 900, color: C.dark }}>
              {fmtDate(pending.createdAt)}
            </p>
          )}

          <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: isUpToDate ? C.primary : (payMethod === "paydunya" ? C.pdunya : C.cinet) }}>
            {fmt(pending?.amount || monthly)}
          </p>

          {monthsAhead > 0 && (
            <p style={{ margin: "6px 0 0", fontSize: 12, color: C.primary, fontWeight: 600 }}>
              ⏩ Vous êtes en avance de <strong>{monthsAhead} mois</strong>
            </p>
          )}
        </div>

        {/* ── Sélecteur de méthode de paiement ─────────────────────── */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, color: C.slate, fontWeight: 700 }}>
            CHOISIR LA MÉTHODE DE PAIEMENT
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { id: "cinetpay", label: "💳 CinetPay",  desc: "MTN, Orange, Moov, Wave, carte…", color: C.cinet,  bg: C.cinetL  },
              { id: "paydunya", label: "🌿 PayDunya",   desc: "Mobile Money, Wave, carte…",       color: C.pdunya, bg: C.pdunyaL },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setPayMethod(m.id)}
                style={{
                  padding: "10px 16px",
                  border: `2px solid ${payMethod === m.id ? m.color : C.border}`,
                  borderRadius: 10,
                  background: payMethod === m.id ? m.bg : "#fff",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  flex: 1, minWidth: 140,
                  textAlign: "left",
                  transition: "all .15s",
                }}
              >
                <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: payMethod === m.id ? m.color : C.dark }}>
                  {m.label}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: C.slate }}>{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Bouton payer ─────────────────────────────────────────── */}
        <button
          onClick={handlePay}
          disabled={payLoading}
          style={{
            width: "100%",
            padding: "13px 22px",
            background: payLoading
              ? "#94a3b8"
              : isUpToDate
                ? "linear-gradient(135deg,#059669,#047857)"
                : payMethod === "paydunya"
                  ? "linear-gradient(135deg,#00B09B,#008a78)"
                  : "linear-gradient(135deg,#0072C6,#005A9E)",
            color: "#fff", fontWeight: 900, fontSize: 15,
            border: "none", borderRadius: 12,
            cursor: payLoading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            boxShadow: payLoading ? "none" : "0 4px 16px rgba(0,0,0,.18)",
            transition: "all .2s",
          }}
        >
          {payLoading ? (
            <>
              <div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,.4)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
              Redirection en cours…
            </>
          ) : (
            <>
              💳 {isUpToDate ? "Payer en avance" : `Payer avec ${payMethod === "paydunya" ? "PayDunya" : "CinetPay"}`}
            </>
          )}
        </button>

        {payError && (
          <div style={{ marginTop:12, background:C.redL, border:`1px solid ${C.red}33`, borderRadius:8, padding:"10px 14px" }}>
            <p style={{ margin:0, fontSize:12, color:C.red, fontWeight:600 }}>⚠️ {payError}</p>
          </div>
        )}

        <div style={{
          marginTop: 14, paddingTop: 12,
          borderTop: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>ℹ️</span>
          <p style={{ margin: 0, fontSize: 12, color: C.slate }}>
            {isUpToDate
              ? "Votre cotisation est à jour. Vous pouvez payer des mois à l'avance pour rester serein."
              : "Vous serez redirigé vers la page de paiement sécurisée. Paiement 100% sécurisé."
            }
          </p>
        </div>
      </Card>

      {/* ── Historique des cotisations ──────────────────────── */}
      <Card>
        <p style={{ margin: "0 0 16px", fontWeight: 800, fontSize: 15, color: C.dark }}>
          📋 Historique des paiements
        </p>

        {cotisations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ fontSize: 36, margin: "0 0 10px" }}>🧾</p>
            <p style={{ margin: 0, color: C.slate, fontSize: 14 }}>Aucun historique disponible</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {cotisations.map((cot, i) => {
              const s = statusStyle(cot.status);
              const isPending = cot.status === "attente" || cot.status === "pending";
              return (
                <div
                  key={cot.id || i}
                  style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 4px",
                    borderTop: i > 0 ? `1px solid ${C.border}` : "none",
                    flexWrap: "wrap", gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: isPending ? C.goldL : C.primaryL,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, flexShrink: 0,
                    }}>
                      {isPending ? "⏳" : "✅"}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: C.dark }}>
                        {fmtDate(cot.createdAt)}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: C.slate }}>
                        {cot.paid_at ? `Payé le ${fmtDate(cot.paid_at)}` : "Non payé"}
                        {cot.method === "cinetpay" && (
                          <span style={{ marginLeft: 6, color: C.cinet, fontWeight: 700 }}>· 💳 CinetPay</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: isPending ? C.gold : C.primary }}>
                      {fmt(cot.amount || monthly)}
                    </span>
                    <Badge label={s.label} color={s.color} bg={s.bg} />
                    {isPending && (
                      <button
                        onClick={handlePay}
                        disabled={payLoading}
                        style={{
                          padding: "6px 14px",
                          background: payMethod === "paydunya"
                            ? "linear-gradient(135deg,#00B09B,#008a78)"
                            : "linear-gradient(135deg,#0072C6,#005A9E)",
                          color: "#fff", fontWeight: 700, fontSize: 12,
                          border: "none", borderRadius: 8,
                          cursor: payLoading ? "not-allowed" : "pointer",
                          fontFamily: "inherit",
                          display: "flex", alignItems: "center", gap: 6,
                        }}
                      >
                        💳 Payer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <p style={{ textAlign: "center", fontSize: 12, color: C.slate, marginTop: 20 }}>
        🔒 Paiements sécurisés via CinetPay & PayDunya · Awoundjô Mutuelle Santé CI<br />
        En cas de problème : <strong>+225 01 71 72 16 68</strong>
      </p>
    </div>
  );
}
