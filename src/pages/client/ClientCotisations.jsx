// src/pages/client/ClientCotisations.jsx
import { useState, useEffect } from "react";

const C = {
  primary: "#059669", primaryL: "#ECFDF5",
  blue:    "#1B4FD8", blueL:    "#EEF2FF",
  gold:    "#D97706", goldL:    "#FFFBEB",
  red:     "#DC2626", redL:     "#FEF2F2",
  slate:   "#64748B", dark:     "#0F172A",
  border:  "#E2E8F0", bg:       "#F8FAFC",
  jeko:    "#0D9488", jekoL:    "#F0FDFA",
  purple:  "#7C3AED", purpleL:  "#F5F3FF",
};

const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" })
  : "—";
const fmtShort = (d) => d
  ? new Date(d).toLocaleDateString("fr-FR", { month:"long", year:"numeric" })
  : "—";

const PLAN_PRICES = {
  BASIQUE:     5000,
  ESSENTIELLE: 10000,
  IVOIRIENNE:  15000,
  TURQUOISE:   35000,
};

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

/* ─────────────────────────────────────────────────────────────────────────
   LOGIQUE PAIEMENT ÉCHELONNÉ
   ─────────────────────────────────────────────────────────────────────────
   • La fenêtre s'ouvre dès que la cotisation du mois courant est payée
   • Elle se referme le dernier jour du mois à 23:59:59
   • Si la collecte n'est pas terminée à la fin du mois, le reliquat est
     cumulé sur la collecte du mois suivant (et ainsi de suite)
   ───────────────────────────────────────────────────────────────────────── */

/** Dernier instant du mois courant */
function endOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}

/** La fenêtre échelonnée est-elle ouverte ? */
function isEchelonneWindowOpen(cotisations, monthly) {
  const now = new Date();
  const currentMonthPaid = cotisations.some(c => {
    const d = new Date(c.paid_at || c.created_at);
    return (c.status === "payé" || c.status === "paid") &&
           d.getMonth()    === now.getMonth() &&
           d.getFullYear() === now.getFullYear();
  });
  const beforeEndOfMonth = now <= endOfCurrentMonth();
  return currentMonthPaid && beforeEndOfMonth;
}

/** Calcule le cumul des reliquats des mois précédents non soldés */
function computeCarryOver(collectes) {
  // collectes = tableau de { month (YYYY-MM), target, paid, closed }
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  return collectes
    .filter(c => (c.collecte_month || c.month) < currentKey && !c.closed)
    .reduce((sum, c) => sum + Math.max(0, c.target - c.paid), 0);
}

// ─── Composants UI ─────────────────────────────────────────────────────────

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

// ── Barre de progression ──────────────────────────────────────────────────
function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div style={{ position:"relative", height: 10, background: "#E2E8F0", borderRadius: 999, overflow:"hidden" }}>
      <div style={{
        position:"absolute", left:0, top:0, bottom:0,
        width: `${pct}%`,
        background: color,
        borderRadius: 999,
        transition: "width .4s ease",
      }} />
    </div>
  );
}

// ── Compteur de jours restants ────────────────────────────────────────────
function DaysRemaining() {
  const now  = new Date();
  const last = endOfCurrentMonth();
  const diff = Math.ceil((last - now) / (1000 * 60 * 60 * 24));
  const urgent = diff <= 3;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700,
      color: urgent ? C.red : C.gold,
      background: urgent ? C.redL : C.goldL,
      padding: "2px 10px", borderRadius: 999,
    }}>
      ⏱ {diff <= 0 ? "Dernier jour" : `Ferme dans ${diff} jour${diff > 1 ? "s" : ""}`}
    </span>
  );
}

// ── Écrans bloquants ──────────────────────────────────────────────────────
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

// ══════════════════════════════════════════════════════════════════════════════
//  SECTION PAIEMENT ÉCHELONNÉ
// ══════════════════════════════════════════════════════════════════════════════
function EchelonneSection({ client, monthly, collectes, onRefresh, windowOpen = true }) {
  const now         = new Date();
  const currentKey  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;

  // Collecte du mois en cours (ou création d'une virtuelle)
  const currentCollecte = collectes.find(c => (c.collecte_month || c.month) === currentKey) || {
    month: currentKey,
    target: monthly,
    paid: 0,
    closed: false,
    carry_over: 0,
    versements: [],
  };

  const carryOver     = computeCarryOver(collectes);
  const totalTarget   = (currentCollecte.target || monthly) + carryOver;
  const totalPaid     = currentCollecte.paid || 0;
  const remaining     = Math.max(0, totalTarget - totalPaid);
  const pct           = Math.min(100, Math.round((totalPaid / Math.max(totalTarget,1)) * 100));

  const [amount,      setAmount]      = useState("");
  const [jekoMethod,  setJekoMethod]  = useState("orange");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");

  const quickAmounts = [
    Math.round(totalTarget * 0.25),
    Math.round(totalTarget * 0.50),
    Math.round(totalTarget * 0.75),
    totalTarget,
  ].filter((v, i, arr) => arr.indexOf(v) === i && v > 0 && v <= remaining);

  const handlePay = async () => {
    const val = Number(amount);
    if (!val || val <= 0)         { setError("Entrez un montant valide."); return; }
    if (val > remaining)          { setError(`Maximum autorisé : ${fmt(remaining)}`); return; }
    if (val < 500)                { setError("Minimum : 500 FCFA"); return; }

    setError(""); setLoading(true);

    try {
      const token = localStorage.getItem("client_token");
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      const res = await fetch(`${BASE}/api/client/collectes-echelonnees/verser`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          amount:      val,
          jeko_method: jekoMethod,
          success_url: `${window.location.origin}/client/cotisations?payment=success&type=echelonne&tx=`,
          failed_url:  `${window.location.origin}/client/cotisations?payment=failed`,
        }),
      });

      const data = await res.json();
      const url  =
        data?.data?.redirect_url || data?.data?.payment_url ||
        data?.redirect_url       || data?.payment_url       || null;

      if (!url) throw new Error(data?.error || "URL de paiement non reçue");
      window.location.href = url;

    } catch (e) {
      setError(e.message || "Paiement échoué. Réessayez.");
      setLoading(false);
    }
  };

  return (
    <Card style={{
      marginBottom: 20,
      border: `2px solid ${windowOpen ? C.purple : C.slate}`,
      background: windowOpen ? C.purpleL : C.bg,
    }}>
      {/* Entête */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:8, marginBottom:16 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <span style={{ fontSize:20 }}>📦</span>
            <p style={{ margin:0, fontWeight:900, fontSize:15, color:C.dark }}>
              Paiement Échelonné
            </p>
            <DaysRemaining />
          </div>
          <p style={{ margin:0, fontSize:12, color:C.slate }}>
            {fmtShort(new Date())} — Fenêtre ouverte jusqu'au {fmtDate(endOfCurrentMonth())}
          </p>
        </div>
        <div style={{
          background: windowOpen ? C.purple : C.slate, color:"#fff",
          padding:"4px 14px", borderRadius:999,
          fontSize:11, fontWeight:700,
        }}>
          {windowOpen ? "🟢 OUVERT" : "🔴 FERMÉ"}
        </div>
      </div>

      {/* Reliquat cumulé si présent */}
      {carryOver > 0 && (
        <div style={{
          marginBottom:14, padding:"10px 14px",
          background:"#FEF3C7", border:`1.5px solid ${C.gold}`,
          borderRadius:10, display:"flex", alignItems:"center", gap:10,
        }}>
          <span style={{ fontSize:18 }}>⚠️</span>
          <div>
            <p style={{ margin:0, fontSize:12, fontWeight:800, color:C.gold }}>
              Reliquat du mois précédent inclus
            </p>
            <p style={{ margin:"2px 0 0", fontSize:12, color:"#92400E" }}>
              {fmt(carryOver)} ont été ajoutés à la collecte de ce mois.
            </p>
          </div>
        </div>
      )}

      {/* Barre de progression */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:12, color:C.slate, fontWeight:600 }}>Progression collecte</span>
          <span style={{ fontSize:13, fontWeight:900, color:C.purple }}>{pct}%</span>
        </div>
        <ProgressBar value={totalPaid} max={totalTarget} color={C.purple} />
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
          <span style={{ fontSize:12, color:C.primary, fontWeight:700 }}>
            Versé : {fmt(totalPaid)}
          </span>
          <span style={{ fontSize:12, color:C.red, fontWeight:700 }}>
            Reste : {fmt(remaining)}
          </span>
        </div>
        <p style={{ margin:"4px 0 0", fontSize:11, color:C.slate, textAlign:"right" }}>
          Objectif : {fmt(totalTarget)}
          {carryOver > 0 && ` (dont ${fmt(carryOver)} reporté)`}
        </p>
      </div>

      {!windowOpen ? (
        /* Fenêtre fermée : message explicatif */
        <div style={{
          textAlign:"center", padding:"20px 16px",
          background:"#F8FAFC", borderRadius:12,
          border:`1.5px dashed ${C.slate}44`,
        }}>
          <p style={{ margin:"0 0 6px", fontSize:22 }}>🔒</p>
          <p style={{ margin:"0 0 6px", fontWeight:800, fontSize:14, color:C.dark }}>
            Fenêtre de versement fermée
          </p>
          <p style={{ margin:0, fontSize:12, color:C.slate, lineHeight:1.6 }}>
            La fenêtre s'ouvre automatiquement dès que votre cotisation du mois en cours est payée, et reste disponible jusqu'au dernier jour du mois.
          </p>
        </div>
      ) : remaining <= 0 ? (
        /* Collecte soldée */
        <div style={{
          textAlign:"center", padding:"20px 0",
          background:C.primaryL, borderRadius:12,
          border:`1.5px solid ${C.primary}`,
        }}>
          <p style={{ margin:"0 0 4px", fontSize:28 }}>🎉</p>
          <p style={{ margin:0, fontWeight:900, fontSize:15, color:C.primary }}>
            Collecte soldée !
          </p>
          <p style={{ margin:"4px 0 0", fontSize:12, color:C.slate }}>
            Vous avez atteint l'objectif de ce mois. Bravo !
          </p>
        </div>
      ) : (
        <>
          {/* Montants rapides */}
          {quickAmounts.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <p style={{ margin:"0 0 8px", fontSize:12, color:C.slate, fontWeight:600 }}>
                Versements rapides
              </p>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {quickAmounts.map(v => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    style={{
                      padding:"6px 14px",
                      background: amount === String(v) ? C.purple : "#fff",
                      color:      amount === String(v) ? "#fff"   : C.purple,
                      border:`1.5px solid ${C.purple}`,
                      borderRadius:8, fontSize:12, fontWeight:700,
                      cursor:"pointer", fontFamily:"inherit",
                      transition:"all .15s",
                    }}
                  >
                    {v === totalTarget ? "Tout solder" : fmt(v)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Champ montant libre */}
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:12, fontWeight:700, color:C.slate, display:"block", marginBottom:6 }}>
              Montant du versement (FCFA)
            </label>
            <input
              type="number"
              min="500"
              max={remaining}
              value={amount}
              onChange={e => { setAmount(e.target.value); setError(""); }}
              placeholder={`500 – ${Number(remaining).toLocaleString("fr-FR")}`}
              style={{
                width:"100%", boxSizing:"border-box",
                padding:"10px 12px", borderRadius:8,
                border:`1.5px solid ${error ? C.red : C.purple}44`,
                fontSize:14, fontFamily:"inherit", background:"#fff",
                outline:"none",
              }}
            />
          </div>

          {/* Réseau */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:700, color:C.slate, display:"block", marginBottom:6 }}>
              Réseau de paiement
            </label>
            <select
              value={jekoMethod}
              onChange={e => setJekoMethod(e.target.value)}
              disabled={loading}
              style={{
                width:"100%", padding:"10px 12px", borderRadius:8,
                border:"1.5px solid #e2e8f0", fontSize:14, fontFamily:"inherit",
                background:"#fff", cursor: loading ? "not-allowed":"pointer",
              }}
            >
              <option value="orange">🟠 Orange Money</option>
              <option value="wave">🔵 Wave</option>
              <option value="mtn">🟡 MTN Mobile Money</option>
              <option value="moov">🟢 Moov Money</option>
              <option value="djamo">💜 Djamo / Carte bancaire</option>
            </select>
          </div>

          {error && (
            <div style={{ marginBottom:10, padding:"8px 12px", background:C.redL, borderRadius:8, border:`1px solid ${C.red}33` }}>
              <p style={{ margin:0, fontSize:12, color:C.red, fontWeight:600 }}>⚠️ {error}</p>
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={loading || !amount}
            style={{
              width:"100%", padding:"12px 22px",
              background: loading || !amount
                ? "#94a3b8"
                : `linear-gradient(135deg,${C.purple},#6D28D9)`,
              color:"#fff", fontWeight:900, fontSize:15,
              border:"none", borderRadius:12,
              cursor: loading || !amount ? "not-allowed":"pointer",
              fontFamily:"inherit",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              boxShadow: loading ? "none":"0 4px 16px rgba(124,58,237,.3)",
              transition:"all .2s",
            }}
          >
            {loading ? (
              <>
                <div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,.4)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
                Redirection…
              </>
            ) : (
              <>💜 Verser {amount ? fmt(Number(amount)) : "un montant"}</>
            )}
          </button>

          {/* Historique des versements du mois */}
          {currentCollecte.versements?.length > 0 && (
            <div style={{ marginTop:16, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
              <p style={{ margin:"0 0 10px", fontSize:12, fontWeight:700, color:C.slate }}>
                Versements effectués ce mois
              </p>
              {currentCollecte.versements.map((v, i) => (
                <div key={i} style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"8px 0",
                  borderTop: i > 0 ? `1px dashed ${C.border}` : "none",
                }}>
                  <div>
                    <p style={{ margin:0, fontSize:12, fontWeight:700, color:C.dark }}>
                      {fmtDate(v.paid_at)}
                    </p>
                    <p style={{ margin:"1px 0 0", fontSize:11, color:C.slate }}>
                      {v.payment_method === "jeko" ? "💳 JEKO" : v.payment_method}
                    </p>
                  </div>
                  <span style={{ fontSize:13, fontWeight:900, color:C.primary }}>
                    +{fmt(v.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{
        marginTop:14, paddingTop:12, borderTop:`1px solid ${C.purple}22`,
        display:"flex", alignItems:"flex-start", gap:8,
      }}>
        <span style={{ fontSize:14, flexShrink:0 }}>ℹ️</span>
        <p style={{ margin:0, fontSize:11, color:C.slate, lineHeight:1.5 }}>
          Versez en plusieurs fois avant la fin du mois. Tout reliquat non soldé sera
          automatiquement ajouté à la collecte du mois suivant.
        </p>
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function ClientCotisations() {
  const [client,      setClient]      = useState(null);
  const [cotisations, setCotisations] = useState([]);
  const [collectes,   setCollectes]   = useState([]); // historique échelonné
  const [windowOpen,  setWindowOpen]  = useState(false); // fenêtre paiement échelonné
  const [loading,     setLoading]     = useState(true);
  const [payLoading,  setPayLoading]  = useState(false);
  const [payError,    setPayError]    = useState("");
  const [payStatus,   setPayStatus]   = useState(null);
  const [jekoMethod,  setJekoMethod]  = useState("orange");

  const loadData = () => {
    const token   = localStorage.getItem("client_token");
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    Promise.all([
      fetch(`${BASE}/api/client/profile`,       { headers }).then(r => r.json()),
      fetch(`${BASE}/api/client/contributions`, { headers }).then(r => r.json()),
      fetch(`${BASE}/api/client/collectes-echelonnees`, { headers })
        .then(r => r.json())
        .catch(() => ({ data: [], window_open: false })),
    ]).then(([me, cots, col]) => {
      const payments = cots.data?.payments || [];
      setClient(me.data || me);
      setCotisations(payments);
      setCollectes(col.data || []);

      // window_open vient du backend OU calculé localement depuis les paiements
      if (typeof col.window_open === "boolean") {
        setWindowOpen(col.window_open);
      } else {
        const n = new Date();
        const cotMoisPaye = payments.some(c => {
          const d = new Date(c.paid_at || c.created_at);
          return (c.status === "payé" || c.status === "paid") &&
                 d.getMonth()    === n.getMonth() &&
                 d.getFullYear() === n.getFullYear();
        });
        setWindowOpen(cotMoisPaye);
      }
    }).catch((e) => {
      console.error("[ClientCotisations] Erreur chargement données:", e?.message || e);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const type    = params.get("type");
    const tx      = params.get("tx");

    if (payment === "success") {
      setPayStatus("success");
      if (tx) {
        const token = localStorage.getItem("client_token");
        const endpoint = type === "echelonne"
          ? `${BASE}/api/client/collectes-echelonnees/confirm`
          : `${BASE}/api/client/contributions/confirm-jeko`;
        fetch(endpoint, {
          method:  "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body:    JSON.stringify({ transaction_id: tx }),
        }).catch(() => {});
      }
    } else if (payment === "failed") {
      setPayStatus("failed");
    }

    if (payment) window.history.replaceState({}, "", window.location.pathname);

    loadData();
  }, []);

  if (loading) return <Loader />;

  if (client?.status_validation === "pending")  return <ValidationPendingScreen client={client} />;
  if (client?.status_validation === "rejected") return <ValidationRejectedScreen />;

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
    const start        = new Date(firstPaid.paid_at);
    const monthsElapsed =
      (currentYear - start.getFullYear()) * 12 + (currentMonth - start.getMonth()) + 1;
    monthsAhead = paidCount - monthsElapsed;
  }

  const isUpToDate         = !pending && paidCount > 0;
  // windowOpen est géré par le state (mis à jour dans loadData)

  // ── Paiement cotisation normale ─────────────────────────────────────────
  const handlePayJeko = async () => {
    setPayError(""); setPayStatus(null); setPayLoading(true);
    try {
      const token   = localStorage.getItem("client_token");
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const amount  = pending?.amount || monthly;

      const initRes = await fetch(`${BASE}/api/payments/jeko/init`, {
        method:  "POST",
        headers,
        body: JSON.stringify({
          amount,
          description:  `Cotisation Awoundjô — ${client?.name || ""} (${client?.mutual_number || ""})`,
          client_id:    client?.id    || undefined,
          client_name:  client?.name  || "Client",
          client_email: client?.email || "client@awoundjo.ci",
          client_phone: client?.phone || "",
          type:         "mensualite",
          jeko_method:  jekoMethod,
          success_url:  `${window.location.origin}/client/cotisations?payment=success&tx=`,
          failed_url:   `${window.location.origin}/client/cotisations?payment=failed`,
        }),
      });

      const initData = await initRes.json();
      const paymentUrl =
        initData?.data?.redirect_url || initData?.data?.payment_url ||
        initData?.redirect_url       || initData?.payment_url       || null;

      if (!paymentUrl) throw new Error(initData?.error || "URL de paiement JEKO non reçue");
      window.location.href = paymentUrl;

    } catch (e) {
      setPayError(e.message || "Le paiement a échoué. Veuillez réessayer.");
      setPayLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px 16px", maxWidth: 720, margin: "0 auto" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Bannières retour paiement */}
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
            style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.primary }}>✕</button>
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
            style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.red }}>✕</button>
        </div>
      )}

      {/* Carte identité client */}
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

      {/* Cartes résumé */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12, marginBottom:24 }}>
        {[
          { icon:"✅", label:"Total payé",    value: fmt(totalPaid),                                       color:C.primary, bg:C.primaryL },
          { icon:"📅", label:"Mensualité",    value: fmt(monthly),                                         color:C.blue,    bg:C.blueL    },
          { icon:"🧾", label:"Paiements",     value: `${paidCount} / ${cotisations.length}`,              color:C.gold,    bg:C.goldL    },
          { icon:"⏩", label:"Mois d'avance", value: monthsAhead > 0 ? `+${monthsAhead} mois` : "À jour",
            color: monthsAhead > 0 ? C.primary : C.slate,
            bg:    monthsAhead > 0 ? C.primaryL : C.bg },
        ].map(s => (
          <Card key={s.label} style={{ textAlign:"center", padding:"16px 12px" }}>
            <p style={{ margin:"0 0 4px", fontSize:28 }}>{s.icon}</p>
            <p style={{ margin:"0 0 2px", fontSize:16, fontWeight:900, color:s.color }}>{s.value}</p>
            <p style={{ margin:0, fontSize:11, color:C.slate, fontWeight:600 }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* ════ SECTION PAIEMENT ÉCHELONNÉ (toujours visible) ════ */}
      <EchelonneSection
        client={client}
        monthly={monthly}
        collectes={collectes}
        onRefresh={loadData}
        windowOpen={windowOpen}
      />

      {/* ════ BLOC PAIEMENT COTISATION NORMALE ════ */}
      <Card style={{
        marginBottom: 20,
        border: `2px solid ${isUpToDate ? C.primary : C.jeko}`,
        background: isUpToDate ? C.primaryL : C.jekoL,
      }}>
        <div style={{ marginBottom:14 }}>
          <p style={{ margin:"0 0 4px", fontSize:13, color:C.slate, fontWeight:600 }}>
            {isUpToDate ? "COTISATION — PAYER EN AVANCE" : "COTISATION EN COURS"}
          </p>

          {isUpToDate && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:C.primary, borderRadius:20, padding:"4px 12px", marginBottom:8 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:"#fff", display:"inline-block" }} />
              <span style={{ fontSize:11, fontWeight:700, color:"#fff" }}>À JOUR</span>
            </div>
          )}

          {pending && (
            <p style={{ margin:"0 0 4px", fontSize:17, fontWeight:900, color:C.dark }}>
              {fmtDate(pending.createdAt)}
            </p>
          )}

          <p style={{ margin:0, fontSize:22, fontWeight:900, color: isUpToDate ? C.primary : C.jeko }}>
            {fmt(pending?.amount || monthly)}
          </p>

          {monthsAhead > 0 && (
            <p style={{ margin:"6px 0 0", fontSize:12, color:C.primary, fontWeight:600 }}>
              ⏩ Vous êtes en avance de <strong>{monthsAhead} mois</strong>
            </p>
          )}
        </div>

        {/* Info JEKO */}
        <div style={{ marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            background:C.jeko, borderRadius:8,
            padding:"6px 14px", display:"inline-flex", alignItems:"center", gap:6,
          }}>
            <span style={{ fontSize:14 }}>💳</span>
            <span style={{ fontSize:12, fontWeight:800, color:"#fff" }}>JEKO</span>
          </div>
          <span style={{ fontSize:12, color:C.slate }}>Orange · Wave · MTN · Moov · Carte</span>
        </div>

        {/* Sélecteur réseau */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:700, color:C.slate, display:"block", marginBottom:6 }}>
            Réseau de paiement
          </label>
          <select
            value={jekoMethod}
            onChange={e => setJekoMethod(e.target.value)}
            disabled={payLoading}
            style={{
              width:"100%", padding:"10px 12px", borderRadius:8,
              border:"1.5px solid #e2e8f0", fontSize:14, fontFamily:"inherit",
              background:"#fff", cursor: payLoading ? "not-allowed":"pointer",
            }}
          >
            <option value="orange">🟠 Orange Money</option>
            <option value="wave">🔵 Wave</option>
            <option value="mtn">🟡 MTN Mobile Money</option>
            <option value="moov">🟢 Moov Money</option>
            <option value="djamo">💜 Djamo / Carte bancaire</option>
          </select>
        </div>

        {/* Bouton payer */}
        <button
          onClick={handlePayJeko}
          disabled={payLoading}
          style={{
            width:"100%", padding:"13px 22px",
            background: payLoading
              ? "#94a3b8"
              : isUpToDate
                ? "linear-gradient(135deg,#059669,#047857)"
                : "linear-gradient(135deg,#0D9488,#0f766e)",
            color:"#fff", fontWeight:900, fontSize:15,
            border:"none", borderRadius:12,
            cursor: payLoading ? "not-allowed":"pointer",
            fontFamily:"inherit",
            display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            boxShadow: payLoading ? "none":"0 4px 16px rgba(0,0,0,.18)",
            transition:"all .2s",
          }}
        >
          {payLoading ? (
            <>
              <div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,.4)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
              Redirection en cours…
            </>
          ) : (
            <>💳 {isUpToDate ? "Payer en avance" : "Payer avec JEKO"}</>
          )}
        </button>

        {payError && (
          <div style={{ marginTop:12, background:C.redL, border:`1px solid ${C.red}33`, borderRadius:8, padding:"10px 14px" }}>
            <p style={{ margin:0, fontSize:12, color:C.red, fontWeight:600 }}>⚠️ {payError}</p>
          </div>
        )}

        <div style={{
          marginTop:14, paddingTop:12, borderTop:`1px solid ${C.border}`,
          display:"flex", alignItems:"center", gap:8,
        }}>
          <span style={{ fontSize:14 }}>ℹ️</span>
          <p style={{ margin:0, fontSize:12, color:C.slate }}>
            {isUpToDate
              ? "Votre cotisation est à jour. Vous pouvez payer des mois à l'avance pour rester serein."
              : "Vous serez redirigé vers la page de paiement sécurisée. Paiement 100% sécurisé."
            }
          </p>
        </div>
      </Card>

      {/* Historique des cotisations */}
      <Card>
        <p style={{ margin:"0 0 16px", fontWeight:800, fontSize:15, color:C.dark }}>
          📋 Historique des paiements
        </p>

        {cotisations.length === 0 ? (
          <div style={{ textAlign:"center", padding:"32px 0" }}>
            <p style={{ fontSize:36, margin:"0 0 10px" }}>🧾</p>
            <p style={{ margin:0, color:C.slate, fontSize:14 }}>Aucun historique disponible</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {cotisations.map((cot, i) => {
              const s         = statusStyle(cot.status);
              const isPending = cot.status === "attente" || cot.status === "pending";
              return (
                <div
                  key={cot.id || i}
                  style={{
                    display:"flex", alignItems:"center",
                    justifyContent:"space-between",
                    padding:"14px 4px",
                    borderTop: i > 0 ? `1px solid ${C.border}` : "none",
                    flexWrap:"wrap", gap:10,
                  }}
                >
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{
                      width:40, height:40, borderRadius:10,
                      background: isPending ? C.goldL : C.primaryL,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:18, flexShrink:0,
                    }}>
                      {isPending ? "⏳" : "✅"}
                    </div>
                    <div>
                      <p style={{ margin:0, fontWeight:700, fontSize:14, color:C.dark }}>
                        {fmtDate(cot.createdAt || cot.created_at)}
                      </p>
                      <p style={{ margin:"2px 0 0", fontSize:11, color:C.slate }}>
                        {cot.paid_at
                          ? `Payé le ${fmtDate(cot.paid_at)}`
                          : (cot.status === "payé" || cot.status === "paid")
                            ? "Payé ✓"
                            : "Non payé"
                        }
                        {cot.payment_method === "jeko" && (
                          <span style={{ marginLeft:6, color:C.jeko, fontWeight:700 }}>· 💳 JEKO</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                    <span style={{ fontSize:15, fontWeight:900, color: isPending ? C.gold : C.primary }}>
                      {fmt(cot.amount || monthly)}
                    </span>
                    <Badge label={s.label} color={s.color} bg={s.bg} />
                    {isPending && (
                      <button
                        onClick={handlePayJeko}
                        disabled={payLoading}
                        style={{
                          padding:"6px 14px",
                          background:"linear-gradient(135deg,#0D9488,#0f766e)",
                          color:"#fff", fontWeight:700, fontSize:12,
                          border:"none", borderRadius:8,
                          cursor: payLoading ? "not-allowed":"pointer",
                          fontFamily:"inherit",
                          display:"flex", alignItems:"center", gap:6,
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

      {/* Historique collectes échelonnées */}
      {collectes.length > 0 && (
        <Card style={{ marginTop:20 }}>
          <p style={{ margin:"0 0 16px", fontWeight:800, fontSize:15, color:C.dark }}>
            📦 Historique des collectes échelonnées
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {[...collectes].reverse().map((col, i) => {
              const pct  = Math.min(100, Math.round(((col.paid||0) / Math.max(col.target||1,1)) * 100));
              const done = col.paid >= col.target;
              return (
                <div key={(col.collecte_month || col.month) || i} style={{
                  padding:"14px 4px",
                  borderTop: i > 0 ? `1px solid ${C.border}` : "none",
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{
                        width:36, height:36, borderRadius:10,
                        background: done ? C.primaryL : C.purpleL,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:16, flexShrink:0,
                      }}>
                        {done ? "✅" : "📦"}
                      </div>
                      <div>
                        <p style={{ margin:0, fontWeight:700, fontSize:13, color:C.dark }}>
                          {(col.collecte_month || col.month) ? new Date((col.collecte_month || col.month) + "-01").toLocaleDateString("fr-FR", { month:"long", year:"numeric" }) : "—"}
                        </p>
                        {col.carry_over > 0 && (
                          <p style={{ margin:"1px 0 0", fontSize:11, color:C.gold, fontWeight:600 }}>
                            +{fmt(col.carry_over)} reporté du mois préc.
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ margin:0, fontSize:13, fontWeight:900, color: done ? C.primary : C.purple }}>
                        {fmt(col.paid || 0)} / {fmt(col.target || 0)}
                      </p>
                      <span style={{
                        fontSize:11, fontWeight:700,
                        color: done ? C.primary : C.purple,
                        background: done ? C.primaryL : C.purpleL,
                        padding:"2px 8px", borderRadius:999,
                      }}>
                        {done ? "Soldé ✅" : `${pct}% versé`}
                      </span>
                    </div>
                  </div>
                  <ProgressBar value={col.paid||0} max={col.target||1} color={done ? C.primary : C.purple} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <p style={{ textAlign:"center", fontSize:12, color:C.slate, marginTop:20 }}>
        🔒 Paiements sécurisés via JEKO · Awoundjô Mutuelle Santé CI<br />
        En cas de problème : <strong>+225 01 71 72 16 68</strong>
      </p>
    </div>
  );
}
