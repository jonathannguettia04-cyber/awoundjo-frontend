// src/pages/client/ClientTeleconsult.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientTeleAPI } from "../../clientApi";

// ⚠️ Numéro WhatsApp central de la mutuelle (format international, sans +)
const WHATSAPP_NUMBER = "2250759595213";

const STATUS = {
  pending:     { label: "En attente",  color: "#D97706", bg: "#FFFBEB", icon: "⏳" },
  in_progress: { label: "En cours",    color: "#0891B2", bg: "#ECFEFF", icon: "💬" },
  answered:    { label: "Répondu",     color: "#059669", bg: "#ECFDF5", icon: "✅" },
  closed:      { label: "Fermé",       color: "#64748B", bg: "#F8FAFC", icon: "🔒" },
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
  const [lastRef, setLastRef] = useState(null);
  const [lastSubject, setLastSubject] = useState("");
  const [visible, setVis]     = useState(false);
  const [active,  setActive]  = useState(null); // consultation ouverte (chat)

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
      const res = await clientTeleAPI.send({ subject, message });
      setSuccess("Consultation envoyée ! Un médecin vous répondra bientôt.");
      setLastRef(res.data.data?.id);
      setLastSubject(subject?.trim() || "Téléconsultation (motif non précisé)");
      setModal(false); setSubject(""); setMessage("");
      load();
      setTimeout(() => setSuccess(""), 8000);
    } catch (err) { setError(err.response?.data?.error || "Erreur"); }
    finally { setSending(false); }
  };

  if (active) {
    return <ChatView consultation={active} onBack={() => { setActive(null); load(); }} />;
  }

  // Récupère les infos du client stockées localement après connexion (cf. ClientLogin.jsx)
  const getClientInfo = () => {
    try {
      const raw = localStorage.getItem("client_data");
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return {};
  };
  const clientInfo = getClientInfo();

  const waText = encodeURIComponent(
    lastRef
      ? `Bonjour, je viens d'envoyer une nouvelle demande de téléconsultation sur l'application Awoundjô.\n\n👤 Nom : ${clientInfo.name || "Non renseigné"}\n🔢 N° Mutualiste : ${clientInfo.mutual_number || "Non renseigné"}\n📋 Motif : ${lastSubject}\n\nMerci de me mettre en relation avec un médecin dans les plus brefs délais. 🙏`
      : `Bonjour, j'ai une question concernant ma téléconsultation sur l'application Awoundjô.`
  );

  return (
    <div style={{ padding: "16px 16px 100px", fontFamily: "'Poppins',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 4px", letterSpacing: -.3 }}>Téléconsultation</h1>
      <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px" }}>Consultez un médecin à distance</p>

      {success && (
        <div style={{ background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", border: "1px solid #6EE7B7", borderRadius: 14, padding: "14px 16px", color: "#065F46", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          <p style={{ margin: "0 0 8px" }}>✅ {success}</p>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`} target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#25D366", color: "#fff", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
            📲 Notifier via WhatsApp
          </a>
        </div>
      )}

      {/* Bouton nouvelle consultation */}
      <button onClick={() => { setError(""); setModal(true); }} style={{
        width: "100%", background: "linear-gradient(135deg,#0891B2,#164e63)",
        color: "#fff", border: "none", borderRadius: 16, padding: 16,
        fontSize: 15, fontWeight: 700, cursor: "pointer",
        fontFamily: "'Poppins',sans-serif",
        boxShadow: "0 6px 20px rgba(8,145,178,.35)",
        marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "all .5s cubic-bezier(.34,1.56,.64,1)",
      }}>
        💬 Nouvelle consultation
      </button>

      {/* Bouton WhatsApp permanent */}
      <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" style={{
        width: "100%", boxSizing: "border-box", background: "#fff", border: "1.5px solid #25D366",
        color: "#1B7A43", borderRadius: 14, padding: 13, fontSize: 13, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        marginBottom: 24, textDecoration: "none", fontFamily: "'Poppins',sans-serif",
      }}>
        📲 Contacter la mutuelle sur WhatsApp
      </a>

      {/* Info card */}
      <div style={{ background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", border: "1px solid #BFDBFE", borderRadius: 16, padding: "14px 16px", marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start", opacity: visible ? 1 : 0, transition: "all .5s .1s" }}>
        <span style={{ fontSize: 24 }}>ℹ️</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8", margin: "0 0 3px" }}>Comment ça marche ?</p>
          <p style={{ fontSize: 12, color: "#3B82F6", margin: 0, lineHeight: 1.5 }}>
            Envoyez votre message avec vos symptômes. Un médecin partenaire vous répond dans les 24h directement dans cette messagerie.
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
          const preview = c.last_message || c.message || "";
          return (
            <div key={c.id} onClick={() => setActive(c)} style={{
              background: "#fff", borderRadius: 16, marginBottom: 12,
              boxShadow: "0 2px 10px rgba(0,0,0,.06)",
              overflow: "hidden", cursor: "pointer",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-10px)",
              transition: `all .4s ${i * .06}s`,
            }}>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 44, height: 44, background: st.bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, position: "relative" }}>
                  {st.icon}
                  {c.unread_count > 0 && (
                    <span style={{ position: "absolute", top: -4, right: -4, background: "#DC2626", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                      {c.unread_count}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: 0 }}>{c.subject || "Consultation"}</p>
                    <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, borderRadius: 8, padding: "3px 8px" }}>{st.label}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 3px" }}>
                    {preview.substring(0, 60)}{preview.length > 60 ? "..." : ""}
                  </p>
                  <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
                    {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
                <span style={{ color: "#94A3B8", fontSize: 14 }}>›</span>
              </div>
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

// ════════════════════════════════════════════════════════════════
// ─── Vue chat (thread) ───────────────────────────────────────────
// ════════════════════════════════════════════════════════════════
function ChatView({ consultation, onBack }) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState(consultation.status);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [prescription, setPrescription] = useState(null);
  const [showRx, setShowRx] = useState(false);
  const bottomRef = useRef(null);
  const closed = status === "closed";

  const load = async () => {
    try {
      const res = await clientTeleAPI.getMessages(consultation.id);
      setMessages(res.data.data);
      setStatus(res.data.status);
    } catch (e) { console.error(e); }
  };

  const loadRx = async () => {
    try {
      const res = await clientTeleAPI.getPrescription(consultation.id);
      setPrescription(res.data.data);
    } catch (e) { /* pas d'ordonnance */ }
  };

  useEffect(() => { load(); loadRx(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    setError(""); setSending(true);
    try {
      await clientTeleAPI.sendMessage(consultation.id, input.trim());
      setInput("");
      await load();
    } catch (e) { setError(e.response?.data?.error || "Erreur"); }
    finally { setSending(false); }
  };

  const st = STATUS[status] || STATUS.pending;

  return (
    <div style={{ fontFamily: "'Poppins',sans-serif", background: "#F8FAFC", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0891B2,#164e63)", padding: "16px", color: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,.15)", border: "none", color: "#fff", borderRadius: 10, width: 36, height: 36, fontSize: 16, cursor: "pointer" }}>←</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{consultation.subject || "Consultation"}</p>
          <p style={{ margin: 0, fontSize: 11, opacity: .85 }}>{st.icon} {st.label}</p>
        </div>
        {prescription && (
          <button onClick={() => setShowRx(true)} title="Ordonnance" style={{ background: "rgba(255,255,255,.15)", border: "none", color: "#fff", borderRadius: 10, width: 36, height: 36, fontSize: 16, cursor: "pointer" }}>📋</button>
        )}
      </div>

      {prescription && (
        <div style={{ padding: "10px 16px", background: "#ECFDF5", borderBottom: "1px solid #6EE7B7", cursor: "pointer" }} onClick={() => setShowRx(true)}>
          <p style={{ margin: 0, fontSize: 12, color: "#065F46", fontWeight: 700 }}>💊 Une ordonnance est disponible — appuyez pour la voir</p>
        </div>
      )}

      {/* Thread */}
      <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
        {messages.map(m => (
          <div key={m.id} style={{
            alignSelf: m.sender_type === "client" ? "flex-end" : "flex-start",
            maxWidth: "80%",
            background: m.sender_type === "client" ? "linear-gradient(135deg,#0891B2,#164e63)" : "#fff",
            color: m.sender_type === "client" ? "#fff" : "#0F172A",
            borderRadius: 16,
            padding: "10px 14px",
            boxShadow: "0 2px 8px rgba(0,0,0,.05)",
            fontSize: 13, lineHeight: 1.5,
          }}>
            {m.sender_type === "medecin" && (
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#0891B2" }}>👨‍⚕️ {m.sender_name || "Médecin"}</p>
            )}
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{m.message}</p>
            <p style={{ margin: "4px 0 0", fontSize: 10, opacity: .6, textAlign: "right" }}>
              {new Date(m.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <div style={{ margin: "0 16px 8px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "10px 14px", color: "#DC2626", fontSize: 12 }}>⚠️ {error}</div>}

      {/* Input */}
      {closed ? (
        <div style={{ padding: 16, textAlign: "center", color: "#94A3B8", fontSize: 13, fontWeight: 600 }}>🔒 Cette consultation est clôturée</div>
      ) : (
        <div style={{ padding: 12, background: "#fff", borderTop: "1px solid #F1F5F9", display: "flex", gap: 8 }}>
          <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Votre message..."
            style={{ ...ls.input, flex: 1, minHeight: 44, maxHeight: 100, resize: "vertical" }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button onClick={send} disabled={sending} style={{ ...ls.btnPrimary, padding: "0 18px" }}>➤</button>
        </div>
      )}

      {/* Ordonnance modal */}
      {showRx && prescription && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }} onClick={() => setShowRx(false)}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0F172A" }}>💊 Ordonnance</h3>
              <button onClick={() => setShowRx(false)} style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 14, cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748B" }}>Prescrite par {prescription.practitioner_name || prescription.medecin_name || "votre médecin"}</p>
            <div style={{ background: "#ECFDF5", border: "1px solid #6EE7B7", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#047857", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{prescription.content}</p>
            </div>
            <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
              Valide jusqu'au {new Date(prescription.expires_at).toLocaleDateString("fr-FR")} — présentez cette ordonnance (numéro mutuelle) dans une pharmacie partenaire ou retrouvez-la dans votre dossier médical.
            </p>
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
  btnPrimary: { background: "linear-gradient(135deg,#0891B2,#164e63)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif" },
};
