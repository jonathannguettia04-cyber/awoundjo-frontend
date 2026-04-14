// src/pages/admin/AdminAffilie.jsx
// ─────────────────────────────────────────────────────────────
//  Vue admin — Réseau AFFILIÉ
//  Gestion : Directrices, Leaders, Superviseurs, Recruteurs
//  Fonctionnalités :
//    - Liste membres avec filtres par rôle / statut de validation
//    - Validation / rejet avec option "paiement cash"
//    - Suspension / réactivation
//    - Réinitialisation mot de passe
//    - Suppression avec confirmation mot de passe admin
//    - Gestion des commissions
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const agentToken = () => {
  const t =
    localStorage.getItem("token") ||
    localStorage.getItem("agent_token") ||
    localStorage.getItem("adminToken") ||
    sessionStorage.getItem("token");
  return t;
};

const C = {
  purple:  "#7C3AED", purpleL: "#F5F3FF", purpleD: "#5B21B6",
  blue:    "#1B4FD8", blueL:   "#EEF2FF",
  green:   "#059669", greenL:  "#ECFDF5",
  gold:    "#D97706", goldL:   "#FFFBEB",
  red:     "#DC2626", redL:    "#FEF2F2",
  teal:    "#0D9488", tealL:   "#F0FDFA",
  slate:   "#64748B", dark:    "#0F172A",
  border:  "#E2E8F0", bg:      "#F8FAFC",
};

const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR");
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const headers = () => ({ Authorization: `Bearer ${agentToken()}` });

const ROLE_CONFIG = {
  DIRECTRICE:      { label: "Directrice",      icon: "👑", color: C.purple, bg: C.purpleL },
  LEADER_AFF:      { label: "Leader",           icon: "⭐", color: C.blue,   bg: C.blueL   },
  SUPERVISEUR_AFF: { label: "Superviseur",      icon: "🎯", color: C.teal,   bg: C.tealL   },
  RECRUTEUR_AFF:   { label: "Recruteur",        icon: "🤝", color: C.green,  bg: C.greenL  },
};

const STATUS_CONFIG = {
  ACTIVE:    { label: "Actif",      color: C.green,  bg: C.greenL },
  SUSPENDED: { label: "Suspendu",   color: C.red,    bg: C.redL   },
  PENDING:   { label: "En attente", color: C.gold,   bg: C.goldL  },
};

const VALIDATION_CONFIG = {
  pending:  { label: "⏳ À valider", color: C.gold,  bg: C.goldL  },
  approved: { label: "✅ Validé",    color: C.green, bg: C.greenL },
  rejected: { label: "❌ Rejeté",    color: C.red,   bg: C.redL   },
};

const PAYMENT_CONFIG = {
  unpaid: { label: "💳 Non payé", color: C.red,   bg: C.redL   },
  paid:   { label: "✅ Payé",     color: C.green, bg: C.greenL },
  cash:   { label: "💵 Cash",     color: C.gold,  bg: C.goldL  },
};

// ── Badges ────────────────────────────────────────────────────
const Badge = ({ config, value }) => {
  const s = config[value] || { label: value, color: C.slate, bg: C.bg };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
      {s.label}
    </span>
  );
};

// ── Section comptes en attente de validation ──────────────────
function PendingSection({ members, onValidate, loading }) {
  const [cashModes, setCashModes] = useState({});
  const pending = members.filter(m => m.status_validation === "pending" || !m.status_validation);
  if (pending.length === 0) return null;

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: `2px solid ${C.gold}`, padding: "18px 20px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 22 }}>⏳</span>
        <div>
          <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: C.dark }}>
            Comptes Affiliés en attente — {pending.length}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: C.slate }}>
            Valider en "cash" active immédiatement et calcule les commissions
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {pending.map(m => {
          const isCash = !!cashModes[m.id];
          const rc = ROLE_CONFIG[m.role] || { label: m.role, icon: "👤", color: C.slate, bg: C.bg };
          return (
            <div key={m.id} style={{
              background: isCash ? "#F0FDF4" : C.goldL,
              borderRadius: 10, padding: "12px 16px",
              border: `1px solid ${isCash ? C.green : C.gold}44`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{rc.icon}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: C.dark }}>{m.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.slate }}>{m.email}</p>
                  <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                    <Badge config={ROLE_CONFIG} value={m.role} />
                    <Badge config={PAYMENT_CONFIG} value={m.status_payment} />
                    {m.plan && <span style={{ fontSize: 11, color: C.slate }}>{m.plan}</span>}
                    {m.membership_fee > 0 && <span style={{ fontSize: 11, color: C.slate }}>{fmt(m.membership_fee)} FCFA</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {/* Toggle Cash */}
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 700, color: isCash ? C.green : C.slate }}>
                  <input type="checkbox" checked={isCash}
                    onChange={() => setCashModes(p => ({ ...p, [m.id]: !p[m.id] }))}
                    style={{ accentColor: C.green }} />
                  💵 Paiement cash
                </label>

                <button disabled={loading}
                  onClick={() => onValidate(m.id, "approve", isCash ? "cash" : null)}
                  style={{
                    padding: "6px 14px", borderRadius: 8, border: "none",
                    background: isCash ? C.green : C.purple, color: "#fff",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}>
                  ✅ {isCash ? "Valider + Cash" : "Valider"}
                </button>
                <button disabled={loading}
                  onClick={() => onValidate(m.id, "reject", null)}
                  style={{
                    padding: "6px 14px", borderRadius: 8, border: "none",
                    background: C.redL, color: C.red,
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}>
                  ❌ Rejeter
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Modal suppression ─────────────────────────────────────────
function DeleteModal({ member, onClose, onConfirm, loading }) {
  const [adminPassword, setAdminPassword] = useState("");
  if (!member) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 400, width: "100%" }}>
        <h3 style={{ margin: "0 0 8px", color: C.red, fontSize: 18 }}>⚠️ Supprimer ce membre ?</h3>
        <p style={{ color: C.slate, fontSize: 13, margin: "0 0 16px" }}>
          <strong>{member.name}</strong> ({ROLE_CONFIG[member.role]?.label || member.role}) et toutes ses données seront supprimés définitivement.
        </p>
        <input
          type="password" placeholder="Votre mot de passe admin"
          value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, boxSizing: "border-box", marginBottom: 14 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: "#fff", cursor: "pointer", fontWeight: 700, color: C.slate }}>Annuler</button>
          <button disabled={!adminPassword || loading}
            onClick={() => onConfirm(member.id, adminPassword)}
            style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: C.red, color: "#fff", cursor: "pointer", fontWeight: 700, opacity: !adminPassword ? .5 : 1 }}>
            {loading ? "Suppression..." : "Supprimer définitivement"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ═════════════════════════════════════════════════════════════
export default function AdminAffilie() {
  const [activeTab,   setActiveTab]   = useState("members");
  const [members,     setMembers]     = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Filtres
  const [filterRole,   setFilterRole]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // ── Chargement ─────────────────────────────────────────────
  const loadMembers = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const tok = agentToken();
      if (!tok) {
        setError("Token admin introuvable — veuillez vous reconnecter.");
        setLoading(false);
        return;
      }
      const params = new URLSearchParams();
      if (filterRole)   params.append("role",   filterRole);
      if (filterStatus) params.append("status", filterStatus);
      const { data } = await axios.get(`${API}/api/affilie/admin/members?${params}`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      setMembers(data.data?.members || []);
      setStats(data.data?.stats || null);
    } catch (e) {
      const msg = e.response?.data?.error || e.message || "Erreur chargement";
      setError(`Erreur ${e.response?.status || ""}: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [filterRole, filterStatus]);

  const loadCommissions = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await axios.get(`${API}/api/affilie/admin/commissions`, { headers: headers() });
      setCommissions(data.data?.commissions || []);
    } catch (e) {
      setError(`Erreur ${e.response?.status || ""}: ${e.response?.data?.error || e.message || "Erreur chargement commissions"}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "members") loadMembers();
    if (activeTab === "commissions") loadCommissions();
  }, [activeTab, loadMembers, loadCommissions]);

  // ── Actions ────────────────────────────────────────────────
  const flash = (msg, isErr = false) => {
    if (isErr) { setError(msg); setSuccess(""); }
    else { setSuccess(msg); setError(""); }
    setTimeout(() => { setError(""); setSuccess(""); }, 4000);
  };

  async function handleValidate(id, action, paymentMethod) {
    setActionLoading(true);
    try {
      const { data } = await axios.patch(
        `${API}/api/affilie/admin/members/${id}/validate`,
        { action, paymentMethod },
        { headers: headers() }
      );
      flash(data.data?.message || "Fait !");
      loadMembers();
    } catch (e) {
      flash(e.response?.data?.error || "Erreur", true);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSetStatus(id, status) {
    setActionLoading(true);
    try {
      await axios.patch(`${API}/api/affilie/admin/members/${id}/status`, { status }, { headers: headers() });
      flash(`Statut mis à jour : ${status}`);
      loadMembers();
    } catch (e) {
      flash(e.response?.data?.error || "Erreur", true);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetPassword(id, name) {
    if (!window.confirm(`Réinitialiser le mot de passe de ${name} ?`)) return;
    setActionLoading(true);
    try {
      const { data } = await axios.post(
        `${API}/api/affilie/admin/members/${id}/reset-password`, {},
        { headers: headers() }
      );
      flash(`Nouveau mot de passe temporaire : ${data.data?.temp_password}`);
    } catch (e) {
      flash(e.response?.data?.error || "Erreur", true);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(id, adminPassword) {
    setActionLoading(true);
    try {
      await axios.delete(
        `${API}/api/affilie/admin/members/${id}`,
        { headers: headers(), data: { adminPassword } }
      );
      flash("Membre supprimé définitivement.");
      setDeleteTarget(null);
      loadMembers();
    } catch (e) {
      flash(e.response?.data?.error || "Erreur suppression", true);
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePayCommission(id) {
    setActionLoading(true);
    try {
      await axios.put(`${API}/api/affilie/admin/commissions/${id}/pay`, {}, { headers: headers() });
      flash("Commission marquée comme versée.");
      loadCommissions();
    } catch (e) {
      flash(e.response?.data?.error || "Erreur", true);
    } finally {
      setActionLoading(false);
    }
  }

  // ── Rendu ──────────────────────────────────────────────────
  return (
    <div style={{ padding: "24px 20px", maxWidth: 1100, margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: C.purpleL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>💜</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.dark }}>Réseau Affilié</h1>
          <p style={{ margin: 0, fontSize: 13, color: C.slate }}>Administration — Directrices, Leaders, Superviseurs, Recruteurs</p>
        </div>
      </div>

      {/* Stats globales */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total membres",    value: fmt(stats.total),              color: C.purple },
            { label: "Actifs",           value: fmt(stats.active),             color: C.green  },
            { label: "En attente valid.", value: fmt(stats.pending_validation), color: C.gold   },
            { label: "Directrices",      value: fmt(stats.directrices),        color: C.purple },
            { label: "Leaders",          value: fmt(stats.leaders),            color: C.blue   },
            { label: "Superviseurs",     value: fmt(stats.superviseurs),       color: C.teal   },
            { label: "Recruteurs",       value: fmt(stats.recruteurs),         color: C.green  },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", border: `1.5px solid ${C.border}` }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: C.slate, fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Alertes flash */}
      {error   && <div style={{ background: C.redL,   color: C.red,   border: `1px solid ${C.red}44`,   borderRadius: 10, padding: "10px 16px", marginBottom: 14, fontSize: 13, fontWeight: 700 }}>{error}</div>}
      {success && <div style={{ background: C.greenL, color: C.green, border: `1px solid ${C.green}44`, borderRadius: 10, padding: "10px 16px", marginBottom: 14, fontSize: 13, fontWeight: 700 }}>{success}</div>}

      {/* Onglets */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, background: C.bg, borderRadius: 12, padding: 6 }}>
        {[
          ["members",     "👥 Membres"],
          ["commissions", "💰 Commissions"],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 13,
            background: activeTab === key ? "#fff" : "transparent",
            color: activeTab === key ? C.purple : C.slate,
            boxShadow: activeTab === key ? "0 2px 8px rgba(0,0,0,.08)" : "none",
          }}>{label}</button>
        ))}
      </div>

      {/* ─── ONGLET MEMBRES ─── */}
      {activeTab === "members" && (
        <>
          {/* Section en attente */}
          <PendingSection members={members} onValidate={handleValidate} loading={actionLoading} />

          {/* Filtres */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, background: "#fff", cursor: "pointer" }}>
              <option value="">Tous les rôles</option>
              {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, background: "#fff", cursor: "pointer" }}>
              <option value="">Toutes validations</option>
              <option value="pending">⏳ En attente</option>
              <option value="approved">✅ Approuvé</option>
              <option value="rejected">❌ Rejeté</option>
            </select>
            <button onClick={loadMembers} style={{ padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, color: C.purple }}>
              🔄 Actualiser
            </button>
          </div>

          {/* Liste membres */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: C.slate }}>Chargement...</div>
          ) : members.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: C.slate }}>
              <p style={{ fontSize: 32, margin: "0 0 8px" }}>👥</p>
              <p style={{ margin: 0, fontWeight: 700 }}>Aucun membre trouvé</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {members.map(m => {
                const rc = ROLE_CONFIG[m.role] || { label: m.role, icon: "👤", color: C.slate, bg: C.bg };
                return (
                  <div key={m.id} style={{ background: "#fff", borderRadius: 12, border: `1.5px solid ${C.border}`, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                      {/* Infos membre */}
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: rc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                          {rc.icon}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: C.dark }}>{m.name}</p>
                          <p style={{ margin: "1px 0", fontSize: 12, color: C.slate }}>{m.email}</p>
                          <p style={{ margin: "1px 0", fontSize: 11, color: C.slate }}>{m.country}{m.city ? ` · ${m.city}` : ""} · {fmtDate(m.created_at)}</p>
                          {m.referrer_name && <p style={{ margin: "1px 0", fontSize: 11, color: C.purple }}>Parrain : {m.referrer_name} ({ROLE_CONFIG[m.referrer_role]?.label || m.referrer_role})</p>}
                          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                            <Badge config={ROLE_CONFIG}       value={m.role} />
                            <Badge config={STATUS_CONFIG}     value={m.status} />
                            <Badge config={VALIDATION_CONFIG} value={m.status_validation || "pending"} />
                            <Badge config={PAYMENT_CONFIG}    value={m.status_payment} />
                            {m.plan && <span style={{ fontSize: 11, background: C.bg, color: C.slate, padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>{m.plan}</span>}
                            {m.team_size > 0 && <span style={{ fontSize: 11, background: C.purpleL, color: C.purple, padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>Équipe : {m.team_size}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {m.status_validation !== "approved" && (
                          <>
                            <button onClick={() => handleValidate(m.id, "approve", null)} disabled={actionLoading}
                              style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: C.greenL, color: C.green, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                              ✅ Valider
                            </button>
                            <button onClick={() => handleValidate(m.id, "approve", "cash")} disabled={actionLoading}
                              style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: C.goldL, color: C.gold, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                              💵 Cash
                            </button>
                            <button onClick={() => handleValidate(m.id, "reject", null)} disabled={actionLoading}
                              style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: C.redL, color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                              ❌ Rejeter
                            </button>
                          </>
                        )}
                        {m.status === "ACTIVE" ? (
                          <button onClick={() => handleSetStatus(m.id, "SUSPENDED")} disabled={actionLoading}
                            style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.red}44`, background: C.redL, color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            🚫 Suspendre
                          </button>
                        ) : m.status === "SUSPENDED" ? (
                          <button onClick={() => handleSetStatus(m.id, "ACTIVE")} disabled={actionLoading}
                            style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.green}44`, background: C.greenL, color: C.green, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            ✅ Réactiver
                          </button>
                        ) : null}
                        <button onClick={() => handleResetPassword(m.id, m.name)} disabled={actionLoading}
                          style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: "#fff", color: C.slate, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          🔑 MDP
                        </button>
                        <button onClick={() => setDeleteTarget(m)} disabled={actionLoading}
                          style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: C.redL, color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Stats rapides si disponibles */}
                    {Number(m.total_earned) > 0 && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.slate }}>
                        💰 Commissions totales : <strong style={{ color: C.green }}>{fmt(m.total_earned)} FCFA</strong>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── ONGLET COMMISSIONS ─── */}
      {activeTab === "commissions" && (
        <div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: C.slate }}>Chargement...</div>
          ) : commissions.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: C.slate }}>
              <p style={{ fontSize: 32, margin: "0 0 8px" }}>💰</p>
              <p style={{ margin: 0, fontWeight: 700 }}>Aucune commission</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {commissions.map(c => (
                <div key={c.id} style={{ background: "#fff", borderRadius: 10, border: `1.5px solid ${C.border}`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: C.dark }}>{c.member_name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: C.slate }}>
                      {ROLE_CONFIG[c.member_role]?.label || c.member_role} · {c.source_type} · {fmtDate(c.created_at)}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 900, fontSize: 15, color: c.status === "PAID" ? C.green : C.gold }}>
                      {fmt(c.amount)} FCFA
                    </span>
                    <span style={{ fontSize: 11, color: C.slate }}>{c.rate_pct}%</span>
                    {c.status === "PENDING" ? (
                      <button onClick={() => handlePayCommission(c.id)} disabled={actionLoading}
                        style={{ padding: "5px 12px", borderRadius: 7, border: "none", background: C.green, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        💸 Verser
                      </button>
                    ) : (
                      <span style={{ background: C.greenL, color: C.green, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>✅ Versé</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal suppression */}
      <DeleteModal
        member={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={actionLoading}
      />
    </div>
  );
}
