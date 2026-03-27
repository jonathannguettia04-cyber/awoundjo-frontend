// src/pages/admin/AdminDiaspora.jsx
// ─────────────────────────────────────────────────────────────
//  Vue admin : réseau DIASPORA
//  Rôles réels : AMBASSADEUR_DIASPORA → AMBASSADEUR_PAYS → RECRUTEUR
//  API réelle — plus de données mock
//  Affiche : plan, membership_fee, membership_transaction_id, membership_payment_method
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
  ACTIVE:    { label:"Actif",      color:C.green, bg:C.greenL },
  SUSPENDED: { label:"Suspendu",   color:C.red,   bg:C.redL   },
  PENDING:   { label:"En attente", color:C.gold,  bg:C.goldL  },
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

export default function AdminDiaspora() {
  const [ambassadors, setAmbassadors] = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [search, setSearch]           = useState("");
  const [roleFilter, setRoleFilter]   = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected]       = useState(null);

  const stats = {
    total:      ambassadors.length,
    actifs:     ambassadors.filter(a => a.status === "ACTIVE").length,
    cartes:     ambassadors.reduce((s, a) => s + Number(a.beneficiary_count || 0), 0),
    adhesions:  ambassadors.reduce((s, a) => s + Number(a.membership_fee || 0), 0),
    diaspora:   ambassadors.filter(a => a.role === "AMBASSADEUR_DIASPORA").length,
    pays:       ambassadors.filter(a => a.role === "AMBASSADEUR_PAYS").length,
    recruteurs: ambassadors.filter(a => a.role === "RECRUTEUR").length,
  };

  useEffect(() => { fetchAmbassadors(); }, []);

  useEffect(() => {
    let list = ambassadors;
    if (roleFilter !== "ALL")   list = list.filter(a => a.role === roleFilter);
    if (statusFilter !== "ALL") list = list.filter(a => a.status === statusFilter);
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
  }, [ambassadors, search, roleFilter, statusFilter]);

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

  async function toggleStatus(amb, e) {
    e.stopPropagation();
    const newStatus = amb.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await axios.put(`${API}/api/diaspora/admin/ambassadors/${amb.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${agentToken()}` } }
      );
      fetchAmbassadors();
      setSelected(null);
    } catch (err) {
      alert(err.response?.data?.error || "Erreur mise à jour statut");
    }
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
          { icon:"👥", label:"Total",           value:stats.total,      color:C.blue,   bg:C.blueL,   isText:false },
          { icon:"✅", label:"Actifs",          value:stats.actifs,     color:C.green,  bg:C.greenL,  isText:false },
          { icon:"🌍", label:"Diaspora",        value:stats.diaspora,   color:C.blue,   bg:C.blueL,   isText:false },
          { icon:"🗺️", label:"Pays",            value:stats.pays,       color:C.green,  bg:C.greenL,  isText:false },
          { icon:"🤝", label:"Recruteurs",      value:stats.recruteurs, color:C.gold,   bg:C.goldL,   isText:false },
          { icon:"🎴", label:"Cartes",          value:stats.cartes,     color:C.teal,   bg:C.tealL,   isText:false },
          { icon:"💳", label:"Adhésions FCFA",  value:`${fmt(stats.adhesions)} FCFA`, color:C.purple, bg:C.purpleL, isText:true },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:"14px 16px", border:`1px solid ${s.color}22` }}>
            <span style={{ fontSize:20 }}>{s.icon}</span>
            <p style={{ margin:"8px 0 2px", fontSize:s.isText?13:22, fontWeight:900, color:s.color }}>
              {s.isText ? s.value : fmt(s.value)}
            </p>
            <p style={{ margin:0, fontSize:11, color:C.slate, fontWeight:600 }}>{s.label}</p>
          </div>
        ))}
      </div>

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
                    <div style={{ textAlign:"center" }}>
                      <p style={{ margin:0, fontWeight:800, color:C.purple, fontSize:13 }}>
                        {amb.membership_fee ? `${fmt(amb.membership_fee)} F` : "—"}
                      </p>
                      <p style={{ margin:0, fontSize:10, color:C.slate }}>Adhésion</p>
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
                        { label:"Transaction ID",       value: amb.membership_transaction_id || "—"    },
                        { label:"Téléphone",            value: amb.phone || "—"                        },
                        { label:"Dernière connexion",   value: fmtDate(amb.last_login)                 },
                      ].map(item => (
                        <div key={item.label} style={{ background:C.bg, borderRadius:8, padding:"10px 12px" }}>
                          <p style={{ margin:0, fontSize:10, color:C.slate, fontWeight:600 }}>{item.label}</p>
                          <p style={{ margin:"3px 0 0", fontSize:12, fontWeight:700, color:C.dark, wordBreak:"break-all" }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:10 }}>
                      <button onClick={e => toggleStatus(amb, e)}
                        style={{ padding:"8px 16px", borderRadius:8, border:`1.5px solid ${amb.status==="ACTIVE"?C.red:C.green}`, background:"#fff", color:amb.status==="ACTIVE"?C.red:C.green, fontWeight:700, fontSize:12, cursor:"pointer" }}>
                        {amb.status === "ACTIVE" ? "🚫 Suspendre" : "✅ Réactiver"}
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
    </div>
  );
}
