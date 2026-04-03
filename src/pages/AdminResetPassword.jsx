// src/pages/AdminResetPassword.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "https://awoundjo-backend-production-ba8c.up.railway.app";

function getToken() {
  try { return localStorage.getItem("token"); } catch { return null; }
}

export default function AdminResetPassword() {
  const navigate = useNavigate();
  const [search, setSearch]     = useState("");
  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [resetting, setResetting] = useState({});
  const [revealed, setRevealed]  = useState({});
  const [toast, setToast]        = useState(null);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchClients = useCallback(async () => {
    if (!search.trim()) { setClients([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/clients?search=${encodeURIComponent(search)}&limit=20`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setClients(data.data?.clients || data.clients || []);
    } catch {
      showToast("Erreur de recherche", "err");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => fetchClients(), 400);
    return () => clearTimeout(t);
  }, [fetchClients]);

  async function handleReset(client) {
    const confirmed = window.confirm(
      `Réinitialiser le mot de passe de ${client.name} ?\n\nUn nouveau code d'accès sera généré.`
    );
    if (!confirmed) return;

    setResetting(r => ({ ...r, [client.id]: true }));
    try {
      // Appel route reset MDP client (admin)
      const res = await fetch(`${API}/api/clients/${client.id}/reset-access-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);

      const newCode = data.data?.access_code || data.access_code;
      showToast(`✅ Nouveau code généré pour ${client.name}`, "ok");
      // Afficher le code dans la ligne
      setRevealed(r => ({ ...r, [client.id]: newCode }));
    } catch (e) {
      showToast(`❌ ${e.message}`, "err");
    } finally {
      setResetting(r => ({ ...r, [client.id]: false }));
    }
  }

  function copyCode(code, clientId) {
    navigator.clipboard.writeText(code).then(() => {
      showToast("📋 Code copié !", "ok");
    });
  }

  return (
    <div style={s.page}>
      {toast && (
        <div style={{
          ...s.toast,
          background: toast.type === "ok" ? "#059669" : "#DC2626",
        }}>{toast.msg}</div>
      )}

      <button onClick={() => navigate("/hub")} style={s.back}>← Retour au hub</button>

      <div style={s.header}>
        <h1 style={s.title}>🔑 Reset MDP clients</h1>
        <p style={s.subtitle}>
          Recherchez un client puis générez un nouveau code d'accès.
          Le client devra l'utiliser à sa prochaine connexion.
        </p>
      </div>

      {/* Barre de recherche */}
      <div style={s.searchBox}>
        <input
          style={s.searchInput}
          placeholder="🔍 Rechercher par nom, téléphone ou N° mutuel..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
        {loading && <div style={s.spinnerSmall} />}
      </div>

      {/* Notice */}
      <div style={s.notice}>
        ℹ️ Le nouveau code d'accès est à <strong>communiquer directement</strong> au client par SMS ou appel.
        Notez-le avant de fermer cette page.
      </div>

      {/* Liste résultats */}
      {!search.trim() ? (
        <div style={s.empty}>Tapez un nom ou un numéro pour rechercher un client.</div>
      ) : clients.length === 0 && !loading ? (
        <div style={s.empty}>Aucun client trouvé pour « {search} ».</div>
      ) : (
        <div style={s.list}>
          {clients.map(c => {
            const newCode = revealed[c.id];
            return (
              <div key={c.id} style={s.card}>
                <div style={s.cardLeft}>
                  <div style={s.avatar}>{c.name?.charAt(0).toUpperCase()}</div>
                  <div>
                    <p style={s.clientName}>{c.name}</p>
                    <p style={s.clientInfo}>{c.phone} · {c.city || "—"} · <strong>{c.plan}</strong></p>
                    <p style={s.clientMeta}>N° {c.mutual_number}</p>
                  </div>
                </div>

                <div style={s.cardRight}>
                  {newCode ? (
                    <div style={s.codeBox}>
                      <span style={s.codeLabel}>Nouveau code :</span>
                      <span style={s.code}>{newCode}</span>
                      <button
                        onClick={() => copyCode(newCode, c.id)}
                        style={s.copyBtn}
                        title="Copier"
                      >📋</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleReset(c)}
                      disabled={resetting[c.id]}
                      style={{
                        ...s.resetBtn,
                        opacity: resetting[c.id] ? 0.6 : 1,
                        cursor:  resetting[c.id] ? "not-allowed" : "pointer",
                      }}
                    >
                      {resetting[c.id] ? "⏳ En cours..." : "🔑 Réinitialiser"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  page:         { maxWidth: 800, margin: "0 auto", padding: "32px 24px", fontFamily: "'DM Sans',system-ui,sans-serif" },
  toast:        { position: "fixed", top: 20, right: 20, color: "#fff", padding: "12px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,.2)" },
  back:         { background: "none", border: "none", color: "#7C3AED", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 20, padding: 0 },
  header:       { marginBottom: 24 },
  title:        { fontSize: 26, fontWeight: 900, color: "#0F172A", margin: "0 0 6px" },
  subtitle:     { fontSize: 14, color: "#64748B", margin: 0, lineHeight: 1.6 },

  searchBox:    { position: "relative", marginBottom: 14 },
  searchInput:  { width: "100%", padding: "12px 16px", border: "2px solid #E2E8F0", borderRadius: 12, fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border-color .15s" },
  spinnerSmall: { position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, border: "3px solid #E2E8F0", borderTopColor: "#7C3AED", borderRadius: "50%", animation: "spin 0.7s linear infinite" },

  notice:       { background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#1D4ED8", marginBottom: 20 },

  empty:        { textAlign: "center", color: "#94A3B8", padding: "50px 0", fontSize: 15 },
  list:         { display: "flex", flexDirection: "column", gap: 12 },
  card:         { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
  cardLeft:     { display: "flex", gap: 14, alignItems: "center", flex: 1 },
  avatar:       { width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#7C3AED,#2563EB)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, flexShrink: 0 },
  clientName:   { fontSize: 15, fontWeight: 800, color: "#0F172A", margin: "0 0 3px" },
  clientInfo:   { fontSize: 13, color: "#475569", margin: "0 0 2px" },
  clientMeta:   { fontSize: 12, color: "#94A3B8", margin: 0 },

  cardRight:    { display: "flex", alignItems: "center", gap: 10 },
  resetBtn:     { background: "#7C3AED", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, fontFamily: "inherit" },

  codeBox:      { display: "flex", alignItems: "center", gap: 10, background: "#F0FDF4", border: "1.5px solid #A7F3D0", borderRadius: 10, padding: "8px 14px" },
  codeLabel:    { fontSize: 12, color: "#059669", fontWeight: 600 },
  code:         { fontSize: 18, fontWeight: 900, color: "#0F172A", letterSpacing: 2, fontFamily: "monospace" },
  copyBtn:      { background: "none", border: "none", cursor: "pointer", fontSize: 18 },
};
