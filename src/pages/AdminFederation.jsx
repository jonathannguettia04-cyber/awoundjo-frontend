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

const C = {
  purple:  "#7C3AED", purpleL: "#F5F3FF",
  green:   "#059669", greenL:  "#ECFDF5",
  gold:    "#D97706", goldL:   "#FFFBEB",
  blue:    "#1B4FD8", blueL:   "#EEF2FF",
  teal:    "#0D9488", tealL:   "#F0FDFA",
  red:     "#DC2626", redL:    "#FEF2F2",
  slate:   "#64748B", dark:    "#0F172A",
  border:  "#E2E8F0", bg:      "#F8FAFC",
};

const fmt     = (n) => Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" }) : "—";

// ── Rôles réels réseau Fédération (depuis ReferralPages.jsx) ──
const ROLE_CONFIG = {
  RUM:         { label:"RUM",         icon:"👑", color:C.purple, bg:C.purpleL },
  LEADER:      { label:"Leader",      icon:"⭐", color:C.blue,   bg:C.blueL   },
  PASTEUR:     { label:"Pasteur",     icon:"⛪", color:C.teal,   bg:C.tealL   },
  RESPONSABLE: { label:"Responsable", icon:"🤝", color:C.gold,   bg:C.goldL   },
};

const PLAN_CONFIG = {
  ESSENTIELLE: { label:"🌿 Essentielle", color:C.teal,   bg:C.tealL   },
  IVOIRIENNE:  { label:"🌍 Ivoirienne",  color:C.blue,   bg:C.blueL   },
  TURQUOISE:   { label:"💎 Turquoise",   color:C.purple, bg:C.purpleL },
};

const STATUS_CONFIG = {
  ACTIVE:    { label:"Actif",      color:C.green, bg:C.greenL },
  SUSPENDED: { label:"Suspendu",   color:C.red,   bg:C.redL   },
  PENDING:   { label:"En attente", color:C.gold,  bg:C.goldL  },
};

// Taux de commission réseau Fédération (selon les règles définies)
const COMMISSION_RATES = [
  { type:"DIRECT",    label:"Enregistrement direct (soi-même)",  rate:10,  color:C.gold   },
  { type:"INDIRECT1", label:"Filleuls directs (1 niveau)",       rate:2.5, color:C.green  },
  { type:"INDIRECT2", label:"Filleuls RUM (tous niveaux)",       rate:5,   color:C.purple },
];

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

// Modal détail ambassadeur
const VALIDATION_CONFIG = {
  pending:  { label:"⏳ À valider", color:C.gold,  bg:C.goldL  },
  approved: { label:"✅ Validé",    color:C.green, bg:C.greenL },
  rejected: { label:"❌ Rejeté",    color:C.red,   bg:C.redL   },
};

function ValidationBadge({ v }) {
  const s = VALIDATION_CONFIG[v] || VALIDATION_CONFIG.pending;
  return (
    <span style={{ background:s.bg, color:s.color, padding:"2px 10px", borderRadius:999, fontSize:11, fontWeight:700 }}>
      {s.label}
    </span>
  );
}

// Section comptes en attente de validation (réseau Fédération)
function PendingValidationSection({ members, onValidate }) {
  const [cashModes, setCashModes] = useState({});
  const pending = members.filter(m => m.status_validation === "pending" || !m.status_validation);
  if (pending.length === 0) return null;

  return (
    <div style={{ background:"#fff", borderRadius:14, border:`2px solid ${C.gold}`, padding:"18px 20px", marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <span style={{ fontSize:22 }}>⏳</span>
        <div>
          <p style={{ margin:0, fontWeight:900, fontSize:15, color:C.dark }}>
            Comptes en attente de validation
          </p>
          <p style={{ margin:"2px 0 0", fontSize:12, color:C.slate }}>
            {pending.length} membre(s) à traiter — les commissions sont calculées à la validation
          </p>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {pending.map(m => {
          const isCash = !!cashModes[m.id];
          const rc = ROLE_CONFIG[m.role] || { icon:"👤", color:C.slate, bg:C.bg };
          return (
            <div key={m.id} style={{
              background: isCash ? "#F0FDF4" : C.goldL,
              borderRadius:10, padding:"12px 16px",
              border:`1px solid ${isCash ? C.green : C.gold}44`,
              display:"flex", alignItems:"center", justifyContent:"space-between",
              flexWrap:"wrap", gap:12, transition:"background 0.2s",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:rc.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
                  {rc.icon}
                </div>
                <div>
                  <p style={{ margin:0, fontWeight:800, color:C.dark, fontSize:13 }}>{m.name}</p>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:C.slate }}>
                    {m.email} · {m.country} · {fmtDate(m.created_at)}
                  </p>
                  <div style={{ display:"flex", gap:6, marginTop:4 }}>
                    <RoleBadge role={m.role} />
                    <PlanBadge plan={m.plan} />
                    {m.membership_fee && (
                      <span style={{ fontSize:11, color:C.purple, fontWeight:700 }}>
                        {fmt(m.membership_fee)} FCFA
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, color: isCash ? C.green : C.slate }}>
                    💵 Paiement Cash
                  </span>
                  <button
                    onClick={() => setCashModes(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
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
                    ✓ Commissions calculées automatiquement
                  </p>
                )}

                <div style={{ display:"flex", gap:8 }}>
                  <button
                    onClick={() => onValidate(m.id, "approve", isCash ? "cash" : null)}
                    style={{
                      padding:"7px 16px", borderRadius:8, border:"none",
                      background:C.green, color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer",
                    }}
                  >
                    ✅ {isCash ? "Valider (Cash)" : "Valider"}
                  </button>
                  <button
                    onClick={() => onValidate(m.id, "reject", null)}
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
  if (!amb) return null;
  const rc = ROLE_CONFIG[amb.role] || { icon:"👤", color:C.slate, bg:C.bg };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:20, padding:28, maxWidth:500, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,.15)" }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:rc.bg, color:rc.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
            {rc.icon}
          </div>
          <div style={{ flex:1 }}>
            <h3 style={{ margin:0, fontSize:17, fontWeight:900, color:C.dark }}>{amb.name}</h3>
            <p style={{ margin:"2px 0 0", fontSize:12, color:C.slate }}>{amb.email}</p>
          </div>
          <button onClick={onClose} style={{ border:"none", background:"none", fontSize:20, cursor:"pointer", color:C.slate }}>✕</button>
        </div>

        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
          <RoleBadge role={amb.role} />
          <StatusBadge status={amb.status} />
          <PlanBadge plan={amb.plan} />
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          {[
            { label:"Membres recrutés",   value: fmt(amb.recruit_count || amb.members || 0),  color:C.purple },
            { label:"Cartes vendues",     value: fmt(amb.beneficiary_count || 0),              color:C.teal   },
            { label:"Adhésion payée",     value: amb.membership_fee ? `${fmt(amb.membership_fee)} FCFA` : "—", color:C.green, isText:true },
            { label:"Statut",             value: amb.status === "ACTIVE" ? "✅ Actif" : "⏸ Inactif", color:amb.status==="ACTIVE"?C.green:C.slate, isText:true },
          ].map(item => (
            <div key={item.label} style={{ background:C.bg, borderRadius:10, padding:"12px 14px" }}>
              <p style={{ margin:"0 0 4px", fontSize:11, color:C.slate, fontWeight:600 }}>{item.label}</p>
              <p style={{ margin:0, fontSize:item.isText?14:22, fontWeight:800, color:item.color }}>
                {item.isText ? item.value : fmt(item.value)}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          {[
            { label:"Code ambassadeur",   value: amb.referral_code || "—"             },
            { label:"Username",           value: amb.username || "—"                  },
            { label:"Mode paiement",      value: amb.membership_payment_method || "—" },
            { label:"Transaction ID",     value: amb.membership_transaction_id || "—" },
            { label:"Supérieur",          value: amb.parent_name || "— Direction"     },
            { label:"Inscrit le",         value: fmtDate(amb.created_at)              },
          ].map(item => (
            <div key={item.label} style={{ background:C.bg, borderRadius:8, padding:"10px 12px" }}>
              <p style={{ margin:0, fontSize:10, color:C.slate, fontWeight:600 }}>{item.label}</p>
              <p style={{ margin:"3px 0 0", fontSize:12, fontWeight:700, color:C.dark, wordBreak:"break-all" }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Commissions estimées */}
        {amb.commissions_month > 0 && (
          <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14, marginBottom:16 }}>
            <p style={{ margin:"0 0 10px", fontSize:12, fontWeight:700, color:C.slate }}>COMMISSIONS CE MOIS</p>
            {COMMISSION_RATES.map(r => {
              const base = Number(amb.commissions_month || 0) * 2 * 0.5;
              const amount = base * r.rate / 100;
              return (
                <div key={r.type} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:12, color:C.slate }}>{r.label} ({r.rate}%)</span>
                  <span style={{ fontSize:13, fontWeight:700, color:r.color }}>{amount.toFixed(2)} €</span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => onToggleStatus(amb)}
            style={{ flex:1, padding:"10px 0", borderRadius:10, border:`1.5px solid ${C.border}`, background:"#fff", color:amb.status==="ACTIVE"?C.red:C.green, fontWeight:700, fontSize:13, cursor:"pointer" }}>
            {amb.status === "ACTIVE" ? "🚫 Suspendre" : "✅ Réactiver"}
          </button>
          <button onClick={onClose}
            style={{ flex:1, padding:"10px 0", borderRadius:10, border:"none", background:C.purple, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminFederation() {
  const [members, setMembers]         = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [tab, setTab]                 = useState("members");
  const [search, setSearch]           = useState("");
  const [roleFilter, setRoleFilter]   = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected]       = useState(null);
  const [validating, setValidating]   = useState(null);
  const [cashModes, setCashModes]     = useState({});

  const stats = {
    total:      members.length,
    actifs:     members.filter(m => m.status === "ACTIVE").length,
    rum:        members.filter(m => m.role === "RUM").length,
    leaders:    members.filter(m => m.role === "LEADER").length,
    pasteurs:   members.filter(m => m.role === "PASTEUR").length,
    responsables: members.filter(m => m.role === "RESPONSABLE").length,
    cartes:     members.reduce((s, m) => s + Number(m.beneficiary_count || 0), 0),
    adhesions:  members.reduce((s, m) => s + Number(m.membership_fee || 0), 0),
    commissions: members.reduce((s, m) => s + Number(m.commissions_total || m.total_payments_eur || 0), 0),
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

  const TABS = [
    { id:"members",    label:"👥 Membres",       count:stats.total   },
    { id:"hierarchy",  label:"🏛️ Hiérarchie",    count:null          },
    { id:"commissions",label:"💰 Commissions",   count:null          },
  ];

  return (
    <div style={{ padding:"24px 20px", maxWidth:1100, margin:"0 auto" }}>

      {/* En-tête */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ margin:0, fontSize:24, fontWeight:900, color:C.dark }}>⛪ Réseau Fédération</h1>
        <p style={{ margin:"4px 0 0", color:C.slate, fontSize:14 }}>
          RUM → Leader → Pasteur → Responsable → Client
        </p>
      </div>

      {/* Comptes en attente de validation */}
      <PendingValidationSection members={members} onValidate={handleValidate} />

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(150px,1fr))", gap:12, marginBottom:24 }}>
        {[
          { icon:"👥", label:"Total",         value:stats.total,        color:C.purple, bg:C.purpleL, isText:false },
          { icon:"✅", label:"Actifs",        value:stats.actifs,       color:C.green,  bg:C.greenL,  isText:false },
          { icon:"👑", label:"RUM",           value:stats.rum,          color:C.purple, bg:C.purpleL, isText:false },
          { icon:"⭐", label:"Leaders",       value:stats.leaders,      color:C.blue,   bg:C.blueL,   isText:false },
          { icon:"⛪", label:"Pasteurs",      value:stats.pasteurs,     color:C.teal,   bg:C.tealL,   isText:false },
          { icon:"🤝", label:"Responsables",  value:stats.responsables, color:C.gold,   bg:C.goldL,   isText:false },
          { icon:"🎴", label:"Cartes",        value:stats.cartes,       color:C.teal,   bg:C.tealL,   isText:false },
          { icon:"💳", label:"Adhésions FCFA",value:`${fmt(stats.adhesions)} FCFA`, color:C.purple, bg:C.purpleL, isText:true },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:"14px 16px", border:`1px solid ${s.color}22` }}>
            <span style={{ fontSize:20 }}>{s.icon}</span>
            <p style={{ margin:"8px 0 2px", fontSize:s.isText?12:22, fontWeight:900, color:s.color }}>
              {s.isText ? s.value : fmt(s.value)}
            </p>
            <p style={{ margin:0, fontSize:11, color:C.slate, fontWeight:600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, background:C.bg, borderRadius:12, padding:4, marginBottom:20, width:"fit-content" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:"8px 18px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:600, transition:"all .2s",
              background:tab===t.id?"#fff":"transparent", color:tab===t.id?C.purple:C.slate,
              boxShadow:tab===t.id?"0 1px 4px rgba(0,0,0,.08)":"none" }}>
            {t.label}{t.count !== null ? ` (${t.count})` : ""}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background:C.redL, color:C.red, padding:"12px 16px", borderRadius:10, marginBottom:16 }}>⚠️ {error}</div>
      )}

      {/* ══ TAB : Membres ══ */}
      {tab === "members" && (
        <>
          {/* Filtres */}
          <div style={{ background:"#fff", borderRadius:12, border:`1px solid ${C.border}`, padding:"14px 16px", marginBottom:16, display:"flex", gap:10, flexWrap:"wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Nom, email, username, code…"
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
            <button onClick={fetchMembers}
              style={{ padding:"8px 16px", borderRadius:8, border:`1.5px solid ${C.border}`, background:"#fff", color:C.slate, fontWeight:700, fontSize:12, cursor:"pointer" }}>
              🔄 Actualiser
            </button>
          </div>

          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:60 }}>
              <div style={{ width:40, height:40, border:`3px solid ${C.purpleL}`, borderTop:`3px solid ${C.purple}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, overflow:"hidden" }}>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ background:C.bg }}>
                      {["Membre","Rôle","Plan","Statut","Cartes","Adhésion","Paiement","Inscrit le","Actions"].map(h => (
                        <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontWeight:700, color:C.slate, fontSize:11, textTransform:"uppercase", letterSpacing:.5, whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(m => (
                      <tr key={m.id} style={{ borderTop:`1px solid ${C.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background=C.bg}
                        onMouseLeave={e => e.currentTarget.style.background="#fff"}>
                        <td style={{ padding:"12px 12px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:32, height:32, borderRadius:8, background:ROLE_CONFIG[m.role]?.bg||C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
                              {ROLE_CONFIG[m.role]?.icon||"👤"}
                            </div>
                            <div>
                              <p style={{ margin:0, fontWeight:700, color:C.dark }}>{m.name}</p>
                              <p style={{ margin:0, fontSize:11, color:C.slate }}>@{m.username||"—"} • {m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"12px 12px" }}><RoleBadge role={m.role} /></td>
                        <td style={{ padding:"12px 12px" }}><PlanBadge plan={m.plan} /></td>
                        <td style={{ padding:"12px 12px" }}><StatusBadge status={m.status} /></td>
                        <td style={{ padding:"12px 12px", fontWeight:700, color:C.teal }}>{m.beneficiary_count||0}</td>
                        <td style={{ padding:"12px 12px", fontWeight:700, color:C.purple }}>{m.membership_fee ? `${fmt(m.membership_fee)} F` : "—"}</td>
                        <td style={{ padding:"12px 12px", fontSize:11, color:C.slate }}>{m.membership_payment_method||"—"}</td>
                        <td style={{ padding:"12px 12px", fontSize:11, color:C.slate }}>{fmtDate(m.created_at)}</td>
                        <td style={{ padding:"12px 12px" }}>
                          <button onClick={() => setSelected(m)}
                            style={{ padding:"6px 14px", borderRadius:8, border:`1.5px solid ${C.purpleL}`, background:C.purpleL, color:C.purple, fontWeight:700, fontSize:12, cursor:"pointer" }}>
                            Détail
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ textAlign:"center", padding:40, color:C.slate }}>
                          Aucun membre trouvé avec ces critères.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {!loading && (
            <p style={{ marginTop:12, textAlign:"center", color:C.slate, fontSize:12 }}>
              {filtered.length} membre(s) sur {members.length} au total
            </p>
          )}
        </>
      )}

      {/* ══ TAB : Hiérarchie ══ */}
      {tab === "hierarchy" && (
        <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, padding:"24px 20px" }}>
          <p style={{ margin:"0 0 20px", fontWeight:800, color:C.dark, fontSize:15 }}>🏛️ Organigramme Fédération</p>

          {/* Schéma visuel */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:0, marginBottom:28 }}>
            {Object.entries(ROLE_CONFIG).map(([key, cfg], i) => {
              const ambs = members.filter(m => m.role === key);
              return (
                <div key={key} style={{ display:"flex", flexDirection:"column", alignItems:"center", width:"100%" }}>
                  {i > 0 && <div style={{ width:2, height:20, background:C.border }} />}
                  <div style={{ background:cfg.bg, border:`2px solid ${cfg.color}44`, borderRadius:12, padding:"12px 20px", textAlign:"center", minWidth:220 }}>
                    <span style={{ fontSize:22 }}>{cfg.icon}</span>
                    <p style={{ margin:"4px 0 2px", fontWeight:800, fontSize:14, color:cfg.color }}>{cfg.label}</p>
                    <p style={{ margin:0, fontSize:12, color:C.slate }}>{ambs.length} membre(s)</p>
                    <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap", marginTop:8 }}>
                      {ambs.slice(0,6).map(m => (
                        <span key={m.id} onClick={() => setSelected(m)}
                          style={{ fontSize:11, background:cfg.color, color:"#fff", padding:"2px 10px", borderRadius:999, cursor:"pointer", fontWeight:600 }}>
                          {m.name.split(" ")[0]}
                        </span>
                      ))}
                      {ambs.length > 6 && (
                        <span style={{ fontSize:11, color:cfg.color, fontWeight:600 }}>+{ambs.length-6}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{ width:2, height:20, background:C.border }} />
            <div style={{ background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:12, padding:"10px 20px", textAlign:"center", minWidth:180 }}>
              <p style={{ margin:0, fontSize:20 }}>👤</p>
              <p style={{ margin:"4px 0 2px", fontWeight:800, fontSize:13, color:C.slate }}>Clients</p>
              <p style={{ margin:0, fontSize:12, color:C.slate }}>{fmt(stats.cartes)} carte(s)</p>
            </div>
          </div>

          {/* Vue arborescente */}
          <p style={{ margin:"0 0 12px", fontSize:12, fontWeight:700, color:C.slate, textTransform:"uppercase", letterSpacing:.5 }}>Vue arborescente</p>
          {members.map(m => {
            const rc = ROLE_CONFIG[m.role];
            const indent = { RUM:0, LEADER:1, PASTEUR:2, RESPONSABLE:3 }[m.role] || 0;
            return (
              <div key={m.id} onClick={() => setSelected(m)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", marginLeft:indent*24, borderRadius:10, cursor:"pointer", marginBottom:4, border:`1px solid ${rc?.color||C.border}22`, background:rc?.bg||C.bg }}
                onMouseEnter={e => e.currentTarget.style.opacity=".85"}
                onMouseLeave={e => e.currentTarget.style.opacity="1"}>
                {indent > 0 && <span style={{ color:C.border, fontSize:16, flexShrink:0 }}>└─</span>}
                <span style={{ fontSize:16 }}>{rc?.icon||"👤"}</span>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontWeight:700, fontSize:13, color:C.dark }}>{m.name}</p>
                  <p style={{ margin:0, fontSize:11, color:C.slate }}>@{m.username||"—"}{m.parent_name ? ` ↳ ${m.parent_name}` : ""}</p>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <PlanBadge plan={m.plan} />
                  <StatusBadge status={m.status} />
                  <span style={{ fontSize:11, color:C.slate }}>{m.recruit_count||0} recrutés →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ TAB : Commissions ══ */}
      {tab === "commissions" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Règles */}
          <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, padding:"20px 24px" }}>
            <p style={{ margin:"0 0 14px", fontWeight:800, color:C.dark, fontSize:15 }}>📐 Règles de calcul</p>
            <div style={{ background:C.purpleL, borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
              <p style={{ margin:0, fontSize:13, color:C.purple, fontWeight:700 }}>Base = 50% de la prime encaissée</p>
              <p style={{ margin:"4px 0 0", fontSize:12, color:C.slate }}>Exemple : prime de 100 € → base de 50 €</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))", gap:12 }}>
              {COMMISSION_RATES.map(r => (
                <div key={r.type} style={{ background:C.bg, borderRadius:10, padding:"14px 16px", border:`1px solid ${r.color}22` }}>
                  <p style={{ margin:"0 0 4px", fontSize:11, fontWeight:700, color:C.slate, textTransform:"uppercase", letterSpacing:.5 }}>{r.type}</p>
                  <p style={{ margin:"0 0 4px", fontSize:18, fontWeight:900, color:r.color }}>{r.rate}%</p>
                  <p style={{ margin:0, fontSize:12, color:C.dark, fontWeight:600 }}>{r.label}</p>
                  <p style={{ margin:"4px 0 0", fontSize:11, color:C.slate }}>100€ prime → {(50*r.rate/100).toFixed(2)} €</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tableau commissions */}
          <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, padding:"20px 24px" }}>
            <p style={{ margin:"0 0 14px", fontWeight:800, color:C.dark, fontSize:15 }}>💰 Commissions par membre</p>
            {loading ? (
              <div style={{ textAlign:"center", padding:30, color:C.slate }}>Chargement…</div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ background:C.bg }}>
                      {["Membre","Rôle","Plan","Ce mois (€)","Total (€)","En attente"].map(h => (
                        <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontWeight:700, color:C.slate, fontSize:11, textTransform:"uppercase", letterSpacing:.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members
                      .filter(m => m.commissions_month > 0 || m.commissions_total > 0)
                      .sort((a,b) => Number(b.commissions_month||0) - Number(a.commissions_month||0))
                      .map(m => (
                        <tr key={m.id} style={{ borderTop:`1px solid ${C.border}` }}>
                          <td style={{ padding:"12px 12px", fontWeight:700, color:C.dark }}>{m.name}</td>
                          <td style={{ padding:"12px 12px" }}><RoleBadge role={m.role} /></td>
                          <td style={{ padding:"12px 12px" }}><PlanBadge plan={m.plan} /></td>
                          <td style={{ padding:"12px 12px", fontWeight:800, color:C.gold }}>{fmt(m.commissions_month || 0)} €</td>
                          <td style={{ padding:"12px 12px", fontWeight:700, color:C.green }}>{fmt(m.commissions_total || 0)} €</td>
                          <td style={{ padding:"12px 12px" }}>
                            <span style={{ background:C.goldL, color:C.gold, padding:"3px 10px", borderRadius:999, fontSize:11, fontWeight:700 }}>
                              {fmt(Math.round(Number(m.commissions_month||0) * 0.3))} €
                            </span>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
                {members.filter(m => m.commissions_month > 0 || m.commissions_total > 0).length === 0 && (
                  <p style={{ textAlign:"center", padding:"32px", color:C.slate, fontSize:13 }}>Aucune commission enregistrée pour le moment.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal détail */}
      <DetailModal amb={selected} onClose={() => setSelected(null)} onToggleStatus={toggleStatus} />
    </div>
  );
}
