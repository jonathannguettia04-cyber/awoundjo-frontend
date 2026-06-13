// src/pages/medecin/MedecinDashboard.jsx
import { useEffect, useRef, useState } from "react";
import { medecinAuthAPI, medecinTeleAPI } from "../../medecinApi";

const STATUS = {
  pending:     { label: "En attente",  color: "#D97706", bg: "#FFFBEB" },
  in_progress: { label: "En cours",    color: "#0891B2", bg: "#ECFEFF" },
  answered:    { label: "Répondu",     color: "#059669", bg: "#ECFDF5" },
  closed:      { label: "Clôturé",     color: "#64748B", bg: "#F8FAFC" },
};

const TABS = [
  { key: "queue",  label: "📥 File d'attente" },
  { key: "mine",   label: "👤 Mes consultations" },
  { key: "closed", label: "🗂️ Historique" },
];

export default function MedecinDashboard() {
  const [medecin, setMedecin] = useState(medecinAuthAPI.getInfo());
  if (!medecin) return <Login onLogin={setMedecin} />;
  return <Dashboard medecin={medecin} onLogout={() => { medecinAuthAPI.logout(); setMedecin(null); }} />;
}

// ──────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const res = await medecinAuthAPI.login(login, password);
      onLogin(res.data.provider);
    } catch (e) { setError(e.response?.data?.error || "Erreur de connexion"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Poppins',sans-serif", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 380, boxShadow: "0 8px 30px rgba(0,0,0,.08)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>👨‍⚕️ Espace Médecin</h1>
        <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 24px" }}>Téléconsultation Awoundjô</p>
        {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "10px 14px", color: "#DC2626", fontSize: 13, marginBottom: 14 }}>⚠️ {error}</div>}
        <input placeholder="Téléphone ou email" value={login} onChange={e => setLogin(e.target.value)} style={ls.input} />
        <input placeholder="Mot de passe" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ ...ls.input, marginTop: 12, marginBottom: 20 }} />
        <button onClick={submit} disabled={loading} style={{ ...ls.btnPrimary, width: "100%", opacity: loading ? .7 : 1 }}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
function Dashboard({ medecin, onLogout }) {
  const [tab, setTab] = useState("queue");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // consultation ouverte (chat)

  const load = async () => {
    setLoading(true);
    try {
      const fn = tab === "queue" ? medecinTeleAPI.getQueue
        : tab === "mine" ? medecinTeleAPI.getMine
        : medecinTeleAPI.getClosed;
      const res = await fn();
      setItems(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab]);

  const claim = async (id) => {
    try {
      await medecinTeleAPI.claim(id);
      setTab("mine");
    } catch (e) { alert(e.response?.data?.error || "Erreur"); }
  };

  if (active) {
    return <ChatView consultation={active} onBack={() => { setActive(null); load(); }} />;
  }

  return (
    <div style={{ fontFamily: "'Poppins',sans-serif", background: "#F8FAFC", minHeight: "100vh", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0891B2,#164e63)", padding: "20px 16px 28px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, opacity: .8 }}>Connecté en tant que</p>
            <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 800 }}>{medecin.name}</p>
          </div>
          <button onClick={onLogout} style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, padding: "16px 16px 0", overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: "1 0 auto", whiteSpace: "nowrap", padding: "10px 14px", borderRadius: 12,
            border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Poppins',sans-serif",
            background: tab === t.key ? "#0891B2" : "#fff",
            color: tab === t.key ? "#fff" : "#64748B",
            boxShadow: tab === t.key ? "0 4px 12px rgba(8,145,178,.3)" : "0 1px 4px rgba(0,0,0,.05)",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Liste */}
      <div style={{ padding: 16 }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "#94A3B8", fontSize: 13, marginTop: 30 }}>Chargement...</p>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", background: "#fff", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,.05)" }}>
            <span style={{ fontSize: 40 }}>📭</span>
            <p style={{ color: "#64748B", fontSize: 14, fontWeight: 600, marginTop: 10 }}>
              {tab === "queue" ? "Aucune consultation en attente" : tab === "mine" ? "Aucune consultation en cours" : "Aucun historique"}
            </p>
          </div>
        ) : items.map(c => {
          const st = STATUS[c.status] || STATUS.pending;
          return (
            <div key={c.id} style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", marginBottom: 12, boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{c.client_name || "Patient"}</p>
                <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, borderRadius: 8, padding: "3px 8px" }}>{st.label}</span>
              </div>
              {c.mutual_number && <p style={{ margin: "0 0 4px", fontSize: 11, color: "#94A3B8" }}>N° mutuelle : {c.mutual_number} {c.client_plan ? `· ${c.client_plan}` : ""}</p>}
              <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{c.subject || "Consultation"}</p>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>
                {(c.last_message || c.message || "").substring(0, 90)}{(c.last_message || c.message || "").length > 90 ? "..." : ""}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>
                  {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
                {tab === "queue" ? (
                  <button onClick={() => claim(c.id)} style={ls.btnSmall}>✋ Prendre en charge</button>
                ) : tab === "mine" ? (
                  <button onClick={() => setActive(c)} style={{ ...ls.btnSmall, position: "relative" }}>
                    💬 Ouvrir
                    {c.unread_count > 0 && (
                      <span style={{ position: "absolute", top: -6, right: -6, background: "#DC2626", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                        {c.unread_count}
                      </span>
                    )}
                  </button>
                ) : (
                  <button onClick={() => setActive(c)} style={{ ...ls.btnSmall, background: "#F1F5F9", color: "#64748B" }}>👁️ Voir</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
function ChatView({ consultation, onBack }) {
  const [messages, setMessages] = useState([]);
  const [info, setInfo] = useState(consultation);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showRx, setShowRx] = useState(false);
  const bottomRef = useRef(null);
  const closed = info.status === "closed";

  const load = async () => {
    try {
      const res = await medecinTeleAPI.getMessages(consultation.id);
      setMessages(res.data.data);
      setInfo(prev => ({ ...prev, ...res.data.consultation }));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      await medecinTeleAPI.sendMessage(consultation.id, input.trim());
      setInput("");
      await load();
    } catch (e) { alert(e.response?.data?.error || "Erreur"); }
    finally { setSending(false); }
  };

  const release = async () => {
    if (!confirm("Libérer cette consultation vers la file commune ?")) return;
    await medecinTeleAPI.release(consultation.id);
    onBack();
  };

  const close = async () => {
    if (!confirm("Clôturer définitivement cette consultation ?")) return;
    await medecinTeleAPI.close(consultation.id);
    onBack();
  };

  return (
    <div style={{ fontFamily: "'Poppins',sans-serif", background: "#F8FAFC", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0891B2,#164e63)", padding: "16px", color: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,.15)", border: "none", color: "#fff", borderRadius: 10, width: 36, height: 36, fontSize: 16, cursor: "pointer" }}>←</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{info.client_name || "Patient"}</p>
          <p style={{ margin: 0, fontSize: 11, opacity: .85 }}>
            {info.mutual_number ? `N° ${info.mutual_number}` : ""} {info.client_plan ? `· ${info.client_plan}` : ""}
            {info.client_phone ? ` · ${info.client_phone}` : ""}
          </p>
        </div>
        {!closed && (
          <>
            <button onClick={() => setShowRx(true)} title="Ordonnance" style={{ background: "rgba(255,255,255,.15)", border: "none", color: "#fff", borderRadius: 10, width: 36, height: 36, fontSize: 16, cursor: "pointer" }}>📝</button>
            <button onClick={release} title="Libérer" style={{ background: "rgba(255,255,255,.15)", border: "none", color: "#fff", borderRadius: 10, width: 36, height: 36, fontSize: 16, cursor: "pointer" }}>↩️</button>
          </>
        )}
      </div>

      {/* Sujet initial */}
      {info.subject && (
        <div style={{ padding: "10px 16px", background: "#EFF6FF", borderBottom: "1px solid #DBEAFE" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#1D4ED8", fontWeight: 700 }}>Objet : {info.subject}</p>
        </div>
      )}

      {/* Thread */}
      <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
        {messages.map(m => (
          <div key={m.id} style={{
            alignSelf: m.sender_type === "medecin" ? "flex-end" : "flex-start",
            maxWidth: "80%",
            background: m.sender_type === "medecin" ? "linear-gradient(135deg,#0891B2,#164e63)" : "#fff",
            color: m.sender_type === "medecin" ? "#fff" : "#0F172A",
            borderRadius: 16,
            padding: "10px 14px",
            boxShadow: "0 2px 8px rgba(0,0,0,.05)",
            fontSize: 13, lineHeight: 1.5,
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, opacity: .75 }}>{m.sender_name}</p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{m.message}</p>
            <p style={{ margin: "4px 0 0", fontSize: 10, opacity: .6, textAlign: "right" }}>
              {new Date(m.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input / actions */}
      {closed ? (
        <div style={{ padding: 16, textAlign: "center", color: "#94A3B8", fontSize: 13, fontWeight: 600 }}>🔒 Consultation clôturée</div>
      ) : (
        <div style={{ padding: 12, background: "#fff", borderTop: "1px solid #F1F5F9", display: "flex", gap: 8 }}>
          <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Votre message..."
            style={{ ...ls.input, flex: 1, minHeight: 44, maxHeight: 100, resize: "vertical" }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button onClick={send} disabled={sending} style={{ ...ls.btnPrimary, padding: "0 18px" }}>➤</button>
        </div>
      )}
      {!closed && (
        <div style={{ padding: "0 16px 16px" }}>
          <button onClick={close} style={{ width: "100%", background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif" }}>
            🔒 Clôturer la consultation
          </button>
        </div>
      )}

      {showRx && <PrescriptionModal consultationId={consultation.id} onClose={() => setShowRx(false)} />}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
function PrescriptionModal({ consultationId, onClose }) {
  const [content, setContent] = useState("");
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    medecinTeleAPI.getPrescription(consultationId)
      .then(res => setExisting(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!content.trim()) return setError("Contenu requis");
    setSaving(true); setError("");
    try {
      const res = await medecinTeleAPI.createPrescription(consultationId, { content: content.trim() });
      setExisting(res.data.data);
      setSuccess(res.data.message);
    } catch (e) { setError(e.response?.data?.error || "Erreur"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0F172A" }}>📝 Ordonnance</h3>
          <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 14, cursor: "pointer" }}>✕</button>
        </div>

        {loading ? <p style={{ fontSize: 13, color: "#94A3B8" }}>Chargement...</p> : existing ? (
          <div>
            <div style={{ background: "#ECFDF5", border: "1px solid #6EE7B7", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#065F46" }}>✅ Ordonnance déjà enregistrée</p>
              <p style={{ margin: 0, fontSize: 13, color: "#047857", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{existing.content}</p>
            </div>
            <p style={{ fontSize: 11, color: "#94A3B8" }}>Valide jusqu'au {new Date(existing.expires_at).toLocaleDateString("fr-FR")} — visible par le patient et les pharmacies du réseau.</p>
          </div>
        ) : (
          <>
            {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "10px 14px", color: "#DC2626", fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>}
            {success && <div style={{ background: "#ECFDF5", border: "1px solid #6EE7B7", borderRadius: 12, padding: "10px 14px", color: "#065F46", fontSize: 13, marginBottom: 12 }}>✅ {success}</div>}
            <label style={ls.label}>Médicaments / Prescription</label>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder={"Ex:\nParacétamol 1g — 1 cp x3/j pendant 3 jours\nAmoxicilline 500mg — 1 cp x2/j pendant 7 jours"}
              style={{ ...ls.input, minHeight: 140, resize: "vertical", marginBottom: 16 }} />
            <button onClick={save} disabled={saving} style={{ ...ls.btnPrimary, width: "100%" }}>
              {saving ? "Enregistrement..." : "💾 Enregistrer l'ordonnance"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const ls = {
  label: { display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: .8 },
  input: { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "#0F172A", fontFamily: "'Poppins',sans-serif", boxSizing: "border-box", outline: "none", background: "#FAFAFA" },
  btnPrimary: { background: "linear-gradient(135deg,#0891B2,#164e63)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif" },
  btnSmall: { background: "#0891B2", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif" },
};
