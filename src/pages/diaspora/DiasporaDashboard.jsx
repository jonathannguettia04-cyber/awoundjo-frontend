// src/pages/diaspora/DiasporaDashboard.jsx
// ─────────────────────────────────────────────────────────────
//  Dashboard + Layout pour le réseau DIASPORA
//
//  Hiérarchie :
//    AMBASSADEUR_DIASPORA → crée Ambassadeurs Pays + RUM
//    AMBASSADEUR_PAYS     → crée Recruteurs
//    RECRUTEUR            → crée Clients + vend cartes
//    TOUT LE MONDE        → peut créer des clients finaux
//
//  Commissions par rôle :
//    AMBASSADEUR_DIASPORA : commissions sur toute la chaîne (Amb.Pays + Recruteurs + Clients)
//    AMBASSADEUR_PAYS     : commissions sur ses Recruteurs + Clients du réseau
//    RECRUTEUR            : commissions directes sur ses Clients
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  diasporaDashAPI,
  diasporaRefAPI,
  diasporaCommAPI,
  diasporaBeneAPI,
  getDiasporaData,
} from "../../diasporaApi";
import { usePlans, planIcon } from "../../hooks/usePlans";

export function refreshDiasporaDashboard() {
  window.dispatchEvent(new CustomEvent("diaspora:refresh"));
}

const C = {
  blue:    "#1B4FD8", blueL:  "#EEF2FF",
  green:   "#059669", greenL: "#ECFDF5",
  gold:    "#D97706", goldL:  "#FFFBEB",
  red:     "#DC2626", redL:   "#FEF2F2",
  purple:  "#7C3AED", purpleL:"#F5F3FF",
  teal:    "#0D9488", tealL:  "#F0FDFA",
  slate:   "#64748B", dark:   "#0F172A",
  border:  "#E2E8F0", bg:     "#F8FAFC",
};

const fmt = (n) =>
  Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 });




// ── Labels des sources de commission par rôle ─────────────────
// AMBASSADEUR_DIASPORA touche sur Amb.Pays, Recruteurs, Clients
// AMBASSADEUR_PAYS     touche sur Recruteurs, Clients
// RECRUTEUR            touche uniquement sur ses Clients directs
const SOURCE_LABELS = {
  AMBASSADEUR_PAYS:     { label:"Ambassadeur Pays", icon:"🗺️", color:"#059669" },
  AMBASSADEUR_DIASPORA: { label:"Amb. Diaspora",    icon:"🌍", color:"#1B4FD8" },
  RECRUTEUR:            { label:"Recruteur",        icon:"🤝", color:"#D97706" },
  CLIENT:               { label:"Client final",     icon:"👤", color:"#0D9488" },
  direct:               { label:"Direct",           icon:"✅", color:"#059669" },
  reseau:               { label:"Réseau",           icon:"🌐", color:"#1B4FD8" },
};

// ── Formulaire création client inline ────────────────────────
// Disponible pour TOUS les rôles
function CreateClientInline({ onSuccess, onCancel }) {
  const { plans, plansLoading } = usePlans();
  const [form, setForm]     = useState({ name:"", phone:"", city:"", plan:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (plans.length && !form.plan) {
      setForm(f => ({ ...f, plan: plans[0].slug.toUpperCase() }));
    }
  }, [plans]);

  async function submit() {
    if (!form.name.trim()) return setError("Le nom est requis");
    setLoading(true); setError("");
    try {
      const { data } = await diasporaBeneAPI.create(form);
      onSuccess?.(data);
    } catch(e) {
      setError(e.response?.data?.error || "Erreur lors de la création");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ background:"#fff", borderRadius:14, border:`1.5px solid #1B4FD833`, padding:"20px 22px", marginBottom:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <p style={{ margin:0, fontWeight:800, fontSize:15, color:C.dark }}>👤 Créer un client final</p>
        <button onClick={onCancel} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:C.slate }}>✕</button>
      </div>
      {error && <div style={{ background:C.redL, color:C.red, padding:"10px 14px", borderRadius:8, marginBottom:14, fontSize:13 }}>⚠️ {error}</div>}
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {[
          { key:"name",  label:"Nom complet *",      placeholder:"Jean Dupont",         type:"text" },
          { key:"phone", label:"Téléphone WhatsApp", placeholder:"+225 07 00 00 00 00", type:"tel"  },
          { key:"city",  label:"Ville",              placeholder:"Abidjan",             type:"text" },
        ].map(f => (
          <div key={f.key}>
            <label style={{ display:"block", fontSize:12, fontWeight:700, color:C.dark, marginBottom:5 }}>{f.label}</label>
            <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              style={{ width:"100%", padding:"9px 13px", borderRadius:8, fontSize:13, border:`1.5px solid ${C.border}`, outline:"none", boxSizing:"border-box" }} />
          </div>
        ))}
        <div>
          <label style={{ display:"block", fontSize:12, fontWeight:700, color:C.dark, marginBottom:8 }}>Offre *</label>
          {plansLoading ? (
            <p style={{ fontSize:12, color:C.slate }}>Chargement des formules…</p>
          ) : (
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {plans.map(p => {
                const slug = p.slug.toUpperCase();
                return (
                  <div key={slug} onClick={() => setForm(f => ({ ...f, plan: slug }))}
                    style={{ flex:1, minWidth:100, padding:"10px 12px", borderRadius:10, cursor:"pointer",
                      border:`2px solid ${form.plan===slug?C.blue:C.border}`,
                      background:form.plan===slug?C.blueL:C.bg }}>
                    <p style={{ margin:0, fontWeight:700, fontSize:12, color:form.plan===slug?C.blue:C.dark }}>{planIcon(slug)} {p.name}</p>
                    <p style={{ margin:"2px 0 0", fontSize:11, color:C.slate }}>{Number(p.monthly_price).toLocaleString("fr-FR")} FCFA/mois</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <button onClick={submit} disabled={loading}
          style={{ padding:"10px 18px", background:C.blue, color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1 }}>
          {loading ? "Enregistrement…" : "✅ Créer le client"}
        </button>
      </div>
    </div>
  );
}

// ── Bannière succès après création client ─────────────────────
function ClientCreatedBanner({ result, onClose }) {
  const creds = result?.credentials;
  const [copied, setCopied] = useState(false);
  const text = `Client Awoundjô\nNuméro mutualiste : ${creds?.mutual_number}\nMot de passe temporaire : ${creds?.temp_password}`;
  return (
    <div style={{ background:C.greenL, border:`1.5px solid #05966944`, borderRadius:14, padding:"18px 20px", marginBottom:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <p style={{ margin:0, fontWeight:800, color:C.green, fontSize:15 }}>✅ Client créé — en attente de validation</p>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.slate, fontSize:16 }}>✕</button>
      </div>
      <div style={{ background:"#fff", borderRadius:10, padding:"12px 16px", marginBottom:12 }}>
        {[
          { label:"Numéro mutualiste", value: creds?.mutual_number },
          { label:"Mot de passe temp.", value: creds?.temp_password },
        ].map(r => (
          <div key={r.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:12, color:C.slate }}>{r.label}</span>
            <span style={{ fontFamily:"monospace", fontWeight:800, fontSize:13 }}>{r.value}</span>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
          style={{ padding:"8px 16px", borderRadius:8, border:`1.5px solid ${C.green}`, background:C.greenL, color:C.green, fontWeight:700, fontSize:12, cursor:"pointer" }}>
          {copied ? "✅ Copié !" : "📋 Copier"}
        </button>
        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer"
          style={{ padding:"8px 16px", borderRadius:8, background:"#25D366", color:"#fff", fontWeight:700, fontSize:12, textDecoration:"none" }}>
          📱 WhatsApp
        </a>
      </div>
    </div>
  );
}

// ── Config rôles Diaspora ─────────────────────────────────────
const ROLE_CONFIG = {
  AMBASSADEUR_DIASPORA: { label:"Ambassadeur Diaspora", icon:"🌍", color:C.blue,   bg:C.blueL,   level:1 },
  AMBASSADEUR_PAYS:     { label:"Ambassadeur Pays",     icon:"🗺️", color:C.green,  bg:C.greenL,  level:2 },
  RECRUTEUR:            { label:"Recruteur",            icon:"🤝", color:C.gold,   bg:C.goldL,   level:3 },
};

// ── Navigation dynamique par rôle ────────────────────────────
function getNavItems(role) {
  const base = [
    { path:"/diaspora/dashboard", icon:"🏠", label:"Accueil" },
    { path:"/diaspora/network",   icon:"🌐", label:"Mon réseau" },
  ];

  if (role === "AMBASSADEUR_DIASPORA") {
    // Crée Ambassadeurs Pays + RUM uniquement (ne crée plus de clients directs)
    base.push({ path:"/diaspora/register-pays",     icon:"🗺️", label:"Mes Ambassadeurs Pays" });
    base.push({ path:"/diaspora/register-pays/new", icon:"➕", label:"Enregistrer Amb. Pays"  });
    base.push({ path:"/diaspora/register-rum",      icon:"👑", label:"Mes RUM"                });
    base.push({ path:"/diaspora/register-rum/new",  icon:"➕", label:"Enregistrer RUM"         });
  } else if (role === "AMBASSADEUR_PAYS") {
    // Crée Recruteurs uniquement (ne crée plus de clients directs)
    base.push({ path:"/diaspora/register-recruiter",     icon:"🤝", label:"Mes Recruteurs"       });
    base.push({ path:"/diaspora/register-recruiter/new", icon:"➕", label:"Enregistrer Recruteur" });
  } else {
    // RECRUTEUR — crée Clients + vend cartes
    base.push({ path:"/diaspora/clients",     icon:"👤", label:"Mes clients"          });
    base.push({ path:"/diaspora/clients/new", icon:"➕", label:"Enregistrer client"   });
    base.push({ path:"/diaspora/cards",       icon:"💳", label:"Cartes vendues"       });
  }

  base.push(
    { path:"/diaspora/payments",      icon:"💰", label:"Paiements"      },
    { path:"/diaspora/earnings",      icon:"📊", label:"Mes gains"      },
    { path:"/diaspora/rewards",       icon:"🏆", label:"Récompenses"    },
    { path:"/diaspora/referral",      icon:"🔗", label:"Parrainage"     },
    { path:"/diaspora/leaderboard",   icon:"🏅", label:"Classement"     },
    { path:"/diaspora/notifications", icon:"🔔", label:"Notifications"  },
    { path:"/diaspora/profile",       icon:"👤", label:"Mon profil"     },
  );
  return base;
}

// ── DiasporaLayout ────────────────────────────────────────────
export function DiasporaLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread]         = useState(0);
  const amb  = getDiasporaData();
  const role = amb?.role || "RECRUTEUR";
  const rc   = ROLE_CONFIG[role] || ROLE_CONFIG.RECRUTEUR;
  const NAV  = getNavItems(role);

  useEffect(() => {
    import("../../diasporaApi").then(({ diasporaNotifAPI }) => {
      diasporaNotifAPI.getAll().then(r => {
        setUnread(r.data?.unread_count || 0);
      }).catch(() => {});
    });
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("diaspora_token");
    localStorage.removeItem("diaspora_data");
    navigate("/diaspora/login");
  };

  const isActive = (path) => location.pathname === path;

  const SidebarContent = () => (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"20px 20px 16px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg, #1B4FD8, #3B82F6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🌍</div>
          <div>
            <p style={{ margin:0, fontWeight:900, fontSize:15, color:C.dark }}>Awoundjô</p>
            <p style={{ margin:0, fontSize:10, color:C.slate, fontWeight:600 }}>DIASPORA</p>
          </div>
        </div>
        {amb && (
          <div style={{ marginTop:14, padding:"10px 12px", background:rc.bg, borderRadius:10 }}>
            <p style={{ margin:0, fontWeight:800, fontSize:13, color:C.dark }}>{amb.name}</p>
            <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, marginTop:4, display:"inline-block", background:"rgba(255,255,255,.6)", color:rc.color }}>
              {rc.icon} {rc.label}
            </span>
            <div style={{ marginTop:8, display:"flex", gap:4 }}>
              {[1,2,3].map(l => (
                <div key={l} style={{ flex:1, height:4, borderRadius:2, background:l <= rc.level ? rc.color : C.border }} />
              ))}
            </div>
            <p style={{ margin:"4px 0 0", fontSize:9, color:C.slate }}>Niveau {rc.level}/3 dans la hiérarchie</p>
          </div>
        )}
      </div>
      <nav style={{ flex:1, padding:"12px 12px", overflowY:"auto" }}>
        {NAV.map(item => {
          const active = isActive(item.path);
          return (
            <button key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              style={{
                width:"100%", display:"flex", alignItems:"center", gap:10,
                padding:"9px 12px", borderRadius:8, border:"none",
                background: active ? C.blue : "transparent",
                color:      active ? "#fff" : C.slate,
                fontWeight: active ? 700 : 500, fontSize:13,
                cursor:"pointer", marginBottom:2, textAlign:"left",
                transition:"all 0.15s", position:"relative",
              }}>
              <span style={{ fontSize:16 }}>{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
              {item.path === "/diaspora/notifications" && unread > 0 && (
                <span style={{ background:C.red, color:"#fff", fontSize:10, fontWeight:800, padding:"1px 6px", borderRadius:999, minWidth:18, textAlign:"center" }}>{unread}</span>
              )}
            </button>
          );
        })}
      </nav>
      <div style={{ padding:"12px 12px", borderTop:`1px solid ${C.border}` }}>
        <button onClick={logout}
          style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, background:"#fff", color:C.red, fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg }}>
      <style>{`
        @media (min-width:768px) { .diaspora-sidebar { display: block !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <aside style={{ width:240, flexShrink:0, background:"#fff", borderRight:`1px solid ${C.border}`, position:"sticky", top:0, height:"100vh", overflowY:"auto", display:"none" }}
        className="diaspora-sidebar">
        <SidebarContent />
      </aside>
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:40 }} />
      )}
      <aside style={{ position:"fixed", top:0, left:mobileOpen ? 0 : -280, width:260, height:"100vh", background:"#fff", borderRight:`1px solid ${C.border}`, zIndex:50, transition:"left 0.25s ease", overflowY:"auto" }}>
        <SidebarContent />
      </aside>
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        <header style={{ background:"#fff", borderBottom:`1px solid ${C.border}`, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:30 }}>
          <button onClick={() => setMobileOpen(true)} style={{ border:"none", background:"none", fontSize:22, cursor:"pointer", color:C.dark }}>☰</button>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#1B4FD8,#3B82F6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🌍</div>
            <span style={{ fontWeight:900, fontSize:14, color:C.dark }}>Awoundjô Diaspora</span>
          </div>
          <button onClick={() => navigate("/diaspora/notifications")}
            style={{ border:"none", background:"none", cursor:"pointer", position:"relative" }}>
            🔔
            {unread > 0 && (
              <span style={{ position:"absolute", top:-4, right:-4, background:C.red, color:"#fff", fontSize:9, fontWeight:800, padding:"1px 4px", borderRadius:999 }}>{unread}</span>
            )}
          </button>
        </header>
        <main style={{ flex:1, overflowY:"auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ── DiasporaDashboard (page Accueil) ──────────────────────────
export default function DiasporaDashboard() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [stats,       setStats]       = useState(null);
  const [link,        setLink]        = useState(null);
  const [commissions, setCommissions] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [copied,      setCopied]      = useState(false);
  const [showCreateClient,  setShowCreateClient]  = useState(false);
  const [clientResult,      setClientResult]      = useState(null);

  const amb  = getDiasporaData();
  const role = amb?.role || "RECRUTEUR";
  const rc   = ROLE_CONFIG[role] || ROLE_CONFIG.RECRUTEUR;

  function fetchStats() {
    setLoading(true);
    Promise.all([
      diasporaDashAPI.getStats(),
      diasporaRefAPI.getLink(),
      diasporaCommAPI.getAll().catch(() => ({ data: null })),
    ]).then(([s, l, c]) => {
      setStats(s.data);
      setLink(l.data);
      setCommissions(c.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { fetchStats(); }, [location.pathname]);
  useEffect(() => {
    window.addEventListener("diaspora:refresh", fetchStats);
    return () => window.removeEventListener("diaspora:refresh", fetchStats);
  }, []);

  function copyLink() {
    if (link?.link) navigator.clipboard.writeText(link.link).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── KPI cards — chaque rôle voit CE QU'IL GÈRE ──────────────
  //
  // AMBASSADEUR_DIASPORA : nb Amb.Pays créés + nb RUM créés + total réseau + commissions chaîne complète
  // AMBASSADEUR_PAYS     : nb Recruteurs créés + total réseau + commissions sur Recruteurs + Clients
  // RECRUTEUR            : nb Clients directs + cartes vendues + commissions directes uniquement
  const statCards = stats ? [
    ...(role === "AMBASSADEUR_DIASPORA" ? [
      {
        icon:"🗺️", label:"Ambassadeurs Pays", color:C.blue,   bg:C.blueL,
        value: stats.referrals_pays ?? stats.ambassadors_pays_count ?? 0,
        sub:   "Recrutés par vous",
        path:  "/diaspora/register-pays",
      },
      {
        icon:"👑", label:"RUM créés", color:C.purple, bg:C.purpleL,
        value: stats.referrals_rum ?? stats.rum_count ?? 0,
        sub:   "Réseau Parrainage",
        path:  "/diaspora/register-rum",
      },
      {
        icon:"🌐", label:"Total réseau", color:C.teal, bg:C.tealL,
        value: stats.network_size ?? stats.total_network ?? 0,
        sub:   "Tous niveaux confondus",
        path:  "/diaspora/network",
      },
    ] : role === "AMBASSADEUR_PAYS" ? [
      {
        icon:"🤝", label:"Mes Recruteurs", color:C.blue,  bg:C.blueL,
        value: stats.referrals ?? stats.direct_recruits ?? 0,
        sub:   "Recruteurs sous vous",
        path:  "/diaspora/register-recruiter",
      },
      {
        icon:"🌐", label:"Total réseau", color:C.green, bg:C.greenL,
        value: stats.network_size ?? stats.total_network ?? 0,
        sub:   "Tous niveaux",
        path:  "/diaspora/network",
      },
    ] : [
      // RECRUTEUR
      {
        icon:"👤", label:"Clients enregistrés", color:C.blue, bg:C.blueL,
        value: stats.clients?.total ?? stats.total_clients ?? 0,
        sub:   `${stats.clients?.active ?? stats.active_clients ?? 0} actifs`,
        path:  "/diaspora/clients",
      },
      {
        icon:"💳", label:"Cartes vendues", color:C.green, bg:C.greenL,
        value: stats.cards_sold ?? stats.clients?.total ?? 0,
        sub:   "Toutes périodes",
        path:  "/diaspora/cards",
      },
    ]),
    // Commissions — présent pour TOUS les rôles
    {
      icon:"💰", label:"Commissions totales", color:C.gold, bg:C.goldL,
      value:    stats.commissions?.total_earned ?? stats.commissions?.total ?? stats.total_earned ?? 0,
      sub:      `${fmt(stats.commissions?.pending ?? stats.pending_commissions ?? 0)} en attente`,
      path:     "/diaspora/earnings",
      isAmount: true,
    },
    {
      icon:"🏆", label:"Récompenses", color:C.purple, bg:C.purpleL,
      value:  stats.rewards?.level ?? "—",
      sub:    stats.rewards?.unlocked ?? stats.rewards?.next_reward ?? "Continuez !",
      path:   "/diaspora/rewards",
      isText: true,
    },
  ] : [];

  // ── Actions rapides — chaque rôle a ses actions prioritaires ─
  // + bouton "Créer client final" pour TOUS
  const quickActions = role === "AMBASSADEUR_DIASPORA" ? [
    { icon:"🗺️", label:"Nouveau Amb. Pays",  path:"/diaspora/register-pays/new", color:C.blue   },
    { icon:"👑", label:"Nouveau RUM",         path:"/diaspora/register-rum/new",  color:C.purple },
    { icon:"📊", label:"Mes gains",           path:"/diaspora/earnings",          color:C.gold   },
    { icon:"🌐", label:"Mon réseau",          path:"/diaspora/network",           color:C.teal   },
  ] : role === "AMBASSADEUR_PAYS" ? [
    { icon:"🤝", label:"Nouveau Recruteur",   path:"/diaspora/register-recruiter/new", color:C.blue   },
    { icon:"🌐", label:"Mon réseau",          path:"/diaspora/network",                color:C.green  },
    { icon:"📊", label:"Mes gains",           path:"/diaspora/earnings",               color:C.gold   },
    { icon:"🏆", label:"Récompenses",         path:"/diaspora/rewards",                color:C.purple },
  ] : [
    // RECRUTEUR
    { icon:"➕", label:"Enregistrer client",  path:"/diaspora/clients/new",  color:C.blue   },
    { icon:"💳", label:"Vendre une carte",    path:"/diaspora/cards/new",    color:C.green  },
    { icon:"📊", label:"Mes gains",           path:"/diaspora/earnings",     color:C.gold   },
    { icon:"🏆", label:"Récompenses",         path:"/diaspora/rewards",      color:C.purple },
  ];

  if (loading) {
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:300 }}>
        <div style={{ width:40, height:40, border:`3px solid ${C.blueL}`, borderTop:`3px solid ${C.blue}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding:"20px 16px", maxWidth:960, margin:"0 auto" }}>

      {/* ── Bannière de bienvenue ── */}
      <div style={{
        background:"linear-gradient(135deg, #1B4FD8 0%, #3B82F6 100%)",
        borderRadius:16, padding:"20px 24px", marginBottom:24,
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16,
      }}>
        <div>
          <p style={{ margin:"0 0 4px", color:"rgba(255,255,255,0.75)", fontSize:12, fontWeight:600 }}>BONJOUR 👋</p>
          <h1 style={{ margin:"0 0 8px", color:"#fff", fontSize:22, fontWeight:900 }}>{amb?.name || "Ambassadeur"}</h1>
          <span style={{ background:rc.bg, color:rc.color, padding:"3px 12px", borderRadius:999, fontSize:11, fontWeight:700 }}>
            {rc.icon} {rc.label}
          </span>
        </div>
        <div style={{ textAlign:"right" }}>
          <p style={{ margin:"0 0 4px", color:"rgba(255,255,255,0.75)", fontSize:11, fontWeight:600 }}>GAINS EN ATTENTE</p>
          <p style={{ margin:0, color:"#fff", fontSize:28, fontWeight:900 }}>
            {fmt(stats?.commissions?.pending ?? stats?.pending_commissions ?? 0)} FCFA
          </p>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14, marginBottom:24 }}>
        {statCards.map(s => (
          <div key={s.label} onClick={() => navigate(s.path)}
            style={{ background:s.bg, borderRadius:14, border:`1px solid ${s.color}22`, padding:"16px 18px", cursor:"pointer", transition:"transform 0.15s, box-shadow 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 4px 20px ${s.color}33`; }}
            onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
              <span style={{ fontSize:26 }}>{s.icon}</span>
              <span style={{ fontSize:10, color:s.color, fontWeight:700 }}>Voir →</span>
            </div>
            <p style={{ margin:"10px 0 2px", fontSize:s.isText?20:28, fontWeight:900, color:s.color }}>
              {s.isText ? s.value : s.isAmount ? `${fmt(s.value)} FCFA` : fmt(s.value)}
            </p>
            <p style={{ margin:"0 0 2px", fontSize:12, fontWeight:700, color:C.dark }}>{s.label}</p>
            <p style={{ margin:0, fontSize:11, color:C.slate }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Lien ambassadeur ── */}
      {link && (
        <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, padding:"18px 20px", marginBottom:24 }}>
          <p style={{ margin:"0 0 12px", fontWeight:800, color:C.dark, fontSize:15 }}>🔗 Mon lien ambassadeur</p>
          <div style={{ background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:8, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, color:C.blue, fontWeight:600, wordBreak:"break-all", flex:1 }}>{link.link}</span>
            <span style={{ background:C.blueL, color:C.blue, padding:"3px 12px", borderRadius:999, fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>
              Code : {link.code}
            </span>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button onClick={copyLink}
              style={{ padding:"8px 18px", borderRadius:8, border:`1.5px solid ${C.blue}`, background:C.blueL, color:C.blue, fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              {copied ? "✅ Copié !" : "📋 Copier le lien"}
            </button>
            {link.whatsapp_message && (
              <a href={link.whatsapp_message} target="_blank" rel="noreferrer"
                style={{ padding:"8px 18px", borderRadius:8, border:"none", background:"#25D366", color:"#fff", fontWeight:700, fontSize:13, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:6 }}>
                📲 WhatsApp
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Actions rapides ── */}
      <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, padding:"18px 20px", marginBottom:24 }}>
        <p style={{ margin:"0 0 14px", fontWeight:800, color:C.dark, fontSize:15 }}>⚡ Actions rapides</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:10 }}>
          {quickActions.map(a => (
            <button key={a.path} onClick={() => navigate(a.path)}
              style={{ padding:"12px 10px", borderRadius:10, border:`2px solid ${a.color}22`, background:`${a.color}11`, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6, transition:"all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background=`${a.color}22`}
              onMouseLeave={e => e.currentTarget.style.background=`${a.color}11`}>
              <span style={{ fontSize:22 }}>{a.icon}</span>
              <span style={{ fontSize:11, fontWeight:700, color:a.color, textAlign:"center" }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Créer un client final — uniquement pour RECRUTEUR ── */}
      {role === "RECRUTEUR" && (
        clientResult ? (
          <ClientCreatedBanner result={clientResult} onClose={() => { setClientResult(null); fetchStats(); }} />
        ) : showCreateClient ? (
          <CreateClientInline
            onSuccess={r => { setClientResult(r); setShowCreateClient(false); }}
            onCancel={() => setShowCreateClient(false)}
          />
        ) : (
          <div style={{ marginBottom:24 }}>
            <button onClick={() => setShowCreateClient(true)}
              style={{ padding:"10px 20px", borderRadius:10, border:`2px solid ${C.blue}`, background:C.blueL, color:C.blue, fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
              👤 Créer un client final directement
            </button>
          </div>
        )
      )}

      {/* ── Commissions — section adaptée par rôle ──
          AMBASSADEUR_DIASPORA : voit les commissions sur TOUTE la chaîne (by_category)
          AMBASSADEUR_PAYS     : voit les commissions sur Recruteurs + Clients (by_source)
          RECRUTEUR            : voit uniquement ses commissions directes sur Clients
      ── */}
      {commissions && (
        <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, padding:"18px 20px", marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <p style={{ margin:0, fontWeight:800, color:C.dark, fontSize:15 }}>
              {role === "AMBASSADEUR_DIASPORA"
                ? "📈 Commissions — chaîne complète"
                : role === "AMBASSADEUR_PAYS"
                ? "📈 Commissions réseau"
                : "📈 Mes commissions directes"}
            </p>
            <button onClick={() => navigate("/diaspora/earnings")}
              style={{ background:"none", border:"none", fontSize:12, color:C.blue, fontWeight:700, cursor:"pointer" }}>
              Tout voir →
            </button>
          </div>

          {/* Totaux — communs à tous les rôles */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(120px, 1fr))", gap:10, marginBottom:20 }}>
            {[
              { label:"Total gagné", value:commissions.totals?.total_earned ?? 0, color:C.green  },
              { label:"En attente",  value:commissions.totals?.pending       ?? 0, color:C.gold   },
              { label:"Validé",      value:commissions.totals?.validated     ?? 0, color:C.blue   },
              { label:"Payé",        value:commissions.totals?.paid          ?? 0, color:C.purple },
              { label:"Ce mois",     value:commissions.totals?.this_month    ?? 0, color:C.teal   },
            ].map(s => (
              <div key={s.label} style={{ textAlign:"center", padding:"10px 8px", background:C.bg, borderRadius:10, border:`1px solid ${s.color}22` }}>
                <p style={{ margin:0, fontSize:15, fontWeight:900, color:s.color }}>{fmt(s.value)}</p>
                <p style={{ margin:"1px 0 0", fontSize:9, color:C.slate }}>FCFA</p>
                <p style={{ margin:"4px 0 0", fontSize:10, fontWeight:700, color:C.dark }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* AMBASSADEUR_DIASPORA : commissions groupées par catégorie (chaîne complète) */}
          {role === "AMBASSADEUR_DIASPORA" && commissions.by_category?.length > 0 && (
            <div>
              <p style={{ margin:"0 0 12px", fontSize:12, fontWeight:700, color:C.slate, textTransform:"uppercase", letterSpacing:.8 }}>
                Détail par niveau de la chaîne
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {commissions.by_category.map(cat => (
                  <div key={cat.key} style={{ background:C.bg, borderRadius:12, overflow:"hidden", border:`1px solid ${cat.color}22` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderBottom:`1px solid ${cat.color}22`, background:`${cat.color}08` }}>
                      <span style={{ fontSize:20 }}>{cat.icon}</span>
                      <div style={{ flex:1 }}>
                        <p style={{ margin:0, fontSize:13, fontWeight:800, color:C.dark }}>{cat.label}</p>
                        <p style={{ margin:"2px 0 0", fontSize:11, color:C.slate }}>{cat.count} commission(s)</p>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <p style={{ margin:0, fontWeight:900, fontSize:15, color:cat.color }}>{fmt(cat.total)} FCFA</p>
                        {cat.pending > 0 && (
                          <p style={{ margin:"2px 0 0", fontSize:10, color:C.gold }}>{fmt(cat.pending)} en attente</p>
                        )}
                      </div>
                    </div>
                    {cat.items?.slice(0, 3).map(c => {
                      const statusColor = c.status==="PAID" ? C.green : c.status==="VALIDATED" ? C.blue : C.gold;
                      const statusLabel = c.status==="PAID" ? "Payé" : c.status==="VALIDATED" ? "Validé" : "En attente";
                      return (
                        <div key={c.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 14px", borderBottom:`1px solid ${C.border}` }}>
                          <div>
                            <p style={{ margin:0, fontSize:12, fontWeight:700, color:C.dark }}>{c.beneficiary_name || c.source_user_name || "—"}</p>
                            <p style={{ margin:"1px 0 0", fontSize:10, color:C.slate }}>{c.rate_pct}% · {new Date(c.created_at).toLocaleDateString("fr-FR")}</p>
                          </div>
                          <div style={{ textAlign:"right" }}>
                            <p style={{ margin:0, fontWeight:800, fontSize:13, color:C.green }}>{fmt(c.amount)} FCFA</p>
                            <span style={{ fontSize:10, fontWeight:700, color:statusColor }}>{statusLabel}</span>
                          </div>
                        </div>
                      );
                    })}
                    {cat.items?.length > 3 && (
                      <div style={{ padding:"8px 14px", textAlign:"center" }}>
                        <button onClick={() => navigate("/diaspora/earnings")}
                          style={{ background:"none", border:"none", fontSize:11, color:C.blue, fontWeight:700, cursor:"pointer" }}>
                          +{cat.items.length - 3} de plus → Voir tout
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AMBASSADEUR_PAYS : commissions par source rôle (Recruteurs + Clients) */}
          {role === "AMBASSADEUR_PAYS" && commissions.by_source?.length > 0 && (
            <div>
              <p style={{ margin:"0 0 10px", fontSize:12, fontWeight:700, color:C.slate, textTransform:"uppercase", letterSpacing:.8 }}>
                Par source (Recruteurs et Clients)
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {commissions.by_source.map(s => {
                  const src = SOURCE_LABELS[s.source_role] || SOURCE_LABELS[s.type_source] || { label:s.source_role || s.type_source, icon:"💰", color:C.slate };
                  return (
                    <div key={s.source_role || s.type_source} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:C.bg, borderRadius:10 }}>
                      <span style={{ fontSize:18 }}>{src.icon}</span>
                      <div style={{ flex:1 }}>
                        <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.dark }}>{src.label}</p>
                        <p style={{ margin:"2px 0 0", fontSize:11, color:C.slate }}>{s.count} commission(s)</p>
                      </div>
                      <span style={{ fontWeight:800, fontSize:14, color:src.color }}>{fmt(s.total)} FCFA</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* RECRUTEUR : uniquement les dernières commissions directes sur ses Clients */}
          {role === "RECRUTEUR" && commissions.commissions?.length > 0 && (
            <div>
              <p style={{ margin:"0 0 10px", fontSize:12, fontWeight:700, color:C.slate, textTransform:"uppercase", letterSpacing:.8 }}>
                Dernières commissions sur vos clients
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {commissions.commissions.slice(0, 5).map(c => {
                  const statusColor = c.status==="PAID" ? C.green : c.status==="VALIDATED" ? C.blue : C.gold;
                  const statusLabel = c.status==="PAID" ? "Payé" : c.status==="VALIDATED" ? "Validé" : "En attente";
                  return (
                    <div key={c.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", background:C.bg, borderRadius:8 }}>
                      <div>
                        <p style={{ margin:0, fontSize:12, fontWeight:700, color:C.dark }}>{c.beneficiary_name || "—"}</p>
                        <p style={{ margin:0, fontSize:11, color:C.slate }}>{c.rate_pct}% · Direct</p>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <p style={{ margin:0, fontWeight:800, fontSize:13, color:C.green }}>{fmt(c.amount)} FCFA</p>
                        <span style={{ fontSize:10, fontWeight:700, color:statusColor }}>{statusLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!commissions.by_category?.length && !commissions.by_source?.length && !commissions.commissions?.length && (
            <div style={{ textAlign:"center", padding:"20px", color:C.slate, fontSize:13 }}>
              💰 Aucune commission pour l'instant
            </div>
          )}
        </div>
      )}

      {/* ── Résumé réseau ── */}
      {stats && (
        <div onClick={() => navigate("/diaspora/network")}
          style={{ background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, padding:"18px 20px", cursor:"pointer", transition:"box-shadow 0.15s", marginBottom:24 }}
          onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.08)"}
          onMouseLeave={e => e.currentTarget.style.boxShadow="none"}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <p style={{ margin:0, fontWeight:800, color:C.dark, fontSize:15 }}>🌐 Mon réseau</p>
            <span style={{ fontSize:12, color:C.blue, fontWeight:700 }}>Voir le détail →</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:10 }}>
            {[
              { label:"Total",      value:stats.network_size ?? stats.total_network ?? 0,        color:C.blue   },
              { label:"Directs",    value:stats.referrals    ?? stats.direct_recruits ?? 0,       color:C.green  },
              { label:"Actifs",     value:stats.clients?.active ?? stats.active_clients ?? 0,    color:C.teal   },
              { label:"En attente", value:stats.clients?.pending ?? stats.pending_clients ?? 0,  color:C.slate  },
            ].map(s => (
              <div key={s.label} style={{ textAlign:"center", padding:"10px 6px", background:C.bg, borderRadius:8 }}>
                <p style={{ margin:0, fontSize:20, fontWeight:900, color:s.color }}>{fmt(s.value)}</p>
                <p style={{ margin:"3px 0 0", fontSize:10, color:C.slate, fontWeight:600 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
