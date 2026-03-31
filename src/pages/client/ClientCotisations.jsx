// src/pages/client/ClientCotisations.jsx
import { useState, useEffect } from "react";
import { payWithCinetPay } from "../../services/cinetpay";
import { clientContribAPI } from "../../clientApi";

const C = {
  primary: "#059669", primaryL: "#ECFDF5",
  blue:    "#1B4FD8", blueL:    "#EEF2FF",
  gold:    "#D97706", goldL:    "#FFFBEB",
  red:     "#DC2626", redL:     "#FEF2F2",
  slate:   "#64748B", dark:     "#0F172A",
  border:  "#E2E8F0", bg:       "#F8FAFC",
  cinet:   "#0072C6", cinetL:   "#EFF6FF",
};

const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" })
  : "—";

const PLAN_PRICES = {
  ESSENTIELLE: 10000,
  IVOIRIENNE:  15000,
  TURQUOISE:   35000,
};

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
  if (status === "payé"   || status === "paid")    return { color: C.primary, bg: C.primaryL, label: "✅ Payé"        };
  if (status === "attente"|| status === "pending")  return { color: C.gold,    bg: C.goldL,    label: "⏳ En attente"  };
  if (status === "retard" || status === "overdue")  return { color: C.red,     bg: C.redL,     label: "🔴 En retard"   };
  return                                                   { color: C.slate,   bg: C.bg,       label: status           };
}

export default function ClientCotisations() {
  const [client,      setClient]      = useState(null);
  const [cotisations, setCotisations] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [payLoading,  setPayLoading]  = useState(false);
  const [payError,    setPayError]    = useState("");
  // ── NOUVEAU : bannière retour CinetPay ────────────────────────────────────
  const [payStatus,   setPayStatus]   = useState(null); // "success" | "failed" | null

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const tx      = params.get("tx");

    if (payment === "success") {
      setPayStatus("success");
      // Confirmer le paiement côté backend
      if (tx) {
        clientContribAPI.confirm({ transaction_id: tx }).catch(() => {});
      }
    } else if (payment === "failed") {
      // ── NOUVEAU : paiement annulé ou refusé par CinetPay ─────────────────
      setPayStatus("failed");
    }

    // Nettoyer l'URL dans tous les cas
    if (payment) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    const token   = localStorage.getItem("client_token");
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const base    = import.meta.env.VITE_API_URL || "http://localhost:3001";

    Promise.all([
      fetch(`${base}/api/client/me`,         { headers }).then(r => r.json()),
      fetch(`${base}/api/client/cotisations`, { headers }).then(r => r.json()),
    ]).then(([me, cots]) => {
      setClient(me.client || me);
      setCotisations(cots.cotisations || cots.payments || []);
    }).catch(() => {
      setClient({
        name:          "Jean Koua",
        mutual_number: "AWJ-2024-0042",
        plan:          "IVOIRIENNE",
        status:        "actif",
      });
      setCotisations([
        { id:1, month:"Décembre 2024", amount:15000, status:"payé",    paid_at:"2024-12-05", method:"cinetpay" },
        { id:2, month:"Janvier 2025",  amount:15000, status:"payé",    paid_at:"2025-01-07", method:"cinetpay" },
        { id:3, month:"Février 2025",  amount:15000, status:"payé",    paid_at:"2025-02-04", method:"cinetpay" },
        { id:4, month:"Mars 2025",     amount:15000, status:"attente", paid_at: null,        method:null       },
      ]);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const plan    = client?.plan || "IVOIRIENNE";
  const monthly = PLAN_PRICES[plan] || 15000;

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

  // ── Déclencheur paiement CinetPay ─────────────────────────────────────────
  const handleCinetPay = () => {
    setPayError("");
    setPayStatus(null);
    setPayLoading(true);

    payWithCinetPay({
      user: {
        name:  client?.name  || "",
        email: client?.email || "",
        phone: client?.phone || "",
      },
      amount:      pending?.amount || monthly,
      description: `Mensualité Awoundjô - ${client?.name || ""} (${client?.mutual_number || ""})`,
      onSuccess: () => {
        setPayLoading(true); // Garde le spinner pendant la redirection
      },
      onError: ({ message }) => {
        setPayError(message || "Le paiement a échoué. Veuillez réessayer.");
        setPayLoading(false);
      },
    });
  };

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
          { icon: "✅", label: "Total payé",    value: fmt(totalPaid),                                                    color: C.primary, bg: C.primaryL },
          { icon: "📅", label: "Mensualité",    value: fmt(monthly),                                                      color: C.blue,    bg: C.blueL    },
          { icon: "🧾", label: "Paiements",     value: `${paidCount} / ${cotisations.length}`,                           color: C.gold,    bg: C.goldL    },
          { icon: "⏩", label: "Mois d'avance", value: monthsAhead > 0 ? `+${monthsAhead} mois` : "À jour",             color: monthsAhead > 0 ? C.primary : C.slate, bg: monthsAhead > 0 ? C.primaryL : C.bg },
        ].map(s => (
          <Card key={s.label} style={{ textAlign: "center", padding: "16px 12px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 28 }}>{s.icon}</p>
            <p style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 11, color: C.slate, fontWeight: 600 }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* ── Bloc paiement CinetPay ───────────────────────────────── */}
      <Card style={{
        marginBottom: 20,
        border: `2px solid ${isUpToDate ? C.primary : C.cinet}`,
        background: isUpToDate ? C.primaryL : C.cinetL,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
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
                {pending.month}
              </p>
            )}

            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: isUpToDate ? C.primary : C.cinet }}>
              {fmt(pending?.amount || monthly)}
            </p>

            {monthsAhead > 0 && (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: C.primary, fontWeight: 600 }}>
                ⏩ Vous êtes en avance de <strong>{monthsAhead} mois</strong>
              </p>
            )}
          </div>

          {/* Bouton CinetPay */}
          <button
            onClick={handleCinetPay}
            disabled={payLoading}
            style={{
              padding: "12px 22px",
              background: payLoading
                ? "#94a3b8"
                : isUpToDate
                  ? "linear-gradient(135deg,#059669,#047857)"
                  : "linear-gradient(135deg,#0072C6,#005A9E)",
              color: "#fff", fontWeight: 900, fontSize: 14,
              border: "none", borderRadius: 12,
              cursor: payLoading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: payLoading ? "none" : "0 4px 16px rgba(0,114,198,.35)",
              flexShrink: 0, transition: "all .2s",
            }}
          >
            {payLoading ? (
              <>
                <div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,.4)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
                Redirection…
              </>
            ) : (
              <>💳 {isUpToDate ? "Payer en avance" : "Payer avec CinetPay"}</>
            )}
          </button>
        </div>

        {/* Message d'erreur technique (onError du service) */}
        {payError && (
          <div style={{ marginTop:12, background:C.redL, border:`1px solid ${C.red}33`, borderRadius:8, padding:"10px 14px" }}>
            <p style={{ margin:0, fontSize:12, color:C.red, fontWeight:600 }}>⚠️ {payError}</p>
          </div>
        )}

        <div style={{
          marginTop: 14, paddingTop: 12,
          borderTop: `1px solid ${isUpToDate ? C.primary : C.cinet}44`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>ℹ️</span>
          <p style={{ margin: 0, fontSize: 12, color: C.slate }}>
            {isUpToDate
              ? "Votre cotisation est à jour. Vous pouvez payer des mois à l'avance pour rester serein."
              : "Vous serez redirigé vers CinetPay (MTN, Orange, Moov, Wave, carte…). Paiement 100% sécurisé."
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
                        {cot.month}
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
                        onClick={handleCinetPay}
                        disabled={payLoading}
                        style={{
                          padding: "6px 14px",
                          background: "linear-gradient(135deg,#0072C6,#005A9E)",
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
        🔒 Paiements sécurisés via CinetPay · Awoundjô Mutuelle Santé CI<br />
        En cas de problème : <strong>+225 XX XX XX XX</strong>
      </p>
    </div>
  );
}
