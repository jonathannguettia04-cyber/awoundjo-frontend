// src/pages/client/ClientCotisations.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientContribAPI } from "../../clientApi";

const STATUS_STYLE = {
  paid:     { icon: "✅", label: "Payé",      color: "#10B981", bg: "#ECFDF5" },
  late:     { icon: "❌", label: "Retard",    color: "#EF4444", bg: "#FEF2F2" },
  upcoming: { icon: "⏳", label: "À venir",   color: "#9CA3AF", bg: "#F9FAFB" },
};

const METHODS = [
  { id: "Wave",         icon: "🌊", label: "Wave",         color: "#1a56db" },
  { id: "Orange Money", icon: "🟠", label: "Orange Money", color: "#FF6600" },
  { id: "MTN Money",    icon: "🟡", label: "MTN Money",    color: "#CC9900" },
  { id: "Cash",         icon: "💵", label: "Espèces",      color: "#10B981" },
];

export default function ClientCotisations() {
  const navigate = useNavigate();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [method, setMethod]     = useState("Wave");
  const [amount, setAmount]     = useState("");
  const [paying, setPaying]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const fetch = () => {
    clientContribAPI.get()
      .then(res => setData(res.data.data))
      .catch(() => navigate("/client/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handlePay = async () => {
    if (!amount || parseInt(amount) < 1000) return setError("Montant minimum : 1 000 FCFA");
    setError(""); setPaying(true);
    try {
      const res = await clientContribAPI.pay({ amount: parseInt(amount), payment_method: method });
      setSuccess(`Paiement confirmé — Réf: ${res.data.data.transaction_reference}`);
      setModal(false); setAmount("");
      fetch();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur paiement");
    } finally { setPaying(false); }
  };

  if (loading) return <div style={{ padding: 16 }}>{[1,2,3].map(i => <div key={i} style={{ height: 60, background: "#E5E7EB", borderRadius: 12, marginBottom: 12 }} />)}</div>;
  if (!data) return null;

  const paid = data.monthly_status.filter(m => m.status === "paid").length;
  const late = data.monthly_status.filter(m => m.status === "late").length;

  return (
    <div style={{ padding: 16 }}>
      <h1 style={s.title}>Mes Cotisations</h1>
      <p style={s.sub}>Suivi {new Date().getFullYear()}</p>

      {success && <div style={s.successBanner}>✅ {success}</div>}
      {late > 0  && <div style={s.alertBanner}>⚠️ {late} cotisation{late > 1 ? "s" : ""} en retard — Régularisez pour maintenir vos droits</div>}

      {/* Stats */}
      <div style={s.statsRow}>
        {[
          { val: paid,    label: "Mois payés",  color: "#10B981" },
          { val: late,    label: "En retard",    color: late > 0 ? "#EF4444" : "#9CA3AF" },
          { val: `${parseInt(data.total_paid_this_year).toLocaleString("fr-FR")}`, label: "FCFA payés", color: "#1a56db" },
        ].map((st, i) => (
          <div key={i} style={s.stat}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{st.val}</span>
            <span style={{ fontSize: 11, color: "#6B7280" }}>{st.label}</span>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: st.color, borderRadius: "0 0 14px 14px" }} />
          </div>
        ))}
      </div>

      <button onClick={() => setModal(true)} style={s.payBtn}>💰 Payer une cotisation</button>

      {/* Calendrier */}
      <p style={s.secTitle}>Statut par mois</p>
      <div style={s.monthGrid}>
        {data.monthly_status.map(m => {
          const st = STATUS_STYLE[m.status];
          return (
            <div key={m.month} style={{ ...s.monthCard, background: st.bg, borderColor: st.color + "40" }}>
              <span style={{ fontSize: 14 }}>{st.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{m.name.substring(0, 3)}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: st.color }}>{st.label}</span>
            </div>
          );
        })}
      </div>

      {/* Historique */}
      <p style={s.secTitle}>Historique</p>
      {data.payments.length === 0 ? (
        <div style={s.empty}><span style={{ fontSize: 36 }}>📭</span><p>Aucun paiement</p></div>
      ) : (
        data.payments.map(p => (
          <div key={p.id} style={s.histItem}>
            <div style={s.histIcon}>{p.payment_method === "Wave" ? "🌊" : p.payment_method === "Orange Money" ? "🟠" : p.payment_method === "MTN Money" ? "🟡" : "💵"}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 2px" }}>{p.payment_type === "monthly_fee" ? "Cotisation mensuelle" : "Adhésion"}</p>
              <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 2px" }}>{new Date(p.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</p>
              <p style={{ fontSize: 10, color: "#9CA3AF", margin: 0, fontFamily: "monospace" }}>{p.transaction_reference}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#10B981" }}>+{parseInt(p.amount).toLocaleString("fr-FR")}</div>
              <div style={{ fontSize: 10, color: "#6B7280" }}>FCFA</div>
            </div>
          </div>
        ))
      )}

      {/* Modal paiement */}
      {modal && (
        <div style={s.overlay} onClick={() => setModal(false)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Payer une cotisation</h3>
              <button onClick={() => setModal(false)} style={s.closeBtn}>✕</button>
            </div>
            {error && <div style={s.err}>⚠️ {error}</div>}
            <label style={s.label}>Montant (FCFA)</label>
            <input type="number" placeholder="10000" value={amount} onChange={e => setAmount(e.target.value)} style={s.input} />
            <label style={{ ...s.label, marginTop: 16 }}>Méthode de paiement</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {METHODS.map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  style={{ ...s.methodBtn, borderColor: method === m.id ? m.color : "#E5E7EB", background: method === m.id ? m.color + "15" : "#fff" }}>
                  <span style={{ fontSize: 22 }}>{m.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: method === m.id ? m.color : "#374151" }}>{m.label}</span>
                </button>
              ))}
            </div>
            <button onClick={handlePay} disabled={paying} style={s.confirmBtn}>
              {paying ? "⏳ Traitement..." : `💰 Confirmer ${amount ? parseInt(amount).toLocaleString("fr-FR") + " FCFA" : ""}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  title:        { fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 4px" },
  sub:          { fontSize: 13, color: "#6B7280", margin: "0 0 16px" },
  successBanner:{ background: "#ECFDF5", border: "1px solid #6EE7B7", borderRadius: 12, padding: "12px 16px", color: "#065F46", fontSize: 13, fontWeight: 600, marginBottom: 12 },
  alertBanner:  { background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 12, padding: "12px 16px", color: "#92400E", fontSize: 13, marginBottom: 16 },
  statsRow:     { display: "flex", gap: 10, marginBottom: 16 },
  stat:         { flex: 1, background: "#fff", borderRadius: 14, padding: "14px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, boxShadow: "0 2px 8px rgba(0,0,0,.06)", position: "relative", overflow: "hidden" },
  payBtn:       { width: "100%", background: "linear-gradient(135deg,#10B981,#059669)", color: "#fff", border: "none", borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 20, fontFamily: "'Poppins',sans-serif", boxShadow: "0 4px 15px rgba(16,185,129,.35)" },
  secTitle:     { fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 12 },
  monthGrid:    { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 24 },
  monthCard:    { borderRadius: 12, padding: "10px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, border: "1.5px solid" },
  empty:        { textAlign: "center", padding: "40px 20px", color: "#9CA3AF", fontSize: 14 },
  histItem:     { background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(0,0,0,.06)" },
  histIcon:     { width: 44, height: 44, background: "#F9FAFB", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 },
  overlay:      { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 },
  modalBox:     { background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" },
  closeBtn:     { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6B7280" },
  err:          { background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px", color: "#DC2626", fontSize: 13, marginBottom: 16 },
  label:        { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 },
  input:        { width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", fontSize: 16, color: "#111827", fontFamily: "'Poppins',sans-serif", boxSizing: "border-box" },
  methodBtn:    { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "14px 10px", border: "2px solid", borderRadius: 12, cursor: "pointer", background: "#fff", fontFamily: "'Poppins',sans-serif" },
  confirmBtn:   { width: "100%", background: "linear-gradient(135deg,#10B981,#059669)", color: "#fff", border: "none", borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'Poppins',sans-serif" },
};
