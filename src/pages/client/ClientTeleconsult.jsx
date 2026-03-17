// src/pages/client/ClientTeleconsult.jsx
import { useEffect, useState } from "react";
import { clientTeleAPI } from "../../clientApi";

export default function ClientTeleconsult() {
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState("");

  const load = () => {
    clientTeleAPI.get().then(res => setList(res.data.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSend = async () => {
    if (!message) return setError("Message requis");
    setError(""); setSending(true);
    try {
      await clientTeleAPI.send({ subject, message });
      setModal(false); setSubject(""); setMessage(""); load();
    } catch (err) { setError(err.response?.data?.error || "Erreur"); }
    finally { setSending(false); }
  };

  const STATUS = {
    pending:  { label: "En attente", color: "#F59E0B" },
    answered: { label: "Répondu",    color: "#10B981" },
    closed:   { label: "Fermé",      color: "#9CA3AF" },
  };

  return (
    <div style={{ padding: 16, fontFamily: "'Poppins',sans-serif" }}>
      <h1 style={s.title}>Téléconsultation</h1>
      <p style={s.sub}>Envoyez un message à un médecin</p>

      <button onClick={() => setModal(true)} style={s.newBtn}>💬 Nouvelle consultation</button>

      {loading ? <div style={{ height: 80, background: "#E5E7EB", borderRadius: 14 }} />
        : list.length === 0
          ? <div style={s.empty}><span style={{ fontSize: 48 }}>💬</span><p>Aucune consultation pour l'instant</p></div>
          : list.map(c => (
            <div key={c.id} style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={s.cardTitle}>{c.subject || "Sans objet"}</p>
                <span style={{ fontSize: 11, fontWeight: 600, color: STATUS[c.status]?.color }}>
                  {STATUS[c.status]?.label}
                </span>
              </div>
              <p style={s.cardMsg}>{c.message.substring(0, 100)}{c.message.length > 100 ? "..." : ""}</p>
              <p style={s.cardDate}>{new Date(c.created_at).toLocaleDateString("fr-FR")}</p>
              {c.response && (
                <div style={{ background: "#ECFDF5", borderRadius: 8, padding: "8px 12px", marginTop: 8 }}>
                  <p style={{ fontSize: 12, color: "#065F46", margin: 0 }}>💊 Réponse : {c.response}</p>
                </div>
              )}
            </div>
          ))
      }

      {modal && (
        <div style={s.overlay} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>💬 Nouvelle consultation</h3>
              <button onClick={() => setModal(false)} style={s.closeBtn}>✕</button>
            </div>
            {error && <div style={s.err}>⚠️ {error}</div>}
            <label style={s.label}>Objet (optionnel)</label>
            <input type="text" placeholder="Ex: Douleur abdominale"
              value={subject} onChange={e => setSubject(e.target.value)}
              style={{ ...s.input, marginBottom: 14 }} />
            <label style={s.label}>Votre message *</label>
            <textarea placeholder="Décrivez vos symptômes en détail..."
              value={message} onChange={e => setMessage(e.target.value)}
              style={{ ...s.input, minHeight: 120, resize: "vertical", marginBottom: 16 }} />
            <button onClick={handleSend} disabled={sending} style={s.submitBtn}>
              {sending ? "⏳ Envoi..." : "📤 Envoyer au médecin"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  title:    { fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 4px" },
  sub:      { fontSize: 13, color: "#6B7280", margin: "0 0 16px" },
  newBtn:   { width: "100%", background: "linear-gradient(135deg,#06B6D4,#0891B2)", color: "#fff", border: "none", borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 20, fontFamily: "'Poppins',sans-serif", boxShadow: "0 4px 15px rgba(6,182,212,.35)" },
  empty:    { textAlign: "center", padding: "40px 20px", color: "#9CA3AF", fontSize: 14 },
  card:     { background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,.06)" },
  cardTitle:{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 4px" },
  cardMsg:  { fontSize: 13, color: "#6B7280", margin: "0 0 4px" },
  cardDate: { fontSize: 11, color: "#9CA3AF", margin: 0 },
  overlay:  { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 },
  modal:    { background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" },
  closeBtn: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6B7280" },
  err:      { background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: 12, color: "#DC2626", fontSize: 13, marginBottom: 16 },
  label:    { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 },
  input:    { width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#111827", fontFamily: "'Poppins',sans-serif", boxSizing: "border-box" },
  submitBtn:{ width: "100%", background: "linear-gradient(135deg,#06B6D4,#0891B2)", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Poppins',sans-serif" },
};
