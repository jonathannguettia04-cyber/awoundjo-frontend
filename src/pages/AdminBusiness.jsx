// src/pages/AdminBusiness.jsx
// ══════════════════════════════════════════════════════════════
//  Awoundjô — Administration Réseau Business
//
//  CORRECTIONS v2 :
//  1. Mot de passe Sce Technique vérifié côté serveur (DB)
//     POST /api/business/admin/sce-auth { password } → 200 | 401
//     (suppression de la constante hardcodée SCE_TECH_PASSWORD)
//  2. commissions_count → fallback ?? 0 (plus de null ambigu)
//  3. Pagination membres : disabled={page * LIMIT >= totalMembers}
//  4. Variable shadow `s` dans le .map statuts → renommée `stColor`
//  5. loadScePayments enveloppé dans useCallback
//  6. Pagination clients : disabled={clientPage * CLIENT_LIMIT >= clientsTotal}
//
//  AJOUTS v2 :
//  7. Onglet "Collectes" — vue admin de toutes les collectes progressives
//     GET  /api/business/admin/collectes?page&limit&search&status
//     POST /api/business/admin/collectes/:clientId/wave-confirm
//     POST /api/business/admin/collectes/:clientId/verse-commissions
//  8. CollecteAdminModal — confirmer versements Wave + déclencher commissions
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

const CLIENT_STATUS_MAP = {
  actif:            { bg: "#ECFDF5", color: "#059669", label: "Actif"          },
  attente:          { bg: "#FFFBEB", color: "#D97706", label: "En attente"     },
  suspendu:         { bg: "#FEF2F2", color: "#DC2626", label: "Suspendu"       },
  renewal_required: { bg: "#DBEAFE", color: "#1D4ED8", label: "Renouvellement" },
};

const TABS = [
  "Membres",
  "Commissions",
  "Bonus Pool",
  "Demandes Commission",
  "Clients",
  "Collectes",
  "Parrainage",
  "Sce Technique",
];

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
  const [bonusPoolRouteMissing, setBonusPoolRouteMissing] = useState(false);
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
  const [clients,      setClients]      = useState([]);
  const [clientsTotal, setClientsTotal] = useState(0);
  const [clientOrigin, setClientOrigin] = useState("");
  const [clientStatus, setClientStatus] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [clientPage,   setClientPage]   = useState(1);
  const CLIENT_LIMIT = 30;

  // Demandes de commission (retrait)
  const [demandesComm,         setDemandesComm]         = useState([]);
  const [demandesStats,        setDemandesStats]        = useState({});
  const [demandesStatusFilter, setDemandesStatusFilter] = useState("");
  const [actionLoading,        setActionLoading]        = useState(null);
  const [rejectModal,          setRejectModal]          = useState(null);
  const [rejectNote,           setRejectNote]           = useState("");

  // Collectes admin
  const [collectes,          setCollectes]          = useState([]);
  const [collectesTotal,     setCollectesTotal]     = useState(0);
  const [collecteSearch,     setCollecteSearch]     = useState("");
  const [collecteStatusFilt, setCollecteStatusFilt] = useState(""); // "" | "en_cours" | "complete"
  const [collectePage,       setCollectePage]       = useState(1);
  const [collecteModal,      setCollecteModal]      = useState(null); // { client }
  const COLLECTE_LIMIT = 30;

  // Parrainage admin
  const [parrainages,        setParrainages]        = useState([]);
  const [parrainagesTotal,   setParrainagesTotal]   = useState(0);
  const [parrainageSearch,   setParrainageSearch]   = useState("");
  const [parrainageStatus,   setParrainageStatus]   = useState(""); // "" | "active" | "expired" | "disabled"
  const [parrainagePage,     setParrainagePage]     = useState(1);
  const [parrainageStats,    setParrainageStats]    = useState(null);
  const [parrainageModal,    setParrainageModal]    = useState(null); // { type: "disable"|"detail", lien }
  const PARRAINAGE_LIMIT = 30;

  // Sce Technique — mot de passe vérifié côté serveur
  const [sceUnlocked,     setSceUnlocked]     = useState(false);
  const [scePwdInput,     setScePwdInput]     = useState("");
  const [scePwdError,     setScePwdError]     = useState(false);
  const [scePwdLoading,   setScePwdLoading]   = useState(false);
  const [scePayments,     setScePayments]     = useState([]);
  const [sceLoading,      setSceLoading]      = useState(false);
  const [sceVerseLoading, setSceVerseLoading] = useState(null);

  // Modal confirmation membres
  const [modal,         setModal]         = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [deleting,      setDeleting]      = useState(false);

  // ── Toast ─────────────────────────────────────────────────
  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Loaders ───────────────────────────────────────────────
  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filterRole)   params.set("role",   filterRole);
      if (filterStatus) params.set("status", filterStatus);
      if (search)       params.set("search", search);
      const d = await get(`/api/business/admin/members?${params}`);
      setMembers(d.data?.members || d.members || []);
      setTotalMembers(
        d.data?.pagination?.total ??
        d.pagination?.total ??
        (d.data?.members || d.members || []).length
      );
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
      let d;
      try {
        d = await get("/api/business/admin/bonus-pool");
      } catch {
        d = { bonus_pool: [], current_pool: 0, _routeMissing: true };
      }
      setBonusPool(d.data?.bonus_pool || d.bonus_pool || d.history || []);
      setBonusPoolCurrent(d.data?.current_pool ?? d.current_pool ?? 0);
      setBonusPoolRouteMissing(!!d._routeMissing);
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
      setClientsTotal(
        d.data?.pagination?.total ??
        d.pagination?.total ??
        (d.data?.clients || d.clients || []).length
      );
    } catch (e) { showToast(e.message, true); }
    setLoading(false);
  }, [get, clientPage, clientOrigin, clientStatus, clientSearch]);

  const loadDemandesCommission = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (demandesStatusFilter) params.set("status", demandesStatusFilter);
      const d = await get(`/api/business/admin/commission-requests?${params}`);
      setDemandesComm(d.requests || d.data?.requests || []);
      setDemandesStats(d.stats   || d.data?.stats   || {});
    } catch (e) { showToast(e.message, true); }
    setLoading(false);
  }, [get, demandesStatusFilter]);

  // FIX : loadCollectes — onglet admin collectes
  const loadCollectes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: collectePage, limit: COLLECTE_LIMIT });
      if (collecteSearch)     params.set("search", collecteSearch);
      if (collecteStatusFilt) params.set("status", collecteStatusFilt);
      const d = await get(`/api/business/admin/collectes?${params}`);
      setCollectes(d.data?.collectes || d.collectes || []);
      setCollectesTotal(
        d.data?.pagination?.total ??
        d.pagination?.total ??
        (d.data?.collectes || d.collectes || []).length
      );
    } catch (e) { showToast(e.message, true); }
    setLoading(false);
  }, [get, collectePage, collecteSearch, collecteStatusFilt]);

  const loadParrainages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: parrainagePage, limit: PARRAINAGE_LIMIT });
      if (parrainageSearch) params.set("search", parrainageSearch);
      if (parrainageStatus) params.set("status", parrainageStatus);
      const d = await get(`/api/business/admin/parrainage-links?${params}`);
      setParrainages(d.data?.links || d.links || []);
      setParrainagesTotal(
        d.data?.pagination?.total ??
        d.pagination?.total ??
        (d.data?.links || d.links || []).length
      );
      if (d.data?.stats || d.stats) {
        setParrainageStats(d.data?.stats || d.stats);
      }
    } catch (e) { showToast(e.message, true); }
    setLoading(false);
  }, [get, parrainagePage, parrainageSearch, parrainageStatus]);

  // FIX : loadScePayments en useCallback (était une fonction normale)
  const loadScePayments = useCallback(async () => {
    setSceLoading(true);
    try {
      const d = await get("/api/business/admin/members?page=1&limit=200");
      const allMembers = d.data?.members || d.members || [];
      const rows = allMembers.map(m => ({
        id:               m.id,
        member:           m,
        amount:           m.membership_fee || 15000,
        payment_type:     "adhesion",
        status:           m.status_payment === "paid" ? "COMPLETED" : "PENDING",
        created_at:       m.created_at,
        // FIX : fallback 0 au lieu de null pour éviter hasComm=false sur membres payés sans count
        commissions_count: m.commissions_count ?? 0,
      }));
      setScePayments(rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (e) { showToast(e.message, true); }
    setSceLoading(false);
  }, [get]);

  useEffect(() => {
    if (tab === "Membres")             loadMembers();
    if (tab === "Commissions")         loadCommissions();
    if (tab === "Bonus Pool")          loadBonusPool();
    if (tab === "Demandes Commission") loadDemandesCommission();
    if (tab === "Clients")             loadClients();
    if (tab === "Collectes")           loadCollectes();
    if (tab === "Parrainage")          loadParrainages();
    if (tab === "Sce Technique" && sceUnlocked) loadScePayments();
  }, [
    tab, sceUnlocked,
    loadMembers, loadCommissions, loadBonusPool,
    loadDemandesCommission, loadClients, loadCollectes, loadParrainages, loadScePayments,
  ]);

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
      const r = await fetch(`${API}/api/business/admin/commission-requests/${id}`, {
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

  // ── Actions parrainage ─────────────────────────────────────
  async function handleDisableParrainage(linkId) {
    try {
      await post(`/api/business/admin/parrainage-links/${linkId}/disable`);
      showToast("🔒 Lien de parrainage désactivé");
      setParrainageModal(null);
      loadParrainages();
    } catch (e) { showToast(e.message, true); }
  }

  async function handleEnableParrainage(linkId) {
    try {
      await post(`/api/business/admin/parrainage-links/${linkId}/enable`);
      showToast("✅ Lien de parrainage réactivé");
      loadParrainages();
    } catch (e) { showToast(e.message, true); }
  }

  // ── Sce Technique — auth via DB (FIX : plus de mot de passe hardcodé) ──
  async function handleSceAuth() {
    if (!scePwdInput.trim()) return;
    setScePwdLoading(true);
    setScePwdError(false);
    try {
      // POST /api/business/admin/sce-auth { password }
      // Le backend compare au hash stocké en base (table settings ou admin_config)
      await post("/api/business/admin/sce-auth", { password: scePwdInput });
      setSceUnlocked(true);
      setScePwdInput("");
    } catch {
      setScePwdError(true);
    }
    setScePwdLoading(false);
  }

  async function handleVerseCommissions(paymentId, memberId) {
    setSceVerseLoading(paymentId);
    try {
      await post(`/api/business/admin/members/${memberId}/recalc-commissions`);
      showToast("✅ Commissions versées avec succès");
      loadScePayments();
    } catch (e) { showToast(e.message, true); }
    setSceVerseLoading(null);
  }

  const filteredMembers = members;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Toast */}
      {toast && (
        <div style={{
          ...s.toast,
          background: toast.isError ? "#FEF2F2" : "#ECFDF5",
          color:      toast.isError ? "#DC2626" : "#059669",
          border:     `1px solid ${toast.isError ? "#FECACA" : "#A7F3D0"}`,
        }}>
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
          <StatBadge label="Membres"    value={totalMembers}        color="#7C3AED" />
          <StatBadge label="Commissions" value={commissions.length} color="#0891B2" />
          <StatBadge label="Collectes"  value={collectesTotal}      color="#059669" />
        </div>
      </div>

      {/* Onglets */}
      <div style={{ ...s.tabs, flexWrap: "wrap" }}>
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

      {/* ══ ONGLET MEMBRES ══════════════════════════════════ */}
      {tab === "Membres" && (
        <div>
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
              {["ACTIVE","PENDING","SUSPENDED"].map(sv => (
                <option key={sv} value={sv}>{sv}</option>
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
                    const roleC   = ROLE_COLORS[m.role]   || {};
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
                        <td style={{ ...s.td, textAlign: "center", fontWeight: 700, color: "#0891B2" }}>
                          {m.total_clients_created ?? "—"}
                        </td>
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
                            {m.status_validation === "pending" && (
                              <div style={s.actionGroup}>
                                <ActionBtn label="✅ Approuver" color="#059669" onClick={() => setModal({ type: "approve", member: m })} />
                                <ActionBtn label="💵 Cash"      color="#0891B2" onClick={() => setModal({ type: "cash",    member: m })} />
                                <ActionBtn label="❌ Rejeter"   color="#DC2626" onClick={() => setModal({ type: "reject",  member: m })} />
                              </div>
                            )}
                            <div style={s.actionGroup}>
                              <ActionBtn label="🔑 Réinit. MDP"  color="#7C3AED" onClick={() => setModal({ type: "password", member: m })} />
                              <ActionBtn label="♻️ Commissions"  color="#D97706" onClick={() => setModal({ type: "recalc",   member: m })} />
                              <ActionBtn label="🗑️ Supprimer"    color="#DC2626" onClick={() => { setAdminPassword(""); setModal({ type: "delete", member: m }); }} />
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

          {/* Pagination — FIX : désactivation correcte avec totalMembers */}
          <div style={s.pagination}>
            <button style={s.btnSecondary} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Préc.</button>
            <span style={{ fontSize: 13, color: "#64748B" }}>
              Page {page} · {totalMembers} membre{totalMembers !== 1 ? "s" : ""}
            </span>
            <button
              style={s.btnSecondary}
              disabled={page * LIMIT >= totalMembers}
              onClick={() => setPage(p => p + 1)}
            >
              Suiv. →
            </button>
          </div>
        </div>
      )}

      {/* ══ ONGLET COMMISSIONS ══════════════════════════════ */}
      {tab === "Commissions" && (
        <div>
          <div style={s.filters}>
            {/* FIX : variable renommée stColor pour éviter le shadow de l'objet s */}
            <select style={s.select} value={commStatus} onChange={e => setCommStatus(e.target.value)}>
              <option value="">Tous les statuts</option>
              {["PENDING","VALIDATED","PAID","REJECTED"].map(stColor => (
                <option key={stColor} value={stColor}>{stColor}</option>
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
                    // FIX : variable renommée commSt pour éviter tout shadow
                    const commSt = {
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
                          <span style={{ ...s.badge, background: commSt.bg, color: commSt.color }}>
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
                                <ActionBtn label="💸 Payer"   color="#059669" onClick={() => handleCommAction(c.id, "pay")} />
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

      {/* ══ ONGLET BONUS POOL ═══════════════════════════════ */}
      {tab === "Bonus Pool" && (
        <div>
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
          {loading ? <Spinner /> : bonusPoolRouteMissing ? (
            <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 12, padding: "20px 24px", color: "#92400E" }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>⚠️ Route backend manquante</div>
              <p style={{ margin: "0 0 8px", fontSize: 13 }}>
                La route <code style={{ background: "#FEF3C7", padding: "2px 6px", borderRadius: 4 }}>GET /api/business/admin/bonus-pool</code> n'existe pas encore.
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#B45309" }}>
                Ajouter cet endpoint avec <code style={{ background: "#FEF3C7", padding: "2px 4px", borderRadius: 4 }}>authenticateAdmin</code>.
                Retourner <code style={{ background: "#FEF3C7", padding: "2px 4px", borderRadius: 4 }}>{"{ bonus_pool[], current_pool }"}</code>.
              </p>
            </div>
          ) : bonusPool.length === 0 ? (
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

      {/* ══ ONGLET DEMANDES COMMISSION ══════════════════════ */}
      {tab === "Demandes Commission" && (
        <div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            {[
              { label: "En attente", key: "PENDING",   color: "#D97706", bg: "#FFFBEB" },
              { label: "Validées",   key: "VALIDATED", color: "#1B4FD8", bg: "#EFF6FF" },
              { label: "Payées",     key: "PAID",      color: "#059669", bg: "#ECFDF5" },
              { label: "Rejetées",   key: "REJECTED",  color: "#DC2626", bg: "#FEF2F2" },
            ].map(({ label, key, color, bg }) => (
              <div key={key}
                onClick={() => setDemandesStatusFilter(demandesStatusFilter === key ? "" : key)}
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
                const details = typeof r.payment_details === "string"
                  ? JSON.parse(r.payment_details || "{}") : (r.payment_details || {});
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

      {/* ══ ONGLET CLIENTS ══════════════════════════════════ */}
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
                    {["Client","N° Mutualiste","Statut","Origine","Recruteur","Formule","Paiement","Date"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => {
                    const cliSt = CLIENT_STATUS_MAP[c.status] || { bg: "#F1F5F9", color: "#64748B", label: c.status || "—" };
                    return (
                      <tr key={c.id} style={s.tr}>
                        <td style={s.td}>
                          <div style={s.memberName}>{c.name || c.full_name}</div>
                          <div style={s.memberSub}>{c.email}</div>
                          {c.phone && <div style={s.memberSub}>{c.phone}</div>}
                        </td>
                        <td style={s.td}>
                          <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#7C3AED" }}>
                            {c.mutual_number || "—"}
                          </span>
                        </td>
                        <td style={s.td}>
                          <span style={{ ...s.badge, background: cliSt.bg, color: cliSt.color }}>{cliSt.label}</span>
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
                        <td style={s.td}>
                          <span style={{ ...s.badge,
                            background: c.status_payment === "paid" ? "#ECFDF5" : "#FFF7ED",
                            color:      c.status_payment === "paid" ? "#059669" : "#D97706" }}>
                            {c.status_payment === "paid" ? "✅ Payé" : "⏳ Impayé"}
                          </span>
                        </td>
                        <td style={{ ...s.td, fontSize: 12, whiteSpace: "nowrap" }}>
                          {c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR") : "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {clients.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "#94A3B8" }}>
                      Aucun client trouvé
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination — FIX */}
          <div style={s.pagination}>
            <button style={s.btnSecondary} disabled={clientPage === 1} onClick={() => setClientPage(p => p - 1)}>← Préc.</button>
            <span style={{ fontSize: 13, color: "#64748B" }}>
              Page {clientPage} · {clientsTotal} client{clientsTotal !== 1 ? "s" : ""}
            </span>
            <button
              style={s.btnSecondary}
              disabled={clientPage * CLIENT_LIMIT >= clientsTotal}
              onClick={() => setClientPage(p => p + 1)}
            >
              Suiv. →
            </button>
          </div>
        </div>
      )}

      {/* ══ ONGLET COLLECTES (NOUVEAU) ══════════════════════ */}
      {tab === "Collectes" && (
        <div>
          {/* Résumé rapide */}
          {!loading && (
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ background: "#fff", border: "1.5px solid #BFDBFE", borderRadius: 12, padding: "14px 20px", minWidth: 180 }}>
                <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Total collectes</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#2563EB" }}>{collectesTotal}</div>
              </div>
              <div style={{ background: "#fff", border: "1.5px solid #A7F3D0", borderRadius: 12, padding: "14px 20px", minWidth: 180 }}>
                <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Complètes</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#059669" }}>
                  {collectes.filter(c => c.complete).length}
                </div>
              </div>
              <div style={{ background: "#fff", border: "1.5px solid #FDE68A", borderRadius: 12, padding: "14px 20px", minWidth: 180 }}>
                <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>En cours</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#D97706" }}>
                  {collectes.filter(c => !c.complete).length}
                </div>
              </div>
            </div>
          )}

          {/* Filtres */}
          <div style={s.filters}>
            <input
              style={s.input} placeholder="🔍 Nom client, téléphone, N° mutualiste…"
              value={collecteSearch}
              onChange={e => { setCollecteSearch(e.target.value); setCollectePage(1); }}
            />
            <select style={s.select} value={collecteStatusFilt} onChange={e => { setCollecteStatusFilt(e.target.value); setCollectePage(1); }}>
              <option value="">Toutes les collectes</option>
              <option value="en_cours">En cours</option>
              <option value="complete">Complètes</option>
            </select>
            <button style={s.btnSecondary} onClick={loadCollectes}>↻ Rafraîchir</button>
          </div>

          {loading ? <Spinner /> : (
            <div style={s.table}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["Client","Recruteur","Formule","Progression","Statut","Date","Actions"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {collectes.map(c => {
                    const pct = Math.min(100, Math.round(
                      ((c.total_verse || 0) / (c.adhesion_price || 15000)) * 100
                    ));
                    return (
                      <tr key={c.id || c.client_id} style={s.tr}>
                        {/* Client */}
                        <td style={s.td}>
                          <div style={s.memberName}>{c.client_name || c.name}</div>
                          <div style={s.memberSub}>{c.client_phone || c.phone}</div>
                          <div style={{ fontFamily: "monospace", fontSize: 11, color: "#7C3AED", marginTop: 2 }}>
                            {c.mutual_number || "—"}
                          </div>
                        </td>
                        {/* Recruteur */}
                        <td style={s.td}>
                          {c.recruteur_name
                            ? <>
                                <div style={s.memberName}>{c.recruteur_name}</div>
                                <div style={s.memberSub}>
                                  {c.recruteur_role && (
                                    <span style={{ ...s.badge, ...ROLE_COLORS[c.recruteur_role], border: `1px solid ${ROLE_COLORS[c.recruteur_role]?.border}` }}>
                                      {c.recruteur_role}
                                    </span>
                                  )}
                                </div>
                              </>
                            : <span style={{ color: "#CBD5E1" }}>—</span>
                          }
                        </td>
                        {/* Formule */}
                        <td style={s.td}>
                          <span style={{ ...s.badge, background: "#F5F3FF", color: "#7C3AED", border: "1px solid #DDD6FE" }}>
                            {c.plan || c.plan_name || "—"}
                          </span>
                          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                            {Number(c.adhesion_price || 0).toLocaleString("fr-FR")} FCFA
                          </div>
                        </td>
                        {/* Progression */}
                        <td style={{ ...s.td, minWidth: 160 }}>
                          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, color: pct >= 100 ? "#059669" : "#0F172A" }}>
                              {Number(c.total_verse || 0).toLocaleString("fr-FR")}
                            </span>
                            {" / "}
                            {Number(c.adhesion_price || 0).toLocaleString("fr-FR")} FCFA
                          </div>
                          <div style={{ height: 8, background: "#E2E8F0", borderRadius: 6, overflow: "hidden", width: "100%" }}>
                            <div style={{
                              height: "100%", borderRadius: 6, transition: "width .4s",
                              background: pct >= 100 ? "#059669" : "#7C3AED",
                              width: `${pct}%`,
                            }} />
                          </div>
                          <div style={{ fontSize: 11, color: pct >= 100 ? "#059669" : "#7C3AED", fontWeight: 700, marginTop: 3 }}>
                            {pct}%
                            {c.reste > 0 && <span style={{ color: "#D97706", marginLeft: 8 }}>reste : {Number(c.reste).toLocaleString("fr-FR")} F</span>}
                          </div>
                          {/* Nb versements */}
                          {c.versements_count != null && (
                            <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>
                              {c.versements_count} versement{c.versements_count !== 1 ? "s" : ""}
                            </div>
                          )}
                        </td>
                        {/* Statut */}
                        <td style={s.td}>
                          {c.complete
                            ? <span style={{ ...s.badge, background: "#ECFDF5", color: "#059669" }}>✅ Complète</span>
                            : <span style={{ ...s.badge, background: "#FFF7ED", color: "#D97706" }}>⏳ En cours</span>
                          }
                          {c.commissions_versees != null && (
                            <div style={{ fontSize: 10, marginTop: 4 }}>
                              <span style={{ ...s.badge,
                                background: c.commissions_versees ? "#ECFDF5" : "#FEF2F2",
                                color:      c.commissions_versees ? "#059669" : "#DC2626",
                                fontSize: 10 }}>
                                {c.commissions_versees ? "💰 Comm. versées" : "⚠️ Comm. en attente"}
                              </span>
                            </div>
                          )}
                        </td>
                        {/* Date */}
                        <td style={{ ...s.td, fontSize: 12, color: "#94A3B8", whiteSpace: "nowrap" }}>
                          {c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR") : "—"}
                        </td>
                        {/* Actions */}
                        <td style={s.td}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <button
                              onClick={() => setCollecteModal(c)}
                              style={{ ...s.btnSecondary, fontSize: 11, padding: "5px 10px" }}
                            >
                              📋 Détail
                            </button>
                            {c.complete && !c.commissions_versees && (
                              <button
                                onClick={async () => {
                                  try {
                                    await post(`/api/business/admin/collectes/${c.client_id || c.id}/verse-commissions`);
                                    showToast("✅ Commissions déclenchées");
                                    loadCollectes();
                                  } catch (e) { showToast(e.message, true); }
                                }}
                                style={{ ...s.btnPrimary, fontSize: 11, padding: "5px 10px" }}
                              >
                                💸 Verser comm.
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {collectes.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: 48, color: "#94A3B8" }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
                      <p style={{ fontWeight: 700 }}>Aucune collecte trouvée</p>
                      <p style={{ fontSize: 12 }}>Les collectes progressives apparaîtront ici</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination collectes */}
          <div style={s.pagination}>
            <button style={s.btnSecondary} disabled={collectePage === 1} onClick={() => setCollectePage(p => p - 1)}>← Préc.</button>
            <span style={{ fontSize: 13, color: "#64748B" }}>
              Page {collectePage} · {collectesTotal} collecte{collectesTotal !== 1 ? "s" : ""}
            </span>
            <button
              style={s.btnSecondary}
              disabled={collectePage * COLLECTE_LIMIT >= collectesTotal}
              onClick={() => setCollectePage(p => p + 1)}
            >
              Suiv. →
            </button>
          </div>

          {/* Modal détail collecte */}
          {collecteModal && (
            <CollecteAdminModal
              collecte={collecteModal}
              token={token}
              onClose={() => setCollecteModal(null)}
              onUpdated={() => { setCollecteModal(null); loadCollectes(); }}
              showToast={showToast}
            />
          )}
        </div>
      )}

      {/* ══ ONGLET PARRAINAGE ═══════════════════════════════ */}
      {tab === "Parrainage" && (
        <div>
          {/* Stats rapides */}
          {!loading && (
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ background: "#fff", border: "1.5px solid #DDD6FE", borderRadius: 12, padding: "14px 20px", minWidth: 160 }}>
                <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Total liens</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#7C3AED" }}>{parrainagesTotal}</div>
              </div>
              <div style={{ background: "#fff", border: "1.5px solid #A7F3D0", borderRadius: 12, padding: "14px 20px", minWidth: 160 }}>
                <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Actifs</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#059669" }}>
                  {parrainageStats?.active ?? parrainages.filter(l => l.status === "active" || l.active).length}
                </div>
              </div>
              <div style={{ background: "#fff", border: "1.5px solid #FDE68A", borderRadius: 12, padding: "14px 20px", minWidth: 160 }}>
                <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Clients créés</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#D97706" }}>
                  {parrainageStats?.total_clients ?? parrainages.reduce((s, l) => s + (l.clients_count || 0), 0)}
                </div>
              </div>
              <div style={{ background: "#fff", border: "1.5px solid #FECACA", borderRadius: 12, padding: "14px 20px", minWidth: 160 }}>
                <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Expirés / Désactivés</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#DC2626" }}>
                  {parrainageStats?.inactive ?? parrainages.filter(l => l.status === "expired" || l.status === "disabled" || l.disabled).length}
                </div>
              </div>
            </div>
          )}

          {/* Filtres */}
          <div style={s.filters}>
            <input
              style={s.input}
              placeholder="🔍 Nom parrain, email, token…"
              value={parrainageSearch}
              onChange={e => { setParrainageSearch(e.target.value); setParrainagePage(1); }}
            />
            <select style={s.select} value={parrainageStatus} onChange={e => { setParrainageStatus(e.target.value); setParrainagePage(1); }}>
              <option value="">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="expired">Expirés</option>
              <option value="disabled">Désactivés</option>
            </select>
            <button style={s.btnSecondary} onClick={loadParrainages}>↻ Rafraîchir</button>
          </div>

          {loading ? <Spinner /> : (
            <div style={s.table}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["Parrain","Rôle","Token / Lien","Clients","Statut","Expiration","Actions"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parrainages.map(lien => {
                    const isActive   = lien.status === "active"   || (!lien.status && lien.active && !lien.disabled);
                    const isExpired  = lien.status === "expired"  || (!lien.status && lien.expires_at && new Date(lien.expires_at) < new Date());
                    const isDisabled = lien.status === "disabled" || lien.disabled;
                    const statusLabel = isDisabled ? "Désactivé" : isExpired ? "Expiré" : "Actif";
                    const statusStyle = isDisabled
                      ? { bg: "#FEF2F2", color: "#DC2626" }
                      : isExpired
                      ? { bg: "#FFF7ED", color: "#D97706" }
                      : { bg: "#ECFDF5", color: "#059669" };
                    const roleC = ROLE_COLORS[lien.parrain_role || lien.member_role] || {};
                    const BASE  = window.location.origin;
                    const fullUrl = `${BASE}/parrainage/${lien.token}`;

                    return (
                      <tr key={lien.id || lien.token} style={s.tr}>
                        {/* Parrain */}
                        <td style={s.td}>
                          <div style={s.memberName}>{lien.parrain_name || lien.member_name || "—"}</div>
                          <div style={s.memberSub}>{lien.parrain_email || lien.member_email || ""}</div>
                          {(lien.parrain_phone || lien.member_phone) && (
                            <div style={s.memberSub}>{lien.parrain_phone || lien.member_phone}</div>
                          )}
                        </td>
                        {/* Rôle */}
                        <td style={s.td}>
                          {(lien.parrain_role || lien.member_role) ? (
                            <span style={{ ...s.badge, background: roleC.bg, color: roleC.color, border: `1px solid ${roleC.border}` }}>
                              {lien.parrain_role || lien.member_role}
                            </span>
                          ) : <span style={{ color: "#CBD5E1" }}>—</span>}
                        </td>
                        {/* Token / Lien */}
                        <td style={s.td}>
                          <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#7C3AED", marginBottom: 4 }}>
                            {lien.token}
                          </div>
                          <button
                            onClick={() => { navigator.clipboard.writeText(fullUrl); showToast("📋 Lien copié !"); }}
                            style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, border: "1px solid #DDD6FE", background: "#F5F3FF", color: "#7C3AED", cursor: "pointer", fontFamily: "inherit" }}
                          >
                            📋 Copier le lien
                          </button>
                        </td>
                        {/* Clients */}
                        <td style={{ ...s.td, textAlign: "center" }}>
                          <span style={{ fontWeight: 800, fontSize: 16, color: "#0891B2" }}>
                            {lien.clients_count ?? lien.total_clients ?? 0}
                          </span>
                          {(lien.clients_paid != null) && (
                            <div style={{ fontSize: 11, color: "#059669", marginTop: 2 }}>
                              {lien.clients_paid} payé{lien.clients_paid !== 1 ? "s" : ""}
                            </div>
                          )}
                        </td>
                        {/* Statut */}
                        <td style={s.td}>
                          <span style={{ ...s.badge, background: statusStyle.bg, color: statusStyle.color }}>
                            {statusLabel}
                          </span>
                        </td>
                        {/* Expiration */}
                        <td style={{ ...s.td, fontSize: 12, color: "#94A3B8", whiteSpace: "nowrap" }}>
                          {lien.expires_at
                            ? new Date(lien.expires_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
                            : <span style={{ color: "#CBD5E1" }}>Sans limite</span>
                          }
                        </td>
                        {/* Actions */}
                        <td style={s.td}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <button
                              onClick={() => setParrainageModal({ type: "detail", lien })}
                              style={{ ...s.btnSecondary, fontSize: 11, padding: "5px 10px" }}
                            >
                              👁️ Détail
                            </button>
                            {isDisabled ? (
                              <button
                                onClick={() => handleEnableParrainage(lien.id)}
                                style={{ fontSize: 11, padding: "5px 10px", borderRadius: 8, border: "none", background: "#ECFDF5", color: "#059669", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                              >
                                ✅ Réactiver
                              </button>
                            ) : (
                              <button
                                onClick={() => setParrainageModal({ type: "disable", lien })}
                                style={{ fontSize: 11, padding: "5px 10px", borderRadius: 8, border: "none", background: "#FEF2F2", color: "#DC2626", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                              >
                                🔒 Désactiver
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {parrainages.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: 48, color: "#94A3B8" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
                        <p style={{ fontWeight: 700 }}>Aucun lien de parrainage trouvé</p>
                        <p style={{ fontSize: 12 }}>Les liens générés par les membres apparaîtront ici</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div style={s.pagination}>
            <button style={s.btnSecondary} disabled={parrainagePage === 1} onClick={() => setParrainagePage(p => p - 1)}>← Préc.</button>
            <span style={{ fontSize: 13, color: "#64748B" }}>
              Page {parrainagePage} · {parrainagesTotal} lien{parrainagesTotal !== 1 ? "s" : ""}
            </span>
            <button
              style={s.btnSecondary}
              disabled={parrainagePage * PARRAINAGE_LIMIT >= parrainagesTotal}
              onClick={() => setParrainagePage(p => p + 1)}
            >
              Suiv. →
            </button>
          </div>

          {/* Modal désactiver */}
          {parrainageModal?.type === "disable" && (
            <div style={s.overlay}>
              <div style={s.modalBox}>
                <h3 style={{ ...s.modalTitle, color: "#DC2626" }}>🔒 Désactiver le lien</h3>
                <p style={s.modalText}>
                  Désactiver le lien de parrainage de <strong>{parrainageModal.lien.parrain_name || parrainageModal.lien.member_name}</strong> ?<br />
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>Token : <code>{parrainageModal.lien.token}</code></span><br /><br />
                  Les clients déjà inscrits ne seront pas affectés. Le lien ne pourra plus être utilisé pour de nouvelles inscriptions.
                </p>
                <div style={s.modalActions}>
                  <button style={s.btnSecondary} onClick={() => setParrainageModal(null)}>Annuler</button>
                  <button style={s.btnDanger} onClick={() => handleDisableParrainage(parrainageModal.lien.id)}>
                    🔒 Désactiver
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal détail lien — données enrichies via API */}
          {parrainageModal?.type === "detail" && (
            <ParrainageLinkDetailModal
              lien={parrainageModal.lien}
              token={token}
              showToast={showToast}
              onClose={() => setParrainageModal(null)}
              onDisable={() => setParrainageModal({ type: "disable", lien: parrainageModal.lien })}
              onRefresh={() => { setParrainageModal(null); loadParrainages(); }}
            />
          )}
        </div>
      )}

      {/* ══ MODAL CONFIRMATION MEMBRES ══════════════════════ */}
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
              <p style={s.modalText}>Un mot de passe temporaire sera généré pour <strong>{modal.member.name}</strong>. Notez-le avant de fermer.</p>
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

      {/* ══ ONGLET SCE TECHNIQUE ════════════════════════════ */}
      {tab === "Sce Technique" && (
        <div>
          {!sceUnlocked ? (
            /* ── Écran de verrouillage — mot de passe vérifié en DB (FIX) ── */
            <div style={{ display: "flex", justifyContent: "center", marginTop: 60 }}>
              <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "40px 48px", maxWidth: 380, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,.07)", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>Service Technique</h2>
                <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 24px" }}>
                  Accès restreint — mot de passe vérifié en base de données
                </p>
                <input
                  type="password"
                  placeholder="Mot de passe Sce Technique"
                  value={scePwdInput}
                  onChange={e => { setScePwdInput(e.target.value); setScePwdError(false); }}
                  onKeyDown={e => { if (e.key === "Enter") handleSceAuth(); }}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8,
                    border: `1.5px solid ${scePwdError ? "#DC2626" : "#E2E8F0"}`,
                    fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", marginBottom: 8, outline: "none",
                  }}
                />
                {scePwdError && (
                  <p style={{ color: "#DC2626", fontSize: 12, margin: "0 0 12px" }}>
                    Mot de passe incorrect
                  </p>
                )}
                <button
                  onClick={handleSceAuth}
                  disabled={scePwdLoading}
                  style={{ ...s.btnPrimary, width: "100%", marginTop: 8, opacity: scePwdLoading ? 0.6 : 1 }}
                >
                  {scePwdLoading ? "Vérification…" : "🔓 Déverrouiller"}
                </button>
                <p style={{ fontSize: 11, color: "#CBD5E1", marginTop: 16 }}>
                  Le mot de passe est stocké et vérifié côté serveur.<br/>
                  Route : <code>POST /api/business/admin/sce-auth</code>
                </p>
              </div>
            </div>
          ) : (
            /* ── Contenu Sce Technique ── */
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                    🔧 Service Technique — Versement des commissions
                  </h2>
                  <p style={{ fontSize: 12, color: "#94A3B8", margin: "4px 0 0" }}>
                    Tous les paiements d'entrée (adhésions membres) · Tous niveaux
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={loadScePayments} style={s.btnSecondary}>↻ Rafraîchir</button>
                  <button onClick={() => { setSceUnlocked(false); setScePayments([]); }}
                    style={{ ...s.btnSecondary, color: "#DC2626", borderColor: "#FECACA" }}>
                    🔒 Verrouiller
                  </button>
                </div>
              </div>

              {sceLoading ? <Spinner /> : (
                <div style={s.table}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC" }}>
                        <th style={s.th}>Membre</th>
                        <th style={s.th}>Rôle</th>
                        <th style={s.th}>Montant</th>
                        <th style={s.th}>Type</th>
                        <th style={s.th}>Statut paiement</th>
                        <th style={s.th}>Date</th>
                        <th style={s.th}>Commissions</th>
                        <th style={s.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scePayments.length === 0 && (
                        <tr><td colSpan={8} style={{ ...s.td, textAlign: "center", color: "#94A3B8", padding: 40 }}>
                          Aucun paiement trouvé
                        </td></tr>
                      )}
                      {scePayments.map(p => {
                        const rc = ROLE_COLORS[p.member?.role] || ROLE_COLORS["RECRUTEUR"];
                        // FIX : hasComm fiable car commissions_count est maintenant ?? 0
                        const hasComm = (p.commissions_count ?? 0) > 0;
                        return (
                          <tr key={p.id} style={s.tr}>
                            <td style={s.td}>
                              <div style={s.memberName}>{p.member?.name || "—"}</div>
                              <div style={s.memberSub}>{p.member?.email || p.member?.phone || ""}</div>
                            </td>
                            <td style={s.td}>
                              <span style={{ ...s.badge, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
                                {p.member?.role || "—"}
                              </span>
                            </td>
                            <td style={{ ...s.td, fontWeight: 700, color: "#059669" }}>
                              {Number(p.amount || 0).toLocaleString("fr-FR")} FCFA
                            </td>
                            <td style={s.td}>
                              <span style={{ fontSize: 11, color: "#64748B" }}>
                                {p.payment_type || p.type || "adhesion"}
                              </span>
                            </td>
                            <td style={s.td}>
                              <span style={{ ...s.badge,
                                background: p.status === "COMPLETED" ? "#ECFDF5" : "#FFF7ED",
                                color:      p.status === "COMPLETED" ? "#059669" : "#D97706" }}>
                                {p.status || "—"}
                              </span>
                            </td>
                            <td style={{ ...s.td, fontSize: 12, color: "#94A3B8", whiteSpace: "nowrap" }}>
                              {p.created_at ? new Date(p.created_at).toLocaleDateString("fr-FR") : "—"}
                            </td>
                            <td style={s.td}>
                              <span style={{ ...s.badge,
                                background: hasComm ? "#ECFDF5" : "#FEF2F2",
                                color:      hasComm ? "#059669" : "#DC2626" }}>
                                {hasComm ? `✅ ${p.commissions_count}` : "❌ Aucune"}
                              </span>
                            </td>
                            <td style={s.td}>
                              {p.status === "COMPLETED" && (
                                <button
                                  onClick={() => handleVerseCommissions(p.id, p.member?.id)}
                                  disabled={sceVerseLoading === p.id}
                                  style={{
                                    ...s.btnPrimary, fontSize: 12, padding: "5px 12px",
                                    background: hasComm ? "#64748B" : "#7C3AED",
                                    opacity: sceVerseLoading === p.id ? 0.6 : 1,
                                  }}
                                >
                                  {sceVerseLoading === p.id ? "…" : hasComm ? "♻️ Recalculer" : "💸 Verser"}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MODAL — DÉTAIL LIEN DE PARRAINAGE (avec liste clients enrichie)
//  GET /api/business/admin/parrainage-links/:id/clients
// ══════════════════════════════════════════════════════════════
function ParrainageLinkDetailModal({ lien: lienInit, token, showToast, onClose, onDisable, onRefresh }) {
  const [data,    setData]    = useState(null);  // { lien, stats, clients[] }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/api/business/admin/parrainage-links/${lienInit.id}/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || r.statusText);
        setData(d.data || d);
      } catch (e) {
        showToast(e.message, true);
      }
      setLoading(false);
    })();
  }, [lienInit.id, token]);

  const lien    = data?.lien    || lienInit;
  const stats   = data?.stats   || null;
  const clients = data?.clients || [];

  const BASE    = window.location.origin;
  const fullUrl = `${BASE}/parrainage/${lien.token}`;
  const roleC   = ROLE_COLORS[lien.parrain?.role || lien.parrain_role || lien.member_role] || {};
  const fmt     = n => Number(n || 0).toLocaleString("fr-FR");

  const isDisabled = lien.disabled || lien.status === "disabled";

  const STATUT_STYLE = {
    paye:       { bg: "#ECFDF5", color: "#059669", label: "✅ Payé"       },
    echelonne:  { bg: "#EFF6FF", color: "#2563EB", label: "📊 Échelonné"  },
    en_attente: { bg: "#FFF7ED", color: "#D97706", label: "⏳ En attente" },
  };

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        ...s.modalBox,
        maxWidth: 680,
        width: "95%",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        padding: "24px 28px",
      }}>

        {/* ── En-tête ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h3 style={{ ...s.modalTitle, marginBottom: 2 }}>🔗 Lien de parrainage</h3>
            <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>
              {lien.parrain?.name || lien.parrain_name || lien.member_name || "—"}
              {(lien.parrain?.role || lien.parrain_role || lien.member_role) && (
                <span style={{ marginLeft: 8, ...s.badge,
                  background: roleC.bg, color: roleC.color,
                  border: `1px solid ${roleC.border || roleC.color + "30"}`,
                }}>
                  {lien.parrain?.role || lien.parrain_role || lien.member_role}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94A3B8", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ── Infos parrain + lien ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Parrain</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A", marginBottom: 2 }}>
                {lien.parrain?.name || lien.parrain_name || lien.member_name || "—"}
              </div>
              {(lien.parrain?.email || lien.parrain_email || lien.member_email) && (
                <div style={{ fontSize: 12, color: "#64748B" }}>
                  {lien.parrain?.email || lien.parrain_email || lien.member_email}
                </div>
              )}
              {(lien.parrain?.phone || lien.parrain_phone || lien.member_phone) && (
                <div style={{ fontSize: 12, color: "#64748B" }}>
                  {lien.parrain?.phone || lien.parrain_phone || lien.member_phone}
                </div>
              )}
            </div>

            <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#7C3AED", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Token</div>
              <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#4C1D95", marginBottom: 8, wordBreak: "break-all" }}>
                {lien.token}
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(fullUrl); showToast("📋 Lien copié !"); }}
                style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #DDD6FE", background: "#fff", color: "#7C3AED", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}
              >
                📋 Copier le lien
              </button>
            </div>
          </div>

          {/* ── Stats (depuis API) ── */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8", fontSize: 13 }}>
              Chargement des clients…
            </div>
          ) : (
            <>
              {stats && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {[
                    { label: "Inscrits",    val: stats.total,      bg: "#EFF6FF", color: "#2563EB" },
                    { label: "Payés",       val: stats.payes,      bg: "#ECFDF5", color: "#059669" },
                    { label: "Échelonnés",  val: stats.echelonnes, bg: "#EFF6FF", color: "#0891B2" },
                    { label: "En attente",  val: stats.en_attente, bg: "#FFF7ED", color: "#D97706" },
                  ].map(({ label, val, bg, color }) => (
                    <div key={label} style={{ textAlign: "center", background: bg, borderRadius: 10, padding: "10px 8px" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Liste des clients ── */}
              {clients.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "#94A3B8" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
                  <p style={{ margin: 0, fontWeight: 700 }}>Aucun client inscrit via ce lien</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
                    Clients inscrits ({clients.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
                    {clients.map(c => {
                      const st = STATUT_STYLE[c.statut_paiement] || STATUT_STYLE.en_attente;
                      return (
                        <div key={c.id} style={{
                          background: "#fff",
                          border: "1px solid #E2E8F0",
                          borderRadius: 10,
                          padding: "10px 14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 12,
                        }}>
                          {/* Infos client */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>{c.name}</div>
                            <div style={{ fontSize: 12, color: "#64748B" }}>
                              {c.phone}
                              {c.city && <span style={{ marginLeft: 6 }}>· {c.city}</span>}
                            </div>
                            {c.created_at && (
                              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                                Inscrit le {new Date(c.created_at).toLocaleDateString("fr-FR")}
                              </div>
                            )}
                          </div>

                          {/* Paiement */}
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <span style={{ ...s.badge, background: st.bg, color: st.color, fontSize: 11 }}>
                              {st.label}
                            </span>
                            <div style={{ fontSize: 12, color: "#0F172A", fontWeight: 700, marginTop: 4 }}>
                              {fmt(c.adhesion_price)} F
                            </div>
                            {c.collecte && c.statut_paiement === "echelonne" && (
                              <>
                                {/* Barre de progression */}
                                <div style={{ height: 5, width: 100, background: "#E2E8F0", borderRadius: 4, overflow: "hidden", marginTop: 4, marginLeft: "auto" }}>
                                  <div style={{ height: "100%", width: `${c.collecte.pourcentage}%`, background: "#7C3AED", borderRadius: 4 }} />
                                </div>
                                <div style={{ fontSize: 10, color: "#7C3AED", fontWeight: 700, marginTop: 2 }}>
                                  {c.collecte.pourcentage}% · {fmt(c.collecte.total_verse)} F versés
                                </div>
                                {c.collecte.reste > 0 && (
                                  <div style={{ fontSize: 10, color: "#D97706" }}>
                                    Reste : {fmt(c.collecte.reste)} F
                                  </div>
                                )}
                                {c.collecte.nb_versements > 0 && (
                                  <div style={{ fontSize: 10, color: "#94A3B8" }}>
                                    {c.collecte.nb_versements} versement{c.collecte.nb_versements > 1 ? "s" : ""}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Expiration / date création */}
          <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#94A3B8" }}>
            {lien.created_at && (
              <span>Créé le {new Date(lien.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</span>
            )}
            {lien.expires_at && (
              <span>· Expire le {new Date(lien.expires_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</span>
            )}
            {!lien.expires_at && <span>· Sans limite d'expiration</span>}
          </div>
        </div>

        {/* ── Pied ── */}
        <div style={{ ...s.modalActions, marginTop: 16, paddingTop: 16, borderTop: "1px solid #F1F5F9" }}>
          <button style={s.btnSecondary} onClick={onClose}>Fermer</button>
          {!isDisabled && (
            <button style={s.btnDanger} onClick={onDisable}>
              🔒 Désactiver ce lien
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MODAL — DÉTAIL COLLECTE ADMIN
//  Affiche : progression, versements, formulaire Wave manuel,
//  bouton déclencher commissions
// ══════════════════════════════════════════════════════════════
function CollecteAdminModal({ collecte, token, onClose, onUpdated, showToast }) {
  const [detail,    setDetail]    = useState(null);
  const [loadingD,  setLoadingD]  = useState(true);
  const [waveRef,   setWaveRef]   = useState("");
  const [montant,   setMontant]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [versingComm, setVersingComm] = useState(false);

  const clientId = collecte.client_id || collecte.id;

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/api/business/admin/collectes/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || r.statusText);
        setDetail(d.collecte || d.data || d);
        const reste = d.collecte?.reste ?? d.reste ?? 0;
        if (reste > 0) setMontant(String(reste));
      } catch (e) {
        showToast(e.message, true);
      }
      setLoadingD(false);
    })();
  }, [clientId, token]);

  async function handleWaveConfirm() {
    const mont = Number(montant);
    if (!mont || mont < 500) return showToast("Montant minimum : 500 FCFA", true);
    if (!waveRef.trim())     return showToast("Référence Wave requise", true);
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/api/business/admin/collectes/${clientId}/wave-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ montant: mont, wave_ref: waveRef.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || d.message || "Erreur");
      showToast("✅ Versement enregistré");
      setDetail(d.collecte || detail);
      setWaveRef(""); setMontant("");
      if (d.collecte?.complete) setTimeout(onUpdated, 1500);
    } catch (e) { showToast(e.message, true); }
    setSubmitting(false);
  }

  async function handleVerseCommissions() {
    setVersingComm(true);
    try {
      const r = await fetch(`${API}/api/business/admin/collectes/${clientId}/verse-commissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || d.message || "Erreur");
      showToast("💸 Commissions versées avec succès");
      onUpdated();
    } catch (e) { showToast(e.message, true); }
    setVersingComm(false);
  }

  const pct = detail
    ? Math.min(100, Math.round(((detail.total_verse || 0) / (detail.adhesion_price || 15000)) * 100))
    : 0;
  const fmt = n => Number(n || 0).toLocaleString("fr-FR");

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...s.modalBox, maxWidth: 540, maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* En-tête */}
        <div style={{ marginBottom: 0 }}>
          <h3 style={{ ...s.modalTitle, marginBottom: 4 }}>
            💳 Collecte — {collecte.client_name || collecte.name}
          </h3>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "#94A3B8" }}>
            {collecte.mutual_number || ""} · {collecte.plan || ""}
          </p>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {loadingD ? (
            <div style={{ textAlign: "center", padding: 32, color: "#94A3B8" }}>Chargement…</div>
          ) : detail ? (
            <>
              {/* Progression */}
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Progression</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: pct >= 100 ? "#059669" : "#7C3AED" }}>{pct}%</span>
                </div>
                <div style={{ height: 10, background: "#E2E8F0", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 6, background: pct >= 100 ? "#059669" : "#7C3AED", width: `${pct}%`, transition: "width .4s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "#64748B" }}>
                  <span>Versé : <strong style={{ color: "#0F172A" }}>{fmt(detail.total_verse)} FCFA</strong></span>
                  <span>Total : <strong style={{ color: "#0F172A" }}>{fmt(detail.adhesion_price)} FCFA</strong></span>
                </div>
                {detail.reste > 0 && (
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#D97706", fontWeight: 600 }}>
                    Reste à collecter : {fmt(detail.reste)} FCFA
                  </p>
                )}
                {detail.complete && (
                  <p style={{ margin: "8px 0 0", fontSize: 13, color: "#059669", fontWeight: 700 }}>
                    ✅ Collecte complète !
                  </p>
                )}
              </div>

              {/* Historique des versements */}
              {detail.versements?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
                    Versements ({detail.versements.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {detail.versements.map((v, i) => (
                      <div key={i} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontWeight: 700, color: "#059669" }}>{fmt(v.montant)} FCFA</span>
                          {v.wave_ref && (
                            <span style={{ marginLeft: 10, fontSize: 11, color: "#64748B", fontFamily: "monospace" }}>
                              réf: {v.wave_ref}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>
                          {v.created_at ? new Date(v.created_at).toLocaleDateString("fr-FR") : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulaire Wave manuel (si collecte en cours) */}
              {!detail.complete && (
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8", marginBottom: 12 }}>
                    🔵 Enregistrer un versement Wave
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <label style={{ fontSize: 12, color: "#374151", display: "block", marginBottom: 4, fontWeight: 600 }}>
                        Montant (FCFA)
                      </label>
                      <input
                        type="number" min={500}
                        value={montant}
                        onChange={e => setMontant(e.target.value)}
                        placeholder="ex: 5000"
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #BFDBFE", fontSize: 13, boxSizing: "border-box", outline: "none" }}
                      />
                    </div>
                    <div style={{ flex: 2, minWidth: 160 }}>
                      <label style={{ fontSize: 12, color: "#374151", display: "block", marginBottom: 4, fontWeight: 600 }}>
                        Référence Wave <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        value={waveRef}
                        onChange={e => setWaveRef(e.target.value)}
                        placeholder="ex: WV-2025-XXXXXX"
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #BFDBFE", fontSize: 13, boxSizing: "border-box", outline: "none" }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleWaveConfirm}
                    disabled={submitting || !waveRef.trim() || !montant || Number(montant) < 500}
                    style={{ ...s.btnPrimary, background: "#1D4ED8", fontSize: 13, opacity: (submitting || !waveRef.trim()) ? 0.6 : 1 }}
                  >
                    {submitting ? "Enregistrement…" : "✅ Confirmer le versement"}
                  </button>
                </div>
              )}

              {/* Déclencher commissions (si collecte complète) */}
              {detail.complete && (
                <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#059669", marginBottom: 8 }}>
                    💰 Collecte complète — Commissions
                  </div>
                  {detail.commissions_versees ? (
                    <p style={{ margin: 0, fontSize: 13, color: "#065F46" }}>
                      ✅ Commissions déjà versées au recruteur.
                    </p>
                  ) : (
                    <>
                      <p style={{ margin: "0 0 12px", fontSize: 13, color: "#047857" }}>
                        La collecte est complète mais les commissions n'ont pas encore été déclenchées.
                      </p>
                      <button
                        onClick={handleVerseCommissions}
                        disabled={versingComm}
                        style={{ ...s.btnPrimary, background: "#059669", fontSize: 13, opacity: versingComm ? 0.6 : 1 }}
                      >
                        {versingComm ? "Traitement…" : "💸 Déclencher les commissions"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <p style={{ color: "#94A3B8", textAlign: "center", padding: 24 }}>
              Impossible de charger les données de la collecte.
            </p>
          )}
        </div>

        {/* Pied */}
        <div style={{ ...s.modalActions, marginTop: 16, paddingTop: 16, borderTop: "1px solid #F1F5F9" }}>
          <button style={s.btnSecondary} onClick={onClose}>Fermer</button>
        </div>
      </div>
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
      style={{
        fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 6,
        background: color + "15", color, border: `1px solid ${color}30`,
        cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
      }}
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
  headerStats: { display: "flex", gap: 12, flexWrap: "wrap" },
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
  modalBox:    { background: "#fff", borderRadius: 16, padding: "28px 32px", maxWidth: 480, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,.2)" },
  modalTitle:  { fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "0 0 12px" },
  modalText:   { fontSize: 14, color: "#475569", lineHeight: 1.6, margin: "0 0 20px" },
  modalActions:{ display: "flex", gap: 10, justifyContent: "flex-end" },
};
