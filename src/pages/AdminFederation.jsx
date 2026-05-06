// src/pages/admin/AdminFederation.jsx
// ─────────────────────────────────────────────────────────────
//  Vue admin : réseau FÉDÉRATION (Parrainage)
//  Rôles réels : RUM → LEADER → PASTEUR → RESPONSABLE → CLIENT
//  API réelle (federationMemberAPI) — plus de données mock
//  Affiche : plan, membership_fee, membership_payment_method
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const agentToken = () => localStorage.getItem("token") || localStorage.getItem("agent_token");

// ── Palette ──────────────────────────────────────────────────
const C = {
  purple:  "#6D28D9", purpleL: "#F5F3FF", purpleM: "#DDD6FE",
  green:   "#059669", greenL:  "#ECFDF5",
  gold:    "#B45309", goldL:   "#FFFBEB",
  blue:    "#1D4ED8", blueL:   "#EFF6FF",
  teal:    "#0F766E", tealL:   "#F0FDFA",
  red:     "#DC2626", redL:    "#FEF2F2",
  slate:   "#64748B", slateL:  "#F1F5F9",
  dark:    "#0F172A", darkM:   "#1E293B",
  border:  "#E2E8F0", bg:      "#F8FAFC",
  navy:    "#1E1B4B",
};

const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" }) : "—";

const ROLE_CONFIG = {
  RUM:         { label:"RUM",         icon:"👑", color:C.purple, bg:"#EDE9FE" },
  LEADER:      { label:"Leader",      icon:"⭐", color:C.blue,   bg:"#DBEAFE" },
  PASTEUR:     { label:"Pasteur",     icon:"⛪", color:C.teal,   bg:"#CCFBF1" },
  RESPONSABLE: { label:"Responsable", icon:"🤝", color:C.gold,   bg:"#FEF3C7" },
};

const PLAN_CONFIG = {
  ESSENTIELLE: { label:"Essentielle", color:C.teal,   bg:C.tealL,   dot:"#0F766E" },
  IVOIRIENNE:  { label:"Ivoirienne",  color:C.blue,   bg:C.blueL,   dot:"#1D4ED8" },
  TURQUOISE:   { label:"Turquoise",   color:C.purple, bg:C.purpleL, dot:"#6D28D9" },
};

const STATUS_CONFIG = {
  ACTIVE:    { label:"Actif",      color:C.green, bg:"#D1FAE5" },
  SUSPENDED: { label:"Suspendu",   color:C.red,   bg:"#FEE2E2" },
  PENDING:   { label:"En attente", color:C.gold,  bg:"#FEF3C7" },
};

const VALIDATION_CONFIG = {
  pending:  { label:"À valider", color:C.gold,  bg:"#FEF3C7" },
  approved: { label:"Validé",    color:C.green, bg:"#D1FAE5" },
  rejected: { label:"Rejeté",    color:C.red,   bg:"#FEE2E2" },
};

const COMMISSION_RATES = [
  { type:"DIRECT",    label:"Enregistrement direct",   rate:10,  color:C.gold   },
  { type:"INDIRECT1", label:"Filleuls directs (niv. 1)", rate:2.5, color:C.green  },
  { type:"INDIRECT2", label:"Filleuls RUM (tous niv.)", rate:5,   color:C.purple },
];

// ── Styles globaux injectés une seule fois ────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
  @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
  .fed-row:hover { background: #F8FAFC !important; }
  .fed-tree-item:hover { background: rgba(109,40,217,0.06) !important; border-color: rgba(109,40,217,0.25) !important; }
  .fed-btn-ghost:hover { background: #F1F5F9 !important; }
  .fed-tab:hover { color: ${C.purple} !important; }
  .fed-card-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
  * { font-family: 'Outfit', sans-serif !important; }
`;

// ── Composants Badge ─────────────────────────────────────────
function RoleBadge({ role }) {
  const r = ROLE_CONFIG[role];
  if (!r) return null;
  return (
    <span style={{ background:r.bg, color:r.color, padding:"3px 10px", borderRadius:6, fontSize:11, fontWeight:700, display:"inline-flex", alignItems:"center", gap:4, letterSpacing:.2 }}>
      {r.icon} {r.label}
    </span>
  );
}

function PlanBadge({ plan }) {
  if (!plan) return <span style={{ color:C.slate, fontSize:11 }}>—</span>;
  const p = PLAN_CONFIG[plan] || { label:plan, color:C.slate, bg:C.bg, dot:C.slate };
  return (
    <span style={{ background:p.bg, color:p.color, padding:"3px 10px", borderRadius:6, fontSize:11, fontWeight:700, display:"inline-flex", alignItems:"center", gap:5 }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:p.dot||p.color, flexShrink:0 }} />
      {p.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span style={{ background:s.bg, color:s.color, padding:"3px 10px", borderRadius:6, fontSize:11, fontWeight:700 }}>
      {s.label}
    </span>
  );
}

function ValidationBadge({ v }) {
  const s = VALIDATION_CONFIG[v] || VALIDATION_CONFIG.pending;
  return (
    <span style={{ background:s.bg, color:s.color, padding:"3px 10px", borderRadius:6, fontSize:11, fontWeight:700 }}>
      {s.label}
    </span>
  );
}

// ── Spinner ──────────────────────────────────────────────────
function Spinner({ size=36 }) {
  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", padding:48 }}>
      <div style={{ width:size, height:size, border:`3px solid ${C.purpleL}`, borderTop:`3px solid ${C.purple}`, borderRadius:"50%", animation:"spin 0.75s linear infinite" }} />
    </div>
  );
}

// ── Section comptes en attente ────────────────────────────────
function PendingValidationSection({ members, onValidate }) {
  const [cashModes, setCashModes] = useState({});
  const pending = members.filter(m => m.status_validation === "pending" || !m.status_validation);
  if (pending.length === 0) return null;

  return (
    <div style={{ background:"#fff", borderRadius:16, border:`1.5px solid ${C.gold}`, padding:"20px 24px", marginBottom:20, boxShadow:`0 0 0 4px ${C.goldL}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:C.goldL, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>⏳</div>
        <div>
          <p style={{ margin:0, fontWeight:800, fontSize:14, color:C.dark }}>Comptes en attente de validation</p>
          <p style={{ margin:"2px 0 0", fontSize:12, color:C.slate }}>
            {pending.length} membre(s) à traiter — les commissions sont calculées à la validation
          </p>
        </div>
        <span style={{ marginLeft:"auto", background:C.goldL, color:C.gold, borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:800 }}>
          {pending.length}
        </span>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {pending.map(m => {
          const isCash = !!cashModes[m.id];
          const rc = ROLE_CONFIG[m.role] || { icon:"👤", color:C.slate, bg:C.bg };
          return (
            <div key={m.id} style={{
              background: isCash ? "#F0FDF4" : "#FFFBEB",
              borderRadius:12, padding:"14px 16px",
              border:`1px solid ${isCash ? C.green : C.gold}33`,
              display:"flex", alignItems:"center", justifyContent:"space-between",
              flexWrap:"wrap", gap:12, transition:"all 0.2s",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:rc.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
                  {rc.icon}
                </div>
                <div>
                  <p style={{ margin:0, fontWeight:800, color:C.dark, fontSize:13 }}>{m.name}</p>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:C.slate }}>{m.email} · {m.country} · {fmtDate(m.created_at)}</p>
                  <div style={{ display:"flex", gap:6, marginTop:5, flexWrap:"wrap" }}>
                    <RoleBadge role={m.role} />
                    <PlanBadge plan={m.plan} />
                    {m.membership_fee && (
                      <span style={{ fontSize:11, color:C.purple, fontWeight:700, background:C.purpleL, padding:"3px 8px", borderRadius:6 }}>
                        {fmt(m.membership_fee)} FCFA
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, color: isCash ? C.green : C.slate }}>💵 Paiement Cash</span>
                  <button onClick={() => setCashModes(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
                    style={{ width:44, height:24, borderRadius:12, border:"none", cursor:"pointer",
                      background: isCash ? C.green : C.border, position:"relative", transition:"background 0.2s", padding:0 }}>
                    <span style={{ position:"absolute", top:3, left: isCash ? 22 : 2,
                      width:18, height:18, borderRadius:"50%", background:"#fff",
                      transition:"left 0.2s", display:"block", boxShadow:"0 1px 3px rgba(0,0,0,.2)" }} />
                  </button>
                </div>
                {isCash && (
                  <p style={{ margin:0, fontSize:10, color:C.green, fontWeight:700 }}>✓ Commissions auto</p>
                )}
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => onValidate(m.id, "approve", isCash ? "cash" : null)}
                    style={{ padding:"7px 16px", borderRadius:8, border:"none",
                      background:C.green, color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", letterSpacing:.2 }}>
                    ✅ {isCash ? "Valider (Cash)" : "Valider"}
                  </button>
                  <button onClick={() => onValidate(m.id, "reject", null)}
                    style={{ padding:"7px 16px", borderRadius:8, border:`1.5px solid ${C.red}`,
                      background:"#fff", color:C.red, fontWeight:700, fontSize:12, cursor:"pointer" }}>
                    ✕ Rejeter
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

// ── Modal Détail ambassadeur ──────────────────────────────────
function DetailModal({ amb, onClose, onToggleStatus, onRefresh }) {
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [recalcMsg,     setRecalcMsg]     = useState("");

  async function handleRecalc() {
    if (!window.confirm(`Recalculer les commissions pour ${amb?.name} ?\n\nOpération annulée si des commissions existent déjà.`)) return;
    setRecalcLoading(true); setRecalcMsg("");
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("agent_token");
      const res = await fetch(
        `${API}/api/diaspora/admin/ambassadors/${amb.id}/recalc-commissions`,
        { method:"POST", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur serveur");
      setRecalcMsg("✅ " + data.message);
      onRefresh?.();
    } catch(e) {
      setRecalcMsg("❌ " + e.message);
    } finally { setRecalcLoading(false); }
  }

  if (!amb) return null;
  const rc = ROLE_CONFIG[amb.role] || { icon:"👤", color:C.slate, bg:C.bg };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.55)", zIndex:100,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(4px)" }}
      onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:24, padding:0, maxWidth:520, width:"100%",
        boxShadow:"0 32px 80px rgba(0,0,0,.18)", animation:"slideUp .25s ease", overflow:"hidden" }}
        onClick={e => e.stopPropagation()}>

        {/* Header modal */}
        <div style={{ background:`linear-gradient(135deg, ${rc.bg} 0%, #fff 100%)`, padding:"24px 28px 20px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:"#fff", color:rc.color,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0,
              boxShadow:`0 4px 12px ${rc.color}22` }}>
              {rc.icon}
            </div>
            <div style={{ flex:1 }}>
              <h3 style={{ margin:0, fontSize:18, fontWeight:800, color:C.dark }}>{amb.name}</h3>
              <p style={{ margin:"2px 0 0", fontSize:12, color:C.slate }}>{amb.email}</p>
            </div>
            <button onClick={onClose}
              style={{ width:32, height:32, border:`1.5px solid ${C.border}`, borderRadius:8,
                background:"#fff", fontSize:16, cursor:"pointer", color:C.slate,
                display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>✕</button>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:14 }}>
            <RoleBadge role={amb.role} />
            <StatusBadge status={amb.status} />
            <PlanBadge plan={amb.plan} />
            {amb.status_validation && <ValidationBadge v={amb.status_validation} />}
          </div>
        </div>

        <div style={{ padding:"20px 28px", maxHeight:"60vh", overflowY:"auto" }}>
          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
            {[
              { label:"Membres recrutés", value: fmt(amb.recruit_count || amb.members || 0), color:C.purple, icon:"👥" },
              { label:"Cartes vendues",   value: fmt(amb.beneficiary_count || 0),            color:C.teal,   icon:"🎴" },
              { label:"Adhésion payée",   value: amb.membership_fee ? `${fmt(amb.membership_fee)} FCFA` : "—", color:C.green, icon:"💳", isText:true },
              { label:"Statut",           value: amb.status === "ACTIVE" ? "✅ Actif" : "⏸ Inactif", color:amb.status==="ACTIVE"?C.green:C.slate, icon:"🔘", isText:true },
            ].map(item => (
              <div key={item.label} style={{ background:C.bg, borderRadius:12, padding:"14px 16px", border:`1px solid ${C.border}` }}>
                <p style={{ margin:"0 0 6px", fontSize:11, color:C.slate, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                  <span>{item.icon}</span> {item.label}
                </p>
                <p style={{ margin:0, fontSize:item.isText?13:22, fontWeight:800, color:item.color }}>
                  {item.isText ? item.value : fmt(item.value)}
                </p>
              </div>
            ))}
          </div>

          {/* Infos */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
            {[
              { label:"Code ambassadeur",   value: amb.referral_code || "—"             },
              { label:"Username",           value: amb.username || "—"                  },
              { label:"Mode paiement",      value: amb.membership_payment_method || "—" },
              { label:"Transaction ID",     value: amb.membership_transaction_id || "—" },
              { label:"Supérieur",          value: amb.parent_name || "— Direction"     },
              { label:"Inscrit le",         value: fmtDate(amb.created_at)              },
            ].map(item => (
              <div key={item.label} style={{ background:C.bg, borderRadius:10, padding:"10px 14px", border:`1px solid ${C.border}` }}>
                <p style={{ margin:0, fontSize:10, color:C.slate, fontWeight:600, textTransform:"uppercase", letterSpacing:.5 }}>{item.label}</p>
                <p style={{ margin:"4px 0 0", fontSize:12, fontWeight:700, color:C.dark, wordBreak:"break-all" }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Commissions */}
          {amb.commissions_month > 0 && (
            <div style={{ background:C.purpleL, borderRadius:12, padding:"14px 16px", marginBottom:14, border:`1px solid ${C.purpleM}` }}>
              <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:800, color:C.purple, textTransform:"uppercase", letterSpacing:.8 }}>Commissions ce mois</p>
              {COMMISSION_RATES.map(r => {
                const base = Number(amb.commissions_month || 0) * 2 * 0.5;
                const amount = base * r.rate / 100;
                return (
                  <div key={r.type} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, padding:"6px 0", borderBottom:`1px solid ${C.purpleM}` }}>
                    <span style={{ fontSize:12, color:C.darkM }}>{r.label} ({r.rate}%)</span>
                    <span style={{ fontSize:13, fontWeight:800, color:r.color }}>{amount.toFixed(2)} €</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recalcul */}
          {recalcMsg && (
            <p style={{ margin:"0 0 10px", fontSize:12, fontWeight:700,
              color: recalcMsg.startsWith("✅") ? C.green : C.red,
              background: recalcMsg.startsWith("✅") ? C.greenL : C.redL,
              padding:"10px 14px", borderRadius:10, border:`1px solid ${recalcMsg.startsWith("✅") ? C.green : C.red}22` }}>
              {recalcMsg}
            </p>
          )}

          <button onClick={handleRecalc} disabled={recalcLoading}
            style={{ width:"100%", padding:"10px 0", borderRadius:10, marginBottom:10,
              border:`1.5px solid ${C.purpleM}`, background:C.purpleL,
              color:C.purple, fontWeight:700, fontSize:13, cursor:recalcLoading?"not-allowed":"pointer",
              opacity:recalcLoading?0.6:1, transition:"all .15s" }}>
            {recalcLoading ? "⏳ Calcul en cours…" : "🔁 Recalculer les commissions"}
          </button>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => onToggleStatus(amb)}
              style={{ flex:1, padding:"11px 0", borderRadius:10,
                border:`1.5px solid ${amb.status==="ACTIVE" ? C.red : C.green}`,
                background: amb.status==="ACTIVE" ? C.redL : C.greenL,
                color:amb.status==="ACTIVE"?C.red:C.green, fontWeight:700, fontSize:13, cursor:"pointer", transition:"all .15s" }}>
              {amb.status === "ACTIVE" ? "🚫 Suspendre" : "✅ Réactiver"}
            </button>
            <button onClick={onClose}
              style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none",
                background:C.purple, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────
export default function AdminFederation() {
  const [members, setMembers]           = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [tab, setTab]                   = useState("members");
  const [search, setSearch]             = useState("");
  const [roleFilter, setRoleFilter]     = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected]         = useState(null);
  const [validating, setValidating]     = useState(null);

  const [demandesComm,    setDemandesComm]    = useState([]);
  const [demandesStats,   setDemandesStats]   = useState({});
  const [demandesFilter,  setDemandesFilter]  = useState("");
  const [demandesLoading, setDemandesLoading] = useState(false);
  const [actionLoading,   setActionLoading]   = useState(null);
  const [rejectModal,     setRejectModal]     = useState(null);
  const [rejectNote,      setRejectNote]      = useState("");

  const stats = {
    total:        members.length,
    actifs:       members.filter(m => m.status === "ACTIVE").length,
    rum:          members.filter(m => m.role === "RUM").length,
    leaders:      members.filter(m => m.role === "LEADER").length,
    pasteurs:     members.filter(m => m.role === "PASTEUR").length,
    responsables: members.filter(m => m.role === "RESPONSABLE").length,
    cartes:       members.reduce((s, m) => s + Number(m.beneficiary_count || 0), 0),
    adhesions:    members.reduce((s, m) => s + Number(m.membership_fee || 0), 0),
    commissions:  members.reduce((s, m) => s + Number(m.commissions_total || m.total_payments_eur || 0), 0),
  };

  useEffect(() => { fetchMembers(); }, []);

  useEffect(() => {
    let list = members;
    if (roleFilter !== "ALL")   list = list.filter(m => m.role === roleFilter);
    if (statusFilter !== "ALL") list = list.filter(m => m.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.username?.toLowerCase().includes(q) ||
        m.referral_code?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [members, search, roleFilter, statusFilter]);

  async function fetchMembers() {
    setLoading(true); setError("");
    try {
      const { data } = await axios.get(`${API}/api/federation/admin/ambassadors`, {
        headers: { Authorization: `Bearer ${agentToken()}` },
      });
      setMembers(data.ambassadors || data.members || []);
    } catch (e) {
      setError(e.response?.data?.error || "Erreur lors du chargement des membres");
    } finally { setLoading(false); }
  }

  async function handleValidate(id, action, paymentMethod) {
    setValidating(id);
    try {
      await axios.post(
        `${API}/api/diaspora/admin/ambassadors/${id}/validate`,
        { action, paymentMethod },
        { headers: { Authorization: `Bearer ${agentToken()}` } }
      );
      await fetchMembers();
      setSelected(null);
    } catch (e) {
      alert(e.response?.data?.error || "Erreur lors de la validation");
    } finally { setValidating(null); }
  }

  async function toggleStatus(amb) {
    const newStatus = amb.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await axios.patch(`${API}/api/federation/admin/ambassadors/${amb.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${agentToken()}` } }
      );
      fetchMembers();
      setSelected(null);
    } catch (err) {
      alert(err.response?.data?.error || "Erreur mise à jour statut");
    }
  }

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
      console.error("fetchDemandes Federation", e.message);
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

  useEffect(() => { if (tab === "demandes") fetchDemandes(); }, [tab, demandesFilter]);

  const pendingBadge = demandesStats["PENDING"] || 0;

  const TABS = [
    { id:"members",    label:"Membres",         icon:"👥", count: stats.total },
    { id:"hierarchy",  label:"Hiérarchie",      icon:"🏛️" },
    { id:"commissions",label:"Commissions",     icon:"💰" },
    { id:"demandes",   label:"Retraits",        icon:"💸", badge: pendingBadge },
  ];

  return (
    <div style={{ padding:"28px 24px", maxWidth:1140, margin:"0 auto", animation:"fadeIn .3s ease" }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── En-tête ──────────────────────────────────────────── */}
      <div style={{ background:`linear-gradient(135deg, ${C.navy} 0%, #312E81 100%)`,
        borderRadius:20, padding:"28px 32px", marginBottom:24,
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16,
        boxShadow:"0 8px 32px rgba(30,27,75,.25)" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <span style={{ fontSize:28 }}>⛪</span>
            <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:"#fff", letterSpacing:-.3 }}>
              Réseau Fédération
            </h1>
          </div>
          <p style={{ margin:0, color:"rgba(255,255,255,.55)", fontSize:13, letterSpacing:.2 }}>
            RUM → Leader → Pasteur → Responsable → Client
          </p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ textAlign:"center", background:"rgba(255,255,255,.1)", borderRadius:12, padding:"10px 18px" }}>
            <p style={{ margin:0, fontSize:20, fontWeight:900, color:"#fff" }}>{stats.total}</p>
            <p style={{ margin:"2px 0 0", fontSize:11, color:"rgba(255,255,255,.6)", fontWeight:600 }}>Membres</p>
          </div>
          <div style={{ textAlign:"center", background:"rgba(255,255,255,.1)", borderRadius:12, padding:"10px 18px" }}>
            <p style={{ margin:0, fontSize:20, fontWeight:900, color:"#6EE7B7" }}>{stats.actifs}</p>
            <p style={{ margin:"2px 0 0", fontSize:11, color:"rgba(255,255,255,.6)", fontWeight:600 }}>Actifs</p>
          </div>
          <div style={{ textAlign:"center", background:"rgba(255,255,255,.1)", borderRadius:12, padding:"10px 18px" }}>
            <p style={{ margin:0, fontSize:20, fontWeight:900, color:"#FCD34D" }}>{fmt(stats.cartes)}</p>
            <p style={{ margin:"2px 0 0", fontSize:11, color:"rgba(255,255,255,.6)", fontWeight:600 }}>Cartes</p>
          </div>
        </div>
      </div>

      {/* ── Comptes en attente ────────────────────────────────── */}
      <PendingValidationSection members={members} onValidate={handleValidate} />

      {/* ── Cartes stats ──────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(155px,1fr))", gap:12, marginBottom:24 }}>
        {[
          { icon:"👑", label:"RUM",            value:stats.rum,          color:C.purple, bg:"#EDE9FE", border:"#C4B5FD" },
          { icon:"⭐", label:"Leaders",        value:stats.leaders,      color:C.blue,   bg:"#DBEAFE", border:"#93C5FD" },
          { icon:"⛪", label:"Pasteurs",       value:stats.pasteurs,     color:C.teal,   bg:"#CCFBF1", border:"#5EEAD4" },
          { icon:"🤝", label:"Responsables",   value:stats.responsables, color:C.gold,   bg:"#FEF3C7", border:"#FCD34D" },
          { icon:"💳", label:"Adhésions FCFA", value:`${fmt(stats.adhesions)} F`, color:C.purple, bg:C.purpleL, border:C.purpleM, small:true },
          { icon:"💰", label:"Commissions",    value:`${fmt(stats.commissions)} €`, color:C.green, bg:C.greenL, border:"#6EE7B7", small:true },
        ].map(s => (
          <div key={s.label} className="fed-card-stat"
            style={{ background:s.bg, borderRadius:14, padding:"16px 18px",
              border:`1.5px solid ${s.border}`, transition:"all .2s", cursor:"default" }}>
            <div style={{ fontSize:22, marginBottom:8 }}>{s.icon}</div>
            <p style={{ margin:"0 0 4px", fontSize:s.small?13:24, fontWeight:900, color:s.color, lineHeight:1 }}>
              {s.small ? s.value : fmt(s.value)}
            </p>
            <p style={{ margin:0, fontSize:11, color:C.slate, fontWeight:600, textTransform:"uppercase", letterSpacing:.3 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Navigation Tabs ───────────────────────────────────── */}
      <div style={{ display:"flex", gap:2, background:"#fff", border:`1.5px solid ${C.border}`,
        borderRadius:14, padding:5, marginBottom:20, width:"fit-content", flexWrap:"wrap",
        boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={active ? "" : "fed-tab"}
              style={{ padding:"9px 18px", borderRadius:10, border:"none", cursor:"pointer",
                fontSize:13, fontWeight:active?700:600, transition:"all .18s",
                background:active?C.navy:"transparent",
                color:active?"#fff":C.slate,
                boxShadow:active?"0 2px 8px rgba(30,27,75,.2)":"none",
                display:"flex", alignItems:"center", gap:7 }}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span style={{ background:active?"rgba(255,255,255,.2)":C.slateL, color:active?"#fff":C.slate,
                  borderRadius:20, padding:"1px 8px", fontSize:11, fontWeight:700 }}>{t.count}</span>
              )}
              {t.badge > 0 && (
                <span style={{ background:"#EF4444", color:"#fff", borderRadius:999, padding:"1px 7px", fontSize:10, fontWeight:800 }}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Erreur ───────────────────────────────────────────── */}
      {error && (
        <div style={{ background:C.redL, color:C.red, padding:"14px 18px", borderRadius:12,
          marginBottom:16, border:`1px solid ${C.red}22`, fontWeight:600, fontSize:13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB MEMBRES                                           */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === "members" && (
        <>
          {/* Filtres */}
          <div style={{ background:"#fff", borderRadius:14, border:`1.5px solid ${C.border}`,
            padding:"14px 16px", marginBottom:14, display:"flex", gap:10, flexWrap:"wrap",
            boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
            <div style={{ flex:1, minWidth:200, position:"relative" }}>
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, pointerEvents:"none" }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Nom, email, username, code…"
                style={{ width:"100%", padding:"9px 12px 9px 34px", borderRadius:9, border:`1.5px solid ${C.border}`,
                  fontSize:13, outline:"none", boxSizing:"border-box", transition:"border-color .15s",
                  fontFamily:"inherit" }}
                onFocus={e => e.target.style.borderColor=C.purple}
                onBlur={e => e.target.style.borderColor=C.border}
              />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              style={{ padding:"9px 12px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13,
                outline:"none", background:"#fff", color:C.dark, cursor:"pointer", fontFamily:"inherit" }}>
              <option value="ALL">Tous les rôles</option>
              {Object.entries(ROLE_CONFIG).map(([k,v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding:"9px 12px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13,
                outline:"none", background:"#fff", color:C.dark, cursor:"pointer", fontFamily:"inherit" }}>
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIVE">✅ Actifs</option>
              <option value="PENDING">⏳ En attente</option>
              <option value="SUSPENDED">🚫 Suspendus</option>
            </select>
            <button onClick={fetchMembers} className="fed-btn-ghost"
              style={{ padding:"9px 16px", borderRadius:9, border:`1.5px solid ${C.border}`,
                background:"#fff", color:C.slate, fontWeight:700, fontSize:12, cursor:"pointer",
                display:"flex", alignItems:"center", gap:6, transition:"background .15s" }}>
              <span style={{ fontSize:14 }}>↻</span> Actualiser
            </button>
          </div>

          {loading ? <Spinner /> : (
            <div style={{ background:"#fff", borderRadius:16, border:`1.5px solid ${C.border}`,
              overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
              {/* Compteur */}
              <div style={{ padding:"12px 20px", borderBottom:`1px solid ${C.border}`,
                display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, color:C.slate, fontWeight:600 }}>
                  {filtered.length} membre(s) affiché(s)
                </span>
                {search || roleFilter !== "ALL" || statusFilter !== "ALL" ? (
                  <button onClick={() => { setSearch(""); setRoleFilter("ALL"); setStatusFilter("ALL"); }}
                    style={{ fontSize:12, color:C.purple, fontWeight:700, background:"none", border:"none", cursor:"pointer" }}>
                    ✕ Réinitialiser filtres
                  </button>
                ) : null}
              </div>

              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ background:C.bg }}>
                      {["Membre","Rôle","Plan","Statut","Cartes","Adhésion","Paiement","Inscrit le",""].map(h => (
                        <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontWeight:700,
                          color:C.slate, fontSize:11, textTransform:"uppercase", letterSpacing:.6,
                          whiteSpace:"nowrap", borderBottom:`1px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign:"center", padding:"48px 20px", color:C.slate }}>
                          <p style={{ fontSize:36, margin:"0 0 8px" }}>🔍</p>
                          <p style={{ margin:0, fontWeight:700, fontSize:14 }}>Aucun membre trouvé</p>
                        </td>
                      </tr>
                    ) : filtered.map((m, i) => (
                      <tr key={m.id} className="fed-row"
                        style={{ borderTop: i > 0 ? `1px solid ${C.border}` : "none", transition:"background .12s" }}>
                        <td style={{ padding:"13px 14px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:34, height:34, borderRadius:9, flexShrink:0,
                              background:ROLE_CONFIG[m.role]?.bg||C.bg,
                              display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>
                              {ROLE_CONFIG[m.role]?.icon||"👤"}
                            </div>
                            <div>
                              <p style={{ margin:0, fontWeight:700, color:C.dark, fontSize:13 }}>{m.name}</p>
                              <p style={{ margin:"2px 0 0", fontSize:11, color:C.slate }}>
                                {m.email}
                                {m.referral_code && <> · <span style={{ fontWeight:700, color:C.purple }}>#{m.referral_code}</span></>}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"13px 14px" }}><RoleBadge role={m.role} /></td>
                        <td style={{ padding:"13px 14px" }}><PlanBadge plan={m.plan} /></td>
                        <td style={{ padding:"13px 14px" }}><StatusBadge status={m.status} /></td>
                        <td style={{ padding:"13px 14px", fontWeight:700, color:C.teal }}>{fmt(m.beneficiary_count||0)}</td>
                        <td style={{ padding:"13px 14px", fontWeight:700, color:C.purple }}>
                          {m.membership_fee ? `${fmt(m.membership_fee)} F` : <span style={{ color:C.slate }}>—</span>}
                        </td>
                        <td style={{ padding:"13px 14px" }}>
                          <span style={{ fontSize:12, color:C.slate, fontWeight:600 }}>
                            {m.membership_payment_method || "—"}
                          </span>
                        </td>
                        <td style={{ padding:"13px 14px", fontSize:12, color:C.slate, whiteSpace:"nowrap" }}>{fmtDate(m.created_at)}</td>
                        <td style={{ padding:"13px 14px" }}>
                          <button onClick={() => setSelected(m)}
                            style={{ padding:"6px 14px", borderRadius:8, border:`1.5px solid ${C.border}`,
                              background:"#fff", color:C.purple, fontWeight:700, fontSize:12,
                              cursor:"pointer", whiteSpace:"nowrap", transition:"all .15s" }}
                            onMouseEnter={e => { e.target.style.borderColor=C.purple; e.target.style.background=C.purpleL; }}
                            onMouseLeave={e => { e.target.style.borderColor=C.border; e.target.style.background="#fff"; }}>
                            Détail →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB HIÉRARCHIE                                        */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === "hierarchy" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Organigramme visuel */}
          <div style={{ background:"#fff", borderRadius:16, border:`1.5px solid ${C.border}`,
            padding:"28px 24px", boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
            <p style={{ margin:"0 0 24px", fontWeight:800, color:C.dark, fontSize:15 }}>🏛️ Organigramme Fédération</p>

            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:0 }}>
              {Object.entries(ROLE_CONFIG).map(([key, cfg], i) => {
                const ambs = members.filter(m => m.role === key);
                return (
                  <div key={key} style={{ display:"flex", flexDirection:"column", alignItems:"center", width:"100%" }}>
                    {i > 0 && (
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", height:32 }}>
                        <div style={{ width:2, flex:1, background:`linear-gradient(${cfg.color}44, ${cfg.color})` }} />
                        <span style={{ color:cfg.color, fontSize:16, lineHeight:1 }}>▼</span>
                      </div>
                    )}
                    <div style={{ background:cfg.bg, border:`2px solid ${cfg.color}55`,
                      borderRadius:14, padding:"16px 24px", textAlign:"center",
                      minWidth:260, boxShadow:`0 4px 16px ${cfg.color}18`, width:"100%", maxWidth:400 }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:8 }}>
                        <span style={{ fontSize:24 }}>{cfg.icon}</span>
                        <p style={{ margin:0, fontWeight:800, fontSize:15, color:cfg.color }}>{cfg.label}</p>
                        <span style={{ background:cfg.color, color:"#fff", borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:800 }}>
                          {ambs.length}
                        </span>
                      </div>
                      {ambs.length > 0 && (
                        <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap", marginTop:10 }}>
                          {ambs.slice(0,5).map(m => (
                            <button key={m.id} onClick={() => setSelected(m)}
                              style={{ fontSize:11, background:cfg.color, color:"#fff", padding:"3px 12px",
                                borderRadius:20, cursor:"pointer", fontWeight:700, border:"none", fontFamily:"inherit",
                                transition:"opacity .15s" }}
                              onMouseEnter={e => e.target.style.opacity=".8"}
                              onMouseLeave={e => e.target.style.opacity="1"}>
                              {m.name.split(" ")[0]}
                            </button>
                          ))}
                          {ambs.length > 5 && (
                            <span style={{ fontSize:11, color:cfg.color, fontWeight:700, padding:"3px 8px" }}>
                              +{ambs.length-5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}


            </div>
          </div>

          {/* Vue arborescente */}
          <div style={{ background:"#fff", borderRadius:16, border:`1.5px solid ${C.border}`,
            padding:"24px", boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
            <p style={{ margin:"0 0 16px", fontWeight:800, color:C.dark, fontSize:15 }}>🌳 Vue arborescente</p>
            {members.map(m => {
              const rc = ROLE_CONFIG[m.role];
              const indent = { RUM:0, LEADER:1, PASTEUR:2, RESPONSABLE:3 }[m.role] || 0;
              return (
                <div key={m.id} onClick={() => setSelected(m)} className="fed-tree-item"
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px",
                    marginLeft:indent*28, borderRadius:10, cursor:"pointer", marginBottom:4,
                    border:`1.5px solid transparent`, transition:"all .15s", background:"transparent" }}>
                  {indent > 0 && <span style={{ color:C.border, fontSize:18, flexShrink:0, marginLeft:-8 }}>└</span>}
                  <div style={{ width:32, height:32, borderRadius:8, background:rc?.bg||C.bg,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
                    {rc?.icon||"👤"}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontWeight:700, fontSize:13, color:C.dark }}>{m.name}</p>
                    <p style={{ margin:0, fontSize:11, color:C.slate, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      @{m.username||"—"}{m.parent_name ? ` ↳ ${m.parent_name}` : ""}
                    </p>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
                    <PlanBadge plan={m.plan} />
                    <StatusBadge status={m.status} />
                    <span style={{ fontSize:11, color:C.slate, fontWeight:600 }}>{m.recruit_count||0} recrutés</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB COMMISSIONS                                       */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === "commissions" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Règles de calcul */}
          <div style={{ background:"#fff", borderRadius:16, border:`1.5px solid ${C.border}`,
            padding:"24px 28px", boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
            <p style={{ margin:"0 0 16px", fontWeight:800, color:C.dark, fontSize:15 }}>📐 Règles de calcul</p>
            <div style={{ background:`linear-gradient(135deg, ${C.purpleL}, #EDE9FE)`,
              borderRadius:12, padding:"16px 20px", marginBottom:16, border:`1px solid ${C.purpleM}` }}>
              <p style={{ margin:0, fontSize:14, color:C.purple, fontWeight:800 }}>Base = 50% de la prime encaissée</p>
              <p style={{ margin:"4px 0 0", fontSize:12, color:C.slate }}>Exemple : prime de 100 € → base de 50 €</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px,1fr))", gap:12 }}>
              {COMMISSION_RATES.map(r => (
                <div key={r.type} style={{ background:C.bg, borderRadius:12, padding:"16px 18px",
                  border:`1.5px solid ${r.color}22` }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                    <p style={{ margin:0, fontSize:11, fontWeight:700, color:C.slate, textTransform:"uppercase", letterSpacing:.5 }}>{r.type}</p>
                    <span style={{ background:r.color, color:"#fff", borderRadius:20, padding:"2px 10px", fontSize:12, fontWeight:900 }}>{r.rate}%</span>
                  </div>
                  <p style={{ margin:"0 0 4px", fontSize:13, color:C.dark, fontWeight:700 }}>{r.label}</p>
                  <p style={{ margin:0, fontSize:11, color:C.slate }}>100€ prime → <strong style={{ color:r.color }}>{(50*r.rate/100).toFixed(2)} €</strong></p>
                </div>
              ))}
            </div>
          </div>

          {/* Tableau commissions membres */}
          <div style={{ background:"#fff", borderRadius:16, border:`1.5px solid ${C.border}`,
            overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
            <div style={{ padding:"18px 24px", borderBottom:`1px solid ${C.border}` }}>
              <p style={{ margin:0, fontWeight:800, color:C.dark, fontSize:15 }}>💰 Commissions par membre</p>
            </div>
            {loading ? <Spinner /> : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ background:C.bg }}>
                      {["Membre","Rôle","Plan","Ce mois","Total","En attente"].map(h => (
                        <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontWeight:700,
                          color:C.slate, fontSize:11, textTransform:"uppercase", letterSpacing:.6,
                          borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members
                      .filter(m => m.commissions_month > 0 || m.commissions_total > 0)
                      .sort((a,b) => Number(b.commissions_month||0) - Number(a.commissions_month||0))
                      .map((m, i) => (
                        <tr key={m.id} className="fed-row"
                          style={{ borderTop: i > 0 ? `1px solid ${C.border}` : "none", transition:"background .12s" }}>
                          <td style={{ padding:"13px 16px", fontWeight:700, color:C.dark }}>{m.name}</td>
                          <td style={{ padding:"13px 16px" }}><RoleBadge role={m.role} /></td>
                          <td style={{ padding:"13px 16px" }}><PlanBadge plan={m.plan} /></td>
                          <td style={{ padding:"13px 16px" }}>
                            <span style={{ fontWeight:800, color:C.gold, fontSize:14 }}>{fmt(m.commissions_month || 0)} €</span>
                          </td>
                          <td style={{ padding:"13px 16px" }}>
                            <span style={{ fontWeight:700, color:C.green }}>{fmt(m.commissions_total || 0)} €</span>
                          </td>
                          <td style={{ padding:"13px 16px" }}>
                            <span style={{ background:C.goldL, color:C.gold, padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:700 }}>
                              ~{fmt(Math.round(Number(m.commissions_month||0) * 0.3))} €
                            </span>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
                {members.filter(m => m.commissions_month > 0 || m.commissions_total > 0).length === 0 && (
                  <div style={{ textAlign:"center", padding:"48px 20px", color:C.slate }}>
                    <p style={{ fontSize:36, margin:"0 0 8px" }}>💤</p>
                    <p style={{ fontWeight:700, fontSize:14, margin:0 }}>Aucune commission enregistrée pour le moment</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB DEMANDES RETRAIT                                  */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === "demandes" && (
        <div>
          {/* Filtres statut */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16, alignItems:"center" }}>
            {[
              { label:"En attente", key:"PENDING",   color:C.gold,  bg:"#FEF3C7" },
              { label:"Validées",   key:"VALIDATED", color:C.blue,  bg:"#DBEAFE" },
              { label:"Payées",     key:"PAID",      color:C.green, bg:"#D1FAE5" },
              { label:"Rejetées",   key:"REJECTED",  color:C.red,   bg:"#FEE2E2" },
            ].map(({ label, key, color, bg }) => (
              <button key={key} onClick={() => setDemandesFilter(demandesFilter === key ? "" : key)}
                style={{ background:bg, border:`1.5px solid ${demandesFilter === key ? color : "transparent"}`,
                  borderRadius:12, padding:"10px 16px", cursor:"pointer",
                  opacity: demandesFilter && demandesFilter !== key ? 0.45 : 1,
                  transition:"all .15s", fontFamily:"inherit" }}>
                <div style={{ fontSize:18, fontWeight:900, color }}>{demandesStats[key] || 0}</div>
                <div style={{ fontSize:11, color, fontWeight:700 }}>{label}</div>
              </button>
            ))}
            <button onClick={fetchDemandes} className="fed-btn-ghost"
              style={{ padding:"9px 14px", borderRadius:10, border:`1.5px solid ${C.border}`,
                background:"#fff", color:C.slate, fontSize:13, fontWeight:700, cursor:"pointer",
                display:"flex", alignItems:"center", gap:6, fontFamily:"inherit", transition:"background .15s" }}>
              ↻ Rafraîchir
            </button>
          </div>

          {demandesLoading ? <Spinner /> : demandesComm.length === 0 ? (
            <div style={{ textAlign:"center", padding:"56px 20px", color:C.slate, background:"#fff",
              borderRadius:16, border:`1.5px solid ${C.border}`, boxShadow:"0 2px 8px rgba(0,0,0,.04)" }}>
              <p style={{ fontSize:42, margin:"0 0 12px" }}>💤</p>
              <p style={{ fontWeight:800, fontSize:15, margin:"0 0 6px", color:C.dark }}>Aucune demande de retrait</p>
              <p style={{ fontSize:13, margin:0 }}>Les demandes Fédération apparaîtront ici</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {demandesComm.map(r => {
                const details = typeof r.payment_details === "string" ? JSON.parse(r.payment_details || "{}") : (r.payment_details || {});
                const ST = {
                  PENDING:   { label:"En attente", color:C.gold,  bg:"#FEF3C7" },
                  VALIDATED: { label:"Validée",    color:C.blue,  bg:"#DBEAFE" },
                  PAID:      { label:"Payée",      color:C.green, bg:"#D1FAE5" },
                  REJECTED:  { label:"Rejetée",    color:C.red,   bg:"#FEE2E2" },
                };
                const st = ST[r.status] || ST.PENDING;
                return (
                  <div key={r.id} style={{ background:"#fff", borderRadius:14,
                    border:`1.5px solid ${r.status === "PENDING" ? C.gold + "55" : C.border}`,
                    padding:"18px 22px", boxShadow:"0 1px 4px rgba(0,0,0,.04)", transition:"box-shadow .15s" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                          <span style={{ fontSize:20, fontWeight:900, color:C.green }}>
                            {Number(r.amount_requested || 0).toLocaleString("fr-FR")} FCFA
                          </span>
                          <span style={{ background:st.bg, color:st.color, padding:"4px 12px", borderRadius:6, fontSize:11, fontWeight:700 }}>
                            {st.label}
                          </span>
                        </div>
                        <div style={{ fontSize:12, color:C.slate, marginBottom:4 }}>
                          Demande <strong style={{ color:C.dark }}>#{r.id}</strong> · {r.member_name || "—"}
                          {r.member_role && <> (<span style={{ color:C.purple, fontWeight:700 }}>{r.member_role}</span>)</>}
                          {" · "}{r.adhesions_since_last} adhésion(s)
                        </div>
                        <div style={{ fontSize:12, color:C.slate }}>
                          {r.payment_method === "mobile_money" && `📱 ${details.operator || ""} ${details.phone || ""}`}
                          {r.payment_method === "virement"     && `🏦 ${details.name || ""} — ${details.iban || details.bank || ""}`}
                          {r.payment_method === "cash"         && "💵 Espèces en agence"}
                          {" · "}{fmtDate(r.created_at)}
                        </div>
                        {r.status === "REJECTED" && r.admin_note && (
                          <div style={{ marginTop:10, background:C.redL, borderRadius:8, padding:"8px 14px", fontSize:12, color:C.red, fontWeight:600, border:`1px solid ${C.red}22` }}>
                            Motif de rejet : {r.admin_note}
                          </div>
                        )}
                        {r.validated_at && <div style={{ fontSize:11, color:C.blue, fontWeight:700, marginTop:6 }}>✅ Validée le {fmtDate(r.validated_at)}</div>}
                        {r.paid_at      && <div style={{ fontSize:11, color:C.green, fontWeight:700, marginTop:4 }}>💸 Payée le {fmtDate(r.paid_at)}</div>}
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        {r.status === "PENDING" && (
                          <>
                            <button onClick={() => handleDemandeAction(r.id, "validate")} disabled={!!actionLoading}
                              style={{ padding:"8px 18px", borderRadius:9, border:"none",
                                background:C.purple, color:"#fff", fontWeight:700, fontSize:12,
                                cursor:"pointer", fontFamily:"inherit", letterSpacing:.2 }}>
                              {actionLoading === r.id + "validate" ? "…" : "✅ Valider"}
                            </button>
                            <button onClick={() => { setRejectModal({ id:r.id, name:r.member_name || `#${r.id}` }); setRejectNote(""); }}
                              style={{ padding:"8px 18px", borderRadius:9, border:`1.5px solid ${C.red}`,
                                background:C.redL, color:C.red, fontWeight:700, fontSize:12,
                                cursor:"pointer", fontFamily:"inherit" }}>
                              ✕ Rejeter
                            </button>
                          </>
                        )}
                        {r.status === "VALIDATED" && (
                          <button onClick={() => handleDemandeAction(r.id, "pay")} disabled={!!actionLoading}
                            style={{ padding:"8px 18px", borderRadius:9, border:"none",
                              background:C.green, color:"#fff", fontWeight:700, fontSize:12,
                              cursor:"pointer", fontFamily:"inherit" }}>
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
            <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.55)", zIndex:500,
              display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(4px)" }}>
              <div style={{ background:"#fff", borderRadius:20, padding:"28px 28px", maxWidth:440, width:"100%",
                boxShadow:"0 24px 64px rgba(0,0,0,.2)", animation:"slideUp .2s ease" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:C.redL, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>✕</div>
                  <div>
                    <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:C.dark }}>Rejeter la demande</h3>
                    <p style={{ margin:0, fontSize:12, color:C.slate }}>de {rejectModal.name}</p>
                  </div>
                </div>
                <input placeholder="Motif du rejet (optionnel)…" value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                  style={{ width:"100%", padding:"10px 14px", borderRadius:10,
                    border:`1.5px solid ${C.red}44`, fontSize:14, boxSizing:"border-box",
                    outline:"none", marginBottom:18, fontFamily:"inherit" }}
                  onFocus={e => e.target.style.borderColor=C.red}
                  onBlur={e => e.target.style.borderColor=C.red+"44"} />
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={() => setRejectModal(null)}
                    style={{ flex:1, padding:"10px 0", borderRadius:10, border:`1.5px solid ${C.border}`,
                      background:"#fff", color:C.slate, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                    Annuler
                  </button>
                  <button onClick={() => handleDemandeAction(rejectModal.id, "reject", rejectNote)} disabled={!!actionLoading}
                    style={{ flex:1, padding:"10px 0", borderRadius:10, border:"none",
                      background:C.red, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                    {actionLoading ? "…" : "Confirmer le rejet"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal détail ─────────────────────────────────────── */}
      <DetailModal amb={selected} onClose={() => setSelected(null)} onToggleStatus={toggleStatus} onRefresh={fetchMembers} />
    </div>
  );
}
