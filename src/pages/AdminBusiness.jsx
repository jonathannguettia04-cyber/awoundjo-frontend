// src/pages/AdminBusiness.jsx
// ══════════════════════════════════════════════════════════════
//  Awoundjô — Administration Réseau Business
//  Onglets : Membres · Commissions · Bonus Pool · Actions
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

const TABS = ["Membres", "Commissions", "Bonus Pool"];

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
  const [loading,     setLoading]     = useState(false);
  const [toast,       setToast]       = useState(null);

  // Filtres membres
  const [filterRole,   setFilterRole]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const LIMIT = 30;

  // Filtres commissions
  const [commStatus, setCommStatus] = useState("");

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
      const d = await get(`/api/business/admin/members?${params}`);
      setMembers(d.data?.members || d.members || []);
    } catch (e) { showToast(e.message, true); }
    setLoading(false);
  }, [get, page, filterRole, filterStatus]);

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
      // On récupère les bonus pool via la route membre (admin voit tout)
      const d = await get("/api/business/admin/members?limit=1");
      // bonus_pool n'est pas encore une route admin dédiée → on fetch la route globale
      // Si tu ajoutes GET /api/business/admin/bonus-pool dans le contrôleur, connecte-le ici
      setBonusPool(d.data?.bonus_pool || []);
    } catch { setBonusPool([]); }
    setLoading(false);
  }, [get]);

  useEffect(() => {
    if (tab === "Membres")     loadMembers();
    if (tab === "Commissions") loadCommissions();
    if (tab === "Bonus Pool")  loadBonusPool();
  }, [tab, loadMembers, loadCommissions, loadBonusPool]);

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

  // ── Actions commissions ────────────────────────────────────
  async function handleCommAction(id, action) {
    try {
      await post(`/api/business/admin/commissions/${id}/action`, { action });
      showToast(`✅ Commission : ${action}`);
      loadCommissions();
    } catch (e) { showToast(e.message, true); }
  }

  // ── Filtre local membres ───────────────────────────────────
  const filteredMembers = members.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.includes(q)
    );
  });

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
          <StatBadge label="Membres" value={members.length} color="#7C3AED" />
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
              value={search} onChange={e => setSearch(e.target.value)}
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
                    {["Membre","Rôle","Statut","Parent","Total gagné","Validé","Actions"].map(h => (
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
                        <td style={s.td}>
                          {m.parent_name
                            ? <><div style={s.memberName}>{m.parent_name}</div><div style={s.memberSub}>{m.parent_role}</div></>
                            : <span style={{ color: "#CBD5E1" }}>—</span>
                          }
                        </td>
                        <td style={{ ...s.td, fontWeight: 700, color: "#059669" }}>
                          {Number(m.total_earned || 0).toLocaleString("fr-FR")} F
                        </td>
                        <td style={s.td}>
                          {m.validated_at
                            ? new Date(m.validated_at).toLocaleDateString("fr-FR")
                            : <span style={{ color: "#CBD5E1" }}>—</span>
                          }
                        </td>
                        <td style={s.td}>
                          <div style={s.actions}>
                            {m.status_validation === "pending" && (
                              <>
                                <ActionBtn
                                  label="✅ Approuver"
                                  color="#059669"
                                  onClick={() => setModal({ type: "approve", member: m })}
                                />
                                <ActionBtn
                                  label="✅ Cash"
                                  color="#0891B2"
                                  onClick={() => setModal({ type: "cash", member: m })}
                                />
                                <ActionBtn
                                  label="❌ Rejeter"
                                  color="#DC2626"
                                  onClick={() => setModal({ type: "reject", member: m })}
                                />
                              </>
                            )}
                            <ActionBtn
                              label="🔑 MDP"
                              color="#7C3AED"
                              onClick={() => setModal({ type: "password", member: m })}
                            />
                            <ActionBtn
                              label="♻️"
                              color="#D97706"
                              onClick={() => setModal({ type: "recalc", member: m })}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMembers.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#94A3B8" }}>
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
