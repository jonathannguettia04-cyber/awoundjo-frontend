// src/pages/client/ClientTeleconsult.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientTeleAPI } from "../../clientApi";

const STATUS = {
  pending:  { label: "En attente", color: "#D97706", bg: "#FFFBEB", icon: "⏳" },
  answered: { label: "Répondu",    color: "#059669", bg: "#ECFDF5", icon: "✅" },
  closed:   { label: "Fermé",      color: "#64748B", bg: "#F8FAFC", icon: "🔒" },
};

export default function ClientTeleconsult() {
  const navigate  = useNavigate();
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [visible, setVis]     = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = () => {
    clientTeleAPI.get()
      .then(res => { setList(res.data.data); setTimeout(() => setVis(true), 100); })
      .catch(() => navigate("/client/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSend = async () => {
    if (!message) return setError("Message requis");
    setError(""); setSending(true);
    try {
      await clientTeleAPI.send({ subject, message });
      setSuccess("Consultation envoyée ! Un médecin vous répondra bientôt.");
      setModal(false); setSubject(""); setMessage("");
      load();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) { setError(err.response?.data?.error || "Erreur"); }
    finally { setSending(false); }
  };

  return (
    <div style={{ padding: "16px 16px 100px", fontFamily: "'Poppins',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 4px", letterSpacing: -.3 }}>Téléconsultation</h1>
      <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px" }}>Consultez un médecin à distance</p>

      {success && (
        <div style={{ background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", border: "1px solid #6EE7B7", borderRadius: 14, padding: "14px 16px", color: "#065F46", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          ✅ {success}
        </div>
      )}

      {/* Bouton nouvelle consultation */}
      <button onClick={() => { setError(""); setModal(true); }} style={{
        width: "100%", background: "linear-gradient(135deg,#0891B2,#164e63)",
        color: "#fff", border: "none", borderRadius: 16, padding: 16,
        fontSize: 15, fontWeight: 700, cursor: "pointer",
        fontFamily: "'Poppins',sans-serif",
        boxShadow: "0 6px 20px rgba(8,145,178,.35)",
        marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "all .5s cubic-bezier(.34,1.56,.64,1)",
      }}>
        💬 Nouvelle consultation
      </button>

      {/* Info card */}
      <div style={{ background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", border: "1px solid #BFDBFE", borderRadius: 16, padding: "14px 16px", marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start", opacity: visible ? 1 : 0, transition: "all .5s .1s" }}>
        <span style={{ fontSize: 24 }}>ℹ️</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8", margin: "0 0 3px" }}>Comment ça marche ?</p>
          <p style={{ fontSize: 12, color: "#3B82F6", margin: 0, lineHeight: 1.5 }}>
            Envoyez votre message avec vos symptômes. Un médecin partenaire vous répond dans les 24h.
          </p>
        </div>
      </div>

      {/* Liste consultations */}
      {loading ? (
        <Skeleton />
      ) : list.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", background: "#fff", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,.05)" }}>
          <span style={{ fontSize: 48 }}>💬</span>
          <p style={{ color: "#64748B", fontSize: 15, fontWeight: 600, margin: "12px 0 4px" }}>Aucune consultation</p>
          <p style={{ color: "#94A3B8", fontSize: 13, margin: "0 0 16px" }}>Envoyez votre première consultation</p>
          <button onClick={() => setModal(true)} style={{ background: "linear-gradient(135deg,#0891B2,#164e63)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif" }}>
            💬 Commencer
          </button>
        </div>
      ) : (
        list.map((c, i) => {
          const st = STATUS[c.status] || STATUS.pending;
          const isOpen = expanded === c.id;
          return (
            <div key={c.id} style={{
              background: "#fff", borderRadius: 16, marginBottom: 12,
              boxShadow: "0 2px 10px rgba(0,0,0,.06)",
              overflow: "hidden",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-10px)",
              transition: `all .4s ${i * .06}s`,
            }}>
              <div style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12 }}
                onClick={() => setExpanded(isOpen ? null : c.id)}>
                <div style={{ width: 44, height: 44, background: st.bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  {st.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: 0 }}>{c.subject || "Consultation"}</p>
                    <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, borderRadius: 8, padding: "3px 8px" }}>{st.label}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 3px" }}>
                    {c.message.substring(0, 60)}{c.message.length > 60 ? "..." : ""}
                  </p>
                  <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
                    {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
                <span style={{ color: "#94A3B8", fontSize: 14, transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>▼</span>
              </div>

              {isOpen && (
                <div style={{ borderTop: "1px solid #F1F5F9", padding: "14px 16px", background: "#FAFAFA" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#475569", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: .8 }}>Votre message</p>
                  <p style={{ fontSize: 13, color: "#0F172A", margin: "0 0 12px", lineHeight: 1.6 }}>{c.message}</p>
                  {c.response && (
                    <div style={{ background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", borderRadius: 12, padding: "12px 14px" }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#065F46", margin: "0 0 4px" }}>💊 Réponse du médecin</p>
                      <p style={{ fontSize: 13, color: "#047857", margin: 0, lineHeight: 1.6 }}>{c.response}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Modal nouvelle consultation */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}
          onClick={() => setModal(false)}>
          <div style={{ background: "#fff", borderRadius: "28px 28px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0F172A" }}>💬 Nouvelle consultation</h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94A3B8" }}>Réponse sous 24h</p>
              </div>
              <button onClick={() => setModal(false)} style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>

            {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 16px", color: "#DC2626", fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}

            <label style={ls.label}>Objet (optionnel)</label>
            <input type="text" placeholder="Ex: Douleur abdominale" value={subject}
              onChange={e => setSubject(e.target.value)} style={{ ...ls.input, marginBottom: 14 }} />

            <label style={ls.label}>Décrivez vos symptômes *</label>
            <textarea placeholder="Décrivez vos symptômes en détail : depuis quand, intensité, localisation..."
              value={message} onChange={e => setMessage(e.target.value)}
              style={{ ...ls.input, minHeight: 140, resize: "vertical", marginBottom: 20 }} />

            <button onClick={handleSend} disabled={sending} style={{
              width: "100%", background: sending ? "#94A3B8" : "linear-gradient(135deg,#0891B2,#164e63)",
              color: "#fff", border: "none", borderRadius: 14, padding: 16,
              fontSize: 15, fontWeight: 700, cursor: sending ? "not-allowed" : "pointer",
              fontFamily: "'Poppins',sans-serif",
              boxShadow: sending ? "none" : "0 6px 20px rgba(8,145,178,.35)",
            }}>
              {sending ? "⏳ Envoi en cours..." : "📤 Envoyer au médecin"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: 80, borderRadius: 16, marginBottom: 12, background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      ))}
    </div>
  );
}

const ls = {
  label: { display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: .8 },
  input: { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "#0F172A", fontFamily: "'Poppins',sans-serif", boxSizing: "border-box", outline: "none", background: "#FAFAFA" },
};
