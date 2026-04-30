// src/pages/AdminBusiness.jsx
// ══════════════════════════════════════════════════════════════
//  Awoundjô — Administration Réseau Business
//  Onglets : Membres · Commissions · Bonus Pool · Demandes Commission · Clients
// ══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ROLE_COLORS = {
  DIRECTRICE:  { bg: "#F5F3FF", color: "#7C3AED", border: "#DDD6FE" },
  LEADER:      { bg: "#ECFEFF", color: "#0891B2", border: "#A5F3FC" },
  SUPERVISEUR: { bg: "#FFF7ED", color: "#EA580C", border: "#FED7AA" },
  RECRUTEUR:   { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
};

const STATUS_COLORS = {
  ACTIVE:    { bg: "#ECFDF5", color: "#059669" },
  PENDING:   { bg: "#FFF7ED", color: "#D97706" },
  SUSPENDED: { bg: "#FEF2F2", color: "#DC2626" },
};

const TABS = ["Membres", "Commissions", "Bonus Pool", "Demandes Commission", "Clients"];

// ── Hook fetch générique ──────────────────────────────────────
function useAdminFetch(token) {
  const get = useCallback(async (path) => {
    const r = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error((await r.json()).error || r.statusText);
    return r.json();
  }, [token]);

  const post = useCallback(async (path, body = {}) => {
    const r = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || d.message || r.statusText);
    return d;
  }, [token]);

  return { get, post };
}

// ══════════════════════════════════════════════════════════════
export default function AdminBusiness() {
  const { token } = useAuth();
  const { get, post } = useAdminFetch(token);

  const [tab,         setTab]         = useState("Membres");
  const [members,     setMembers]     = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [bonusPool,   setBonusPool]   = useState([]);
  const [bonusPoolCurrent, setBonusPoolCurrent] = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [toast,       setToast]       = useState(null);

  // Filtres membres
  const [filterRole,   setFilterRole]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const LIMIT = 30;

  // Filtres commissions
  const [commStatus, setCommStatus] = useState("");

  // Clients admin
  const [clients,         setClients]         = useState([]);
  const [clientsTotal,    setClientsTotal]    = useState(0);
  const [clientOrigin,    setClientOrigin]    = useState("");
  const [clientStatus,    setClientStatus]    = useState("");
  const [clientSearch,    setClientSearch]    = useState("");
  const [clientPage,      setClientPage]      = useState(1);
  const CLIENT_LIMIT = 30;

  // Demandes de commission (retrait)
  const [demandesComm,          setDemandesComm]          = useState([]);
  const [demandesStats,         setDemandesStats]         = useState({});
  const [demandesStatusFilter,  setDemandesStatusFilter]  = useState("");
  const [actionLoading,         setActionLoading]         = useState(null);
  const [rejectModal,           setRejectModal]           = useState(null);
  const [rejectNote,            setRejectNote]            = useState("");

  // Modal confirmation
  const [modal, setModal] = useState(null); // { type, member/commission }

  // ── Toast ─────────────────────────────────────────────────
  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Chargement données ────────────────────────────────────
  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filterRole)   params.set("role",   filterRole);
      if (filterStatus) params.set("status", filterStatus);
      if (search)       params.set("search", search);
      const d = await get(`/api/business/admin/members?${params}`);
      setMembers(d.data?.members || d.members || []);
      setTotalMembers(d.data?.pagination?.total ?? d.pagination?.total ?? (d.data?.members || d.members || []).length);
    } catch (e) { showToast(e.message, true); }
    setLoading(false);
  }, [get, page, filterRole, filterStatus, search]);

  const loadCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: 1, limit: 50 });
      if (commStatus) params.set("status", commStatus);
      const d = await get(`/api/business/admin/commissions?${params}`);
      setCommissions(d.data?.commissions || d.commissions || []);
    } catch (e) { showToast(e.message, true); }
    setLoading(false);
  }, [get, commStatus]);

  const loadBonusPool = useCallback(async () => {
    setLoading(true);
    try {
      const d = await get("/api/business/bonus-pool");
      setBonusPool(d.data?.bonus_pool || d.bonus_pool || d.history || []);
      setBonusPoolCurrent(d.data?.current_pool ?? d.current_pool ?? 0);
    } catch { setBonusPool([]); }
    setLoading(false);
  }, [get]);

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: clientPage, limit: CLIENT_LIMIT });
      if (clientOrigin) params.set("origin", clientOrigin);
      if (clientStatus) params.set("status", clientStatus);
      if (clientSearch) params.set("search", clientSearch);
      const d = await get(`/api/business/admin/clients?${params}`);
      setClients(d.data?.clients || d.clients || []);
      setClientsTotal(d.data?.pagination?.total ?? d.pagination?.total ?? (d.data?.clients || d.clients || []).length);
    } catch (e) { showToast(e.message, true); }
    setLoading(false);
  }, [get, clientPage, clientOrigin, clientStatus, clientSearch]);

  const loadDemandesCommission = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ network: "BUSINESS", limit: 100 });
      if (demandesStatusFilter) params.set("status", demandesStatusFilter);
      const d = await get(`/api/commissions/requests?${params}`);
      setDemandesComm(d.requests || d.data?.requests || []);
      setDemandesStats(d.stats   || d.data?.stats   || {});
    } catch (e) { showToast(e.message, true); }
    setLoading(false);
  }, [get, demandesStatusFilter]);

  useEffect(() => {
    if (tab === "Membres")              loadMembers();
    if (tab === "Commissions")          loadCommissions();
    if (tab === "Bonus Pool")           loadBonusPool();
    if (tab === "Demandes Commission")  loadDemandesCommission();
    if (tab === "Clients")              loadClients();
  }, [tab, loadMembers, loadCommissions, loadBonusPool, loadDemandesCommission, loadClients]);

  // ── Actions membres ────────────────────────────────────────
  async function handleValidate(id, action, isCash = false) {
    try {
      await post(`/api/business/admin/members/${id}/validate`, { action, is_cash: isCash });
      showToast(action === "approve" ? "✅ Membre approuvé" : "❌ Membre rejeté");
      loadMembers();
    } catch (e) { showToast(e.message, true); }
    setModal(null);
  }

  async function handleResetPassword(id) {
    try {
      const d = await post(`/api/business/admin/members/${id}/reset-password`);
      showToast(`🔑 Nouveau MDP : ${d.data?.temp_password || d.temp_password}`);
    } catch (e) { showToast(e.message, true); }
    setModal(null);
  }

  async function handleRecalc(id) {
    try {
      await post(`/api/business/admin/members/${id}/recalc-commissions`);
      showToast("♻️ Commissions recalculées");
      loadCommissions();
    } catch (e) { showToast(e.message, true); }
    setModal(null);
  }

  // ── Suppression membre ────────────────────────────────────
  const [adminPassword, setAdminPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(id) {
    if (!adminPassword.trim()) return showToast("Mot de passe admin requis", true);
    setDeleting(true);
    try {
      const r = await fetch(`${API}/api/business/admin/members/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ adminPassword }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || d.message || "Erreur suppression");
      showToast("🗑️ Membre supprimé définitivement");
      setAdminPassword("");
      loadMembers();
    } catch (e) { showToast(e.message, true); }
    setDeleting(false);
    setModal(null);
  }

  // ── Actions commissions ────────────────────────────────────
  async function handleCommAction(id, action) {
    try {
      await post(`/api/business/admin/commissions/${id}/action`, { action });
      showToast(`✅ Commission : ${action}`);
      loadCommissions();
    } catch (e) { showToast(e.message, true); }
  }

  // ── Actions demandes de retrait ────────────────────────────
  async function handleDemandeAction(id, action, note = "") {
    setActionLoading(id + action);
    try {
      const r = await fetch(`${API}/api/commissions/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, admin_note: note }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || d.message || "Erreur");
      showToast(`✅ Demande #${id} : ${action}`);
      setRejectModal(null); setRejectNote("");
      loadDemandesCommission();
    } catch (e) { showToast(e.message, true); }
    setActionLoading(null);
  }

  // La recherche est désormais transmise au serveur via loadMembers
  const filteredMembers = members;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Toast */}
      {toast && (
        <div style={{ ...s.toast, background: toast.isError ? "#FEF2F2" : "#ECFDF5",
          color: toast.isError ? "#DC2626" : "#059669",
          border: `1px solid ${toast.isError ? "#FECACA" : "#A7F3D0"}` }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>💼 Réseau Business</h1>
          <p style={s.subtitle}>Administration — Directrices · Leaders · Superviseurs · Recruteurs</p>
        </div>
        <div style={s.headerStats}>
          <StatBadge label="Membres" value={totalMembers} color="#7C3AED" />
          <StatBadge label="Commissions" value={commissions.length} color="#0891B2" />
        </div>
      </div>

      {/* Onglets */}
      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            ...s.tab,
            background:  tab === t ? "#7C3AED" : "#fff",
            color:       tab === t ? "#fff"    : "#64748B",
            borderColor: tab === t ? "#7C3AED" : "#E2E8F0",
            fontWeight:  tab === t ? 700       : 500,
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── ONGLET MEMBRES ────────────────────────────────── */}
      {tab === "Membres" && (
        <div>
          {/* Filtres */}
          <div style={s.filters}>
            <input
              style={s.input} placeholder="🔍 Nom, email, téléphone…"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            <select style={s.select} value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}>
              <option value="">Tous les rôles</option>
              {["DIRECTRICE","LEADER","SUPERVISEUR","RECRUTEUR"].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select style={s.select} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="">Tous les statuts</option>
              {["ACTIVE","PENDING","SUSPENDED"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button style={s.btnSecondary} onClick={loadMembers}>↻ Rafraîchir</button>
          </div>

          {loading ? <Spinner /> : (
            <div style={s.table}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["Membre","Rôle","Statut","Paiement","Parent","Clients","Commissions","Total gagné","Actions"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(m => {
                    const roleC = ROLE_COLORS[m.role] || {};
                    const statusC = STATUS_COLORS[m.status] || {};
                    return (
                      <tr key={m.id} style={s.tr}>
                        <td style={s.td}>
                          <div style={s.memberName}>{m.name}</div>
                          <div style={s.memberSub}>{m.email}</div>
                          {m.phone && <div style={s.memberSub}>{m.phone}</div>}
                        </td>
                        <td style={s.td}>
                          <span style={{ ...s.badge, background: roleC.bg, color: roleC.color, border: `1px solid ${roleC.border}` }}>
                            {m.role}
                          </span>
                        </td>
                        <td style={s.td}>
                          <span style={{ ...s.badge, background: statusC.bg, color: statusC.color }}>
                            {m.status}
                          </span>
                          {m.status_validation && m.status_validation !== "approved" && (
                            <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>
                              validation: {m.status_validation}
                            </div>
                          )}
                        </td>
                        {/* Colonne Paiement — status_payment + date d'adhésion */}
                        <td style={s.td}>
                          {m.status_payment
                            ? <span style={{ ...s.badge, background: m.status_payment === "paid" ? "#ECFDF5" : "#FFF7ED", color: m.status_payment === "paid" ? "#059669" : "#D97706" }}>
                                {m.status_payment}
                              </span>
                            : <span style={{ color: "#CBD5E1" }}>—</span>
                          }
                          {m.created_at && (
                            <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>
                              {new Date(m.created_at).toLocaleDateString("fr-FR")}
                            </div>
                          )}
                        </td>
                        <td style={s.td}>
                          {m.parent_name
                            ? <><div style={s.memberName}>{m.parent_name}</div><div style={s.memberSub}>{m.parent_role}</div></>
                            : <span style={{ color: "#CBD5E1" }}>—</span>
                          }
                        </td>
                        {/* Clients créés */}
                        <td style={{ ...s.td, textAlign: "center", fontWeight: 700, color: "#0891B2" }}>
                          {m.total_clients_created ?? "—"}
                        </td>
                        {/* Commissions totales */}
                        <td style={{ ...s.td, fontWeight: 700, color: "#7C3AED" }}>
                          {m.total_commissions != null
                            ? `${Number(m.total_commissions).toLocaleString("fr-FR")} F`
                            : <span style={{ color: "#CBD5E1" }}>—</span>
                          }
                        </td>
                        <td style={{ ...s.td, fontWeight: 700, color: "#059669" }}>
                          {Number(m.total_earned || 0).toLocaleString("fr-FR")} F
                        </td>
                        <td style={s.td}>
                          <div style={s.actionsCol}>
                            {/* Groupe validation — visible seulement si en attente */}
                            {m.status_validation === "pending" && (
                              <div style={s.actionGroup}>
                                <ActionBtn label="✅ Approuver" color="#059669" onClick={() => setModal({ type: "approve", member: m })} />
                                <ActionBtn label="💵 Cash"      color="#0891B2" onClick={() => setModal({ type: "cash",    member: m })} />
                                <ActionBtn label="❌ Rejeter"   color="#DC2626" onClick={() => setModal({ type: "reject",  member: m })} />
                              </div>
                            )}
                            {/* Groupe outils */}
                            <div style={s.actionGroup}>
                              <ActionBtn label="🔑 Réinit. MDP"   color="#7C3AED" onClick={() => setModal({ type: "password", member: m })} />
                              <ActionBtn label="♻️ Commissions"   color="#D97706" onClick={() => setModal({ type: "recalc",   member: m })} />
                              <ActionBtn label="🗑️ Supprimer"     color="#DC2626" onClick={() => { setAdminPassword(""); setModal({ type: "delete", member: m }); }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMembers.length === 0 && (
                    <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "#94A3B8" }}>
                      Aucun membre trouvé
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div style={s.pagination}>
            <button style={s.btnSecondary} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Préc.</button>
            <span style={{ fontSize: 13, color: "#64748B" }}>Page {page}</span>
            <button style={s.btnSecondary} disabled={members.length < LIMIT} onClick={() => setPage(p => p + 1)}>Suiv. →</button>
          </div>
        </div>
      )}

      {/* ── ONGLET COMMISSIONS ────────────────────────────── */}
      {tab === "Commissions" && (
        <div>
          <div style={s.filters}>
            <select style={s.select} value={commStatus} onChange={e => setCommStatus(e.target.value)}>
              <option value="">Tous les statuts</option>
              {["PENDING","VALIDATED","PAID","REJECTED"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button style={s.btnSecondary} onClick={loadCommissions}>↻ Rafraîchir</button>
          </div>

          {loading ? <Spinner /> : (
            <div style={s.table}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["Bénéficiaire","Niveau","Montant","Source","Statut","Date","Actions"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {commissions.map(c => {
                    const statusC = {
                      PENDING:   { bg: "#FFF7ED", color: "#D97706" },
                      VALIDATED: { bg: "#ECFEFF", color: "#0891B2" },
                      PAID:      { bg: "#ECFDF5", color: "#059669" },
                      REJECTED:  { bg: "#FEF2F2", color: "#DC2626" },
                    }[c.status] || {};
                    return (
                      <tr key={c.id} style={s.tr}>
                        <td style={s.td}>
                          <div style={s.memberName}>{c.member_name}</div>
                          <div style={s.memberSub}>{c.member_role}</div>
                        </td>
                        <td style={s.td}>
                          <span style={{ ...s.badge,
                            background: c.niveau === 1 ? "#ECFDF5" : "#ECFEFF",
                            color:      c.niveau === 1 ? "#059669" : "#0891B2" }}>
                            N{c.niveau} — {c.rate_pct}%
                          </span>
                        </td>
                        <td style={{ ...s.td, fontWeight: 700, color: "#059669" }}>
                          {Number(c.montant).toLocaleString("fr-FR")} F
                        </td>
                        <td style={s.td}>
                          <div style={s.memberName}>{c.source_name}</div>
                          <div style={s.memberSub}>{c.payment_type}</div>
                        </td>
                        <td style={s.td}>
                          <span style={{ ...s.badge, background: statusC.bg, color: statusC.color }}>
                            {c.status}
                          </span>
                        </td>
                        <td style={{ ...s.td, fontSize: 12 }}>
                          {new Date(c.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td style={s.td}>
                          <div style={s.actions}>
                            {c.status === "PENDING" && (
                              <>
                                <ActionBtn label="✅ Valider" color="#0891B2" onClick={() => handleCommAction(c.id, "validate")} />
                                <ActionBtn label="💸 Payer"  color="#059669" onClick={() => handleCommAction(c.id, "pay")} />
                                <ActionBtn label="❌ Rejeter" color="#DC2626" onClick={() => handleCommAction(c.id, "reject")} />
                              </>
                            )}
                            {c.status === "VALIDATED" && (
                              <ActionBtn label="💸 Payer" color="#059669" onClick={() => handleCommAction(c.id, "pay")} />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {commissions.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#94A3B8" }}>
                      Aucune commission trouvée
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ONGLET BONUS POOL ─────────────────────────────── */}
      {tab === "Bonus Pool" && (
        <div>
          {/* Pool du mois en cours — aligné sur BusinessDashboard.jsx */}
          {!loading && (
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ background: "#fff", border: "1.5px solid #FDE68A", borderRadius: 12, padding: "14px 20px", minWidth: 200 }}>
                <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  Pool {new Date().toLocaleString("fr-FR", { month: "long", year: "numeric" })} (en cours)
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#D97706" }}>
                  {Number(bonusPoolCurrent).toLocaleString("fr-FR")} FCFA
                </div>
              </div>
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "14px 20px", minWidth: 160 }}>
                <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  Mois d'historique
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#7C3AED" }}>{bonusPool.length}</div>
              </div>
              <button style={{ ...s.btnSecondary, alignSelf: "center" }} onClick={loadBonusPool}>↻ Rafraîchir</button>
            </div>
          )}
          {loading ? <Spinner /> : bonusPool.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "#94A3B8" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
              <p>Aucun bonus pool enregistré pour le moment.</p>
              <p style={{ fontSize: 12 }}>Le pool se remplit automatiquement à chaque paiement (2%).</p>
            </div>
          ) : (
            <div style={s.table}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["Période","Montant total","Mise à jour"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bonusPool.map((bp, i) => (
                    <tr key={i} style={s.tr}>
                      <td style={s.td}>{String(bp.mois).padStart(2,"0")}/{bp.annee}</td>
                      <td style={{ ...s.td, fontWeight: 700, color: "#7C3AED" }}>
                        {Number(bp.montant_total).toLocaleString("fr-FR")} FCFA
                      </td>
                      <td style={{ ...s.td, fontSize: 12 }}>
                        {new Date(bp.updated_at).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ONGLET DEMANDES COMMISSION ──────────────────── */}
      {tab === "Demandes Commission" && (
        <div>
          {/* Stats rapides */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            {[
              { label: "En attente", key: "PENDING",   color: "#D97706", bg: "#FFFBEB" },
              { label: "Validées",   key: "VALIDATED", color: "#1B4FD8", bg: "#EFF6FF" },
              { label: "Payées",     key: "PAID",      color: "#059669", bg: "#ECFDF5" },
              { label: "Rejetées",   key: "REJECTED",  color: "#DC2626", bg: "#FEF2F2" },
            ].map(({ label, key, color, bg }) => (
              <div key={key} onClick={() => setDemandesStatusFilter(demandesStatusFilter === key ? "" : key)}
                style={{ background: bg, border: `1.5px solid ${color}44`, borderRadius: 10, padding: "10px 16px", cursor: "pointer", opacity: demandesStatusFilter && demandesStatusFilter !== key ? 0.5 : 1, transition: "opacity .15s" }}>
                <div style={{ fontSize: 18, fontWeight: 900, color }}>{demandesStats[key] || 0}</div>
                <div style={{ fontSize: 11, color, fontWeight: 700 }}>{label}</div>
              </div>
            ))}
            <button onClick={loadDemandesCommission} style={s.btnSecondary}>↻ Rafraîchir</button>
          </div>

          {loading ? <Spinner /> : demandesComm.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "#94A3B8" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💤</div>
              <p style={{ fontWeight: 700 }}>Aucune demande de paiement</p>
              <p style={{ fontSize: 12 }}>Les demandes de retrait de commissions apparaîtront ici</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {demandesComm.map(r => {
                const details = typeof r.payment_details === "string" ? JSON.parse(r.payment_details || "{}") : (r.payment_details || {});
                const STATUS_MAP = {
                  PENDING:   { label: "⏳ En attente", color: "#D97706", bg: "#FFFBEB" },
                  VALIDATED: { label: "✅ Validée",    color: "#1B4FD8", bg: "#EFF6FF" },
                  PAID:      { label: "💸 Payée",      color: "#059669", bg: "#ECFDF5" },
                  REJECTED:  { label: "❌ Rejetée",    color: "#DC2626", bg: "#FEF2F2" },
                };
                const st = STATUS_MAP[r.status] || STATUS_MAP.PENDING;
                return (
                  <div key={r.id} style={{ background: "#fff", borderRadius: 12, border: `1px solid ${r.status === "PENDING" ? "#D9770633" : "#E2E8F0"}`, padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span style={{ fontSize: 19, fontWeight: 900, color: "#059669" }}>
                            {Number(r.amount_requested || 0).toLocaleString("fr-FR")} FCFA
                          </span>
                          <span style={{ background: st.bg, color: st.color, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                            {st.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>
                          Demande <strong>#{r.id}</strong> · {r.member_name || "—"} ({r.member_role || r.network}) · {r.adhesions_since_last} adhésions
                        </div>
                        <div style={{ fontSize: 12, color: "#64748B" }}>
                          {r.payment_method === "mobile_money" && `📱 ${details.operator || ""} ${details.phone || ""}`}
                          {r.payment_method === "virement"     && `🏦 ${details.name || ""} — ${details.iban || details.bank || ""}`}
                          {r.payment_method === "cash"         && "💵 Espèces en agence"}
                          {" · "}<span style={{ color: "#94A3B8" }}>{new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        </div>
                        {r.admin_note && r.status === "REJECTED" && (
                          <div style={{ marginTop: 8, background: "#FEF2F2", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#DC2626", fontWeight: 600 }}>
                            ❌ Motif : {r.admin_note}
                          </div>
                        )}
                        {r.validated_at && (
                          <div style={{ fontSize: 11, color: "#1B4FD8", fontWeight: 700, marginTop: 6 }}>
                            ✅ Validée le {new Date(r.validated_at).toLocaleDateString("fr-FR")}
                          </div>
                        )}
                        {r.paid_at && (
                          <div style={{ fontSize: 11, color: "#059669", fontWeight: 700, marginTop: 4 }}>
                            💸 Payée le {new Date(r.paid_at).toLocaleDateString("fr-FR")}
                          </div>
                        )}
                      </div>
                      {/* Actions */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {r.status === "PENDING" && (
                          <>
                            <button onClick={() => handleDemandeAction(r.id, "validate")}
                              disabled={!!actionLoading}
                              style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#1B4FD8", color: "#fff", fontWeight: 700, fontSize: 12, cursor: actionLoading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                              {actionLoading === r.id + "validate" ? "…" : "✅ Valider"}
                            </button>
                            <button onClick={() => { setRejectModal({ id: r.id, name: r.member_name || `#${r.id}` }); setRejectNote(""); }}
                              style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #DC2626", background: "#FEF2F2", color: "#DC2626", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                              ❌ Rejeter
                            </button>
                          </>
                        )}
                        {r.status === "VALIDATED" && (
                          <button onClick={() => handleDemandeAction(r.id, "pay")}
                            disabled={!!actionLoading}
                            style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#059669", color: "#fff", fontWeight: 700, fontSize: 12, cursor: actionLoading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                            {actionLoading === r.id + "pay" ? "…" : "💸 Marquer Payée"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal rejet */}
          {rejectModal && (
            <div style={s.overlay}>
              <div style={s.modalBox}>
                <h3 style={{ ...s.modalTitle, color: "#DC2626" }}>❌ Rejeter la demande</h3>
                <p style={s.modalText}>Demande de <strong>{rejectModal.name}</strong> — veuillez indiquer un motif (optionnel) :</p>
                <input
                  placeholder="Motif du rejet…"
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #FECACA", fontSize: 14, boxSizing: "border-box", outline: "none", marginBottom: 16 }}
                />
                <div style={s.modalActions}>
                  <button style={s.btnSecondary} onClick={() => setRejectModal(null)}>Annuler</button>
                  <button style={s.btnDanger} onClick={() => handleDemandeAction(rejectModal.id, "reject", rejectNote)}
                    disabled={!!actionLoading}>
                    {actionLoading ? "…" : "Rejeter"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ONGLET CLIENTS ────────────────────────────────── */}
      {tab === "Clients" && (
        <div>
          <div style={s.filters}>
            <input
              style={s.input} placeholder="🔍 Nom, email, téléphone…"
              value={clientSearch} onChange={e => { setClientSearch(e.target.value); setClientPage(1); }}
            />
            <select style={s.select} value={clientOrigin} onChange={e => { setClientOrigin(e.target.value); setClientPage(1); }}>
              <option value="">Toutes les origines</option>
              {["BUSINESS","DIRECT","REFERRAL"].map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <select style={s.select} value={clientStatus} onChange={e => { setClientStatus(e.target.value); setClientPage(1); }}>
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="attente">En attente</option>
              <option value="suspendu">Suspendu</option>
              <option value="renewal_required">Renouvellement</option>
            </select>
            <button style={s.btnSecondary} onClick={loadClients}>↻ Rafraîchir</button>
          </div>

          {loading ? <Spinner /> : (
            <div style={s.table}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["Client","Statut","Origine","Recruteur","Formule","Date"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => {
                    return (
                      <tr key={c.id} style={s.tr}>
                        <td style={s.td}>
                          <div style={s.memberName}>{c.name || c.full_name}</div>
                          <div style={s.memberSub}>{c.email}</div>
                          {c.phone && <div style={s.memberSub}>{c.phone}</div>}
                        </td>
                        <td style={s.td}>
                          {(() => {
                            const CLIENT_STATUS = {
                              actif:            { bg: "#ECFDF5", color: "#059669", label: "Actif"          },
                              attente:          { bg: "#FFFBEB", color: "#D97706", label: "En attente"     },
                              suspendu:         { bg: "#FEF2F2", color: "#DC2626", label: "Suspendu"       },
                              renewal_required: { bg: "#DBEAFE", color: "#1D4ED8", label: "Renouvellement" },
                            };
                            const st = CLIENT_STATUS[c.status] || { bg: "#F1F5F9", color: "#64748B", label: c.status || "—" };
                            return <span style={{ ...s.badge, background: st.bg, color: st.color }}>{st.label}</span>;
                          })()}
                        </td>
                        <td style={s.td}>
                          <span style={{ ...s.badge, background: "#F0F9FF", color: "#0369A1", border: "1px solid #BAE6FD" }}>
                            {c.origin || "—"}
                          </span>
                        </td>
                        <td style={s.td}>
                          {c.recruiter_name
                            ? <><div style={s.memberName}>{c.recruiter_name}</div><div style={s.memberSub}>{c.recruiter_role}</div></>
                            : <span style={{ color: "#CBD5E1" }}>—</span>
                          }
                        </td>
                        <td style={s.td}>{c.plan_name || c.formule || "—"}</td>
                        <td style={{ ...s.td, fontSize: 12 }}>
                          {c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR") : "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {clients.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#94A3B8" }}>
                      Aucun client trouvé
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div style={s.pagination}>
            <button style={s.btnSecondary} disabled={clientPage === 1} onClick={() => setClientPage(p => p - 1)}>← Préc.</button>
            <span style={{ fontSize: 13, color: "#64748B" }}>Page {clientPage} · {clientsTotal} client{clientsTotal !== 1 ? "s" : ""}</span>
            <button style={s.btnSecondary} disabled={clients.length < CLIENT_LIMIT} onClick={() => setClientPage(p => p + 1)}>Suiv. →</button>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMATION ────────────────────────────── */}
      {modal && (
        <div style={s.overlay}>
          <div style={s.modalBox}>
            {modal.type === "approve" && <>
              <h3 style={s.modalTitle}>✅ Approuver le membre</h3>
              <p style={s.modalText}><strong>{modal.member.name}</strong> ({modal.member.role})<br/>Le compte sera activé immédiatement.</p>
              <div style={s.modalActions}>
                <button style={s.btnDanger}  onClick={() => setModal(null)}>Annuler</button>
                <button style={s.btnSuccess} onClick={() => handleValidate(modal.member.id, "approve", false)}>Approuver</button>
              </div>
            </>}
            {modal.type === "cash" && <>
              <h3 style={s.modalTitle}>💵 Approuver (paiement cash)</h3>
              <p style={s.modalText}><strong>{modal.member.name}</strong><br/>Un paiement cash sera enregistré et les commissions calculées.</p>
              <div style={s.modalActions}>
                <button style={s.btnDanger}  onClick={() => setModal(null)}>Annuler</button>
                <button style={s.btnPrimary} onClick={() => handleValidate(modal.member.id, "approve", true)}>Confirmer</button>
              </div>
            </>}
            {modal.type === "reject" && <>
              <h3 style={s.modalTitle}>❌ Rejeter le membre</h3>
              <p style={s.modalText}><strong>{modal.member.name}</strong> sera suspendu.</p>
              <div style={s.modalActions}>
                <button style={s.btnSecondary} onClick={() => setModal(null)}>Annuler</button>
                <button style={s.btnDanger}   onClick={() => handleValidate(modal.member.id, "reject")}>Rejeter</button>
              </div>
            </>}
            {modal.type === "password" && <>
              <h3 style={s.modalTitle}>🔑 Réinitialiser le mot de passe</h3>
              <p style={s.modalText}>Un mot de passe temporaire sera généré pour <strong>{modal.member.name}</strong>. Notez-le avant de fermer ce dialog.</p>
              <div style={s.modalActions}>
                <button style={s.btnSecondary} onClick={() => setModal(null)}>Annuler</button>
                <button style={s.btnPrimary}   onClick={() => handleResetPassword(modal.member.id)}>Générer</button>
              </div>
            </>}
            {modal.type === "recalc" && <>
              <h3 style={s.modalTitle}>♻️ Recalculer les commissions</h3>
              <p style={s.modalText}>Recalculer les commissions pour <strong>{modal.member.name}</strong>. Opération annulée si des commissions existent déjà.</p>
              <div style={s.modalActions}>
                <button style={s.btnSecondary} onClick={() => setModal(null)}>Annuler</button>
                <button style={s.btnPrimary}   onClick={() => handleRecalc(modal.member.id)}>Recalculer</button>
              </div>
            </>}
            {modal.type === "delete" && <>
              <h3 style={{ ...s.modalTitle, color: "#DC2626" }}>🗑️ Supprimer le membre</h3>
              <p style={s.modalText}>
                Vous allez supprimer définitivement <strong>{modal.member.name}</strong> ({modal.member.role}).<br/>
                <span style={{ color: "#DC2626", fontWeight: 700 }}>⚠️ Cette action est irréversible.</span><br/>
                Toutes ses données (commissions, paiements, membres liés) seront effacées.
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  🔐 Confirmez avec votre mot de passe admin :
                </label>
                <input
                  type="password"
                  placeholder="Mot de passe admin"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleDelete(modal.member.id)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #FCA5A5", fontSize: 14, boxSizing: "border-box", outline: "none" }}
                />
              </div>
              <div style={s.modalActions}>
                <button style={s.btnSecondary} onClick={() => { setModal(null); setAdminPassword(""); }}>Annuler</button>
                <button
                  style={{ ...s.btnDanger, opacity: deleting ? 0.6 : 1 }}
                  disabled={deleting}
                  onClick={() => handleDelete(modal.member.id)}
                >
                  {deleting ? "Suppression…" : "🗑️ Supprimer définitivement"}
                </button>
              </div>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sous-composants ───────────────────────────────────────────
function StatBadge({ label, value, color }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 16px", background: "#fff", border: `1.5px solid ${color}20`, borderRadius: 12 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#94A3B8" }}>{label}</div>
    </div>
  );
}

function ActionBtn({ label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 6,
        background: color + "15", color, border: `1px solid ${color}30`,
        cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}
    >
      {label}
    </button>
  );
}

function Spinner() {
  return (
    <div style={{ textAlign: "center", padding: 48, color: "#94A3B8" }}>
      <div style={{ fontSize: 32, animation: "spin 1s linear infinite" }}>⏳</div>
      <p style={{ marginTop: 8 }}>Chargement…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = {
  page:        { maxWidth: 1200, margin: "0 auto", padding: "32px 24px", fontFamily: "'DM Sans',system-ui,sans-serif" },
  header:      { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 24, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,.04)" },
  title:       { fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" },
  subtitle:    { fontSize: 13, color: "#94A3B8", margin: 0 },
  headerStats: { display: "flex", gap: 12 },
  tabs:        { display: "flex", gap: 8, marginBottom: 20 },
  tab:         { padding: "8px 20px", borderRadius: 10, border: "1.5px solid", cursor: "pointer", fontFamily: "inherit", fontSize: 14, transition: "all .15s" },
  filters:     { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16, alignItems: "center" },
  input:       { padding: "8px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 13, fontFamily: "inherit", flex: 1, minWidth: 180, outline: "none" },
  select:      { padding: "8px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 13, fontFamily: "inherit", background: "#fff", cursor: "pointer" },
  table:       { background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "auto", boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
  th:          { padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap" },
  tr:          { borderBottom: "1px solid #F1F5F9" },
  td:          { padding: "10px 12px", fontSize: 13, verticalAlign: "middle" },
  memberName:  { fontWeight: 700, color: "#0F172A", fontSize: 13 },
  memberSub:   { fontSize: 11, color: "#94A3B8" },
  badge:       { fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, display: "inline-block" },
  actions:     { display: "flex", flexWrap: "wrap", gap: 4 },
  actionsCol:  { display: "flex", flexDirection: "column", gap: 6, minWidth: 200 },
  actionGroup: { display: "flex", flexWrap: "wrap", gap: 4 },
  pagination:  { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 16 },
  btnSecondary:{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  btnPrimary:  { padding: "8px 18px", borderRadius: 8, border: "none", background: "#7C3AED", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  btnSuccess:  { padding: "8px 18px", borderRadius: 8, border: "none", background: "#059669", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  btnDanger:   { padding: "8px 18px", borderRadius: 8, border: "none", background: "#DC2626", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },

  toast:       { position: "fixed", top: 20, right: 20, zIndex: 9999, padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,0,0,.12)", maxWidth: 400 },
  overlay:     { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" },
  modalBox:    { background: "#fff", borderRadius: 16, padding: "28px 32px", maxWidth: 420, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,.2)" },
  modalTitle:  { fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "0 0 12px" },
  modalText:   { fontSize: 14, color: "#475569", lineHeight: 1.6, margin: "0 0 20px" },
  modalActions:{ display: "flex", gap: 10, justifyContent: "flex-end" },
};
