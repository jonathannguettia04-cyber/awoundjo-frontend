// src/pages/AdminValidationClients.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "https://awoundjo-backend-production-ba8c.up.railway.app";

function getToken() {
  try { return localStorage.getItem("token"); } catch { return null; }
}

const STATUS_VALIDATION = {
  pending:  { label: "En attente",  color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  approved: { label: "Approuvé",   color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
  rejected: { label: "Rejeté",     color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
};

export default function AdminValidationClients() {
  const navigate = useNavigate();
  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("pending");
  const [search, setSearch]     = useState("");
  const [acting, setActing]     = useState({});
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 200 });
      if (search) params.set("search", search);
      const res = await fetch(`${API}/api/clients?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      const all = data.data?.clients || data.clients || [];
      // filtre côté client sur status_validation
      setClients(filter === "all" ? all : all.filter(c => c.status_validation === filter));
    } catch {
      showToast("Erreur chargement clients", "err");
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  async function handleAction(clientId, action) {
    setActing(a => ({ ...a, [clientId]: action }));
    try {
      const res = await fetch(`${API}/api/clients/${clientId}/validate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      showToast(action === "approve" ? "✅ Client approuvé !" : "🚫 Client rejeté", "ok");
      fetchClients();
    } catch (e) {
      showToast(`❌ ${e.message}`, "err");
    } finally {
      setActing(a => ({ ...a, [clientId]: null }));
    }
  }

  const filters = [
    { key: "pending",  label: "⏳ En attente" },
    { key: "approved", label: "✅ Approuvés"  },
    { key: "rejected", label: "🚫 Rejetés"    },
    { key: "all",      label: "Tous"           },
  ];

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
        <h1 style={s.title}>✅ Validation des clients</h1>
        <p style={s.subtitle}>Approuvez ou rejetez les demandes d'inscription</p>
      </div>

      {/* Filtres + recherche */}
      <div style={s.toolbar}>
        <div style={s.filters}>
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                ...s.filterBtn,
                background: filter === f.key ? "#7C3AED" : "#fff",
                color:      filter === f.key ? "#fff"    : "#64748B",
                border:     `1.5px solid ${filter === f.key ? "#7C3AED" : "#E2E8F0"}`,
              }}
            >{f.label}</button>
          ))}
        </div>
        <input
          style={s.searchInput}
          placeholder="🔍 Rechercher nom, téléphone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && fetchClients()}
        />
      </div>

      {loading ? (
        <div style={s.center}><div style={s.spinner} /></div>
      ) : clients.length === 0 ? (
        <div style={s.empty}>Aucun client {filter !== "all" ? `"${STATUS_VALIDATION[filter]?.label || filter}"` : ""} trouvé.</div>
      ) : (
        <div style={s.list}>
          {clients.map(c => {
            const sv = STATUS_VALIDATION[c.status_validation] || STATUS_VALIDATION.pending;
            const isPending = c.status_validation === "pending";
            return (
              <div key={c.id} style={s.card}>
                <div style={s.cardLeft}>
                  <div style={s.avatar}>{c.name?.charAt(0).toUpperCase()}</div>
                  <div>
                    <p style={s.clientName}>{c.name}</p>
                    <p style={s.clientInfo}>{c.phone} · {c.city || "—"} · <strong>{c.plan}</strong></p>
                    <p style={s.clientMeta}>N° {c.mutual_number} · Agent : {c.agent_name || "—"}</p>
                    <p style={s.clientDate}>Inscrit le {c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR") : "—"}</p>
                  </div>
                </div>

                <div style={s.cardRight}>
                  <span style={{ ...s.badge, background: sv.bg, color: sv.color, border: `1px solid ${sv.border}` }}>
                    {sv.label}
                  </span>
                  <span style={{
                    ...s.badge,
                    background: c.status_payment === "paid" ? "#ECFDF5" : "#FFF7ED",
                    color:      c.status_payment === "paid" ? "#059669" : "#D97706",
                    border:     `1px solid ${c.status_payment === "paid" ? "#A7F3D0" : "#FED7AA"}`,
                  }}>
                    {c.status_payment === "paid" ? "💳 Payé" : "💳 Non payé"}
                  </span>

                  {isPending && (
                    <div style={s.actions}>
                      <button
                        onClick={() => handleAction(c.id, "approve")}
                        disabled={!!acting[c.id]}
                        style={{ ...s.actionBtn, background: "#059669" }}
                      >
                        {acting[c.id] === "approve" ? "⏳" : "✅"} Approuver
                      </button>
                      <button
                        onClick={() => handleAction(c.id, "reject")}
                        disabled={!!acting[c.id]}
                        style={{ ...s.actionBtn, background: "#DC2626" }}
                      >
                        {acting[c.id] === "reject" ? "⏳" : "🚫"} Rejeter
                      </button>
                    </div>
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
  page:        { maxWidth: 900, margin: "0 auto", padding: "32px 24px", fontFamily: "'DM Sans',system-ui,sans-serif" },
  toast:       { position: "fixed", top: 20, right: 20, color: "#fff", padding: "12px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,.2)" },
  back:        { background: "none", border: "none", color: "#7C3AED", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 20, padding: 0 },
  header:      { marginBottom: 24 },
  title:       { fontSize: 26, fontWeight: 900, color: "#0F172A", margin: "0 0 6px" },
  subtitle:    { fontSize: 14, color: "#64748B", margin: 0 },

  toolbar:     { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 20 },
  filters:     { display: "flex", gap: 8, flexWrap: "wrap" },
  filterBtn:   { padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" },
  searchInput: { flex: 1, minWidth: 200, padding: "8px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none" },

  center:      { display: "flex", justifyContent: "center", padding: 60 },
  spinner:     { width: 36, height: 36, border: "4px solid #E2E8F0", borderTopColor: "#7C3AED", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  empty:       { textAlign: "center", color: "#94A3B8", padding: "60px 0", fontSize: 15 },

  list:        { display: "flex", flexDirection: "column", gap: 12 },
  card:        { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
  cardLeft:    { display: "flex", gap: 14, alignItems: "center", flex: 1 },
  avatar:      { width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#7C3AED,#2563EB)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, flexShrink: 0 },
  clientName:  { fontSize: 15, fontWeight: 800, color: "#0F172A", margin: "0 0 3px" },
  clientInfo:  { fontSize: 13, color: "#475569", margin: "0 0 2px" },
  clientMeta:  { fontSize: 12, color: "#94A3B8", margin: "0 0 2px" },
  clientDate:  { fontSize: 11, color: "#CBD5E1", margin: 0 },

  cardRight:   { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 },
  badge:       { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },
  actions:     { display: "flex", gap: 8 },
  actionBtn:   { color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
};
