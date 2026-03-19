import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientContribAPI } from "../../clientApi";

const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

const STATUS_STYLE = {
  paid:     { icon: "✅", label: "Payé",    color: "#059669", bg: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", border: "#6EE7B7" },
  late:     { icon: "❌", label: "Retard",  color: "#DC2626", bg: "linear-gradient(135deg,#FEF2F2,#FEE2E2)", border: "#FECACA" },
  upcoming: { icon: "⏳", label: "À venir", color: "#94A3B8", bg: "#F8FAFC",                                 border: "#E2E8F0" },
};

const METHODS = [
  { id: "Wave", icon: "🌊", label: "Wave", color: "#1a56db", bg: "#EFF6FF" },
];

const METHOD_ICON = { "Wave": "🌊" };

export default function ClientCotisations() {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [method,  setMethod]  = useState("Wave");
  const [amount,  setAmount]  = useState("");
  const [paying,  setPaying]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [visible, setVis]     = useState(false);
  const [tab,     setTab]     = useState("calendar");

  const load = () => {
    clientContribAPI.get()
      .then(res => { setData(res.data.data); setTimeout(() => setVis(true), 100); })
      .catch(() => navigate("/client/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handlePay = async () => {
    if (!amount || parseInt(amount) < 10000) return setError("Montant minimum : 10 000 FCFA");
    setError(""); setPaying(true);

    try {
      const res = await clientContribAPI.pay({ amount: parseInt(amount), payment_method: method });
      const data = res.data.data;

      if (method === "Wave" && data.wave_link) {
        setModal(false);
        // Force l'ouverture de l'app Wave
        window.location.href = data.wave_link;

        // Confirme le paiement après retour
        setTimeout(async () => {
          try {
            await clientContribAPI.confirm({
              amount: parseInt(amount),
              payment_method: method,
              transaction_reference: data.transaction_reference,
            });
            setSuccess(`✅ Paiement Wave confirmé — Réf: ${data.transaction_reference}`);
            load();
            setTimeout(() => setSuccess(""), 6000);
          } catch {}
        }, 5000);

      } else {
        setSuccess(`✅ Paiement confirmé — Réf: ${data.transaction_reference}`);
        setModal(false);
        setAmount("");
        load();
        setTimeout(() => setSuccess(""), 6000);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur paiement");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <Skeleton />;
  if (!data)   return null;

  const paid  = data.monthly_status.filter(m => m.status === "paid").length;
  const late  = data.monthly_status.filter(m => m.status === "late").length;
  const total = parseInt(data.total_paid_this_year);
  const pct   = Math.round((paid / 12) * 100);

  return (
    <div style={{ padding: "16px 16px 100px", fontFamily: "'Poppins',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 4px", letterSpacing: -.3 }}>Mes Cotisations</h1>
      <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px" }}>Suivi {new Date().getFullYear()}</p>

      {/* Bannières */}
      {success && (
        <div style={{ background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", border: "1px solid #6EE7B7", borderRadius: 14, padding: "14px 16px", color: "#065F46", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
          {success}
        </div>
      )}
      {late > 0 && (
        <div style={{ background: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", border: "1px solid #FCD34D", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 14, boxShadow: "0 4px 12px rgba(245,158,11,.15)" }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: "#92400E", margin: "0 0 2px", fontSize: 13 }}>{late} cotisation{late > 1 ? "s" : ""} en retard</p>
            <p style={{ color: "#B45309", margin: 0, fontSize: 12 }}>Régularisez pour maintenir vos droits</p>
          </div>
          <button onClick={() => setModal(true)} style={{ background: "#F59E0B", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif", whiteSpace: "nowrap" }}>
            Payer →
          </button>
        </div>
      )}

      {/* Hero stats card */}
      <div style={{
        background: "linear-gradient(135deg,#1a56db,#1e3a8a)",
        borderRadius: 24, padding: "22px 20px", color: "#fff",
        marginBottom: 16, position: "relative", overflow: "hidden",
        boxShadow: "0 12px 40px rgba(26,86,219,.35)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "all .5s cubic-bezier(.34,1.56,.64,1)",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.08)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, left: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.06)", pointerEvents: "none" }} />

        <div style={{ marginBottom: 18, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, opacity: .8, fontWeight: 500 }}>Progression annuelle</span>
            <span style={{ fontSize: 20, fontWeight: 800 }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,.2)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#10B981,#34D399)", borderRadius: 4, transition: "width 1s cubic-bezier(.34,1.56,.64,1)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 11, opacity: .6 }}>{paid} mois payés</span>
            <span style={{ fontSize: 11, opacity: .6 }}>{12 - paid} restants</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 0, background: "rgba(255,255,255,.12)", borderRadius: 14, overflow: "hidden", backdropFilter: "blur(8px)" }}>
          {[
            { label: "Mois payés",  val: paid,  color: "#34D399" },
            { label: "En retard",   val: late,  color: late > 0 ? "#F87171" : "rgba(255,255,255,.5)" },
            { label: "Total FCFA",  val: total.toLocaleString("fr-FR"), color: "#fff" },
          ].map((st, i) => (
            <div key={i} style={{ flex: 1, padding: "14px 10px", borderRight: i < 2 ? "1px solid rgba(255,255,255,.15)" : "none", textAlign: "center" }}>
              <p style={{ fontSize: 10, opacity: .7, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: .8 }}>{st.label}</p>
              <p style={{ fontSize: 16, fontWeight: 800, margin: 0, color: st.color }}>{st.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bouton payer */}
      <button onClick={() => { setError(""); setModal(true); }} style={{
        width: "100%", background: "linear-gradient(135deg,#059669,#065F46)",
        color: "#fff", border: "none", borderRadius: 16, padding: 16,
        fontSize: 15, fontWeight: 700, cursor: "pointer",
        fontFamily: "'Poppins',sans-serif",
        boxShadow: "0 6px 20px rgba(5,150,105,.35)",
        marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "all .5s .1s cubic-bezier(.34,1.56,.64,1)",
      }}>
        💰 Payer une cotisation
      </button>

      {/* Onglets */}
      <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 14, padding: 4, marginBottom: 16, opacity: visible ? 1 : 0, transition: "all .5s .15s" }}>
        {[
          { id: "calendar", label: "📅 Calendrier" },
          { id: "history",  label: "📋 Historique" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "10px", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif", transition: "all .2s",
            background: tab === t.id ? "#fff" : "transparent",
            color: tab === t.id ? "#1a56db" : "#64748B",
            boxShadow: tab === t.id ? "0 2px 8px rgba(0,0,0,.08)" : "none",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Calendrier */}
      {tab === "calendar" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, opacity: visible ? 1 : 0, transition: "all .5s .2s" }}>
          {data.monthly_status.map((m, i) => {
            const st = STATUS_STYLE[m.status];
            return (
              <div key={m.month} style={{
                background: st.bg, borderRadius: 14, padding: "12px 8px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                border: `1.5px solid ${st.border}`,
                opacity: visible ? 1 : 0,
                transform: visible ? "scale(1)" : "scale(.9)",
                transition: `all .4s ${.2 + i * .03}s cubic-bezier(.34,1.56,.64,1)`,
              }}>
                <span style={{ fontSize: 16 }}>{st.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{MONTHS[i]}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: st.color, textTransform: "uppercase", letterSpacing: .5 }}>{st.label}</span>
                {m.payment && (
                  <span style={{ fontSize: 9, color: st.color, fontWeight: 600 }}>
                    {parseInt(m.payment.amount).toLocaleString("fr-FR")} F
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Historique */}
      {tab === "history" && (
        <div style={{ opacity: visible ? 1 : 0, transition: "all .5s .2s" }}>
          {data.payments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 20px", background: "#fff", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,.05)" }}>
              <span style={{ fontSize: 48 }}>📭</span>
              <p style={{ color: "#64748B", fontSize: 15, fontWeight: 600, margin: "12px 0 4px" }}>Aucun paiement</p>
              <p style={{ color: "#94A3B8", fontSize: 13, margin: 0 }}>Vos paiements apparaîtront ici</p>
            </div>
          ) : (
            data.payments.map((p, i) => (
              <div key={p.id} style={{
                background: "#fff", borderRadius: 16, padding: "14px 16px",
                marginBottom: 10, display: "flex", alignItems: "center", gap: 12,
                boxShadow: "0 2px 10px rgba(0,0,0,.06)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0)" : "translateX(-10px)",
                transition: `all .4s ${.2 + i * .05}s`,
              }}>
                <div style={{ width: 48, height: 48, background: "#F8FAFC", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, border: "1.5px solid #E2E8F0" }}>
                  {METHOD_ICON[p.payment_method] || "💳"}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: "0 0 2px" }}>
                    {p.payment_type === "monthly_fee" ? "Cotisation mensuelle" : "Adhésion"}
                  </p>
                  <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 2px" }}>
                    {new Date(p.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                  <p style={{ fontSize: 10, color: "#94A3B8", margin: 0, fontFamily: "monospace", letterSpacing: .5 }}>
                    {p.transaction_reference}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#059669" }}>
                    +{parseInt(p.amount).toLocaleString("fr-FR")}
                  </div>
                  <div style={{ fontSize: 10, color: "#64748B", fontWeight: 500 }}>FCFA</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal paiement */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}
          onClick={() => setModal(false)}>
          <div style={{ background: "#fff", borderRadius: "28px 28px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0F172A" }}>💰 Payer une cotisation</h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94A3B8" }}>Minimum 10 000 FCFA</p>
              </div>
              <button onClick={() => setModal(false)} style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 16px", color: "#DC2626", fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}

            {/* Montant */}
            <label style={ls.label}>Montant (FCFA)</label>
            <div style={{ position: "relative", marginBottom: 20 }}>
              <input type="number" placeholder="10 000" value={amount} onChange={e => setAmount(e.target.value)}
                style={{ width: "100%", border: "2px solid #E2E8F0", borderRadius: 14, padding: "14px 60px 14px 16px", fontSize: 20, fontWeight: 700, color: "#0F172A", fontFamily: "'Poppins',sans-serif", boxSizing: "border-box", outline: "none" }} />
              <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 600, color: "#94A3B8" }}>FCFA</span>
            </div>

            {/* Montants rapides */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[10000, 15000, 20000, 25000].map(v => (
                <button key={v} onClick={() => setAmount(String(v))} style={{
                  flex: 1, padding: "10px 4px", border: `2px solid ${amount === String(v) ? "#1a56db" : "#E2E8F0"}`,
                  borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  background: amount === String(v) ? "#EFF6FF" : "#fff",
                  color: amount === String(v) ? "#1a56db" : "#64748B",
                  fontFamily: "'Poppins',sans-serif", transition: "all .15s",
                }}>
                  {(v / 1000)}k
                </button>
              ))}
            </div>

            {/* Méthode Wave uniquement */}
            <label style={ls.label}>Méthode de paiement</label>
            <div style={{ marginBottom: 24 }}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: "20px", borderRadius: 14,
                border: "2px solid #1a56db",
                background: "#EFF6FF",
                boxShadow: "0 4px 12px rgba(26,86,219,.2)",
              }}>
                <span style={{ fontSize: 36 }}>🌊</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1a56db" }}>Wave</span>
                <span style={{ fontSize: 11, color: "#64748B", textAlign: "center" }}>Vous serez redirigé vers l'app Wave</span>
              </div>
            </div>

            <button onClick={handlePay} disabled={paying} style={{
              width: "100%", background: paying ? "#94A3B8" : "linear-gradient(135deg,#1a56db,#1e3a8a)",
              color: "#fff", border: "none", borderRadius: 16, padding: 16,
              fontSize: 15, fontWeight: 700, cursor: paying ? "not-allowed" : "pointer",
              fontFamily: "'Poppins',sans-serif",
              boxShadow: paying ? "none" : "0 6px 20px rgba(26,86,219,.35)",
              transition: "all .2s",
            }}>
              {paying ? "⏳ Traitement en cours..." : `🌊 Payer ${amount ? parseInt(amount).toLocaleString("fr-FR") + " FCFA via Wave" : "via Wave"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ padding: 16 }}>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      {[160, 56, 200].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 20, marginBottom: 14, background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      ))}
    </div>
  );
}

const ls = {
  label: { display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: .8 },
};