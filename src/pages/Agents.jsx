// src/pages/Agents.jsx
import { useEffect, useState } from "react";
import { agentsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value: "AGENT",       label: "Commercial",              icon: "🤝", color: "#059669", bg: "#ECFDF5", desc: "Enregistre clients et paiements" },
  { value: "MANAGER",     label: "Responsable Commercial",  icon: "📊", color: "#0891B2", bg: "#ECFEFF", desc: "Gère l'équipe commerciale" },
  { value: "CONSEILLERE", label: "Conseillère Clientèle",   icon: "💼", color: "#DB2777", bg: "#FDF2F8", desc: "Clients, établissements, exports" },
  { value: "ADMIN",       label: "Administrateur Général",  icon: "🔐", color: "#7C3AED", bg: "#F5F3FF", desc: "Accès complet à la plateforme" },
];

const STATUS_CFG = {
  active:    { label: "Actif",      color: "#059669", bg: "#ECFDF5" },
  suspended: { label: "Suspendu",   color: "#EF4444", bg: "#FEF2F2" },
  inactive:  { label: "Inactif",    color: "#94A3B8", bg: "#F1F5F9" },
};

const roleConfig = (role) => ROLES.find(r => r.value === role?.toUpperCase()) || ROLES[0];

export default function Agents() {
  const { user } = useAuth();
  const [agents,    setAgents]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null); // null | "create" | agent object
  const [filter,    setFilter]    = useState("ALL");
  const [search,    setSearch]    = useState("");
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const [form,      setForm]      = useState({ name: "", phone: "", email: "", role: "AGENT", password: "", zone: "" });
  const [saving,    setSaving]    = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await agentsAPI.getAll();
      setAgents(data.agents || data || []);
    } catch { setError("Erreur chargement agents"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (modal === "create") {
        await agentsAPI.create(form);
        setSuccess("Agent créé avec succès");
      } else {
        await agentsAPI.update(modal.id, form);
        setSuccess("Agent mis à jour");
      }
      setModal(null);
      setForm({ name: "", phone: "", email: "", role: "AGENT", password: "", zone: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur");
    } finally { setSaving(false); }
  }

  function openEdit(agent) {
    setForm({ name: agent.name, phone: agent.phone, email: agent.email || "", role: (agent.role || "AGENT").toUpperCase(), password: "", zone: agent.zone || "" });
    setModal(agent);
  }

  async function toggleStatus(agent) {
    try {
      const newStatus = agent.status === "active" ? "suspended" : "active";
      await agentsAPI.update(agent.id, { status: newStatus });
      setSuccess(`Agent ${newStatus === "active" ? "réactivé" : "suspendu"}`);
      load();
    } catch { setError("Erreur changement statut"); }
  }

  const filtered = agents.filter(a => {
    const matchRole   = filter === "ALL" || (a.role || "AGENT").toUpperCase() === filter;
    const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.phone?.includes(search);
    return matchRole && matchSearch;
  });

  const counts = ROLES.reduce((acc, r) => {
    acc[r.value] = agents.filter(a => (a.role || "AGENT").toUpperCase() === r.value).length;
    return acc;
  }, { ALL: agents.length });

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Gestion des agents</h1>
          <p style={s.sub}>{agents.length} compte(s) enregistré(s)</p>
        </div>
        <button onClick={() => { setModal("create"); setForm({ name: "", phone: "", email: "", role: "AGENT", password: "", zone: "" }); }} style={s.btnPrimary}>
          + Nouvel agent
        </button>
      </div>

      {error   && <Alert type="error"   msg={error}   onClose={() => setError("")} />}
      {success && <Alert type="success" msg={success} onClose={() => setSuccess("")} />}

      {/* Filtres par rôle */}
      <div style={s.filters}>
        <FilterChip label={`Tous (${counts.ALL})`} active={filter === "ALL"} onClick={() => setFilter("ALL")} color="#2563EB" />
        {ROLES.map(r => (
          <FilterChip key={r.value} label={`${r.icon} ${r.label} (${counts[r.value] || 0})`} active={filter === r.value} onClick={() => setFilter(r.value)} color={r.color} />
        ))}
      </div>

      {/* Recherche */}
      <div style={s.searchRow}>
        <div style={s.searchBox}>
          <span>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou téléphone…" style={s.searchInput} />
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div style={s.empty}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>Aucun agent trouvé</div>
      ) : (
        <div style={s.table}>
          <div style={s.tableHeader}>
            <span style={s.th}>Agent</span>
            <span style={s.th}>Rôle</span>
            <span style={s.th}>Zone</span>
            <span style={s.th}>Statut</span>
            <span style={s.th}>Actions</span>
          </div>
          {filtered.map(agent => {
            const rc     = roleConfig(agent.role);
            const sc     = STATUS_CFG[agent.status] || STATUS_CFG.active;
            return (
              <div key={agent.id} style={s.row}>
                <div style={s.agentCell}>
                  <div style={{ ...s.avatar, background: rc.bg, color: rc.color }}>
                    {agent.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={s.agentName}>{agent.name}</p>
                    <p style={s.agentPhone}>{agent.phone}</p>
                  </div>
                </div>
                <div>
                  <span style={{ ...s.rolePill, background: rc.bg, color: rc.color }}>
                    {rc.icon} {rc.label}
                  </span>
                </div>
                <span style={s.zoneCell}>{agent.zone || "—"}</span>
                <span style={{ ...s.statusPill, background: sc.bg, color: sc.color }}>
                  {sc.label}
                </span>
                <div style={s.actions}>
                  <button onClick={() => openEdit(agent)} style={s.btnEdit}>Modifier</button>
                  <button onClick={() => toggleStatus(agent)} style={{ ...s.btnToggle, color: agent.status === "active" ? "#EF4444" : "#059669" }}>
                    {agent.status === "active" ? "Suspendre" : "Réactiver"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal création/édition */}
      {modal && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>{modal === "create" ? "Créer un agent" : `Modifier — ${modal.name}`}</h2>
              <button onClick={() => setModal(null)} style={s.closeBtn}>✕</button>
            </div>

            {/* Sélection du rôle */}
            <p style={s.fieldLabel}>Rôle *</p>
            <div style={s.roleGrid}>
              {ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
                  style={{ ...s.roleCard, border: `2px solid ${form.role === r.value ? r.color : "#E2E8F0"}`, background: form.role === r.value ? r.bg : "#fff" }}>
                  <span style={{ fontSize: 22 }}>{r.icon}</span>
                  <p style={{ ...s.roleCardLabel, color: form.role === r.value ? r.color : "#1E293B" }}>{r.label}</p>
                  <p style={s.roleCardDesc}>{r.desc}</p>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div style={s.formGrid}>
                <Field label="Nom complet *">
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Prénom Nom" style={s.input} />
                </Field>
                <Field label="Téléphone *">
                  <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0707…" style={s.input} />
                </Field>
                <Field label="Email">
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" style={s.input} />
                </Field>
                <Field label="Zone / Secteur">
                  <input value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} placeholder="Ex: Yopougon, Plateau…" style={s.input} />
                </Field>
              </div>
              <Field label={modal === "create" ? "Mot de passe *" : "Nouveau mot de passe (laisser vide pour ne pas changer)"}>
                <input type="password" required={modal === "create"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" style={s.input} />
              </Field>

              {error && <div style={{ color: "#DC2626", fontSize: 13, marginTop: 8 }}>⚠️ {error}</div>}

              <div style={s.modalActions}>
                <button type="button" onClick={() => setModal(null)} style={s.btnCancel}>Annuler</button>
                <button type="submit" disabled={saving} style={s.btnSave}>
                  {saving ? "Enregistrement…" : modal === "create" ? "Créer l'agent" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${active ? color : "#E2E8F0"}`,
      background: active ? color : "#fff", color: active ? "#fff" : "#64748B",
      fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
    }}>{label}</button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={s.fieldLabel}>{label}</p>
      {children}
    </div>
  );
}

function Alert({ type, msg, onClose }) {
  const cfg = type === "error"
    ? { bg: "#FEF2F2", border: "#FECACA", color: "#DC2626" }
    : { bg: "#ECFDF5", border: "#A7F3D0", color: "#059669" };
  return (
    <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: "12px 16px", color: cfg.color, fontSize: 13, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: cfg.color, fontSize: 16 }}>✕</button>
    </div>
  );
}

const s = {
  page:         { maxWidth: 1100, margin: "0 auto", padding: "32px 24px", fontFamily: "'DM Sans',system-ui,sans-serif" },
  header:       { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 },
  title:        { fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" },
  sub:          { fontSize: 14, color: "#94A3B8", margin: 0 },
  btnPrimary:   { background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },

  filters:      { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  searchRow:    { marginBottom: 20 },
  searchBox:    { display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "10px 16px", maxWidth: 400 },
  searchInput:  { border: "none", outline: "none", fontSize: 14, color: "#1E293B", background: "transparent", fontFamily: "inherit", flex: 1 },

  empty:        { textAlign: "center", padding: "60px 20px", color: "#94A3B8", fontSize: 15 },

  table:        { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden" },
  tableHeader:  { display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1.5fr", padding: "12px 20px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", gap: 12 },
  th:           { fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: .8 },
  row:          { display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1.5fr", padding: "14px 20px", borderBottom: "1px solid #F1F5F9", alignItems: "center", gap: 12 },
  agentCell:    { display: "flex", alignItems: "center", gap: 10 },
  avatar:       { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, flexShrink: 0 },
  agentName:    { fontSize: 14, fontWeight: 700, color: "#1E293B", margin: "0 0 2px" },
  agentPhone:   { fontSize: 12, color: "#94A3B8", margin: 0 },
  rolePill:     { fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, display: "inline-block" },
  zoneCell:     { fontSize: 13, color: "#64748B" },
  statusPill:   { fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, display: "inline-block" },
  actions:      { display: "flex", gap: 8 },
  btnEdit:      { background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#475569", fontFamily: "inherit" },
  btnToggle:    { background: "none", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: "6px 0" },

  overlay:      { position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal:        { background: "#fff", borderRadius: 20, padding: "28px 32px", width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto" },
  modalHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle:   { fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 },
  closeBtn:     { background: "#F1F5F9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#64748B" },

  roleGrid:     { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 },
  roleCard:     { borderRadius: 12, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", background: "#fff", fontFamily: "inherit", transition: "all .15s" },
  roleCardLabel:{ fontSize: 12, fontWeight: 700, margin: 0, textAlign: "center", lineHeight: 1.3 },
  roleCardDesc: { fontSize: 10, color: "#94A3B8", margin: 0, textAlign: "center", lineHeight: 1.3 },

  formGrid:     { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 },
  fieldLabel:   { fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: .8, marginBottom: 6 },
  input:        { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", color: "#1E293B", boxSizing: "border-box" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 },
  btnCancel:    { background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#64748B", fontFamily: "inherit" },
  btnSave:      { background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
};
