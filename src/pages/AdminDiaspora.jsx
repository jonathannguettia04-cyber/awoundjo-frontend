// src/pages/admin/AdminDiaspora.jsx
// ─────────────────────────────────────────────────────────────
//  Vue admin : réseau DIASPORA
//  Rôles réels : AMBASSADEUR_DIASPORA → AMBASSADEUR_PAYS → RECRUTEUR
//  + Section "Comptes en attente de validation" avec Valider/Rejeter
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const agentToken = () => localStorage.getItem("token") || localStorage.getItem("agent_token");

const C = {
  blue:    "#1B4FD8", blueL:   "#EEF2FF",
  green:   "#059669", greenL:  "#ECFDF5",
  gold:    "#D97706", goldL:   "#FFFBEB",
  red:     "#DC2626", redL:    "#FEF2F2",
  purple:  "#7C3AED", purpleL: "#F5F3FF",
  teal:    "#0D9488", tealL:   "#F0FDFA",
  slate:   "#64748B", dark:    "#0F172A",
  border:  "#E2E8F0", bg:      "#F8FAFC",
};

const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" }) : "—";

const ROLE_CONFIG = {
  AMBASSADEUR_DIASPORA: { label:"Ambassadeur Diaspora", icon:"🌍", color:C.blue,  bg:C.blueL  },
  AMBASSADEUR_PAYS:     { label:"Ambassadeur Pays",     icon:"🗺️", color:C.green, bg:C.greenL },
  RECRUTEUR:            { label:"Recruteur",            icon:"🤝", color:C.gold,  bg:C.goldL  },
};

const PLAN_CONFIG = {
  ESSENTIELLE: { label:"🌿 Essentielle", color:C.teal,   bg:C.tealL   },
  IVOIRIENNE:  { label:"🌍 Ivoirienne",  color:C.blue,   bg:C.blueL   },
  TURQUOISE:   { label:"💎 Turquoise",   color:C.purple, bg:C.purpleL },
};

const STATUS_CONFIG = {
  ACTIVE:    { label:"Actif",       color:C.green, bg:C.greenL },
  SUSPENDED: { label:"Suspendu",    color:C.red,   bg:C.redL   },
  PENDING:   { label:"En attente",  color:C.gold,  bg:C.goldL  },
};

const VALIDATION_CONFIG = {
  pending:  { label:"⏳ À valider", color:C.gold,  bg:C.goldL  },
  approved: { label:"✅ Validé",    color:C.green, bg:C.greenL },
  rejected: { label:"❌ Rejeté",    color:C.red,   bg:C.redL   },
};

function RoleBadge({ role }) {
  const r = ROLE_CONFIG[role];
  if (!r) return null;
  return (
    <span style={{ background:r.bg, color:r.color, padding:"2px 10px", borderRadius:999, fontSize:11, fontWeight:700, display:"inline-flex", alignItems:"center", gap:4 }}>
      {r.icon} {r.label}
    </span>
  );
}

function PlanBadge({ plan }) {
  if (!plan) return <span style={{ color:C.slate, fontSize:11 }}>—</span>;
  const p = PLAN_CONFIG[plan] || { label:plan, color:C.slate, bg:C.bg };
  return (
    <span style={{ background:p.bg, color:p.color, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700 }}>
      {p.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span style={{ background:s.bg, color:s.color, padding:"2px 10px", borderRadius:999, fontSize:11, fontWeight:700 }}>
      {s.label}
    </span>
  );
}

function ValidationBadge({ v }) {
  const s = VALIDATION_CONFIG[v] || VALIDATION_CONFIG.pending;
  return (
    <span style={{ background:s.bg, color:s.color, padding:"2px 10px", borderRadius:999, fontSize:11, fontWeight:700 }}>
      {s.label}
    </span>
  );
}

// ── Section comptes en attente de validation ──────────────────
function PendingValidationSection({ ambassadors, onValidate }) {
  const [cashModes, setCashModes] = useState({}); // { [ambId]: bool }
  const pending = ambassadors.filter(a => a.status_validation === "pending" || !a.status_validation);
  if (pending.length === 0) return null;

  const toggleCash = (id) => setCashModes(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ background:"#fff", borderRadius:14, border:`2px solid ${C.gold}`, padding:"18px 20px", marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <span style={{ fontSize:22 }}>⏳</span>
        <div>
          <p style={{ margin:0, fontWeight:900, fontSize:15, color:C.dark }}>
            Comptes en attente de validation
          </p>
          <p style={{ margin:"2px 0 0", fontSize:12, color:C.slate }}>
            {pending.length} compte(s) à traiter — le paiement est bloqué jusqu'à validation
          </p>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {pending.map(amb => {
          const isCash = !!cashModes[amb.id];
          return (
            <div key={amb.id} style={{
              background: isCash ? "#F0FDF4" : C.goldL,
              borderRadius:10, padding:"12px 16px",
              border:`1px solid ${isCash ? C.green : C.gold}44`,
              display:"flex", alignItems:"center", justifyContent:"space-between",
              flexWrap:"wrap", gap:12,
              transition:"background 0.2s",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:ROLE_CONFIG[amb.role]?.bg || C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
                  {ROLE_CONFIG[amb.role]?.icon || "👤"}
                </div>
                <div>
                  <p style={{ margin:0, fontWeight:800, color:C.dark, fontSize:13 }}>{amb.name}</p>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:C.slate }}>
                    {amb.email} · {amb.country} · {fmtDate(amb.created_at)}
                  </p>
                  <div style={{ display:"flex", gap:6, marginTop:4 }}>
                    <RoleBadge role={amb.role} />
                    <PlanBadge plan={amb.plan} />
                  </div>
                </div>
              </div>

              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
                {/* Toggle Cash */}
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, color: isCash ? C.green : C.slate }}>
                    💵 Paiement Cash
                  </span>
                  <button
                    onClick={() => toggleCash(amb.id)}
                    style={{
                      width:44, height:24, borderRadius:12, border:"none", cursor:"pointer",
                      background: isCash ? C.green : C.border,
                      position:"relative", transition:"background 0.2s", padding:0,
                    }}
                  >
                    <span style={{
                      position:"absolute", top:3, left: isCash ? 22 : 2,
                      width:18, height:18, borderRadius:"50%", background:"#fff",
                      transition:"left 0.2s", display:"block",
                      boxShadow:"0 1px 3px rgba(0,0,0,.2)",
                    }} />
                  </button>
                </div>

                {isCash && (
                  <p style={{ margin:0, fontSize:10, color:C.green, fontWeight:600, textAlign:"right" }}>
                    ✓ Paiement physique confirmé — accès immédiat
                  </p>
                )}

                <div style={{ display:"flex", gap:8 }}>
                  <button
                    onClick={() => onValidate(amb.id, "approve", isCash ? "cash" : null)}
                    style={{
                      padding:"7px 16px", borderRadius:8, border:"none",
                      background: isCash ? C.green : C.green,
                      color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer",
                      opacity: 1,
                    }}
                  >
                    ✅ {isCash ? "Valider (Cash)" : "Valider"}
                  </button>
                  <button
                    onClick={() => onValidate(amb.id, "reject", null)}
                    style={{ padding:"7px 16px", borderRadius:8, border:`1.5px solid ${C.red}`, background:"#fff", color:C.red, fontWeight:700, fontSize:12, cursor:"pointer" }}
                  >
                    ❌ Rejeter
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminDiaspora() {
  const [ambassadors, setAmbassadors]       = useState([]);
  const [filtered, setFiltered]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");
  const [search, setSearch]                 = useState("");
  const [roleFilter, setRoleFilter]         = useState("ALL");
  const [statusFilter, setStatusFilter]     = useState("ALL");
  const [validFilter, setValidFilter]       = useState("ALL");
  const [selected, setSelected]             = useState(null);
  const [validating, setValidating]         = useState(null);
  const [recalcLoading, setRecalcLoading]   = useState(null);   // id en cours
  const [recalcMsgs, setRecalcMsgs]         = useState({});     // { [id]: msg }
  const [cashModes, setCashModes]             = useState({});

  // ✅ FIX : états manquants pour la modal de suppression
  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError]       = useState("");
  const [deleting, setDeleting]             = useState(false);

  // 🔑 Réinitialisation MDP ambassadeur
  const [resetLoading, setResetLoading]     = useState(null);   // id en cours
  const [resetResult, setResetResult]       = useState(null);   // { name, username, temp_password }

  // 💸 Demandes de paiement de commissions
  const [activeTab, setActiveTab]               = useState("membres");  // "membres" | "demandes" | "clients"
  const [demandesComm, setDemandesComm]         = useState([]);
  const [demandesStats, setDemandesStats]       = useState({});
  const [demandesFilter, setDemandesFilter]     = useState("");
  const [demandesLoading, setDemandesLoading]   = useState(false);
  const [actionLoading, setActionLoading]       = useState(null);
  const [rejectModal, setRejectModal]           = useState(null);
  const [rejectNote, setRejectNote]             = useState("");

  // 👥 Clients finaux diaspora
  const [clients, setClients]                   = useState([]);
  const [clientsLoading, setClientsLoading]     = useState(false);
  const [clientsSearch, setClientsSearch]       = useState("");
  const [clientsStatus, setClientsStatus]       = useState("");
  const [clientsPage, setClientsPage]           = useState(1);
  const [clientsPagination, setClientsPagination] = useState(null);

  const stats = {
    total:          ambassadors.length,
    actifs:         ambassadors.filter(a => a.status === "ACTIVE").length,
    pending:        ambassadors.filter(a => a.status_validation === "pending" || !a.status_validation).length,
    cartes:         ambassadors.reduce((s, a) => s + Number(a.beneficiary_count || 0), 0),
    adhesions:      ambassadors.reduce((s, a) => s + Number(a.membership_fee || 0), 0),
    diaspora:       ambassadors.filter(a => a.role === "AMBASSADEUR_DIASPORA").length,
    pays:           ambassadors.filter(a => a.role === "AMBASSADEUR_PAYS").length,
    recruteurs:     ambassadors.filter(a => a.role === "RECRUTEUR").length,
    clients_finaux: clientsPagination?.total ?? clients.length,
  };

  useEffect(() => { fetchAmbassadors(); }, []);

  useEffect(() => {
    let list = ambassadors;
    if (roleFilter !== "ALL")  list = list.filter(a => a.role === roleFilter);
    if (statusFilter !== "ALL") list = list.filter(a => a.status === statusFilter);
    if (validFilter !== "ALL") {
      if (validFilter === "pending")  list = list.filter(a => a.status_validation === "pending" || !a.status_validation);
      if (validFilter === "approved") list = list.filter(a => a.status_validation === "approved");
      if (validFilter === "rejected") list = list.filter(a => a.status_validation === "rejected");
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.country?.toLowerCase().includes(q) ||
        a.referral_code?.toLowerCase().includes(q) ||
        a.username?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [ambassadors, search, roleFilter, statusFilter, validFilter]);

  async function fetchAmbassadors() {
    setLoading(true); setError("");
    try {
      const { data } = await axios.get(`${API}/api/diaspora/admin/ambassadors`, {
        headers: { Authorization: `Bearer ${agentToken()}` },
      });
      setAmbassadors(data.ambassadors || []);
    } catch (e) {
      setError(e.response?.data?.error || "Erreur lors du chargement");
    } finally { setLoading(false); }
  }

  async function handleValidate(id, action, paymentMethod = null) {
    if (validating) return;
    setValidating(id);
    try {
      const body = { action };
      if (paymentMethod) body.paymentMethod = paymentMethod;
      await axios.patch(
        `${API}/api/diaspora/admin/ambassadors/${id}/validate`,
        body,
        { headers: { Authorization: `Bearer ${agentToken()}` } }
      );
      await fetchAmbassadors();
      setSelected(null);
    } catch (e) {
      alert(e.response?.data?.error || "Erreur lors de la validation");
    } finally { setValidating(null); }
  }

  async function handleRecalc(amb, e) {
    e.stopPropagation();
    if (!window.confirm(`Recalculer les commissions pour ${amb.name} ?\n\nOpération annulée automatiquement si des commissions existent déjà.`)) return;
    setRecalcLoading(amb.id);
    setRecalcMsgs(prev => ({ ...prev, [amb.id]: "" }));
    try {
      const { data } = await axios.post(
        `${API}/api/diaspora/admin/ambassadors/${amb.id}/recalc-commissions`,
        {},
        { headers: { Authorization: `Bearer ${agentToken()}` } }
      );
      setRecalcMsgs(prev => ({ ...prev, [amb.id]: "✅ " + (data.message || "Commissions calculées") }));
      fetchAmbassadors();
    } catch (err) {
      setRecalcMsgs(prev => ({ ...prev, [amb.id]: "❌ " + (err.response?.data?.error || "Erreur serveur") }));
    } finally {
      setRecalcLoading(null);
    }
  }

  async function toggleStatus(amb, e) {
    e.stopPropagation();
    const newStatus = amb.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await axios.put(
        `${API}/api/diaspora/admin/ambassadors/${amb.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${agentToken()}` } }
      );
      fetchAmbassadors();
      setSelected(null);
    } catch (err) {
      alert(err.response?.data?.error || "Erreur mise à jour statut");
    }
  }

  async function handleDeleteAmbassador() {
    if (!deletePassword) { setDeleteError("Mot de passe requis"); return; }
    setDeleting(true); setDeleteError("");
    try {
      await axios.delete(
        `${API}/api/diaspora/admin/ambassadors/${deleteTarget.id}`,
        {
          headers: { Authorization: `Bearer ${agentToken()}` },
          data: { adminPassword: deletePassword },
        }
      );
      setDeleteTarget(null); setDeletePassword("");
      fetchAmbassadors();
    } catch (e) {
      setDeleteError(e.response?.data?.error || "Erreur suppression");
    } finally { setDeleting(false); }
  }

  async function handleResetPassword(amb, e) {
    e.stopPropagation();
    if (!window.confirm(`Réinitialiser le mot de passe de ${amb.name} ?\n\nUn mot de passe temporaire sera généré — communiquez-le à l'ambassadeur.`)) return;
    setResetLoading(amb.id);
    try {
      const { data } = await axios.get(`${API}/api/diaspora/admin/ambassadors/${amb.id}/reset-password`, {
        headers: { Authorization: `Bearer ${agentToken()}` },
      });
      setResetResult({
        name:          amb.name,
        username:      data.credentials?.username || amb.username,
        temp_password: data.credentials?.temp_password,
      });
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de la réinitialisation");
    } finally {
      setResetLoading(null);
    }
  }

  // ── Demandes de paiement ─────────────────────────────────
  async function fetchDemandes() {
    setDemandesLoading(true);
    try {
      const params = new URLSearchParams({ network: "DIASPORA", limit: 100 });
      if (demandesFilter) params.set("status", demandesFilter);
      const { data } = await axios.get(`${API}/api/commissions/requests?${params}`, {
        headers: { Authorization: `Bearer ${agentToken()}` },
      });
      setDemandesComm(data.requests || data.data?.requests || []);
      setDemandesStats(data.stats   || data.data?.stats   || {});
    } catch (e) {
      console.error("fetchDemandes", e.message);
    } finally { setDemandesLoading(false); }
  }

  async function handleDemandeAction(id, action, note = "") {
    setActionLoading(id + action);
    try {
      await axios.patch(`${API}/api/commissions/requests/${id}`, { action, admin_note: note }, {
        headers: { Authorization: `Bearer ${agentToken()}` },
      });
      setRejectModal(null); setRejectNote("");
      fetchDemandes();
    } catch (e) {
      alert(e.response?.data?.error || "Erreur action");
    } finally { setActionLoading(null); }
  }

  useEffect(() => { if (activeTab === "demandes") fetchDemandes(); }, [activeTab, demandesFilter]);
  useEffect(() => { if (activeTab === "clients")  fetchClients();  }, [activeTab, clientsPage, clientsSearch, clientsStatus]);

  async function fetchClients() {
    setClientsLoading(true);
    try {
      const params = new URLSearchParams({ page: clientsPage, limit: 30 });
      if (clientsSearch) params.set("search", clientsSearch);
      if (clientsStatus) params.set("status", clientsStatus);
      // Route admin : liste tous les clients diaspora, pas seulement ceux d'un ambassadeur
      const { data } = await axios.get(
        `${API}/api/diaspora/admin/clients?${params}`,
        { headers: { Authorization: `Bearer ${agentToken()}` } }
      );
      setClients(data.clients || []);
      setClientsPagination(data.pagination || null);
    } catch (e) {
      console.error("fetchClients diaspora", e.message);
    } finally { setClientsLoading(false); }
  }

  return (
    <div style={{ padding:"24px 20px", maxWidth:1100, margin:"0 auto" }}>

      {/* En-tête */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ margin:0, fontSize:24, fontWeight:900, color:C.dark }}>🌍 Réseau Diaspora</h1>
        <p style={{ margin:"4px 0 0", color:C.slate, fontSize:14 }}>
          Ambassadeur Diaspora → Ambassadeur Pays → Recruteur → Client
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px,1fr))", gap:12, marginBottom:24 }}>
        {[
          { icon:"👥", label:"Total",           value:stats.total,      color:C.blue,   bg:C.blueL   },
          { icon:"✅", label:"Actifs",          value:stats.actifs,     color:C.green,  bg:C.greenL  },
          { icon:"⏳", label:"À valider",       value:stats.pending,    color:C.gold,   bg:C.goldL   },
          { icon:"🌍", label:"Diaspora",        value:stats.diaspora,   color:C.blue,   bg:C.blueL   },
          { icon:"🗺️", label:"Pays",            value:stats.pays,       color:C.green,  bg:C.greenL  },
          { icon:"🤝", label:"Recruteurs",      value:stats.recruteurs, color:C.gold,   bg:C.goldL   },
          { icon:"🎴", label:"Cartes",          value:stats.cartes,          color:C.teal,   bg:C.tealL   },
          { icon:"👥", label:"Clients finaux",   value:stats.clients_finaux,  color:C.purple, bg:C.purpleL },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:"14px 16px", border:`1px solid ${s.color}22` }}>
            <span style={{ fontSize:20 }}>{s.icon}</span>
            <p style={{ margin:"8px 0 2px", fontSize:22, fontWeight:900, color:s.color }}>{fmt(s.value)}</p>
            <p style={{ margin:0, fontSize:11, color:C.slate, fontWeight:600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Onglets principaux ── */}
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {[
          { id:"membres",  label:"👥 Ambassadeurs" },
          { id:"clients",  label:"👤 Clients finaux", badge: stats.clients_finaux || null },
          { id:"demandes", label:"💸 Demandes Commission", badge: demandesStats["PENDING"] || null },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding:"9px 18px", borderRadius:10, border:`1.5px solid ${activeTab === t.id ? C.blue : C.border}`,
              background: activeTab === t.id ? C.blueL : "#fff",
              color: activeTab === t.id ? C.blue : C.slate,
              fontWeight: activeTab === t.id ? 800 : 600,
              fontSize:13, cursor:"pointer", fontFamily:"inherit",
              display:"flex", alignItems:"center", gap:8,
            }}>
            {t.label}
            {t.badge > 0 && (
              <span style={{ background:C.gold, color:"#fff", borderRadius:999, padding:"1px 8px", fontSize:10, fontWeight:800 }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Onglet Clients finaux ── */}
      {activeTab === "clients" && (
        <div>
          {/* Filtres */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
            <input
              placeholder="Rechercher nom, téléphone, numéro…"
              value={clientsSearch}
              onChange={e => { setClientsSearch(e.target.value); setClientsPage(1); }}
              style={{ flex:1, minWidth:200, padding:"9px 14px", borderRadius:8, fontSize:13, border:`1.5px solid ${C.border}`, outline:"none" }}
            />
            <select value={clientsStatus} onChange={e => { setClientsStatus(e.target.value); setClientsPage(1); }}
              style={{ padding:"9px 12px", borderRadius:8, fontSize:13, border:`1.5px solid ${C.border}`, background:"#fff", fontFamily:"inherit" }}>
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="attente">En attente</option>
              <option value="suspendu">Suspendu</option>
            </select>
            <button onClick={() => fetchClients()}
              style={{ padding:"9px 14px", borderRadius:8, border:`1.5px solid ${C.border}`, background:"#fff", color:C.slate, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
              ↻ Rafraîchir
            </button>
          </div>

          {clientsLoading ? (
            <div style={{ textAlign:"center", padding:48, color:C.slate }}>
              <div style={{ fontSize:32, animation:"spin 1s linear infinite" }}>⏳</div>
            </div>
          ) : clients.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 20px", color:C.slate, background:"#fff", borderRadius:14, border:`1px solid ${C.border}` }}>
              <p style={{ fontSize:40, margin:"0 0 10px" }}>👥</p>
              <p style={{ fontWeight:800, fontSize:15, margin:"0 0 6px", color:C.dark }}>Aucun client final</p>
              <p style={{ fontSize:12, margin:0 }}>Les clients créés par les ambassadeurs diaspora apparaîtront ici</p>
            </div>
          ) : (
            <>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {clients.map(c => {
                  const statusCfg = {
                    actif:    { label:"✅ Actif",       color:C.green,  bg:C.greenL },
                    attente:  { label:"⏳ En attente",  color:C.gold,   bg:C.goldL  },
                    suspendu: { label:"🚫 Suspendu",    color:C.red,    bg:C.redL   },
                  }[c.status] || { label:c.status, color:C.slate, bg:C.bg };

                  const paymentCfg = c.status_payment === "paid"
                    ? { label:"💳 Payé",     color:C.green, bg:C.greenL }
                    : { label:"⏳ Non payé", color:C.gold,  bg:C.goldL  };

                  return (
                    <div key={c.id} style={{ background:"#fff", borderRadius:12, border:`1px solid ${C.border}`, padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <div style={{ width:40, height:40, borderRadius:10, background:C.purpleL, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>👤</div>
                        <div>
                          <p style={{ margin:0, fontWeight:800, color:C.dark, fontSize:13 }}>{c.name}</p>
                          <p style={{ margin:"2px 0 0", fontSize:11, color:C.slate }}>{c.phone}{c.city ? ` · ${c.city}` : ""}</p>
                          <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" }}>
                            <span style={{ fontSize:10, fontWeight:700, color:C.blue, background:C.blueL, padding:"1px 8px", borderRadius:999 }}>{c.plan}</span>
                            <span style={{ fontSize:10, fontWeight:700, color:C.slate, fontFamily:"monospace" }}>{c.mutual_number}</span>
                            {c.ambassador_name && (
                              <span style={{ fontSize:10, color:C.slate }}>via {c.ambassador_name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
                        <span style={{ background:statusCfg.bg, color:statusCfg.color, padding:"2px 10px", borderRadius:999, fontSize:11, fontWeight:700 }}>
                          {statusCfg.label}
                        </span>
                        <span style={{ background:paymentCfg.bg, color:paymentCfg.color, padding:"2px 10px", borderRadius:999, fontSize:11, fontWeight:700 }}>
                          {paymentCfg.label}
                        </span>
                        {c.expiration_date && (
                          <span style={{ fontSize:10, color:C.slate }}>Exp. {fmtDate(c.expiration_date)}</span>
                        )}
                        <span style={{ fontSize:10, color:C.slate }}>{fmtDate(c.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {clientsPagination && clientsPagination.pages > 1 && (
                <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:16 }}>
                  <button disabled={clientsPage <= 1} onClick={() => setClientsPage(p => p - 1)}
                    style={{ padding:"8px 16px", borderRadius:8, border:`1.5px solid ${C.border}`, background:"#fff", color:C.slate, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                    ← Précédent
                  </button>
                  <span style={{ padding:"8px 14px", fontSize:13, color:C.slate }}>
                    Page {clientsPage} / {clientsPagination.pages}
                  </span>
                  <button disabled={clientsPage >= clientsPagination.pages} onClick={() => setClientsPage(p => p + 1)}
                    style={{ padding:"8px 16px", borderRadius:8, border:`1.5px solid ${C.border}`, background:"#fff", color:C.slate, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                    Suivant →
                  </button>
                </div>
              )}

              {clientsPagination && (
                <p style={{ textAlign:"center", color:C.slate, fontSize:12, marginTop:12 }}>
                  {clientsPagination.total} client(s) au total
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Onglet Demandes Commission ── */}
      {activeTab === "demandes" && (
        <div>
          {/* Stats filtres */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
            {[
              { label:"En attente", key:"PENDING",   color:C.gold,   bg:C.goldL   },
              { label:"Validées",   key:"VALIDATED", color:C.blue,   bg:C.blueL   },
              { label:"Payées",     key:"PAID",       color:C.green,  bg:C.greenL  },
              { label:"Rejetées",   key:"REJECTED",  color:C.red,    bg:C.redL    },
            ].map(({ label, key, color, bg }) => (
              <div key={key}
                onClick={() => setDemandesFilter(demandesFilter === key ? "" : key)}
                style={{ background:bg, border:`1.5px solid ${color}44`, borderRadius:10, padding:"10px 16px",
                  cursor:"pointer", opacity: demandesFilter && demandesFilter !== key ? 0.5 : 1, transition:"opacity .15s" }}>
                <div style={{ fontSize:18, fontWeight:900, color }}>{demandesStats[key] || 0}</div>
                <div style={{ fontSize:11, color, fontWeight:700 }}>{label}</div>
              </div>
            ))}
            <button onClick={fetchDemandes}
              style={{ padding:"9px 14px", borderRadius:8, border:`1.5px solid ${C.border}`, background:"#fff", color:C.slate, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
              ↻ Rafraîchir
            </button>
          </div>

          {demandesLoading ? (
            <div style={{ textAlign:"center", padding:48, color:C.slate }}>
              <div style={{ fontSize:32, animation:"spin 1s linear infinite" }}>⏳</div>
              <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
            </div>
          ) : demandesComm.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 20px", color:C.slate, background:"#fff", borderRadius:14, border:`1px solid ${C.border}` }}>
              <p style={{ fontSize:40, margin:"0 0 10px" }}>💤</p>
              <p style={{ fontWeight:800, fontSize:15, margin:"0 0 6px", color:C.dark }}>Aucune demande</p>
              <p style={{ fontSize:12, margin:0 }}>Les demandes de retrait Diaspora apparaîtront ici</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {demandesComm.map(r => {
                const details = typeof r.payment_details === "string" ? JSON.parse(r.payment_details || "{}") : (r.payment_details || {});
                const ST = {
                  PENDING:   { label:"⏳ En attente", color:C.gold,  bg:C.goldL  },
                  VALIDATED: { label:"✅ Validée",    color:C.blue,  bg:C.blueL  },
                  PAID:      { label:"💸 Payée",      color:C.green, bg:C.greenL },
                  REJECTED:  { label:"❌ Rejetée",    color:C.red,   bg:C.redL   },
                };
                const st = ST[r.status] || ST.PENDING;
                return (
                  <div key={r.id} style={{ background:"#fff", borderRadius:12, border:`1px solid ${r.status === "PENDING" ? C.gold + "44" : C.border}`, padding:"16px 20px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                          <span style={{ fontSize:19, fontWeight:900, color:C.green }}>
                            {Number(r.amount_requested || 0).toLocaleString("fr-FR")} FCFA
                          </span>
                          <span style={{ background:st.bg, color:st.color, padding:"3px 10px", borderRadius:999, fontSize:11, fontWeight:700 }}>
                            {st.label}
                          </span>
                        </div>
                        <div style={{ fontSize:12, color:C.slate, marginBottom:4 }}>
                          Demande <strong>#{r.id}</strong> · {r.member_name || "—"} ({r.member_role || "Ambassadeur"}) · {r.adhesions_since_last} adhésions
                        </div>
                        <div style={{ fontSize:12, color:C.slate }}>
                          {r.payment_method === "mobile_money" && `📱 ${details.operator || ""} ${details.phone || ""}`}
                          {r.payment_method === "virement"     && `🏦 ${details.name || ""} — ${details.iban || details.bank || ""}`}
                          {r.payment_method === "cash"         && "💵 Espèces en agence"}
                          {" · "}{new Date(r.created_at).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" })}
                        </div>
                        {r.status === "REJECTED" && r.admin_note && (
                          <div style={{ marginTop:8, background:C.redL, borderRadius:8, padding:"6px 12px", fontSize:12, color:C.red, fontWeight:600 }}>
                            ❌ Motif : {r.admin_note}
                          </div>
                        )}
                        {r.validated_at && <div style={{ fontSize:11, color:C.blue, fontWeight:700, marginTop:6 }}>✅ Validée le {new Date(r.validated_at).toLocaleDateString("fr-FR")}</div>}
                        {r.paid_at      && <div style={{ fontSize:11, color:C.green, fontWeight:700, marginTop:4 }}>💸 Payée le {new Date(r.paid_at).toLocaleDateString("fr-FR")}</div>}
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        {r.status === "PENDING" && (
                          <>
                            <button onClick={() => handleDemandeAction(r.id, "validate")} disabled={!!actionLoading}
                              style={{ padding:"7px 14px", borderRadius:8, border:"none", background:C.blue, color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                              {actionLoading === r.id + "validate" ? "…" : "✅ Valider"}
                            </button>
                            <button onClick={() => { setRejectModal({ id:r.id, name:r.member_name || `#${r.id}` }); setRejectNote(""); }}
                              style={{ padding:"7px 14px", borderRadius:8, border:`1.5px solid ${C.red}`, background:C.redL, color:C.red, fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                              ❌ Rejeter
                            </button>
                          </>
                        )}
                        {r.status === "VALIDATED" && (
                          <button onClick={() => handleDemandeAction(r.id, "pay")} disabled={!!actionLoading}
                            style={{ padding:"7px 14px", borderRadius:8, border:"none", background:C.green, color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
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
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
              <div style={{ background:"#fff", borderRadius:16, padding:"28px 24px", maxWidth:420, width:"100%" }}>
                <h3 style={{ margin:"0 0 10px", fontSize:17, fontWeight:800, color:C.dark }}>❌ Rejeter la demande</h3>
                <p style={{ margin:"0 0 14px", fontSize:13, color:C.slate }}>Demande de <strong>{rejectModal.name}</strong> — motif (optionnel) :</p>
                <input placeholder="Motif du rejet…" value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                  style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${C.red}44`, fontSize:14, boxSizing:"border-box", outline:"none", marginBottom:16 }} />
                <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                  <button onClick={() => setRejectModal(null)}
                    style={{ padding:"9px 18px", borderRadius:8, border:`1.5px solid ${C.border}`, background:"#fff", color:C.slate, fontWeight:600, fontSize:13, cursor:"pointer" }}>
                    Annuler
                  </button>
                  <button onClick={() => handleDemandeAction(rejectModal.id, "reject", rejectNote)} disabled={!!actionLoading}
                    style={{ padding:"9px 18px", borderRadius:8, border:"none", background:C.red, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                    {actionLoading ? "…" : "Rejeter"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Onglet Ambassadeurs (contenu existant) ── */}
      {activeTab === "membres" && <>

      {/* ── Section validation en attente ─────────────────────────────── */}
      <PendingValidationSection
        ambassadors={ambassadors}
        onValidate={handleValidate}
      />

      {/* Organigramme */}
      <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, padding:"16px 20px", marginBottom:20 }}>
        <p style={{ margin:"0 0 12px", fontWeight:800, color:C.dark, fontSize:13 }}>🏛️ Organigramme Diaspora</p>
        <div style={{ display:"flex", alignItems:"center", gap:0, flexWrap:"wrap" }}>
          {Object.entries(ROLE_CONFIG).map(([key, cfg], i) => (
            <div key={key} style={{ display:"flex", alignItems:"center" }}>
              <div style={{ background:cfg.bg, border:`1.5px solid ${cfg.color}44`, borderRadius:10, padding:"10px 16px", textAlign:"center", minWidth:130 }}>
                <p style={{ margin:0, fontSize:18 }}>{cfg.icon}</p>
                <p style={{ margin:"4px 0 2px", fontWeight:800, fontSize:12, color:cfg.color }}>{cfg.label}</p>
                <p style={{ margin:0, fontSize:11, color:C.slate }}>{ambassadors.filter(a => a.role === key).length} membre(s)</p>
              </div>
              {i < Object.keys(ROLE_CONFIG).length - 1 && (
                <span style={{ fontSize:18, color:C.border, margin:"0 8px" }}>→</span>
              )}
            </div>
          ))}
          <span style={{ fontSize:18, color:C.border, margin:"0 8px" }}>→</span>
          <div style={{ background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:10, padding:"10px 16px", textAlign:"center", minWidth:100 }}>
            <p style={{ margin:0, fontSize:18 }}>👤</p>
            <p style={{ margin:"4px 0 2px", fontWeight:800, fontSize:12, color:C.slate }}>Client</p>
            <p style={{ margin:0, fontSize:11, color:C.slate }}>{fmt(stats.cartes)} carte(s)</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ background:"#fff", borderRadius:12, border:`1px solid ${C.border}`, padding:"14px 16px", marginBottom:16, display:"flex", gap:10, flexWrap:"wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Nom, email, pays, code, username…"
          style={{ flex:1, minWidth:200, padding:"8px 14px", borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:13, outline:"none" }}
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ padding:"8px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:13, outline:"none", background:"#fff", color:C.dark }}>
          <option value="ALL">Tous les rôles</option>
          {Object.entries(ROLE_CONFIG).map(([k,v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding:"8px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:13, outline:"none", background:"#fff", color:C.dark }}>
          <option value="ALL">Tous les statuts</option>
          <option value="ACTIVE">✅ Actifs</option>
          <option value="PENDING">⏳ En attente</option>
          <option value="SUSPENDED">🚫 Suspendus</option>
        </select>
        <select value={validFilter} onChange={e => setValidFilter(e.target.value)}
          style={{ padding:"8px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:13, outline:"none", background:"#fff", color:C.dark }}>
          <option value="ALL">Toutes validations</option>
          <option value="pending">⏳ À valider</option>
          <option value="approved">✅ Validés</option>
          <option value="rejected">❌ Rejetés</option>
        </select>
        <button onClick={fetchAmbassadors}
          style={{ padding:"8px 16px", borderRadius:8, border:`1.5px solid ${C.border}`, background:"#fff", color:C.slate, fontWeight:700, fontSize:12, cursor:"pointer" }}>
          🔄 Actualiser
        </button>
      </div>

      {error && (
        <div style={{ background:C.redL, color:C.red, padding:"12px 16px", borderRadius:10, marginBottom:16 }}>⚠️ {error}</div>
      )}

      {/* Liste */}
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:60 }}>
          <div style={{ width:40, height:40, border:`3px solid ${C.blueL}`, borderTop:`3px solid ${C.blue}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 20px", color:C.slate }}>
          <p style={{ fontSize:40 }}>🌍</p>
          <p style={{ fontWeight:700, color:C.dark }}>Aucun ambassadeur trouvé</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {filtered.map(amb => {
            const isOpen = selected?.id === amb.id;
            const validCfg = VALIDATION_CONFIG[amb.status_validation] || VALIDATION_CONFIG.pending;
            return (
              <div key={amb.id}
                onClick={() => setSelected(isOpen ? null : amb)}
                style={{ background:"#fff", borderRadius:12, border:`1px solid ${isOpen?C.blue:C.border}`, padding:"14px 16px", cursor:"pointer", transition:"all 0.15s" }}>

                <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                  <div style={{
                    width:40, height:40, borderRadius:"50%", flexShrink:0,
                    background:ROLE_CONFIG[amb.role]?.bg || C.bg,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
                  }}>
                    {ROLE_CONFIG[amb.role]?.icon || "👤"}
                  </div>

                  <div style={{ flex:1, minWidth:160 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <p style={{ margin:0, fontWeight:800, color:C.dark, fontSize:14 }}>{amb.name}</p>
                      <RoleBadge role={amb.role} />
                      <StatusBadge status={amb.status} />
                      <ValidationBadge v={amb.status_validation} />
                    </div>
                    <p style={{ margin:"2px 0 0", fontSize:12, color:C.slate }}>
                      {amb.email} • {amb.country}{amb.city ? ` • ${amb.city}` : ""}
                    </p>
                    <p style={{ margin:"2px 0 0", fontSize:11, color:C.slate }}>
                      @{amb.username || "—"} • {fmtDate(amb.created_at)}
                    </p>
                  </div>

                  <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>
                    <div style={{ textAlign:"center" }}>
                      <PlanBadge plan={amb.plan} />
                      <p style={{ margin:"2px 0 0", fontSize:10, color:C.slate }}>Plan</p>
                    </div>
                    <div style={{ textAlign:"center" }}>
                      <p style={{ margin:0, fontWeight:800, color:C.teal, fontSize:16 }}>{amb.beneficiary_count || 0}</p>
                      <p style={{ margin:0, fontSize:10, color:C.slate }}>Cartes</p>
                    </div>
                    <div style={{ textAlign:"center" }}>
                      <p style={{ margin:0, fontWeight:800, color:C.green, fontSize:16 }}>{amb.recruit_count || 0}</p>
                      <p style={{ margin:0, fontSize:10, color:C.slate }}>Recrutés</p>
                    </div>
                  </div>

                  <span style={{ fontSize:14, color:C.slate }}>{isOpen ? "▲" : "▼"}</span>
                </div>

                {/* Détail */}
                {isOpen && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px,1fr))", gap:10, marginBottom:14 }}>
                      {[
                        { label:"Code ambassadeur",     value: amb.referral_code || "—"                },
                        { label:"Username",             value: amb.username || "—"                     },
                        { label:"Plan mensuel",         value: amb.plan || "—"                         },
                        { label:"Adhésion payée",       value: amb.membership_fee ? `${fmt(amb.membership_fee)} FCFA` : "—" },
                        { label:"Mode paiement",        value: amb.membership_payment_method || "—"    },
                        { label:"Validation",           value: VALIDATION_CONFIG[amb.status_validation]?.label || "⏳ À valider" },
                        { label:"Téléphone",            value: amb.phone || "—"                        },
                        { label:"Dernière connexion",   value: fmtDate(amb.last_login)                 },
                      ].map(item => (
                        <div key={item.label} style={{ background:C.bg, borderRadius:8, padding:"10px 12px" }}>
                          <p style={{ margin:0, fontSize:10, color:C.slate, fontWeight:600 }}>{item.label}</p>
                          <p style={{ margin:"3px 0 0", fontSize:12, fontWeight:700, color:C.dark, wordBreak:"break-all" }}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                      {/* Validation */}
                      {(amb.status_validation === "pending" || !amb.status_validation) && (
                        <>
                          {/* Cash toggle */}
                          <div style={{
                            display:"flex", alignItems:"center", gap:8,
                            background: cashModes[amb.id] ? "#F0FDF4" : C.goldL,
                            border: `1.5px solid ${cashModes[amb.id] ? C.green : C.gold}`,
                            borderRadius:8, padding:"6px 12px",
                          }}>
                            <span style={{ fontSize:13 }}>💵</span>
                            <span style={{ fontSize:12, fontWeight:700, color: cashModes[amb.id] ? C.green : C.gold }}>
                              Cash
                            </span>
                            <button
                              onClick={e => { e.stopPropagation(); setCashModes(prev => ({ ...prev, [amb.id]: !prev[amb.id] })); }}
                              style={{
                                width:40, height:22, borderRadius:11, border:"none", cursor:"pointer",
                                background: cashModes[amb.id] ? C.green : C.border,
                                position:"relative", transition:"background 0.2s", padding:0, flexShrink:0,
                              }}
                            >
                              <span style={{
                                position:"absolute", top:2, left: cashModes[amb.id] ? 20 : 2,
                                width:18, height:18, borderRadius:"50%", background:"#fff",
                                transition:"left 0.2s", display:"block",
                                boxShadow:"0 1px 3px rgba(0,0,0,.2)",
                              }} />
                            </button>
                          </div>

                          <button
                            onClick={e => { e.stopPropagation(); handleValidate(amb.id, "approve", cashModes[amb.id] ? "cash" : null); }}
                            disabled={validating === amb.id}
                            style={{ padding:"8px 16px", borderRadius:8, border:"none", background:C.green, color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", opacity: validating === amb.id ? 0.6 : 1 }}>
                            ✅ {cashModes[amb.id] ? "Valider (Cash)" : "Valider le compte"}
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleValidate(amb.id, "reject", null); }}
                            disabled={validating === amb.id}
                            style={{ padding:"8px 16px", borderRadius:8, border:`1.5px solid ${C.red}`, background:"#fff", color:C.red, fontWeight:700, fontSize:12, cursor:"pointer", opacity: validating === amb.id ? 0.6 : 1 }}>
                            ❌ Rejeter
                          </button>
                        </>
                      )}

                      {/* Activer / Suspendre */}
                      <button onClick={e => toggleStatus(amb, e)}
                        style={{ padding:"8px 16px", borderRadius:8, border:`1.5px solid ${amb.status==="ACTIVE"?C.red:C.green}`, background:"#fff", color:amb.status==="ACTIVE"?C.red:C.green, fontWeight:700, fontSize:12, cursor:"pointer" }}>
                        {amb.status === "ACTIVE" ? "🚫 Suspendre" : "✅ Réactiver"}
                      </button>

                      {/* Réinitialiser MDP */}
                      <button
                        onClick={e => handleResetPassword(amb, e)}
                        disabled={resetLoading === amb.id}
                        style={{ padding:"8px 16px", borderRadius:8, border:`1.5px solid ${C.gold}`, background:C.goldL, color:C.gold, fontWeight:700, fontSize:12, cursor: resetLoading === amb.id ? "not-allowed" : "pointer", opacity: resetLoading === amb.id ? 0.6 : 1 }}>
                        {resetLoading === amb.id ? "⏳ Réinit…" : "🔑 Réinit. MDP"}
                      </button>

                      {/* Recalculer commissions — visible uniquement si validé */}
                      {amb.status_validation === "approved" && (
                        <button onClick={e => handleRecalc(amb, e)}
                          disabled={recalcLoading === amb.id}
                          style={{ padding:"8px 16px", borderRadius:8, border:"1.5px solid #7C3AED44", background:"#F5F3FF", color:"#7C3AED", fontWeight:700, fontSize:12, cursor: recalcLoading === amb.id ? "not-allowed" : "pointer", opacity: recalcLoading === amb.id ? 0.6 : 1 }}>
                          {recalcLoading === amb.id ? "⏳ Calcul…" : "🔁 Recalc. commissions"}
                        </button>
                      )}

                      {/* Message retour recalcul */}
                      {recalcMsgs[amb.id] && (
                        <p style={{ margin:0, fontSize:11, fontWeight:700,
                          color: recalcMsgs[amb.id].startsWith("✅") ? "#059669" : "#DC2626",
                          background: recalcMsgs[amb.id].startsWith("✅") ? "#ECFDF5" : "#FEF2F2",
                          padding:"5px 10px", borderRadius:6, width:"100%" }}>
                          {recalcMsgs[amb.id]}
                        </p>
                      )}

                      {/* Supprimer définitivement */}
                      <button onClick={e => { e.stopPropagation(); setDeleteTarget(amb); setDeletePassword(""); setDeleteError(""); }}
                        style={{ padding:"8px 16px", borderRadius:8, border:`1.5px solid #DC2626`, background:"#FEF2F2", color:"#DC2626", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && (
        <p style={{ marginTop:16, textAlign:"center", color:C.slate, fontSize:12 }}>
          {filtered.length} ambassadeur(s) sur {ambassadors.length} au total
        </p>
      )}

      {/* ── Modal résultat réinitialisation MDP ── */}
      {resetResult && (
        <div
          style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.6)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:500, padding:20 }}
          onClick={() => setResetResult(null)}
        >
          <div style={{ background:"#fff", borderRadius:20, padding:"28px 24px", width:"100%", maxWidth:420 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
              <span style={{ fontSize:28 }}>🔑</span>
              <div>
                <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:C.dark }}>Mot de passe réinitialisé</h3>
                <p style={{ margin:"2px 0 0", fontSize:12, color:C.slate }}>{resetResult.name}</p>
              </div>
            </div>

            <div style={{ background:C.goldL, border:`1.5px solid ${C.gold}44`, borderRadius:12, padding:"16px 18px", marginBottom:18, display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <p style={{ margin:"0 0 4px", fontSize:11, fontWeight:700, color:C.slate, textTransform:"uppercase", letterSpacing:.5 }}>Identifiant</p>
                <p style={{ margin:0, fontSize:15, fontWeight:800, color:C.dark, fontFamily:"monospace", background:"#fff", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, userSelect:"all" }}>
                  {resetResult.username}
                </p>
              </div>
              <div>
                <p style={{ margin:"0 0 4px", fontSize:11, fontWeight:700, color:C.slate, textTransform:"uppercase", letterSpacing:.5 }}>Mot de passe temporaire</p>
                <p style={{ margin:0, fontSize:17, fontWeight:900, color:C.gold, fontFamily:"monospace", background:"#fff", padding:"8px 12px", borderRadius:8, border:`1.5px solid ${C.gold}`, userSelect:"all", letterSpacing:1 }}>
                  {resetResult.temp_password}
                </p>
              </div>
            </div>

            <div style={{ background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:8, padding:"10px 14px", marginBottom:18 }}>
              <p style={{ margin:0, fontSize:12, color:"#C2410C", fontWeight:600 }}>
                ⚠️ Communiquez ces informations directement à l'ambassadeur. Ce MDP ne sera plus affiché.
              </p>
            </div>

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button
                onClick={() => { navigator.clipboard?.writeText(`Login: ${resetResult.username}\nMDP: ${resetResult.temp_password}`); }}
                style={{ padding:"10px 18px", borderRadius:10, border:`1.5px solid ${C.gold}`, background:C.goldL, color:C.gold, fontWeight:700, fontSize:13, cursor:"pointer" }}>
                📋 Copier
              </button>
              <button
                onClick={() => setResetResult(null)}
                style={{ padding:"10px 18px", borderRadius:10, border:"none", background:C.dark, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal suppression ambassadeur ── */}
      {deleteTarget && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.6)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:500, padding:20 }}
          onClick={() => setDeleteTarget(null)}>
          <div style={{ background:"#fff", borderRadius:20, padding:"28px 24px", width:"100%", maxWidth:440 }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin:"0 0 16px", fontSize:18, fontWeight:800, color:"#0F172A" }}>⚠️ Suppression définitive</h3>

            <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:12, padding:"14px 16px", marginBottom:20 }}>
              <p style={{ margin:"0 0 4px", fontWeight:700, color:"#DC2626", fontSize:14 }}>
                Supprimer l'ambassadeur "{deleteTarget.name}" ?
              </p>
              <p style={{ margin:0, fontSize:12, color:"#EF4444" }}>
                Cela supprimera définitivement ses bénéficiaires, paiements, commissions et notifications.
              </p>
              <p style={{ margin:"8px 0 0", fontSize:12, fontWeight:700, color:"#DC2626" }}>
                ⚠️ Cette action est irréversible.
              </p>
            </div>

            <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#475569", marginBottom:6, textTransform:"uppercase", letterSpacing:.6 }}>
              Confirmez avec votre mot de passe admin
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              placeholder="Votre mot de passe"
              autoFocus
              style={{ width:"100%", border:"1.5px solid #E2E8F0", borderRadius:10, padding:"11px 14px", fontSize:14, boxSizing:"border-box", marginBottom:12, outline:"none" }}
            />

            {deleteError && (
              <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"10px 14px", color:"#DC2626", fontSize:13, marginBottom:12 }}>
                {deleteError}
              </div>
            )}

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                style={{ padding:"10px 18px", borderRadius:10, border:"1.5px solid #E2E8F0", background:"#fff", color:"#64748B", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                Annuler
              </button>
              <button onClick={handleDeleteAmbassador} disabled={deleting || !deletePassword}
                style={{ padding:"10px 18px", borderRadius:10, border:"none", background:"#DC2626", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", opacity: deleting || !deletePassword ? 0.6 : 1 }}>
                {deleting ? "Suppression…" : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
      </> /* fin activeTab === "membres" */}
    </div>
  );
}
